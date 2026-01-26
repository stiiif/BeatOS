// js/ui/components/GrooveControls.js
import { NUM_STEPS, TRACKS_PER_GROUP, MAX_TRACKS } from '../../utils/constants.js';
import { PatternLibrary } from '../../modules/PatternLibrary.js';

export class GrooveControls {
    constructor() {
        this.tracks = [];
        this.trackManager = null;
        this.patternLibrary = new PatternLibrary();
        this.matrixStepElements = [];
        this.searchModal = null;
        this.visualizerCallback = null;
    }

    setTracks(tracks) {
        this.tracks = tracks;
    }

    setTrackManager(tm) {
        this.trackManager = tm;
    }

    setGridElements(matrixStepElements) {
        this.matrixStepElements = matrixStepElements;
    }

    setSearchModal(modal) {
        this.searchModal = modal;
    }

    setVisualizerCallback(cb) {
        this.visualizerCallback = cb;
    }

    // ============================================================================
    // INITIALIZE GROOVE CONTROLS
    // ============================================================================

    initGrooveControls(onApplyGrooveFreesound) {
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

        // CREATE THE AUTO-KIT (FREESOUND) BUTTON WITH EXACT STYLING
        const groovePanel = document.querySelector('#applyGrooveBtn')?.parentElement;
        if (groovePanel && !document.getElementById('applyGrooveFsBtn')) {
            const fsBtn = document.createElement('button');
            fsBtn.id = 'applyGrooveFsBtn';
            // EXACT STYLING FROM ORIGINAL - DO NOT CHANGE!
            fsBtn.className = 'w-full text-[10px] bg-indigo-900/40 hover:bg-indigo-800 text-indigo-300 py-1 rounded transition border border-indigo-900/50 font-bold mt-1 flex items-center justify-center gap-2';
            fsBtn.innerHTML = '<i class="fas fa-cloud-download-alt"></i> AUTO-KIT (FREESOUND)';
            fsBtn.onclick = async () => {
                try {
                    // Call the callback from UIManager which has all the proper callbacks
                    if (onApplyGrooveFreesound) {
                        await onApplyGrooveFreesound();
                    }
                } catch (error) {
                    console.error('AUTO-KIT error:', error);
                    fsBtn.innerHTML = '<i class="fas fa-cloud-download-alt"></i> AUTO-KIT (FREESOUND)';
                    fsBtn.disabled = false;
                    alert('Error loading AUTO-KIT: ' + error.message);
                }
            };
            groovePanel.appendChild(fsBtn);
        }
    }

    // ============================================================================
    // APPLY GROOVE
    // ============================================================================

    applyGroove(onUpdateGridVisuals, onSelectTrack) {
        const patId = parseInt(document.getElementById('patternSelect').value);
        const grpId = parseInt(document.getElementById('targetGroupSelect').value);
        const influence = parseInt(document.getElementById('patternInfluence').value) / 100.0;

        if (isNaN(patId)) { alert("Please select a pattern first."); return; }
        if (isNaN(grpId)) { alert("Please select a target group."); return; }

        const pattern = this.patternLibrary.getPatternById(patId);
        if (!pattern) return;

        const startTrack = grpId * TRACKS_PER_GROUP;
        
        // Update grid visuals for time signature
        if (onUpdateGridVisuals) {
            onUpdateGridVisuals(pattern.time_sig);
        }

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
                        const velocity = parseInt(stepString[charIndex]);
                        
                        const roll = Math.random();
                        
                        if (roll < influence) {
                            if (!isNaN(velocity) && velocity > 0) {
                                targetTrackObj.steps[s] = velocity;
                                if (microtimingArray && microtimingArray[charIndex] !== undefined) {
                                    targetTrackObj.microtiming[s] = microtimingArray[charIndex];
                                }
                            }
                        } else {
                            if (Math.random() < 0.05) {
                                targetTrackObj.steps[s] = 1; 
                            }
                        }
                        
                        const btn = this.matrixStepElements[targetTrackId][s];
                        if (btn) {
                            btn.classList.remove('active', 'vel-1', 'vel-2', 'vel-3');
                            const val = targetTrackObj.steps[s];
                            if (val > 0) {
                                btn.classList.add(`vel-${val}`);
                            }
                        }
                    }
                } else {
                    for (let s = 0; s < NUM_STEPS; s++) {
                        const btn = this.matrixStepElements[targetTrackId][s];
                        if(btn) btn.classList.remove('active', 'vel-1', 'vel-2', 'vel-3');
                    }
                }
            }
        }
        
        if (onSelectTrack) {
            onSelectTrack(startTrack, this.visualizerCallback);
        }
    }

    // ============================================================================
    // APPLY GROOVE WITH FREESOUND AUTO-KIT
    // ============================================================================

    async applyGrooveFreesound(onUpdateGridVisuals, onSelectTrack, selectedTrackIndex) {
        console.log('[GrooveFS] applyGrooveFreesound called');
        
        if (!this.searchModal) {
            console.error('[GrooveFS] searchModal is null!');
            alert("Search module not ready.");
            return;
        }
        
        console.log('[GrooveFS] searchModal exists:', this.searchModal);

        const patId = parseInt(document.getElementById('patternSelect').value);
        const grpId = parseInt(document.getElementById('targetGroupSelect').value);
        
        if (isNaN(patId)) { alert("Please select a pattern first."); return; }
        if (isNaN(grpId)) { alert("Please select a target group."); return; }

        const pattern = this.patternLibrary.getPatternById(patId);
        if (!pattern) return;

        // First apply the groove pattern
        this.applyGroove(onUpdateGridVisuals, null); 

        const btn = document.getElementById('applyGrooveFsBtn');
        if (!btn) {
            console.error('[GrooveFS] Button not found!');
            return;
        }
        
        const originalText = btn.innerHTML;
        console.log('[GrooveFS] Setting button to FETCHING SOUNDS...');
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> FETCHING SOUNDS...';
        btn.disabled = true;
        
        // Force UI update before proceeding
        await new Promise(resolve => requestAnimationFrame(resolve));
        await new Promise(resolve => setTimeout(resolve, 100));
        console.log('[GrooveFS] Button updated, starting track processing');

        const startTrack = grpId * TRACKS_PER_GROUP;

        console.log(`[GrooveFS] Starting Freesound Auto-Kit for Pattern: ${pattern.name}`);

        try {
            for (let i = 0; i < TRACKS_PER_GROUP; i++) {
                const targetTrackId = startTrack + i;
                const patternTrack = pattern.tracks[i];
                
                if (this.tracks[targetTrackId] && !this.tracks[targetTrackId].stepLock && patternTrack) {
                    const trackObj = this.tracks[targetTrackId];
                    let query = patternTrack.instrument_type.replace(/_/g, ' ');
                    
                    // Update progress in UI and wait for it to render
                    btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> LOADING ${i+1}/${TRACKS_PER_GROUP}...`;
                    
                    // Force UI update by waiting for next frame AND a small delay
                    await new Promise(resolve => requestAnimationFrame(resolve));
                    await new Promise(resolve => setTimeout(resolve, 100));
                    
                    console.log(`[GrooveFS] Processing Track ${targetTrackId} (${query})`);

                    let filters = 'duration:[0.05 TO 1.0] license:"Creative Commons 0"';
                    if (patternTrack.role === 'ghost') filters += ' ac_brightness:[0 TO 50]';
                    else filters += ' ac_brightness:[10 TO 100]';

                    let results = await this.searchModal.client.textSearch(query, filters);
                    
                    if (results.results.length === 0) {
                        console.log(`[GrooveFS] Attempt 2: Relaxed Filters for ${query}`);
                        const relaxed = 'duration:[0.05 TO 3.0] license:"Creative Commons 0"';
                        results = await this.searchModal.client.textSearch(query, relaxed);
                    }

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
                        
                        // Update UI BEFORE heavy operation
                        btn.innerHTML = `<i class="fas fa-download"></i> DOWNLOADING ${i+1}/${TRACKS_PER_GROUP}: ${sound.name.substring(0, 20)}...`;
                        await new Promise(resolve => requestAnimationFrame(resolve));
                        await new Promise(resolve => setTimeout(resolve, 100)); // Give UI time to render
                        
                        const url = sound.previews['preview-hq-mp3'];
                        
                        // Wrap in setTimeout to push heavy work to next event loop cycle
                        await new Promise(async (resolve) => {
                            setTimeout(async () => {
                                try {
                                    await this.searchModal.loader.loadSampleFromUrl(url, trackObj);
                                    console.log(`[GrooveFS] Loaded: ${sound.name}`);
                                    resolve();
                                } catch (error) {
                                    console.error('[GrooveFS] Load error:', error);
                                    resolve(); // Continue even if one fails
                                }
                            }, 50);
                        });
                        
                        // Update UI AFTER heavy operation
                        await new Promise(resolve => requestAnimationFrame(resolve));
                        await new Promise(resolve => setTimeout(resolve, 50));
                        
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
            
            if (onSelectTrack && selectedTrackIndex !== undefined) {
                onSelectTrack(selectedTrackIndex);
            }
            
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
}
