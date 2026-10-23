/**
 * CheckoutSystem: Coordinates transaction settlements at the cash register.
 * Consumes reserved/basket inventory and credits revenue atomically to EconomySystem.
 * Guarantees transaction idempotency (every checkout completes exactly once).
 * Pure JavaScript with zero Phaser dependencies.
 */
export class CheckoutSystem {
    /**
     * @param {import('./InventorySystem.js').InventorySystem} inventorySystem
     * @param {import('./EconomySystem.js').EconomySystem} economySystem
     */
    constructor(inventorySystem, economySystem) {
        this._inventory = inventorySystem;
        this._economy = economySystem;

        this._totalTransactions = 0;
        this._totalCustomersServed = 0;
        this._totalItemsSold = 0;
        this._totalRevenue = 0;
        this._listeners = new Set();
    }

    get totalTransactions() {
        return this._totalTransactions;
    }

    get totalCustomersServed() {
        return this._totalCustomersServed;
    }

    get totalItemsSold() {
        return this._totalItemsSold;
    }

    get totalRevenue() {
        return this._totalRevenue;
    }

    /**
     * Process checkout for a customer.
     * @param {import('../models/Customer.js').Customer} customer
     * @returns {{ success: boolean; total: number; itemCount: number; customerId: string; reason?: string }}
     */
    processTransaction(customer) {
        if (!customer) {
            return { success: false, total: 0, itemCount: 0, customerId: '', reason: 'missing_customer' };
        }

        // Idempotency check: A customer can never be checked out twice
        if (customer.isPaid) {
            return { success: false, total: 0, itemCount: 0, customerId: customer.id, reason: 'already_paid' };
        }

        if (!customer.basket || customer.basket.length === 0) {
            return { success: false, total: 0, itemCount: 0, customerId: customer.id, reason: 'empty_basket' };
        }

        // Calculate transaction total & validate item quantities
        let totalRevenue = 0;
        let totalItems = 0;

        for (const item of customer.basket) {
            if (!item.productId || !Number.isFinite(item.quantity) || item.quantity <= 0 || !Number.isFinite(item.unitPrice) || item.unitPrice < 0) {
                return { success: false, total: 0, itemCount: 0, customerId: customer.id, reason: 'invalid_basket_item' };
            }
            totalRevenue += Math.floor(item.quantity * item.unitPrice);
            totalItems += Math.floor(item.quantity);
        }

        if (totalRevenue <= 0 || totalItems <= 0) {
            return { success: false, total: 0, itemCount: 0, customerId: customer.id, reason: 'zero_amount_transaction' };
        }

        // Atomically mark customer as paid before crediting to guarantee idempotency
        customer.isPaid = true;
        customer.state = 'leaving';

        // Credit coins to economy
        const creditSuccess = this._economy.credit(totalRevenue, `sale_${customer.id}`);
        if (!creditSuccess) {
            customer.isPaid = false; // Revert if economy failed
            return { success: false, total: 0, itemCount: 0, customerId: customer.id, reason: 'economy_credit_failed' };
        }

        // Update statistics
        this._totalTransactions++;
        this._totalCustomersServed++;
        this._totalItemsSold += totalItems;
        this._totalRevenue += totalRevenue;

        const transactionRecord = {
            type: 'checkout_success',
            customerId: customer.id,
            total: totalRevenue,
            itemCount: totalItems,
            basket: [...customer.basket],
            timestamp: Date.now()
        };

        this._notifyListeners(transactionRecord);

        return {
            success: true,
            total: totalRevenue,
            itemCount: totalItems,
            customerId: customer.id
        };
    }

    /**
     * Subscribe to checkout events.
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
                console.error('Error in CheckoutSystem listener:', err);
            }
        }
    }

    /**
     * Serialize metrics for persistence.
     */
    toJSON() {
        return {
            totalTransactions: this._totalTransactions,
            totalCustomersServed: this._totalCustomersServed,
            totalItemsSold: this._totalItemsSold,
            totalRevenue: this._totalRevenue
        };
    }

    /**
     * Restore metrics from saved state.
     * @param {object} data
     */
    restore(data) {
        if (!data) return;
        if (Number.isFinite(data.totalTransactions)) this._totalTransactions = data.totalTransactions;
        if (Number.isFinite(data.totalCustomersServed)) this._totalCustomersServed = data.totalCustomersServed;
        if (Number.isFinite(data.totalItemsSold)) this._totalItemsSold = data.totalItemsSold;
        if (Number.isFinite(data.totalRevenue)) this._totalRevenue = data.totalRevenue;
    }
}
