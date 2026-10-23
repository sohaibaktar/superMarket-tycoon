/**
 * LocalSaveAdapter: Fallback persistence adapter using browser localStorage
 * for local development and offline browser sandbox environments.
 */
export class LocalSaveAdapter {
    /**
     * @param {string} storageKey
     */
    constructor(storageKey = 'yt_supermarket_save_v1') {
        this.storageKey = storageKey;
    }

    /**
     * Load raw data string from localStorage.
     * @returns {Promise<string | null>}
     */
    async load() {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                return window.localStorage.getItem(this.storageKey);
            }
        } catch (err) {
            console.warn('LocalSaveAdapter: localStorage inaccessible:', err);
        }
        return null;
    }

    /**
     * Save data string to localStorage.
     * @param {string} dataString
     * @returns {Promise<void>}
     */
    async save(dataString) {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                window.localStorage.setItem(this.storageKey, dataString);
            }
        } catch (err) {
            console.warn('LocalSaveAdapter: failed to save to localStorage:', err);
        }
    }

    /**
     * Clear saved data (e.g. for game reset).
     */
    async clear() {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                window.localStorage.removeItem(this.storageKey);
            }
        } catch (err) {
            // Safe ignore
        }
    }
}
