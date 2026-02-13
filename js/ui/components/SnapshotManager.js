// js/ui/components/SnapshotManager.js
import { NUM_STEPS, NUM_LFOS } from '../../utils/constants.js';
import { Modulator } from '../../modules/modulators/Modulator.js';

export class SnapshotManager {
    constructor() {
        this.tracks = [];
        this.snapshotData = null;
        this.matrixStepElements = [];
        // External references — set by main/UIManager
        this._randomizer = null;
        this._audioEngine = null;
        this._effectsManager = null;
    }

    setTracks(tracks) {
        this.tracks = tracks;
    }

    setGridElements(matrixStepElements) {
        this.matrixStepElements = matrixStepElements;
    }

    /**
     * Provide external references needed for config-driven snapshot.
     */
    setContext(randomizer, audioEngine, effectsManager) {
        this._randomizer = randomizer;
        this._audioEngine = audioEngine;
        this._effectsManager = effectsManager;
    }

    // ============================================================================
    // TOGGLE SNAPSHOT (SAVE/RESTORE)
    // ============================================================================

    toggleSnapshot(onUpdateTrackStateUI, onSelectTrack, selectedTrackIndex, visualizerCallback) {
        const btn = document.getElementById('snapshotBtn');
        
        if(!this.snapshotData) {
            // SAVE SNAPSHOT
            const snapObj = {
                // Always save sequencer + state (not config-driven, always needed)
                trackState: this.tracks.map(t => ({
                    steps: Array.from(t.steps),
                    muted: t.muted,
                    soloed: t.soloed,
                    stepLock: t.stepLock,
                    ignoreRandom: t.ignoreRandom
                }))
            };

            // Config-driven param snapshot via Randomizer
            if (this._randomizer && this._randomizer.config) {
                snapObj.randSnap = this._randomizer.saveSnapshot({
                    tracks: this.tracks,
                    audioEngine: this._audioEngine,
                    effectsManager: this._effectsManager
                });
            } else {
                // Fallback: save all track params and LFOs
                snapObj.fallbackTracks = this.tracks.map(t => ({
                    params: {...t.params},
                    lfos: t.lfos.map(l => l.serialize ? l.serialize() : { 
                        wave: l.wave, rate: l.rate, amount: l.amount, 
                        target: l.target, targets: l.targets ? [...l.targets] : []
                    })
                }));
            }

            this.snapshotData = JSON.stringify(snapObj);
            
            btn.classList.add('snap-active');
            btn.innerText = 'RESTORE';
            
        } else {
            // RESTORE SNAPSHOT
            try {
                const data = JSON.parse(this.snapshotData);
                
                // 1. Restore sequencer state (always)
                if (data.trackState) {
                    data.trackState.forEach((stateData, i) => {
                        if (i >= this.tracks.length) return;
                        const t = this.tracks[i];
                        t.steps = new Uint8Array(stateData.steps);
                        t.muted = stateData.muted;
                        t.soloed = stateData.soloed;
                        t.stepLock = stateData.stepLock || false;
                        t.ignoreRandom = stateData.ignoreRandom || false;
                        
                        if (onUpdateTrackStateUI) onUpdateTrackStateUI(i);
                        
                        // Update step buttons
                        for(let s = 0; s < NUM_STEPS; s++) {
                            const stepBtn = this.matrixStepElements[i]?.[s];
                            if (!stepBtn) continue;
                            stepBtn.className = 'step-btn';
                            stepBtn.classList.remove('active', 'vel-1', 'vel-2', 'vel-3',
                                'auto-level-1', 'auto-level-2', 'auto-level-3',
                                'auto-level-4', 'auto-level-5');
                            if (t.type === 'automation') {
                                if (t.steps[s] > 0) stepBtn.classList.add('active', `auto-level-${t.steps[s]}`);
                            } else {
                                if (t.steps[s] > 0) stepBtn.classList.add(`vel-${t.steps[s]}`);
                            }
                        }
                    });
                }

                // 2. Restore config-driven params via Randomizer
                if (data.randSnap && this._randomizer) {
                    this._randomizer.restoreSnapshot(data.randSnap, {
                        tracks: this.tracks,
                        audioEngine: this._audioEngine,
                        effectsManager: this._effectsManager
                    });
                } else if (data.fallbackTracks) {
                    // Fallback restore
                    data.fallbackTracks.forEach((tData, i) => {
                        if (i >= this.tracks.length) return;
                        const t = this.tracks[i];
                        Object.assign(t.params, tData.params);
                        tData.lfos.forEach((lData, lIdx) => {
                            if (lIdx < NUM_LFOS) {
                                if (lData.type !== undefined) {
                                    t.lfos[lIdx] = Modulator.deserialize(lData);
                                } else {
                                    const lfo = t.lfos[lIdx];
                                    lfo.wave = lData.wave;
                                    lfo.rate = lData.rate;
                                    lfo.amount = lData.amount;
                                    lfo.target = lData.target;
                                    if (lData.targets) lfo.targets = [...lData.targets];
                                }
                            }
                        });
                        if (t.bus.hp) t.bus.hp.frequency.value = t.params.hpFilter;
                        if (t.bus.lp) t.bus.lp.frequency.value = t.params.filter;
                        if (t.bus.vol) t.bus.vol.gain.value = t.params.volume;
                        if (t.bus.pan) t.bus.pan.pan.value = t.params.pan;
                    });
                }
                
                // Clear snapshot
                this.snapshotData = null;
                btn.classList.remove('snap-active');
                btn.innerText = 'Snap';
                
                // Reselect current track to update UI
                if (onSelectTrack && selectedTrackIndex !== undefined) {
                    onSelectTrack(selectedTrackIndex, visualizerCallback);
                }
                
            } catch(e) {
                console.error("Snapshot restore failed", e);
                this.snapshotData = null;
                btn.classList.remove('snap-active');
                btn.innerText = 'Snap';
            }
        }
    }

    // ============================================================================
    // GETTERS
    // ============================================================================

    hasSnapshot() {
        return this.snapshotData !== null;
    }

    clearSnapshot() {
        this.snapshotData = null;
        const btn = document.getElementById('snapshotBtn');
        if (btn) {
            btn.classList.remove('snap-active');
            btn.innerText = 'Snap';
        }
    }
}
