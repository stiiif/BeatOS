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

    // Initialize Track Bus (Global Params Idea)
    initTrackBus(track) {
        if(!this.audioCtx) return;
        const ctx = this.audioCtx;

        // Create Nodes
        const input = ctx.createGain();
        const hp = ctx.createBiquadFilter();
        const lp = ctx.createBiquadFilter();
        const vol = ctx.createGain();
        const pan = ctx.createStereoPanner();

        // Configure Nodes
        hp.type = 'highpass';
        hp.frequency.value = track.params.hpFilter;
        
        lp.type = 'lowpass';
        lp.frequency.value = track.params.filter;
        
        vol.gain.value = track.params.volume;
        pan.pan.value = track.params.pan;

        // Chain: Input -> HP -> LP -> Vol -> Pan -> Dest
        input.connect(hp);
        hp.connect(lp);
        lp.connect(vol);
        vol.connect(pan);
        pan.connect(ctx.destination);

        // Store refs
        track.bus = { input, hp, lp, vol, pan };
    }

    // Idea 3: Analyze Buffer for RMS (Silence Detection)
    analyzeBuffer(buffer) {
        if(!buffer) return [];
        const data = buffer.getChannelData(0);
        const chunkSize = Math.floor(data.length / 100); // 100 chunks
        const map = [];

        for(let i=0; i<100; i++) {
            let sum = 0;
            const start = i * chunkSize;
            for(let j=0; j<chunkSize; j++) {
                const s = data[start + j];
                sum += s * s;
            }
            const rms = Math.sqrt(sum / chunkSize);
            // Store simple boolean: Is this chunk audible? (Threshold 0.01)
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
                    
                    // Run Analysis (Idea 3)
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
        // ... (Generation logic same as before, omitted for brevity but preserved in implementation) ...
        // Re-implementing the generators for context:
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
        } 
        else if (type === 'snare') {
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
        } 
        else if (type === 'hihat') {
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
        } 
        else { // Textures
            const dur = 1.0 + (Math.random() * 3);
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
}