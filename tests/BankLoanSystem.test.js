import { describe, it, expect, beforeEach } from 'vitest';
import { EconomySystem } from '../src/systems/EconomySystem.js';
import { DayCycleSystem } from '../src/systems/DayCycleSystem.js';
import { BankLoanSystem } from '../src/systems/BankLoanSystem.js';

describe('BankLoanSystem', () => {
    let economy;
    let dayCycle;
    let bank;

    beforeEach(() => {
        economy = new EconomySystem(250);
        dayCycle = new DayCycleSystem();
        bank = new BankLoanSystem(economy, dayCycle);
    });

    it('disburses Micro Loan principal into economy and sets up active debt terms', () => {
        const res = bank.applyForLoan('micro_loan', 1); // 500 principal

        expect(res.success).toBe(true);
        expect(res.principal).toBe(500);
        expect(economy.coins).toBe(750); // 250 + 500
        expect(bank.hasActiveLoan).toBe(true);
        expect(bank.activeLoan).toMatchObject({
            tierId: 'micro_loan',
            principal: 500,
            remainingBalance: 540,
            dailyPayment: 135,
            daysRemaining: 4
        });
    });

    it('prevents taking a second loan while an active loan is outstanding', () => {
        bank.applyForLoan('micro_loan', 1);
        const secondRes = bank.applyForLoan('micro_loan', 1);

        expect(secondRes.success).toBe(false);
        expect(secondRes.reason).toBe('active_loan_exists');
    });

    it('enforces day unlock requirement for higher-tier loans', () => {
        // Expansion loan unlocks on Day 3
        const day1Check = bank.checkEligibility('expansion_loan', 1);
        expect(day1Check.eligible).toBe(false);
        expect(day1Check.reason).toBe('unlocks_on_day_3');

        const day3Check = bank.checkEligibility('expansion_loan', 3);
        expect(day3Check.eligible).toBe(true);
    });

    it('deducts daily debt service installment and closes loan upon completion', () => {
        bank.applyForLoan('micro_loan', 1); // 4 days @ 135

        // Day 1 debt service
        const d1 = bank.processDailyDebtService();
        expect(d1.success).toBe(true);
        expect(d1.amountPaid).toBe(135);
        expect(d1.loanClosed).toBe(false);
        expect(bank.activeLoan.remainingBalance).toBe(405);
        expect(dayCycle.dailyLoanPayment).toBe(135);

        // Day 2 debt service
        bank.processDailyDebtService();
        // Day 3 debt service
        bank.processDailyDebtService();
        // Day 4 debt service (final payment)
        const d4 = bank.processDailyDebtService();

        expect(d4.success).toBe(true);
        expect(d4.loanClosed).toBe(true);
        expect(bank.hasActiveLoan).toBe(false);
    });

    it('allows early loan payoff in full', () => {
        bank.applyForLoan('micro_loan', 1); // 540 balance
        economy.credit(1000); // Plenty of cash

        const payoff = bank.repayEarly();
        expect(payoff.success).toBe(true);
        expect(payoff.amountPaid).toBe(540);
        expect(bank.hasActiveLoan).toBe(false);
    });

    it('triggers emergency bailout if broke during debt service', () => {
        bank.applyForLoan('micro_loan', 1);
        // Drain economy down to 0
        economy.debit(economy.coins);
        expect(economy.coins).toBe(0);

        const res = bank.processDailyDebtService();
        expect(res.bailoutTriggered).toBe(true);
        expect(bank.hasUsedBailout).toBe(true);
        expect(economy.coins).toBe(150); // Bailout grant
    });
});
