// js/ui/components/TrackOperations.js
import { NUM_STEPS, TRACKS_PER_GROUP } from '../../utils/constants.js';
import { DOMHelpers } from '../utils/DOMHelpers.js';

export class TrackOperations {
    constructor() {
        this.tracks = [];
        this.randomChokeMode = false;
        this.randomChokeGroups = [];
        this.basePanValues = [];
        this.globalPanShift = 0;
    }

    setTracks(tracks) {
        this.tracks = tracks;
    }

    // Mute/Solo operations
    toggleMute(trk) {
        this.tracks[trk].muted = !this.tracks[trk].muted;
        this.updateTrackStateUI(trk);
    }

    toggleMuteGroup(grpIdx) {
        const start = grpIdx * TRACKS_PER_GROUP;
        const end = start + TRACKS_PER_GROUP;
        const newState = !this.tracks[start]?.muted;
        
        for (let i = start; i < end; i++) {
            if (this.tracks[i]) {
                this.tracks[i].muted = newState;
                this.updateTrackStateUI(i);
            }
        }
    }

    toggleSolo(trk) {
        this.tracks[trk].soloed = !this.tracks[trk].soloed;
        this.updateTrackStateUI(trk);
    }

    toggleSoloGroup(grpIdx) {
        const start = grpIdx * TRACKS_PER_GROUP;
        const end = start + TRACKS_PER_GROUP;
        const newState = !this.tracks[start]?.soloed;
        
        for (let i = start; i < end; i++) {
            if (this.tracks[i]) {
                this.tracks[i].soloed = newState;
                this.updateTrackStateUI(i);
            }
        }
    }

    toggleStepLock(trk) {
        this.tracks[trk].stepLock = !this.tracks[trk].stepLock;
        const btnL = document.getElementById(`btnL_${trk}`);
        
        if (this.tracks[trk].stepLock) {
            btnL.classList.add('lock-active');
        } else {
            btnL.classList.remove('lock-active');
        }
    }

    toggleIgnoreRandom(trk) {
        this.tracks[trk].ignoreRandom = !this.tracks[trk].ignoreRandom;
        const btn = document.getElementById(`btnX_${trk}`);
        
        if (this.tracks[trk].ignoreRandom) {
            btn.classList.add('exclude-active');
        } else {
            btn.classList.remove('exclude-active');
        }
    }

    updateTrackStateUI(trk, gridElements) {
        const t = this.tracks[trk];
        const btnM = document.getElementById(`btnM_${trk}`);
        const btnS = document.getElementById(`btnS_${trk}`);
        const btnL = document.getElementById(`btnL_${trk}`);
        const btnX = document.getElementById(`btnX_${trk}`);
        
        DOMHelpers.toggleClass(`btnM_${trk}`, 'mute-active', t.muted);
        DOMHelpers.toggleClass(`btnS_${trk}`, 'solo-active', t.soloed);
        DOMHelpers.toggleClass(`btnL_${trk}`, 'lock-active', t.stepLock);
        
        if (btnX) {
            DOMHelpers.toggleClass(`btnX_${trk}`, 'exclude-active', t.ignoreRandom);
        }
        
        if (gridElements.trackRowElements[trk]) {
            gridElements.trackRowElements[trk].forEach(el => {
                el.style.opacity = t.muted ? '0.4' : '1.0';
            });
        }
    }

    // Clear operations
    clearTrack(trk, gridElements) {
        if (this.tracks[trk].type === 'automation') {
            this.tracks[trk].steps.fill(0);
        } else {
            this.tracks[trk].steps.fill(0);
        }
        
        for (let s = 0; s < NUM_STEPS; s++) {
            if (gridElements.matrixStepElements[trk] && 
                gridElements.matrixStepElements[trk][s]) {
                gridElements.matrixStepElements[trk][s].className = 'step-btn';
            }
        }
    }

    clearGroup(grp, gridElements) {
        const start = grp * TRACKS_PER_GROUP;
        const end = start + TRACKS_PER_GROUP;
        
        for (let i = start; i < end; i++) {
            if (this.tracks[i]) {
                this.clearTrack(i, gridElements);
            }
        }
    }

    // Randomize operations
    randomizeTrackPattern(trkIdx, gridElements) {
        const ignoreExisting = false;
        
        for (let step = 0; step < NUM_STEPS; step++) {
            if (ignoreExisting || !this.tracks[trkIdx].steps[step]) {
                const shouldActivate = Math.random() < 0.25;
                const velocity = shouldActivate ? Math.ceil(Math.random() * 3) : 0;
                
                this.tracks[trkIdx].steps[step] = velocity;
                const btn = gridElements.matrixStepElements[trkIdx][step];
                
                btn.classList.remove('active', 'vel-1', 'vel-2', 'vel-3');
                if (velocity > 0) {
                    btn.classList.add('active', `vel-${velocity}`);
                }
            }
        }
    }

    randomizeAllPatterns(gridElements) {
        // [Full implementation in actual file]
        // Randomizes all tracks respecting choke groups
    }

    // Random choke operations
    toggleRandomChoke(gridElements, selectTrackCallback) {
        this.randomChokeMode = !this.randomChokeMode;
        const btn = document.getElementById('rndChokeBtn');
        
        if (this.randomChokeMode) {
            this.randomChokeGroups = this.tracks.map(() => 
                Math.floor(Math.random() * 8)
            );
            btn.classList.add('rnd-choke-active');
            this.updateAllTrackColors(gridElements, selectTrackCallback);
            this.applyRandomChokeDimming(gridElements);
        } else {
            this.randomChokeGroups = [];
            btn.classList.remove('rnd-choke-active');
            this.updateAllTrackColors(gridElements, selectTrackCallback);
            this.clearRandomChokeDimming(gridElements);
        }
    }

    updateAllTrackColors(gridElements, selectTrackCallback) {
        // [Full implementation in actual file]
        // Updates colors based on choke groups
    }

    applyRandomChokeDimming(gridElements) {
        // [Full implementation in actual file]
        // Dims competing steps in same choke group
    }

    clearRandomChokeDimming(gridElements) {
        // [Full implementation in actual file]
        // Removes dimming from all steps
    }

    // Pan operations
    savePanBaseline() {
        this.basePanValues = this.tracks.map(t => t.params.pan);
    }

    applyPanShift(shiftAmount) {
        // [Full implementation in actual file]
        // Shifts pan based on groups
    }

    // Getters
    getRandomChokeInfo() {
        return {
            mode: this.randomChokeMode,
            groups: this.randomChokeGroups
        };
    }
}