// LFO (Low Frequency Oscillator) Module
export class LFO {
    constructor() {
        this.wave = 'sine';
        this.rate = 1.0;
        this.amount = 0.0;
        this.targets = [];
        this.lastRandom = 0;
        this.randomHoldTime = 0;

        // NEW: Sync Properties
        this.sync = false;
        this.syncRateIndex = 17; // Default to '1/4' (Index depends on array below)
    }

    // Static configuration for UI and Randomization
    static get PARAM_DEFS() {
        return {
            rate: { min: 0.1, max: 20.0, step: 0.01, default: 1.0 },
            amount: { min: 0.0, max: 1.0, step: 0.001, default: 0.0 }
        };
    }

    // Master Sync Rate List
    // Ordered High Duration (Slow) -> Low Duration (Fast)
    static get SYNC_RATES() {
        return [
            { label: "32/1", beats: 128.0, type: "straight" },
            { label: "16/1", beats: 64.0, type: "straight" },
            { label: "8/1", beats: 32.0, type: "straight" },
            { label: "6/1", beats: 24.0, type: "straight" }, // 6 Bars
            { label: "5/1", beats: 20.0, type: "straight" }, // 5 Bars
            { label: "4/1", beats: 16.0, type: "straight" },
            { label: "3/1", beats: 12.0, type: "straight" },
            { label: "2/1", beats: 8.0, type: "straight" },

            { label: "1/1D", beats: 6.0, type: "dotted" },
            { label: "1/1", beats: 4.0, type: "straight" },
            { label: "1/1T", beats: 8 / 3, type: "triplet" },

            { label: "1/2D", beats: 3.0, type: "dotted" },
            { label: "1/2", beats: 2.0, type: "straight" },
            { label: "1/2T", beats: 4 / 3, type: "triplet" },

            { label: "1/4D", beats: 1.5, type: "dotted" },
            { label: "1/4", beats: 1.0, type: "straight" }, // Index 17 (Center)
            { label: "1/4Q", beats: 0.8, type: "quintuplet" },
            { label: "1/4T", beats: 2 / 3, type: "triplet" },
            { label: "1/4S", beats: 4 / 7, type: "septuplet" },

            { label: "1/8D", beats: 0.75, type: "dotted" },
            { label: "1/8", beats: 0.5, type: "straight" },
            { label: "1/8Q", beats: 0.4, type: "quintuplet" },
            { label: "1/8T", beats: 1 / 3, type: "triplet" },

            { label: "1/16D", beats: 0.375, type: "dotted" },
            { label: "1/16", beats: 0.25, type: "straight" },
            { label: "1/16T", beats: 1 / 6, type: "triplet" },

            { label: "1/32", beats: 0.125, type: "straight" },
            { label: "1/32T", beats: 1 / 12, type: "triplet" },

            { label: "1/64", beats: 0.0625, type: "straight" }
        ];
    }

    // Helper to calculate Hz
    getFrequency(bpm) {
        if (!this.sync) return this.rate;

        // Safety check
        if (this.syncRateIndex < 0) this.syncRateIndex = 0;
        if (this.syncRateIndex >= LFO.SYNC_RATES.length) this.syncRateIndex = LFO.SYNC_RATES.length - 1;

        const beats = LFO.SYNC_RATES[this.syncRateIndex].beats;
        // Hz = 1 / seconds_per_cycle
        // seconds_per_cycle = beats * (60/BPM)
        // Hz = BPM / (60 * beats)
        return bpm / (60 * beats);
    }

    getValue(time, bpm = 120) {
        if (this.amount === 0) return 0;

        const freq = this.getFrequency(bpm);
        const phase = (time * freq) % 1.0;

        let out = 0;
        switch (this.wave) {
            case 'sine': out = Math.sin(phase * Math.PI * 2); break;
            case 'square': out = phase < 0.5 ? 1 : -1; break;
            case 'sawtooth': out = 2 * (phase - 0.5); break;
            case 'triangle': out = 2 * Math.abs(2 * (phase - 0.5)) - 1; break;
            case 'pulse': var dutyCycle = 0.1; out = phase < dutyCycle ? 1 : -1; break;
            case 'random':
                const step = Math.floor(time * freq);
                if (step > this.randomHoldTime) {
                    this.randomHoldTime = step;
                    this.lastRandom = (Math.random() * 2) - 1;
                }
                out = this.lastRandom;
                break;
        }
        return out * this.amount;
    }
}