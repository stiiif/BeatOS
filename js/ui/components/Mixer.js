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

    createPot(label, value, min, max, step, onChange, colorClass = '') {
        const div = document.createElement('div');
        div.className = 'mixer-pot';
        
        const lbl = document.createElement('label');
        lbl.innerText = label;
        if(colorClass) lbl.style.color = colorClass;
        
        const input = document.createElement('input');
        input.type = 'range';
        input.className = 'mini-pot';
        input.min = min; input.max = max; input.step = step; input.value = value;
        input.oninput = (e) => onChange(parseFloat(e.target.value));
        
        div.appendChild(lbl);
        div.appendChild(input);
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
            // Sync with main UI if needed, but for now simple toggle
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
        controls.appendChild(this.createPot('Gain', track.params.gain || 1, 0, 2, 0.01, (v) => {
            track.params.gain = v;
            if(track.bus.trim) track.bus.trim.gain.value = v;
        }));

        // Comp
        controls.appendChild(this.createPot('Comp', track.params.comp || 0, 0, 1, 0.01, (v) => {
            track.params.comp = v;
            if(track.bus.comp) this.audioEngine.setCompAmount(track.bus.comp, v);
        }, '#f472b6'));

        // Drive
        controls.appendChild(this.createPot('Drive', track.params.drive || 0, 0, 1, 0.01, (v) => {
            track.params.drive = v;
            if(track.bus.drive && track.bus.drive.input) 
                this.audioEngine.setDriveAmount(track.bus.drive.input, v);
        }, '#ef4444'));

        // FX Sends
        controls.appendChild(this.createPot('Snd A', track.params.sendA || 0, 0, 1, 0.01, (v) => track.params.sendA = v));
        controls.appendChild(this.createPot('Snd B', track.params.sendB || 0, 0, 1, 0.01, (v) => track.params.sendB = v));

        // EQ 3-Band
        const eqSec = document.createElement('div');
        eqSec.className = 'eq-section';
        eqSec.appendChild(this.createPot('Hi', track.params.eqHigh || 0, -15, 15, 0.1, (v) => {
            track.params.eqHigh = v;
            if(track.bus.eq.high) track.bus.eq.high.gain.value = v;
        }, '#60a5fa'));
        
        // Mid Parametric
        eqSec.appendChild(this.createPot('Mid', track.params.eqMid || 0, -15, 15, 0.1, (v) => {
            track.params.eqMid = v;
            if(track.bus.eq.mid) track.bus.eq.mid.gain.value = v;
        }, '#a78bfa'));
        eqSec.appendChild(this.createPot('Freq', track.params.eqMidFreq || 1000, 200, 5000, 10, (v) => {
            track.params.eqMidFreq = v;
            if(track.bus.eq.mid) track.bus.eq.mid.frequency.value = v;
        }, '#a78bfa'));

        eqSec.appendChild(this.createPot('Lo', track.params.eqLow || 0, -15, 15, 0.1, (v) => {
            track.params.eqLow = v;
            if(track.bus.eq.low) track.bus.eq.low.gain.value = v;
        }, '#f59e0b'));
        controls.appendChild(eqSec);

        // Pan
        controls.appendChild(this.createPot('Pan', track.params.pan, -1, 1, 0.01, (v) => {
            track.params.pan = v;
            if(track.bus.pan) track.bus.pan.pan.value = v;
        }));

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
        
        // Header
        const header = document.createElement('div');
        header.className = 'strip-header';
        header.innerHTML = `<span class="strip-name" style="color:#10b981">GRP ${index+1}</span>`;
        strip.appendChild(header);

        const controls = document.createElement('div');
        controls.className = 'strip-controls custom-scrollbar';

        // Gain
        controls.appendChild(this.createPot('Gain', 1, 0, 2, 0.01, (v) => { /* No pre-gain on group currently implemented, reusing vol? No, use comp input? */ }));

        // Comp
        controls.appendChild(this.createPot('Comp', 0, 0, 1, 0.01, (v) => {
            if(bus && bus.comp) this.audioEngine.setCompAmount(bus.comp, v);
        }, '#f472b6'));

        // Drive Mode
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

        // Drive Amt
        controls.appendChild(this.createPot('Drive', 0, 0, 1, 0.01, (v) => {
            if(bus && bus.drive && bus.drive.input) this.audioEngine.setDriveAmount(bus.drive.input, v);
        }, '#ef4444'));

        // FX Sends (Placeholders)
        controls.appendChild(this.createPot('Snd A', 0, 0, 1, 0.01, () => {}));
        controls.appendChild(this.createPot('Snd B', 0, 0, 1, 0.01, () => {}));

        // EQ Kills (3 buttons)
        const eqSec = document.createElement('div');
        eqSec.className = 'eq-section';
        const lbl = document.createElement('label'); 
        lbl.innerText = 'EQ KILL'; lbl.style.fontSize='0.45rem'; lbl.style.color='#666';
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
                const gainVal = isKill ? -40 : 0; // -40dB cut
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

        // Master usually simple: maybe just comp/limiter threshold
        const controls = document.createElement('div');
        controls.className = 'strip-controls';
        
        const limiterDiv = document.createElement('div');
        limiterDiv.className = 'mixer-pot';
        limiterDiv.innerHTML = `<label style="color:#ef4444">LIMITER</label><span style="font-size:0.5rem;color:#555">Auto</span>`;
        controls.appendChild(limiterDiv);

        strip.appendChild(controls);

        // Fader
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