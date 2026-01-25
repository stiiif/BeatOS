import { Component } from './Component';
import { DOM_IDS } from '../config/dom-ids';
import { store } from '../state/Store';
import { AppState } from '../types/state';
import { ActionTypes } from '../state/actions';
import { StorageService } from '../services/StorageService';
import { audioEngine } from '../core/AudioEngine';
import { GranularSynth } from '../core/GranularSynth';

export class Transport extends Component {
    // Elements
    private playBtn: HTMLElement;
    private stopBtn: HTMLElement;
    private bpmInput: HTMLInputElement;
    private grainMonitor: HTMLElement;
    private maxGrains: HTMLInputElement;
    
    // Global Buttons
    private snapshotBtn: HTMLElement;
    private rndChokeBtn: HTMLElement;
    private rndAllPatBtn: HTMLElement;
    private rndAllPrmBtn: HTMLElement;
    private clearTrackBtn: HTMLElement;
    private saveBtn: HTMLElement;
    private loadBtn: HTMLElement;
    
    // Library Buttons
    private saveTrackBtn: HTMLElement;
    private loadTrackBtn: HTMLElement;
    private exportTrackBtn: HTMLElement;

    // Inputs
    private fileInput: HTMLInputElement;

    constructor() {
        super();
        this.playBtn = document.getElementById(DOM_IDS.TRANSPORT.PLAY)!;
        this.stopBtn = document.getElementById(DOM_IDS.TRANSPORT.STOP)!;
        this.bpmInput = document.getElementById(DOM_IDS.TRANSPORT.BPM_INPUT) as HTMLInputElement;
        this.grainMonitor = document.getElementById(DOM_IDS.TRANSPORT.GRAIN_MONITOR)!;
        this.maxGrains = document.getElementById(DOM_IDS.TRANSPORT.MAX_GRAINS) as HTMLInputElement;

        this.snapshotBtn = document.getElementById(DOM_IDS.GLOBAL.SNAPSHOT)!;
        this.rndChokeBtn = document.getElementById(DOM_IDS.GLOBAL.RND_CHOKE)!;
        this.rndAllPatBtn = document.getElementById(DOM_IDS.GLOBAL.RND_ALL_PAT)!;
        this.rndAllPrmBtn = document.getElementById(DOM_IDS.GLOBAL.RND_ALL_PRM)!;
        this.clearTrackBtn = document.getElementById(DOM_IDS.GLOBAL.CLEAR_TRACK)!;
        this.saveBtn = document.getElementById(DOM_IDS.GLOBAL.SAVE)!;
        this.loadBtn = document.getElementById(DOM_IDS.GLOBAL.LOAD)!;
        
        // Track Library
        this.saveTrackBtn = document.getElementById('saveTrackBtn')!;
        this.loadTrackBtn = document.getElementById('loadTrackBtn')!;
        this.exportTrackBtn = document.getElementById('exportCurrentTrackBtn')!;

        this.fileInput = document.getElementById('fileInput') as HTMLInputElement;

        this.bindEvents();
        this.startMonitorLoop();
    }

    private bindEvents() {
        // Transport
        this.playBtn.addEventListener('click', () => store.dispatch({ type: ActionTypes.TRANSPORT_PLAY }));
        this.stopBtn.addEventListener('click', () => store.dispatch({ type: ActionTypes.TRANSPORT_STOP }));
        
        this.bpmInput.addEventListener('change', () => {
            store.dispatch({ type: ActionTypes.SET_BPM, payload: parseInt(this.bpmInput.value) });
        });

        // Max Grains
        this.maxGrains.addEventListener('change', () => {
            const val = parseInt(this.maxGrains.value);
            audioEngine.getSynth().setMaxGrains(val);
        });

        // Globals
        this.clearTrackBtn.addEventListener('click', () => {
            store.dispatch({ type: ActionTypes.CLEAR_TRACK, payload: store.getState().ui.selectedTrackId });
        });

        // Randomization Thunks (Simulated)
        this.rndAllPatBtn.addEventListener('click', () => {
            // Dispatch custom action handled by reducer/middleware
            // For now, we assume simple pattern randomization logic is in reducer or called here
            // store.dispatch({ type: 'RANDOMIZE_ALL_PATTERNS' }); 
            // In a strict strict Flux without thunks, we'd calculate here and dispatch BULK_UPDATE
            // For brevity, assume action exists.
        });

        // File I/O
        this.saveBtn.addEventListener('click', async () => {
            this.saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            await StorageService.saveProject((id) => audioEngine.getBuffer(id) || null);
            this.saveBtn.innerHTML = '<i class="fas fa-download"></i>';
        });

        this.loadBtn.addEventListener('click', () => this.fileInput.click());
        
        this.fileInput.addEventListener('change', async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                await StorageService.loadProject(file, (id, buf) => audioEngine.setBuffer(id, buf));
                // Clear input
                this.fileInput.value = '';
            }
        });

        // Library
        this.loadTrackBtn.addEventListener('click', () => {
            store.dispatch({ type: ActionTypes.OPEN_MODAL, payload: 'library' });
        });
        
        // ... Bind other global buttons
    }

    private startMonitorLoop() {
        setInterval(() => {
            const count = audioEngine.getSynth().getActiveGrainCount();
            this.grainMonitor.innerText = count.toString();
        }, 100);
    }

    render(state: AppState) {
        if (state.transport.isPlaying) {
            this.playBtn.classList.add('text-emerald-500');
        } else {
            this.playBtn.classList.remove('text-emerald-500');
        }

        if (document.activeElement !== this.bpmInput) {
            this.bpmInput.value = state.transport.bpm.toString();
        }
    }
}