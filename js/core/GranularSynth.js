// Granular Synthesis Engine
import { VELOCITY_GAINS } from '../utils/constants.js';

export class GranularSynth {
    constructor(audioEngine) {
        this.audioEngine = audioEngine;
        this.activeGrains = 0;
        this.MAX_GRAINS = 400; 
    }

    getActiveGrainCount() {
        return this.activeGrains;
    }

    setMaxGrains(max) {
        this.MAX_GRAINS = max;
    }

    findActivePosition(track, requestedPos) {
        if (!track.rmsMap || track.rmsMap.length === 0) return requestedPos;
        const mapIdx = Math.floor(requestedPos * 99); 
        if (track.rmsMap[mapIdx]) return requestedPos; 
        for (let i = 1; i < 50; i++) {
            if (track.rmsMap[mapIdx + i]) return (mapIdx + i) / 99;
            if (track.rmsMap[mapIdx - i]) return (mapIdx - i) / 99;
        }
        return requestedPos; 
    }

    playGrain(track, time, scheduleVisualDrawCallback, ampEnvelope = 1.0, velocityLevel = 2) {
        if (this.activeGrains >= this.MAX_GRAINS) return;

        const audioCtx = this.audioEngine.getContext();
        if (!audioCtx || !track.buffer || !track.bus) return; 

        let gainMult = 1.0;
        let filterOffset = 0;
        let sprayMod = 0;

        switch(velocityLevel) {
            case 1: // Ghost
                gainMult = 0.4;
                filterOffset = -3000;
                sprayMod = 0.05; 
                break;
            case 2: // Normal
                gainMult = 0.75;
                break;
            case 3: // Accent
                gainMult = 1.0;
                break;
            default:
                if (velocityLevel > 0) gainMult = 0.75;
                else return;
        }

        let mod = { position:0, spray:0, density:0, grainSize:0, pitch:0, filter:0, hpFilter:0 };
        track.lfos.forEach(lfo => {
            const v = lfo.getValue(time);
            if (lfo.target === 'filter') mod.filter += v * 5000;
            else if (lfo.target === 'hpFilter') mod.hpFilter += v * 2000;
            else if(mod[lfo.target] !== undefined) mod[lfo.target] += v;
        });

        const p = track.params;

        let basePos = (p.scanSpeed > 0.01 || p.scanSpeed < -0.01) ? track.playhead : p.position;
        
        let gPos = Math.max(0, Math.min(1, basePos + mod.position));
        const spray = Math.max(0, p.spray + mod.spray + sprayMod);
        gPos += (Math.random()*2-1) * spray;
        gPos = Math.max(0, Math.min(1, gPos));

        if (spray > 0.01) {
            gPos = this.findActivePosition(track, gPos);
        }

        const dur = Math.max(0.01, p.grainSize + mod.grainSize);
        const pitch = Math.max(0.1, p.pitch + mod.pitch);

        if(track.bus.hp) track.bus.hp.frequency.setValueAtTime(this.audioEngine.getMappedFrequency(Math.max(20, p.hpFilter + mod.hpFilter), 'hp'), time);
        
        let lpFreq = this.audioEngine.getMappedFrequency(Math.max(100, p.filter + mod.filter), 'lp');
        if (velocityLevel === 1) lpFreq = Math.max(100, lpFreq + filterOffset);
        if(track.bus.lp) track.bus.lp.frequency.setValueAtTime(lpFreq, time);
        
        if(track.bus.vol) track.bus.vol.gain.setValueAtTime(p.volume, time);
        if(track.bus.pan) track.bus.pan.pan.setValueAtTime(p.pan, time);

        const src = audioCtx.createBufferSource();
        src.buffer = track.buffer;
        src.playbackRate.value = pitch;

        const grainWindow = audioCtx.createGain();
        grainWindow.gain.value = ampEnvelope * gainMult;

        src.connect(grainWindow);
        grainWindow.connect(track.bus.input); 

        track.addSource(src);

        const bufDur = track.buffer.duration;
        let offset = gPos * bufDur;
        if (offset + dur > bufDur) offset = 0;

        // FIXED: Fast attack for individual grains to prevent lag with large grain sizes
        grainWindow.gain.setValueAtTime(0, time);
        const grainAttack = 0.002; 
        const safeAttack = Math.min(grainAttack, dur * 0.5);
        
        grainWindow.gain.linearRampToValueAtTime(ampEnvelope * gainMult, time + safeAttack); 
        grainWindow.gain.linearRampToValueAtTime(0, time + dur);

        this.activeGrains++;
        src.start(time, offset, dur);
        src.onended = () => { 
            this.activeGrains--;
            src.disconnect();
            grainWindow.disconnect();
        };
        
        scheduleVisualDrawCallback(time, track.id);
    }

    scheduleNote(track, time, scheduleVisualDrawCallback, velocityLevel = 2) {
        if (track.type === 'simple-drum') {
            this.audioEngine.triggerDrum(track, time, velocityLevel);
            scheduleVisualDrawCallback(time, track.id);
            return;
        }

        const p = track.params;
        
        let density = Math.max(1, p.density);
        let interval;
        const dur = p.grainSize; 

        if (p.overlap > 0) {
            interval = dur / Math.max(0.1, p.overlap);
            density = 1 / interval; 
        } else {
            interval = 1 / density;
        }

        const noteDur = p.relGrain !== undefined ? p.relGrain : 0.4;
        const rawGrains = Math.ceil(noteDur / interval);
        const grains = Math.min(64, rawGrains); 

        const atk = p.ampAttack || 0.01;
        const dec = p.ampDecay || 0.1;
        const rel = p.ampRelease || 0.1;
        const sustainLevel = 0.6;

        if (p.scanSpeed !== 0) {
            track.playhead = (track.playhead + (p.scanSpeed * 0.1)) % 1.0;
            if (track.playhead < 0) track.playhead += 1.0;
        } else {
            track.playhead = p.position;
        }

        for(let i=0; i<grains; i++) {
            const grainRelativeTime = i * interval;
            let ampEnv = 0;

            // FIX: Ensure first grain starts immediately if attack is short
            if (i === 0 && atk < 0.01) {
                ampEnv = 1.0;
            } else {
                if (grainRelativeTime < atk) {
                    ampEnv = grainRelativeTime / atk;
                } else if (grainRelativeTime < atk + dec) {
                    const decProgress = (grainRelativeTime - atk) / dec;
                    ampEnv = 1.0 - (decProgress * (1.0 - sustainLevel));
                } else if (grainRelativeTime < atk + dec + rel) {
                    const relProgress = (grainRelativeTime - (atk + dec)) / rel;
                    ampEnv = sustainLevel * (1.0 - relProgress);
                } else {
                    ampEnv = 0;
                }
            }

            // Remove jitter for the first grain to ensure tight timing
            const jitter = (i === 0) ? 0 : Math.random() * 0.005;
            
            if (ampEnv > 0.001) { 
                this.playGrain(track, time + grainRelativeTime + jitter, scheduleVisualDrawCallback, ampEnv, velocityLevel);
            }
        }
    }
}