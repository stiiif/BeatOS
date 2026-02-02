import { TRACKS_PER_GROUP } from '../../utils/constants.js';

export class Mixer {
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
        this.meterCanvases = new Map(); // Store canvases for animation loop
        
        // Callbacks
        this.onMute = null;
        this.onSolo = null;
        this.onMuteGroup = null; 
        this.onSoloGroup = null;

        // Animation Loop Binding
        this.animateMeters = this.animateMeters.bind(this);
        this.animationFrameId = null;
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
        
        this.container.innerHTML = '';
        this.trackStripElements.clear(); 
        this.groupStripElements.clear(); 
        this.meterCanvases.clear();
        
        const mixerContainer = document.createElement('div');
        mixerContainer.className = 'mixer-container custom-scrollbar';
        
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

        // 3. Master
        mixerContainer.appendChild(this.createMasterStrip());

        this.container.appendChild(mixerContainer);
        this.isRendered = true;
        
        this.updateAllTrackStates();
        
        // Start Meter Loop
        this.animateMeters();
    }

    setTrackStripWidth(widthPx) {
        document.documentElement.style.setProperty('--track-width', `${widthPx}px`);
    }

    // --- ANIMATION LOOP FOR METERS ---
    animateMeters() {
        if (!this.isRendered) return;

        // Loop through all registered meters
        this.meterCanvases.forEach((canvas, id) => {
            const ctx = canvas.getContext('2d');
            const width = canvas.width;
            const height = canvas.height;
            let analyser = null;

            // Determine source based on ID type (string vs number)
            if (typeof id === 'number') { // Track
                const track = this.trackManager.getTracks()[id];
                if (track && track.bus) analyser = track.bus.analyser;
            } else if (id.startsWith('group')) { // Group
                const idx = parseInt(id.split('_')[1]);
                if (this.audioEngine.groupBuses[idx]) analyser = this.audioEngine.groupBuses[idx].analyser;
            } else if (id === 'master') { // Master
                if (this.audioEngine.masterBus) analyser = this.audioEngine.masterBus.analyser;
            }

            // Clear
            ctx.clearRect(0, 0, width, height);

            if (analyser) {
                const bufferLength = analyser.frequencyBinCount;
                const dataArray = new Uint8Array(bufferLength);
                analyser.getByteTimeDomainData(dataArray);

                // Calculate RMS
                let sum = 0;
                for(let i = 0; i < bufferLength; i++) {
                    const x = (dataArray[i] - 128) / 128.0;
                    sum += x * x;
                }
                const rms = Math.sqrt(sum / bufferLength);
                
                // Scale RMS to height (boosted slightly for visibility)
                const value = Math.min(1, rms * 4); 
                const barHeight = value * height;

                // Draw LED segments
                const segHeight = 2;
                const gap = 1;
                const numSegs = Math.floor(height / (segHeight + gap));
                const activeSegs = Math.floor(value * numSegs);

                for (let i = 0; i < numSegs; i++) {
                    const y = height - (i * (segHeight + gap));
                    if (i < activeSegs) {
                        // Color Gradient
                        if (i > numSegs * 0.9) ctx.fillStyle = '#ef4444'; // Red (Clip)
                        else if (i > numSegs * 0.7) ctx.fillStyle = '#eab308'; // Yellow
                        else ctx.fillStyle = '#10b981'; // Green
                    } else {
                        ctx.fillStyle = '#1a1a1a'; // Inactive LED
                    }
                    ctx.fillRect(0, y, width, segHeight);
                }
            } else {
                // Draw empty meter if no analyser
                ctx.fillStyle = '#111';
                ctx.fillRect(0, 0, width, height);
            }
        });

        this.animationFrameId = requestAnimationFrame(this.animateMeters);
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

        // VU Meter Canvas
        const canvas = document.createElement('canvas');
        canvas.className = 'fader-vu-meter';
        canvas.width = 10; // Low res for crisp pixel look
        canvas.height = 100;
        this.meterCanvases.set(idForMeter, canvas);
        wrapper.appendChild(canvas);

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
        controls.appendChild(this.createKnob('A', track.params.sendA || 0, 0, 1, 0.01, (v) => track.params.sendA = v, 'knob-color-yellow'));
        controls.appendChild(this.createKnob('B', track.params.sendB || 0, 0, 1, 0.01, (v) => track.params.sendB = v, 'knob-color-yellow'));
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
        sendSec.appendChild(this.createKnob('A', 0, 0, 1, 0.01, () => {}, 'knob-color-yellow', true));
        sendSec.appendChild(this.createKnob('B', 0, 0, 1, 0.01, () => {}, 'knob-color-yellow', true));
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

        // Group Fader
        const faderComp = this.createFaderSection(this.audioEngine.groupBuses[index], (v) => {
            const bus = getBus(); if(bus && bus.volume) bus.volume.gain.value = v;
        }, `group_${index}`);

        faderComp.muteBtn.onclick = () => { if (this.onMuteGroup) this.onMuteGroup(index); };
        faderComp.soloBtn.onclick = () => { if (this.onSoloGroup) this.onSoloGroup(index); };
        this.groupStripElements.set(index, { muteBtn: faderComp.muteBtn, soloBtn: faderComp.soloBtn });
        
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
        
        // Hide mute/solo on master for now
        faderComp.muteBtn.style.visibility = 'hidden';
        faderComp.soloBtn.style.visibility = 'hidden';

        strip.appendChild(faderComp.section);
        return strip;
    }
}