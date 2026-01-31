import { AudioEngine } from './core/AudioEngine.js';
import { GranularSynthWorklet } from './core/GranularSynthWorklet.js';
import { Scheduler } from './core/Scheduler.js';
import { TrackManager } from './modules/TrackManager.js';
import { PresetManager } from './modules/PresetManager.js';
import { TrackLibrary } from './modules/TrackLibrary.js';
import { UIManager } from './ui/UIManager.js';
import { Visualizer } from './ui/Visualizer.js';
import { VisualDispatcher } from './ui/VisualDispatcher.js';
import { transport } from './core/Transport.js';
import { AudioWorkletMonitor } from './ui/AudioWorkletMonitor.js';
import { TRACKS_PER_GROUP, NUM_STEPS } from './utils/constants.js';

// 1. Core Services & Engines
const audioEngine = new AudioEngine();
const granularSynth = new GranularSynthWorklet(audioEngine);
const scheduler = new Scheduler(audioEngine, granularSynth);
const visualDispatcher = new VisualDispatcher(audioEngine);

// 2. State & Data Modules
const trackManager = new TrackManager(audioEngine);
const presetManager = new PresetManager();
const trackLibrary = new TrackLibrary();
const uiManager = new UIManager();
const visualizer = new Visualizer('visualizer', 'bufferDisplay', audioEngine);

let workletMonitor = null;

// 3. Dependency Injection & Configuration
scheduler.setTracks(trackManager.getTracks());
uiManager.setTracks(trackManager.getTracks());
uiManager.setTrackManager(trackManager);
visualizer.setTracks(trackManager.getTracks());

// Helper to update UI visibility states
function updateTrackControlsVisibility() {
    uiManager.updateTrackControlsVisibility();
}

// 4. Track Management Functions
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
        if (newId !== null) tracksAdded.push(newId);
    }
    tracksAdded.forEach(id => uiManager.appendTrackRow(id, () => {
        visualizer.setSelectedTrackIndex(uiManager.getSelectedTrackIndex());
        visualizer.drawBufferDisplay();
        updateTrackControlsVisibility();
    }));
    if (tracksAdded.length > 0) visualizer.resizeCanvas();
}

// 5. Global Initialization
document.getElementById('initAudioBtn').addEventListener('click', async () => {
    await audioEngine.initialize();
    await granularSynth.init();
    
    // Performance Monitor
    workletMonitor = new AudioWorkletMonitor(granularSynth);
    
    // Start visual monitor for sample-accurate UI feedback
    visualDispatcher.start();
    
    trackManager.initTracks();
    trackManager.createBuffersForAllTracks(); // Ensure initial buffers are generated
    
    document.getElementById('startOverlay').classList.add('hidden');
    
    // Initial UI selection
    uiManager.selectTrack(0, () => {
        visualizer.setSelectedTrackIndex(0);
        visualizer.drawBufferDisplay();
    });
    
    visualizer.drawVisuals();
    uiManager.updateLfoUI();
});

// 6. Transport Listeners
document.getElementById('playBtn').addEventListener('click', () => {
    if (!audioEngine.getContext()) return;
    scheduler.start();
    document.getElementById('playBtn').classList.add('text-emerald-500');
});

document.getElementById('stopBtn').addEventListener('click', () => {
    scheduler.stop();
    visualDispatcher.stop();
    document.getElementById('playBtn').classList.remove('text-emerald-500');
    uiManager.clearPlayheadForStop();
});

document.getElementById('bpmInput').addEventListener('change', e => {
    transport.setBPM(e.target.value);
});

// 7. Visualization & Scope Controls
document.getElementById('scopeBtnWave').addEventListener('click', (e) => {
    visualizer.setScopeMode('wave');
    e.target.classList.add('bg-neutral-600', 'text-white', 'rounded-sm');
    document.getElementById('scopeBtnSpec').classList.remove('bg-neutral-600', 'text-white', 'rounded-sm');
});

document.getElementById('scopeBtnSpec').addEventListener('click', (e) => {
    visualizer.setScopeMode('spectrum');
    e.target.classList.add('bg-neutral-600', 'text-white', 'rounded-sm');
    document.getElementById('scopeBtnWave').classList.remove('bg-neutral-600', 'text-white', 'rounded-sm');
});

document.getElementById('scopeBtnTrim').addEventListener('click', (e) => {
    const track = trackManager.getTracks()[uiManager.getSelectedTrackIndex()];
    if (!track || !track.buffer) return;
    
    const newBuffer = audioEngine.trimBuffer(track.buffer, 0.005, true);
    if (newBuffer) {
        track.buffer = newBuffer;
        track.rmsMap = audioEngine.analyzeBuffer(newBuffer);
        visualizer.drawBufferDisplay();
    }
});

// 8. Randomization & Groove Handlers
document.getElementById('randomizeAllPatternsBtn').addEventListener('click', () => {
    uiManager.randomizeAllPatterns();
});

document.getElementById('randAllParamsBtn').addEventListener('click', (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickRatio = (e.clientX - rect.left) / rect.width;
    
    let releaseMin, releaseMax;
    if (clickRatio < 0.2) { releaseMin = 0.01; releaseMax = 0.2; }
    else if (clickRatio < 0.4) { releaseMin = 0.2; releaseMax = 0.6; }
    else if (clickRatio < 0.6) { releaseMin = 0.6; releaseMax = 1.2; }
    else if (clickRatio < 0.8) { releaseMin = 1.2; releaseMax = 1.6; }
    else { releaseMin = 1.6; releaseMax = 2.0; }

    trackManager.getTracks().forEach(t => {
        if (t.ignoreRandom || t.type === 'automation') return;
        trackManager.randomizeTrackParams(t, releaseMin, releaseMax);
        trackManager.randomizeTrackModulators(t);
    });
    
    uiManager.updateKnobs();
    uiManager.updateLfoUI();
    visualizer.drawBufferDisplay();
});

document.getElementById('randPanBtn').addEventListener('click', () => {
    trackManager.randomizePanning();
    uiManager.savePanBaseline();
    document.getElementById('panShiftSlider').value = 0;
    document.getElementById('panShiftValue').innerText = '0%';
});

// 9. Project & Track Library Handlers
document.getElementById('saveBtn').addEventListener('click', async () => {
    await presetManager.savePreset(trackManager.getTracks(), transport.bpm);
});

document.getElementById('loadBtn').addEventListener('click', () => {
    document.getElementById('fileInput').click();
});

document.getElementById('fileInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        presetManager.loadPreset(file, trackManager.getTracks(), addTrack, 
            (i) => uiManager.updateTrackStateUI(i), 
            uiManager.matrixStepElements, 
            (i) => uiManager.selectTrack(i), 
            uiManager.getSelectedTrackIndex(), 
            audioEngine
        );
    }
});

document.getElementById('saveTrackBtn').addEventListener('click', () => {
    trackLibrary.saveTrack(trackManager.getTracks()[uiManager.getSelectedTrackIndex()]);
});

document.getElementById('loadTrackBtn').addEventListener('click', () => {
    document.getElementById('trackLibraryModal').classList.remove('hidden');
    // Logic for rendering library would go here or inside UIManager
});

document.getElementById('exportCurrentTrackBtn').addEventListener('click', async () => {
    await trackLibrary.exportTrackToZip(trackManager.getTracks()[uiManager.getSelectedTrackIndex()]);
});

// 10. Manual UI Wiring (Sliders & Toggles)
document.getElementById('panShiftSlider').addEventListener('input', (e) => {
    uiManager.applyPanShift(parseFloat(e.target.value));
    document.getElementById('panShiftValue').innerText = Math.round(e.target.value * 100) + '%';
});

document.getElementById('clearTrackBtn').addEventListener('click', () => uiManager.clearTrack(uiManager.getSelectedTrackIndex()));
document.getElementById('snapshotBtn').addEventListener('click', () => uiManager.toggleSnapshot());
document.getElementById('rndChokeBtn').addEventListener('click', () => uiManager.toggleRandomChoke());

// Initialize the UI components (Grid, Panels)
uiManager.initUI(addTrack, addGroup, () => {
    visualizer.setSelectedTrackIndex(uiManager.getSelectedTrackIndex());
    visualizer.drawBufferDisplay();
    updateTrackControlsVisibility();
});

// Grain monitor for debugging
setInterval(() => {
    const monitor = document.getElementById('grainMonitor');
    if (monitor) monitor.innerText = granularSynth.getActiveGrainCount();
}, 100);

window.addEventListener('resize', () => visualizer.resizeCanvas());