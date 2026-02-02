// BeatOS "Super Processor"
// Integrates Sequencer, Granular Engine, and 909 Synthesis in a single AudioWorklet.
// Powered by SharedArrayBuffer for Zero-Latency State Synchronization.

const LAYOUT = {
    IDX_STATE: 0, IDX_CURRENT_STEP: 1, IDX_BPM: 2, IDX_SAMPLE_RATE: 3, IDX_TOTAL_SAMPLES: 4, IDX_ACTIVE_VOICES: 5,
    STEPS_PER_TRACK: 64, MAX_TRACKS: 32, PARAMS_PER_TRACK: 24,
    P_VOL: 0, P_PAN: 1, P_PITCH: 2, P_DECAY: 3, P_POSITION: 4, 
    P_DENSITY: 5, P_SPRAY: 6, P_FILTER: 7, P_DRIVE: 9, P_TYPE: 10,
    P_SEND_A: 11, P_SEND_B: 12
};

class BeatOSProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        
        this.controlView = null;
        this.trackView = null;
        this.paramView = null;
        this.meterView = null;
        
        // --- Internal State ---
        this.sampleCounter = 0;
        this.lastStep = -1;
        this.buffers = new Map(); 
        
        // Local State Fallback (If Shared Memory fails)
        this.localState = { isPlaying: false, bpm: 120 };

        this.windowLUT = new Float32Array(4096);
        for(let i=0; i<4096; i++) {
            this.windowLUT[i] = 0.5 * (1.0 - Math.cos(2.0 * Math.PI * (i / 4095)));
        }
        
        this.noiseBuffer = new Float32Array(48000);
        for(let i=0; i<48000; i++) this.noiseBuffer[i] = Math.random() * 2 - 1;
        
        this.MAX_VOICES = 64;
        this.voices = [];
        for(let i=0; i<this.MAX_VOICES; i++) {
            this.voices.push({
                active: false, trackId: -1, type: 0, age: 0,
                vol: 0, pan: 0, drive: 0, sendA: 0, sendB: 0,
                buffer: null, position: 0, speed: 1, grainLen: 0,
                startFreq: 0, endFreq: 0, decay: 0, tone: 0
            });
        }
        
        this.port.onmessage = (e) => this.handleMessage(e.data);
    }
    
    handleMessage(msg) {
        if (msg.type === 'initMemory') {
            this.controlView = new Int32Array(msg.buffers.control);
            this.trackView = new Uint8Array(msg.buffers.tracks);
            this.paramView = new Float32Array(msg.buffers.params);
            this.meterView = new Float32Array(msg.buffers.meters);
        }
        else if (msg.type === 'setBuffer') {
            this.buffers.set(msg.trackId, msg.buffer);
        }
        // --- Fallback Handlers ---
        else if (msg.type === 'play') {
            this.localState.isPlaying = true;
            // Also update local view if it's a copy
            if (this.controlView) this.controlView[LAYOUT.IDX_STATE] = 1;
        }
        else if (msg.type === 'stop') {
            this.localState.isPlaying = false;
            if (this.controlView) this.controlView[LAYOUT.IDX_STATE] = 0;
        }
        else if (msg.type === 'setBPM') {
            this.localState.bpm = msg.value;
            if (this.controlView) this.controlView[LAYOUT.IDX_BPM] = msg.value;
        }
    }
    
    process(inputs, outputs, parameters) {
        if (!this.controlView) return true;
        
        const outputChannels = outputs; 
        const frameCount = outputChannels[0][0].length;
        
        // 2. Read Global State (Priority: Shared Memory -> Local Fallback)
        let isPlaying = this.controlView[LAYOUT.IDX_STATE] === 1;
        // If SharedMemory isn't working (value is 0 but we received 'play' msg), use local
        if (this.localState.isPlaying) isPlaying = true;

        let bpm = this.controlView[LAYOUT.IDX_BPM] || 120;
        if (this.localState.bpm !== 120) bpm = this.localState.bpm; // Use msg value if set

        const sr = sampleRate; 
        
        // 3. Sequencer Clock Logic
        if (isPlaying) {
            const samplesPerStep = (sr * 60) / (bpm * 4);
            
            this.sampleCounter += frameCount; 
            
            if (this.sampleCounter >= samplesPerStep) {
                this.sampleCounter -= samplesPerStep;
                
                let currentStep = this.controlView[LAYOUT.IDX_CURRENT_STEP];
                currentStep = (currentStep + 1) % 64;
                
                // Atomic Store (Instant UI update - might fail if SAB missing but safe to try)
                try {
                    Atomics.store(this.controlView, LAYOUT.IDX_CURRENT_STEP, currentStep);
                } catch(e) {
                    this.controlView[LAYOUT.IDX_CURRENT_STEP] = currentStep;
                }
                
                this.controlView[LAYOUT.IDX_TOTAL_SAMPLES] += samplesPerStep;
                
                this.triggerStep(currentStep);
            }
        } else {
            this.sampleCounter = 0;
        }
        
        // 4. Clear Outputs
        for (let i = 0; i < outputChannels.length; i++) {
            if (outputChannels[i][0]) outputChannels[i][0].fill(0);
            if (outputChannels[i][1]) outputChannels[i][1].fill(0);
        }
        
        // 5. Render Active Voices
        let activeCount = 0;
        
        for (let v = 0; v < this.voices.length; v++) {
            const voice = this.voices[v];
            if (!voice.active) continue;
            
            activeCount++;
            
            const trackOut = outputChannels[voice.trackId];
            if (!trackOut) continue;
            
            const sendAOut = outputChannels[32];
            const sendBOut = outputChannels[33];
            
            const left = trackOut[0];
            const right = trackOut[1];
            
            const panRad = (voice.pan + 1) * (Math.PI / 4);
            const gainL = Math.cos(panRad) * voice.vol;
            const gainR = Math.sin(panRad) * voice.vol;
            
            for (let i = 0; i < frameCount; i++) {
                let sample = 0;
                
                switch (voice.type) {
                    case 0: sample = this.renderGranular(voice); break;
                    case 1: sample = this.renderKick(voice); break;
                    case 2: sample = this.renderSnare(voice); break;
                    case 3: sample = this.renderHat(voice); break;
                    case 4: sample = this.renderSample(voice); break;
                }
                
                if (voice.drive > 0) {
                    const driven = sample * (1 + voice.drive * 4);
                    sample = Math.tanh(driven);
                }
                
                const stereoL = sample * gainL;
                const stereoR = sample * gainR;
                
                left[i] += stereoL;
                right[i] += stereoR;
                
                if (sendAOut && voice.sendA > 0) {
                    sendAOut[0][i] += stereoL * voice.sendA;
                    sendAOut[1][i] += stereoR * voice.sendA;
                }
                if (sendBOut && voice.sendB > 0) {
                    sendBOut[0][i] += stereoL * voice.sendB;
                    sendBOut[1][i] += stereoR * voice.sendB;
                }
                
                voice.age++;
            }
        }
        
        // Write Active Voice Count
        try {
            Atomics.store(this.controlView, LAYOUT.IDX_ACTIVE_VOICES, activeCount);
        } catch(e) {
            this.controlView[LAYOUT.IDX_ACTIVE_VOICES] = activeCount;
        }
        
        // 6. Metering (Write RMS to Shared Memory)
        this.updateMeters(outputChannels, frameCount);
        
        return true;
    }
    
    triggerStep(step) {
        for (let t = 0; t < LAYOUT.MAX_TRACKS; t++) {
            const velIndex = t * LAYOUT.STEPS_PER_TRACK + step;
            const velocity = this.trackView[velIndex];
            
            if (velocity > 0) {
                const pOffset = t * LAYOUT.PARAMS_PER_TRACK;
                
                let voice = this.voices.find(v => !v.active);
                if (!voice) {
                    voice = this.voices[0]; 
                }
                
                this.initVoice(voice, t, velocity, pOffset);
            }
        }
    }
    
    initVoice(voice, trackId, velocity, pOffset) {
        const type = this.paramView[pOffset + LAYOUT.P_TYPE];
        
        voice.active = true;
        voice.trackId = trackId;
        voice.type = type;
        voice.age = 0;
        
        const velGain = velocity === 1 ? 0.4 : (velocity === 2 ? 0.75 : 1.0);
        voice.vol = this.paramView[pOffset + LAYOUT.P_VOL] * velGain;
        voice.pan = this.paramView[pOffset + LAYOUT.P_PAN];
        voice.drive = this.paramView[pOffset + LAYOUT.P_DRIVE];
        voice.sendA = this.paramView[pOffset + LAYOUT.P_SEND_A];
        voice.sendB = this.paramView[pOffset + LAYOUT.P_SEND_B];
        
        const tune = this.paramView[pOffset + LAYOUT.P_POSITION] || 0.5;
        const decay = this.paramView[pOffset + LAYOUT.P_DECAY] || 0.5;
        
        if (type === 1) { // KICK
            voice.startFreq = 150 + (tune * 100);
            voice.endFreq = 50;
            voice.decay = (0.1 + decay * 0.5) * sampleRate;
        } 
        else if (type === 2) { // SNARE
            voice.startFreq = 180 + (tune * 100);
            voice.decay = (0.05 + decay * 0.3) * sampleRate;
            voice.tone = this.paramView[pOffset + LAYOUT.P_DENSITY] || 0.5; 
        } 
        else if (type === 3) { // HAT
            voice.startFreq = 8000 + (tune * 2000); 
            voice.decay = (0.01 + decay * 0.3) * sampleRate;
        } 
        else { // GRANULAR (0) or SAMPLE (4)
            const buffer = this.buffers.get(trackId);
            if (!buffer) { voice.active = false; return; }
            voice.buffer = buffer;
            voice.position = Math.floor(tune * buffer.length); 
            voice.speed = this.paramView[pOffset + LAYOUT.P_PITCH] || 1.0;
            voice.grainLen = Math.max(128, (decay * 0.5) * sampleRate); 
        }
    }
    
    renderKick(v) {
        if (v.age > v.decay) { v.active = false; return 0; }
        const t = v.age / sampleRate;
        const progress = v.age / v.decay;
        const amp = 1.0 - progress;
        const freq = v.endFreq + (v.startFreq - v.endFreq) * Math.exp(-v.age * 0.005);
        const phase = t * freq * 2 * Math.PI;
        return Math.sin(phase) * (amp * amp); 
    }
    
    renderSnare(v) {
        if (v.age > v.decay) { v.active = false; return 0; }
        const t = v.age / sampleRate;
        const progress = v.age / v.decay;
        const amp = 1.0 - progress;
        const toneFreq = v.startFreq * (1.0 - (v.age * 0.0005));
        const toneVal = Math.sin(t * toneFreq * 2 * Math.PI);
        const noiseVal = this.noiseBuffer[v.age % this.noiseBuffer.length];
        const mix = 0.5; 
        return (toneVal * (1-mix) + noiseVal * mix) * amp;
    }
    
    renderHat(v) {
        if (v.age > v.decay) { v.active = false; return 0; }
        const amp = Math.exp(-v.age * 0.005); 
        if (amp < 0.001) { v.active = false; return 0; }
        let sample = this.noiseBuffer[(v.age * 2) % this.noiseBuffer.length];
        const hp = sample - (v.lastSample || 0);
        v.lastSample = sample;
        return hp * amp;
    }
    
    renderGranular(v) {
        if (v.age >= v.grainLen) { v.active = false; return 0; }
        const winIdx = Math.floor((v.age / v.grainLen) * 4095);
        const env = this.windowLUT[winIdx] || 0;
        const readPos = v.position + (v.age * v.speed);
        const idx = Math.floor(readPos);
        const frac = readPos - idx;
        if (idx < 0 || idx >= v.buffer.length - 1) return 0;
        const s1 = v.buffer[idx];
        const s2 = v.buffer[idx+1];
        return (s1 + (s2 - s1) * frac) * env;
    }
    
    renderSample(v) {
        const readPos = v.age * v.speed;
        const idx = Math.floor(readPos);
        if (idx >= v.buffer.length) { v.active = false; return 0; }
        return v.buffer[idx];
    }
    
    updateMeters(outputs, frameCount) {
        const factor = 0.9;
        for (let t = 0; t < LAYOUT.MAX_TRACKS; t++) {
            this.calcRMS(outputs[t], t * 2, frameCount, factor);
        }
        this.calcRMS(outputs[32], LAYOUT.METER_OFFSET_SEND_A || 64, frameCount, factor);
        this.calcRMS(outputs[33], LAYOUT.METER_OFFSET_SEND_B || 66, frameCount, factor);
    }
    
    calcRMS(output, memIdx, len, smoothing) {
        if (!output || !output[0]) return;
        let sumL = 0, sumR = 0;
        for (let i = 0; i < len; i += 4) {
            sumL += output[0][i] * output[0][i];
            sumR += output[1][i] * output[1][i];
        }
        const rmsL = Math.sqrt(sumL / (len / 4));
        const rmsR = Math.sqrt(sumR / (len / 4));
        const oldL = this.meterView[memIdx];
        const oldR = this.meterView[memIdx+1];
        this.meterView[memIdx] = rmsL > oldL ? rmsL : oldL * smoothing;
        this.meterView[memIdx+1] = rmsR > oldR ? rmsR : oldR * smoothing;
    }
}

registerProcessor('beatos-granular-processor', BeatOSProcessor);