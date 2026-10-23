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

        // Customer sprite lookup & state
        this.customerSprites = new Map();
        this.isProcessingCheckout = false;
        this.autoCheckoutTimer = null;

        // Waypoint coordinates
        this.entranceSpawn = { x: 180, y: 1140 };
        this.entranceDoorPos = { x: 180, y: 1040 };
        this.entranceFoyerPos = { x: 180, y: 920 };

        this.exitFoyerPos = { x: 640, y: 920 };
        this.exitDoorPos = { x: 640, y: 1040 };
        this.exitDespawn = { x: 640, y: 1140 };

        this.shelfLocations = {
            apples: { x: 230, y: 260, approachX: 320, approachY: 260 },
            milk: { x: 590, y: 260, approachX: 500, approachY: 260 },
            bread: { x: 230, y: 430, approachX: 320, approachY: 430 },
            rice: { x: 590, y: 430, approachX: 500, approachY: 430 },
            snacks: { x: 230, y: 600, approachX: 320, approachY: 600 }
        };

        // Create main store container so everything scales & centers responsively
        this.storeContainer = this.add.container(0, 0);

        this.buildSupermarketEnvironment();
        this.buildShelves();
        this.buildCheckoutCounter();
        this.buildDoorsAndDecor();

        // Customer AI system events
        this.setupCustomerSystemEvents();

        // Dynamic Spawning loop responsive to marketing footfall boosts
        this.scheduleNextSpawn();

        // Progression listener to dynamically show hired cashier
        if (this.progression) {
            this._unsubProgression = this.progression.subscribe((event) => {
                if (event.type === 'upgrade_purchased' && event.upgradeId === 'hire_cashier') {
                    this.updateCashierStaffVisual();
                }
            });
        }

        // Responsive positioning
        this.layoutStore();
        this.scale.on('resize', this.layoutStore, this);

        // Bring HUD UI to top
        this.scene.bringToTop('UI');

        // Guide prompt in HUD
        const uiScene = this.scene.get('UI');
        if (uiScene && uiScene.showToast) {
            uiScene.showToast('Supermarket is open! Tap cash counter to ring up customers, or hire cashier.', 'info');
        }
    }

    buildSupermarketEnvironment() {
        const storeWidth = 820;
        const storeHeight = 1180;

        // Store Floor Background Tiling (polished terrazzo)
        this.floorTile = this.add.tileSprite(storeWidth / 2, storeHeight / 2, storeWidth - 40, storeHeight - 120, 'supermarket-tile');
        this.storeContainer.add(this.floorTile);

        // Store perimeter border
        this.storeBorder = this.add.rectangle(storeWidth / 2, storeHeight / 2, storeWidth - 36, storeHeight - 116)
            .setStrokeStyle(3, 0x0284c7, 0.4);
        this.storeContainer.add(this.storeBorder);

        // Visible Aisle Walkway Runners with directional walking dashes
        // 1. Entrance corridor (Left)
        this.entranceAisle = this.add.tileSprite(180, 880, 70, 260, 'aisle-runner');
        // 2. Exit corridor (Right)
        this.exitAisle = this.add.tileSprite(640, 880, 70, 260, 'aisle-runner');
        // 3. Concourse horizontal connector
        this.concourseAisle = this.add.tileSprite(410, 730, 530, 64, 'aisle-runner');
        // 4. Center main vertical spine
        this.centerSpine = this.add.tileSprite(410, 440, 70, 500, 'aisle-runner');
        // 5. Cross aisles to shelves
        this.topCrossAisle = this.add.tileSprite(410, 260, 420, 54, 'aisle-runner');
        this.midCrossAisle = this.add.tileSprite(410, 430, 420, 54, 'aisle-runner');
        this.botCrossAisle = this.add.tileSprite(320, 600, 240, 54, 'aisle-runner');

        this.storeContainer.add([
            this.entranceAisle,
            this.exitAisle,
            this.concourseAisle,
            this.centerSpine,
            this.topCrossAisle,
            this.midCrossAisle,
            this.botCrossAisle
        ]);

        // Top Store Signboard Banner
        this.banner = this.add.image(storeWidth / 2, 95, 'store-banner').setOrigin(0.5);
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
        // Modern Cash Counter Station
        this.checkoutDesk = this.add.image(550, 830, 'checkout-counter')
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });
        this.storeContainer.add(this.checkoutDesk);

        // Tap counter desk to ring up customer
        this.checkoutDesk.on('pointerdown', () => {
            this.handleManualCheckoutTap();
        });

        // Queue Line: 4 designated waiting spots along Y=830
        this.queueSpots = [];
        const spotXPositions = [370, 305, 240, 175];
        const queueY = 830;

        for (let i = 0; i < spotXPositions.length; i++) {
            const spotX = spotXPositions[i];
            const spot = this.add.image(spotX, queueY, 'queue-spot').setOrigin(0.5);

            const numText = this.add.text(spotX, queueY, `${i + 1}`, {
                fontFamily: 'monospace',
                fontSize: '12px',
                fontStyle: 'bold',
                color: '#0284c7'
            }).setOrigin(0.5);

            this.storeContainer.add([spot, numText]);
            this.queueSpots.push({ x: spotX, y: queueY });
        }

        // Cashier Character Sprite (standing behind register)
        this.cashierSprite = this.add.image(550, 755, 'cashier-character').setOrigin(0.5);
        this.storeContainer.add(this.cashierSprite);

        // Breathing idle tween for cashier
        this.tweens.add({
            targets: this.cashierSprite,
            scaleY: 1.05,
            duration: 900,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.updateCashierStaffVisual();

        // Bouncing "TAP TO CASH OUT" Interactive Badge
        this.tapCheckoutBadge = this.add.image(550, 785, 'tap-checkout-badge')
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });
        this.tapCheckoutBadge.setVisible(false);
        this.storeContainer.add(this.tapCheckoutBadge);

        this.tapCheckoutBadge.on('pointerdown', () => {
            this.handleManualCheckoutTap();
        });

        // Pulsing glow animation on tap checkout badge
        this.tweens.add({
            targets: this.tapCheckoutBadge,
            scaleX: 1.08,
            scaleY: 1.08,
            duration: 650,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    updateCashierStaffVisual() {
        const isHired = this.progression ? this.progression.isCashierHired : false;
        if (this.cashierSprite) {
            this.cashierSprite.setVisible(isHired);
        }
    }

    buildDoorsAndDecor() {
        // Front Door (Entrance on the Left)
        this.frontDoor = this.add.image(180, 1060, 'door-entrance').setOrigin(0.5);
        // Shopping Carts Bay (Parked near entrance)
        this.shoppingCarts = this.add.image(88, 1060, 'shopping-carts').setOrigin(0.5);

        // Back Door (Exit on the Right)
        this.backDoor = this.add.image(640, 1060, 'door-exit').setOrigin(0.5);

        this.storeContainer.add([this.frontDoor, this.shoppingCarts, this.backDoor]);

        // Middle Instruction Hint
        this.hintBox = this.add.container(410, 950);
        const hintBg = this.add.rectangle(0, 0, 420, 38, 0x0f172a, 0.9)
            .setStrokeStyle(1.5, 0x38bdf8);
        this.hintText = this.add.text(0, 0, '💡 Tip: Tap Register to Cash Out, or Hire Cashier in Upgrades!', {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '12px',
            fontStyle: 'bold',
            color: '#f8fafc'
        }).setOrigin(0.5);

        this.hintBox.add([hintBg, this.hintText]);
        this.storeContainer.add(this.hintBox);
    }

    setupCustomerSystemEvents() {
        // Listen to queue shifts to step customers forward along the waiting line
        this._unsubscribeCustomerSystem = this.customers.subscribe((event) => {
            if (event.type === 'queue_shifted') {
                for (let i = 0; i < this.customers._maxQueue; i++) {
                    const cust = this.customers.getCustomerAtQueueSpot(i);
                    if (cust && this.customerSprites.has(cust.id)) {
                        const sprite = this.customerSprites.get(cust.id);
                        const targetSpot = this.queueSpots[i];
                        sprite.walkTo(targetSpot.x, targetSpot.y, null, () => {
                            if (i === 0) {
                                this.checkFrontCheckout();
                            }
                        });
                    }
                }
            }
        });
    }

    scheduleNextSpawn() {
        const multiplier = this.marketing ? this.marketing.currentFootfallMultiplier : 1.0;
        const delay = Math.max(1600, Math.floor(4500 / multiplier));
        this.spawnTimer = this.time.delayedCall(delay, () => {
            this.trySpawnCustomer();
            this.scheduleNextSpawn();
        });
    }

    trySpawnCustomer() {
        if (this.dayCycle && !this.dayCycle.isDayActive) return;

        const customer = this.customers.spawnCustomer();
        if (!customer) return;

        // Basket bonus items
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

        // Spawn outside Front Door
        const sprite = new CustomerSprite(this, this.entranceSpawn.x, this.entranceSpawn.y, customer);
        this.storeContainer.add(sprite);
        this.customerSprites.set(customer.id, sprite);

        // Entrance Walkway Pathing (Front Door ➜ Entrance Lane ➜ Concourse)
        const entranceWaypoints = [
            { x: this.entranceDoorPos.x, y: this.entranceDoorPos.y },
            { x: this.entranceFoyerPos.x, y: this.entranceFoyerPos.y },
            { x: 180, y: 730 },
            { x: 410, y: 730 }
        ];

        sprite.walkWaypoints(entranceWaypoints, () => {
            this.routeCustomerShopping(customer, sprite);
        });
    }

    routeCustomerShopping(customer, sprite) {
        if (!customer || !sprite) return;

        const targetProductId = customer.currentTargetProductId;

        if (targetProductId && this.shelfLocations[targetProductId]) {
            const loc = this.shelfLocations[targetProductId];
            sprite.showThought(targetProductId);

            // Navigate through aisle waypoints without cutting shelves
            const waypoints = [
                { x: 410, y: loc.y },
                { x: loc.approachX, y: loc.y }
            ];

            sprite.walkWaypoints(waypoints, () => {
                // Arrived at shelf
                this.time.delayedCall(500, () => {
                    const res = this.customers.tryTakeItem(customer.id, targetProductId);

                    if (res.success) {
                        sprite.updateBasket(customer.totalItemCount);
                        const shelf = this.shelves.find(s => s.productId === targetProductId);
                        if (shelf) {
                            this.tweens.add({
                                targets: shelf.prodIcon,
                                scaleX: 1.25,
                                scaleY: 1.25,
                                duration: 100,
                                yoyo: true
                            });
                        }
                    } else {
                        sprite.showDisappointed();
                    }

                    this.time.delayedCall(600, () => {
                        customer.advanceTarget();
                        // Step back to center spine before next destination
                        sprite.walkTo(410, loc.y, null, () => {
                            this.routeCustomerShopping(customer, sprite);
                        });
                    });
                });
            });
        } else {
            // Customer finished browsing list
            if (customer.totalItemCount > 0) {
                this.routeCustomerToQueue(customer, sprite);
            } else {
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
            sprite.showDisappointed();
            const uiScene = this.scene.get('UI');
            if (uiScene && uiScene.showToast) {
                uiScene.showToast('Checkout line is full! Customer left.', 'error');
            }
            this.time.delayedCall(600, () => {
                this.routeCustomerToExit(customer, sprite);
            });
            return;
        }

        sprite.hideThought();
        const targetSpot = this.queueSpots[joinRes.spotIndex];

        // Walkway path to designated queue spot
        const queueWaypoints = [
            { x: 410, y: 730 },
            { x: targetSpot.x, y: 730 },
            { x: targetSpot.x, y: targetSpot.y }
        ];

        sprite.walkWaypoints(queueWaypoints, () => {
            if (joinRes.spotIndex === 0) {
                this.checkFrontCheckout();
            }
        });
    }

    checkFrontCheckout() {
        const frontCustomer = this.customers.getCustomerAtQueueSpot(0);
        if (!frontCustomer) {
            this.tapCheckoutBadge.setVisible(false);
            if (this.autoCheckoutTimer) {
                this.autoCheckoutTimer.remove();
                this.autoCheckoutTimer = null;
            }
            return;
        }

        if (this.isProcessingCheckout) return;

        const isHired = this.progression ? this.progression.isCashierHired : false;

        if (isHired) {
            // Automated Cashier: schedule scan throughput
            this.tapCheckoutBadge.setVisible(false);
            if (!this.autoCheckoutTimer) {
                this.scheduleFrontCheckout();
            }
        } else {
            // Manual Register: show glowing TAP TO CASH OUT button
            this.tapCheckoutBadge.setVisible(true);
        }
    }

    scheduleFrontCheckout() {
        if (this.isProcessingCheckout || this.autoCheckoutTimer) return;

        const delay = this.progression ? this.progression.getCheckoutDelayMs() : 900;
        this.autoCheckoutTimer = this.time.delayedCall(delay, () => {
            this.autoCheckoutTimer = null;
            this.processFrontCheckout(false);
        });
    }

    handleManualCheckoutTap() {
        const frontCustomer = this.customers.getCustomerAtQueueSpot(0);
        if (!frontCustomer) {
            const uiScene = this.scene.get('UI');
            if (uiScene && uiScene.showToast) {
                uiScene.showToast('Waiting for customer to step up to register!', 'info');
            }
            return;
        }

        if (this.isProcessingCheckout) return;

        // Cancel pending automated timer and process immediately on player tap
        if (this.autoCheckoutTimer) {
            this.autoCheckoutTimer.remove();
            this.autoCheckoutTimer = null;
        }

        this.processFrontCheckout(true);
    }

    processFrontCheckout(isManualTap = false) {
        const frontCustomer = this.customers.getCustomerAtQueueSpot(0);
        if (!frontCustomer || this.isProcessingCheckout) return;

        this.isProcessingCheckout = true;
        this.tapCheckoutBadge.setVisible(false);

        // Cashier / Desk bounce animation
        this.tweens.add({
            targets: [this.checkoutDesk, this.cashierSprite],
            scaleX: 1.08,
            scaleY: 1.08,
            duration: 100,
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

            // Toast feedback
            const uiScene = this.scene.get('UI');
            if (uiScene && uiScene.showToast) {
                const methodStr = isManualTap ? 'Manual tap: ' : 'Cashier: ';
                uiScene.showToast(`${methodStr}Sold goods for +${CURRENCY_SYMBOL}${serveRes.total}!`, 'success');
            }

            // Exit store along dedicated exit lane
            this.time.delayedCall(500, () => {
                if (sprite) {
                    this.routeCustomerToExit(customer, sprite);
                }
                this.isProcessingCheckout = false;
                // Immediately check if next customer is at spot 0 (fixes queue getting stuck!)
                this.checkFrontCheckout();
            });
        } else {
            this.isProcessingCheckout = false;
            this.checkFrontCheckout();
        }
    }

    showRegisterPopup(text) {
        const popup = this.add.text(550, 770, text, {
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
            y: 720,
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

        // Dedicated one-way exit route:
        // Register ➜ Exit Concourse ➜ Exit Door ➜ Outside
        const exitWaypoints = [
            { x: 550, y: 740 },
            { x: 640, y: 740 },
            { x: this.exitFoyerPos.x, y: this.exitFoyerPos.y },
            { x: this.exitDoorPos.x, y: this.exitDoorPos.y },
            { x: this.exitDespawn.x, y: this.exitDespawn.y }
        ];

        sprite.walkWaypoints(exitWaypoints, () => {
            sprite.destroy();
            this.customerSprites.delete(customer.id);
            this.customers.removeCustomer(customer.id);
        });
    }

    update(time, delta) {
        // Continuous watchdog: ensure spot 0 customer is promptly served without stalling
        const front = this.customers.getCustomerAtQueueSpot(0);
        if (front && !this.isProcessingCheckout) {
            const isHired = this.progression ? this.progression.isCashierHired : false;
            if (isHired && !this.autoCheckoutTimer) {
                this.scheduleFrontCheckout();
            } else if (!isHired && !this.tapCheckoutBadge.visible) {
                this.tapCheckoutBadge.setVisible(true);
            }
        } else if (!front && this.tapCheckoutBadge.visible) {
            this.tapCheckoutBadge.setVisible(false);
        }
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
        if (this.autoCheckoutTimer) {
            this.autoCheckoutTimer.remove();
        }
        if (this._unsubscribeCustomerSystem) {
            this._unsubscribeCustomerSystem();
        }
        if (this._unsubProgression) {
            this._unsubProgression();
        }
        super.destroy(fromScene);
    }
}
