import { BaseComponent } from '../BaseComponent.js';
import { globalBus } from '../../events/EventBus.js';
import { EVENTS } from '../../config/events.js';

export class TransportBar extends BaseComponent {
    constructor(containerSelector, scheduler, trackManager) {
        super(containerSelector);
        this.scheduler = scheduler;
        this.trackManager = trackManager;
        
        // Bind to existing static elements from index.html header
        this.playBtn = document.getElementById('playBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.bpmInput = document.getElementById('bpmInput');
        this.initAudioBtn = document.getElementById('initAudioBtn');
        
        // New features previously in header
        this.snapshotBtn = document.getElementById('snapshotBtn');
        this.rndChokeBtn = document.getElementById('rndChokeBtn');
        
        this.init();
    }

    init() {
        if (this.playBtn) this.playBtn.addEventListener('click', () => this.togglePlay());
        if (this.stopBtn) this.stopBtn.addEventListener('click', () => this.stop());
        if (this.bpmInput) this.bpmInput.addEventListener('change', (e) => this.setBPM(e.target.value));
        
        if (this.initAudioBtn) {
            this.initAudioBtn.addEventListener('click', async () => {
                // Determine if we need to initialize audio engine externally or here
                // Usually handled by App.js, but visual feedback happens here
                globalBus.emit('AUDIO_INIT_REQUESTED');
            });
        }

        if (this.snapshotBtn) this.snapshotBtn.addEventListener('click', () => this.toggleSnapshot());
        if (this.rndChokeBtn) this.rndChokeBtn.addEventListener('click', () => this.toggleRandomChoke());

        // Listen for external stop events (e.g. end of song)
        globalBus.on('PLAYBACK_STOPPED', () => {
            this.playBtn.classList.remove('text-emerald-500');
        });
    }

    togglePlay() {
        if (this.scheduler.getIsPlaying()) {
            this.stop(); // Optional: toggling play usually just pauses or recycles, here we stop/start
        } else {
            // Emit start request
            globalBus.emit('PLAYBACK_START_REQUESTED');
            this.playBtn.classList.add('text-emerald-500');
        }
    }

    stop() {
        this.scheduler.stop();
        this.playBtn.classList.remove('text-emerald-500');
        globalBus.emit('PLAYBACK_STOPPED');
    }

    setBPM(value) {
        this.scheduler.setBPM(value);
    }

    toggleSnapshot() {
        // Logic moved to TrackManager, this just triggers it
        if (!this.hasSnapshot) {
            this.trackManager.saveGlobalSnapshot(); // This saves internally in manager
            // We need a way to know if we are restoring or saving. 
            // Simplified: The manager handles the toggle logic if we move it there completely,
            // OR we keep state here. Let's keep state in UI for the button visual.
            this.snapshotBtn.classList.add('snap-active');
            this.snapshotBtn.innerText = 'RESTORE';
            this.hasSnapshot = true;
        } else {
            // Restore
            this.trackManager.restoreGlobalSnapshot(this.trackManager.activeSnapshot); // Assuming manager holds it
            // Actually, TrackManager logic from previous steps handles "restoreGlobalSnapshot" taking data.
            // We might need to refactor TrackManager to hold the "active" snapshot state 
            // if we want to toggle it easily without passing data back and forth.
            // For now, let's assume we pass a flag or the manager handles the toggle state.
            // Let's rely on manager having 'activeSnapshot' property if we migrated it.
            
            // To ensure safety, let's emit a specific event handled by App or Manager
            // But since we have direct ref:
            if (this.trackManager.activeSnapshot) {
                this.trackManager.restoreGlobalSnapshot(this.trackManager.activeSnapshot);
                this.trackManager.activeSnapshot = null; 
            }
            
            this.snapshotBtn.classList.remove('snap-active');
            this.snapshotBtn.innerText = 'Snap';
            this.hasSnapshot = false;
        }
    }

    toggleRandomChoke() {
        const result = this.trackManager.toggleRandomChoke();
        if (result.mode) {
            this.rndChokeBtn.classList.add('rnd-choke-active');
        } else {
            this.rndChokeBtn.classList.remove('rnd-choke-active');
        }
    }
}