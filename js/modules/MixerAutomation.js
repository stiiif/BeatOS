// js/modules/MixerAutomation.js
// Records and plays back mixer knob/fader automation over the sequencer loop.
// Per-lane loop length (2–128 steps), 4x resolution per step.
// Polymetric: each lane can have its own loop length for generative phase patterns.

export class MixerAutomation {
    constructor() {
        this.RES_PER_STEP = 4;
        this.defaultLoopSteps = 32;

        this.lanes = new Map();

        this.isRecording = false;
        this._activeLane = null;
        this._recordingLanes = new Set();
        this._lastPlaybackStep = -1;
    }

    static laneKey(stripType, stripId, paramName) {
        return `${stripType}:${stripId}:${paramName}`;
    }

    hasAutomation(key) { return this.lanes.has(key); }

    getLanesForStrip(stripType, stripId) {
        const prefix = `${stripType}:${stripId}:`;
        const keys = [];
        for (const key of this.lanes.keys()) {
            if (key.startsWith(prefix)) keys.push(key);
        }
        return keys;
    }

    getLaneLoopLength(key) {
        const lane = this.lanes.get(key);
        if (lane) return lane.loopSteps;
        if (this._pendingLengths && this._pendingLengths.has(key)) return this._pendingLengths.get(key);
        return this.defaultLoopSteps;
    }

    setLaneLoopLength(key, steps) {
        const lane = this.lanes.get(key);
        if (!lane) return;
        steps = Math.max(2, Math.min(128, steps));
        const newRes = steps * this.RES_PER_STEP;
        const oldRes = lane.data.length;
        if (newRes !== oldRes) {
            const newData = new Float32Array(newRes);
            const lastVal = lane.data[Math.min(oldRes, newRes) - 1] || lane.data[0];
            for (let i = 0; i < newRes; i++) {
                newData[i] = i < oldRes ? lane.data[i] : lastVal;
            }
            lane.data = newData;
        }
        lane.loopSteps = steps;
    }

    // ========================================================================
    // RECORDING
    // ========================================================================

    startRecording() {
        this.isRecording = true;
        this._recordingLanes.clear();
    }

    stopRecording() {
        this.isRecording = false;
        this._recordingLanes.clear();
    }

    recordValue(key, value, globalStep, min, max) {
        if (!this.isRecording) return;
        let lane = this.lanes.get(key);
        if (!lane) {
            // Check for pre-configured loop length
            let loopSteps = this.defaultLoopSteps;
            if (this._pendingLengths && this._pendingLengths.has(key)) {
                loopSteps = this._pendingLengths.get(key);
                this._pendingLengths.delete(key);
            }
            const res = loopSteps * this.RES_PER_STEP;
            lane = { data: new Float32Array(res).fill(value), min, max, offset: 0, loopSteps };
            this.lanes.set(key, lane);
        }
        const res = lane.data.length;
        const pos = globalStep % res;
        lane.data[pos] = value;
        for (let i = pos + 1; i < res; i++) lane.data[i] = value;
        this._recordingLanes.add(key);
    }

    // ========================================================================
    // PLAYBACK
    // ========================================================================

    getValue(key, globalStepFrac) {
        const lane = this.lanes.get(key);
        if (!lane) return null;
        const res = lane.data.length;
        const lanePos = (globalStepFrac * this.RES_PER_STEP) % res;
        const idx = Math.floor(lanePos);
        const frac = lanePos - idx;
        const i0 = idx % res;
        const i1 = (idx + 1) % res;
        const raw = lane.data[i0] + frac * (lane.data[i1] - lane.data[i0]);
        return Math.max(lane.min, Math.min(lane.max, raw + lane.offset));
    }

    /** Get 0.0–1.0 position within a lane's own loop */
    getLanePosition(key, globalStepFrac) {
        const lane = this.lanes.get(key);
        if (!lane) return 0;
        const totalRes = lane.loopSteps * this.RES_PER_STEP;
        return ((globalStepFrac * this.RES_PER_STEP) % totalRes) / totalRes;
    }

    // ========================================================================
    // OFFSET
    // ========================================================================

    addOffset(key, delta) {
        const lane = this.lanes.get(key);
        if (!lane) return;
        lane.offset += delta;
        const res = lane.data.length;
        let minVal = Infinity, maxVal = -Infinity;
        for (let i = 0; i < res; i++) {
            const v = lane.data[i] + lane.offset;
            if (v < minVal) minVal = v;
            if (v > maxVal) maxVal = v;
        }
        if (minVal < lane.min) lane.offset += (lane.min - minVal);
        if (maxVal > lane.max) lane.offset -= (maxVal - lane.max);
    }

    // ========================================================================
    // CLEAR
    // ========================================================================

    clearLane(key) { this.lanes.delete(key); }

    clearStrip(stripType, stripId) {
        const keys = this.getLanesForStrip(stripType, stripId);
        keys.forEach(k => this.lanes.delete(k));
        return keys;
    }

    clearAll() { this.lanes.clear(); }

    // ========================================================================
    // LCM
    // ========================================================================

    getActiveLoopLengths() {
        const lengths = new Set();
        for (const lane of this.lanes.values()) lengths.add(lane.loopSteps);
        return [...lengths];
    }

    getLCM() {
        const lengths = this.getActiveLoopLengths();
        if (lengths.length === 0) return 0;
        return lengths.reduce((a, b) => lcm(a, b));
    }

    formatLCMTime(bpm, stepsPerBeat = 4) {
        const lcmSteps = this.getLCM();
        if (lcmSteps === 0) return '--';
        const secPerStep = 60 / bpm / stepsPerBeat;
        const totalSec = lcmSteps * secPerStep;
        return formatDuration(totalSec);
    }

    // ========================================================================
    // COMPAT HELPERS
    // ========================================================================

    static getStep256(currentStep, stepFraction = 0) {
        return Math.floor((currentStep + stepFraction) * 4) % 256;
    }

    static getGlobalStepFrac(currentStep, stepFraction = 0) {
        return currentStep + stepFraction;
    }

    static getLoopFraction(currentStep, stepFraction = 0, totalSteps = 64) {
        return (currentStep + stepFraction) / totalSteps;
    }

    // ========================================================================
    // SERIALIZE
    // ========================================================================

    serialize() {
        const obj = {};
        for (const [key, lane] of this.lanes) {
            obj[key] = {
                data: Array.from(lane.data),
                min: lane.min, max: lane.max,
                offset: lane.offset, loopSteps: lane.loopSteps
            };
        }
        return obj;
    }

    deserialize(obj) {
        this.lanes.clear();
        if (!obj) return;
        for (const [key, ld] of Object.entries(obj)) {
            const loopSteps = ld.loopSteps || this.defaultLoopSteps;
            this.lanes.set(key, {
                data: new Float32Array(ld.data),
                min: ld.min, max: ld.max,
                offset: ld.offset || 0, loopSteps
            });
        }
    }
}

function gcd(a, b) { while (b) { [a, b] = [b, a % b]; } return a; }
function lcm(a, b) { return (a / gcd(a, b)) * b; }

function formatDuration(totalSec) {
    if (totalSec < 60) return Math.round(totalSec) + 's';
    const MIN = 60, HOUR = 3600, DAY = 86400, WEEK = 604800, MONTH = 2592000, YEAR = 31536000;
    if (totalSec < HOUR) {
        const m = Math.floor(totalSec / MIN), s = Math.round(totalSec % MIN);
        return s > 0 ? `${m}m${s}s` : `${m}m`;
    }
    if (totalSec < DAY) {
        const h = Math.floor(totalSec / HOUR), m = Math.round((totalSec % HOUR) / MIN);
        return m > 0 ? `${h}h${m}m` : `${h}h`;
    }
    if (totalSec < WEEK) {
        const d = Math.floor(totalSec / DAY), h = Math.round((totalSec % DAY) / HOUR);
        return h > 0 ? `${d}d${h}h` : `${d}d`;
    }
    if (totalSec < MONTH) {
        const w = Math.floor(totalSec / WEEK), d = Math.round((totalSec % WEEK) / DAY);
        return d > 0 ? `${w}w${d}d` : `${w}w`;
    }
    if (totalSec < YEAR) {
        const mo = Math.floor(totalSec / MONTH), d = Math.round((totalSec % MONTH) / DAY);
        return d > 0 ? `${mo}mo${d}d` : `${mo}mo`;
    }
    const y = Math.floor(totalSec / YEAR), mo = Math.round((totalSec % YEAR) / MONTH);
    return mo > 0 ? `${y}y${mo}mo` : `${y}y`;
}
