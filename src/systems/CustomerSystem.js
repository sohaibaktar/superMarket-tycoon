import { Customer } from '../models/Customer.js';
import { PRODUCTS } from '../data/products.js';

/**
 * CustomerSystem: Manages customer generation, AI shopping decisions,
 * checkout queue management, and state machine lifecycle.
 * Pure JavaScript with zero Phaser dependencies.
 */
export class CustomerSystem {
    /**
     * @param {import('./InventorySystem.js').InventorySystem} inventorySystem
     * @param {import('./CheckoutSystem.js').CheckoutSystem} checkoutSystem
     * @param {object} [config]
     * @param {number} [config.maxConcurrentCustomers=6]
     * @param {number} [config.maxQueueCapacity=4]
     */
    constructor(inventorySystem, checkoutSystem, config = {}) {
        this._inventory = inventorySystem;
        this._checkout = checkoutSystem;

        this._maxConcurrent = config.maxConcurrentCustomers ?? 6;
        this._maxQueue = config.maxQueueCapacity ?? 4;

        /** @type {Map<string, Customer>} */
        this._activeCustomers = new Map();

        /** @type {Array<Customer | null>} */
        this._queue = new Array(this._maxQueue).fill(null);

        this._customerIdCounter = 1;
        this._listeners = new Set();
        this._progression = null;
    }

    /**
     * Optional progression reference to evaluate unlocked department permits.
     * @param {import('./ProgressionSystem.js').ProgressionSystem} progressionSystem
     */
    setProgressionSystem(progressionSystem) {
        this._progression = progressionSystem;
    }

    get activeCount() {
        return this._activeCustomers.size;
    }

    get queueCount() {
        return this._queue.filter(c => c !== null).length;
    }

    get isQueueFull() {
        return this.queueCount >= this._maxQueue;
    }

    /**
     * Attempt to spawn a new customer.
     * @returns {Customer | null} Returns customer if spawned, null if capacity reached.
     */
    spawnCustomer() {
        if (this._activeCustomers.size >= this._maxConcurrent) {
            return null;
        }

        // Filter available products based on unlocked department permits
        let availableProductIds = Object.keys(PRODUCTS);
        if (this._progression && !this._progression.isRiceDepartmentUnlocked) {
            availableProductIds = availableProductIds.filter(id => id !== 'rice');
        }

        // Shuffle & pick 1 or 2
        const shuffled = [...availableProductIds].sort(() => 0.5 - Math.random());
        const desiredCount = Math.random() > 0.4 ? 2 : 1;
        const desiredProductIds = shuffled.slice(0, desiredCount);

        const id = `cust_${this._customerIdCounter++}`;
        const customer = new Customer({
            id,
            name: `Shopper #${id.split('_')[1]}`,
            desiredProductIds,
            skinToneIndex: Math.floor(Math.random() * 4),
            shirtColorIndex: Math.floor(Math.random() * 5)
        });

        this._activeCustomers.set(id, customer);
        this._notifyListeners({ type: 'customer_spawned', customer });
        return customer;
    }

    /**
     * Customer arrives at a shelf and attempts to take the item into basket.
     * @param {string} customerId
     * @param {string} productId
     * @returns {{ success: boolean; reason?: string }}
     */
    tryTakeItem(customerId, productId) {
        const customer = this._activeCustomers.get(customerId);
        if (!customer) return { success: false, reason: 'customer_not_found' };

        const product = PRODUCTS[productId];
        if (!product) return { success: false, reason: 'unknown_product' };

        // Attempt to consume 1 unit from inventory directly into customer's basket
        const hasStock = this._inventory.consumeStock(productId, 1);

        if (hasStock) {
            customer.addToBasket(productId, 1, product.sellPrice);
            this._notifyListeners({
                type: 'item_picked',
                customer,
                productId,
                basketTotal: customer.basketTotal
            });
            return { success: true };
        } else {
            customer.disappointedItems.push(productId);
            this._notifyListeners({
                type: 'item_out_of_stock',
                customer,
                productId
            });
            return { success: false, reason: 'out_of_stock' };
        }
    }

    /**
     * Customer requests to join the checkout queue.
     * @param {string} customerId
     * @returns {{ success: boolean; spotIndex: number }}
     */
    joinQueue(customerId) {
        const customer = this._activeCustomers.get(customerId);
        if (!customer) return { success: false, spotIndex: -1 };

        // Find first empty slot in queue
        const spotIndex = this._queue.findIndex(slot => slot === null);
        if (spotIndex === -1) {
            // Queue is full, customer cannot wait
            return { success: false, spotIndex: -1 };
        }

        this._queue[spotIndex] = customer;
        customer.state = 'queueing';
        customer.queueSpot = spotIndex;

        this._notifyListeners({
            type: 'customer_queued',
            customer,
            spotIndex
        });

        return { success: true, spotIndex };
    }

    /**
     * Cashier processes front of the queue (spot 0).
     * @returns {{ success: boolean; total: number; customer?: Customer; reason?: string }}
     */
    serveFrontOfQueue() {
        const frontCustomer = this._queue[0];
        if (!frontCustomer) {
            return { success: false, total: 0, reason: 'no_customer_at_front' };
        }

        frontCustomer.state = 'paying';

        // Process transaction via CheckoutSystem
        const result = this._checkout.processTransaction(frontCustomer);

        if (result.success) {
            // Vacate spot 0
            this._queue[0] = null;
            frontCustomer.queueSpot = -1;
            frontCustomer.state = 'leaving';

            // Shift queue forward
            this.shiftQueueForward();

            this._notifyListeners({
                type: 'customer_served',
                customer: frontCustomer,
                total: result.total
            });

            return { success: true, total: result.total, customer: frontCustomer };
        }

        return { success: false, total: 0, reason: result.reason };
    }

    /**
     * Shift remaining queued customers forward when front spot clears.
     */
    shiftQueueForward() {
        for (let i = 0; i < this._maxQueue - 1; i++) {
            if (this._queue[i] === null && this._queue[i + 1] !== null) {
                this._queue[i] = this._queue[i + 1];
                this._queue[i + 1] = null;
                if (this._queue[i]) {
                    this._queue[i].queueSpot = i;
                }
            }
        }

        this._notifyListeners({
            type: 'queue_shifted',
            queue: [...this._queue]
        });
    }

    /**
     * Get customer at a specific queue slot.
     * @param {number} spotIndex
     * @returns {Customer | null}
     */
    getCustomerAtQueueSpot(spotIndex) {
        return this._queue[spotIndex] ?? null;
    }

    /**
     * Customer has completed their path and exited the store. Safely removes them.
     * @param {string} customerId
     */
    removeCustomer(customerId) {
        const customer = this._activeCustomers.get(customerId);
        if (customer) {
            // Remove from queue if present
            const qIndex = this._queue.indexOf(customer);
            if (qIndex !== -1) {
                this._queue[qIndex] = null;
                this.shiftQueueForward();
            }

            this._activeCustomers.delete(customerId);
            this._notifyListeners({ type: 'customer_removed', customerId });
        }
    }

    /**
     * Subscribe to customer events.
     * @param {Function} callback (event: object) => void
     * @returns {Function} Unsubscribe function
     */
    subscribe(callback) {
        this._listeners.add(callback);
        return () => this._listeners.delete(callback);
    }

    _notifyListeners(event) {
        for (const listener of this._listeners) {
            try {
                listener(event);
            } catch (err) {
                console.error('Error in CustomerSystem listener:', err);
            }
        }
    }

    /**
     * Reset / clear all customers (e.g. for level restart).
     */
    reset() {
        this._activeCustomers.clear();
        this._queue.fill(null);
    }
}
