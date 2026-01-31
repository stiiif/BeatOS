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

    // NEW: Rotary Knob Creator
    createKnob(label, value, min, max, step, onChange, colorStr = '#888') {
        const div = document.createElement('div');
        div.className = 'mixer-pot';
        
        const lbl = document.createElement('label');
        lbl.innerText = label;
        if(colorStr !== '#888') lbl.style.color = colorStr;
        
        const knobCircle = document.createElement('div');
        knobCircle.className = 'knob-circle';
        
        const indicator = document.createElement('div');
        indicator.className = 'knob-indicator';
        indicator.style.backgroundColor = colorStr;
        knobCircle.appendChild(indicator);

        const valDisplay = document.createElement('div');
        valDisplay.className = 'knob-value';
        valDisplay.innerText = value.toFixed(1);

        div.appendChild(lbl);
        div.appendChild(knobCircle);
        div.appendChild(valDisplay);

        // State for drag
        let currentValue = value;
        let startY = 0;
        let isDragging = false;

        // Visual Update Function
        const updateVisuals = (val) => {
            // Map min/max to rotation angles (-135deg to +135deg is standard pot range)
            const pct = (val - min) / (max - min);
            const deg = -135 + (pct * 270);
            indicator.style.transform = `translate(-50%, 0) rotate(${deg}deg)`;
            valDisplay.innerText = val.toFixed(step < 1 ? 2 : 0);
        };

        // Initial set
        updateVisuals(currentValue);

        // Event Handlers
        knobCircle.addEventListener('mousedown', (e) => {
            isDragging = true;
            startY = e.clientY;
            document.body.style.cursor = 'ns-resize';
            e.preventDefault(); // Prevent text selection
        });

        // Global move/up to catch dragging outside element
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const deltaY = startY - e.clientY; // Up is positive
            startY = e.clientY; // Reset for relative delta
            
            // Sensitivity: Full range in 200px
            const range = max - min;
            const deltaVal = (deltaY / 200) * range; 
            
            let newVal = currentValue + deltaVal;
            newVal = Math.max(min, Math.min(max, newVal));
            
            // Snap to step
            if (step > 0) {
                newVal = Math.round(newVal / step) * step;
            }

            if (newVal !== currentValue) {
                currentValue = newVal;
                updateVisuals(currentValue);
                onChange(currentValue);
            }
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                document.body.style.cursor = '';
            }
        });

        // Double click to reset? (Optional, maybe later)

        return div;
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

        // Mute/Solo
        const btnRow = document.createElement('div');
        btnRow.className = 'strip-btn-row';
        
        const muteBtn = document.createElement('button');
        muteBtn.className = `mixer-btn mute ${track.muted ? 'active' : ''}`;
        muteBtn.innerText = 'M';
        muteBtn.onclick = () => {
            track.muted = !track.muted;
            muteBtn.classList.toggle('active');
        };

        const soloBtn = document.createElement('button');
        soloBtn.className = `mixer-btn solo ${track.soloed ? 'active' : ''}`;
        soloBtn.innerText = 'S';
        soloBtn.onclick = () => {
            track.soloed = !track.soloed;
            soloBtn.classList.toggle('active');
        };
        
        btnRow.appendChild(muteBtn);
        btnRow.appendChild(soloBtn);
        controls.appendChild(btnRow);

        // Gain (Trim)
        controls.appendChild(this.createKnob('Gain', track.params.gain || 1, 0, 2, 0.01, (v) => {
            track.params.gain = v;
            if(track.bus.trim) track.bus.trim.gain.value = v;
        }));

        // Comp
        controls.appendChild(this.createKnob('Comp', track.params.comp || 0, 0, 1, 0.01, (v) => {
            track.params.comp = v;
            if(track.bus.comp) this.audioEngine.setCompAmount(track.bus.comp, v);
        }, '#f472b6'));

        // Drive
        controls.appendChild(this.createKnob('Drive', track.params.drive || 0, 0, 1, 0.01, (v) => {
            track.params.drive = v;
            if(track.bus.drive && track.bus.drive.input) 
                this.audioEngine.setDriveAmount(track.bus.drive.input, v);
        }, '#ef4444'));

        // FX Sends
        controls.appendChild(this.createKnob('Snd A', track.params.sendA || 0, 0, 1, 0.01, (v) => track.params.sendA = v));
        controls.appendChild(this.createKnob('Snd B', track.params.sendB || 0, 0, 1, 0.01, (v) => track.params.sendB = v));

        // EQ 3-Band
        const eqSec = document.createElement('div');
        eqSec.className = 'eq-section';
        
        eqSec.appendChild(this.createKnob('Hi', track.params.eqHigh || 0, -15, 15, 0.1, (v) => {
            track.params.eqHigh = v;
            if(track.bus.eq.high) track.bus.eq.high.gain.value = v;
        }, '#60a5fa'));
        
        // Mid Parametric
        eqSec.appendChild(this.createKnob('Mid', track.params.eqMid || 0, -15, 15, 0.1, (v) => {
            track.params.eqMid = v;
            if(track.bus.eq.mid) track.bus.eq.mid.gain.value = v;
        }, '#a78bfa'));
        eqSec.appendChild(this.createKnob('Freq', track.params.eqMidFreq || 1000, 200, 5000, 10, (v) => {
            track.params.eqMidFreq = v;
            if(track.bus.eq.mid) track.bus.eq.mid.frequency.value = v;
        }, '#a78bfa'));

        eqSec.appendChild(this.createKnob('Lo', track.params.eqLow || 0, -15, 15, 0.1, (v) => {
            track.params.eqLow = v;
            if(track.bus.eq.low) track.bus.eq.low.gain.value = v;
        }, '#f59e0b'));
        controls.appendChild(eqSec);

        // Pan
        controls.appendChild(this.createKnob('Pan', track.params.pan, -1, 1, 0.01, (v) => {
            track.params.pan = v;
            if(track.bus.pan) track.bus.pan.pan.value = v;
        }, '#10b981'));

        strip.appendChild(controls);

        // Fader (Volume)
        const faderDiv = document.createElement('div');
        faderDiv.className = 'strip-fader';
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
        faderDiv.appendChild(fader);
        strip.appendChild(faderDiv);

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

        controls.appendChild(this.createKnob('Comp', 0, 0, 1, 0.01, (v) => {
            if(bus && bus.comp) this.audioEngine.setCompAmount(bus.comp, v);
        }, '#f472b6'));

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
        controls.appendChild(driveSel);

        controls.appendChild(this.createKnob('Drive', 0, 0, 1, 0.01, (v) => {
            if(bus && bus.drive && bus.drive.input) this.audioEngine.setDriveAmount(bus.drive.input, v);
        }, '#ef4444'));

        controls.appendChild(this.createKnob('Snd A', 0, 0, 1, 0.01, () => {}));
        controls.appendChild(this.createKnob('Snd B', 0, 0, 1, 0.01, () => {}));

        const eqSec = document.createElement('div');
        eqSec.className = 'eq-section';
        const lbl = document.createElement('label'); 
        lbl.innerText = 'EQ KILL'; lbl.style.fontSize='0.45rem'; lbl.style.color='#666'; lbl.style.textAlign='center';
        eqSec.appendChild(lbl);
        
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

        const faderDiv = document.createElement('div');
        faderDiv.className = 'strip-fader';
        const fader = document.createElement('input');
        fader.type = 'range';
        fader.className = 'v-fader';
        fader.min = 0; fader.max = 1.2; fader.step = 0.01;
        fader.value = 1.0;
        fader.oninput = (e) => {
            if(bus && bus.volume) bus.volume.gain.value = parseFloat(e.target.value);
        };
        faderDiv.appendChild(fader);
        strip.appendChild(faderDiv);

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
        limiterDiv.innerHTML = `<label style="color:#ef4444">LIMITER</label><div class="knob-circle" style="opacity:0.5;pointer-events:none"><div class="knob-indicator" style="transform:rotate(135deg);background:#ef4444"></div></div>`;
        controls.appendChild(limiterDiv);

        strip.appendChild(controls);

        const faderDiv = document.createElement('div');
        faderDiv.className = 'strip-fader';
        const fader = document.createElement('input');
        fader.type = 'range';
        fader.className = 'v-fader';
        fader.min = 0; fader.max = 1.2; fader.step = 0.01;
        fader.value = 1.0;
        fader.oninput = (e) => {
            if(this.audioEngine.masterBus && this.audioEngine.masterBus.volume) 
                this.audioEngine.masterBus.volume.gain.value = parseFloat(e.target.value);
        };
        faderDiv.appendChild(fader);
        strip.appendChild(faderDiv);

        return strip;
    }
}