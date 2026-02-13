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
        console.log(`[TrackControls] Tracks set. Count: ${tracks.length}`);
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
        
        // Fix: Update the number in the header directly
        const numEl = document.getElementById('currentTrackNum');
        if(numEl) numEl.innerText = displayNum < 10 ? '0'+displayNum : displayNum;
        
        const normalGrp = Math.floor(idx / TRACKS_PER_GROUP);
        const grp = this.randomChokeMode ? this.randomChokeGroups[idx] : normalGrp;
        const groupColor = `hsl(${grp * 45}, 70%, 50%)`;
        const groupColorGlow = `hsla(${grp * 45}, 70%, 50%, 0.4)`;
        
        // Fix: Update Group Label
        const grpLbl = document.getElementById('trackGroupLabel');
        if(grpLbl) {
            grpLbl.innerText = `GRP ${grp}`;
            grpLbl.style.color = groupColor;
        }
        
        // Fix: Update Header Content
        this.updateCustomTrackHeader(idx, grp, groupColor);

        // Fix: Update Indicator
        const indicator = document.getElementById('trackIndicator');
        if(indicator) {
            indicator.style.backgroundColor = groupColor;
            indicator.style.boxShadow = `0 0 8px ${groupColorGlow}`;
        }
        
        // Update Panel Theme
        const rightPanel = document.querySelector('.right-pane');
        if (rightPanel) {
            rightPanel.style.setProperty('--group-color', groupColor);
            rightPanel.style.setProperty('--group-color-glow', groupColorGlow);
        }
        
        this.updateKnobs();
        this.updateLfoUI();
        this.updateTrackControlsVisibility(); 
        if (visualizerCallback) visualizerCallback();
    }

    updateCustomTrackHeader(idx, groupIdx, groupColor) {
        const t = this.tracks[idx];
        if (!t) return;

        // 1. Determine Track Name and Type
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

        // 2. Update Text Elements (using new IDs from HTML)
        const nameEl = document.getElementById('trackNameText');
        const typeEl = document.getElementById('trackTypeLabel');
        
        if (nameEl) {
            nameEl.innerText = trackName;
            nameEl.title = trackName;
        }
        if (typeEl) {
            typeEl.innerText = `[${trackType}]`;
        }

        // 3. Update CLEAN Button State
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

        // 4. Update Choke Group Buttons
        const chokeContainer = document.getElementById('chokeGroupContainer');
        if (chokeContainer) {
            chokeContainer.innerHTML = '';
            // Rebuild Choke Buttons (Logic is simple enough to rebuild safely)
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
        const t = this.tracks[this.selectedTrackIndex];
        if (!t) return;

        const btnBar = document.getElementById('resetOnBarBtn');
        const btnTrig = document.getElementById('resetOnTrigBtn');

        if (btnBar) {
            btnBar.onclick = () => { t.resetOnBar = !t.resetOnBar; this.updateTrackControlsVisibility(); };
            btnBar.className = `w-5 h-5 text-[8px] border rounded transition ${t.resetOnBar ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-neutral-800 text-neutral-500 border-neutral-700 hover:bg-neutral-700'}`;
        }

        if (btnTrig) {
            btnTrig.onclick = () => { t.resetOnTrig = !t.resetOnTrig; this.updateTrackControlsVisibility(); };
            btnTrig.className = `w-5 h-5 text-[8px] border rounded transition ${t.resetOnTrig ? 'bg-amber-600 text-white border-amber-400' : 'bg-neutral-800 text-neutral-500 border-neutral-700 hover:bg-neutral-700'}`;
        }

        const autoControls = document.getElementById('automationControls');
        const granularControls = document.getElementById('granularControls');
        const drumControls = document.getElementById('simpleDrumControls');
        const lfoSection = document.getElementById('lfoSection');
        const speedSel = document.getElementById('autoSpeedSelect');

        if(granularControls) granularControls.classList.add('hidden');
        if(drumControls) drumControls.classList.add('hidden');
        if(lfoSection) lfoSection.classList.add('hidden');
        if(autoControls) autoControls.classList.add('hidden');

        if (t.type === 'automation') {
            if(autoControls) autoControls.classList.remove('hidden');
            if(speedSel) speedSel.value = t.clockDivider || 1;
        } 
        else if (t.type === 'simple-drum') {
            if(drumControls) drumControls.classList.remove('hidden');
            // Highlighting active drum type on the new buttons (top row)
            // Note: Since buttons are static, we might want to highlight them if we want persistent state visualization
            // However, previous implementation handled highlighting. Let's see if we can do it.
            // We can query selector .type-909-btn
            document.querySelectorAll('.type-909-btn').forEach(btn => {
                if (btn.dataset.drum === t.params.drumType) {
                    btn.classList.remove('bg-orange-900/30', 'text-orange-400', 'border-orange-900/50');
                    btn.classList.add('bg-orange-600', 'text-white', 'border-orange-500');
                } else {
                    btn.classList.add('bg-orange-900/30', 'text-orange-400', 'border-orange-900/50');
                    btn.classList.remove('bg-orange-600', 'text-white', 'border-orange-500');
                }
            });
        }
        else {
            const wasHidden = granularControls && granularControls.classList.contains('hidden');
            if(granularControls) granularControls.classList.remove('hidden');
            if(lfoSection) lfoSection.classList.remove('hidden');
            if(wasHidden) setTimeout(() => window.dispatchEvent(new Event('resize')), 0);
        }
    }

    updateKnobs() {
        const t = this.tracks[this.selectedTrackIndex];
        if(!t) return;
        document.querySelectorAll('.param-slider').forEach(el => {
            const param = el.dataset.param;
            if(t.params[param] !== undefined) {
                el.value = t.params[param];
                let suffix = '';
                let displayValue = t.params[param].toFixed(3); 
                if(param === 'density') { suffix = 'hz'; displayValue = t.params[param].toFixed(1); }
                if(param === 'grainSize') suffix = 's';
                if(param === 'pitchSemi') { suffix = 'st'; displayValue = t.params.pitchSnap ? t.params[param].toFixed(0) : t.params[param].toFixed(2); }
                if(param === 'pitchFine') { suffix = 'ct'; displayValue = t.params[param].toFixed(0); }
                if(param === 'pitch') suffix = 'x';
                if(param === 'overlap') suffix = 'x';
                
                // Special formatting for new params
                if(param === 'edgeCrunch') { suffix = '%'; displayValue = (t.params[param] * 100).toFixed(0); }
                if(param === 'orbit') { suffix = '%'; displayValue = (t.params[param] * 100).toFixed(0); }
                if(param === 'stereoSpread') { suffix = '%'; displayValue = (t.params[param] * 100).toFixed(0); }

                let displayEl = el.nextElementSibling;
                if (displayEl && !displayEl.classList.contains('value-display')) displayEl = el.parentElement.nextElementSibling;
                if(displayEl && displayEl.classList.contains('value-display')) displayEl.innerText = displayValue + suffix;
            }
        });
    }

    updateLfoUI() {
        if(!this.tracks[this.selectedTrackIndex]) return;
        const lfo = this.tracks[this.selectedTrackIndex].lfos[this.selectedLfoIndex];
        const normalGrp = Math.floor(this.selectedTrackIndex / TRACKS_PER_GROUP);
        const grp = this.randomChokeMode ? this.randomChokeGroups[this.selectedTrackIndex] : normalGrp;
        const groupColorDark = `hsl(${grp * 45}, 70%, 35%)`;
        
        document.querySelectorAll('.lfo-tab').forEach(b => {
            const i = parseInt(b.dataset.lfo);
            if(i === this.selectedLfoIndex) { b.classList.remove('text-neutral-400', 'hover:bg-neutral-700'); b.classList.add('text-white'); b.style.backgroundColor = groupColorDark; }
            else { b.classList.add('text-neutral-400', 'hover:bg-neutral-700'); b.classList.remove('text-white'); b.style.backgroundColor = ''; }
        });
        
        const rateVal = document.getElementById('lfoRateVal');
        const amtVal = document.getElementById('lfoAmtVal');
        
        // FIX: Check for existence of old UI elements before accessing them
        const lfoTargetEl = document.getElementById('lfoTarget');
        if (lfoTargetEl) lfoTargetEl.value = lfo.target;
        
        const lfoWaveEl = document.getElementById('lfoWave');
        if (lfoWaveEl) lfoWaveEl.value = lfo.wave;
        
        const lfoRateEl = document.getElementById('lfoRate');
        if (lfoRateEl) {
            lfoRateEl.value = lfo.rate;
            if(rateVal) rateVal.innerText = lfo.rate.toFixed(1);
        }
        
        const lfoAmtEl = document.getElementById('lfoAmt');
        if (lfoAmtEl) {
            lfoAmtEl.value = lfo.amount;
            if(amtVal) amtVal.innerText = lfo.amount.toFixed(2);
        }
    }

    getSelectedTrackIndex() { return this.selectedTrackIndex; }
    getSelectedLfoIndex() { return this.selectedLfoIndex; }
    setSelectedLfoIndex(index) { this.selectedLfoIndex = index; }
}