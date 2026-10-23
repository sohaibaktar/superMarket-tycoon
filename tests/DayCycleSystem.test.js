import { describe, it, expect, beforeEach } from 'vitest';
import { DayCycleSystem } from '../src/systems/DayCycleSystem.js';

describe('DayCycleSystem', () => {
    let dayCycle;

    beforeEach(() => {
        dayCycle = new DayCycleSystem({ dayDurationSeconds: 60 });
    });

    it('initializes on Day 1 with empty daily P&L', () => {
        expect(dayCycle.currentDay).toBe(1);
        expect(dayCycle.isDayActive).toBe(true);
        expect(dayCycle.timeRemaining).toBe(60);
        expect(dayCycle.dailyRevenue).toBe(0);
        expect(dayCycle.dailyNetProfit).toBe(0);
    });

    it('accurately accumulates daily financial ledger entries and calculates Net Profit', () => {
        dayCycle.recordRevenue(200);
        dayCycle.recordRestockExpense(60);
        dayCycle.recordMarketingExpense(50);
        dayCycle.recordLoanPayment(40);

        expect(dayCycle.dailyRevenue).toBe(200);
        expect(dayCycle.dailyRestockCost).toBe(60);
        expect(dayCycle.dailyMarketingCost).toBe(50);
        expect(dayCycle.dailyLoanPayment).toBe(40);
        expect(dayCycle.dailyCustomersServed).toBe(1);
        expect(dayCycle.dailyNetProfit).toBe(50); // 200 - (60 + 50 + 40)
    });

    it('ticks down time and closes day when time expires', () => {
        dayCycle.recordRevenue(100);
        dayCycle.tick(30);
        expect(dayCycle.timeRemaining).toBe(30);
        expect(dayCycle.isDayActive).toBe(true);

        dayCycle.tick(35);
        expect(dayCycle.timeRemaining).toBe(0);
        expect(dayCycle.isDayActive).toBe(false);
        expect(dayCycle.history).toHaveLength(1);
        expect(dayCycle.history[0]).toMatchObject({
            day: 1,
            revenue: 100,
            netProfit: 100
        });
    });

    it('transitions to Day 2 and resets daily ledger', () => {
        dayCycle.recordRevenue(150);
        dayCycle.endDay();
        expect(dayCycle.isDayActive).toBe(false);

        dayCycle.startNextDay();
        expect(dayCycle.currentDay).toBe(2);
        expect(dayCycle.isDayActive).toBe(true);
        expect(dayCycle.timeRemaining).toBe(60);
        expect(dayCycle.dailyRevenue).toBe(0);
        expect(dayCycle.dailyNetProfit).toBe(0);
    });
});
