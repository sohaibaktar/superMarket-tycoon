import { PRODUCTS } from '../data/products.js';

/**
 * InventorySystem: Manages product shelf stock, capacities, and restocking.
 * Pure JavaScript with zero Phaser dependencies for seamless unit testing.
 */
export class InventorySystem {
    /**
     * @param {import('./EconomySystem.js').EconomySystem} economySystem
     * @param {Record<string, number>} [initialStock]
     */
    constructor(economySystem, initialStock = {}) {
        this._economy = economySystem;
        this._stock = {};
        this._capacities = {};
        this._listeners = new Set();

        // Initialize products from product definitions
        for (const [id, def] of Object.entries(PRODUCTS)) {
            this._capacities[id] = def.maxShelfStock;
            const startQty = initialStock[id] !== undefined ? initialStock[id] : def.startingStock;
            this._stock[id] = Math.min(Math.max(0, Math.floor(startQty)), def.maxShelfStock);
        }
    }

    /**
     * Get stock for a given product ID.
     * @param {string} productId
     * @returns {number}
     */
    getStock(productId) {
        return this._stock[productId] ?? 0;
    }

    /**
     * Get capacity for a given product ID.
     * @param {string} productId
     * @returns {number}
     */
    getCapacity(productId) {
        return this._capacities[productId] ?? 0;
    }

    /**
     * Get all stock entries.
     * @returns {Record<string, number>}
     */
    getAllStock() {
        return { ...this._stock };
    }

    /**
     * Check if shelf can accept more units.
     * @param {string} productId
     * @param {number} [quantity=1]
     * @returns {boolean}
     */
    hasCapacity(productId, quantity = 1) {
        const current = this.getStock(productId);
        const capacity = this.getCapacity(productId);
        return (current + quantity) <= capacity;
    }

    /**
     * Restock a product by a given quantity (default: 1 unit or 5 units).
     * Atomically debits economy and credits stock.
     * @param {string} productId
     * @param {number} [quantity=5]
     * @returns {{ success: boolean; added: number; cost: number; reason?: string }}
     */
    restock(productId, quantity = 5) {
        const product = PRODUCTS[productId];
        if (!product) {
            return { success: false, added: 0, cost: 0, reason: 'invalid_product' };
        }
        if (!Number.isFinite(quantity) || quantity <= 0) {
            return { success: false, added: 0, cost: 0, reason: 'invalid_quantity' };
        }

        const currentStock = this.getStock(productId);
        const capacity = this.getCapacity(productId);
        const spaceAvailable = capacity - currentStock;

        if (spaceAvailable <= 0) {
            return { success: false, added: 0, cost: 0, reason: 'shelf_full' };
        }

        // Clamp quantity to available space
        const actualQty = Math.min(Math.floor(quantity), spaceAvailable);
        const totalCost = actualQty * product.restockCost;

        if (!this._economy.canAfford(totalCost)) {
            return { success: false, added: 0, cost: totalCost, reason: 'insufficient_funds' };
        }

        // Atomically debit economy and increment stock
        const debitSuccess = this._economy.debit(totalCost, `restock_${productId}`);
        if (!debitSuccess) {
            return { success: false, added: 0, cost: totalCost, reason: 'debit_failed' };
        }

        this._stock[productId] += actualQty;
        this._notifyListeners({
            type: 'restock',
            productId,
            quantity: actualQty,
            newStock: this._stock[productId],
            cost: totalCost
        });

        return { success: true, added: actualQty, cost: totalCost };
    }

    /**
     * Consume stock for sale (invoked during customer checkout).
     * @param {string} productId
     * @param {number} [quantity=1]
     * @returns {boolean}
     */
    consumeStock(productId, quantity = 1) {
        if (!PRODUCTS[productId]) return false;
        if (!Number.isFinite(quantity) || quantity <= 0) return false;

        const flooredQty = Math.floor(quantity);
        const current = this.getStock(productId);

        if (current < flooredQty) {
            return false;
        }

        this._stock[productId] -= flooredQty;
        this._notifyListeners({
            type: 'consume',
            productId,
            quantity: flooredQty,
            newStock: this._stock[productId]
        });

        return true;
    }

    /**
     * Set / upgrade shelf capacity.
     * @param {string} productId
     * @param {number} newCapacity
     */
    setCapacity(productId, newCapacity) {
        if (PRODUCTS[productId] && Number.isFinite(newCapacity) && newCapacity > 0) {
            this._capacities[productId] = Math.floor(newCapacity);
            this._notifyListeners({
                type: 'capacity_change',
                productId,
                newCapacity: this._capacities[productId]
            });
        }
    }

    /**
     * Subscribe to inventory changes.
     * @param {Function} callback
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
                console.error('Error in InventorySystem listener:', err);
            }
        }
    }

    /**
     * Serialize state for persistence.
     */
    toJSON() {
        return {
            stock: { ...this._stock },
            capacities: { ...this._capacities }
        };
    }

    /**
     * Restore stock and capacity from validated save data.
     * @param {object} data
     */
    restore(data) {
        if (!data) return;
        if (data.capacities && typeof data.capacities === 'object') {
            for (const [id, cap] of Object.entries(data.capacities)) {
                if (PRODUCTS[id] && Number.isFinite(cap) && cap > 0) {
                    this._capacities[id] = Math.floor(cap);
                }
            }
        }
        if (data.stock && typeof data.stock === 'object') {
            for (const [id, qty] of Object.entries(data.stock)) {
                if (PRODUCTS[id] && Number.isFinite(qty) && qty >= 0) {
                    const cap = this.getCapacity(id);
                    this._stock[id] = Math.min(Math.floor(qty), cap);
                }
            }
        }
        this._notifyListeners({ type: 'restore', stock: { ...this._stock } });
    }
}
