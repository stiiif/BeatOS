import { LFO } from './modulators/LFO.js';
import { NUM_FX_MODS } from '../utils/constants.js';

export class EffectsManager {
    constructor(audioEngine) {
        this.audioEngine = audioEngine;
        this.effects = [
            this.createEffectState(0), // FX 1
            this.createEffectState(1)  // FX 2
        ];
        
        this.currentBpm = 120; // Default
        
        // Store live modulated values for UI visualization
        // Structure: [FX_ID][TARGET_INDEX]
        // 13 targets: P1..Mix (4) + LFO1(3) + LFO2(3) + LFO3(3)
        this.liveValues = [
            new Float32Array(13),
            new Float32Array(13)
        ];
    }
    
    setBpm(bpm) {
        this.currentBpm = parseFloat(bpm);
    }

    createEffectState(id) {
        const lfos = Array.from({ length: NUM_FX_MODS }, () => new LFO());
        return {
            id,
            params: [0.5, 0.5, 0.5, 0.5], 
            lfos,
            // Matrix: N sources (rows) x 13 targets (cols) — rebuilt dynamically
            matrix: Array(lfos.length).fill(null).map(() => Array(13).fill(0))
        };
    }

    update(time) {
        this.effects.forEach((fx, fxIndex) => {
            const numMods = fx.lfos.length;
            const numTargets = 4 + numMods * 3; // 4 FX params + 3 per modulator (rate, amt, wave)

            // 1. Calculate Source Values with context
            const modCtx = { siblings: fx.lfos, audioEngine: this.audioEngine };
            const lfoValues = fx.lfos.map((lfo, idx) => {
                modCtx.selfIndex = idx;
                return lfo.getValue(time, this.currentBpm, modCtx);
            });
            
            // 2. Initialize Modulators Accumulator
            let modulations = new Float32Array(numTargets);

            // 3. Apply Matrix Logic (matrix rows may be fewer than numMods if just added)
            for (let lfoIndex = 0; lfoIndex < Math.min(fx.matrix.length, numMods); lfoIndex++) {
                const row = fx.matrix[lfoIndex];
                const sourceValue = lfoValues[lfoIndex];
                for (let targetIndex = 0; targetIndex < Math.min(row.length, numTargets); targetIndex++) {
                    if (row[targetIndex]) {
                        modulations[targetIndex] += sourceValue * 0.2;
                    }
                }
            }

            // 4. Ensure liveValues array is large enough
            if (!this.liveValues[fxIndex] || this.liveValues[fxIndex].length < numTargets) {
                this.liveValues[fxIndex] = new Float32Array(numTargets);
            }

            // --- Effect Parameters (Targets 0-3) ---
            for(let i=0; i<4; i++) {
                let val = fx.params[i] + modulations[i];
                val = Math.max(0, Math.min(1, val));
                this.liveValues[fxIndex][i] = val;
                this.audioEngine.setEffectParam(fx.id, i, val);
            }

            // --- Modulator Parameters (Targets 4+) ---
            for(let lfoIdx = 0; lfoIdx < numMods; lfoIdx++) {
                const targetBase = 4 + (lfoIdx * 3);
                const lfo = fx.lfos[lfoIdx];
                if (!lfo) continue;

                let baseRate = lfo.rate || 1; 
                let effRate = baseRate + (modulations[targetBase] * 10); 
                effRate = Math.max(0.1, Math.min(20, effRate));
                this.liveValues[fxIndex][targetBase] = effRate;

                let baseAmt = lfo.amount;
                let effAmt = baseAmt + modulations[targetBase+1];
                effAmt = Math.max(0, Math.min(1, effAmt));
                this.liveValues[fxIndex][targetBase+1] = effAmt;
                
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
            if (param === 'sync') lfo.sync = value;
            if (param === 'syncRateIndex') lfo.syncRateIndex = value;
        }
    }

    toggleMatrix(fxId, sourceIdx, targetIdx) {
        const fx = this.effects[fxId];
        if (!fx || !fx.matrix[sourceIdx]) return 0;
        fx.matrix[sourceIdx][targetIdx] = fx.matrix[sourceIdx][targetIdx] ? 0 : 1;
        return fx.matrix[sourceIdx][targetIdx];
    }

    /** Add a modulator to an FX slot, expand matrix */
    addFxModulator(fxId, maxCount = 8) {
        const fx = this.effects[fxId];
        if (!fx || fx.lfos.length >= maxCount) return false;
        const { Modulator, MOD_TYPE } = require_modulator();
        fx.lfos.push(Modulator.create(MOD_TYPE.LFO));
        const numTargets = 4 + fx.lfos.length * 3;
        fx.matrix.push(Array(numTargets).fill(0));
        // Extend existing rows to new target count
        fx.matrix.forEach(row => { while (row.length < numTargets) row.push(0); });
        return true;
    }

    /** Remove last modulator from an FX slot, shrink matrix */
    removeFxModulator(fxId) {
        const fx = this.effects[fxId];
        if (!fx || fx.lfos.length <= 1) return false;
        fx.lfos.pop();
        fx.matrix.pop();
        return true;
    }
    
    getEffectState(fxId) {
        return this.effects[fxId];
    }
    
    getLiveValues(fxId) {
        return this.liveValues[fxId];
    }
}

// Lazy import helper to avoid circular
function require_modulator() {
    return { Modulator: _modRef, MOD_TYPE: _modTypeRef };
}
let _modRef, _modTypeRef;
import('./modulators/Modulator.js').then(m => { _modRef = m.Modulator; _modTypeRef = m.MOD_TYPE; });