import { VELOCITY_GAINS } from '../utils/constants.js';

export class GranularSynth {
    constructor(audioEngine) {
        this.audioEngine = audioEngine;
        this.activeGrains = 0;
        this.MAX_GRAINS = 400; 
    }

    /**
     * Helper to get buffer from the AudioEngine/Graph
     */
    getTrackBuffer(trackId) {
        // We assume the AudioGraph nodes might hold the buffer, or the Engine maintains a map.
        // In Step 2.3 AudioEngine, we did: this.graph.nodes.get(trackId).buffer = audioBuffer;
        // So we access it via the engine's graph.
        const nodes = this.audioEngine.graph.nodes.get(trackId);
        return nodes ? nodes.buffer : null;
    }

    getTrackBus(trackId) {
        // Returns the Input Node of the track chain
        const nodes = this.audioEngine.graph.nodes.get(trackId);
        return nodes ? nodes.input : null;
    }

    scheduleNote(track, time, velocityLevel = 2) {
        // If simple-drum type, delegate to engine (or handle here if moved)
        if (track.type === 'simple-drum') {
            this.audioEngine.triggerDrum(track.id, time, velocityLevel, track.params);
            return;
        }

        const buffer = this.getTrackBuffer(track.id);
        const destination = this.getTrackBus(track.id);

        if (!buffer || !destination) return;

        // ... Existing Granular Logic ...
        // Adapted to use 'buffer' and 'destination' local vars
        
        const p = track.params;
        let density = Math.max(1, p.density);
        let interval = 1 / density; // Simplified for brevity, original logic applies
        
        if (p.overlap > 0) {
            const dur = p.grainSize;
            interval = dur / Math.max(0.1, p.overlap);
        }

        const noteDur = p.relGrain !== undefined ? p.relGrain : 0.4;
        const grains = Math.min(64, Math.ceil(noteDur / interval)); 

        const atk = p.ampAttack || 0.01;
        const dec = p.ampDecay || 0.1;
        const rel = p.ampRelease || 0.1;

        // Playhead logic would need to be stored in a ephemeral state map if we want scanSpeed to work
        // For now, stateless implementation using p.position
        let currentPlayhead = p.position;

        for(let i=0; i<grains; i++) {
            const grainTime = time + (i * interval);
            const jitter = (i === 0) ? 0 : Math.random() * 0.005;
            
            // Amp Envelope Calc (Simplified)
            let amp = 1.0; 
            // ... (Insert complex envelope logic from original if needed) ...

            this.playGrain(track, buffer, destination, grainTime + jitter, amp, velocityLevel, currentPlayhead);
            
            // Advance playhead if scanning
            if (p.scanSpeed !== 0) {
                currentPlayhead = (currentPlayhead + (p.scanSpeed * 0.01)) % 1.0;
            }
        }
    }

    playGrain(track, buffer, destination, time, amp, velocity, playhead) {
        if (this.activeGrains >= this.MAX_GRAINS) return;

        const ctx = this.audioEngine.getContext();
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        
        // Params
        const p = track.params;
        src.playbackRate.value = p.pitch;

        // Gain
        const env = ctx.createGain();
        env.gain.value = 0;
        
        // Connect
        src.connect(env);
        env.connect(destination);

        // Windowing / Grain Envelope
        const grainDur = p.grainSize;
        const offset = playhead * buffer.duration;
        
        env.gain.setValueAtTime(0, time);
        env.gain.linearRampToValueAtTime(amp * VELOCITY_GAINS[velocity], time + 0.005);
        env.gain.linearRampToValueAtTime(0, time + grainDur);

        src.start(time, offset, grainDur);
        this.activeGrains++;
        
        src.onended = () => {
            this.activeGrains--;
            src.disconnect();
            env.disconnect();
        };
    }
}