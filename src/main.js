import { Boot } from './scenes/Boot.js';
import { Preloader } from './scenes/Preloader.js';
import { MainMenu } from './scenes/MainMenu.js';
import { SupermarketScene } from './scenes/SupermarketScene.js';
import { UI } from './scenes/UI.js';
import { YouTubePlayables } from './YouTubePlayables.js';

// Calling YouTubePlayables.boot waits until the document has loaded
// and the YouTube Playables API is ready before starting the Phaser game.
YouTubePlayables.boot(() => {
    new Phaser.Game({
        type: Phaser.AUTO,
        width: 820,
        height: 1180,
        parent: 'gameParent',
        backgroundColor: '#0f172a',
        scale: {
            mode: Phaser.Scale.EXPAND,
            autoCenter: Phaser.Scale.CENTER_BOTH
        },
        scene: [
            Boot,
            Preloader,
            MainMenu,
            SupermarketScene,
            UI
        ]
    });
});
