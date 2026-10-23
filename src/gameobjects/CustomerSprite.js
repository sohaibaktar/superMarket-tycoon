import Phaser from 'phaser';

/**
 * CustomerSprite: Visual representation of a customer in the supermarket.
 * Features realistic 2-legged animated walking cycle, shopping basket,
 * and reactive thought bubbles.
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
        this.isWalking = false;
        this.legTweens = [];

        this.createShadow();
        this.createLegs();
        this.createTorso();
        this.createBasket();
        this.createThoughtBubble();

        scene.add.existing(this);
    }

    createShadow() {
        this.shadow = this.scene.add.ellipse(0, 4, 28, 9, 0x000000, 0.22);
        this.add(this.shadow);
    }

    createLegs() {
        // Two separate, visible animated legs with pants and white sneakers
        this.leftLeg = this.scene.add.image(-5, -6, 'customer-leg')
            .setOrigin(0.5, 0.1);

        this.rightLeg = this.scene.add.image(5, -6, 'customer-leg')
            .setOrigin(0.5, 0.1);

        this.add([this.leftLeg, this.rightLeg]);
    }

    createTorso() {
        const themeIndex = (this.customer.shirtColorIndex || 0) % 5;
        const torsoKey = `customer-torso-${themeIndex}`;
        this.torso = this.scene.add.image(0, -20, torsoKey)
            .setOrigin(0.5, 0.65);
        this.add(this.torso);
    }

    createBasket() {
        this.basketContainer = this.scene.add.container(16, -18);
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
        this.thoughtBubble = this.scene.add.container(0, -68);
        this.thoughtBubble.setAlpha(0);

        const bubbleBg = this.scene.add.image(0, 0, 'bubble-thought').setOrigin(0.5);

        this.thoughtIcon = this.scene.add.image(0, -4, 'prod-apples')
            .setOrigin(0.5)
            .setScale(0.65);

        this.thoughtBubble.add([bubbleBg, this.thoughtIcon]);
        this.add(this.thoughtBubble);
    }

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

    showHeart() {
        this.thoughtIcon.setTexture('bubble-heart');
        this.thoughtIcon.setScale(0.9);

        this.scene.tweens.killTweensOf(this.thoughtBubble);
        this.thoughtBubble.setScale(0.6);
        this.thoughtBubble.setAlpha(1);

        this.scene.tweens.add({
            targets: this.thoughtBubble,
            scaleX: 1.15,
            scaleY: 1.15,
            duration: 200,
            yoyo: true
        });
    }

    showDisappointed() {
        this.thoughtIcon.setTexture('bubble-disappointed');
        this.thoughtIcon.setScale(0.9);

        this.scene.tweens.killTweensOf(this.thoughtBubble);
        this.thoughtBubble.setAlpha(1);

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

    hideThought() {
        this.scene.tweens.add({
            targets: this.thoughtBubble,
            alpha: 0,
            scaleX: 0.5,
            scaleY: 0.5,
            duration: 150
        });
    }

    updateBasket(count) {
        if (count > 0) {
            this.basketContainer.setVisible(true);
            this.basketCountText.setText(count.toString());

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

    startWalkingAnimation() {
        if (this.isWalking) return;
        this.isWalking = true;

        this.stopWalkingAnimation();

        // 2-leg scissor stepping cycle
        const t1 = this.scene.tweens.add({
            targets: this.leftLeg,
            angle: 24,
            duration: 160,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        const t2 = this.scene.tweens.add({
            targets: this.rightLeg,
            angle: -24,
            duration: 160,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Gentle torso walking bob
        const t3 = this.scene.tweens.add({
            targets: this.torso,
            y: -23,
            duration: 160,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.legTweens = [t1, t2, t3];
    }

    stopWalkingAnimation() {
        this.isWalking = false;
        for (const tw of this.legTweens) {
            if (tw) tw.stop();
        }
        this.legTweens = [];

        this.leftLeg.setAngle(0);
        this.rightLeg.setAngle(0);
        this.torso.y = -20;
    }

    /**
     * Walk to target position at realistic, pleasant walking speed.
     * @param {number} targetX
     * @param {number} targetY
     * @param {number} [duration]
     * @param {Function} [onComplete]
     */
    walkTo(targetX, targetY, duration = null, onComplete = null) {
        // Face moving direction
        if (targetX > this.x + 3) {
            this.torso.setFlipX(false);
        } else if (targetX < this.x - 3) {
            this.torso.setFlipX(true);
        }

        // Realistic walking pace: 105 pixels per second
        const distance = Phaser.Math.Distance.Between(this.x, this.y, targetX, targetY);
        const actualDuration = duration !== null ? duration : Math.max(350, Math.floor((distance / 105) * 1000));

        this.startWalkingAnimation();

        this.scene.tweens.add({
            targets: this,
            x: targetX,
            y: targetY,
            duration: actualDuration,
            ease: 'Linear',
            onComplete: () => {
                this.stopWalkingAnimation();
                if (onComplete) onComplete();
            }
        });
    }

    /**
     * Walk through a series of aisle waypoints without stopping between waypoints.
     * @param {Array<{x: number, y: number}>} waypoints
     * @param {Function} [onComplete]
     */
    walkWaypoints(waypoints, onComplete = null) {
        if (!waypoints || waypoints.length === 0) {
            if (onComplete) onComplete();
            return;
        }

        const nextPoint = waypoints[0];
        const remaining = waypoints.slice(1);

        this.walkTo(nextPoint.x, nextPoint.y, null, () => {
            if (remaining.length > 0) {
                this.walkWaypoints(remaining, onComplete);
            } else {
                if (onComplete) onComplete();
            }
        });
    }

    destroy(fromScene) {
        this.stopWalkingAnimation();
        super.destroy(fromScene);
    }
}
