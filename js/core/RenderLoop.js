// js/core/RenderLoop.js
// Unified requestAnimationFrame loop for all UI updates.
// Replaces separate rAF loops in: Visualizer, EffectControls, Mixer, effectsManager.
// Benefits: single rAF callback, visibility-aware, frame-rate controlled.

export class RenderLoop {
    constructor() {
        this._callbacks = new Map(); // id -> { fn, interval, lastRun, enabled }
        this._rafId = null;
        this._running = false;
        this._tick = this._tick.bind(this);

        // Pause when tab is hidden
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this._stop();
            } else if (this._running) {
                this._start();
            }
        });
    }

    /**
     * Register a callback to run inside the unified loop.
     * @param {string} id - Unique identifier
     * @param {Function} fn - Callback(timestamp)
     * @param {number} interval - Minimum ms between calls (0 = every frame)
     */
    register(id, fn, interval = 0) {
        this._callbacks.set(id, {
            fn,
            interval,
            lastRun: 0,
            enabled: true
        });
    }

    /** Unregister a callback */
    unregister(id) {
        this._callbacks.delete(id);
    }

    /** Enable/disable a specific callback without removing it */
    setEnabled(id, enabled) {
        const cb = this._callbacks.get(id);
        if (cb) cb.enabled = enabled;
    }

    /** Start the loop */
    start() {
        this._running = true;
        if (!document.hidden) this._start();
    }

    _start() {
        if (this._rafId) return;
        this._rafId = requestAnimationFrame(this._tick);
    }

    _stop() {
        if (this._rafId) {
            cancelAnimationFrame(this._rafId);
            this._rafId = null;
        }
    }

    _tick(timestamp) {
        this._rafId = null;

        for (const [id, cb] of this._callbacks) {
            if (!cb.enabled) continue;
            if (cb.interval > 0 && (timestamp - cb.lastRun) < cb.interval) continue;
            cb.lastRun = timestamp;
            try {
                cb.fn(timestamp);
            } catch (e) {
                console.error(`[RenderLoop] Error in '${id}':`, e);
            }
        }

        if (this._running && !document.hidden) {
            this._rafId = requestAnimationFrame(this._tick);
        }
    }
}
