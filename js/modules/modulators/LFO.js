// js/modules/modulators/LFO.js
// LFO modulator — extends Modulator base class.

import { Modulator, MOD_TYPE } from './Modulator.js';

export class LFO extends Modulator {
    constructor() {
        super(MOD_TYPE.LFO);
        this.wave = 'sine';
        this.rate = 1.0;
        this.lastRandom = 0;
        this.randomHoldTime = 0;
        
        // Sync
        this.sync = false;
        this.syncRateIndex = 15; // Default to '1/4'
    }
    
    static get PARAM_DEFS() {
        return {
            rate: { min: 0.1, max: 20.0, step: 0.01, default: 1.0 },
            amount: { min: 0.0, max: 1.0, step: 0.001, default: 0.0 }
        };
    }

    static get SYNC_RATES() {
        return [
            { label: "32/1", beats: 128.0, type: "straight" },
            { label: "16/1", beats: 64.0, type: "straight" },
            { label: "8/1", beats: 32.0, type: "straight" },
            { label: "6/1", beats: 24.0, type: "straight" },
            { label: "5/1", beats: 20.0, type: "straight" },
            { label: "4/1", beats: 16.0, type: "straight" },
            { label: "3/1", beats: 12.0, type: "straight" },
            { label: "2/1", beats: 8.0, type: "straight" },
            
            { label: "1/1D", beats: 6.0, type: "dotted" },
            { label: "1/1", beats: 4.0, type: "straight" },
            { label: "1/1T", beats: 8/3, type: "triplet" },
            
            { label: "1/2D", beats: 3.0, type: "dotted" },
            { label: "1/2", beats: 2.0, type: "straight" },
            { label: "1/2T", beats: 4/3, type: "triplet" },
            
            { label: "1/4D", beats: 1.5, type: "dotted" },
            { label: "1/4", beats: 1.0, type: "straight" },
            { label: "1/4Q", beats: 0.8, type: "quintuplet" },
            { label: "1/4T", beats: 2/3, type: "triplet" },
            { label: "1/4S", beats: 4/7, type: "septuplet" },
            
            { label: "1/8D", beats: 0.75, type: "dotted" },
            { label: "1/8", beats: 0.5, type: "straight" },
            { label: "1/8Q", beats: 0.4, type: "quintuplet" },
            { label: "1/8T", beats: 1/3, type: "triplet" },
            
            { label: "1/16D", beats: 0.375, type: "dotted" },
            { label: "1/16", beats: 0.25, type: "straight" },
            { label: "1/16T", beats: 1/6, type: "triplet" },
            
            { label: "1/32", beats: 0.125, type: "straight" },
            { label: "1/32T", beats: 1/12, type: "triplet" },
            
            { label: "1/64", beats: 0.0625, type: "straight" }
        ];
    }

    getFrequency(bpm) {
        if (!this.sync) return this.rate;
        if (this.syncRateIndex < 0) this.syncRateIndex = 0;
        if (this.syncRateIndex >= LFO.SYNC_RATES.length) this.syncRateIndex = LFO.SYNC_RATES.length - 1;
        const beats = LFO.SYNC_RATES[this.syncRateIndex].beats;
        return bpm / (60 * beats);
    }

    getRawValue(time, bpm = 120, context = null) {
        const freq = this.getFrequency(bpm);
        const phase = (time * freq) % 1.0;
        switch(this.wave) {
            case 'sine': return Math.sin(phase * Math.PI * 2);
            case 'square': return phase < 0.5 ? 1 : -1;
            case 'sawtooth': return 2 * (phase - 0.5);
            case 'random': {
                const step = Math.floor(time * freq);
                if (step > this.randomHoldTime) {
                    this.randomHoldTime = step;
                    this.lastRandom = (Math.random() * 2) - 1;
                }
                return this.lastRandom;
            }
        }
        return 0;
    }

    getValue(time, bpm = 120, context = null) {
        if (this.amount === 0) return 0;
        return this.getRawValue(time, bpm, context) * this.amount;
    }

    serialize() {
        return {
            ...super.serialize(),
            wave: this.wave,
            rate: this.rate,
            sync: this.sync,
            syncRateIndex: this.syncRateIndex
        };
    }

    static fromData(data) {
        const lfo = new LFO();
        if (!data) return lfo;
        if (data.wave !== undefined) lfo.wave = data.wave;
        if (data.rate !== undefined) lfo.rate = data.rate;
        if (data.amount !== undefined) lfo.amount = data.amount;
        if (data.sync !== undefined) lfo.sync = data.sync;
        if (data.syncRateIndex !== undefined) lfo.syncRateIndex = data.syncRateIndex;
        if (data.targets) lfo.targets = [...data.targets];
        if (data.target !== undefined) lfo.target = data.target;
        return lfo;
    }
}

// Self-register in factory
Modulator.register(MOD_TYPE.LFO, LFO);
