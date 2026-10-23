import Phaser from 'phaser';
import { YouTubePlayables } from '../YouTubePlayables.js';
import { FIRST_MILESTONE_COINS, CURRENCY_SYMBOL } from '../data/products.js';
import { MarketingModal } from '../ui/MarketingModal.js';
import { BankModal } from '../ui/BankModal.js';
import { EndOfDayModal } from '../ui/EndOfDayModal.js';

export class UI extends Phaser.Scene {
    constructor() {
        super('UI');
    }

    create() {
        this.economy = this.registry.get('economySystem');
        this.dayCycle = this.registry.get('dayCycleSystem');
        this.marketing = this.registry.get('marketingSystem');
        this.bank = this.registry.get('bankLoanSystem');

        this.activeModal = null;

        this.createCoinBadge();
        this.createDayBadge();
        this.createAudioButton();
        this.createBottomActionBar();
        this.createToastContainer();

        // Responsive repositioning on resize
        this.repositionUI();
        this.scale.on('resize', this.repositionUI, this);

        // Sync with YouTube Playables audio state
        this.setupAudioIntegration();

        // Subscribe to domain systems
        this.setupSystemSubscriptions();
    }

    createCoinBadge() {
        this.coinContainer = this.add.container(20, 28);

        const bg = this.add.rectangle(0, 0, 140, 38, 0x0f172a, 0.88)
            .setStrokeStyle(1.5, 0xeab308)
            .setOrigin(0, 0.5);

        const icon = this.add.image(20, 0, 'coin-icon').setOrigin(0.5).setScale(0.75);

        const initialCoins = this.economy ? this.economy.coins : 250;
        this.coinText = this.add.text(44, 0, `${CURRENCY_SYMBOL}${initialCoins.toLocaleString()}`, {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '17px',
            fontStyle: 'bold',
            color: '#fef08a'
        }).setOrigin(0, 0.5);

        this.coinContainer.add([bg, icon, this.coinText]);
    }

    createDayBadge() {
        this.dayContainer = this.add.container(0, 28);

        const bg = this.add.rectangle(0, 0, 160, 38, 0x0f172a, 0.88)
            .setStrokeStyle(1.5, 0x38bdf8)
            .setOrigin(0.5);

        this.dayText = this.add.text(0, 0, '☀️ Day 1 (60s)', {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '14px',
            fontStyle: 'bold',
            color: '#e0f2fe'
        }).setOrigin(0.5);

        this.dayContainer.add([bg, this.dayText]);
    }

    createAudioButton() {
        this.audioBtn = this.add.container(0, 28);

        this.audioIcon = this.add.image(0, 0, 'ui-audio-on')
            .setOrigin(0.5)
            .setScale(0.8);

        this.audioIcon.setInteractive({ useHandCursor: true });

        this.audioIcon.on('pointerdown', () => {
            const isMuted = this.sound.mute;
            if (isMuted) {
                this.enableAudio();
            } else {
                this.disableAudio();
            }
        });

        this.audioBtn.add(this.audioIcon);
    }

    createBottomActionBar() {
        // Bottom Action Bar Container
        this.bottomBar = this.add.container(0, 0);

        // Marketing Button
        this.marketingBtn = this.add.container(-130, 0);
        const mBg = this.add.rectangle(0, 0, 120, 42, 0x0284c7).setStrokeStyle(1.5, 0x38bdf8);
        mBg.setInteractive({ useHandCursor: true });
        this.mText = this.add.text(0, 0, '📢 Marketing', {
            fontFamily: 'system-ui, sans-serif',
            fontSize: '13px',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5);
        this.marketingBtn.add([mBg, this.mText]);

        mBg.on('pointerdown', () => this.openMarketingModal());

        // Goal Tracker Pill
        this.goalPill = this.add.container(0, 0);
        const gBg = this.add.rectangle(0, 0, 130, 42, 0x0f172a, 0.9).setStrokeStyle(1.5, 0x334155);
        this.goalText = this.add.text(0, 0, `🎯 ${CURRENCY_SYMBOL}${FIRST_MILESTONE_COINS}`, {
            fontFamily: 'system-ui, sans-serif',
            fontSize: '13px',
            fontStyle: 'bold',
            color: '#cbd5e1'
        }).setOrigin(0.5);
        this.goalPill.add([gBg, this.goalText]);

        // Bank Loan Button
        this.bankBtn = this.add.container(130, 0);
        const bBg = this.add.rectangle(0, 0, 110, 42, 0xb45309).setStrokeStyle(1.5, 0xfbbf24);
        bBg.setInteractive({ useHandCursor: true });
        this.bText = this.add.text(0, 0, '🏦 Bank', {
            fontFamily: 'system-ui, sans-serif',
            fontSize: '13px',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5);
        this.bankBtn.add([bBg, this.bText]);

        bBg.on('pointerdown', () => this.openBankModal());

        this.bottomBar.add([this.marketingBtn, this.goalPill, this.bankBtn]);
    }

    createToastContainer() {
        this.toastBox = this.add.container(0, 75);
        this.toastBox.setAlpha(0);

        this.toastBg = this.add.rectangle(0, 0, 400, 38, 0x0f172a, 0.92)
            .setStrokeStyle(1.5, 0x38bdf8)
            .setOrigin(0.5);

        this.toastText = this.add.text(0, 0, '', {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '13px',
            fontStyle: 'bold',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        this.toastBox.add([this.toastBg, this.toastText]);
    }

    openMarketingModal() {
        if (this.activeModal) return;
        this.activeModal = new MarketingModal(this, this.marketing, this.economy, () => {
            this.activeModal = null;
        });
    }

    openBankModal() {
        if (this.activeModal) return;
        const currentDay = this.dayCycle ? this.dayCycle.currentDay : 1;
        this.activeModal = new BankModal(this, this.bank, this.economy, currentDay, () => {
            this.activeModal = null;
        });
    }

    showEndOfDaySummary(summary) {
        if (this.activeModal) {
            this.activeModal.destroy();
            this.activeModal = null;
        }

        // Process daily bank loan debt service
        let debtResult = { amountPaid: 0, bailoutTriggered: false };
        if (this.bank && this.bank.hasActiveLoan) {
            debtResult = this.bank.processDailyDebtService();
        }

        const currentCoins = this.economy ? this.economy.coins : 0;

        this.activeModal = new EndOfDayModal(this, summary, currentCoins, () => {
            this.activeModal = null;
            if (this.dayCycle) {
                this.dayCycle.startNextDay();
            }
            if (debtResult.bailoutTriggered) {
                this.showToast('Emergency Family Bailout (+₹150) granted!', 'success');
            }
        });
    }

    setupSystemSubscriptions() {
        if (this.economy) {
            this._unsubEconomy = this.economy.subscribe(() => {
                this.updateCoinText();
            });
        }

        if (this.dayCycle) {
            this._unsubDay = this.dayCycle.subscribe((event) => {
                if (event.type === 'day_ended') {
                    this.showEndOfDaySummary(event.summary);
                } else if (event.type === 'day_started') {
                    this.showToast(`Day ${event.day} started! Store is now open.`, 'info');
                }
            });
        }

        if (this.marketing) {
            this._unsubMarketing = this.marketing.subscribe((event) => {
                if (event.type === 'campaign_launched') {
                    this.showToast(`Launched ${event.campaignId}! Customer arrivals boosted.`, 'success');
                } else if (event.type === 'campaign_expired') {
                    this.showToast('Marketing campaign ended.', 'info');
                }
            });
        }

        if (this.bank) {
            this._unsubBank = this.bank.subscribe((event) => {
                if (event.type === 'loan_disbursed') {
                    this.showToast(`Loan approved! +${CURRENCY_SYMBOL}${event.loan.principal} added to cash.`, 'success');
                } else if (event.type === 'loan_repaid' || event.type === 'loan_repaid_early') {
                    this.showToast('Loan fully repaid! Your credit is clear.', 'success');
                }
            });
        }
    }

    update(time, delta) {
        const deltaSeconds = delta / 1000;

        // Tick day cycle timer
        if (this.dayCycle && this.dayCycle.isDayActive) {
            this.dayCycle.tick(deltaSeconds);
            const rem = Math.ceil(this.dayCycle.timeRemaining);
            this.dayText.setText(`☀️ Day ${this.dayCycle.currentDay} (${rem}s)`);
        }

        // Tick marketing campaigns
        if (this.marketing) {
            this.marketing.tick(deltaSeconds);

            // Update marketing button text if active
            if (this.marketing._activeCampaigns.size > 0) {
                this.mText.setText(`📢 Boost ${this.marketing.currentFootfallMultiplier.toFixed(1)}x`);
            } else {
                this.mText.setText('📢 Marketing');
            }
        }

        // Update active modal timers if present
        if (this.activeModal && this.activeModal.update) {
            this.activeModal.update();
        }
    }

    showToast(message, type = 'info') {
        this.toastText.setText(message);

        if (type === 'error') {
            this.toastBg.setStrokeStyle(1.5, 0xef4444);
            this.toastText.setColor('#fca5a5');
        } else if (type === 'success') {
            this.toastBg.setStrokeStyle(1.5, 0x22c55e);
            this.toastText.setColor('#86efac');
        } else {
            this.toastBg.setStrokeStyle(1.5, 0x38bdf8);
            this.toastText.setColor('#ffffff');
        }

        this.tweens.killTweensOf(this.toastBox);
        this.toastBox.setAlpha(1);
        this.toastBox.y = 70;

        this.tweens.add({
            targets: this.toastBox,
            y: 80,
            duration: 180,
            ease: 'Power1'
        });

        this.time.delayedCall(2400, () => {
            this.tweens.add({
                targets: this.toastBox,
                alpha: 0,
                duration: 250,
                ease: 'Power1'
            });
        });
    }

    updateCoinText() {
        if (!this.coinText || !this.economy) return;
        this.coinText.setText(`${CURRENCY_SYMBOL}${this.economy.coins.toLocaleString()}`);

        this.tweens.add({
            targets: this.coinText,
            scaleX: 1.15,
            scaleY: 1.15,
            duration: 90,
            yoyo: true
        });
    }

    setupAudioIntegration() {
        if (YouTubePlayables.isAudioEnabled()) {
            this.enableAudio();
        } else {
            this.disableAudio();
        }

        YouTubePlayables.setAudioChangeCallback((enabled) => {
            if (enabled) {
                this.enableAudio();
            } else {
                this.disableAudio();
            }
        });
    }

    enableAudio() {
        this.sound.setMute(false);
        this.audioIcon.setTexture('ui-audio-on');
    }

    disableAudio() {
        this.sound.setMute(true);
        this.audioIcon.setTexture('ui-audio-off');
    }

    repositionUI() {
        const width = this.scale.width;
        const height = this.scale.height;

        // Top Left: Coin badge
        this.coinContainer.x = 20;
        this.coinContainer.y = 28;

        // Top Center: Day badge
        this.dayContainer.x = width / 2;
        this.dayContainer.y = 28;

        // Top Right: Audio toggle
        this.audioBtn.x = width - 36;
        this.audioBtn.y = 28;

        // Bottom Action Bar
        this.bottomBar.x = width / 2;
        this.bottomBar.y = height - 32;

        // Toast Center
        this.toastBox.x = width / 2;
    }

    destroy(fromScene) {
        if (this._unsubEconomy) this._unsubEconomy();
        if (this._unsubDay) this._unsubDay();
        if (this._unsubMarketing) this._unsubMarketing();
        if (this._unsubBank) this._unsubBank();
        super.destroy(fromScene);
    }
}
