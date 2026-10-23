/**
 * Customer model representing a shopper in the supermarket.
 * Pure data model with zero Phaser dependencies.
 */
export class Customer {
    /**
     * @param {object} params
     * @param {string} params.id
     * @param {string} [params.name]
     * @param {string[]} params.desiredProductIds
     * @param {number} [params.skinToneIndex=0]
     * @param {number} [params.shirtColorIndex=0]
     */
    constructor({ id, name = 'Shopper', desiredProductIds = [], skinToneIndex = 0, shirtColorIndex = 0 }) {
        this.id = id;
        this.name = name;
        /** @type {'entering' | 'shopping' | 'queueing' | 'paying' | 'leaving'} */
        this.state = 'entering';
        this.desiredProductIds = [...desiredProductIds];
        this.currentProductIndex = 0;
        /** @type {Array<{ productId: string; quantity: number; unitPrice: number }>} */
        this.basket = [];
        this.queueSpot = -1; // -1 means not queued
        this.isPaid = false;
        this.disappointedItems = [];
        this.skinToneIndex = skinToneIndex;
        this.shirtColorIndex = shirtColorIndex;
        this.createdAt = Date.now();
    }

    /**
     * Current product customer wants to browse.
     * @returns {string | null}
     */
    get currentTargetProductId() {
        if (this.currentProductIndex < this.desiredProductIds.length) {
            return this.desiredProductIds[this.currentProductIndex];
        }
        return null;
    }

    /**
     * Advance to next desired product in customer's shopping list.
     */
    advanceTarget() {
        this.currentProductIndex++;
    }

    /**
     * Whether customer has completed shopping for all desired products.
     * @returns {boolean}
     */
    get isShoppingDone() {
        return this.currentProductIndex >= this.desiredProductIds.length;
    }

    /**
     * Add an item to customer's basket.
     * @param {string} productId
     * @param {number} quantity
     * @param {number} unitPrice
     */
    addToBasket(productId, quantity, unitPrice) {
        if (quantity <= 0 || unitPrice < 0) return;
        const existing = this.basket.find(item => item.productId === productId);
        if (existing) {
            existing.quantity += quantity;
        } else {
            this.basket.push({ productId, quantity, unitPrice });
        }
    }

    /**
     * Total value of goods in basket.
     * @returns {number}
     */
    get basketTotal() {
        return this.basket.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    }

    /**
     * Total number of items in basket.
     * @returns {number}
     */
    get totalItemCount() {
        return this.basket.reduce((sum, item) => sum + item.quantity, 0);
    }
}
