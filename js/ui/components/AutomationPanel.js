// js/ui/components/AutomationPanel.js
import { NUM_LFOS, MODULATION_TARGETS } from '../../utils/constants.js';
import { LFO } from '../../modules/LFO.js'; // Import LFO to access constants

export class AutomationPanel {
    constructor() {
        this.tracks = [];
        this.selectedTrackIndex = 0;
        // Colors for Granular LFOs (Emerald, Blue, Purple)
        this.lfoColors = ['c-emerald', 'c-blue', 'c-purple'];
    }

    setTracks(tracks) {
        this.tracks = tracks;
    }

    setSelectedTrackIndex(idx) {
        this.selectedTrackIndex = idx;
        this.render();
    }

    initialize(onSetSelectedLfoIndex, onUpdateLfoUI) {
        this.render();
    }

    render() {
        const container = document.getElementById('lfoSection');
        if (!container) return;
        
        const track = this.tracks[this.selectedTrackIndex];
        if (!track || track.type !== 'granular') {
            container.innerHTML = ''; // Clear if not granular
            return;
        }

        // Check/Create Shell
        let contentWrapper = document.getElementById('modulatorContent');
        if (!contentWrapper) {
            container.innerHTML = ''; 
            const header = document.createElement('div');
            header.className = 'flex justify-between items-center mb-2 cursor-pointer select-none group';
            header.onclick = () => {
                if (window.toggleSection) window.toggleSection('modulatorContent', header);
            };
            
            header.innerHTML = `
                <label class="text-[10px] text-neutral-500 uppercase font-bold group-hover:text-neutral-300 transition-colors pointer-events-none cursor-pointer">
                    <i class="fas fa-wave-square mr-1"></i> MODULATORS
                </label>
                <i class="fas fa-chevron-down text-[10px] text-neutral-600 transition-transform duration-200"></i>
            `;
            container.appendChild(header);

            contentWrapper = document.createElement('div');
            contentWrapper.id = 'modulatorContent';
            contentWrapper.className = 'transition-all duration-300 origin-top block';
            container.appendChild(contentWrapper);
        }

        // Render Monolith into wrapper
        contentWrapper.innerHTML = '';
        
        const monolith = document.createElement('div');
        monolith.className = 'monolith-container border-neutral-800';

        const grid = document.createElement('div');
        grid.className = 'synthi-grid';
        // 70px Label + 3 LFO Columns
        grid.style.gridTemplateColumns = `70px repeat(${NUM_LFOS}, 1fr)`;

        // 1. SOURCE ROW
        const lblSrc = document.createElement('div');
        lblSrc.className = 'grid-cell label-cell bg-[#181818]';
        lblSrc.innerText = 'SOURCE';
        grid.appendChild(lblSrc);

        track.lfos.forEach((lfo, i) => {
            if (i >= NUM_LFOS) return;
            const cell = document.createElement('div');
            // Use our predefined color palette, fallback if >3 LFOs
            const colorClass = this.lfoColors[i % 3] || 'c-amber';
            cell.className = `grid-cell ${colorClass}`;
            
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
                this.render();
            };
            cell.appendChild(btn);
            grid.appendChild(cell);
        });

        // 2. WAVE ROW
        const lblWave = document.createElement('div');
        lblWave.className = 'grid-cell label-cell';
        lblWave.style.height = '48px';
        lblWave.innerText = 'WAVE';
        grid.appendChild(lblWave);

        const waves = ['sine', 'square', 'sawtooth', 'triangle', 'pulse', 'random'];
        const waveLabels = ['SIN', 'SQR', 'SAW', 'TRI', 'PLS', 'RND'];

        track.lfos.forEach((lfo, i) => {
            if (i >= NUM_LFOS) return;
            const colorClass = this.lfoColors[i % 3] || 'c-amber';
            const cell = document.createElement('div');
            cell.className = `grid-cell p-0 ${colorClass}`;
            
            const microGrid = document.createElement('div');
            microGrid.className = 'wave-micro-grid';
            
            waves.forEach((w, idx) => {
                const b = document.createElement('div');
                const active = lfo.wave === w;
                b.className = `wave-btn ${active ? 'active' : ''}`;
                b.innerText = waveLabels[idx];
                b.onclick = () => {
                    lfo.wave = w;
                    this.render();
                };
                microGrid.appendChild(b);
            });
            cell.appendChild(microGrid);
            grid.appendChild(cell);
        });

        // 3. RATE ROW - Use LFO.PARAM_DEFS
        const rateDef = LFO.PARAM_DEFS.rate;
        this.createSliderRow(grid, 'RATE', track.lfos, (lfo) => lfo.rate, (lfo, val) => lfo.rate = val, rateDef.min, rateDef.max, rateDef.step);

        // 4. AMOUNT ROW - Use LFO.PARAM_DEFS
        const amtDef = LFO.PARAM_DEFS.amount;
        this.createSliderRow(grid, 'AMOUNT', track.lfos, (lfo) => lfo.amount, (lfo, val) => lfo.amount = val, amtDef.min, amtDef.max, amtDef.step);

        // 5. CLEAR ROW
        const lblClear = document.createElement('div');
        lblClear.className = 'grid-cell label-cell bg-[#222] text-[7px] h-6';
        lblClear.innerText = 'CLEAR';
        grid.appendChild(lblClear);

        track.lfos.forEach((lfo, i) => {
            if (i >= NUM_LFOS) return;
            const cell = document.createElement('div');
            cell.className = 'grid-cell bg-[#222] h-6 cursor-pointer hover:text-red-500 text-neutral-600 transition';
            cell.innerHTML = '<i class="fas fa-trash text-[8px]"></i>';
            cell.onclick = () => {
                lfo.targets = []; 
                this.render();
            };
            grid.appendChild(cell);
        });

        // 6. DESTINATIONS
        MODULATION_TARGETS.forEach(target => {
            const lbl = document.createElement('div');
            lbl.className = 'grid-cell label-cell border-t border-neutral-800';
            lbl.innerText = target.name.toUpperCase();
            grid.appendChild(lbl);

            track.lfos.forEach((lfo, i) => {
                if (i >= NUM_LFOS) return;
                const colorClass = this.lfoColors[i % 3] || 'c-amber';
                const cell = document.createElement('div');
                cell.className = `grid-cell border-t border-neutral-800 ${colorClass}`;
                
                // Use array check for multiple targets
                const isActive = lfo.targets.includes(target.id);
                
                const node = document.createElement('div');
                node.className = `circuit-node ${isActive ? 'node-active' : ''}`;
                
                cell.onclick = () => {
                    if (lfo.targets.includes(target.id)) {
                        lfo.targets = lfo.targets.filter(t => t !== target.id);
                    } else {
                        lfo.targets.push(target.id);
                    }
                    this.render();
                };

                cell.appendChild(node);
                grid.appendChild(cell);
            });
        });

        monolith.appendChild(grid);
        contentWrapper.appendChild(monolith);
    }

    createSliderRow(grid, label, lfos, getter, setter, min, max, step) {
        const lbl = document.createElement('div');
        lbl.className = 'grid-cell label-cell';
        lbl.innerText = label;
        grid.appendChild(lbl);

        lfos.forEach((lfo, i) => {
            if (i >= NUM_LFOS) return;
            const colorClass = this.lfoColors[i % 3] || 'c-amber';
            const cell = document.createElement('div');
            cell.className = `grid-cell ${colorClass}`;
            
            const input = document.createElement('input');
            input.type = 'range';
            input.className = 'micro-slider';
            input.min = min; input.max = max; input.step = step;
            input.value = getter(lfo);
            input.title = getter(lfo).toFixed(step < 0.01 ? 3 : 2); // Add tooltip with precise value
            
            input.oninput = (e) => {
                setter(lfo, parseFloat(e.target.value));
                input.title = parseFloat(e.target.value).toFixed(step < 0.01 ? 3 : 2);
            };
            input.onchange = () => this.render();

            cell.appendChild(input);
            grid.appendChild(cell);
        });
    }
}