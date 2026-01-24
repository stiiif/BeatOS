import { globalBus } from '../../events/EventBus.js';
import { EVENTS } from '../../events/Events.js';

export class TransportBar {
    constructor(audioEngine) {
        this.audioEngine = audioEngine;
        
        // Bind UI Elements
        this.playBtn = document.getElementById('playBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.bpmInput = document.getElementById('bpmInput');
        this.initAudioBtn = document.getElementById('initAudioBtn');
        
        // Top Right Toolbar Buttons
        this.snapshotBtn = document.getElementById('snapshotBtn');
        this.rndChokeBtn = document.getElementById('rndChokeBtn');
        this.saveTrackBtn = document.getElementById('saveTrackBtn');
        this.loadTrackBtn = document.getElementById('loadTrackBtn');
        this.exportTrackBtn = document.getElementById('exportCurrentTrackBtn');
        this.randomizeAllPatternsBtn = document.getElementById('randomizeAllPatternsBtn');
        this.randAllParamsBtn = document.getElementById('randAllParamsBtn');
        this.clearTrackBtn = document.getElementById('clearTrackBtn');
        this.saveBtn = document.getElementById('saveBtn');
        this.loadBtn = document.getElementById('loadBtn');
        this.fileInput = document.getElementById('fileInput');
        this.importTrackBtn = document.getElementById('importTrackBtn');
        this.importTrackInput = document.getElementById('importTrackInput');
        
        this.initEvents();
        this.bindListeners();
    }

    initEvents() {
        // Listen for playback state changes to update UI
        globalBus.on(EVENTS.PLAYBACK_START, () => {
            if(this.playBtn) this.playBtn.classList.add('text-emerald-500');
        });
        
        globalBus.on(EVENTS.PLAYBACK_STOP, () => {
            if(this.playBtn) this.playBtn.classList.remove('text-emerald-500');
        });

        globalBus.on(EVENTS.BPM_CHANGED, (bpm) => {
            if(this.bpmInput && this.bpmInput.value != bpm) {
                this.bpmInput.value = bpm;
            }
        });
        
        globalBus.on(EVENTS.AUDIO_INITIALIZED, () => {
            const overlay = document.getElementById('startOverlay');
            if(overlay) overlay.classList.add('hidden');
        });
    }

    bindListeners() {
        // --- Audio Init ---
        if (this.initAudioBtn) {
            this.initAudioBtn.addEventListener('click', () => {
                // Determine if we should emit or call directly. 
                // Since main.js handles the actual async init logic often, 
                // we can emit an event requesting init.
                // However, main.js currently has the logic block. 
                // We will emit an intention event.
                globalBus.emit('request:audio_init');
            });
        }

        // --- Transport ---
        if (this.playBtn) {
            this.playBtn.addEventListener('click', () => {
                if (!this.audioEngine.getContext()) return;
                globalBus.emit('request:playback_toggle');
            });
        }

        if (this.stopBtn) {
            this.stopBtn.addEventListener('click', () => {
                globalBus.emit(EVENTS.PLAYBACK_STOP); // Direct stop event
            });
        }

        if (this.bpmInput) {
            this.bpmInput.addEventListener('change', (e) => {
                globalBus.emit(EVENTS.BPM_CHANGED, e.target.value);
            });
        }

        // --- Toolbar Actions ---
        
        // Snapshot
        if (this.snapshotBtn) {
            this.snapshotBtn.addEventListener('click', () => {
                // UIManager currently handles snapshot logic. 
                // We emit an event so UIManager (or a future StateManager) can handle it.
                globalBus.emit('request:snapshot_toggle');
            });
        }

        // Random Choke
        if (this.rndChokeBtn) {
            this.rndChokeBtn.addEventListener('click', () => {
                globalBus.emit('request:random_choke_toggle');
            });
        }

        // Track Library
        if (this.saveTrackBtn) {
            this.saveTrackBtn.addEventListener('click', () => globalBus.emit('request:save_track_library'));
        }
        if (this.loadTrackBtn) {
            this.loadTrackBtn.addEventListener('click', () => globalBus.emit('request:open_track_library'));
        }
        if (this.exportTrackBtn) {
            this.exportTrackBtn.addEventListener('click', () => globalBus.emit('request:export_current_track'));
        }
        if (this.importTrackBtn) {
            this.importTrackBtn.addEventListener('click', () => this.importTrackInput && this.importTrackInput.click());
        }
        if (this.importTrackInput) {
            this.importTrackInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if(file) globalBus.emit('request:import_track_file', file);
                e.target.value = '';
            });
        }

        // Randomization
        if (this.randomizeAllPatternsBtn) {
            this.randomizeAllPatternsBtn.addEventListener('click', () => {
                globalBus.emit('request:randomize_all_patterns');
            });
        }

        if (this.randAllParamsBtn) {
            this.randAllParamsBtn.addEventListener('click', (e) => {
                // Calculate intensity based on click position (legacy feature preservation)
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const buttonWidth = rect.width;
                const clickRatio = clickX / buttonWidth;
                
                let intensity = 1;
                if (clickRatio < 0.2) intensity = 1;
                else if (clickRatio < 0.4) intensity = 2;
                else if (clickRatio < 0.6) intensity = 3;
                else if (clickRatio < 0.8) intensity = 4;
                else intensity = 5;

                // UI Feedback
                const btn = e.currentTarget;
                const originalText = btn.innerHTML;
                const names = ['VERY SHORT', 'SHORT', 'MEDIUM', 'LONG', 'VERY LONG'];
                btn.innerHTML = `${names[intensity-1]} REL`;
                btn.style.transition = 'none';
                btn.style.backgroundColor = '#4f46e5';
                setTimeout(() => {
                    btn.style.transition = '';
                    btn.style.backgroundColor = '';
                    btn.innerHTML = originalText;
                }, 300);

                globalBus.emit('request:randomize_all_params', intensity);
            });
        }

        // Project Management
        if (this.clearTrackBtn) {
            this.clearTrackBtn.addEventListener('click', () => globalBus.emit('request:clear_current_track'));
        }

        if (this.saveBtn) {
            this.saveBtn.addEventListener('click', () => globalBus.emit('request:save_project'));
        }

        if (this.loadBtn) {
            this.loadBtn.addEventListener('click', () => this.fileInput && this.fileInput.click());
        }

        if (this.fileInput) {
            this.fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) globalBus.emit('request:load_project', file);
                e.target.value = '';
            });
        }
    }
}