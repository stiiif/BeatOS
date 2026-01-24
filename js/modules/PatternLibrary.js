export class PatternLibrary {
    constructor() {
        // V2 Patterns from drum_patterns_v2_sample.json
        this.patterns = [
            {
                "id": 2,
                "name": "Amen Break (CORRECTED)",
                "description": "The legendary 4-bar break from 'Amen, Brother' by The Winstons. Features the iconic syncopated kick pattern with galloping rhythm and the FAMOUS double-snare ending at beat 4 of bar 4 (steps 60-61). Foundation of jungle, drum and bass, and breakbeat hip-hop.",
                "genre": "Jungle/Drum and Bass/Breakbeat",
                "bpm_range": "160-180",
                "time_signature": "4/4",
                "bars": 4,
                "groove_characteristics": {
                    "swing_amount": 0,
                    "complexity": "high",
                    "energy": "high",
                    "density": "medium",
                    "syncopation_level": "high",
                    "humanization": 18
                },
                "tracks": [
                    {
                        "instrument": "kick",
                        "instrument_type": "bass_drum",
                        "role": "main",
                        "steps": "3000000000300030300000003000000030000000003000303000000000300000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 3, 0, 3, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 3, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Syncopated kick with characteristic galloping rhythm - kicks on beat 3+ and 4+ create the driving feel"
                    },
                    {
                        "instrument": "snare",
                        "instrument_type": "snare_drum",
                        "role": "main",
                        "steps": "0000300000003000000030000000000000003000000030000000300000003300",
                        "microtiming": [0, 0, 0, 0, -3, 0, 0, 0, 0, 0, 0, 0, -2, 0, 0, 0, 0, 0, 0, 0, -3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -3, 0, 0, 0, 0, 0, 0, 0, -2, 0, 0, 0, 0, 0, 0, 0, -3, 0, 0, 0, 0, 0, 0, 0, -3, 0, -2, 0],
                        "sample_variation": null,
                        "description": "THE FAMOUS PATTERN: Snare on 2 and 4, with the iconic DOUBLE SNARE at steps 60-61 (beat 4 of bar 4). This double-hit ending defines the Amen Break."
                    },
                    {
                        "instrument": "snare_ghost",
                        "instrument_type": "snare_drum",
                        "role": "ghost",
                        "steps": "0000001000000001000000100020000000000010000000010000001000000000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": "ghost",
                        "description": "Ghost notes adding texture between main snare hits. Note the slightly louder ghost (level 2) at step 28 in bar 2 for variation."
                    },
                    {
                        "instrument": "closed_hat",
                        "instrument_type": "hi_hat_closed",
                        "role": "main",
                        "steps": "2020202020202020202020202020202020202020202020202020202020202020",
                        "microtiming": [0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2],
                        "sample_variation": null,
                        "description": "Straight 16th notes with slight positive microtiming on off-beats creates the characteristic laid-back shuffle feel"
                    },
                    {
                        "instrument": "closed_hat_ghost",
                        "instrument_type": "hi_hat_closed",
                        "role": "ghost",
                        "steps": "0101010101010101010101010101010101010101010101010101010101010101",
                        "microtiming": [0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2],
                        "sample_variation": "ghost",
                        "description": "Off-beat ghost hi-hats creating the shuffle texture that glues the groove together"
                    },
                    {
                        "instrument": "crash",
                        "instrument_type": "crash_cymbal",
                        "role": "accent",
                        "steps": "3000000000000000000000000000000030000000000000000000000000000000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Crash cymbal accents at bar 1 and bar 3 downbeats"
                    }
                ]
            },
            {
                "id": 7,
                "name": "Boom Bap",
                "description": "Classic east coast hip hop boom bap pattern. Characterized by heavy kick and crisp snare on 2 and 4, with continuous hi-hats. The foundation of 90s hip hop production.",
                "genre": "Hip Hop/Boom Bap",
                "bpm_range": "85-95",
                "time_signature": "4/4",
                "bars": 2,
                "groove_characteristics": {
                    "swing_amount": 0,
                    "complexity": "simple",
                    "energy": "medium",
                    "density": "dense",
                    "syncopation_level": "low",
                    "humanization": 12
                },
                "tracks": [
                    {
                        "instrument": "kick",
                        "instrument_type": "bass_drum",
                        "role": "main",
                        "steps": "3000000000300000300000000030000030000000003000003000000000300000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Heavy 808-style kicks with syncopation"
                    },
                    {
                        "instrument": "snare",
                        "instrument_type": "snare_drum",
                        "role": "main",
                        "steps": "0000300000003000000030000000300000003000000030000000300000003000",
                        "microtiming": [0, 0, 0, 0, -2, 0, 0, 0, 0, 0, 0, 0, -2, 0, 0, 0, 0, 0, 0, 0, -2, 0, 0, 0, 0, 0, 0, 0, -2, 0, 0, 0, 0, 0, 0, 0, -2, 0, 0, 0, 0, 0, 0, 0, -2, 0, 0, 0, 0, 0, 0, 0, -2, 0, 0, 0, 0, 0, 0, 0, -2, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Crisp snare on beats 2 and 4 with slight negative timing for punch"
                    },
                    {
                        "instrument": "snare_ghost",
                        "instrument_type": "snare_drum",
                        "role": "ghost",
                        "steps": "0000000010000000000000001000000000000000100000000000000010000000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": "ghost",
                        "description": "Occasional ghost notes for groove texture"
                    },
                    {
                        "instrument": "closed_hat",
                        "instrument_type": "hi_hat_closed",
                        "role": "main",
                        "steps": "2222222222222222222222222222222222222222222222222222222222222222",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Continuous 16th note hi-hats, no swing"
                    },
                    {
                        "instrument": "closed_hat_ghost",
                        "instrument_type": "hi_hat_closed",
                        "role": "ghost",
                        "steps": "0101010101010101010101010101010101010101010101010101010101010101",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": "ghost",
                        "description": "Off-beat ghost hats for subtle texture"
                    }
                ]
            },
            {
                "id": 20,
                "name": "Moombahton",
                "description": "Moombahton reggaeton-house hybrid with characteristic dembow rhythm and electronic production. Dutch house slowed to reggaeton tempo.",
                "genre": "Moombahton",
                "bpm_range": "108-115",
                "time_signature": "4/4",
                "bars": 2,
                "groove_characteristics": {
                    "swing_amount": 0,
                    "complexity": "medium",
                    "energy": "high",
                    "density": "medium",
                    "syncopation_level": "high",
                    "humanization": 8
                },
                "tracks": [
                    {
                        "instrument": "kick",
                        "instrument_type": "bass_drum",
                        "role": "main",
                        "steps": "3000300030003000300030003000300030003000300030003000300030003000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Four-on-the-floor kick pattern"
                    },
                    {
                        "instrument": "snare",
                        "instrument_type": "snare_drum",
                        "role": "main",
                        "steps": "0000300000003000000030000000300000003000000030000000300000003000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Snare on 2 and 4"
                    },
                    {
                        "instrument": "dembow",
                        "instrument_type": "percussion",
                        "role": "main",
                        "steps": "3030003030300030303000303030003030300030303000303030003030300030",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Characteristic dembow/reggaeton rhythm pattern"
                    },
                    {
                        "instrument": "closed_hat",
                        "instrument_type": "hi_hat_closed",
                        "role": "main",
                        "steps": "2020202020202020202020202020202020202020202020202020202020202020",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "16th note hi-hats"
                    },
                    {
                        "instrument": "synth_stab",
                        "instrument_type": "synth",
                        "role": "accent",
                        "steps": "3330033300333003333003330033300333300333003330033330033300333003",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Synth stabs emphasizing the dembow pattern"
                    }
                ]
            },
            {
                "id": 32,
                "name": "Afro House",
                "description": "Afro house with percussive elements, conga patterns, and organic African drum influences mixed with 4/4 house foundation. Rooted in South African and West African rhythms.",
                "genre": "Afro House",
                "bpm_range": "118-124",
                "time_signature": "4/4",
                "bars": 2,
                "groove_characteristics": {
                    "swing_amount": 5,
                    "complexity": "high",
                    "energy": "high",
                    "density": "dense",
                    "syncopation_level": "high",
                    "humanization": 20
                },
                "tracks": [
                    {
                        "instrument": "kick",
                        "instrument_type": "bass_drum",
                        "role": "main",
                        "steps": "3000300030003000300030003000300030003000300030003000300030003000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Four-on-the-floor house kick foundation"
                    },
                    {
                        "instrument": "snare",
                        "instrument_type": "snare_drum",
                        "role": "main",
                        "steps": "0000300000003000000030000000300000003000000030000000300000003000",
                        "microtiming": [0, 0, 0, 0, -1, 0, 0, 0, 0, 0, 0, 0, -1, 0, 0, 0, 0, 0, 0, 0, -1, 0, 0, 0, 0, 0, 0, 0, -1, 0, 0, 0, 0, 0, 0, 0, -1, 0, 0, 0, 0, 0, 0, 0, -1, 0, 0, 0, 0, 0, 0, 0, -1, 0, 0, 0, 0, 0, 0, 0, -1, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Snare on 2 and 4 with slight early timing"
                    },
                    {
                        "instrument": "conga_high",
                        "instrument_type": "conga",
                        "role": "main",
                        "steps": "3020302030203020302030203020302030203020302030203020302030203020",
                        "microtiming": [0, 3, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0],
                        "sample_variation": null,
                        "description": "High conga pattern with African-influenced accents and swing"
                    },
                    {
                        "instrument": "conga_low",
                        "instrument_type": "conga",
                        "role": "main",
                        "steps": "0203020300200203020302030020020302030203002002030203020300200203",
                        "microtiming": [0, 2, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Low conga complementing high conga pattern"
                    },
                    {
                        "instrument": "shaker",
                        "instrument_type": "shaker",
                        "role": "main",
                        "steps": "2222222222222222222222222222222222222222222222222222222222222222",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Continuous shaker for driving rhythm texture"
                    },
                    {
                        "instrument": "closed_hat",
                        "instrument_type": "hi_hat_closed",
                        "role": "main",
                        "steps": "2020202020202020202020202020202020202020202020202020202020202020",
                        "microtiming": [0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2],
                        "sample_variation": null,
                        "description": "Hi-hats with slight swing feel"
                    },
                    {
                        "instrument": "open_hat",
                        "instrument_type": "hi_hat_open",
                        "role": "accent",
                        "steps": "0000000030000000000000003000000000000000300000000000000030000000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Open hat accents on off-beats"
                    }
                ]
            },
            {
                "id": 44,
                "name": "Drumstep",
                "description": "Drumstep combines dubstep bass weight with 170 BPM drum and bass tempo in halftime feel. Heavy kick and snare with space between hits.",
                "genre": "Drumstep",
                "bpm_range": "165-175",
                "time_signature": "4/4",
                "bars": 2,
                "groove_characteristics": {
                    "swing_amount": 0,
                    "complexity": "medium",
                    "energy": "high",
                    "density": "sparse",
                    "syncopation_level": "low",
                    "humanization": 5
                },
                "tracks": [
                    {
                        "instrument": "kick",
                        "instrument_type": "bass_drum",
                        "role": "main",
                        "steps": "3000000000000000300000000000000030000000000000003000000000000000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Heavy halftime kicks - every other beat in DnB tempo"
                    },
                    {
                        "instrument": "snare",
                        "instrument_type": "snare_drum",
                        "role": "main",
                        "steps": "0000000030000000000000003000000000000000300000000000000030000000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, -2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -2, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Heavy snare on the 3 in halftime feel with slight early timing"
                    },
                    {
                        "instrument": "closed_hat",
                        "instrument_type": "hi_hat_closed",
                        "role": "main",
                        "steps": "2020202020202020202020202020202020202020202020202020202020202020",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Straight 16th note hi-hats maintaining DnB tempo feel"
                    },
                    {
                        "instrument": "bass_wobble",
                        "instrument_type": "synth",
                        "role": "main",
                        "steps": "3000300030003000300030003000300030003000300030003000300030003000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Bass wobble pattern maintaining quarter note pulse"
                    }
                ]
            },
            {
                "id": 51,
                "name": "Hardwave",
                "description": "Hard wave dark techno with industrial elements. Heavy kicks, sparse snares, and dark atmospheric percussion. Aggressive and driving.",
                "genre": "Hardwave",
                "bpm_range": "150-160",
                "time_signature": "4/4",
                "bars": 2,
                "groove_characteristics": {
                    "swing_amount": 0,
                    "complexity": "medium",
                    "energy": "intense",
                    "density": "medium",
                    "syncopation_level": "low",
                    "humanization": 5
                },
                "tracks": [
                    {
                        "instrument": "kick",
                        "instrument_type": "bass_drum",
                        "role": "main",
                        "steps": "3000300030003000300030003000300030003000300030003000300030003000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Hard, driving four-on-the-floor kick"
                    },
                    {
                        "instrument": "snare",
                        "instrument_type": "snare_drum",
                        "role": "main",
                        "steps": "0000300000000000000030000000000000003000000000000000300000000000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Sparse snare hits for emphasis"
                    },
                    {
                        "instrument": "closed_hat",
                        "instrument_type": "hi_hat_closed",
                        "role": "main",
                        "steps": "2020202020202020202020202020202020202020202020202020202020202020",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Mechanical 16th note hi-hats"
                    },
                    {
                        "instrument": "industrial_perc",
                        "instrument_type": "percussion",
                        "role": "accent",
                        "steps": "3330033300333003333003330033300333300333003330033330033300333003",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Industrial metallic percussion accents"
                    },
                    {
                        "instrument": "distortion_hit",
                        "instrument_type": "synth",
                        "role": "accent",
                        "steps": "0000000000003000000000000000300000000000000030000000000000003000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Distorted synth hits for dark atmosphere"
                    }
                ]
            },
            {
                "id": 55,
                "name": "Tribal House",
                "description": "Tribal house with heavy focus on layered percussion, congas, bongos, and organic drum sounds. Minimal melodic elements, maximum groove.",
                "genre": "Tribal House",
                "bpm_range": "120-128",
                "time_signature": "4/4",
                "bars": 2,
                "groove_characteristics": {
                    "swing_amount": 8,
                    "complexity": "high",
                    "energy": "high",
                    "density": "dense",
                    "syncopation_level": "high",
                    "humanization": 25
                },
                "tracks": [
                    {
                        "instrument": "kick",
                        "instrument_type": "bass_drum",
                        "role": "main",
                        "steps": "3000300030003000300030003000300030003000300030003000300030003000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Four-on-the-floor foundation"
                    },
                    {
                        "instrument": "conga_high",
                        "instrument_type": "conga",
                        "role": "main",
                        "steps": "3020302030203020302030203020302030203020302030203020302030203020",
                        "microtiming": [0, 4, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0],
                        "sample_variation": null,
                        "description": "High conga with open/slap technique and strong swing"
                    },
                    {
                        "instrument": "conga_low",
                        "instrument_type": "conga",
                        "role": "main",
                        "steps": "0203020300200203020302030020020302030203002002030203020300200203",
                        "microtiming": [0, 3, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Low conga bass tones complementing high conga"
                    },
                    {
                        "instrument": "bongo_high",
                        "instrument_type": "bongo",
                        "role": "main",
                        "steps": "2200220022002200220022002200220022002200220022002200220022002200",
                        "microtiming": [0, 5, 0, 0, 5, 0, 0, 0, 5, 0, 0, 0, 5, 0, 0, 0, 5, 0, 0, 0, 5, 0, 0, 0, 5, 0, 0, 0, 5, 0, 0, 0, 5, 0, 0, 0, 5, 0, 0, 0, 5, 0, 0, 0, 5, 0, 0, 0, 5, 0, 0, 0, 5, 0, 0, 0, 5, 0, 0, 0, 5, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Bongo pattern adding high-frequency texture"
                    },
                    {
                        "instrument": "bongo_high_ghost",
                        "instrument_type": "bongo",
                        "role": "ghost",
                        "steps": "0110011001100110011001100110011001100110011001100110011001100110",
                        "microtiming": [0, 5, 0, 0, 5, 0, 0, 0, 5, 0, 0, 0, 5, 0, 0, 0, 5, 0, 0, 0, 5, 0, 0, 0, 5, 0, 0, 0, 5, 0, 0, 0, 5, 0, 0, 0, 5, 0, 0, 0, 5, 0, 0, 0, 5, 0, 0, 0, 5, 0, 0, 0, 5, 0, 0, 0, 5, 0, 0, 0, 5, 0, 0, 0],
                        "sample_variation": "ghost",
                        "description": "Ghost notes on bongo for textural fill"
                    },
                    {
                        "instrument": "shaker",
                        "instrument_type": "shaker",
                        "role": "main",
                        "steps": "2222222222222222222222222222222222222222222222222222222222222222",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Continuous shaker driving the rhythm"
                    },
                    {
                        "instrument": "cowbell",
                        "instrument_type": "cowbell",
                        "role": "accent",
                        "steps": "3000001030000010300000103000001030000010300000103000001030000010",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Cowbell accents marking phrase structure"
                    },
                    {
                        "instrument": "clap",
                        "instrument_type": "hand_clap",
                        "role": "accent",
                        "steps": "0000300000003000000030000000300000003000000030000000300000003000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Hand claps on 2 and 4"
                    }
                ]
            },
            {
                "id": 63,
                "name": "Downtempo",
                "description": "Chilled downtempo pattern with laid-back groove. Sparse kick and snare, continuous hi-hats, and atmospheric elements. Perfect for lounge and chill-out music.",
                "genre": "Downtempo",
                "bpm_range": "80-100",
                "time_signature": "4/4",
                "bars": 2,
                "groove_characteristics": {
                    "swing_amount": 15,
                    "complexity": "simple",
                    "energy": "low",
                    "density": "sparse",
                    "syncopation_level": "low",
                    "humanization": 30
                },
                "tracks": [
                    {
                        "instrument": "kick",
                        "instrument_type": "bass_drum",
                        "role": "main",
                        "steps": "2000000020000000200000002000000020000000200000002000000020000000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Soft kick on beats 1 and 3 with laid-back timing"
                    },
                    {
                        "instrument": "snare",
                        "instrument_type": "snare_drum",
                        "role": "main",
                        "steps": "0000200000002000000020000000200000002000000020000000200000002000",
                        "microtiming": [0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Soft snare on 2 and 4 with positive microtiming for relaxed feel"
                    },
                    {
                        "instrument": "snare_ghost",
                        "instrument_type": "snare_drum",
                        "role": "ghost",
                        "steps": "0000000100000001000000010000000100000001000000010000000100000001",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": "ghost",
                        "description": "Very subtle ghost notes for texture"
                    },
                    {
                        "instrument": "closed_hat",
                        "instrument_type": "hi_hat_closed",
                        "role": "main",
                        "steps": "2020202020202020202020202020202020202020202020202020202020202020",
                        "microtiming": [0, 6, 0, 6, 0, 6, 0, 6, 0, 6, 0, 6, 0, 6, 0, 6, 0, 6, 0, 6, 0, 6, 0, 6, 0, 6, 0, 6, 0, 6, 0, 6, 0, 6, 0, 6, 0, 6, 0, 6, 0, 6, 0, 6, 0, 6, 0, 6, 0, 6, 0, 6, 0, 6, 0, 6, 0, 6, 0, 6, 0, 6, 0, 6],
                        "sample_variation": null,
                        "description": "Swung hi-hats with significant positive timing offset"
                    },
                    {
                        "instrument": "closed_hat_ghost",
                        "instrument_type": "hi_hat_closed",
                        "role": "ghost",
                        "steps": "0101010101010101010101010101010101010101010101010101010101010101",
                        "microtiming": [0, 6, 0, 6, 0, 6, 0, 6, 0, 6, 0, 6, 0, 6, 0, 6, 0, 6, 0, 6, 0, 6, 0, 6, 0, 6, 0, 6, 0, 6, 0, 6, 0, 6, 0, 6, 0, 6, 0, 6, 0, 6, 0, 6, 0, 6, 0, 6, 0, 6, 0, 6, 0, 6, 0, 6, 0, 6, 0, 6, 0, 6],
                        "sample_variation": "ghost",
                        "description": "Off-beat hi-hat ghosts with swing"
                    },
                    {
                        "instrument": "ride",
                        "instrument_type": "ride_cymbal",
                        "role": "auxiliary",
                        "steps": "0000000000000000000000000000000000000000000000003000000000000000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Occasional ride cymbal for atmosphere"
                    }
                ]
            },
            {
                "id": 73,
                "name": "Acid Techno",
                "description": "Acid techno with 303 bass pattern influence. Driving four-on-the-floor with characteristic Roland TB-303 inspired rhythmic elements.",
                "genre": "Acid Techno",
                "bpm_range": "130-140",
                "time_signature": "4/4",
                "bars": 2,
                "groove_characteristics": {
                    "swing_amount": 0,
                    "complexity": "medium",
                    "energy": "high",
                    "density": "dense",
                    "syncopation_level": "medium",
                    "humanization": 3
                },
                "tracks": [
                    {
                        "instrument": "kick",
                        "instrument_type": "bass_drum",
                        "role": "main",
                        "steps": "3000300030003000300030003000300030003000300030003000300030003000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Relentless four-on-the-floor kick"
                    },
                    {
                        "instrument": "snare",
                        "instrument_type": "snare_drum",
                        "role": "main",
                        "steps": "0000300000003000000030000000300000003000000030000000300000003000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Snare on 2 and 4"
                    },
                    {
                        "instrument": "closed_hat",
                        "instrument_type": "hi_hat_closed",
                        "role": "main",
                        "steps": "2020202020202020202020202020202020202020202020202020202020202020",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Mechanical 16th note hi-hats"
                    },
                    {
                        "instrument": "tb303_accent",
                        "instrument_type": "synth",
                        "role": "accent",
                        "steps": "3020302230203022302030223020302230203022302030223020302230203022",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "303-style accent pattern with characteristic syncopation"
                    },
                    {
                        "instrument": "tb303_slide",
                        "instrument_type": "synth",
                        "role": "auxiliary",
                        "steps": "0000000200000002000000020000000200000002000000020000000200000002",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "303 slide notes adding acid character"
                    },
                    {
                        "instrument": "rim",
                        "instrument_type": "rim_shot",
                        "role": "accent",
                        "steps": "0000001000000010000000100000001000000010000000100000001000000010",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Rim shots adding percussive accents"
                    }
                ]
            },
            {
                "id": 97,
                "name": "Goa Trance",
                "description": "Classic Goa trance with driving 16th note bassline pattern and psychedelic groove. Originated in Goa, India in the late 80s/early 90s.",
                "genre": "Goa Trance",
                "bpm_range": "135-145",
                "time_signature": "4/4",
                "bars": 2,
                "groove_characteristics": {
                    "swing_amount": 0,
                    "complexity": "high",
                    "energy": "intense",
                    "density": "dense",
                    "syncopation_level": "medium",
                    "humanization": 5
                },
                "tracks": [
                    {
                        "instrument": "kick",
                        "instrument_type": "bass_drum",
                        "role": "main",
                        "steps": "3000300030003000300030003000300030003000300030003000300030003000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Powerful four-on-the-floor kick"
                    },
                    {
                        "instrument": "bass_16ths",
                        "instrument_type": "synth",
                        "role": "main",
                        "steps": "2020202020202020202020202020202020202020202020202020202020202020",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Driving 16th note bassline - signature Goa trance element"
                    },
                    {
                        "instrument": "closed_hat",
                        "instrument_type": "hi_hat_closed",
                        "role": "main",
                        "steps": "3333333333333333333333333333333333333333333333333333333333333333",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Continuous loud 16th note hi-hats for intensity"
                    },
                    {
                        "instrument": "synth_lead",
                        "instrument_type": "synth",
                        "role": "accent",
                        "steps": "3003300330033003300330033003300330033003300330033003300330033003",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Psychedelic lead pattern with triplet feel"
                    },
                    {
                        "instrument": "perc_shaker",
                        "instrument_type": "shaker",
                        "role": "auxiliary",
                        "steps": "0220022002200220022002200220022002200220022002200220022002200220",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Shaker pattern for additional texture"
                    }
                ]
            }
        ];
    }

    getPatterns() {
        return this.patterns;
    }

    getPatternById(id) {
        return this.patterns.find(p => p.id === id);
    }

    getPatternsByRegion(region) {
        // V2 patterns might not have 'region' property directly, could filter by description/genre if needed
        // For now, this might return empty unless we add regions to V2 or keep V1
        return this.patterns.filter(p => p.region === region);
    }
}