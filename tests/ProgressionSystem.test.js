import { describe, it, expect, beforeEach } from 'vitest';
import { EconomySystem } from '../src/systems/EconomySystem.js';
import { InventorySystem } from '../src/systems/InventorySystem.js';
import { ProgressionSystem } from '../src/systems/ProgressionSystem.js';

describe('ProgressionSystem', () => {
    let economy;
    let inventory;
    let progression;

    beforeEach(() => {
        economy = new EconomySystem(1000);
        inventory = new InventorySystem(economy);
        progression = new ProgressionSystem(economy, inventory);
    });

    it('initializes with level 0 across all upgrades', () => {
        expect(progression.getUpgradeLevel('cashier_speed')).toBe(0);
        expect(progression.getUpgradeLevel('shelf_capacity')).toBe(0);
        expect(progression.getCheckoutDelayMs()).toBe(900);
        expect(progression.isRiceDepartmentUnlocked).toBe(false);
    });

    it('purchases cashier speed upgrade and accelerates scan throughput', () => {
        const next = progression.getNextLevelConfig('cashier_speed');
        expect(next.level).toBe(1);
        expect(next.cost).toBe(150);

        const res = progression.purchaseUpgrade('cashier_speed');
        expect(res.success).toBe(true);
        expect(res.newLevel).toBe(1);
        expect(economy.coins).toBe(850); // 1000 - 150
        expect(progression.getCheckoutDelayMs()).toBe(500); // Accelerated from 900ms to 500ms
    });

    it('purchases shelf capacity upgrade and expands product capacities in InventorySystem', () => {
        expect(inventory.getCapacity('apples')).toBe(20);

        const res = progression.purchaseUpgrade('shelf_capacity'); // Level 1 adds +5
        expect(res.success).toBe(true);
        expect(inventory.getCapacity('apples')).toBe(25);
    });

    it('prevents purchase when player cannot afford cost', () => {
        const brokeEconomy = new EconomySystem(50);
        const brokeProgression = new ProgressionSystem(brokeEconomy, inventory);

        const res = brokeProgression.purchaseUpgrade('cashier_speed'); // Costs 150
        expect(res.success).toBe(false);
        expect(res.reason).toBe('insufficient_funds');
        expect(brokeProgression.getUpgradeLevel('cashier_speed')).toBe(0);
    });

    it('unlocks milestone and awards bonus coins when revenue threshold is met', () => {
        expect(progression.currentMilestone.id).toBe('m1_mini_mart');
        expect(progression.currentMilestone.targetRevenue).toBe(2000);

        progression.recordRevenue(2050);

        // Milestone 1 completed (+300 coins reward)
        expect(economy.coins).toBe(1300); // 1000 + 300
        expect(progression.currentMilestone.id).toBe('m2_supermarket');
    });

    it('purchases hire_cashier upgrade and sets isCashierHired to true', () => {
        expect(progression.isCashierHired).toBe(false);
        const res = progression.purchaseUpgrade('hire_cashier'); // Costs 100
        expect(res.success).toBe(true);
        expect(res.newLevel).toBe(1);
        expect(progression.isCashierHired).toBe(true);
        expect(economy.coins).toBe(900); // 1000 - 100
    });
});
