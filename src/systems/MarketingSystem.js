/**
 * Marketing campaigns configuration.
 * Calibrated to Section 3.2 of the Business Project Management Plan.
 */
export const MARKETING_CAMPAIGNS = {
    pamphlets: {
        id: 'pamphlets',
        title: 'Street Pamphlets',
        cost: 50,
        durationSeconds: 60,
        footfallMultiplier: 1.4, // +40% faster customer arrivals
        basketBonus: 0,
        icon: '📄',
        description: 'Distribute flyers to students and budget shoppers.'
    },
    loudspeaker: {
        id: 'loudspeaker',
        title: 'Loudspeaker Announcement',
        cost: 150,
        durationSeconds: 90,
        footfallMultiplier: 1.8, // +80% faster customer arrivals
        basketBonus: 1,
        icon: '📢',
        description: 'Broadcast daily discounts to neighborhood family shoppers.'
    },
    digital_ads: {
        id: 'digital_ads',
        title: 'Hyperlocal Digital Ads',
        cost: 400,
        durationSeconds: 120,
        footfallMultiplier: 2.5, // +150% faster customer arrivals
        basketBonus: 2,
        icon: '📱',
        description: 'Geo-targeted digital campaign attracting premium rush shoppers.'
    }
};

/**
 * MarketingSystem: Manages advertising promotions, customer footfall boost,
 * and marketing ROI.
 * Pure JavaScript with zero Phaser dependencies.
 */
export class MarketingSystem {
    /**
     * @param {import('./EconomySystem.js').EconomySystem} economySystem
     * @param {import('./DayCycleSystem.js').DayCycleSystem} [dayCycleSystem]
     */
    constructor(economySystem, dayCycleSystem = null) {
        this._economy = economySystem;
        this._dayCycle = dayCycleSystem;

        /** @type {Map<string, { durationRemaining: number; config: object }>} */
        this._activeCampaigns = new Map();
        this._totalMarketingSpent = 0;
        this._listeners = new Set();
    }

    get totalMarketingSpent() {
        return this._totalMarketingSpent;
    }

    /**
     * Check if a specific campaign is currently running.
     * @param {string} campaignId
     * @returns {boolean}
     */
    isCampaignActive(campaignId) {
        return this._activeCampaigns.has(campaignId);
    }

    /**
     * Get remaining duration for an active campaign in seconds.
     * @param {string} campaignId
     * @returns {number}
     */
    getRemainingSeconds(campaignId) {
        const item = this._activeCampaigns.get(campaignId);
        return item ? Math.ceil(item.durationRemaining) : 0;
    }

    /**
     * Calculate aggregate customer arrival footfall multiplier.
     * Returns 1.0 when no marketing is active.
     * @returns {number}
     */
    get currentFootfallMultiplier() {
        if (this._activeCampaigns.size === 0) return 1.0;

        let totalBoost = 0;
        for (const { config } of this._activeCampaigns.values()) {
            totalBoost += (config.footfallMultiplier - 1.0);
        }
        return Math.min(3.5, 1.0 + totalBoost);
    }

    /**
     * Additional item capacity bonus to add to customer shopping baskets.
     * @returns {number}
     */
    get basketBonus() {
        let maxBonus = 0;
        for (const { config } of this._activeCampaigns.values()) {
            if (config.basketBonus > maxBonus) {
                maxBonus = config.basketBonus;
            }
        }
        return maxBonus;
    }

    /**
     * Launch a marketing campaign.
     * @param {string} campaignId
     * @returns {{ success: boolean; cost: number; reason?: string }}
     */
    launchCampaign(campaignId) {
        const campaign = MARKETING_CAMPAIGNS[campaignId];
        if (!campaign) {
            return { success: false, cost: 0, reason: 'invalid_campaign' };
        }

        if (!this._economy.canAfford(campaign.cost)) {
            return { success: false, cost: campaign.cost, reason: 'insufficient_funds' };
        }

        const debitSuccess = this._economy.debit(campaign.cost, `marketing_${campaignId}`);
        if (!debitSuccess) {
            return { success: false, cost: campaign.cost, reason: 'debit_failed' };
        }

        this._totalMarketingSpent += campaign.cost;

        if (this._dayCycle) {
            this._dayCycle.recordMarketingExpense(campaign.cost);
        }

        this._activeCampaigns.set(campaignId, {
            durationRemaining: campaign.durationSeconds,
            config: campaign
        });

        this._notifyListeners({
            type: 'campaign_launched',
            campaignId,
            cost: campaign.cost,
            duration: campaign.durationSeconds,
            footfallMultiplier: this.currentFootfallMultiplier
        });

        return { success: true, cost: campaign.cost };
    }

    /**
     * Advance marketing timers.
     * @param {number} deltaSeconds
     */
    tick(deltaSeconds) {
        if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0) return;

        const expired = [];
        for (const [id, item] of this._activeCampaigns.entries()) {
            item.durationRemaining -= deltaSeconds;
            if (item.durationRemaining <= 0) {
                expired.push(id);
            }
        }

        for (const id of expired) {
            this._activeCampaigns.delete(id);
            this._notifyListeners({
                type: 'campaign_expired',
                campaignId: id,
                footfallMultiplier: this.currentFootfallMultiplier
            });
        }
    }

    /**
     * Subscribe to marketing events.
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
                console.error('Error in MarketingSystem listener:', err);
            }
        }
    }

    toJSON() {
        const active = {};
        for (const [id, item] of this._activeCampaigns.entries()) {
            active[id] = item.durationRemaining;
        }
        return {
            totalMarketingSpent: this._totalMarketingSpent,
            activeCampaigns: active
        };
    }

    restore(data) {
        if (!data) return;
        if (Number.isFinite(data.totalMarketingSpent)) {
            this._totalMarketingSpent = data.totalMarketingSpent;
        }
        if (data.activeCampaigns && typeof data.activeCampaigns === 'object') {
            this._activeCampaigns.clear();
            for (const [id, remaining] of Object.entries(data.activeCampaigns)) {
                if (MARKETING_CAMPAIGNS[id] && Number.isFinite(remaining) && remaining > 0) {
                    this._activeCampaigns.set(id, {
                        durationRemaining: remaining,
                        config: MARKETING_CAMPAIGNS[id]
                    });
                }
            }
        }
    }
}
