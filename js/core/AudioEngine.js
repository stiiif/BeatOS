// Audio Engine Module
export class AudioEngine {
    constructor() {
        this.audioCtx = null;
        this.onBpmChange = null; // Callback placeholder
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

    // Load custom audio sample from file
    async loadCustomSample(file, track) {
        if (!this.audioCtx) return null;
        
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const arrayBuffer = e.target.result;
                    const audioBuffer = await this.audioCtx.decodeAudioData(arrayBuffer);
                    
                    // Store custom sample info
                    track.customSample = {
                        name: file.name,
                        buffer: audioBuffer,
                        duration: audioBuffer.duration
                    };
                    track.buffer = audioBuffer;
                    
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

    // New method to generate buffer by explicit type with randomization
    generateBufferByType(type) {
        if(!this.audioCtx) return null;
        const makeBuffer = (lenSec) => this.audioCtx.createBuffer(1, this.audioCtx.sampleRate * lenSec, this.audioCtx.sampleRate);
        
        let buf;

        if (type === 'kick') {
            buf = makeBuffer(0.5);
            const d = buf.getChannelData(0);
            
            // Randomize Kick parameters
            const startFreq = 130 + Math.random() * 40; // 130-170 Hz
            const decay = 12 + Math.random() * 6; // 12-18
            const toneDecay = 4 + Math.random() * 2; // 4-6
            
            for(let i=0; i<d.length; i++) {
                const t = i / this.audioCtx.sampleRate;
                const freq = startFreq * Math.exp(-decay * t);
                d[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-toneDecay * t);
            }
        } 
        else if (type === 'snare') {
            buf = makeBuffer(0.4);
            const d = buf.getChannelData(0);
            
            // Randomize Snare parameters
            const toneFreq = 160 + Math.random() * 60; // 160-220 Hz
            const noiseDecay = 6 + Math.random() * 4;
            const toneDecay = 10 + Math.random() * 5;
            const noiseMix = 0.6 + Math.random() * 0.3; // Mostly noise
            
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
            
            // Randomize Hat parameters
            const decay = 35 + Math.random() * 20; // Fast decay
            const hpfMix = 0.5 + Math.random() * 0.4;
            
            for(let i=0; i<d.length; i++) {
                const t = i / this.audioCtx.sampleRate;
                let noise = (Math.random() * 2 - 1);
                if (i>0) noise -= d[i-1] * hpfMix; // Simple HPF
                d[i] = noise * Math.exp(-decay * t);
            }
        } 
        else { // Textures / FM
            const dur = 1.0 + (Math.random() * 3);
            buf = makeBuffer(dur);
            const d = buf.getChannelData(0);
            
            const modFreq = 10 + Math.random() * 400;
            const carFreq = 40 + Math.random() * 800;
            const modIdx = Math.random() * 8;
            
            // Randomly select synthesis flavor
            const isSquare = Math.random() > 0.6;
            const isNoisy = Math.random() > 0.7;
            
            for(let i=0; i<d.length; i++) {
                const t = i / this.audioCtx.sampleRate;
                const modulator = Math.sin(2 * Math.PI * modFreq * t) * modIdx;
                let val = Math.sin(2 * Math.PI * carFreq * t + modulator);
                
                if (isSquare) val = Math.sign(val) * 0.5; 
                if (isNoisy) val += (Math.random()*0.2-0.1); 
                
                d[i] = val * 0.5;
            }
        }
        return buf;
    }

    // Maintain compatibility with initialization logic
    generateBufferForTrack(trkIdx) {
        if (trkIdx === 0) return this.generateBufferByType('kick');
        if (trkIdx === 1) return this.generateBufferByType('snare');
        if (trkIdx === 2) return this.generateBufferByType('hihat');
        return this.generateBufferByType('texture');
    }
}