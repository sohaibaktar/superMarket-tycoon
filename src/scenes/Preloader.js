import { Scene } from 'phaser';
import { YouTubePlayables } from '../YouTubePlayables.js';
import { TextureGenerator } from '../utils/TextureGenerator.js';

export class Preloader extends Scene {
    constructor() {
        super('Preloader');
    }

    init() {
        this.createLoadingBar();

        // Notify YouTube Playables SDK that first visual frame is ready
        YouTubePlayables.firstFrameReady();
    }

    preload() {
        // Load audio assets from template
        this.load.setPath('assets/fx');
        this.load.audio('throw', ['throw.wav', 'throw.mp3']);
        this.load.audio('net', ['net.wav', 'net.mp3']);
        this.load.audio('super-shot', ['super-shot.wav', 'super-shot.mp3']);
    }

    create() {
        // Programmatically generate crisp, lightweight supermarket textures
        TextureGenerator.generateAll(this);

        // Launch persistent HUD scene
        this.scene.launch('UI');

        // Transition to MainMenu
        this.scene.start('MainMenu');
    }

    createLoadingBar() {
        const width = this.scale.width;
        const height = this.scale.height;

        this.add.image(0, 0, 'background').setOrigin(0, 0).setDisplaySize(width, height);

        const cx = width / 2;
        const cy = height / 2;

        const barOuterWidth = Math.min(460, width * 0.75);
        const barWidth = barOuterWidth - 4;

        this.add.rectangle(cx, cy, barOuterWidth, 24)
            .setStrokeStyle(1.5, 0x38bdf8);

        const bar = this.add.rectangle(cx - (barWidth / 2) + 2, cy, 4, 20, 0x0284c7);

        this.load.on('progress', (progress) => {
            bar.width = Math.max(4, barWidth * progress);
        });
    }
}
