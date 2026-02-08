// js/ui/components/EffectControls.js
import { LFO } from '../../modules/LFO.js'; // Import LFO definitions

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

        // -- ROW: SOURCE (L1, L2, L3) --
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

        // -- ROW: WAVE --
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

        // -- ROW: RATE -- (Use LFO constants)
        const rateDef = LFO.PARAM_DEFS.rate;
        this.createSliderRow(grid, 'RATE', state.lfos, config.lfoColors, (lfo) => lfo.rate, (i, val) => this.manager.setLfoParam(fxId, i, 'rate', val), rateDef.min, rateDef.max, rateDef.step);

        // -- ROW: AMOUNT -- (Use LFO constants)
        const amtDef = LFO.PARAM_DEFS.amount;
        this.createSliderRow(grid, 'AMOUNT', state.lfos, config.lfoColors, (lfo) => lfo.amount, (i, val) => this.manager.setLfoParam(fxId, i, 'amount', val), amtDef.min, amtDef.max, amtDef.step);

        // -- ROW: CLEAR --
        const lblClear = document.createElement('div');
        lblClear.className = 'grid-cell label-cell bg-[#222] text-[7px] h-6';
        lblClear.innerText = 'CLEAR';
        grid.appendChild(lblClear);

        state.lfos.forEach((lfo, i) => {
            const cell = document.createElement('div');
            cell.className = 'grid-cell bg-[#222] h-6 cursor-pointer hover:text-red-500 text-neutral-600 transition';
            cell.innerHTML = '<i class="fas fa-trash text-[8px]"></i>';
            cell.onclick = () => {
                // Clear this column in the matrix
                // LFO index i corresponds to matrix row i
                // We need to clear fx.matrix[i]
                for(let t=0; t<13; t++) {
                    state.matrix[i][t] = 0;
                }
                this.render();
            };
            grid.appendChild(cell);
        });

        // -- MATRIX DESTINATIONS --
        // Config params are targets 0-3
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
            cell.className = `grid-cell ${colors[i]}`;
            
            const input = document.createElement('input');
            input.type = 'range';
            input.className = 'micro-slider';
            input.min = min; input.max = max; input.step = step;
            input.value = getter(lfo);
            input.title = getter(lfo).toFixed(step < 0.01 ? 3 : 2); // Tooltip
            
            input.oninput = (e) => {
                setter(i, parseFloat(e.target.value));
                input.title = parseFloat(e.target.value).toFixed(step < 0.01 ? 3 : 2);
            }
            // Trigger re-render on change to update Amount switch state if needed
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

        // 3 LFOs (Columns)
        for(let lfoIdx=0; lfoIdx<3; lfoIdx++) {
            const cell = document.createElement('div');
            cell.className = `grid-cell border-t border-neutral-800 ${colors[lfoIdx]}`;
            
            const isActive = state.matrix[lfoIdx][targetIdx];
            
            // Always show the diamond frame (node)
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

    animate() {
        if (!this.container || this.isDragging) {
            requestAnimationFrame(this.animate);
            return;
        }

        const sliders = this.container.querySelectorAll('.fx-param-slider');
        sliders.forEach(slider => {
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
        });

        requestAnimationFrame(this.animate);
    }
}