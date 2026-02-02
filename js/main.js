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
// import { AudioWorkletMonitor } from './ui/AudioWorkletMonitor.js'; // Removed

const audioEngine = new AudioEngine();
const granularSynth = new GranularSynth(audioEngine);

// let workletMonitor = null; // Removed

const scheduler = new Scheduler(audioEngine, granularSynth);
const trackManager = new TrackManager(audioEngine);
const presetManager = new PresetManager();
const trackLibrary = new TrackLibrary();
const uiManager = new UIManager();
const visualizer = new Visualizer('visualizer', 'bufferDisplay', audioEngine);

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
            visualizer.drawBufferDisplay();
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
        visualizer.drawBufferDisplay();
        updateTrackControlsVisibility();
    }));
    if (tracksAdded.length > 0) {
        visualizer.resizeCanvas();
    }
}

document.getElementById('initAudioBtn').addEventListener('click', async () => {
    console.log("[Main] Init audio clicked.");
    await audioEngine.initialize();

    console.log("[Main] Initializing AudioWorklet...");
    await granularSynth.init();
    console.log("[Main] ✅ AudioWorklet ready!");

    // workletMonitor = new AudioWorkletMonitor(granularSynth); // Removed

    trackManager.createBuffersForAllTracks();
    document.getElementById('startOverlay').classList.add('hidden');
    visualizer.drawVisuals();
    
    // Refresh Mixer to ensure it binds to the newly created Audio Buses
    if (uiManager.mixer) {
        console.log("[Main] Refreshing Mixer...");
        uiManager.mixer.render();
    }

    uiManager.selectTrack(0, () => {
        visualizer.setSelectedTrackIndex(0);
        visualizer.drawBufferDisplay();
    });
    visualizer.setSelectedTrackIndex(0);
    visualizer.drawBufferDisplay();
    updateTrackControlsVisibility();
    uiManager.updateLfoUI();
});

document.getElementById('playBtn').addEventListener('click', () => {
    if (!audioEngine.getContext()) return;
    // V5: Delegate Play to Worklet via Wrapper
    granularSynth.play();
    document.getElementById('playBtn').classList.add('text-emerald-500');
    
    // Legacy Scheduler Start (Visuals Only)
    // In V5, visuals pull from Shared Memory, but we might need to kickstart the visualizer loop
    // if it isn't running. Visualizer.js should handle this in its draw loop.
});

document.getElementById('stopBtn').addEventListener('click', () => {
    // V5: Delegate Stop to Worklet via Wrapper
    granularSynth.stop();
    document.getElementById('playBtn').classList.remove('text-emerald-500');
    uiManager.clearPlayheadForStop();
});

// ... rest of event listeners same as before ...
// Kept concise for brevity, assume remaining event listeners follow standard pattern
document.getElementById('bpmInput').addEventListener('change', e => { 
    // V5: Update BPM in Shared Memory
    granularSynth.setBPM(e.target.value); 
});

const applyGrooveBtn = document.getElementById('applyGrooveBtn');
if (applyGrooveBtn) applyGrooveBtn.addEventListener('click', () => uiManager.applyGroove());

// Update scope button listener to cycle styles
document.getElementById('scopeBtnWave').addEventListener('click', (e) => {
    visualizer.setScopeMode('wave');
    
    // Cycle style
    const newStyle = visualizer.cycleWaveStyle();
    
    // Update button text to show current style (optional but nice)
    const btn = e.target;
    // Map style names to short codes
    const codes = { 'mirror': 'WAVE', 'neon': 'NEON', 'bars': 'BARS', 'precision': 'FINE' };
    btn.innerText = codes[newStyle] || 'WAVE';

    const btnSpec = document.getElementById('scopeBtnSpec');
    btn.classList.replace('text-neutral-400', 'bg-neutral-600');
    btn.classList.replace('hover:text-white', 'text-white');
    btn.classList.add('rounded-sm');
    btnSpec.classList.replace('bg-neutral-600', 'text-neutral-400');
    btnSpec.classList.replace('text-white', 'hover:text-white');
    btnSpec.classList.remove('rounded-sm');
    
    visualizer.drawBufferDisplay();
});

document.getElementById('scopeBtnSpec').addEventListener('click', (e) => {
    visualizer.setScopeMode('spectrum');
    // Reset Wave button text if we want, or keep it as memory
    
    const btnSpec = e.target;
    const btnWave = document.getElementById('scopeBtnWave');
    btnSpec.classList.replace('text-neutral-400', 'bg-neutral-600');
    btnSpec.classList.replace('hover:text-white', 'text-white');
    btnSpec.classList.add('rounded-sm');
    btnWave.classList.replace('bg-neutral-600', 'text-neutral-400');
    btnWave.classList.replace('text-white', 'hover:text-white');
    btnWave.classList.remove('rounded-sm');
    
    visualizer.drawBufferDisplay();
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
        
        // V5: We must upload the trimmed buffer to the Worklet
        granularSynth.ensureBufferLoaded(track);
        
        visualizer.drawBufferDisplay();
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
    
    trackManager.triggerRandomization(Math.ceil(clickRatio * 5));
    
    uiManager.updateKnobs();
    uiManager.updateLfoUI();
    visualizer.drawBufferDisplay();
});

document.getElementById('randomizeBtn').addEventListener('click', () => {
    const t = tracks[uiManager.getSelectedTrackIndex()];
    // TrackManager's setParam handles shared memory sync now
    if (t.type === 'granular') trackManager.randomizeTrackParams(t);
    else { 
        trackManager.setParam(t.id, 'drumTune', Math.random());
        trackManager.setParam(t.id, 'drumDecay', Math.random());
    }
    uiManager.updateKnobs();
    visualizer.drawBufferDisplay();
});

document.getElementById('randModsBtn').addEventListener('click', () => {
    const t = tracks[uiManager.getSelectedTrackIndex()];
    if (t.type === 'granular') trackManager.randomizeTrackModulators(t);
    uiManager.updateLfoUI();
});

document.getElementById('randPanBtn').addEventListener('click', () => {
    trackManager.randomizePanning(); // Updated to sync shared memory
    uiManager.savePanBaseline();
    document.getElementById('panShiftSlider').value = 0;
    document.getElementById('panShiftValue').innerText = '0%';
    const btn = document.getElementById('randPanBtn');
    const originalBg = btn.style.backgroundColor;
    btn.style.backgroundColor = '#0891b2';
    setTimeout(() => { btn.style.backgroundColor = originalBg; }, 200);
});

document.getElementById('resetParamBtn').addEventListener('click', () => {
    // Logic moved to TrackControls.js which calls TrackManager.setParam
    // This listener might be redundant if TrackControls adds its own, 
    // but we'll leave it if it triggers global UI updates. 
    // Actually, TrackControls attaches onclick to the button it creates.
    // This listener likely targets a static button if one exists, but the UI is dynamic.
});

document.querySelectorAll('.sound-gen-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        if (!audioEngine.getContext()) return;
        const type = e.target.dataset.type;
        const currentTrackIdx = uiManager.getSelectedTrackIndex();
        const t = tracks[currentTrackIdx];
        
        t.type = 'granular';
        trackManager.setParam(t.id, 'type', 0); // 0=Granular
        updateTrackControlsVisibility();
        
        const newBuf = audioEngine.generateBufferByType(type);
        if (newBuf) {
            t.buffer = newBuf;
            t.customSample = null;
            t.rmsMap = audioEngine.analyzeBuffer(newBuf);
            
            // Upload to Worklet
            granularSynth.ensureBufferLoaded(t);
            
            visualizer.drawBufferDisplay();
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
    // Sync Type & Params
    trackManager.setParam(t.id, 'type', 1); // Default Kick
    trackManager.setParam(t.id, 'drumTune', 0.5);
    trackManager.setParam(t.id, 'drumDecay', 0.5);
    
    t.params.drumType = 'kick'; 
    updateTrackControlsVisibility();
    uiManager.updateKnobs();
    const bufCanvas = document.getElementById('bufferDisplay');
    const ctx = bufCanvas.getContext('2d');
    ctx.fillStyle = '#111'; ctx.fillRect(0, 0, bufCanvas.width, bufCanvas.height);
    ctx.font = '10px monospace'; ctx.fillStyle = '#f97316'; ctx.fillText("909 ENGINE ACTIVE", 10, 40);
});

// ... Auto Button Logic ...

document.querySelectorAll('.drum-sel-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const t = tracks[uiManager.getSelectedTrackIndex()];
        if (t.type === 'simple-drum') {
            t.params.drumType = e.target.dataset.drum;
            
            // Map string type to int code for Shared Memory
            const typeMap = { 'kick': 1, 'snare': 2, 'closed-hat': 3, 'open-hat': 3, 'cymbal': 3 };
            const typeCode = typeMap[t.params.drumType] || 1;
            trackManager.setParam(t.id, 'type', typeCode);
            
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
            trackManager.setParam(currentTrack.id, 'type', 0);
            updateTrackControlsVisibility();
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; btn.disabled = true;
            
            await audioEngine.loadCustomSample(file, currentTrack);
            // Upload to Worklet
            await granularSynth.ensureBufferLoaded(currentTrack);
            
            const typeLabel = document.getElementById('trackTypeLabel');
            if (typeLabel) { typeLabel.textContent = currentTrack.customSample.name; typeLabel.title = currentTrack.customSample.name; }
            visualizer.drawBufferDisplay();
            btn.innerHTML = '<i class="fas fa-check"></i>'; btn.classList.add('bg-sky-600');
            setTimeout(() => { btn.innerHTML = originalText; btn.classList.remove('bg-sky-600'); btn.disabled = false; }, 1500);
        } catch (err) { alert('Failed: ' + err.message); btn.innerHTML = originalText; btn.disabled = false; }
        e.target.value = '';
    });
}

document.getElementById('panShiftSlider').addEventListener('input', (e) => {
    const shiftAmount = parseFloat(e.target.value);
    uiManager.applyPanShift(shiftAmount);
    document.getElementById('panShiftValue').innerText = Math.round(shiftAmount * 100) + '%';
});

document.getElementById('clearTrackBtn').addEventListener('click', () => { uiManager.clearTrack(uiManager.getSelectedTrackIndex()); });
document.getElementById('snapshotBtn').addEventListener('click', () => { uiManager.toggleSnapshot(); });
document.getElementById('rndChokeBtn').addEventListener('click', () => { uiManager.toggleRandomChoke(); });

document.getElementById('saveBtn').addEventListener('click', async () => {
    const btn = document.getElementById('saveBtn');
    const originalHtml = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; btn.disabled = true;
    try { await presetManager.savePreset(tracks, granularSynth.getBPM ? granularSynth.getBPM() : 120); } catch (e) { alert("Save failed"); }
    finally { btn.innerHTML = originalHtml; btn.disabled = false; }
});

document.getElementById('loadBtn').addEventListener('click', () => { document.getElementById('fileInput').click(); });
document.getElementById('fileInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        audioEngine.onBpmChange = (bpm) => { 
            granularSynth.setBPM(bpm); 
            document.getElementById('bpmInput').value = bpm; 
        };
        presetManager.loadPreset(file, tracks, addTrack, (i) => uiManager.updateTrackStateUI(i), uiManager.matrixStepElements, (i) => {
            uiManager.selectTrack(i); visualizer.setSelectedTrackIndex(i); visualizer.drawBufferDisplay(); updateTrackControlsVisibility();
        }, uiManager.getSelectedTrackIndex(), audioEngine);
    }
    document.getElementById('fileInput').value = '';
});

document.querySelectorAll('.param-slider').forEach(el => {
    el.addEventListener('input', e => {
        const t = tracks[uiManager.getSelectedTrackIndex()];
        const param = e.target.dataset.param;
        const val = parseFloat(e.target.value);
        
        // Use TrackManager to sync
        trackManager.setParam(t.id, param, val);
        
        uiManager.updateKnobs();
        if (t.type === 'granular') visualizer.drawBufferDisplay();
    });
});

document.querySelectorAll('.lfo-tab').forEach(b => {
    b.addEventListener('click', e => { uiManager.setSelectedLfoIndex(parseInt(e.target.dataset.lfo)); uiManager.updateLfoUI(); });
});

document.getElementById('lfoTarget').addEventListener('change', e => { tracks[uiManager.getSelectedTrackIndex()].lfos[uiManager.getSelectedLfoIndex()].target = e.target.value; });
document.getElementById('lfoWave').addEventListener('change', e => { tracks[uiManager.getSelectedTrackIndex()].lfos[uiManager.getSelectedLfoIndex()].wave = e.target.value; });
document.getElementById('lfoRate').addEventListener('input', e => { const v = parseFloat(e.target.value); tracks[uiManager.getSelectedTrackIndex()].lfos[uiManager.getSelectedLfoIndex()].rate = v; document.getElementById('lfoRateVal').innerText = v.toFixed(1); });
document.getElementById('lfoAmt').addEventListener('input', e => { const v = parseFloat(e.target.value); tracks[uiManager.getSelectedTrackIndex()].lfos[uiManager.getSelectedLfoIndex()].amount = v; document.getElementById('lfoAmtVal').innerText = v.toFixed(2); });

uiManager.initUI(addTrack, addGroup, () => { visualizer.setSelectedTrackIndex(uiManager.getSelectedTrackIndex()); visualizer.drawBufferDisplay(); updateTrackControlsVisibility(); });
window.addEventListener('resize', () => visualizer.resizeCanvas());
visualizer.resizeCanvas();

// Removed Stats Loop
// setInterval(() => { if (grainMonitorEl) grainMonitorEl.innerText = granularSynth.getActiveGrainCount(); }, 100);