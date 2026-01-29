import { VELOCITY_GAINS } from '../utils/constants.js';

export class AudioEngine {
    constructor() {
        this.audioCtx = null;
        this.workletReady = false;
    }

    async initialize() {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.audioCtx.state === 'suspended') {
            await this.audioCtx.resume();
        }
        if (!this.workletReady) {
            try {
                await this.audioCtx.audioWorklet.addModule('js/worklets/granular-processor.js');
                this.workletReady = true;
                console.log('[AudioEngine] BeatOS Audio Thread Initialized');
            } catch (e) {
                console.error('[AudioEngine] Worklet load failed:', e);
            }
        }
        return this.audioCtx;
    }

    getContext() { return this.audioCtx; }

    /**
     * Required by TrackManager.js:54 during initialization
     */
    generateBufferForTrack(trkIdx) {
        const type = trkIdx === 0 ? 'kick' : trkIdx === 1 ? 'snare' : trkIdx === 2 ? 'hihat' : 'texture';
        return this.generateBufferByType(type);
    }

    generateBufferByType(type) {
        if(!this.audioCtx) return null;
        const makeBuffer = (lenSec) => this.audioCtx.createBuffer(1, this.audioCtx.sampleRate * lenSec, this.audioCtx.sampleRate);
        let buf = makeBuffer(0.5);
        const d = buf.getChannelData(0);
        if (type === 'kick') {
            const startFreq = 150;
            const decay = 12;
            for(let i=0; i<d.length; i++) {
                const t = i / this.audioCtx.sampleRate;
                d[i] = Math.sin(2 * Math.PI * startFreq * Math.exp(-decay * t) * t) * Math.exp(-4 * t);
            }
        } else {
            for(let i=0; i<d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-20 * (i/this.audioCtx.sampleRate));
        }
        return buf;
    }

    getMappedFrequency(value, type) {
        let min = type === 'hp' ? 20 : 100;
        let max = type === 'hp' ? 5000 : 10000;
        let norm = Math.max(0, Math.min(1, (value - min) / (max - min)));
        return type === 'lp' ? min + (max - min) * Math.pow(norm, 3) : min + (max - min) * (1 - Math.pow(1 - norm, 3));
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
        analyser.fftSize = 1024;
        hp.type = 'highpass'; lp.type = 'lowpass';
        hp.frequency.value = this.getMappedFrequency(track.params.hpFilter, 'hp');
        lp.frequency.value = this.getMappedFrequency(track.params.filter, 'lp');
        vol.gain.value = track.params.volume;
        pan.pan.value = track.params.pan;
        input.connect(hp); hp.connect(lp); lp.connect(vol); vol.connect(pan); pan.connect(analyser); analyser.connect(ctx.destination);
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
            map.push(Math.sqrt(sum / chunkSize));
        }
        return map;
    }

    async loadCustomSample(file, track) {
        const audioBuffer = await this.audioCtx.decodeAudioData(await file.arrayBuffer());
        track.buffer = audioBuffer;
        track.rmsMap = this.analyzeBuffer(audioBuffer);
        return audioBuffer;
    }
}