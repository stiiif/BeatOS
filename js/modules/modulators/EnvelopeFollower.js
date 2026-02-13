// js/modules/modulators/EnvelopeFollower.js

import { Modulator, MOD_TYPE } from './Modulator.js';
import { LFO } from './LFO.js';

export class EnvelopeFollower extends Modulator {
    constructor() {
        super(MOD_TYPE.ENV_FOLLOW);
        this.source = 'master';     // 'master', 'track:0', 'group:1', 'return:0'
        this.attack = 10;           // ms
        this.release = 150;         // ms
        this.invert = false;
        this.delay = 0;             // ms
        this.delaySync = false;
        this.delaySyncIndex = 15;   // SYNC_RATES index

        // Internal state
        this._envelope = 0;
        this._delayBuffer = new Float32Array(64); // Ring buffer for delay
        this._delayHead = 0;
        this._lastTime = 0;
    }

    _resolveAnalyser(context) {
        if (!context || !context.audioEngine) return null;
        const ae = context.audioEngine;
        if (this.source === 'master') return ae.masterBus?.analyser;
        const [type, idStr] = this.source.split(':');
        const id = parseInt(idStr);
        switch (type) {
            case 'track': {
                const tracks = context.tracks;
                return tracks?.[id]?.bus?.analyser;
            }
            case 'group': return ae.groupBuses?.[id]?.analyser;
            case 'return': return ae.returnBuses?.[id]?.analyser;
        }
        return null;
    }

    _computeRMS(context) {
        // Use cached RMS from context if available
        if (context && context._rmsCache) {
            if (context._rmsCache.has(this.source)) return context._rmsCache.get(this.source);
        }

        const analyser = this._resolveAnalyser(context);
        if (!analyser) return 0;

        const bufferLength = analyser.fftSize;
        // Reuse typed array to avoid allocation
        if (!this._rmsBuffer || this._rmsBuffer.length !== bufferLength) {
            this._rmsBuffer = new Uint8Array(bufferLength);
        }
        analyser.getByteTimeDomainData(this._rmsBuffer);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
            const v = (this._rmsBuffer[i] - 128) / 128;
            sum += v * v;
        }
        const rms = Math.sqrt(sum / bufferLength);

        // Cache for this frame
        if (context && context._rmsCache) {
            context._rmsCache.set(this.source, rms);
        }
        return rms;
    }

    getRawValue(time, bpm = 120, context = null) {
        const rms = this._computeRMS(context);

        // Frame-rate-independent smoothing
        const dt = Math.max(0.001, time - this._lastTime);
        this._lastTime = time;

        const attackTau = this.attack / 1000;
        const releaseTau = this.release / 1000;
        const tau = rms > this._envelope ? attackTau : releaseTau;
        const coeff = tau > 0 ? 1 - Math.exp(-dt / tau) : 1;
        this._envelope += (rms - this._envelope) * coeff;

        let output = this._envelope;

        // Simple delay via ring buffer (write current, read delayed)
        if (this.delay > 0 || (this.delaySync && this.delaySyncIndex >= 0)) {
            let delaySamples;
            if (this.delaySync) {
                const beats = LFO.SYNC_RATES[Math.min(this.delaySyncIndex, LFO.SYNC_RATES.length - 1)].beats;
                const delaySec = beats * 60 / bpm;
                delaySamples = Math.min(63, Math.round(delaySec * 60)); // ~60fps
            } else {
                delaySamples = Math.min(63, Math.round(this.delay / 16.67)); // ~60fps
            }

            this._delayBuffer[this._delayHead] = output;
            const readIdx = (this._delayHead - delaySamples + 64) % 64;
            output = this._delayBuffer[readIdx];
            this._delayHead = (this._delayHead + 1) % 64;
        }

        // Invert
        if (this.invert) output = 1 - output;

        // Convert to bipolar (-1..1)
        return output * 2 - 1;
    }

    getValue(time, bpm = 120, context = null) {
        if (this.amount === 0) return 0;
        return this.getRawValue(time, bpm, context) * this.amount;
    }

    serialize() {
        return {
            ...super.serialize(),
            source: this.source,
            attack: this.attack,
            release: this.release,
            invert: this.invert,
            delay: this.delay,
            delaySync: this.delaySync,
            delaySyncIndex: this.delaySyncIndex
        };
    }

    static fromData(data) {
        const ef = new EnvelopeFollower();
        if (!data) return ef;
        if (data.amount !== undefined) ef.amount = data.amount;
        if (data.targets) ef.targets = [...data.targets];
        if (data.target !== undefined) ef.target = data.target;
        if (data.source !== undefined) ef.source = data.source;
        if (data.attack !== undefined) ef.attack = data.attack;
        if (data.release !== undefined) ef.release = data.release;
        if (data.invert !== undefined) ef.invert = data.invert;
        if (data.delay !== undefined) ef.delay = data.delay;
        if (data.delaySync !== undefined) ef.delaySync = data.delaySync;
        if (data.delaySyncIndex !== undefined) ef.delaySyncIndex = data.delaySyncIndex;
        return ef;
    }
}

Modulator.register(MOD_TYPE.ENV_FOLLOW, EnvelopeFollower);
