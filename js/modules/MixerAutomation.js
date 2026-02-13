// js/modules/MixerAutomation.js
// Records and plays back mixer knob/fader automation over the sequencer loop.
// 256-step resolution (4x the 64-step sequencer grid) with linear interpolation.

export class MixerAutomation {
    constructor() {
        this.RESOLUTION = 256; // Steps per loop
        // Lanes keyed by "stripType:stripId:paramName"
        // e.g. "track:3:gain", "group:0:comp", "return:1:pan"
        this.lanes = new Map();

        // Recording state
        this.isRecording = false;
        this._activeLane = null; // Currently recording lane key
        this._recordingLanes = new Set(); // All lanes touched during this record pass

        // Playback state
        this._lastPlaybackStep = -1;
    }

    /**
     * Get the lane key for a mixer control
     */
    static laneKey(stripType, stripId, paramName) {
        return `${stripType}:${stripId}:${paramName}`;
    }

    /**
     * Check if a lane has automation data
     */
    hasAutomation(key) {
        return this.lanes.has(key);
    }

    /**
     * Get all lane keys that match a strip (for clear-all-on-strip)
     */
    getLanesForStrip(stripType, stripId) {
        const prefix = `${stripType}:${stripId}:`;
        const keys = [];
        for (const key of this.lanes.keys()) {
            if (key.startsWith(prefix)) keys.push(key);
        }
        return keys;
    }

    /**
     * Start recording (called when * key is pressed)
     */
    startRecording() {
        this.isRecording = true;
        this._recordingLanes.clear();
    }

    /**
     * Stop recording (called when * key is released)
     */
    stopRecording() {
        this.isRecording = false;
        this._recordingLanes.clear();
    }

    /**
     * Record a value at the current playback position.
     * Called from knob/fader onChange when recording is active.
     * @param {string} key - Lane key
     * @param {number} value - Current knob value
     * @param {number} step256 - Current 256-step position (0-255)
     * @param {number} min - Param min value (for offset clamping later)
     * @param {number} max - Param max value
     */
    recordValue(key, value, step256, min, max) {
        if (!this.isRecording) return;

        let lane = this.lanes.get(key);
        if (!lane) {
            // Create new lane — initialize all steps to current value (flat line)
            lane = {
                data: new Float32Array(this.RESOLUTION).fill(value),
                min,
                max,
                offset: 0
            };
            this.lanes.set(key, lane);
        }

        // Write current value at current step
        lane.data[step256] = value;
        this._recordingLanes.add(key);
    }

    /**
     * Get the interpolated automation value at a fractional position.
     * @param {string} key - Lane key
     * @param {number} fraction - Position in loop (0.0 to 1.0)
     * @returns {number|null} - Interpolated value or null if no automation
     */
    getValue(key, fraction) {
        const lane = this.lanes.get(key);
        if (!lane) return null;

        const pos = fraction * this.RESOLUTION;
        const idx = Math.floor(pos);
        const frac = pos - idx;

        const i0 = idx % this.RESOLUTION;
        const i1 = (idx + 1) % this.RESOLUTION;

        const raw = lane.data[i0] + frac * (lane.data[i1] - lane.data[i0]);
        return Math.max(lane.min, Math.min(lane.max, raw + lane.offset));
    }

    /**
     * Apply an offset to all values in a lane (drag-to-offset).
     * @param {string} key - Lane key
     * @param {number} delta - Offset delta to add
     */
    addOffset(key, delta) {
        const lane = this.lanes.get(key);
        if (!lane) return;
        lane.offset += delta;
        // Clamp offset so no value exceeds bounds
        let minVal = Infinity, maxVal = -Infinity;
        for (let i = 0; i < this.RESOLUTION; i++) {
            const v = lane.data[i] + lane.offset;
            if (v < minVal) minVal = v;
            if (v > maxVal) maxVal = v;
        }
        if (minVal < lane.min) lane.offset += (lane.min - minVal);
        if (maxVal > lane.max) lane.offset -= (maxVal - lane.max);
    }

    /**
     * Clear automation for a single lane
     */
    clearLane(key) {
        this.lanes.delete(key);
    }

    /**
     * Clear all automation lanes for a strip
     */
    clearStrip(stripType, stripId) {
        const keys = this.getLanesForStrip(stripType, stripId);
        keys.forEach(k => this.lanes.delete(k));
        return keys; // Return cleared keys so UI can update borders
    }

    /**
     * Clear all automation
     */
    clearAll() {
        this.lanes.clear();
    }

    /**
     * Get current 256-step position from sequencer state.
     * Maps 64-step sequencer position to 256 steps.
     * @param {number} currentStep - Current sequencer step (0-63)
     * @param {number} stepFraction - Fractional position within the current step (0.0-1.0)
     * @returns {number} step256 position (0-255)
     */
    static getStep256(currentStep, stepFraction = 0) {
        return Math.floor((currentStep + stepFraction) * 4) % 256;
    }

    /**
     * Get loop fraction from sequencer state
     * @param {number} currentStep - Current sequencer step (0-63)
     * @param {number} stepFraction - Fractional position within step
     * @param {number} totalSteps - Total steps in sequence (default 64)
     * @returns {number} fraction 0.0-1.0
     */
    static getLoopFraction(currentStep, stepFraction = 0, totalSteps = 64) {
        return (currentStep + stepFraction) / totalSteps;
    }

    /**
     * Serialize for save/load
     */
    serialize() {
        const obj = {};
        for (const [key, lane] of this.lanes) {
            obj[key] = {
                data: Array.from(lane.data),
                min: lane.min,
                max: lane.max,
                offset: lane.offset
            };
        }
        return obj;
    }

    /**
     * Deserialize from save data
     */
    deserialize(obj) {
        this.lanes.clear();
        if (!obj) return;
        for (const [key, laneData] of Object.entries(obj)) {
            this.lanes.set(key, {
                data: new Float32Array(laneData.data),
                min: laneData.min,
                max: laneData.max,
                offset: laneData.offset || 0
            });
        }
    }
}
