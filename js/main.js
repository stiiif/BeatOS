console.log("[Main] Module loaded.");
import { AudioEngine } from './core/AudioEngine.js';
import { GranularSynthWorklet as GranularSynth } from './core/GranularSynthWorklet.js';
import { Scheduler } from './core/Scheduler.js';
import { TrackManager } from './modules/TrackManager.js';
import { PresetManager } from './modules/PresetManager.js';
import { TrackLibrary } from './modules/TrackLibrary.js';
import { UIManager } from './ui/UIManager.js'; 
import { Visualizer } from './ui/Visualizer.js';
import { LayoutManager } from './ui/LayoutManager.js';
import { NUM_LFOS, TRACKS_PER_GROUP } from './utils/constants.js';
import { globalBus } from './events/EventBus.js'; 

// NEW IMPORTS
import { EffectsManager } from './modules/EffectsManager.js';
import { EffectControls } from './ui/components/EffectControls.js';
import { Randomizer } from './modules/Randomizer.js';
import { RenderLoop } from './core/RenderLoop.js';

const audioEngine = new AudioEngine();
const granularSynth = new GranularSynth(audioEngine);

const scheduler = new Scheduler(audioEngine, granularSynth);
const trackManager = new TrackManager(audioEngine);
const presetManager = new PresetManager();
const trackLibrary = new TrackLibrary();
const uiManager = new UIManager();
const visualizer = new Visualizer('visualizer', 'bufferDisplay', audioEngine);

// New Effect Managers
const effectsManager = new EffectsManager(audioEngine);
const effectControls = new EffectControls(effectsManager);

// Config-driven Randomizer
const randomizer = new Randomizer();
randomizer.loadConfig('./js/config/randomization-config.json').catch(e => console.warn('[Randomizer] Config load failed, falling back to defaults:', e));

const layoutManager = new LayoutManager();

scheduler.setTrackManager(trackManager);
scheduler.setTracks(trackManager.getTracks());

trackManager.initTracks();
const tracks = trackManager.getTracks();

uiManager.setTracks(tracks);
uiManager.setTrackManager(trackManager);
visualizer.setTracks(tracks);

scheduler.setUpdateMatrixHeadCallback((step, total) => uiManager.updateMatrixHead(step, total));
scheduler.setRandomChokeCallback(() => uiManager.getRandomChokeInfo());
scheduler.setRandomizer(randomizer, { audioEngine, effectsManager, selectedTrackIndex: 0 });

function updateTrackControlsVisibility() {
    uiManager.updateTrackControlsVisibility();
}

const originalSelectTrack = uiManager.selectTrack.bind(uiManager);
uiManager.selectTrack = (idx, cb) => {
    originalSelectTrack(idx, cb);
    updateTrackControlsVisibility();
};

function addTrack() {
    const newId = trackManager.addTrack();
    if (newId !== null) {
        uiManager.appendTrackRow(newId, () => {
            visualizer.setSelectedTrackIndex(uiManager.getSelectedTrackIndex());
            visualizer.triggerRedraw();
            updateTrackControlsVisibility();
        });
        visualizer.resizeCanvas();
    }
}

function addGroup() {
    const tracksAdded = [];
    for (let i = 0; i < TRACKS_PER_GROUP; i++) {
        const newId = trackManager.addTrack();
        if (newId !== null) {
            tracksAdded.push(newId);
        }
    }
    tracksAdded.forEach(id => uiManager.appendTrackRow(id, () => {
        visualizer.setSelectedTrackIndex(uiManager.getSelectedTrackIndex());
        visualizer.triggerRedraw();
        updateTrackControlsVisibility();
    }));
    if (tracksAdded.length > 0) {
        visualizer.resizeCanvas();
    }
}

// Unified Render Loop — replaces 3+ separate rAF loops
const renderLoop = new RenderLoop();

// 1. Effects modulation (audio-rate, every frame)
renderLoop.register('effectsManager', () => {
    if (audioEngine.getContext() && audioEngine.getContext().state === 'running') {
        effectsManager.update(audioEngine.getContext().currentTime);
    }
}, 0);

// 2. Visualizer (30fps — scope, waveform, overlays, per-track mini canvases)
renderLoop.register('visualizer', (ts) => {
    visualizer.update(ts);
}, 33);

// 3. FX slider animation (30fps — moves sliders with LFO modulation)
renderLoop.register('effectControls', (ts) => {
    effectControls.update(ts);
}, 33);

// 4. Mixer meters (30fps — LED meter strips)
renderLoop.register('mixerMeters', (ts) => {
    if (uiManager.mixer) uiManager.mixer.animateMeters(ts);
}, 33);

document.getElementById('initAudioBtn').addEventListener('click', async () => {
    console.log("[Main] Init audio clicked.");
    await audioEngine.initialize();

    console.log("[Main] Initializing AudioWorklet...");
    await granularSynth.init();
    console.log("[Main] ✅ AudioWorklet ready!");

    trackManager.createBuffersForAllTracks();
    document.getElementById('startOverlay').classList.add('hidden');
    visualizer.drawVisuals(true); 
    
    // Refresh Mixer to ensure it binds to the newly created Audio Buses
    if (uiManager.mixer) {
        console.log("[Main] Refreshing Mixer...");
        uiManager.mixer.render();
    }

    // Render Effects UI
    effectsManager.setBpm(scheduler.getBPM()); // SYNC BPM ON START
    effectControls.render();
    renderLoop.start();

    uiManager.selectTrack(0, () => {
        visualizer.setSelectedTrackIndex(0);
        visualizer.triggerRedraw();
    });
    visualizer.setSelectedTrackIndex(0);
    visualizer.triggerRedraw();
    updateTrackControlsVisibility();
    uiManager.updateLfoUI();
});

document.getElementById('playBtn').addEventListener('click', () => {
    if (!audioEngine.getContext()) return;
    if (!scheduler.getIsPlaying()) {
        // Updated callback to pass stepIndex
        scheduler.start((time, trackId, stepIndex) => visualizer.scheduleVisualDraw(time, trackId, stepIndex));
        document.getElementById('playBtn').classList.add('text-emerald-500');
    }
});

document.getElementById('stopBtn').addEventListener('click', () => {
    scheduler.stop();
    document.getElementById('playBtn').classList.remove('text-emerald-500');
    uiManager.clearPlayheadForStop();
});

// ... rest of event listeners ...
document.getElementById('bpmInput').addEventListener('change', e => { 
    const bpm = e.target.value;
    scheduler.setBPM(bpm); 
    effectsManager.setBpm(bpm); // Update Effects BPM on change
});

const applyGrooveBtn = document.getElementById('applyGrooveBtn');
if (applyGrooveBtn) applyGrooveBtn.addEventListener('click', () => uiManager.applyGroove());

// Update scope button listener to cycle styles
document.getElementById('scopeBtnWave').addEventListener('click', (e) => {
    visualizer.setScopeMode('wave');
    const newStyle = visualizer.cycleWaveStyle();
    const btn = e.target;
    const codes = { 'mirror': 'WAVE', 'neon': 'NEON', 'bars': 'BARS', 'precision': 'FINE' };
    btn.innerText = codes[newStyle] || 'WAVE';
    const btnSpec = document.getElementById('scopeBtnSpec');
    btn.classList.replace('text-neutral-400', 'bg-neutral-600');
    btn.classList.replace('hover:text-white', 'text-white');
    btn.classList.add('rounded-sm');
    btnSpec.classList.replace('bg-neutral-600', 'text-neutral-400');
    btnSpec.classList.replace('text-white', 'hover:text-white');
    btnSpec.classList.remove('rounded-sm');
    visualizer.triggerRedraw();
});

document.getElementById('scopeBtnSpec').addEventListener('click', (e) => {
    visualizer.setScopeMode('spectrum');
    const btnSpec = e.target;
    const btnWave = document.getElementById('scopeBtnWave');
    btnSpec.classList.replace('text-neutral-400', 'bg-neutral-600');
    btnSpec.classList.replace('hover:text-white', 'text-white');
    btnSpec.classList.add('rounded-sm');
    btnWave.classList.replace('bg-neutral-600', 'text-neutral-400');
    btnWave.classList.replace('text-white', 'hover:text-white');
    btnWave.classList.remove('rounded-sm');
    visualizer.triggerRedraw();
});

document.getElementById('scopeBtnTrim').addEventListener('click', (e) => {
    const track = tracks[uiManager.getSelectedTrackIndex()];
    if (!track || !track.buffer || track.type !== 'granular') return;
    const btn = e.target;
    const originalText = btn.innerText;
    btn.innerHTML = '<i class="fas fa-scissors"></i>';
    btn.classList.add('text-white', 'bg-red-900/80');
    btn.classList.remove('text-red-400', 'hover:bg-red-900/50');
    const newBuffer = audioEngine.trimBuffer(track.buffer, 0.005, true);
    if (newBuffer) {
        track.buffer = newBuffer;
        if (track.customSample) {
            track.customSample.buffer = newBuffer;
            track.customSample.duration = newBuffer.duration;
        }
        track.rmsMap = audioEngine.analyzeBuffer(newBuffer);
        visualizer.triggerRedraw();
    }
    setTimeout(() => {
        btn.innerText = originalText;
        btn.classList.remove('text-white', 'bg-red-900/80');
        btn.classList.add('text-red-400', 'hover:bg-red-900/50');
    }, 500);
});

document.getElementById('randomizeAllPatternsBtn').addEventListener('click', () => uiManager.randomizeAllPatterns());
document.getElementById('randAllParamsBtn').addEventListener('click', (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickRatio = (e.clientX - rect.left) / rect.width;

    // Get zone name from config (or fallback)
    let zoneName;
    if (randomizer.config) {
        zoneName = randomizer.getZoneName(clickRatio);
    }
    if (!zoneName) {
        // Hardcoded fallback
        if (clickRatio < 0.2) zoneName = 'VERY SHORT';
        else if (clickRatio < 0.4) zoneName = 'SHORT';
        else if (clickRatio < 0.6) zoneName = 'MEDIUM';
        else if (clickRatio < 0.8) zoneName = 'LONG';
        else zoneName = 'VERY LONG';
    }

    const btn = e.currentTarget;
    const originalText = btn.innerHTML;
    btn.innerHTML = `${zoneName}`;
    btn.style.transition = 'none';
    btn.style.backgroundColor = '#4f46e5';
    setTimeout(() => {
        btn.style.transition = '';
        btn.style.backgroundColor = '';
        btn.innerHTML = originalText;
    }, 300);

    if (randomizer.config) {
        const zoneFraction = randomizer.getZoneFraction(clickRatio);
        randomizer.randomize({
            tracks,
            audioEngine,
            effectsManager,
            selectedTrackIndex: uiManager.getSelectedTrackIndex(),
            zoneFraction
        });
    } else {
        // Legacy fallback (no zone support, uses hardcoded release ranges)
        let releaseMin, releaseMax;
        if (clickRatio < 0.2) { releaseMin = 0.01; releaseMax = 0.2; }
        else if (clickRatio < 0.4) { releaseMin = 0.2; releaseMax = 0.6; }
        else if (clickRatio < 0.6) { releaseMin = 0.6; releaseMax = 1.2; }
        else if (clickRatio < 0.8) { releaseMin = 1.2; releaseMax = 1.6; }
        else { releaseMin = 1.6; releaseMax = 2.0; }
        tracks.forEach(t => {
            if (t.ignoreRandom) return;
            if (t.type === 'granular') {
                trackManager.randomizeTrackParams(t, releaseMin, releaseMax);
                trackManager.randomizeTrackModulators(t);
            } else if (t.type === 'simple-drum') {
                t.params.drumTune = Math.random();
                t.params.drumDecay = Math.random();
            }
        });
    }

    uiManager.updateKnobs();
    uiManager.updateLfoUI();
    uiManager.selectTrack(uiManager.getSelectedTrackIndex(), () => visualizer.triggerRedraw());
    visualizer.triggerRedraw();
    if (effectControls) effectControls.render();
    if (uiManager.mixer) uiManager.mixer.render();
    if (uiManager.automationPanel) uiManager.automationPanel.render();
});

// Reload randomization config button
document.getElementById('reloadRandConfigBtn').addEventListener('click', async () => {
    const btn = document.getElementById('reloadRandConfigBtn');
    const icon = btn.querySelector('i');
    if (icon) icon.classList.add('fa-spin');
    const ok = await randomizer.reload();
    if (icon) icon.classList.remove('fa-spin');
    btn.style.transition = 'none';
    btn.style.color = ok ? '#34d399' : '#f87171';
    setTimeout(() => { btn.style.transition = ''; btn.style.color = ''; }, 800);
});

document.getElementById('randomizeBtn').addEventListener('click', () => {
    const t = tracks[uiManager.getSelectedTrackIndex()];
    if (t.type === 'granular') trackManager.randomizeTrackParams(t);
    else { t.params.drumTune = Math.random(); t.params.drumDecay = Math.random(); }
    uiManager.updateKnobs();
    visualizer.triggerRedraw();
});

document.getElementById('randModsBtn').addEventListener('click', () => {
    const t = tracks[uiManager.getSelectedTrackIndex()];
    if (t.type === 'granular') trackManager.randomizeTrackModulators(t);
    uiManager.updateLfoUI();
});

document.getElementById('resetParamBtn').addEventListener('click', () => {
    const t = tracks[uiManager.getSelectedTrackIndex()];
    if (t.type === 'granular') {
        t.params.position = 0.00; t.params.spray = 0.00; t.params.grainSize = 0.11;
        t.params.density = 3.00; t.params.pitch = 1.00; t.params.relGrain = 0.50;
        t.params.edgeCrunch = 0.0; t.params.orbit = 0.0; // Reset new params
    } else { t.params.drumTune = 0.5; t.params.drumDecay = 0.5; }
    t.params.hpFilter = 20.00; t.params.filter = 20000.00; t.params.volume = 0.80;
    t.lfos.forEach(lfo => { lfo.target = 'none'; });
    uiManager.updateKnobs();
    uiManager.updateLfoUI();
    visualizer.triggerRedraw();
    const btn = document.getElementById('resetParamBtn');
    const originalContent = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-check"></i>';
    btn.classList.add('text-emerald-400', 'border-emerald-500');
    setTimeout(() => { btn.innerHTML = originalContent; btn.classList.remove('text-emerald-400', 'border-emerald-500'); }, 800);
});

// -------------------------------------------------------------------------
// NEW GENERATOR BUTTON LOGIC (REPLACING OLD LISTENERS)
// -------------------------------------------------------------------------

// 1. GRANULAR GENERATORS (Grey Buttons)
document.querySelectorAll('.granular-gen-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        if (!audioEngine.getContext()) return;
        const type = e.target.dataset.type;
        const currentTrackIdx = uiManager.getSelectedTrackIndex();
        const t = tracks[currentTrackIdx];
        t.type = 'granular';
        updateTrackControlsVisibility();
        const newBuf = audioEngine.generateBufferByType(type);
        if (newBuf) {
            t.buffer = newBuf;
            
            // Set customSample with the name so updateCustomTrackHeader displays it
            t.customSample = {
                name: type === 'texture' ? 'FM Texture' : type.toUpperCase(),
                buffer: newBuf,
                duration: newBuf.duration
            };
            
            t.rmsMap = audioEngine.analyzeBuffer(newBuf);
            visualizer.triggerRedraw();
            
            const normalGrp = Math.floor(currentTrackIdx / TRACKS_PER_GROUP);
            const randomChokeInfo = uiManager.getRandomChokeInfo();
            const grp = randomChokeInfo.mode ? randomChokeInfo.groups[currentTrackIdx] : normalGrp;
            const groupColor = `hsl(${grp * 45}, 70%, 50%)`;
            
            uiManager.updateCustomTrackHeader(currentTrackIdx, grp, groupColor);

            const typeLabel = document.getElementById('trackTypeLabel');
            const nameText = document.getElementById('trackNameText');
            
            if (typeLabel) typeLabel.textContent = `[GRANULAR]`; 
            if (nameText) nameText.textContent = type === 'texture' ? 'FM Texture' : type.toUpperCase();
            
            // Feedback
            const originalBg = e.target.style.backgroundColor;
            e.target.style.backgroundColor = '#059669';
            setTimeout(() => { e.target.style.backgroundColor = originalBg; }, 200);
        }
    });
});

// 2. 909 GENERATORS (Orange Buttons)
document.querySelectorAll('.type-909-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        if (!audioEngine.getContext()) return;
        const currentTrackIdx = uiManager.getSelectedTrackIndex();
        const t = tracks[currentTrackIdx];
        
        // Logic combined from old load909Btn and drum-sel-btn
        t.type = 'simple-drum';
        t.customSample = null; // Clear sample to ensure UI knows it's 909
        t.params.drumType = e.target.dataset.drum; // Set specific type
        
        // Defaults if not set (or resets)
        // Note: We might want to keep tuning if already 909, but resets usually expected on type change?
        // Let's reset for fresh sound.
        t.params.drumTune = 0.5; 
        t.params.drumDecay = 0.5;
        
        updateTrackControlsVisibility();
        uiManager.updateKnobs();
        
        const bufCanvas = document.getElementById('bufferDisplay');
        const ctx = bufCanvas.getContext('2d');
        ctx.fillStyle = '#111'; ctx.fillRect(0, 0, bufCanvas.width, bufCanvas.height);
        ctx.font = '10px monospace'; ctx.fillStyle = '#f97316'; ctx.fillText("909 ENGINE ACTIVE", 10, 40);
        
        // Update Header
        const normalGrp = Math.floor(currentTrackIdx / TRACKS_PER_GROUP);
        const randomChokeInfo = uiManager.getRandomChokeInfo();
        const grp = randomChokeInfo.mode ? randomChokeInfo.groups[currentTrackIdx] : normalGrp;
        const groupColor = `hsl(${grp * 45}, 70%, 50%)`;
        uiManager.updateCustomTrackHeader(currentTrackIdx, grp, groupColor);
        
        // Update Labels
        const typeLabel = document.getElementById('trackTypeLabel');
        const nameText = document.getElementById('trackNameText');
        if (typeLabel) typeLabel.textContent = `[909]`;
        let displayName = t.params.drumType.toUpperCase();
        if (displayName === 'CLOSED-HAT') displayName = 'CH';
        if (displayName === 'OPEN-HAT') displayName = 'OH';
        if (nameText) nameText.textContent = displayName;
        
        // Feedback
        const originalBg = e.target.style.backgroundColor;
        e.target.style.backgroundColor = '#ea580c'; // Orange-600
        setTimeout(() => { e.target.style.backgroundColor = originalBg; }, 200);
    });
});

// 3. SAMPLE BUTTON (Blue - SMP)
const btnSMP = document.getElementById('btnSMP');
const sampleInput = document.getElementById('sampleInput');
if (btnSMP && sampleInput) {
    btnSMP.addEventListener('click', () => {
        if (!tracks || tracks.length === 0 || !audioEngine.getContext()) { alert('Init Audio First'); return; }
        sampleInput.click();
    });
    // Sample Input change listener is generic and remains valid
}

// 4. SOURCE BUTTON (Blue - SRC - Freesound)
const btnSRC = document.getElementById('btnSRC');
if (btnSRC) {
    btnSRC.addEventListener('click', () => {
        const currentTrackIdx = uiManager.getSelectedTrackIndex();
        const t = tracks[currentTrackIdx];
        if (uiManager.searchModal) {
            let query = t.type === 'simple-drum' ? (t.params.drumType || "drum") : (t.customSample ? t.customSample.name.replace('.wav', '').replace('.mp3', '') : "drum hit");
            uiManager.searchModal.open(t, query);
        }
    });
}

// 5. AUTO BUTTON (Purple - OTO)
const btnOTO = document.getElementById('btnOTO');
if (btnOTO) {
    btnOTO.addEventListener('click', () => {
        const currentTrackIdx = uiManager.getSelectedTrackIndex();
        const t = tracks[currentTrackIdx];
        t.type = 'automation';
        t.customSample = null;
        t.steps.fill(0);
        const stepElements = uiManager.matrixStepElements[t.id];
        if (stepElements) {
            stepElements.forEach(el => { 
                // BUG FIX: Don't wipe className (which kills grid dividers), simply remove active classes
                el.classList.remove('active', 'vel-1', 'vel-2', 'vel-3', 'auto-level-1', 'auto-level-2', 'auto-level-3', 'auto-level-4', 'auto-level-5');
            });
        }
        updateTrackControlsVisibility();
        const bufCanvas = document.getElementById('bufferDisplay');
        const ctx = bufCanvas.getContext('2d');
        ctx.fillStyle = '#111'; ctx.fillRect(0, 0, bufCanvas.width, bufCanvas.height);
        ctx.font = '10px monospace'; ctx.fillStyle = '#818cf8'; ctx.fillText("AUTOMATION TRACK", 10, 40);
        
        const normalGrp = Math.floor(currentTrackIdx / TRACKS_PER_GROUP);
        const randomChokeInfo = uiManager.getRandomChokeInfo();
        const grp = randomChokeInfo.mode ? randomChokeInfo.groups[currentTrackIdx] : normalGrp;
        const groupColor = `hsl(${grp * 45}, 70%, 50%)`;
        uiManager.updateCustomTrackHeader(currentTrackIdx, grp, groupColor);
        
        const typeLabel = document.getElementById('trackTypeLabel');
        const nameText = document.getElementById('trackNameText');
        if (typeLabel) typeLabel.textContent = `[AUTO]`;
        if (nameText) nameText.textContent = `Automation`;
        
        // Feedback
        const originalBg = btnOTO.style.backgroundColor;
        btnOTO.style.backgroundColor = '#4f46e5';
        setTimeout(() => { btnOTO.style.backgroundColor = originalBg; }, 200);
    });
}

// Existing sample input listener logic (unchanged essentially, just ensuring it updates UI)
if (sampleInput) {
    sampleInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const currentTrack = tracks[uiManager.getSelectedTrackIndex()];
        const btn = btnSMP; // Updated reference
        const originalText = btn.innerHTML;
        try {
            currentTrack.type = 'granular';
            updateTrackControlsVisibility();
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; btn.disabled = true;
            await audioEngine.loadCustomSample(file, currentTrack);
            
            const typeLabel = document.getElementById('trackTypeLabel');
            const nameText = document.getElementById('trackNameText');
            if (typeLabel) typeLabel.textContent = `[SAMPLE]`;
            if (nameText) { 
                nameText.textContent = currentTrack.customSample.name; 
                nameText.title = currentTrack.customSample.name; 
            }
            
            visualizer.triggerRedraw();
            btn.innerHTML = 'SMP'; // Reset text
            btn.classList.add('bg-sky-600');
            setTimeout(() => { btn.classList.remove('bg-sky-600'); btn.disabled = false; }, 1500);
        } catch (err) { alert('Failed: ' + err.message); btn.innerHTML = originalText; btn.disabled = false; }
        e.target.value = '';
    });
}

document.getElementById('clearTrackBtn').addEventListener('click', () => { uiManager.clearTrack(uiManager.getSelectedTrackIndex()); });
document.getElementById('snapshotBtn').addEventListener('click', () => { uiManager.toggleSnapshot(); });
document.getElementById('rndChokeBtn').addEventListener('click', () => { uiManager.toggleRandomChoke(); });

document.getElementById('saveBtn').addEventListener('click', async () => {
    const btn = document.getElementById('saveBtn');
    const originalHtml = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; btn.disabled = true;
    try { await presetManager.savePreset(tracks, scheduler.getBPM()); } catch (e) { alert("Save failed"); }
    finally { btn.innerHTML = originalHtml; btn.disabled = false; }
});

document.getElementById('loadBtn').addEventListener('click', () => { document.getElementById('fileInput').click(); });
document.getElementById('fileInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        audioEngine.onBpmChange = (bpm) => { scheduler.setBPM(bpm); document.getElementById('bpmInput').value = bpm; };
        presetManager.loadPreset(file, tracks, addTrack, (i) => uiManager.updateTrackStateUI(i), uiManager.matrixStepElements, (i) => {
            uiManager.selectTrack(i); visualizer.setSelectedTrackIndex(i); visualizer.triggerRedraw(); updateTrackControlsVisibility();
        }, uiManager.getSelectedTrackIndex(), audioEngine);
    }
    document.getElementById('fileInput').value = '';
});

// --- UPDATED SLIDER LOGIC FOR CONSTRAINED WINDOW BEHAVIOR & MOUSE WHEEL ---
document.querySelectorAll('.param-slider').forEach(el => {
    // 1. Standard Input Event (Drag)
    el.addEventListener('input', e => {
        const t = tracks[uiManager.getSelectedTrackIndex()];
        const param = e.target.dataset.param;
        let value = parseFloat(e.target.value);

        if (param === 'sampleStart') {
            // Constraint: Start cannot be > End
            if (value > t.params.sampleEnd) value = t.params.sampleEnd;
            t.params.sampleStart = value;
            e.target.value = value; // Update slider visual if clamped

            // Push Position if it falls behind Start
            if (t.params.position < value) {
                t.params.position = value;
            }
        } 
        else if (param === 'sampleEnd') {
            // Constraint: End cannot be < Start
            if (value < t.params.sampleStart) value = t.params.sampleStart;
            t.params.sampleEnd = value;
            e.target.value = value; // Update slider visual if clamped

            // Push Position if it goes beyond End
            if (t.params.position > value) {
                t.params.position = value;
            }
        } 
        else if (param === 'position') {
            // Constraint: Position must be within Start/End
            if (value < t.params.sampleStart) value = t.params.sampleStart;
            if (value > t.params.sampleEnd) value = t.params.sampleEnd;
            t.params.position = value;
            e.target.value = value; // Update slider visual
        } 
        else {
            t.params[param] = value;
        }

        uiManager.updateKnobs(); // Updates all knobs, including position/start/end if they were pushed
        if (t.type === 'granular') visualizer.triggerRedraw();
    });

    // 2. Mouse Wheel Fine-Tuning Event
    el.addEventListener('wheel', e => {
        e.preventDefault();
        const t = tracks[uiManager.getSelectedTrackIndex()];
        const param = el.dataset.param;
        const step = parseFloat(el.step) || 0.01;
        // USE THE ACTUAL STEP (0.001) INSTEAD OF /10 TO AVOID SNAPPING ISSUES
        const fineStep = step; 
        
        // Scroll down (positive deltaY) -> decrease value, Scroll up -> increase value
        const delta = e.deltaY > 0 ? -1 : 1; 
        
        // READ FROM PARAMS DIRECTLY (High Precision)
        let currentValue = t.params[param];
        
        let newValue = currentValue + (delta * fineStep);
        
        // Clamp to min/max
        const min = parseFloat(el.min);
        const max = parseFloat(el.max);
        newValue = Math.max(min, Math.min(max, newValue));
        
        // Logic for constraints (mirrored from input event)
        if (param === 'sampleStart') {
             if (newValue > t.params.sampleEnd) newValue = t.params.sampleEnd;
             t.params.sampleStart = newValue;
             if (t.params.position < newValue) t.params.position = newValue;
        } else if (param === 'sampleEnd') {
             if (newValue < t.params.sampleStart) newValue = t.params.sampleStart;
             t.params.sampleEnd = newValue;
             if (t.params.position > newValue) t.params.position = newValue;
        } else if (param === 'position') {
             if (newValue < t.params.sampleStart) newValue = t.params.sampleStart;
             if (newValue > t.params.sampleEnd) newValue = t.params.sampleEnd;
             t.params.position = newValue;
        } else {
             t.params[param] = newValue;
        }
        
        el.value = newValue; // Update visual slider (might snap, but internal params are precise)
        
        uiManager.updateKnobs();
        if (t.type === 'granular') visualizer.triggerRedraw();
        
    }, { passive: false });
});

// Listener for Value Displays to proxy wheel events to sliders
document.querySelectorAll('.value-display').forEach(displayEl => {
    displayEl.addEventListener('wheel', e => {
        e.preventDefault();
        const inputEl = displayEl.previousElementSibling; 
        if (inputEl && inputEl.classList.contains('param-slider')) {
             const newEvent = new WheelEvent('wheel', {
                 deltaY: e.deltaY,
                 bubbles: false,
                 cancelable: true
             });
             inputEl.dispatchEvent(newEvent);
        }
    }, { passive: false });
});

document.querySelectorAll('.lfo-tab').forEach(b => {
    b.addEventListener('click', e => { uiManager.setSelectedLfoIndex(parseInt(e.target.dataset.lfo)); uiManager.updateLfoUI(); });
});

// FIX: Wrap old LFO listeners with existence checks to prevent crashes when new UI is loaded
const lfoTargetEl = document.getElementById('lfoTarget');
if (lfoTargetEl) lfoTargetEl.addEventListener('change', e => { tracks[uiManager.getSelectedTrackIndex()].lfos[uiManager.getSelectedLfoIndex()].target = e.target.value; });

const lfoWaveEl = document.getElementById('lfoWave');
if (lfoWaveEl) lfoWaveEl.addEventListener('change', e => { tracks[uiManager.getSelectedTrackIndex()].lfos[uiManager.getSelectedLfoIndex()].wave = e.target.value; });

const lfoRateEl = document.getElementById('lfoRate');
if (lfoRateEl) lfoRateEl.addEventListener('input', e => { const v = parseFloat(e.target.value); tracks[uiManager.getSelectedTrackIndex()].lfos[uiManager.getSelectedLfoIndex()].rate = v; document.getElementById('lfoRateVal').innerText = v.toFixed(1); });

const lfoAmtEl = document.getElementById('lfoAmt');
if (lfoAmtEl) lfoAmtEl.addEventListener('input', e => { const v = parseFloat(e.target.value); tracks[uiManager.getSelectedTrackIndex()].lfos[uiManager.getSelectedLfoIndex()].amount = v; document.getElementById('lfoAmtVal').innerText = v.toFixed(2); });

uiManager.initUI(addTrack, addGroup, () => { visualizer.setSelectedTrackIndex(uiManager.getSelectedTrackIndex()); visualizer.triggerRedraw(); updateTrackControlsVisibility(); });
window.addEventListener('resize', () => visualizer.resizeCanvas());
visualizer.resizeCanvas();

document.getElementById('saveTrackBtn').addEventListener('click', () => {
    try {
        if (!tracks || tracks.length === 0) { alert('Init Audio First'); return; }
        if (trackLibrary.saveTrack(tracks[uiManager.getSelectedTrackIndex()])) {
            const btn = document.getElementById('saveTrackBtn');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-check mr-1"></i>Saved!'; btn.classList.add('bg-amber-600');
            setTimeout(() => { btn.innerHTML = originalText; btn.classList.remove('bg-amber-600'); }, 1000);
        }
    } catch (error) { alert('Failed: ' + error.message); }
});

document.getElementById('exportCurrentTrackBtn').addEventListener('click', async () => { await trackLibrary.exportTrackToZip(tracks[uiManager.getSelectedTrackIndex()]); });
document.getElementById('loadTrackBtn').addEventListener('click', () => { if (tracks.length > 0) { document.getElementById('trackLibraryModal').classList.remove('hidden'); renderTrackLibrary(); } });

function renderTrackLibrary() {
    const list = document.getElementById('trackLibraryList');
    const tracks = trackLibrary.getSavedTracks();
    const emptyMsg = document.getElementById('emptyLibraryMsg');
    list.innerHTML = '';
    if (tracks.length === 0) { emptyMsg.classList.remove('hidden'); } else {
        emptyMsg.classList.add('hidden');
        tracks.forEach((t, index) => {
            const item = document.createElement('div');
            item.className = 'bg-neutral-800 p-3 rounded hover:bg-neutral-750 border border-neutral-700 flex justify-between items-center group';
            const info = document.createElement('div');
            info.className = 'flex-1 cursor-pointer';
            info.onclick = () => loadTrackFromLibrary(index);
            const name = document.createElement('div');
            name.className = 'font-bold text-sm text-white group-hover:text-emerald-400 transition';
            name.innerText = t.name;
            const date = document.createElement('div');
            date.className = 'text-xs text-neutral-500';
            date.innerText = new Date(t.timestamp).toLocaleString();
            info.appendChild(name); info.appendChild(date);
            const actions = document.createElement('div');
            actions.className = 'flex gap-2 opacity-50 group-hover:opacity-100 transition';
            const delBtn = document.createElement('button');
            delBtn.className = 'text-neutral-400 hover:text-red-500 transition px-2';
            delBtn.innerHTML = '<i class="fas fa-trash"></i>';
            delBtn.onclick = (e) => { e.stopPropagation(); if (confirm('Delete?')) { trackLibrary.deleteTrack(index); renderTrackLibrary(); } };
            const exportBtn = document.createElement('button');
            exportBtn.className = 'text-neutral-400 hover:text-indigo-400 transition px-2';
            exportBtn.innerHTML = '<i class="fas fa-file-export"></i>';
            exportBtn.onclick = (e) => { e.stopPropagation(); trackLibrary.exportTrack(index); };
            actions.appendChild(exportBtn); actions.appendChild(delBtn);
            item.appendChild(info); item.appendChild(actions); list.appendChild(item);
        });
    }
}

document.getElementById('closeLibraryBtn').addEventListener('click', () => { document.getElementById('trackLibraryModal').classList.add('hidden'); });
function loadTrackFromLibrary(index) {
    const currentTrackIdx = uiManager.getSelectedTrackIndex();
    const targetTrack = tracks[currentTrackIdx];
    if (trackLibrary.loadTrackInto(index, targetTrack)) {
        if (targetTrack.needsSampleReload) alert(`Note: Custom sample "${targetTrack.customSample.name}" must be reloaded manually.`);
        uiManager.updateTrackStateUI(currentTrackIdx);
        updateTrackControlsVisibility();
        uiManager.updateKnobs();
        uiManager.updateLfoUI();
        visualizer.triggerRedraw();
        for (let s = 0; s < NUM_STEPS; s++) {
            const btn = uiManager.matrixStepElements[currentTrackIdx][s];
            if (targetTrack.steps[s]) btn.classList.add('active'); else btn.classList.remove('active');
        }
        document.getElementById('trackLibraryModal').classList.add('hidden');
    }
}

document.getElementById('importTrackBtn').addEventListener('click', () => { document.getElementById('importTrackInput').click(); });
document.getElementById('importTrackInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file && (file.name.endsWith('.beattrk') || file.name.endsWith('.zip'))) {
        trackLibrary.importTrackFromZip(file, async (success, trackData, arrayBuffer) => {
            if (success) {
                const currentTrack = tracks[uiManager.getSelectedTrackIndex()];
                const audioCtx = audioEngine.getContext();
                currentTrack.params = { ...currentTrack.params, ...trackData.params };
                currentTrack.steps = [...trackData.steps];
                currentTrack.type = trackData.type || 'granular';
                if (arrayBuffer && audioCtx) {
                    try {
                        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
                        currentTrack.customSample = { name: trackData.sampleName, buffer: audioBuffer, duration: audioBuffer.duration };
                        currentTrack.buffer = audioBuffer;
                        currentTrack.rmsMap = audioEngine.analyzeBuffer(audioBuffer);
                    } catch (err) { console.error(err); }
                }
                updateTrackControlsVisibility();
                uiManager.updateKnobs();
                document.getElementById('trackLibraryModal').classList.add('hidden');
            }
        });
    }
});

const grainMonitorEl = document.getElementById('grainMonitor');
const maxGrainsInput = document.getElementById('maxGrainsInput');
if (maxGrainsInput) {
    maxGrainsInput.addEventListener('change', (e) => {
        let val = parseInt(e.target.value);
        if (isNaN(val) || val < 10) val = 400;
        granularSynth.setMaxGrains(val);
    });
}
setInterval(() => { if (grainMonitorEl) grainMonitorEl.innerText = granularSynth.getActiveGrainCount(); }, 100);