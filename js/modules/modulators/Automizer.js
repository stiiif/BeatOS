// js/modules/modulators/Automizer.js
// Automizer modulator — records freehand parameter gestures as looping modulation sources.
// Per-lane loop length (2–128 steps), 4x resolution per step. Same engine as MixerAutomation.

import { Modulator, MOD_TYPE } from './Modulator.js';

export class Automizer extends Modulator {
    constructor() {
        super(MOD_TYPE.AUTOMIZER);
        this.RES_PER_STEP = 4;
        this.loopSteps = 32;           // Default loop length in steps
        this.data = null;              // Float32Array — null means empty/unrecorded
        this.isRecording = false;
        this._recordingTarget = null;  // Target param id being recorded to (for auto-assign)
    }

    static get PARAM_DEFS() {
        return {
            amount: { min: 0.0, max: 1.0, step: 0.001, default: 0.0 }
        };
    }

    get resolution() { return this.loopSteps * this.RES_PER_STEP; }
    get hasData() { return this.data !== null && this.data.length > 0; }

    /** Initialize empty data buffer */
    initData() {
        this.data = new Float32Array(this.resolution).fill(0);
    }

    /** Set loop length, resizing data array */
    setLoopSteps(steps) {
        steps = Math.max(2, Math.min(128, steps));
        const newRes = steps * this.RES_PER_STEP;
        if (this.data) {
            const oldRes = this.data.length;
            const newData = new Float32Array(newRes);
            const lastVal = this.data[Math.min(oldRes, newRes) - 1] || 0;
            for (let i = 0; i < newRes; i++) {
                newData[i] = i < oldRes ? this.data[i] : lastVal;
            }
            this.data = newData;
        }
        this.loopSteps = steps;
    }

    /** Start recording */
    startRecording(targetId) {
        this.isRecording = true;
        this._recordingTarget = targetId || null;
        if (!this.data) this.initData();
    }

    /** Stop recording */
    stopRecording() {
        this.isRecording = false;
        // Auto-assign to the target we recorded on (if not already assigned)
        if (this._recordingTarget && !this.targets.includes(this._recordingTarget)) {
            this.targets.push(this._recordingTarget);
        }
        this._recordingTarget = null;
    }

    /**
     * Record a normalized value (0–1) at the current global step position.
     * @param {number} normalizedValue - 0.0 to 1.0 (mapped from param range)
     * @param {number} globalResStep - Global resolution step (globalStepFrac * RES_PER_STEP)
     */
    recordValue(normalizedValue, globalResStep) {
        if (!this.isRecording || !this.data) return;
        const res = this.data.length;
        const pos = Math.floor(globalResStep) % res;
        // Store as bipolar (-1 to +1) for modulator compatibility
        this.data[pos] = (normalizedValue * 2) - 1;
        // Forward-fill
        for (let i = pos + 1; i < res; i++) {
            this.data[i] = this.data[pos];
        }
    }

    /**
     * Get the raw modulation value at a given global step position.
     * Returns bipolar (-1 to +1) like other modulators.
     */
    getRawValue(time, bpm = 120, context = null) {
        if (!this.data || !context) return 0;
        const globalStepFrac = context.globalStepFrac || 0;
        const res = this.data.length;
        const lanePos = (globalStepFrac * this.RES_PER_STEP) % res;
        const idx = Math.floor(lanePos);
        const frac = lanePos - idx;
        const i0 = idx % res;
        const i1 = (idx + 1) % res;
        return this.data[i0] + frac * (this.data[i1] - this.data[i0]);
    }

    getValue(time, bpm = 120, context = null) {
        if (this.amount === 0 || !this.data) return 0;
        return this.getRawValue(time, bpm, context) * this.amount;
    }

    /** Get 0.0–1.0 loop position for display */
    getLoopPosition(globalStepFrac) {
        if (!this.data) return 0;
        const totalRes = this.data.length;
        return ((globalStepFrac * this.RES_PER_STEP) % totalRes) / totalRes;
    }

    /** Clear recorded data */
    clearData() {
        this.data = null;
    }

    serialize() {
        return {
            ...super.serialize(),
            loopSteps: this.loopSteps,
            data: this.data ? Array.from(this.data) : null
        };
    }

    static fromData(data) {
        const a = new Automizer();
        if (!data) return a;
        if (data.amount !== undefined) a.amount = data.amount;
        if (data.targets) a.targets = [...data.targets];
        if (data.target !== undefined) a.target = data.target;
        if (data.loopSteps !== undefined) a.loopSteps = data.loopSteps;
        if (data.data) a.data = new Float32Array(data.data);
        return a;
    }
}

// Self-register
Modulator.register(MOD_TYPE.AUTOMIZER, Automizer);
