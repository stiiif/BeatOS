// js/ui/UIManager.js
import { NUM_STEPS, TRACKS_PER_GROUP, NUM_LFOS, MAX_TRACKS } from '../utils/constants.js';
import { SequencerGrid } from './components/SequencerGrid.js';
import { TrackControls } from './components/TrackControls.js';
import { GrooveControls } from './components/GrooveControls.js';
import { TrackOperations } from './components/TrackOperations.js';
import { SnapshotManager } from './components/SnapshotManager.js';
import { AutomationPanel } from './components/AutomationPanel.js';

export class UIManager {
    constructor() {
        this.tracks = [];
        this.trackManager = null;
        this.visualizerCallback = null;
        
        // Initialize components
        this.grid = new SequencerGrid();
        this.trackControls = new TrackControls();
        this.grooveControls = new GrooveControls();
        this.trackOps = new TrackOperations();
        this.snapshotManager = new SnapshotManager();
        this.automationPanel = new AutomationPanel();
    }

    setTracks(tracks) {
        this.tracks = tracks;
        this.grid.setTracks(tracks);
        this.trackControls.setTracks(tracks);
        this.grooveControls.setTracks(tracks);
        this.trackOps.setTracks(tracks);
        this.snapshotManager.setTracks(tracks);
    }

    setTrackManager(tm) {
        this.trackManager = tm;
        this.grooveControls.setTrackManager(tm);
    }

    initUI(addTrackCallback, addGroupCallback, visualizerCallback = null) {
        this.visualizerCallback = visualizerCallback;
        
        // Initialize all components
        this.grid.initialize({
            onAddTrack: addTrackCallback,
            onAddGroup: addGroupCallback,
            getSelectedTrackIndex: () => this.getSelectedTrackIndex()
        });
        
        this.grooveControls.initialize();
        this.automationPanel.initialize((idx) => this.setSelectedLfoIndex(idx));
    }

    // Delegate methods to appropriate components
    appendTrackRow(trk, visualizerCallback = null) {
        this.grid.appendTrackRow(
            trk,
            this.trackOps.randomChokeMode,
            this.trackOps.randomChokeGroups
        );
    }

    selectTrack(idx, visualizerCallback = null) {
        const gridElements = {
            matrixStepElements: this.grid.getMatrixStepElements(),
            trackLabelElements: this.grid.getTrackLabelElements(),
            trackRowElements: this.grid.getTrackRowElements()
        };
        
        this.trackControls.setSelectionState(
            idx,
            this.trackOps.randomChokeMode,
            this.trackOps.randomChokeGroups
        );
        
        return this.trackControls.selectTrack(idx, gridElements, visualizerCallback);
    }

    updateMatrixHead(currentStep, totalStepsPlayed) {
        this.grid.updateMatrixHead(currentStep, totalStepsPlayed);
    }

    toggleMute(trk) {
        const gridElements = {
            trackRowElements: this.grid.getTrackRowElements()
        };
        this.trackOps.toggleMute(trk);
        this.trackOps.updateTrackStateUI(trk, gridElements);
    }

    toggleSolo(trk) {
        const gridElements = {
            trackRowElements: this.grid.getTrackRowElements()
        };
        this.trackOps.toggleSolo(trk);
        this.trackOps.updateTrackStateUI(trk, gridElements);
    }

    toggleSnapshot() {
        const gridElements = {
            matrixStepElements: this.grid.getMatrixStepElements(),
            trackRowElements: this.grid.getTrackRowElements()
        };
        
        this.snapshotManager.toggleSnapshot(
            gridElements,
            (trk, elements) => this.trackOps.updateTrackStateUI(trk, elements),
            () => this.selectTrack(this.getSelectedTrackIndex(), this.visualizerCallback)
        );
    }

    // Pass-through getters
    getSelectedTrackIndex() {
        return this.trackControls.getSelectedTrackIndex();
    }

    getSelectedLfoIndex() {
        return this.trackControls.getSelectedLfoIndex();
    }

    setSelectedLfoIndex(index) {
        this.trackControls.setSelectedLfoIndex(index);
        this.trackControls.updateLfoUI();
    }

    getRandomChokeInfo() {
        return this.trackOps.getRandomChokeInfo();
    }

    // [Additional delegation methods...]
}