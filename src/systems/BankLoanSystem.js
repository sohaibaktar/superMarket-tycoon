/**
 * Commercial Bank Loan Tiers.
 * Calibrated to Section 3.3 of the Business Project Management Plan.
 */
export const LOAN_TIERS = {
    micro_loan: {
        id: 'micro_loan',
        name: 'Micro Working Capital',
        principal: 500,
        interestRate: 0.08,
        termDays: 4,
        dailyPayment: 135,
        totalRepayment: 540,
        unlockDay: 1,
        description: 'Quick liquidity to stock wholesale inventory and run promotions.'
    },
    expansion_loan: {
        id: 'expansion_loan',
        name: 'Store Expansion Credit',
        principal: 1500,
        interestRate: 0.06,
        termDays: 5,
        dailyPayment: 336,
        totalRepayment: 1680,
        unlockDay: 3,
        description: 'Substantial capital injection to fund new departments and upgrades.'
    },
    tycoon_loan: {
        id: 'tycoon_loan',
        name: 'Commercial Tycoon Facility',
        principal: 5000,
        interestRate: 0.04,
        termDays: 8,
        dailyPayment: 650,
        totalRepayment: 5200,
        unlockDay: 5,
        description: 'Enterprise-grade credit line for large-scale operations.'
    }
};

/**
 * BankLoanSystem: Manages commercial debt leverage, interest amortization,
 * early loan payoffs, and casual bankruptcy protection.
 * Pure JavaScript with zero Phaser dependencies.
 */
export class BankLoanSystem {
    /**
     * @param {import('./EconomySystem.js').EconomySystem} economySystem
     * @param {import('./DayCycleSystem.js').DayCycleSystem} [dayCycleSystem]
     */
    constructor(economySystem, dayCycleSystem = null) {
        this._economy = economySystem;
        this._dayCycle = dayCycleSystem;

        this._activeLoan = null;
        this._hasUsedBailout = false;
        this._totalBorrowed = 0;
        this._totalInterestPaid = 0;
        this._listeners = new Set();
    }

    get hasActiveLoan() {
        return this._activeLoan !== null;
    }

    get activeLoan() {
        return this._activeLoan ? { ...this._activeLoan } : null;
    }

    get hasUsedBailout() {
        return this._hasUsedBailout;
    }

    get totalBorrowed() {
        return this._totalBorrowed;
    }

    get totalInterestPaid() {
        return this._totalInterestPaid;
    }

    /**
     * Check if player is eligible for a specific loan tier.
     * @param {string} tierId
     * @param {number} currentDay
     * @returns {{ eligible: boolean; reason?: string }}
     */
    checkEligibility(tierId, currentDay = 1) {
        if (this.hasActiveLoan) {
            return { eligible: false, reason: 'active_loan_exists' };
        }

        const tier = LOAN_TIERS[tierId];
        if (!tier) {
            return { eligible: false, reason: 'invalid_tier' };
        }

        if (currentDay < tier.unlockDay) {
            return { eligible: false, reason: `unlocks_on_day_${tier.unlockDay}` };
        }

        return { eligible: true };
    }

    /**
     * Borrow money from the commercial bank.
     * @param {string} tierId
     * @param {number} currentDay
     * @returns {{ success: boolean; principal: number; reason?: string }}
     */
    applyForLoan(tierId, currentDay = 1) {
        const check = this.checkEligibility(tierId, currentDay);
        if (!check.eligible) {
            return { success: false, principal: 0, reason: check.reason };
        }

        const tier = LOAN_TIERS[tierId];

        // Atomically disburse loan principal into economy
        const creditSuccess = this._economy.credit(tier.principal, `loan_disbursement_${tier.id}`);
        if (!creditSuccess) {
            return { success: false, principal: 0, reason: 'disbursement_failed' };
        }

        this._activeLoan = {
            tierId: tier.id,
            name: tier.name,
            principal: tier.principal,
            dailyPayment: tier.dailyPayment,
            remainingBalance: tier.totalRepayment,
            daysRemaining: tier.termDays,
            totalTermDays: tier.termDays,
            interestAmount: tier.totalRepayment - tier.principal,
            borrowedAtDay: currentDay
        };

        this._totalBorrowed += tier.principal;

        this._notifyListeners({
            type: 'loan_disbursed',
            loan: { ...this._activeLoan }
        });

        return { success: true, principal: tier.principal };
    }

    /**
     * Process daily debt service at end of business day.
     * @returns {{ success: boolean; amountPaid: number; loanClosed: boolean; bailoutTriggered: boolean }}
     */
    processDailyDebtService() {
        if (!this.hasActiveLoan) {
            return { success: true, amountPaid: 0, loanClosed: false, bailoutTriggered: false };
        }

        const loan = this._activeLoan;
        const paymentDue = Math.min(loan.dailyPayment, loan.remainingBalance);

        if (this._economy.canAfford(paymentDue)) {
            this._economy.debit(paymentDue, 'debt_service');
            if (this._dayCycle) {
                this._dayCycle.recordLoanPayment(paymentDue);
            }

            loan.remainingBalance -= paymentDue;
            loan.daysRemaining--;

            this._totalInterestPaid += Math.floor(paymentDue - (loan.principal / loan.totalTermDays));

            if (loan.remainingBalance <= 0 || loan.daysRemaining <= 0) {
                this._activeLoan = null;
                this._notifyListeners({ type: 'loan_repaid', tierId: loan.tierId });
                return { success: true, amountPaid: paymentDue, loanClosed: true, bailoutTriggered: false };
            }

            this._notifyListeners({ type: 'debt_service_paid', amountPaid: paymentDue, remaining: loan.remainingBalance });
            return { success: true, amountPaid: paymentDue, loanClosed: false, bailoutTriggered: false };
        } else {
            // Player has insufficient cash to service daily debt!
            let bailoutTriggered = false;

            // Check if player is completely broke (<= 10 coins) and has not used emergency bailout
            if (this._economy.coins <= 10 && !this._hasUsedBailout) {
                this._hasUsedBailout = true;
                const bailoutAmount = 150;
                this._economy.credit(bailoutAmount, 'family_bailout_grant');
                this._notifyListeners({ type: 'bailout_granted', amount: bailoutAmount });
                // 1-Day Grace Period: Do not seize emergency bailout funds immediately
                return { success: false, amountPaid: 0, loanClosed: false, bailoutTriggered: true };
            }

            // Deduct partial payment if any cash exists
            const partial = Math.min(this._economy.coins, paymentDue);
            if (partial > 0) {
                this._economy.debit(partial, 'partial_debt_service');
                if (this._dayCycle) {
                    this._dayCycle.recordLoanPayment(partial);
                }
                loan.remainingBalance -= partial;
            }

            this._notifyListeners({
                type: 'debt_service_shortfall',
                paymentDue,
                amountPaid: partial,
                remaining: loan.remainingBalance,
                bailoutTriggered
            });

            return { success: false, amountPaid: partial, loanClosed: false, bailoutTriggered };
        }
    }

    /**
     * Pay off the remaining loan balance early in a single lump sum.
     * @returns {{ success: boolean; amountPaid: number; reason?: string }}
     */
    repayEarly() {
        if (!this.hasActiveLoan) {
            return { success: false, amountPaid: 0, reason: 'no_active_loan' };
        }

        const payoffAmount = this._activeLoan.remainingBalance;

        if (!this._economy.canAfford(payoffAmount)) {
            return { success: false, amountPaid: payoffAmount, reason: 'insufficient_funds' };
        }

        const debitSuccess = this._economy.debit(payoffAmount, 'loan_payoff_early');
        if (!debitSuccess) {
            return { success: false, amountPaid: payoffAmount, reason: 'debit_failed' };
        }

        if (this._dayCycle) {
            this._dayCycle.recordLoanPayment(payoffAmount);
        }

        const tierId = this._activeLoan.tierId;
        this._activeLoan = null;

        this._notifyListeners({
            type: 'loan_repaid_early',
            tierId,
            amountPaid: payoffAmount
        });

        return { success: true, amountPaid: payoffAmount };
    }

    /**
     * Subscribe to loan events.
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
                console.error('Error in BankLoanSystem listener:', err);
            }
        }
    }

    toJSON() {
        return {
            activeLoan: this._activeLoan ? { ...this._activeLoan } : null,
            hasUsedBailout: this._hasUsedBailout,
            totalBorrowed: this._totalBorrowed,
            totalInterestPaid: this._totalInterestPaid
        };
    }

    restore(data) {
        if (!data) return;
        if (data.activeLoan) {
            this._activeLoan = { ...data.activeLoan };
        }
        if (typeof data.hasUsedBailout === 'boolean') {
            this._hasUsedBailout = data.hasUsedBailout;
        }
        if (Number.isFinite(data.totalBorrowed)) {
            this._totalBorrowed = data.totalBorrowed;
        }
        if (Number.isFinite(data.totalInterestPaid)) {
            this._totalInterestPaid = data.totalInterestPaid;
        }
    }
}
