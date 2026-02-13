// js/ui/components/AutomationPanel.js
import { MODULATION_TARGETS, MAX_MODULATORS } from '../../utils/constants.js';
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

        const numMods = track.lfos.length;

        // Shell
        let contentWrapper = document.getElementById('modulatorContent');
        if (!contentWrapper) {
            container.innerHTML = ''; 
            const header = document.createElement('div');
            header.className = 'flex justify-between items-center mb-2 cursor-pointer select-none group';
            header.onclick = (e) => {
                // Don't toggle if clicking +/- buttons
                if (e.target.closest('.mod-add-remove')) return;
                if (window.toggleSection) window.toggleSection('modulatorContent', header);
            };
            header.innerHTML = `
                <label class="text-[10px] text-neutral-500 uppercase font-bold group-hover:text-neutral-300 transition-colors pointer-events-none cursor-pointer">
                    <i class="fas fa-wave-square mr-1"></i> MODULATORS
                </label>
                <div class="flex items-center gap-1">
                    <div class="mod-add-remove flex items-center gap-1" style="pointer-events:auto;"></div>
                    <i class="fas fa-chevron-down text-[10px] text-neutral-600 transition-transform duration-200"></i>
                </div>
            `;
            container.appendChild(header);
            contentWrapper = document.createElement('div');
            contentWrapper.id = 'modulatorContent';
            contentWrapper.className = 'transition-all duration-300 origin-top block';
            container.appendChild(contentWrapper);
        }

        // Update +/- buttons in header
        const addRemoveContainer = container.querySelector('.mod-add-remove');
        if (addRemoveContainer) {
            addRemoveContainer.innerHTML = '';
            const minusBtn = document.createElement('div');
            minusBtn.className = 'text-[10px] px-1 rounded cursor-pointer transition';
            minusBtn.style.cssText = `color:${numMods <= 1 ? '#333' : '#999'}; pointer-events:${numMods <= 1 ? 'none' : 'auto'};`;
            minusBtn.innerHTML = '<i class="fas fa-minus"></i>';
            minusBtn.onclick = (e) => { e.stopPropagation(); Modulator.removeModulator(track.lfos); this.render(); };

            const countLabel = document.createElement('span');
            countLabel.className = 'text-[9px] text-neutral-500 font-mono';
            countLabel.innerText = numMods;

            const plusBtn = document.createElement('div');
            plusBtn.className = 'text-[10px] px-1 rounded cursor-pointer transition';
            plusBtn.style.cssText = `color:${numMods >= MAX_MODULATORS ? '#333' : '#999'}; pointer-events:${numMods >= MAX_MODULATORS ? 'none' : 'auto'};`;
            plusBtn.innerHTML = '<i class="fas fa-plus"></i>';
            plusBtn.onclick = (e) => { e.stopPropagation(); Modulator.addModulator(track.lfos, MAX_MODULATORS); this.render(); };

            addRemoveContainer.appendChild(minusBtn);
            addRemoveContainer.appendChild(countLabel);
            addRemoveContainer.appendChild(plusBtn);
        }

        contentWrapper.innerHTML = '';
        const monolith = document.createElement('div');
        monolith.className = 'monolith-container border-neutral-800';
        const grid = document.createElement('div');
        grid.className = 'synthi-grid';
        grid.style.gridTemplateColumns = `70px repeat(${numMods}, 1fr)`;

        // === ROW: TYPE SELECTOR ===
        const lblType = document.createElement('div');
        lblType.className = 'grid-cell label-cell bg-[#181818]';
        lblType.innerText = 'TYPE';
        grid.appendChild(lblType);

        track.lfos.forEach((mod, i) => {
            const colorClass = this.lfoColors[i % this.lfoColors.length];
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

        // === ROW: ON/OFF ===
        const lblSrc = document.createElement('div');
        lblSrc.className = 'grid-cell label-cell';
        lblSrc.innerText = 'ON/OFF';
        grid.appendChild(lblSrc);

        track.lfos.forEach((mod, i) => {
            const colorClass = this.lfoColors[i % this.lfoColors.length];
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
        const typeRowLabels = {
            [MOD_TYPE.LFO]:         ['WAVE', 'SYNC', 'RATE'],
            [MOD_TYPE.ENV_FOLLOW]:  ['SRC', 'ATK', 'REL', 'INV'],
            [MOD_TYPE.COMPARATOR]:  ['A × B', 'MODE', 'THRESH', 'R / SM'],
            [MOD_TYPE.PHYSICS]:     ['MODE', 'GRAV', 'DAMP', 'TRIG'],
        };

        let maxRows = 0;
        track.lfos.forEach(mod => {
            const labels = typeRowLabels[mod.getType()] || [];
            maxRows = Math.max(maxRows, labels.length);
        });

        // Pre-render type-specific cells
        track.lfos.forEach((mod, i) => {
            const colorClass = this.lfoColors[i % this.lfoColors.length];
            const renderFn = getModulatorUI(mod.getType());
            const tempGrid = document.createElement('div');
            renderFn(tempGrid, mod, i, colorClass, () => this.render(), 'gran-mod');
            mod._uiCells = Array.from(tempGrid.children);
        });

        for (let row = 0; row < maxRows; row++) {
            let labelText = '';
            for (let i = 0; i < track.lfos.length; i++) {
                const labels = typeRowLabels[track.lfos[i].getType()] || [];
                if (labels[row]) { labelText = labels[row]; break; }
            }
            const lbl = document.createElement('div');
            lbl.className = 'grid-cell label-cell';
            lbl.innerText = labelText;
            grid.appendChild(lbl);

            track.lfos.forEach((mod, i) => {
                const colorClass = this.lfoColors[i % this.lfoColors.length];
                const labels = typeRowLabels[mod.getType()] || [];
                if (row < labels.length && mod._uiCells && mod._uiCells[row]) {
                    grid.appendChild(mod._uiCells[row]);
                } else {
                    const empty = document.createElement('div');
                    empty.className = `grid-cell ${colorClass}`;
                    grid.appendChild(empty);
                }
            });
        }
        track.lfos.forEach(mod => { delete mod._uiCells; });

        // === ROW: AMOUNT ===
        const lblAmt = document.createElement('div');
        lblAmt.className = 'grid-cell label-cell';
        lblAmt.innerText = 'AMOUNT';
        grid.appendChild(lblAmt);

        track.lfos.forEach((mod, i) => {
            const colorClass = this.lfoColors[i % this.lfoColors.length];
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
                const colorClass = this.lfoColors[i % this.lfoColors.length];
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
