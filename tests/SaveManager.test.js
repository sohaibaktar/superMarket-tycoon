import { describe, it, expect, beforeEach } from 'vitest';
import { EconomySystem } from '../src/systems/EconomySystem.js';
import { InventorySystem } from '../src/systems/InventorySystem.js';
import { DayCycleSystem } from '../src/systems/DayCycleSystem.js';
import { MarketingSystem } from '../src/systems/MarketingSystem.js';
import { BankLoanSystem } from '../src/systems/BankLoanSystem.js';
import { ProgressionSystem } from '../src/systems/ProgressionSystem.js';
import { SaveManager } from '../src/persistence/SaveManager.js';

describe('SaveManager', () => {
    let economy, inventory, dayCycle, marketing, bank, progression;
    let mockStorage;
    let mockAdapter;
    let saveManager;

    beforeEach(() => {
        economy = new EconomySystem(250);
        inventory = new InventorySystem(economy);
        dayCycle = new DayCycleSystem();
        marketing = new MarketingSystem(economy, dayCycle);
        bank = new BankLoanSystem(economy, dayCycle);
        progression = new ProgressionSystem(economy, inventory);

        mockStorage = {};
        mockAdapter = {
            load: async () => mockStorage.data || null,
            save: async (data) => { mockStorage.data = data; return true; }
        };

        saveManager = new SaveManager({
            economy, inventory, dayCycle, marketing, bank, progression
        }, { primaryAdapter: mockAdapter });
    });

    it('generates a valid versioned schema payload with current system states', () => {
        economy.credit(150); // 400
        const payload = saveManager.createPayload();

        expect(payload.schemaVersion).toBe(1);
        expect(payload.economy.coins).toBe(400);
        expect(payload.inventory.stock.apples).toBe(5);
        expect(payload.dayCycle.currentDay).toBe(1);
    });

    it('saves state into adapter and restores state accurately into fresh systems', async () => {
        economy.credit(200); // 450
        inventory.consumeStock('apples', 2); // 3 left
        dayCycle.startNextDay(); // Day 2
        progression.purchaseUpgrade('cashier_speed'); // Level 1 (costs 150 -> 300 coins left)

        const saveSuccess = await saveManager.save();
        expect(saveSuccess).toBe(true);

        // Fresh systems
        const freshEconomy = new EconomySystem(250);
        const freshInventory = new InventorySystem(freshEconomy);
        const freshDayCycle = new DayCycleSystem();
        const freshMarketing = new MarketingSystem(freshEconomy, freshDayCycle);
        const freshBank = new BankLoanSystem(freshEconomy, freshDayCycle);
        const freshProgression = new ProgressionSystem(freshEconomy, freshInventory);

        const restoreManager = new SaveManager({
            economy: freshEconomy,
            inventory: freshInventory,
            dayCycle: freshDayCycle,
            marketing: freshMarketing,
            bank: freshBank,
            progression: freshProgression
        }, { primaryAdapter: mockAdapter });

        const loadSuccess = await restoreManager.load();
        expect(loadSuccess).toBe(true);

        expect(freshEconomy.coins).toBe(300);
        expect(freshInventory.getStock('apples')).toBe(3);
        expect(freshDayCycle.currentDay).toBe(2);
        expect(freshProgression.getUpgradeLevel('cashier_speed')).toBe(1);
    });

    it('rejects incompatible schema versions gracefully without crashing', async () => {
        mockStorage.data = { schemaVersion: 99, economy: { coins: 9999 } };
        const loadSuccess = await saveManager.load();
        expect(loadSuccess).toBe(false);
        expect(economy.coins).toBe(250); // Untouched
    });

    it('handles null / corrupt storage payloads safely', async () => {
        mockStorage.data = null;
        const loadSuccess = await saveManager.load();
        expect(loadSuccess).toBe(false);
    });
});
