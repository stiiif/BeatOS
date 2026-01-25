import { appStore } from './state/Store.js';
import { ACTIONS } from './state/Actions.js';
import { AudioEngine } from './core/AudioEngine.js';
import { Scheduler } from './core/Scheduler.js';
import { GranularSynth } from './core/GranularSynth.js';

// Import Components to register them
import './components/BaseComponent.js';
import './components/TrackRow.js';
import './components/SequencerSteps.js';
import './components/ParameterKnob.js';
import './components/TrackControls.js';
import './components/AudioVisualizer.js';

// Services/Utilities
import { TRACKS_PER_GROUP } from './utils/constants.js';

async function init() {
    console.log("[Main] Initializing BeatOS...");

    // 1. Initialize Audio Engine
    const audioEngine = new AudioEngine();
    await audioEngine.initialize();

    // 2. Initialize Synth & Scheduler
    const granularSynth = new GranularSynth(audioEngine);
    const scheduler = new Scheduler(audioEngine, granularSynth);

    // 3. Bind Global Controls (Play/Stop/BPM)
    const playBtn = document.getElementById('playBtn');
    const stopBtn = document.getElementById('stopBtn');
    const bpmInput = document.getElementById('bpmInput');
    const initAudioBtn = document.getElementById('initAudioBtn');
    const startOverlay = document.getElementById('startOverlay');

    // Subscribe to playback state to update UI
    appStore.on('STATE_CHANGED:isPlaying', ({ value }) => {
        if (value) {
            playBtn.classList.add('text-emerald-500');
        } else {
            playBtn.classList.remove('text-emerald-500');
        }
    });

    // Subscribe to BPM changes
    appStore.on('STATE_CHANGED:bpm', ({ value }) => {
        bpmInput.value = value;
        scheduler.setBPM(value); // Sync scheduler immediately
    });

    // Event Listeners
    playBtn.addEventListener('click', () => {
        if (audioEngine.getContext().state === 'suspended') {
            audioEngine.resume();
        }
        scheduler.start();
    });

    stopBtn.addEventListener('click', () => {
        scheduler.stop();
    });

    bpmInput.addEventListener('change', (e) => {
        const val = parseInt(e.target.value);
        appStore.dispatch(ACTIONS.UPDATE_BPM, { bpm: val });
    });

    // Add Track / Group Buttons
    const addTrackBtn = document.getElementById('addTrackBtn');
    const addGroupBtn = document.getElementById('addGroupBtn');

    if (addTrackBtn) {
        addTrackBtn.addEventListener('click', () => {
            appStore.dispatch(ACTIONS.ADD_TRACK);
        });
    }

    if (addGroupBtn) {
        addGroupBtn.addEventListener('click', () => {
            for (let i = 0; i < TRACKS_PER_GROUP; i++) {
                appStore.dispatch(ACTIONS.ADD_TRACK);
            }
        });
    }

    // Audio Initialization Interaction
    if (initAudioBtn) {
        initAudioBtn.addEventListener('click', async () => {
            try {
                await audioEngine.resume();
                if (startOverlay) startOverlay.classList.add('hidden');
                console.log("[Main] Audio Context Resumed Successfully");
            } catch (err) {
                console.error("[Main] Failed to resume audio context:", err);
            }
        });
    }

    // 4. Initial Data Load
    appStore.dispatch(ACTIONS.INIT_APP);

    // 5. Render Initial UI (The Track List)
    const matrixContainer = document.getElementById('matrixContainer');
    
    const renderTrackList = () => {
        matrixContainer.innerHTML = '';
        const state = appStore.state;
        
        state.tracks.forEach(track => {
            // Create Row
            const row = document.createElement('div');
            row.className = 'sequencer-grid';
            
            // 1. Track Label Component
            const trackRow = document.createElement('track-row');
            trackRow.setAttribute('track-id', track.id);
            
            // 2. Steps Component
            const steps = document.createElement('sequencer-steps');
            steps.setAttribute('track-id', track.id);
            steps.slot = 'steps'; 
            
            trackRow.appendChild(steps);
            row.appendChild(trackRow);
            matrixContainer.appendChild(row);
        });
    };

    // Initial Render
    renderTrackList();

    // Subscribe to track list changes (Add/Remove)
    appStore.on('STATE_CHANGED:tracks', () => {
        renderTrackList();
    });

    // 6. Connect Visualizer
    const visualizer = document.querySelector('audio-visualizer');
    if (visualizer) {
        visualizer.addEventListener('visualizer-needs-update', (e) => {
            const trackId = e.detail.trackId;
            const analyser = audioEngine.graph.getTrackAnalyser(trackId);
            if (analyser) {
                visualizer.setAnalyser(analyser);
            }
        });
        
        // Trigger initial update
        setTimeout(() => {
            const analyser = audioEngine.graph.getTrackAnalyser(appStore.state.selectedTrackId);
            if (analyser) visualizer.setAnalyser(analyser);
        }, 100);
    }

    console.log("[Main] BeatOS Ready.");
}

// Boot
window.addEventListener('DOMContentLoaded', init);