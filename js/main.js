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

// Start Effects Modulation Loop
function startEffectsLoop() {
    const loop = () => {
        if (audioEngine.getContext() && audioEngine.getContext().state === 'running') {
            effectsManager.update(audioEngine.getContext().currentTime);
        }
        requestAnimationFrame(loop);
    };
    loop();
}

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
    effectControls.render();
    startEffectsLoop();

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
        scheduler.start((time, trackId) => visualizer.scheduleVisualDraw(time, trackId));
        document.getElementById('playBtn').classList.add('text-emerald-500');
    }
});

document.getElementById('stopBtn').addEventListener('click', () => {
    scheduler.stop();
    document.getElementById('playBtn').classList.remove('text-emerald-500');
    uiManager.clearPlayheadForStop();
});

// ... rest of event listeners ...
document.getElementById('bpmInput').addEventListener('change', e => { scheduler.setBPM(e.target.value); });
const applyGrooveBtn = document.getElementById('applyGrooveBtn');
if (applyGrooveBtn) applyGrooveBtn.addEventListener('click', () => uiManager.applyGroove());

// ... (Rest of existing main.js logic follows unmodified) ...
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
    const clickX = e.clientX - rect.left;
    const buttonWidth = rect.width;
    const clickRatio = clickX / buttonWidth;
    let releaseMin, releaseMax, zoneName;
    if (clickRatio < 0.2) { releaseMin = 0.01; releaseMax = 0.2; zoneName = 'VERY SHORT'; }
    else if (clickRatio < 0.4) { releaseMin = 0.2; releaseMax = 0.6; zoneName = 'SHORT'; }
    else if (clickRatio < 0.6) { releaseMin = 0.6; releaseMax = 1.2; zoneName = 'MEDIUM'; }
    else if (clickRatio < 0.8) { releaseMin = 1.2; releaseMax = 1.6; zoneName = 'LONG'; }
    else { releaseMin = 1.6; releaseMax = 2.0; zoneName = 'VERY LONG'; }
    const btn = e.currentTarget;
    const originalText = btn.innerHTML;
    btn.innerHTML = `${zoneName} REL`;
    btn.style.transition = 'none';
    btn.style.backgroundColor = '#4f46e5';
    setTimeout(() => {
        btn.style.transition = '';
        btn.style.backgroundColor = '';
        btn.innerHTML = originalText;
    }, 300);
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
    uiManager.updateKnobs();
    uiManager.updateLfoUI();
    visualizer.triggerRedraw();
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

document.querySelectorAll('.sound-gen-btn').forEach(btn => {
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
            t.customSample = null;
            t.rmsMap = audioEngine.analyzeBuffer(newBuf);
            visualizer.triggerRedraw();
            const typeLabel = document.getElementById('trackTypeLabel');
            typeLabel.textContent = type.toUpperCase() + ' (Synth)';
            const originalBg = e.target.style.backgroundColor;
            e.target.style.backgroundColor = '#059669';
            setTimeout(() => { e.target.style.backgroundColor = originalBg; }, 200);
        }
    });
});

document.getElementById('load909Btn').addEventListener('click', () => {
    if (!audioEngine.getContext()) return;
    const t = tracks[uiManager.getSelectedTrackIndex()];
    t.type = 'simple-drum';
    t.params.drumType = 'kick'; t.params.drumTune = 0.5; t.params.drumDecay = 0.5;
    updateTrackControlsVisibility();
    uiManager.updateKnobs();
    const bufCanvas = document.getElementById('bufferDisplay');
    const ctx = bufCanvas.getContext('2d');
    ctx.fillStyle = '#111'; ctx.fillRect(0, 0, bufCanvas.width, bufCanvas.height);
    ctx.font = '10px monospace'; ctx.fillStyle = '#f97316'; ctx.fillText("909 ENGINE ACTIVE", 10, 40);
});

const btnContainer = document.querySelector('.flex.gap-1.ml-2');
if (btnContainer && !document.getElementById('loadAutoBtn')) {
    const autoBtn = document.createElement('button');
    autoBtn.id = 'loadAutoBtn';
    autoBtn.className = 'text-[9px] font-bold bg-indigo-900/30 hover:bg-indigo-800 text-indigo-400 px-2 py-1 rounded transition border border-indigo-900/50';
    autoBtn.title = 'Convert to Automation Track';
    autoBtn.innerText = 'AUTO';
    btnContainer.appendChild(autoBtn);
    autoBtn.addEventListener('click', () => {
        const t = tracks[uiManager.getSelectedTrackIndex()];
        t.type = 'automation';
        t.steps.fill(0);
        const stepElements = uiManager.matrixStepElements[t.id];
        if (stepElements) {
            stepElements.forEach(el => { el.className = 'step-btn'; el.classList.remove('active'); });
        }
        updateTrackControlsVisibility();
        const bufCanvas = document.getElementById('bufferDisplay');
        const ctx = bufCanvas.getContext('2d');
        ctx.fillStyle = '#111'; ctx.fillRect(0, 0, bufCanvas.width, bufCanvas.height);
        ctx.font = '10px monospace'; ctx.fillStyle = '#818cf8'; ctx.fillText("AUTOMATION TRACK", 10, 40);
    });
}

document.querySelectorAll('.drum-sel-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const t = tracks[uiManager.getSelectedTrackIndex()];
        if (t.type === 'simple-drum') {
            t.params.drumType = e.target.dataset.drum;
            updateTrackControlsVisibility();
        }
    });
});

const loadSampleBtnInline = document.getElementById('loadSampleBtnInline');
const sampleInput = document.getElementById('sampleInput');
if (loadSampleBtnInline && sampleInput) {
    loadSampleBtnInline.addEventListener('click', () => {
        if (!tracks || tracks.length === 0 || !audioEngine.getContext()) { alert('Init Audio First'); return; }
        sampleInput.click();
    });
    sampleInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const currentTrack = tracks[uiManager.getSelectedTrackIndex()];
        const btn = loadSampleBtnInline;
        const originalText = btn.innerHTML;
        try {
            currentTrack.type = 'granular';
            updateTrackControlsVisibility();
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; btn.disabled = true;
            await audioEngine.loadCustomSample(file, currentTrack);
            const typeLabel = document.getElementById('trackTypeLabel');
            if (typeLabel) { typeLabel.textContent = currentTrack.customSample.name; typeLabel.title = currentTrack.customSample.name; }
            visualizer.triggerRedraw();
            btn.innerHTML = '<i class="fas fa-check"></i>'; btn.classList.add('bg-sky-600');
            setTimeout(() => { btn.innerHTML = originalText; btn.classList.remove('bg-sky-600'); btn.disabled = false; }, 1500);
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

document.querySelectorAll('.param-slider').forEach(el => {
    el.addEventListener('input', e => {
        const t = tracks[uiManager.getSelectedTrackIndex()];
        t.params[e.target.dataset.param] = parseFloat(e.target.value);
        uiManager.updateKnobs();
        if (t.type === 'granular') visualizer.triggerRedraw();
    });
});

document.querySelectorAll('.lfo-tab').forEach(b => {
    b.addEventListener('click', e => { uiManager.setSelectedLfoIndex(parseInt(e.target.dataset.lfo)); uiManager.updateLfoUI(); });
});

document.getElementById('lfoTarget').addEventListener('change', e => { tracks[uiManager.getSelectedTrackIndex()].lfos[uiManager.getSelectedLfoIndex()].target = e.target.value; });
document.getElementById('lfoWave').addEventListener('change', e => { tracks[uiManager.getSelectedTrackIndex()].lfos[uiManager.getSelectedLfoIndex()].wave = e.target.value; });
document.getElementById('lfoRate').addEventListener('input', e => { const v = parseFloat(e.target.value); tracks[uiManager.getSelectedTrackIndex()].lfos[uiManager.getSelectedLfoIndex()].rate = v; document.getElementById('lfoRateVal').innerText = v.toFixed(1); });
document.getElementById('lfoAmt').addEventListener('input', e => { const v = parseFloat(e.target.value); tracks[uiManager.getSelectedTrackIndex()].lfos[uiManager.getSelectedLfoIndex()].amount = v; document.getElementById('lfoAmtVal').innerText = v.toFixed(2); });

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