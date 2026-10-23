/**
 * DayCycleSystem: Manages business operating hours, daily financial ledger,
 * and day/night transitions.
 * Pure JavaScript with zero Phaser dependencies for seamless unit testing.
 */
export class DayCycleSystem {
    /**
     * @param {object} [config]
     * @param {number} [config.dayDurationSeconds=180] Duration of one business day in seconds (3 minutes)
     */
    constructor(config = {}) {
        this.dayDurationSeconds = config.dayDurationSeconds ?? 180;
        this.currentDay = 1;
        this.timeRemaining = this.dayDurationSeconds;
        this.isDayActive = true;

        // Daily P&L Ledger
        this.dailyRevenue = 0;
        this.dailyRestockCost = 0;
        this.dailyMarketingCost = 0;
        this.dailyLoanPayment = 0;
        this.dailyCustomersServed = 0;

        // Lifetime metrics across all days
        this.history = [];
        this._listeners = new Set();
    }

    /**
     * Daily Net Profit = Revenue - (COGS + Marketing + Loan Service)
     * @returns {number}
     */
    get dailyNetProfit() {
        return this.dailyRevenue - (this.dailyRestockCost + this.dailyMarketingCost + this.dailyLoanPayment);
    }

    /**
     * Update the business clock.
     * @param {number} deltaSeconds
     */
    tick(deltaSeconds) {
        if (!this.isDayActive) return;

        this.timeRemaining = Math.max(0, this.timeRemaining - deltaSeconds);

        if (this.timeRemaining <= 0) {
            this.endDay();
        }
    }

    /**
     * Record revenue generated from a sale.
     * @param {number} amount
     */
    recordRevenue(amount) {
        if (Number.isFinite(amount) && amount > 0) {
            this.dailyRevenue += Math.floor(amount);
            this.dailyCustomersServed++;
        }
    }

    /**
     * Record wholesale inventory restock expenditure.
     * @param {number} amount
     */
    recordRestockExpense(amount) {
        if (Number.isFinite(amount) && amount > 0) {
            this.dailyRestockCost += Math.floor(amount);
        }
    }

    /**
     * Record marketing campaign expenditure.
     * @param {number} amount
     */
    recordMarketingExpense(amount) {
        if (Number.isFinite(amount) && amount > 0) {
            this.dailyMarketingCost += Math.floor(amount);
        }
    }

    /**
     * Record bank debt service deduction.
     * @param {number} amount
     */
    recordLoanPayment(amount) {
        if (Number.isFinite(amount) && amount > 0) {
            this.dailyLoanPayment += Math.floor(amount);
        }
    }

    /**
     * Close the business day and finalize P&L.
     */
    endDay() {
        if (!this.isDayActive) return;
        this.isDayActive = false;
        this.timeRemaining = 0;

        const daySummary = {
            day: this.currentDay,
            revenue: this.dailyRevenue,
            restockCost: this.dailyRestockCost,
            marketingCost: this.dailyMarketingCost,
            loanPayment: this.dailyLoanPayment,
            netProfit: this.dailyNetProfit,
            customersServed: this.dailyCustomersServed,
            timestamp: Date.now()
        };

        this.history.push(daySummary);
        this._notifyListeners({ type: 'day_ended', summary: daySummary });
    }

    /**
     * Open store for the next business day.
     */
    startNextDay() {
        this.currentDay++;
        this.timeRemaining = this.dayDurationSeconds;
        this.isDayActive = true;

        // Reset daily ledger
        this.dailyRevenue = 0;
        this.dailyRestockCost = 0;
        this.dailyMarketingCost = 0;
        this.dailyLoanPayment = 0;
        this.dailyCustomersServed = 0;

        this._notifyListeners({ type: 'day_started', day: this.currentDay });
    }

    /**
     * Subscribe to day cycle events.
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
                console.error('Error in DayCycleSystem listener:', err);
            }
        }
    }

    toJSON() {
        return {
            currentDay: this.currentDay,
            timeRemaining: this.timeRemaining,
            isDayActive: this.isDayActive,
            dailyRevenue: this.dailyRevenue,
            dailyRestockCost: this.dailyRestockCost,
            dailyMarketingCost: this.dailyMarketingCost,
            dailyLoanPayment: this.dailyLoanPayment,
            dailyCustomersServed: this.dailyCustomersServed,
            history: [...this.history]
        };
    }

    restore(data) {
        if (!data) return;
        if (Number.isFinite(data.currentDay)) this.currentDay = data.currentDay;
        if (Number.isFinite(data.timeRemaining)) this.timeRemaining = data.timeRemaining;
        if (typeof data.isDayActive === 'boolean') this.isDayActive = data.isDayActive;
        if (Number.isFinite(data.dailyRevenue)) this.dailyRevenue = data.dailyRevenue;
        if (Number.isFinite(data.dailyRestockCost)) this.dailyRestockCost = data.dailyRestockCost;
        if (Number.isFinite(data.dailyMarketingCost)) this.dailyMarketingCost = data.dailyMarketingCost;
        if (Number.isFinite(data.dailyLoanPayment)) this.dailyLoanPayment = data.dailyLoanPayment;
        if (Number.isFinite(data.dailyCustomersServed)) this.dailyCustomersServed = data.dailyCustomersServed;
        if (Array.isArray(data.history)) this.history = [...data.history];
    }
}
