import { Scene } from 'phaser';
import { ShelfDisplay } from '../ui/ShelfDisplay.js';
import { CustomerSprite } from '../gameobjects/CustomerSprite.js';
import { PRODUCTS, CURRENCY_SYMBOL } from '../data/products.js';

export class SupermarketScene extends Scene {
    constructor() {
        super('SupermarketScene');
    }

    create() {
        // Retrieve global domain systems from registry
        this.economy = this.registry.get('economySystem');
        this.inventory = this.registry.get('inventorySystem');
        this.checkout = this.registry.get('checkoutSystem');
        this.customers = this.registry.get('customerSystem');
        this.dayCycle = this.registry.get('dayCycleSystem');
        this.marketing = this.registry.get('marketingSystem');
        this.bank = this.registry.get('bankLoanSystem');
        this.progression = this.registry.get('progressionSystem');
        this.saveManager = this.registry.get('saveManager');

        // Customer sprite lookup & pathing definitions
        this.customerSprites = new Map();
        this.isProcessingCheckout = false;

        this.entrancePos = { x: 410, y: 1040 };
        this.exitPos = { x: 340, y: 1090 };

        this.shelfLocations = {
            apples: { x: 230, y: 260, approachX: 310, approachY: 260 },
            milk: { x: 590, y: 260, approachX: 510, approachY: 260 },
            bread: { x: 230, y: 430, approachX: 310, approachY: 430 },
            rice: { x: 590, y: 430, approachX: 510, approachY: 430 },
            snacks: { x: 230, y: 600, approachX: 310, approachY: 600 }
        };

        // Create main store container so everything scales & centers responsively
        this.storeContainer = this.add.container(0, 0);

        this.buildSupermarketEnvironment();
        this.buildShelves();
        this.buildCheckoutCounter();
        this.buildEntranceAndDecor();

        // Customer AI system events
        this.setupCustomerSystemEvents();

        // Dynamic Spawning loop responsive to marketing footfall boosts
        this.scheduleNextSpawn();

        // Responsive positioning
        this.layoutStore();
        this.scale.on('resize', this.layoutStore, this);

        // Bring HUD UI to top
        this.scene.bringToTop('UI');

        // Guide prompt in HUD
        const uiScene = this.scene.get('UI');
        if (uiScene && uiScene.showToast) {
            uiScene.showToast('Shoppers are arriving! Keep shelves stocked to earn revenue.', 'info');
        }
    }

    buildSupermarketEnvironment() {
        const storeWidth = 820;
        const storeHeight = 1180;

        // Store Floor Background Tiling
        this.floorTile = this.add.tileSprite(storeWidth / 2, storeHeight / 2, storeWidth - 40, storeHeight - 120, 'supermarket-tile');
        this.storeContainer.add(this.floorTile);

        // Store perimeter border
        this.storeBorder = this.add.rectangle(storeWidth / 2, storeHeight / 2, storeWidth - 36, storeHeight - 116)
            .setStrokeStyle(3, 0x0284c7, 0.4);
        this.storeContainer.add(this.storeBorder);

        // Aisle Runners
        this.leftAisle = this.add.tileSprite(200, 560, 90, 680, 'aisle-runner');
        this.rightAisle = this.add.tileSprite(620, 560, 90, 680, 'aisle-runner');
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
        this.checkoutDesk = this.add.image(560, 820, 'checkout-counter').setOrigin(0.5);
        this.storeContainer.add(this.checkoutDesk);

        // Queue Line: 4 designated waiting spots
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

        // Cashier Staff Marker
        this.cashierMarker = this.add.circle(560, 750, 16, 0x0284c7);
        const cashierLabel = this.add.text(560, 750, 'Staff', {
            fontFamily: 'sans-serif',
            fontSize: '10px',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5);
        this.storeContainer.add([this.cashierMarker, cashierLabel]);

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
        this.entranceMat = this.add.image(410, 1040, 'entrance-mat').setOrigin(0.5);
        this.storeContainer.add(this.entranceMat);

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

    setupCustomerSystemEvents() {
        // Listen to queue shifts to step customers forward in line
        this._unsubscribeCustomerSystem = this.customers.subscribe((event) => {
            if (event.type === 'queue_shifted') {
                for (let i = 0; i < this.customers._maxQueue; i++) {
                    const cust = this.customers.getCustomerAtQueueSpot(i);
                    if (cust && this.customerSprites.has(cust.id)) {
                        const sprite = this.customerSprites.get(cust.id);
                        const targetSpot = this.queueSpots[i];
                        sprite.walkTo(targetSpot.x, targetSpot.y, 650, () => {
                            if (i === 0) {
                                this.scheduleFrontCheckout();
                            }
                        });
                    }
                }
            }
        });
    }

    scheduleNextSpawn() {
        const multiplier = this.marketing ? this.marketing.currentFootfallMultiplier : 1.0;
        const delay = Math.max(1200, Math.floor(3800 / multiplier));
        this.spawnTimer = this.time.delayedCall(delay, () => {
            this.trySpawnCustomer();
            this.scheduleNextSpawn();
        });
    }

    trySpawnCustomer() {
        // Stop spawning new customers if store is closed for the night
        if (this.dayCycle && !this.dayCycle.isDayActive) return;

        const customer = this.customers.spawnCustomer();
        if (!customer) return;

        // If marketing campaign has basket bonus, add extra desired items
        if (this.marketing && this.marketing.basketBonus > 0) {
            let allProducts = Object.keys(PRODUCTS);
            if (this.progression && !this.progression.isRiceDepartmentUnlocked) {
                allProducts = allProducts.filter(id => id !== 'rice');
            }
            const extraCount = Math.min(this.marketing.basketBonus, allProducts.length - customer.desiredProductIds.length);
            for (let i = 0; i < extraCount; i++) {
                const unpicked = allProducts.find(p => !customer.desiredProductIds.includes(p));
                if (unpicked) customer.desiredProductIds.push(unpicked);
            }
        }

        // Instantiate visual customer at entrance
        const sprite = new CustomerSprite(this, this.entrancePos.x, this.entrancePos.y, customer);
        this.storeContainer.add(sprite);
        this.customerSprites.set(customer.id, sprite);

        // Walk inside to center aisle first
        sprite.walkTo(410, 800, 1000, () => {
            this.routeCustomerShopping(customer, sprite);
        });
    }

    routeCustomerShopping(customer, sprite) {
        if (!customer || !sprite) return;

        const targetProductId = customer.currentTargetProductId;

        if (targetProductId && this.shelfLocations[targetProductId]) {
            const loc = this.shelfLocations[targetProductId];
            sprite.showThought(targetProductId);

            // Walk to shelf approach point
            sprite.walkTo(loc.approachX, loc.approachY, 1400, () => {
                // Arrived at shelf: attempt to take item
                this.time.delayedCall(500, () => {
                    const res = this.customers.tryTakeItem(customer.id, targetProductId);

                    if (res.success) {
                        sprite.updateBasket(customer.totalItemCount);
                        // Quick shelf punch animation
                        const shelf = this.shelves.find(s => s.productId === targetProductId);
                        if (shelf) {
                            this.tweens.add({
                                targets: shelf.prodIcon,
                                scaleX: 1.2,
                                scaleY: 1.2,
                                duration: 100,
                                yoyo: true
                            });
                        }
                    } else {
                        // Product out of stock!
                        sprite.showDisappointed();
                    }

                    // Advance target and continue shopping after brief pause
                    this.time.delayedCall(600, () => {
                        customer.advanceTarget();
                        this.routeCustomerShopping(customer, sprite);
                    });
                });
            });
        } else {
            // Customer finished browsing all items on their shopping list
            if (customer.totalItemCount > 0) {
                // Proceed to checkout queue
                this.routeCustomerToQueue(customer, sprite);
            } else {
                // All desired items were out of stock! Customer leaves disappointed
                sprite.showDisappointed();
                this.time.delayedCall(700, () => {
                    this.routeCustomerToExit(customer, sprite);
                });
            }
        }
    }

    routeCustomerToQueue(customer, sprite) {
        const joinRes = this.customers.joinQueue(customer.id);

        if (!joinRes.success) {
            // Queue is full! Customer is impatient and leaves
            sprite.showDisappointed();
            const uiScene = this.scene.get('UI');
            if (uiScene && uiScene.showToast) {
                uiScene.showToast('Checkout queue is full! A customer left.', 'error');
            }
            this.time.delayedCall(600, () => {
                this.routeCustomerToExit(customer, sprite);
            });
            return;
        }

        sprite.hideThought();
        const targetSpot = this.queueSpots[joinRes.spotIndex];

        sprite.walkTo(targetSpot.x, targetSpot.y, 1100, () => {
            if (joinRes.spotIndex === 0) {
                this.scheduleFrontCheckout();
            }
        });
    }

    scheduleFrontCheckout() {
        if (this.isProcessingCheckout) return;

        const delay = this.progression ? this.progression.getCheckoutDelayMs() : 900;
        this.time.delayedCall(delay, () => {
            this.processFrontCheckout();
        });
    }

    processFrontCheckout() {
        const frontCustomer = this.customers.getCustomerAtQueueSpot(0);
        if (!frontCustomer || this.isProcessingCheckout) return;

        this.isProcessingCheckout = true;

        // Cashier scan animation & sound
        this.tweens.add({
            targets: this.cashierMarker,
            scaleX: 1.3,
            scaleY: 1.3,
            duration: 120,
            yoyo: true
        });

        try {
            this.sound.play('throw', { volume: 0.5 });
        } catch (e) {
            // Audio error safety
        }

        const serveRes = this.customers.serveFrontOfQueue();

        if (serveRes.success && serveRes.customer) {
            const customer = serveRes.customer;
            const sprite = this.customerSprites.get(customer.id);

            // Record revenue in daily ledger
            if (this.dayCycle) {
                this.dayCycle.recordRevenue(serveRes.total);
            }

            // Record cumulative revenue for progression milestones
            if (this.progression) {
                this.progression.recordRevenue(serveRes.total);
            }

            // Periodic auto-save debounced
            if (this.saveManager) {
                this.saveManager.scheduleSave(2500);
            }

            if (sprite) {
                sprite.showHeart();
            }

            // Floating coin popup above register
            this.showRegisterPopup(`+${CURRENCY_SYMBOL}${serveRes.total}`);

            // Toast in HUD
            const uiScene = this.scene.get('UI');
            if (uiScene && uiScene.showToast) {
                uiScene.showToast(`Sold goods for +${CURRENCY_SYMBOL}${serveRes.total}!`, 'success');
            }

            // Exit store
            this.time.delayedCall(700, () => {
                if (sprite) {
                    this.routeCustomerToExit(customer, sprite);
                }
                this.isProcessingCheckout = false;
            });
        } else {
            this.isProcessingCheckout = false;
        }
    }

    showRegisterPopup(text) {
        const popup = this.add.text(560, 780, text, {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '18px',
            fontStyle: 'bold',
            color: '#22c55e',
            stroke: '#ffffff',
            strokeThickness: 3
        }).setOrigin(0.5);

        this.storeContainer.add(popup);

        this.tweens.add({
            targets: popup,
            y: 730,
            scaleX: 1.25,
            scaleY: 1.25,
            alpha: 0,
            duration: 1000,
            ease: 'Power1',
            onComplete: () => {
                popup.destroy();
            }
        });
    }

    routeCustomerToExit(customer, sprite) {
        if (!sprite) return;

        sprite.walkTo(this.exitPos.x, this.exitPos.y, 1400, () => {
            sprite.destroy();
            this.customerSprites.delete(customer.id);
            this.customers.removeCustomer(customer.id);
        });
    }

    layoutStore() {
        const width = this.scale.width;
        const height = this.scale.height;

        const baseWidth = 820;
        const baseHeight = 1180;

        const scale = Math.min(width / baseWidth, height / baseHeight);

        this.storeContainer.setScale(scale);
        this.storeContainer.x = (width - (baseWidth * scale)) / 2;
        this.storeContainer.y = (height - (baseHeight * scale)) / 2;
    }

    destroy(fromScene) {
        if (this.spawnTimer) {
            this.spawnTimer.remove();
        }
        if (this._unsubscribeCustomerSystem) {
            this._unsubscribeCustomerSystem();
        }
        super.destroy(fromScene);
    }
}
