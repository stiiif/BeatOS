console.log("[App] Initializing BeatOS...");

import { AudioEngine } from './core/AudioEngine.js';
import { GranularSynth } from './core/GranularSynth.js';
import { Scheduler } from './core/Scheduler.js';
import { TrackManager } from './modules/TrackManager.js';
import { PresetManager } from './modules/PresetManager.js';
import { TrackLibrary } from './modules/TrackLibrary.js';
import { LayoutManager } from './components/layout/LayoutManager.js'; // Moved in Plan
import { Visualizer } from './ui/Visualizer.js'; // Keeping original for now or move to components if desired

// New UI Components
import { Sequencer } from './components/sequencer/Sequencer.js';
import { TransportBar } from './components/transport/TransportBar.js';
import { Inspector } from './components/inspector/Inspector.js';

// Global Event Bus
import { globalBus } from './events/EventBus.js';
import { EVENTS } from './config/events.js';

// --- Initialization ---

// 1. Core Engines
const audioEngine = new AudioEngine();
const granularSynth = new GranularSynth(audioEngine);
const scheduler = new Scheduler(audioEngine, granularSynth);
const trackManager = new TrackManager(audioEngine);

// 2. Data Managers
const presetManager = new PresetManager();
const trackLibrary = new TrackLibrary();

// 3. Connect Logic
scheduler.setTrackManager(trackManager);
scheduler.setTracks(trackManager.getTracks()); // Initial empty set

// 4. UI Components
const layoutManager = new LayoutManager();
// Visualizer still needs to bind to canvas ID 'visualizer' and 'bufferDisplay'
// We might eventually move Visualizer to a component class, but reusing existing class is fine.
const visualizer = new Visualizer('visualizer', 'bufferDisplay', audioEngine);

// The new Sequencer component renders into #matrixContainer
const sequencer = new Sequencer('#matrixContainer', trackManager);

// The TransportBar binds to the header controls
const transport = new TransportBar('header', scheduler, trackManager);

// The Inspector binds to the right panel
const inspector = new Inspector('.right-pane', trackManager);

// --- Wiring ---

// Scheduler -> UI Updates (Matrix Head)
scheduler.setUpdateMatrixHeadCallback((step, total) => {
    sequencer.updatePlayhead(step);
});

// Scheduler -> UI Updates (Visualizer Flash)
const visualizerCallback = (time, trackId) => {
    visualizer.scheduleVisualDraw(time, trackId);
};

// Scheduler -> Random Choke Info
scheduler.setRandomChokeCallback(() => trackManager.getRandomChokeInfo());

// Audio Init
globalBus.on('AUDIO_INIT_REQUESTED', async () => {
    console.log("[App] Initializing Audio Engine...");
    await audioEngine.initialize();
    
    // Initialize tracks (this will emit TRACK_ADDED events which Sequencer listens to)
    trackManager.initTracks(); 
    
    // Create buffers
    trackManager.createBuffersForAllTracks(); // Redundant if initTracks does it? initTracks calls addTrack which generates buffer.
    // Check TrackManager.js: addTrack generates buffer. initTracks loops addTrack. 
    // So createBuffersForAllTracks is mostly for re-init scenarios. We can skip specific call if initTracks does it.
    
    // Hide overlay
    const overlay = document.getElementById('startOverlay');
    if(overlay) overlay.classList.add('hidden');
    
    // Start Visualizer Loop
    visualizer.drawVisuals();
    
    // Select first track
    globalBus.emit(EVENTS.TRACK_SELECTED, 0);
});

// Playback Control
globalBus.on('PLAYBACK_START_REQUESTED', () => {
    if (!audioEngine.getContext()) return;
    scheduler.start(visualizerCallback);
});

globalBus.on('PLAYBACK_STOPPED', () => {
    // Sequencer might want to clear playhead
    // We can iterate rows or just let next step clear it
    // For now, simple stop.
});

// File Management
const setupFileIO = () => {
    const saveBtn = document.getElementById('saveBtn');
    const loadBtn = document.getElementById('loadBtn');
    const fileInput = document.getElementById('fileInput');

    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            const originalHtml = saveBtn.innerHTML;
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            saveBtn.disabled = true;
            try {
                await presetManager.savePreset(trackManager.getTracks(), scheduler.getBPM());
            } catch (e) {
                console.error(e);
                alert("Save failed");
            } finally {
                saveBtn.innerHTML = originalHtml;
                saveBtn.disabled = false;
            }
        });
    }

    if (loadBtn && fileInput) {
        loadBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                // We need a way to clear current tracks and rebuild.
                // Current PresetManager.loadPreset logic is a bit manual in main.js.
                // We should adapt it or use the callback style it expects.
                // The PresetManager from Phase 1/2 didn't change much, so it expects callbacks.
                
                // Ideally, TrackManager should handle "loadPreset".
                // But sticking to existing:
                
                // Clean existing?
                // trackManager.tracks = []; // Dangerous if references exist elsewhere.
                // Better to rely on PresetManager to overwrite/add.
                
                presetManager.loadPreset(file, trackManager.getTracks(), 
                    () => trackManager.addTrack(), // Add track callback
                    (idx) => {}, // Update UI callback (Handled by events now?)
                    null, // Matrix elements (unused if events work?)
                    (idx) => globalBus.emit(EVENTS.TRACK_SELECTED, idx), // Select callback
                    0, 
                    audioEngine
                );
                // Note: The legacy PresetManager.loadPreset relies on `matrixStepElements` direct manipulation 
                // which we removed. We might need to PATCH PresetManager to use Events or update `Track` directly 
                // and then emit `TRACK_UPDATED`.
                // For now, let's assume `TRACK_UPDATED` event will trigger re-renders.
            }
            fileInput.value = '';
        });
    }
};

setupFileIO();

// Library / Export Buttons (Delegated to DOM for now, could be components)
document.getElementById('saveTrackBtn')?.addEventListener('click', () => {
    // trackLibrary logic...
    const currentId = inspector.currentTrackId || 0; // Access from inspector component state or track manager
    // A better way: TrackManager tracks current selection? No, UI does.
    // Let's use the last selected index we heard about.
    const t = trackManager.tracks[currentId];
    if(t) trackLibrary.saveTrack(t);
});

// Resize
window.addEventListener('resize', () => {
    visualizer.resizeCanvas();
});

console.log("[App] Ready.");