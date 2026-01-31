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
    }

    render() {
        if (!this.container) return;
        this.container.innerHTML = '';
        
        const mixerContainer = document.createElement('div');
        mixerContainer.className = 'mixer-container custom-scrollbar';
        
        const tracks = this.trackManager.getTracks();
        
        // 1. Track Lanes
        tracks.forEach(track => {
            mixerContainer.appendChild(this.createTrackStrip(track));
        });

        // 2. Group Lanes
        for(let i=0; i<4; i++) {
            mixerContainer.appendChild(this.createGroupStrip(i));
        }

        // 3. Master Lane
        mixerContainer.appendChild(this.createMasterStrip());

        this.container.appendChild(mixerContainer);
        this.isRendered = true;
    }

    /**
     * Creates a Rotary Knob DOM Element
     * Handles vertical drag for value changes
     */
    createKnob(label, value, min, max, step, onChange, colorClass = '') {
        const wrapper = document.createElement('div');
        wrapper.className = 'mixer-pot';
        
        // Label
        const lbl = document.createElement('label');
        lbl.innerText = label;
        wrapper.appendChild(lbl);

        // Knob Visual Container
        const knobOuter = document.createElement('div');
        knobOuter.className = `knob-outer ${colorClass}`;
        
        // Rotating Inner Part
        const knobInner = document.createElement('div');
        knobInner.className = 'knob-inner';
        
        // Indicator Line
        const line = document.createElement('div');
        line.className = 'knob-line';
        
        // Value Tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'knob-value-tip';
        tooltip.innerText = value.toFixed(step < 1 ? 2 : 0);

        knobInner.appendChild(line);
        knobOuter.appendChild(knobInner);
        knobOuter.appendChild(tooltip);
        wrapper.appendChild(knobOuter);

        // State
        let currentValue = value;
        let startY = 0;
        let startVal = 0;
        let isDragging = false;

        // Rotation Logic (Standard Pot: -135deg to +135deg = 270deg range)
        const updateRotation = (val) => {
            const range = max - min;
            const pct = (val - min) / range;
            const deg = -135 + (pct * 270);
            knobInner.style.transform = `rotate(${deg}deg)`;
            tooltip.innerText = val.toFixed(step < 1 ? 2 : 0);
        };

        // Initial State
        updateRotation(currentValue);

        // Interaction Handlers
        knobOuter.addEventListener('mousedown', (e) => {
            isDragging = true;
            startY = e.clientY;
            startVal = currentValue;
            wrapper.classList.add('dragging');
            document.body.style.cursor = 'ns-resize'; // North-South Resize cursor
            e.preventDefault();
        });

        // Use global listeners for drag to handle mouse leaving the element
        const onMouseMove = (e) => {
            if (!isDragging) return;
            
            const deltaY = startY - e.clientY; // Up = positive change
            const range = max - min;
            // Sensitivity: 200px drag = full range
            const sensitivity = range / 200; 
            
            let newVal = startVal + (deltaY * sensitivity);
            
            // Constrain
            newVal = Math.max(min, Math.min(max, newVal));
            
            // Snap to step if needed (for discrete values)
            if (step > 0) {
                newVal = Math.round(newVal / step) * step;
            }

            if (newVal !== currentValue) {
                currentValue = newVal;
                updateRotation(currentValue);
                onChange(currentValue);
            }
        };

        const onMouseUp = () => {
            if (isDragging) {
                isDragging = false;
                wrapper.classList.remove('dragging');
                document.body.style.cursor = '';
            }
        };

        // Add global listeners (and cleanup logic if needed in React, but pure JS here is fine if attached to document)
        // Note: In a long-running SPA, we might want to attach these only on mousedown and remove on mouseup
        // to avoid listener pile-up. Let's do that for cleanliness.
        
        knobOuter.addEventListener('mousedown', () => {
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUpOnce);
        });

        const onMouseUpOnce = () => {
            onMouseUp();
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUpOnce);
        };

        // Double Click to Reset to Default (usually 0 or center)
        knobOuter.addEventListener('dblclick', () => {
            const defaultVal = (min + max) / 2; // Simple center heuristic, or 0 if within range
            let target = 0;
            if (min >= 0) target = min; // Unipolar defaults to min
            if (min < 0 && max > 0) target = 0; // Bipolar defaults to 0
            
            // Override for specific params if logic gets complex, but 0/center is standard
            if (label === 'Freq') target = 1000;
            if (label === 'Gain') target = 1.0;
            
            currentValue = target;
            updateRotation(currentValue);
            onChange(currentValue);
        });

        return wrapper;
    }

    createTrackStrip(track) {
        const strip = document.createElement('div');
        strip.className = 'mixer-strip';
        
        // Header
        const header = document.createElement('div');
        header.className = 'strip-header';
        header.innerHTML = `
            <span class="strip-num">${track.id + 1}</span>
            <span class="strip-name" title="${track.autoName || 'Track'}">${track.autoName || 'Trk ' + (track.id+1)}</span>
        `;
        strip.appendChild(header);

        const controls = document.createElement('div');
        controls.className = 'strip-controls custom-scrollbar';

        // Gain (Input Trim)
        controls.appendChild(this.createKnob('Gain', track.params.gain || 1, 0, 2, 0.01, (v) => {
            track.params.gain = v;
            if(track.bus.trim) track.bus.trim.gain.value = v;
        }, 'knob-color-white')); // White/Grey

        // EQ Section
        const eqSec = document.createElement('div');
        eqSec.className = 'eq-section';
        eqSec.innerHTML = `<div class="eq-section-header">EQ</div>`;
        
        eqSec.appendChild(this.createKnob('Hi', track.params.eqHigh || 0, -15, 15, 0.1, (v) => {
            track.params.eqHigh = v;
            if(track.bus.eq.high) track.bus.eq.high.gain.value = v;
        }, 'knob-color-blue'));
        
        eqSec.appendChild(this.createKnob('Mid', track.params.eqMid || 0, -15, 15, 0.1, (v) => {
            track.params.eqMid = v;
            if(track.bus.eq.mid) track.bus.eq.mid.gain.value = v;
        }, 'knob-color-green'));
        
        eqSec.appendChild(this.createKnob('Freq', track.params.eqMidFreq || 1000, 200, 5000, 10, (v) => {
            track.params.eqMidFreq = v;
            if(track.bus.eq.mid) track.bus.eq.mid.frequency.value = v;
        }, 'knob-color-green'));

        eqSec.appendChild(this.createKnob('Lo', track.params.eqLow || 0, -15, 15, 0.1, (v) => {
            track.params.eqLow = v;
            if(track.bus.eq.low) track.bus.eq.low.gain.value = v;
        }, 'knob-color-red'));
        
        controls.appendChild(eqSec);

        // Sends
        const sendSec = document.createElement('div');
        sendSec.className = 'eq-section';
        sendSec.innerHTML = `<div class="eq-section-header">SENDS</div>`;
        sendSec.appendChild(this.createKnob('A', track.params.sendA || 0, 0, 1, 0.01, (v) => track.params.sendA = v, 'knob-color-yellow'));
        sendSec.appendChild(this.createKnob('B', track.params.sendB || 0, 0, 1, 0.01, (v) => track.params.sendB = v, 'knob-color-yellow'));
        controls.appendChild(sendSec);

        // Drive & Comp
        controls.appendChild(this.createKnob('Drive', track.params.drive || 0, 0, 1, 0.01, (v) => {
            track.params.drive = v;
            if(track.bus.drive && track.bus.drive.input) this.audioEngine.setDriveAmount(track.bus.drive.input, v);
        }, 'knob-color-red'));

        controls.appendChild(this.createKnob('Comp', track.params.comp || 0, 0, 1, 0.01, (v) => {
            track.params.comp = v;
            if(track.bus.comp) this.audioEngine.setCompAmount(track.bus.comp, v);
        }, 'knob-color-purple'));

        // Pan
        controls.appendChild(this.createKnob('Pan', track.params.pan, -1, 1, 0.01, (v) => {
            track.params.pan = v;
            if(track.bus.pan) track.bus.pan.pan.value = v;
        }, 'knob-color-blue'));

        strip.appendChild(controls);

        // Mute/Solo Row (Above Fader)
        const btnRow = document.createElement('div');
        btnRow.className = 'strip-btn-row';
        
        const muteBtn = document.createElement('button');
        muteBtn.className = `mixer-btn mute ${track.muted ? 'active' : ''}`;
        muteBtn.innerText = 'M';
        muteBtn.onclick = () => {
            track.muted = !track.muted;
            muteBtn.classList.toggle('active');
            // TODO: Link to main engine mute
        };

        const soloBtn = document.createElement('button');
        soloBtn.className = `mixer-btn solo ${track.soloed ? 'active' : ''}`;
        soloBtn.innerText = 'S';
        soloBtn.onclick = () => {
            track.soloed = !track.soloed;
            soloBtn.classList.toggle('active');
            // TODO: Link to main engine solo
        };
        
        btnRow.appendChild(muteBtn);
        btnRow.appendChild(soloBtn);
        
        // Fader Section
        const faderSection = document.createElement('div');
        faderSection.className = 'strip-fader-section';
        faderSection.style.flexDirection = 'column'; // Stack buttons then fader
        faderSection.style.alignItems = 'center';
        faderSection.style.gap = '5px';
        faderSection.style.padding = '5px';

        faderSection.appendChild(btnRow);

        const fader = document.createElement('input');
        fader.type = 'range';
        fader.className = 'v-fader';
        fader.min = 0; fader.max = 1.2; fader.step = 0.01;
        fader.value = track.params.volume;
        fader.oninput = (e) => {
            const v = parseFloat(e.target.value);
            track.params.volume = v;
            if(track.bus.vol) track.bus.vol.gain.value = v;
        };
        faderSection.appendChild(fader);

        strip.appendChild(faderSection);

        return strip;
    }

    createGroupStrip(index) {
        const strip = document.createElement('div');
        strip.className = 'mixer-strip group-strip';
        const bus = this.audioEngine.groupBuses[index];
        
        const header = document.createElement('div');
        header.className = 'strip-header';
        header.innerHTML = `<span class="strip-name" style="color:#10b981">GRP ${index+1}</span>`;
        strip.appendChild(header);

        const controls = document.createElement('div');
        controls.className = 'strip-controls custom-scrollbar';

        // Comp
        controls.appendChild(this.createKnob('Comp', 0, 0, 1, 0.01, (v) => {
            if(bus && bus.comp) this.audioEngine.setCompAmount(bus.comp, v);
        }, 'knob-color-purple'));

        // Drive Select & Pot
        const driveDiv = document.createElement('div');
        driveDiv.className = 'eq-section';
        driveDiv.innerHTML = `<div class="eq-section-header">DIST</div>`;
        
        const driveSel = document.createElement('select');
        driveSel.className = 'drive-select';
        this.driveModes.forEach(mode => {
            const opt = document.createElement('option');
            opt.value = mode; opt.innerText = mode;
            driveSel.appendChild(opt);
        });
        driveSel.onchange = (e) => {
            if(bus && bus.drive && bus.drive.shaper) {
                bus.drive.shaper.curve = this.audioEngine.driveCurves[e.target.value];
            }
        };
        driveDiv.appendChild(driveSel);
        
        driveDiv.appendChild(this.createKnob('Amt', 0, 0, 1, 0.01, (v) => {
            if(bus && bus.drive && bus.drive.input) this.audioEngine.setDriveAmount(bus.drive.input, v);
        }, 'knob-color-red'));
        
        controls.appendChild(driveDiv);

        // Sends
        const sendSec = document.createElement('div');
        sendSec.className = 'eq-section';
        sendSec.innerHTML = `<div class="eq-section-header">SENDS</div>`;
        sendSec.appendChild(this.createKnob('A', 0, 0, 1, 0.01, () => {}, 'knob-color-yellow'));
        sendSec.appendChild(this.createKnob('B', 0, 0, 1, 0.01, () => {}, 'knob-color-yellow'));
        controls.appendChild(sendSec);

        // EQ Kill
        const eqSec = document.createElement('div');
        eqSec.className = 'eq-section';
        eqSec.innerHTML = `<div class="eq-section-header">KILL</div>`;
        
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

        // Fader
        const faderSection = document.createElement('div');
        faderSection.className = 'strip-fader-section';
        faderSection.style.paddingTop = '10px'; // No buttons here usually, maybe mute group?
        
        // Add Mute/Solo for Group?
        const btnRow = document.createElement('div');
        btnRow.className = 'strip-btn-row';
        const muteBtn = document.createElement('button');
        muteBtn.className = 'mixer-btn mute';
        muteBtn.innerText = 'M';
        muteBtn.onclick = () => {
             // Logic to mute group bus volume
             muteBtn.classList.toggle('active');
             const vol = muteBtn.classList.contains('active') ? 0 : 1; // Simplistic
             if(bus && bus.volume) { /* Logic needed */ }
        };
        btnRow.appendChild(muteBtn);
        // faderSection.appendChild(btnRow); // Add back if needed

        const fader = document.createElement('input');
        fader.type = 'range';
        fader.className = 'v-fader';
        fader.min = 0; fader.max = 1.2; fader.step = 0.01;
        fader.value = 1.0;
        fader.oninput = (e) => {
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
        
        // Master Limiter (Usually static, maybe thresh?)
        const limiterDiv = document.createElement('div');
        limiterDiv.className = 'mixer-pot';
        limiterDiv.innerHTML = `
            <label style="color:#ef4444">LIMITER</label>
            <div class="knob-outer" style="opacity:0.7">
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