import { describe, it, expect, beforeEach } from 'vitest';
import { EconomySystem } from '../src/systems/EconomySystem.js';

describe('EconomySystem', () => {
    let economy;

    beforeEach(() => {
        economy = new EconomySystem(500);
    });

    it('initializes with given balance', () => {
        expect(economy.coins).toBe(500);
        expect(economy.totalEarned).toBe(0);
        expect(economy.totalSpent).toBe(0);
    });

    it('rejects invalid initial balance', () => {
        expect(() => new EconomySystem(-100)).toThrow();
        expect(() => new EconomySystem(NaN)).toThrow();
        expect(() => new EconomySystem(Infinity)).toThrow();
    });

    it('correctly evaluates affordability', () => {
        expect(economy.canAfford(200)).toBe(true);
        expect(economy.canAfford(500)).toBe(true);
        expect(economy.canAfford(501)).toBe(false);
        expect(economy.canAfford(-50)).toBe(false);
        expect(economy.canAfford(0)).toBe(false);
        expect(economy.canAfford(NaN)).toBe(false);
    });

    it('debits coins atomically and updates lifetime stats', () => {
        const success = economy.debit(150, 'restock');
        expect(success).toBe(true);
        expect(economy.coins).toBe(350);
        expect(economy.totalSpent).toBe(150);
    });

    it('rejects overdraft debit attempts without mutating balance', () => {
        const success = economy.debit(600, 'expensive_purchase');
        expect(success).toBe(false);
        expect(economy.coins).toBe(500);
        expect(economy.totalSpent).toBe(0);
    });

    it('credits revenue atomically and updates lifetime stats', () => {
        const success = economy.credit(80, 'sale');
        expect(success).toBe(true);
        expect(economy.coins).toBe(580);
        expect(economy.totalEarned).toBe(80);
    });

    it('rejects non-positive credit and debit amounts', () => {
        expect(economy.credit(0)).toBe(false);
        expect(economy.credit(-20)).toBe(false);
        expect(economy.credit(NaN)).toBe(false);
        expect(economy.debit(0)).toBe(false);
        expect(economy.debit(-20)).toBe(false);
        expect(economy.debit(NaN)).toBe(false);
        expect(economy.coins).toBe(500);
    });

    it('notifies listeners on transactions', () => {
        const events = [];
        const unsubscribe = economy.subscribe(e => events.push(e));

        economy.credit(50, 'customer_sale');
        economy.debit(20, 'restock');

        expect(events).toHaveLength(2);
        expect(events[0]).toMatchObject({ type: 'credit', amount: 50, coins: 550 });
        expect(events[1]).toMatchObject({ type: 'debit', amount: 20, coins: 530 });

        unsubscribe();
        economy.credit(10);
        expect(events).toHaveLength(2);
    });

    it('serializes and restores state safely', () => {
        economy.debit(100);
        economy.credit(200);

        const saved = economy.toJSON();
        const fresh = new EconomySystem(100);
        fresh.restore(saved);

        expect(fresh.coins).toBe(600);
        expect(fresh.totalEarned).toBe(200);
        expect(fresh.totalSpent).toBe(100);
    });
});
