// js/ui/components/TrackOperations.js
import { NUM_STEPS, TRACKS_PER_GROUP } from '../../utils/constants.js';

export class TrackOperations {
    constructor() {
        this.tracks = [];
        this.randomChokeMode = false;
        this.randomChokeGroups = [];
        this.basePanValues = [];
        this.globalPanShift = 0;
        this.matrixStepElements = [];
        this.trackLabelElements = [];
        this.trackRowElements = [];
    }

    setTracks(tracks) {
        this.tracks = tracks;
    }

    setGridElements(matrixStepElements, trackLabelElements, trackRowElements) {
        this.matrixStepElements = matrixStepElements;
        this.trackLabelElements = trackLabelElements;
        this.trackRowElements = trackRowElements;
    }

    // ============================================================================
    // MUTE / SOLO OPERATIONS
    // ============================================================================

    toggleMute(trk) {
        this.tracks[trk].muted = !this.tracks[trk].muted;
        this.updateTrackStateUI(trk);
    }

    toggleMuteGroup(grpIdx) {
        const start = grpIdx * TRACKS_PER_GROUP;
        const end = start + TRACKS_PER_GROUP;
        const newState = !this.tracks[start]?.muted;
        
        for(let i=start; i<end; i++) {
            if(this.tracks[i]) {
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
        
        for(let i=start; i<end; i++) {
            if(this.tracks[i]) {
                this.tracks[i].soloed = newState;
                this.updateTrackStateUI(i);
            }
        }
    }

    // ============================================================================
    // LOCK / IGNORE OPERATIONS
    // ============================================================================

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
        
        if(this.tracks[trk].ignoreRandom) {
            btn.classList.add('exclude-active');
        } else {
            btn.classList.remove('exclude-active');
        }
    }

    updateTrackStateUI(trk) { 
        const t = this.tracks[trk]; 
        const btnM = document.getElementById(`btnM_${trk}`); 
        const btnS = document.getElementById(`btnS_${trk}`); 
        const btnL = document.getElementById(`btnL_${trk}`); 
        const btnX = document.getElementById(`btnX_${trk}`);
        
        if(t.muted) btnM.classList.add('mute-active'); else btnM.classList.remove('mute-active'); 
        if(t.soloed) btnS.classList.add('solo-active'); else btnS.classList.remove('solo-active'); 
        if(t.stepLock) btnL.classList.add('lock-active'); else btnL.classList.remove('lock-active'); 
        if(btnX) { 
            if(t.ignoreRandom) btnX.classList.add('exclude-active'); 
            else btnX.classList.remove('exclude-active'); 
        }
        
        if(this.trackRowElements[trk]) {
            this.trackRowElements[trk].forEach(el => el.style.opacity = t.muted ? '0.4' : '1.0');
        }
    }

    // ============================================================================
    // CLEAR OPERATIONS
    // ============================================================================

    clearTrack(trk) { 
        if(this.tracks[trk].type === 'automation') {
             this.tracks[trk].steps.fill(0);
        } else {
             this.tracks[trk].steps.fill(0); 
        }
        
        for(let s=0; s<NUM_STEPS; s++) {
            if(this.matrixStepElements[trk] && this.matrixStepElements[trk][s]) {
                 this.matrixStepElements[trk][s].className = 'step-btn';
            }
        }
    }

    clearGroup(grp) {
        const start = grp * TRACKS_PER_GROUP;
        const end = start + TRACKS_PER_GROUP;
        
        for(let i=start; i<end; i++) {
            if(this.tracks[i]) {
                this.clearTrack(i);
            }
        }
    }

    // ============================================================================
    // RANDOMIZE OPERATIONS
    // ============================================================================

    randomizeTrackPattern(trkIdx) { 
        const t = this.tracks[trkIdx]; 
        
        if(t.type === 'automation') {
             for(let i=0; i<NUM_STEPS; i++) {
                 const roll = Math.random();
                 let val = 0;
                 if (roll < 0.3) {
                      val = Math.floor(Math.random() * 5) + 1;
                 }
                 t.steps[i] = val;
                 const btn = this.matrixStepElements[trkIdx][i];
                 btn.className = btn.className.replace(/auto-level-\d/g, '').trim();
                 btn.classList.remove('active');
                 if(val > 0) {
                     btn.classList.add('active', `auto-level-${val}`);
                 }
             }
             return;
        }

        for(let i=0; i<NUM_STEPS; i++) { 
            const active = Math.random() < 0.25; 
            if (active) { 
                if (t.stepLock) continue;
                
                const rnd = Math.random();
                let vel = 2; // Normal
                if (rnd > 0.8) vel = 3; // Accent
                else if (rnd < 0.2) vel = 1; // Ghost
                
                t.steps[i] = vel;
            } else { 
                if (!t.stepLock) t.steps[i] = 0; 
            }
            
            const btn = this.matrixStepElements[trkIdx][i]; 
            btn.classList.remove('vel-1', 'vel-2', 'vel-3');
            if(t.steps[i] > 0) btn.classList.add(`vel-${t.steps[i]}`);
        } 
        
        if (this.randomChokeMode) this.applyRandomChokeDimming(); 
    }

    randomizeAllPatterns() {
        for (let step = 0; step < NUM_STEPS; step++) {
            const numGroups = Math.ceil(this.tracks.length / TRACKS_PER_GROUP);
            
            for (let g = 0; g < numGroups; g++) {
                const groupStart = g * TRACKS_PER_GROUP;
                const plays = Math.random() < 0.4;
                const activeTrackOffset = Math.floor(Math.random() * TRACKS_PER_GROUP);
                const activeTrackId = groupStart + activeTrackOffset;
                
                for (let i = 0; i < TRACKS_PER_GROUP; i++) {
                    const trkId = groupStart + i;
                    if (!this.tracks[trkId]) continue;
                    
                    const shouldBeActive = plays && (trkId === activeTrackId);
                    this.tracks[trkId].steps[step] = shouldBeActive;
                    
                    const btn = this.matrixStepElements[trkId][step];
                    if(shouldBeActive) btn.classList.add('active');
                    else btn.classList.remove('active');
                }
            }
        }
        
        if (this.randomChokeMode) this.applyRandomChokeDimming();
    }

    // ============================================================================
    // RANDOM CHOKE SYSTEM
    // ============================================================================

    toggleRandomChoke(onSelectTrack, visualizerCallback, selectedTrackIndex) {
        this.randomChokeMode = !this.randomChokeMode;
        const btn = document.getElementById('rndChokeBtn');
        
        if (this.randomChokeMode) {
            this.randomChokeGroups = this.tracks.map(() => Math.floor(Math.random() * 8));
            btn.classList.add('rnd-choke-active');
            this.updateAllTrackColors(onSelectTrack, visualizerCallback, selectedTrackIndex);
            this.applyRandomChokeDimming();
        } else {
            this.randomChokeGroups = [];
            btn.classList.remove('rnd-choke-active');
            this.updateAllTrackColors(onSelectTrack, visualizerCallback, selectedTrackIndex);
            this.clearRandomChokeDimming();
        }
    }

    updateAllTrackColors(onSelectTrack, visualizerCallback, selectedTrackIndex) {
        for (let trk = 0; trk < this.tracks.length; trk++) {
            const normalGroup = Math.floor(trk / TRACKS_PER_GROUP);
            const effectiveGroup = this.randomChokeMode ? this.randomChokeGroups[trk] : normalGroup;
            const groupColor = `hsl(${effectiveGroup * 45}, 70%, 50%)`;
            const groupColorGlow = `hsla(${effectiveGroup * 45}, 70%, 50%, 0.4)`;
            
            if (this.trackLabelElements[trk]) {
                this.trackLabelElements[trk].style.borderRight = `3px solid ${groupColor}`;
                this.trackLabelElements[trk].title = `Group ${effectiveGroup}`;
            }
            
            for (let step = 0; step < NUM_STEPS; step++) {
                if (this.matrixStepElements[trk] && this.matrixStepElements[trk][step]) {
                    const stepEl = this.matrixStepElements[trk][step];
                    stepEl.style.setProperty('--step-group-color', groupColor);
                    stepEl.style.setProperty('--step-group-color-glow', groupColorGlow);
                }
            }
        }
        
        if (this.tracks[selectedTrackIndex]) {
            onSelectTrack(selectedTrackIndex, visualizerCallback);
        }
    }

    applyRandomChokeDimming() {
        for (let step = 0; step < NUM_STEPS; step++) {
            const chokeGroupMap = new Map();
            
            for (let t = 0; t < this.tracks.length; t++) {
                if (this.tracks[t].steps[step]) {
                    const randomGroup = this.randomChokeGroups[t];
                    if (!chokeGroupMap.has(randomGroup)) {
                        chokeGroupMap.set(randomGroup, []);
                    }
                    chokeGroupMap.get(randomGroup).push(t);
                }
            }
            
            chokeGroupMap.forEach((trackIds) => {
                if (trackIds.length > 1) {
                    const winnerIdx = Math.floor(Math.random() * trackIds.length);
                    trackIds.forEach((trackId, idx) => {
                        const stepEl = this.matrixStepElements[trackId][step];
                        if (idx === winnerIdx) {
                            stepEl.classList.remove('step-dimmed');
                        } else {
                            stepEl.classList.add('step-dimmed');
                        }
                    });
                }
            });
        }
    }

    clearRandomChokeDimming() {
        for (let t = 0; t < this.tracks.length; t++) {
            for (let step = 0; step < NUM_STEPS; step++) {
                this.matrixStepElements[t][step].classList.remove('step-dimmed');
            }
        }
    }

    // ============================================================================
    // PAN OPERATIONS
    // ============================================================================

    savePanBaseline() {
        this.basePanValues = this.tracks.map(t => t.params.pan);
    }

    applyPanShift(shiftAmount) {
        this.globalPanShift = shiftAmount;
        if (this.basePanValues.length === 0) this.savePanBaseline();
        
        const numGroups = 8;
        
        for (let i = 0; i < this.tracks.length; i++) {
            const groupIdx = Math.floor(i / TRACKS_PER_GROUP);
            const basePan = this.basePanValues[i] || 0;
            const shiftInGroups = shiftAmount * numGroups;
            const newGroupPosition = (groupIdx + shiftInGroups) % numGroups;
            const newGroupCenter = -1 + (newGroupPosition / (numGroups - 1)) * 2;
            const originalGroupCenter = -1 + (groupIdx / (numGroups - 1)) * 2;
            const offsetFromCenter = basePan - originalGroupCenter;
            let newPan = newGroupCenter + offsetFromCenter;
            newPan = Math.max(-1, Math.min(1, newPan));
            this.tracks[i].params.pan = parseFloat(newPan.toFixed(3));
            
            if(this.tracks[i].bus && this.tracks[i].bus.pan) {
                this.tracks[i].bus.pan.pan.value = newPan;
            }
        }
    }

    // ============================================================================
    // GETTERS
    // ============================================================================

    getRandomChokeInfo() {
        return {
            mode: this.randomChokeMode,
            groups: this.randomChokeGroups
        };
    }

    getRandomChokeMode() {
        return this.randomChokeMode;
    }

    getRandomChokeGroups() {
        return this.randomChokeGroups;
    }
}