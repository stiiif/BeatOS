// Audio Engine Module
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

    // Helper to map linear slider values to logarithmic/exponential curves
    getMappedFrequency(value, type) {
        let min, max;
        // Ranges match the sliders in index.html
        if (type === 'hp') { min = 20; max = 5000; }
        else { min = 100; max = 10000; }

        // Normalize linear input to 0..1
        let norm = (value - min) / (max - min);
        norm = Math.max(0, Math.min(1, norm));

        if (type === 'lp') {
            // Low Pass: Precision in lower range (Standard Audio Taper)
            return min + (max - min) * Math.pow(norm, 3);
        } else {
            // High Pass: Precision in higher range
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
        const analyser = ctx.createAnalyser(); // NEW: Analyzer node for spectrum
        
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
        pan.connect(analyser); // Connect to analyser
        analyser.connect(ctx.destination); // Analyser to output

        track.bus = { input, hp, lp, vol, pan, analyser }; // Store analyser in bus
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
                    const audioBuffer = await this.audioCtx.decodeAudioData(arrayBuffer);
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

    // --- Granular Buffer Generators ---
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
            // Texture / FM - Limited to max 1.0s
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

    // --- 909-style Synth Drum Generator ---
    triggerDrum(track, time) {
        if (!this.audioCtx || !track.bus) return;
        const ctx = this.audioCtx;
        const t = time;
        const type = track.params.drumType || 'kick';
        const tune = track.params.drumTune || 0.5; // 0 to 1
        const decayVal = track.params.drumDecay || 0.5; // 0 to 1

        const out = track.bus.input;

        if(track.bus.hp) track.bus.hp.frequency.setValueAtTime(this.getMappedFrequency(track.params.hpFilter, 'hp'), t);
        if(track.bus.lp) track.bus.lp.frequency.setValueAtTime(this.getMappedFrequency(track.params.filter, 'lp'), t);

        if (type === 'kick') {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const baseFreq = 50 + (tune * 100);
            const decay = 0.1 + (decayVal * 0.5);
            osc.connect(gain); gain.connect(out);
            osc.frequency.setValueAtTime(150 + (tune * 200), t);
            osc.frequency.exponentialRampToValueAtTime(baseFreq, t + 0.02);
            osc.frequency.exponentialRampToValueAtTime(30, t + decay);
            gain.gain.setValueAtTime(1, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + decay);
            osc.start(t); osc.stop(t + decay + 0.1);
        } 
        else if (type === 'snare') {
            const osc = ctx.createOscillator();
            const oscGain = ctx.createGain();
            const toneFreq = 180 + (tune * 100);
            const toneDecay = 0.1 + (decayVal * 0.2);
            osc.type = 'triangle'; osc.frequency.setValueAtTime(toneFreq, t);
            osc.connect(oscGain); oscGain.connect(out);
            oscGain.gain.setValueAtTime(0.5, t); oscGain.gain.exponentialRampToValueAtTime(0.01, t + toneDecay);
            osc.start(t); osc.stop(t + toneDecay + 0.1);

            const bufferSize = ctx.sampleRate * (0.2 + decayVal * 0.2);
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
            const noise = ctx.createBufferSource();
            noise.buffer = buffer;
            const noiseFilter = ctx.createBiquadFilter();
            noiseFilter.type = 'highpass'; noiseFilter.frequency.value = 1000;
            const noiseGain = ctx.createGain();
            noise.connect(noiseFilter); noiseFilter.connect(noiseGain); noiseGain.connect(out);
            noiseGain.gain.setValueAtTime(0.8, t); noiseGain.gain.exponentialRampToValueAtTime(0.01, t + (0.1 + decayVal * 0.2));
            noise.start(t);
        }
        else if (type === 'closed-hat' || type === 'open-hat') {
            const isOpen = type === 'open-hat';
            const baseDecay = isOpen ? (0.3 + decayVal * 0.5) : (0.05 + decayVal * 0.05);
            const bufferSize = ctx.sampleRate * baseDecay;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1);
            const src = ctx.createBufferSource(); src.buffer = buffer;
            const bpf = ctx.createBiquadFilter(); bpf.type = 'bandpass'; bpf.frequency.value = 8000 + (tune * 4000); bpf.Q.value = 1;
            const hpf = ctx.createBiquadFilter(); hpf.type = 'highpass'; hpf.frequency.value = 5000;
            const gain = ctx.createGain();
            src.connect(bpf); bpf.connect(hpf); hpf.connect(gain); gain.connect(out);
            gain.gain.setValueAtTime(0.6, t); gain.gain.exponentialRampToValueAtTime(0.01, t + baseDecay);
            src.start(t);
        }
        else if (type === 'cymbal') {
            const decay = 1.0 + (decayVal * 2.0);
            const bufferSize = ctx.sampleRate * decay;
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
            env.gain.setValueAtTime(0.5, t); env.gain.exponentialRampToValueAtTime(0.01, t + decay);
            src.start(t);
        }
    }
}