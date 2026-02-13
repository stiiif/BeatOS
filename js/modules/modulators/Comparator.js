// js/modules/modulators/Comparator.js

import { Modulator, MOD_TYPE, COMP_MODE } from './Modulator.js';

export class Comparator extends Modulator {
    constructor() {
        super(MOD_TYPE.COMPARATOR);
        this.sourceA = 0;           // Sibling slot index
        this.sourceB = 1;           // Sibling slot index
        this.mode = COMP_MODE.DIFFERENCE;
        this.threshold = 0.0;       // Deadband
        this.rectify = false;       // Unipolar output
        this.smooth = 0.0;          // One-pole smoothing (0=raw, 1=very smooth)

        // Internal state
        this._smoothed = 0;
    }

    getRawValue(time, bpm = 120, context = null) {
        const siblings = context?.siblings;
        if (!siblings) return 0;

        // Read raw (pre-amount) values from siblings
        const modA = siblings[this.sourceA];
        const modB = siblings[this.sourceB];
        if (!modA || !modB) return 0;

        // Prevent self-reference
        const selfIdx = context?.selfIndex;
        if (this.sourceA === selfIdx || this.sourceB === selfIdx) return 0;

        const a = modA.getRawValue(time, bpm, context);
        const b = modB.getRawValue(time, bpm, context);

        let out;
        switch (this.mode) {
            case COMP_MODE.DIFFERENCE: out = a - b; break;
            case COMP_MODE.MULTIPLY:   out = a * b; break;
            case COMP_MODE.GATE:       out = a > b ? 1 : -1; break;
            case COMP_MODE.MIN:        out = Math.min(a, b); break;
            case COMP_MODE.MAX:        out = Math.max(a, b); break;
            case COMP_MODE.XOR:        out = (Math.sign(a) !== Math.sign(b)) ? 1 : -1; break;
            default: out = a - b;
        }

        // Deadband
        if (Math.abs(out) < this.threshold) out = 0;

        // Rectify
        if (this.rectify) out = Math.abs(out);

        // Smooth
        if (this.smooth > 0) {
            const coeff = 1 - this.smooth * 0.95; // smooth=1 → coeff=0.05
            this._smoothed += (out - this._smoothed) * coeff;
            out = this._smoothed;
        } else {
            this._smoothed = out;
        }

        return out;
    }

    getValue(time, bpm = 120, context = null) {
        if (this.amount === 0) return 0;
        return this.getRawValue(time, bpm, context) * this.amount;
    }

    serialize() {
        return {
            ...super.serialize(),
            sourceA: this.sourceA,
            sourceB: this.sourceB,
            mode: this.mode,
            threshold: this.threshold,
            rectify: this.rectify,
            smooth: this.smooth
        };
    }

    static fromData(data) {
        const c = new Comparator();
        if (!data) return c;
        if (data.amount !== undefined) c.amount = data.amount;
        if (data.targets) c.targets = [...data.targets];
        if (data.target !== undefined) c.target = data.target;
        if (data.sourceA !== undefined) c.sourceA = data.sourceA;
        if (data.sourceB !== undefined) c.sourceB = data.sourceB;
        if (data.mode !== undefined) c.mode = data.mode;
        if (data.threshold !== undefined) c.threshold = data.threshold;
        if (data.rectify !== undefined) c.rectify = data.rectify;
        if (data.smooth !== undefined) c.smooth = data.smooth;
        return c;
    }
}

Modulator.register(MOD_TYPE.COMPARATOR, Comparator);
