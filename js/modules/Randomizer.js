// js/modules/Randomizer.js
// Config-driven randomization engine for BeatOS
// Replaces hardcoded randomizeTrackParams / randomizeTrackModulators

export class Randomizer {
    constructor() {
        this.config = null;
        this._rngState = Date.now() | 0;
    }

    /**
     * Load config from JSON object or fetch from URL
     */
    async loadConfig(pathOrObject) {
        if (typeof pathOrObject === 'object') {
            this.config = pathOrObject;
        } else {
            const resp = await fetch(pathOrObject);
            this.config = await resp.json();
        }
        console.log('[Randomizer] Config loaded:', Object.keys(this.config).filter(k => !k.startsWith('_')).join(', '));
    }

    // =========================================================================
    // RANDOM VALUE GENERATORS
    // =========================================================================

    /** Fast seeded random (XorShift) — reproducible if needed */
    _xorShift() {
        this._rngState ^= this._rngState << 13;
        this._rngState ^= this._rngState >>> 17;
        this._rngState ^= this._rngState << 5;
        return (this._rngState >>> 0) / 4294967296;
    }

    /** Primary random — uses Math.random for true randomness */
    _rand() {
        return Math.random();
    }

    /**
     * Generate a random value respecting curve distribution
     */
    _randomWithCurve(min, max, curve) {
        const r = this._rand();
        let shaped;

        switch (curve) {
            case 'gaussian': {
                // Box-Muller approximation — sum of 3 uniforms
                const u = (this._rand() + this._rand() + this._rand()) / 3;
                shaped = u;
                break;
            }
            case 'exponential':
                // Bias toward min
                shaped = r * r;
                break;
            case 'inverseExponential':
                // Bias toward max
                shaped = 1 - (1 - r) * (1 - r);
                break;
            case 'uniform':
            default:
                shaped = r;
                break;
        }

        return min + shaped * (max - min);
    }

    /**
     * Pick a random value from a snapValues array
     */
    _pickSnap(snapValues) {
        return snapValues[Math.floor(this._rand() * snapValues.length)];
    }

    /**
     * Resolve a single parameter: returns the new value or null if skipped
     */
    _resolveParam(paramConfig, currentValue, overrides) {
        const mode = paramConfig.mode;

        if (mode === 'skip') return null;
        if (mode === 'lock') return currentValue;

        // mode === 'randomize'
        const chance = paramConfig.chance !== undefined ? paramConfig.chance : 1.0;
        if (this._rand() > chance) return null; // Didn't fire

        const min = overrides?.min !== undefined ? overrides.min : paramConfig.min;
        const max = overrides?.max !== undefined ? overrides.max : paramConfig.max;
        const curve = paramConfig.curve || 'uniform';
        const snaps = paramConfig.snapValues;

        if (snaps && snaps.length > 0) {
            return this._pickSnap(snaps);
        }

        if (min !== null && max !== null) {
            return this._randomWithCurve(min, max, curve);
        }

        return null;
    }

    // =========================================================================
    // SCOPE HELPERS
    // =========================================================================

    _getScope(groupConfig) {
        return groupConfig._scope || 'all';
    }

    _isInScope(index, groupConfig, selectedIndex) {
        const scope = this._getScope(groupConfig);
        if (scope === 'all') return true;
        if (scope === 'selected') return index === selectedIndex;
        if (scope === 'indices') {
            return (groupConfig._scopeIndices || []).includes(index);
        }
        return true;
    }

    // =========================================================================
    // MAIN ENTRY POINT
    // =========================================================================

    /**
     * Execute full randomization pass.
     * @param {Object} ctx - Application context:
     *   - tracks: Track[]
     *   - audioEngine: AudioEngine
     *   - effectsManager: EffectsManager
     *   - selectedTrackIndex: number
     *   - releaseOverride: { min, max } | null  — from click-position zone
     */
    randomize(ctx) {
        if (!this.config) {
            console.warn('[Randomizer] No config loaded');
            return;
        }

        const { tracks, audioEngine, effectsManager, selectedTrackIndex, releaseOverride } = ctx;

        // --- 1. GRANULAR ENGINE ---
        if (this.config.granularEngine) {
            this._randomizeGranularEngine(tracks, this.config.granularEngine, selectedTrackIndex, releaseOverride);
        }

        // --- 2. 909 DRUM ENGINE ---
        if (this.config.drum909) {
            this._randomizeDrum909(tracks, this.config.drum909, selectedTrackIndex);
        }

        // --- 3. MODULATOR LFOs (per-track) ---
        if (this.config.modulatorLFOs) {
            this._randomizeModulatorLFOs(tracks, this.config.modulatorLFOs, selectedTrackIndex);
        }

        // --- 4. MIXER TRACKS ---
        if (this.config.mixerTracks) {
            this._randomizeMixerTracks(tracks, audioEngine, this.config.mixerTracks, selectedTrackIndex);
        }

        // --- 5. MIXER GROUPS ---
        if (this.config.mixerGroups && audioEngine) {
            this._randomizeMixerGroups(audioEngine, this.config.mixerGroups);
        }

        // --- 6. RETURN TRACKS ---
        if (this.config.returnTracks && audioEngine) {
            this._randomizeReturnTracks(audioEngine, this.config.returnTracks);
        }

        // --- 7. FX ENGINES ---
        if (this.config.fxEngines && effectsManager) {
            this._randomizeFxEngines(effectsManager, audioEngine, this.config.fxEngines);
        }

        // --- 8. FX LFOs ---
        if (this.config.fxLFOs && effectsManager) {
            this._randomizeFxLFOs(effectsManager, this.config.fxLFOs);
        }
    }

    // =========================================================================
    // GROUP RANDOMIZERS
    // =========================================================================

    _randomizeGranularEngine(tracks, cfg, selectedIdx, releaseOverride) {
        const params = cfg.params;
        if (!params) return;

        tracks.forEach((t, i) => {
            if (t.type !== 'granular') return;
            if (t.ignoreRandom) return;
            if (!this._isInScope(i, cfg, selectedIdx)) return;

            for (const [key, paramCfg] of Object.entries(params)) {
                // Special handling for relGrain: use release zone override
                const overrides = (key === 'relGrain' && releaseOverride) ? releaseOverride : undefined;
                const val = this._resolveParam(paramCfg, t.params[key], overrides);
                if (val !== null) t.params[key] = val;
            }
        });
    }

    _randomizeDrum909(tracks, cfg, selectedIdx) {
        const params = cfg.params;
        if (!params) return;

        tracks.forEach((t, i) => {
            if (t.type !== 'simple-drum') return;
            if (t.ignoreRandom) return;
            if (!this._isInScope(i, cfg, selectedIdx)) return;

            for (const [key, paramCfg] of Object.entries(params)) {
                const val = this._resolveParam(paramCfg, t.params[key]);
                if (val !== null) t.params[key] = val;
            }
        });
    }

    _randomizeModulatorLFOs(tracks, cfg, selectedIdx) {
        const perLFO = cfg.perLFO;
        if (!perLFO) return;
        const activationChance = perLFO._activationChance !== undefined ? perLFO._activationChance : 0.7;

        tracks.forEach((t, i) => {
            if (t.type === 'automation') return;
            if (t.type !== 'granular') return;
            if (t.ignoreRandom) return;
            if (!this._isInScope(i, cfg, selectedIdx)) return;

            t.lfos.forEach(lfo => {
                // Determine if LFO should be active at all
                const isActive = this._rand() < activationChance;

                if (!isActive) {
                    // Deactivate: clear targets, zero amount
                    if (perLFO.amount && perLFO.amount.mode !== 'skip') {
                        lfo.amount = 0;
                    }
                    if (perLFO.targets && perLFO.targets.mode !== 'skip') {
                        lfo.targets = [];
                    }
                    return;
                }

                // Randomize wave
                if (perLFO.wave) {
                    const val = this._resolveParam(perLFO.wave, lfo.wave);
                    if (val !== null) lfo.wave = val;
                }

                // Randomize rate
                if (perLFO.rate) {
                    const val = this._resolveParam(perLFO.rate, lfo.rate);
                    if (val !== null) lfo.rate = val;
                }

                // Randomize amount
                if (perLFO.amount) {
                    const val = this._resolveParam(perLFO.amount, lfo.amount);
                    if (val !== null) lfo.amount = val;
                }

                // Randomize sync
                if (perLFO.sync) {
                    const val = this._resolveParam(perLFO.sync, lfo.sync);
                    if (val !== null) lfo.sync = val;
                }

                // Randomize syncRateIndex
                if (perLFO.syncRateIndex) {
                    const val = this._resolveParam(perLFO.syncRateIndex, lfo.syncRateIndex);
                    if (val !== null) lfo.syncRateIndex = Math.round(val);
                }

                // Randomize targets (multi-target array)
                if (perLFO.targets && perLFO.targets.mode === 'randomize') {
                    const tCfg = perLFO.targets;
                    const chance = tCfg.chance !== undefined ? tCfg.chance : 0.7;
                    if (this._rand() < chance && tCfg.snapValues && tCfg.snapValues.length > 0) {
                        const maxT = tCfg.maxTargets || 3;
                        const count = 1 + Math.floor(this._rand() * maxT);
                        // Shuffle and pick
                        const pool = [...tCfg.snapValues];
                        const picked = [];
                        for (let n = 0; n < count && pool.length > 0; n++) {
                            const idx = Math.floor(this._rand() * pool.length);
                            picked.push(pool.splice(idx, 1)[0]);
                        }
                        lfo.targets = picked;
                    }
                } else if (perLFO.targets && perLFO.targets.mode === 'lock') {
                    // Keep current targets
                }
            });
        });
    }

    _randomizeMixerTracks(tracks, audioEngine, cfg, selectedIdx) {
        const params = cfg.params;
        if (!params) return;

        tracks.forEach((t, i) => {
            if (t.type === 'automation') return;
            if (t.ignoreRandom) return;
            if (!this._isInScope(i, cfg, selectedIdx)) return;

            for (const [key, paramCfg] of Object.entries(params)) {
                const val = this._resolveParam(paramCfg, t.params[key]);
                if (val !== null) {
                    t.params[key] = val;
                    // Apply to audio nodes immediately
                    this._applyTrackBusParam(t, key, val, audioEngine);
                }
            }
        });
    }

    _applyTrackBusParam(track, key, value, audioEngine) {
        if (!track.bus || !audioEngine) return;
        const bus = track.bus;

        switch (key) {
            case 'hpFilter':
                if (bus.hp) bus.hp.frequency.value = audioEngine.getMappedFrequency(Math.max(20, value), 'hp');
                break;
            case 'filter':
                if (bus.lp) bus.lp.frequency.value = audioEngine.getMappedFrequency(Math.max(100, value), 'lp');
                break;
            case 'volume':
                if (bus.vol) bus.vol.gain.value = value;
                break;
            case 'pan':
                if (bus.pan) bus.pan.pan.value = value;
                break;
            case 'gain':
                if (bus.trim) bus.trim.gain.value = value;
                break;
            case 'eqLow':
                if (bus.eq && bus.eq.low) bus.eq.low.gain.value = value;
                break;
            case 'eqMid':
                if (bus.eq && bus.eq.mid) bus.eq.mid.gain.value = value;
                break;
            case 'eqHigh':
                if (bus.eq && bus.eq.high) bus.eq.high.gain.value = value;
                break;
            case 'eqMidFreq':
                if (bus.eq && bus.eq.mid) bus.eq.mid.frequency.value = value;
                break;
            case 'drive':
                if (bus.drive && bus.drive.input) audioEngine.setDriveAmount(bus.drive.input, value);
                break;
            case 'comp':
                if (bus.comp) audioEngine.setCompAmount(bus.comp, value);
                break;
            case 'sendA':
                if (bus.sendA) bus.sendA.gain.value = value;
                break;
            case 'sendB':
                if (bus.sendB) bus.sendB.gain.value = value;
                break;
        }
    }

    _randomizeMixerGroups(audioEngine, cfg) {
        const params = cfg.params;
        if (!params || !audioEngine.groupBuses) return;

        audioEngine.groupBuses.forEach((bus, i) => {
            if (!bus) return;
            if (!this._isInScope(i, cfg, null)) return;

            for (const [key, paramCfg] of Object.entries(params)) {
                const currentVal = this._getGroupBusValue(bus, key);
                const val = this._resolveParam(paramCfg, currentVal);
                if (val !== null) {
                    this._applyGroupBusParam(bus, key, val, audioEngine);
                }
            }
        });
    }

    _getGroupBusValue(bus, key) {
        switch (key) {
            case 'volume': return bus.volume ? bus.volume.gain.value : 1.0;
            case 'sendA': return bus.sendA ? bus.sendA.gain.value : 0;
            case 'sendB': return bus.sendB ? bus.sendB.gain.value : 0;
            default: return 0;
        }
    }

    _applyGroupBusParam(bus, key, value, audioEngine) {
        switch (key) {
            case 'volume':
                if (bus.volume) bus.volume.gain.value = value;
                break;
            case 'comp':
                if (bus.comp) audioEngine.setCompAmount(bus.comp, value);
                break;
            case 'drive':
                if (bus.drive && bus.drive.input) audioEngine.setDriveAmount(bus.drive.input, value);
                break;
            case 'sendA':
                if (bus.sendA) bus.sendA.gain.value = value;
                break;
            case 'sendB':
                if (bus.sendB) bus.sendB.gain.value = value;
                break;
            case 'eqLow':
                if (bus.eq && bus.eq.low) bus.eq.low.gain.value = value;
                break;
            case 'eqMid':
                if (bus.eq && bus.eq.mid) bus.eq.mid.gain.value = value;
                break;
            case 'eqHigh':
                if (bus.eq && bus.eq.high) bus.eq.high.gain.value = value;
                break;
        }
    }

    _randomizeReturnTracks(audioEngine, cfg) {
        const params = cfg.params;
        if (!params || !audioEngine.returnBuses) return;

        audioEngine.returnBuses.forEach((bus, i) => {
            if (!bus) return;
            if (!this._isInScope(i, cfg, null)) return;

            for (const [key, paramCfg] of Object.entries(params)) {
                const currentVal = this._getReturnBusValue(bus, key);
                const val = this._resolveParam(paramCfg, currentVal);
                if (val !== null) {
                    this._applyReturnBusParam(bus, key, val, audioEngine);
                }
            }
        });
    }

    _getReturnBusValue(bus, key) {
        switch (key) {
            case 'inputGain': return bus.input ? bus.input.gain.value : 1.0;
            case 'volume': return bus.volume ? bus.volume.gain.value : 1.0;
            case 'pan': return bus.pan ? bus.pan.pan.value : 0;
            default: return 0;
        }
    }

    _applyReturnBusParam(bus, key, value, audioEngine) {
        switch (key) {
            case 'inputGain':
                if (bus.input) bus.input.gain.value = value;
                break;
            case 'volume':
                if (bus.volume) bus.volume.gain.value = value;
                break;
            case 'pan':
                if (bus.pan) bus.pan.pan.value = value;
                break;
            case 'eqLow':
                if (bus.eq && bus.eq.low) bus.eq.low.gain.value = value;
                break;
            case 'eqMid':
                if (bus.eq && bus.eq.mid) bus.eq.mid.gain.value = value;
                break;
            case 'eqHigh':
                if (bus.eq && bus.eq.high) bus.eq.high.gain.value = value;
                break;
            case 'eqMidFreq':
                if (bus.eq && bus.eq.mid) bus.eq.mid.frequency.value = value;
                break;
            case 'drive':
                if (bus.drive && bus.drive.input) audioEngine.setDriveAmount(bus.drive.input, value);
                break;
            case 'comp':
                if (bus.comp) audioEngine.setCompAmount(bus.comp, value);
                break;
            case 'sendA':
                if (bus.sendA) bus.sendA.gain.value = value;
                break;
            case 'sendB':
                if (bus.sendB) bus.sendB.gain.value = value;
                break;
        }
    }

    _randomizeFxEngines(effectsManager, audioEngine, cfg) {
        const perFX = cfg.perFX;
        if (!perFX) return;

        [0, 1].forEach(fxId => {
            if (!this._isInScope(fxId, cfg, null)) return;
            const state = effectsManager.getEffectState(fxId);
            if (!state) return;

            for (const [key, paramCfg] of Object.entries(perFX)) {
                const pIdx = parseInt(key.replace('param', ''));
                if (isNaN(pIdx) || pIdx < 0 || pIdx > 3) continue;

                const val = this._resolveParam(paramCfg, state.params[pIdx]);
                if (val !== null) {
                    state.params[pIdx] = val;
                    audioEngine.setEffectParam(fxId, pIdx, val);
                }
            }
        });
    }

    _randomizeFxLFOs(effectsManager, cfg) {
        const perLFO = cfg.perLFO;
        if (!perLFO) return;
        const activationChance = perLFO._activationChance !== undefined ? perLFO._activationChance : 0.4;

        [0, 1].forEach(fxId => {
            if (!this._isInScope(fxId, cfg, null)) return;
            const state = effectsManager.getEffectState(fxId);
            if (!state) return;

            state.lfos.forEach(lfo => {
                const isActive = this._rand() < activationChance;

                if (!isActive) {
                    if (perLFO.amount && perLFO.amount.mode !== 'skip') lfo.amount = 0;
                    return;
                }

                if (perLFO.wave) {
                    const val = this._resolveParam(perLFO.wave, lfo.wave);
                    if (val !== null) lfo.wave = val;
                }
                if (perLFO.rate) {
                    const val = this._resolveParam(perLFO.rate, lfo.rate);
                    if (val !== null) lfo.rate = val;
                }
                if (perLFO.amount) {
                    const val = this._resolveParam(perLFO.amount, lfo.amount);
                    if (val !== null) lfo.amount = val;
                }
                if (perLFO.sync) {
                    const val = this._resolveParam(perLFO.sync, lfo.sync);
                    if (val !== null) lfo.sync = val;
                }
                if (perLFO.syncRateIndex) {
                    const val = this._resolveParam(perLFO.syncRateIndex, lfo.syncRateIndex);
                    if (val !== null) lfo.syncRateIndex = Math.round(val);
                }
            });

            // Matrix randomization
            if (cfg.matrix && cfg.matrix.mode === 'randomize') {
                const chance = cfg.matrix.chance || 0.3;
                for (let src = 0; src < 3; src++) {
                    for (let tgt = 0; tgt < 13; tgt++) {
                        state.matrix[src][tgt] = this._rand() < chance ? 1 : 0;
                    }
                }
            }
        });
    }
}
