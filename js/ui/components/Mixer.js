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
        
        // References to DOM elements for fast updates
        this.trackStripElements = new Map(); // trackId -> { muteBtn, soloBtn, ... }
        this.groupStripElements = new Map(); // groupIndex -> { muteBtn, soloBtn, ... }
        
        // Callbacks
        this.onMute = null;
        this.onSolo = null;
        this.onMuteGroup = null; // New callback for group mute
        this.onSoloGroup = null; // New callback for group solo
    }

    setCallbacks(onMute, onSolo, onMuteGroup, onSoloGroup) {
        this.onMute = onMute;
        this.onSolo = onSolo;
        this.onMuteGroup = onMuteGroup;
        this.onSoloGroup = onSoloGroup;
    }

    // Update UI state from Track Data
    updateTrackState(trackId) {
        const track = this.trackManager.getTracks()[trackId];
        const els = this.trackStripElements.get(trackId);
        
        if (track && els) {
            // Update Mute
            if (track.muted) els.muteBtn.classList.add('active');
            else els.muteBtn.classList.remove('active');
            
            // Update Solo
            if (track.soloed) els.soloBtn.classList.add('active');
            else els.soloBtn.classList.remove('active');
        }
    }

    // New: Update Group UI State (Checks first track of group as proxy for group state)
    updateGroupState(groupIndex) {
        const startTrackId = groupIndex * TRACKS_PER_GROUP;
        const track = this.trackManager.getTracks()[startTrackId];
        const els = this.groupStripElements.get(groupIndex);

        if (track && els) {
            // Update Group Mute Button
            if (track.muted) els.muteBtn.classList.add('active');
            else els.muteBtn.classList.remove('active');

            // Update Group Solo Button
            if (track.soloed) els.soloBtn.classList.add('active');
            else els.soloBtn.classList.remove('active');
        }
    }

    updateAllTrackStates() {
        const tracks = this.trackManager.getTracks();
        tracks.forEach(t => {
            this.updateTrackState(t.id);
        });
        
        // Also update group states
        const numGroups = Math.ceil(tracks.length / TRACKS_PER_GROUP);
        for(let i=0; i<numGroups; i++) {
            this.updateGroupState(i);
        }
    }

    render() {
        if (!this.container) return;
        this.container.innerHTML = '';
        this.trackStripElements.clear(); // Reset element cache
        this.groupStripElements.clear(); // Reset group cache
        
        const mixerContainer = document.createElement('div');
        mixerContainer.className = 'mixer-container custom-scrollbar';
        
        const tracks = this.trackManager.getTracks();
        
        // 0. Render Label Strip (Leftmost)
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
        
        // Initial state update to sync buttons
        this.updateAllTrackStates();
    }

    createKnob(label, value, min, max, step, onChange, colorClass = '', showLabel = true) {
        const wrapper = document.createElement('div');
        wrapper.className = 'mixer-pot';
        
        if (showLabel) {
            const lbl = document.createElement('label');
            lbl.innerText = label;
            wrapper.appendChild(lbl);
        }
        // No else block needed - we want it compact on tracks

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

    createLabelStrip() {
        const strip = document.createElement('div');
        strip.className = 'mixer-strip';
        strip.style.width = '42px';
        strip.style.minWidth = '42px';
        strip.style.backgroundColor = '#151515';
        strip.style.border = 'none';
        
        const header = document.createElement('div');
        header.className = 'strip-header';
        header.innerHTML = `<span class="strip-num" style="color:transparent">00</span>`; 
        strip.appendChild(header);

        const controls = document.createElement('div');
        controls.className = 'strip-controls custom-scrollbar';
        controls.style.overflow = 'hidden'; 
        controls.style.gap = '8px'; // Match CSS gap for tracks

        // Helper to create label matching knob height
        const createLabel = (text) => {
            const div = document.createElement('div');
            div.className = 'mixer-pot';
            div.style.height = '26px'; // Match .knob-outer height
            div.style.justifyContent = 'center';
            
            const lbl = document.createElement('label');
            lbl.innerText = text;
            lbl.style.color = '#888';
            lbl.style.fontWeight = 'bold';
            lbl.style.fontSize = '0.5rem';
            div.appendChild(lbl);
            
            return div;
        };

        controls.appendChild(createLabel('Gain'));

        // EQ Section Labels
        controls.appendChild(createLabel('High'));
        controls.appendChild(createLabel('Mid'));
        controls.appendChild(createLabel('Freq'));
        controls.appendChild(createLabel('Low'));

        // Sends Section Labels
        controls.appendChild(createLabel('Snd A'));
        controls.appendChild(createLabel('Snd B'));

        controls.appendChild(createLabel('Drive'));
        controls.appendChild(createLabel('Comp'));
        controls.appendChild(createLabel('Pan'));

        strip.appendChild(controls);
        
        // Spacer for fader section
        const faderSpacer = document.createElement('div');
        faderSpacer.style.height = '140px';
        faderSpacer.style.flexShrink = '0';
        strip.appendChild(faderSpacer);

        return strip;
    }

    createTrackStrip(track) {
        const strip = document.createElement('div');
        strip.className = 'mixer-strip';
        
        const header = document.createElement('div');
        header.className = 'strip-header';
        header.innerHTML = `
            <span class="strip-num" style="font-size:0.7rem; font-weight:bold; color:#fff;">${track.id + 1}</span>
        `;
        strip.appendChild(header);

        const controls = document.createElement('div');
        controls.className = 'strip-controls custom-scrollbar';

        const getBus = () => track.bus;

        // Gain (Trim) - No Label
        controls.appendChild(this.createKnob('Gain', track.params.gain || 1, 0, 2, 0.01, (v) => {
            track.params.gain = v;
            const bus = getBus();
            if(bus && bus.trim) bus.trim.gain.value = v;
        }, 'knob-color-green', false));

        // EQ Section - No Container, No Headers
        controls.appendChild(this.createKnob('Hi', track.params.eqHigh || 0, -15, 15, 0.1, (v) => {
            track.params.eqHigh = v;
            const bus = getBus();
            if(bus && bus.eq && bus.eq.high) bus.eq.high.gain.value = v;
        }, 'knob-color-blue', false));
        
        controls.appendChild(this.createKnob('Mid', track.params.eqMid || 0, -15, 15, 0.1, (v) => {
            track.params.eqMid = v;
            const bus = getBus();
            if(bus && bus.eq && bus.eq.mid) bus.eq.mid.gain.value = v;
        }, 'knob-color-green', false));
        
        controls.appendChild(this.createKnob('Freq', track.params.eqMidFreq || 1000, 200, 5000, 10, (v) => {
            track.params.eqMidFreq = v;
            const bus = getBus();
            if(bus && bus.eq && bus.eq.mid) bus.eq.mid.frequency.value = v;
        }, 'knob-color-green', false));

        controls.appendChild(this.createKnob('Lo', track.params.eqLow || 0, -15, 15, 0.1, (v) => {
            track.params.eqLow = v;
            const bus = getBus();
            if(bus && bus.eq && bus.eq.low) bus.eq.low.gain.value = v;
        }, 'knob-color-red', false));
        
        // Sends Section - No Container, No Headers
        controls.appendChild(this.createKnob('A', track.params.sendA || 0, 0, 1, 0.01, (v) => track.params.sendA = v, 'knob-color-yellow', false));
        controls.appendChild(this.createKnob('B', track.params.sendB || 0, 0, 1, 0.01, (v) => track.params.sendB = v, 'knob-color-yellow', false));

        // Drive & Comp & Pan - Direct
        controls.appendChild(this.createKnob('Drive', track.params.drive || 0, 0, 1, 0.01, (v) => {
            track.params.drive = v;
            const bus = getBus();
            if(bus && bus.drive && bus.drive.input) this.audioEngine.setDriveAmount(bus.drive.input, v);
        }, 'knob-color-red', false));

        controls.appendChild(this.createKnob('Comp', track.params.comp || 0, 0, 1, 0.01, (v) => {
            track.params.comp = v;
            const bus = getBus();
            if(bus && bus.comp) this.audioEngine.setCompAmount(bus.comp, v);
        }, 'knob-color-purple', false));

        controls.appendChild(this.createKnob('Pan', track.params.pan, -1, 1, 0.01, (v) => {
            track.params.pan = v;
            const bus = getBus();
            if(bus && bus.pan) bus.pan.pan.value = v;
        }, 'knob-color-blue', false));

        strip.appendChild(controls);

        const faderSection = document.createElement('div');
        faderSection.className = 'strip-fader-section';

        const btnRow = document.createElement('div');
        btnRow.className = 'strip-btn-row';
        
        // Mute Button
        const muteBtn = document.createElement('button');
        muteBtn.className = `mixer-btn mute ${track.muted ? 'active' : ''}`;
        muteBtn.innerText = 'M';
        muteBtn.onclick = () => {
            if (this.onMute) this.onMute(track.id); // Call external handler
        };

        // Solo Button
        const soloBtn = document.createElement('button');
        soloBtn.className = `mixer-btn solo ${track.soloed ? 'active' : ''}`;
        soloBtn.innerText = 'S';
        soloBtn.onclick = () => {
            if (this.onSolo) this.onSolo(track.id); // Call external handler
        };
        
        // Store for updates
        this.trackStripElements.set(track.id, { muteBtn, soloBtn });

        btnRow.appendChild(muteBtn);
        btnRow.appendChild(soloBtn);
        faderSection.appendChild(btnRow);

        const fader = document.createElement('input');
        fader.type = 'range';
        fader.className = 'v-fader';
        fader.min = 0; fader.max = 1.2; fader.step = 0.01;
        fader.value = track.params.volume;
        fader.title = "Volume";
        fader.oninput = (e) => {
            const v = parseFloat(e.target.value);
            track.params.volume = v;
            const bus = getBus();
            if(bus && bus.vol) bus.vol.gain.value = v;
        };
        faderSection.appendChild(fader);

        strip.appendChild(faderSection);

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
        controls.className = 'strip-controls custom-scrollbar';

        // Group still has labels? User said "do not remove the labels on the group tracks."
        // So we keep createKnob defaults (showLabel=true) here.

        controls.appendChild(this.createKnob('Comp', 0, 0, 1, 0.01, (v) => {
            const bus = getBus();
            if(bus && bus.comp) this.audioEngine.setCompAmount(bus.comp, v);
        }, 'knob-color-purple'));

        const driveDiv = document.createElement('div');
        driveDiv.className = 'eq-section';
        driveDiv.innerHTML = `<div class="section-label">DIST</div>`;
        
        const driveSel = document.createElement('select');
        driveSel.className = 'drive-select';
        this.driveModes.forEach(mode => {
            const opt = document.createElement('option');
            opt.value = mode; opt.innerText = mode;
            driveSel.appendChild(opt);
        });
        driveSel.onchange = (e) => {
            const bus = getBus();
            if(bus && bus.drive && bus.drive.shaper) {
                bus.drive.shaper.curve = this.audioEngine.driveCurves[e.target.value];
            }
        };
        driveDiv.appendChild(driveSel);
        
        driveDiv.appendChild(this.createKnob('Amt', 0, 0, 1, 0.01, (v) => {
            const bus = getBus();
            if(bus && bus.drive && bus.drive.input) this.audioEngine.setDriveAmount(bus.drive.input, v);
        }, 'knob-color-red'));
        
        controls.appendChild(driveDiv);

        const sendSec = document.createElement('div');
        sendSec.className = 'eq-section';
        sendSec.innerHTML = `<div class="section-label">SENDS</div>`;
        sendSec.appendChild(this.createKnob('A', 0, 0, 1, 0.01, () => {}, 'knob-color-yellow'));
        sendSec.appendChild(this.createKnob('B', 0, 0, 1, 0.01, () => {}, 'knob-color-yellow'));
        controls.appendChild(sendSec);

        const eqSec = document.createElement('div');
        eqSec.className = 'eq-section';
        eqSec.innerHTML = `<div class="section-label">KILL</div>`;
        
        const killRow = document.createElement('div');
        killRow.className = 'strip-btn-row';
        ['HI', 'MID', 'LO'].forEach(band => {
            const btn = document.createElement('button');
            btn.className = 'mixer-btn kill';
            btn.innerText = band;
            btn.onclick = () => {
                btn.classList.toggle('active');
                const isKill = btn.classList.contains('active');
                const gainVal = isKill ? -40 : 0; 
                const bus = getBus();
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

        const faderSection = document.createElement('div');
        faderSection.className = 'strip-fader-section';
        
        const btnRow = document.createElement('div');
        btnRow.className = 'strip-btn-row';
        
        // Group Mute Button
        const muteBtn = document.createElement('button');
        muteBtn.className = 'mixer-btn mute';
        muteBtn.innerText = 'M';
        muteBtn.onclick = () => {
             if (this.onMuteGroup) this.onMuteGroup(index); // Call global handler
        };

        // Group Solo Button
        const soloBtn = document.createElement('button');
        soloBtn.className = 'mixer-btn solo';
        soloBtn.innerText = 'S';
        soloBtn.onclick = () => {
             if (this.onSoloGroup) this.onSoloGroup(index); // Call global handler
        };
        
        // Store references for updates
        this.groupStripElements.set(index, { muteBtn, soloBtn });

        btnRow.appendChild(muteBtn);
        btnRow.appendChild(soloBtn);
        faderSection.appendChild(btnRow);

        const fader = document.createElement('input');
        fader.type = 'range';
        fader.className = 'v-fader';
        fader.min = 0; fader.max = 1.2; fader.step = 0.01;
        fader.value = 1.0;
        fader.oninput = (e) => {
            const bus = getBus();
            if(bus && bus.volume) bus.volume.gain.value = parseFloat(e.target.value);
        };
        faderSection.appendChild(fader);
        strip.appendChild(faderSection);

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
        limiterDiv.innerHTML = `
            <label style="color:#ef4444">LIMITER</label>
            <div class="knob-outer" style="opacity:0.8">
                <div class="knob-inner" style="transform:rotate(135deg)">
                    <div class="knob-line" style="background:#ef4444;box-shadow:0 0 5px red"></div>
                </div>
            </div>
        `;
        controls.appendChild(limiterDiv);

        strip.appendChild(controls);

        const faderSection = document.createElement('div');
        faderSection.className = 'strip-fader-section';
        
        const fader = document.createElement('input');
        fader.type = 'range';
        fader.className = 'v-fader';
        fader.min = 0; fader.max = 1.2; fader.step = 0.01;
        fader.value = 1.0;
        fader.oninput = (e) => {
            if(this.audioEngine.masterBus && this.audioEngine.masterBus.volume) 
                this.audioEngine.masterBus.volume.gain.value = parseFloat(e.target.value);
        };
        faderSection.appendChild(fader);
        strip.appendChild(faderSection);

        return strip;
    }
}