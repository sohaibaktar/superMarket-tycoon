import { Scene } from 'phaser';
import { YouTubePlayables } from '../YouTubePlayables.js';

export class MainMenu extends Scene {
    constructor() {
        super('MainMenu');
    }

    create() {
        this.createMenuVisuals();
        this.createPlayButton();
        this.createEnvironmentInfo();

        // Game is now ready for player interaction
        YouTubePlayables.gameReady();

        // Bring UI scene to top
        this.scene.bringToTop('UI');
    }

    createMenuVisuals() {
        const view = this.scale.getViewPort(this.cameras.main);

        // Store sign banner
        this.add.image(view.centerX, view.centerY - 160, 'store-banner').setOrigin(0.5);

        // Subtitle
        this.add.text(view.centerX, view.centerY - 90, 'Manage shelves, restock groceries, and expand your store!', {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '15px',
            color: '#38bdf8',
            align: 'center'
        }).setOrigin(0.5);

        // Mini preview shelf icon showcase
        const products = ['prod-apples', 'prod-milk', 'prod-bread', 'prod-rice', 'prod-snacks'];
        const startX = view.centerX - 100;
        products.forEach((icon, i) => {
            const spr = this.add.image(startX + (i * 50), view.centerY - 20, icon).setScale(1.1);
            this.tweens.add({
                targets: spr,
                y: view.centerY - 28,
                duration: 600 + (i * 100),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        });
    }

    createPlayButton() {
        const view = this.scale.getViewPort(this.cameras.main);

        const btnContainer = this.add.container(view.centerX, view.centerY + 80);

        const btnBg = this.add.rectangle(0, 0, 240, 56, 0x0284c7, 1)
            .setStrokeStyle(2, 0x38bdf8);
        btnBg.setInteractive({ useHandCursor: true });

        const btnText = this.add.text(0, 0, '▶ OPEN STORE', {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '20px',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5);

        btnContainer.add([btnBg, btnText]);

        btnBg.on('pointerover', () => {
            btnBg.setFillStyle(0x0369a1);
            btnContainer.setScale(1.05);
        });

        btnBg.on('pointerout', () => {
            btnBg.setFillStyle(0x0284c7);
            btnContainer.setScale(1.0);
        });

        const startGame = () => {
            this.scene.start('SupermarketScene');
        };

        btnBg.on('pointerdown', () => {
            this.tweens.add({
                targets: btnContainer,
                scaleX: 0.95,
                scaleY: 0.95,
                duration: 80,
                yoyo: true,
                onComplete: startGame
            });
        });

        // Also allow tapping anywhere on screen to start
        this.input.once('pointerdown', (pointer) => {
            if (pointer.y > view.centerY + 20) {
                startGame();
            }
        });
    }

    async createEnvironmentInfo() {
        const view = this.scale.getViewPort(this.cameras.main);
        const language = await YouTubePlayables.loadLanguage();

        const info = [
            `YouTube Playables SDK: ${YouTubePlayables.version}`,
            `Playables Environment: ${YouTubePlayables.inPlayablesEnv ? 'Connected' : 'Local Sandbox'}`,
            `Language: ${language || 'en'}`
        ];

        this.add.text(view.centerX, view.bottom - 80, info, {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '13px',
            color: '#64748b',
            align: 'center',
            lineSpacing: 4
        }).setOrigin(0.5);
    }
}
