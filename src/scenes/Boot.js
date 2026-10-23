import { Scene } from 'phaser';
import { YouTubePlayables } from '../YouTubePlayables.js';
import { EconomySystem } from '../systems/EconomySystem.js';
import { InventorySystem } from '../systems/InventorySystem.js';
import { CheckoutSystem } from '../systems/CheckoutSystem.js';
import { CustomerSystem } from '../systems/CustomerSystem.js';
import { INITIAL_COINS } from '../data/products.js';

export class Boot extends Scene {
    constructor() {
        super('Boot');
    }

    preload() {
        // Load initial preloader background
        this.load.image('background', 'assets/bg.png');
    }

    async create() {
        let initialCoins = INITIAL_COINS;
        let initialStock = {};

        // Load saved game data from YouTube Playables API if available
        try {
            const data = await YouTubePlayables.withTimeout(YouTubePlayables.loadData(), 1000);
            console.log('YouTube Playables loadData() result:', data);

            if (data && typeof data === 'object') {
                if (Number.isFinite(data.coins) && data.coins >= 0) {
                    initialCoins = data.coins;
                }
                if (data.stock && typeof data.stock === 'object') {
                    initialStock = data.stock;
                }
            }
        } catch (error) {
            console.error('Error loading data from YouTube Playables SDK:', error);
        }

        // Initialize core domain systems
        const economySystem = new EconomySystem(initialCoins);
        const inventorySystem = new InventorySystem(economySystem, initialStock);
        const checkoutSystem = new CheckoutSystem(inventorySystem, economySystem);
        const customerSystem = new CustomerSystem(inventorySystem, checkoutSystem);

        this.registry.set('economySystem', economySystem);
        this.registry.set('inventorySystem', inventorySystem);
        this.registry.set('checkoutSystem', checkoutSystem);
        this.registry.set('customerSystem', customerSystem);

        // YouTube Playables SDK Pause and Resume lifecycle hooks
        YouTubePlayables.setOnPause(() => {
            console.log('YouTube Playables API requested game pause');
            this.game.pause();
        });

        YouTubePlayables.setOnResume(() => {
            console.log('YouTube Playables API requested game resume');
            this.game.resume();
        });

        this.scene.start('Preloader');
    }
}
