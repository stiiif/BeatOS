// js/core/SamplerEngine.js
// Classic sampler engine — one-shot or looped sample playback with ADSR envelope,
// per-step pitch, velocity layers, LPF/HPF, polyphony, and full modulator integration.

export class SamplerEngine {
    constructor(audioEngine) {
        this.audioEngine = audioEngine;
        this._modCtx = { siblings: null, audioEngine: null, tracks: null, selfIndex: 0, stepIndex: 0, globalStepFrac: 0 };
        this._reverseCache = new WeakMap();
        this._activeVoices = new Map();
    }

    _getReversedBuffer(buf, ctx) {
        if (this._reverseCache.has(buf)) return this._reverseCache.get(buf);
        const rev = ctx.createBuffer(buf.numberOfChannels, buf.length, buf.sampleRate);
        for (let ch = 0; ch < buf.numberOfChannels; ch++) {
            const src = buf.getChannelData(ch);
            const dst = rev.getChannelData(ch);
            for (let i = 0; i < src.length; i++) {
                dst[i] = src[src.length - 1 - i];
            }
        }
        this._reverseCache.set(buf, rev);
        return rev;
    }

    scheduleNote(track, time, scheduleVisualDrawCallback, velocity = 3, stepIndex = 0) {
        const ctx = this.audioEngine.getContext();
        if (!ctx || !track.buffer || !track.bus || !track.bus.input) return;

        const p = track.params;
        const sp = p.sampler || {};
        const buf = track.buffer;

        // --- Polyphony ---
        const maxVoices = Math.max(1, Math.min(8, Math.round((sp.voices !== undefined ? sp.voices : 4) + mod.voices)));
        let voices = this._activeVoices.get(track.id);
        if (!voices) { voices = new Set(); this._activeVoices.set(track.id, voices); }
        while (voices.size >= maxVoices) {
            const oldest = voices.values().next().value;
            try { oldest.stop(time); } catch(e) {}
            voices.delete(oldest);
        }

        // --- Modulation ---
        const mod = { pitch: 0, filter: 0, hpFilter: 0, volume: 0, attack: 0, decay: 0, sustain: 0, release: 0, start: 0, end: 0, voices: 0 };
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
                    if (tgt === 'smp_pitch') mod.pitch += v * 12;
                    else if (tgt === 'smp_filter') mod.filter += v * 8000;
                    else if (tgt === 'smp_hpFilter') mod.hpFilter += v * 4000;
                    else if (tgt === 'smp_volume') mod.volume += v * 0.5;
                    else if (tgt === 'smp_attack') mod.attack += v * 0.5;
                    else if (tgt === 'smp_decay') mod.decay += v * 0.5;
                    else if (tgt === 'smp_sustain') mod.sustain += v * 0.5;
                    else if (tgt === 'smp_release') mod.release += v * 0.5;
                    else if (tgt === 'smp_start') mod.start += v * 0.5;
                    else if (tgt === 'smp_end') mod.end += v * 0.5;
                    else if (tgt === 'smp_voices') mod.voices += v * 4;
                    else if (tgt === 'filter') mod.filter += v * 8000;
                    else if (tgt === 'hpFilter') mod.hpFilter += v * 4000;
                    else if (tgt === 'volume') mod.volume += v * 0.5;
                }
            }
        }

        // --- Velocity ---
        const velGain = velocity === 1 ? 0.33 : velocity === 2 ? 0.66 : 1.0;
        const velFilterMult = velocity === 1 ? 0.5 : velocity === 2 ? 0.75 : 1.0;

        // --- Sample region (with modulation) ---
        const rawStart = Math.max(0, Math.min(1, (sp.start !== undefined ? sp.start : 0) + mod.start));
        const rawEnd = Math.max(0, Math.min(1, (sp.end !== undefined ? sp.end : 1) + mod.end));
        const isReverse = rawStart > rawEnd;
        const regionStart = Math.min(rawStart, rawEnd);
        const regionEnd = Math.max(rawStart, rawEnd);
        const regionLength = Math.floor((regionEnd - regionStart) * buf.length);
        if (regionLength <= 0) return;

        // --- Pitch ---
        let pitchSemi = (sp.pitchSemi || 0) + mod.pitch;
        const pitchFine = sp.pitchFine || 0;
        const stepPitch = track.stepPitches ? track.stepPitches[stepIndex] : null;
        if (stepPitch !== null && stepPitch !== undefined) pitchSemi += stepPitch;
        const playbackRate = Math.pow(2, (pitchSemi + pitchFine / 100) / 12);

        // --- ADSR ---
        const attack = Math.max(0.001, (sp.attack || 0.005) + mod.attack);
        const decay = Math.max(0.001, (sp.decay || 0.1) + mod.decay);
        const sustain = Math.max(0.001, Math.min(1, (sp.sustain !== undefined ? sp.sustain : 0.8) + mod.sustain));
        const release = Math.max(0.005, (sp.release || 0.1) + mod.release);
        const volume = Math.max(0, Math.min(1.5, (sp.volume !== undefined ? sp.volume : 0.8) + mod.volume)) * velGain;

        // --- Loop & duration ---
        const loopMode = sp.loopMode || 'off';
        const sampleDuration = regionLength / ctx.sampleRate / playbackRate;
        const holdDuration = loopMode === 'off' ? sampleDuration : (sampleDuration * 8);

        // --- Buffer (forward or reversed) ---
        let playBuf = buf;
        let offset = regionStart * buf.duration;
        if (isReverse) {
            playBuf = this._getReversedBuffer(buf, ctx);
            offset = (1 - regionEnd) * buf.duration;
        }

        // --- Source ---
        const source = ctx.createBufferSource();
        source.buffer = playBuf;
        source.playbackRate.value = playbackRate;

        if (loopMode === 'forward' || loopMode === 'pingpong') {
            source.loop = true;
            source.loopStart = isReverse ? (1 - regionEnd) * playBuf.duration : regionStart * playBuf.duration;
            source.loopEnd = isReverse ? (1 - regionStart) * playBuf.duration : regionEnd * playBuf.duration;
        }

        // --- Envelope ---
        const envGain = ctx.createGain();
        const t0 = time;
        const t1 = t0 + attack;
        const t2 = t1 + decay;
        const tEnd = t0 + holdDuration;
        const tRelEnd = tEnd + release;
        const susLevel = Math.max(0.0001, volume * sustain);

        envGain.gain.setValueAtTime(0.0001, t0);
        envGain.gain.linearRampToValueAtTime(volume, t1);
        envGain.gain.exponentialRampToValueAtTime(susLevel, t2);
        if (tEnd > t2 + 0.001) {
            envGain.gain.setValueAtTime(susLevel, tEnd);
        }
        envGain.gain.exponentialRampToValueAtTime(0.0001, tRelEnd);

        // --- Filters (stored as log-mapped Hz, applied directly) ---
        const rawLpf = sp.lpf !== undefined ? sp.lpf : 20000;
        const rawHpf = sp.hpf !== undefined ? sp.hpf : 20;
        const lpFreq = Math.max(20, Math.min(20000, (rawLpf + mod.filter) * velFilterMult));
        const hpFreq = Math.max(20, Math.min(20000, rawHpf + mod.hpFilter));

        const lpFilter = ctx.createBiquadFilter();
        lpFilter.type = 'lowpass';
        lpFilter.frequency.setValueAtTime(lpFreq, time);
        lpFilter.Q.value = 0.707;

        const hpFilter = ctx.createBiquadFilter();
        hpFilter.type = 'highpass';
        hpFilter.frequency.setValueAtTime(hpFreq, time);
        hpFilter.Q.value = 0.707;

        // --- Connect ---
        source.connect(lpFilter);
        lpFilter.connect(hpFilter);
        hpFilter.connect(envGain);
        envGain.connect(track.bus.input);

        // --- Start ---
        if (loopMode === 'off') {
            source.start(time, offset, sampleDuration);
        } else {
            source.start(time, offset);
        }
        source.stop(tRelEnd + 0.05);

        voices.add(source);
        track.addSource(source);

        source.onended = () => {
            voices.delete(source);
            track.activeSources.delete(source);
            source.disconnect();
            lpFilter.disconnect();
            hpFilter.disconnect();
            envGain.disconnect();
        };

        this._syncBus(track, time, mod);

        if (scheduleVisualDrawCallback) {
            scheduleVisualDrawCallback(time, track.id, stepIndex);
        }
    }

    _syncBus(track, time, mod) {
        const p = track.params;
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
