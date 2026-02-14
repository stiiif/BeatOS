import { LFO } from './modulators/LFO.js';
import { NUM_FX_MODS } from '../utils/constants.js';

export class EffectsManager {
    constructor(audioEngine) {
        this.audioEngine = audioEngine;
        this.effects = [
            this.createEffectState(0), // FX 1
            this.createEffectState(1)  // FX 2
        ];
        
        this.currentBpm = 120;
        
        this.liveValues = [
            new Float32Array(13),
            new Float32Array(13)
        ];

        // A3: Pre-allocated buffers for update() — zero alloc per frame
        this._lfoValues = new Float32Array(8);
        this._modulations = new Float32Array(28); // 4 + 8*3
        this._modCtx = { siblings: null, audioEngine: null, selfIndex: 0 };
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
        const modCtx = this._modCtx;
        modCtx.audioEngine = this.audioEngine;
        modCtx.globalStepFrac = this.audioEngine._scheduler ? (this.audioEngine._scheduler.totalStepsPlayed || 0) : 0;
        const lfoVals = this._lfoValues;
        const mods = this._modulations;

        for (let fxIndex = 0; fxIndex < this.effects.length; fxIndex++) {
            const fx = this.effects[fxIndex];
            const numMods = fx.lfos.length;
            const numTargets = 4 + numMods * 3;

            // 1. Calculate LFO values — reuse pre-alloc array
            modCtx.siblings = fx.lfos;
            for (let idx = 0; idx < numMods; idx++) {
                modCtx.selfIndex = idx;
                lfoVals[idx] = fx.lfos[idx].getValue(time, this.currentBpm, modCtx);
            }
            
            // 2. Zero modulations — only the range we need
            for (let i = 0; i < numTargets; i++) mods[i] = 0;

            // 3. Apply Matrix
            const matLen = Math.min(fx.matrix.length, numMods);
            for (let lfoIndex = 0; lfoIndex < matLen; lfoIndex++) {
                const row = fx.matrix[lfoIndex];
                const sv = lfoVals[lfoIndex];
                const rowLen = Math.min(row.length, numTargets);
                for (let targetIndex = 0; targetIndex < rowLen; targetIndex++) {
                    if (row[targetIndex]) mods[targetIndex] += sv * 0.2;
                }
            }

            // 4. Ensure liveValues large enough
            if (!this.liveValues[fxIndex] || this.liveValues[fxIndex].length < numTargets) {
                this.liveValues[fxIndex] = new Float32Array(numTargets);
            }

            // Effect params (0-3)
            for (let i = 0; i < 4; i++) {
                let val = fx.params[i] + mods[i];
                if (val < 0) val = 0; else if (val > 1) val = 1;
                this.liveValues[fxIndex][i] = val;
                this.audioEngine.setEffectParam(fx.id, i, val);
            }

            // Modulator params (4+)
            for (let lfoIdx = 0; lfoIdx < numMods; lfoIdx++) {
                const targetBase = 4 + (lfoIdx * 3);
                const lfo = fx.lfos[lfoIdx];
                if (!lfo) continue;

                let effRate = (lfo.rate || 1) + (mods[targetBase] * 10);
                if (effRate < 0.1) effRate = 0.1; else if (effRate > 20) effRate = 20;
                this.liveValues[fxIndex][targetBase] = effRate;

                let effAmt = lfo.amount + mods[targetBase+1];
                if (effAmt < 0) effAmt = 0; else if (effAmt > 1) effAmt = 1;
                this.liveValues[fxIndex][targetBase+1] = effAmt;
                
                this.liveValues[fxIndex][targetBase+2] = 0; 
            }
        }
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