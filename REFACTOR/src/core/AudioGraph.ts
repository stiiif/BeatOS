import { audioContext } from './AudioContext';
import { DEFAULT_GRANULAR_PARAMS } from '../config/mappings';
import { TrackState } from '../types/state';

// Per-Track Audio Node Graph
export interface TrackBus {
    input: GainNode;
    hp: BiquadFilterNode;
    lp: BiquadFilterNode;
    vol: GainNode;
    pan: StereoPannerNode;
    analyser: AnalyserNode;
}

export class AudioGraph {
    private buses: Map<number, TrackBus> = new Map();

    public getBus(trackId: number): TrackBus | undefined {
        return this.buses.get(trackId);
    }

    public initTrack(trackId: number, params: TrackState['params'] = DEFAULT_GRANULAR_PARAMS as any): TrackBus {
        const ctx = audioContext.getContext();

        // Create Nodes
        const input = ctx.createGain();
        const hp = ctx.createBiquadFilter();
        const lp = ctx.createBiquadFilter();
        const vol = ctx.createGain();
        const pan = ctx.createStereoPanner();
        const analyser = ctx.createAnalyser();

        // Configure Nodes
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.85;

        hp.type = 'highpass';
        hp.frequency.value = this.getMappedFrequency(params.hpFilter, 'hp');

        lp.type = 'lowpass';
        lp.frequency.value = this.getMappedFrequency(params.filter, 'lp');

        vol.gain.value = params.volume;
        pan.pan.value = params.pan;

        // Connect Graph
        input.connect(hp);
        hp.connect(lp);
        lp.connect(vol);
        vol.connect(pan);
        pan.connect(analyser);
        analyser.connect(ctx.destination);

        const bus = { input, hp, lp, vol, pan, analyser };
        this.buses.set(trackId, bus);
        
        return bus;
    }

    public updateTrackParams(trackId: number, params: TrackState['params'], time: number = 0) {
        const bus = this.buses.get(trackId);
        if (!bus) return;

        const ctx = audioContext.getContext();
        const t = time || ctx.currentTime;

        // Schedule updates to prevent zipper noise
        // Using setTargetAtTime or linearRamp is better than setValueAtTime for smooth changes
        // But for direct knob turns, setValueAtTime is usually responsive enough if batched.
        // We use the mapping logic from the original engine.

        bus.hp.frequency.setTargetAtTime(this.getMappedFrequency(params.hpFilter, 'hp'), t, 0.015);
        bus.lp.frequency.setTargetAtTime(this.getMappedFrequency(params.filter, 'lp'), t, 0.015);
        bus.vol.gain.setTargetAtTime(params.volume, t, 0.015);
        bus.pan.pan.setTargetAtTime(params.pan, t, 0.015);
    }

    // Helper from original AudioEngine.js
    public getMappedFrequency(value: number, type: 'hp' | 'lp'): number {
        let min, max;
        if (type === 'hp') { min = 20; max = 5000; }
        else { min = 100; max = 10000; }

        let norm = (value - min) / (max - min);
        norm = Math.max(0, Math.min(1, norm));

        if (type === 'lp') {
            return min + (max - min) * Math.pow(norm, 3);
        } else {
            return min + (max - min) * (1 - Math.pow(1 - norm, 3));
        }
    }

    public cleanup() {
        this.buses.forEach(bus => {
            bus.input.disconnect();
            bus.hp.disconnect();
            bus.lp.disconnect();
            bus.vol.disconnect();
            bus.pan.disconnect();
            bus.analyser.disconnect();
        });
        this.buses.clear();
    }
}

export const audioGraph = new AudioGraph();