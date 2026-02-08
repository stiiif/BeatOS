// js/ui/components/EffectControls.js
import { LFO } from '../../modules/LFO.js';

export class EffectControls {
    constructor(effectsManager) {
        this.manager = effectsManager;
        this.container = document.getElementById('effectsControlsContainer');
        this.isDragging = false;
        
        // Colors & Config
        this.fxConfig = {
            0: {
                name: 'DELAY',
                class: 'border-emerald-500/20',
                activeBtnClass: 'active-a',
                lfoColors: ['c-blue', 'c-purple', 'c-amber'],
                paramNames: ['Time', 'Feedback', 'Color', 'Mix'],
                types: ['DLY', 'REV', 'FLG', 'CHR']
            },
            1: {
                name: 'REVERB',
                class: 'border-purple-500/20',
                activeBtnClass: 'active-b',
                lfoColors: ['c-emerald', 'c-blue', 'c-amber'],
                paramNames: ['Tone', 'Size', 'Damp', 'Mix'],
                types: ['DLY', 'REV', 'FLG', 'CHR']
            }
        };

        // Bind animate loop
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    render() {
        if (!this.container) return;
        this.container.innerHTML = '';

        [0, 1].forEach(fxId => {
            const el = this.renderMonolith(fxId);
            this.container.appendChild(el);
        });
    }

    renderMonolith(fxId) {
        const state = this.manager.getEffectState(fxId);
        const config = this.fxConfig[fxId];
        
        const wrapper = document.createElement('div');
        wrapper.className = `monolith-container ${config.class}`;

        // 1. FX SELECTION HEADER
        const header = document.createElement('div');
        header.className = 'fx-selector';
        config.types.forEach((type, idx) => {
            const btn = document.createElement('div');
            // Hardcoded active state for now based on index
            const isActive = (fxId === 0 && idx === 0) || (fxId === 1 && idx === 1);
            btn.className = `fx-type-btn ${isActive ? config.activeBtnClass : ''}`;
            btn.innerText = type;
            header.appendChild(btn);
        });
        wrapper.appendChild(header);

        // 2. FX MACROS
        const macros = document.createElement('div');
        macros.className = 'fx-macros';
        config.paramNames.forEach((name, pIdx) => {
            const div = document.createElement('div');
            div.innerHTML = `<label class="macro-label">${name}</label>`;
            
            const slider = document.createElement('input');
            slider.type = 'range';
            slider.className = 'macro-slider fx-param-slider';
            slider.min = 0; slider.max = 1; slider.step = 0.01;
            slider.value = state.params[pIdx];
            slider.dataset.fx = fxId;
            slider.dataset.target = pIdx; // Targets 0-3 are Params
            
            slider.addEventListener('mousedown', () => this.isDragging = true);
            slider.addEventListener('mouseup', () => this.isDragging = false);
            slider.oninput = (e) => {
                this.manager.setParam(fxId, pIdx, parseFloat(e.target.value));
            };

            div.appendChild(slider);
            macros.appendChild(div);
        });
        wrapper.appendChild(macros);

        // 3. MODULATOR MATRIX
        const grid = document.createElement('div');
        grid.className = 'synthi-grid';
        grid.style.gridTemplateColumns = '70px repeat(3, 1fr)';

        // -- ROW 1: SOURCE (L1, L2, L3) --
        const lblSrc = document.createElement('div');
        lblSrc.className = 'grid-cell label-cell bg-[#181818]';
        lblSrc.innerText = 'SOURCE';
        grid.appendChild(lblSrc);

        state.lfos.forEach((lfo, i) => {
            const cell = document.createElement('div');
            cell.className = `grid-cell ${config.lfoColors[i]}`;
            
            const btn = document.createElement('div');
            const isOn = lfo.amount > 0;
            btn.className = `lfo-switch ${isOn ? 'on' : ''}`;
            btn.innerText = `L${i+1}`;
            
            btn.onclick = () => {
                if (lfo.amount > 0) {
                    lfo._lastAmt = lfo.amount;
                    lfo.amount = 0;
                } else {
                    lfo.amount = lfo._lastAmt || 0.5;
                }
                this.render(); // Re-render to update switch state
            };
            
            cell.appendChild(btn);
            grid.appendChild(cell);
        });

        // -- ROW 2: WAVE --
        const lblWave = document.createElement('div');
        lblWave.className = 'grid-cell label-cell';
        lblWave.style.height = '48px';
        lblWave.innerText = 'WAVE';
        grid.appendChild(lblWave);

        const waves = ['sine', 'square', 'sawtooth', 'triangle', 'pulse', 'random'];
        const waveLabels = ['SIN', 'SQR', 'SAW', 'TRI', 'PLS', 'RND'];

        state.lfos.forEach((lfo, i) => {
            const cell = document.createElement('div');
            cell.className = `grid-cell p-0 ${config.lfoColors[i]}`;
            
            const microGrid = document.createElement('div');
            microGrid.className = 'wave-micro-grid';
            
            waves.forEach((w, idx) => {
                const b = document.createElement('div');
                const active = lfo.wave === w;
                b.className = `wave-btn ${active ? 'active' : ''}`;
                b.innerText = waveLabels[idx];
                b.onclick = () => {
                    this.manager.setLfoParam(fxId, i, 'wave', w);
                    this.render();
                };
                microGrid.appendChild(b);
            });
            cell.appendChild(microGrid);
            grid.appendChild(cell);
        });
        
        // -- ROW 3: SYNC (New) --
        const lblSync = document.createElement('div');
        lblSync.className = 'grid-cell label-cell border-t border-neutral-800';
        lblSync.innerText = 'SYNC';
        grid.appendChild(lblSync);
        
        state.lfos.forEach((lfo, i) => {
            this.createSyncCell(grid, lfo, config.lfoColors[i], (key, val) => this.manager.setLfoParam(fxId, i, key, val));
        });

        // -- ROW 4: RATE (Dual Sliders) --
        const lblRate = document.createElement('div');
        lblRate.className = 'grid-cell label-cell';
        lblRate.style.height = '40px'; // Taller for dual sliders
        lblRate.innerText = 'RATE';
        grid.appendChild(lblRate);
        
        state.lfos.forEach((lfo, i) => {
            this.createRateCell(grid, lfo, config.lfoColors[i], (key, val) => this.manager.setLfoParam(fxId, i, key, val));
        });

        // -- ROW 5: AMOUNT -- (Updated Step)
        const amtDef = LFO.PARAM_DEFS.amount;
        this.createSingleSliderRow(grid, 'AMOUNT', state.lfos, config.lfoColors, (lfo) => lfo.amount, (i, val) => this.manager.setLfoParam(fxId, i, 'amount', val), amtDef.min, amtDef.max, amtDef.step);

        // -- ROW 6: CLEAR --
        const lblClear = document.createElement('div');
        lblClear.className = 'grid-cell label-cell bg-[#222] text-[7px] h-6';
        lblClear.innerText = 'CLEAR';
        grid.appendChild(lblClear);

        state.lfos.forEach((lfo, i) => {
            const cell = document.createElement('div');
            cell.className = 'grid-cell bg-[#222] h-6 cursor-pointer hover:text-red-500 text-neutral-600 transition';
            cell.innerHTML = '<i class="fas fa-trash text-[8px]"></i>';
            cell.onclick = () => {
                for(let t=0; t<13; t++) {
                    state.matrix[i][t] = 0;
                }
                this.render();
            };
            grid.appendChild(cell);
        });

        // -- MATRIX DESTINATIONS --
        config.paramNames.forEach((name, pIdx) => {
            this.createMatrixRow(grid, name, state, pIdx, config.lfoColors, fxId);
        });

        wrapper.appendChild(grid);
        return wrapper;
    }

    createSyncCell(grid, lfo, colorClass, setter) {
        const cell = document.createElement('div');
        cell.className = `grid-cell p-0 ${colorClass}`;
        
        const content = document.createElement('div');
        content.className = 'sync-cell-content';
        
        // 1. Sync Button
        const btn = document.createElement('div');
        btn.className = `sync-btn ${lfo.sync ? 'active' : ''}`;
        btn.innerText = 'SYNC';
        btn.onclick = () => {
            setter('sync', !lfo.sync);
            this.render();
        };
        
        // 2. Gross Value Display
        const grossVal = document.createElement('div');
        grossVal.className = 'sync-val';
        if (lfo.sync) {
            // Find "Gross" label (Anchor). For now, display exact Sync Label.
            // Or if we implement anchor logic strictly: display the closest Anchor?
            // Actually, LFO.SYNC_RATES[index].label is what we want.
            grossVal.innerText = LFO.SYNC_RATES[lfo.syncRateIndex].label;
        } else {
            grossVal.innerText = lfo.rate.toFixed(1) + 'Hz';
        }
        
        // 3. Fine Value Display
        const fineVal = document.createElement('div');
        fineVal.className = 'sync-val';
        fineVal.style.fontSize = "6px";
        if (lfo.sync) {
            // Display type (e.g. +T, +D, or nothing if straight)
            const type = LFO.SYNC_RATES[lfo.syncRateIndex].type;
            if (type === 'triplet') { fineVal.innerText = '+T'; fineVal.style.color = '#60a5fa'; }
            else if (type === 'dotted') { fineVal.innerText = '+D'; fineVal.style.color = '#f472b6'; }
            else if (type === 'quintuplet') { fineVal.innerText = '+Q'; fineVal.style.color = '#a78bfa'; }
            else if (type === 'septuplet') { fineVal.innerText = '+S'; fineVal.style.color = '#fbbf24'; }
            else { fineVal.innerText = '•'; fineVal.style.color = '#444'; }
        } else {
            // Display nothing or fine offset? Since rate is absolute, maybe just '•'
            // Or display fine decimal part?
            // fineVal.innerText = (lfo.rate % 1).toFixed(2).substring(1);
            fineVal.innerText = 'FINE';
        }

        content.appendChild(btn);
        content.appendChild(grossVal);
        content.appendChild(fineVal);
        cell.appendChild(content);
        grid.appendChild(cell);
    }

    createRateCell(grid, lfo, colorClass, setter) {
        const cell = document.createElement('div');
        cell.className = `grid-cell ${colorClass}`;
        
        const stack = document.createElement('div');
        stack.className = 'rate-cell-stack';
        
        // --- 1. GROSS SLIDER ---
        const gross = document.createElement('input');
        gross.type = 'range';
        gross.className = 'micro-slider';
        
        if (lfo.sync) {
            // Map to Indices of "Straight" notes (Anchors)
            // We need to find indices in SYNC_RATES where type == 'straight'
            // Simplification: Slider 0-100 maps to 0 to MaxIndex.
            // On Input: Find nearest straight index.
            gross.min = 0; 
            gross.max = LFO.SYNC_RATES.length - 1; 
            gross.step = 1;
            gross.value = lfo.syncRateIndex;
            
            gross.oninput = (e) => {
                let targetIdx = parseInt(e.target.value);
                // Snap to nearest 'straight' type
                // Search outwards from targetIdx
                let found = -1;
                let range = 5; // Look within 5 neighbors
                if (LFO.SYNC_RATES[targetIdx].type === 'straight') found = targetIdx;
                else {
                    for(let i=1; i<=range; i++) {
                        if(LFO.SYNC_RATES[targetIdx-i] && LFO.SYNC_RATES[targetIdx-i].type === 'straight') { found = targetIdx-i; break; }
                        if(LFO.SYNC_RATES[targetIdx+i] && LFO.SYNC_RATES[targetIdx+i].type === 'straight') { found = targetIdx+i; break; }
                    }
                }
                
                if(found !== -1) setter('syncRateIndex', found);
                else setter('syncRateIndex', targetIdx); // Fallback
                
                this.render(); // Re-render to update texts
            };
        } else {
            // Hz Gross
            gross.min = 0.1; gross.max = 20; gross.step = 0.1;
            gross.value = lfo.rate;
            gross.oninput = (e) => {
                setter('rate', parseFloat(e.target.value));
                this.render();
            };
        }

        // --- 2. FINE SLIDER ---
        const fine = document.createElement('input');
        fine.type = 'range';
        fine.className = 'micro-slider';
        
        if (lfo.sync) {
            // Relative stepping
            // We want center (value=0) to do nothing. 
            // Moving right (+1) adds 1 to index.
            // But sliders are absolute. 
            // Implementation: Slider represents the +/- offset from the LAST ANCHOR?
            // Simpler: Slider IS the index, allowing full freedom, but centered on current?
            // "Default position middle... increment/decrement" implies relative control.
            //
            // Let's implement as: Slider range is small window [-3, +3] around center 0.
            // When user releases, it snaps back to 0? No, standard HTML sliders don't spring back.
            //
            // Let's implement as: Slider maps to full index range, but we assume user uses it for fine adjustments.
            fine.min = 0; 
            fine.max = LFO.SYNC_RATES.length - 1;
            fine.step = 1;
            fine.value = lfo.syncRateIndex; // Follows actual value
            
            fine.oninput = (e) => {
                setter('syncRateIndex', parseInt(e.target.value));
                this.render();
            };
        } else {
            // Hz Fine
            // Center is 0. Range +/- 1 Hz?
            fine.min = -1.0; fine.max = 1.0; fine.step = 0.001;
            fine.value = 0; // Always starts at 0 visually implies it's an offset... 
            // BUT we can't easily store "offset" separately in LFO structure without adding complexity.
            // 
            // Alternative: Fine slider maps to fractional part?
            // "The new slider below allows to do a +1/-1 with step of 0.001."
            // This acts like an offset adder. 
            // Issue: If I move slider to +0.5, rate increases. If I leave it there, rate stays +0.5?
            // Yes. But if I move Gross slider later, does Fine slider reset?
            //
            // Let's make Fine Slider control the *current* rate with high precision range around current value?
            // No, the requirement "slider below allows to do a +1/-1" implies a fixed range offset.
            //
            // To implement this purely visually without extra state:
            // Fine Slider always shows 0.
            // When moved, calculate delta from 0, apply to Rate, then reset slider to 0?
            // That's "Endless Encoder" behavior on a absolute slider. Bad UX (jumps).
            //
            // Best standard UX: 
            // Gross Slider = Course Value.
            // Fine Slider = -0.5 to +0.5 offset. 
            // Displayed Rate = Gross + Fine.
            // But we only have `lfo.rate`.
            //
            // Compromise:
            // Fine Slider controls `lfo.rate` directly but with a zoomed-in range?
            //
            // Let's try the Offset Approach (Requires State, but we can fake it?)
            // No, simpler: Fine Slider IS the standard rate slider but with fine step, and Gross is course step?
            // But they are separate controls.
            //
            // Let's implement: Fine Slider = +/- 1Hz Offset.
            // Since we don't store "base" vs "offset", we'll just have to accept that moving Gross might jump if we don't track it.
            // Actually, `EffectControls` is transient UI. We can't store state easily.
            // 
            // Let's map Fine Slider to: `lfo.rate` +/- 1.0Hz?
            // No.
            // Let's map Fine Slider to simply `lfo.rate` with fine resolution?
            // "Same size as rate slider... finetune".
            //
            // Let's go with: Fine Slider is a relative control [-1, 1]. 
            // We use a temporary property on LFO `lfo._fineOffset`? 
            // No, keep it simple.
            //
            // Implementation: Fine Slider *modifies* `lfo.rate` on change, but visually stays where it is?
            // No.
            // Let's make Fine Slider control the decimal part? 
            //
            // OK: Fine slider range is 0.00 to 1.00.
            // Gross slider range is 0 to 20 (Integer steps).
            // Total Rate = Gross + Fine.
            // This is clean and stateless.
            
            // Re-evaluating: "allows to do a +1/-1"
            // Let's use the range [-1.0, 1.0].
            // We need to persist this offset or the math fails.
            // Let's add `fine` property to LFO? No, keep model simple.
            
            // Let's assume the user accepts that Fine Slider is just a high-precision slider for the full range?
            // No, that's hard to use.
            
            // **Decision**: 
            // Gross Slider: `min=0, max=20, step=0.1`. Value = `lfo.rate`.
            // Fine Slider: `min=currentRate-0.5`, `max=currentRate+0.5`.
            // This makes the slider a "window" around the current value.
            // Moving it updates rate.
            // render() updates the window center.
            // This feels natural: the slider handle stays under the mouse, but the range shifts as you move.
            
            fine.min = lfo.rate - 0.5;
            fine.max = lfo.rate + 0.5;
            fine.step = 0.001;
            fine.value = lfo.rate;
            
            fine.oninput = (e) => {
                setter('rate', parseFloat(e.target.value));
                // Don't re-render immediately to keep slider stable under mouse?
                // Actually if we re-render, min/max shift, slider jumps.
                // We must NOT re-render MONOLITH on input, only on change (release).
                // But we need to update audio.
                // EffectControls handles this: `oninput` calls setter (updates audio).
                // `onchange` calls render (updates UI).
            };
            fine.onchange = () => this.render();
        }

        stack.appendChild(gross);
        stack.appendChild(fine);
        cell.appendChild(stack);
        grid.appendChild(cell);
    }

    createSingleSliderRow(grid, label, lfos, colors, getter, setter, min, max, step) {
        const lbl = document.createElement('div');
        lbl.className = 'grid-cell label-cell';
        lbl.innerText = label;
        grid.appendChild(lbl);

        lfos.forEach((lfo, i) => {
            const cell = document.createElement('div');
            cell.className = `grid-cell ${colors[i]}`;
            
            const input = document.createElement('input');
            input.type = 'range';
            input.className = 'micro-slider';
            input.min = min; input.max = max; input.step = step;
            input.value = getter(lfo);
            input.title = getter(lfo).toFixed(step < 0.01 ? 3 : 2);
            
            input.oninput = (e) => {
                setter(lfo, parseFloat(e.target.value));
                input.title = parseFloat(e.target.value).toFixed(step < 0.01 ? 3 : 2);
            };
            input.onchange = () => this.render();

            cell.appendChild(input);
            grid.appendChild(cell);
        });
    }

    createMatrixRow(grid, label, state, targetIdx, colors, fxId) {
        const lbl = document.createElement('div');
        lbl.className = 'grid-cell label-cell border-t border-neutral-800';
        lbl.innerText = label;
        grid.appendChild(lbl);

        for(let lfoIdx=0; lfoIdx<3; lfoIdx++) {
            const cell = document.createElement('div');
            cell.className = `grid-cell border-t border-neutral-800 ${colors[lfoIdx]}`;
            
            const isActive = state.matrix[lfoIdx][targetIdx];
            
            const node = document.createElement('div');
            node.className = `circuit-node ${isActive ? 'node-active' : ''}`;
            
            cell.onclick = () => {
                this.manager.toggleMatrix(fxId, lfoIdx, targetIdx);
                this.render();
            };

            cell.appendChild(node);
            grid.appendChild(cell);
        }
    }
}