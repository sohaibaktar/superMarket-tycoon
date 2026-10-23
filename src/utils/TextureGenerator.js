/**
 * TextureGenerator: Programmatically creates high-quality, lightweight 2D assets
 * for Supermarket Tycoon: Mini Mart using HTML Canvas.
 * Ensures zero external asset bloat, instantaneous loading, and 100% original graphics.
 */
export class TextureGenerator {
    /**
     * @param {Phaser.Scene} scene
     */
    static generateAll(scene) {
        this.generateFloorTile(scene);
        this.generateAisleRunner(scene);
        this.generateEntranceDoor(scene);
        this.generateExitDoor(scene);
        this.generateShoppingCarts(scene);
        this.generateShelfGraphic(scene);
        this.generateCheckoutDesk(scene);
        this.generateCashierCharacter(scene);
        this.generateTapToCheckoutBadge(scene);
        this.generateCoinIcon(scene);
        this.generateProductIcons(scene);
        this.generateQueueSpot(scene);
        this.generateAudioIcons(scene);
        this.generateStoreBanner(scene);
        this.generateCustomerGraphics(scene);
    }

    static generateFloorTile(scene) {
        if (scene.textures.exists('supermarket-tile')) return;
        const canvas = scene.textures.createCanvas('supermarket-tile', 64, 64);
        const ctx = canvas.context;

        // Base polished supermarket terrazzo floor
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(0, 0, 64, 64);

        // Subtle marble flecks
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(8, 12, 3, 3);
        ctx.fillRect(38, 22, 2, 2);
        ctx.fillRect(22, 44, 3, 2);
        ctx.fillRect(50, 52, 2, 3);

        // Clean grout grid lines
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, 64, 64);

        // Glossy reflective diagonal sheen
        const grad = ctx.createLinearGradient(0, 0, 64, 64);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
        grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.1)');
        grad.addColorStop(0.7, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(1, 1, 62, 62);

        canvas.refresh();
    }

    static generateAisleRunner(scene) {
        if (scene.textures.exists('aisle-runner')) return;
        const canvas = scene.textures.createCanvas('aisle-runner', 64, 64);
        const ctx = canvas.context;

        // Walkway background with soft cyan/slate tone
        ctx.fillStyle = '#e0f2fe';
        ctx.fillRect(0, 0, 64, 64);

        // Outer aisle edges
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(1, 1, 62, 62);

        // Directional center walking guideline dashes
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.roundRect(28, 6, 8, 20, 3);
        ctx.roundRect(28, 38, 8, 20, 3);
        ctx.fill();

        // Subtle walking chevron
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.moveTo(32, 10); ctx.lineTo(36, 16); ctx.lineTo(28, 16);
        ctx.fill();

        canvas.refresh();
    }

    static generateEntranceDoor(scene) {
        if (scene.textures.exists('door-entrance')) return;
        const canvas = scene.textures.createCanvas('door-entrance', 180, 90);
        const ctx = canvas.context;

        // Door frame
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.roundRect(0, 0, 180, 90, 8);
        ctx.fill();

        // Carpet runner mat (Green - Entrance)
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.roundRect(6, 6, 168, 78, 6);
        ctx.fill();
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Ribbed door mat stripes
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
        ctx.lineWidth = 2;
        for (let y = 14; y < 80; y += 8) {
            ctx.beginPath();
            ctx.moveTo(14, y); ctx.lineTo(166, y);
            ctx.stroke();
        }

        // Green motion sensor box above
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.roundRect(60, 2, 60, 12, 3);
        ctx.fill();
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(90, 8, 3, 0, Math.PI * 2);
        ctx.fill();

        // Sign text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 15px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('▼ ENTRANCE ▼', 90, 48);

        canvas.refresh();
    }

    static generateExitDoor(scene) {
        if (scene.textures.exists('door-exit')) return;
        const canvas = scene.textures.createCanvas('door-exit', 180, 90);
        const ctx = canvas.context;

        // Door frame
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.roundRect(0, 0, 180, 90, 8);
        ctx.fill();

        // Carpet runner mat (Dark Navy / Amber - Exit)
        ctx.fillStyle = '#1e3a8a';
        ctx.beginPath();
        ctx.roundRect(6, 6, 168, 78, 6);
        ctx.fill();
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Ribbed lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
        ctx.lineWidth = 2;
        for (let y = 14; y < 80; y += 8) {
            ctx.beginPath();
            ctx.moveTo(14, y); ctx.lineTo(166, y);
            ctx.stroke();
        }

        // Loss prevention security scanner pillars on both sides
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(10, 12, 10, 66);
        ctx.fillRect(160, 12, 10, 66);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(12, 16, 6, 6);
        ctx.fillRect(162, 16, 6, 6);

        // Red sensor box
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.roundRect(60, 2, 60, 12, 3);
        ctx.fill();
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(90, 8, 3, 0, Math.PI * 2);
        ctx.fill();

        // Sign text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 15px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('▲ EXIT ▲', 90, 48);

        canvas.refresh();
    }

    static generateShoppingCarts(scene) {
        if (scene.textures.exists('shopping-carts')) return;
        const canvas = scene.textures.createCanvas('shopping-carts', 70, 60);
        const ctx = canvas.context;

        // Metallic shopping cart bay
        for (let i = 0; i < 3; i++) {
            const ox = 8 + (i * 14);
            const oy = 6 + (i * 2);

            // Wire basket
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(ox, oy, 26, 32);
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(ox, oy, 26, 32);

            // Red handle bar
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(ox - 3, oy + 26, 6, 6);

            // Wheels
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.arc(ox + 4, oy + 38, 3, 0, Math.PI * 2);
            ctx.arc(ox + 22, oy + 38, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        canvas.refresh();
    }

    static generateShelfGraphic(scene) {
        if (scene.textures.exists('shelf-unit')) return;
        const canvas = scene.textures.createCanvas('shelf-unit', 240, 130);
        const ctx = canvas.context;

        // Drop shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
        ctx.beginPath();
        ctx.roundRect(6, 12, 228, 114, 12);
        ctx.fill();

        // Gondola back panel (clean store white/slate gradient)
        const gradient = ctx.createLinearGradient(0, 0, 0, 120);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(1, '#e2e8f0');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(8, 6, 224, 114, 10);
        ctx.fill();
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Top tier shelf (warm natural oak shelf plank)
        const oak = ctx.createLinearGradient(0, 0, 0, 12);
        oak.addColorStop(0, '#fde68a');
        oak.addColorStop(1, '#d97706');
        ctx.fillStyle = oak;
        ctx.beginPath();
        ctx.roundRect(14, 18, 212, 12, 4);
        ctx.fill();
        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Middle tier shelf (oak plank)
        ctx.fillStyle = oak;
        ctx.beginPath();
        ctx.roundRect(14, 62, 212, 12, 4);
        ctx.fill();
        ctx.stroke();

        // Chrome safety guard rails on shelves
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(14, 16); ctx.lineTo(226, 16);
        ctx.moveTo(14, 60); ctx.lineTo(226, 60);
        ctx.stroke();

        // Bottom heavy industrial base rim
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.roundRect(10, 104, 220, 16, 4);
        ctx.fill();

        // Red/white retail price channel strip
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(16, 68, 208, 4);

        canvas.refresh();
    }

    static generateCheckoutDesk(scene) {
        if (scene.textures.exists('checkout-counter')) return;
        const canvas = scene.textures.createCanvas('checkout-counter', 280, 110);
        const ctx = canvas.context;

        // Drop shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.roundRect(6, 10, 268, 96, 10);
        ctx.fill();

        // Stainless steel / Royal Blue counter body
        const counterGrad = ctx.createLinearGradient(0, 0, 0, 100);
        counterGrad.addColorStop(0, '#0369a1');
        counterGrad.addColorStop(1, '#0f172a');
        ctx.fillStyle = counterGrad;
        ctx.beginPath();
        ctx.roundRect(8, 6, 264, 94, 8);
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Chrome stainless steel top trim
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(8, 6, 264, 6);

        // Conveyor belt bed (black ribbed rubber)
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.roundRect(16, 16, 136, 74, 4);
        ctx.fill();
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Conveyor roller slats
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.5;
        for (let x = 24; x < 146; x += 14) {
            ctx.beginPath();
            ctx.moveTo(x, 18);
            ctx.lineTo(x, 88);
            ctx.stroke();
        }

        // Modern Touch POS Terminal Station
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.roundRect(164, 18, 96, 56, 6);
        ctx.fill();
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // POS Digital Screen
        ctx.fillStyle = '#020617';
        ctx.fillRect(170, 24, 84, 28);
        ctx.fillStyle = '#22c55e';
        ctx.font = 'bold 11px monospace';
        ctx.fillText('READY • $0.00', 174, 42);

        // Barcode laser lens
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(156, 42, 6, 22);

        // Register label
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 11px system-ui, sans-serif';
        ctx.fillText('CASH REGISTER', 170, 92);

        canvas.refresh();
    }

    static generateCashierCharacter(scene) {
        if (scene.textures.exists('cashier-character')) return;
        const canvas = scene.textures.createCanvas('cashier-character', 48, 60);
        const ctx = canvas.context;

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(24, 56, 14, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Uniform body (Store apron over white shirt)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(14, 20, 20, 22, 4);
        ctx.fill();

        // Blue Staff Apron
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.roundRect(15, 22, 18, 20, 3);
        ctx.fill();

        // Gold Staff Badge
        ctx.fillStyle = '#eab308';
        ctx.fillRect(24, 25, 6, 4);

        // Neck & Head
        ctx.fillStyle = '#fcd34d';
        ctx.beginPath();
        ctx.arc(24, 13, 9, 0, Math.PI * 2);
        ctx.fill();

        // Friendly eyes & smile
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(21, 13, 1.5, 0, Math.PI * 2);
        ctx.arc(27, 13, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(24, 15, 3, 0, Math.PI);
        ctx.stroke();

        // Blue Store Visor / Cap
        ctx.fillStyle = '#0369a1';
        ctx.beginPath();
        ctx.arc(24, 10, 9, Math.PI, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(17, 8, 14, 3);

        canvas.refresh();
    }

    static generateTapToCheckoutBadge(scene) {
        if (scene.textures.exists('tap-checkout-badge')) return;
        const canvas = scene.textures.createCanvas('tap-checkout-badge', 150, 36);
        const ctx = canvas.context;

        // Glowing gold/green interactive badge
        const grad = ctx.createLinearGradient(0, 0, 150, 0);
        grad.addColorStop(0, '#16a34a');
        grad.addColorStop(1, '#eab308');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(2, 2, 146, 32, 16);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🛎️ TAP TO CASH OUT', 75, 18);

        canvas.refresh();
    }

    static generateCoinIcon(scene) {
        if (scene.textures.exists('coin-icon')) return;
        const canvas = scene.textures.createCanvas('coin-icon', 48, 48);
        const ctx = canvas.context;

        // Outer glow
        ctx.fillStyle = '#b45309';
        ctx.beginPath();
        ctx.arc(24, 24, 20, 0, Math.PI * 2);
        ctx.fill();

        // Gold coin face
        const grad = ctx.createRadialGradient(20, 20, 2, 24, 24, 20);
        grad.addColorStop(0, '#fef08a');
        grad.addColorStop(0.7, '#eab308');
        grad.addColorStop(1, '#ca8a04');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(24, 24, 18, 0, Math.PI * 2);
        ctx.fill();

        // Inner rim
        ctx.strokeStyle = '#fef9c3';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(24, 24, 14, 0, Math.PI * 2);
        ctx.stroke();

        // Currency rupee/dollar sign
        ctx.fillStyle = '#78350f';
        ctx.font = 'bold 19px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('₹', 24, 24);

        canvas.refresh();
    }

    static generateProductIcons(scene) {
        // Apples
        if (!scene.textures.exists('prod-apples')) {
            const canvas = scene.textures.createCanvas('prod-apples', 44, 44);
            const ctx = canvas.context;
            ctx.fillStyle = '#dc2626';
            ctx.beginPath();
            ctx.arc(17, 24, 13, 0, Math.PI * 2);
            ctx.arc(27, 24, 13, 0, Math.PI * 2);
            ctx.fill();
            // Highlight
            ctx.fillStyle = '#f87171';
            ctx.beginPath();
            ctx.arc(15, 20, 4, 0, Math.PI * 2);
            ctx.fill();
            // Stem & leaf
            ctx.fillStyle = '#78350f';
            ctx.fillRect(21, 6, 3, 8);
            ctx.fillStyle = '#16a34a';
            ctx.beginPath();
            ctx.ellipse(28, 10, 6, 3, Math.PI / 4, 0, Math.PI * 2);
            ctx.fill();
            canvas.refresh();
        }

        // Milk
        if (!scene.textures.exists('prod-milk')) {
            const canvas = scene.textures.createCanvas('prod-milk', 44, 44);
            const ctx = canvas.context;
            // Bottle body
            ctx.fillStyle = '#38bdf8';
            ctx.beginPath();
            ctx.roundRect(12, 12, 20, 26, 4);
            ctx.fill();
            // White label
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(12, 20, 20, 12);
            ctx.fillStyle = '#0284c7';
            ctx.fillRect(14, 24, 16, 4);
            // Cap
            ctx.fillStyle = '#0284c7';
            ctx.beginPath();
            ctx.roundRect(16, 6, 12, 6, 2);
            ctx.fill();
            canvas.refresh();
        }

        // Bread
        if (!scene.textures.exists('prod-bread')) {
            const canvas = scene.textures.createCanvas('prod-bread', 44, 44);
            const ctx = canvas.context;
            ctx.fillStyle = '#d97706';
            ctx.beginPath();
            ctx.ellipse(22, 24, 18, 12, 0, 0, Math.PI * 2);
            ctx.fill();
            // Crust cuts
            ctx.strokeStyle = '#78350f';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(12, 17); ctx.lineTo(16, 31);
            ctx.moveTo(20, 15); ctx.lineTo(24, 33);
            ctx.moveTo(28, 17); ctx.lineTo(32, 31);
            ctx.stroke();
            canvas.refresh();
        }

        // Rice
        if (!scene.textures.exists('prod-rice')) {
            const canvas = scene.textures.createCanvas('prod-rice', 44, 44);
            const ctx = canvas.context;
            // Sack body
            ctx.fillStyle = '#059669';
            ctx.beginPath();
            ctx.roundRect(10, 14, 24, 24, 4);
            ctx.fill();
            // Tie string
            ctx.fillStyle = '#ca8a04';
            ctx.fillRect(14, 11, 16, 4);
            // Label
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 9px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('RICE', 22, 28);
            canvas.refresh();
        }

        // Snacks
        if (!scene.textures.exists('prod-snacks')) {
            const canvas = scene.textures.createCanvas('prod-snacks', 44, 44);
            const ctx = canvas.context;
            ctx.fillStyle = '#ec4899';
            ctx.beginPath();
            ctx.moveTo(12, 6); ctx.lineTo(32, 6);
            ctx.lineTo(34, 38); ctx.lineTo(10, 38);
            ctx.closePath();
            ctx.fill();
            // Crispy chip illustration
            ctx.fillStyle = '#fef08a';
            ctx.beginPath();
            ctx.arc(22, 22, 6, 0, Math.PI * 2);
            ctx.fill();
            canvas.refresh();
        }
    }

    static generateQueueSpot(scene) {
        if (scene.textures.exists('queue-spot')) return;
        const canvas = scene.textures.createCanvas('queue-spot', 52, 52);
        const ctx = canvas.context;

        // Glowing circle waiting spot on floor
        ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
        ctx.beginPath();
        ctx.arc(26, 26, 22, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(26, 26, 20, 0, Math.PI * 2);
        ctx.stroke();

        canvas.refresh();
    }

    static generateStoreBanner(scene) {
        if (scene.textures.exists('store-banner')) return;
        const canvas = scene.textures.createCanvas('store-banner', 560, 68);
        const ctx = canvas.context;

        // Modern Supermarket Canopy
        const grad = ctx.createLinearGradient(0, 0, 560, 0);
        grad.addColorStop(0, '#0f172a');
        grad.addColorStop(0.5, '#0369a1');
        grad.addColorStop(1, '#0f172a');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(0, 0, 560, 68, 12);
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Neon Glow Text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🛒 SUPERMARKET TYCOON', 280, 32);

        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 12px monospace';
        ctx.fillText('★ FRESH QUALITY GROCERIES • MINI MART #1 ★', 280, 52);

        canvas.refresh();
    }

    static generateAudioIcons(scene) {
        if (!scene.textures.exists('ui-audio-on')) {
            const canvas = scene.textures.createCanvas('ui-audio-on', 40, 40);
            const ctx = canvas.context;
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.arc(20, 20, 18, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 2;
            ctx.stroke();
            // Speaker
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(12, 15); ctx.lineTo(18, 15); ctx.lineTo(24, 10);
            ctx.lineTo(24, 30); ctx.lineTo(18, 25); ctx.lineTo(12, 25);
            ctx.closePath();
            ctx.fill();
            // Waves
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(24, 20, 7, -Math.PI / 3, Math.PI / 3);
            ctx.stroke();
            canvas.refresh();
        }

        if (!scene.textures.exists('ui-audio-off')) {
            const canvas = scene.textures.createCanvas('ui-audio-off', 40, 40);
            const ctx = canvas.context;
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.arc(20, 20, 18, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2;
            ctx.stroke();
            // Speaker
            ctx.fillStyle = '#94a3b8';
            ctx.beginPath();
            ctx.moveTo(12, 15); ctx.lineTo(18, 15); ctx.lineTo(24, 10);
            ctx.lineTo(24, 30); ctx.lineTo(18, 25); ctx.lineTo(12, 25);
            ctx.closePath();
            ctx.fill();
            // Red strike
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(10, 10); ctx.lineTo(30, 30);
            ctx.stroke();
            canvas.refresh();
        }
    }

    static generateCustomerGraphics(scene) {
        // 1. Separate Leg Texture for Walking Animation
        if (!scene.textures.exists('customer-leg')) {
            const canvas = scene.textures.createCanvas('customer-leg', 12, 22);
            const ctx = canvas.context;
            // Trousers / Pants leg
            ctx.fillStyle = '#1e293b';
            ctx.beginPath();
            ctx.roundRect(2, 0, 8, 15, 2);
            ctx.fill();
            // White Sneaker / Shoe
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.roundRect(1, 14, 10, 7, 2);
            ctx.fill();
            // Shoe sole
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(1, 19, 10, 2);
            canvas.refresh();
        }

        // 2. Torso & Head Avatars (without static legs, legs animate separately)
        const themes = [
            { shirt: '#ef4444', hair: '#1e293b', skin: '#fed7aa' },
            { shirt: '#3b82f6', hair: '#78350f', skin: '#fcd34d' },
            { shirt: '#10b981', hair: '#d97706', skin: '#ffedd5' },
            { shirt: '#8b5cf6', hair: '#0f172a', skin: '#fbcfe8' },
            { shirt: '#f59e0b', hair: '#451a03', skin: '#fed7aa' }
        ];

        themes.forEach((theme, i) => {
            const key = `customer-torso-${i}`;
            if (!scene.textures.exists(key)) {
                const canvas = scene.textures.createCanvas(key, 44, 46);
                const ctx = canvas.context;

                // Torso / Shirt
                ctx.fillStyle = theme.shirt;
                ctx.beginPath();
                ctx.roundRect(10, 18, 24, 24, 4);
                ctx.fill();

                // Collar
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.moveTo(18, 18); ctx.lineTo(22, 24); ctx.lineTo(26, 18);
                ctx.fill();

                // Head
                ctx.fillStyle = theme.skin;
                ctx.beginPath();
                ctx.arc(22, 12, 10, 0, Math.PI * 2);
                ctx.fill();

                // Eyes
                ctx.fillStyle = '#1e293b';
                ctx.beginPath();
                ctx.arc(19, 12, 1.5, 0, Math.PI * 2);
                ctx.arc(25, 12, 1.5, 0, Math.PI * 2);
                ctx.fill();

                // Hair
                ctx.fillStyle = theme.hair;
                ctx.beginPath();
                ctx.arc(22, 9, 10, Math.PI, Math.PI * 2);
                ctx.fill();

                canvas.refresh();
            }
        });

        // 3. Basket
        if (!scene.textures.exists('customer-basket')) {
            const canvas = scene.textures.createCanvas('customer-basket', 28, 24);
            const ctx = canvas.context;
            ctx.strokeStyle = '#78350f';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(14, 12, 9, Math.PI, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = '#d97706';
            ctx.beginPath();
            ctx.moveTo(4, 10); ctx.lineTo(24, 10);
            ctx.lineTo(21, 22); ctx.lineTo(7, 22);
            ctx.closePath();
            ctx.fill();
            canvas.refresh();
        }

        // 4. Thought Bubbles
        if (!scene.textures.exists('bubble-thought')) {
            const canvas = scene.textures.createCanvas('bubble-thought', 44, 40);
            const ctx = canvas.context;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.roundRect(2, 2, 40, 28, 8);
            ctx.fill();
            ctx.strokeStyle = '#0284c7';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(18, 30); ctx.lineTo(22, 38); ctx.lineTo(26, 30);
            ctx.fill();
            canvas.refresh();
        }

        if (!scene.textures.exists('bubble-heart')) {
            const canvas = scene.textures.createCanvas('bubble-heart', 26, 26);
            const ctx = canvas.context;
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(9, 9, 6, Math.PI, 0, false);
            ctx.arc(17, 9, 6, Math.PI, 0, false);
            ctx.lineTo(13, 22);
            ctx.closePath();
            ctx.fill();
            canvas.refresh();
        }

        if (!scene.textures.exists('bubble-disappointed')) {
            const canvas = scene.textures.createCanvas('bubble-disappointed', 26, 26);
            const ctx = canvas.context;
            ctx.fillStyle = '#64748b';
            ctx.beginPath();
            ctx.arc(9, 9, 6, Math.PI, 0, false);
            ctx.arc(17, 9, 6, Math.PI, 0, false);
            ctx.lineTo(13, 22);
            ctx.closePath();
            ctx.fill();
            canvas.refresh();
        }
    }
}
