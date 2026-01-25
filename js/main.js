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
            await audioEngine.resume();
            startOverlay.classList.add('hidden');
            console.log("[Main] Audio Context Resumed");
        });
    }

    // 4. Initial Data Load
    appStore.dispatch(ACTIONS.INIT_APP);

    // 5. Render Initial UI (The Track List)
    const matrixContainer = document.getElementById('matrixContainer');
    
    // We need a renderer for the list of tracks. 
    // Since we didn't make a <track-list> component (optional but good), 
    // we can do a simple subscription here to render rows.
    
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
            steps.slot = 'steps'; // We used <slot name="steps"> in TrackRow
            
            // Append steps INTO the track row if it uses shadow DOM slots, 
            // OR append them as siblings if TrackRow uses `display: contents` and grid.
            // In Step 3.2, TrackRow template has <slot name="steps">.
            trackRow.appendChild(steps);
            
            row.appendChild(trackRow);
            matrixContainer.appendChild(row);
        });
    };

    // Initial Render
    renderTrackList();

    // Subscribe to track list changes (Add/Remove)
    appStore.on('STATE_CHANGED:tracks', () => {
        // Optimization: In a real app, diff the list. For now, re-render is safe.
        renderTrackList();
    });

    // 6. Connect Visualizer
    const visualizer = document.querySelector('audio-visualizer');
    if (visualizer) {
        // It needs access to the active analyser.
        // We can listen for the event it emits or just push updates.
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