import { Scene } from 'phaser';
import { YouTubePlayables } from '../YouTubePlayables.js';
import { EconomySystem } from '../systems/EconomySystem.js';
import { InventorySystem } from '../systems/InventorySystem.js';
import { CheckoutSystem } from '../systems/CheckoutSystem.js';
import { CustomerSystem } from '../systems/CustomerSystem.js';
import { DayCycleSystem } from '../systems/DayCycleSystem.js';
import { MarketingSystem } from '../systems/MarketingSystem.js';
import { BankLoanSystem } from '../systems/BankLoanSystem.js';
import { ProgressionSystem } from '../systems/ProgressionSystem.js';
import { SaveManager } from '../persistence/SaveManager.js';
import { PlayablesSaveAdapter } from '../persistence/adapters/PlayablesSaveAdapter.js';
import { LocalSaveAdapter } from '../persistence/adapters/LocalSaveAdapter.js';
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
        // Initialize core domain systems with clean defaults
        const economySystem = new EconomySystem(INITIAL_COINS);
        const inventorySystem = new InventorySystem(economySystem);
        const checkoutSystem = new CheckoutSystem(inventorySystem, economySystem);
        const customerSystem = new CustomerSystem(inventorySystem, checkoutSystem);
        const dayCycleSystem = new DayCycleSystem({ dayDurationSeconds: 180 });
        const marketingSystem = new MarketingSystem(economySystem, dayCycleSystem);
        const bankLoanSystem = new BankLoanSystem(economySystem, dayCycleSystem);
        const progressionSystem = new ProgressionSystem(economySystem, inventorySystem);

        // Wire progression reference to customer system for department gating
        customerSystem.setProgressionSystem(progressionSystem);

        // Initialize dual-adapter persistence manager (YouTube Playables Cloud + LocalStorage)
        const saveManager = new SaveManager(
            {
                economy: economySystem,
                inventory: inventorySystem,
                dayCycle: dayCycleSystem,
                marketing: marketingSystem,
                bank: bankLoanSystem,
                progression: progressionSystem
            },
            {
                primaryAdapter: new PlayablesSaveAdapter(),
                fallbackAdapter: new LocalSaveAdapter()
            }
        );

        // Restore saved player data if present
        try {
            const restored = await saveManager.load();
            if (restored) {
                console.log('SaveManager: Game state successfully restored from storage.');
            } else {
                console.log('SaveManager: Starting fresh supermarket session (₹250 bootstrapping).');
            }
        } catch (err) {
            console.error('Error during initial saveManager.load():', err);
        }

        // Expose domain systems to all scenes via global registry
        this.registry.set('economySystem', economySystem);
        this.registry.set('inventorySystem', inventorySystem);
        this.registry.set('checkoutSystem', checkoutSystem);
        this.registry.set('customerSystem', customerSystem);
        this.registry.set('dayCycleSystem', dayCycleSystem);
        this.registry.set('marketingSystem', marketingSystem);
        this.registry.set('bankLoanSystem', bankLoanSystem);
        this.registry.set('progressionSystem', progressionSystem);
        this.registry.set('saveManager', saveManager);

        // YouTube Playables SDK Pause and Resume lifecycle hooks
        YouTubePlayables.setOnPause(() => {
            console.log('YouTube Playables API requested game pause: saving game state');
            saveManager.save();
            this.game.pause();
        });

        YouTubePlayables.setOnResume(() => {
            console.log('YouTube Playables API requested game resume');
            this.game.resume();
        });

        this.scene.start('Preloader');
    }
}
