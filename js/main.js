// Main Application Entry Point
import { AudioEngine } from './core/AudioEngine.js';
import { GranularSynth } from './core/GranularSynth.js';
import { Scheduler } from './core/Scheduler.js';
import { TrackManager } from './modules/TrackManager.js';
import { PresetManager } from './modules/PresetManager.js';
import { TrackLibrary } from './modules/TrackLibrary.js';
import { UIManager } from './ui/UIManager.js';
import { Visualizer } from './ui/Visualizer.js';
import { LayoutManager } from './ui/LayoutManager.js';
import { TransportBar } from './ui/components/TransportBar.js'; // New Component
import { NUM_LFOS, TRACKS_PER_GROUP, AUTOMATION_INTENSITIES } from './utils/constants.js'; // Added AUTOMATION_INTENSITIES

// --- PHASE 1 INTEGRATION: Import Event System ---
import { globalBus } from './events/EventBus.js';
import { EVENTS } from './events/Events.js';

// Initialize all systems
const audioEngine = new AudioEngine();
const granularSynth = new GranularSynth(audioEngine);
const scheduler = new Scheduler(audioEngine, granularSynth);
const trackManager = new TrackManager(audioEngine);
const presetManager = new PresetManager();
const trackLibrary = new TrackLibrary();
const uiManager = new UIManager();
const visualizer = new Visualizer('visualizer', 'bufferDisplay', audioEngine);
const layoutManager = new LayoutManager();

// --- PHASE 2.3: Initialize Transport ---
const transportBar = new TransportBar(audioEngine);

// Wire up Scheduler dependencies
scheduler.setTrackManager(trackManager);
scheduler.setTracks(trackManager.getTracks());

// Initialize tracks
trackManager.initTracks();
const tracks = trackManager.getTracks();

// Wire up UI/Visualizer dependencies
uiManager.setTracks(tracks);
uiManager.setTrackManager(trackManager); 
visualizer.setTracks(tracks);

// Setup UI callbacks (Legacy connection, could be event-based later)
scheduler.setUpdateMatrixHeadCallback((step, total) => uiManager.updateMatrixHead(step, total));
scheduler.setRandomChokeCallback(() => uiManager.getRandomChokeInfo());

// Helper to refresh UI via UIManager
function updateTrackControlsVisibility() {
    uiManager.updateTrackControlsVisibility();
}

// Override UIManager selectTrack to trigger our visibility update
const originalSelectTrack = uiManager.selectTrack; // No need to bind if we use arrow/closure or if class method is stable
// Actually UIManager doesn't have selectTrack anymore in the refactored version (it delegates), 
// but it DOES have listeners. We rely on the components now.

// Add track functionality
function addTrack() {
    const newId = trackManager.addTrack();
    if (newId !== null) {
        uiManager.appendTrackRow(newId); // UIManager delegates to Grid
        // Visualizer resizing is handled by event listener in Visualizer.js now
    }
}

// Add group functionality
function addGroup() {
    const tracksAdded = [];
    for (let i = 0; i < TRACKS_PER_GROUP; i++) {
        const newId = trackManager.addTrack();
        if (newId !== null) {
            tracksAdded.push(newId);
        }
    }
    tracksAdded.forEach(id => uiManager.appendTrackRow(id));
}

// --- EVENT HANDLERS (Replacing direct DOM listeners) ---

globalBus.on('request:audio_init', async () => {
    await audioEngine.initialize();
    trackManager.createBuffersForAllTracks();
    
    // UI Updates
    visualizer.drawVisuals();
    globalBus.emit(EVENTS.TRACK_SELECTED, 0);
    globalBus.emit(EVENTS.AUDIO_INITIALIZED);
    
    // Force initial LFO UI update via UIManager proxy or direct component access if possible
    // For now, UIManager listens to events and updates its children
    if(uiManager.trackInspector) uiManager.trackInspector.updateUI();
});

globalBus.on('request:playback_toggle', () => {
    if (scheduler.getIsPlaying()) {
        // Scheduler.stop() is called by the PLAYBACK_STOP event listener below? 
        // No, stop() emits the event. We should call logic then emit.
        // Or better: call stop(), which updates state, then emit.
        // Actually, let's keep logic central here for now.
        // But wait, the Play button logic was: if not playing, start. 
        // BeatOS Play button is just Play. Stop is Stop.
        // So this request is actually just "Play".
        if (!scheduler.getIsPlaying()) {
            scheduler.start((time, trackId) => visualizer.scheduleVisualDraw(time, trackId));
            globalBus.emit(EVENTS.PLAYBACK_START);
        }
    } else {
        scheduler.start((time, trackId) => visualizer.scheduleVisualDraw(time, trackId));
        globalBus.emit(EVENTS.PLAYBACK_START);
    }
});

globalBus.on(EVENTS.PLAYBACK_STOP, () => {
    scheduler.stop();
    // uiManager.clearPlayheadForStop() is handled by UIManager listening to this event
});

globalBus.on(EVENTS.BPM_CHANGED, (bpm) => {
    scheduler.setBPM(bpm);
});

// --- Toolbar Request Handlers ---

globalBus.on('request:snapshot_toggle', () => uiManager.toggleSnapshot());
globalBus.on('request:random_choke_toggle', () => uiManager.toggleRandomChoke());

globalBus.on('request:save_track_library', () => {
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

globalBus.on('request:open_track_library', () => {
    if(tracks.length > 0) { 
        document.getElementById('trackLibraryModal').classList.remove('hidden'); 
        renderTrackLibrary(); 
    }
});

globalBus.on('request:export_current_track', async () => {
    await trackLibrary.exportTrackToZip(tracks[uiManager.getSelectedTrackIndex()]);
});

globalBus.on('request:import_track_file', (file) => {
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
            // Notify UI
            globalBus.emit(EVENTS.TRACK_UPDATED, currentTrack.id);
            globalBus.emit(EVENTS.TRACK_SELECTED, currentTrack.id);
            document.getElementById('trackLibraryModal').classList.add('hidden');
        }
     });
});

globalBus.on('request:randomize_all_patterns', () => {
    uiManager.randomizeAllPatterns();
});

globalBus.on('request:randomize_all_params', (intensity) => {
    const zone = AUTOMATION_INTENSITIES[intensity];
    const releaseMin = zone.min;
    const releaseMax = zone.max;
    
    tracks.forEach(t => {
        if(t.ignoreRandom) return;
        if(t.type === 'granular') {
            trackManager.randomizeTrackParams(t, releaseMin, releaseMax);
            trackManager.randomizeTrackModulators(t);
        } else if (t.type === 'simple-drum') {
            t.params.drumTune = Math.random();
            t.params.drumDecay = Math.random();
        }
    });
    
    // Notify UI to update
    globalBus.emit(EVENTS.PARAM_CHANGED);
    globalBus.emit(EVENTS.LFO_CHANGED);
    globalBus.emit(EVENTS.VISUALIZER_UPDATE);
});

globalBus.on('request:clear_current_track', () => {
    uiManager.clearTrack(uiManager.getSelectedTrackIndex());
});

globalBus.on('request:save_project', async () => {
    const btn = document.getElementById('saveBtn');
    const originalHtml = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; btn.disabled = true;
    try { await presetManager.savePreset(tracks, scheduler.getBPM()); } catch (e) { alert("Save failed"); } 
    finally { btn.innerHTML = originalHtml; btn.disabled = false; }
});

globalBus.on('request:load_project', (file) => {
    audioEngine.onBpmChange = (bpm) => { 
        scheduler.setBPM(bpm); 
        globalBus.emit(EVENTS.BPM_CHANGED, bpm);
    };
    presetManager.loadPreset(file, tracks, addTrack, 
        (i) => uiManager.updateTrackStateUI(i), // Callback for track state
        uiManager.sequencerGrid ? uiManager.sequencerGrid.matrixStepElements : [], // Step elements (legacy param)
        (i) => {
            // Callback after load
            globalBus.emit(EVENTS.TRACK_SELECTED, i);
            if(uiManager.sequencerGrid) uiManager.sequencerGrid.refreshGridState();
        }, 
        uiManager.getSelectedTrackIndex(), 
        audioEngine
    );
});

// --- Track Library UI Logic (Keeping here as it's modal logic, or move to LibraryComponent later) ---
function renderTrackLibrary() {
    const list = document.getElementById('trackLibraryList');
    const tracksList = trackLibrary.getSavedTracks();
    const emptyMsg = document.getElementById('emptyLibraryMsg');
    list.innerHTML = '';
    if (tracksList.length === 0) { emptyMsg.classList.remove('hidden'); } else {
        emptyMsg.classList.add('hidden');
        tracksList.forEach((t, index) => {
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
            delBtn.onclick = (e) => { e.stopPropagation(); if(confirm('Delete?')) { trackLibrary.deleteTrack(index); renderTrackLibrary(); } };
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
        globalBus.emit(EVENTS.TRACK_SELECTED, currentTrackIdx);
        
        // Refresh grid
        if(uiManager.sequencerGrid) uiManager.sequencerGrid.refreshTrackRow(currentTrackIdx);
        
        document.getElementById('trackLibraryModal').classList.add('hidden');
    }
}

// Grain Monitor
const grainMonitorEl = document.getElementById('grainMonitor');
const maxGrainsInput = document.getElementById('maxGrainsInput');
if(maxGrainsInput) {
    maxGrainsInput.addEventListener('change', (e) => {
        let val = parseInt(e.target.value);
        if(isNaN(val) || val < 10) val = 400;
        granularSynth.setMaxGrains(val);
    });
}
setInterval(() => { if (grainMonitorEl) grainMonitorEl.innerText = granularSynth.getActiveGrainCount(); }, 100);

// Start
uiManager.initUI(addTrack, addGroup);
window.addEventListener('resize', () => visualizer.resizeCanvas());
visualizer.resizeCanvas();