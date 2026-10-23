import { describe, it, expect, beforeEach } from 'vitest';
import { EconomySystem } from '../src/systems/EconomySystem.js';
import { InventorySystem } from '../src/systems/InventorySystem.js';
import { CheckoutSystem } from '../src/systems/CheckoutSystem.js';
import { CustomerSystem } from '../src/systems/CustomerSystem.js';

describe('CustomerSystem', () => {
    let economy;
    let inventory;
    let checkout;
    let customers;

    beforeEach(() => {
        economy = new EconomySystem(250);
        inventory = new InventorySystem(economy); // starting stock 5 each
        checkout = new CheckoutSystem(inventory, economy);
        customers = new CustomerSystem(inventory, checkout, { maxConcurrentCustomers: 3, maxQueueCapacity: 2 });
    });

    it('spawns customers up to max concurrent limit', () => {
        const c1 = customers.spawnCustomer();
        const c2 = customers.spawnCustomer();
        const c3 = customers.spawnCustomer();
        const c4 = customers.spawnCustomer(); // Exceeds 3

        expect(c1).not.toBeNull();
        expect(c2).not.toBeNull();
        expect(c3).not.toBeNull();
        expect(c4).toBeNull(); // Rejected
        expect(customers.activeCount).toBe(3);
    });

    it('allows customer to take available item from shelf and adds to basket', () => {
        const c = customers.spawnCustomer();
        expect(inventory.getStock('apples')).toBe(5);

        const res = customers.tryTakeItem(c.id, 'apples');
        expect(res.success).toBe(true);
        expect(inventory.getStock('apples')).toBe(4); // 1 consumed
        expect(c.basket).toHaveLength(1);
        expect(c.basket[0]).toMatchObject({ productId: 'apples', quantity: 1, unitPrice: 10 });
    });

    it('records disappointed items when shelf is out of stock', () => {
        // Drain milk stock
        inventory.consumeStock('milk', 5);
        expect(inventory.getStock('milk')).toBe(0);

        const c = customers.spawnCustomer();
        const res = customers.tryTakeItem(c.id, 'milk');

        expect(res.success).toBe(false);
        expect(res.reason).toBe('out_of_stock');
        expect(c.disappointedItems).toContain('milk');
        expect(c.basket).toHaveLength(0);
    });

    it('manages queue slots and shifts queue forward after serving', () => {
        const c1 = customers.spawnCustomer();
        const c2 = customers.spawnCustomer();

        c1.addToBasket('apples', 1, 10);
        c2.addToBasket('bread', 1, 12);

        const q1 = customers.joinQueue(c1.id);
        const q2 = customers.joinQueue(c2.id);

        expect(q1.success).toBe(true);
        expect(q1.spotIndex).toBe(0);
        expect(q2.success).toBe(true);
        expect(q2.spotIndex).toBe(1);
        expect(customers.isQueueFull).toBe(true); // Cap is 2

        // Serving front customer (c1)
        const serveRes = customers.serveFrontOfQueue();
        expect(serveRes.success).toBe(true);
        expect(serveRes.total).toBe(10);
        expect(c1.isPaid).toBe(true);
        expect(c1.state).toBe('leaving');

        // c2 should now be shifted to spot 0
        expect(customers.getCustomerAtQueueSpot(0)?.id).toBe(c2.id);
        expect(customers.getCustomerAtQueueSpot(1)).toBeNull();
        expect(customers.isQueueFull).toBe(false);
    });

    it('rejects queueing when checkout line is full', () => {
        const c1 = customers.spawnCustomer();
        const c2 = customers.spawnCustomer();
        const c3 = customers.spawnCustomer();

        customers.joinQueue(c1.id); // spot 0
        customers.joinQueue(c2.id); // spot 1 (max reached)

        const q3 = customers.joinQueue(c3.id);
        expect(q3.success).toBe(false);
        expect(q3.spotIndex).toBe(-1);
    });
});
