import { BeatOSMemory, MEMORY_LAYOUT } from './SharedMemory.js';
import { TRACKS_PER_GROUP, MAX_TRACKS } from '../utils/constants.js';

export class AudioEngine {
    constructor() {
        this.audioCtx = null;
        this.memory = new BeatOSMemory(); // Initialize Shared Memory
        this.masterBus = null;
        this.groupBuses = [];
        this.sendBuses = []; // [SendA, SendB]
        this.driveCurves = {};
        
        // Helper accessors for UI
        this.controlView = new Int32Array(this.memory.getBuffers().control);
        this.paramView = new Float32Array(this.memory.getBuffers().params);
        this.trackView = new Uint8Array(this.memory.getBuffers().tracks);
    }

    async initialize() {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.audioCtx.state === 'suspended') {
            await this.audioCtx.resume();
        }
        
        // Update Sample Rate in Memory (Vital for Worklet Clock)
        this.controlView[MEMORY_LAYOUT.IDX_SAMPLE_RATE] = this.audioCtx.sampleRate;

        this.generateDriveCurves();
        this.initGraph(); // Setup Master, Groups, and Sends

        return this.audioCtx;
    }
    
    getMemory() {
        return this.memory;
    }

    getContext() {
        return this.audioCtx;
    }

    // --- Audio Graph Setup ---
    
    initGraph() {
        if (!this.audioCtx) return;
        const ctx = this.audioCtx;
        
        // 1. Master Bus (Limiter -> Out)
        const masterIn = ctx.createGain();
        const limiter = ctx.createDynamicsCompressor();
        limiter.threshold.value = -1.0;
        limiter.ratio.value = 20.0;
        limiter.attack.value = 0.003;
        const masterVol = ctx.createGain();
        
        masterIn.connect(limiter);
        limiter.connect(masterVol);
        masterVol.connect(ctx.destination);
        
        this.masterBus = { input: masterIn, volume: masterVol, limiter };
        
        // 2. Group Buses (4 Groups)
        // Chain: Input -> Drive -> Comp -> Vol -> Master
        for (let i = 0; i < 4; i++) {
            const input = ctx.createGain();
            const volume = ctx.createGain();
            
            // Drive
            const shaper = ctx.createWaveShaper();
            shaper.curve = this.driveCurves['Soft Clipping'];
            shaper.oversample = '2x';
            
            // Compressor (Glue)
            const comp = ctx.createDynamicsCompressor();
            comp.threshold.value = -12;
            comp.ratio.value = 2;
            
            input.connect(shaper);
            shaper.connect(comp);
            comp.connect(volume);
            volume.connect(masterIn);
            
            this.groupBuses[i] = { input, volume, shaper, comp };
        }
        
        // 3. Send Buses (Reverb / Delay) - Placeholder routing for now
        const sendA = ctx.createGain(); // Reverb In
        const sendB = ctx.createGain(); // Delay In
        
        sendA.connect(masterIn); // TODO: Add Reverb Node here later
        sendB.connect(masterIn); // TODO: Add Delay Node here later
        
        this.sendBuses = [sendA, sendB];
    }

    generateDriveCurves() {
        const n_samples = 44100;
        const curve = new Float32Array(n_samples);
        for (let i = 0; i < n_samples; ++i) {
            const x = i * 2 / n_samples - 1;
            // Soft Clipping (Tanh)
            curve[i] = Math.tanh(x); 
        }
        this.driveCurves['Soft Clipping'] = curve;
    }

    // --- Helper: Update Parameters in Shared Memory ---
    // UI calls this instead of interacting with Nodes directly for synthesis params
    updateParam(trackId, paramIndex, value) {
        const offset = trackId * MEMORY_LAYOUT.PARAMS_PER_TRACK;
        this.paramView[offset + paramIndex] = value;
    }
    
    // UI calls this to update pattern
    updateTrackStep(trackId, stepIndex, velocity) {
        const offset = trackId * MEMORY_LAYOUT.STEPS_PER_TRACK;
        this.trackView[offset + stepIndex] = velocity;
    }
    
    // --- Routing for Worklet ---
    // This is called by the Worklet Wrapper to connect the 34 outputs
    connectWorkletOutputs(workletNode) {
        if (!workletNode) return;
        
        // 1. Connect Tracks (0-31)
        for (let t = 0; t < MAX_TRACKS; t++) {
            const groupIdx = Math.floor(t / TRACKS_PER_GROUP);
            const targetGroup = this.groupBuses[groupIdx];
            
            if (targetGroup) {
                // Connect specific output index 't' to group input
                workletNode.connect(targetGroup.input, t);
            }
        }
        
        // 2. Connect Sends (32, 33)
        // Output 32 -> Send A
        workletNode.connect(this.sendBuses[0], 32);
        // Output 33 -> Send B
        workletNode.connect(this.sendBuses[1], 33);
        
        console.log('[AudioEngine] Worklet outputs routed to Mixer.');
    }

    // --- Buffer Generation Utils (Restored) ---

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
            // Texture / FM
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
        // Simple mapping based on track index for initialization
        const type = trkIdx === 0 ? 'kick' : trkIdx === 1 ? 'snare' : trkIdx === 2 ? 'hihat' : 'texture';
        return this.generateBufferByType(type);
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
}