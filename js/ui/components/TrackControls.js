// js/ui/components/TrackControls.js
import { NUM_STEPS, TRACKS_PER_GROUP } from '../../utils/constants.js';

export class TrackControls {
    constructor() {
        this.tracks = [];
        this.selectedTrackIndex = 0;
        this.selectedLfoIndex = 0;
        this.trackLabelElements = [];
        this.matrixStepElements = [];
        this.randomChokeMode = false;
        this.randomChokeGroups = [];
        this.trackManager = null;
        this.searchModal = null;
        this.visualizerCallback = null;
    }

    setTracks(tracks) {
        this.tracks = tracks;
    }

    setGridElements(trackLabelElements, matrixStepElements) {
        this.trackLabelElements = trackLabelElements;
        this.matrixStepElements = matrixStepElements;
    }

    setRandomChokeInfo(mode, groups) {
        this.randomChokeMode = mode;
        this.randomChokeGroups = groups;
    }

    setTrackManager(tm) {
        this.trackManager = tm;
    }

    setSearchModal(modal) {
        this.searchModal = modal;
    }

    selectTrack(idx, visualizerCallback = null) {
        if(this.trackLabelElements[this.selectedTrackIndex])
            this.trackLabelElements[this.selectedTrackIndex].classList.remove('selected');
        this.selectedTrackIndex = idx;
        if(this.trackLabelElements[this.selectedTrackIndex])
            this.trackLabelElements[this.selectedTrackIndex].classList.add('selected');
        
        const displayNum = idx + 1;
        const numEl = document.getElementById('currentTrackNum');
        if(numEl) numEl.innerText = displayNum < 10 ? '0'+displayNum : displayNum;
        
        const normalGrp = Math.floor(idx / TRACKS_PER_GROUP);
        const grp = this.randomChokeMode ? this.randomChokeGroups[idx] : normalGrp;
        const groupColor = `hsl(${grp * 45}, 70%, 50%)`;
        const groupColorGlow = `hsla(${grp * 45}, 70%, 50%, 0.4)`;
        
        const grpLbl = document.getElementById('trackGroupLabel');
        if(grpLbl) {
            grpLbl.innerText = `GRP ${grp}`;
            grpLbl.style.color = groupColor;
        }
        
        this.updateCustomTrackHeader(idx, grp, groupColor);

        const indicator = document.getElementById('trackIndicator');
        if(indicator) {
            indicator.style.backgroundColor = groupColor;
            indicator.style.boxShadow = `0 0 8px ${groupColorGlow}`;
        }
        
        const rightPanel = document.querySelector('.right-pane');
        if (rightPanel) {
            rightPanel.style.setProperty('--group-color', groupColor);
            rightPanel.style.setProperty('--group-color-glow', groupColorGlow);
        }
        
        // Note: Knobs and LFO UI will be updated by UIManager *after* injection.
        // updateTrackControlsVisibility now just handles sub-element states.
        this.updateTrackControlsVisibility(); 
        
        if (visualizerCallback) visualizerCallback();
    }

    updateCustomTrackHeader(idx, groupIdx, groupColor) {
        const t = this.tracks[idx];
        if (!t) return;

        let trackName = `Track ${idx + 1 < 10 ? '0' + (idx + 1) : idx + 1}`;
        let trackType = 'Synth';
        
        if (t.customSample) {
            trackName = t.customSample.name;
            trackType = 'Sample';
        } else if (t.type === 'simple-drum') {
            trackName = (t.params.drumType || 'Kick').toUpperCase();
            trackType = '909';
        } else if (t.type === 'automation') {
            trackName = 'Automation';
            trackType = 'Auto';
        } else {
            trackName = 'Granular';
            trackType = 'Synth';
        }

        const nameEl = document.getElementById('trackNameText');
        const typeEl = document.getElementById('trackTypeLabel');
        
        if (nameEl) {
            nameEl.innerText = trackName;
            nameEl.title = trackName;
        }
        if (typeEl) {
            typeEl.innerText = `[${trackType}]`;
        }

        const cleanBtn = document.getElementById('cleanModeBtn');
        if (cleanBtn) {
            cleanBtn.onclick = () => {
                t.cleanMode = !t.cleanMode;
                this.updateCustomTrackHeader(idx, groupIdx, groupColor);
            };
            
            if (t.cleanMode) {
                cleanBtn.className = 'text-[9px] font-bold px-2 py-0.5 rounded transition border shrink-0 bg-sky-600 text-white border-sky-400';
            } else {
                cleanBtn.className = 'text-[9px] font-bold px-2 py-0.5 rounded transition border shrink-0 bg-neutral-700 text-neutral-500 border-neutral-600 hover:bg-neutral-600';
            }
        }

        const chokeContainer = document.getElementById('chokeGroupContainer');
        if (chokeContainer) {
            chokeContainer.innerHTML = '';
            const grpLabel = document.createElement('span');
            grpLabel.innerText = 'CHK';
            grpLabel.className = 'text-[9px] font-bold text-neutral-500 mr-1 flex items-center';
            chokeContainer.appendChild(grpLabel);

            for(let i=0; i<8; i++) {
                const btn = document.createElement('button');
                const targetGroup = i + 1;
                const isAssigned = t.chokeGroup === targetGroup;
                const bgClass = isAssigned ? '' : 'bg-neutral-800 text-neutral-500';
                const style = isAssigned ? `background-color: #ef4444; color: #fff; border-color: #b91c1c;` : '';
                btn.className = `flex-1 h-4 text-[8px] border border-neutral-700 rounded flex items-center justify-center hover:bg-neutral-700 transition ${bgClass}`;
                btn.style.cssText = style;
                btn.innerText = targetGroup;
                btn.onclick = () => { t.chokeGroup = (t.chokeGroup === targetGroup) ? 0 : targetGroup; this.selectTrack(this.selectedTrackIndex); };
                chokeContainer.appendChild(btn);
            }
        }
    }

    updateTrackControlsVisibility() {
        // Since TrackDetailsPanel now completely replaces content, 
        // we only need to handle sub-element states (like buttons inside the active view)
        // AND visibility of the LFO section (which is separate).
        
        const t = this.tracks[this.selectedTrackIndex];
        if (!t) return;

        // 1. Handle Sub-Buttons (if they exist in current view)
        const btnBar = document.getElementById('resetOnBarBtn');
        const btnTrig = document.getElementById('resetOnTrigBtn');
        const speedSel = document.getElementById('autoSpeedSelect');

        if (btnBar) {
            btnBar.onclick = () => { t.resetOnBar = !t.resetOnBar; this.updateTrackControlsVisibility(); };
            btnBar.className = `w-5 h-5 text-[8px] border rounded transition ${t.resetOnBar ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-neutral-800 text-neutral-500 border-neutral-700 hover:bg-neutral-700'}`;
        }

        if (btnTrig) {
            btnTrig.onclick = () => { t.resetOnTrig = !t.resetOnTrig; this.updateTrackControlsVisibility(); };
            btnTrig.className = `w-5 h-5 text-[8px] border rounded transition ${t.resetOnTrig ? 'bg-amber-600 text-white border-amber-400' : 'bg-neutral-800 text-neutral-500 border-neutral-700 hover:bg-neutral-700'}`;
        }
        
        if (speedSel && t.type === 'automation') {
            speedSel.value = t.clockDivider || 1;
        }

        // 2. Handle 909 Buttons Highlighting (Header - Always Exists)
        document.querySelectorAll('.type-909-btn').forEach(btn => {
            if (t.type === 'simple-drum' && btn.dataset.drum === t.params.drumType) {
                btn.classList.remove('bg-orange-900/30', 'text-orange-400', 'border-orange-900/50');
                btn.classList.add('bg-orange-600', 'text-white', 'border-orange-500');
            } else {
                btn.classList.add('bg-orange-900/30', 'text-orange-400', 'border-orange-900/50');
                btn.classList.remove('bg-orange-600', 'text-white', 'border-orange-500');
            }
        });

        // 3. Handle LFO Section Visibility (Managed by AutomationPanel but toggled here)
        const lfoSection = document.getElementById('lfoSection');
        if (lfoSection) {
            if (t.type === 'granular') {
                lfoSection.classList.remove('hidden');
                // Ensure layout triggers if it was hidden
                // setTimeout(() => window.dispatchEvent(new Event('resize')), 0); 
            } else {
                lfoSection.classList.add('hidden');
            }
        }
    }

    updateKnobs() {
        // Updates values of whatever sliders currently exist in DOM
        const t = this.tracks[this.selectedTrackIndex];
        if(!t) return;
        document.querySelectorAll('.param-slider').forEach(el => {
            const param = el.dataset.param;
            if(t.params[param] !== undefined) {
                el.value = t.params[param];
                let suffix = '';
                let displayValue = t.params[param].toFixed(3); 
                if(param === 'density') { suffix = 'hz'; displayValue = t.params[param].toFixed(0); }
                if(param === 'grainSize') suffix = 's';
                if(param === 'pitch') suffix = 'x';
                if(param === 'overlap') suffix = 'x';
                if(param === 'edgeCrunch') { suffix = '%'; displayValue = (t.params[param] * 100).toFixed(0); }
                if(param === 'orbit') { suffix = '%'; displayValue = (t.params[param] * 100).toFixed(0); }

                let displayEl = el.nextElementSibling;
                // DOM structure might vary (label | input | div) or (div > label, input, span)
                // In ParamGrid: Label | Input | Value
                if (displayEl && displayEl.classList.contains('value-display')) {
                    displayEl.innerText = displayValue + suffix;
                }
            }
        });
    }

    updateLfoUI() {
        // This is now largely handled by AutomationPanel.render(), 
        // but we might need to update values if we don't re-render entire matrix.
        // Given the Monolith design, AutomationPanel.render() is fast enough and safer.
        // UIManager calls AutomationPanel.render() anyway.
        // So this method effectively does nothing or delegates.
        
        // However, if we want to update just values without re-rendering DOM:
        // AutomationPanel handles its own slider updates via listeners.
    }

    getSelectedTrackIndex() { return this.selectedTrackIndex; }
    getSelectedLfoIndex() { return this.selectedLfoIndex; }
    setSelectedLfoIndex(index) { this.selectedLfoIndex = index; }
}