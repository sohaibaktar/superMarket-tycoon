import { YouTubePlayables } from '../../YouTubePlayables.js';

/**
 * PlayablesSaveAdapter: Production persistence adapter interfacing with the official
 * YouTube Playables Cloud Save API (window.ytgame.game.loadData / saveData).
 */
export class PlayablesSaveAdapter {
    constructor(timeoutMs = 1500) {
        this.timeoutMs = timeoutMs;
        this.MAX_BYTES = 100 * 1024; // 100 KB platform payload limit
    }

    /**
     * Load cloud data via YouTube Playables SDK with timeout protection.
     * @returns {Promise<object | null>}
     */
    async load() {
        if (!YouTubePlayables.inPlayablesEnv) {
            return null;
        }

        try {
            const rawData = await YouTubePlayables.withTimeout(
                YouTubePlayables.loadData(),
                this.timeoutMs
            );
            return rawData || null;
        } catch (err) {
            console.error('PlayablesSaveAdapter: Failed to load cloud data:', err);
            return null;
        }
    }

    /**
     * Save data payload via YouTube Playables SDK.
     * @param {object} payload
     * @returns {Promise<boolean>}
     */
    async save(payload) {
        if (!YouTubePlayables.inPlayablesEnv) {
            return false;
        }

        try {
            const jsonStr = JSON.stringify(payload);
            const byteSize = new Blob([jsonStr]).size;

            if (byteSize > this.MAX_BYTES) {
                console.warn(`PlayablesSaveAdapter: Payload size (${byteSize}B) exceeds 100KB limit!`);
                return false;
            }

            await YouTubePlayables.saveData(payload);
            return true;
        } catch (err) {
            console.error('PlayablesSaveAdapter: Failed to save cloud data:', err);
            return false;
        }
    }
}
