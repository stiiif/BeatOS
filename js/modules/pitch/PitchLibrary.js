// js/modules/pitch/PitchLibrary.js
// Pure data + math for musical pitch, scales, chords. No DOM. AS-portable.

// ═══════════════════════════════════════════════
// SCALES — interval arrays (semitones from root)
// ═══════════════════════════════════════════════
export const SCALES = {
    chromatic:   [0,1,2,3,4,5,6,7,8,9,10,11],
    major:       [0,2,4,5,7,9,11],
    minor:       [0,2,3,5,7,8,10],
    dorian:      [0,2,3,5,7,9,10],
    phrygian:    [0,1,3,5,7,8,10],
    lydian:      [0,2,4,6,7,9,11],
    mixolydian:  [0,2,4,5,7,9,10],
    pentatonic:  [0,2,4,7,9],
    minPent:     [0,3,5,7,10],
    blues:       [0,3,5,6,7,10],
    wholetone:   [0,2,4,6,8,10],
    diminished:  [0,1,3,4,6,7,9,10],
    japanese:    [0,1,5,7,8],
    arabic:      [0,1,4,5,7,8,11],
    hungarian:   [0,2,3,6,7,8,11],
    harmonicMin: [0,2,3,5,7,8,11],
};

export const SCALE_NAMES = {
    chromatic:   'Chromatic',
    major:       'Major',
    minor:       'Minor',
    dorian:      'Dorian',
    phrygian:    'Phrygian',
    lydian:      'Lydian',
    mixolydian:  'Mixolydian',
    pentatonic:  'Maj Pentatonic',
    minPent:     'Min Pentatonic',
    blues:       'Blues',
    wholetone:   'Whole Tone',
    diminished:  'Diminished',
    japanese:    'Japanese',
    arabic:      'Arabic',
    hungarian:   'Hungarian',
    harmonicMin: 'Harmonic Min',
};

export const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

// ═══════════════════════════════════════════════
// CHORDS — interval arrays (semitones from root)
// ═══════════════════════════════════════════════
export const CHORDS = {
    unison:   [0],
    octaves:  [0, 12],
    fifth:    [0, 7],
    major:    [0, 4, 7],
    minor:    [0, 3, 7],
    sus2:     [0, 2, 7],
    sus4:     [0, 5, 7],
    dim:      [0, 3, 6],
    aug:      [0, 4, 8],
    maj7:     [0, 4, 7, 11],
    min7:     [0, 3, 7, 10],
    dom7:     [0, 4, 7, 10],
    add9:     [0, 4, 7, 14],
    min9:     [0, 3, 7, 10, 14],
    stack4:   [0, 5, 10],
    stack5:   [0, 7, 14],
    cluster:  [0, 1, 2],
};

export const CHORD_NAMES = {
    unison:   'Unison',
    octaves:  'Octaves',
    fifth:    'Power 5th',
    major:    'Major',
    minor:    'Minor',
    sus2:     'Sus2',
    sus4:     'Sus4',
    dim:      'Dim',
    aug:      'Aug',
    maj7:     'Maj7',
    min7:     'Min7',
    dom7:     'Dom7',
    add9:     'Add9',
    min9:     'Min9',
    stack4:   'Stack 4th',
    stack5:   'Stack 5th',
    cluster:  'Cluster',
};

export const VOICE_MODES = ['cycle', 'random', 'weighted'];

// ═══════════════════════════════════════════════
// PITCH MATH
// ═══════════════════════════════════════════════

/** Convert semitones + cents to playback ratio */
export function semitonesToRatio(semitones, cents = 0) {
    return Math.pow(2, (semitones + cents / 100) / 12);
}

/** Convert ratio to semitones (for backward compat import) */
export function ratioToSemitones(ratio) {
    if (ratio <= 0) return -24;
    return 12 * Math.log2(ratio);
}

/**
 * Quantize a semitone value to the nearest scale degree.
 * Preserves octave, snaps the within-octave portion.
 */
export function quantizeToScale(semitones, scaleRoot, scaleIntervals) {
    if (!scaleIntervals || scaleIntervals.length === 12) return semitones; // chromatic = no-op
    
    // Position relative to root
    const relative = semitones - scaleRoot;
    const octave = Math.floor(relative / 12);
    let withinOctave = ((relative % 12) + 12) % 12;
    
    // Find nearest degree
    let nearest = scaleIntervals[0];
    let minDist = 12;
    for (const degree of scaleIntervals) {
        const dist = Math.min(
            Math.abs(withinOctave - degree),
            12 - Math.abs(withinOctave - degree)
        );
        if (dist < minDist) {
            minDist = dist;
            nearest = degree;
        }
    }
    
    return scaleRoot + octave * 12 + nearest;
}

/**
 * Apply chord inversion: shift lower notes up by octave.
 * @param {number[]} intervals - chord intervals in semitones
 * @param {number} inversion - 0, 1, 2, 3
 * @returns {number[]} inverted intervals
 */
export function applyInversion(intervals, inversion) {
    if (inversion === 0 || intervals.length <= 1) return intervals;
    const inv = intervals.slice();
    const n = Math.min(inversion, inv.length - 1);
    for (let i = 0; i < n; i++) {
        inv[i] += 12;
    }
    return inv.sort((a, b) => a - b);
}

/**
 * Build the full set of chord pitches for a grain, including spread across octaves.
 * Returns an array of semitone offsets ready to be added to base pitch.
 */
export function buildChordVoicings(chordType, inversion, spread) {
    const base = CHORDS[chordType] || CHORDS.unison;
    const inverted = applyInversion(base, inversion);
    
    if (spread <= 0) return inverted;
    
    // Duplicate chord tones across octave spread
    const voicings = [];
    for (let oct = 0; oct <= spread; oct++) {
        for (const interval of inverted) {
            voicings.push(interval + oct * 12);
        }
    }
    return voicings;
}

/**
 * Pick a chord tone for a grain based on voice mode.
 * @param {number[]} voicings - semitone offsets from buildChordVoicings
 * @param {string} voiceMode - 'cycle', 'random', 'weighted'
 * @param {number} grainIndex - counter for cycle mode
 * @param {function} rng - random function returning 0-1
 * @returns {number} semitone offset
 */
export function pickChordTone(voicings, voiceMode, grainIndex, rng) {
    if (voicings.length <= 1) return voicings[0] || 0;
    
    switch (voiceMode) {
        case 'cycle':
            return voicings[grainIndex % voicings.length];
        case 'weighted':
            // Root 40% likely, others equal
            if (rng() < 0.4) return voicings[0];
            return voicings[Math.floor(rng() * voicings.length)];
        case 'random':
        default:
            return voicings[Math.floor(rng() * voicings.length)];
    }
}

/**
 * Compute the final pitch ratio for a single grain.
 * This is the core function called per-grain in the worklet.
 */
export function computeGrainPitch(params, modPitch, grainIndex, stepIndex, rng) {
    // Base semitones
    let semi = (params.pitchSemi || 0) + modPitch;
    const fine = params.pitchFine || 0;
    
    // Step pitch override
    if (params._stepPitches && params._stepPitches[stepIndex]) {
        // Per-step chord tones are already handled via chord voicings
        // The step pitch overrides the chord type
    }
    
    // Scale quantize
    const scaleType = params.scaleType || 'chromatic';
    if (scaleType !== 'chromatic') {
        const scaleRoot = params.scaleRoot || 0;
        semi = quantizeToScale(semi, scaleRoot, SCALES[scaleType]);
    }
    
    // Chord voicing — pick a chord tone for this grain
    const chordType = params.chordType || 'unison';
    if (chordType !== 'unison') {
        const voicings = buildChordVoicings(
            chordType,
            params.chordInversion || 0,
            params.chordSpread || 0
        );
        const tone = pickChordTone(voicings, params.voiceMode || 'random', grainIndex, rng);
        
        // Quantize chord tone to scale too
        if (scaleType !== 'chromatic') {
            semi += quantizeToScale(tone, 0, SCALES[scaleType]);
        } else {
            semi += tone;
        }
    }
    
    return semitonesToRatio(semi, fine);
}

// Interval name display helpers
const INTERVAL_NAMES = {
    0: 'R', 1: 'm2', 2: 'M2', 3: 'm3', 4: 'M3', 5: 'P4',
    6: 'TT', 7: 'P5', 8: 'm6', 9: 'M6', 10: 'm7', 11: 'M7', 12: 'Oct'
};

export function semitoneToIntervalName(semi) {
    const abs = Math.abs(semi);
    const octaves = Math.floor(abs / 12);
    const rem = abs % 12;
    const name = INTERVAL_NAMES[rem] || `${rem}st`;
    const sign = semi < 0 ? '-' : (semi > 0 ? '+' : '');
    if (octaves > 0 && rem === 0) return `${sign}${octaves}oct`;
    if (octaves > 0) return `${sign}${octaves}oct+${name}`;
    return `${sign}${name}`;
}

export function semitoneToNoteName(semi, root = 0) {
    const noteIdx = ((semi + root) % 12 + 12) % 12;
    return NOTE_NAMES[noteIdx];
}
