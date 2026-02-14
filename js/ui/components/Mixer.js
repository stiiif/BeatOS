// js/ui/components/Mixer.js
import { TRACKS_PER_GROUP } from '../../utils/constants.js';
import { globalBus } from '../../events/EventBus.js';
import { MixerAutomation } from '../../modules/MixerAutomation.js';
import { getEngineColor, hasTrigs, hasEngine } from '../../utils/engineColors.js';

export class Mixer {
    constructor(containerSelector, trackManager, audioEngine) {
        this.container = document.querySelector(containerSelector);
        this.trackManager = trackManager;
        this.audioEngine = audioEngine;
        this.isRendered = false;

        // Mixer Automation
        this.mixerAutomation = new MixerAutomation();
        this._isStarHeld = false;
        this._autoKnobs = [];
        this._autoFaders = [];
        this._scheduler = null; // Set by main.js
        this._headerEls = new Map(); // stripType:stripId -> header span element
        this.driveModes = [
            'Soft Clipping', 'Hard Clipping', 'Tube', 'Sigmoid', 
            'Arctan', 'Exponential', 'Cubic', 'Diode', 
            'Asymmetric', 'Foldback'
        ];
        
        // DOM Caches
        this.trackStripElements = new Map();
        this.groupStripElements = new Map();
        
        // Optimization: Single Overlay Canvas for Meters
        // Instead of 32+ individual canvases, we paint one layer over the whole mixer
        this.meterOverlay = null;
        this.meterCtx = null;
        this.meterRegistry = new Map(); 
        
        // Resize Observer
        this.resizeObserver = null;

        // Callbacks
        this.onMute = null;
        this.onSolo = null;
        this.onMuteGroup = null; 
        this.onSoloGroup = null;
        this.onSelect = null; // New Callback for selection

        // Animation Loop Binding
        this.animateMeters = this.animateMeters.bind(this);
        this.animationFrameId = null;
        this.lastMeterTime = 0; 

        // State Flag
        this.isMetering = false;
        this.isVisible = true;

        // LED Meter Configuration
        // 9 distinct levels: -20, -15, -10, -6, -3, 0, +3, +6, +10 (Clipping)
        // Normalized thresholds (approximate based on rms * 4 boosting logic)
        this.ledThresholds = [0.1, 0.2, 0.3, 0.45, 0.6, 0.75, 0.85, 0.95, 1.0];
        
        // Meter Physics Constants
        this.decayRate = 0.05; // Slower decay for smoother falloff
        this.smoothingFactor = 0.3; // Interpolation factor (lower = smoother/slower response)

        // Event Subscriptions
        globalBus.on('playback:start', () => {
            this.isMetering = true;
        });
        
        globalBus.on('playback:stop', () => {
            this.isMetering = false;
            this.clearMeters();
        });

        document.addEventListener('visibilitychange', () => {
            this.isVisible = !document.hidden;
        });

        // * key for automation record
        document.addEventListener('keydown', (e) => {
            if (e.key === '*' && !this._isStarHeld) {
                this._isStarHeld = true;
                this.mixerAutomation.startRecording();
                this._updateHeaderRecordState(true);
            }
        });
        document.addEventListener('keyup', (e) => {
            if (e.key === '*') {
                this._isStarHeld = false;
                this.mixerAutomation.stopRecording();
                this._updateHeaderRecordState(false);
                // Stop any active Automizer recordings
                if (this._onStarRelease) this._onStarRelease();
            }
        });
    }

    setScheduler(scheduler) {
        this._scheduler = scheduler;
    }

    /** Get current global automation resolution step for recording */
    _getCurrentStep256() {
        if (!this._scheduler || !this._scheduler.getIsPlaying()) return 0;
        const totalPlayed = this._scheduler.totalStepsPlayed || 0;
        const ctx = this.audioEngine.getContext();
        if (!ctx) return totalPlayed * 4;
        const bpm = this._scheduler.getBPM();
        const secPerStep = 60.0 / bpm / 4;
        const nextNoteTime = this._scheduler.nextNoteTime;
        const elapsed = ctx.currentTime - (nextNoteTime - secPerStep);
        const frac = Math.max(0, Math.min(1, elapsed / secPerStep));
        return Math.floor((totalPlayed + frac) * 4);
    }

    _getLoopFraction() {
        if (!this._scheduler || !this._scheduler.getIsPlaying()) return 0;
        const step = this._scheduler.getCurrentStep();
        const ctx = this.audioEngine.getContext();
        if (!ctx) return MixerAutomation.getLoopFraction(step);
        const bpm = this._scheduler.getBPM();
        const secPerStep = 60.0 / bpm / 4;
        const nextNoteTime = this._scheduler.nextNoteTime;
        const elapsed = ctx.currentTime - (nextNoteTime - secPerStep);
        const frac = Math.max(0, Math.min(1, elapsed / secPerStep));
        return MixerAutomation.getLoopFraction(step, frac);
    }

    /** Get monotonic global step position (fractional) for polymetric automation */
    _getGlobalStepFrac() {
        if (!this._scheduler || !this._scheduler.getIsPlaying()) return 0;
        const step = this._scheduler.getCurrentStep();
        const totalPlayed = this._scheduler.totalStepsPlayed || 0;
        const ctx = this.audioEngine.getContext();
        if (!ctx) return totalPlayed;
        const bpm = this._scheduler.getBPM();
        const secPerStep = 60.0 / bpm / 4;
        const nextNoteTime = this._scheduler.nextNoteTime;
        const elapsed = ctx.currentTime - (nextNoteTime - secPerStep);
        const frac = Math.max(0, Math.min(1, elapsed / secPerStep));
        return totalPlayed + frac;
    }

    _updateHeaderRecordState(isRecording) {
        this._headerEls.forEach((el, key) => {
            if (el) {
                el.style.color = isRecording ? '#ef4444' : '';
            }
        });
    }

    /**
     * Refresh track strip header colors (engine type) and no-trig dimming.
     * Call this after step changes, engine changes, or mute toggles.
     */
    refreshTrackVisuals() {
        if (!this.container) return;
        const tracks = this.trackManager.getTracks();
        const strips = this.container.querySelectorAll('.track-strip');
        tracks.forEach((track, i) => {
            const strip = strips[i];
            if (!strip) return;

            // Update header color
            const headerSpan = this._headerEls.get(`track:${track.id}`);
            if (headerSpan) {
                const ec = getEngineColor(track);
                headerSpan.style.color = ec.text;
            }

            // Dim if no trigs and not muted
            if (!track.muted) {
                strip.style.opacity = hasTrigs(track) ? '1' : '0.4';
            } else {
                strip.style.opacity = '0.4';
            }
        });
    }

    /** Check if a lane was written to during the current record pass */
    _recordingLanes_has(key) {
        return this.mixerAutomation && this.mixerAutomation._recordingLanes.has(key);
    }

    /**
     * Called from RenderLoop to apply automation playback to knobs/faders
     */
    updateAutomation() {
        if (!this.mixerAutomation || this.mixerAutomation.lanes.size === 0) return;
        if (!this._scheduler || !this._scheduler.getIsPlaying()) {
            // Clear position pips when stopped
            if (this._pipsActive) {
                for (const ak of this._autoKnobs) {
                    ak.knobOuter.style.background = '';
                    ak._recStartPos = undefined;
                }
                this._pipsActive = false;
            }
            return;
        }
        this._pipsActive = true;

        const globalStepFrac = this._getGlobalStepFrac();
        const isRecording = this.mixerAutomation.isRecording;
        const recordingLanes = this.mixerAutomation._recordingLanes;

        // Update knobs
        for (let i = 0; i < this._autoKnobs.length; i++) {
            const ak = this._autoKnobs[i];
            if (ak.isDragging && ak.isDragging()) continue;
            if (isRecording && recordingLanes.has(ak.key)) continue;
            const val = this.mixerAutomation.getValue(ak.key, globalStepFrac);
            if (val !== null) {
                ak.setCurrentValue(val);
                ak.updateRotation(val);
                ak.onChange(val);
            }
            // Position dot: only on knobs that have automation data
            const hasAuto = this.mixerAutomation.hasAutomation(ak.key);
            // Red trail: only on knobs that are actively being recorded (touched during this pass)
            const isActivelyRecording = isRecording && recordingLanes.has(ak.key);

            if (hasAuto || isActivelyRecording) {
                const pos = this.mixerAutomation.getLanePosition(ak.key, globalStepFrac);
                const showTrail = isActivelyRecording && ak._recStartPos !== undefined;
                this._drawKnobPip(ak.knobOuter, pos, showTrail, ak._recStartPos);
                if (isActivelyRecording && ak._recStartPos === undefined) {
                    ak._recStartPos = pos;
                }
            }
            if (!isRecording || !recordingLanes.has(ak.key)) {
                if (ak._recStartPos !== undefined) {
                    ak._recStartPos = undefined;
                    // If no automation, clear the background
                    if (!this.mixerAutomation.hasAutomation(ak.key)) {
                        ak.knobOuter.style.background = '';
                    }
                }
            }
        }

        // Update faders
        for (let i = 0; i < this._autoFaders.length; i++) {
            const af = this._autoFaders[i];
            if (af.isDragging && af.isDragging()) continue;
            if (isRecording && recordingLanes.has(af.key)) continue;
            const val = this.mixerAutomation.getValue(af.key, globalStepFrac);
            if (val !== null) {
                af.fader.value = val;
                af.onChange(val);
            }
        }

        // Update LCM display
        this._updateLCMDisplay();
    }

    _updateLCMDisplay() {
        const el = document.getElementById('lcmDisplay');
        if (!el) return;
        if (this.mixerAutomation.lanes.size === 0) { el.textContent = '--'; return; }
        const bpm = this._scheduler ? this._scheduler.getBPM() : 120;
        el.textContent = this.mixerAutomation.formatLCMTime(bpm);
    }

    _showLoopLengthMenu(x, y, autoKey) {
        // Remove existing menu if any
        this._hideLoopLengthMenu();

        const currentLen = this.mixerAutomation.getLaneLoopLength(autoKey);
        const menu = document.createElement('div');
        menu.className = 'auto-loop-menu';
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';

        const title = document.createElement('div');
        title.className = 'auto-loop-title';
        title.textContent = 'LOOP LENGTH';
        menu.appendChild(title);

        const sel = document.createElement('select');
        sel.className = 'auto-loop-select';
        // Presets: powers of 2, common, primes
        const presets = [2,3,4,5,6,7,8,10,11,12,13,14,16,17,19,20,23,24,29,31,32,37,41,43,47,48,53,59,61,64,67,71,73,79,83,89,96,97,101,103,107,109,113,127,128];
        for (const v of presets) {
            const opt = document.createElement('option');
            opt.value = v; opt.textContent = v + ' stp';
            if (v === currentLen) opt.selected = true;
            sel.appendChild(opt);
        }
        sel.addEventListener('change', () => {
            const newLen = parseInt(sel.value);
            if (this.mixerAutomation.hasAutomation(autoKey)) {
                this.mixerAutomation.setLaneLoopLength(autoKey, newLen);
            } else {
                // Pre-configure: store pending length for when recording starts on this key
                if (!this.mixerAutomation._pendingLengths) this.mixerAutomation._pendingLengths = new Map();
                this.mixerAutomation._pendingLengths.set(autoKey, newLen);
            }
            // Update knob tooltip
            this._autoKnobs.forEach(ak => { if (ak.key === autoKey) ak.updateAutoBorder(); });
            this._updateLCMDisplay();
            this._hideLoopLengthMenu();
        });
        menu.appendChild(sel);

        // Clear lane button
        const clearBtn = document.createElement('button');
        clearBtn.className = 'auto-loop-clear';
        clearBtn.textContent = 'CLEAR';
        clearBtn.addEventListener('click', () => {
            this.mixerAutomation.clearLane(autoKey);
            // Update border on matching knob
            this._autoKnobs.forEach(ak => { if (ak.key === autoKey) { ak.updateAutoBorder(); ak.knobOuter.style.background = ''; } });
            this._updateLCMDisplay();
            this._hideLoopLengthMenu();
        });
        menu.appendChild(clearBtn);

        document.body.appendChild(menu);
        this._loopMenu = menu;

        // Close on click outside
        const closeHandler = (e) => {
            if (!menu.contains(e.target)) { this._hideLoopLengthMenu(); document.removeEventListener('mousedown', closeHandler); }
        };
        setTimeout(() => document.addEventListener('mousedown', closeHandler), 10);
    }

    _hideLoopLengthMenu() {
        if (this._loopMenu) { this._loopMenu.remove(); this._loopMenu = null; }
    }

    /**
     * Draw a position dot on the knob's outer ring.
     * Uses radial-gradient for a true circular dot positioned on the ring edge.
     * When recording a lane, adds a red trail arc from start to current position.
     * @param {HTMLElement} el - knobOuter element (assumed to be a circle via border-radius)
     * @param {number} pos - 0.0–1.0 loop position
     * @param {boolean} showTrail - show red recording trail
     * @param {number|undefined} recStartPos - position when recording started
     */
    _drawKnobPip(el, pos, showTrail, recStartPos) {
        // Compute dot position on the outer edge of the knob circle
        // Angle: 0 = top (12 o'clock), clockwise
        const angle = pos * Math.PI * 2 - Math.PI / 2;
        // Place dot at ~45% from center (on the edge of the knob-outer ring)
        const radius = 45; // % from center
        const dotX = 50 + Math.cos(angle) * radius;
        const dotY = 50 + Math.sin(angle) * radius;
        const dotR = 4; // dot radius in % of element

        const layers = [];

        // Layer 1: red trail arc (only when actively recording this knob)
        if (showTrail && recStartPos !== undefined) {
            const startDeg = recStartPos * 360;
            const endDeg = pos * 360;
            let arcSpan;
            if (endDeg >= startDeg) {
                arcSpan = endDeg - startDeg;
            } else {
                arcSpan = (360 - startDeg) + endDeg;
            }
            layers.push(
                `conic-gradient(from ${startDeg}deg at 50% 50%, ` +
                `rgba(239,68,68,0.3) 0deg, rgba(239,68,68,0.3) ${arcSpan}deg, ` +
                `transparent ${arcSpan}deg)`
            );
        }

        // Layer 2: the dot itself
        const dotColor = showTrail ? '#ef4444' : '#f5f0e0';
        const glowColor = showTrail ? 'rgba(239,68,68,0.5)' : 'rgba(245,240,224,0.3)';
        layers.push(
            `radial-gradient(circle ${dotR}px at ${dotX}% ${dotY}%, ${dotColor} 0%, ${glowColor} 60%, transparent 100%)`
        );

        el.style.background = layers.join(', ');
    }

    setCallbacks(onMute, onSolo, onMuteGroup, onSoloGroup, onSelect) {
        this.onMute = onMute;
        this.onSolo = onSolo;
        this.onMuteGroup = onMuteGroup;
        this.onSoloGroup = onSoloGroup;
        this.onSelect = onSelect;
    }

    updateTrackState(trackId) {
        const track = this.trackManager.getTracks()[trackId];
        const els = this.trackStripElements.get(trackId);
        if (track && els) {
            els.muteBtn.classList.toggle('active', track.muted);
            els.soloBtn.classList.toggle('active', track.soloed);
        }
    }

    updateGroupState(groupIndex) {
        const startTrackId = groupIndex * TRACKS_PER_GROUP;
        const track = this.trackManager.getTracks()[startTrackId];
        const els = this.groupStripElements.get(groupIndex);
        if (track && els) {
            els.muteBtn.classList.toggle('active', track.muted);
            els.soloBtn.classList.toggle('active', track.soloed);
        }
    }

    updateAllTrackStates() {
        const tracks = this.trackManager.getTracks();
        tracks.forEach(t => this.updateTrackState(t.id));
        const numGroups = Math.ceil(tracks.length / TRACKS_PER_GROUP);
        for(let i=0; i<numGroups; i++) this.updateGroupState(i);
    }

    render() {
        if (!this.container) return;
        
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
        
        this.container.innerHTML = '';
        this.trackStripElements.clear(); 
        this.groupStripElements.clear(); 
        this.meterRegistry.clear();
        this._autoKnobs = [];
        this._autoFaders = [];
        this._headerEls.clear();
        
        const mixerContainer = document.createElement('div');
        mixerContainer.className = 'mixer-container custom-scrollbar';
        mixerContainer.style.position = 'relative';
        
        // --- SINGLE CANVAS OVERLAY SETUP ---
        this.meterOverlay = document.createElement('canvas');
        this.meterOverlay.id = 'meterOverlay';
        this.meterOverlay.style.position = 'absolute';
        this.meterOverlay.style.top = '0';
        this.meterOverlay.style.left = '0';
        this.meterOverlay.style.pointerEvents = 'none';
        this.meterOverlay.style.zIndex = '5'; 
        
        this.meterCtx = this.meterOverlay.getContext('2d');
        
        const tracks = this.trackManager.getTracks();
        
        mixerContainer.appendChild(this.createLabelStrip());

        tracks.forEach(track => {
            mixerContainer.appendChild(this.createTrackStrip(track));
        });

        for(let i=0; i<4; i++) {
            // Only show group if it has at least one track
            const startTrack = i * TRACKS_PER_GROUP;
            const endTrack = Math.min(startTrack + TRACKS_PER_GROUP, tracks.length);
            if (startTrack < tracks.length) {
                mixerContainer.appendChild(this.createGroupStrip(i));
            }
        }

        if (this.audioEngine.returnBuses) {
            this.audioEngine.returnBuses.forEach((bus, i) => {
                mixerContainer.appendChild(this.createReturnStrip(bus, i));
            });
        }

        mixerContainer.appendChild(this.createMasterStrip());
        mixerContainer.appendChild(this.meterOverlay);

        this.container.appendChild(mixerContainer);
        this.isRendered = true;
        
        // Initialize ResizeObserver
        this.resizeObserver = new ResizeObserver(() => {
            this.resizeOverlay();
        });
        this.resizeObserver.observe(mixerContainer);
        
        requestAnimationFrame(() => {
            this.resizeOverlay();
        });
        
        window.addEventListener('resize', () => this.resizeOverlay());

        this.updateAllTrackStates();
        // Meters now driven by RenderLoop — no self-start needed
    }
    
    // OPTIMIZATION: Cache Layout Geometry to avoid 'Forced Reflow'
    resizeOverlay() {
        const container = this.container.querySelector('.mixer-container');
        if (container && this.meterOverlay) {
            if (this.meterOverlay.width !== container.scrollWidth || 
                this.meterOverlay.height !== container.scrollHeight) {
                this.meterOverlay.width = container.scrollWidth;
                this.meterOverlay.height = container.scrollHeight;
            }

            // Calculations must be relative to the container, not offsetParent (which is the strip)
            const containerRect = container.getBoundingClientRect();
            const scrollLeft = container.scrollLeft;
            const scrollTop = container.scrollTop;

            this.meterRegistry.forEach((meta) => {
                const el = meta.el;
                const rect = el.getBoundingClientRect();
                
                // Calculate position relative to the CANVAS (which matches scrollWidth)
                // We add scrollLeft back because the canvas scrolls with the content
                meta.cachedX = (rect.left - containerRect.left) + scrollLeft;
                meta.cachedY = (rect.top - containerRect.top) + scrollTop;
                meta.cachedH = el.offsetHeight;
            });
        }
    }

    setTrackStripWidth(widthPx) {
        document.documentElement.style.setProperty('--track-width', `${widthPx}px`);
        setTimeout(() => this.resizeOverlay(), 350);
    }

    animateMeters(timestamp) {
        if (!this.isRendered || !this.meterCtx || !this.meterOverlay || !this.isVisible) return;

        if (!this.isMetering) {
            this.clearMeters();
            return; 
        }

        // Check if mixer container is visible
        if (this.container && this.container.offsetParent === null) return;

        const container = this.container.querySelector('.mixer-container');
        if (!container) return;

        // Use cached scroll position (updated by scroll event listener)
        if (this._cachedScrollContainer !== container) {
            this._cachedScrollContainer = container;
            this._cachedScrollLeft = container.scrollLeft;
            this._cachedContainerW = container.clientWidth;
            container.addEventListener('scroll', () => {
                this._cachedScrollLeft = container.scrollLeft;
            }, { passive: true });
            // Update width on resize 
            new ResizeObserver(() => {
                this._cachedContainerW = container.clientWidth;
            }).observe(container);
        }
        const scrollLeft = this._cachedScrollLeft || 0;
        const containerW = this._cachedContainerW || container.clientWidth;

        this.meterCtx.clearRect(0, 0, this.meterOverlay.width, this.meterOverlay.height);

        // Meter Dimensions
        const meterW = 4; // Width of the LED strip
        const numLeds = 9; 
        
        // Iterate Registry
        this.meterRegistry.forEach((meta, id) => {
            if (!meta.analyser) return;
            
            // B11: Skip silent meters — don't read analyser if output is negligible
            if (meta.currentValue < 0.005 && meta.targetValue < 0.005) {
                meta._silentFrames = (meta._silentFrames || 0) + 1;
                if (meta._silentFrames > 3) return; // Skip after 3 consecutive silent frames
            } else {
                meta._silentFrames = 0;
            }

            const x = meta.cachedX - scrollLeft;
            
            // Culling: Skip if outside visible viewport
            if (x < -20 || x > containerW + 20) return;

            const meterH = meta.cachedH * 0.96; 
            const meterY = meta.cachedY + (meta.cachedH * 0.02); 
            const meterX = meta.cachedX + 2; // Draw at absolute coordinate on canvas

            // Use pre-allocated buffer
            const dataArray = meta.dataArray;
            meta.analyser.getByteTimeDomainData(dataArray);

            let sum = 0;
            // Step optimization: Read every 4th sample
            const step = 4;
            const len = dataArray.length;
            for(let i = 0; i < len; i += step) { 
                const val = (dataArray[i] - 128) / 128.0;
                sum += val * val;
            }
            const rms = Math.sqrt(sum / (len / step));
            let rawValue = Math.min(1, rms * 4); // Gain boost for visual range
            
            if (rawValue >= meta.targetValue) {
                meta.targetValue = rawValue;
            } else {
                meta.targetValue -= this.decayRate;
                if (meta.targetValue < 0) meta.targetValue = 0;
            }

            meta.currentValue += (meta.targetValue - meta.currentValue) * this.smoothingFactor;

            if (meta.currentValue < 0.01) {
                meta.currentValue = 0;
                if(rawValue < 0.01) meta.targetValue = 0;
            }

            let activeLeds = 0;
            for(let i=0; i<numLeds; i++) {
                if(meta.currentValue >= this.ledThresholds[i]) {
                    activeLeds = i + 1;
                } else {
                    break;
                }
            }

            if (activeLeds === 0) return;

            const ledHeight = (meterH / numLeds) - 1;
            
            for(let i=0; i<activeLeds; i++) {
                if(i < 5) this.meterCtx.fillStyle = '#10b981';
                else if(i < 7) this.meterCtx.fillStyle = '#eab308';
                else this.meterCtx.fillStyle = '#ef4444';

                const y = (meterY + meterH) - ((i + 1) * (ledHeight + 1));
                this.meterCtx.fillRect(meterX, y, meterW, ledHeight);
            }
        });
    }

    clearMeters() {
        if(this.meterCtx && this.meterOverlay) {
            this.meterCtx.clearRect(0, 0, this.meterOverlay.width, this.meterOverlay.height);
        }
    }

    createKnob(label, value, min, max, step, onChange, colorClass = '', showLabel = false, autoKey = null) {
        const wrapper = document.createElement('div');
        wrapper.className = 'mixer-pot track-item';
        
        if (showLabel) {
            const lbl = document.createElement('label');
            lbl.innerText = label;
            wrapper.appendChild(lbl);
        }

        const knobOuter = document.createElement('div');
        knobOuter.className = `knob-outer ${colorClass}`;
        
        const knobInner = document.createElement('div');
        knobInner.className = 'knob-inner';
        
        const line = document.createElement('div');
        line.className = 'knob-line';
        
        const tooltip = document.createElement('div');
        tooltip.className = 'knob-value-tip';
        tooltip.innerText = value.toFixed(step < 1 ? 2 : 0);

        knobInner.appendChild(line);
        knobOuter.appendChild(knobInner);
        knobOuter.appendChild(tooltip);
        wrapper.appendChild(knobOuter);

        let currentValue = value;
        let startY = 0;
        let startVal = 0;
        let isDragging = false;

        const updateRotation = (val) => {
            const range = max - min;
            const pct = (val - min) / range;
            const deg = -135 + (pct * 270);
            knobInner.style.transform = `rotate(${deg}deg)`;
            tooltip.innerText = val.toFixed(step < 1 ? 2 : 0);
        };

        // Automation border update — dim ring when has automation
        const updateAutoBorder = () => {
            if (autoKey && this.mixerAutomation && this.mixerAutomation.hasAutomation(autoKey)) {
                knobOuter.style.outline = '1.5px solid rgba(245, 240, 224, 0.25)';
                knobOuter.style.outlineOffset = '1px';
                const len = this.mixerAutomation.getLaneLoopLength(autoKey);
                knobOuter.title = `${label} — Auto: ${len} stp (right-click)`;
            } else {
                knobOuter.style.outline = '';
                knobOuter.style.outlineOffset = '';
                knobOuter.style.background = '';
                const pendingLen = this.mixerAutomation && this.mixerAutomation._pendingLengths
                    ? this.mixerAutomation._pendingLengths.get(autoKey) : null;
                knobOuter.title = pendingLen
                    ? `${label} — Pre-set: ${pendingLen} stp (right-click)`
                    : `${label || ''} (right-click for loop length)`;
            }
        };

        updateRotation(currentValue);

        // Store references for playback updates
        if (autoKey) {
            if (!this._autoKnobs) this._autoKnobs = [];
            this._autoKnobs.push({ key: autoKey, updateRotation, updateAutoBorder, knobOuter, onChange, min, max, step, getCurrentValue: () => currentValue, setCurrentValue: (v) => { currentValue = v; }, isDragging: () => isDragging });
            updateAutoBorder();
        }

        knobOuter.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return; // Left click only
            isDragging = true;
            startY = e.clientY;
            startVal = currentValue;
            wrapper.classList.add('dragging');
            document.body.style.cursor = 'ns-resize'; 
            e.preventDefault();
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });

        // Right-click: loop length menu for this automation lane
        if (autoKey) {
            knobOuter.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this._showLoopLengthMenu(e.clientX, e.clientY, autoKey);
            });
        }

        const onMouseMove = (e) => {
            if (!isDragging) return;
            const deltaY = startY - e.clientY;
            const range = max - min;
            const sensitivity = range / 200; 
            let newVal = startVal + (deltaY * sensitivity);
            newVal = Math.max(min, Math.min(max, newVal));
            if (step > 0) newVal = Math.round(newVal / step) * step;
            if (newVal !== currentValue) {
                // If has automation and not recording, apply as offset
                if (autoKey && this.mixerAutomation && this.mixerAutomation.hasAutomation(autoKey) && !this._isStarHeld) {
                    const delta = newVal - currentValue;
                    this.mixerAutomation.addOffset(autoKey, delta);
                    currentValue = newVal;
                    return;
                }
                currentValue = newVal;
                updateRotation(currentValue);
                onChange(currentValue);
                // Record if * is held
                if (autoKey && this._isStarHeld && this.mixerAutomation && this.mixerAutomation.isRecording) {
                    const step256 = this._getCurrentStep256();
                    this.mixerAutomation.recordValue(autoKey, currentValue, step256, min, max);
                    updateAutoBorder();
                }
            }
        };

        const onMouseUp = () => {
            isDragging = false;
            wrapper.classList.remove('dragging');
            document.body.style.cursor = '';
            // Check if this was a click (no drag movement) with * held = clear automation
            if (autoKey && this._isStarHeld && this.mixerAutomation && !this._recordingLanes_has(autoKey)) {
                this.mixerAutomation.clearLane(autoKey);
                updateAutoBorder();
            }
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        knobOuter.addEventListener('dblclick', () => {
            let target = 0;
            if (min >= 0) target = min; 
            if (min < 0 && max > 0) target = 0; 
            if (label === 'Freq') target = 1000;
            if (label === 'Gain') target = 1.0;
            currentValue = target;
            updateRotation(currentValue);
            onChange(currentValue);
        });

        return wrapper;
    }

    createFaderSection(busObject, onChange, idForMeter, autoKey = null) {
        const section = document.createElement('div');
        section.className = 'strip-fader-section';

        const btnRow = document.createElement('div');
        btnRow.className = 'strip-btn-row';
        
        const muteBtn = document.createElement('button');
        muteBtn.className = 'mixer-btn mute';
        muteBtn.innerText = 'M';
        
        const soloBtn = document.createElement('button');
        soloBtn.className = 'mixer-btn solo';
        soloBtn.innerText = 'S';

        btnRow.appendChild(muteBtn);
        btnRow.appendChild(soloBtn);
        section.appendChild(btnRow);

        const wrapper = document.createElement('div');
        wrapper.className = 'fader-wrapper';

        const bgSlot = document.createElement('div');
        bgSlot.className = 'fader-bg-slot';
        wrapper.appendChild(bgSlot);

        let analyserNode = null;
        if (busObject) {
            if (busObject.analyser) {
                analyserNode = busObject.analyser;
            } else if (busObject.bus && busObject.bus.analyser) {
                analyserNode = busObject.bus.analyser;
            }
        }

        if (analyserNode) {
            const bufferLength = analyserNode.frequencyBinCount;
            this.meterRegistry.set(idForMeter, {
                el: wrapper,
                analyser: analyserNode,
                dataArray: new Uint8Array(bufferLength), // Pre-allocate buffer
                currentValue: 0, // Current DISPLAYED value (for smoothing)
                targetValue: 0   // Current TARGET value (peak hold/decay)
            });
        }

        const ruler = document.createElement('div');
        ruler.className = 'fader-ruler';
        wrapper.appendChild(ruler);

        const fader = document.createElement('input');
        fader.type = 'range';
        fader.className = 'v-fader';
        fader.min = 0; fader.max = 1.2; fader.step = 0.01;
        fader.value = busObject && busObject.params ? busObject.params.volume : (busObject && busObject.volume ? busObject.volume.gain.value : 1.0);

        const updateAutoBorder = () => {
            if (autoKey && this.mixerAutomation && this.mixerAutomation.hasAutomation(autoKey)) {
                fader.style.outline = '1.5px solid #f5f0e0';
                fader.style.outlineOffset = '-1px';
            } else {
                fader.style.outline = '';
                fader.style.outlineOffset = '';
            }
        };

        let faderDragging = false;

        fader.oninput = (e) => {
            const val = parseFloat(e.target.value);
            // If has automation and not recording, apply as offset
            if (autoKey && this.mixerAutomation && this.mixerAutomation.hasAutomation(autoKey) && !this._isStarHeld) {
                // Offset mode handled in playback — just record delta
                return;
            }
            onChange(val);
            // Record if * held
            if (autoKey && this._isStarHeld && this.mixerAutomation && this.mixerAutomation.isRecording) {
                const step256 = this._getCurrentStep256();
                this.mixerAutomation.recordValue(autoKey, val, step256, 0, 1.2);
                updateAutoBorder();
            }
        };

        fader.addEventListener('mousedown', (e) => {
            faderDragging = true;
        });
        fader.addEventListener('mouseup', () => {
            faderDragging = false;
            // * + click (no drag movement) = clear automation
            if (autoKey && this._isStarHeld && this.mixerAutomation && !this._recordingLanes_has(autoKey)) {
                this.mixerAutomation.clearLane(autoKey);
                updateAutoBorder();
            }
        });

        // Store for playback
        if (autoKey) {
            if (!this._autoFaders) this._autoFaders = [];
            this._autoFaders.push({ key: autoKey, fader, updateAutoBorder, onChange, isDragging: () => faderDragging });
            updateAutoBorder();
        }
        
        wrapper.appendChild(fader);
        section.appendChild(wrapper);

        return { section, muteBtn, soloBtn, fader };
    }

    createLabelStrip() {
        const strip = document.createElement('div');
        strip.className = 'mixer-strip label-strip';
        
        const header = document.createElement('div');
        header.className = 'strip-header';
        
        const widthSlider = document.createElement('input');
        widthSlider.type = 'range';
        widthSlider.className = 'width-slider';
        widthSlider.min = 18; widthSlider.max = 42; widthSlider.value = 42;
        widthSlider.title = "Adjust Track Width";
        widthSlider.oninput = (e) => this.setTrackStripWidth(e.target.value);
        
        header.appendChild(widthSlider);
        strip.appendChild(header);

        const controls = document.createElement('div');
        controls.className = 'strip-controls';

        const createLabel = (text) => {
            const div = document.createElement('div');
            div.className = 'mixer-pot label-item'; 
            const lbl = document.createElement('label');
            lbl.innerText = text;
            div.appendChild(lbl);
            return div;
        };

        controls.appendChild(createLabel('Gain'));
        controls.appendChild(createLabel('Hi'));
        controls.appendChild(createLabel('Mid'));
        controls.appendChild(createLabel('Freq'));
        controls.appendChild(createLabel('Low'));
        controls.appendChild(createLabel('Snd A'));
        controls.appendChild(createLabel('Snd B'));
        controls.appendChild(createLabel('Drive'));
        controls.appendChild(createLabel('Comp'));
        controls.appendChild(createLabel('Pan'));

        strip.appendChild(controls);
        
        const faderSpacer = document.createElement('div');
        faderSpacer.className = 'strip-fader-section'; 
        faderSpacer.style.borderTop = '1px solid transparent'; 
        strip.appendChild(faderSpacer);

        return strip;
    }

    createTrackStrip(track) {
        const strip = document.createElement('div');
        strip.className = 'mixer-strip track-strip';
        
        // --- Dynamic Background Color Based on Group ---
        const groupIndex = Math.floor(track.id / TRACKS_PER_GROUP);
        // HSL tint: (Group * 45) deg, low saturation, very low lightness
        // This creates a "tiny amount of ink" in the dark grey
        const hue = groupIndex * 45;
        strip.style.backgroundColor = `hsl(${hue}, 20%, 12%)`; 
        strip.style.borderColor = `hsl(${hue}, 30%, 20%)`; // Slightly lighter border for definition

        const header = document.createElement('div');
        header.className = 'strip-header';
        header.style.cursor = 'pointer';
        const headerSpan = document.createElement('span');
        headerSpan.className = 'strip-num';

        // Color header by engine type
        const ec = getEngineColor(track);
        headerSpan.style.color = ec.text;
        headerSpan.innerText = track.id + 1;

        header.appendChild(headerSpan);
        this._headerEls.set(`track:${track.id}`, headerSpan);

        // Dim entire strip if no trigs (and not muted — mute dimming is handled elsewhere)
        if (!hasTrigs(track) && !track.muted) {
            strip.style.opacity = '0.4';
        }
        header.onclick = () => {
            if (this._isStarHeld && this.mixerAutomation) {
                // * + click on header = clear all automation for this track
                const cleared = this.mixerAutomation.clearStrip('track', track.id);
                // Update borders for all cleared knobs
                this._autoKnobs.forEach(ak => { if (cleared.includes(ak.key)) ak.updateAutoBorder(); });
                this._autoFaders.forEach(af => { if (cleared.includes(af.key)) af.updateAutoBorder(); });
                return;
            }
            if (this.onSelect) this.onSelect(track.id);
        };
        strip.appendChild(header);

        const controls = document.createElement('div');
        controls.className = 'strip-controls'; 
        controls.style.background = `linear-gradient(180deg, hsl(${hue}, 20%, 12%) 0%, hsl(${hue}, 20%, 10%) 100%)`;

        const getBus = () => track.bus;
        const tk = (param) => MixerAutomation.laneKey('track', track.id, param);

        controls.appendChild(this.createKnob('Gain', track.params.gain || 1, 0, 2, 0.01, (v) => { track.params.gain = v; const bus = getBus(); if(bus && bus.trim) bus.trim.gain.value = v; }, 'knob-color-green', false, tk('gain')));
        controls.appendChild(this.createKnob('Hi', track.params.eqHigh || 0, -15, 15, 0.1, (v) => { track.params.eqHigh = v; const bus = getBus(); if(bus && bus.eq && bus.eq.high) bus.eq.high.gain.value = v; }, 'knob-color-blue', false, tk('eqHigh')));
        controls.appendChild(this.createKnob('Mid', track.params.eqMid || 0, -15, 15, 0.1, (v) => { track.params.eqMid = v; const bus = getBus(); if(bus && bus.eq && bus.eq.mid) bus.eq.mid.gain.value = v; }, 'knob-color-green', false, tk('eqMid')));
        controls.appendChild(this.createKnob('Freq', track.params.eqMidFreq || 1000, 200, 5000, 10, (v) => { track.params.eqMidFreq = v; const bus = getBus(); if(bus && bus.eq && bus.eq.mid) bus.eq.mid.frequency.value = v; }, 'knob-color-green', false, tk('eqMidFreq')));
        controls.appendChild(this.createKnob('Lo', track.params.eqLow || 0, -15, 15, 0.1, (v) => { track.params.eqLow = v; const bus = getBus(); if(bus && bus.eq && bus.eq.low) bus.eq.low.gain.value = v; }, 'knob-color-red', false, tk('eqLow')));
        controls.appendChild(this.createKnob('A', track.params.sendA || 0, 0, 1, 0.01, (v) => { track.params.sendA = v; if(track.bus && track.bus.sendA) track.bus.sendA.gain.value = v; }, 'knob-color-yellow', false, tk('sendA')));
        controls.appendChild(this.createKnob('B', track.params.sendB || 0, 0, 1, 0.01, (v) => { track.params.sendB = v; if(track.bus && track.bus.sendB) track.bus.sendB.gain.value = v; }, 'knob-color-yellow', false, tk('sendB')));
        controls.appendChild(this.createKnob('Drive', track.params.drive || 0, 0, 1, 0.01, (v) => { track.params.drive = v; const bus = getBus(); if(bus && bus.drive && bus.drive.input) this.audioEngine.setDriveAmount(bus.drive.input, v); }, 'knob-color-red', false, tk('drive')));
        controls.appendChild(this.createKnob('Comp', track.params.comp || 0, 0, 1, 0.01, (v) => { track.params.comp = v; const bus = getBus(); if(bus && bus.comp) this.audioEngine.setCompAmount(bus.comp, v); }, 'knob-color-purple', false, tk('comp')));
        controls.appendChild(this.createKnob('Pan', track.params.pan, -1, 1, 0.01, (v) => { track.params.pan = v; const bus = getBus(); if(bus && bus.pan) bus.pan.pan.value = v; }, 'knob-color-blue', false, tk('pan')));

        strip.appendChild(controls);

        const faderComp = this.createFaderSection(track, (v) => {
            track.params.volume = v;
            const bus = getBus();
            if(bus && bus.vol) bus.vol.gain.value = v;
        }, track.id, tk('volume')); 

        faderComp.muteBtn.className += ` ${track.muted ? 'active' : ''}`;
        faderComp.muteBtn.onclick = () => { if (this.onMute) this.onMute(track.id); };
        
        faderComp.soloBtn.className += ` ${track.soloed ? 'active' : ''}`;
        faderComp.soloBtn.onclick = () => { if (this.onSolo) this.onSolo(track.id); };

        this.trackStripElements.set(track.id, { muteBtn: faderComp.muteBtn, soloBtn: faderComp.soloBtn });
        strip.appendChild(faderComp.section);

        return strip;
    }

    createGroupStrip(index) {
        const strip = document.createElement('div');
        strip.className = 'mixer-strip group-strip';

        // Color group strip with the same group color as the sequencer
        const hue = index * 45;
        strip.style.backgroundColor = `hsl(${hue}, 25%, 12%)`;
        strip.style.borderColor = `hsl(${hue}, 40%, 25%)`;

        const getBus = () => this.audioEngine.groupBuses[index];
        const gk = (param) => MixerAutomation.laneKey('group', index, param);
        
        const header = document.createElement('div');
        header.className = 'strip-header';
        const headerSpan = document.createElement('span');
        headerSpan.className = 'strip-name';
        headerSpan.style.color = `hsl(${hue}, 70%, 60%)`;
        headerSpan.innerText = `GRP ${index+1}`;
        header.appendChild(headerSpan);
        this._headerEls.set(`group:${index}`, headerSpan);
        header.style.cursor = 'pointer';
        header.onclick = () => {
            if (this._isStarHeld && this.mixerAutomation) {
                const cleared = this.mixerAutomation.clearStrip('group', index);
                this._autoKnobs.forEach(ak => { if (cleared.includes(ak.key)) ak.updateAutoBorder(); });
                this._autoFaders.forEach(af => { if (cleared.includes(af.key)) af.updateAutoBorder(); });
            }
        };
        strip.appendChild(header);

        const controls = document.createElement('div');
        controls.className = 'strip-controls'; 

        controls.appendChild(this.createKnob('Comp', 0, 0, 1, 0.01, (v) => {
            const bus = getBus(); if(bus && bus.comp) this.audioEngine.setCompAmount(bus.comp, v);
        }, 'knob-color-purple', true, gk('comp')));

        const driveDiv = document.createElement('div');
        driveDiv.className = 'eq-section';
        driveDiv.innerHTML = `<div class="section-label">DIST</div>`;
        const driveSel = document.createElement('select');
        driveSel.className = 'drive-select';
        this.driveModes.forEach(mode => {
            const opt = document.createElement('option'); opt.value = mode; opt.innerText = mode; driveSel.appendChild(opt);
        });
        driveSel.onchange = (e) => {
            const bus = getBus(); if(bus && bus.drive && bus.drive.shaper) bus.drive.shaper.curve = this.audioEngine.driveCurves[e.target.value];
        };
        driveDiv.appendChild(driveSel);
        driveDiv.appendChild(this.createKnob('Amt', 0, 0, 1, 0.01, (v) => {
            const bus = getBus(); if(bus && bus.drive && bus.drive.input) this.audioEngine.setDriveAmount(bus.drive.input, v);
        }, 'knob-color-red', true, gk('driveAmt')));
        controls.appendChild(driveDiv);

        const sendSec = document.createElement('div');
        sendSec.className = 'eq-section';
        sendSec.innerHTML = `<div class="section-label">SENDS</div>`;
        sendSec.appendChild(this.createKnob('A', 0, 0, 1, 0.01, (v) => { const bus = getBus(); if(bus && bus.sendA) bus.sendA.gain.value = v; }, 'knob-color-yellow', true, gk('sendA')));
        sendSec.appendChild(this.createKnob('B', 0, 0, 1, 0.01, (v) => { const bus = getBus(); if(bus && bus.sendB) bus.sendB.gain.value = v; }, 'knob-color-yellow', true, gk('sendB')));
        controls.appendChild(sendSec);

        const eqSec = document.createElement('div');
        eqSec.className = 'eq-section';
        eqSec.innerHTML = `<div class="section-label">KILL</div>`;
        const killRow = document.createElement('div');
        killRow.className = 'strip-btn-row';
        ['HI', 'MID', 'LO'].forEach(band => {
            const btn = document.createElement('button');
            btn.className = 'mixer-btn kill'; btn.innerText = band;
            btn.onclick = () => {
                btn.classList.toggle('active');
                const isKill = btn.classList.contains('active'); const gainVal = isKill ? -40 : 0; const bus = getBus();
                if(bus && bus.eq) {
                    if(band === 'HI') bus.eq.high.gain.value = gainVal;
                    if(band === 'MID') bus.eq.mid.gain.value = gainVal;
                    if(band === 'LO') bus.eq.low.gain.value = gainVal;
                }
            };
            killRow.appendChild(btn);
        });
        eqSec.appendChild(killRow);
        controls.appendChild(eqSec);
        strip.appendChild(controls);

        const faderComp = this.createFaderSection(this.audioEngine.groupBuses[index], (v) => {
            const bus = getBus(); if(bus && bus.volume) bus.volume.gain.value = v;
        }, `group_${index}`, gk('volume'));

        faderComp.muteBtn.onclick = () => { if (this.onMuteGroup) this.onMuteGroup(index); };
        faderComp.soloBtn.onclick = () => { if (this.onSoloGroup) this.onSoloGroup(index); };
        this.groupStripElements.set(index, { muteBtn: faderComp.muteBtn, soloBtn: faderComp.soloBtn });
        
        strip.appendChild(faderComp.section);
        return strip;
    }

    createReturnStrip(busObject, index) {
        const strip = document.createElement('div');
        strip.className = 'mixer-strip group-strip'; 
        
        // --- 3. FIX: Removed glossy border, using subtle background tint instead ---
        if (index === 0) {
            strip.style.backgroundColor = '#1a221e'; // Subtle Emerald Tint (Very Dark)
            strip.style.border = '1px solid #333';   // Standard border
        } else {
            strip.style.backgroundColor = '#221a22'; // Subtle Purple Tint (Very Dark)
            strip.style.border = '1px solid #333';   // Standard border
        }

        const header = document.createElement('div');
        header.className = 'strip-header';
        const label = index === 0 ? 'RTN A' : 'RTN B';
        const color = index === 0 ? '#10b981' : '#a855f7';
        const headerSpan = document.createElement('span');
        headerSpan.className = 'strip-name';
        headerSpan.style.color = color;
        headerSpan.innerText = label;
        header.appendChild(headerSpan);
        this._headerEls.set(`return:${index}`, headerSpan);
        header.style.cursor = 'pointer';
        header.onclick = () => {
            if (this._isStarHeld && this.mixerAutomation) {
                const cleared = this.mixerAutomation.clearStrip('return', index);
                this._autoKnobs.forEach(ak => { if (cleared.includes(ak.key)) ak.updateAutoBorder(); });
                this._autoFaders.forEach(af => { if (cleared.includes(af.key)) af.updateAutoBorder(); });
            }
        };
        strip.appendChild(header);

        const controls = document.createElement('div');
        controls.className = 'strip-controls'; 

        const getBus = () => busObject;
        const rk = (param) => MixerAutomation.laneKey('return', index, param);

        controls.appendChild(this.createKnob('Gain', 1.0, 0, 2, 0.01, (v) => { 
            const bus = getBus(); 
            if(bus.input) bus.input.gain.value = v; 
        }, 'knob-color-green', true, rk('gain')));

        controls.appendChild(this.createKnob('Hi', 0, -15, 15, 0.1, (v) => { const bus = getBus(); if(bus.eq) bus.eq.high.gain.value = v; }, 'knob-color-blue', true, rk('eqHigh')));
        controls.appendChild(this.createKnob('Mid', 0, -15, 15, 0.1, (v) => { const bus = getBus(); if(bus.eq) bus.eq.mid.gain.value = v; }, 'knob-color-green', true, rk('eqMid')));
        controls.appendChild(this.createKnob('Freq', 1000, 200, 5000, 10, (v) => { const bus = getBus(); if(bus.eq) bus.eq.mid.frequency.value = v; }, 'knob-color-green', true, rk('eqMidFreq')));
        controls.appendChild(this.createKnob('Lo', 0, -15, 15, 0.1, (v) => { const bus = getBus(); if(bus.eq) bus.eq.low.gain.value = v; }, 'knob-color-red', true, rk('eqLow')));
        
        controls.appendChild(this.createKnob('A', 0, 0, 1, 0.01, (v) => { const bus = getBus(); if(bus.sendA) bus.sendA.gain.value = v; }, 'knob-color-yellow', true, rk('sendA')));
        controls.appendChild(this.createKnob('B', 0, 0, 1, 0.01, (v) => { const bus = getBus(); if(bus.sendB) bus.sendB.gain.value = v; }, 'knob-color-yellow', true, rk('sendB')));
        
        controls.appendChild(this.createKnob('Drive', 0, 0, 1, 0.01, (v) => { const bus = getBus(); if(bus.drive) this.audioEngine.setDriveAmount(bus.drive.input, v); }, 'knob-color-red', true, rk('drive')));
        controls.appendChild(this.createKnob('Comp', 0, 0, 1, 0.01, (v) => { const bus = getBus(); if(bus.comp) this.audioEngine.setCompAmount(bus.comp, v); }, 'knob-color-purple', true, rk('comp')));
        
        controls.appendChild(this.createKnob('Pan', 0, -1, 1, 0.01, (v) => { const bus = getBus(); if(bus.pan) bus.pan.pan.value = v; }, 'knob-color-blue', true, rk('pan')));

        strip.appendChild(controls);

        const faderComp = this.createFaderSection(busObject, (v) => {
            if(busObject.volume) busObject.volume.gain.value = v;
        }, `return_${index}`, rk('volume'));

        faderComp.muteBtn.onclick = () => { 
            const isMuted = faderComp.muteBtn.classList.toggle('active');
            busObject.volume.gain.value = isMuted ? 0 : faderComp.fader.value;
        };
        faderComp.soloBtn.style.visibility = 'hidden'; 

        strip.appendChild(faderComp.section);
        return strip;
    }

    createMasterStrip() {
        const strip = document.createElement('div');
        strip.className = 'mixer-strip master-strip';
        
        const header = document.createElement('div');
        header.className = 'strip-header';
        header.innerHTML = `<span class="strip-name" style="color:#ef4444">MASTER</span>`;
        strip.appendChild(header);

        const controls = document.createElement('div');
        controls.className = 'strip-controls';

        // Functional limiter knob: 0 = off (threshold 0dB, ratio 1), 1 = hard limit (threshold -20dB, ratio 20)
        controls.appendChild(this.createKnob('Limit', 1.0, 0, 1, 0.01, (v) => {
            const limiter = this.audioEngine.masterBus?.limiter;
            if (!limiter) return;
            if (v < 0.01) {
                // Off: bypass by setting ratio to 1
                limiter.threshold.value = 0;
                limiter.ratio.value = 1;
            } else {
                // threshold: 0dB at v=0 down to -20dB at v=1
                limiter.threshold.value = -20 * v;
                limiter.ratio.value = 4 + (v * 16); // 4:1 at low, 20:1 at max
                limiter.attack.value = 0.003;
                limiter.release.value = 0.1 + (1 - v) * 0.15; // faster release at higher settings
            }
        }, 'knob-color-red', true));

        strip.appendChild(controls);

        const faderComp = this.createFaderSection(this.audioEngine.masterBus, (v) => {
            if(this.audioEngine.masterBus && this.audioEngine.masterBus.volume) 
                this.audioEngine.masterBus.volume.gain.value = v;
        }, 'master');
        
        faderComp.muteBtn.style.visibility = 'hidden';
        faderComp.soloBtn.style.visibility = 'hidden';

        strip.appendChild(faderComp.section);
        return strip;
    }
}