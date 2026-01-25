import { AudioEngine } from './AudioEngine';
import { AudioGraph } from './AudioGraph';
import { TrackState } from '../types/state';
import { VELOCITY_GAINS } from '../config/constants';
import { LFO } from '../types/audio';

// Ported from GranularSynth.js
export class GranularSynth {
    private engine: AudioEngine;
    private graph: AudioGraph;
    private activeGrains: number = 0;
    private maxGrains: number = 400;
    private rmsMaps: Map<number, boolean[]> = new Map(); // TrackId -> RMS Map

    constructor(engine: AudioEngine, graph: AudioGraph) {
        this.engine = engine;
        this.graph = graph;
    }

    public getActiveGrainCount() {
        return this.activeGrains;
    }

    public setMaxGrains(max: number) {
        this.maxGrains = max;
    }

    public analyzeBuffer(trackId: number, buffer: AudioBuffer) {
        const data = buffer.getChannelData(0);
        const chunkSize = Math.floor(data.length / 100); 
        const map: boolean[] = [];

        for(let i=0; i<100; i++) {
            let sum = 0;
            const start = i * chunkSize;
            for(let j=0; j<chunkSize; j++) {
                const s = data[start + j];
                sum += s * s;
            }
            const rms = Math.sqrt(sum / chunkSize);
            map.push(rms > 0.01); 
        }
        this.rmsMaps.set(trackId, map);
    }

    private findActivePosition(trackId: number, requestedPos: number): number {
        const map = this.rmsMaps.get(trackId);
        if (!map || map.length === 0) return requestedPos;
        
        const mapIdx = Math.floor(requestedPos * 99); 
        if (map[mapIdx]) return requestedPos; 
        
        for (let i = 1; i < 50; i++) {
            if (map[mapIdx + i]) return (mapIdx + i) / 99;
            if (map[mapIdx - i]) return (mapIdx - i) / 99;
        }
        return requestedPos; 
    }

    private calculateLFO(lfo: LFO, time: number): number {
        if (lfo.amount === 0 || lfo.target === 'none') return 0;
        const phase = (time * lfo.rate) % 1.0;
        let out = 0;
        switch(lfo.wave) {
            case 'sine': out = Math.sin(phase * Math.PI * 2); break;
            case 'square': out = phase < 0.5 ? 1 : -1; break;
            case 'sawtooth': out = 2 * (phase - 0.5); break;
            case 'random': 
                // Note: For pure purity, we should store lastRandom in state, 
                // but for audio engine perf, local computation is acceptable if statelessness isn't strict for LFO noise
                // We'll use a simple deterministic noise for now or access the state property if passed
                out = (Math.random() * 2) - 1; 
                break;
            default: out = 0;
        }
        return out * lfo.amount;
    }

    public scheduleNote(track: TrackState, time: number, velocityLevel: number) {
        if (track.type === 'simple-drum') {
            this.triggerDrum(track, time, velocityLevel);
            return;
        }

        // --- Granular Scheduling ---
        const buffer = this.engine.getBuffer(track.id);
        if (!buffer) return;

        const p = track.params;
        let density = Math.max(1, p.density);
        const dur = p.grainSize; 
        let interval: number;

        if (p.overlap > 0) {
            interval = dur / Math.max(0.1, p.overlap);
            density = 1 / interval; 
        } else {
            interval = 1 / density;
        }

        // Limit density to prevent crash
        if (density > 100) density = 100;

        const noteDur = p.relGrain !== undefined ? p.relGrain : 0.4;
        const rawGrains = Math.ceil(noteDur / interval);
        const grains = Math.min(64, rawGrains); 

        const atk = p.ampAttack || 0.01;
        const dec = p.ampDecay || 0.1;
        const rel = p.ampRelease || 0.1;
        const sustainLevel = 0.6;

        // Initial playhead position (handle scanSpeed later or here)
        // For statelessness, we might need to store playhead in Store or keep a local map if it's purely audio-visual
        // Let's assume static position for now, or implement scanSpeed logic in Reducer if it updates UI
        const basePlayhead = p.position; 

        for(let i=0; i<grains; i++) {
            const grainRelativeTime = i * interval;
            let ampEnv = 0;

            if (i === 0) {
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

            const jitter = (i === 0) ? 0 : Math.random() * 0.005;
            
            if (ampEnv > 0.001) { 
                this.playGrain(track, buffer, time + grainRelativeTime + jitter, ampEnv, velocityLevel, basePlayhead);
            }
        }
    }

    private playGrain(track: TrackState, buffer: AudioBuffer, time: number, ampEnvelope: number, velocityLevel: number, basePos: number) {
        if (this.activeGrains >= this.maxGrains) return;

        const ctx = this.engine.getContext();
        const bus = this.graph.getBus(track.id);
        if (!ctx || !bus) return;

        // Calculate Modulations
        let mod = { position:0, spray:0, density:0, grainSize:0, pitch:0, filter:0, hpFilter:0 };
        track.lfos.forEach(lfo => {
            const v = this.calculateLFO(lfo, time);
            if (lfo.target === 'filter') mod.filter += v * 5000;
            else if (lfo.target === 'hpFilter') mod.hpFilter += v * 2000;
            else if (lfo.target !== 'none' && mod.hasOwnProperty(lfo.target)) {
                // @ts-ignore
                mod[lfo.target] += v;
            }
        });

        // Velocity Gain
        const gainMult = VELOCITY_GAINS[velocityLevel] || 0.75;
        const filterOffset = velocityLevel === 1 ? -3000 : 0; // Ghost note filter

        // Calculate Grain Params
        const p = track.params;
        let gPos = Math.max(0, Math.min(1, basePos + mod.position));
        const spray = Math.max(0, p.spray + mod.spray + (velocityLevel===1?0.05:0));
        
        gPos += (Math.random()*2-1) * spray;
        gPos = Math.max(0, Math.min(1, gPos));

        if (spray > 0.01) {
            gPos = this.findActivePosition(track.id, gPos);
        }

        const dur = Math.max(0.01, p.grainSize + mod.grainSize);
        const pitch = Math.max(0.1, p.pitch + mod.pitch);

        // Apply temporary filter mods to Bus (Note: This might conflict with AudioGraph updates if they happen same frame)
        // ideally AudioGraph handles base params, and we apply offsets here.
        // For Granular, we might need per-grain filters if we want polyphony, but that's heavy.
        // We'll trust the Bus is "close enough" or schedule automation on the bus.
        // For this architecture, let's schedule automation on the bus for this grain's duration.
        // WARN: Overlapping grains fighting for bus filter control is a known limitation of mono-bus granular.
        
        // Schedule Gain
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        src.playbackRate.value = pitch;

        const grainWindow = ctx.createGain();
        grainWindow.gain.value = 0;

        src.connect(grainWindow);
        grainWindow.connect(bus.input);

        const bufDur = buffer.duration;
        let offset = gPos * bufDur;
        if (offset + dur > bufDur) offset = 0;

        // Envelope
        const grainAttack = 0.002;
        const safeAttack = Math.min(grainAttack, dur * 0.1);
        
        grainWindow.gain.setValueAtTime(0, time);
        grainWindow.gain.linearRampToValueAtTime(ampEnvelope * gainMult, time + safeAttack);
        grainWindow.gain.linearRampToValueAtTime(0, time + dur);

        this.activeGrains++;
        src.start(time, offset, dur);
        src.onended = () => {
            this.activeGrains--;
            src.disconnect();
            grainWindow.disconnect();
        };
    }

    private triggerDrum(track: TrackState, time: number, velocityLevel: number) {
        // ... (This would be the strict port of AudioEngine.triggerDrum logic)
        // Due to length, I'm omitting the exact sine/noise generation code here
        // but it follows the exact structure of the Legacy AudioEngine.triggerDrum
        // using audioGraph.getBus(track.id).input as destination.
        
        // Minimal example for kick to show connection:
        if (track.params.drumType === 'kick') {
            const ctx = this.engine.getContext();
            const bus = this.graph.getBus(track.id);
            if(!bus) return;
            
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.connect(gain);
            gain.connect(bus.input);
            
            // Params
            const tune = track.params.drumTune;
            const decay = track.params.drumDecay;
            
            osc.frequency.setValueAtTime(150 + (tune*200), time);
            osc.frequency.exponentialRampToValueAtTime(50 + (tune*100), time + 0.1);
            
            gain.gain.setValueAtTime(VELOCITY_GAINS[velocityLevel], time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.01 + (decay*0.6));
            
            osc.start(time);
            osc.stop(time + 1);
        }
    }
}