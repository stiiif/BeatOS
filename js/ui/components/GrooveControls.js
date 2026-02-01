// js/ui/components/GrooveControls.js
import { NUM_STEPS, TRACKS_PER_GROUP, MAX_TRACKS } from '../../utils/constants.js';
import { PatternLibrary } from '../../modules/PatternLibrary.js';

const FREESOUND_TAGS = [
    "field-recording", "ambience", "ambient", "loop", "noise", "water", "nature", "owi", "sound", "atmosphere", 
    "voice", "synth", "music", "birds", "metal", "electronic", "soundscape", "drum", "bass", "beat", "horror", 
    "ambiance", "rain", "city", "door", "wind", "hit", "game", "percussion", "effect", "foley", "people", "sfx", 
    "drums", "fx", "sci-fi", "background", "car", "machine", "scary", "cinematic", "dark", "guitar", "traffic", 
    "street", "engine", "wood", "drone", "creepy", "bird", "space", "open", "film", "vocal", "male", "piano", 
    "recording", "train", "female", "footsteps", "close", "weird", "click", "impact", "walking", "movie", 
    "electric", "sample", "forest", "dance", "spooky", "synthesizer", "human", "glitch", "electro", "weather", 
    "house", "kitchen", "thunder", "storm", "glass", "kick", "industrial", "computer", "transformation", "field", 
    "reverb", "crowd", "plastic", "night", "bell", "techno", "motor", "voices", "cars", "metallic", "experimental", 
    "digital", "mechanical", "paper", "spring", "melody", "waves", "stereo", "opening", "birdsong", "rhythm", 
    "alien", "sound-design", "summer", "free", "animal", "drop", "liquid", "strange", "walk", "monster", "deep", 
    "sea", "woman", "steps", "background-sound", "fire", "loud", "processed", "pad", "talking", "closing", 
    "analog", "river", "man", "squeak", "soundtrack", "suspense", "short", "stream", "wooden", "speech", "bottle", 
    "air", "general-noise", "gun", "beach", "explosion", "multisample", "pop", "dog", "radio", "talk", "hum", 
    "girl", "scream", "snare", "english", "dramatic", "strings", "hard", "sounds", "splash", "atmospheric", "echo", 
    "morning", "bathroom", "bpm", "binaural", "floor", "old", "ring", "bells", "road", "insects", "beep", "sinister", 
    "light", "haunted", "funny", "retro", "acoustic", "keys", "break", "vehicle", "buzz", "france", "thunderstorm", 
    "park", "trance", "urban", "ocean", "song", "sound-effect", "heavy", "food", "robot", "atmos", "crickets", 
    "running", "creak", "bang", "evil", "single-note"
];

export class GrooveControls {
    constructor() {
        this.tracks = [];
        this.trackManager = null;
        this.patternLibrary = new PatternLibrary();
        this.matrixStepElements = [];
        this.searchModal = null;
        this.visualizerCallback = null;
        this.trackDescriptors = new Array(TRACKS_PER_GROUP).fill('brightness'); // Default descriptor per track
        
        // NEW: Selected tags for Auto-Kit
        this.selectedTags = [];
        
        // NEW: Checkbox state for including instrument name in query
        this.includeInstrumentName = true;

        // Callbacks for external interactions
        this.callbacks = {
            onUpdateGridVisuals: null,
            onSelectTrack: null,
            getSelectedTrackIndex: null
        };
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

    setCallbacks(onUpdateGridVisuals, onSelectTrack, getSelectedTrackIndex) {
        this.callbacks.onUpdateGridVisuals = onUpdateGridVisuals;
        this.callbacks.onSelectTrack = onSelectTrack;
        this.callbacks.getSelectedTrackIndex = getSelectedTrackIndex;
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
            
            // Listen for pattern changes to update descriptor selector UI
            patternSelect.addEventListener('change', () => this.updateDescriptorSelectorUI());
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
            
            // --- NEW: Create Tag Selector UI ---
            this.createTagSelector(groovePanel);

            // Create descriptor selector container
            const descriptorContainer = document.createElement('div');
            descriptorContainer.id = 'descriptorSelectorContainer';
            descriptorContainer.className = 'mt-2 mb-2 hidden';
            groovePanel.appendChild(descriptorContainer);
            
            const fsBtn = document.createElement('button');
            fsBtn.id = 'applyGrooveFsBtn';
            fsBtn.className = 'w-full text-[10px] bg-indigo-900/40 hover:bg-indigo-800 text-indigo-300 py-1 rounded transition border border-indigo-900/50 font-bold mt-1 flex items-center justify-center gap-2';
            fsBtn.innerHTML = '<i class="fas fa-cloud-download-alt"></i> AUTO-KIT (FREESOUND)';
            fsBtn.onclick = () => {
                this.applyGrooveFreesound();
            };
            groovePanel.appendChild(fsBtn);
        }
    }

    createTagSelector(parent) {
        const container = document.createElement('div');
        container.className = 'mb-3 bg-neutral-900/30 p-2 rounded border border-neutral-800';
        
        const label = document.createElement('label');
        label.className = 'text-[9px] text-neutral-500 font-bold block mb-1 uppercase';
        label.innerText = 'Sound Palette (Max 5)';
        container.appendChild(label);

        // Container for selected chips
        const tagsContainer = document.createElement('div');
        tagsContainer.className = 'flex flex-wrap gap-1 mb-2 min-h-[20px]';
        container.appendChild(tagsContainer);

        // Input group
        const inputGroup = document.createElement('div');
        inputGroup.className = 'flex gap-1 relative mb-2';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'flex-1 bg-neutral-800 text-neutral-300 text-[10px] rounded border border-neutral-700 px-2 py-1 outline-none focus:border-indigo-500';
        input.placeholder = 'Add type (e.g. sci-fi)...';
        input.setAttribute('list', 'fsTagList');
        
        // Create DataList for autocomplete
        let datalist = document.getElementById('fsTagList');
        if (!datalist) {
            datalist = document.createElement('datalist');
            datalist.id = 'fsTagList';
            FREESOUND_TAGS.sort().forEach(tag => {
                const opt = document.createElement('option');
                opt.value = tag;
                datalist.appendChild(opt);
            });
            document.body.appendChild(datalist);
        }

        const addBtn = document.createElement('button');
        addBtn.className = 'bg-neutral-700 hover:bg-neutral-600 text-neutral-300 w-6 rounded border border-neutral-600 text-[10px] font-bold';
        addBtn.innerText = '+';

        // Add Tag Logic
        const addTag = () => {
            const val = input.value.trim().toLowerCase();
            if (val && this.selectedTags.length < 5 && !this.selectedTags.includes(val)) {
                this.selectedTags.push(val);
                this.renderTags(tagsContainer);
                input.value = '';
            } else if (this.selectedTags.length >= 5) {
                alert('Max 5 tags allowed');
            }
        };

        addBtn.onclick = addTag;
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter') addTag(); });

        inputGroup.appendChild(input);
        inputGroup.appendChild(addBtn);
        container.appendChild(inputGroup);

        // --- NEW: Instrument Name Checkbox ---
        const checkboxGroup = document.createElement('div');
        checkboxGroup.className = 'flex items-center gap-2 mt-1';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = 'includeInstName';
        checkbox.checked = this.includeInstrumentName;
        checkbox.className = 'w-3 h-3 rounded bg-neutral-700 border-neutral-600 text-indigo-600 focus:ring-0 cursor-pointer';
        
        checkbox.addEventListener('change', (e) => {
            this.includeInstrumentName = e.target.checked;
        });

        const cbLabel = document.createElement('label');
        cbLabel.htmlFor = 'includeInstName';
        cbLabel.className = 'text-[9px] text-neutral-400 cursor-pointer select-none';
        cbLabel.innerText = 'Include Instrument Name (e.g. Kick)';

        checkboxGroup.appendChild(checkbox);
        checkboxGroup.appendChild(cbLabel);
        container.appendChild(checkboxGroup);

        parent.appendChild(container);
        this.renderTags(tagsContainer);
    }

    renderTags(container) {
        container.innerHTML = '';
        if (this.selectedTags.length === 0) {
            container.innerHTML = '<span class="text-[9px] text-neutral-600 italic px-1">No tags selected (using defaults)</span>';
            return;
        }

        this.selectedTags.forEach(tag => {
            const chip = document.createElement('span');
            chip.className = 'inline-flex items-center gap-1 bg-indigo-900/40 text-indigo-300 text-[9px] px-1.5 py-0.5 rounded border border-indigo-900/60';
            chip.innerHTML = `${tag} <span class="cursor-pointer hover:text-white font-bold ml-1">&times;</span>`;
            
            // Remove handler
            chip.querySelector('span').onclick = () => {
                this.selectedTags = this.selectedTags.filter(t => t !== tag);
                this.renderTags(container);
            };
            container.appendChild(chip);
        });
    }

    updateDescriptorSelectorUI() {
        const patId = parseInt(document.getElementById('patternSelect').value);
        const container = document.getElementById('descriptorSelectorContainer');
        
        if (!container) return;
        
        if (isNaN(patId)) {
            container.classList.add('hidden');
            return;
        }
        
        const pattern = this.patternLibrary.getPatternById(patId);
        if (!pattern) return;
        
        container.classList.remove('hidden');
        container.innerHTML = '';
        
        // Create header
        const header = document.createElement('div');
        header.className = 'text-[9px] font-bold text-indigo-300 mb-1 uppercase tracking-wider';
        header.textContent = 'Acoustic Profile';
        container.appendChild(header);
        
        // Create track descriptor rows
        const descriptorOptions = ['boominess', 'brightness', 'loudness', 'roughness', 'warmth'];
        const descriptorIcons = {
            'boominess': '💥',
            'brightness': '✨',
            'loudness': '🔊',
            'roughness': '⚡',
            'warmth': '🔥'
        };
        
        for (let i = 0; i < TRACKS_PER_GROUP; i++) {
            const patternTrack = pattern.tracks[i];
            if (!patternTrack) continue;
            
            const trackRow = document.createElement('div');
            trackRow.className = 'flex items-center gap-1 mb-1 text-[9px]';
            
            // Track label
            const label = document.createElement('div');
            label.className = 'text-neutral-400 truncate flex-shrink-0';
            label.style.width = '60px';
            const instrumentName = (patternTrack.instrument_type || patternTrack.instrument || 'Track').replace(/_/g, ' ');
            label.textContent = instrumentName.length > 9 ? instrumentName.substring(0, 9) + '.' : instrumentName;
            label.title = instrumentName;
            trackRow.appendChild(label);
            
            // Toggle buttons container
            const toggleGroup = document.createElement('div');
            toggleGroup.className = 'flex gap-0.5 flex-1';
            
            // Add "none" option first
            const noneBtn = document.createElement('button');
            noneBtn.className = 'flex-1 px-1 py-0.5 rounded text-[8px] transition-all border';
            noneBtn.dataset.trackIdx = i;
            noneBtn.dataset.descriptor = 'none';
            noneBtn.title = 'No descriptor filter';
            
            if (this.trackDescriptors[i] === 'none') {
                noneBtn.classList.add('bg-neutral-600', 'text-white', 'border-neutral-500');
            } else {
                noneBtn.classList.add('bg-neutral-800', 'text-neutral-500', 'border-neutral-700', 'hover:bg-neutral-700');
            }
            
            noneBtn.textContent = '∅';
            
            noneBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.trackDescriptors[i] = 'none';
                this.updateDescriptorSelectorUI();
            });
            
            toggleGroup.appendChild(noneBtn);
            
            descriptorOptions.forEach((desc, idx) => {
                const btn = document.createElement('button');
                btn.className = 'flex-1 px-1 py-0.5 rounded text-[8px] transition-all border';
                btn.dataset.trackIdx = i;
                btn.dataset.descriptor = desc;
                btn.title = desc.charAt(0).toUpperCase() + desc.slice(1);
                
                if (this.trackDescriptors[i] === desc) {
                    btn.classList.add('bg-indigo-600', 'text-white', 'border-indigo-500');
                } else {
                    btn.classList.add('bg-neutral-800', 'text-neutral-500', 'border-neutral-700', 'hover:bg-neutral-700');
                }
                
                btn.textContent = descriptorIcons[desc];
                
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.trackDescriptors[i] = desc;
                    this.updateDescriptorSelectorUI();
                });
                
                toggleGroup.appendChild(btn);
            });
            
            trackRow.appendChild(toggleGroup);
            
            // Add search button for individual track
            const searchBtn = document.createElement('button');
            searchBtn.className = 'px-2 py-0.5 rounded text-[8px] transition-all border bg-emerald-900/40 hover:bg-emerald-700 text-emerald-300 border-emerald-900/50 ml-1 flex-shrink-0';
            searchBtn.title = 'Search sound for this track';
            searchBtn.textContent = '🔍';
            searchBtn.dataset.trackIdx = i;
            searchBtn.dataset.instrumentName = instrumentName;
            
            searchBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.openSearchForTrack(i, instrumentName);
            });
            
            trackRow.appendChild(searchBtn);
            container.appendChild(trackRow);
        }
    }
    
    openSearchForTrack(trackIndex, instrumentName) {
        const grpId = parseInt(document.getElementById('targetGroupSelect').value);
        
        if (isNaN(grpId)) {
            alert("Please select a target group first.");
            return;
        }
        
        if (!this.searchModal) {
            alert("Search module not ready.");
            return;
        }
        
        const startTrack = grpId * TRACKS_PER_GROUP;
        const targetTrackId = startTrack + trackIndex;
        const trackObj = this.tracks[targetTrackId];
        
        if (!trackObj) {
            alert("Track not available.");
            return;
        }
        
        console.log(`[GrooveFS] Opening search for Track ${targetTrackId}: ${instrumentName}`);
        
        // Open search modal with pre-filled query
        this.searchModal.open(trackObj, instrumentName);
    }

    applyGroove(onUpdateGridVisuals, onSelectTrack) {
        const patId = parseInt(document.getElementById('patternSelect').value);
        const grpId = parseInt(document.getElementById('targetGroupSelect').value);
        const influence = parseInt(document.getElementById('patternInfluence').value) / 100.0;

        if (isNaN(patId)) { alert("Please select a pattern first."); return; }
        if (isNaN(grpId)) { alert("Please select a target group."); return; }

        const pattern = this.patternLibrary.getPatternById(patId);
        if (!pattern) return;

        const startTrack = grpId * TRACKS_PER_GROUP;
        
        const _onUpdateGridVisuals = onUpdateGridVisuals || this.callbacks.onUpdateGridVisuals;
        
        if (_onUpdateGridVisuals) {
            _onUpdateGridVisuals(pattern.time_sig);
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
        
        const _onSelectTrack = onSelectTrack || this.callbacks.onSelectTrack;
        if (_onSelectTrack) {
            _onSelectTrack(startTrack, this.visualizerCallback);
        }
    }

    async applyGrooveFreesound(onUpdateGridVisuals, onSelectTrack, selectedTrackIndex) {
        // Resolve parameters from arguments or stored callbacks
        const _onUpdateGridVisuals = onUpdateGridVisuals || this.callbacks.onUpdateGridVisuals;
        const _onSelectTrack = onSelectTrack || this.callbacks.onSelectTrack;
        let _selectedTrackIndex = selectedTrackIndex;
        if (_selectedTrackIndex === undefined && this.callbacks.getSelectedTrackIndex) {
            _selectedTrackIndex = this.callbacks.getSelectedTrackIndex();
        }

        console.log(`[GrooveControls] applyGrooveFreesound started. selectedTrackIndex: ${_selectedTrackIndex}`);
        
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

        // 1. Apply Pattern Structure (Notes, Velocities)
        this.applyGroove(_onUpdateGridVisuals, null); 

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
                    let query = "";
                    
                    // --- NEW: Conditionally include instrument type based on checkbox ---
                    if (this.includeInstrumentName) {
                        query = patternTrack.instrument_type.replace(/_/g, ' ');
                    }
                    
                    // --- APPEND SELECTED TAGS TO QUERY ---
                    if (this.selectedTags.length > 0) {
                        query += ' ' + this.selectedTags.join(' ');
                    }
                    
                    // If both empty, ensure at least some search term (fallback to instrument)
                    if (!query.trim()) {
                        query = patternTrack.instrument.replace(/_/g, ' ');
                    }

                    console.log(`[GrooveFS] Processing Track ${targetTrackId} (${query})`);

                    // Get selected descriptor for this track
                    const selectedDescriptor = this.trackDescriptors[i];
                    const descriptorFilter = selectedDescriptor !== 'none' ? `${selectedDescriptor}:[80 TO 100]` : '';
                    
                    let filters = `duration:[0.05 TO 1.0] license:"Creative Commons 0"`;
                    if (descriptorFilter) filters += ` ${descriptorFilter}`;
                    if (patternTrack.role === 'ghost') filters += ' ac_brightness:[0 TO 50]';
                    else filters += ' ac_brightness:[10 TO 100]';

                    console.log(`[GrooveFS] Using descriptor: ${selectedDescriptor === 'none' ? 'none' : selectedDescriptor + '=[80-100]'}`);

                    let results = await this.searchModal.client.textSearch(query, filters);
                    
                    if (results.results.length === 0) {
                        console.log(`[GrooveFS] Attempt 2: Relaxed Filters for ${query}`);
                        let relaxed = `duration:[0.05 TO 3.0] license:"Creative Commons 0"`;
                        if (descriptorFilter) relaxed += ` ${descriptorFilter}`;
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
                        
                        let fallbackQuery = "";
                        
                        if (this.includeInstrumentName) {
                            const instrumentType = patternTrack.instrument_type.replace(/_/g, ' ');
                            fallbackQuery = fallbacks[instrumentType] || patternTrack.instrument.replace(/_/g, ' ');
                        } else {
                             // If no instrument name was desired but search failed (e.g. only tags), 
                             // fallback to tags alone again (which already failed) or try adding instrument name now?
                             // Let's assume if it failed, we try the instrument name as a last resort fallback even if unchecked,
                             // OR we stick to the user's tags and try just those + standard fallback logic?
                             // Logic: If tags alone fail, maybe the tags are too restrictive. 
                             // Let's rely on the standard fallback mechanism which usually implies an instrument name.
                             
                             // Simplest logic: Reuse the standard fallback query construction
                             fallbackQuery = patternTrack.instrument.replace(/_/g, ' '); 
                        }
                        
                        // Append tags to fallback query as well
                        const finalFallbackQuery = this.selectedTags.length > 0 ? 
                            `${fallbackQuery} ${this.selectedTags.join(' ')}` : fallbackQuery;

                        if (finalFallbackQuery.trim() !== query.trim()) {
                             console.log(`[GrooveFS] Attempt 3: Fallback Query "${finalFallbackQuery}"`);
                             let fallbackFilters = `duration:[0.05 TO 2.0] license:"Creative Commons 0"`;
                             if (descriptorFilter) fallbackFilters += ` ${descriptorFilter}`;
                             results = await this.searchModal.client.textSearch(finalFallbackQuery, fallbackFilters);
                             if (results.results.length > 0) query = finalFallbackQuery; 
                        }
                    }

                    if (results.results && results.results.length > 0) {
                        const pickIdx = Math.floor(Math.random() * Math.min(5, results.results.length));
                        const sound = results.results[pickIdx];
                        
                        console.log(`[GrooveFS] Success! Loading: ${sound.name} into Track ${targetTrackId}`);
                        const url = sound.previews['preview-hq-mp3'];
                        await this.searchModal.loader.loadSampleFromUrl(url, trackObj);
                        
                        // --- CRITICAL FIX START ---
                        // Force Granular Engine immediately
                        trackObj.type = 'granular';
                        
                        // Reset params for clean one-shot playback
                        trackObj.params.position = 0;
                        trackObj.params.grainSize = 0.1; 
                        trackObj.params.density = 20;    
                        trackObj.params.spray = 0;
                        trackObj.params.pitch = 1.0;
                        trackObj.params.overlap = 3.0;   
                        trackObj.params.scanSpeed = 0;
                        trackObj.params.ampAttack = 0.01;
                        trackObj.params.ampDecay = 0.01;
                        trackObj.params.ampRelease = 0.01;

                        trackObj.customSample.name = sound.name;
                        // --- CRITICAL FIX END ---
                        console.log(`[GrooveFS] Track ${targetTrackId} set to granular. Sample: ${sound.name}`);
                    } else {
                        console.warn(`[GrooveFS] FAILED to find sample for ${query}. Keeping default.`);
                    }
                }
            }
            
            console.log(`[GrooveFS] All tracks processed. Refreshing UI...`);
            // 2. Final UI Refresh - This is crucial
            if (_onSelectTrack && _selectedTrackIndex !== undefined) {
                console.log(`[GrooveFS] Re-selecting track ${_selectedTrackIndex} to refresh UI.`);
                // Re-select the track to force UI update
                _onSelectTrack(_selectedTrackIndex, this.visualizerCallback);
                
                // Dispatch event as a backup measure to update headers
                console.log(`[GrooveFS] Dispatching trackSampleLoaded for ${_selectedTrackIndex}`);
                window.dispatchEvent(new CustomEvent('trackSampleLoaded', { detail: { trackId: _selectedTrackIndex } }));
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