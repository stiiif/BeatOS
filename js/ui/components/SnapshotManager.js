// js/ui/components/SnapshotManager.js
import { NUM_STEPS, NUM_LFOS } from '../../utils/constants.js';

export class SnapshotManager {
    constructor() {
        this.tracks = [];
        this.snapshotData = null;
        this.matrixStepElements = [];
    }

    setTracks(tracks) {
        this.tracks = tracks;
    }

    setGridElements(matrixStepElements) {
        this.matrixStepElements = matrixStepElements;
    }

    // ============================================================================
    // TOGGLE SNAPSHOT (SAVE/RESTORE)
    // ============================================================================

    toggleSnapshot(onUpdateTrackStateUI, onSelectTrack, selectedTrackIndex, visualizerCallback) {
        const btn = document.getElementById('snapshotBtn');
        
        if(!this.snapshotData) {
            // SAVE SNAPSHOT
            this.snapshotData = JSON.stringify({
                tracks: this.tracks.map(t => ({
                    params: {...t.params},
                    steps: Array.from(t.steps),
                    muted: t.muted,
                    soloed: t.soloed,
                    stepLock: t.stepLock,
                    ignoreRandom: t.ignoreRandom,
                    lfos: t.lfos.map(l => ({ 
                        wave: l.wave, 
                        rate: l.rate, 
                        amount: l.amount, 
                        target: l.target 
                    }))
                }))
            });
            
            btn.classList.add('snap-active');
            btn.innerText = 'RESTORE';
            
        } else {
            // RESTORE SNAPSHOT
            try {
                const data = JSON.parse(this.snapshotData);
                
                data.tracks.forEach((trackData, i) => {
                    if (i >= this.tracks.length) return;
                    const t = this.tracks[i];
                    
                    // Restore parameters
                    t.params = { ...trackData.params };
                    t.steps = new Uint8Array(trackData.steps);
                    t.muted = trackData.muted;
                    t.soloed = trackData.soloed;
                    t.stepLock = trackData.stepLock || false;
                    t.ignoreRandom = trackData.ignoreRandom || false;
                    
                    // Restore LFOs
                    trackData.lfos.forEach((lData, lIdx) => {
                        if(lIdx < NUM_LFOS) {
                            t.lfos[lIdx].wave = lData.wave;
                            t.lfos[lIdx].rate = lData.rate;
                            t.lfos[lIdx].amount = lData.amount;
                            t.lfos[lIdx].target = lData.target;
                        }
                    });
                    
                    // Update track state UI (mute/solo/lock buttons)
                    if (onUpdateTrackStateUI) {
                        onUpdateTrackStateUI(i);
                    }
                    
                    // Update step buttons
                    for(let s=0; s<NUM_STEPS; s++) {
                         const btn = this.matrixStepElements[i][s];
                         if (!btn) continue;
                         
                         btn.className = 'step-btn';
                         btn.classList.remove('active', 'vel-1', 'vel-2', 'vel-3', 
                                            'auto-level-1', 'auto-level-2', 'auto-level-3', 
                                            'auto-level-4', 'auto-level-5');
                         
                         if(t.type === 'automation') {
                             if(t.steps[s] > 0) {
                                 btn.classList.add('active', `auto-level-${t.steps[s]}`);
                             }
                         } else {
                             if(t.steps[s] > 0) {
                                 btn.classList.add(`vel-${t.steps[s]}`);
                             }
                         }
                    }
                    
                    // Restore audio bus parameters
                    if(t.bus.hp) t.bus.hp.frequency.value = t.params.hpFilter;
                    if(t.bus.lp) t.bus.lp.frequency.value = t.params.filter;
                    if(t.bus.vol) t.bus.vol.gain.value = t.params.volume;
                    if(t.bus.pan) t.bus.pan.pan.value = t.params.pan;
                });
                
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