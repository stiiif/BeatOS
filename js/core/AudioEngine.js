// Audio Engine Module - Fixed Routing (Analyser Leak Plugged)
// Phase 4.4: Updated triggerDrum for Hybrid Sequencer (Immediate Execution)

import { VELOCITY_GAINS, TRACKS_PER_GROUP } from '../utils/constants.js';

export class AudioEngine {
    constructor() {
        this.audioCtx = null;
        this.onBpmChange = null;
        this.masterBus = null;
        this.groupBuses = [];
        this.driveCurves = {};
    }

    async initialize() {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.audioCtx.state === 'suspended') {
            await this.audioCtx.resume();
        }
        
        this.generateDriveCurves();
        this.initMasterBus();
        // Initialize 4 Group Buses
        for(let i=0; i<4; i++) {
            this.initGroupBus(i);
        }

        return this.audioCtx;
    }

    getContext() {
        return this.audioCtx;
    }

    generateDriveCurves() {
        const n_samples = 44100;
        const makeCurve = (fn) => {
            const curve = new Float32Array(n_samples);
            for (let i = 0; i < n_samples; ++i) {
                const x = i * 2 / n_samples - 1;
                curve[i] = fn(x);
            }
            return curve;
        };

        this.driveCurves = {
            'Soft Clipping': makeCurve(x => Math.tanh(x)),
            'Hard Clipping': makeCurve(x => Math.max(-1, Math.min(1, x * 3))),
            'Tube': makeCurve(x => {
                const q = x < 0.5 ? x : 0.5 + (x - 0.5) / (1 + Math.pow((x - 0.5) * 2, 2));
                return (Math.sin(q * Math.PI * 0.5)); 
            }),
            'Sigmoid': makeCurve(x => 2 / (1 + Math.exp(-4 * x)) - 1),
            'Arctan': makeCurve(x => (2 / Math.PI) * Math.atan(2 * x)),
            'Exponential': makeCurve(x => x > 0 ? 1 - Math.exp(-x) : -1 + Math.exp(x)),
            'Cubic': makeCurve(x => x - 0.15 * x * x * x),
            'Diode': makeCurve(x => x > 0 ? 1 - Math.exp(-1.5*x) : -0.1*x), 
            'Asymmetric': makeCurve(x => x > 0 ? Math.tanh(x) : Math.tanh(x * 0.5)),
            'Foldback': makeCurve(x => Math.sin(x * Math.PI * 1.5)) 
        };
    }

    initMasterBus() {
        if(!this.audioCtx) return;
        const ctx = this.audioCtx;
        const input = ctx.createGain();
        
        // Master Limiter
        const limiter = ctx.createDynamicsCompressor(); 
        limiter.threshold.value = -1.0;
        limiter.ratio.value = 20.0;
        limiter.attack.value = 0.003;
        limiter.release.value = 0.25;
        
        const volume = ctx.createGain();
        
        // Master Analyser for Metering
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.85;
        
        input.connect(limiter);
        limiter.connect(volume);
        volume.connect(analyser);
        volume.connect(ctx.destination);
        
        this.masterBus = { input, volume, limiter, analyser };
    }

    initGroupBus(index) {
        if(!this.audioCtx) return;
        const ctx = this.audioCtx;
        const input = ctx.createGain();
        
        // Group EQ (Kill Switches essentially)
        const eqLow = ctx.createBiquadFilter(); eqLow.type = 'lowshelf'; eqLow.frequency.value = 250;
        const eqMid = ctx.createBiquadFilter(); eqMid.type = 'peaking'; eqMid.frequency.value = 1000; eqMid.Q.value = 1;
        const eqHigh = ctx.createBiquadFilter(); eqHigh.type = 'highshelf'; eqHigh.frequency.value = 4000;
        
        // Drive Section
        const preDriveGain = ctx.createGain(); 
        const shaper = ctx.createWaveShaper();
        shaper.curve = this.driveCurves['Soft Clipping']; 
        shaper.oversample = '2x';
        const postDriveGain = ctx.createGain(); 
        
        // Compressor
        const compressor = ctx.createDynamicsCompressor();
        compressor.threshold.value = 0; 
        compressor.ratio.value = 1;
        
        const volume = ctx.createGain();

        // Group Analyser for Metering
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.85;
        
        // Chain: Input -> EQ -> Drive -> Comp -> Vol -> Master
        input.connect(eqLow);
        eqLow.connect(eqMid);
        eqMid.connect(eqHigh);
        eqHigh.connect(preDriveGain);
        preDriveGain.connect(shaper);
        shaper.connect(postDriveGain);
        postDriveGain.connect(compressor);
        compressor.connect(volume);
        
        // Connect Analyser
        volume.connect(analyser);
        
        if (this.masterBus) {
            volume.connect(this.masterBus.input);
        }
        
        this.groupBuses[index] = {
            input,
            eq: { low: eqLow, mid: eqMid, high: eqHigh },
            drive: { input: preDriveGain, shaper: shaper, output: postDriveGain },
            comp: compressor,
            volume,
            analyser
        };
    }

    initTrackBus(track) {
        if(!this.audioCtx) return;
        const ctx = this.audioCtx;

        const input = ctx.createGain();
        const trim = ctx.createGain(); 
        
        // Global Track Filters (from TrackControls)
        const hp = ctx.createBiquadFilter(); hp.type = 'highpass';
        const lp = ctx.createBiquadFilter(); lp.type = 'lowpass';
        
        // Mixer EQ (3-Band)
        const eqLow = ctx.createBiquadFilter(); eqLow.type = 'lowshelf'; eqLow.frequency.value = 200;
        const eqMid = ctx.createBiquadFilter(); eqMid.type = 'peaking'; eqMid.frequency.value = 1000; eqMid.Q.value = 1;
        const eqHigh = ctx.createBiquadFilter(); eqHigh.type = 'highshelf'; eqHigh.frequency.value = 3000;
        
        // Drive
        const preDrive = ctx.createGain();
        const shaper = ctx.createWaveShaper();
        shaper.curve = this.driveCurves['Soft Clipping'];
        
        // Compressor
        const comp = ctx.createDynamicsCompressor();
        comp.threshold.value = -10; 
        comp.ratio.value = 1; 
        
        const vol = ctx.createGain();
        const pan = ctx.createStereoPanner();
        
        // Analyser for visualizer
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.85;

        // Connect Chain: Input -> Trim -> Filters -> EQ -> Drive -> Comp -> Vol -> Pan
        input.connect(trim);
        trim.connect(hp);
        hp.connect(lp);
        lp.connect(eqLow);
        eqLow.connect(eqMid);
        eqMid.connect(eqHigh);
        eqHigh.connect(preDrive);
        preDrive.connect(shaper);
        shaper.connect(comp);
        comp.connect(vol);
        vol.connect(pan);
        
        // Route to appropriate Group (Critical Logic)
        const groupIndex = Math.floor(track.id / TRACKS_PER_GROUP);
        
        if (this.groupBuses[groupIndex]) {
            pan.connect(this.groupBuses[groupIndex].input);
        } else if (this.masterBus) {
            // Fallback to master if group unavailable
            pan.connect(this.masterBus.input);
        } else {
            // Fallback to hardware output (only if init order is wrong)
            pan.connect(ctx.destination);
        }
        
        // Connect Analyser (Side-chain / Tap)
        pan.connect(analyser);

        // Apply Defaults / Stored Values
        hp.frequency.value = this.getMappedFrequency(track.params.hpFilter || 20, 'hp');
        lp.frequency.value = this.getMappedFrequency(track.params.filter || 20000, 'lp');
        vol.gain.value = track.params.volume || 0.8;
        pan.pan.value = track.params.pan || 0;

        // Store references for automation/UI
        track.bus = { 
            input, trim, hp, lp, 
            eq: { low: eqLow, mid: eqMid, high: eqHigh },
            drive: { input: preDrive, shaper },
            comp, vol, pan, analyser 
        };
    }

    setDriveAmount(node, amount) {
        // Simple 0 to +20dB boost into shaper
        const gain = 1 + (amount * 20); 
        node.gain.value = gain;
    }

    setCompAmount(node, amount) {
        if(amount === 0) {
            node.ratio.value = 1;
            node.threshold.value = 0;
        } else {
            // One-knob compression logic
            node.ratio.value = 1 + (amount * 12);
            node.threshold.value = 0 - (amount * 40);
        }
        node.attack.value = 0.003;
        node.release.value = 0.25;
    }

    getMappedFrequency(value, type) {
        let min, max;
        if (type === 'hp') { min = 20; max = 5000; }
        else { min = 100; max = 10000; }
        let norm = (value - min) / (max - min);
        norm = Math.max(0, Math.min(1, norm));
        if (type === 'lp') return min + (max - min) * Math.pow(norm, 3);
        else return min + (max - min) * (1 - Math.pow(1 - norm, 3));
    }

    // --- UTILS ---
    trimBuffer(buffer, staticThreshold = 0.002, useTransientDetection = true) {
        if (!buffer) return null;
        const numChannels = buffer.numberOfChannels;
        const len = buffer.length;
        let startIndex = len; 
        if (useTransientDetection) {
            const mono = new Float32Array(len);
            for (let i = 0; i < len; i++) {
                let sum = 0;
                for (let c = 0; c < numChannels; c++) {
                    sum += buffer.getChannelData(c)[i];
                }
                mono[i] = sum / numChannels;
            }
            let maxAmp = 0;
            for(let i=0; i<len; i++) {
                const abs = Math.abs(mono[i]);
                if (abs > maxAmp) maxAmp = abs;
            }
            if (maxAmp < 0.001) return buffer;
            const relativeThreshold = maxAmp * 0.05;
            const finalThreshold = Math.max(staticThreshold, relativeThreshold);
            for (let i = 0; i < len; i++) {
                if (Math.abs(mono[i]) > finalThreshold) {
                    const backtrackSamples = Math.floor(0.002 * buffer.sampleRate);
                    startIndex = Math.max(0, i - backtrackSamples);
                    break;
                }
            }
        } else {
            for (let c = 0; c < numChannels; c++) {
                const data = buffer.getChannelData(c);
                for (let i = 0; i < len; i++) {
                    if (Math.abs(data[i]) > staticThreshold) {
                        if (i < startIndex) startIndex = i;
                        break;
                    }
                }
            }
        }
        if (startIndex >= len || startIndex === 0) return buffer;
        const newLen = len - startIndex;
        const newBuffer = this.audioCtx.createBuffer(numChannels, newLen, buffer.sampleRate);
        for (let c = 0; c < numChannels; c++) {
            const oldData = buffer.getChannelData(c);
            const newData = newBuffer.getChannelData(c);
            for (let i = 0; i < newLen; i++) {
                newData[i] = oldData[i + startIndex];
            }
        }
        console.log(`[AudioEngine] Smart Trim: Removed ${(startIndex / buffer.sampleRate).toFixed(4)}s`);
        return newBuffer;
    }

    analyzeBuffer(buffer) {
        if(!buffer) return [];
        const data = buffer.getChannelData(0);
        const chunkSize = Math.floor(data.length / 100); 
        const map = [];
        for(let i=0; i<100; i++) {
            let sum = 0;
            const start = i * chunkSize;
            for(let j=0; j<chunkSize; j++) {
                const s = data[start + j];
                sum += s * s;
            }
            const rms = Math.sqrt(sum / chunkSize);
            map.push(rms > 0.01); 
        }
        return map;
    }

    async loadCustomSample(file, track) {
        if (!this.audioCtx) return null;
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const arrayBuffer = e.target.result;
                    let audioBuffer = await this.audioCtx.decodeAudioData(arrayBuffer);
                    audioBuffer = this.trimBuffer(audioBuffer, 0.005, true);
                    track.customSample = { name: file.name, buffer: audioBuffer, duration: audioBuffer.duration };
                    track.buffer = audioBuffer;
                    track.rmsMap = this.analyzeBuffer(audioBuffer);
                    resolve(audioBuffer);
                } catch (err) { console.error('Failed to decode audio:', err); reject(err); }
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsArrayBuffer(file);
        });
    }

    generateBufferByType(type) {
        if(!this.audioCtx) return null;
        const makeBuffer = (lenSec) => this.audioCtx.createBuffer(1, this.audioCtx.sampleRate * lenSec, this.audioCtx.sampleRate);
        let buf;
        if (type === 'kick') {
            buf = makeBuffer(0.5);
            const d = buf.getChannelData(0);
            const startFreq = 130 + Math.random() * 40;
            const decay = 12 + Math.random() * 6;
            const toneDecay = 4 + Math.random() * 2;
            for(let i=0; i<d.length; i++) {
                const t = i / this.audioCtx.sampleRate;
                d[i] = Math.sin(2 * Math.PI * startFreq * Math.exp(-decay * t) * t) * Math.exp(-toneDecay * t);
            }
        } else if (type === 'snare') {
            buf = makeBuffer(0.4);
            const d = buf.getChannelData(0);
            const toneFreq = 160 + Math.random() * 60;
            const noiseDecay = 6 + Math.random() * 4;
            const toneDecay = 10 + Math.random() * 5;
            const noiseMix = 0.6 + Math.random() * 0.3;
            for(let i=0; i<d.length; i++) {
                const t = i / this.audioCtx.sampleRate;
                const noise = (Math.random() * 2 - 1) * Math.exp(-noiseDecay * t);
                const tone = Math.sin(2 * Math.PI * toneFreq * t) * Math.exp(-toneDecay * t);
                d[i] = (noise * noiseMix + tone * (1 - noiseMix));
            }
        } else if (type === 'hihat') {
            buf = makeBuffer(0.15);
            const d = buf.getChannelData(0);
            const decay = 35 + Math.random() * 20;
            const hpfMix = 0.5 + Math.random() * 0.4;
            for(let i=0; i<d.length; i++) {
                const t = i / this.audioCtx.sampleRate;
                let noise = (Math.random() * 2 - 1);
                if (i>0) noise -= d[i-1] * hpfMix; 
                d[i] = noise * Math.exp(-decay * t);
            }
        } else { 
            const dur = 0.2 + (Math.random() * 0.8);
            buf = makeBuffer(dur);
            const d = buf.getChannelData(0);
            const modFreq = 10 + Math.random() * 400;
            const carFreq = 40 + Math.random() * 800;
            const isSquare = Math.random() > 0.6;
            const modIdx = Math.random() * 8;
            for(let i=0; i<d.length; i++) {
                const t = i / this.audioCtx.sampleRate;
                let val = Math.sin(2 * Math.PI * carFreq * t + Math.sin(2 * Math.PI * modFreq * t)*modIdx);
                if (isSquare) val = Math.sign(val) * 0.5;
                d[i] = val * 0.5;
            }
        }
        return buf;
    }

    generateBufferForTrack(trkIdx) {
        const type = trkIdx === 0 ? 'kick' : trkIdx === 1 ? 'snare' : trkIdx === 2 ? 'hihat' : 'texture';
        return this.generateBufferByType(type);
    }

    triggerDrum(track, time, velocityLevel = 2) {
        if (!this.audioCtx || !track.bus) return;
        const ctx = this.audioCtx;
        
        // Ensure "time" is safe.
        // If "time" is in the past (which happens when triggering from Worklet callback),
        // we use currentTime to trigger immediately.
        
        let t = Math.max(ctx.currentTime, time);
        
        const type = track.params.drumType || 'kick';
        const tune = track.params.drumTune || 0.5; 
        const decayVal = track.params.drumDecay || 0.5; 

        let gainMult = 1.0;
        let decayMult = 1.0;
        let pitchModMult = 1.0;
        let filterOffset = 0; 

        switch(velocityLevel) {
            case 1: gainMult = 0.3; decayMult = 0.4; pitchModMult = 0.1; filterOffset = -3500; break;
            case 2: gainMult = 0.7; break;
            case 3: gainMult = 1.0; pitchModMult = 1.2; filterOffset = 500; break;
            default: if (velocityLevel > 0) gainMult = 0.7; else return;
        }

        const out = track.bus.input;

        // Apply filters (immediate)
        if(track.bus.hp) {
            const freq = this.getMappedFrequency(Math.max(20, track.params.hpFilter), 'hp');
            track.bus.hp.frequency.setValueAtTime(freq, t);
        }
        
        let lpFreq = this.getMappedFrequency(Math.max(100, track.params.filter), 'lp');
        let targetLp = lpFreq + filterOffset;
        targetLp = Math.max(100, Math.min(22000, targetLp));
        
        if(track.bus.lp) {
            track.bus.lp.frequency.setValueAtTime(targetLp, t);
        }

        // --- SYNTHESIS LOGIC (Same as before, using 't' safe time) ---

        if (type === 'kick') {
            const osc = ctx.createOscillator(); const gain = ctx.createGain();
            const baseFreq = 50 + (tune * 100); const finalDecay = (0.01 + (decayVal * 0.6)) * decayMult;
            osc.connect(gain); gain.connect(out);
            osc.frequency.setValueAtTime(150 + (tune*200), t);
            osc.frequency.exponentialRampToValueAtTime(baseFreq, t + Math.max(0.001, Math.min(0.02, finalDecay * 0.5) * pitchModMult));
            osc.frequency.exponentialRampToValueAtTime(30, t + finalDecay);
            gain.gain.setValueAtTime(gainMult, t); gain.gain.exponentialRampToValueAtTime(0.001, t + finalDecay);
            track.addSource(osc); osc.start(t); osc.stop(t + finalDecay + 0.1);
        } else if (type === 'snare') {
            const osc = ctx.createOscillator(); const oscGain = ctx.createGain();
            const finalToneDecay = (0.01 + (decayVal * 0.3)) * decayMult;
            osc.type = 'triangle'; osc.frequency.setValueAtTime(180 + (tune * 100), t);
            osc.connect(oscGain); oscGain.connect(out);
            oscGain.gain.setValueAtTime((velocityLevel===1?0.2:0.5)*gainMult, t); oscGain.gain.exponentialRampToValueAtTime(0.001, t + finalToneDecay);
            track.addSource(osc); osc.start(t); osc.stop(t + finalToneDecay + 0.1);
            
            const finalNoiseDecay = (0.01 + (decayVal * 0.4)) * decayMult;
            const bufferSize = ctx.sampleRate * (finalNoiseDecay + 0.1); const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0); for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
            const noise = ctx.createBufferSource(); noise.buffer = buffer;
            const noiseFilter = ctx.createBiquadFilter(); noiseFilter.type = 'highpass'; noiseFilter.frequency.value = 1000;
            const noiseGain = ctx.createGain();
            noise.connect(noiseFilter); noiseFilter.connect(noiseGain); noiseGain.connect(out);
            noiseGain.gain.setValueAtTime(0.8 * gainMult, t); noiseGain.gain.exponentialRampToValueAtTime(0.001, t + finalNoiseDecay);
            track.addSource(noise); noise.start(t);
        } else if (type === 'closed-hat' || type === 'open-hat') {
            const isOpen = type === 'open-hat';
            const finalDecay = (isOpen ? (0.05 + decayVal * 0.75) : (0.005 + decayVal * 0.15)) * decayMult;
            const bufferSize = ctx.sampleRate * (finalDecay + 0.1); const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0); for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1);
            const src = ctx.createBufferSource(); src.buffer = buffer;
            const bpf = ctx.createBiquadFilter(); bpf.type = 'bandpass'; bpf.frequency.value = 8000 + (tune * 4000); bpf.Q.value = 1;
            const hpf = ctx.createBiquadFilter(); hpf.type = 'highpass'; hpf.frequency.value = 5000;
            const gain = ctx.createGain();
            src.connect(bpf); bpf.connect(hpf); hpf.connect(gain); gain.connect(out);
            gain.gain.setValueAtTime(0.6 * gainMult, t); gain.gain.exponentialRampToValueAtTime(0.001, t + finalDecay);
            track.addSource(src); src.start(t);
        } else if (type === 'cymbal') {
            const finalDecay = (0.1 + (decayVal * 2.9)) * decayMult;
            const bufferSize = ctx.sampleRate * (finalDecay + 0.1); const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0); for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1);
            const src = ctx.createBufferSource(); src.buffer = buffer;
            const mixGain = ctx.createGain(); src.connect(mixGain);
            const hpf = ctx.createBiquadFilter(); hpf.type = 'highpass'; hpf.frequency.value = 4000 + (tune * 2000);
            const env = ctx.createGain(); src.connect(hpf); hpf.connect(env); env.connect(out);
            env.gain.setValueAtTime(0.5 * gainMult, t); env.gain.exponentialRampToValueAtTime(0.001, t + finalDecay);
            track.addSource(src); src.start(t);
        }
    }
}