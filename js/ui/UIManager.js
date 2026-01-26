// js/ui/UIManager.js
import { NUM_STEPS, TRACKS_PER_GROUP, NUM_LFOS, MAX_TRACKS } from '../utils/constants.js';
import { SequencerGrid } from './components/SequencerGrid.js';
import { TrackControls } from './components/TrackControls.js';
import { GrooveControls } from './components/GrooveControls.js';
import { TrackOperations } from './components/TrackOperations.js';
import { SnapshotManager } from './components/SnapshotManager.js'; // Fix filename!
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

    // ============================================================================
    // GRID METHODS
    // ============================================================================
    
    appendTrackRow(trk, visualizerCallback = null) {
        this.grid.appendTrackRow(
            trk,
            this.trackOps.randomChokeMode,
            this.trackOps.randomChokeGroups
        );
    }

    updateMatrixHead(currentStep, totalStepsPlayed) {
        this.grid.updateMatrixHead(currentStep, totalStepsPlayed);
    }

    clearPlayheadForStop() {
        this.grid.clearPlayheadForStop();
    }

    updateGridVisuals(timeSig) {
        this.grid.updateGridVisuals(timeSig);
    }

    // ============================================================================
    // TRACK SELECTION & CONTROLS
    // ============================================================================

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

    updateTrackControlsVisibility() {
        this.trackControls.updateTrackControlsVisibility();
    }

    updateKnobs() {
        this.trackControls.updateKnobs();
    }

    updateCustomTrackHeader(idx, groupIdx, groupColor) {
        const gridElements = {
            trackLabelElements: this.grid.getTrackLabelElements()
        };
        this.trackControls.updateCustomTrackHeader(idx, groupIdx, groupColor, gridElements);
    }

    // ============================================================================
    // LFO / AUTOMATION
    // ============================================================================

    updateLfoUI() {
        this.trackControls.updateLfoUI();
    }

    generateLfoTabs() {
        this.automationPanel.generateLfoTabs((idx) => this.setSelectedLfoIndex(idx));
    }

    bindAutomationControls() {
        this.automationPanel.bindAutomationControls();
    }

    handleSliderWheel(e) {
        this.automationPanel.handleSliderWheel(e);
    }

    // ============================================================================
    // GROOVE CONTROLS
    // ============================================================================

    initGrooveControls() {
        this.grooveControls.initGrooveControls();
    }

    applyGroove() {
        const gridElements = {
            matrixStepElements: this.grid.getMatrixStepElements()
        };
        this.grooveControls.applyGroove(gridElements);
    }

    async applyGrooveFreesound() {
        const gridElements = {
            matrixStepElements: this.grid.getMatrixStepElements()
        };
        await this.grooveControls.applyGrooveFreesound(gridElements);
    }

    // ============================================================================
    // TRACK OPERATIONS
    // ============================================================================

    toggleMute(trk) {
        const gridElements = {
            trackRowElements: this.grid.getTrackRowElements()
        };
        this.trackOps.toggleMute(trk);
        this.trackOps.updateTrackStateUI(trk, gridElements);
    }

    toggleMuteGroup(grpIdx) {
        const gridElements = {
            trackRowElements: this.grid.getTrackRowElements()
        };
        this.trackOps.toggleMuteGroup(grpIdx, gridElements);
    }

    toggleSolo(trk) {
        const gridElements = {
            trackRowElements: this.grid.getTrackRowElements()
        };
        this.trackOps.toggleSolo(trk);
        this.trackOps.updateTrackStateUI(trk, gridElements);
    }

    toggleSoloGroup(grpIdx) {
        const gridElements = {
            trackRowElements: this.grid.getTrackRowElements()
        };
        this.trackOps.toggleSoloGroup(grpIdx, gridElements);
    }

    toggleStepLock(trk) {
        this.trackOps.toggleStepLock(trk);
    }

    toggleIgnoreRandom(trk) {
        this.trackOps.toggleIgnoreRandom(trk);
    }

    updateTrackStateUI(trk) {
        const gridElements = {
            trackRowElements: this.grid.getTrackRowElements()
        };
        this.trackOps.updateTrackStateUI(trk, gridElements);
    }

    clearTrack(trk) {
        const gridElements = {
            matrixStepElements: this.grid.getMatrixStepElements()
        };
        this.trackOps.clearTrack(trk, gridElements);
    }

    clearGroup(grp) {
        const gridElements = {
            matrixStepElements: this.grid.getMatrixStepElements()
        };
        this.trackOps.clearGroup(grp, gridElements);
    }

    randomizeTrackPattern(trkIdx) {
        const gridElements = {
            matrixStepElements: this.grid.getMatrixStepElements()
        };
        this.trackOps.randomizeTrackPattern(trkIdx, gridElements);
    }

    randomizeAllPatterns() {
        const gridElements = {
            matrixStepElements: this.grid.getMatrixStepElements()
        };
        this.trackOps.randomizeAllPatterns(gridElements);
    }

    toggleRandomChoke() {
        const gridElements = {
            matrixStepElements: this.grid.getMatrixStepElements(),
            trackLabelElements: this.grid.getTrackLabelElements()
        };
        this.trackOps.toggleRandomChoke(
            gridElements,
            (idx) => this.selectTrack(idx, this.visualizerCallback)
        );
    }

    updateAllTrackColors() {
        const gridElements = {
            matrixStepElements: this.grid.getMatrixStepElements(),
            trackLabelElements: this.grid.getTrackLabelElements()
        };
        this.trackOps.updateAllTrackColors(
            gridElements,
            (idx) => this.selectTrack(idx, this.visualizerCallback)
        );
    }

    applyRandomChokeDimming() {
        const gridElements = {
            matrixStepElements: this.grid.getMatrixStepElements()
        };
        this.trackOps.applyRandomChokeDimming(gridElements);
    }

    clearRandomChokeDimming() {
        const gridElements = {
            matrixStepElements: this.grid.getMatrixStepElements()
        };
        this.trackOps.clearRandomChokeDimming(gridElements);
    }

    savePanBaseline() {
        this.trackOps.savePanBaseline();
    }

    applyPanShift(shiftAmount) {
        this.trackOps.applyPanShift(shiftAmount);
    }

    // ============================================================================
    // SNAPSHOT
    // ============================================================================

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

    // ============================================================================
    // PUBLIC PROPERTIES (for backward compatibility)
    // ============================================================================

    // CRITICAL: main.js and other files access these directly!
    get matrixStepElements() {
        return this.grid.getMatrixStepElements();
    }

    get trackLabelElements() {
        return this.grid.getTrackLabelElements();
    }

    get trackRowElements() {
        return this.grid.getTrackRowElements();
    }

    // ============================================================================
    // GETTERS
    // ============================================================================

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
}