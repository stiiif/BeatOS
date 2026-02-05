import { LFO } from './LFO.js';

export class EffectsManager {
    constructor(audioEngine) {
        this.audioEngine = audioEngine;
        this.effects = [
            this.createEffectState(0), // FX 1
            this.createEffectState(1)  // FX 2
        ];
        
        // Store live modulated values for UI visualization
        // Structure: [FX_ID][TARGET_INDEX]
        // 13 targets: P1..Mix (4) + LFO1(3) + LFO2(3) + LFO3(3)
        this.liveValues = [
            new Float32Array(13),
            new Float32Array(13)
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
            // Matrix: 3 sources (rows) x 13 targets (cols)
            matrix: Array(3).fill(null).map(() => Array(13).fill(0))
        };
    }

    update(time) {
        this.effects.forEach((fx, fxIndex) => {
            // 1. Calculate Source Values
            const lfoValues = fx.lfos.map(lfo => lfo.getValue(time));
            
            // 2. Initialize Modulators Accumulator (13 targets)
            let modulations = new Float32Array(13);

            // 3. Apply Matrix Logic
            fx.matrix.forEach((row, lfoIndex) => {
                const sourceValue = lfoValues[lfoIndex]; 
                
                row.forEach((isActive, targetIndex) => {
                    if (isActive) {
                        modulations[targetIndex] += sourceValue * 0.2; // 0.2 depth scaling
                    }
                });
            });

            // 4. Calculate Final Effective Values & Update Audio/LFOs
            
            // --- Effect Parameters (Targets 0-3) ---
            for(let i=0; i<4; i++) {
                let val = fx.params[i] + modulations[i];
                val = Math.max(0, Math.min(1, val)); // Clamp 0-1
                
                // Store for UI
                this.liveValues[fxIndex][i] = val;
                
                // Update Audio Engine
                this.audioEngine.setEffectParam(fx.id, i, val);
            }

            // --- LFO Parameters (Targets 4-12) ---
            // Groups of 3: Rate, Amt, Wave (Targets 4,5,6 / 7,8,9 / 10,11,12)
            for(let lfoIdx=0; lfoIdx<3; lfoIdx++) {
                const targetBase = 4 + (lfoIdx * 3);
                const lfo = fx.lfos[lfoIdx];

                // Rate Modulation
                // Visual only for now as LFO.js doesn't support complex FM
                let baseRate = lfo.rate; 
                let effRate = baseRate + (modulations[targetBase] * 10); 
                effRate = Math.max(0.1, Math.min(20, effRate));
                this.liveValues[fxIndex][targetBase] = effRate;

                // Amount Modulation
                let baseAmt = lfo.amount;
                let effAmt = baseAmt + modulations[targetBase+1];
                effAmt = Math.max(0, Math.min(1, effAmt));
                this.liveValues[fxIndex][targetBase+1] = effAmt;
                
                // Wave Modulation (Ignored for now)
                this.liveValues[fxIndex][targetBase+2] = 0; 
            }
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
    
    getLiveValues(fxId) {
        return this.liveValues[fxId];
    }
}