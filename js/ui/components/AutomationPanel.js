// js/ui/components/AutomationPanel.js
import { NUM_LFOS, MODULATION_TARGETS } from '../../utils/constants.js';
import { LFO } from '../../modules/LFO.js'; 

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
            const colorClass = this.lfoColors[i % 3] || 'c-amber';
            const cell = document.createElement('div');
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

        // 3. SYNC ROW (New)
        const lblSync = document.createElement('div');
        lblSync.className = 'grid-cell label-cell border-t border-neutral-800';
        lblSync.innerText = 'SYNC';
        grid.appendChild(lblSync);
        
        track.lfos.forEach((lfo, i) => {
            if (i >= NUM_LFOS) return;
            const colorClass = this.lfoColors[i % 3] || 'c-amber';
            this.createSyncCell(grid, lfo, colorClass);
        });

        // 4. RATE ROW (Dual Sliders)
        const lblRate = document.createElement('div');
        lblRate.className = 'grid-cell label-cell';
        lblRate.style.height = '40px'; 
        lblRate.innerText = 'RATE';
        grid.appendChild(lblRate);
        
        track.lfos.forEach((lfo, i) => {
            if (i >= NUM_LFOS) return;
            const colorClass = this.lfoColors[i % 3] || 'c-amber';
            this.createRateCell(grid, lfo, colorClass);
        });

        // 5. AMOUNT ROW
        const amtDef = LFO.PARAM_DEFS.amount;
        this.createSingleSliderRow(grid, 'AMOUNT', track.lfos, (lfo) => lfo.amount, (lfo, val) => lfo.amount = val, amtDef.min, amtDef.max, amtDef.step);

        // 6. CLEAR ROW
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

        // 7. DESTINATIONS
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

    createSyncCell(grid, lfo, colorClass) {
        const cell = document.createElement('div');
        cell.className = `grid-cell p-0 ${colorClass}`;
        
        const content = document.createElement('div');
        content.className = 'sync-cell-content';
        
        // 1. Sync Button
        const btn = document.createElement('div');
        btn.className = `sync-btn ${lfo.sync ? 'active' : ''}`;
        btn.innerText = 'SYNC';
        btn.onclick = () => {
            lfo.sync = !lfo.sync;
            this.render();
        };
        
        // 2. Gross Value Display
        const grossVal = document.createElement('div');
        grossVal.className = 'sync-val';
        if (lfo.sync) {
            grossVal.innerText = LFO.SYNC_RATES[lfo.syncRateIndex].label;
        } else {
            // Unsynced Gross: Show integer part or main part
            grossVal.innerText = lfo.rate.toFixed(1) + 'Hz';
        }
        
        // 3. Fine Value Display (FIXED: Show numeric offset for unsynced)
        const fineVal = document.createElement('div');
        fineVal.className = 'sync-val';
        fineVal.style.fontSize = "6px";
        if (lfo.sync) {
            const type = LFO.SYNC_RATES[lfo.syncRateIndex].type;
            if (type === 'triplet') { fineVal.innerText = '+T'; fineVal.style.color = '#60a5fa'; }
            else if (type === 'dotted') { fineVal.innerText = '+D'; fineVal.style.color = '#f472b6'; }
            else if (type === 'quintuplet') { fineVal.innerText = '+Q'; fineVal.style.color = '#a78bfa'; }
            else if (type === 'septuplet') { fineVal.innerText = '+S'; fineVal.style.color = '#fbbf24'; }
            else { fineVal.innerText = '•'; fineVal.style.color = '#444'; }
        } else {
            // Display fine fractional part
            // Calculate fine part (e.g., 1.25 -> +0.25)
            // But since rate can be any float, we should just show the fractional part for visual feedback
            // or perhaps the delta from the nearest integer?
            // "finetune field must displayed the actual finetuned value"
            // Let's show the full precise value or just the decimals
            const finePart = (lfo.rate % 1).toFixed(3).substring(1); 
            fineVal.innerText = (finePart === '.000' ? '' : '+') + finePart; 
        }

        content.appendChild(btn);
        content.appendChild(grossVal);
        content.appendChild(fineVal);
        cell.appendChild(content);
        grid.appendChild(cell);
    }

    createRateCell(grid, lfo, colorClass) {
        const cell = document.createElement('div');
        cell.className = `grid-cell ${colorClass}`;
        
        const stack = document.createElement('div');
        stack.className = 'rate-cell-stack';
        
        // --- 1. GROSS SLIDER ---
        const gross = document.createElement('input');
        gross.type = 'range';
        gross.className = 'micro-slider';
        
        if (lfo.sync) {
            gross.min = 0; 
            gross.max = LFO.SYNC_RATES.length - 1; 
            gross.step = 1;
            gross.value = lfo.syncRateIndex;
            
            gross.oninput = (e) => {
                let targetIdx = parseInt(e.target.value);
                // Snap to nearest 'straight' type
                let found = -1;
                let range = 6; 
                if (LFO.SYNC_RATES[targetIdx].type === 'straight') found = targetIdx;
                else {
                    for(let i=1; i<=range; i++) {
                        if(LFO.SYNC_RATES[targetIdx-i] && LFO.SYNC_RATES[targetIdx-i].type === 'straight') { found = targetIdx-i; break; }
                        if(LFO.SYNC_RATES[targetIdx+i] && LFO.SYNC_RATES[targetIdx+i].type === 'straight') { found = targetIdx+i; break; }
                    }
                }
                if(found !== -1) lfo.syncRateIndex = found;
                else lfo.syncRateIndex = targetIdx;
            };
            gross.onchange = () => this.render();
        } else {
            // Hz Gross
            gross.min = 0.1; gross.max = 20; gross.step = 0.1;
            gross.value = lfo.rate;
            gross.oninput = (e) => {
                lfo.rate = parseFloat(e.target.value);
            };
            // FIX: If we re-render on Gross change, fine slider range shifts. 
            // This is acceptable for Gross slider as it defines the "window".
            gross.onchange = () => this.render();
        }

        // --- 2. FINE SLIDER ---
        const fine = document.createElement('input');
        fine.type = 'range';
        fine.className = 'micro-slider';
        
        if (lfo.sync) {
            fine.min = 0; 
            fine.max = LFO.SYNC_RATES.length - 1;
            fine.step = 1;
            fine.value = lfo.syncRateIndex;
            
            fine.oninput = (e) => {
                lfo.syncRateIndex = parseInt(e.target.value);
            };
            fine.onchange = () => this.render();
        } else {
            // Hz Fine
            // FIX: Ensure range is stable during drag, but centered on current value
            // To prevent snapping back to center visually, the value must match the range center?
            // No, the value IS `lfo.rate`.
            // The range is `[lfo.rate - 0.5, lfo.rate + 0.5]`.
            // If I drag, `lfo.rate` changes. If I re-render, the range moves, keeping the knob centered.
            // If I DON'T re-render on input, the range stays fixed, and the knob moves. This is standard slider behavior.
            // The issue "finetune sliders always goes back to middle position" suggests re-rendering happens on input?
            // No, I only call `this.render()` on `onchange` (mouse release).
            //
            // If `gross` slider or something else triggers a re-render, then the fine slider range resets.
            // The `gross` slider's `oninput` does NOT trigger render in my code above, only `onchange`.
            //
            // However, maybe `oninput` of fine slider is triggering something external?
            // Or maybe the user *wants* the slider to stay where it is relative to the *absolute scale*?
            //
            // If the fine slider maps to `lfo.rate`, and the range is small around it, it acts like a window.
            // When you drag, `lfo.rate` updates. The visual slider handle moves.
            // When you release, `render()` is called. The range re-centers around the NEW `lfo.rate`.
            // This causes the handle to jump to center.
            // This is the "Endless Encoder / Pitch Wheel" behavior you dislike.
            //
            // **Correction:** To make it act like a normal slider, it needs a FIXED range relative to the *Gross* selection?
            // But Gross is continuous float for Hz.
            //
            // Solution: 
            // 1. **Gross Slider** controls the Integer part (or coarse step).
            // 2. **Fine Slider** controls the Decimal part (0.0 to 1.0).
            // Then `rate = floor(rate) + fine_value`.
            //
            // This decouples them. Gross snaps to integers. Fine fills the gap.
            //
            // Let's implement this for Unsynced Mode:
            // Rate = IntPart + DecimalPart
            
            const intPart = Math.floor(lfo.rate);
            const decPart = lfo.rate - intPart;

            // Gross: 0 to 20, step 1
            if (!lfo.sync) {
                gross.min = 0; gross.max = 20; gross.step = 1;
                gross.value = intPart;
                
                gross.oninput = (e) => {
                    const newInt = parseInt(e.target.value);
                    // Preserve decimal part
                    lfo.rate = newInt + (lfo.rate % 1);
                    // Don't render, just update internal state
                };
                gross.onchange = () => this.render();

                // Fine: 0.0 to 0.999
                fine.min = 0.0; fine.max = 0.999; fine.step = 0.001;
                fine.value = decPart;
                
                fine.oninput = (e) => {
                    const newDec = parseFloat(e.target.value);
                    // Preserve integer part
                    lfo.rate = Math.floor(lfo.rate) + newDec;
                };
                fine.onchange = () => this.render();
            }
        }

        stack.appendChild(gross);
        stack.appendChild(fine);
        cell.appendChild(stack);
        grid.appendChild(cell);
    }

    createSingleSliderRow(grid, label, lfos, getter, setter, min, max, step) {
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
}