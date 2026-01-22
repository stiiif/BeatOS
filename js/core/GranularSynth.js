// Granular Synthesis Engine - Restructured (Ideas 1-5 Implemented)
export class GranularSynth {
    constructor(audioEngine) {
        this.audioEngine = audioEngine;
        this.activeGrains = 0;
        this.MAX_GRAINS = 400; 
    }

    getActiveGrainCount() {
        return this.activeGrains;
    }

    setMaxGrains(max) {
        this.MAX_GRAINS = max;
    }

    // Idea 3: Helper to find non-silent buffer position
    findActivePosition(track, requestedPos) {
        if (!track.rmsMap || track.rmsMap.length === 0) return requestedPos;
        
        const mapIdx = Math.floor(requestedPos * 99); // 0-99
        if (track.rmsMap[mapIdx]) return requestedPos; // Current spot is valid

        // Search Spiral: Look left and right for nearest active chunk
        for (let i = 1; i < 50; i++) {
            if (track.rmsMap[mapIdx + i]) return (mapIdx + i) / 99;
            if (track.rmsMap[mapIdx - i]) return (mapIdx - i) / 99;
        }
        return requestedPos; // Fallback
    }

    playGrain(track, time, scheduleVisualDrawCallback, ampEnvelope = 1.0) {
        if (this.activeGrains >= this.MAX_GRAINS) return;

        const audioCtx = this.audioEngine.getContext();
        if (!audioCtx || !track.buffer || !track.bus) return; // Ensure Bus exists

        // LFO Modulation
        let mod = { position:0, spray:0, density:0, grainSize:0, pitch:0, filter:0, hpFilter:0 };
        track.lfos.forEach(lfo => {
            const v = lfo.getValue(time);
            if (lfo.target === 'filter') mod.filter += v * 5000;
            else if (lfo.target === 'hpFilter') mod.hpFilter += v * 2000;
            else if(mod[lfo.target] !== undefined) mod[lfo.target] += v;
        });

        const p = track.params;

        // Idea 2: Buffer Scan / Travel
        // We use track.playhead (updated in scheduleNote) as the base, not just p.position
        // If scanSpeed is 0, playhead stays at p.position.
        let basePos = (p.scanSpeed > 0.01 || p.scanSpeed < -0.01) ? track.playhead : p.position;
        
        // Calculate Position & Spray
        let gPos = Math.max(0, Math.min(1, basePos + mod.position));
        const spray = Math.max(0, p.spray + mod.spray);
        gPos += (Math.random()*2-1) * spray;
        gPos = Math.max(0, Math.min(1, gPos));

        // Idea 3: RMS Silence Skipping
        // Only skip if we are randomly spraying (don't override manual position too aggressively)
        if (spray > 0.01) {
            gPos = this.findActivePosition(track, gPos);
        }

        const dur = Math.max(0.01, p.grainSize + mod.grainSize);
        const pitch = Math.max(0.1, p.pitch + mod.pitch);

        // Update Track Bus (Global Params) - Idea 4 & User Request
        // We update the bus parameters at the scheduled time to ensure automation works
        if(track.bus.hp) track.bus.hp.frequency.setValueAtTime(Math.max(20, p.hpFilter + mod.hpFilter), time);
        if(track.bus.lp) track.bus.lp.frequency.setValueAtTime(Math.max(100, p.filter + mod.filter), time);
        if(track.bus.vol) track.bus.vol.gain.setValueAtTime(p.volume, time);
        if(track.bus.pan) track.bus.pan.pan.setValueAtTime(p.pan, time);

        // Voice Pooling / Simplified Graph
        // Instead of creating Filter -> Panner -> etc per grain, we just create:
        // Source -> Gain(Window) -> TrackBus
        const src = audioCtx.createBufferSource();
        src.buffer = track.buffer;
        src.playbackRate.value = pitch;

        const grainWindow = audioCtx.createGain();
        
        // Apply Note-Level Amp Envelope to the grain's volume
        // This shapes the grain cloud intensity
        grainWindow.gain.value = ampEnvelope;

        src.connect(grainWindow);
        grainWindow.connect(track.bus.input); // Connect to persistent track bus

        const bufDur = track.buffer.duration;
        let offset = gPos * bufDur;
        if (offset + dur > bufDur) offset = 0;

        // Grain Windowing (Anti-click) - Fixed, fast micro-envelope
        // The MACRO shape is handled by ampEnvelope passed in
        grainWindow.gain.setValueAtTime(0, time);
        grainWindow.gain.linearRampToValueAtTime(ampEnvelope, time + (dur * 0.1)); // 10% fade in
        grainWindow.gain.linearRampToValueAtTime(0, time + dur);

        this.activeGrains++;
        src.start(time, offset, dur);
        src.onended = () => { 
            this.activeGrains--;
            src.disconnect();
            grainWindow.disconnect();
        };
        
        scheduleVisualDrawCallback(time, track.id);
    }

    scheduleNote(track, time, scheduleVisualDrawCallback) {
        const p = track.params;
        
        // Idea 1: Overlap Mode
        let density = Math.max(1, p.density);
        let interval;
        const dur = p.grainSize; // Grain duration

        if (p.overlap > 0) {
            // Calculate Interval based on overlap target
            // Interval = Duration / Overlap
            // e.g. 0.5s / 2 = 0.25s interval (2 grains overlap)
            interval = dur / Math.max(0.1, p.overlap);
            // Back-calculate density for the loop count logic
            density = 1 / interval; 
        } else {
            interval = 1 / density;
        }

        const noteDur = p.relGrain !== undefined ? p.relGrain : 0.4;
        
        // Safety Cap
        const rawGrains = Math.ceil(noteDur / interval);
        const grains = Math.min(64, rawGrains); // 64 grains per step max

        // Envelope Params
        const atk = p.ampAttack || 0.01;
        const dec = p.ampDecay || 0.1;
        const rel = p.ampRelease || 0.1;
        const sustainLevel = 0.6;

        // Idea 2: Update Playhead (Scan)
        // Move playhead forward for next step
        if (p.scanSpeed !== 0) {
            track.playhead = (track.playhead + (p.scanSpeed * 0.1)) % 1.0;
            if (track.playhead < 0) track.playhead += 1.0;
        } else {
            // Reset to position if not scanning
            track.playhead = p.position;
        }

        for(let i=0; i<grains; i++) {
            const grainRelativeTime = i * interval;
            let ampEnv = 0;

            // ADR Envelope Logic
            if (grainRelativeTime < atk) {
                ampEnv = grainRelativeTime / atk;
            } else if (grainRelativeTime < atk + dec) {
                const decProgress = (grainRelativeTime - atk) / dec;
                ampEnv = 1.0 - (decProgress * (1.0 - sustainLevel));
            } else if (grainRelativeTime < atk + dec + rel) {
                const relProgress = (grainRelativeTime - (atk + dec)) / rel;
                ampEnv = sustainLevel * (1.0 - relProgress);
            } else {
                ampEnv = 0;
            }

            const jitter = Math.random() * 0.005;
            if (ampEnv > 0.001) { 
                this.playGrain(track, time + grainRelativeTime + jitter, scheduleVisualDrawCallback, ampEnv);
            }
        }
    }
}