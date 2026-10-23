import Phaser from 'phaser';

/**
 * CustomerSprite: Visual representation of a customer in the supermarket.
 * Manages walking animations, shopping basket display, and reactive thought bubbles.
 */
export class CustomerSprite extends Phaser.GameObjects.Container {
    /**
     * @param {Phaser.Scene} scene
     * @param {number} x
     * @param {number} y
     * @param {import('../models/Customer.js').Customer} customer
     */
    constructor(scene, x, y, customer) {
        super(scene, x, y);

        this.customer = customer;

        this.createAvatar();
        this.createBasket();
        this.createThoughtBubble();

        scene.add.existing(this);
    }

    createAvatar() {
        const avatarKey = `customer-avatar-${this.customer.shirtColorIndex}`;
        this.avatar = this.scene.add.image(0, 0, avatarKey).setOrigin(0.5, 0.9);
        this.add(this.avatar);
    }

    createBasket() {
        this.basketContainer = this.scene.add.container(16, -16);
        this.basketContainer.setVisible(false);

        const basketIcon = this.scene.add.image(0, 0, 'customer-basket').setOrigin(0.5);

        this.basketCountText = this.scene.add.text(6, 4, '1', {
            fontFamily: 'monospace',
            fontSize: '10px',
            fontStyle: 'bold',
            color: '#ffffff',
            backgroundColor: '#ef4444',
            padding: { left: 2, right: 2, top: 1, bottom: 1 }
        }).setOrigin(0.5);

        this.basketContainer.add([basketIcon, this.basketCountText]);
        this.add(this.basketContainer);
    }

    createThoughtBubble() {
        this.thoughtBubble = this.scene.add.container(0, -66);
        this.thoughtBubble.setAlpha(0);

        const bubbleBg = this.scene.add.image(0, 0, 'bubble-thought').setOrigin(0.5);

        this.thoughtIcon = this.scene.add.image(0, -4, 'prod-apples')
            .setOrigin(0.5)
            .setScale(0.65);

        this.thoughtBubble.add([bubbleBg, this.thoughtIcon]);
        this.add(this.thoughtBubble);
    }

    /**
     * Display a product wanted in the thought bubble.
     * @param {string} productId
     */
    showThought(productId) {
        if (!productId) return;
        this.thoughtIcon.setTexture(`prod-${productId}`);
        this.thoughtIcon.setScale(0.65);

        this.scene.tweens.killTweensOf(this.thoughtBubble);
        this.thoughtBubble.setScale(0.5);
        this.thoughtBubble.setAlpha(1);

        this.scene.tweens.add({
            targets: this.thoughtBubble,
            scaleX: 1,
            scaleY: 1,
            duration: 180,
            ease: 'Back.easeOut'
        });
    }

    /**
     * Show heart reaction upon successful checkout.
     */
    showHeart() {
        this.thoughtIcon.setTexture('bubble-heart');
        this.thoughtIcon.setScale(0.9);

        this.scene.tweens.killTweensOf(this.thoughtBubble);
        this.thoughtBubble.setScale(0.6);
        this.thoughtBubble.setAlpha(1);

        this.scene.tweens.add({
            targets: this.thoughtBubble,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 200,
            yoyo: true
        });
    }

    /**
     * Show disappointed reaction when product is out of stock.
     */
    showDisappointed() {
        this.thoughtIcon.setTexture('bubble-disappointed');
        this.thoughtIcon.setScale(0.9);

        this.scene.tweens.killTweensOf(this.thoughtBubble);
        this.thoughtBubble.setAlpha(1);

        // Shake thought bubble
        this.scene.tweens.add({
            targets: this.thoughtBubble,
            x: 4,
            duration: 50,
            yoyo: true,
            repeat: 3,
            onComplete: () => {
                this.thoughtBubble.x = 0;
            }
        });
    }

    /**
     * Hide thought bubble.
     */
    hideThought() {
        this.scene.tweens.add({
            targets: this.thoughtBubble,
            alpha: 0,
            scaleX: 0.5,
            scaleY: 0.5,
            duration: 150
        });
    }

    /**
     * Update basket visual with current total count.
     * @param {number} count
     */
    updateBasket(count) {
        if (count > 0) {
            this.basketContainer.setVisible(true);
            this.basketCountText.setText(count.toString());

            // Basket pop animation
            this.scene.tweens.add({
                targets: this.basketContainer,
                scaleX: 1.3,
                scaleY: 1.3,
                duration: 100,
                yoyo: true
            });
        } else {
            this.basketContainer.setVisible(false);
        }
    }

    /**
     * Smoothly walk to target position with walking wobble animation.
     * @param {number} targetX
     * @param {number} targetY
     * @param {number} [duration=1200]
     * @param {Function} [onComplete]
     */
    walkTo(targetX, targetY, duration = 1200, onComplete = null) {
        // Face moving direction
        if (targetX > this.x + 5) {
            this.avatar.setFlipX(false);
        } else if (targetX < this.x - 5) {
            this.avatar.setFlipX(true);
        }

        // Walking wobble tween
        const wobbleTween = this.scene.tweens.add({
            targets: this.avatar,
            angle: 4,
            duration: 120,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Main translation tween
        this.scene.tweens.add({
            targets: this,
            x: targetX,
            y: targetY,
            duration,
            ease: 'Linear',
            onComplete: () => {
                wobbleTween.stop();
                this.avatar.setAngle(0);
                if (onComplete) onComplete();
            }
        });
    }
}
