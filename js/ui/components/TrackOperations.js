// js/ui/components/TrackOperations.js - Updated for Shared Memory (Phase B)
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
        this.audioEngine = null; // Needed for Shared Memory updates
    }

    setTracks(tracks) {
        this.tracks = tracks;
    }
    
    // Inject Engine to access updateTrackStep
    setAudioEngine(engine) {
        this.audioEngine = engine;
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
        // V5: Mute is handled by setting Volume to 0 in ParamBuffer? 
        // Or keeping mute logic in UI? For zero-latency, better to set Volume param to 0.
        // However, restoring volume requires remembering the previous value.
        // For simplicity in Phase B, we might rely on UI-side mute logic updating the pattern buffer 
        // OR simply set volume to 0 in shared memory.
        // Let's stick to updating the param for instant result.
        
        const targetVol = this.tracks[trk].muted ? 0 : (this.tracks[trk].params.volume || 0.8);
        if (this.audioEngine) this.audioEngine.updateParam(trk, 0, targetVol); // 0 = P_VOL
    }

    toggleMuteGroup(grpIdx) {
        const start = grpIdx * TRACKS_PER_GROUP;
        const end = start + TRACKS_PER_GROUP;
        const newState = !this.tracks[start]?.muted;
        
        for(let i=start; i<end; i++) {
            if(this.tracks[i]) {
                this.tracks[i].muted = newState;
                this.updateTrackStateUI(i);
                // Update Shared Memory
                const targetVol = newState ? 0 : (this.tracks[i].params.volume || 0.8);
                if (this.audioEngine) this.audioEngine.updateParam(i, 0, targetVol);
            }
        }
    }

    toggleSolo(trk) {
        this.tracks[trk].soloed = !this.tracks[trk].soloed;
        this.updateTrackStateUI(trk);
        this.applySoloState();
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
        this.applySoloState();
    }
    
    // Helper to update volumes based on Solo state
    applySoloState() {
        const anySolo = this.tracks.some(t => t.soloed);
        
        for(let i=0; i<this.tracks.length; i++) {
            const t = this.tracks[i];
            let shouldPlay = true;
            
            if (anySolo) {
                shouldPlay = t.soloed;
            } else {
                shouldPlay = !t.muted;
            }
            
            // Write to Shared Memory Volume
            const vol = shouldPlay ? (t.params.volume || 0.8) : 0;
            if (this.audioEngine) this.audioEngine.updateParam(i, 0, vol);
        }
    }

    // ============================================================================
    // LOCK / IGNORE OPERATIONS
    // ============================================================================

    toggleStepLock(trk) {
        this.tracks[trk].stepLock = !this.tracks[trk].stepLock;
        const btnL = document.getElementById(`btnL_${trk}`);
        if (this.tracks[trk].stepLock) btnL.classList.add('lock-active'); else btnL.classList.remove('lock-active');
    }

    toggleIgnoreRandom(trk) {
        this.tracks[trk].ignoreRandom = !this.tracks[trk].ignoreRandom;
        const btn = document.getElementById(`btnX_${trk}`);
        if(this.tracks[trk].ignoreRandom) btn.classList.add('exclude-active'); else btn.classList.remove('exclude-active');
    }

    toggleIgnoreVelocityParams(trk) {
        this.tracks[trk].ignoreVelocityParams = !this.tracks[trk].ignoreVelocityParams;
        const btn = document.getElementById(`btnV_${trk}`);
        if(this.tracks[trk].ignoreVelocityParams) btn.classList.add('ignore-vel-active'); else btn.classList.remove('ignore-vel-active');
    }

    updateTrackStateUI(trk) { 
        const t = this.tracks[trk]; 
        const btnM = document.getElementById(`btnM_${trk}`); 
        const btnS = document.getElementById(`btnS_${trk}`); 
        const btnL = document.getElementById(`btnL_${trk}`); 
        const btnX = document.getElementById(`btnX_${trk}`);
        const btnV = document.getElementById(`btnV_${trk}`);
        
        if(t.muted) btnM.classList.add('mute-active'); else btnM.classList.remove('mute-active'); 
        if(t.soloed) btnS.classList.add('solo-active'); else btnS.classList.remove('solo-active'); 
        if(t.stepLock) btnL.classList.add('lock-active'); else btnL.classList.remove('lock-active'); 
        if(btnX) { if(t.ignoreRandom) btnX.classList.add('exclude-active'); else btnX.classList.remove('exclude-active'); }
        if(btnV) { if(t.ignoreVelocityParams) btnV.classList.add('ignore-vel-active'); else btnV.classList.remove('ignore-vel-active'); }
        
        if(this.trackRowElements[trk]) {
            this.trackRowElements[trk].forEach(el => el.style.opacity = t.muted ? '0.4' : '1.0');
        }
    }

    // ============================================================================
    // CLEAR OPERATIONS
    // ============================================================================

    clearTrack(trk) { 
        this.tracks[trk].steps.fill(0);
        
        // Update Shared Memory Grid
        if (this.audioEngine) {
            for(let s=0; s<NUM_STEPS; s++) this.audioEngine.updateTrackStep(trk, s, 0);
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
            if(this.tracks[i]) this.clearTrack(i);
        }
    }

    // ============================================================================
    // RANDOMIZE OPERATIONS
    // ============================================================================

    randomizeTrackPattern(trkIdx) { 
        const t = this.tracks[trkIdx]; 
        
        if(t.type === 'automation') {
             // ... keep automation logic local or move to shared param later ...
             return;
        }

        for(let i=0; i<NUM_STEPS; i++) { 
            let vel = 0;
            const active = Math.random() < 0.25; 
            
            if (active) { 
                if (t.stepLock) continue;
                const rnd = Math.random();
                vel = 2; // Normal
                if (rnd > 0.8) vel = 3; // Accent
                else if (rnd < 0.2) vel = 1; // Ghost
            } else { 
                if (t.stepLock) continue;
                vel = 0;
            }
            
            t.steps[i] = vel;
            // Update Shared Memory
            if (this.audioEngine) this.audioEngine.updateTrackStep(trkIdx, i, vel);
            
            const btn = this.matrixStepElements[trkIdx][i]; 
            btn.classList.remove('vel-1', 'vel-2', 'vel-3');
            if(vel > 0) btn.classList.add(`vel-${vel}`);
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
                    const vel = shouldBeActive ? 2 : 0;
                    
                    this.tracks[trkId].steps[step] = vel;
                    
                    if (this.audioEngine) this.audioEngine.updateTrackStep(trkId, step, vel);
                    
                    const btn = this.matrixStepElements[trkId][step];
                    btn.classList.remove('active', 'vel-1', 'vel-2', 'vel-3');
                    if(shouldBeActive) btn.classList.add('vel-2');
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
            const offsetFromCenter = basePan - originalGroupCenter;
            let newPan = newGroupCenter + offsetFromCenter;
            newPan = Math.max(-1, Math.min(1, newPan));
            
            // 1. Update UI Object
            this.tracks[i].params.pan = parseFloat(newPan.toFixed(3));
            
            // 2. Update Shared Memory (V5)
            if (this.audioEngine) {
                this.audioEngine.updateParam(i, 1, newPan); // 1 = P_PAN
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