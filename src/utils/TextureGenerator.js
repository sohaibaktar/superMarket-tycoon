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
        this.generateEntranceMat(scene);
        this.generateShelfGraphic(scene);
        this.generateCheckoutDesk(scene);
        this.generateCoinIcon(scene);
        this.generateProductIcons(scene);
        this.generateQueueSpot(scene);
        this.generateAudioIcons(scene);
        this.generateStoreBanner(scene);
    }

    static generateFloorTile(scene) {
        if (scene.textures.exists('supermarket-tile')) return;
        const canvas = scene.textures.createCanvas('supermarket-tile', 64, 64);
        const ctx = canvas.context;

        // Base light cream floor
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, 64, 64);

        // Subtle tile grid lines
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, 64, 64);

        // Subtle specular highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillRect(2, 2, 60, 2);
        ctx.fillRect(2, 2, 2, 60);

        canvas.refresh();
    }

    static generateAisleRunner(scene) {
        if (scene.textures.exists('aisle-runner')) return;
        const canvas = scene.textures.createCanvas('aisle-runner', 64, 64);
        const ctx = canvas.context;

        ctx.fillStyle = '#e0f2fe';
        ctx.fillRect(0, 0, 64, 64);

        ctx.strokeStyle = '#bae6fd';
        ctx.lineWidth = 2;
        ctx.strokeRect(1, 1, 62, 62);

        // Center dashed direction guideline
        ctx.fillStyle = '#93c5fd';
        ctx.fillRect(30, 8, 4, 16);
        ctx.fillRect(30, 40, 4, 16);

        canvas.refresh();
    }

    static generateEntranceMat(scene) {
        if (scene.textures.exists('entrance-mat')) return;
        const canvas = scene.textures.createCanvas('entrance-mat', 160, 70);
        const ctx = canvas.context;

        // Mat border
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.roundRect(0, 0, 160, 70, 8);
        ctx.fill();

        // Mat interior
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.roundRect(4, 4, 152, 62, 6);
        ctx.fill();

        // Welcome text
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('▼ WELCOME ▼', 80, 35);

        canvas.refresh();
    }

    static generateShelfGraphic(scene) {
        if (scene.textures.exists('shelf-unit')) return;
        const canvas = scene.textures.createCanvas('shelf-unit', 240, 130);
        const ctx = canvas.context;

        // Soft drop shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
        ctx.beginPath();
        ctx.roundRect(6, 12, 228, 114, 12);
        ctx.fill();

        // Main shelf back panel
        const gradient = ctx.createLinearGradient(0, 0, 0, 120);
        gradient.addColorStop(0, '#f1f5f9');
        gradient.addColorStop(1, '#cbd5e1');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(8, 6, 224, 114, 10);
        ctx.fill();
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Top tier shelf
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.roundRect(14, 20, 212, 10, 4);
        ctx.fill();

        // Middle tier shelf
        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.roundRect(14, 64, 212, 10, 4);
        ctx.fill();

        // Bottom base rim
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.roundRect(10, 106, 220, 14, 4);
        ctx.fill();

        // Shelf label trim (red/white sale stripe)
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(16, 68, 208, 4);

        canvas.refresh();
    }

    static generateCheckoutDesk(scene) {
        if (scene.textures.exists('checkout-counter')) return;
        const canvas = scene.textures.createCanvas('checkout-counter', 280, 110);
        const ctx = canvas.context;

        // Drop shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.beginPath();
        ctx.roundRect(6, 10, 268, 96, 10);
        ctx.fill();

        // Main desk surface
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.roundRect(8, 6, 264, 94, 8);
        ctx.fill();
        ctx.strokeStyle = '#0369a1';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Conveyor belt section
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.roundRect(16, 14, 140, 78, 4);
        ctx.fill();

        // Conveyor rollers
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        for (let x = 24; x < 150; x += 16) {
            ctx.beginPath();
            ctx.moveTo(x, 16);
            ctx.lineTo(x, 90);
            ctx.stroke();
        }

        // Cash Register Terminal
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.roundRect(170, 20, 80, 50, 6);
        ctx.fill();
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Register screen
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(176, 26, 68, 24);
        ctx.fillStyle = '#22c55e';
        ctx.font = 'bold 10px monospace';
        ctx.fillText('$0.00', 180, 42);

        // Card reader / PIN pad
        ctx.fillStyle = '#334155';
        ctx.fillRect(180, 54, 30, 12);

        // Barcode scanner light
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(158, 40, 4, 20);

        // Cashier desk text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText('CHECKOUT', 180, 88);

        canvas.refresh();
    }

    static generateCoinIcon(scene) {
        if (scene.textures.exists('coin-icon')) return;
        const canvas = scene.textures.createCanvas('coin-icon', 48, 48);
        const ctx = canvas.context;

        // Outer glow/shadow
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

        // Dollar sign
        ctx.fillStyle = '#78350f';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', 24, 25);

        canvas.refresh();
    }

    static generateProductIcons(scene) {
        // Apples
        if (!scene.textures.exists('prod-apples')) {
            const canvas = scene.textures.createCanvas('prod-apples', 44, 44);
            const ctx = canvas.context;
            // Apple body
            ctx.fillStyle = '#dc2626';
            ctx.beginPath();
            ctx.arc(17, 24, 13, 0, Math.PI * 2);
            ctx.arc(27, 24, 13, 0, Math.PI * 2);
            ctx.fill();
            // Highlight
            ctx.fillStyle = '#f87171';
            ctx.beginPath();
            ctx.arc(15, 18, 4, 0, Math.PI * 2);
            ctx.fill();
            // Stem
            ctx.strokeStyle = '#78350f';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(22, 14);
            ctx.lineTo(24, 6);
            ctx.stroke();
            // Leaf
            ctx.fillStyle = '#16a34a';
            ctx.beginPath();
            ctx.ellipse(28, 8, 6, 3, Math.PI / 4, 0, Math.PI * 2);
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
            ctx.roundRect(10, 12, 24, 28, 4);
            ctx.fill();
            // White label
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(10, 20, 24, 14);
            // Bottle neck & cap
            ctx.fillStyle = '#0284c7';
            ctx.fillRect(16, 4, 12, 8);
            // Drop motif
            ctx.fillStyle = '#0ea5e9';
            ctx.beginPath();
            ctx.arc(22, 27, 4, 0, Math.PI * 2);
            ctx.fill();
            canvas.refresh();
        }

        // Bread
        if (!scene.textures.exists('prod-bread')) {
            const canvas = scene.textures.createCanvas('prod-bread', 44, 44);
            const ctx = canvas.context;
            // Loaf body
            ctx.fillStyle = '#d97706';
            ctx.beginPath();
            ctx.ellipse(22, 24, 18, 12, 0, 0, Math.PI * 2);
            ctx.fill();
            // Crust top
            ctx.fillStyle = '#b45309';
            ctx.beginPath();
            ctx.ellipse(22, 20, 16, 8, 0, Math.PI, Math.PI * 2);
            ctx.fill();
            // Baker slices
            ctx.strokeStyle = '#fef3c7';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(14, 18); ctx.lineTo(14, 26);
            ctx.moveTo(22, 16); ctx.lineTo(22, 28);
            ctx.moveTo(30, 18); ctx.lineTo(30, 26);
            ctx.stroke();
            canvas.refresh();
        }

        // Rice
        if (!scene.textures.exists('prod-rice')) {
            const canvas = scene.textures.createCanvas('prod-rice', 44, 44);
            const ctx = canvas.context;
            // Sack body
            ctx.fillStyle = '#10b981';
            ctx.beginPath();
            ctx.roundRect(10, 12, 24, 28, 6);
            ctx.fill();
            // Tied top
            ctx.fillStyle = '#059669';
            ctx.fillRect(14, 6, 16, 7);
            // Grain label
            ctx.fillStyle = '#ecfdf5';
            ctx.font = 'bold 9px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('RICE', 22, 28);
            canvas.refresh();
        }

        // Snacks
        if (!scene.textures.exists('prod-snacks')) {
            const canvas = scene.textures.createCanvas('prod-snacks', 44, 44);
            const ctx = canvas.context;
            // Pouch
            ctx.fillStyle = '#ec4899';
            ctx.beginPath();
            ctx.moveTo(12, 6);
            ctx.lineTo(32, 6);
            ctx.lineTo(34, 38);
            ctx.lineTo(10, 38);
            ctx.closePath();
            ctx.fill();
            // Zigzag crimp top
            ctx.fillStyle = '#be185d';
            ctx.fillRect(10, 4, 24, 4);
            // Star burst badge
            ctx.fillStyle = '#fde047';
            ctx.beginPath();
            ctx.arc(22, 23, 7, 0, Math.PI * 2);
            ctx.fill();
            canvas.refresh();
        }
    }

    static generateQueueSpot(scene) {
        if (scene.textures.exists('queue-spot')) return;
        const canvas = scene.textures.createCanvas('queue-spot', 50, 50);
        const ctx = canvas.context;

        // Outer dotted circle
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.arc(25, 25, 20, 0, Math.PI * 2);
        ctx.stroke();

        // Inner glowing dot
        ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
        ctx.beginPath();
        ctx.arc(25, 25, 14, 0, Math.PI * 2);
        ctx.fill();

        canvas.refresh();
    }

    static generateAudioIcons(scene) {
        // Audio On
        if (!scene.textures.exists('ui-audio-on')) {
            const canvas = scene.textures.createCanvas('ui-audio-on', 48, 48);
            const ctx = canvas.context;
            ctx.fillStyle = '#0ea5e9';
            ctx.beginPath();
            ctx.roundRect(2, 2, 44, 44, 10);
            ctx.fill();
            // Speaker
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(12, 19);
            ctx.lineTo(18, 19);
            ctx.lineTo(26, 13);
            ctx.lineTo(26, 35);
            ctx.lineTo(18, 29);
            ctx.lineTo(12, 29);
            ctx.closePath();
            ctx.fill();
            // Sound arcs
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(24, 24, 8, -Math.PI / 3, Math.PI / 3);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(24, 24, 14, -Math.PI / 3, Math.PI / 3);
            ctx.stroke();
            canvas.refresh();
        }

        // Audio Off
        if (!scene.textures.exists('ui-audio-off')) {
            const canvas = scene.textures.createCanvas('ui-audio-off', 48, 48);
            const ctx = canvas.context;
            ctx.fillStyle = '#64748b';
            ctx.beginPath();
            ctx.roundRect(2, 2, 44, 44, 10);
            ctx.fill();
            // Speaker
            ctx.fillStyle = '#cbd5e1';
            ctx.beginPath();
            ctx.moveTo(12, 19);
            ctx.lineTo(18, 19);
            ctx.lineTo(26, 13);
            ctx.lineTo(26, 35);
            ctx.lineTo(18, 29);
            ctx.lineTo(12, 29);
            ctx.closePath();
            ctx.fill();
            // Red slash
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(8, 8);
            ctx.lineTo(40, 40);
            ctx.stroke();
            canvas.refresh();
        }
    }

    static generateStoreBanner(scene) {
        if (scene.textures.exists('store-banner')) return;
        const canvas = scene.textures.createCanvas('store-banner', 520, 72);
        const ctx = canvas.context;

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.beginPath();
        ctx.roundRect(6, 6, 508, 64, 12);
        ctx.fill();

        // Banner gradient
        const grad = ctx.createLinearGradient(0, 0, 520, 0);
        grad.addColorStop(0, '#0284c7');
        grad.addColorStop(0.5, '#0ea5e9');
        grad.addColorStop(1, '#0284c7');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(4, 2, 512, 64, 12);
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Store Title
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 26px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🛒 SUPERMARKET TYCOON', 260, 24);

        ctx.fillStyle = '#e0f2fe';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText('★ MINI MART STORE #1 ★', 260, 48);

        canvas.refresh();
    }
}
