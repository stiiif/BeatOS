// js/ui/components/TrackControls.js
import { NUM_STEPS, TRACKS_PER_GROUP, NUM_LFOS } from '../../utils/constants.js';
import { DOMHelpers } from '../utils/DOMHelpers.js';

export class TrackControls {
    constructor() {
        this.tracks = [];
        this.selectedTrackIndex = 0;
        this.selectedLfoIndex = 0;
        this.randomChokeMode = false;
        this.randomChokeGroups = [];
    }

    setTracks(tracks) {
        this.tracks = tracks;
    }

    setSelectionState(selectedIndex, randomChokeMode, randomChokeGroups) {
        this.selectedTrackIndex = selectedIndex;
        this.randomChokeMode = randomChokeMode;
        this.randomChokeGroups = randomChokeGroups;
    }

    selectTrack(idx, gridElements, visualizerCallback) {
        if (idx < 0 || idx >= this.tracks.length) return;
        
        this.selectedTrackIndex = idx;
        const t = this.tracks[idx];
        
        // Update track row highlighting
        gridElements.trackRowElements.forEach((rowEls, i) => {
            const isSelected = (i === idx);
            rowEls.forEach(el => {
                if (isSelected) {
                    el.classList.add('track-selected');
                } else {
                    el.classList.remove('track-selected');
                }
            });
        });
        
        // Update visualizer
        if (visualizerCallback) {
            visualizerCallback();
        }
        
        // Update control panels
        this.updateTrackControlsVisibility();
        this.updateKnobs();
        this.updateLfoUI();
        
        return this.selectedTrackIndex;
    }

    updateTrackControlsVisibility() {
        const t = this.tracks[this.selectedTrackIndex];
        if (!t) return;

        const autoControls = document.getElementById('automationControls');
        const granularControls = document.getElementById('granularControls');
        const drumControls = document.getElementById('simpleDrumControls');
        const lfoSection = document.getElementById('lfoSection');
        const speedSel = document.getElementById('autoSpeedSelect');

        // Hide all first
        DOMHelpers.setElementVisibility('granularControls', false);
        DOMHelpers.setElementVisibility('simpleDrumControls', false);
        DOMHelpers.setElementVisibility('lfoSection', false);
        DOMHelpers.setElementVisibility('automationControls', false);

        // Show appropriate controls
        if (t.type === 'automation') {
            DOMHelpers.setElementVisibility('automationControls', true);
            if (speedSel) speedSel.value = t.clockDivider || 1;
        } else if (t.type === 'simple-drum') {
            DOMHelpers.setElementVisibility('simpleDrumControls', true);
            this.updateDrumTypeButtons(t.params.drumType);
        } else {
            const wasHidden = granularControls && 
                            granularControls.classList.contains('hidden');
            
            DOMHelpers.setElementVisibility('granularControls', true);
            DOMHelpers.setElementVisibility('lfoSection', true);
            
            if (wasHidden) {
                setTimeout(() => window.dispatchEvent(new Event('resize')), 0);
            }
        }
    }

    updateDrumTypeButtons(selectedDrumType) {
        document.querySelectorAll('.drum-sel-btn').forEach(btn => {
            if (btn.dataset.drum === selectedDrumType) {
                btn.classList.replace('text-neutral-400', 'text-white');
                btn.classList.replace('bg-neutral-800', 'bg-orange-700');
            } else {
                btn.classList.replace('text-white', 'text-neutral-400');
                btn.classList.replace('bg-orange-700', 'bg-neutral-800');
            }
        });
    }

    updateKnobs() {
        const t = this.tracks[this.selectedTrackIndex];
        if (!t) return;
        
        document.querySelectorAll('.param-slider').forEach(el => {
            const param = el.dataset.param;
            if (t.params[param] !== undefined) {
                el.value = t.params[param];
                
                let suffix = '';
                if (param === 'density') suffix = 'hz';
                if (param === 'grainSize') suffix = 's';
                if (param === 'pitch') suffix = 'x';
                if (param === 'overlap') suffix = 'x';
                if (param === 'scanSpeed') suffix = '';
                
                if (el.nextElementSibling) {
                    el.nextElementSibling.innerText = t.params[param].toFixed(2) + suffix;
                }
            }
        });
    }

    updateLfoUI() {
        if (!this.tracks[this.selectedTrackIndex]) return;
        
        const lfo = this.tracks[this.selectedTrackIndex].lfos[this.selectedLfoIndex];
        const normalGrp = Math.floor(this.selectedTrackIndex / TRACKS_PER_GROUP);
        const grp = this.randomChokeMode ? 
                    this.randomChokeGroups[this.selectedTrackIndex] : normalGrp;
        const groupColorDark = `hsl(${grp * 45}, 70%, 35%)`;
        
        // Update LFO tabs
        document.querySelectorAll('.lfo-tab').forEach(b => {
            const i = parseInt(b.dataset.lfo);
            if (i === this.selectedLfoIndex) {
                b.classList.remove('text-neutral-400', 'hover:bg-neutral-700');
                b.classList.add('text-white');
                b.style.backgroundColor = groupColorDark;
            } else {
                b.classList.add('text-neutral-400', 'hover:bg-neutral-700');
                b.classList.remove('text-white');
                b.style.backgroundColor = '';
            }
        });
        
        // Update LFO controls
        DOMHelpers.setElementValue('lfoTarget', lfo.target);
        DOMHelpers.setElementValue('lfoWave', lfo.wave);
        DOMHelpers.setElementValue('lfoRate', lfo.rate);
        DOMHelpers.setElementText('lfoRateVal', lfo.rate.toFixed(1));
        DOMHelpers.setElementValue('lfoAmt', lfo.amount);
        DOMHelpers.setElementText('lfoAmtVal', lfo.amount.toFixed(2));
    }

    updateCustomTrackHeader(idx, groupIdx, groupColor, gridElements) {
        const label = gridElements.trackLabelElements[idx];
        if (!label) return;
        
        label.style.borderRight = `3px solid ${groupColor}`;
        label.title = `Group ${groupIdx}`;
        
        const nameSpan = label.querySelector('span');
        if (nameSpan) {
            nameSpan.style.color = groupColor;
            nameSpan.style.fontWeight = 'bold';
        }
    }

    // Getters
    getSelectedTrackIndex() { return this.selectedTrackIndex; }
    getSelectedLfoIndex() { return this.selectedLfoIndex; }
    setSelectedLfoIndex(index) { this.selectedLfoIndex = index; }
}