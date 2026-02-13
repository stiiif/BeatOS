// js/ui/components/AutomationPanel.js
import { NUM_LFOS, MODULATION_TARGETS } from '../../utils/constants.js';
import { Modulator, MOD_TYPE } from '../../modules/modulators/Modulator.js';
import { LFO } from '../../modules/modulators/LFO.js';
import { getModulatorUI, MOD_TYPE_LABELS } from '../shared/modulators/ModulatorUIRegistry.js';

export class AutomationPanel {
    constructor() {
        this.tracks = [];
        this.selectedTrackIndex = 0;
        this.lfoColors = ['c-emerald', 'c-blue', 'c-purple'];
    }

    setTracks(tracks) { this.tracks = tracks; }
    setSelectedTrackIndex(idx) { this.selectedTrackIndex = idx; this.render(); }
    initialize(onSetSelectedLfoIndex, onUpdateLfoUI) { this.render(); }

    render() {
        const container = document.getElementById('lfoSection');
        if (!container) return;
        
        const track = this.tracks[this.selectedTrackIndex];
        if (!track || track.type !== 'granular') {
            container.innerHTML = '';
            return;
        }

        // Shell
        let contentWrapper = document.getElementById('modulatorContent');
        if (!contentWrapper) {
            container.innerHTML = ''; 
            const header = document.createElement('div');
            header.className = 'flex justify-between items-center mb-2 cursor-pointer select-none group';
            header.onclick = () => { if (window.toggleSection) window.toggleSection('modulatorContent', header); };
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

        contentWrapper.innerHTML = '';
        const monolith = document.createElement('div');
        monolith.className = 'monolith-container border-neutral-800';
        const grid = document.createElement('div');
        grid.className = 'synthi-grid';
        grid.style.gridTemplateColumns = `70px repeat(${NUM_LFOS}, 1fr)`;

        // === ROW: TYPE SELECTOR ===
        const lblType = document.createElement('div');
        lblType.className = 'grid-cell label-cell bg-[#181818]';
        lblType.innerText = 'TYPE';
        grid.appendChild(lblType);

        track.lfos.forEach((mod, i) => {
            if (i >= NUM_LFOS) return;
            const colorClass = this.lfoColors[i % 3];
            const cell = document.createElement('div');
            cell.className = `grid-cell ${colorClass}`;
            const btnRow = document.createElement('div');
            btnRow.style.cssText = 'display:flex; gap:1px; width:100%;';

            MOD_TYPE_LABELS.forEach(({ type, label, color }) => {
                const btn = document.createElement('div');
                const isActive = mod.getType() === type;
                btn.className = `wave-btn ${isActive ? 'active' : ''}`;
                btn.innerText = label;
                btn.style.cssText = `font-size:7px; flex:1; text-align:center; padding:1px 0; ${isActive ? `color:${color};` : ''}`;
                btn.onclick = () => {
                    if (mod.getType() === type) return;
                    const newMod = Modulator.create(type);
                    newMod.amount = mod.amount;
                    newMod.targets = [...mod.targets];
                    track.lfos[i] = newMod;
                    this.render();
                };
                btnRow.appendChild(btn);
            });
            cell.appendChild(btnRow);
            grid.appendChild(cell);
        });

        // === ROW: SOURCE (on/off toggle) ===
        const lblSrc = document.createElement('div');
        lblSrc.className = 'grid-cell label-cell';
        lblSrc.innerText = 'ON/OFF';
        grid.appendChild(lblSrc);

        track.lfos.forEach((mod, i) => {
            if (i >= NUM_LFOS) return;
            const colorClass = this.lfoColors[i % 3];
            const cell = document.createElement('div');
            cell.className = `grid-cell ${colorClass}`;
            const btn = document.createElement('div');
            const isOn = mod.amount > 0;
            btn.className = `lfo-switch ${isOn ? 'on' : ''}`;
            btn.innerText = `M${i+1}`;
            btn.onclick = () => {
                if (mod.amount > 0) { mod._lastAmt = mod.amount; mod.amount = 0; }
                else { mod.amount = mod._lastAmt || 0.5; }
                this.render();
            };
            cell.appendChild(btn);
            grid.appendChild(cell);
        });

        // === TYPE-SPECIFIC ROWS ===
        // Each modulator type renders its own parameter rows via the registry.
        // We add labels on the left for each type's rows.

        // Collect max row count across all slots for label alignment
        const typeRowLabels = {
            [MOD_TYPE.LFO]:         ['WAVE', 'SYNC', 'RATE'],
            [MOD_TYPE.ENV_FOLLOW]:  ['SRC', 'ATK', 'REL', 'INV'],
            [MOD_TYPE.COMPARATOR]:  ['A × B', 'MODE', 'THRESH', 'R / SM'],
            [MOD_TYPE.PHYSICS]:     ['MODE', 'GRAV', 'DAMP', 'TRIG'],
        };

        // Find the max number of type-specific rows across all slots
        let maxRows = 0;
        track.lfos.forEach((mod, i) => {
            if (i >= NUM_LFOS) return;
            const labels = typeRowLabels[mod.getType()] || [];
            maxRows = Math.max(maxRows, labels.length);
        });

        // Render row by row
        for (let row = 0; row < maxRows; row++) {
            // Label: use the first slot that has a label for this row
            let labelText = '';
            for (let i = 0; i < Math.min(NUM_LFOS, track.lfos.length); i++) {
                const labels = typeRowLabels[track.lfos[i].getType()] || [];
                if (labels[row]) { labelText = labels[row]; break; }
            }
            const lbl = document.createElement('div');
            lbl.className = 'grid-cell label-cell';
            lbl.innerText = labelText;
            grid.appendChild(lbl);

            // Each slot renders its row (or empty cell if fewer rows)
            track.lfos.forEach((mod, i) => {
                if (i >= NUM_LFOS) return;
                const colorClass = this.lfoColors[i % 3];
                const labels = typeRowLabels[mod.getType()] || [];
                if (row < labels.length) {
                    const renderFn = getModulatorUI(mod.getType());
                    // Render only the specific row — we call the full render but only take one row at a time
                    // To do this efficiently, we render into a temp grid and extract cells
                    if (row === 0) {
                        // Render all type-specific rows at once into a temp container, then distribute
                        const tempGrid = document.createElement('div');
                        renderFn(tempGrid, mod, i, colorClass, () => this.render(), 'gran-mod');
                        // Store rendered cells on the mod for later rows
                        mod._uiCells = Array.from(tempGrid.children);
                    }
                    // Append the cell for this row
                    if (mod._uiCells && mod._uiCells[row]) {
                        grid.appendChild(mod._uiCells[row]);
                    } else {
                        // Empty placeholder
                        const empty = document.createElement('div');
                        empty.className = `grid-cell ${colorClass}`;
                        grid.appendChild(empty);
                    }
                } else {
                    // Empty cell for this slot (fewer rows than max)
                    const empty = document.createElement('div');
                    empty.className = `grid-cell ${colorClass}`;
                    grid.appendChild(empty);
                }
            });
        }

        // Clean up temp cells
        track.lfos.forEach(mod => { delete mod._uiCells; });

        // === ROW: AMOUNT ===
        const lblAmt = document.createElement('div');
        lblAmt.className = 'grid-cell label-cell';
        lblAmt.innerText = 'AMOUNT';
        grid.appendChild(lblAmt);

        track.lfos.forEach((mod, i) => {
            if (i >= NUM_LFOS) return;
            const colorClass = this.lfoColors[i % 3];
            const cell = document.createElement('div');
            cell.className = `grid-cell ${colorClass}`;
            const input = document.createElement('input');
            input.type = 'range'; input.className = 'micro-slider';
            input.min = 0; input.max = 1; input.step = 0.001;
            input.value = mod.amount;
            input.title = mod.amount.toFixed(3);
            input.oninput = (e) => { mod.amount = parseFloat(e.target.value); input.title = mod.amount.toFixed(3); };
            input.onchange = () => this.render();
            cell.appendChild(input);
            grid.appendChild(cell);
        });

        // === ROW: CLEAR ===
        const lblClear = document.createElement('div');
        lblClear.className = 'grid-cell label-cell bg-[#222] text-[7px] h-6';
        lblClear.innerText = 'CLEAR';
        grid.appendChild(lblClear);

        track.lfos.forEach((mod, i) => {
            if (i >= NUM_LFOS) return;
            const cell = document.createElement('div');
            cell.className = 'grid-cell bg-[#222] h-6 cursor-pointer hover:text-red-500 text-neutral-600 transition';
            cell.innerHTML = '<i class="fas fa-trash text-[8px]"></i>';
            cell.onclick = () => { mod.targets = []; mod.amount = 0; this.render(); };
            grid.appendChild(cell);
        });

        // === DESTINATIONS ===
        MODULATION_TARGETS.forEach(target => {
            const lbl = document.createElement('div');
            lbl.className = 'grid-cell label-cell border-t border-neutral-800';
            lbl.innerText = target.name.toUpperCase();
            grid.appendChild(lbl);

            track.lfos.forEach((mod, i) => {
                if (i >= NUM_LFOS) return;
                const colorClass = this.lfoColors[i % 3];
                const cell = document.createElement('div');
                cell.className = `grid-cell border-t border-neutral-800 ${colorClass}`;
                const isActive = mod.targets.includes(target.id);
                const node = document.createElement('div');
                node.className = `circuit-node ${isActive ? 'node-active' : ''}`;
                cell.onclick = () => {
                    if (mod.targets.includes(target.id)) {
                        mod.targets = mod.targets.filter(t => t !== target.id);
                    } else {
                        mod.targets.push(target.id);
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
}
