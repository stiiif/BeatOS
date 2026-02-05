// ... (imports)
import { TRACKS_PER_GROUP } from '../../utils/constants.js';
import { globalBus } from '../../events/EventBus.js';

export class Mixer {
    // ... (constructor and other methods)
    constructor(containerSelector, trackManager, audioEngine) {
        this.container = document.querySelector(containerSelector);
        this.trackManager = trackManager;
        this.audioEngine = audioEngine;
        this.isRendered = false;
        this.driveModes = [
            'Soft Clipping', 'Hard Clipping', 'Tube', 'Sigmoid', 
            'Arctan', 'Exponential', 'Cubic', 'Diode', 
            'Asymmetric', 'Foldback'
        ];
        
        // DOM Caches
        this.trackStripElements = new Map();
        this.groupStripElements = new Map();
        
        // Optimization: Single Overlay Canvas for Meters
        this.meterOverlay = null;
        this.meterCtx = null;
        this.meterRegistry = new Map(); // Key: ID, Value: { el: DOMElement, analyser: AnalyserNode }
        
        // Resize Observer
        this.resizeObserver = null;

        // Callbacks
        this.onMute = null;
        this.onSolo = null;
        this.onMuteGroup = null; 
        this.onSoloGroup = null;

        // Animation Loop Binding
        this.animateMeters = this.animateMeters.bind(this);
        this.animationFrameId = null;
        this.lastMeterTime = 0; // Add this for throttling

        // State Flag
        this.isMetering = false;

        // Event Subscriptions
        globalBus.on('playback:start', () => {
            if (!this.isMetering) {
                this.isMetering = true;
                this.animateMeters();
            }
        });
        
        globalBus.on('playback:stop', () => {
            this.isMetering = false;
            // Loop will terminate naturally on next frame check
        });
    }

    setCallbacks(onMute, onSolo, onMuteGroup, onSoloGroup) {
        this.onMute = onMute;
        this.onSolo = onSolo;
        this.onMuteGroup = onMuteGroup;
        this.onSoloGroup = onSoloGroup;
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
        
        // Cleanup old loop if re-rendering
        if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
        
        // Cleanup old observer
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
        
        this.container.innerHTML = '';
        this.trackStripElements.clear(); 
        this.groupStripElements.clear(); 
        this.meterRegistry.clear();
        
        // Main Scrollable Container for Strips
        const mixerContainer = document.createElement('div');
        mixerContainer.className = 'mixer-container custom-scrollbar';
        // Ensure relative positioning so canvas can overlay absolutely
        mixerContainer.style.position = 'relative';
        
        this.meterOverlay = document.createElement('canvas');
        this.meterOverlay.id = 'meterOverlay';
        this.meterOverlay.style.position = 'absolute';
        this.meterOverlay.style.top = '0';
        this.meterOverlay.style.left = '0';
        this.meterOverlay.style.pointerEvents = 'none'; // Click-through
        this.meterOverlay.style.zIndex = '5'; 
        
        this.meterCtx = this.meterOverlay.getContext('2d');
        
        const tracks = this.trackManager.getTracks();
        
        // 0. Label Strip
        mixerContainer.appendChild(this.createLabelStrip());

        // 1. Tracks
        tracks.forEach(track => {
            mixerContainer.appendChild(this.createTrackStrip(track));
        });

        // 2. Groups
        for(let i=0; i<4; i++) {
            mixerContainer.appendChild(this.createGroupStrip(i));
        }

        // 3. RETURNS (New)
        if (this.audioEngine.returnBuses) {
            this.audioEngine.returnBuses.forEach((bus, i) => {
                mixerContainer.appendChild(this.createReturnStrip(bus, i));
            });
        }

        // 4. Master
        mixerContainer.appendChild(this.createMasterStrip());

        // Append Overlay LAST so it's on top
        mixerContainer.appendChild(this.meterOverlay);

        this.container.appendChild(mixerContainer);
        this.isRendered = true;
        
        // Initialize ResizeObserver to handle container size changes (e.g. layout dragging)
        this.resizeObserver = new ResizeObserver(() => {
            this.resizeOverlay();
        });
        this.resizeObserver.observe(mixerContainer);
        
        // Initial resize
        requestAnimationFrame(() => {
            this.resizeOverlay();
        });
        
        // Keep window listener for global resize events just in case
        window.addEventListener('resize', () => this.resizeOverlay());

        this.updateAllTrackStates();
        
        // Start Meter Loop if already playing and flagged
        if (this.audioEngine.getContext() && this.audioEngine.getContext().state === 'running' && this.isMetering) {
             this.animateMeters();
        }
    }
    
    resizeOverlay() {
        const container = this.container.querySelector('.mixer-container');
        if (container && this.meterOverlay) {
            // Check if dimensions actually changed to avoid unnecessary canvas clears/flickers
            if (this.meterOverlay.width !== container.scrollWidth || 
                this.meterOverlay.height !== container.scrollHeight) {
                this.meterOverlay.width = container.scrollWidth;
                this.meterOverlay.height = container.scrollHeight;
            }
        }
    }

    setTrackStripWidth(widthPx) {
        document.documentElement.style.setProperty('--track-width', `${widthPx}px`);
        // Trigger resize of overlay after transition (approx 300ms)
        setTimeout(() => this.resizeOverlay(), 350);
    }

    // --- ANIMATION LOOP FOR METERS (Single Canvas) ---
    animateMeters(timestamp) { // Accept timestamp
        if (!this.isRendered || !this.meterCtx || !this.meterOverlay) return;

        // CHECK FLAG
        if (!this.isMetering) {
            this.clearMeters();
            return; 
        }

        // Throttle to ~30fps (approx every 33ms)
        if (timestamp - this.lastMeterTime < 33) {
            this.animationFrameId = requestAnimationFrame(this.animateMeters);
            return;
        }
        this.lastMeterTime = timestamp;

        // Clear the entire overlay
        this.meterCtx.clearRect(0, 0, this.meterOverlay.width, this.meterOverlay.height);

        // Iterate Registry
        this.meterRegistry.forEach((meta, id) => {
            if (!meta.analyser) return;
            
            const el = meta.el;
            
            // Calculate absolute position relative to mixer-container
            // Use getBoundingClientRect for reliability across scroll and flex contexts
            const elRect = el.getBoundingClientRect();
            const container = this.container.querySelector('.mixer-container');
            const containerRect = container.getBoundingClientRect();
            
            // Calculate position relative to container, accounting for scroll
            const x = (elRect.left - containerRect.left) + container.scrollLeft;
            const y = (elRect.top - containerRect.top) + container.scrollTop;
            
            // Adjust for internal meter position (left: 2px, top: 2%, height: 96%)
            const meterX = x + 2; 
            const meterH = el.offsetHeight * 0.96; // 96% height
            const meterY = y + (el.offsetHeight * 0.02); // 2% top margin
            const meterW = 4; // Width defined in CSS logic
            
            // Audio Processing
            const bufferLength = meta.analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            meta.analyser.getByteTimeDomainData(dataArray);

            // Calculate RMS
            let sum = 0;
            for(let i = 0; i < bufferLength; i++) {
                const val = (dataArray[i] - 128) / 128.0;
                sum += val * val;
            }
            const rms = Math.sqrt(sum / bufferLength);
            
            // Scale RMS
            const value = Math.min(1, rms * 4); 
            
            // Draw LED segments on the single context
            const segHeight = 2;
            const gap = 1;
            const numSegs = Math.floor(meterH / (segHeight + gap));
            const activeSegs = Math.floor(value * numSegs);

            for (let i = 0; i < numSegs; i++) {
                const segmentY = (meterY + meterH) - (i * (segHeight + gap));
                if (i < activeSegs) {
                    // Color Gradient
                    if (i > numSegs * 0.9) this.meterCtx.fillStyle = '#ef4444'; // Red
                    else if (i > numSegs * 0.7) this.meterCtx.fillStyle = '#eab308'; // Yellow
                    else this.meterCtx.fillStyle = '#10b981'; // Green
                } else {
                    this.meterCtx.fillStyle = '#1a1a1a'; // Inactive
                }
                this.meterCtx.fillRect(meterX, segmentY, meterW, segHeight);
            }
        });

        this.animationFrameId = requestAnimationFrame(this.animateMeters);
    }

    clearMeters() {
        if(this.meterCtx && this.meterOverlay) {
            this.meterCtx.clearRect(0, 0, this.meterOverlay.width, this.meterOverlay.height);
        }
    }

    // --- COMPONENT FACTORIES ---

    createKnob(label, value, min, max, step, onChange, colorClass = '', showLabel = false) {
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

        updateRotation(currentValue);

        knobOuter.addEventListener('mousedown', (e) => {
            isDragging = true;
            startY = e.clientY;
            startVal = currentValue;
            wrapper.classList.add('dragging');
            document.body.style.cursor = 'ns-resize'; 
            e.preventDefault();
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });

        const onMouseMove = (e) => {
            if (!isDragging) return;
            const deltaY = startY - e.clientY;
            const range = max - min;
            const sensitivity = range / 200; 
            let newVal = startVal + (deltaY * sensitivity);
            newVal = Math.max(min, Math.min(max, newVal));
            if (step > 0) newVal = Math.round(newVal / step) * step;
            if (newVal !== currentValue) {
                currentValue = newVal;
                updateRotation(currentValue);
                onChange(currentValue);
            }
        };

        const onMouseUp = () => {
            isDragging = false;
            wrapper.classList.remove('dragging');
            document.body.style.cursor = '';
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

    createFaderSection(busObject, onChange, idForMeter) {
        const section = document.createElement('div');
        section.className = 'strip-fader-section';

        // 1. Mute/Solo Buttons Row
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

        // 2. Fader Wrapper (Axis + Meter + Fader)
        const wrapper = document.createElement('div');
        wrapper.className = 'fader-wrapper';

        // Background Slot
        const bgSlot = document.createElement('div');
        bgSlot.className = 'fader-bg-slot';
        wrapper.appendChild(bgSlot);

        // Correctly find Analyser: 
        // - Tracks pass a Track object (analyser is in .bus.analyser)
        // - Groups/Master pass a Bus object (analyser is in .analyser)
        let analyserNode = null;
        if (busObject) {
            if (busObject.analyser) {
                analyserNode = busObject.analyser;
            } else if (busObject.bus && busObject.bus.analyser) {
                analyserNode = busObject.bus.analyser;
            }
        }

        if (analyserNode) {
            this.meterRegistry.set(idForMeter, {
                el: wrapper,
                analyser: analyserNode
            });
        }

        // Ruler (Axis)
        const ruler = document.createElement('div');
        ruler.className = 'fader-ruler';
        wrapper.appendChild(ruler);

        // Vertical Fader Input
        const fader = document.createElement('input');
        fader.type = 'range';
        fader.className = 'v-fader';
        fader.min = 0; fader.max = 1.2; fader.step = 0.01;
        fader.value = busObject && busObject.params ? busObject.params.volume : (busObject && busObject.volume ? busObject.volume.gain.value : 1.0);
        fader.oninput = (e) => onChange(parseFloat(e.target.value));
        
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
        
        const header = document.createElement('div');
        header.className = 'strip-header';
        header.innerHTML = `<span class="strip-num">${track.id + 1}</span>`;
        strip.appendChild(header);

        const controls = document.createElement('div');
        controls.className = 'strip-controls'; 

        const getBus = () => track.bus;

        controls.appendChild(this.createKnob('Gain', track.params.gain || 1, 0, 2, 0.01, (v) => { track.params.gain = v; const bus = getBus(); if(bus && bus.trim) bus.trim.gain.value = v; }, 'knob-color-green'));
        controls.appendChild(this.createKnob('Hi', track.params.eqHigh || 0, -15, 15, 0.1, (v) => { track.params.eqHigh = v; const bus = getBus(); if(bus && bus.eq && bus.eq.high) bus.eq.high.gain.value = v; }, 'knob-color-blue'));
        controls.appendChild(this.createKnob('Mid', track.params.eqMid || 0, -15, 15, 0.1, (v) => { track.params.eqMid = v; const bus = getBus(); if(bus && bus.eq && bus.eq.mid) bus.eq.mid.gain.value = v; }, 'knob-color-green'));
        controls.appendChild(this.createKnob('Freq', track.params.eqMidFreq || 1000, 200, 5000, 10, (v) => { track.params.eqMidFreq = v; const bus = getBus(); if(bus && bus.eq && bus.eq.mid) bus.eq.mid.frequency.value = v; }, 'knob-color-green'));
        controls.appendChild(this.createKnob('Lo', track.params.eqLow || 0, -15, 15, 0.1, (v) => { track.params.eqLow = v; const bus = getBus(); if(bus && bus.eq && bus.eq.low) bus.eq.low.gain.value = v; }, 'knob-color-red'));
        controls.appendChild(this.createKnob('A', track.params.sendA || 0, 0, 1, 0.01, (v) => { track.params.sendA = v; if(track.bus && track.bus.sendA) track.bus.sendA.gain.value = v; }, 'knob-color-yellow'));
        controls.appendChild(this.createKnob('B', track.params.sendB || 0, 0, 1, 0.01, (v) => { track.params.sendB = v; if(track.bus && track.bus.sendB) track.bus.sendB.gain.value = v; }, 'knob-color-yellow'));
        controls.appendChild(this.createKnob('Drive', track.params.drive || 0, 0, 1, 0.01, (v) => { track.params.drive = v; const bus = getBus(); if(bus && bus.drive && bus.drive.input) this.audioEngine.setDriveAmount(bus.drive.input, v); }, 'knob-color-red'));
        controls.appendChild(this.createKnob('Comp', track.params.comp || 0, 0, 1, 0.01, (v) => { track.params.comp = v; const bus = getBus(); if(bus && bus.comp) this.audioEngine.setCompAmount(bus.comp, v); }, 'knob-color-purple'));
        controls.appendChild(this.createKnob('Pan', track.params.pan, -1, 1, 0.01, (v) => { track.params.pan = v; const bus = getBus(); if(bus && bus.pan) bus.pan.pan.value = v; }, 'knob-color-blue'));

        strip.appendChild(controls);

        // Fader Section
        const faderComp = this.createFaderSection(track, (v) => {
            track.params.volume = v;
            const bus = getBus();
            if(bus && bus.vol) bus.vol.gain.value = v;
        }, track.id); // Pass numeric ID for track

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
        const getBus = () => this.audioEngine.groupBuses[index];
        
        const header = document.createElement('div');
        header.className = 'strip-header';
        header.innerHTML = `<span class="strip-name" style="color:#10b981">GRP ${index+1}</span>`;
        strip.appendChild(header);

        const controls = document.createElement('div');
        controls.className = 'strip-controls'; 

        controls.appendChild(this.createKnob('Comp', 0, 0, 1, 0.01, (v) => {
            const bus = getBus(); if(bus && bus.comp) this.audioEngine.setCompAmount(bus.comp, v);
        }, 'knob-color-purple', true));

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
        }, 'knob-color-red', true));
        controls.appendChild(driveDiv);

        const sendSec = document.createElement('div');
        sendSec.className = 'eq-section';
        sendSec.innerHTML = `<div class="section-label">SENDS</div>`;
        sendSec.appendChild(this.createKnob('A', 0, 0, 1, 0.01, (v) => { const bus = getBus(); if(bus && bus.sendA) bus.sendA.gain.value = v; }, 'knob-color-yellow', true));
        sendSec.appendChild(this.createKnob('B', 0, 0, 1, 0.01, (v) => { const bus = getBus(); if(bus && bus.sendB) bus.sendB.gain.value = v; }, 'knob-color-yellow', true));
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
        }, `group_${index}`);

        faderComp.muteBtn.onclick = () => { if (this.onMuteGroup) this.onMuteGroup(index); };
        faderComp.soloBtn.onclick = () => { if (this.onSoloGroup) this.onSoloGroup(index); };
        this.groupStripElements.set(index, { muteBtn: faderComp.muteBtn, soloBtn: faderComp.soloBtn });
        
        strip.appendChild(faderComp.section);
        return strip;
    }

    // NEW: Return Strip Factory
    createReturnStrip(busObject, index) {
        const strip = document.createElement('div');
        strip.className = 'mixer-strip group-strip'; // Use group style for now
        strip.style.backgroundColor = '#2a1a2a'; // Slightly purple/dark tint to distinguish
        strip.style.borderColor = index === 0 ? '#10b981' : '#a855f7'; 

        const header = document.createElement('div');
        header.className = 'strip-header';
        const label = index === 0 ? 'RTN A' : 'RTN B';
        const color = index === 0 ? '#10b981' : '#a855f7';
        header.innerHTML = `<span class="strip-name" style="color:${color}">${label}</span>`;
        strip.appendChild(header);

        const controls = document.createElement('div');
        controls.className = 'strip-controls'; 

        const getBus = () => busObject;

        // Added Gain knob for Return Tracks
        controls.appendChild(this.createKnob('Gain', 1.0, 0, 2, 0.01, (v) => { 
            const bus = getBus(); 
            if(bus.input) bus.input.gain.value = v; 
        }, 'knob-color-green', true));

        // No Input Gain/Trim knob on returns usually, start with EQ
        controls.appendChild(this.createKnob('Hi', 0, -15, 15, 0.1, (v) => { const bus = getBus(); if(bus.eq) bus.eq.high.gain.value = v; }, 'knob-color-blue', true));
        controls.appendChild(this.createKnob('Mid', 0, -15, 15, 0.1, (v) => { const bus = getBus(); if(bus.eq) bus.eq.mid.gain.value = v; }, 'knob-color-green', true));
        controls.appendChild(this.createKnob('Freq', 1000, 200, 5000, 10, (v) => { const bus = getBus(); if(bus.eq) bus.eq.mid.frequency.value = v; }, 'knob-color-green', true));
        controls.appendChild(this.createKnob('Lo', 0, -15, 15, 0.1, (v) => { const bus = getBus(); if(bus.eq) bus.eq.low.gain.value = v; }, 'knob-color-red', true));
        
        // Sends (Feedback!)
        controls.appendChild(this.createKnob('A', 0, 0, 1, 0.01, (v) => { const bus = getBus(); if(bus.sendA) bus.sendA.gain.value = v; }, 'knob-color-yellow', true));
        controls.appendChild(this.createKnob('B', 0, 0, 1, 0.01, (v) => { const bus = getBus(); if(bus.sendB) bus.sendB.gain.value = v; }, 'knob-color-yellow', true));
        
        // Drive & Comp
        controls.appendChild(this.createKnob('Drive', 0, 0, 1, 0.01, (v) => { const bus = getBus(); if(bus.drive) this.audioEngine.setDriveAmount(bus.drive.input, v); }, 'knob-color-red', true));
        controls.appendChild(this.createKnob('Comp', 0, 0, 1, 0.01, (v) => { const bus = getBus(); if(bus.comp) this.audioEngine.setCompAmount(bus.comp, v); }, 'knob-color-purple', true));
        
        // Pan
        controls.appendChild(this.createKnob('Pan', 0, -1, 1, 0.01, (v) => { const bus = getBus(); if(bus.pan) bus.pan.pan.value = v; }, 'knob-color-blue', true));

        strip.appendChild(controls);

        const faderComp = this.createFaderSection(busObject, (v) => {
            if(busObject.volume) busObject.volume.gain.value = v;
        }, `return_${index}`);

        // No mute/solo logic for returns in this iteration (requires bus state tracking)
        // Just hide them or make them local mute
        faderComp.muteBtn.onclick = () => { 
            const isMuted = faderComp.muteBtn.classList.toggle('active');
            busObject.volume.gain.value = isMuted ? 0 : faderComp.fader.value;
        };
        faderComp.soloBtn.style.visibility = 'hidden'; // Solo on return is complex (needs to solo all sends)

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
        const limiterDiv = document.createElement('div');
        limiterDiv.className = 'mixer-pot';
        limiterDiv.style.height = "auto";
        limiterDiv.innerHTML = `
            <label style="color:#ef4444; font-size:0.5rem;">LIMITER</label>
            <div class="knob-outer" style="opacity:0.8; width:28px; height:28px;">
                <div class="knob-inner" style="transform:rotate(135deg)">
                    <div class="knob-line" style="background:#ef4444;box-shadow:0 0 5px red"></div>
                </div>
            </div>
        `;
        controls.appendChild(limiterDiv);
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