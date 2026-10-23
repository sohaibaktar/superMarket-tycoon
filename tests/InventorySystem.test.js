import { describe, it, expect, beforeEach } from 'vitest';
import { EconomySystem } from '../src/systems/EconomySystem.js';
import { InventorySystem } from '../src/systems/InventorySystem.js';
import { PRODUCTS } from '../src/data/products.js';

describe('InventorySystem', () => {
    let economy;
    let inventory;

    beforeEach(() => {
        economy = new EconomySystem(500);
        inventory = new InventorySystem(economy);
    });

    it('initializes products with default starting stock and shelf capacities', () => {
        expect(inventory.getStock('apples')).toBe(5);
        expect(inventory.getCapacity('apples')).toBe(20);
        expect(inventory.getStock('milk')).toBe(5);
        expect(inventory.getCapacity('milk')).toBe(15);
    });

    it('restocks products, deducting from economy and adding to shelf stock', () => {
        // Apples restockCost = 5. Restocking 5 units costs 25 coins.
        const res = inventory.restock('apples', 5);
        expect(res.success).toBe(true);
        expect(res.added).toBe(5);
        expect(res.cost).toBe(25);
        expect(inventory.getStock('apples')).toBe(10);
        expect(economy.coins).toBe(475);
    });

    it('clamps restock to remaining shelf capacity', () => {
        // Apples start at 5, max capacity is 20. Room left = 15.
        // Trying to restock 20 units should clamp to 15.
        const res = inventory.restock('apples', 20);
        expect(res.success).toBe(true);
        expect(res.added).toBe(15);
        expect(res.cost).toBe(15 * 5); // 75 coins
        expect(inventory.getStock('apples')).toBe(20);
        expect(inventory.hasCapacity('apples', 1)).toBe(false);
    });

    it('rejects restocking when shelf is completely full', () => {
        inventory.restock('apples', 15); // fill to 20
        const res = inventory.restock('apples', 5);
        expect(res.success).toBe(false);
        expect(res.reason).toBe('shelf_full');
    });

    it('rejects restocking when player has insufficient coins', () => {
        const poorEconomy = new EconomySystem(10);
        const poorInventory = new InventorySystem(poorEconomy);
        // Milk restockCost is 8. 5 units = 40 coins > 10
        const res = poorInventory.restock('milk', 5);
        expect(res.success).toBe(false);
        expect(res.reason).toBe('insufficient_funds');
        expect(poorInventory.getStock('milk')).toBe(5);
        expect(poorEconomy.coins).toBe(10);
    });

    it('consumes stock during customer checkout', () => {
        const success = inventory.consumeStock('bread', 2);
        expect(success).toBe(true);
        expect(inventory.getStock('bread')).toBe(3); // 5 - 2
    });

    it('rejects consuming stock when quantity exceeds available stock', () => {
        const success = inventory.consumeStock('bread', 10);
        expect(success).toBe(false);
        expect(inventory.getStock('bread')).toBe(5); // unchanged
    });

    it('supports upgrading shelf capacity', () => {
        inventory.setCapacity('apples', 30);
        expect(inventory.getCapacity('apples')).toBe(30);
        expect(inventory.hasCapacity('apples', 20)).toBe(true);
    });

    it('serializes and restores stock correctly', () => {
        inventory.restock('apples', 5);
        inventory.consumeStock('milk', 2);

        const saved = inventory.toJSON();
        const fresh = new InventorySystem(new EconomySystem(500));
        fresh.restore(saved);

        expect(fresh.getStock('apples')).toBe(10);
        expect(fresh.getStock('milk')).toBe(3);
    });
});
