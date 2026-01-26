// js/ui/components/AutomationPanel.js
import { NUM_LFOS } from '../../utils/constants.js';

export class AutomationPanel {
    constructor() {
        this.tracks = [];
        this.selectedTrackIndex = 0;
        this.selectedLfoIndex = 0;
    }

    setTracks(tracks) {
        this.tracks = tracks;
    }

    setSelectedTrackIndex(idx) {
        this.selectedTrackIndex = idx;
    }

    setSelectedLfoIndex(idx) {
        this.selectedLfoIndex = idx;
    }

    // ============================================================================
    // GENERATE LFO TABS
    // ============================================================================

    generateLfoTabs(onSetSelectedLfoIndex, onUpdateLfoUI) {
        const container = document.getElementById('lfoTabsContainer');
        if (!container) return;
        container.innerHTML = '';
        
        for(let i=0; i<NUM_LFOS; i++) {
            const btn = document.createElement('button');
            // EXACT STYLING - DO NOT CHANGE
            btn.className = 'lfo-tab flex-1 text-[10px] font-bold py-1 rounded transition text-neutral-400 hover:bg-neutral-700 min-w-[40px]';
            btn.dataset.lfo = i;
            btn.innerText = `LFO ${i+1}`;
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.lfo);
                this.selectedLfoIndex = index;
                if (onSetSelectedLfoIndex) onSetSelectedLfoIndex(index);
                if (onUpdateLfoUI) onUpdateLfoUI();
            });
            container.appendChild(btn);
        }
    }

    // ============================================================================
    // BIND AUTOMATION CONTROLS
    // ============================================================================

    bindAutomationControls() {
        const sel = document.getElementById('autoSpeedSelect');
        if(sel) {
            sel.addEventListener('change', (e) => {
                const t = this.tracks[this.selectedTrackIndex];
                if(t && t.type === 'automation') {
                    t.clockDivider = parseInt(e.target.value);
                }
            });
        }
    }

    // ============================================================================
    // SLIDER WHEEL HANDLING
    // ============================================================================

    handleSliderWheel(e) {
        const el = e.target;
        const step = parseFloat(el.step) || 0.01;
        const min = parseFloat(el.min);
        const max = parseFloat(el.max);
        
        // Middle mouse button for coarse adjustment
        const isCoarse = (e.buttons & 4) === 4; 
        const dir = Math.sign(e.deltaY) * -1; 
        const multiplier = isCoarse ? 10 : 1;
        
        let val = parseFloat(el.value);
        val += dir * step * multiplier;
        val = Math.max(min, Math.min(max, val));
        
        el.value = val;
        el.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // ============================================================================
    // INITIALIZE
    // ============================================================================

    initialize(onSetSelectedLfoIndex, onUpdateLfoUI) {
        this.generateLfoTabs(onSetSelectedLfoIndex, onUpdateLfoUI);
        this.bindAutomationControls();
        
        // Bind wheel event for sliders
        document.body.addEventListener('wheel', (e) => {
            if (e.target.type === 'range') {
                e.preventDefault();
                this.handleSliderWheel(e);
            }
        }, { passive: false });
    }
}