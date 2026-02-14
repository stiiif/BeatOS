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

    setScheduler(scheduler) {
        this._scheduler = scheduler;
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

        // 2. Update Text Elements
        const nameEl = document.getElementById('trackNameText');
        
        if (nameEl) {
            nameEl.innerText = trackName;
            nameEl.title = trackName;
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

        // --- Scan Sync buttons ---
        const btnSync = document.getElementById('scanSyncBtn');
        const btnX2 = document.getElementById('scanSyncX2Btn');
        const btnD2 = document.getElementById('scanSyncD2Btn');

        if (btnSync) {
            btnSync.onclick = () => {
                t.scanSync = !t.scanSync;
                if (t.scanSync) {
                    t.scanSyncMultiplier = 1;
                    this._applyScanSync(t);
                }
                this.updateTrackControlsVisibility();
            };
            btnSync.className = `w-5 h-5 text-[8px] border rounded transition font-bold ${t.scanSync ? 'bg-cyan-600 text-white border-cyan-400' : 'bg-neutral-800 text-neutral-500 border-neutral-700 hover:bg-neutral-700'}`;
        }

        if (btnX2) {
            btnX2.onclick = () => {
                if (!t.scanSync) return;
                t.scanSyncMultiplier *= 2;
                this._applyScanSync(t);
                this.updateTrackControlsVisibility();
            };
            const x2Active = t.scanSync && t.scanSyncMultiplier > 1;
            btnX2.className = `w-5 h-2.5 text-[6px] leading-none border rounded-sm transition ${t.scanSync ? (x2Active ? 'bg-cyan-800 text-cyan-200 border-cyan-600' : 'bg-neutral-700 text-neutral-300 border-neutral-600 hover:bg-neutral-600') : 'bg-neutral-800 text-neutral-600 border-neutral-700 opacity-50'}`;
        }

        if (btnD2) {
            btnD2.onclick = () => {
                if (!t.scanSync) return;
                t.scanSyncMultiplier *= 0.5;
                this._applyScanSync(t);
                this.updateTrackControlsVisibility();
            };
            const d2Active = t.scanSync && t.scanSyncMultiplier < 1;
            btnD2.className = `w-5 h-2.5 text-[6px] leading-none border rounded-sm transition ${t.scanSync ? (d2Active ? 'bg-cyan-800 text-cyan-200 border-cyan-600' : 'bg-neutral-700 text-neutral-300 border-neutral-600 hover:bg-neutral-600') : 'bg-neutral-800 text-neutral-600 border-neutral-700 opacity-50'}`;
        }

        const autoControls = document.getElementById('automationControls');
        const granularControls = document.getElementById('granularControls');
        const drumControls = document.getElementById('simpleDrumControls');
        const samplerControls = document.getElementById('samplerControls');
        const lfoSection = document.getElementById('lfoSection');
        const speedSel = document.getElementById('autoSpeedSelect');

        if(granularControls) granularControls.classList.add('hidden');
        if(drumControls) drumControls.classList.add('hidden');
        if(samplerControls) samplerControls.classList.add('hidden');
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
        else if (t.type === 'sampler') {
            if(samplerControls) samplerControls.classList.remove('hidden');
            if(lfoSection) lfoSection.classList.remove('hidden');
            this._updateSamplerSliders(t);
            this._drawSamplerScope(t);
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
                const isLog = el.dataset.log === '1';
                // For log sliders: convert Hz to 0–1 normalized for the slider position
                if (isLog) {
                    el.value = Math.log(Math.max(20, t.params[param]) / 20) / Math.log(1000);
                } else {
                    el.value = t.params[param];
                }
                let suffix = '';
                let displayValue = t.params[param].toFixed(3); 
                if(param === 'density') { suffix = 'hz'; displayValue = t.params[param].toFixed(1); }
                if(param === 'grainSize') suffix = 's';
                if(param === 'pitchSemi') { suffix = 'st'; displayValue = t.params.pitchSnap ? t.params[param].toFixed(0) : t.params[param].toFixed(2); }
                if(param === 'pitchFine') { suffix = 'ct'; displayValue = t.params[param].toFixed(0); }
                if(param === 'pitch') suffix = 'x';
                if(param === 'overlap') suffix = 'x';
                
                if(param === 'edgeCrunch') { suffix = '%'; displayValue = (t.params[param] * 100).toFixed(0); }
                if(param === 'orbit') { suffix = '%'; displayValue = (t.params[param] * 100).toFixed(0); }
                if(param === 'stereoSpread') { suffix = '%'; displayValue = (t.params[param] * 100).toFixed(0); }

                // Log filter display: show Hz
                if(isLog) { suffix = ' Hz'; displayValue = Math.round(t.params[param]); }

                if(param === 'scanSpeed' && t.scanSync) {
                    const m = t.scanSyncMultiplier;
                    if (m >= 1) displayValue = `S:${m.toFixed(0)}x`;
                    else displayValue = `S:/${(1/m).toFixed(0)}`;
                    suffix = '';
                }

                let displayEl = el.nextElementSibling;
                if (displayEl && !displayEl.classList.contains('value-display')) displayEl = el.parentElement.nextElementSibling;
                if(displayEl && displayEl.classList.contains('value-display')) displayEl.innerText = displayValue + suffix;
            }
        });
    }

    /**
     * Calculate and apply the sync'd scanSpeed value.
     * scanSpeed = (sampleDuration * multiplier) / loopDuration
     * where loopDuration = (60 / bpm) * (numSteps / 4)
     */
    _applyScanSync(t) {
        if (!t.buffer || !this._scheduler) return;
        
        const sampleDuration = t.buffer.duration;
        if (!sampleDuration || sampleDuration <= 0) return;
        
        const bpm = this._scheduler.getBPM();
        const numSteps = t.steps.length || 32;
        const loopDuration = (60 / bpm) * (numSteps / 4);
        
        if (loopDuration <= 0) return;

        // Account for Start/End window — only the active portion of the sample
        const start = t.params.sampleStart || 0;
        const end = t.params.sampleEnd !== undefined ? t.params.sampleEnd : 1;
        const windowFraction = Math.abs(end - start);
        const effectiveDuration = sampleDuration * (windowFraction || 1);
        
        // scanSpeed = how much of the buffer (0-1) to traverse per second
        // To read the full window in one loop: speed = windowFraction / loopDuration
        // With multiplier: faster or slower
        const sign = t.params.scanSpeed < 0 ? -1 : 1;
        const syncSpeed = (windowFraction / loopDuration) * t.scanSyncMultiplier;
        
        t.params.scanSpeed = sign * syncSpeed;
        
        // Update slider
        const slider = document.querySelector('input[data-param="scanSpeed"]');
        if (slider) slider.value = t.params.scanSpeed;
        
        this.updateKnobs();
    }

    /**
     * Called when BPM changes — recalculate sync for all synced tracks
     */
    onBpmChange() {
        this.tracks.forEach(t => {
            if (t.scanSync) this._applyScanSync(t);
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

    /** Update all .smp-slider elements from track.params.sampler */
    _updateSamplerSliders(t) {
        const sp = t.params.sampler;
        if (!sp) return;
        document.querySelectorAll('.smp-slider').forEach(el => {
            const key = el.dataset.smp;
            if (sp[key] !== undefined) {
                const isLog = el.dataset.log === '1';
                // For log sliders, convert Hz back to 0–1 normalized
                el.value = isLog ? Math.log(sp[key] / 20) / Math.log(1000) : sp[key];
                const valEl = el.nextElementSibling;
                if (valEl && valEl.classList.contains('smp-val')) {
                    valEl.textContent = this._fmtSmpVal(key, sp[key]);
                }
            }
        });
        document.querySelectorAll('.smp-select').forEach(el => {
            const key = el.dataset.smp;
            if (sp[key] !== undefined) el.value = sp[key];
        });
    }

    _fmtSmpVal(key, v) {
        if (key === 'pitchSemi') return v + ' st';
        if (key === 'pitchFine') return v + ' ct';
        if (key === 'lpf' || key === 'hpf') return Math.round(v) + ' Hz';
        if (key === 'voices') return Math.round(v);
        if (key === 'attack' || key === 'decay' || key === 'release') {
            return v < 1 ? Math.round(v * 1000) + 'ms' : v.toFixed(2) + 's';
        }
        if (key === 'volume' || key === 'sustain') return v.toFixed(2);
        return parseFloat(v).toFixed(3);
    }

    /** Draw the sampler scope — waveform zoomed to start/end region with markers */
    _drawSamplerScope(t) {
        const canvas = document.getElementById('samplerScopeCanvas');
        if (!canvas) return;
        canvas.width = canvas.parentElement ? canvas.parentElement.clientWidth - 4 : 300;
        canvas.height = 60;
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, w, h);

        if (!t.buffer) {
            ctx.fillStyle = '#333';
            ctx.font = '10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('No sample loaded', w / 2, h / 2 + 3);
            return;
        }

        const data = t.buffer.getChannelData(0);
        const sp = t.params.sampler || {};
        const startN = sp.start !== undefined ? sp.start : 0;
        const endN = sp.end !== undefined ? sp.end : 1;
        const isReverse = startN > endN;
        const loStart = Math.min(startN, endN);
        const loEnd = Math.max(startN, endN);

        // Zoom: add 10% padding around the region
        const regionSpan = loEnd - loStart;
        const pad = Math.max(0.02, regionSpan * 0.15);
        const viewStart = Math.max(0, loStart - pad);
        const viewEnd = Math.min(1, loEnd + pad);
        const viewSpan = viewEnd - viewStart;

        // Draw waveform (only the visible portion)
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i < w; i++) {
            const norm = viewStart + (i / w) * viewSpan;
            const idx = Math.floor(norm * data.length);
            const step = Math.max(1, Math.floor(data.length * viewSpan / w));
            let min = 0, max = 0;
            for (let j = 0; j < step && idx + j < data.length; j++) {
                const s = data[idx + j] || 0;
                if (s < min) min = s;
                if (s > max) max = s;
            }
            const yMin = h / 2 - max * h * 0.45;
            const yMax = h / 2 - min * h * 0.45;
            ctx.moveTo(i, yMin);
            ctx.lineTo(i, yMax);
        }
        ctx.stroke();

        // Dim outside region
        const x1 = Math.floor(((loStart - viewStart) / viewSpan) * w);
        const x2 = Math.floor(((loEnd - viewStart) / viewSpan) * w);
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        if (x1 > 0) ctx.fillRect(0, 0, x1, h);
        if (x2 < w) ctx.fillRect(x2, 0, w - x2, h);

        // Start marker
        const sx = Math.floor(((startN - viewStart) / viewSpan) * w);
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx, h); ctx.stroke();
        // Small label
        ctx.fillStyle = '#34d399';
        ctx.font = '7px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('S', Math.max(1, sx + 2), 9);

        // End marker
        const ex = Math.floor(((endN - viewStart) / viewSpan) * w);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(ex, 0); ctx.lineTo(ex, h); ctx.stroke();
        ctx.fillStyle = '#ef4444';
        ctx.textAlign = 'right';
        ctx.fillText('E', Math.min(w - 1, ex - 2), 9);

        // Direction arrow
        if (isReverse) {
            ctx.fillStyle = '#f59e0b';
            ctx.font = '8px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('◄ REV', (sx + ex) / 2, h - 3);
        }
    }
}