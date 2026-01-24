export class PatternLibrary {
    constructor() {
        // V2 Patterns from drum_patterns_v2_sample.json
        this.patterns = [
            {
                "id": 1,
                "name": "Amen Break",
                "description": "The legendary 4-bar break from 'Amen, Brother' by The Winstons (1969). The most sampled drum break in history, featuring syncopated kick gallops and the iconic double-snare ending. Foundation of jungle, drum and bass, and breakbeat hip-hop.",
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
                        "description": "Syncopated kick with galloping rhythm on beats 3+ and 4+"
                    },
                    {
                        "instrument": "snare",
                        "instrument_type": "snare_drum",
                        "role": "main",
                        "steps": "0000300000003000000030000000000000003000000030000000300000003300",
                        "microtiming": [0, 0, 0, 0, -3, 0, 0, 0, 0, 0, 0, 0, -2, 0, 0, 0, 0, 0, 0, 0, -3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -3, 0, 0, 0, 0, 0, 0, 0, -2, 0, 0, 0, 0, 0, 0, 0, -3, 0, 0, 0, 0, 0, 0, 0, -3, 0, -2, 0],
                        "sample_variation": null,
                        "description": "Main snare with the FAMOUS double-snare ending at steps 60-61"
                    },
                    {
                        "instrument": "snare_ghost",
                        "instrument_type": "snare_drum",
                        "role": "ghost",
                        "steps": "0000001000000001000000100020000000000010000000010000001000000000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": "ghost",
                        "description": "Ghost notes adding texture between main hits"
                    },
                    {
                        "instrument": "closed_hat",
                        "instrument_type": "hi_hat_closed",
                        "role": "main",
                        "steps": "2020202020202020202020202020202020202020202020202020202020202020",
                        "microtiming": [0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2],
                        "sample_variation": null,
                        "description": "16th notes with laid-back microtiming"
                    },
                    {
                        "instrument": "closed_hat_ghost",
                        "instrument_type": "hi_hat_closed",
                        "role": "ghost",
                        "steps": "0101010101010101010101010101010101010101010101010101010101010101",
                        "microtiming": [0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2],
                        "sample_variation": "ghost",
                        "description": "Off-beat ghost hats for shuffle texture"
                    },
                    {
                        "instrument": "crash",
                        "instrument_type": "crash_cymbal",
                        "role": "accent",
                        "steps": "3000000000000000000000000000000030000000000000000000000000000000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Crash accents on bar 1 and bar 3"
                    }
                ]
            },
            {
                "id": 2,
                "name": "Funky Drummer",
                "description": "Clyde Stubblefield's legendary break from James Brown's 'Funky Drummer' (1970). Hip hop's most sampled break after the Amen. Features syncopated ghost notes on snare and the signature 'and-of-2' kick. Pure funk perfection.",
                "genre": "Funk/Hip Hop",
                "bpm_range": "95-105",
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
                        "steps": "3000000000003000300000000000300030000000000030003000000000003000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Signature kick pattern with the 'and-of-2' syncopation"
                    },
                    {
                        "instrument": "snare",
                        "instrument_type": "snare_drum",
                        "role": "main",
                        "steps": "0000300000003000000030000000300000003000000030000000300000003000",
                        "microtiming": [0, 0, 0, 0, -2, 0, 0, 0, 0, 0, 0, 0, -2, 0, 0, 0, 0, 0, 0, 0, -2, 0, 0, 0, 0, 0, 0, 0, -2, 0, 0, 0, 0, 0, 0, 0, -2, 0, 0, 0, 0, 0, 0, 0, -2, 0, 0, 0, 0, 0, 0, 0, -2, 0, 0, 0, 0, 0, 0, 0, -2, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Backbeat on 2 and 4 with slight early timing for punch"
                    },
                    {
                        "instrument": "snare_ghost",
                        "instrument_type": "snare_drum",
                        "role": "ghost",
                        "steps": "0010001001000010001000100100001000100010010000100010001001000010",
                        "microtiming": [0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0],
                        "sample_variation": "ghost",
                        "description": "CRITICAL: Dense ghost note pattern that creates the funky feel"
                    },
                    {
                        "instrument": "closed_hat",
                        "instrument_type": "hi_hat_closed",
                        "role": "main",
                        "steps": "2020202020202020202020202020202020202020202020202020202020202020",
                        "microtiming": [0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3],
                        "sample_variation": null,
                        "description": "16th notes with pronounced swing feel"
                    },
                    {
                        "instrument": "closed_hat_ghost",
                        "instrument_type": "hi_hat_closed",
                        "role": "ghost",
                        "steps": "0101010101010101010101010101010101010101010101010101010101010101",
                        "microtiming": [0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3],
                        "sample_variation": "ghost",
                        "description": "Off-beat ghost hats with swing"
                    },
                    {
                        "instrument": "ride",
                        "instrument_type": "ride_cymbal",
                        "role": "auxiliary",
                        "steps": "0000000030000000000000003000000000000000300000000000000030000000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Occasional ride accents for variation"
                    }
                ]
            },
            {
                "id": 3,
                "name": "Four-on-the-Floor",
                "description": "The foundation of disco, house, and dance music. Kick drum on every quarter note with hi-hats on 8ths/16ths and snare on 2 and 4. Simple, hypnotic, and endlessly effective. Defined by Donna Summer's 'I Feel Love' (1977) and Giorgio Moroder.",
                "genre": "Disco/House/Dance",
                "bpm_range": "115-130",
                "time_signature": "4/4",
                "bars": 2,
                "groove_characteristics": {
                    "swing_amount": 0,
                    "complexity": "simple",
                    "energy": "high",
                    "density": "dense",
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
                        "description": "Relentless quarter note kicks - the signature element"
                    },
                    {
                        "instrument": "snare",
                        "instrument_type": "snare_drum",
                        "role": "main",
                        "steps": "0000300000003000000030000000300000003000000030000000300000003000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Snare (or clap) on 2 and 4 - the backbeat"
                    },
                    {
                        "instrument": "closed_hat",
                        "instrument_type": "hi_hat_closed",
                        "role": "main",
                        "steps": "2020202020202020202020202020202020202020202020202020202020202020",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Straight 16th notes, no swing - mechanical precision"
                    },
                    {
                        "instrument": "closed_hat_ghost",
                        "instrument_type": "hi_hat_closed",
                        "role": "ghost",
                        "steps": "0101010101010101010101010101010101010101010101010101010101010101",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": "ghost",
                        "description": "Off-beat ghost hats for subtle texture"
                    },
                    {
                        "instrument": "open_hat",
                        "instrument_type": "hi_hat_open",
                        "role": "accent",
                        "steps": "0000000030000000000000003000000000000000300000000000000030000000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Open hat on the 'and' of beat 4 for variation"
                    }
                ]
            },
            {
                "id": 4,
                "name": "Boom Bap",
                "description": "The quintessential East Coast hip hop drum pattern. Heavy kick, crisp snare on 2 and 4, continuous hi-hats. Defined 90s hip hop from Pete Rock, DJ Premier, Large Professor. The foundation of golden age hip hop production.",
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
                        "description": "Crisp snare on 2 and 4 with slight early timing for punch"
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
                        "description": "Continuous 16th notes - no swing, straight quantization"
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
                "id": 5,
                "name": "Son Clave 3-2",
                "description": "The rhythmic DNA of Afro-Cuban music. A 2-bar asymmetrical pattern (3 beats in bar 1, 2 in bar 2) that underpins salsa, mambo, and Latin jazz. The clave is the timeline - everything else follows. Foundational to all Latin music.",
                "genre": "Afro-Cuban/Latin",
                "bpm_range": "100-130",
                "time_signature": "4/4",
                "bars": 2,
                "groove_characteristics": {
                    "swing_amount": 0,
                    "complexity": "medium",
                    "energy": "high",
                    "density": "medium",
                    "syncopation_level": "high",
                    "humanization": 15
                },
                "tracks": [
                    {
                        "instrument": "clave",
                        "instrument_type": "clave",
                        "role": "main",
                        "steps": "3000000030000000000030003000000000003000000000000000000000000000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "THE SON CLAVE: 3-2 pattern - steps 0, 8, 22 (bar 1) and 36, 46 (bar 2)"
                    },
                    {
                        "instrument": "kick",
                        "instrument_type": "bass_drum",
                        "role": "main",
                        "steps": "3000300030003000300030003000300030003000300030003000300030003000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Four-on-the-floor kick supporting the clave"
                    },
                    {
                        "instrument": "timbale_high",
                        "instrument_type": "timbale",
                        "role": "main",
                        "steps": "2020202020202020202020202020202020202020202020202020202020202020",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Cascara pattern on timbale shell or cowbell"
                    },
                    {
                        "instrument": "conga_high",
                        "instrument_type": "conga",
                        "role": "main",
                        "steps": "3000200020002000300020002000200030002000200020003000200020002000",
                        "microtiming": [0, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Conga tumbao pattern with accents on downbeats"
                    },
                    {
                        "instrument": "conga_low",
                        "instrument_type": "conga",
                        "role": "main",
                        "steps": "0200020002000200020002000200020002000200020002000200020002000200",
                        "microtiming": [0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0],
                        "sample_variation": null,
                        "description": "Low conga bass tones on the 'and' of each beat"
                    },
                    {
                        "instrument": "cowbell",
                        "instrument_type": "cowbell",
                        "role": "accent",
                        "steps": "3030003000300030303000300030003030300030003000303030003000300030",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Mambo bell or bongo bell pattern"
                    }
                ]
            },
            {
                "id": 6,
                "name": "Detroit Techno",
                "description": "The driving four-on-the-floor with syncopated kick accents and off-beat hi-hat patterns. Defined by Juan Atkins, Derrick May, Kevin Saunderson. Mechanical yet soulful, the sound of Detroit's future. Pure machine funk.",
                "genre": "Techno/Detroit Techno",
                "bpm_range": "125-135",
                "time_signature": "4/4",
                "bars": 2,
                "groove_characteristics": {
                    "swing_amount": 0,
                    "complexity": "medium",
                    "energy": "high",
                    "density": "dense",
                    "syncopation_level": "medium",
                    "humanization": 8
                },
                "tracks": [
                    {
                        "instrument": "kick",
                        "instrument_type": "bass_drum",
                        "role": "main",
                        "steps": "3000300030003030300030003000303030003000300030303000300030003030",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Four-on-the-floor with syncopated 16th note accents"
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
                        "steps": "2222222222222222222222222222222222222222222222222222222222222222",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Continuous 16th notes - mechanical precision"
                    },
                    {
                        "instrument": "open_hat",
                        "instrument_type": "hi_hat_open",
                        "role": "accent",
                        "steps": "0000000030000000000000003000000000000000300000000000000030000000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Open hat accents off-beat"
                    },
                    {
                        "instrument": "perc",
                        "instrument_type": "percussion",
                        "role": "auxiliary",
                        "steps": "0020002000200020002000200020002000200020002000200020002000200020",
                        "microtiming": [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
                        "sample_variation": null,
                        "description": "Percussive element on off-beats for Detroit flavor"
                    }
                ]
            },
            {
                "id": 7,
                "name": "Samba Batucada",
                "description": "Brazilian carnival samba with layered surdo (bass), caixa (snare), and agogo bells. Interlocking polyrhythmic patterns in 2/4 time. The heartbeat of Rio's Carnaval. Pure rhythmic energy and collective groove.",
                "genre": "Brazilian/Samba",
                "bpm_range": "120-140",
                "time_signature": "2/4",
                "bars": 4,
                "groove_characteristics": {
                    "swing_amount": 0,
                    "complexity": "high",
                    "energy": "intense",
                    "density": "dense",
                    "syncopation_level": "high",
                    "humanization": 20
                },
                "tracks": [
                    {
                        "instrument": "surdo_low",
                        "instrument_type": "surdo",
                        "role": "main",
                        "steps": "3000000030000000300000003000000030000000300000003000000030000000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Deep bass drum marking downbeats - the foundation"
                    },
                    {
                        "instrument": "surdo_mid",
                        "instrument_type": "surdo",
                        "role": "main",
                        "steps": "0000300000003000000030000000300000003000000030000000300000003000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Mid surdo on off-beats creating the pulse"
                    },
                    {
                        "instrument": "caixa",
                        "instrument_type": "snare_drum",
                        "role": "main",
                        "steps": "2222222222222222222222222222222222222222222222222222222222222222",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "High-pitched snare rolls - continuous 16th notes"
                    },
                    {
                        "instrument": "caixa_accent",
                        "instrument_type": "snare_drum",
                        "role": "accent",
                        "steps": "3000000030000000300000003000000030000000300000003000000030000000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Accented hits on caixa"
                    },
                    {
                        "instrument": "agogo_high",
                        "instrument_type": "agogo",
                        "role": "main",
                        "steps": "3020302030203020302030203020302030203020302030203020302030203020",
                        "microtiming": [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
                        "sample_variation": null,
                        "description": "High agogo bell pattern"
                    },
                    {
                        "instrument": "agogo_low",
                        "instrument_type": "agogo",
                        "role": "main",
                        "steps": "0203020302030203020302030203020302030203020302030203020302030203",
                        "microtiming": [0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0],
                        "sample_variation": null,
                        "description": "Low agogo bell complementing high bell"
                    },
                    {
                        "instrument": "tamborim",
                        "instrument_type": "tamborim",
                        "role": "auxiliary",
                        "steps": "2112211221122112211221122112211221122112211221122112211221122112",
                        "microtiming": [0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1],
                        "sample_variation": null,
                        "description": "Tamborim rapid-fire pattern"
                    },
                    {
                        "instrument": "shaker",
                        "instrument_type": "shaker",
                        "role": "auxiliary",
                        "steps": "2222222222222222222222222222222222222222222222222222222222222222",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Continuous shaker texture"
                    }
                ]
            },
            {
                "id": 8,
                "name": "Afrobeat",
                "description": "Fela Kuti's revolutionary fusion of Yoruba rhythms, jazz, and funk. Complex interlocking patterns across multiple drums. Characterized by the 'short-short-long' bass pattern and polyrhythmic layering. The sound of political resistance and dance floor liberation.",
                "genre": "Afrobeat/West African",
                "bpm_range": "115-125",
                "time_signature": "4/4",
                "bars": 2,
                "groove_characteristics": {
                    "swing_amount": 5,
                    "complexity": "high",
                    "energy": "high",
                    "density": "dense",
                    "syncopation_level": "high",
                    "humanization": 22
                },
                "tracks": [
                    {
                        "instrument": "kick",
                        "instrument_type": "bass_drum",
                        "role": "main",
                        "steps": "3000003000000000300000300000000030000030000000003000003000000000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Signature 'short-short-long' bass pattern"
                    },
                    {
                        "instrument": "snare",
                        "instrument_type": "snare_drum",
                        "role": "main",
                        "steps": "0000300000003000000030000000300000003000000030000000300000003000",
                        "microtiming": [0, 0, 0, 0, -2, 0, 0, 0, 0, 0, 0, 0, -2, 0, 0, 0, 0, 0, 0, 0, -2, 0, 0, 0, 0, 0, 0, 0, -2, 0, 0, 0, 0, 0, 0, 0, -2, 0, 0, 0, 0, 0, 0, 0, -2, 0, 0, 0, 0, 0, 0, 0, -2, 0, 0, 0, 0, 0, 0, 0, -2, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Backbeat on 2 and 4"
                    },
                    {
                        "instrument": "snare_ghost",
                        "instrument_type": "snare_drum",
                        "role": "ghost",
                        "steps": "0010001000100010001000100010001000100010001000100010001000100010",
                        "microtiming": [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
                        "sample_variation": "ghost",
                        "description": "Ghost notes creating the funky pocket"
                    },
                    {
                        "instrument": "conga_high",
                        "instrument_type": "conga",
                        "role": "main",
                        "steps": "3020302030203020302030203020302030203020302030203020302030203020",
                        "microtiming": [0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0],
                        "sample_variation": null,
                        "description": "High conga pattern with open/slap tones"
                    },
                    {
                        "instrument": "conga_low",
                        "instrument_type": "conga",
                        "role": "main",
                        "steps": "0203020302030203020302030203020302030203020302030203020302030203",
                        "microtiming": [0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0],
                        "sample_variation": null,
                        "description": "Low conga bass tones interlocking"
                    },
                    {
                        "instrument": "closed_hat",
                        "instrument_type": "hi_hat_closed",
                        "role": "main",
                        "steps": "2020202020202020202020202020202020202020202020202020202020202020",
                        "microtiming": [0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2],
                        "sample_variation": null,
                        "description": "16th notes with slight swing"
                    },
                    {
                        "instrument": "bell",
                        "instrument_type": "cowbell",
                        "role": "accent",
                        "steps": "3000001030000010300000103000001030000010300000103000001030000010",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Bell pattern marking phrase structure"
                    },
                    {
                        "instrument": "shekere",
                        "instrument_type": "shaker",
                        "role": "auxiliary",
                        "steps": "2222222222222222222222222222222222222222222222222222222222222222",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Continuous shekere (beaded gourd) texture"
                    }
                ]
            },
            {
                "id": 9,
                "name": "Reggae One Drop",
                "description": "The heartbeat of Jamaica. Kick on 3, rimshot on 1, skank on hi-hat. Defined by Carlton Barrett (Bob Marley & The Wailers). The space between notes is as important as the notes themselves. Meditative, hypnotic, revolutionary.",
                "genre": "Reggae/Jamaican",
                "bpm_range": "70-90",
                "time_signature": "4/4",
                "bars": 2,
                "groove_characteristics": {
                    "swing_amount": 0,
                    "complexity": "simple",
                    "energy": "low",
                    "density": "sparse",
                    "syncopation_level": "low",
                    "humanization": 15
                },
                "tracks": [
                    {
                        "instrument": "kick",
                        "instrument_type": "bass_drum",
                        "role": "main",
                        "steps": "0000000030000000000000003000000000000000300000000000000030000000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "THE ONE DROP: Kick ONLY on beat 3 - this defines the genre"
                    },
                    {
                        "instrument": "snare_rim",
                        "instrument_type": "snare_drum",
                        "role": "accent",
                        "steps": "3000000000000000300000000000000030000000000000003000000000000000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": "rim",
                        "description": "Rimshot on beat 1 - the 'cross-stick' click"
                    },
                    {
                        "instrument": "closed_hat",
                        "instrument_type": "hi_hat_closed",
                        "role": "main",
                        "steps": "0020002000200020002000200020002000200020002000200020002000200020",
                        "microtiming": [0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0],
                        "sample_variation": null,
                        "description": "The 'skank' - hi-hat on off-beats with positive timing (laid-back)"
                    },
                    {
                        "instrument": "snare",
                        "instrument_type": "snare_drum",
                        "role": "main",
                        "steps": "0000000000000000000030000000000000000000000000000000300000000000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Occasional snare for variation (not every bar)"
                    },
                    {
                        "instrument": "rim_ghost",
                        "instrument_type": "snare_drum",
                        "role": "ghost",
                        "steps": "0100010001000100010001000100010001000100010001000100010001000100",
                        "microtiming": [0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0],
                        "sample_variation": "rim",
                        "description": "Ghost rimshots for texture"
                    }
                ]
            },
            {
                "id": 10,
                "name": "UK Garage 2-Step",
                "description": "The syncopated shuffle that defined late 90s UK dance music. Skipping kick pattern (avoiding beat 2), shuffled hi-hats, snare on 2 and 4. Todd Edwards, MJ Cole, Artful Dodger. The sound of South London Sunday sessions.",
                "genre": "UK Garage/2-Step",
                "bpm_range": "130-140",
                "time_signature": "4/4",
                "bars": 2,
                "groove_characteristics": {
                    "swing_amount": 12,
                    "complexity": "high",
                    "energy": "high",
                    "density": "medium",
                    "syncopation_level": "high",
                    "humanization": 15
                },
                "tracks": [
                    {
                        "instrument": "kick",
                        "instrument_type": "bass_drum",
                        "role": "main",
                        "steps": "3000001001000000300000100000001030000010010000003000001000000010",
                        "microtiming": [0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 2, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0],
                        "sample_variation": null,
                        "description": "Syncopated 2-step kick - AVOIDS beat 2, creates the skip"
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
                        "instrument": "snare_ghost",
                        "instrument_type": "snare_drum",
                        "role": "ghost",
                        "steps": "0001000100010001000100010001000100010001000100010001000100010001",
                        "microtiming": [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
                        "sample_variation": "ghost",
                        "description": "Ghost notes on the 'e' of each beat"
                    },
                    {
                        "instrument": "closed_hat",
                        "instrument_type": "hi_hat_closed",
                        "role": "main",
                        "steps": "2020202020202020202020202020202020202020202020202020202020202020",
                        "microtiming": [0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4],
                        "sample_variation": null,
                        "description": "16th notes with HEAVY shuffle/swing feel"
                    },
                    {
                        "instrument": "closed_hat_ghost",
                        "instrument_type": "hi_hat_closed",
                        "role": "ghost",
                        "steps": "0101010101010101010101010101010101010101010101010101010101010101",
                        "microtiming": [0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4],
                        "sample_variation": "ghost",
                        "description": "Off-beat shuffle hats creating the signature garage shuffle"
                    },
                    {
                        "instrument": "perc",
                        "instrument_type": "percussion",
                        "role": "auxiliary",
                        "steps": "0000001000000010000000100000001000000010000000100000001000000010",
                        "microtiming": [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0],
                        "sample_variation": null,
                        "description": "Rim or perc adding syncopated accents"
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