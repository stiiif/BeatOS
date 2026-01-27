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

    initGrooveControls() {
        console.log('[DEBUG] initGrooveControls: START');
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

        const groovePanel = document.querySelector('#applyGrooveBtn')?.parentElement;
        if (groovePanel && !document.getElementById('applyGrooveFsBtn')) {
            const fsBtn = document.createElement('button');
            fsBtn.id = 'applyGrooveFsBtn';
            fsBtn.className = 'w-full text-[10px] bg-indigo-900/40 hover:bg-indigo-800 text-indigo-300 py-1 rounded transition border border-indigo-900/50 font-bold mt-1 flex items-center justify-center gap-2';
            fsBtn.innerHTML = '<i class="fas fa-cloud-download-alt"></i> AUTO-KIT (FREESOUND)';
            fsBtn.onclick = () => {
                console.log('[DEBUG] AUTO-KIT button clicked');
                this.applyGrooveFreesound();
            };
            groovePanel.appendChild(fsBtn);
        }
        console.log('[DEBUG] initGrooveControls: END');
    }

    applyGroove(onUpdateGridVisuals, onSelectTrack) {
        console.log('[DEBUG] applyGroove: START');
        const patId = parseInt(document.getElementById('patternSelect').value);
        const grpId = parseInt(document.getElementById('targetGroupSelect').value);
        const influence = parseInt(document.getElementById('patternInfluence').value) / 100.0;

        if (isNaN(patId)) { alert("Please select a pattern first."); return; }
        if (isNaN(grpId)) { alert("Please select a target group."); return; }

        const pattern = this.patternLibrary.getPatternById(patId);
        if (!pattern) return;

        const startTrack = grpId * TRACKS_PER_GROUP;
        
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
        console.log('[DEBUG] applyGroove: END');
    }

    async applyGrooveFreesound(onUpdateGridVisuals, onSelectTrack, selectedTrackIndex) {
        console.log('[DEBUG-1] applyGrooveFreesound: ENTRY');
        console.log('[DEBUG-1] searchModal:', this.searchModal);
        
        if (!this.searchModal) {
            console.error('[DEBUG-1] searchModal is NULL!');
            alert("Search module not ready.");
            return;
        }

        console.log('[DEBUG-2] Getting pattern/group IDs...');
        const patId = parseInt(document.getElementById('patternSelect').value);
        const grpId = parseInt(document.getElementById('targetGroupSelect').value);
        
        console.log('[DEBUG-2] patId:', patId, 'grpId:', grpId);
        
        if (isNaN(patId)) { alert("Please select a pattern first."); return; }
        if (isNaN(grpId)) { alert("Please select a target group."); return; }

        console.log('[DEBUG-3] Getting pattern by ID...');
        const pattern = this.patternLibrary.getPatternById(patId);
        if (!pattern) {
            console.error('[DEBUG-3] Pattern not found!');
            return;
        }
        console.log('[DEBUG-3] Pattern:', pattern.name);

        console.log('[DEBUG-4] Calling applyGroove...');
        this.applyGroove(onUpdateGridVisuals, null);
        console.log('[DEBUG-4] applyGroove complete');

        console.log('[DEBUG-5] Getting button...');
        const btn = document.getElementById('applyGrooveFsBtn');
        if (!btn) {
            console.error('[DEBUG-5] Button not found!');
            return;
        }
        const originalText = btn.innerHTML;
        console.log('[DEBUG-5] Setting button text...');
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> FETCHING SOUNDS...';
        btn.disabled = true;
        console.log('[DEBUG-5] Button updated');

        const startTrack = grpId * TRACKS_PER_GROUP;

        console.log(`[DEBUG-6] Starting loop for ${TRACKS_PER_GROUP} tracks...`);

        try {
            for (let i = 0; i < TRACKS_PER_GROUP; i++) {
                console.log(`[DEBUG-7.${i}] === TRACK ${i} START ===`);
                
                const targetTrackId = startTrack + i;
                const patternTrack = pattern.tracks[i];
                
                console.log(`[DEBUG-7.${i}] targetTrackId:`, targetTrackId);
                console.log(`[DEBUG-7.${i}] patternTrack:`, patternTrack ? 'exists' : 'null');
                console.log(`[DEBUG-7.${i}] track exists:`, !!this.tracks[targetTrackId]);
                console.log(`[DEBUG-7.${i}] stepLock:`, this.tracks[targetTrackId]?.stepLock);
                
                if (this.tracks[targetTrackId] && !this.tracks[targetTrackId].stepLock && patternTrack) {
                    const trackObj = this.tracks[targetTrackId];
                    let query = patternTrack.instrument_type.replace(/_/g, ' ');
                    
                    console.log(`[DEBUG-8.${i}] Query: "${query}"`);
                    console.log(`[DEBUG-8.${i}] About to search Freesound...`);

                    let filters = 'duration:[0.05 TO 1.0] license:"Creative Commons 0"';
                    if (patternTrack.role === 'ghost') filters += ' ac_brightness:[0 TO 50]';
                    else filters += ' ac_brightness:[10 TO 100]';

                    console.log(`[DEBUG-9.${i}] BEFORE textSearch (this might block)...`);
                    let results = await this.searchModal.client.textSearch(query, filters);
                    console.log(`[DEBUG-9.${i}] AFTER textSearch - results:`, results.results?.length || 0);
                    
                    if (results.results.length === 0) {
                        console.log(`[DEBUG-10.${i}] No results, trying relaxed filters...`);
                        const relaxed = 'duration:[0.05 TO 3.0] license:"Creative Commons 0"';
                        console.log(`[DEBUG-10.${i}] BEFORE textSearch (relaxed)...`);
                        results = await this.searchModal.client.textSearch(query, relaxed);
                        console.log(`[DEBUG-10.${i}] AFTER textSearch (relaxed) - results:`, results.results?.length || 0);
                    }

                    if (results.results.length === 0) {
                        console.log(`[DEBUG-11.${i}] Still no results, trying fallback...`);
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
                            console.log(`[DEBUG-11.${i}] Fallback query: "${fallbackQuery}"`);
                            console.log(`[DEBUG-11.${i}] BEFORE textSearch (fallback)...`);
                            results = await this.searchModal.client.textSearch(fallbackQuery, 'duration:[0.05 TO 2.0] license:"Creative Commons 0"');
                            console.log(`[DEBUG-11.${i}] AFTER textSearch (fallback) - results:`, results.results?.length || 0);
                            if (results.results.length > 0) query = fallbackQuery; 
                        }
                    }

                    if (results.results && results.results.length > 0) {
                        const pickIdx = Math.floor(Math.random() * Math.min(5, results.results.length));
                        const sound = results.results[pickIdx];
                        
                        console.log(`[DEBUG-12.${i}] Selected sound: "${sound.name}"`);
                        console.log(`[DEBUG-12.${i}] Preview URL:`, sound.previews['preview-hq-mp3']);
                        
                        const url = sound.previews['preview-hq-mp3'];
                        
                        console.log(`[DEBUG-13.${i}] ⚠️  BEFORE loadSampleFromUrl (THIS IS WHERE IT FREEZES!) ⚠️`);
                        console.log(`[DEBUG-13.${i}] Time:`, new Date().toISOString());
                        
                        await this.searchModal.loader.loadSampleFromUrl(url, trackObj);
                        
                        console.log(`[DEBUG-14.${i}] ✅ AFTER loadSampleFromUrl - IT WORKED!`);
                        console.log(`[DEBUG-14.${i}] Time:`, new Date().toISOString());
                        
                        trackObj.type = 'granular';
                        trackObj.params.position = 0;
                        trackObj.params.grainSize = 0.2; 
                        trackObj.params.density = 20;    
                        trackObj.params.spray = 0;
                        trackObj.params.pitch = 1.0;
                        trackObj.params.overlap = 3.0;   

                        trackObj.customSample.name = sound.name;
                        console.log(`[DEBUG-15.${i}] Track configured successfully`);
                    } else {
                        console.warn(`[DEBUG-16.${i}] No samples found for "${query}"`);
                    }
                } else {
                    console.log(`[DEBUG-17.${i}] Skipping track (stepLock or no patternTrack)`);
                }
                
                console.log(`[DEBUG-18.${i}] === TRACK ${i} END ===`);
            }
            
            console.log('[DEBUG-19] Loop complete, calling selectTrack...');
            if (onSelectTrack && selectedTrackIndex !== undefined) {
                onSelectTrack(selectedTrackIndex);
            }
            console.log('[DEBUG-19] selectTrack complete');
            
            console.log('[DEBUG-20] Setting success message...');
            btn.innerHTML = '<i class="fas fa-check"></i> KIT LOADED!';
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.disabled = false;
                console.log('[DEBUG-21] Button restored');
            }, 2000);
            
            console.log('[DEBUG-22] ✅ applyGrooveFreesound: SUCCESS');

        } catch (e) {
            console.error('[DEBUG-ERROR] Exception caught:', e);
            console.error('[DEBUG-ERROR] Stack:', e.stack);
            alert("Error: " + e.message);
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }
}
