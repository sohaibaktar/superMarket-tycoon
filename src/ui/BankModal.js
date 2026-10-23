import Phaser from 'phaser';
import { LOAN_TIERS } from '../systems/BankLoanSystem.js';
import { CURRENCY_SYMBOL } from '../data/products.js';

/**
 * BankModal: Touch-friendly UI overlay to manage commercial bank debt,
 * review credit facilities, and repay loans early.
 */
export class BankModal extends Phaser.GameObjects.Container {
    /**
     * @param {Phaser.Scene} scene
     * @param {import('../systems/BankLoanSystem.js').BankLoanSystem} bankLoanSystem
     * @param {import('../systems/EconomySystem.js').EconomySystem} economySystem
     * @param {number} currentDay
     * @param {Function} onClose
     */
    constructor(scene, bankLoanSystem, economySystem, currentDay, onClose) {
        super(scene, 0, 0);

        this.bank = bankLoanSystem;
        this.economy = economySystem;
        this.currentDay = currentDay;
        this.onClose = onClose;

        this.buildModal();
        scene.add.existing(this);
    }

    buildModal() {
        const view = this.scene.scale.getViewPort(this.scene.cameras.main);
        const modalWidth = Math.min(500, view.width - 40);
        const modalHeight = 600;

        // Dark dim backdrop
        this.backdrop = this.scene.add.rectangle(view.centerX, view.centerY, view.width, view.height, 0x000000, 0.65)
            .setInteractive();
        this.add(this.backdrop);

        // Modal Frame
        this.frame = this.scene.add.container(view.centerX, view.centerY);
        this.add(this.frame);

        const bg = this.scene.add.rectangle(0, 0, modalWidth, modalHeight, 0x0f172a, 0.98)
            .setStrokeStyle(2, 0xeab308);

        // Header
        const headerText = this.scene.add.text(0, -modalHeight / 2 + 28, '🏦 Commercial Bank Facility', {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '19px',
            fontStyle: 'bold',
            color: '#fef08a'
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

        this.frame.add([bg, headerText, closeBtn]);

        // Active Loan Banner
        this.buildActiveLoanSection(modalWidth - 40, -modalHeight / 2 + 85);

        // Loan Offerings
        const tiers = Object.values(LOAN_TIERS);
        const startY = -40;
        const spacing = 120;

        tiers.forEach((tier, i) => {
            const cardY = startY + (i * spacing);
            this.createLoanCard(tier, cardY, modalWidth - 40);
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

    buildActiveLoanSection(width, y) {
        this.activeSection = this.scene.add.container(0, y);

        const bg = this.scene.add.rectangle(0, 0, width, 70, 0x1e293b, 0.95)
            .setStrokeStyle(1.5, this.bank.hasActiveLoan ? 0xef4444 : 0x22c55e);

        if (this.bank.hasActiveLoan) {
            const loan = this.bank.activeLoan;
            const title = this.scene.add.text(-width / 2 + 16, -18, `Active Debt: ${loan.name}`, {
                fontFamily: 'system-ui, sans-serif',
                fontSize: '13px',
                fontStyle: 'bold',
                color: '#f87171'
            }).setOrigin(0, 0.5);

            const detail = this.scene.add.text(-width / 2 + 16, 10, `Balance: ${CURRENCY_SYMBOL}${loan.remainingBalance} | Installment: ${CURRENCY_SYMBOL}${loan.dailyPayment}/day (${loan.daysRemaining}d left)`, {
                fontFamily: 'system-ui, monospace',
                fontSize: '11px',
                color: '#e2e8f0'
            }).setOrigin(0, 0.5);

            // Early Payoff Button
            const payoffBtn = this.scene.add.container(width / 2 - 68, 0);
            const canPayoff = this.economy.canAfford(loan.remainingBalance);
            const pBg = this.scene.add.rectangle(0, 0, 110, 30, canPayoff ? 0x059669 : 0x475569)
                .setStrokeStyle(1, 0x34d399);
            pBg.setInteractive({ useHandCursor: canPayoff });

            const pText = this.scene.add.text(0, 0, 'Pay Off Early', {
                fontFamily: 'system-ui, sans-serif',
                fontSize: '11px',
                fontStyle: 'bold',
                color: '#ffffff'
            }).setOrigin(0.5);

            payoffBtn.add([pBg, pText]);

            if (canPayoff) {
                pBg.on('pointerdown', () => {
                    this.bank.repayEarly();
                    this.dismiss();
                });
            }

            this.activeSection.add([bg, title, detail, payoffBtn]);
        } else {
            const cleanText = this.scene.add.text(0, -6, '✓ Zero Debt Outstanding', {
                fontFamily: 'system-ui, sans-serif',
                fontSize: '14px',
                fontStyle: 'bold',
                color: '#4ade80'
            }).setOrigin(0.5);

            const subText = this.scene.add.text(0, 14, 'You have good commercial credit standing to borrow expansion capital.', {
                fontFamily: 'system-ui, sans-serif',
                fontSize: '11px',
                color: '#94a3b8'
            }).setOrigin(0.5);

            this.activeSection.add([bg, cleanText, subText]);
        }

        this.frame.add(this.activeSection);
    }

    createLoanCard(tier, y, width) {
        const card = this.scene.add.container(0, y);

        const isLocked = this.currentDay < tier.unlockDay;
        const hasDebt = this.bank.hasActiveLoan;
        const canApply = !isLocked && !hasDebt;

        const cardBg = this.scene.add.rectangle(0, 0, width, 106, 0x1e293b, 0.95)
            .setStrokeStyle(1.5, canApply ? 0xca8a04 : 0x334155);

        // Title & Principal
        const title = this.scene.add.text(-width / 2 + 16, -34, `${tier.name} — ${CURRENCY_SYMBOL}${tier.principal.toLocaleString()}`, {
            fontFamily: 'system-ui, sans-serif',
            fontSize: '14px',
            fontStyle: 'bold',
            color: isLocked ? '#64748b' : '#fef08a'
        }).setOrigin(0, 0.5);

        // Description
        const desc = this.scene.add.text(-width / 2 + 16, -14, tier.description, {
            fontFamily: 'system-ui, sans-serif',
            fontSize: '11px',
            color: '#cbd5e1',
            wordWrap: { width: width - 32 }
        }).setOrigin(0, 0.5);

        // Terms Pill
        const termsText = isLocked
            ? `🔒 Unlocks on Business Day ${tier.unlockDay}`
            : `Rate: ${Math.round(tier.interestRate * 100)}% | Pay: ${CURRENCY_SYMBOL}${tier.dailyPayment}/day | Term: ${tier.termDays} days`;

        const terms = this.scene.add.text(-width / 2 + 16, 16, termsText, {
            fontFamily: 'system-ui, monospace',
            fontSize: '11px',
            fontStyle: 'bold',
            color: isLocked ? '#ef4444' : '#38bdf8'
        }).setOrigin(0, 0.5);

        // Apply Button
        const btnContainer = this.scene.add.container(width / 2 - 70, 26);
        const btnBg = this.scene.add.rectangle(0, 0, 114, 30, canApply ? 0xb45309 : 0x334155)
            .setStrokeStyle(1.5, canApply ? 0xfbbf24 : 0x475569);
        btnBg.setInteractive({ useHandCursor: canApply });

        const btnLabel = this.scene.add.text(0, 0, canApply ? 'Borrow Now' : (isLocked ? 'Locked' : 'Debt Active'), {
            fontFamily: 'system-ui, sans-serif',
            fontSize: '12px',
            fontStyle: 'bold',
            color: canApply ? '#ffffff' : '#94a3b8'
        }).setOrigin(0.5);

        btnContainer.add([btnBg, btnLabel]);

        if (canApply) {
            btnBg.on('pointerdown', () => {
                const res = this.bank.applyForLoan(tier.id, this.currentDay);
                if (res.success) {
                    this.dismiss();
                }
            });
        }

        card.add([cardBg, title, desc, terms, btnContainer]);
        this.frame.add(card);
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
