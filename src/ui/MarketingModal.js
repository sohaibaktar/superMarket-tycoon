import Phaser from 'phaser';
import { MARKETING_CAMPAIGNS } from '../systems/MarketingSystem.js';
import { CURRENCY_SYMBOL } from '../data/products.js';

/**
 * MarketingModal: Touch-friendly UI overlay to review and launch advertising campaigns.
 */
export class MarketingModal extends Phaser.GameObjects.Container {
    /**
     * @param {Phaser.Scene} scene
     * @param {import('../systems/MarketingSystem.js').MarketingSystem} marketingSystem
     * @param {import('../systems/EconomySystem.js').EconomySystem} economySystem
     * @param {Function} onClose
     */
    constructor(scene, marketingSystem, economySystem, onClose) {
        super(scene, 0, 0);

        this.marketing = marketingSystem;
        this.economy = economySystem;
        this.onClose = onClose;

        this.cardButtons = new Map();

        this.buildModal();
        scene.add.existing(this);
    }

    buildModal() {
        const view = this.scene.scale.getViewPort(this.scene.cameras.main);
        const modalWidth = Math.min(480, view.width - 40);
        const modalHeight = 580;

        // Dark dim backdrop
        this.backdrop = this.scene.add.rectangle(view.centerX, view.centerY, view.width, view.height, 0x000000, 0.65)
            .setInteractive();
        this.add(this.backdrop);

        // Modal Frame
        this.frame = this.scene.add.container(view.centerX, view.centerY);
        this.add(this.frame);

        const bg = this.scene.add.rectangle(0, 0, modalWidth, modalHeight, 0x0f172a, 0.98)
            .setStrokeStyle(2, 0x38bdf8);

        // Header
        const headerText = this.scene.add.text(0, -modalHeight / 2 + 30, '📢 Marketing & Promotions', {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '20px',
            fontStyle: 'bold',
            color: '#f8fafc'
        }).setOrigin(0.5);

        const subheaderText = this.scene.add.text(0, -modalHeight / 2 + 58, 'Drive footfall and attract customer rushes to your store', {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '12px',
            color: '#94a3b8'
        }).setOrigin(0.5);

        // Close Button [X]
        const closeBtn = this.scene.add.container(modalWidth / 2 - 28, -modalHeight / 2 + 28);
        const closeBg = this.scene.add.circle(0, 0, 16, 0x334155).setInteractive({ useHandCursor: true });
        const closeIcon = this.scene.add.text(0, 0, '✕', {
            fontFamily: 'system-ui, sans-serif',
            fontSize: '14px',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5);
        closeBtn.add([closeBg, closeIcon]);

        closeBg.on('pointerdown', () => {
            this.dismiss();
        });

        this.frame.add([bg, headerText, subheaderText, closeBtn]);

        // Campaign Cards
        const campaigns = Object.values(MARKETING_CAMPAIGNS);
        const cardStartY = -140;
        const cardSpacing = 130;

        campaigns.forEach((camp, index) => {
            const cardY = cardStartY + (index * cardSpacing);
            this.createCampaignCard(camp, cardY, modalWidth - 40);
        });

        // Entrance scale tween
        this.frame.setScale(0.85);
        this.frame.setAlpha(0);
        this.scene.tweens.add({
            targets: this.frame,
            scaleX: 1,
            scaleY: 1,
            alpha: 1,
            duration: 180,
            ease: 'Back.easeOut'
        });
    }

    createCampaignCard(campaign, y, width) {
        const card = this.scene.add.container(0, y);

        const cardBg = this.scene.add.rectangle(0, 0, width, 114, 0x1e293b, 0.95)
            .setStrokeStyle(1.5, 0x475569);

        // Icon & Title
        const titleText = this.scene.add.text(-width / 2 + 18, -38, `${campaign.icon} ${campaign.title}`, {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '15px',
            fontStyle: 'bold',
            color: '#38bdf8'
        }).setOrigin(0, 0.5);

        // Description
        const descText = this.scene.add.text(-width / 2 + 18, -16, campaign.description, {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '11px',
            color: '#cbd5e1',
            wordWrap: { width: width - 36 }
        }).setOrigin(0, 0.5);

        // Benefits Pill
        const boostPct = Math.round((campaign.footfallMultiplier - 1.0) * 100);
        const perkText = this.scene.add.text(-width / 2 + 18, 14, `⚡ +${boostPct}% Footfall | Duration: ${campaign.durationSeconds}s`, {
            fontFamily: 'system-ui, monospace',
            fontSize: '11px',
            fontStyle: 'bold',
            color: '#4ade80'
        }).setOrigin(0, 0.5);

        // Action Button (Launch or Active Timer)
        const btnContainer = this.scene.add.container(width / 2 - 80, 26);
        const btnBg = this.scene.add.rectangle(0, 0, 130, 32, 0x0284c7).setStrokeStyle(1.5, 0x38bdf8);
        btnBg.setInteractive({ useHandCursor: true });

        const btnLabel = this.scene.add.text(0, 0, `Launch (${CURRENCY_SYMBOL}${campaign.cost})`, {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '12px',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5);

        btnContainer.add([btnBg, btnLabel]);

        this.cardButtons.set(campaign.id, { btnBg, btnLabel });

        btnBg.on('pointerdown', () => {
            if (this.marketing.isCampaignActive(campaign.id)) return;

            const res = this.marketing.launchCampaign(campaign.id);
            if (res.success) {
                this.scene.tweens.add({
                    targets: btnContainer,
                    scaleX: 1.15,
                    scaleY: 1.15,
                    duration: 90,
                    yoyo: true
                });
                this.updateButtonsState();
            } else {
                this.scene.tweens.add({
                    targets: btnContainer,
                    x: btnContainer.x + 4,
                    duration: 40,
                    yoyo: true,
                    repeat: 3
                });
            }
        });

        card.add([cardBg, titleText, descText, perkText, btnContainer]);
        this.frame.add(card);
    }

    update() {
        this.updateButtonsState();
    }

    updateButtonsState() {
        for (const [id, campaign] of Object.entries(MARKETING_CAMPAIGNS)) {
            const btnObj = this.cardButtons.get(id);
            if (!btnObj) continue;

            if (this.marketing.isCampaignActive(id)) {
                const rem = this.marketing.getRemainingSeconds(id);
                btnObj.btnBg.setFillStyle(0x16a34a);
                btnObj.btnLabel.setText(`Active (${rem}s)`);
            } else {
                const canAfford = this.economy.canAfford(campaign.cost);
                btnObj.btnBg.setFillStyle(canAfford ? 0x0284c7 : 0x475569);
                btnObj.btnLabel.setText(`Launch (${CURRENCY_SYMBOL}${campaign.cost})`);
            }
        }
    }

    dismiss() {
        this.scene.tweens.add({
            targets: this.frame,
            scaleX: 0.85,
            scaleY: 0.85,
            alpha: 0,
            duration: 140,
            onComplete: () => {
                if (this.onClose) this.onClose();
                this.destroy();
            }
        });
    }
}
