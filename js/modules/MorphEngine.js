// js/modules/MorphEngine.js
// Interpolates between two snapshot states over a configurable duration + curve.
// Runs at ~30fps via RenderLoop. Writes directly to track.params and AudioNodes.

import { NUM_LFOS } from '../utils/constants.js';

// Continuous params that can be interpolated (all numeric track.params keys)
const CONTINUOUS_TRACK_PARAMS = [
    'position', 'spray', 'scanSpeed', 'density', 'grainSize',
    'pitch', 'detune', 'filter', 'hpFilter', 'volume', 'pan', 'gain',
    'attack', 'decay', 'release',
    'sendA', 'sendB',
    'eqLow', 'eqMid', 'eqHigh',
    'drive', 'compThreshold', 'compRatio', 'compAttack', 'compRelease',
    'reverbDecay', 'reverbMix',
    'delayTime', 'delayFeedback', 'delayMix',
    'scanStart', 'scanEnd'
];

// Continuous LFO params
const CONTINUOUS_LFO_PARAMS = ['rate', 'amount'];

export class MorphEngine {
    constructor() {
        // Morph state
        this.active = false;
        this.fromSnap = null;
        this.toSnap = null;
        this.durationMs = 0;
        this.curve = 'linear';
        this.startTime = 0;
        this.fraction = 0;   // Current progress 0–1 (after curve applied)
        this.rawT = 0;       // Raw linear 0–1

        // External refs
        this._tracks = null;
        this._audioEngine = null;
        this._effectsManager = null;
        this._onProgress = null;  // callback(fraction) for header button animation
        this._onComplete = null;  // callback() when morph finishes
    }

    setContext({ tracks, audioEngine, effectsManager }) {
        this._tracks = tracks;
        this._audioEngine = audioEngine;
        this._effectsManager = effectsManager;
    }

    setCallbacks({ onProgress, onComplete }) {
        this._onProgress = onProgress;
        this._onComplete = onComplete;
    }

    // ========================================================================
    // START / STOP
    // ========================================================================

    /**
     * Start a morph between two snapshot data objects.
     * @param {Object} from - Snapshot data (the state we're leaving)
     * @param {Object} to - Snapshot data (the state we're arriving at)
     * @param {number} durationSteps - Duration in sequencer steps
     * @param {string} curve - 'linear', 'ease-in', 'ease-out', 'ease-in-out'
     * @param {number} bpm - Current BPM
     * @param {number} numSteps - Steps per bar (typically 32)
     */
    start(from, to, durationSteps, curve, bpm, numSteps) {
        if (!from || !to || durationSteps <= 0) {
            // Instant — no morph needed
            this.active = false;
            return;
        }

        this.fromSnap = from;
        this.toSnap = to;
        this.curve = curve || 'linear';
        this.rawT = 0;
        this.fraction = 0;

        // Convert steps to milliseconds
        const secPerStep = (60 / bpm) / 4;
        this.durationMs = durationSteps * secPerStep * 1000;
        this.startTime = performance.now();
        this.active = true;
    }

    stop() {
        this.active = false;
        this.fromSnap = null;
        this.toSnap = null;
    }

    // ========================================================================
    // UPDATE (called from RenderLoop at ~30fps)
    // ========================================================================

    update() {
        if (!this.active) return;

        const elapsed = performance.now() - this.startTime;
        this.rawT = Math.min(elapsed / this.durationMs, 1.0);
        this.fraction = this._applyCurve(this.rawT);

        this._interpolate(this.fraction);

        if (this._onProgress) this._onProgress(this.fraction);

        if (this.rawT >= 1.0) {
            this.active = false;
            if (this._onComplete) this._onComplete();
        }
    }

    // ========================================================================
    // CURVE FUNCTIONS
    // ========================================================================

    _applyCurve(t) {
        switch (this.curve) {
            case 'ease-in':     return t * t;
            case 'ease-out':    return t * (2 - t);
            case 'ease-in-out': return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
            default:            return t; // linear
        }
    }

    // ========================================================================
    // INTERPOLATION
    // ========================================================================

    _interpolate(frac) {
        const tracks = this._tracks;
        const ae = this._audioEngine;
        const em = this._effectsManager;
        if (!tracks) return;

        const inv = 1 - frac;

        // --- Per-track continuous params ---
        if (this.fromSnap.tracks && this.toSnap.tracks) {
            const len = Math.min(this.fromSnap.tracks.length, this.toSnap.tracks.length, tracks.length);
            for (let i = 0; i < len; i++) {
                const ft = this.fromSnap.tracks[i];
                const tt = this.toSnap.tracks[i];
                const t = tracks[i];

                // Continuous params
                for (let p = 0; p < CONTINUOUS_TRACK_PARAMS.length; p++) {
                    const key = CONTINUOUS_TRACK_PARAMS[p];
                    const fromVal = ft.params[key];
                    const toVal = tt.params[key];
                    if (fromVal !== undefined && toVal !== undefined && typeof fromVal === 'number') {
                        t.params[key] = fromVal * inv + toVal * frac;
                    }
                }

                // Sync AudioNodes
                if (t.bus) {
                    if (t.bus.hp) t.bus.hp.frequency.value = t.params.hpFilter || 20;
                    if (t.bus.lp) t.bus.lp.frequency.value = t.params.filter || 20000;
                    if (t.bus.vol) t.bus.vol.gain.value = t.params.volume;
                    if (t.bus.pan) t.bus.pan.pan.value = t.params.pan || 0;
                    if (t.bus.trim) t.bus.trim.gain.value = t.params.gain || 1.0;
                    if (t.bus.eq) {
                        if (t.bus.eq.low) t.bus.eq.low.gain.value = t.params.eqLow || 0;
                        if (t.bus.eq.mid) t.bus.eq.mid.gain.value = t.params.eqMid || 0;
                        if (t.bus.eq.high) t.bus.eq.high.gain.value = t.params.eqHigh || 0;
                    }
                    if (t.bus.sendA) t.bus.sendA.gain.value = t.params.sendA || 0;
                    if (t.bus.sendB) t.bus.sendB.gain.value = t.params.sendB || 0;
                }

                // LFO continuous params (rate, amount)
                if (ft.lfos && tt.lfos) {
                    const lfoLen = Math.min(ft.lfos.length, tt.lfos.length, t.lfos.length);
                    for (let l = 0; l < lfoLen; l++) {
                        const fl = ft.lfos[l];
                        const tl = tt.lfos[l];
                        const lfo = t.lfos[l];
                        for (let lp = 0; lp < CONTINUOUS_LFO_PARAMS.length; lp++) {
                            const key = CONTINUOUS_LFO_PARAMS[lp];
                            const fv = fl[key];
                            const tv = tl[key];
                            if (fv !== undefined && tv !== undefined && typeof fv === 'number') {
                                lfo[key] = fv * inv + tv * frac;
                            }
                        }
                    }
                }
            }
        }

        // --- FX engine params ---
        if (this.fromSnap.effectsManager && this.toSnap.effectsManager && em) {
            const fxLen = Math.min(
                this.fromSnap.effectsManager.length,
                this.toSnap.effectsManager.length,
                em.effects.length
            );
            for (let fi = 0; fi < fxLen; fi++) {
                const ff = this.fromSnap.effectsManager[fi];
                const tf = this.toSnap.effectsManager[fi];
                const fx = em.effects[fi];
                if (ff.params && tf.params) {
                    const pLen = Math.min(ff.params.length, tf.params.length, fx.params.length);
                    for (let pi = 0; pi < pLen; pi++) {
                        const val = ff.params[pi] * inv + tf.params[pi] * frac;
                        fx.params[pi] = val;
                        if (ae) ae.setEffectParam(fx.id, pi, val);
                    }
                }
                // FX LFO continuous
                if (ff.lfos && tf.lfos) {
                    const lLen = Math.min(ff.lfos.length, tf.lfos.length, fx.lfos.length);
                    for (let li = 0; li < lLen; li++) {
                        for (let lp = 0; lp < CONTINUOUS_LFO_PARAMS.length; lp++) {
                            const key = CONTINUOUS_LFO_PARAMS[lp];
                            const fv = ff.lfos[li][key];
                            const tv = tf.lfos[li][key];
                            if (fv !== undefined && tv !== undefined && typeof fv === 'number') {
                                fx.lfos[li][key] = fv * inv + tv * frac;
                            }
                        }
                    }
                }
            }
        }

        // --- Group buses ---
        if (this.fromSnap.groupBuses && this.toSnap.groupBuses && ae && ae.groupBuses) {
            const gLen = Math.min(
                this.fromSnap.groupBuses.length,
                this.toSnap.groupBuses.length,
                ae.groupBuses.length
            );
            for (let gi = 0; gi < gLen; gi++) {
                const fg = this.fromSnap.groupBuses[gi];
                const tg = this.toSnap.groupBuses[gi];
                const bus = ae.groupBuses[gi];
                if (!fg || !tg || !bus) continue;
                if (fg.volume !== undefined && tg.volume !== undefined && bus.volume) {
                    bus.volume.gain.value = fg.volume * inv + tg.volume * frac;
                }
            }
        }

        // --- Return buses ---
        if (this.fromSnap.returnBuses && this.toSnap.returnBuses && ae && ae.returnBuses) {
            const rLen = Math.min(
                this.fromSnap.returnBuses.length,
                this.toSnap.returnBuses.length,
                ae.returnBuses.length
            );
            for (let ri = 0; ri < rLen; ri++) {
                const fr = this.fromSnap.returnBuses[ri];
                const tr = this.toSnap.returnBuses[ri];
                const bus = ae.returnBuses[ri];
                if (!fr || !tr || !bus) continue;
                // Interpolate any numeric params
                if (fr.params && tr.params && bus.params) {
                    for (const key of Object.keys(fr.params)) {
                        const fv = fr.params[key];
                        const tv = tr.params[key];
                        if (typeof fv === 'number' && typeof tv === 'number') {
                            bus.params[key] = fv * inv + tv * frac;
                        }
                    }
                }
            }
        }

        // --- Master volume ---
        if (this.fromSnap.masterVolume !== undefined &&
            this.toSnap.masterVolume !== undefined &&
            ae && ae.masterBus && ae.masterBus.volume) {
            ae.masterBus.volume.gain.value =
                this.fromSnap.masterVolume * inv + this.toSnap.masterVolume * frac;
        }
    }
}
