// js/modules/SnapshotBank.js
// 16-slot snapshot system for BeatOS
// Captures complete session state (all params, patterns, FX, mixer, automation)
// Does NOT capture audio buffers — samples are project-level, not snapshot-level.

import { NUM_LFOS } from '../utils/constants.js';
import { Modulator } from './modulators/Modulator.js';

export const SNAPSHOT_SLOTS = 16;

export class SnapshotBank {
    constructor() {
        this.slots = new Array(SNAPSHOT_SLOTS).fill(null);
        this.activeSlot = -1; // Currently recalled slot (-1 = none)
        this._lastLiveState = null; // Auto-saved before recall

        // External references — set via setContext()
        this._tracks = null;
        this._audioEngine = null;
        this._effectsManager = null;
        this._mixerAutomation = null;
        this._scheduler = null;
        this._uiRefreshCallback = null; // called after recall to refresh all UI
    }

    setContext({ tracks, audioEngine, effectsManager, mixerAutomation, scheduler }) {
        this._tracks = tracks;
        this._audioEngine = audioEngine;
        this._effectsManager = effectsManager;
        this._mixerAutomation = mixerAutomation;
        this._scheduler = scheduler;
    }

    setUIRefreshCallback(cb) {
        this._uiRefreshCallback = cb;
    }

    // ========================================================================
    // CAPTURE — snapshot the current live state
    // ========================================================================

    capture() {
        return this._captureCurrentState();
    }

    /** Save to the next available empty slot. Returns slot index or -1 if full. */
    saveToNextSlot() {
        for (let i = 0; i < SNAPSHOT_SLOTS; i++) {
            if (this.slots[i] === null) {
                this.slots[i] = this._captureCurrentState();
                return i;
            }
        }
        return -1; // No slot available
    }

    /** Save to a specific slot (overwrites). */
    saveToSlot(slotIndex) {
        if (slotIndex < 0 || slotIndex >= SNAPSHOT_SLOTS) return false;
        this.slots[slotIndex] = this._captureCurrentState();
        return true;
    }

    // ========================================================================
    // RECALL — apply a snapshot to the live session
    // ========================================================================

    recall(slotIndex) {
        if (slotIndex < 0 || slotIndex >= SNAPSHOT_SLOTS) return false;
        const snap = this.slots[slotIndex];
        if (!snap) return false;

        // Auto-save current state as "last live" before overwriting
        this._lastLiveState = this._captureCurrentState();

        this._applySnapshot(snap);
        this.activeSlot = slotIndex;

        if (this._uiRefreshCallback) this._uiRefreshCallback();
        return true;
    }

    /** Restore the auto-saved "last live" state (the Snap button). */
    restoreLastLive() {
        if (!this._lastLiveState) return false;
        this._applySnapshot(this._lastLiveState);
        this._lastLiveState = null;
        this.activeSlot = -1;
        if (this._uiRefreshCallback) this._uiRefreshCallback();
        return true;
    }

    hasLastLive() {
        return this._lastLiveState !== null;
    }

    // ========================================================================
    // CLEAR
    // ========================================================================

    clearSlot(slotIndex) {
        if (slotIndex < 0 || slotIndex >= SNAPSHOT_SLOTS) return;
        this.slots[slotIndex] = null;
        if (this.activeSlot === slotIndex) this.activeSlot = -1;
    }

    clearAll() {
        this.slots.fill(null);
        this.activeSlot = -1;
        this._lastLiveState = null;
    }

    isOccupied(slotIndex) {
        return this.slots[slotIndex] !== null;
    }

    // ========================================================================
    // SERIALIZE / DESERIALIZE (for .beatos project save/load)
    // ========================================================================

    serialize() {
        const out = [];
        for (let i = 0; i < SNAPSHOT_SLOTS; i++) {
            if (this.slots[i] !== null) {
                out.push({ slot: i, data: this.slots[i] });
            }
        }
        return out;
    }

    deserialize(arr) {
        this.slots.fill(null);
        this.activeSlot = -1;
        if (!Array.isArray(arr)) return;
        for (const entry of arr) {
            if (entry.slot >= 0 && entry.slot < SNAPSHOT_SLOTS && entry.data) {
                this.slots[entry.slot] = entry.data;
            }
        }
    }

    // ========================================================================
    // INTERNAL — capture/apply full state
    // ========================================================================

    _captureCurrentState() {
        const tracks = this._tracks;
        const ae = this._audioEngine;
        const em = this._effectsManager;
        const ma = this._mixerAutomation;

        const snap = {
            // --- Per-track state ---
            tracks: tracks.map(t => ({
                params: { ...t.params },
                steps: Array.from(t.steps),
                microtiming: Array.from(t.microtiming || []),
                muted: t.muted,
                soloed: t.soloed,
                stepLock: t.stepLock,
                ignoreRandom: t.ignoreRandom || false,
                chokeGroup: t.chokeGroup || 0,
                type: t.type || 'granular',
                clockDivider: t.clockDivider || 1,
                resetOnBar: t.resetOnBar || false,
                resetOnTrig: t.resetOnTrig || false,
                cleanMode: t.cleanMode || false,
                scanSync: t.scanSync || false,
                scanSyncMultiplier: t.scanSyncMultiplier || 1,
                lfos: t.lfos.map(l => l.serialize ? l.serialize() : {
                    wave: l.wave, rate: l.rate, amount: l.amount,
                    targets: l.targets ? [...l.targets] : [],
                    sync: l.sync, syncRateIndex: l.syncRateIndex
                }),
                stepPitches: t.stepPitches ? [...t.stepPitches] : null
            })),

            // --- FX engines ---
            effectsManager: em ? em.effects.map(fx => ({
                params: [...fx.params],
                lfos: fx.lfos.map(l => l.serialize ? l.serialize() : {
                    wave: l.wave, rate: l.rate, amount: l.amount,
                    sync: l.sync, syncRateIndex: l.syncRateIndex
                }),
                matrix: fx.matrix.map(row => [...row])
            })) : null,

            // --- Mixer automation ---
            mixerAutomation: ma ? ma.serialize() : null,

            // --- Group bus params ---
            groupBuses: ae && ae.groupBuses ? ae.groupBuses.map(g => {
                if (!g) return null;
                return {
                    volume: g.volume ? g.volume.gain.value : 0.8,
                    params: g.params ? { ...g.params } : {}
                };
            }) : null,

            // --- Return bus params ---
            returnBuses: ae && ae.returnBuses ? ae.returnBuses.map(r => {
                if (!r) return null;
                return { params: r.params ? { ...r.params } : {} };
            }) : null,

            // --- Master volume ---
            masterVolume: ae && ae.masterBus && ae.masterBus.volume
                ? ae.masterBus.volume.gain.value : 1.0
        };

        return snap;
    }

    _applySnapshot(snap) {
        const tracks = this._tracks;
        const ae = this._audioEngine;
        const em = this._effectsManager;
        const ma = this._mixerAutomation;

        // --- Per-track state ---
        if (snap.tracks) {
            for (let i = 0; i < Math.min(snap.tracks.length, tracks.length); i++) {
                const sd = snap.tracks[i];
                const t = tracks[i];

                Object.assign(t.params, sd.params);
                t.steps = new Uint8Array(sd.steps);
                if (sd.microtiming) {
                    const mt = new Float32Array(t.microtiming.length);
                    for (let j = 0; j < Math.min(sd.microtiming.length, mt.length); j++) mt[j] = sd.microtiming[j];
                    t.microtiming = mt;
                }
                t.muted = !!sd.muted;
                t.soloed = !!sd.soloed;
                t.stepLock = !!sd.stepLock;
                t.ignoreRandom = !!sd.ignoreRandom;
                t.chokeGroup = sd.chokeGroup || 0;
                t.type = sd.type || 'granular';
                t.clockDivider = sd.clockDivider || 1;
                t.resetOnBar = !!sd.resetOnBar;
                t.resetOnTrig = !!sd.resetOnTrig;
                t.cleanMode = !!sd.cleanMode;
                t.scanSync = !!sd.scanSync;
                t.scanSyncMultiplier = sd.scanSyncMultiplier || 1;

                // LFOs
                if (sd.lfos) {
                    for (let lIdx = 0; lIdx < Math.min(sd.lfos.length, NUM_LFOS); lIdx++) {
                        const lData = sd.lfos[lIdx];
                        if (lData.type !== undefined) {
                            t.lfos[lIdx] = Modulator.deserialize(lData);
                        } else {
                            const lfo = t.lfos[lIdx];
                            if (lData.wave !== undefined) lfo.wave = lData.wave;
                            if (lData.rate !== undefined) lfo.rate = lData.rate;
                            if (lData.amount !== undefined) lfo.amount = lData.amount;
                            if (lData.targets) lfo.targets = [...lData.targets];
                            else if (lData.target) lfo.targets = [lData.target];
                            if (lData.sync !== undefined) lfo.sync = lData.sync;
                            if (lData.syncRateIndex !== undefined) lfo.syncRateIndex = lData.syncRateIndex;
                        }
                    }
                }

                // Step pitches
                t.stepPitches = sd.stepPitches ? [...sd.stepPitches] : t.stepPitches;

                // Sync bus AudioNodes
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
            }
        }

        // --- FX engines ---
        if (snap.effectsManager && em) {
            for (let fxIdx = 0; fxIdx < Math.min(snap.effectsManager.length, em.effects.length); fxIdx++) {
                const fxData = snap.effectsManager[fxIdx];
                const fx = em.effects[fxIdx];
                if (fxData.params) {
                    for (let i = 0; i < Math.min(fxData.params.length, fx.params.length); i++) {
                        fx.params[i] = fxData.params[i];
                        if (ae) ae.setEffectParam(fx.id, i, fxData.params[i]);
                    }
                }
                if (fxData.lfos) {
                    for (let lIdx = 0; lIdx < Math.min(fxData.lfos.length, fx.lfos.length); lIdx++) {
                        const lData = fxData.lfos[lIdx];
                        if (lData.type !== undefined) {
                            fx.lfos[lIdx] = Modulator.deserialize(lData);
                        } else {
                            const lfo = fx.lfos[lIdx];
                            if (lData.wave !== undefined) lfo.wave = lData.wave;
                            if (lData.rate !== undefined) lfo.rate = lData.rate;
                            if (lData.amount !== undefined) lfo.amount = lData.amount;
                            if (lData.sync !== undefined) lfo.sync = lData.sync;
                            if (lData.syncRateIndex !== undefined) lfo.syncRateIndex = lData.syncRateIndex;
                        }
                    }
                }
                if (fxData.matrix) fx.matrix = fxData.matrix.map(row => [...row]);
            }
        }

        // --- Mixer automation ---
        if (snap.mixerAutomation && ma) {
            ma.deserialize(snap.mixerAutomation);
        }

        // --- Group buses ---
        if (snap.groupBuses && ae && ae.groupBuses) {
            for (let i = 0; i < Math.min(snap.groupBuses.length, ae.groupBuses.length); i++) {
                const gd = snap.groupBuses[i];
                const bus = ae.groupBuses[i];
                if (!gd || !bus) continue;
                if (gd.volume !== undefined && bus.volume) bus.volume.gain.value = gd.volume;
                if (gd.params) Object.assign(bus.params || {}, gd.params);
            }
        }

        // --- Return buses ---
        if (snap.returnBuses && ae && ae.returnBuses) {
            for (let i = 0; i < Math.min(snap.returnBuses.length, ae.returnBuses.length); i++) {
                const rd = snap.returnBuses[i];
                const bus = ae.returnBuses[i];
                if (!rd || !bus) continue;
                if (rd.params) Object.assign(bus.params || {}, rd.params);
            }
        }

        // --- Master volume ---
        if (snap.masterVolume !== undefined && ae && ae.masterBus && ae.masterBus.volume) {
            ae.masterBus.volume.gain.value = snap.masterVolume;
        }
    }
}
