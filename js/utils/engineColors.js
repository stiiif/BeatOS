// js/utils/engineColors.js
// Unified engine type color mapping for consistent UI across sequencer, mixer, and track controls.

/**
 * Get the engine color for a track based on its type and state.
 * @param {object} track - Track object with .type, .customSample, .buffer
 * @returns {{ text: string, bg: string, border: string, label: string }}
 */
export function getEngineColor(track) {
    if (!track) return COLORS.none;

    if (track.type === 'automation') return COLORS.automation;
    if (track.type === 'simple-drum') return COLORS.drum909;
    if (track.type === 'sampler') return COLORS.sampler;

    // Granular engine
    if (track.customSample) {
        return COLORS.sample;
    }

    if (track.buffer) {
        return COLORS.generated;
    }

    return COLORS.none;
}

/**
 * Check if a track has any active triggers in its step grid.
 */
export function hasTrigs(track) {
    if (!track || !track.steps) return false;
    for (let i = 0; i < track.steps.length; i++) {
        if (track.steps[i] > 0) return true;
    }
    return false;
}

/**
 * Check if a track has an engine assigned (buffer loaded or 909/automation/sampler type).
 */
export function hasEngine(track) {
    if (!track) return false;
    if (track.type === 'simple-drum') return true;
    if (track.type === 'automation') return true;
    if (track.type === 'sampler') return true;
    if (track.buffer) return true;
    return false;
}

const COLORS = {
    drum909:    { text: '#f97316', bg: '#7c2d12', border: '#ea580c', label: '909' },
    sample:     { text: '#38bdf8', bg: '#0c4a6e', border: '#0ea5e9', label: 'SMP' },
    sampler:    { text: '#34d399', bg: '#064e3b', border: '#10b981', label: 'SAM' },
    generated:  { text: '#a3a3a3', bg: '#333333', border: '#737373', label: 'GEN' },
    automation: { text: '#a78bfa', bg: '#4c1d95', border: '#7c3aed', label: 'AUTO' },
    none:       { text: '#525252', bg: '#1a1a1a', border: '#333333', label: '' }
};
