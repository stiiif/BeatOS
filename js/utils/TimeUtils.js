/**
 * TimeUtils - Standardized timing conversions for BeatOS.
 * Provides conversions between BPM, PPQ (Ticks), and Audio Samples.
 */

export const PPQ = 192; // Pulses Per Quarter Note - industry standard

export class TimeUtils {
    /**
     * Converts a rhythmic tick (PPQ based) to absolute audio seconds.
     * @param {number} ticks - The number of ticks from the start.
     * @param {number} bpm - Beats per minute.
     * @returns {number} Seconds.
     */
    static ticksToSeconds(ticks, bpm) {
        const secondsPerBeat = 60.0 / bpm;
        const secondsPerTick = secondsPerBeat / PPQ;
        return ticks * secondsPerTick;
    }

    /**
     * Converts milliseconds to ticks based on BPM.
     * Useful for migration from ms-based microtiming.
     */
    static msToTicks(ms, bpm) {
        const secondsPerBeat = 60.0 / bpm;
        const ticksPerSecond = PPQ / secondsPerBeat;
        return (ms / 1000.0) * ticksPerSecond;
    }

    /**
     * Calculates the exact sample count for a given time.
     * @param {number} seconds 
     * @param {number} sampleRate 
     * @returns {number}
     */
    static secondsToSamples(seconds, sampleRate) {
        return Math.floor(seconds * sampleRate);
    }

    /**
     * Gets the duration of a single 16th note in seconds.
     */
    static get16thNoteDuration(bpm) {
        return (60.0 / bpm) / 4.0;
    }
}