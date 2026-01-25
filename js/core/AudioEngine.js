// Audio Engine Module
import { VELOCITY_GAINS } from '../utils/constants.js';

export class AudioEngine {
    constructor() {
        this.audioCtx = null;
        this.onBpmChange = null;
    }

    async initialize() {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.audioCtx.state === 'suspended') {
            await this.audioCtx.resume();
        }
        return this.audioCtx;
    }

    getContext() {
        return this.audioCtx;
    }

    // New method: Automatically removes leading silence from a buffer
    trimBuffer(buffer, threshold = 0.002) {
        if (!buffer) return null;
        
        const numChannels = buffer.numberOfChannels;
        const len = buffer.length;
        let startIndex = len;

        // 1. Find the earliest start point across all channels
        for (let c = 0; c < numChannels; c++) {
            const data = buffer.getChannelData(c);
            for (let i = 0; i < len; i++) {
                if (Math.abs(data[i]) > threshold) {
                    // We found sound! Check if it's earlier than what we found in other channels
                    if (i < startIndex) startIndex = i;
                    break;
                }
            }
        }

        // If the sample is entirely silent or starts immediately, return original
        if (startIndex >= len || startIndex === 0) return buffer;

        // 2. Create a new shorter buffer
        const newLen = len - startIndex;
        const newBuffer = this.audioCtx.createBuffer(numChannels, newLen, buffer.sampleRate);

        // 3. Copy the data shifting it left by startIndex
        for (let c = 0; c < numChannels; c++) {
            const oldData = buffer.getChannelData(c);
            const newData = newBuffer.getChannelData(c);
            for (let i = 0; i < newLen; i++) {
                newData[i] = oldData[i + startIndex];
            }
        }

        console.log(`[AudioEngine] Trimmed ${(startIndex / buffer.sampleRate).toFixed(3)}s of silence`);
        return newBuffer;
    }

    getMappedFrequency(value, type) {
        let min, max;
        if (type === 'hp') { min = 20; max = 5000; }
        else { min = 100; max = 10000; }

        let norm = (value - min) / (max - min);
        norm = Math.max(0, Math.min(1, norm));

        if (type === 'lp') {
            return min + (max - min) * Math.pow(norm, 3);
        } else {
            return min + (max - min) * (1 - Math.pow(1 - norm, 3));
        }
    }

    initTrackBus(track) {
        if(!this.audioCtx) return;
        const ctx = this.audioCtx;

        const input = ctx.createGain();
        const hp = ctx.createBiquadFilter();
        const lp = ctx.createBiquadFilter();
        const vol = ctx.createGain();
        const pan = ctx.createStereoPanner();
        const analyser = ctx.createAnalyser();
        
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.85;

        hp.type = 'highpass';
        hp.frequency.value = this.getMappedFrequency(track.params.hpFilter, 'hp');
        
        lp.type = 'lowpass';
        lp.frequency.value = this.getMappedFrequency(track.params.filter, 'lp');
        
        vol.gain.value = track.params.volume;
        pan.pan.value = track.params.pan;

        input.connect(hp);
        hp.connect(lp);
        lp.connect(vol);
        vol.connect(pan);
        pan.connect(analyser);
        analyser.connect(ctx.destination);

        track.bus = { input, hp, lp, vol, pan, analyser };
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
                    
                    // Auto-Trim silence immediately after loading
                    audioBuffer = this.trimBuffer(audioBuffer);

                    track.customSample = {
                        name: file.name,
                        buffer: audioBuffer,
                        duration: audioBuffer.duration
                    };
                    track.buffer = audioBuffer;
                    track.rmsMap = this.analyzeBuffer(audioBuffer);
                    resolve(audioBuffer);
                } catch (err) {
                    console.error('Failed to decode audio:', err);
                    reject(err);
                }
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
        const t = time;
        const type = track.params.drumType || 'kick';
        const tune = track.params.drumTune || 0.5; 
        const decayVal = track.params.drumDecay || 0.5; 

        // --- Velocity & Ghost Note Logic Refinement ---
        let gainMult = 1.0;
        let decayMult = 1.0;
        let pitchModMult = 1.0;
        let filterOffset = 0; 

        switch(velocityLevel) {
            case 1: // Ghost - Refined for "Context-Aware Taming"
                gainMult = 0.3; // Significantly quieter
                decayMult = 0.4; // Much shorter
                pitchModMult = 0.1; // Almost flat pitch envelope (no click)
                filterOffset = -3500; // Even darker
                break;
            case 2: // Normal
                gainMult = 0.7; // Leave headroom for accent
                break;
            case 3: // Accent
                gainMult = 1.0;
                pitchModMult = 1.2; 
                filterOffset = 500; // Slightly brighter
                break;
            default:
                if (velocityLevel > 0) gainMult = 0.7;
                else return;
        }

        const out = track.bus.input;

        // Apply Timbre Mods to Bus Filters momentarily
        if(track.bus.hp) track.bus.hp.frequency.setValueAtTime(this.getMappedFrequency(Math.max(20, track.params.hpFilter), 'hp'), t);
        
        let lpFreq = this.getMappedFrequency(Math.max(100, track.params.filter), 'lp');
        // Ensure filter offset doesn't crash the value
        let targetLp = lpFreq + filterOffset;
        targetLp = Math.max(100, Math.min(22000, targetLp));
        
        if(track.bus.lp) track.bus.lp.frequency.setValueAtTime(targetLp, t);

        if (type === 'kick') {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const baseFreq = 50 + (tune * 100);
            
            const baseDecay = 0.01 + (decayVal * 0.6); 
            const finalDecay = baseDecay * decayMult;

            osc.connect(gain); gain.connect(out);
            
            const popFreq = 150 + (tune * 200);
            osc.frequency.setValueAtTime(popFreq, t);
            
            // Refined pitch envelope for click reduction
            const pitchDropTime = Math.min(0.02, finalDecay * 0.5); 
            const modAmount = pitchDropTime * pitchModMult;
            
            osc.frequency.exponentialRampToValueAtTime(baseFreq, t + Math.max(0.001, modAmount));
            osc.frequency.exponentialRampToValueAtTime(30, t + finalDecay);
            
            gain.gain.setValueAtTime(gainMult, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + finalDecay);
            
            track.addSource(osc); 
            osc.start(t); osc.stop(t + finalDecay + 0.1);
        } 
        else if (type === 'snare') {
            const osc = ctx.createOscillator();
            const oscGain = ctx.createGain();
            const toneFreq = 180 + (tune * 100);
            
            const baseToneDecay = 0.01 + (decayVal * 0.3);
            const finalToneDecay = baseToneDecay * decayMult;
            
            osc.type = 'triangle'; osc.frequency.setValueAtTime(toneFreq, t);
            osc.connect(oscGain); oscGain.connect(out);
            
            const toneLevel = (velocityLevel === 1 ? 0.2 : 0.5) * gainMult;
            oscGain.gain.setValueAtTime(toneLevel, t); 
            oscGain.gain.exponentialRampToValueAtTime(0.001, t + finalToneDecay);
            
            track.addSource(osc); 
            osc.start(t); osc.stop(t + finalToneDecay + 0.1);

            const baseNoiseDecay = 0.01 + (decayVal * 0.4);
            const finalNoiseDecay = baseNoiseDecay * decayMult;
            
            const bufferSize = ctx.sampleRate * (finalNoiseDecay + 0.1); 
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
            
            const noise = ctx.createBufferSource();
            noise.buffer = buffer;
            const noiseFilter = ctx.createBiquadFilter();
            noiseFilter.type = 'highpass'; noiseFilter.frequency.value = 1000;
            const noiseGain = ctx.createGain();
            
            noise.connect(noiseFilter); noiseFilter.connect(noiseGain); noiseGain.connect(out);
            
            const noiseLevel = 0.8 * gainMult;
            noiseGain.gain.setValueAtTime(noiseLevel, t); 
            noiseGain.gain.exponentialRampToValueAtTime(0.001, t + finalNoiseDecay);
            
            track.addSource(noise); 
            noise.start(t);
        }
        else if (type === 'closed-hat' || type === 'open-hat') {
            const isOpen = type === 'open-hat';
            const baseDecay = isOpen ? (0.05 + decayVal * 0.75) : (0.005 + decayVal * 0.15);
            const finalDecay = baseDecay * decayMult;
            
            const bufferSize = ctx.sampleRate * (finalDecay + 0.1);
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1);
            
            const src = ctx.createBufferSource(); src.buffer = buffer;
            const bpf = ctx.createBiquadFilter(); bpf.type = 'bandpass'; bpf.frequency.value = 8000 + (tune * 4000); bpf.Q.value = 1;
            const hpf = ctx.createBiquadFilter(); hpf.type = 'highpass'; hpf.frequency.value = 5000;
            const gain = ctx.createGain();
            
            src.connect(bpf); bpf.connect(hpf); hpf.connect(gain); gain.connect(out);
            gain.gain.setValueAtTime(0.6 * gainMult, t); 
            gain.gain.exponentialRampToValueAtTime(0.001, t + finalDecay);
            
            track.addSource(src); 
            src.start(t);
        }
        else if (type === 'cymbal') {
            const baseDecay = 0.1 + (decayVal * 2.9);
            const finalDecay = baseDecay * decayMult;
            
            const bufferSize = ctx.sampleRate * (finalDecay + 0.1);
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1);
            
            const src = ctx.createBufferSource(); src.buffer = buffer;
            const bpf1 = ctx.createBiquadFilter(); bpf1.type = 'bandpass'; bpf1.frequency.value = 300;
            const bpf2 = ctx.createBiquadFilter(); bpf2.type = 'bandpass'; bpf2.frequency.value = 8000;
            const mixGain = ctx.createGain();
            src.connect(mixGain);
            
            const hpf = ctx.createBiquadFilter(); hpf.type = 'highpass'; hpf.frequency.value = 4000 + (tune * 2000);
            const env = ctx.createGain();
            src.connect(hpf); hpf.connect(env); env.connect(out);
            
            env.gain.setValueAtTime(0.5 * gainMult, t); 
            env.gain.exponentialRampToValueAtTime(0.001, t + finalDecay);
            
            track.addSource(src); 
            src.start(t);
        }
    }
}