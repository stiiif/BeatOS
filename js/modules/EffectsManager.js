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
            // 4 Macro Knobs: P1, P2, P3, Mix
            params: [0.5, 0.5, 0.5, 0.5], 
            lfos: [
                new LFO(),
                new LFO(),
                new LFO()
            ],
            // 4th Source: Random (Software based Sample & Hold)
            randomSource: { value: 0, holdTime: 0, rate: 2.0 },
            
            // Matrix: 4 sources (rows) x 9 targets (cols)
            // Sources: LFO1, LFO2, LFO3, RND
            // Targets: P1, P2, P3, Mix, L1R, L1A, L2R, L2A, L3R
            matrix: Array(4).fill(null).map(() => Array(9).fill(0))
        };
    }

    update(time) {
        this.effects.forEach(fx => {
            // 1. Calculate Source Values
            const lfoValues = fx.lfos.map(lfo => lfo.getValue(time));
            
            // Calculate Random Source (S&H)
            const rndStep = Math.floor(time * fx.randomSource.rate);
            if (rndStep > fx.randomSource.holdTime) {
                fx.randomSource.holdTime = rndStep;
                fx.randomSource.value = (Math.random() * 2) - 1;
            }
            // Add Random to modulators array
            const modulators = [...lfoValues, fx.randomSource.value];

            // 2. Resolve Targets (Accumulate modulation)
            // Targets 0-3: Effect Params (P1, P2, P3, Mix)
            // Targets 4-8: LFO Params
            
            let effectiveParams = [...fx.params];
            let lfoModulations = Array(5).fill(0); 

            // Apply Matrix Logic
            fx.matrix.forEach((row, sourceIndex) => {
                const modValue = modulators[sourceIndex];
                
                row.forEach((isActive, targetIndex) => {
                    if (isActive) {
                        const amount = 0.2 * modValue; // Scale modulation depth
                        if (targetIndex < 4) {
                            // Modulate Effect Param
                            effectiveParams[targetIndex] += amount;
                        } else {
                            // Modulate LFO Param
                            lfoModulations[targetIndex - 4] += amount;
                        }
                    }
                });
            });

            // 3. Apply Modulation to LFOs (Rate/Amount) for NEXT frame
            // Target Map: 4=L1R, 5=L1A, 6=L2R, 7=L2A, 8=L3R
            if (lfoModulations[0]) fx.lfos[0].rate += lfoModulations[0] * 10;
            if (lfoModulations[1]) fx.lfos[0].amount += lfoModulations[1];
            if (lfoModulations[2]) fx.lfos[1].rate += lfoModulations[2] * 10;
            if (lfoModulations[3]) fx.lfos[1].amount += lfoModulations[3];
            if (lfoModulations[4]) fx.lfos[2].rate += lfoModulations[4] * 10;

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

    toggleMatrix(fxId, sourceIdx, targetIdx) {
        const fx = this.effects[fxId];
        if (fx) {
            fx.matrix[sourceIdx][targetIdx] = fx.matrix[sourceIdx][targetIdx] ? 0 : 1;
        }
        return fx.matrix[sourceIdx][targetIdx];
    }
    
    getEffectState(fxId) {
        return this.effects[fxId];
    }
}