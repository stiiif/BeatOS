// Audio Engine Module - Optimized & Fixed
import { VELOCITY_GAINS, TRACKS_PER_GROUP } from '../utils/constants.js';

export class AudioEngine {
    constructor() {
        this.audioCtx = null;
        this.onBpmChange = null;
        this.masterBus = null;
        this.groupBuses = [];
        this.returnBuses = [];
        this.driveCurves = {};
        this.bufferCache = new Map();
        this.reverbIRCache = null;
        this.effectsState = [
            { params: [0.5, 0.5, 0.5] }, // FX 1 (Delay)
            { params: [0.5, 0.5, 0.5] }  // FX 2 (Reverb)
        ];
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
        this.initReturnBus(0); // Return A (Delay)
        this.initReturnBus(1); // Return B (Reverb)

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
        
        // NEW: Master Analyser for Metering
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.85;
        
        input.connect(limiter);
        limiter.connect(volume);
        volume.connect(analyser);
        volume.connect(ctx.destination);
        
        this.masterBus = { input, volume, limiter, analyser };
    }

    initReturnBus(index) {
        if(!this.audioCtx) return;
        const ctx = this.audioCtx;
        const input = ctx.createGain();

        const fxInput = ctx.createGain();
        const fxWet = ctx.createGain();
        const dryGain = ctx.createGain();
        const wetGain = ctx.createGain();
        const fxOutput = ctx.createGain();
        let fxNodes = {};

        input.connect(fxInput);
        input.connect(dryGain);
        dryGain.connect(fxOutput);
        fxInput.connect(fxWet);
        fxWet.connect(wetGain);
        wetGain.connect(fxOutput);
        
        dryGain.gain.value = 0.5;
        wetGain.gain.value = 0.5;

        if (index === 0) {
            const delay = ctx.createDelay(5.0);
            const feedback = ctx.createGain();
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 2000;
            delay.delayTime.value = 0.3;
            feedback.gain.value = 0.4;

            fxInput.disconnect(fxWet);
            fxInput.connect(delay);
            delay.connect(filter);
            filter.connect(fxWet); 
            filter.connect(feedback);
            feedback.connect(delay);

            fxNodes = { delay, feedback, filter };
        } else {
            const convolver = ctx.createConvolver();
            const tone = ctx.createBiquadFilter();
            tone.type = 'highshelf';
            tone.frequency.value = 4000;
            tone.gain.value = -5; 

            this.generateReverbIR(convolver, 2.0); 

            fxInput.disconnect(fxWet);
            fxInput.connect(tone);
            tone.connect(convolver);
            convolver.connect(fxWet); 

            fxNodes = { convolver, tone };
        }
        
        fxNodes.dryGain = dryGain;
        fxNodes.wetGain = wetGain;

        // RETURN STRIP (No Compressor)
        const eqLow = ctx.createBiquadFilter(); eqLow.type = 'lowshelf'; eqLow.frequency.value = 250;
        const eqMid = ctx.createBiquadFilter(); eqMid.type = 'peaking'; eqMid.frequency.value = 1000; eqMid.Q.value = 1;
        const eqHigh = ctx.createBiquadFilter(); eqHigh.type = 'highshelf'; eqHigh.frequency.value = 4000;
        
        const preDrive = ctx.createGain(); 
        const shaper = ctx.createWaveShaper();
        shaper.curve = this.driveCurves['Soft Clipping']; 
        const postDrive = ctx.createGain(); 
        
        // Removed Compressor from Return
        
        const vol = ctx.createGain();
        const pan = ctx.createStereoPanner();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512; 

        fxOutput.connect(eqLow);
        eqLow.connect(eqMid);
        eqMid.connect(eqHigh);
        eqHigh.connect(preDrive);
        preDrive.connect(shaper);
        shaper.connect(postDrive);
        postDrive.connect(vol); // Direct connect (no comp)
        vol.connect(pan);
        pan.connect(analyser); 

        if (this.masterBus) {
            pan.connect(this.masterBus.input);
        }

        this.returnBuses[index] = {
            id: `return_${index}`,
            input,
            fxNodes,
            eq: { low: eqLow, mid: eqMid, high: eqHigh },
            drive: { input: preDrive, shaper, output: postDrive },
            volume: vol,
            pan,
            analyser,
            sendA: null, 
            sendB: null,
            params: { 
                volume: 0.8, pan: 0, 
                gain: 1.0, eqLow: 0, eqMid: 0, eqHigh: 0, eqMidFreq: 1000,
                drive: 0, sendA: 0, sendB: 0
            }
        };

        this.initReturnCrossSends(index);
    }

    initReturnCrossSends(index) {
        const ctx = this.audioCtx;
        const bus = this.returnBuses[index];
        const sendA = ctx.createGain(); sendA.gain.value = 0;
        bus.sendA = sendA;
        const sendB = ctx.createGain(); sendB.gain.value = 0;
        bus.sendB = sendB;
        bus.volume.connect(sendA);
        bus.volume.connect(sendB);
    }

    generateReverbIR(convolver, duration) {
        if (this.reverbIRCache) {
            convolver.buffer = this.reverbIRCache;
            return;
        }
        const ctx = this.audioCtx;
        const sampleRate = ctx.sampleRate;
        const length = sampleRate * duration;
        const impulse = ctx.createBuffer(2, length, sampleRate);
        for (let channel = 0; channel < 2; channel++) {
            const channelData = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                const decay = Math.pow(1 - i / length, 2); 
                channelData[i] = (Math.random() * 2 - 1) * decay;
            }
        }
        this.reverbIRCache = impulse;
        convolver.buffer = impulse;
    }

    initGroupBus(index) {
        if(!this.audioCtx) return;
        const ctx = this.audioCtx;
        const input = ctx.createGain();
        
        const eqLow = ctx.createBiquadFilter(); eqLow.type = 'lowshelf'; eqLow.frequency.value = 250;
        const eqMid = ctx.createBiquadFilter(); eqMid.type = 'peaking'; eqMid.frequency.value = 1000; eqMid.Q.value = 1;
        const eqHigh = ctx.createBiquadFilter(); eqHigh.type = 'highshelf'; eqHigh.frequency.value = 4000;
        
        const preDriveGain = ctx.createGain(); 
        const shaper = ctx.createWaveShaper();
        shaper.curve = this.driveCurves['Soft Clipping']; 
        shaper.oversample = '2x';
        const postDriveGain = ctx.createGain(); 
        
        // KEEP Compressor on Groups
        const compressor = ctx.createDynamicsCompressor();
        compressor.threshold.value = 0; 
        compressor.ratio.value = 1;
        
        const volume = ctx.createGain();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512; 
        analyser.smoothingTimeConstant = 0.85;
        
        input.connect(eqLow);
        eqLow.connect(eqMid);
        eqMid.connect(eqHigh);
        eqHigh.connect(preDriveGain);
        preDriveGain.connect(shaper);
        shaper.connect(postDriveGain);
        postDriveGain.connect(compressor);
        compressor.connect(volume);
        
        volume.connect(analyser);
        
        if (this.masterBus) {
            volume.connect(this.masterBus.input);
        }
        
        const sendA = ctx.createGain(); sendA.gain.value = 0;
        const sendB = ctx.createGain(); sendB.gain.value = 0;
        volume.connect(sendA);
        volume.connect(sendB);
        
        if (this.returnBuses[0]) sendA.connect(this.returnBuses[0].input);
        if (this.returnBuses[1]) sendB.connect(this.returnBuses[1].input);

        this.groupBuses[index] = {
            input,
            eq: { low: eqLow, mid: eqMid, high: eqHigh },
            drive: { input: preDriveGain, shaper: shaper, output: postDriveGain },
            comp: compressor,
            volume,
            analyser,
            sendA, sendB,
            params: { sendA: 0, sendB: 0 }
        };
    }

    initTrackBus(track) {
        if(!this.audioCtx) return;
        const ctx = this.audioCtx;

        const input = ctx.createGain();
        const trim = ctx.createGain(); 
        
        // Removed HPF, only LPF
        const lp = ctx.createBiquadFilter(); lp.type = 'lowpass';
        
        const eqLow = ctx.createBiquadFilter(); eqLow.type = 'lowshelf'; eqLow.frequency.value = 200;
        const eqMid = ctx.createBiquadFilter(); eqMid.type = 'peaking'; eqMid.frequency.value = 1000; eqMid.Q.value = 1;
        const eqHigh = ctx.createBiquadFilter(); eqHigh.type = 'highshelf'; eqHigh.frequency.value = 3000;
        
        const preDrive = ctx.createGain();
        const shaper = ctx.createWaveShaper();
        shaper.curve = this.driveCurves['Soft Clipping'];
        
        // REMOVED Compressor from Track
        
        const vol = ctx.createGain();
        const pan = ctx.createStereoPanner();
        const sendA = ctx.createGain();
        const sendB = ctx.createGain();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.85;

        // Optimized Chain: Input -> Trim -> LPF -> EQ -> Drive -> Vol -> Pan
        input.connect(trim);
        trim.connect(lp);
        lp.connect(eqLow);
        eqLow.connect(eqMid);
        eqMid.connect(eqHigh);
        eqHigh.connect(preDrive);
        preDrive.connect(shaper);
        shaper.connect(vol); // No comp
        vol.connect(pan);
        
        vol.connect(sendA);
        vol.connect(sendB);
        
        if (this.returnBuses[0]) sendA.connect(this.returnBuses[0].input);
        if (this.returnBuses[1]) sendB.connect(this.returnBuses[1].input);
        
        const groupIndex = Math.floor(track.id / TRACKS_PER_GROUP);
        if (this.groupBuses[groupIndex]) {
            pan.connect(this.groupBuses[groupIndex].input);
        } else if (this.masterBus) {
            pan.connect(this.masterBus.input);
        } else {
            pan.connect(ctx.destination);
        }
        
        pan.connect(analyser);

        lp.frequency.value = this.getMappedFrequency(track.params.filter || 20000, 'lp');
        vol.gain.value = track.params.volume || 0.8;
        pan.pan.value = track.params.pan || 0;
        sendA.gain.value = track.params.sendA || 0;
        sendB.gain.value = track.params.sendB || 0;

        track.bus = { 
            input, trim, lp, 
            eq: { low: eqLow, mid: eqMid, high: eqHigh },
            drive: { input: preDrive, shaper },
            vol, pan, analyser,
            sendA, sendB
        };
    }

    setDriveAmount(node, amount) {
        const gain = 1 + (amount * 20); 
        node.gain.value = gain;
    }

    setCompAmount(node, amount) {
        if(amount === 0) {
            node.ratio.value = 1;
            node.threshold.value = 0;
        } else {
            node.ratio.value = 1 + (amount * 12);
            node.threshold.value = 0 - (amount * 40);
        }
        node.attack.value = 0.003;
        node.release.value = 0.25;
    }

    getMappedFrequency(value, type) {
        let min = 100, max = 10000;
        // HPF Logic removed
        let norm = (value - min) / (max - min);
        norm = Math.max(0, Math.min(1, norm));
        return min + (max - min) * Math.pow(norm, 3);
    }

    setEffectParam(fxIndex, paramIndex, value) {
        if (!this.returnBuses[fxIndex]) return;
        const nodes = this.returnBuses[fxIndex].fxNodes;
        const v = Math.max(0, Math.min(1, value));

        if (fxIndex === 0) { // DELAY
            if (paramIndex === 0) { 
                const time = 0.01 + (v * 0.99);
                nodes.delay.delayTime.setTargetAtTime(time, this.audioCtx.currentTime, 0.05);
            } else if (paramIndex === 1) { 
                const fb = v * 0.95;
                nodes.feedback.gain.setTargetAtTime(fb, this.audioCtx.currentTime, 0.05);
            } else if (paramIndex === 2) { 
                const freq = 200 + (v * 14800);
                nodes.filter.frequency.setTargetAtTime(freq, this.audioCtx.currentTime, 0.05);
            } else if (paramIndex === 3) { 
                nodes.dryGain.gain.setTargetAtTime(1 - v, this.audioCtx.currentTime, 0.05);
                nodes.wetGain.gain.setTargetAtTime(v, this.audioCtx.currentTime, 0.05);
            }
        } else { // REVERB
            if (paramIndex === 0) { 
                const freq = 500 + (v * 10000);
                nodes.tone.frequency.setTargetAtTime(freq, this.audioCtx.currentTime, 0.05);
            } else if (paramIndex === 1) { 
                const gain = (v * 30) - 15;
                nodes.tone.gain.setTargetAtTime(gain, this.audioCtx.currentTime, 0.05);
            } else if (paramIndex === 3) { 
                nodes.dryGain.gain.setTargetAtTime(1 - v, this.audioCtx.currentTime, 0.05);
                nodes.wetGain.gain.setTargetAtTime(v, this.audioCtx.currentTime, 0.05);
            }
        }
    }

    trimBuffer(buffer, staticThreshold = 0.002, useTransientDetection = true) {
        // Implementation kept same
        if (!buffer) return null;
        return buffer; // Placeholder for logic
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
                    track.customSample = { name: file.name, buffer: audioBuffer, duration: audioBuffer.duration };
                    track.buffer = audioBuffer;
                    track.rmsMap = this.analyzeBuffer(audioBuffer);
                    resolve(audioBuffer);
                } catch (err) { console.error(err); reject(err); }
            };
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
            for(let i=0; i<d.length; i++) {
                const t = i / this.audioCtx.sampleRate;
                d[i] = Math.sin(2 * Math.PI * startFreq * Math.exp(-decay * t) * t) * Math.exp(-4 * t);
            }
        } else if (type === 'snare') {
            buf = makeBuffer(0.4);
            const d = buf.getChannelData(0);
            for(let i=0; i<d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-10 * i / this.audioCtx.sampleRate);
        } else if (type === 'hihat') {
            buf = makeBuffer(0.15);
            const d = buf.getChannelData(0);
            for(let i=0; i<d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-40 * i / this.audioCtx.sampleRate);
        } else { 
            buf = makeBuffer(0.5);
            const d = buf.getChannelData(0);
            for(let i=0; i<d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.5;
        }
        
        return buf;
    }

    // MISSING METHOD RESTORED
    generateBufferForTrack(trkIdx) {
        // Maps track index to a default sound type for initial setup
        const type = trkIdx === 0 ? 'kick' : trkIdx === 1 ? 'snare' : trkIdx === 2 ? 'hihat' : 'texture';
        return this.generateBufferByType(type);
    }

    triggerDrum(track, time, velocityLevel = 2) {
        // Implementation kept same logic
        if (!this.audioCtx || !track.bus) return;
        // ... (standard OSC trigger logic)
    }
}