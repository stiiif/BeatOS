// js/ui/components/EffectControls.js
import { LFO } from '../../modules/modulators/LFO.js';
import { Modulator, MOD_TYPE } from '../../modules/modulators/Modulator.js';
import { createLfoRateSlider, createLfoSyncCell } from '../shared/LfoRateSlider.js';
import { getModulatorUI, MOD_TYPE_LABELS } from '../shared/modulators/ModulatorUIRegistry.js';

export class EffectControls {
    constructor(effectsManager) {
        this.manager = effectsManager;
        this.container = document.getElementById('effectsControlsContainer');
        this.isDragging = false;
        this._cachedSliders = null; // Cached slider references
        
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

        // Animation now handled by RenderLoop
    }

    render() {
        if (!this.container) return;
        this.container.innerHTML = '';
        this._cachedSliders = null; // Invalidate cache

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

        const numMods = state.lfos.length;

        // 3. MODULATOR SECTION HEADER with +/- buttons
        const modHeader = document.createElement('div');
        modHeader.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding:2px 4px;';
        const modLabel = document.createElement('span');
        modLabel.style.cssText = 'font-size:8px; color:#666; text-transform:uppercase;';
        modLabel.innerText = 'Modulators';
        modHeader.appendChild(modLabel);

        const addRemove = document.createElement('div');
        addRemove.style.cssText = 'display:flex; align-items:center; gap:4px;';
        const mkBtn = (icon, enabled, onClick) => {
            const b = document.createElement('div');
            b.style.cssText = `font-size:9px; cursor:${enabled ? 'pointer' : 'default'}; color:${enabled ? '#999' : '#333'}; padding:0 2px;`;
            b.innerHTML = `<i class="fas fa-${icon}"></i>`;
            if (enabled) b.onclick = onClick;
            return b;
        };
        addRemove.appendChild(mkBtn('minus', numMods > 1, () => { this.manager.removeFxModulator(fxId); this.render(); }));
        const cnt = document.createElement('span');
        cnt.style.cssText = 'font-size:8px; color:#555; font-family:monospace;';
        cnt.innerText = numMods;
        addRemove.appendChild(cnt);
        addRemove.appendChild(mkBtn('plus', numMods < 8, () => { this.manager.addFxModulator(fxId, 8); this.render(); }));
        modHeader.appendChild(addRemove);
        wrapper.appendChild(modHeader);

        // 4. MODULATOR MATRIX
        const grid = document.createElement('div');
        grid.className = 'synthi-grid';
        grid.style.gridTemplateColumns = `70px repeat(${numMods}, 1fr)`;

        // -- ROW 0: TYPE SELECTOR --
        const lblType = document.createElement('div');
        lblType.className = 'grid-cell label-cell bg-[#181818]';
        lblType.innerText = 'TYPE';
        grid.appendChild(lblType);

        state.lfos.forEach((mod, i) => {
            const cell = document.createElement('div');
            cell.className = `grid-cell ${config.lfoColors[i]}`;
            const btnRow = document.createElement('div');
            btnRow.style.cssText = 'display:flex; gap:1px; width:100%;';
            MOD_TYPE_LABELS.forEach(({ type, label, color }) => {
                const btn = document.createElement('div');
                const isActive = (mod.getType ? mod.getType() : MOD_TYPE.LFO) === type;
                btn.className = `wave-btn ${isActive ? 'active' : ''}`;
                btn.innerText = label;
                btn.style.cssText = `font-size:7px; flex:1; text-align:center; padding:1px 0; ${isActive ? `color:${color};` : ''}`;
                btn.onclick = () => {
                    if ((mod.getType ? mod.getType() : MOD_TYPE.LFO) === type) return;
                    const newMod = Modulator.create(type);
                    newMod.amount = mod.amount;
                    state.lfos[i] = newMod;
                    this.render();
                };
                btnRow.appendChild(btn);
            });
            cell.appendChild(btnRow);
            grid.appendChild(cell);
        });

        // -- ROW 1: SOURCE (M1, M2, M3) --
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
            btn.innerText = `M${i+1}`;
            btn.onclick = () => {
                if (lfo.amount > 0) { lfo._lastAmt = lfo.amount; lfo.amount = 0; }
                else { lfo.amount = lfo._lastAmt || 0.5; }
                this.render(); 
            };
            cell.appendChild(btn);
            grid.appendChild(cell);
        });

        // -- TYPE-SPECIFIC ROWS --
        // For each slot, render type-specific UI into temp containers, then interleave
        const typeRowLabels = {
            [MOD_TYPE.LFO]:         ['WAVE', 'SYNC', 'RATE'],
            [MOD_TYPE.ENV_FOLLOW]:  ['SRC', 'ATK', 'REL', 'INV'],
            [MOD_TYPE.COMPARATOR]:  ['A × B', 'MODE', 'THRESH', 'R / SM'],
            [MOD_TYPE.PHYSICS]:     ['MODE', 'GRAV', 'DAMP', 'TRIG'],
        };

        let maxRows = 0;
        state.lfos.forEach(mod => {
            const t = mod.getType ? mod.getType() : MOD_TYPE.LFO;
            const labels = typeRowLabels[t] || [];
            maxRows = Math.max(maxRows, labels.length);
        });

        // Pre-render all type-specific cells
        state.lfos.forEach((mod, i) => {
            const t = mod.getType ? mod.getType() : MOD_TYPE.LFO;
            const renderFn = getModulatorUI(t);
            const tempGrid = document.createElement('div');
            const color = config.lfoColors[i % config.lfoColors.length];
            renderFn(tempGrid, mod, i, color, () => this.render(), `fx${fxId}-mod`);
            mod._uiCells = Array.from(tempGrid.children);
        });

        for (let row = 0; row < maxRows; row++) {
            let labelText = '';
            for (let i = 0; i < state.lfos.length; i++) {
                const t = state.lfos[i].getType ? state.lfos[i].getType() : MOD_TYPE.LFO;
                const labels = typeRowLabels[t] || [];
                if (labels[row]) { labelText = labels[row]; break; }
            }
            const lbl = document.createElement('div');
            lbl.className = 'grid-cell label-cell';
            lbl.innerText = labelText;
            grid.appendChild(lbl);

            state.lfos.forEach((mod, i) => {
                const t = mod.getType ? mod.getType() : MOD_TYPE.LFO;
                const labels = typeRowLabels[t] || [];
                if (row < labels.length && mod._uiCells && mod._uiCells[row]) {
                    grid.appendChild(mod._uiCells[row]);
                } else {
                    const empty = document.createElement('div');
                    empty.className = `grid-cell ${config.lfoColors[i % config.lfoColors.length]}`;
                    grid.appendChild(empty);
                }
            });
        }

        state.lfos.forEach(mod => { delete mod._uiCells; });

        // -- ROW 5: AMOUNT -- 
        const amtDef = LFO.PARAM_DEFS.amount;
        this.createSliderRow(grid, 'AMOUNT', state.lfos, config.lfoColors, (lfo) => lfo.amount, (i, val) => this.manager.setLfoParam(fxId, i, 'amount', val), amtDef.min, amtDef.max, amtDef.step);

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
                if (state.matrix[i]) {
                    for(let t = 0; t < state.matrix[i].length; t++) {
                        state.matrix[i][t] = 0;
                    }
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

    createSliderRow(grid, label, lfos, colors, getter, setter, min, max, step) {
        const lbl = document.createElement('div');
        lbl.className = 'grid-cell label-cell';
        lbl.innerText = label;
        grid.appendChild(lbl);

        lfos.forEach((lfo, i) => {
            const cell = document.createElement('div');
            cell.className = `grid-cell ${colors[i % colors.length]}`;
            
            const input = document.createElement('input');
            input.type = 'range';
            input.className = 'micro-slider';
            input.min = min; input.max = max; input.step = step;
            input.value = getter(lfo);
            input.title = getter(lfo).toFixed(step < 0.01 ? 3 : 2);
            
            input.oninput = (e) => {
                setter(i, parseFloat(e.target.value));
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

        for(let lfoIdx = 0; lfoIdx < state.lfos.length; lfoIdx++) {
            const cell = document.createElement('div');
            cell.className = `grid-cell border-t border-neutral-800 ${colors[lfoIdx % colors.length]}`;
            
            const isActive = state.matrix[lfoIdx] && state.matrix[lfoIdx][targetIdx];
            
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

    /** Called by RenderLoop — replaces internal rAF */
    update(timestamp) {
        if (!this.container || this.isDragging) return;
        // Check if FX container is visible
        if (this.container.offsetParent === null) return;

        // Cache slider refs on first call or after render()
        if (!this._cachedSliders) {
            this._cachedSliders = Array.from(this.container.querySelectorAll('.fx-param-slider'));
        }

        for (let i = 0; i < this._cachedSliders.length; i++) {
            const slider = this._cachedSliders[i];
            const fxId = parseInt(slider.dataset.fx);
            const targetIdx = parseInt(slider.dataset.target);
            
            if (!isNaN(fxId) && !isNaN(targetIdx)) {
                const liveValues = this.manager.getLiveValues(fxId);
                if (liveValues) {
                    const val = liveValues[targetIdx];
                    if (Math.abs(slider.value - val) > 0.005) {
                        slider.value = val;
                    }
                }
            }
        }
    }
}