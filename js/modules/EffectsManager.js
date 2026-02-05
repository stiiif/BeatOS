import { LFO } from './LFO.js';

export class EffectsManager {
    constructor(audioEngine) {
        this.audioEngine = audioEngine;
        this.effects = [
            this.createEffectState(0), // FX 1
            this.createEffectState(1)  // FX 2
        ];
    }

    createEffectState(id) {
        return {
            id,
            params: [0.5, 0.5, 0.5], // The 3 Macro Knobs (normalized 0-1)
            lfos: [
                new LFO(),
                new LFO(),
                new LFO()
            ],
            // Matrix: 3 sources (rows) x 12 targets (cols)
            // Targets: 0-2 (Params), 3-5 (LFO1 Params), 6-8 (LFO2), 9-11 (LFO3)
            // Values: 0 (off) or 1 (on), or float amount if we want depth. Keeping boolean for "tiny matrix".
            matrix: Array(3).fill(null).map(() => Array(12).fill(0))
        };
    }

    update(time) {
        this.effects.forEach(fx => {
            // 1. Calculate LFO Values
            const lfoValues = fx.lfos.map(lfo => lfo.getValue(time));

            // 2. Resolve Targets (Accumulate modulation)
            // Targets 0-2: Effect Params
            // Targets 3-11: LFO Params (Modulating LFOs with LFOs!)
            
            let effectiveParams = [...fx.params];
            let lfoModulations = Array(9).fill(0); // For LFO params

            // Apply Matrix Logic
            fx.matrix.forEach((row, lfoIndex) => {
                const modValue = lfoValues[lfoIndex];
                
                row.forEach((isActive, targetIndex) => {
                    if (isActive) {
                        if (targetIndex < 3) {
                            // Modulate Effect Param
                            effectiveParams[targetIndex] += modValue;
                        } else {
                            // Modulate LFO Param
                            lfoModulations[targetIndex - 3] += modValue;
                        }
                    }
                });
            });

            // 3. Apply Modulation to LFOs (Rate/Amount) for NEXT frame
            // LFO Params indices: 0=Wave(skip), 1=Rate, 2=Amount
            // Mapped indices: 0-2 (LFO1), 3-5 (LFO2), 6-8 (LFO3)
            
            fx.lfos.forEach((lfo, idx) => {
                const baseIdx = idx * 3;
                // Modulation of Rate
                if (lfoModulations[baseIdx + 1] !== 0) {
                    // Temporary modulation logic usually requires LFO to have a base value vs current value
                    // Since LFO class is simple, we might need to extend it or just hack it here.
                    // For simplicity in this "tiny" implementation, we won't strictly modulate LFO rates continuously 
                    // unless LFO class supports "modulate(param, val)". 
                    // Let's skip LFO-on-LFO modulation for V1 to ensure stability, or implement simple offsets.
                }
            });

            // 4. Update Audio Engine
            effectiveParams.forEach((val, idx) => {
                this.audioEngine.setEffectParam(fx.id, idx, val);
            });
        });
    }

    setParam(fxId, paramIdx, value) {
        if (this.effects[fxId]) {
            this.effects[fxId].params[paramIdx] = value;
        }
    }

    setLfoParam(fxId, lfoIdx, param, value) {
        const lfo = this.effects[fxId]?.lfos[lfoIdx];
        if (lfo) {
            if (param === 'wave') lfo.wave = value;
            if (param === 'rate') lfo.rate = value;
            if (param === 'amount') lfo.amount = value;
        }
    }

    toggleMatrix(fxId, lfoIdx, targetIdx) {
        const fx = this.effects[fxId];
        if (fx) {
            fx.matrix[lfoIdx][targetIdx] = fx.matrix[lfoIdx][targetIdx] ? 0 : 1;
        }
        return fx.matrix[lfoIdx][targetIdx];
    }
    
    getEffectState(fxId) {
        return this.effects[fxId];
    }
}