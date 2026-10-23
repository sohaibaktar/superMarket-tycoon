import { PRODUCTS } from '../data/products.js';

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
        this.onFeedback = onRestockFeedback;

        this.createComponents();
        this.updateStockDisplay();

        // Listen for external inventory updates
        this._unsubscribe = this.inventory.subscribe((event) => {
            if (event.productId === this.productId || event.type === 'restore') {
                this.updateStockDisplay();
            }
        });

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
            fontSize: '15px',
            fontStyle: 'bold',
            color: '#1e293b'
        }).setOrigin(0, 0.5);
        this.add(this.titleText);

        // Price Tag: "Cost: $5 | Price: $10"
        this.priceText = this.scene.add.text(-38, -14, `Cost: $${p.restockCost} | Sell: $${p.sellPrice}`, {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '12px',
            color: '#64748b'
        }).setOrigin(0, 0.5);
        this.add(this.priceText);

        // Capacity Bar Background
        this.barBg = this.scene.add.rectangle(-38, 4, 130, 8, 0xe2e8f0).setOrigin(0, 0.5);
        this.add(this.barBg);

        // Capacity Bar Fill
        this.barFill = this.scene.add.rectangle(-38, 4, 130, 8, p.color).setOrigin(0, 0.5);
        this.add(this.barFill);

        // Stock label text
        this.stockText = this.scene.add.text(98, 4, '0/0', {
            fontFamily: 'monospace',
            fontSize: '11px',
            fontStyle: 'bold',
            color: '#334155'
        }).setOrigin(1, 0.5);
        this.add(this.stockText);

        // Restock Button Container (Touch Target > 48px height)
        this.restockBtn = this.scene.add.container(0, 36);

        const restockQty = 5;
        const restockCost = restockQty * p.restockCost;

        const btnBg = this.scene.add.rectangle(0, 0, 190, 34, 0x0284c7, 1)
            .setStrokeStyle(1.5, 0x38bdf8);
        btnBg.setInteractive({ useHandCursor: true });

        const btnText = this.scene.add.text(0, 0, `+${restockQty} Restock ($${restockCost})`, {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '13px',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.restockBtn.add([btnBg, btnText]);
        this.add(this.restockBtn);

        // Hover & Tap Micro-Interactions
        btnBg.on('pointerover', () => {
            btnBg.setFillStyle(0x0369a1);
        });

        btnBg.on('pointerout', () => {
            btnBg.setFillStyle(0x0284c7);
        });

        btnBg.on('pointerdown', () => {
            this.scene.tweens.add({
                targets: this.restockBtn,
                scaleX: 0.94,
                scaleY: 0.94,
                duration: 70,
                yoyo: true
            });

            this.handleRestock(restockQty);
        });
    }

    handleRestock(quantity) {
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

            if (this.onFeedback) {
                this.onFeedback(`Restocked ${result.added} ${this.product.displayName}! (-$${result.cost})`, 'success');
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
                msg = `Need $${result.cost} to restock!`;
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
        super.destroy(fromScene);
    }
}
