// js/ui/components/SnapshotManager.js
import { NUM_STEPS, NUM_LFOS } from '../../utils/constants.js';

export class SnapshotManager {
    constructor() {
        this.snapshotData = null;
        this.tracks = [];
    }

    setTracks(tracks) {
        this.tracks = tracks;
    }

    toggleSnapshot(gridElements, updateTrackStateUICallback, selectTrackCallback) {
        const btn = document.getElementById('snapshotBtn');
        
        if (!this.snapshotData) {
            // Save snapshot
            this.snapshotData = JSON.stringify({
                tracks: this.tracks.map(t => ({
                    params: { ...t.params },
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
            // Restore snapshot
            try {
                this.restoreSnapshot(gridElements, updateTrackStateUICallback);
                
                this.snapshotData = null;
                btn.classList.remove('snap-active');
                btn.innerText = 'Snap';
                
                if (selectTrackCallback) {
                    selectTrackCallback();
                }
            } catch (e) {
                console.error("Snapshot restore failed", e);
                this.snapshotData = null;
                btn.classList.remove('snap-active');
                btn.innerText = 'Snap';
            }
        }
    }

    restoreSnapshot(gridElements, updateTrackStateUICallback) {
        const data = JSON.parse(this.snapshotData);
        
        data.tracks.forEach((trackData, i) => {
            if (i >= this.tracks.length) return;
            
            const t = this.tracks[i];
            t.params = { ...trackData.params };
            t.steps = new Uint8Array(trackData.steps);
            t.muted = trackData.muted;
            t.soloed = trackData.soloed;
            t.stepLock = trackData.stepLock || false;
            t.ignoreRandom = trackData.ignoreRandom || false;
            
            trackData.lfos.forEach((lData, lIdx) => {
                if (lIdx < NUM_LFOS) {
                    t.lfos[lIdx].wave = lData.wave;
                    t.lfos[lIdx].rate = lData.rate;
                    t.lfos[lIdx].amount = lData.amount;
                    t.lfos[lIdx].target = lData.target;
                }
            });
            
            updateTrackStateUICallback(i, gridElements);
            
            // Update step visuals
            for (let s = 0; s < NUM_STEPS; s++) {
                const btn = gridElements.matrixStepElements[i][s];
                btn.className = 'step-btn';
                btn.classList.remove('active', 'vel-1', 'vel-2', 'vel-3',
                    'auto-level-1', 'auto-level-2', 'auto-level-3',
                    'auto-level-4', 'auto-level-5');
                
                if (t.type === 'automation') {
                    if (t.steps[s] > 0) {
                        btn.classList.add('active', `auto-level-${t.steps[s]}`);
                    }
                } else {
                    if (t.steps[s] > 0) {
                        btn.classList.add(`vel-${t.steps[s]}`);
                    }
                }
            }
            
            // Update audio parameters
            if (t.bus.hp) t.bus.hp.frequency.value = t.params.hpFilter;
            if (t.bus.lp) t.bus.lp.frequency.value = t.params.filter;
            if (t.bus.vol) t.bus.vol.gain.value = t.params.volume;
            if (t.bus.pan) t.bus.pan.pan.value = t.params.pan;
        });
    }
}