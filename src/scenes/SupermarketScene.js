import { Scene } from 'phaser';
import { ShelfDisplay } from '../ui/ShelfDisplay.js';
import { PRODUCTS } from '../data/products.js';

export class SupermarketScene extends Scene {
    constructor() {
        super('SupermarketScene');
    }

    create() {
        // Retrieve global domain systems from registry (initialized in Boot.js)
        this.economy = this.registry.get('economySystem');
        this.inventory = this.registry.get('inventorySystem');

        // Create main store container so the whole market scales & centers cleanly
        this.storeContainer = this.add.container(0, 0);

        this.buildSupermarketEnvironment();
        this.buildShelves();
        this.buildCheckoutCounter();
        this.buildEntranceAndDecor();

        // Responsive positioning
        this.layoutStore();
        this.scale.on('resize', this.layoutStore, this);

        // Bring HUD UI to top
        this.scene.bringToTop('UI');

        // Initial welcome feedback to guide player
        const uiScene = this.scene.get('UI');
        if (uiScene && uiScene.showToast) {
            uiScene.showToast('Welcome to Mini Mart! Tap shelves to restock products.');
        }
    }

    buildSupermarketEnvironment() {
        // Base store dimensions (820 width x 1180 height design viewport)
        const storeWidth = 820;
        const storeHeight = 1180;

        // Store Floor Background Tiling
        this.floorTile = this.add.tileSprite(storeWidth / 2, storeHeight / 2, storeWidth - 40, storeHeight - 120, 'supermarket-tile');
        this.storeContainer.add(this.floorTile);

        // Store perimeter border
        this.storeBorder = this.add.rectangle(storeWidth / 2, storeHeight / 2, storeWidth - 36, storeHeight - 116)
            .setStrokeStyle(3, 0x0284c7, 0.4);
        this.storeContainer.add(this.storeBorder);

        // Aisle Runners (Guide pathways for customers and players)
        // Left Aisle Runner
        this.leftAisle = this.add.tileSprite(200, 560, 90, 680, 'aisle-runner');
        // Right Aisle Runner
        this.rightAisle = this.add.tileSprite(620, 560, 90, 680, 'aisle-runner');
        // Center Crossing Aisle
        this.centerCross = this.add.tileSprite(410, 560, 480, 80, 'aisle-runner');

        this.storeContainer.add([this.leftAisle, this.rightAisle, this.centerCross]);

        // Top Store Signboard Banner
        this.banner = this.add.image(storeWidth / 2, 100, 'store-banner').setOrigin(0.5);
        this.storeContainer.add(this.banner);
    }

    buildShelves() {
        this.shelves = [];

        const uiScene = this.scene.get('UI');
        const feedbackCallback = (msg, type) => {
            if (uiScene && uiScene.showToast) {
                uiScene.showToast(msg, type);
            }
        };

        // Layout: Left column and Right column of shelves
        // Left: Apples (Top), Bread (Middle), Snacks (Bottom)
        // Right: Milk (Top), Rice (Middle)
        const shelfConfigs = [
            { id: 'apples', x: 230, y: 260 },
            { id: 'milk', x: 590, y: 260 },
            { id: 'bread', x: 230, y: 430 },
            { id: 'rice', x: 590, y: 430 },
            { id: 'snacks', x: 230, y: 600 }
        ];

        for (const config of shelfConfigs) {
            const shelf = new ShelfDisplay(
                this,
                config.x,
                config.y,
                config.id,
                this.inventory,
                this.economy,
                feedbackCallback
            );
            this.storeContainer.add(shelf);
            this.shelves.push(shelf);
        }
    }

    buildCheckoutCounter() {
        // Checkout Section in the lower portion of the store
        this.checkoutDesk = this.add.image(560, 820, 'checkout-counter').setOrigin(0.5);
        this.storeContainer.add(this.checkoutDesk);

        // Queue Line: 4 designated waiting spots for upcoming Customer AI
        this.queueSpots = [];
        const queueStartX = 380;
        const queueSpacing = 65;
        const queueY = 820;

        for (let i = 0; i < 4; i++) {
            const spotX = queueStartX - (i * queueSpacing);
            const spot = this.add.image(spotX, queueY, 'queue-spot').setOrigin(0.5);

            const numText = this.add.text(spotX, queueY, `${i + 1}`, {
                fontFamily: 'monospace',
                fontSize: '13px',
                fontStyle: 'bold',
                color: '#0284c7'
            }).setOrigin(0.5);

            this.storeContainer.add([spot, numText]);
            this.queueSpots.push({ x: spotX, y: queueY });
        }

        // Cashier Staff Marker (Idle animation placeholder for staff)
        this.cashierMarker = this.add.circle(560, 750, 16, 0x0284c7);
        const cashierLabel = this.add.text(560, 750, 'Staff', {
            fontFamily: 'sans-serif',
            fontSize: '10px',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5);
        this.storeContainer.add([this.cashierMarker, cashierLabel]);

        // Idle breathing tween for cashier
        this.tweens.add({
            targets: this.cashierMarker,
            scaleY: 1.1,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    buildEntranceAndDecor() {
        // Store Entrance at bottom center
        this.entranceMat = this.add.image(410, 1040, 'entrance-mat').setOrigin(0.5);
        this.storeContainer.add(this.entranceMat);

        // Store Tip / Quick Tutorial Hint
        this.hintBox = this.add.container(410, 940);
        const hintBg = this.add.rectangle(0, 0, 480, 42, 0xffffff, 0.95)
            .setStrokeStyle(1.5, 0x93c5fd);
        const hintText = this.add.text(0, 0, '💡 Tip: Keep shelves stocked so arriving customers can buy!', {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '13px',
            fontStyle: 'bold',
            color: '#0369a1'
        }).setOrigin(0.5);

        this.hintBox.add([hintBg, hintText]);
        this.storeContainer.add(this.hintBox);
    }

    layoutStore() {
        const width = this.scale.width;
        const height = this.scale.height;

        // Base game virtual resolution
        const baseWidth = 820;
        const baseHeight = 1180;

        // Calculate uniform scale factor to fit viewport while maintaining aspect ratio
        const scale = Math.min(width / baseWidth, height / baseHeight);

        this.storeContainer.setScale(scale);

        // Center container in window
        this.storeContainer.x = (width - (baseWidth * scale)) / 2;
        this.storeContainer.y = (height - (baseHeight * scale)) / 2;
    }
}
