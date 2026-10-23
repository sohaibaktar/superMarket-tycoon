import { describe, it, expect, beforeEach } from 'vitest';
import { EconomySystem } from '../src/systems/EconomySystem.js';
import { InventorySystem } from '../src/systems/InventorySystem.js';
import { CheckoutSystem } from '../src/systems/CheckoutSystem.js';
import { Customer } from '../src/models/Customer.js';

describe('CheckoutSystem', () => {
    let economy;
    let inventory;
    let checkout;

    beforeEach(() => {
        economy = new EconomySystem(250);
        inventory = new InventorySystem(economy);
        checkout = new CheckoutSystem(inventory, economy);
    });

    it('processes a valid customer basket and credits economy', () => {
        const customer = new Customer({ id: 'c1', desiredProductIds: ['apples', 'bread'] });
        customer.addToBasket('apples', 2, 10); // 20
        customer.addToBasket('bread', 1, 12);  // 12 -> Total 32

        const result = checkout.processTransaction(customer);

        expect(result.success).toBe(true);
        expect(result.total).toBe(32);
        expect(result.itemCount).toBe(3);
        expect(customer.isPaid).toBe(true);
        expect(economy.coins).toBe(282); // 250 + 32
        expect(checkout.totalCustomersServed).toBe(1);
        expect(checkout.totalItemsSold).toBe(3);
        expect(checkout.totalRevenue).toBe(32);
    });

    it('strictly prevents duplicate checkout (idempotency guard)', () => {
        const customer = new Customer({ id: 'c2', desiredProductIds: ['milk'] });
        customer.addToBasket('milk', 1, 15);

        const firstResult = checkout.processTransaction(customer);
        expect(firstResult.success).toBe(true);
        expect(economy.coins).toBe(265);

        // Attempt second checkout on already paid customer
        const secondResult = checkout.processTransaction(customer);
        expect(secondResult.success).toBe(false);
        expect(secondResult.reason).toBe('already_paid');
        expect(economy.coins).toBe(265); // Coins did not increase again
        expect(checkout.totalCustomersServed).toBe(1);
    });

    it('rejects empty baskets without changing coins or stats', () => {
        const emptyCustomer = new Customer({ id: 'c3', desiredProductIds: ['apples'] });
        const result = checkout.processTransaction(emptyCustomer);

        expect(result.success).toBe(false);
        expect(result.reason).toBe('empty_basket');
        expect(economy.coins).toBe(250);
        expect(checkout.totalCustomersServed).toBe(0);
    });

    it('rejects corrupt/invalid basket items with non-positive values', () => {
        const badCustomer = new Customer({ id: 'c4' });
        badCustomer.basket = [{ productId: 'apples', quantity: -1, unitPrice: 10 }];

        const result = checkout.processTransaction(badCustomer);
        expect(result.success).toBe(false);
        expect(result.reason).toBe('invalid_basket_item');
        expect(economy.coins).toBe(250);
    });

    it('emits checkout_success event for UI and audio triggers', () => {
        const events = [];
        checkout.subscribe(e => events.push(e));

        const customer = new Customer({ id: 'c5' });
        customer.addToBasket('snacks', 2, 9); // 18

        checkout.processTransaction(customer);

        expect(events).toHaveLength(1);
        expect(events[0]).toMatchObject({
            type: 'checkout_success',
            customerId: 'c5',
            total: 18,
            itemCount: 2
        });
    });
});
