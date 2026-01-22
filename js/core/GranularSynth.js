// Granular Synthesis Engine
export class GranularSynth {
    constructor(audioEngine) {
        this.audioEngine = audioEngine;
        this.drawQueue = [];
        this.activeGrains = 0;
        this.MAX_GRAINS = 400; // Hard limit to prevent CPU overload/crackling
    }

    getActiveGrainCount() {
        return this.activeGrains;
    }

    setMaxGrains(max) {
        this.MAX_GRAINS = max;
    }

    playGrain(track, time, scheduleVisualDrawCallback) {
        // Safety Limiter: Drop grains if CPU is overloaded
        if (this.activeGrains >= this.MAX_GRAINS) {
            return;
        }

        const audioCtx = this.audioEngine.getContext();
        if (!audioCtx || !track.buffer) return;

        let mod = { position:0, spray:0, density:0, grainSize:0, pitch:0, filter:0, hpFilter:0 };
        track.lfos.forEach(lfo => {
            const v = lfo.getValue(time);
            if (lfo.target === 'filter') mod.filter += v * 5000;
            else if (lfo.target === 'hpFilter') mod.hpFilter += v * 2000;
            else if(mod[lfo.target] !== undefined) mod[lfo.target] += v;
        });

        const p = track.params;
        let gPos = Math.max(0, Math.min(1, p.position + mod.position));
        const spray = Math.max(0, p.spray + mod.spray);
        gPos += (Math.random()*2-1) * spray;
        gPos = Math.max(0, Math.min(1, gPos));

        const dur = Math.max(0.01, p.grainSize + mod.grainSize);
        const pitch = Math.max(0.1, p.pitch + mod.pitch);
        const lpCutoff = Math.max(100, Math.min(20000, p.filter + mod.filter));
        const hpCutoff = Math.max(20, Math.min(10000, p.hpFilter + mod.hpFilter));

        const src = audioCtx.createBufferSource();
        src.buffer = track.buffer;
        src.playbackRate.value = pitch;

        const env = audioCtx.createGain();
        const lpNode = audioCtx.createBiquadFilter();
        lpNode.type = 'lowpass';
        lpNode.frequency.value = lpCutoff;

        const hpNode = audioCtx.createBiquadFilter();
        hpNode.type = 'highpass';
        hpNode.frequency.value = hpCutoff;

        const vol = audioCtx.createGain();
        vol.gain.value = p.volume;

        // Add stereo panner
        const panner = audioCtx.createStereoPanner();
        panner.pan.value = p.pan || 0; // -1 (left) to 1 (right)

        src.connect(hpNode);
        hpNode.connect(lpNode);
        lpNode.connect(env);
        env.connect(vol);
        vol.connect(panner);
        panner.connect(audioCtx.destination);

        const bufDur = track.buffer.duration;
        let offset = gPos * bufDur;
        if (offset + dur > bufDur) offset = 0;

        env.gain.setValueAtTime(0, time);
        env.gain.linearRampToValueAtTime(1, time + (dur*0.1));
        env.gain.linearRampToValueAtTime(0, time + dur);

        // Increment active grain count
        this.activeGrains++;

        src.start(time, offset, dur);
        src.onended = () => { 
            // Decrement active grain count
            this.activeGrains--;

            src.disconnect(); env.disconnect(); 
            lpNode.disconnect(); hpNode.disconnect(); 
            vol.disconnect(); panner.disconnect();
        };
        
        scheduleVisualDrawCallback(time, track.id);
    }

    scheduleNote(track, time, scheduleVisualDrawCallback) {
        const density = Math.max(1, track.params.density);
        const dur = track.params.release;
        
        // FIX: Use Math.ceil instead of Math.floor.
        // This ensures that if (Duration * Density) < 1, we still get at least 1 grain.
        // Example: 0.5s Release * 1Hz Density = 0.5 -> Ceil = 1 Grain.
        const grains = Math.ceil(dur * density);
        const interval = 1/density;

        for(let i=0; i<grains; i++) {
            const jitter = Math.random() * 0.005;
            this.playGrain(track, time + (i*interval) + jitter, scheduleVisualDrawCallback);
        }
    }
}