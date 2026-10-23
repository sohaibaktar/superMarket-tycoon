import { UPGRADES, MILESTONES } from '../data/upgrades.js';
import { PRODUCTS } from '../data/products.js';

/**
 * ProgressionSystem: Manages store upgrades, automation throughput,
 * and milestone achievements.
 * Pure JavaScript with zero Phaser dependencies.
 */
export class ProgressionSystem {
    /**
     * @param {import('./EconomySystem.js').EconomySystem} economySystem
     * @param {import('./InventorySystem.js').InventorySystem} inventorySystem
     */
    constructor(economySystem, inventorySystem) {
        this._economy = economySystem;
        this._inventory = inventorySystem;

        /** @type {Record<string, number>} */
        this._upgradeLevels = {
            cashier_speed: 0,
            shelf_capacity: 0,
            department_license: 0
        };

        /** @type {Set<string>} */
        this._completedMilestones = new Set();
        this._totalRevenueTracked = 0;
        this._listeners = new Set();
    }

    getUpgradeLevel(upgradeId) {
        return this._upgradeLevels[upgradeId] ?? 0;
    }

    /**
     * Configuration for the next available tier of an upgrade.
     * @param {string} upgradeId
     * @returns {object | null}
     */
    getNextLevelConfig(upgradeId) {
        const upgrade = UPGRADES[upgradeId];
        if (!upgrade) return null;

        const currentLvl = this.getUpgradeLevel(upgradeId);
        if (currentLvl >= upgrade.maxLevel) return null;

        return upgrade.levels[currentLvl];
    }

    /**
     * Scan delay for checkout throughput based on cashier speed level.
     * @returns {number} Milliseconds
     */
    getCheckoutDelayMs() {
        const lvl = this.getUpgradeLevel('cashier_speed');
        if (lvl <= 0) return 900;
        const config = UPGRADES.cashier_speed.levels[lvl - 1];
        return config ? config.delayMs : 900;
    }

    /**
     * Check if Jasmine Rice department is unlocked.
     * @returns {boolean}
     */
    get isRiceDepartmentUnlocked() {
        return this.getUpgradeLevel('department_license') >= 1;
    }

    /**
     * Purchase the next level of an upgrade.
     * @param {string} upgradeId
     * @returns {{ success: boolean; newLevel: number; cost: number; reason?: string }}
     */
    purchaseUpgrade(upgradeId) {
        const nextConfig = this.getNextLevelConfig(upgradeId);
        if (!nextConfig) {
            return { success: false, newLevel: this.getUpgradeLevel(upgradeId), cost: 0, reason: 'max_level' };
        }

        if (!this._economy.canAfford(nextConfig.cost)) {
            return { success: false, newLevel: this.getUpgradeLevel(upgradeId), cost: nextConfig.cost, reason: 'insufficient_funds' };
        }

        const debitSuccess = this._economy.debit(nextConfig.cost, `upgrade_${upgradeId}_lvl${nextConfig.level}`);
        if (!debitSuccess) {
            return { success: false, newLevel: this.getUpgradeLevel(upgradeId), cost: nextConfig.cost, reason: 'debit_failed' };
        }

        this._upgradeLevels[upgradeId] = nextConfig.level;

        // Apply immediate side-effects
        if (upgradeId === 'shelf_capacity' && nextConfig.extraCap) {
            for (const [prodId, prod] of Object.entries(PRODUCTS)) {
                this._inventory.setCapacity(prodId, prod.maxShelfStock + nextConfig.extraCap);
            }
        }

        this._notifyListeners({
            type: 'upgrade_purchased',
            upgradeId,
            level: nextConfig.level,
            cost: nextConfig.cost,
            name: nextConfig.name
        });

        return { success: true, newLevel: nextConfig.level, cost: nextConfig.cost };
    }

    /**
     * Current active milestone objective.
     * @returns {object | null}
     */
    get currentMilestone() {
        return MILESTONES.find(m => !this._completedMilestones.has(m.id)) ?? null;
    }

    /**
     * Track cumulative revenue and evaluate milestone triggers.
     * @param {number} revenueAmount
     */
    recordRevenue(revenueAmount) {
        if (!Number.isFinite(revenueAmount) || revenueAmount <= 0) return;
        this._totalRevenueTracked += Math.floor(revenueAmount);

        const current = this.currentMilestone;
        if (current && this._totalRevenueTracked >= current.targetRevenue) {
            this._completedMilestones.add(current.id);
            this._economy.credit(current.rewardCoins, `milestone_reward_${current.id}`);

            this._notifyListeners({
                type: 'milestone_unlocked',
                milestone: current,
                reward: current.rewardCoins
            });
        }
    }

    /**
     * Subscribe to progression events.
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
                console.error('Error in ProgressionSystem listener:', err);
            }
        }
    }

    toJSON() {
        return {
            upgradeLevels: { ...this._upgradeLevels },
            completedMilestones: Array.from(this._completedMilestones),
            totalRevenueTracked: this._totalRevenueTracked
        };
    }

    restore(data) {
        if (!data) return;
        if (data.upgradeLevels && typeof data.upgradeLevels === 'object') {
            for (const [id, lvl] of Object.entries(data.upgradeLevels)) {
                if (UPGRADES[id] && Number.isFinite(lvl)) {
                    this._upgradeLevels[id] = Math.min(Math.floor(lvl), UPGRADES[id].maxLevel);
                }
            }
        }
        if (Array.isArray(data.completedMilestones)) {
            this._completedMilestones = new Set(data.completedMilestones);
        }
        if (Number.isFinite(data.totalRevenueTracked)) {
            this._totalRevenueTracked = data.totalRevenueTracked;
        }

        // Re-apply shelf capacities
        const shelfLvl = this.getUpgradeLevel('shelf_capacity');
        if (shelfLvl > 0) {
            const config = UPGRADES.shelf_capacity.levels[shelfLvl - 1];
            if (config && config.extraCap) {
                for (const [prodId, prod] of Object.entries(PRODUCTS)) {
                    this._inventory.setCapacity(prodId, prod.maxShelfStock + config.extraCap);
                }
            }
        }
    }
}
