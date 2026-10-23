/**
 * SaveManager: Coordinates state serialization, data validation,
 * and dual-adapter persistence (YouTube Playables Cloud + LocalStorage Fallback).
 * Pure JavaScript with zero Phaser dependencies.
 */
export class SaveManager {
    /**
     * @param {object} systems
     * @param {import('../systems/EconomySystem.js').EconomySystem} systems.economy
     * @param {import('../systems/InventorySystem.js').InventorySystem} systems.inventory
     * @param {import('../systems/DayCycleSystem.js').DayCycleSystem} systems.dayCycle
     * @param {import('../systems/MarketingSystem.js').MarketingSystem} systems.marketing
     * @param {import('../systems/BankLoanSystem.js').BankLoanSystem} systems.bank
     * @param {import('../systems/ProgressionSystem.js').ProgressionSystem} systems.progression
     * @param {object} [adapters]
     * @param {object} [adapters.primaryAdapter]
     * @param {object} [adapters.fallbackAdapter]
     */
    constructor(systems, adapters = {}) {
        this.systems = systems;
        this.primaryAdapter = adapters.primaryAdapter || null;
        this.fallbackAdapter = adapters.fallbackAdapter || null;

        this.SCHEMA_VERSION = 1;
        this.lastSavedAt = 0;
        this._debounceTimer = null;
    }

    /**
     * Compile durable game state into a validated save payload.
     * @returns {object}
     */
    createPayload() {
        return {
            schemaVersion: this.SCHEMA_VERSION,
            savedAt: Date.now(),
            economy: this.systems.economy ? this.systems.economy.toJSON() : null,
            inventory: this.systems.inventory ? this.systems.inventory.toJSON() : null,
            dayCycle: this.systems.dayCycle ? this.systems.dayCycle.toJSON() : null,
            marketing: this.systems.marketing ? this.systems.marketing.toJSON() : null,
            bank: this.systems.bank ? this.systems.bank.toJSON() : null,
            progression: this.systems.progression ? this.systems.progression.toJSON() : null
        };
    }

    /**
     * Save current game state across available persistence adapters.
     * @returns {Promise<boolean>}
     */
    async save() {
        const payload = this.createPayload();
        let saved = false;

        // Try primary platform adapter (YouTube Playables Cloud)
        if (this.primaryAdapter) {
            try {
                saved = await this.primaryAdapter.save(payload);
            } catch (err) {
                console.warn('SaveManager: Primary save adapter failed:', err);
            }
        }

        // Try fallback adapter (localStorage) if primary unavailable or local
        if (this.fallbackAdapter) {
            try {
                const jsonStr = JSON.stringify(payload);
                await this.fallbackAdapter.save(jsonStr);
                saved = true;
            } catch (err) {
                console.warn('SaveManager: Fallback save adapter failed:', err);
            }
        }

        if (saved) {
            this.lastSavedAt = payload.savedAt;
        }

        return saved;
    }

    /**
     * Debounced save to prevent excessive disk/network writes.
     * @param {number} [delayMs=1500]
     */
    scheduleSave(delayMs = 1500) {
        if (this._debounceTimer) {
            clearTimeout(this._debounceTimer);
        }

        this._debounceTimer = setTimeout(() => {
            this.save();
            this._debounceTimer = null;
        }, delayMs);
    }

    /**
     * Load, validate, and restore saved state.
     * @returns {Promise<boolean>} True if valid state was loaded, false otherwise.
     */
    async load() {
        let loadedData = null;

        // Try primary adapter
        if (this.primaryAdapter) {
            try {
                loadedData = await this.primaryAdapter.load();
            } catch (err) {
                console.warn('SaveManager: Primary load adapter failed:', err);
            }
        }

        // Try fallback adapter if primary gave nothing
        if (!loadedData && this.fallbackAdapter) {
            try {
                const raw = await this.fallbackAdapter.load();
                if (raw && typeof raw === 'string') {
                    loadedData = JSON.parse(raw);
                } else if (raw && typeof raw === 'object') {
                    loadedData = raw;
                }
            } catch (err) {
                console.warn('SaveManager: Fallback load adapter failed:', err);
            }
        }

        if (!loadedData || typeof loadedData !== 'object') {
            return false;
        }

        return this.restorePayload(loadedData);
    }

    /**
     * Validate and restore state safely without corrupting memory on malformed inputs.
     * @param {object} payload
     * @returns {boolean}
     */
    restorePayload(payload) {
        if (!payload || payload.schemaVersion !== this.SCHEMA_VERSION) {
            console.warn('SaveManager: Unknown or incompatible schema version:', payload?.schemaVersion);
            return false;
        }

        try {
            if (this.systems.economy && payload.economy) {
                this.systems.economy.restore(payload.economy);
            }
            if (this.systems.inventory && payload.inventory) {
                this.systems.inventory.restore(payload.inventory);
            }
            if (this.systems.dayCycle && payload.dayCycle) {
                this.systems.dayCycle.restore(payload.dayCycle);
            }
            if (this.systems.marketing && payload.marketing) {
                this.systems.marketing.restore(payload.marketing);
            }
            if (this.systems.bank && payload.bank) {
                this.systems.bank.restore(payload.bank);
            }
            if (this.systems.progression && payload.progression) {
                this.systems.progression.restore(payload.progression);
            }
            this.lastSavedAt = payload.savedAt || Date.now();
            return true;
        } catch (err) {
            console.error('SaveManager: Error restoring save payload:', err);
            return false;
        }
    }
}
