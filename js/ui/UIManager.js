// UI Manager Module - Updated for Refinement & Polish
import { NUM_STEPS, TRACKS_PER_GROUP, NUM_LFOS, MAX_TRACKS } from '../utils/constants.js';
import { PatternLibrary } from '../modules/PatternLibrary.js';
import { SearchModal } from './SearchModal.js'; // Import the new modal

export class UIManager {
    constructor() {
        this.tracks = [];
        this.trackManager = null; 
        this.selectedTrackIndex = 0;
        this.selectedLfoIndex = 0;
        this.matrixStepElements = [];
        this.trackLabelElements = [];
        this.trackRowElements = [];
        this.snapshotData = null;
        this.randomChokeMode = false;
        this.randomChokeGroups = [];
        this.basePanValues = [];
        this.globalPanShift = 0;
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
        
        // IMMEDIATE CSS UPDATE in Constructor
        document.documentElement.style.setProperty('--num-steps', NUM_STEPS);
        this.searchModal = null; // Initialize property
    }

    setTracks(tracks) {
        this.tracks = tracks;
    }

    setTrackManager(tm) {
        this.trackManager = tm;
    }

    initUI(addTrackCallback, addGroupCallback, visualizerCallback = null) {
        this.visualizerCallback = visualizerCallback;
        
        // Ensure CSS var is set again
        document.documentElement.style.setProperty('--num-steps', NUM_STEPS);
        this.generateLfoTabs();

        const headerContainer = document.getElementById('stepHeaders');
        headerContainer.className = 'sequencer-grid sticky top-0 bg-neutral-950 z-30 pb-2 border-b border-neutral-800 pt-2';
        headerContainer.innerHTML = '';
        
        const trkHeader = document.createElement('div');
        trkHeader.className = 'header-cell font-bold';
        trkHeader.innerText = 'TRK';
        headerContainer.appendChild(trkHeader);

        for(let i=0; i<NUM_STEPS; i++) {
            const div = document.createElement('div');
            div.className = 'header-cell';
            div.innerText = i+1;
            div.id = `header-step-${i}`; // ADDED ID for dynamic styling updates
            if (i % 4 === 0) div.classList.add('text-neutral-400', 'font-bold');
            
            // Dividers logic: 16-step (Bar) takes precedence over 4-step (Beat)
            if ((i + 1) % 16 === 0 && i !== NUM_STEPS - 1) {
                div.classList.add('bar-divider');
            } else if ((i + 1) % 4 === 0 && i !== NUM_STEPS - 1) {
                div.classList.add('beat-divider');
            }
            
            headerContainer.appendChild(div);
        }

        const rndHeader = document.createElement('div');
        rndHeader.className = 'header-cell';
        rndHeader.innerHTML = '<i class="fas fa-dice"></i>';
        headerContainer.appendChild(rndHeader);

        const actHeader = document.createElement('div');
        actHeader.className = 'header-cell';
        actHeader.innerText = 'ACTIONS';
        headerContainer.appendChild(actHeader);

        // Visualizer Header
        const visHeader = document.createElement('div');
        visHeader.className = 'header-cell';
        visHeader.innerText = 'VIS';
        headerContainer.appendChild(visHeader);

        const container = document.getElementById('matrixContainer');
        container.innerHTML = ''; 
        
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
        
        container.appendChild(buttonRow);

        this.tracks.forEach(t => {
            this.appendTrackRow(t.id, visualizerCallback);
        });

        this.bindAutomationControls();
        // Removed old choke selector init
        
        // --- Initialize Groove Controls ---
        this.initGrooveControls();

        // Initialize Search Modal (pass audio engine from track manager)
        if (this.trackManager && this.trackManager.audioEngine) {
            this.searchModal = new SearchModal(this.trackManager.audioEngine);
        }
        
        // Listen for sample load events to refresh header
        window.addEventListener('trackSampleLoaded', (e) => {
            if (e.detail.trackId === this.selectedTrackIndex) {
                this.selectTrack(this.selectedTrackIndex);
            }
        });

        // NOTE: Old global visualizer click listener removed as element doesn't exist.
        // Per-track visualizer clicks are handled in appendTrackRow.

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
                        this.toggleStep(currentTrackId, stepIndex);
                    }
                }
            }
        });
    }

    generateLfoTabs() {
        const container = document.getElementById('lfoTabsContainer');
        if (!container) return;
        container.innerHTML = '';
        for(let i=0; i<NUM_LFOS; i++) {
            const btn = document.createElement('button');
            btn.className = 'lfo-tab flex-1 text-[10px] font-bold py-1 rounded transition text-neutral-400 hover:bg-neutral-700 min-w-[40px]';
            btn.dataset.lfo = i;
            btn.innerText = `LFO ${i+1}`;
            btn.addEventListener('click', (e) => {
                this.setSelectedLfoIndex(parseInt(e.target.dataset.lfo));
                this.updateLfoUI();
            });
            container.appendChild(btn);
        }
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
        
        // Add Apply Groove listener (existing)
        const applyBtn = document.getElementById('applyGrooveBtn');
        if(applyBtn) {
            applyBtn.onclick = () => this.applyGroove();
        }

        // --- NEW: Add "Apply Groove (Freesound)" Button ---
        const groovePanel = document.querySelector('#applyGrooveBtn')?.parentElement;
        if (groovePanel && !document.getElementById('applyGrooveFsBtn')) {
            const fsBtn = document.createElement('button');
            fsBtn.id = 'applyGrooveFsBtn';
            fsBtn.className = 'w-full text-[10px] bg-indigo-900/40 hover:bg-indigo-800 text-indigo-300 py-1 rounded transition border border-indigo-900/50 font-bold mt-1 flex items-center justify-center gap-2';
            fsBtn.innerHTML = '<i class="fas fa-cloud-download-alt"></i> AUTO-KIT (FREESOUND)';
            fsBtn.onclick = () => this.applyGrooveFreesound();
            groovePanel.appendChild(fsBtn);
        }
    }

    // --- APPLY GROOVE LOGIC ---
    applyGroove() {
        const patId = parseInt(document.getElementById('patternSelect').value);
        const grpId = parseInt(document.getElementById('targetGroupSelect').value);
        const influence = parseInt(document.getElementById('patternInfluence').value) / 100.0;

        if (isNaN(patId)) { alert("Please select a pattern first."); return; }
        if (isNaN(grpId)) { alert("Please select a target group."); return; }

        const pattern = this.patternLibrary.getPatternById(patId);
        if (!pattern) return;

        const startTrack = grpId * TRACKS_PER_GROUP;
        
        // Update Grid Visuals based on Time Signature
        this.updateGridVisuals(pattern.time_sig);

        // V2: Loop through JSON tracks and map to BeatOS tracks
        // Pattern tracks array length might be less than TRACKS_PER_GROUP (8)
        
        for (let i = 0; i < TRACKS_PER_GROUP; i++) {
            const targetTrackId = startTrack + i;
            // Get corresponding track from pattern if available
            const patternTrack = pattern.tracks[i];
            
            // Check if track exists and isn't locked/automation
            if (this.tracks[targetTrackId] && !this.tracks[targetTrackId].stepLock && this.tracks[targetTrackId].type !== 'automation') {
                
                const targetTrackObj = this.tracks[targetTrackId];

                // 1. Clear Track first
                targetTrackObj.steps.fill(0);
                targetTrackObj.microtiming.fill(0);

                if (patternTrack) {
                    // 2. Auto-Configure Sound
                    if (this.trackManager) {
                        this.trackManager.autoConfigureTrack(targetTrackObj, patternTrack.instrument_type || patternTrack.instrument);
                    }

                    // 3. Populate Steps & Microtiming
                    const stepString = patternTrack.steps; // "3002..."
                    const microtimingArray = patternTrack.microtiming; // [0, 3, ...]

                    for (let s = 0; s < NUM_STEPS; s++) {
                        const charIndex = s % stepString.length;
                        const char = stepString[charIndex];
                        const velocity = parseInt(char);
                        
                        const roll = Math.random();
                        
                        if (roll < influence) {
                            // Adhere to pattern
                            if (!isNaN(velocity) && velocity > 0) {
                                targetTrackObj.steps[s] = velocity;
                                
                                // Map microtiming
                                if (microtimingArray && microtimingArray[charIndex] !== undefined) {
                                    targetTrackObj.microtiming[s] = microtimingArray[charIndex];
                                }
                            }
                        } else {
                            // Deviation logic (could be improved)
                            // 5% chance of random ghost note
                            if (Math.random() < 0.05) {
                                targetTrackObj.steps[s] = 1; 
                            }
                        }
                        
                        // Update UI Button Class
                        const btn = this.matrixStepElements[targetTrackId][s];
                        if (btn) {
                            // Remove all possible velocity classes
                            btn.classList.remove('active', 'vel-1', 'vel-2', 'vel-3');
                            const val = targetTrackObj.steps[s];
                            if (val > 0) {
                                btn.classList.add(`vel-${val}`);
                            }
                        }
                    }
                } else {
                    // No pattern track for this slot - clear UI
                    for (let s = 0; s < NUM_STEPS; s++) {
                        const btn = this.matrixStepElements[targetTrackId][s];
                        if(btn) btn.classList.remove('active', 'vel-1', 'vel-2', 'vel-3');
                    }
                }
            }
        }
        
        // Update selection to first track of group to show new sound settings
        this.selectTrack(startTrack, this.visualizerCallback);
    }

    async applyGrooveFreesound() {
        if (!this.searchModal) {
            alert("Search module not ready.");
            return;
        }

        const patId = parseInt(document.getElementById('patternSelect').value);
        const grpId = parseInt(document.getElementById('targetGroupSelect').value);
        
        if (isNaN(patId)) { alert("Please select a pattern first."); return; }
        if (isNaN(grpId)) { alert("Please select a target group."); return; }

        const pattern = this.patternLibrary.getPatternById(patId);
        if (!pattern) return;

        this.applyGroove(); 

        const btn = document.getElementById('applyGrooveFsBtn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> FETCHING SOUNDS...';
        btn.disabled = true;

        const startTrack = grpId * TRACKS_PER_GROUP;

        console.log(`[GrooveFS] Starting Freesound Auto-Kit for Pattern: ${pattern.name}`);

        try {
            for (let i = 0; i < TRACKS_PER_GROUP; i++) {
                const targetTrackId = startTrack + i;
                const patternTrack = pattern.tracks[i];
                
                if (this.tracks[targetTrackId] && !this.tracks[targetTrackId].stepLock && patternTrack) {
                    const trackObj = this.tracks[targetTrackId];
                    let query = patternTrack.instrument_type.replace(/_/g, ' ');
                    
                    console.log(`[GrooveFS] Processing Track ${targetTrackId} (${query})`);

                    // 1. Strict Search
                    let filters = 'duration:[0.05 TO 1.0] license:"Creative Commons 0"';
                    if (patternTrack.role === 'ghost') filters += ' ac_brightness:[0 TO 50]';
                    else filters += ' ac_brightness:[10 TO 100]';

                    let results = await this.searchModal.client.textSearch(query, filters);
                    
                    // 2. Relaxed Filters
                    if (results.results.length === 0) {
                        console.log(`[GrooveFS] Attempt 2: Relaxed Filters for ${query}`);
                        const relaxed = 'duration:[0.05 TO 3.0] license:"Creative Commons 0"';
                        results = await this.searchModal.client.textSearch(query, relaxed);
                    }

                    // 3. Fallback Query
                    if (results.results.length === 0) {
                         const fallbacks = {
                            'tambora': 'tom drum',
                            'guacharaca': 'guiro',
                            'conga': 'percussion',
                            'bongo': 'percussion',
                            'timbales': 'percussion',
                            'cowbell': 'bell',
                            'industrial_perc': 'metallic hit',
                            'glitch': 'noise',
                            'dembow': 'reggaeton',
                            'conga_high': 'conga',
                            'conga_low': 'conga',
                            'bongo_high': 'bongo',
                            'shaker': 'shaker loop'
                        };
                        const fallbackQuery = fallbacks[query] || patternTrack.instrument.replace(/_/g, ' ');
                        
                        if (fallbackQuery !== query) {
                             console.log(`[GrooveFS] Attempt 3: Fallback Query "${fallbackQuery}"`);
                             results = await this.searchModal.client.textSearch(fallbackQuery, 'duration:[0.05 TO 2.0] license:"Creative Commons 0"');
                             if (results.results.length > 0) query = fallbackQuery; 
                        }
                    }

                    if (results.results && results.results.length > 0) {
                        const pickIdx = Math.floor(Math.random() * Math.min(5, results.results.length));
                        const sound = results.results[pickIdx];
                        
                        console.log(`[GrooveFS] Success! Loading: ${sound.name}`);
                        const url = sound.previews['preview-hq-mp3'];
                        await this.searchModal.loader.loadSampleFromUrl(url, trackObj);
                        
                        trackObj.type = 'granular';
                        trackObj.params.position = 0;
                        trackObj.params.grainSize = 0.2; 
                        trackObj.params.density = 20;    
                        trackObj.params.spray = 0;
                        trackObj.params.pitch = 1.0;
                        trackObj.params.overlap = 3.0;   

                        trackObj.customSample.name = sound.name;
                    } else {
                        console.warn(`[GrooveFS] FAILED to find sample for ${query}. Keeping default.`);
                    }
                }
            }
            
            this.selectTrack(this.selectedTrackIndex);
            btn.innerHTML = '<i class="fas fa-check"></i> KIT LOADED!';
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }, 2000);

        } catch (e) {
            console.error(e);
            alert("Error: " + e.message);
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }

    // NEW: Visual Grid Update for Time Sigs
    updateGridVisuals(timeSig) {
        // Reset all dividers first
        for(let i=0; i<NUM_STEPS; i++) {
            const div = document.getElementById(`header-step-${i}`);
            // Also need to update the BUTTONS in the grid rows
            if(div) {
                div.classList.remove('beat-divider', 'bar-divider', 'triplet-divider');
                // Re-apply default logic if needed, or apply new logic
                if (timeSig === '12/8' || timeSig === '6/8') {
                     // Triplet feel: Every 3 steps = 1 beat?
                     // 12/8 = 4 beats of 3 notes. 
                     // Bar lines every 12 steps?
                     // Let's mark every 3rd step
                     if ((i + 1) % 12 === 0 && i !== NUM_STEPS - 1) div.classList.add('bar-divider');
                     else if ((i + 1) % 3 === 0 && i !== NUM_STEPS - 1) div.classList.add('triplet-divider');
                } else {
                    // Standard 4/4
                    if ((i + 1) % 16 === 0 && i !== NUM_STEPS - 1) div.classList.add('bar-divider');
                    else if ((i + 1) % 4 === 0 && i !== NUM_STEPS - 1) div.classList.add('beat-divider');
                }
            }
            
            // Now update the rows buttons
            this.tracks.forEach((t, tIdx) => {
                const btn = this.matrixStepElements[tIdx][i];
                if(btn) {
                    btn.classList.remove('beat-divider', 'bar-divider', 'triplet-divider');
                    if (timeSig === '12/8' || timeSig === '6/8') {
                        if ((i + 1) % 12 === 0 && i !== NUM_STEPS - 1) btn.classList.add('bar-divider');
                        else if ((i + 1) % 3 === 0 && i !== NUM_STEPS - 1) btn.classList.add('triplet-divider');
                    } else {
                        if ((i + 1) % 16 === 0 && i !== NUM_STEPS - 1) btn.classList.add('bar-divider');
                        else if ((i + 1) % 4 === 0 && i !== NUM_STEPS - 1) btn.classList.add('beat-divider');
                    }
                }
            });
        }
    }

    bindAutomationControls() {
        const sel = document.getElementById('autoSpeedSelect');
        if(sel) {
            sel.addEventListener('change', (e) => {
                const t = this.tracks[this.selectedTrackIndex];
                if(t && t.type === 'automation') {
                    t.clockDivider = parseInt(e.target.value);
                }
            });
        }
    }

    // REMOVED addChokeSelectorToHeader and updateChokeButtonsState (replaced by updateCustomTrackHeader)

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

    appendTrackRow(trk, visualizerCallback = null) {
        const container = document.getElementById('matrixContainer');
        const buttonRow = document.getElementById('matrixButtonRow');
        const trackObj = this.tracks[trk];
        const groupIdx = Math.floor(trk / TRACKS_PER_GROUP);
        if (this.randomChokeMode && this.randomChokeGroups.length === trk) {
            this.randomChokeGroups.push(Math.floor(Math.random() * 8));
        }
        
        const effectiveGroup = this.randomChokeMode ? this.randomChokeGroups[trk] : groupIdx;
        const groupColor = `hsl(${effectiveGroup * 45}, 70%, 50%)`;
        const groupColorGlow = `hsla(${effectiveGroup * 45}, 70%, 50%, 0.4)`;

        const rowDiv = document.createElement('div');
        rowDiv.className = 'sequencer-grid'; 
        const rowElements = [];
        
        const label = document.createElement('div');
        label.className = `track-label ${trk===0 ? 'selected' : ''}`;
        const displayNum = trk + 1;
        label.innerText = displayNum < 10 ? `0${displayNum}` : displayNum;
        label.title = `Group ${effectiveGroup}`;
        label.onclick = () => this.selectTrack(trk, visualizerCallback);
        label.style.borderRight = `3px solid ${groupColor}`;
        rowDiv.appendChild(label);
        this.trackLabelElements[trk] = label;
        this.matrixStepElements[trk] = [];
        rowElements.push(label);

        for(let step=0; step<NUM_STEPS; step++) {
            const btn = document.createElement('div');
            btn.className = 'step-btn';
            btn.dataset.step = step;
            btn.dataset.track = trk;
            btn.onclick = () => this.toggleStep(trk, step);
            btn.style.setProperty('--step-group-color', groupColor);
            btn.style.setProperty('--step-group-color-glow', groupColorGlow);
            
            // Dividers Logic: Bar (16) vs Beat (4)
            if ((step + 1) % 16 === 0 && step !== NUM_STEPS - 1) {
                btn.classList.add('bar-divider');
            } else if ((step + 1) % 4 === 0 && step !== NUM_STEPS - 1) {
                btn.classList.add('beat-divider');
            }
            
            if (trackObj.type === 'automation') {
                const val = trackObj.steps[step];
                if (val > 0) {
                    btn.classList.add('active');
                    btn.classList.add(`auto-level-${val}`);
                }
            } else {
                // V2: Handle velocity steps (0-3)
                const val = trackObj.steps[step];
                if (val > 0) {
                    btn.classList.add(`vel-${val}`);
                }
            }

            rowDiv.appendChild(btn);
            this.matrixStepElements[trk][step] = btn;
            rowElements.push(btn);
        }

        const rndBtn = document.createElement('div');
        rndBtn.className = 'track-rnd-btn';
        rndBtn.innerHTML = '<i class="fas fa-random"></i>';
        rndBtn.onclick = () => this.randomizeTrackPattern(trk);
        rowDiv.appendChild(rndBtn);
        rowElements.push(rndBtn);

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'track-actions';
        const createAction = (txt, fn, title, cls='') => {
            const b = document.createElement('button');
            b.className = 'action-btn ' + cls;
            b.innerHTML = txt; b.title = title;
            b.onclick = (e) => { e.stopPropagation(); fn(trk); };
            return b;
        };
        const btnM = createAction('M', (t) => this.toggleMute(t), 'Mute Track'); btnM.id = `btnM_${trk}`;
        const btnS = createAction('S', (t) => this.toggleSolo(t), 'Solo Track'); btnS.id = `btnS_${trk}`;
        const btnL = createAction('L', (t) => this.toggleStepLock(t), 'Lock Steps'); btnL.id = `btnL_${trk}`;
        actionsDiv.appendChild(btnL); actionsDiv.appendChild(btnM);
        actionsDiv.appendChild(createAction('Mg', () => this.toggleMuteGroup(groupIdx), 'Mute Group'));
        actionsDiv.appendChild(btnS);
        actionsDiv.appendChild(createAction('Sg', () => this.toggleSoloGroup(groupIdx), 'Solo Group'));
        actionsDiv.appendChild(createAction('C', () => this.clearTrack(trk), 'Clear Track', 'erase'));
        actionsDiv.appendChild(createAction('Cg', () => this.clearGroup(groupIdx), 'Clear Group', 'erase'));
        
        const btnX = createAction('X', (t) => this.toggleIgnoreRandom(t), 'Exclude from Auto Randomization (Rand Prms)');
        btnX.id = `btnX_${trk}`;
        if(trackObj.ignoreRandom) btnX.classList.add('exclude-active');
        actionsDiv.appendChild(btnX);

        rowDiv.appendChild(actionsDiv);
        rowElements.push(actionsDiv);

        // Per-Track Visualizer Canvas
        const visCanvas = document.createElement('canvas');
        visCanvas.className = 'track-vis-canvas';
        visCanvas.id = `vis-canvas-${trk}`;
        // Needs a fixed size for canvas buffer, CSS scales it visually
        visCanvas.width = 40; 
        visCanvas.height = 16;
        
        // ADDED CLICK LISTENER FOR SELECTION
        visCanvas.style.cursor = 'pointer';
        visCanvas.onclick = () => this.selectTrack(trk, visualizerCallback);

        rowDiv.appendChild(visCanvas);
        rowElements.push(visCanvas);
        
        if (buttonRow) container.insertBefore(rowDiv, buttonRow); else container.appendChild(rowDiv);
        this.trackRowElements[trk] = rowElements;
    }

    selectTrack(idx, visualizerCallback = null) {
        if(this.trackLabelElements[this.selectedTrackIndex])
            this.trackLabelElements[this.selectedTrackIndex].classList.remove('selected');
        this.selectedTrackIndex = idx;
        if(this.trackLabelElements[this.selectedTrackIndex])
            this.trackLabelElements[this.selectedTrackIndex].classList.add('selected');
        
        const displayNum = idx + 1;
        const numEl = document.getElementById('currentTrackNum');
        if(numEl) numEl.innerText = displayNum < 10 ? '0'+displayNum : displayNum;
        
        const normalGrp = Math.floor(idx / TRACKS_PER_GROUP);
        const grp = this.randomChokeMode ? this.randomChokeGroups[idx] : normalGrp;
        const groupColor = `hsl(${grp * 45}, 70%, 50%)`;
        const groupColorGlow = `hsla(${grp * 45}, 70%, 50%, 0.4)`;
        
        const grpLbl = document.getElementById('trackGroupLabel');
        if(grpLbl) {
            grpLbl.innerText = `GRP ${grp}`;
            grpLbl.style.color = groupColor;
        }
        
        // --- NEW: Update Custom Track Header Content ---
        this.updateCustomTrackHeader(idx, grp, groupColor);

        // Update indicator (existing)
        const indicator = document.getElementById('trackIndicator');
        if(indicator) {
            indicator.style.backgroundColor = groupColor;
            indicator.style.boxShadow = `0 0 8px ${groupColorGlow}`;
        }
        
        const rightPanel = document.querySelector('.right-pane');
        if (rightPanel) {
            rightPanel.style.setProperty('--group-color', groupColor);
            rightPanel.style.setProperty('--group-color-glow', groupColorGlow);
        }
        
        this.updateKnobs();
        this.updateLfoUI();
        this.updateTrackControlsVisibility(); 
        if (visualizerCallback) visualizerCallback();
    }

    updateCustomTrackHeader(idx, groupIdx, groupColor) {
        let container = document.querySelector('.right-pane .p-3.bg-neutral-800');
        if (!container) return;

        container.innerHTML = '';
        container.className = 'p-3 bg-neutral-800 border-b border-neutral-700 flex flex-col gap-2';

        const t = this.tracks[idx];
        const displayNum = idx + 1 < 10 ? `0${idx + 1}` : idx + 1;
        let trackName = `Track ${displayNum}`;
        let trackType = 'Synth';
        
        // ... (existing logic for trackName/trackType determination) ...
        if (t.customSample) {
            trackName = t.customSample.name;
            trackType = 'Sample';
        } else if (t.type === 'simple-drum') {
            trackName = (t.params.drumType || 'Kick').toUpperCase();
            trackType = '909';
        } else if (t.type === 'automation') {
            trackName = 'Automation';
            trackType = 'Auto';
        } else {
            trackName = 'Granular';
            trackType = 'Synth';
        }

        // --- ROW 1: Info (Existing) ---
        const row1 = document.createElement('div');
        row1.className = 'flex items-center gap-2 w-full';
        
        const indicator = document.createElement('span');
        indicator.id = 'trackIndicator';
        indicator.className = 'w-3 h-3 rounded-full transition-colors duration-200 shrink-0';
        indicator.style.backgroundColor = groupColor;
        row1.appendChild(indicator);

        const numSpan = document.createElement('span');
        numSpan.id = 'currentTrackNum';
        numSpan.innerText = displayNum;
        numSpan.className = 'text-sm font-bold text-white font-mono';
        row1.appendChild(numSpan);

        const nameSpan = document.createElement('span');
        nameSpan.innerText = trackName;
        nameSpan.className = 'text-xs text-neutral-300 truncate flex-1';
        nameSpan.title = trackName;
        row1.appendChild(nameSpan);

        const typeLabel = document.createElement('span');
        typeLabel.id = 'trackTypeLabel';
        typeLabel.innerText = `[${trackType}]`;
        typeLabel.className = 'text-[10px] text-neutral-500 font-mono uppercase';
        row1.appendChild(typeLabel);

        // --- ADD SEARCH BUTTON TO ROW 1 ---
        const searchBtn = document.createElement('button');
        searchBtn.className = 'text-[10px] bg-emerald-900/30 hover:bg-emerald-800 text-emerald-400 px-2 py-0.5 rounded transition border border-emerald-900/50 ml-2';
        searchBtn.innerHTML = '<i class="fas fa-search mr-1"></i>Find';
        searchBtn.title = "Search Freesound";
        searchBtn.onclick = () => {
            if (this.searchModal) {
                // Determine a good search query
                let query = "";
                if (t.type === 'simple-drum') query = t.params.drumType || "drum";
                else if (t.customSample) query = t.customSample.name.replace('.wav', '').replace('.mp3', '');
                else if (t.autoName) query = t.autoName;
                else query = "drum hit";
                
                this.searchModal.open(t, query);
            } else {
                alert("Search module not initialized");
            }
        };
        row1.appendChild(searchBtn);

        container.appendChild(row1);

        // ROW 2: Type Buttons
        const row2 = document.createElement('div');
        row2.className = 'flex gap-1 w-full justify-between';
        
        const rstBtn = document.createElement('button');
        rstBtn.id = 'resetParamBtn';
        rstBtn.className = 'text-[9px] bg-neutral-700 hover:bg-neutral-600 text-neutral-300 px-1.5 py-1 rounded transition border border-neutral-600 min-w-[24px]';
        rstBtn.innerHTML = '<i class="fas fa-undo"></i>';
        rstBtn.title = 'Reset Parameters';
        rstBtn.onclick = () => {
             const t = this.tracks[this.selectedTrackIndex];
             if (t.type === 'granular') {
                 t.params.position = 0.00; t.params.spray = 0.00; t.params.grainSize = 0.11;
                 t.params.density = 3.00; t.params.pitch = 1.00; t.params.relGrain = 0.50;
             } else { t.params.drumTune = 0.5; t.params.drumDecay = 0.5; }
             t.params.hpFilter = 20.00; t.params.filter = 20000.00; t.params.volume = 0.80;
             t.lfos.forEach(lfo => { lfo.target = 'none'; });
             this.updateKnobs();
             this.updateLfoUI();
        };
        row2.appendChild(rstBtn);

        const createTypeBtn = (label, type, colorClass = 'bg-neutral-700', is909 = false, isAuto = false) => {
            const btn = document.createElement('button');
            btn.innerText = label;
            btn.className = `text-[9px] font-bold ${colorClass} hover:bg-neutral-600 text-neutral-300 px-1.5 py-1 rounded transition border border-neutral-600 flex-1 text-center`;
            btn.onclick = () => {
                if (!this.trackManager || !this.trackManager.audioEngine) return;
                const ae = this.trackManager.audioEngine;
                const t = this.tracks[this.selectedTrackIndex];
                
                if (isAuto) {
                    t.type = 'automation';
                    t.steps.fill(0);
                    const stepElements = this.matrixStepElements[t.id];
                    if(stepElements) {
                         stepElements.forEach(el => { 
                             el.className = 'step-btn'; 
                             el.classList.remove('active', 'vel-1', 'vel-2', 'vel-3'); 
                         });
                    }
                    this.updateTrackControlsVisibility();
                } else if (is909) {
                    t.type = 'simple-drum';
                    t.params.drumType = 'kick'; t.params.drumTune = 0.5; t.params.drumDecay = 0.5;
                    this.updateTrackControlsVisibility();
                    this.updateKnobs();
                } else if (label === 'SMP') {
                    const sampleInput = document.getElementById('sampleInput');
                    if(sampleInput) sampleInput.click();
                } else {
                    t.type = 'granular';
                    this.updateTrackControlsVisibility();
                    const newBuf = ae.generateBufferByType(type);
                    if (newBuf) {
                        t.buffer = newBuf;
                        t.customSample = null;
                        t.rmsMap = ae.analyzeBuffer(newBuf);
                    }
                }
                this.selectTrack(this.selectedTrackIndex); 
            };
            return btn;
        };

        row2.appendChild(createTypeBtn('KICK', 'kick'));
        row2.appendChild(createTypeBtn('SNR', 'snare'));
        row2.appendChild(createTypeBtn('HAT', 'hihat'));
        row2.appendChild(createTypeBtn('FM', 'texture'));
        row2.appendChild(createTypeBtn('SMP', null, 'bg-sky-900/30 text-sky-400 border-sky-900/50'));
        row2.appendChild(createTypeBtn('909', null, 'bg-orange-900/30 text-orange-400 border-orange-900/50', true));
        row2.appendChild(createTypeBtn('AUTO', null, 'bg-indigo-900/30 text-indigo-400 border-indigo-900/50', false, true));

        container.appendChild(row2);

        // ROW 3: Group Selectors (Choke Groups)
        const row3 = document.createElement('div');
        row3.className = 'flex gap-0.5 w-full';
        
        const grpLabel = document.createElement('span');
        grpLabel.innerText = 'CHK';
        grpLabel.className = 'text-[9px] font-bold text-neutral-500 mr-1 flex items-center';
        row3.appendChild(grpLabel);

        for(let i=0; i<8; i++) {
            const btn = document.createElement('button');
            const targetGroup = i + 1;
            const isAssigned = t.chokeGroup === targetGroup;
            
            const bgClass = isAssigned ? '' : 'bg-neutral-800 text-neutral-500';
            const style = isAssigned ? `background-color: #ef4444; color: #fff; border-color: #b91c1c;` : '';
            
            btn.className = `flex-1 h-4 text-[8px] border border-neutral-700 rounded flex items-center justify-center hover:bg-neutral-700 transition ${bgClass}`;
            btn.style.cssText = style;
            btn.innerText = targetGroup;
            
            btn.onclick = () => {
                if (t.chokeGroup === targetGroup) {
                    t.chokeGroup = 0; 
                } else {
                    t.chokeGroup = targetGroup; 
                }
                this.selectTrack(this.selectedTrackIndex); 
            };
            
            row3.appendChild(btn);
        }
        
        container.appendChild(row3);
    }

    updateTrackControlsVisibility() {
        const t = this.tracks[this.selectedTrackIndex];
        if (!t) return;

        const autoControls = document.getElementById('automationControls');
        const granularControls = document.getElementById('granularControls');
        const drumControls = document.getElementById('simpleDrumControls');
        const lfoSection = document.getElementById('lfoSection');
        const typeLabel = document.getElementById('trackTypeLabel');
        const speedSel = document.getElementById('autoSpeedSelect');
        const chokeSel = document.getElementById('chokeGroupSelect'); 

        if(granularControls) granularControls.classList.add('hidden');
        if(drumControls) drumControls.classList.add('hidden');
        if(lfoSection) lfoSection.classList.add('hidden');
        if(autoControls) autoControls.classList.add('hidden');

        // Update Choke Buttons in Header
        // this.updateChokeButtonsState(); // Removed as we now redraw the header dynamically

        if (t.type === 'automation') {
            if(autoControls) autoControls.classList.remove('hidden');
            if(typeLabel) {
                // Handled in updateCustomTrackHeader
            }
            if(speedSel) speedSel.value = t.clockDivider || 1;
        } 
        else if (t.type === 'simple-drum') {
            if(drumControls) drumControls.classList.remove('hidden');
            if(typeLabel) {
               // Handled in updateCustomTrackHeader
            }
            document.querySelectorAll('.drum-sel-btn').forEach(btn => {
                if (btn.dataset.drum === t.params.drumType) {
                    btn.classList.replace('text-neutral-400', 'text-white');
                    btn.classList.replace('bg-neutral-800', 'bg-orange-700');
                } else {
                    btn.classList.replace('text-white', 'text-neutral-400');
                    btn.classList.replace('bg-orange-700', 'bg-neutral-800');
                }
            });
        }
        else {
            const wasHidden = granularControls && granularControls.classList.contains('hidden');
            
            if(granularControls) granularControls.classList.remove('hidden');
            if(lfoSection) lfoSection.classList.remove('hidden');
            
            if(wasHidden) {
                setTimeout(() => window.dispatchEvent(new Event('resize')), 0);
            }
            
            if(typeLabel) {
                // Handled in updateCustomTrackHeader
            }
        }
    }

    updateMatrixHead(currentStep, totalStepsPlayed) {
        // Use totalStepsPlayed if available, otherwise fallback to currentStep
        const masterStep = (typeof totalStepsPlayed !== 'undefined') ? totalStepsPlayed : currentStep;

        for(let t=0; t<this.tracks.length; t++) {
            const track = this.tracks[t];
            const div = track.clockDivider || 1;
            
            // ROBUST CLEARING:
            const currentLit = this.matrixStepElements[t].filter(el => el.classList.contains('step-playing'));
            currentLit.forEach(el => el.classList.remove('step-playing'));
            
            // Calculate effective step using track's own length (fallback to NUM_STEPS if array not ready)
            const trackLength = track.steps.length > 0 ? track.steps.length : NUM_STEPS;
            const currentEffective = Math.floor(masterStep / div) % trackLength;
            
            // Light up the new one
            if(this.matrixStepElements[t] && this.matrixStepElements[t][currentEffective]) {
                this.matrixStepElements[t][currentEffective].classList.add('step-playing');
            }
        }
    }

    getSelectedTrackIndex() { return this.selectedTrackIndex; }
    getSelectedLfoIndex() { return this.selectedLfoIndex; }
    setSelectedLfoIndex(index) { this.selectedLfoIndex = index; }
    getRandomChokeInfo() { return { mode: this.randomChokeMode, groups: this.randomChokeGroups }; }
    
    toggleStepLock(trk) { this.tracks[trk].stepLock = !this.tracks[trk].stepLock; const btnL = document.getElementById(`btnL_${trk}`); if (this.tracks[trk].stepLock) btnL.classList.add('lock-active'); else btnL.classList.remove('lock-active'); }
    toggleRandomChoke() {
        this.randomChokeMode = !this.randomChokeMode;
        const btn = document.getElementById('rndChokeBtn');
        if (this.randomChokeMode) {
            this.randomChokeGroups = this.tracks.map(() => Math.floor(Math.random() * 8));
            btn.classList.add('rnd-choke-active');
            this.updateAllTrackColors();
            this.applyRandomChokeDimming();
        } else {
            this.randomChokeGroups = [];
            btn.classList.remove('rnd-choke-active');
            this.updateAllTrackColors();
            this.clearRandomChokeDimming();
        }
    }
    updateAllTrackColors() { for (let trk = 0; trk < this.tracks.length; trk++) { const normalGroup = Math.floor(trk / TRACKS_PER_GROUP); const effectiveGroup = this.randomChokeMode ? this.randomChokeGroups[trk] : normalGroup; const groupColor = `hsl(${effectiveGroup * 45}, 70%, 50%)`; const groupColorGlow = `hsla(${effectiveGroup * 45}, 70%, 50%, 0.4)`; if (this.trackLabelElements[trk]) { this.trackLabelElements[trk].style.borderRight = `3px solid ${groupColor}`; this.trackLabelElements[trk].title = `Group ${effectiveGroup}`; } for (let step = 0; step < NUM_STEPS; step++) { if (this.matrixStepElements[trk] && this.matrixStepElements[trk][step]) { const stepEl = this.matrixStepElements[trk][step]; stepEl.style.setProperty('--step-group-color', groupColor); stepEl.style.setProperty('--step-group-color-glow', groupColorGlow); } } } if (this.tracks[this.selectedTrackIndex]) { this.selectTrack(this.selectedTrackIndex, this.visualizerCallback); } }
    applyRandomChokeDimming() { for (let step = 0; step < NUM_STEPS; step++) { const chokeGroupMap = new Map(); for (let t = 0; t < this.tracks.length; t++) { if (this.tracks[t].steps[step]) { const randomGroup = this.randomChokeGroups[t]; if (!chokeGroupMap.has(randomGroup)) chokeGroupMap.set(randomGroup, []); chokeGroupMap.get(randomGroup).push(t); } } chokeGroupMap.forEach((trackIds) => { if (trackIds.length > 1) { const winnerIdx = Math.floor(Math.random() * trackIds.length); trackIds.forEach((trackId, idx) => { const stepEl = this.matrixStepElements[trackId][step]; if (idx === winnerIdx) stepEl.classList.remove('step-dimmed'); else stepEl.classList.add('step-dimmed'); }); } }); } }
    clearRandomChokeDimming() { for (let t = 0; t < this.tracks.length; t++) { for (let step = 0; step < NUM_STEPS; step++) { this.matrixStepElements[t][step].classList.remove('step-dimmed'); } } }
    savePanBaseline() { this.basePanValues = this.tracks.map(t => t.params.pan); }
    applyPanShift(shiftAmount) { this.globalPanShift = shiftAmount; if (this.basePanValues.length === 0) this.savePanBaseline(); const numGroups = 8; for (let i = 0; i < this.tracks.length; i++) { const groupIdx = Math.floor(i / TRACKS_PER_GROUP); const basePan = this.basePanValues[i] || 0; const shiftInGroups = shiftAmount * numGroups; const newGroupPosition = (groupIdx + shiftInGroups) % numGroups; const newGroupCenter = -1 + (newGroupPosition / (numGroups - 1)) * 2; const originalGroupCenter = -1 + (groupIdx / (numGroups - 1)) * 2; const offsetFromCenter = basePan - originalGroupCenter; let newPan = newGroupCenter + offsetFromCenter; newPan = Math.max(-1, Math.min(1, newPan)); this.tracks[i].params.pan = parseFloat(newPan.toFixed(3)); 
    if(this.tracks[i].bus && this.tracks[i].bus.pan) { this.tracks[i].bus.pan.pan.value = newPan; } } }
    toggleMute(trk) { this.tracks[trk].muted = !this.tracks[trk].muted; this.updateTrackStateUI(trk); }
    toggleMuteGroup(grpIdx) { const start = grpIdx * TRACKS_PER_GROUP; const end = start + TRACKS_PER_GROUP; const newState = !this.tracks[start]?.muted; for(let i=start; i<end; i++) { if(this.tracks[i]) { this.tracks[i].muted = newState; this.updateTrackStateUI(i); } } }
    toggleSolo(trk) { this.tracks[trk].soloed = !this.tracks[trk].soloed; this.updateTrackStateUI(trk); }
    toggleSoloGroup(grpIdx) { const start = grpIdx * TRACKS_PER_GROUP; const end = start + TRACKS_PER_GROUP; const newState = !this.tracks[start]?.soloed; for(let i=start; i<end; i++) { if(this.tracks[i]) { this.tracks[i].soloed = newState; this.updateTrackStateUI(i); } } }
    
    toggleIgnoreRandom(trk) {
        this.tracks[trk].ignoreRandom = !this.tracks[trk].ignoreRandom;
        const btn = document.getElementById(`btnX_${trk}`);
        if(this.tracks[trk].ignoreRandom) btn.classList.add('exclude-active');
        else btn.classList.remove('exclude-active');
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
        if(btnX) { if(t.ignoreRandom) btnX.classList.add('exclude-active'); else btnX.classList.remove('exclude-active'); }
        
        if(this.trackRowElements[trk]) this.trackRowElements[trk].forEach(el => el.style.opacity = t.muted ? '0.4' : '1.0'); 
    }
    
    clearTrack(trk) { 
        if(this.tracks[trk].type === 'automation') {
             this.tracks[trk].steps.fill(0);
        } else {
             this.tracks[trk].steps.fill(0); 
        }
        for(let s=0; s<NUM_STEPS; s++) if(this.matrixStepElements[trk] && this.matrixStepElements[trk][s]) {
             this.matrixStepElements[trk][s].className = 'step-btn';
        }
    }
    clearGroup(grp) { const start = grp * TRACKS_PER_GROUP; const end = start + TRACKS_PER_GROUP; for(let i=start; i<end; i++) if(this.tracks[i]) this.clearTrack(i); }
    
    toggleStep(trk, step) { 
        const track = this.tracks[trk];
        const btn = this.matrixStepElements[trk][step];

        if (track.type === 'automation') {
             let val = track.steps[step];
             val = (val + 1) % 6;
             track.steps[step] = val;
             btn.className = btn.className.replace(/auto-level-\d/g, '').trim();
             btn.classList.remove('active');
             if (val > 0) {
                 btn.classList.add('active');
                 btn.classList.add(`auto-level-${val}`);
             }
             return; 
        }

        // V2 Cycle: 0 -> 2 (Normal) -> 3 (Accent) -> 1 (Ghost) -> 0
        let val = track.steps[step];
        let nextVal = 0;
        
        if (val === 0) nextVal = 2; // Off -> Normal
        else if (val === 2) nextVal = 3; // Normal -> Accent
        else if (val === 3) nextVal = 1; // Accent -> Ghost
        else if (val === 1) nextVal = 0; // Ghost -> Off
        
        track.steps[step] = nextVal;
        
        // Update UI
        btn.classList.remove('vel-1', 'vel-2', 'vel-3');
        if (nextVal > 0) {
            btn.classList.add(`vel-${nextVal}`);
        }
        
        if (this.randomChokeMode) this.applyRandomChokeDimming(); 
    }

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

        // V2 Randomize: Mix of Normal (2) and Ghost (1)
        for(let i=0; i<NUM_STEPS; i++) { 
            // Simple Euclidian-ish random
            const active = Math.random() < 0.25; 
            if (active) { 
                if (t.stepLock) continue;
                
                // Random velocity
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

    randomizeAllPatterns() { for (let step = 0; step < NUM_STEPS; step++) { const numGroups = Math.ceil(this.tracks.length / TRACKS_PER_GROUP); for (let g = 0; g < numGroups; g++) { const groupStart = g * TRACKS_PER_GROUP; const plays = Math.random() < 0.4; const activeTrackOffset = Math.floor(Math.random() * TRACKS_PER_GROUP); const activeTrackId = groupStart + activeTrackOffset; for (let i = 0; i < TRACKS_PER_GROUP; i++) { const trkId = groupStart + i; if (!this.tracks[trkId]) continue; const shouldBeActive = plays && (trkId === activeTrackId); this.tracks[trkId].steps[step] = shouldBeActive; const btn = this.matrixStepElements[trkId][step]; if(shouldBeActive) btn.classList.add('active'); else btn.classList.remove('active'); } } } if (this.randomChokeMode) this.applyRandomChokeDimming(); }

    updateKnobs() {
        const t = this.tracks[this.selectedTrackIndex];
        if(!t) return;
        document.querySelectorAll('.param-slider').forEach(el => {
            const param = el.dataset.param;
            if(t.params[param] !== undefined) {
                el.value = t.params[param];
                let suffix = '';
                if(param === 'density') suffix = 'hz';
                if(param === 'grainSize') suffix = 's';
                if(param === 'pitch') suffix = 'x';
                if(param === 'overlap') suffix = 'x';
                if(param === 'scanSpeed') suffix = '';
                if(el.nextElementSibling) {
                    el.nextElementSibling.innerText = t.params[param].toFixed(2) + suffix;
                }
            }
        });
    }

    updateLfoUI() {
        if(!this.tracks[this.selectedTrackIndex]) return;
        const lfo = this.tracks[this.selectedTrackIndex].lfos[this.selectedLfoIndex];
        const normalGrp = Math.floor(this.selectedTrackIndex / TRACKS_PER_GROUP);
        const grp = this.randomChokeMode ? this.randomChokeGroups[this.selectedTrackIndex] : normalGrp;
        const groupColorDark = `hsl(${grp * 45}, 70%, 35%)`;
        
        document.querySelectorAll('.lfo-tab').forEach(b => {
            const i = parseInt(b.dataset.lfo);
            if(i === this.selectedLfoIndex) {
                b.classList.remove('text-neutral-400', 'hover:bg-neutral-700');
                b.classList.add('text-white');
                b.style.backgroundColor = groupColorDark;
            } else {
                b.classList.add('text-neutral-400', 'hover:bg-neutral-700');
                b.classList.remove('text-white');
                b.style.backgroundColor = '';
            }
        });
        
        const rateVal = document.getElementById('lfoRateVal');
        const amtVal = document.getElementById('lfoAmtVal');
        
        document.getElementById('lfoTarget').value = lfo.target;
        document.getElementById('lfoWave').value = lfo.wave;
        document.getElementById('lfoRate').value = lfo.rate;
        if(rateVal) rateVal.innerText = lfo.rate.toFixed(1);
        document.getElementById('lfoAmt').value = lfo.amount;
        if(amtVal) amtVal.innerText = lfo.amount.toFixed(2);
    }

    toggleSnapshot() {
        const btn = document.getElementById('snapshotBtn');
        if(!this.snapshotData) {
            this.snapshotData = JSON.stringify({
                tracks: this.tracks.map(t => ({
                    params: {...t.params},
                    // Steps now Uint8Array, convert to normal array for JSON
                    steps: Array.from(t.steps),
                    muted: t.muted,
                    soloed: t.soloed,
                    stepLock: t.stepLock,
                    ignoreRandom: t.ignoreRandom,
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
                    // Restore array to Uint8Array
                    t.steps = new Uint8Array(trackData.steps);
                    t.muted = trackData.muted;
                    t.soloed = trackData.soloed;
                    t.stepLock = trackData.stepLock || false;
                    t.ignoreRandom = trackData.ignoreRandom || false; 
                    trackData.lfos.forEach((lData, lIdx) => {
                        if(lIdx < NUM_LFOS) {
                            t.lfos[lIdx].wave = lData.wave;
                            t.lfos[lIdx].rate = lData.rate;
                            t.lfos[lIdx].amount = lData.amount;
                            t.lfos[lIdx].target = lData.target;
                        }
                    });
                    this.updateTrackStateUI(i);
                    for(let s=0; s<NUM_STEPS; s++) {
                         const btn = this.matrixStepElements[i][s];
                         // Reset classes
                         btn.className = 'step-btn';
                         btn.classList.remove('active', 'vel-1', 'vel-2', 'vel-3', 'auto-level-1', 'auto-level-2', 'auto-level-3', 'auto-level-4', 'auto-level-5');
                         
                         if(t.type === 'automation') {
                             if(t.steps[s] > 0) btn.classList.add('active', `auto-level-${t.steps[s]}`);
                         } else {
                             if(t.steps[s] > 0) btn.classList.add(`vel-${t.steps[s]}`);
                         }
                    }
                    
                    if(t.bus.hp) t.bus.hp.frequency.value = t.params.hpFilter;
                    if(t.bus.lp) t.bus.lp.frequency.value = t.params.filter;
                    if(t.bus.vol) t.bus.vol.gain.value = t.params.volume;
                    if(t.bus.pan) t.bus.pan.pan.value = t.params.pan;
                });
                this.snapshotData = null;
                btn.classList.remove('snap-active');
                btn.innerText = 'Snap';
                this.selectTrack(this.selectedTrackIndex, this.visualizerCallback);
            } catch(e) {
                console.error("Snapshot restore failed", e);
                this.snapshotData = null;
                btn.classList.remove('snap-active');
                btn.innerText = 'Snap';
            }
        }
    }

    clearPlayheadForStop() {
        for(let t=0; t<this.tracks.length; t++) {
            for(let s=0; s<NUM_STEPS; s++) {
                if(this.matrixStepElements[t] && this.matrixStepElements[t][s])
                    this.matrixStepElements[t][s].classList.remove('step-playing');
            }
        }
    }
}