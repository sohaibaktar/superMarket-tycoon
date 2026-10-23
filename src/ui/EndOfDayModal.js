import Phaser from 'phaser';
import { CURRENCY_SYMBOL } from '../data/products.js';

/**
 * EndOfDayModal: Displays the Profit & Loss statement at the end of each business day.
 */
export class EndOfDayModal extends Phaser.GameObjects.Container {
    /**
     * @param {Phaser.Scene} scene
     * @param {object} summary
     * @param {number} currentCoins
     * @param {Function} onStartNextDay
     */
    constructor(scene, summary, currentCoins, onStartNextDay) {
        super(scene, 0, 0);

        this.summary = summary;
        this.currentCoins = currentCoins;
        this.onStartNextDay = onStartNextDay;

        this.buildModal();
        scene.add.existing(this);
    }

    buildModal() {
        const view = this.scene.scale.getViewPort(this.scene.cameras.main);
        const modalWidth = 440;
        const modalHeight = 520;

        // Dark dim backdrop
        this.backdrop = this.scene.add.rectangle(view.centerX, view.centerY, view.width, view.height, 0x000000, 0.75)
            .setInteractive();
        this.add(this.backdrop);

        // Frame with adaptive mobile scaling
        this.frame = this.scene.add.container(view.centerX, view.centerY);
        const modalScale = Math.min(
            1,
            (view.width - 20) / modalWidth,
            (view.height - 24) / modalHeight
        );
        this.frame.setScale(modalScale);
        this.add(this.frame);

        const bg = this.scene.add.rectangle(0, 0, modalWidth, modalHeight, 0x0f172a, 0.98)
            .setStrokeStyle(2, 0x38bdf8);

        // Header Title
        const title = this.scene.add.text(0, -modalHeight / 2 + 35, `🌙 Business Day ${this.summary.day} Closed`, {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '22px',
            fontStyle: 'bold',
            color: '#f8fafc'
        }).setOrigin(0.5);

        const subtitle = this.scene.add.text(0, -modalHeight / 2 + 65, 'Daily Profit & Loss (P&L) Statement', {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '13px',
            color: '#94a3b8'
        }).setOrigin(0.5);

        this.frame.add([bg, title, subtitle]);

        // Ledger Items
        const rows = [
            { label: 'Gross Sales Revenue', value: `+${CURRENCY_SYMBOL}${this.summary.revenue}`, color: '#4ade80' },
            { label: 'Wholesale Restock Costs', value: `-${CURRENCY_SYMBOL}${this.summary.restockCost}`, color: '#f87171' },
            { label: 'Marketing Campaigns', value: `-${CURRENCY_SYMBOL}${this.summary.marketingCost}`, color: '#f87171' },
            { label: 'Bank Debt Service', value: `-${CURRENCY_SYMBOL}${this.summary.loanPayment}`, color: '#fb923c' }
        ];

        let startY = -120;
        const rowHeight = 36;
        const halfW = modalWidth / 2 - 32;

        rows.forEach((row, i) => {
            const rowY = startY + (i * rowHeight);
            const lbl = this.scene.add.text(-halfW, rowY, row.label, {
                fontFamily: 'system-ui, sans-serif',
                fontSize: '14px',
                color: '#cbd5e1'
            }).setOrigin(0, 0.5);

            const val = this.scene.add.text(halfW, rowY, row.value, {
                fontFamily: 'system-ui, monospace',
                fontSize: '14px',
                fontStyle: 'bold',
                color: row.color
            }).setOrigin(1, 0.5);

            this.frame.add([lbl, val]);
        });

        // Divider
        const dividerY = startY + (rows.length * rowHeight) + 10;
        const divider = this.scene.add.rectangle(0, dividerY, modalWidth - 60, 2, 0x334155);
        this.frame.add(divider);

        // Net Profit Row
        const isProfitable = this.summary.netProfit >= 0;
        const profitY = dividerY + 30;

        const netLabel = this.scene.add.text(-halfW, profitY, 'Net Operating Profit', {
            fontFamily: 'system-ui, sans-serif',
            fontSize: '16px',
            fontStyle: 'bold',
            color: '#f8fafc'
        }).setOrigin(0, 0.5);

        const netVal = this.scene.add.text(halfW, profitY, `${isProfitable ? '+' : ''}${CURRENCY_SYMBOL}${this.summary.netProfit}`, {
            fontFamily: 'system-ui, monospace',
            fontSize: '18px',
            fontStyle: 'bold',
            color: isProfitable ? '#22c55e' : '#ef4444'
        }).setOrigin(1, 0.5);

        // Closing Balance
        const balanceY = profitY + 36;
        const balLabel = this.scene.add.text(-halfW, balanceY, 'Cash in Register', {
            fontFamily: 'system-ui, sans-serif',
            fontSize: '14px',
            color: '#94a3b8'
        }).setOrigin(0, 0.5);

        const balVal = this.scene.add.text(halfW, balanceY, `${CURRENCY_SYMBOL}${this.currentCoins.toLocaleString()}`, {
            fontFamily: 'system-ui, monospace',
            fontSize: '16px',
            fontStyle: 'bold',
            color: '#fef08a'
        }).setOrigin(1, 0.5);

        this.frame.add([netLabel, netVal, balLabel, balVal]);

        // Next Day Button
        const nextDayNum = this.summary.day + 1;
        const btnContainer = this.scene.add.container(0, modalHeight / 2 - 50);

        const btnBg = this.scene.add.rectangle(0, 0, modalWidth - 60, 48, 0x059669)
            .setStrokeStyle(2, 0x34d399);
        btnBg.setInteractive({ useHandCursor: true });

        const btnText = this.scene.add.text(0, 0, `☀️ OPEN STORE FOR DAY ${nextDayNum}`, {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '16px',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5);

        btnContainer.add([btnBg, btnText]);

        btnBg.on('pointerover', () => btnBg.setFillStyle(0x047857));
        btnBg.on('pointerout', () => btnBg.setFillStyle(0x059669));

        btnBg.on('pointerdown', () => {
            this.scene.tweens.add({
                targets: btnContainer,
                scaleX: 0.95,
                scaleY: 0.95,
                duration: 70,
                yoyo: true,
                onComplete: () => {
                    this.dismiss();
                }
            });
        });

        this.frame.add(btnContainer);

        // Entrance scale tween
        this.frame.setScale(0.8);
        this.frame.setAlpha(0);
        this.scene.tweens.add({
            targets: this.frame,
            scaleX: 1,
            scaleY: 1,
            alpha: 1,
            duration: 200,
            ease: 'Back.easeOut'
        });
    }

    dismiss() {
        this.scene.tweens.add({
            targets: this.frame,
            scaleX: 0.85,
            scaleY: 0.85,
            alpha: 0,
            duration: 140,
            onComplete: () => {
                if (this.onStartNextDay) this.onStartNextDay();
                this.destroy();
            }
        });
    }
}
