import Phaser from 'phaser';
import { UPGRADES, MILESTONES } from '../data/upgrades.js';
import { CURRENCY_SYMBOL } from '../data/products.js';

/**
 * UpgradesModal: Touch-friendly UI overlay to purchase automation throughput,
 * expand shelf capacities, unlock department permits, and track milestone goals.
 */
export class UpgradesModal extends Phaser.GameObjects.Container {
    /**
     * @param {Phaser.Scene} scene
     * @param {import('../systems/ProgressionSystem.js').ProgressionSystem} progressionSystem
     * @param {import('../systems/EconomySystem.js').EconomySystem} economySystem
     * @param {import('../persistence/SaveManager.js').SaveManager} [saveManager]
     * @param {Function} [onClose]
     */
    constructor(scene, progressionSystem, economySystem, saveManager, onClose) {
        super(scene, 0, 0);

        this.progression = progressionSystem;
        this.economy = economySystem;
        this.saveManager = saveManager;
        this.onClose = onClose;

        this.cardElements = new Map();

        this.buildModal();
        scene.add.existing(this);
    }

    buildModal() {
        const view = this.scene.scale.getViewPort(this.scene.cameras.main);
        const modalWidth = Math.min(500, view.width - 40);
        const modalHeight = 620;

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
        const headerText = this.scene.add.text(0, -modalHeight / 2 + 28, '⚡ Store Upgrades & Permits', {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '19px',
            fontStyle: 'bold',
            color: '#f8fafc'
        }).setOrigin(0.5);

        const subheaderText = this.scene.add.text(0, -modalHeight / 2 + 52, 'Invest in automation throughput and business expansion', {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '11px',
            color: '#94a3b8'
        }).setOrigin(0.5);

        // Close Button [X]
        const closeBtn = this.scene.add.container(modalWidth / 2 - 26, -modalHeight / 2 + 26);
        const closeBg = this.scene.add.circle(0, 0, 15, 0x334155).setInteractive({ useHandCursor: true });
        const closeIcon = this.scene.add.text(0, 0, '✕', {
            fontFamily: 'system-ui, sans-serif',
            fontSize: '13px',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5);
        closeBtn.add([closeBg, closeIcon]);

        closeBg.on('pointerdown', () => {
            this.dismiss();
        });

        this.frame.add([bg, headerText, subheaderText, closeBtn]);

        // Milestone Progress Section
        this.buildMilestoneSection(modalWidth - 40, -modalHeight / 2 + 96);

        // Upgrade Cards
        const upgradesList = Object.values(UPGRADES);
        const cardStartY = -20;
        const cardSpacing = 120;

        upgradesList.forEach((upgrade, index) => {
            const cardY = cardStartY + (index * cardSpacing);
            this.createUpgradeCard(upgrade, cardY, modalWidth - 40);
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

    buildMilestoneSection(width, y) {
        this.milestoneContainer = this.scene.add.container(0, y);

        const bg = this.scene.add.rectangle(0, 0, width, 62, 0x1e293b, 0.95)
            .setStrokeStyle(1.5, 0xca8a04);

        const current = this.progression.currentMilestone;
        const totalRevenue = this.progression._totalRevenueTracked || 0;

        if (current) {
            const progressRatio = Math.min(1, Math.max(0, totalRevenue / current.targetRevenue));
            const pct = Math.floor(progressRatio * 100);

            this.mTitle = this.scene.add.text(-width / 2 + 16, -16, `🎯 Target: ${current.title} (+${CURRENCY_SYMBOL}${current.rewardCoins})`, {
                fontFamily: 'system-ui, sans-serif',
                fontSize: '13px',
                fontStyle: 'bold',
                color: '#fef08a'
            }).setOrigin(0, 0.5);

            this.mSubtitle = this.scene.add.text(width / 2 - 16, -16, `${CURRENCY_SYMBOL}${totalRevenue.toLocaleString()} / ${CURRENCY_SYMBOL}${current.targetRevenue.toLocaleString()} (${pct}%)`, {
                fontFamily: 'system-ui, monospace',
                fontSize: '11px',
                fontStyle: 'bold',
                color: '#e2e8f0'
            }).setOrigin(1, 0.5);

            // Progress bar
            const barWidth = width - 32;
            const barBg = this.scene.add.rectangle(-width / 2 + 16, 12, barWidth, 8, 0x0f172a).setOrigin(0, 0.5);
            this.mBarFill = this.scene.add.rectangle(-width / 2 + 16, 12, Math.max(4, barWidth * progressRatio), 8, 0xeab308).setOrigin(0, 0.5);

            this.milestoneContainer.add([bg, this.mTitle, this.mSubtitle, barBg, this.mBarFill]);
        } else {
            const congrats = this.scene.add.text(0, 0, '🏆 Master Supermarket Tycoon — All Milestones Conquered!', {
                fontFamily: 'system-ui, sans-serif',
                fontSize: '13px',
                fontStyle: 'bold',
                color: '#4ade80'
            }).setOrigin(0.5);
            this.milestoneContainer.add([bg, congrats]);
        }

        this.frame.add(this.milestoneContainer);
    }

    createUpgradeCard(upgrade, y, width) {
        const card = this.scene.add.container(0, y);

        const cardBg = this.scene.add.rectangle(0, 0, width, 106, 0x1e293b, 0.95)
            .setStrokeStyle(1.5, 0x475569);

        const currentLvl = this.progression.getUpgradeLevel(upgrade.id);
        const nextConfig = this.progression.getNextLevelConfig(upgrade.id);
        const isMax = currentLvl >= upgrade.maxLevel;

        // Title & Level badge
        const titleText = this.scene.add.text(-width / 2 + 16, -34, `${upgrade.icon} ${upgrade.name}`, {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '14px',
            fontStyle: 'bold',
            color: '#38bdf8'
        }).setOrigin(0, 0.5);

        const lvlBadge = this.scene.add.text(width / 2 - 16, -34, isMax ? 'MAX TIER' : `Level ${currentLvl}/${upgrade.maxLevel}`, {
            fontFamily: 'system-ui, monospace',
            fontSize: '11px',
            fontStyle: 'bold',
            color: isMax ? '#4ade80' : '#fbbf24'
        }).setOrigin(1, 0.5);

        // Description
        const descText = this.scene.add.text(-width / 2 + 16, -14, upgrade.description, {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '11px',
            color: '#94a3b8',
            wordWrap: { width: width - 32 }
        }).setOrigin(0, 0.5);

        // Next Perk Text
        let perkString = '✓ Max level reached — maximum throughput operational.';
        if (nextConfig) {
            perkString = `Next: ${nextConfig.name} (${nextConfig.perkDescription})`;
        }
        const perkText = this.scene.add.text(-width / 2 + 16, 14, perkString, {
            fontFamily: 'system-ui, sans-serif',
            fontSize: '11px',
            fontStyle: 'bold',
            color: isMax ? '#4ade80' : '#cbd5e1'
        }).setOrigin(0, 0.5);

        // Action Button
        const btnContainer = this.scene.add.container(width / 2 - 75, 26);
        const canAfford = nextConfig ? this.economy.canAfford(nextConfig.cost) : false;
        const btnEnabled = !isMax && canAfford;

        const btnBg = this.scene.add.rectangle(0, 0, 126, 30, btnEnabled ? 0x0284c7 : (isMax ? 0x059669 : 0x334155))
            .setStrokeStyle(1.5, btnEnabled ? 0x38bdf8 : (isMax ? 0x34d399 : 0x475569));
        btnBg.setInteractive({ useHandCursor: btnEnabled });

        let labelString = 'MAXED';
        if (isMax) {
            labelString = upgrade.id === 'department_license' ? 'PERMIT ACTIVE' : 'MAXED';
        } else if (nextConfig) {
            labelString = `Upgrade (${CURRENCY_SYMBOL}${nextConfig.cost})`;
        }

        const btnLabel = this.scene.add.text(0, 0, labelString, {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '11px',
            fontStyle: 'bold',
            color: btnEnabled || isMax ? '#ffffff' : '#94a3b8'
        }).setOrigin(0.5);

        btnContainer.add([btnBg, btnLabel]);

        btnBg.on('pointerdown', () => {
            if (isMax) return;
            const res = this.progression.purchaseUpgrade(upgrade.id);
            if (res.success) {
                if (this.saveManager) {
                    this.saveManager.scheduleSave(500);
                }

                // Animate button bounce
                this.scene.tweens.add({
                    targets: btnContainer,
                    scaleX: 1.15,
                    scaleY: 1.15,
                    duration: 90,
                    yoyo: true
                });

                this.refreshUI();
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

        card.add([cardBg, titleText, lvlBadge, descText, perkText, btnContainer]);
        this.frame.add(card);

        this.cardElements.set(upgrade.id, {
            cardBg,
            lvlBadge,
            perkText,
            btnContainer,
            btnBg,
            btnLabel
        });
    }

    refreshUI() {
        const width = this.cardElements.size > 0 ? (this.frame.getBounds().width - 40) : 440;

        for (const [id, upgrade] of Object.entries(UPGRADES)) {
            const els = this.cardElements.get(id);
            if (!els) continue;

            const currentLvl = this.progression.getUpgradeLevel(id);
            const nextConfig = this.progression.getNextLevelConfig(id);
            const isMax = currentLvl >= upgrade.maxLevel;
            const canAfford = nextConfig ? this.economy.canAfford(nextConfig.cost) : false;
            const btnEnabled = !isMax && canAfford;

            els.lvlBadge.setText(isMax ? 'MAX TIER' : `Level ${currentLvl}/${upgrade.maxLevel}`);
            els.lvlBadge.setColor(isMax ? '#4ade80' : '#fbbf24');

            let perkString = '✓ Max level reached — maximum throughput operational.';
            if (nextConfig) {
                perkString = `Next: ${nextConfig.name} (${nextConfig.perkDescription})`;
            }
            els.perkText.setText(perkString);
            els.perkText.setColor(isMax ? '#4ade80' : '#cbd5e1');

            let labelString = 'MAXED';
            if (isMax) {
                labelString = id === 'department_license' ? 'PERMIT ACTIVE' : 'MAXED';
            } else if (nextConfig) {
                labelString = `Upgrade (${CURRENCY_SYMBOL}${nextConfig.cost})`;
            }
            els.btnLabel.setText(labelString);
            els.btnLabel.setColor(btnEnabled || isMax ? '#ffffff' : '#94a3b8');

            els.btnBg.setFillStyle(btnEnabled ? 0x0284c7 : (isMax ? 0x059669 : 0x334155));
            els.btnBg.setStrokeStyle(1.5, btnEnabled ? 0x38bdf8 : (isMax ? 0x34d399 : 0x475569));
            els.btnBg.disableInteractive();
            if (btnEnabled) {
                els.btnBg.setInteractive({ useHandCursor: true });
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
