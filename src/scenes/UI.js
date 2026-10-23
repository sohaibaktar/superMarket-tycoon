import Phaser from 'phaser';
import { YouTubePlayables } from '../YouTubePlayables.js';
import { FIRST_MILESTONE_COINS, CURRENCY_SYMBOL } from '../data/products.js';

export class UI extends Phaser.Scene {
    constructor() {
        super('UI');
    }

    create() {
        this.economy = this.registry.get('economySystem');

        this.createCoinBadge();
        this.createGoalBadge();
        this.createAudioButton();
        this.createToastContainer();

        // Responsive repositioning on resize
        this.repositionUI();
        this.scale.on('resize', this.repositionUI, this);

        // Sync with YouTube Playables audio state
        this.setupAudioIntegration();

        // Subscribe to economy changes
        if (this.economy) {
            this._unsubscribeEconomy = this.economy.subscribe(() => {
                this.updateCoinText();
            });
        }
    }

    createCoinBadge() {
        this.coinContainer = this.add.container(20, 20);

        // Badge background pill
        const bg = this.add.rectangle(0, 0, 150, 42, 0x0f172a, 0.85)
            .setStrokeStyle(1.5, 0xeab308)
            .setOrigin(0, 0.5);

        // Coin Icon
        const icon = this.add.image(22, 0, 'coin-icon').setOrigin(0.5).setScale(0.8);

        // Coin Count Text
        const initialCoins = this.economy ? this.economy.coins : 250;
        this.coinText = this.add.text(50, 0, `${CURRENCY_SYMBOL}${initialCoins.toLocaleString()}`, {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '18px',
            fontStyle: 'bold',
            color: '#fef08a'
        }).setOrigin(0, 0.5);

        this.coinContainer.add([bg, icon, this.coinText]);
    }

    createGoalBadge() {
        this.goalContainer = this.add.container(0, 20);

        const bg = this.add.rectangle(0, 0, 190, 42, 0x0f172a, 0.85)
            .setStrokeStyle(1.5, 0x38bdf8)
            .setOrigin(0.5);

        this.goalText = this.add.text(0, 0, `🎯 Goal: ${CURRENCY_SYMBOL}${FIRST_MILESTONE_COINS.toLocaleString()}`, {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '14px',
            fontStyle: 'bold',
            color: '#e0f2fe'
        }).setOrigin(0.5);

        this.goalContainer.add([bg, this.goalText]);
    }

    createAudioButton() {
        this.audioBtn = this.add.container(0, 20);

        this.audioIcon = this.add.image(0, 0, 'ui-audio-on')
            .setOrigin(0.5)
            .setScale(0.85);

        this.audioIcon.setInteractive({ useHandCursor: true });

        this.audioIcon.on('pointerdown', () => {
            const isMuted = this.sound.mute;
            if (isMuted) {
                this.enableAudio();
            } else {
                this.disableAudio();
            }
        });

        this.audioBtn.add(this.audioIcon);
    }

    createToastContainer() {
        this.toastBox = this.add.container(0, 80);
        this.toastBox.setAlpha(0);

        this.toastBg = this.add.rectangle(0, 0, 380, 40, 0x0f172a, 0.9)
            .setStrokeStyle(1.5, 0x38bdf8)
            .setOrigin(0.5);

        this.toastText = this.add.text(0, 0, '', {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '13px',
            fontStyle: 'bold',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        this.toastBox.add([this.toastBg, this.toastText]);
    }

    showToast(message, type = 'info') {
        this.toastText.setText(message);

        if (type === 'error') {
            this.toastBg.setStrokeStyle(1.5, 0xef4444);
            this.toastText.setColor('#fca5a5');
        } else if (type === 'success') {
            this.toastBg.setStrokeStyle(1.5, 0x22c55e);
            this.toastText.setColor('#86efac');
        } else {
            this.toastBg.setStrokeStyle(1.5, 0x38bdf8);
            this.toastText.setColor('#ffffff');
        }

        this.tweens.killTweensOf(this.toastBox);
        this.toastBox.setAlpha(1);
        this.toastBox.y = 70;

        this.tweens.add({
            targets: this.toastBox,
            y: 82,
            duration: 180,
            ease: 'Power1'
        });

        this.time.delayedCall(2200, () => {
            this.tweens.add({
                targets: this.toastBox,
                alpha: 0,
                duration: 300,
                ease: 'Power1'
            });
        });
    }

    updateCoinText() {
        if (!this.coinText || !this.economy) return;
        this.coinText.setText(`${CURRENCY_SYMBOL}${this.economy.coins.toLocaleString()}`);

        // Quick punch scale animation on coin update
        this.tweens.add({
            targets: this.coinText,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 100,
            yoyo: true
        });
    }

    setupAudioIntegration() {
        if (YouTubePlayables.isAudioEnabled()) {
            this.enableAudio();
        } else {
            this.disableAudio();
        }

        YouTubePlayables.setAudioChangeCallback((enabled) => {
            if (enabled) {
                this.enableAudio();
            } else {
                this.disableAudio();
            }
        });
    }

    enableAudio() {
        this.sound.setMute(false);
        this.audioIcon.setTexture('ui-audio-on');
    }

    disableAudio() {
        this.sound.setMute(true);
        this.audioIcon.setTexture('ui-audio-off');
    }

    repositionUI() {
        const width = this.scale.width;

        // Top Left: Coin badge
        this.coinContainer.x = 20;
        this.coinContainer.y = 30;

        // Top Center: Goal badge
        this.goalContainer.x = width / 2;
        this.goalContainer.y = 30;

        // Top Right: Audio toggle
        this.audioBtn.x = width - 40;
        this.audioBtn.y = 30;

        // Toast Center
        this.toastBox.x = width / 2;
    }

    destroy(fromScene) {
        if (this._unsubscribeEconomy) {
            this._unsubscribeEconomy();
        }
        super.destroy(fromScene);
    }
}
