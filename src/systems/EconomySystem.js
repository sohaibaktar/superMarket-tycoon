/**
 * EconomySystem: Manages currency (coins) transactions.
 * Pure JavaScript with zero Phaser dependencies for seamless unit testing.
 * Strictly enforces non-negative bounds and atomic updates.
 */
export class EconomySystem {
    /**
     * @param {number} initialCoins
     */
    constructor(initialCoins = 500) {
        if (!Number.isFinite(initialCoins) || initialCoins < 0) {
            throw new Error(`Invalid initial coins: ${initialCoins}`);
        }
        this._coins = Math.floor(initialCoins);
        this._totalEarned = 0;
        this._totalSpent = 0;
        this._listeners = new Set();
    }

    /**
     * Current coin balance.
     * @returns {number}
     */
    get coins() {
        return this._coins;
    }

    /**
     * Total lifetime coins earned.
     * @returns {number}
     */
    get totalEarned() {
        return this._totalEarned;
    }

    /**
     * Total lifetime coins spent.
     * @returns {number}
     */
    get totalSpent() {
        return this._totalSpent;
    }

    /**
     * Check if player can afford an amount.
     * @param {number} amount
     * @returns {boolean}
     */
    canAfford(amount) {
        if (!Number.isFinite(amount) || amount <= 0) {
            return false;
        }
        return this._coins >= amount;
    }

    /**
     * Spend coins atomically.
     * @param {number} amount
     * @param {string} [reason]
     * @returns {boolean} True if successful, false otherwise.
     */
    debit(amount, reason = 'expense') {
        if (!Number.isFinite(amount) || amount <= 0) {
            return false;
        }
        const floored = Math.floor(amount);
        if (this._coins < floored) {
            return false;
        }
        this._coins -= floored;
        this._totalSpent += floored;
        this._notifyListeners({ type: 'debit', amount: floored, coins: this._coins, reason });
        return true;
    }

    /**
     * Add revenue or reward coins atomically.
     * @param {number} amount
     * @param {string} [reason]
     * @returns {boolean} True if successful, false otherwise.
     */
    credit(amount, reason = 'revenue') {
        if (!Number.isFinite(amount) || amount <= 0) {
            return false;
        }
        const floored = Math.floor(amount);
        this._coins += floored;
        this._totalEarned += floored;
        this._notifyListeners({ type: 'credit', amount: floored, coins: this._coins, reason });
        return true;
    }

    /**
     * Subscribe to balance changes.
     * @param {Function} callback (event: { type, amount, coins, reason }) => void
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
                console.error('Error in EconomySystem listener:', err);
            }
        }
    }

    /**
     * Serialize state for persistence.
     */
    toJSON() {
        return {
            coins: this._coins,
            totalEarned: this._totalEarned,
            totalSpent: this._totalSpent
        };
    }

    /**
     * Restore state from validated payload.
     * @param {object} data
     */
    restore(data) {
        if (data && Number.isFinite(data.coins) && data.coins >= 0) {
            this._coins = Math.floor(data.coins);
            this._totalEarned = Number.isFinite(data.totalEarned) ? Math.floor(data.totalEarned) : 0;
            this._totalSpent = Number.isFinite(data.totalSpent) ? Math.floor(data.totalSpent) : 0;
            this._notifyListeners({ type: 'restore', amount: 0, coins: this._coins, reason: 'restore' });
        }
    }
}
