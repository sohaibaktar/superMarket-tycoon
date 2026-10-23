import { describe, it, expect, beforeEach } from 'vitest';
import { EconomySystem } from '../src/systems/EconomySystem.js';
import { DayCycleSystem } from '../src/systems/DayCycleSystem.js';
import { MarketingSystem } from '../src/systems/MarketingSystem.js';

describe('MarketingSystem', () => {
    let economy;
    let dayCycle;
    let marketing;

    beforeEach(() => {
        economy = new EconomySystem(250);
        dayCycle = new DayCycleSystem();
        marketing = new MarketingSystem(economy, dayCycle);
    });

    it('launches Pamphlets campaign, debits economy, records expense, and boosts footfall', () => {
        const res = marketing.launchCampaign('pamphlets'); // Cost 50

        expect(res.success).toBe(true);
        expect(res.cost).toBe(50);
        expect(economy.coins).toBe(200);
        expect(dayCycle.dailyMarketingCost).toBe(50);
        expect(marketing.isCampaignActive('pamphlets')).toBe(true);
        expect(marketing.currentFootfallMultiplier).toBe(1.4);
    });

    it('rejects campaign when player has insufficient coins', () => {
        const poorEconomy = new EconomySystem(30);
        const poorMarketing = new MarketingSystem(poorEconomy);

        const res = poorMarketing.launchCampaign('pamphlets'); // Requires 50

        expect(res.success).toBe(false);
        expect(res.reason).toBe('insufficient_funds');
        expect(poorEconomy.coins).toBe(30);
        expect(poorMarketing.currentFootfallMultiplier).toBe(1.0);
    });

    it('ticks active campaign timer and expires correctly', () => {
        marketing.launchCampaign('pamphlets'); // duration 60s
        expect(marketing.isCampaignActive('pamphlets')).toBe(true);

        marketing.tick(30);
        expect(marketing.getRemainingSeconds('pamphlets')).toBe(30);
        expect(marketing.isCampaignActive('pamphlets')).toBe(true);

        marketing.tick(35);
        expect(marketing.isCampaignActive('pamphlets')).toBe(false);
        expect(marketing.currentFootfallMultiplier).toBe(1.0);
    });

    it('stacks multiple campaigns and calculates combined footfall and basket bonus', () => {
        economy.credit(500); // 750 coins
        marketing.launchCampaign('pamphlets');   // +0.4 boost
        marketing.launchCampaign('loudspeaker'); // +0.8 boost, basket bonus 1

        expect(marketing.currentFootfallMultiplier).toBeCloseTo(2.2);
        expect(marketing.basketBonus).toBe(1);
    });
});
