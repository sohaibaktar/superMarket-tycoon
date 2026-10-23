import { PRODUCTS, CURRENCY_SYMBOL } from '../data/products.js';

/**
 * ShelfDisplay: Touch-friendly UI component representing a product shelf in the supermarket.
 * Features stock gauge, pricing, and atomic restock action with tap animations.
 */
export class ShelfDisplay extends Phaser.GameObjects.Container {
    /**
     * @param {Phaser.Scene} scene
     * @param {number} x
     * @param {number} y
     * @param {string} productId
     * @param {import('../systems/InventorySystem.js').InventorySystem} inventorySystem
     * @param {import('../systems/EconomySystem.js').EconomySystem} economySystem
     * @param {Function} [onRestockFeedback] Callback to trigger HUD feedback
     */
    constructor(scene, x, y, productId, inventorySystem, economySystem, onRestockFeedback) {
        super(scene, x, y);

        this.productId = productId;
        this.product = PRODUCTS[productId];
        this.inventory = inventorySystem;
        this.economy = economySystem;
        this.dayCycle = scene.registry.get('dayCycleSystem');
        this.progression = scene.registry.get('progressionSystem');
        this.onFeedback = onRestockFeedback;

        this.createComponents();
        this.updateLockState();
        this.updateStockDisplay();

        // Listen for external inventory updates
        this._unsubscribe = this.inventory.subscribe((event) => {
            if (event.productId === this.productId || event.type === 'restore' || event.type === 'capacity_change') {
                this.updateStockDisplay();
            }
        });

        // Listen for progression upgrades (permits, capacity)
        if (this.progression) {
            this._unsubscribeProgression = this.progression.subscribe((event) => {
                if (event.type === 'upgrade_purchased') {
                    this.updateLockState();
                    this.updateStockDisplay();
                }
            });
        }

        scene.add.existing(this);
    }

    createComponents() {
        const p = this.product;

        // Shelf base unit graphic
        this.shelfSprite = this.scene.add.image(0, 0, 'shelf-unit').setOrigin(0.5);
        this.add(this.shelfSprite);

        // Product Icon
        this.prodIcon = this.scene.add.image(-70, -18, `prod-${p.id}`).setOrigin(0.5);
        this.add(this.prodIcon);

        // Product Name
        this.titleText = this.scene.add.text(-38, -32, p.displayName, {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '16px',
            fontStyle: 'bold',
            color: '#0f172a'
        }).setOrigin(0, 0.5);
        this.add(this.titleText);

        // Price Tag: "Cost: ₹5 | Price: ₹10"
        this.priceText = this.scene.add.text(-38, -13, `Cost: ${CURRENCY_SYMBOL}${p.restockCost} | Sell: ${CURRENCY_SYMBOL}${p.sellPrice}`, {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '13px',
            fontStyle: 'bold',
            color: '#475569'
        }).setOrigin(0, 0.5);
        this.add(this.priceText);

        // Capacity Bar Background
        this.barBg = this.scene.add.rectangle(-38, 5, 130, 9, 0xe2e8f0).setOrigin(0, 0.5);
        this.add(this.barBg);

        // Capacity Bar Fill
        this.barFill = this.scene.add.rectangle(-38, 5, 130, 9, p.color).setOrigin(0, 0.5);
        this.add(this.barFill);

        // Stock label text
        this.stockText = this.scene.add.text(98, 5, '0/0', {
            fontFamily: 'system-ui, monospace',
            fontSize: '12px',
            fontStyle: 'bold',
            color: '#1e293b'
        }).setOrigin(1, 0.5);
        this.add(this.stockText);

        // Restock Button Container (Touch Target > 48px height)
        this.restockBtn = this.scene.add.container(0, 36);

        const restockQty = 5;
        this.restockQty = restockQty;
        this.restockCost = restockQty * p.restockCost;

        this.btnBg = this.scene.add.rectangle(0, 0, 192, 36, 0x0284c7, 1)
            .setStrokeStyle(1.5, 0x38bdf8);
        this.btnBg.setInteractive({ useHandCursor: true });

        this.btnText = this.scene.add.text(0, 0, `+${restockQty} Restock (${CURRENCY_SYMBOL}${this.restockCost})`, {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '14px',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.restockBtn.add([this.btnBg, this.btnText]);
        this.add(this.restockBtn);

        // Hover & Tap Micro-Interactions
        this.btnBg.on('pointerover', () => {
            if (!this.isLocked) {
                this.btnBg.setFillStyle(0x0369a1);
            }
        });

        this.btnBg.on('pointerout', () => {
            if (!this.isLocked) {
                this.btnBg.setFillStyle(0x0284c7);
            }
        });

        this.btnBg.on('pointerdown', () => {
            this.scene.tweens.add({
                targets: this.restockBtn,
                scaleX: 0.94,
                scaleY: 0.94,
                duration: 70,
                yoyo: true
            });

            this.handleRestock(this.restockQty);
        });
    }

    get isLocked() {
        if (this.productId === 'rice') {
            return !this.progression || !this.progression.isRiceDepartmentUnlocked;
        }
        return false;
    }

    updateLockState() {
        if (!this.btnBg || !this.btnText) return;

        if (this.isLocked) {
            this.btnBg.setFillStyle(0x334155);
            this.btnBg.setStrokeStyle(1.5, 0x475569);
            this.btnText.setText('🔒 Permit Required');
            this.btnText.setFontSize('13px');
            this.btnText.setColor('#94a3b8');
        } else {
            this.btnBg.setFillStyle(0x0284c7);
            this.btnBg.setStrokeStyle(1.5, 0x38bdf8);
            this.btnText.setText(`+${this.restockQty} Restock (${CURRENCY_SYMBOL}${this.restockCost})`);
            this.btnText.setFontSize('14px');
            this.btnText.setColor('#ffffff');
        }
    }

    handleRestock(quantity) {
        if (this.isLocked) {
            this.showFloatingText('Permit Needed!', '#ef4444');
            if (this.onFeedback) {
                this.onFeedback('Unlock Jasmine Rice Gourmet Permit in Upgrades (₹200)!', 'error');
            }
            return;
        }

        const result = this.inventory.restock(this.productId, quantity);

        if (result.success) {
            // Visual bounce on product icon
            this.scene.tweens.add({
                targets: this.prodIcon,
                scaleX: 1.25,
                scaleY: 1.25,
                y: -24,
                duration: 120,
                yoyo: true
            });

            // Floating +Quantity Text
            this.showFloatingText(`+${result.added} (${this.product.shortName})`, '#16a34a');

            if (this.dayCycle) {
                this.dayCycle.recordRestockExpense(result.cost);
            }

            const saveManager = this.scene.registry.get('saveManager');
            if (saveManager) {
                saveManager.scheduleSave(2500);
            }

            if (this.onFeedback) {
                this.onFeedback(`Restocked ${result.added} ${this.product.displayName}! (-${CURRENCY_SYMBOL}${result.cost})`, 'success');
            }
        } else {
            // Shake button on failure
            this.scene.tweens.add({
                targets: this.restockBtn,
                x: 6,
                duration: 40,
                yoyo: true,
                repeat: 3,
                onComplete: () => {
                    this.restockBtn.x = 0;
                }
            });

            let msg = 'Cannot restock!';
            if (result.reason === 'insufficient_funds') {
                msg = `Need ${CURRENCY_SYMBOL}${result.cost} to restock!`;
            } else if (result.reason === 'shelf_full') {
                msg = 'Shelf is full!';
            }

            this.showFloatingText(msg, '#dc2626');

            if (this.onFeedback) {
                this.onFeedback(msg, 'error');
            }
        }
    }

    showFloatingText(message, colorHex) {
        const floatText = this.scene.add.text(0, -10, message, {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '13px',
            fontStyle: 'bold',
            color: colorHex,
            stroke: '#ffffff',
            strokeThickness: 3
        }).setOrigin(0.5);

        this.add(floatText);

        this.scene.tweens.add({
            targets: floatText,
            y: -50,
            alpha: 0,
            duration: 900,
            ease: 'Power1',
            onComplete: () => {
                floatText.destroy();
            }
        });
    }

    updateStockDisplay() {
        const stock = this.inventory.getStock(this.productId);
        const capacity = this.inventory.getCapacity(this.productId);
        const ratio = capacity > 0 ? Math.min(1, Math.max(0, stock / capacity)) : 0;

        this.stockText.setText(`${stock}/${capacity}`);

        const totalWidth = 130;
        this.barFill.width = Math.max(2, totalWidth * ratio);

        // Color coding based on stock level
        if (ratio <= 0.2) {
            this.barFill.setFillStyle(0xef4444); // Red warning
        } else if (ratio <= 0.5) {
            this.barFill.setFillStyle(0xf59e0b); // Amber medium
        } else {
            this.barFill.setFillStyle(this.product.color); // Product primary color
        }
    }

    destroy(fromScene) {
        if (this._unsubscribe) {
            this._unsubscribe();
        }
        if (this._unsubscribeProgression) {
            this._unsubscribeProgression();
        }
        super.destroy(fromScene);
    }
}
