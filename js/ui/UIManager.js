// UI Manager Module - Refactored for Phase 2.2
import { NUM_STEPS, TRACKS_PER_GROUP, NUM_LFOS, MAX_TRACKS } from '../utils/constants.js';
import { PatternLibrary } from '../modules/PatternLibrary.js';
import { SearchModal } from './SearchModal.js';
import { SequencerGrid } from './components/SequencerGrid.js'; 
import { TrackInspector } from './components/TrackInspector.js'; // New Component
import { globalBus } from '../events/EventBus.js';
import { EVENTS } from '../events/Events.js';

export class UIManager {
    constructor() {
        this.tracks = [];
        this.trackManager = null; 
        this.selectedTrackIndex = 0;
        
        // Components
        this.sequencerGrid = null;
        this.trackInspector = null;
        this.searchModal = null; // Still needed for Groove logic possibly, but Inspector has its own
        
        this.patternLibrary = new PatternLibrary();
        
        // Define Keyboard Mapping
        this.keyMapping = {
            'Digit1': 0, 'KeyQ': 1, 'KeyA': 2, 'KeyZ': 3,
            'Digit2': 4, 'KeyW': 5, 'KeyS': 6, 'KeyX': 7,
            'Digit3': 8, 'KeyE': 9, 'KeyD': 10, 'KeyC': 11,
            'Digit4': 12, 'KeyR': 13, 'KeyF': 14, 'KeyV': 15,
            'Digit5': 16, 'KeyT': 17, 'KeyG': 18, 'KeyB': 19,
            'Digit6': 20, 'KeyY': 21, 'KeyH': 22, 'KeyN': 23,
            'Digit7': 24, 'KeyU': 25, 'KeyJ': 26, 'KeyM': 27,
            'Digit8': 28, 'KeyI': 29, 'KeyK': 30, 'Comma': 31
        };
        
        document.documentElement.style.setProperty('--num-steps', NUM_STEPS);
    }

    setTracks(tracks) {
        this.tracks = tracks;
    }

    setTrackManager(tm) {
        this.trackManager = tm;
    }

    initUI(addTrackCallback, addGroupCallback) {
        // Ensure CSS var is set again
        document.documentElement.style.setProperty('--num-steps', NUM_STEPS);

        // --- INIT SUB-COMPONENTS ---
        this.sequencerGrid = new SequencerGrid('matrixContainer', this.trackManager);
        
        // Initialize Inspector in the .right-pane
        this.trackInspector = new TrackInspector('.right-pane', this.trackManager);

        // Setup Buttons (Keep for now, moves to Toolbar/Transport in Phase 2.3)
        const buttonRow = document.createElement('div');
        buttonRow.id = 'matrixButtonRow';
        buttonRow.className = 'flex gap-2 mt-2 px-1';
        
        const addTrackBtn = document.createElement('button');
        addTrackBtn.id = 'addTrackBtn';
        addTrackBtn.className = 'flex-1';
        addTrackBtn.innerHTML = '<i class="fas fa-plus mr-2"></i>ADD NEW TRACK';
        addTrackBtn.onclick = () => addTrackCallback();
        
        const addGroupBtn = document.createElement('button');
        addGroupBtn.id = 'addGroupBtn';
        addGroupBtn.className = 'flex-1';
        addGroupBtn.innerHTML = '<i class="fas fa-layer-group mr-2"></i>ADD NEW GROUP';
        addGroupBtn.onclick = () => addGroupCallback();
        
        buttonRow.appendChild(addTrackBtn);
        buttonRow.appendChild(addGroupBtn);
        
        const container = document.getElementById('matrixContainer');
        container.appendChild(buttonRow);

        // --- Initialize Groove Controls ---
        this.initGrooveControls();

        // Initialize Search Modal (for Groove logic which is still in UIManager for now)
        if (this.trackManager && this.trackManager.audioEngine) {
            this.searchModal = new SearchModal(this.trackManager.audioEngine);
        }
        
        // Event Listeners
        globalBus.on(EVENTS.TRACK_SELECTED, (index) => {
            this.selectedTrackIndex = index;
            // No need to call selectTrack() anymore, components listen to event
        });

        globalBus.on(EVENTS.PLAYBACK_STOP, () => {
            if(this.sequencerGrid) this.sequencerGrid.clearPlayheadForStop();
        });

        document.body.addEventListener('wheel', (e) => {
            if (e.target.type === 'range') {
                e.preventDefault();
                this.handleSliderWheel(e);
            }
        }, { passive: false });

        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            if (this.keyMapping.hasOwnProperty(e.code)) {
                const stepIndex = this.keyMapping[e.code];
                const currentTrackId = this.selectedTrackIndex;
                if (currentTrackId >= 0 && currentTrackId < this.tracks.length) {
                    if(stepIndex < NUM_STEPS) {
                        this.sequencerGrid.handleStepClick(currentTrackId, stepIndex);
                    }
                }
            }
        });
    }

    initGrooveControls() {
        const patternSelect = document.getElementById('patternSelect');
        const targetGroupSelect = document.getElementById('targetGroupSelect');
        const patternInfluence = document.getElementById('patternInfluence');
        const patternInfluenceVal = document.getElementById('patternInfluenceVal');

        if(patternSelect) {
            patternSelect.innerHTML = '<option value="">Select Pattern...</option>';
            const patterns = this.patternLibrary.getPatterns();
            patterns.sort((a,b) => a.name.localeCompare(b.name));
            patterns.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.id;
                opt.innerText = `${p.name} (${p.genre || 'World'})`;
                patternSelect.appendChild(opt);
            });
        }

        if(targetGroupSelect) {
            targetGroupSelect.innerHTML = '';
            const maxGroups = Math.ceil(MAX_TRACKS / TRACKS_PER_GROUP);
            for(let i=0; i<maxGroups; i++) {
                const opt = document.createElement('option');
                opt.value = i;
                opt.innerText = `Group ${i+1} (Trk ${i*TRACKS_PER_GROUP+1}-${(i+1)*TRACKS_PER_GROUP})`;
                targetGroupSelect.appendChild(opt);
            }
        }

        if(patternInfluence) {
            patternInfluence.addEventListener('input', (e) => {
                if(patternInfluenceVal) patternInfluenceVal.innerText = e.target.value;
            });
        }
        
        const applyBtn = document.getElementById('applyGrooveBtn');
        if(applyBtn) {
            applyBtn.onclick = () => this.applyGroove();
        }
    }

    applyGroove() {
        // Logic for applying grooves... kept here for now
        const patId = parseInt(document.getElementById('patternSelect').value);
        const grpId = parseInt(document.getElementById('targetGroupSelect').value);
        const influence = parseInt(document.getElementById('patternInfluence').value) / 100.0;

        if (isNaN(patId)) { alert("Please select a pattern first."); return; }
        if (isNaN(grpId)) { alert("Please select a target group."); return; }

        const pattern = this.patternLibrary.getPatternById(patId);
        if (!pattern) return;

        const startTrack = grpId * TRACKS_PER_GROUP;
        
        for (let i = 0; i < TRACKS_PER_GROUP; i++) {
            const targetTrackId = startTrack + i;
            const patternTrack = pattern.tracks[i];
            
            if (this.tracks[targetTrackId] && !this.tracks[targetTrackId].stepLock && this.tracks[targetTrackId].type !== 'automation') {
                const targetTrackObj = this.tracks[targetTrackId];
                targetTrackObj.steps.fill(0);
                targetTrackObj.microtiming.fill(0);

                if (patternTrack) {
                    if (this.trackManager) {
                        this.trackManager.autoConfigureTrack(targetTrackObj, patternTrack.instrument_type || patternTrack.instrument);
                    }
                    const stepString = patternTrack.steps;
                    const microtimingArray = patternTrack.microtiming;

                    for (let s = 0; s < NUM_STEPS; s++) {
                        const charIndex = s % stepString.length;
                        const char = stepString[charIndex];
                        const velocity = parseInt(char);
                        const roll = Math.random();
                        
                        if (roll < influence) {
                            if (!isNaN(velocity) && velocity > 0) {
                                targetTrackObj.steps[s] = velocity;
                                if (microtimingArray && microtimingArray[charIndex] !== undefined) {
                                    targetTrackObj.microtiming[s] = microtimingArray[charIndex];
                                }
                            }
                        } else {
                            if (Math.random() < 0.05) targetTrackObj.steps[s] = 1; 
                        }
                    }
                }
            }
        }
        
        if(this.sequencerGrid) this.sequencerGrid.refreshGridState();
        globalBus.emit(EVENTS.TRACK_SELECTED, startTrack);
    }

    handleSliderWheel(e) {
        const el = e.target;
        const step = parseFloat(el.step) || 0.01;
        const min = parseFloat(el.min);
        const max = parseFloat(el.max);
        const isCoarse = (e.buttons & 4) === 4; 
        const dir = Math.sign(e.deltaY) * -1; 
        const multiplier = isCoarse ? 10 : 1;
        let val = parseFloat(el.value);
        val += dir * step * multiplier;
        val = Math.max(min, Math.min(max, val));
        el.value = val;
        el.dispatchEvent(new Event('input', { bubbles: true }));
    }

    appendTrackRow(trk) {
        if (this.sequencerGrid) this.sequencerGrid.appendTrackRow(trk);
        globalBus.emit(EVENTS.TRACK_ADDED, trk);
    }

    // --- PROXIES & UTILS ---
    updateMatrixHead(currentStep, totalStepsPlayed) {
        if(this.sequencerGrid) this.sequencerGrid.updatePlayhead(currentStep, totalStepsPlayed);
    }

    getSelectedTrackIndex() { return this.selectedTrackIndex; }
    
    // Pan Shift (Global)
    savePanBaseline() { this.basePanValues = this.tracks.map(t => t.params.pan); }
    applyPanShift(shiftAmount) { 
        this.globalPanShift = shiftAmount; 
        if (!this.basePanValues || this.basePanValues.length === 0) this.savePanBaseline(); 
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
        globalBus.emit(EVENTS.PARAM_CHANGED);
    }
    
    clearPlayheadForStop() {
        if(this.sequencerGrid) this.sequencerGrid.clearPlayheadForStop();
    }
    
    // --- Helper for Randomization (Global button calls this) ---
    randomizeAllPatterns() { 
        this.tracks.forEach((_, i) => this.sequencerGrid.randomizeTrack(i)); 
        globalBus.emit(EVENTS.PATTERN_RANDOMIZED);
    }
    
    // Pass-through for Random Choke which is still semi-global logic
    toggleRandomChoke() {
        if(this.sequencerGrid) {
            this.sequencerGrid.randomChokeMode = !this.sequencerGrid.randomChokeMode; // Or handle state in Manager
            // Actually, the Random Choke state is needed by Scheduler.
            // For now, let's keep the state here or in SequencerGrid?
            // The Scheduler calls uiManager.getRandomChokeInfo().
            // We should move this state to SequencerGrid or a StateManager.
            // For now, let's proxy it to SequencerGrid if we move state there, or keep it here.
            
            // Let's keep it here for now to avoid breaking Scheduler interface immediately.
            this.randomChokeMode = !this.randomChokeMode;
            if(this.randomChokeMode) this.randomChokeGroups = this.tracks.map(() => Math.floor(Math.random() * 8));
            else this.randomChokeGroups = [];
            
            const btn = document.getElementById('rndChokeBtn');
            if(btn) this.randomChokeMode ? btn.classList.add('rnd-choke-active') : btn.classList.remove('rnd-choke-active');
            
            // Update Grid Visuals
            if(this.sequencerGrid) {
                // We need to pass the groups to grid if we want it to color tracks
                // But grid calculates group based on index currently. 
                // We might need to update SequencerGrid to accept custom groups.
                // For this refactor step, we'll accept visual discrepancy or fix later.
            }
        }
    }
    
    getRandomChokeInfo() { return { mode: this.randomChokeMode, groups: this.randomChokeGroups }; }
    
    // Proxy for snapshot logic which is still here
    updateTrackStateUI(idx) {
        if(this.sequencerGrid) this.sequencerGrid.updateTrackStateVisuals(idx);
    }
    
    toggleSnapshot() {
        // ... (Existing Snapshot Logic) ...
        const btn = document.getElementById('snapshotBtn');
        if(!this.snapshotData) {
            this.snapshotData = JSON.stringify({
                tracks: this.tracks.map(t => ({
                    params: {...t.params},
                    steps: Array.from(t.steps),
                    muted: t.muted, soloed: t.soloed, stepLock: t.stepLock, ignoreRandom: t.ignoreRandom,
                    lfos: t.lfos.map(l => ({ wave: l.wave, rate: l.rate, amount: l.amount, target: l.target }))
                }))
            });
            btn.classList.add('snap-active');
            btn.innerText = 'RESTORE';
        } else {
            try {
                const data = JSON.parse(this.snapshotData);
                data.tracks.forEach((trackData, i) => {
                    if (i >= this.tracks.length) return;
                    const t = this.tracks[i];
                    t.params = { ...trackData.params };
                    t.steps = new Uint8Array(trackData.steps);
                    t.muted = trackData.muted; t.soloed = trackData.soloed;
                    t.stepLock = trackData.stepLock; t.ignoreRandom = trackData.ignoreRandom; 
                    trackData.lfos.forEach((lData, lIdx) => {
                        if(lIdx < NUM_LFOS) {
                            t.lfos[lIdx].wave = lData.wave; t.lfos[lIdx].rate = lData.rate;
                            t.lfos[lIdx].amount = lData.amount; t.lfos[lIdx].target = lData.target;
                        }
                    });
                    
                    if(this.sequencerGrid) {
                        this.sequencerGrid.updateTrackStateVisuals(i);
                        this.sequencerGrid.refreshTrackRow(i);
                    }
                    
                    if(t.bus.hp) t.bus.hp.frequency.value = t.params.hpFilter;
                    if(t.bus.lp) t.bus.lp.frequency.value = t.params.filter;
                    if(t.bus.vol) t.bus.vol.gain.value = t.params.volume;
                    if(t.bus.pan) t.bus.pan.pan.value = t.params.pan;
                });
                this.snapshotData = null;
                btn.classList.remove('snap-active');
                btn.innerText = 'Snap';
                globalBus.emit(EVENTS.TRACK_SELECTED, this.selectedTrackIndex);
            } catch(e) {
                console.error("Snapshot restore failed", e);
                this.snapshotData = null;
                btn.classList.remove('snap-active');
                btn.innerText = 'Snap';
            }
        }
    }
}