// js/ui/UIManager.js
import { NUM_STEPS, TRACKS_PER_GROUP, NUM_LFOS, MAX_TRACKS } from '../utils/constants.js';
import { SequencerGrid } from './components/SequencerGrid.js';
import { TrackControls } from './components/TrackControls.js';
import { GrooveControls } from './components/GrooveControls.js';
import { TrackOperations } from './components/TrackOperations.js';
import { SnapshotManager } from './components/SnapshotManager.js';
import { AutomationPanel } from './components/AutomationPanel.js';
import { SearchModal } from './SearchModal.js';
import { globalBus } from '../events/EventBus.js';

export class UIManager {
    constructor() {
        this.tracks = [];
        this.trackManager = null;
        this.visualizerCallback = null;
        this.searchModal = null;
        
        this.grid = new SequencerGrid();
        this.trackControls = new TrackControls();
        this.grooveControls = new GrooveControls();
        this.trackOps = new TrackOperations();
        this.snapshotManager = new SnapshotManager();
        this.automationPanel = new AutomationPanel();

        this.setupVisualEvents();
    }

    setupVisualEvents() {
        // Listen for the stabilized visual clock
        globalBus.on('UI_UPDATE_STEP', (data) => {
            this.grid.updateMatrixHead(data.step);
        });

        globalBus.on('TRANSPORT_STOP', () => {
            this.grid.clearPlayheadForStop();
        });
    }

    setTracks(tracks) {
        this.tracks = tracks;
        this.grid.setTracks(tracks);
        this.trackControls.setTracks(tracks);
        this.grooveControls.setTracks(tracks);
        this.trackOps.setTracks(tracks);
        this.snapshotManager.setTracks(tracks);
        this.automationPanel.setTracks(tracks);
    }

    setTrackManager(tm) {
        this.trackManager = tm;
        this.grooveControls.setTrackManager(tm);
        this.trackControls.setTrackManager(tm);
    }

    initUI(addTrackCallback, addGroupCallback, visualizerCallback = null) {
        this.visualizerCallback = visualizerCallback;
        
        this.grid.initializeGrid(
            addTrackCallback,
            addGroupCallback,
            () => this.getSelectedTrackIndex(),
            (trk, step) => this.toggleStep(trk, step)
        );

        this.automationPanel.initialize(
            (idx) => this.setSelectedLfoIndex(idx),
            () => this.updateLfoUI()
        );

        this.grooveControls.initGrooveControls();
        this.syncGridElements();

        if (this.trackManager && this.trackManager.audioEngine) {
            this.searchModal = new SearchModal(this.trackManager.audioEngine);
            this.trackControls.setSearchModal(this.searchModal);
            this.grooveControls.setSearchModal(this.searchModal);
        }

        this.tracks.forEach(t => {
            this.appendTrackRow(t.id, visualizerCallback);
        });

        window.addEventListener('trackSampleLoaded', (e) => {
            if (e.detail.trackId === this.getSelectedTrackIndex()) {
                this.selectTrack(this.getSelectedTrackIndex());
            }
        });
    }

    syncGridElements() {
        const matrixStepElements = this.grid.getMatrixStepElements();
        const trackLabelElements = this.grid.getTrackLabelElements();
        const trackRowElements = this.grid.getTrackRowElements();

        this.trackControls.setGridElements(trackLabelElements, matrixStepElements);
        this.trackOps.setGridElements(matrixStepElements, trackLabelElements, trackRowElements);
        this.snapshotManager.setGridElements(matrixStepElements);
        this.grooveControls.setGridElements(matrixStepElements);
    }

    appendTrackRow(trk, visualizerCallback = null) {
        const randomChokeInfo = this.trackOps.getRandomChokeInfo();
        
        this.grid.appendTrackRow(
            trk, visualizerCallback, randomChokeInfo.mode, randomChokeInfo.groups,
            (t, s) => this.toggleStep(t, s), (t) => this.toggleMute(t), (t) => this.toggleSolo(t),
            (t) => this.toggleStepLock(t), (g) => this.toggleMuteGroup(g), (g) => this.toggleSoloGroup(g),
            (t) => this.clearTrack(t), (g) => this.clearGroup(g), (t) => this.toggleIgnoreRandom(t),
            (t) => this.randomizeTrackPattern(t), (t, cb) => this.selectTrack(t, cb)
        );
        this.syncGridElements();
    }

    toggleStep(trk, step) {
        const randomChokeInfo = this.trackOps.getRandomChokeInfo();
        this.grid.toggleStep(trk, step, () => this.trackOps.applyRandomChokeDimming(), randomChokeInfo.mode);
    }

    // updateMatrixHead is now handled via setupVisualEvents()
    updateMatrixHead(currentStep, totalStepsPlayed) { /* Logic moved to UI_UPDATE_STEP */ }
    
    clearPlayheadForStop() { this.grid.clearPlayheadForStop(); }
    updateGridVisuals(timeSig) { this.grid.updateGridVisuals(timeSig); }

    selectTrack(idx, visualizerCallback = null) {
        const randomChokeInfo = this.trackOps.getRandomChokeInfo();
        this.trackControls.setRandomChokeInfo(randomChokeInfo.mode, randomChokeInfo.groups);
        this.trackControls.selectTrack(idx, visualizerCallback);
        this.automationPanel.setSelectedTrackIndex(idx);
    }

    updateTrackControlsVisibility() { this.trackControls.updateTrackControlsVisibility(); }
    updateKnobs() { this.trackControls.updateKnobs(); }
    updateCustomTrackHeader(idx, groupIdx, groupColor) { this.trackControls.updateCustomTrackHeader(idx, groupIdx, groupColor); }
    updateLfoUI() { this.trackControls.updateLfoUI(); }
    setSelectedLfoIndex(index) { this.trackControls.setSelectedLfoIndex(index); this.automationPanel.setSelectedLfoIndex(index); }

    applyGroove() {
        this.grooveControls.setVisualizerCallback(this.visualizerCallback);
        this.grooveControls.applyGroove(
            (timeSig) => this.updateGridVisuals(timeSig),
            (idx, cb) => this.selectTrack(idx, cb)
        );
    }

    async applyGrooveFreesound() {
        this.grooveControls.setVisualizerCallback(this.visualizerCallback);
        await this.grooveControls.applyGrooveFreesound(
            (timeSig) => this.updateGridVisuals(timeSig),
            (idx) => this.selectTrack(idx),
            this.getSelectedTrackIndex()
        );
    }

    toggleMute(trk) { this.trackOps.toggleMute(trk); }
    toggleMuteGroup(grpIdx) { this.trackOps.toggleMuteGroup(grpIdx); }
    toggleSolo(trk) { this.trackOps.toggleSolo(trk); }
    toggleSoloGroup(grpIdx) { this.trackOps.toggleSoloGroup(grpIdx); }
    toggleStepLock(trk) { this.trackOps.toggleStepLock(trk); }
    toggleIgnoreRandom(trk) { this.trackOps.toggleIgnoreRandom(trk); }
    updateTrackStateUI(trk) { this.trackOps.updateTrackStateUI(trk); }
    clearTrack(trk) { this.trackOps.clearTrack(trk); }
    clearGroup(grp) { this.trackOps.clearGroup(grp); }
    randomizeTrackPattern(trkIdx) { this.trackOps.randomizeTrackPattern(trkIdx); }
    randomizeAllPatterns() { this.trackOps.randomizeAllPatterns(); }
    toggleRandomChoke() { this.trackOps.toggleRandomChoke((idx, cb) => this.selectTrack(idx, cb), this.visualizerCallback, this.getSelectedTrackIndex()); }
    savePanBaseline() { this.trackOps.savePanBaseline(); }
    applyPanShift(shiftAmount) { this.trackOps.applyPanShift(shiftAmount); }

    toggleSnapshot() {
        this.snapshotManager.toggleSnapshot(
            (trk) => this.updateTrackStateUI(trk),
            (idx, cb) => this.selectTrack(idx, cb),
            this.getSelectedTrackIndex(),
            this.visualizerCallback
        );
    }

    get matrixStepElements() { return this.grid.getMatrixStepElements(); }
    get trackLabelElements() { return this.grid.getTrackLabelElements(); }
    get trackRowElements() { return this.grid.getTrackRowElements(); }

    getSelectedTrackIndex() { return this.trackControls.getSelectedTrackIndex(); }
    getSelectedLfoIndex() { return this.trackControls.getSelectedLfoIndex(); }
    getRandomChokeInfo() { return this.trackOps.getRandomChokeInfo(); }
}