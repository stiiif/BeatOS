// js/core/SamplerEngine.js
// Classic sampler engine — one-shot or looped sample playback with ADSR envelope,
// per-step pitch, velocity layers, LPF/HPF, and full modulator integration.

export class SamplerEngine {
    constructor(audioEngine) {
        this.audioEngine = audioEngine;
        this._modCtx = { siblings: null, audioEngine: null, tracks: null, selfIndex: 0, stepIndex: 0, globalStepFrac: 0 };
    }

    /**
     * Schedule a sampler note.
     * @param {Object} track - Track object with buffer, params, bus, lfos
     * @param {number} time - Audio context time to play at
     * @param {Function} scheduleVisualDrawCallback
     * @param {number} velocity - 1 (low), 2 (med), 3 (high)
     * @param {number} stepIndex - Current step index
     */
    scheduleNote(track, time, scheduleVisualDrawCallback, velocity = 3, stepIndex = 0) {
        const ctx = this.audioEngine.getContext();
        if (!ctx || !track.buffer || !track.bus || !track.bus.input) return;

        const p = track.params;
        const sp = p.sampler || {};
        const buf = track.buffer;

        // --- Modulation ---
        const mod = { pitch: 0, filter: 0, hpFilter: 0, volume: 0, pan: 0, attack: 0, decay: 0, sustain: 0, release: 0 };
        const modCtx = this._modCtx;
        modCtx.siblings = track.lfos;
        modCtx.audioEngine = this.audioEngine;
        modCtx.tracks = this.audioEngine._tracks;
        modCtx.stepIndex = stepIndex;
        modCtx.globalStepFrac = this.audioEngine._scheduler ? (this.audioEngine._scheduler.totalStepsPlayed || 0) : 0;

        for (let i = 0; i < track.lfos.length; i++) {
            const lfo = track.lfos[i];
            if (lfo.amount === 0) continue;
            modCtx.selfIndex = i;
            const v = lfo.getValue(time, 120, modCtx);
            const targets = lfo.targets;
            if (targets && targets.length > 0) {
                for (let t = 0; t < targets.length; t++) {
                    const tgt = targets[t];
                    if (tgt === 'smp_pitch') mod.pitch += v * 12;          // semitones
                    else if (tgt === 'smp_filter') mod.filter += v * 5000;
                    else if (tgt === 'smp_hpFilter') mod.hpFilter += v * 2000;
                    else if (tgt === 'smp_volume') mod.volume += v * 0.5;
                    else if (tgt === 'smp_attack') mod.attack += v * 0.5;
                    else if (tgt === 'smp_decay') mod.decay += v * 0.5;
                    else if (tgt === 'smp_sustain') mod.sustain += v * 0.5;
                    else if (tgt === 'smp_release') mod.release += v * 0.5;
                    // Also support generic targets for bus params
                    else if (tgt === 'filter') mod.filter += v * 5000;
                    else if (tgt === 'hpFilter') mod.hpFilter += v * 2000;
                    else if (tgt === 'volume') mod.volume += v * 0.5;
                    else if (tgt === 'pan') mod.pan += v;
                }
            }
        }

        // --- Velocity ---
        const velGain = velocity === 1 ? 0.33 : velocity === 2 ? 0.66 : 1.0;
        const velFilter = velocity === 1 ? 0.5 : velocity === 2 ? 0.75 : 1.0;

        // --- Sample region ---
        let startPos = sp.start !== undefined ? sp.start : 0;
        let endPos = sp.end !== undefined ? sp.end : 1;
        const isReverse = startPos > endPos;
        if (isReverse) { [startPos, endPos] = [endPos, startPos]; }

        const startSample = Math.floor(startPos * buf.length);
        const endSample = Math.floor(endPos * buf.length);
        const regionLength = endSample - startSample;
        if (regionLength <= 0) return;

        // --- Pitch ---
        let pitchSemi = (sp.pitchSemi || 0) + mod.pitch;
        const pitchFine = (sp.pitchFine || 0);
        // Per-step pitch override
        const stepPitch = track.stepPitches ? track.stepPitches[stepIndex] : null;
        if (stepPitch !== null && stepPitch !== undefined) {
            pitchSemi += stepPitch;
        }
        const playbackRate = Math.pow(2, (pitchSemi + pitchFine / 100) / 12) * (isReverse ? -1 : 1);

        // --- ADSR ---
        const attack = Math.max(0.001, (sp.attack || 0.005) + mod.attack);
        const decay = Math.max(0.001, (sp.decay || 0.1) + mod.decay);
        const sustain = Math.max(0, Math.min(1, (sp.sustain !== undefined ? sp.sustain : 0.8) + mod.sustain));
        const release = Math.max(0.001, (sp.release || 0.1) + mod.release);
        const volume = Math.max(0, Math.min(1.5, (sp.volume !== undefined ? sp.volume : 0.8) + mod.volume)) * velGain;

        // --- Loop mode ---
        const loopMode = sp.loopMode || 'off'; // 'off', 'forward', 'pingpong'

        // --- Duration ---
        const sampleDuration = regionLength / ctx.sampleRate / Math.abs(playbackRate);
        const noteDuration = loopMode === 'off' ? sampleDuration : (sampleDuration * 4); // Loops play longer
        const totalDuration = noteDuration + release;

        // --- Create source ---
        const source = ctx.createBufferSource();
        source.buffer = buf;
        source.playbackRate.value = Math.abs(playbackRate);

        if (loopMode === 'forward') {
            source.loop = true;
            source.loopStart = startPos * buf.duration;
            source.loopEnd = endPos * buf.duration;
        } else if (loopMode === 'pingpong') {
            // Web Audio doesn't natively support ping-pong; use forward loop as approximation
            source.loop = true;
            source.loopStart = startPos * buf.duration;
            source.loopEnd = endPos * buf.duration;
        }

        // --- Envelope ---
        const envGain = ctx.createGain();
        envGain.gain.setValueAtTime(0, time);
        // Attack
        envGain.gain.linearRampToValueAtTime(volume, time + attack);
        // Decay → Sustain
        envGain.gain.linearRampToValueAtTime(volume * sustain, time + attack + decay);
        // Hold at sustain until note end
        const noteEnd = time + noteDuration;
        envGain.gain.setValueAtTime(volume * sustain, noteEnd);
        // Release
        envGain.gain.linearRampToValueAtTime(0.001, noteEnd + release);

        // --- Filters ---
        const lpFreq = Math.max(20, Math.min(20000, (sp.lpf !== undefined ? sp.lpf : 20000) + mod.filter)) * velFilter;
        const hpFreq = Math.max(20, Math.min(20000, (sp.hpf !== undefined ? sp.hpf : 20) + mod.hpFilter));

        const lpFilter = ctx.createBiquadFilter();
        lpFilter.type = 'lowpass';
        lpFilter.frequency.setValueAtTime(lpFreq, time);
        lpFilter.Q.value = 1;

        const hpFilter = ctx.createBiquadFilter();
        hpFilter.type = 'highpass';
        hpFilter.frequency.setValueAtTime(hpFreq, time);
        hpFilter.Q.value = 1;

        // --- Connect chain: source → LP → HP → envelope → track bus ---
        source.connect(lpFilter);
        lpFilter.connect(hpFilter);
        hpFilter.connect(envGain);
        envGain.connect(track.bus.input);

        // --- Start playback ---
        const offset = isReverse
            ? (buf.duration - endPos * buf.duration)
            : (startPos * buf.duration);
        const duration = loopMode === 'off' ? sampleDuration : undefined;

        if (loopMode === 'off') {
            source.start(time, offset, duration);
        } else {
            source.start(time, offset);
        }
        source.stop(time + totalDuration + 0.01);

        // Track source for stop/panic
        track.addSource(source);

        // Cleanup
        source.onended = () => {
            track.activeSources.delete(source);
            source.disconnect();
            lpFilter.disconnect();
            hpFilter.disconnect();
            envGain.disconnect();
        };

        // --- Bus params (same as 909/granular) ---
        this._syncBus(track, time, mod);

        // Visual callback
        if (scheduleVisualDrawCallback) {
            scheduleVisualDrawCallback(time, track.id, stepIndex);
        }
    }

    _syncBus(track, time, mod) {
        const p = track.params;
        const ctx = this.audioEngine.getContext();
        if (!ctx) return;

        if (track.bus.hp) {
            const freq = this.audioEngine.getMappedFrequency(Math.max(20, p.hpFilter + (mod.hpFilter || 0)), 'hp');
            track.bus.hp.frequency.setTargetAtTime(freq, time, 0.05);
        }
        if (track.bus.lp) {
            const freq = this.audioEngine.getMappedFrequency(Math.min(20000, p.filter + (mod.filter || 0)), 'lp');
            track.bus.lp.frequency.setTargetAtTime(freq, time, 0.05);
        }
        if (track.bus.vol) {
            track.bus.vol.gain.setTargetAtTime(Math.max(0, p.volume + (mod.volume || 0)), time, 0.02);
        }
        if (track.bus.pan) {
            track.bus.pan.pan.setTargetAtTime(Math.max(-1, Math.min(1, p.pan + (mod.pan || 0))), time, 0.02);
        }
    }
}
