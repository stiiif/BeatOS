// Audio Engine Module
export class AudioEngine {
    constructor() {
        this.audioCtx = null;
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

    generateBufferForTrack(trkIdx) {
        if(!this.audioCtx) return null;
        const makeBuffer = (lenSec) => this.audioCtx.createBuffer(1, this.audioCtx.sampleRate * lenSec, this.audioCtx.sampleRate);
        
        let buf;

        if (trkIdx === 0) { // Kick
            buf = makeBuffer(0.5);
            const d = buf.getChannelData(0);
            for(let i=0; i<d.length; i++) {
                const t = i / this.audioCtx.sampleRate;
                const freq = 150 * Math.exp(-15 * t);
                d[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-5 * t);
            }
        } 
        else if (trkIdx === 1) { // Snare
            buf = makeBuffer(0.4);
            const d = buf.getChannelData(0);
            for(let i=0; i<d.length; i++) {
                const t = i / this.audioCtx.sampleRate;
                const noise = (Math.random() * 2 - 1) * Math.exp(-8 * t);
                const tone = Math.sin(2 * Math.PI * 180 * t) * Math.exp(-12 * t);
                d[i] = (noise * 0.7 + tone * 0.5);
            }
        } 
        else if (trkIdx === 2) { // Hat
            buf = makeBuffer(0.15);
            const d = buf.getChannelData(0);
            for(let i=0; i<d.length; i++) {
                const t = i / this.audioCtx.sampleRate;
                let noise = (Math.random() * 2 - 1);
                if (i>0) noise -= d[i-1]*0.6; // HPF
                d[i] = noise * Math.exp(-40 * t);
            }
        } 
        else { // Textures
            const dur = 1.0 + (Math.random() * 3);
            buf = makeBuffer(dur);
            const d = buf.getChannelData(0);
            const modFreq = 10 + Math.random() * 400;
            const carFreq = 40 + Math.random() * 800;
            const modIdx = Math.random() * 8;
            
            for(let i=0; i<d.length; i++) {
                const t = i / this.audioCtx.sampleRate;
                const modulator = Math.sin(2 * Math.PI * modFreq * t) * modIdx;
                let val = Math.sin(2 * Math.PI * carFreq * t + modulator);
                if (trkIdx % 3 === 0) val = Math.sign(val) * 0.5; 
                if (trkIdx % 4 === 0) val += (Math.random()*0.2-0.1); 
                d[i] = val * 0.5;
            }
        }
        return buf;
    }
}
