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
            },
            {
                "id": 11,
                "name": "Apache",
                "description": "The Incredible Bongo Band's iconic break from 'Apache' (1973). Hip hop's third most sampled break after Amen and Funky Drummer. Features the distinctive bongo roll intro and syncopated kick/snare pattern. Foundation of early hip hop and breakdancing culture.",
                "genre": "Breakbeat/Hip Hop",
                "bpm_range": "120-130",
                "time_signature": "4/4",
                "bars": 2,
                "groove_characteristics": {
                    "swing_amount": 0,
                    "complexity": "high",
                    "energy": "high",
                    "density": "medium",
                    "syncopation_level": "high",
                    "humanization": 20
                },
                "tracks": [
                    {
                        "instrument": "kick",
                        "instrument_type": "bass_drum",
                        "role": "main",
                        "steps": "3000000000300030300000000030003030000000003000303000000000300030",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 3, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 3, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 3, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 3, 0],
                        "sample_variation": null,
                        "description": "Syncopated kick with galloping feel, similar to Amen but with different placement"
                    },
                    {
                        "instrument": "snare",
                        "instrument_type": "snare_drum",
                        "role": "main",
                        "steps": "0000300000003000000030003000000000003000000030000000300030000000",
                        "microtiming": [0, 0, 0, 0, -3, 0, 0, 0, 0, 0, 0, 0, -2, 0, 0, 0, 0, 0, 0, 0, -3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -3, 0, 0, 0, 0, 0, 0, 0, -2, 0, 0, 0, 0, 0, 0, 0, -3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Distinctive snare pattern with syncopation on beat 3"
                    },
                    {
                        "instrument": "bongo_high",
                        "instrument_type": "bongo",
                        "role": "main",
                        "steps": "0000000000000000000000000000000030203020302030203020302030203020",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 1, 0, 2, 0, 1, 0, 2, 0, 1, 0, 2, 0, 1, 0, 2, 0, 1, 0, 2, 0, 1, 0, 2, 0, 1, 0, 2, 0, 1, 0],
                        "sample_variation": null,
                        "description": "SIGNATURE: The famous bongo roll that starts in bar 2"
                    },
                    {
                        "instrument": "bongo_low",
                        "instrument_type": "bongo",
                        "role": "main",
                        "steps": "0000000000000000000000000000000002030203020302030203020302030203",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 2, 0, 1, 0, 2, 0, 1, 0, 2, 0, 1, 0, 2, 0, 1, 0, 2, 0, 1, 0, 2, 0, 1, 0, 2, 0, 1, 0, 2, 0],
                        "sample_variation": null,
                        "description": "Low bongo complementing high bongo in the roll"
                    },
                    {
                        "instrument": "closed_hat",
                        "instrument_type": "hi_hat_closed",
                        "role": "main",
                        "steps": "2020202020202020202020202020202020202020202020202020202020202020",
                        "microtiming": [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
                        "sample_variation": null,
                        "description": "16th notes with subtle groove"
                    },
                    {
                        "instrument": "cowbell",
                        "instrument_type": "cowbell",
                        "role": "accent",
                        "steps": "3000000000000000000000000000000000000000000000000000000000000000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Cowbell accent on downbeat"
                    }
                ]
            },
            {
                "id": 12,
                "name": "Trap",
                "description": "Modern trap rhythm defined by 808 kicks, rapid hi-hat rolls, and sparse snares. Originated in Atlanta with producers like Shawty Redd, Lex Luger, Metro Boomin. The sound of contemporary hip hop - heavy 808s, triplet hi-hats, and plenty of space.",
                "genre": "Trap/Hip Hop",
                "bpm_range": "130-160",
                "time_signature": "4/4",
                "bars": 2,
                "groove_characteristics": {
                    "swing_amount": 0,
                    "complexity": "medium",
                    "energy": "high",
                    "density": "medium",
                    "syncopation_level": "high",
                    "humanization": 5
                },
                "tracks": [
                    {
                        "instrument": "kick_808",
                        "instrument_type": "bass_drum",
                        "role": "main",
                        "steps": "3000000000003000300000000000300030000000000030003000000000003000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Deep 808 bass kick with long decay - syncopated pattern"
                    },
                    {
                        "instrument": "snare",
                        "instrument_type": "snare_drum",
                        "role": "main",
                        "steps": "0000300000000000000030000000000000003000000000000000300000000000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Sparse snare on 2 and 4 - leaving space for the beat"
                    },
                    {
                        "instrument": "closed_hat",
                        "instrument_type": "hi_hat_closed",
                        "role": "main",
                        "steps": "2222222222222222222222222222222222222222222222222222222222222222",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Constant 16th note hi-hats - foundation layer"
                    },
                    {
                        "instrument": "closed_hat_roll",
                        "instrument_type": "hi_hat_closed",
                        "role": "accent",
                        "steps": "0000000000000000000000000000333300000000000000000000000000003333",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "SIGNATURE: Rapid hi-hat rolls (32nd notes) at end of phrases"
                    },
                    {
                        "instrument": "open_hat",
                        "instrument_type": "hi_hat_open",
                        "role": "accent",
                        "steps": "0000000030000000000000003000000000000000300000000000000030000000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Open hat accents for variation"
                    }
                ]
            },
            {
                "id": 13,
                "name": "Bossa Nova",
                "description": "João Gilberto's revolutionary Brazilian rhythm that changed music forever. Samba meets jazz with a gentle touch. Syncopated surdo pattern, subtle cross-stick, rim clicks. The sound of Ipanema beaches and Antonio Carlos Jobim compositions.",
                "genre": "Brazilian/Bossa Nova",
                "bpm_range": "110-140",
                "time_signature": "4/4",
                "bars": 2,
                "groove_characteristics": {
                    "swing_amount": 0,
                    "complexity": "high",
                    "energy": "low",
                    "density": "medium",
                    "syncopation_level": "high",
                    "humanization": 25
                },
                "tracks": [
                    {
                        "instrument": "surdo",
                        "instrument_type": "surdo",
                        "role": "main",
                        "steps": "3000000030000000300000003000000030000000300000003000000030000000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Syncopated bass drum pattern - the bossa foundation"
                    },
                    {
                        "instrument": "rim_cross",
                        "instrument_type": "snare_drum",
                        "role": "main",
                        "steps": "0000200000002000000020000000200000002000000020000000200000002000",
                        "microtiming": [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
                        "sample_variation": "rim",
                        "description": "Cross-stick on 2 and 4 - gentle backbeat"
                    },
                    {
                        "instrument": "rim_ghost",
                        "instrument_type": "snare_drum",
                        "role": "ghost",
                        "steps": "0100000001000000010000000100000001000000010000000100000001000000",
                        "microtiming": [0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0],
                        "sample_variation": "rim",
                        "description": "Subtle rim clicks on off-beats"
                    },
                    {
                        "instrument": "ride",
                        "instrument_type": "ride_cymbal",
                        "role": "main",
                        "steps": "2020202020202020202020202020202020202020202020202020202020202020",
                        "microtiming": [0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2],
                        "sample_variation": null,
                        "description": "Ride cymbal with jazz feel"
                    },
                    {
                        "instrument": "brush_sweep",
                        "instrument_type": "snare_drum",
                        "role": "auxiliary",
                        "steps": "1111111111111111111111111111111111111111111111111111111111111111",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": "ghost",
                        "description": "Continuous brush sweeps on snare for texture"
                    }
                ]
            },
            {
                "id": 14,
                "name": "Neurofunk DnB",
                "description": "Complex, technical drum and bass with intricate snare patterns and syncopated kicks. Defined by producers like Noisia, Phace, Mefjus. 170 BPM precision programming with polyrhythmic layering and aggressive energy.",
                "genre": "Drum and Bass/Neurofunk",
                "bpm_range": "170-175",
                "time_signature": "4/4",
                "bars": 2,
                "groove_characteristics": {
                    "swing_amount": 0,
                    "complexity": "expert",
                    "energy": "intense",
                    "density": "dense",
                    "syncopation_level": "high",
                    "humanization": 8
                },
                "tracks": [
                    {
                        "instrument": "kick",
                        "instrument_type": "bass_drum",
                        "role": "main",
                        "steps": "3000000030300000300000003030000030000000303000003000000030300000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Complex syncopated kick pattern with double hits"
                    },
                    {
                        "instrument": "snare",
                        "instrument_type": "snare_drum",
                        "role": "main",
                        "steps": "0000300030003000000030003000300000003000300030000000300030003000",
                        "microtiming": [0, 0, 0, 0, -1, 0, 0, 0, -1, 0, 0, 0, -1, 0, 0, 0, 0, 0, 0, 0, -1, 0, 0, 0, -1, 0, 0, 0, -1, 0, 0, 0, 0, 0, 0, 0, -1, 0, 0, 0, -1, 0, 0, 0, -1, 0, 0, 0, 0, 0, 0, 0, -1, 0, 0, 0, -1, 0, 0, 0, -1, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Intricate snare pattern with polyrhythmic accents"
                    },
                    {
                        "instrument": "snare_ghost",
                        "instrument_type": "snare_drum",
                        "role": "ghost",
                        "steps": "0001000100010001000100010001000100010001000100010001000100010001",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": "ghost",
                        "description": "16th note ghost pattern filling gaps"
                    },
                    {
                        "instrument": "closed_hat",
                        "instrument_type": "hi_hat_closed",
                        "role": "main",
                        "steps": "2222222222222222222222222222222222222222222222222222222222222222",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Straight 16th notes - DnB hi-hat foundation"
                    },
                    {
                        "instrument": "perc_high",
                        "instrument_type": "percussion",
                        "role": "accent",
                        "steps": "0020002000200020002000200020002000200020002000200020002000200020",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "High percussion accents on off-beats"
                    }
                ]
            },
            {
                "id": 15,
                "name": "Cumbia",
                "description": "Colombian cumbia rhythm with characteristic guacharaca scraper and tambora drum. The folkloric foundation that spread across Latin America. Circular, hypnotic 2/4 pattern with African and indigenous roots.",
                "genre": "Colombian/Cumbia",
                "bpm_range": "90-110",
                "time_signature": "2/4",
                "bars": 4,
                "groove_characteristics": {
                    "swing_amount": 0,
                    "complexity": "medium",
                    "energy": "medium",
                    "density": "medium",
                    "syncopation_level": "medium",
                    "humanization": 20
                },
                "tracks": [
                    {
                        "instrument": "tambora_low",
                        "instrument_type": "tambora",
                        "role": "main",
                        "steps": "3000000030000000300000003000000030000000300000003000000030000000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Deep tambora bass hits on downbeats"
                    },
                    {
                        "instrument": "tambora_high",
                        "instrument_type": "tambora",
                        "role": "main",
                        "steps": "0000200000002000000020000000200000002000000020000000200000002000",
                        "microtiming": [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
                        "sample_variation": null,
                        "description": "High tambora slap on off-beats"
                    },
                    {
                        "instrument": "guacharaca",
                        "instrument_type": "guacharaca",
                        "role": "main",
                        "steps": "2222222222222222222222222222222222222222222222222222222222222222",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "SIGNATURE: Continuous guacharaca scraper - the cumbia texture"
                    },
                    {
                        "instrument": "guacharaca_accent",
                        "instrument_type": "guacharaca",
                        "role": "accent",
                        "steps": "3000000030000000300000003000000030000000300000003000000030000000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Accented guacharaca scrapes on downbeats"
                    },
                    {
                        "instrument": "conga",
                        "instrument_type": "conga",
                        "role": "auxiliary",
                        "steps": "0020002000200020002000200020002000200020002000200020002000200020",
                        "microtiming": [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
                        "sample_variation": null,
                        "description": "Conga adding rhythmic texture"
                    },
                    {
                        "instrument": "cowbell",
                        "instrument_type": "cowbell",
                        "role": "accent",
                        "steps": "3030003030300030303000303030003030300030303000303030003030300030",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Cowbell pattern for rhythmic punctuation"
                    }
                ]
            },
            {
                "id": 16,
                "name": "Purdie Shuffle",
                "description": "Bernard 'Pretty' Purdie's legendary half-time shuffle with ghost notes. The most famous shuffle in music - featured on Steely Dan's 'Home At Last' and countless sessions. The groove that made Purdie the most recorded drummer in history.",
                "genre": "Funk/Shuffle",
                "bpm_range": "85-95",
                "time_signature": "4/4",
                "bars": 2,
                "groove_characteristics": {
                    "swing_amount": 16,
                    "complexity": "high",
                    "energy": "medium",
                    "density": "dense",
                    "syncopation_level": "medium",
                    "humanization": 30
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
                        "steps": "0110011001100110011001100110011001100110011001100110011001100110",
                        "microtiming": [0, 2, 2, 0, 0, 2, 2, 0, 0, 2, 2, 0, 0, 2, 2, 0, 0, 2, 2, 0, 0, 2, 2, 0, 0, 2, 2, 0, 0, 2, 2, 0, 0, 2, 2, 0, 0, 2, 2, 0, 0, 2, 2, 0, 0, 2, 2, 0, 0, 2, 2, 0, 0, 2, 2, 0, 0, 2, 2, 0, 0, 2, 2, 0],
                        "sample_variation": "ghost",
                        "description": "SIGNATURE: The triplet ghost notes that create the shuffle feel"
                    },
                    {
                        "instrument": "closed_hat",
                        "instrument_type": "hi_hat_closed",
                        "role": "main",
                        "steps": "2020202020202020202020202020202020202020202020202020202020202020",
                        "microtiming": [0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5],
                        "sample_variation": null,
                        "description": "16th notes with pronounced shuffle timing"
                    },
                    {
                        "instrument": "closed_hat_ghost",
                        "instrument_type": "hi_hat_closed",
                        "role": "ghost",
                        "steps": "0101010101010101010101010101010101010101010101010101010101010101",
                        "microtiming": [0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5],
                        "sample_variation": "ghost",
                        "description": "Off-beat hi-hat ghosts with heavy shuffle"
                    }
                ]
            },
            {
                "id": 17,
                "name": "Dubstep Halftime",
                "description": "Classic dubstep with wobble bass and sparse halftime drums. Kick on 1, snare on 3, creating massive space. Defined by producers like Benga, Skream, Digital Mystikz. 140 BPM that feels like 70 - the wobble is the rhythm.",
                "genre": "Dubstep",
                "bpm_range": "138-142",
                "time_signature": "4/4",
                "bars": 2,
                "groove_characteristics": {
                    "swing_amount": 0,
                    "complexity": "simple",
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
                        "steps": "3000000000000000000000000000000030000000000000000000000000000000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Heavy kick on beat 1 only - halftime feel"
                    },
                    {
                        "instrument": "snare",
                        "instrument_type": "snare_drum",
                        "role": "main",
                        "steps": "0000000030000000000000000000000000000000300000000000000000000000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, -2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Snare on beat 3 - the signature dubstep placement"
                    },
                    {
                        "instrument": "closed_hat",
                        "instrument_type": "hi_hat_closed",
                        "role": "main",
                        "steps": "2020202020202020202020202020202020202020202020202020202020202020",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Straight 16th notes maintaining 140 BPM feel"
                    },
                    {
                        "instrument": "perc_triplet",
                        "instrument_type": "percussion",
                        "role": "accent",
                        "steps": "0000000000000000000000003330000000000000000000000000000033300000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Triplet percussion fills before snare"
                    },
                    {
                        "instrument": "sub_kick",
                        "instrument_type": "bass_drum",
                        "role": "accent",
                        "steps": "0000003000000030000000300000003000000030000000300000003000000030",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Sub-bass kicks syncing with wobble bass rhythm"
                    }
                ]
            },
            {
                "id": 18,
                "name": "Kuku (Ewe)",
                "description": "West African Ewe rhythm from Ghana. Complex 12/8 polyrhythmic pattern with bell timeline. The master drum (kidi) responds to the lead drum (sogo). Foundation of West African drumming traditions.",
                "genre": "West African/Ewe",
                "bpm_range": "110-130",
                "time_signature": "12/8",
                "bars": 2,
                "groove_characteristics": {
                    "swing_amount": 0,
                    "complexity": "expert",
                    "energy": "high",
                    "density": "dense",
                    "syncopation_level": "high",
                    "humanization": 25
                },
                "tracks": [
                    {
                        "instrument": "gankogui",
                        "instrument_type": "bell",
                        "role": "main",
                        "steps": "3000300030003000300030003000300030003000300030003000300030003000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Double bell timeline - the rhythmic anchor (in 12/8 feel)"
                    },
                    {
                        "instrument": "kidi",
                        "instrument_type": "drum",
                        "role": "main",
                        "steps": "3020302030203020302030203020302030203020302030203020302030203020",
                        "microtiming": [0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0],
                        "sample_variation": null,
                        "description": "Kidi (master drum) interlocking pattern"
                    },
                    {
                        "instrument": "sogo",
                        "instrument_type": "drum",
                        "role": "main",
                        "steps": "0203020302030203020302030203020302030203020302030203020302030203",
                        "microtiming": [0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0],
                        "sample_variation": null,
                        "description": "Sogo (lead drum) response pattern"
                    },
                    {
                        "instrument": "kaganu",
                        "instrument_type": "drum",
                        "role": "main",
                        "steps": "2222222222222222222222222222222222222222222222222222222222222222",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Kaganu (small drum) maintains constant pulse"
                    },
                    {
                        "instrument": "axatse",
                        "instrument_type": "shaker",
                        "role": "auxiliary",
                        "steps": "3030303030303030303030303030303030303030303030303030303030303030",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Axatse (gourd rattle) provides driving pulse"
                    }
                ]
            },
            {
                "id": 19,
                "name": "Liquid DnB",
                "description": "Smooth, soulful drum and bass with jazz influences. Syncopated breaks with musical phrasing. Defined by producers like Calibre, Marcus Intalex, Logistics. 170 BPM that breathes - the gentle side of jungle.",
                "genre": "Drum and Bass/Liquid",
                "bpm_range": "170-175",
                "time_signature": "4/4",
                "bars": 2,
                "groove_characteristics": {
                    "swing_amount": 5,
                    "complexity": "high",
                    "energy": "medium",
                    "density": "medium",
                    "syncopation_level": "high",
                    "humanization": 18
                },
                "tracks": [
                    {
                        "instrument": "kick",
                        "instrument_type": "bass_drum",
                        "role": "main",
                        "steps": "3000000000300000300000000000300030000000003000003000000000000030",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Musical kick pattern with breathing space"
                    },
                    {
                        "instrument": "snare",
                        "instrument_type": "snare_drum",
                        "role": "main",
                        "steps": "0000300000003000000030000000000000003000000030000000300000000030",
                        "microtiming": [0, 0, 0, 0, -2, 0, 0, 0, 0, 0, 0, 0, -2, 0, 0, 0, 0, 0, 0, 0, -2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -2, 0, 0, 0, 0, 0, 0, 0, -2, 0, 0, 0, 0, 0, 0, 0, -2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Jazzy snare placement with musical phrasing"
                    },
                    {
                        "instrument": "snare_ghost",
                        "instrument_type": "snare_drum",
                        "role": "ghost",
                        "steps": "0000000100000001000000010000000000000001000000010000000100000001",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": "ghost",
                        "description": "Subtle ghost notes for texture"
                    },
                    {
                        "instrument": "closed_hat",
                        "instrument_type": "hi_hat_closed",
                        "role": "main",
                        "steps": "2020202020202020202020202020202020202020202020202020202020202020",
                        "microtiming": [0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2],
                        "sample_variation": null,
                        "description": "16ths with gentle swing feel"
                    },
                    {
                        "instrument": "ride",
                        "instrument_type": "ride_cymbal",
                        "role": "auxiliary",
                        "steps": "0000000000000000000000000000000030000000000000000000000000000000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Occasional ride cymbal for musicality"
                    }
                ]
            },
            {
                "id": 20,
                "name": "Trance Uplift",
                "description": "Uplifting trance with rolling bassline and driving energy. Four-on-the-floor with open hat builds and percussive rides. Defined by producers like Armin van Buuren, Above & Beyond, Ferry Corsten. 138 BPM euphoria.",
                "genre": "Trance/Uplifting Trance",
                "bpm_range": "136-140",
                "time_signature": "4/4",
                "bars": 2,
                "groove_characteristics": {
                    "swing_amount": 0,
                    "complexity": "simple",
                    "energy": "intense",
                    "density": "dense",
                    "syncopation_level": "low",
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
                        "description": "Powerful four-on-the-floor - relentless energy"
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
                        "description": "Continuous 16th note hi-hats"
                    },
                    {
                        "instrument": "open_hat",
                        "instrument_type": "hi_hat_open",
                        "role": "accent",
                        "steps": "0000000030000000000000003000000000000000300000000000000030000000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Open hat on the 'and' of 4 for lift"
                    },
                    {
                        "instrument": "ride",
                        "instrument_type": "ride_cymbal",
                        "role": "accent",
                        "steps": "3000000030000000300000003000000030000000300000003000000030000000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Ride cymbal marking downbeats for build"
                    },
                    {
                        "instrument": "bass_roll",
                        "instrument_type": "synth",
                        "role": "accent",
                        "steps": "0020002000200020002000200020002000200020002000200020002000200020",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Rolling bassline on off-beats - trance signature"
                    }
                ]
            },
            {
                "id": 21,
                "name": "Gahu",
                "description": "Ghanaian Ewe recreational dance rhythm in 4/4. Features the iconic bell pattern (gankogui) and interlocking drum parts. Faster and more driving than Kuku. The foundation of West African social dance.",
                "genre": "West African/Ghanaian",
                "bpm_range": "130-150",
                "time_signature": "4/4",
                "bars": 2,
                "groove_characteristics": {
                    "swing_amount": 0,
                    "complexity": "high",
                    "energy": "intense",
                    "density": "dense",
                    "syncopation_level": "high",
                    "humanization": 22
                },
                "tracks": [
                    {
                        "instrument": "gankogui",
                        "instrument_type": "bell",
                        "role": "main",
                        "steps": "3000300030300030300030003030003030003000303000303000300030300030",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Gankogui bell timeline - asymmetric pattern that defines gahu"
                    },
                    {
                        "instrument": "kidi",
                        "instrument_type": "drum",
                        "role": "main",
                        "steps": "3020302030203020302030203020302030203020302030203020302030203020",
                        "microtiming": [0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0],
                        "sample_variation": null,
                        "description": "Kidi drum with open/bass alternation"
                    },
                    {
                        "instrument": "sogo",
                        "instrument_type": "drum",
                        "role": "main",
                        "steps": "0203020302030203020302030203020302030203020302030203020302030203",
                        "microtiming": [0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0],
                        "sample_variation": null,
                        "description": "Sogo lead drum interlocking pattern"
                    },
                    {
                        "instrument": "kagan",
                        "instrument_type": "drum",
                        "role": "main",
                        "steps": "2222222222222222222222222222222222222222222222222222222222222222",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Kagan maintaining constant pulse"
                    },
                    {
                        "instrument": "totodzi",
                        "instrument_type": "drum",
                        "role": "accent",
                        "steps": "3000000030000000300000003000000030000000300000003000000030000000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Totodzi bass drum accents"
                    },
                    {
                        "instrument": "axatse",
                        "instrument_type": "shaker",
                        "role": "auxiliary",
                        "steps": "3030303030303030303030303030303030303030303030303030303030303030",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Axatse driving the rhythm forward"
                    }
                ]
            },
            {
                "id": 22,
                "name": "Soukous",
                "description": "Congolese dance rhythm with rolling conga patterns and syncopated kicks. The sound of Kinshasa and Brazzaville - infectious polyrhythmic dance music. Defined by Franco, Tabu Ley, Koffi Olomidé.",
                "genre": "African/Congolese",
                "bpm_range": "125-135",
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
                        "steps": "3000003000300000300000300030000030000030003000003000003000300000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Syncopated kick with Congolese feel"
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
                        "instrument": "conga_high",
                        "instrument_type": "conga",
                        "role": "main",
                        "steps": "3020302030203020302030203020302030203020302030203020302030203020",
                        "microtiming": [0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0],
                        "sample_variation": null,
                        "description": "High conga rolls - signature soukous texture"
                    },
                    {
                        "instrument": "conga_low",
                        "instrument_type": "conga",
                        "role": "main",
                        "steps": "0203020302030203020302030203020302030203020302030203020302030203",
                        "microtiming": [0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0],
                        "sample_variation": null,
                        "description": "Low conga bass tones interlocking"
                    },
                    {
                        "instrument": "shaker",
                        "instrument_type": "shaker",
                        "role": "main",
                        "steps": "2222222222222222222222222222222222222222222222222222222222222222",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Continuous shaker driving forward"
                    },
                    {
                        "instrument": "closed_hat",
                        "instrument_type": "hi_hat_closed",
                        "role": "main",
                        "steps": "2020202020202020202020202020202020202020202020202020202020202020",
                        "microtiming": [0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3],
                        "sample_variation": null,
                        "description": "Hi-hats with African swing"
                    },
                    {
                        "instrument": "cowbell",
                        "instrument_type": "cowbell",
                        "role": "accent",
                        "steps": "3000001030000010300000103000001030000010300000103000001030000010",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Cowbell accents marking phrases"
                    }
                ]
            },
            {
                "id": 23,
                "name": "Hardstyle",
                "description": "Dutch hard dance with reverse bass and distorted kicks at 150 BPM. The signature 'reverse bass' where the kick has a pitched tail. Defined by Headhunterz, Wildstylez, Noisecontrollers. Euphoric melody meets brutally hard kicks.",
                "genre": "Hardstyle",
                "bpm_range": "148-152",
                "time_signature": "4/4",
                "bars": 2,
                "groove_characteristics": {
                    "swing_amount": 0,
                    "complexity": "simple",
                    "energy": "intense",
                    "density": "medium",
                    "syncopation_level": "low",
                    "humanization": 2
                },
                "tracks": [
                    {
                        "instrument": "kick_reverse",
                        "instrument_type": "bass_drum",
                        "role": "main",
                        "steps": "3000300030003000300030003000300030003000300030003000300030003000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "SIGNATURE: Reverse bass kick on every quarter note - hardstyle foundation"
                    },
                    {
                        "instrument": "snare",
                        "instrument_type": "snare_drum",
                        "role": "main",
                        "steps": "0000300000003000000030000000300000003000000030000000300000003000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Clap/snare on 2 and 4"
                    },
                    {
                        "instrument": "closed_hat",
                        "instrument_type": "hi_hat_closed",
                        "role": "main",
                        "steps": "2020202020202020202020202020202020202020202020202020202020202020",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Offbeat hi-hats - mechanical precision"
                    },
                    {
                        "instrument": "perc_triplet",
                        "instrument_type": "percussion",
                        "role": "accent",
                        "steps": "0000000000000000000000000000333300000000000000000000000000003333",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Triplet roll-ins before drops"
                    }
                ]
            },
            {
                "id": 24,
                "name": "Future Bass",
                "description": "Modern future bass with syncopated kicks, vocal chops, and supersaws. Characterized by detuned synth chords and playful drum patterns. Defined by Flume, Illenium, San Holo. Emotional and melodic with heavy sidechain.",
                "genre": "Future Bass/EDM",
                "bpm_range": "140-160",
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
                        "steps": "3000000030300000300000003030000030000000303000003000000030300000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Syncopated kick pattern with double hits"
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
                        "description": "Continuous 16th note hi-hats"
                    },
                    {
                        "instrument": "perc_808",
                        "instrument_type": "percussion",
                        "role": "accent",
                        "steps": "0020002000200020002000200020002000200020002000200020002000200020",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "808 percussion accents on off-beats"
                    },
                    {
                        "instrument": "vocal_chop",
                        "instrument_type": "synth",
                        "role": "accent",
                        "steps": "0000000000000000000000000000000030003000300030003000300030003000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "SIGNATURE: Vocal chop rhythm in second bar"
                    }
                ]
            },
            {
                "id": 25,
                "name": "Jungle Classic",
                "description": "Classic jungle with chopped Amen breaks and reggae bassline influence. 170 BPM with aggressive breakbeat edits. Defined by Shy FX, Remarc, DJ Hype. The original sound of UK jungle - raw, dark, and relentless.",
                "genre": "Jungle",
                "bpm_range": "165-175",
                "time_signature": "4/4",
                "bars": 2,
                "groove_characteristics": {
                    "swing_amount": 0,
                    "complexity": "expert",
                    "energy": "intense",
                    "density": "dense",
                    "syncopation_level": "high",
                    "humanization": 15
                },
                "tracks": [
                    {
                        "instrument": "kick",
                        "instrument_type": "bass_drum",
                        "role": "main",
                        "steps": "3000000030300030300000003030003030000000303000303000000030300030",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 3, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 3, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 3, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 3, 0],
                        "sample_variation": null,
                        "description": "Heavily syncopated jungle kick pattern with rapid fire"
                    },
                    {
                        "instrument": "snare",
                        "instrument_type": "snare_drum",
                        "role": "main",
                        "steps": "0000300030003000000030003000300000003000300030000000300030003000",
                        "microtiming": [0, 0, 0, 0, -3, 0, 0, 0, -2, 0, 0, 0, -3, 0, 0, 0, 0, 0, 0, 0, -3, 0, 0, 0, -2, 0, 0, 0, -3, 0, 0, 0, 0, 0, 0, 0, -3, 0, 0, 0, -2, 0, 0, 0, -3, 0, 0, 0, 0, 0, 0, 0, -3, 0, 0, 0, -2, 0, 0, 0, -3, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Chopped breakbeat snare - aggressive and syncopated"
                    },
                    {
                        "instrument": "snare_ghost",
                        "instrument_type": "snare_drum",
                        "role": "ghost",
                        "steps": "0001000100010001000100010001000100010001000100010001000100010001",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": "ghost",
                        "description": "Ghost notes filling gaps"
                    },
                    {
                        "instrument": "closed_hat",
                        "instrument_type": "hi_hat_closed",
                        "role": "main",
                        "steps": "2222222222222222222222222222222222222222222222222222222222222222",
                        "microtiming": [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
                        "sample_variation": null,
                        "description": "Straight 16ths with subtle groove"
                    },
                    {
                        "instrument": "reese_bass",
                        "instrument_type": "synth",
                        "role": "main",
                        "steps": "3000000000000000300000000000000030000000000000003000000000000000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Reese bassline syncing with kick pattern"
                    }
                ]
            },
            {
                "id": 26,
                "name": "Tech House",
                "description": "Minimal tech house with percussive loops and syncopated kicks. Rolling hi-hats and tribal percussion elements. Defined by Jamie Jones, Hot Since 82, Marco Carola. The sound of Ibiza at 4am.",
                "genre": "Tech House",
                "bpm_range": "125-128",
                "time_signature": "4/4",
                "bars": 2,
                "groove_characteristics": {
                    "swing_amount": 3,
                    "complexity": "medium",
                    "energy": "high",
                    "density": "dense",
                    "syncopation_level": "medium",
                    "humanization": 10
                },
                "tracks": [
                    {
                        "instrument": "kick",
                        "instrument_type": "bass_drum",
                        "role": "main",
                        "steps": "3000300030003030300030003000303030003000300030303000300030003030",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Four-on-the-floor with syncopated accents"
                    },
                    {
                        "instrument": "snare",
                        "instrument_type": "snare_drum",
                        "role": "main",
                        "steps": "0000300000003000000030000000300000003000000030000000300000003000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Clap on 2 and 4"
                    },
                    {
                        "instrument": "closed_hat",
                        "instrument_type": "hi_hat_closed",
                        "role": "main",
                        "steps": "2222222222222222222222222222222222222222222222222222222222222222",
                        "microtiming": [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
                        "sample_variation": null,
                        "description": "Rolling 16th notes with subtle swing"
                    },
                    {
                        "instrument": "perc_conga",
                        "instrument_type": "conga",
                        "role": "main",
                        "steps": "0020002000200020002000200020002000200020002000200020002000200020",
                        "microtiming": [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
                        "sample_variation": null,
                        "description": "Percussive conga pattern"
                    },
                    {
                        "instrument": "perc_shaker",
                        "instrument_type": "shaker",
                        "role": "auxiliary",
                        "steps": "0220022002200220022002200220022002200220022002200220022002200220",
                        "microtiming": [0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0],
                        "sample_variation": null,
                        "description": "Shaker adding texture"
                    },
                    {
                        "instrument": "perc_rim",
                        "instrument_type": "rim_shot",
                        "role": "accent",
                        "steps": "0000001000000010000000100000001000000010000000100000001000000010",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Rim shots for accents"
                    }
                ]
            },
            {
                "id": 27,
                "name": "Footwork/Juke",
                "description": "Chicago footwork/juke at 160 BPM with rapid-fire syncopation and vocal samples. Heavily syncopated kicks and snares creating frenetic energy. Defined by DJ Rashad, RP Boo, Traxman. The sound of Chicago's South Side dance battles.",
                "genre": "Footwork/Juke",
                "bpm_range": "155-165",
                "time_signature": "4/4",
                "bars": 2,
                "groove_characteristics": {
                    "swing_amount": 0,
                    "complexity": "expert",
                    "energy": "intense",
                    "density": "dense",
                    "syncopation_level": "high",
                    "humanization": 5
                },
                "tracks": [
                    {
                        "instrument": "kick",
                        "instrument_type": "bass_drum",
                        "role": "main",
                        "steps": "3030300030303000303030003030300030303000303030003030300030303000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "SIGNATURE: Rapid syncopated kick pattern - the juke foundation"
                    },
                    {
                        "instrument": "snare",
                        "instrument_type": "snare_drum",
                        "role": "main",
                        "steps": "0000300030003000000030003000300000003000300030000000300030003000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Frenetic snare pattern with double and triple hits"
                    },
                    {
                        "instrument": "closed_hat",
                        "instrument_type": "hi_hat_closed",
                        "role": "main",
                        "steps": "2222222222222222222222222222222222222222222222222222222222222222",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Constant 16th notes"
                    },
                    {
                        "instrument": "vocal_sample",
                        "instrument_type": "synth",
                        "role": "accent",
                        "steps": "3000000030000000300000003000000030000000300000003000000030000000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Vocal samples punctuating the rhythm"
                    },
                    {
                        "instrument": "perc_808",
                        "instrument_type": "percussion",
                        "role": "accent",
                        "steps": "0020002000200020002000200020002000200020002000200020002000200020",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "808 percussion on off-beats"
                    }
                ]
            },
            {
                "id": 28,
                "name": "Garage Shuffle (UK)",
                "description": "UK garage 2-step variation with more pronounced shuffle. Skippy snare pattern with heavy swing on hi-hats. Todd Edwards' signature sound - chopped, shuffled, and perfectly syncopated.",
                "genre": "UK Garage/Shuffle",
                "bpm_range": "128-136",
                "time_signature": "4/4",
                "bars": 2,
                "groove_characteristics": {
                    "swing_amount": 15,
                    "complexity": "high",
                    "energy": "high",
                    "density": "dense",
                    "syncopation_level": "high",
                    "humanization": 18
                },
                "tracks": [
                    {
                        "instrument": "kick",
                        "instrument_type": "bass_drum",
                        "role": "main",
                        "steps": "3000001001000010300000100100001030000010010000103000001001000010",
                        "microtiming": [0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 2, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 2, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 2, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0],
                        "sample_variation": null,
                        "description": "Skippy 2-step kick avoiding beat 2"
                    },
                    {
                        "instrument": "snare",
                        "instrument_type": "snare_drum",
                        "role": "main",
                        "steps": "0000300000003000000030000000300000003000000030000000300000003000",
                        "microtiming": [0, 0, 0, 0, -2, 0, 0, 0, 0, 0, 0, 0, -2, 0, 0, 0, 0, 0, 0, 0, -2, 0, 0, 0, 0, 0, 0, 0, -2, 0, 0, 0, 0, 0, 0, 0, -2, 0, 0, 0, 0, 0, 0, 0, -2, 0, 0, 0, 0, 0, 0, 0, -2, 0, 0, 0, 0, 0, 0, 0, -2, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Snare on 2 and 4 with early timing"
                    },
                    {
                        "instrument": "snare_ghost",
                        "instrument_type": "snare_drum",
                        "role": "ghost",
                        "steps": "0001000100010001000100010001000100010001000100010001000100010001",
                        "microtiming": [0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2],
                        "sample_variation": "ghost",
                        "description": "Ghost notes with shuffle timing"
                    },
                    {
                        "instrument": "closed_hat",
                        "instrument_type": "hi_hat_closed",
                        "role": "main",
                        "steps": "2020202020202020202020202020202020202020202020202020202020202020",
                        "microtiming": [0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5],
                        "sample_variation": null,
                        "description": "SIGNATURE: Heavy shuffle on hi-hats - the garage feel"
                    },
                    {
                        "instrument": "closed_hat_ghost",
                        "instrument_type": "hi_hat_closed",
                        "role": "ghost",
                        "steps": "0101010101010101010101010101010101010101010101010101010101010101",
                        "microtiming": [0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5],
                        "sample_variation": "ghost",
                        "description": "Off-beat ghosts with pronounced shuffle"
                    },
                    {
                        "instrument": "perc",
                        "instrument_type": "percussion",
                        "role": "accent",
                        "steps": "0000000100000001000000010000000100000001000000010000000100000001",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
                        "sample_variation": null,
                        "description": "Percussion accents on 16th notes"
                    }
                ]
            },
            {
                "id": 29,
                "name": "Memphis Phonk",
                "description": "Memphis phonk with signature cowbell and chopped samples. Lo-fi aesthetic with heavy kicks and atmospheric snares. Defined by DJ Spanish Fly, Tommy Wright III. The sound of 90s Memphis underground.",
                "genre": "Phonk/Memphis Hip Hop",
                "bpm_range": "130-145",
                "time_signature": "4/4",
                "bars": 2,
                "groove_characteristics": {
                    "swing_amount": 0,
                    "complexity": "medium",
                    "energy": "high",
                    "density": "medium",
                    "syncopation_level": "medium",
                    "humanization": 10
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
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Snare on 2 and 4 - lo-fi texture"
                    },
                    {
                        "instrument": "closed_hat",
                        "instrument_type": "hi_hat_closed",
                        "role": "main",
                        "steps": "2222222222222222222222222222222222222222222222222222222222222222",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Straight 16th notes"
                    },
                    {
                        "instrument": "cowbell",
                        "instrument_type": "cowbell",
                        "role": "main",
                        "steps": "3030303030303030303030303030303030303030303030303030303030303030",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "SIGNATURE: Continuous cowbell - the phonk trademark"
                    },
                    {
                        "instrument": "vocal_sample",
                        "instrument_type": "synth",
                        "role": "accent",
                        "steps": "0000000000000000000000000000000030000000000000000000000000000000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Chopped vocal sample at bar 2"
                    }
                ]
            },
            {
                "id": 30,
                "name": "Minimal Techno",
                "description": "Minimal techno with sparse elements and micro-rhythms. Subtle kick variations and minimal percussion. Defined by Richie Hawtin, Robert Hood, Ricardo Villalobos. Less is more - maximum impact from minimal elements.",
                "genre": "Minimal Techno",
                "bpm_range": "128-132",
                "time_signature": "4/4",
                "bars": 2,
                "groove_characteristics": {
                    "swing_amount": 0,
                    "complexity": "medium",
                    "energy": "medium",
                    "density": "sparse",
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
                        "description": "Four-on-the-floor - the foundation"
                    },
                    {
                        "instrument": "kick_ghost",
                        "instrument_type": "bass_drum",
                        "role": "ghost",
                        "steps": "0100010001000100010001000100010001000100010001000100010001000100",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": "ghost",
                        "description": "Ghost kicks adding micro-rhythm"
                    },
                    {
                        "instrument": "closed_hat",
                        "instrument_type": "hi_hat_closed",
                        "role": "main",
                        "steps": "2020202020202020202020202020202020202020202020202020202020202020",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Offbeat hi-hats - minimal and precise"
                    },
                    {
                        "instrument": "perc_click",
                        "instrument_type": "percussion",
                        "role": "accent",
                        "steps": "0000000100000001000000010000000100000001000000010000000100000001",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Subtle percussion clicks"
                    },
                    {
                        "instrument": "perc_wood",
                        "instrument_type": "percussion",
                        "role": "auxiliary",
                        "steps": "0000000000000000000000100000000000000000000000000000001000000000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Sparse wood block accents"
                    }
                ]
            },
            {
                "id": 31,
                "name": "Dub Techno",
                "description": "Deep dub techno with delay-heavy percussion and minimal kick pattern. Echoing hi-hats and atmospheric elements. Defined by Basic Channel, Maurizio, Rhythm & Sound. The sound of Berlin's deep techno - dubby, hypnotic, infinite.",
                "genre": "Dub Techno",
                "bpm_range": "120-126",
                "time_signature": "4/4",
                "bars": 2,
                "groove_characteristics": {
                    "swing_amount": 0,
                    "complexity": "simple",
                    "energy": "low",
                    "density": "sparse",
                    "syncopation_level": "low",
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
                        "description": "Deep four-on-the-floor kick with long decay"
                    },
                    {
                        "instrument": "closed_hat",
                        "instrument_type": "hi_hat_closed",
                        "role": "main",
                        "steps": "0020002000200020002000200020002000200020002000200020002000200020",
                        "microtiming": [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
                        "sample_variation": null,
                        "description": "Offbeat hi-hats with dub delay (simulated with microtiming)"
                    },
                    {
                        "instrument": "perc_click",
                        "instrument_type": "percussion",
                        "role": "accent",
                        "steps": "0000000100000001000000010000000100000001000000010000000100000001",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2],
                        "sample_variation": null,
                        "description": "Subtle percussion clicks echoing through delay"
                    },
                    {
                        "instrument": "perc_wood",
                        "instrument_type": "percussion",
                        "role": "auxiliary",
                        "steps": "0000000000000000000000100000000000000000000000000000001000000000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Sparse wood hits creating space"
                    }
                ]
            },
            {
                "id": 32,
                "name": "Highlife",
                "description": "West African highlife with palm wine guitar influence. Swinging hi-hats and syncopated congas. Originated in Ghana and Nigeria. The foundation of modern African pop - joyful, danceable, and deeply rooted.",
                "genre": "West African/Highlife",
                "bpm_range": "120-135",
                "time_signature": "4/4",
                "bars": 2,
                "groove_characteristics": {
                    "swing_amount": 10,
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
                        "steps": "3000000030000000300000003000000030000000300000003000000030000000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Syncopated kick pattern with laid-back timing"
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
                        "instrument": "conga_high",
                        "instrument_type": "conga",
                        "role": "main",
                        "steps": "3020302030203020302030203020302030203020302030203020302030203020",
                        "microtiming": [0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0],
                        "sample_variation": null,
                        "description": "High conga pattern with swing feel"
                    },
                    {
                        "instrument": "conga_low",
                        "instrument_type": "conga",
                        "role": "main",
                        "steps": "0203020302030203020302030203020302030203020302030203020302030203",
                        "microtiming": [0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0],
                        "sample_variation": null,
                        "description": "Low conga interlocking with high"
                    },
                    {
                        "instrument": "closed_hat",
                        "instrument_type": "hi_hat_closed",
                        "role": "main",
                        "steps": "2020202020202020202020202020202020202020202020202020202020202020",
                        "microtiming": [0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4, 0, 4],
                        "sample_variation": null,
                        "description": "16th notes with pronounced African swing"
                    },
                    {
                        "instrument": "shaker",
                        "instrument_type": "shaker",
                        "role": "auxiliary",
                        "steps": "2222222222222222222222222222222222222222222222222222222222222222",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Continuous shaker texture"
                    },
                    {
                        "instrument": "bell",
                        "instrument_type": "bell",
                        "role": "accent",
                        "steps": "3000001030000010300000103000001030000010300000103000001030000010",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Bell pattern marking phrases"
                    }
                ]
            },
            {
                "id": 33,
                "name": "Breakcore",
                "description": "Chaotic breakcore with heavily chopped and time-stretched breaks at extreme speeds. Amen break on steroids with rapid edits and complex layering. Defined by Venetian Snares, Shitmat, Bong-Ra. Organized chaos at 200+ BPM.",
                "genre": "Breakcore",
                "bpm_range": "180-220",
                "time_signature": "4/4",
                "bars": 2,
                "groove_characteristics": {
                    "swing_amount": 0,
                    "complexity": "expert",
                    "energy": "intense",
                    "density": "dense",
                    "syncopation_level": "high",
                    "humanization": 10
                },
                "tracks": [
                    {
                        "instrument": "kick",
                        "instrument_type": "bass_drum",
                        "role": "main",
                        "steps": "3030303030303030303030303030303030303030303030303030303030303030",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Rapid-fire kick pattern - relentless assault"
                    },
                    {
                        "instrument": "snare",
                        "instrument_type": "snare_drum",
                        "role": "main",
                        "steps": "0303030303030303030303030303030303030303030303030303030303030303",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Chopped snare hits creating chaos"
                    },
                    {
                        "instrument": "snare_alt",
                        "instrument_type": "snare_drum",
                        "role": "accent",
                        "steps": "3030303030303030303030303030303030303030303030303030303030303030",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": "rim",
                        "description": "Alternate snare sample layered"
                    },
                    {
                        "instrument": "closed_hat",
                        "instrument_type": "hi_hat_closed",
                        "role": "main",
                        "steps": "2222222222222222222222222222222222222222222222222222222222222222",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Constant hi-hat bed"
                    },
                    {
                        "instrument": "perc_noise",
                        "instrument_type": "percussion",
                        "role": "accent",
                        "steps": "3333333333333333333333333333333333333333333333333333333333333333",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "SIGNATURE: Absolute sonic chaos with noise bursts"
                    }
                ]
            },
            {
                "id": 34,
                "name": "Big Room",
                "description": "EDM big room house with explosive drops and festival energy. Minimal breakdown building to massive payoff. Defined by Martin Garrix, DVBBS, Dimitri Vegas & Like Mike. Stadium-filling anthems at 128 BPM.",
                "genre": "Big Room/EDM",
                "bpm_range": "126-130",
                "time_signature": "4/4",
                "bars": 2,
                "groove_characteristics": {
                    "swing_amount": 0,
                    "complexity": "simple",
                    "energy": "intense",
                    "density": "medium",
                    "syncopation_level": "low",
                    "humanization": 2
                },
                "tracks": [
                    {
                        "instrument": "kick",
                        "instrument_type": "bass_drum",
                        "role": "main",
                        "steps": "3000300030003000300030003000300030003000300030003000300030003000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "MASSIVE four-on-the-floor kick - festival power"
                    },
                    {
                        "instrument": "snare",
                        "instrument_type": "snare_drum",
                        "role": "main",
                        "steps": "0000300000003000000030000000300000003000000030000000300000003000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Clap/snare on 2 and 4"
                    },
                    {
                        "instrument": "closed_hat",
                        "instrument_type": "hi_hat_closed",
                        "role": "main",
                        "steps": "2020202020202020202020202020202020202020202020202020202020202020",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Offbeat hi-hats"
                    },
                    {
                        "instrument": "synth_lead",
                        "instrument_type": "synth",
                        "role": "accent",
                        "steps": "0000000000000000000000000000000030003000300030003000300030003000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "SIGNATURE: Lead synth stabs in second bar - the drop"
                    }
                ]
            },
            {
                "id": 35,
                "name": "Grime",
                "description": "UK grime with skippy 8-bit influenced percussion and syncopated snares at 140 BPM. Dark, minimal, and aggressive. Defined by Wiley, Dizzee Rascal, Skepta. The sound of East London - raw electronic aggression.",
                "genre": "Grime/UK",
                "bpm_range": "138-142",
                "time_signature": "4/4",
                "bars": 2,
                "groove_characteristics": {
                    "swing_amount": 0,
                    "complexity": "medium",
                    "energy": "high",
                    "density": "sparse",
                    "syncopation_level": "high",
                    "humanization": 5
                },
                "tracks": [
                    {
                        "instrument": "kick",
                        "instrument_type": "bass_drum",
                        "role": "main",
                        "steps": "3000000000003000300000000000300030000000000030003000000000003000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Skippy kick pattern with space"
                    },
                    {
                        "instrument": "snare",
                        "instrument_type": "snare_drum",
                        "role": "main",
                        "steps": "0000300030003000000030003000300000003000300030000000300030003000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Syncopated snare pattern - grime signature"
                    },
                    {
                        "instrument": "closed_hat",
                        "instrument_type": "hi_hat_closed",
                        "role": "main",
                        "steps": "2222222222222222222222222222222222222222222222222222222222222222",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Straight 16th notes"
                    },
                    {
                        "instrument": "perc_8bit",
                        "instrument_type": "percussion",
                        "role": "accent",
                        "steps": "0020002000200020002000200020002000200020002000200020002000200020",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "SIGNATURE: 8-bit style percussion - PlayStation sound"
                    },
                    {
                        "instrument": "sub_bass",
                        "instrument_type": "synth",
                        "role": "main",
                        "steps": "3000000000000000300000000000000030000000000000003000000000000000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Sub-bass hits syncing with kick"
                    }
                ]
            },
            {
                "id": 36,
                "name": "Riddim",
                "description": "Riddim dubstep with triplet bass patterns and minimal drums. Half-time feel with wobble bass rhythm. Defined by Subtronics, MONXX, Phiso. The sound of modern bass music - heavy, repetitive, hypnotic wobbles.",
                "genre": "Riddim/Dubstep",
                "bpm_range": "140-145",
                "time_signature": "4/4",
                "bars": 2,
                "groove_characteristics": {
                    "swing_amount": 0,
                    "complexity": "simple",
                    "energy": "intense",
                    "density": "sparse",
                    "syncopation_level": "low",
                    "humanization": 3
                },
                "tracks": [
                    {
                        "instrument": "kick",
                        "instrument_type": "bass_drum",
                        "role": "main",
                        "steps": "3000000000000000000000000000000030000000000000000000000000000000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Sparse kick on beat 1 - halftime"
                    },
                    {
                        "instrument": "snare",
                        "instrument_type": "snare_drum",
                        "role": "main",
                        "steps": "0000000030000000000000000000000000000000300000000000000000000000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Snare on beat 3"
                    },
                    {
                        "instrument": "closed_hat",
                        "instrument_type": "hi_hat_closed",
                        "role": "main",
                        "steps": "2020202020202020202020202020202020202020202020202020202020202020",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Offbeat hi-hats"
                    },
                    {
                        "instrument": "wobble_bass",
                        "instrument_type": "synth",
                        "role": "main",
                        "steps": "3303330333033303330333033303330333033303330333033303330333033303",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "SIGNATURE: Triplet wobble bass pattern - the riddim sound"
                    }
                ]
            },
            {
                "id": 37,
                "name": "Rumba Clave 3-2",
                "description": "Afro-Cuban rumba clave pattern. Similar to son clave but with different placement. The second timeline that shapes Cuban music. Essential for rumba, guaguancó, and Afro-Cuban jazz.",
                "genre": "Afro-Cuban/Rumba",
                "bpm_range": "100-130",
                "time_signature": "4/4",
                "bars": 2,
                "groove_characteristics": {
                    "swing_amount": 0,
                    "complexity": "medium",
                    "energy": "medium",
                    "density": "medium",
                    "syncopation_level": "high",
                    "humanization": 15
                },
                "tracks": [
                    {
                        "instrument": "clave",
                        "instrument_type": "clave",
                        "role": "main",
                        "steps": "3000000030000000000030000030000000003000000000000000000000000000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "THE RUMBA CLAVE: Steps 0, 8, 22, 28 (bar 1) and 36 (bar 2)"
                    },
                    {
                        "instrument": "kick",
                        "instrument_type": "bass_drum",
                        "role": "main",
                        "steps": "3000300030003000300030003000300030003000300030003000300030003000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Four-on-the-floor supporting clave"
                    },
                    {
                        "instrument": "conga_high",
                        "instrument_type": "conga",
                        "role": "main",
                        "steps": "3000200020002000300020002000200030002000200020003000200020002000",
                        "microtiming": [0, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Conga tumbao with rumba feel"
                    },
                    {
                        "instrument": "conga_low",
                        "instrument_type": "conga",
                        "role": "main",
                        "steps": "0200020002000200020002000200020002000200020002000200020002000200",
                        "microtiming": [0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0],
                        "sample_variation": null,
                        "description": "Low conga bass on off-beats"
                    },
                    {
                        "instrument": "palito",
                        "instrument_type": "percussion",
                        "role": "auxiliary",
                        "steps": "2222222222222222222222222222222222222222222222222222222222222222",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Palitos (sticks) maintaining pulse"
                    }
                ]
            },
            {
                "id": 38,
                "name": "Jump Up",
                "description": "Jump up drum and bass with bouncy basslines and energetic breaks. More uplifting than neurofunk. Defined by DJ Hazard, Original Sin, Macky Gee. The sound of dancefloor DnB - fun, energetic, crowd-pleasing.",
                "genre": "Drum and Bass/Jump Up",
                "bpm_range": "172-176",
                "time_signature": "4/4",
                "bars": 2,
                "groove_characteristics": {
                    "swing_amount": 0,
                    "complexity": "medium",
                    "energy": "intense",
                    "density": "dense",
                    "syncopation_level": "high",
                    "humanization": 10
                },
                "tracks": [
                    {
                        "instrument": "kick",
                        "instrument_type": "bass_drum",
                        "role": "main",
                        "steps": "3000000030300000300000003030000030000000303000003000000030300000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Bouncy kick pattern with double hits"
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
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": "ghost",
                        "description": "Ghost notes for texture"
                    },
                    {
                        "instrument": "closed_hat",
                        "instrument_type": "hi_hat_closed",
                        "role": "main",
                        "steps": "2222222222222222222222222222222222222222222222222222222222222222",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Straight 16ths at 170 BPM"
                    },
                    {
                        "instrument": "reese_bass",
                        "instrument_type": "synth",
                        "role": "main",
                        "steps": "3000000030000000300000003000000030000000300000003000000030000000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "SIGNATURE: Bouncy Reese bassline - jump up sound"
                    }
                ]
            },
            {
                "id": 39,
                "name": "Brostep",
                "description": "Aggressive brostep with heavy midrange bass and robotic drums. American take on dubstep with more aggressive sound design. Defined by Skrillex, Excision, Kill The Noise. The sound that brought dubstep to mainstream - loud, aggressive, chaotic.",
                "genre": "Brostep/Dubstep",
                "bpm_range": "140-150",
                "time_signature": "4/4",
                "bars": 2,
                "groove_characteristics": {
                    "swing_amount": 0,
                    "complexity": "medium",
                    "energy": "intense",
                    "density": "medium",
                    "syncopation_level": "medium",
                    "humanization": 3
                },
                "tracks": [
                    {
                        "instrument": "kick",
                        "instrument_type": "bass_drum",
                        "role": "main",
                        "steps": "3000000000000000300000000000000030000000000000003000000000000000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Heavy halftime kicks"
                    },
                    {
                        "instrument": "snare",
                        "instrument_type": "snare_drum",
                        "role": "main",
                        "steps": "0000000030000000000000000000000000000000300000000000000000000000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, -3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Snare on beat 3 with aggressive early timing"
                    },
                    {
                        "instrument": "closed_hat",
                        "instrument_type": "hi_hat_closed",
                        "role": "main",
                        "steps": "2020202020202020202020202020202020202020202020202020202020202020",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Straight offbeat hats"
                    },
                    {
                        "instrument": "midrange_bass",
                        "instrument_type": "synth",
                        "role": "main",
                        "steps": "0000000000000000000000000000000030303030303030303030303030303030",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "SIGNATURE: Aggressive midrange wobbles in bar 2 - the drop"
                    },
                    {
                        "instrument": "laser_fx",
                        "instrument_type": "synth",
                        "role": "accent",
                        "steps": "0000000000000000000000000000000033003300330033003300330033003300",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Laser-like synth accents in the drop"
                    }
                ]
            },
            {
                "id": 40,
                "name": "Impeach the President",
                "description": "The Honey Drippers' legendary break - hip hop's third pillar after Amen and Funky Drummer. Deep kick, crisp snare, and signature open hi-hat. Sampled by everyone from N.W.A to DJ Premier. The break that defined gangsta rap.",
                "genre": "Breakbeat/Hip Hop",
                "bpm_range": "100-110",
                "time_signature": "4/4",
                "bars": 2,
                "groove_characteristics": {
                    "swing_amount": 5,
                    "complexity": "medium",
                    "energy": "medium",
                    "density": "medium",
                    "syncopation_level": "medium",
                    "humanization": 20
                },
                "tracks": [
                    {
                        "instrument": "kick",
                        "instrument_type": "bass_drum",
                        "role": "main",
                        "steps": "3000000000003000300000000000300030000000000030003000000000003000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "SIGNATURE: Deep boom kick with characteristic pattern"
                    },
                    {
                        "instrument": "snare",
                        "instrument_type": "snare_drum",
                        "role": "main",
                        "steps": "0000300000003000000030000000300000003000000030000000300000003000",
                        "microtiming": [0, 0, 0, 0, -2, 0, 0, 0, 0, 0, 0, 0, -2, 0, 0, 0, 0, 0, 0, 0, -2, 0, 0, 0, 0, 0, 0, 0, -2, 0, 0, 0, 0, 0, 0, 0, -2, 0, 0, 0, 0, 0, 0, 0, -2, 0, 0, 0, 0, 0, 0, 0, -2, 0, 0, 0, 0, 0, 0, 0, -2, 0, 0, 0],
                        "sample_variation": null,
                        "description": "Crisp snare on 2 and 4 with early timing"
                    },
                    {
                        "instrument": "snare_ghost",
                        "instrument_type": "snare_drum",
                        "role": "ghost",
                        "steps": "0000000010000000000000001000000000000000100000000000000010000000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": "ghost",
                        "description": "Subtle ghost notes"
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
                        "instrument": "open_hat",
                        "instrument_type": "hi_hat_open",
                        "role": "accent",
                        "steps": "0000000030000000000000003000000000000000300000000000000030000000",
                        "microtiming": [0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0],
                        "sample_variation": null,
                        "description": "SIGNATURE: Open hat on the 'and' of beat 2 - the famous accent"
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