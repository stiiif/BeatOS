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
            // Unsynced Gross: Show integer part
            grossVal.innerText = Math.floor(lfo.rate) + 'Hz';
        }
        
        // 3. Fine Value Display (FIXED: Show numeric offset for unsynced)
        const fineVal = document.createElement('div');
        fineVal.className = 'sync-val';
        fineVal.style.fontSize = "10px";
        if (lfo.sync) {
            const type = LFO.SYNC_RATES[lfo.syncRateIndex].type;
            if (type === 'triplet') { fineVal.innerText = '+T'; fineVal.style.color = '#60a5fa'; }
            else if (type === 'dotted') { fineVal.innerText = '+D'; fineVal.style.color = '#f472b6'; }
            else if (type === 'quintuplet') { fineVal.innerText = '+Q'; fineVal.style.color = '#a78bfa'; }
            else if (type === 'septuplet') { fineVal.innerText = '+S'; fineVal.style.color = '#fbbf24'; }
            else { fineVal.innerText = '•'; fineVal.style.color = '#444'; }
        } else {
            // Unsynced Fine: Show fractional part (the +offset)
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
            // IMPORTANT FIX: Don't just set to current index, find nearest Anchor.
            // This slider only jumps between Straight notes.
            // If current is "1/4 Triplet", slider should be at "1/4".
            // We need a helper to find nearest Anchor index.
            // But if we do that, the slider handle might jump if we moved Fine slider?
            // Actually, "The gross slider position and the finetune slider position must be separated".
            // This implies Gross Slider controls the "Base" index, and Fine controls the "Offset".
            // However, we only store `syncRateIndex`.
            //
            // Let's implement: 
            // Gross Slider = Base Anchor Index.
            // Fine Slider = Relative Offset from that Anchor?
            //
            // Or simpler: Gross Slider controls index directly but SNAPS to Anchors.
            // Fine Slider controls index directly but increments by 1.
            //
            // Issue: If Gross is at "1/4" (Index 17) and Fine moves to "1/4T" (Index 19),
            // does Gross slider move? User says: "moving any of the 2 sliders also moves the other slider to the same position!! ... not good."
            //
            // Solution: We need visual separation.
            // The Gross Slider value should reflect the *nearest Anchor* of the current index.
            // The Fine Slider value should reflect the *relative offset* or just the current index?
            // If Fine Slider reflects current index, it will jump when Gross moves.
            // User wants them separated "like for the un-synced sliders".
            // In un-synced, I implemented: Gross=IntPart, Fine=DecPart.
            //
            // Let's adapt that to Sync:
            // Sync Index can be decomposed into: AnchorIndex + Offset.
            // Gross Slider controls AnchorIndex.
            // Fine Slider controls Offset.
            
            // 1. Find current Anchor (Nearest Straight note <= current index?)
            // LFO.SYNC_RATES isn't strictly structured.
            // Let's find the nearest "straight" type index.
            let anchorIdx = lfo.syncRateIndex;
            // Search for nearest 'straight'
            // Actually, we can just scan the array.
            // Let's find the straight note that is closest? Or strictly below?
            // Let's assume Anchors are the primary divisions.
            // Let's just find the closest straight note index to display on Gross slider.
            
            // Helper to find closest straight index
            const findClosestStraight = (idx) => {
                let minDist = Infinity;
                let closest = idx;
                for(let i=0; i<LFO.SYNC_RATES.length; i++) {
                    if (LFO.SYNC_RATES[i].type === 'straight') {
                        const dist = Math.abs(i - idx);
                        if (dist < minDist) { minDist = dist; closest = i; }
                    }
                }
                return closest;
            };
            
            const currentAnchor = findClosestStraight(lfo.syncRateIndex);
            
            gross.value = currentAnchor;
            
            gross.oninput = (e) => {
                let targetIdx = parseInt(e.target.value);
                // Snap input to nearest straight (slider steps are 1, but we enforce logic)
                const newAnchor = findClosestStraight(targetIdx);
                
                // Preserve the "Offset" (difference between old anchor and old actual)
                // e.g. if we were at 1/4T (Anchor+2), and move to 1/8, we want 1/8T?
                // Or just jump to the new Anchor straight? Usually Gross sets the base.
                // Let's just set to the new Anchor.
                lfo.syncRateIndex = newAnchor;
                
                // Don't render, just update value. Render happens on change.
                // Actually if we don't render, fine slider won't update? 
                // User wants them separated.
            };
            gross.onchange = () => this.render();
        } else {
            // Hz Gross
            const intPart = Math.floor(lfo.rate);
            gross.min = 0; gross.max = 20; gross.step = 1;
            gross.value = intPart;
            
            gross.oninput = (e) => {
                const newInt = parseInt(e.target.value);
                const currentDec = lfo.rate % 1;
                lfo.rate = newInt + currentDec;
            };
            gross.onchange = () => this.render();
        }

        // --- 2. FINE SLIDER ---
        const fine = document.createElement('input');
        fine.type = 'range';
        fine.className = 'micro-slider';
        
        if (lfo.sync) {
            // Synced Fine: Control relative offset from current Anchor?
            // "finetune slider must allow me to choose from 3 bars to 7 bars" (from previous convo)
            // This implies a window around the gross selection.
            
            // Let's define the window: +/- 2 indices from current? 
            // Or +/- 4 indices?
            // Let's use [-5, +5] range relative to the *Anchor* defined by the Gross slider.
            // This means Fine Slider Value 0 = Anchor.
            
            // Re-calculate anchor
            const findClosestStraight = (idx) => {
                let minDist = Infinity;
                let closest = idx;
                for(let i=0; i<LFO.SYNC_RATES.length; i++) {
                    if (LFO.SYNC_RATES[i].type === 'straight') {
                        const dist = Math.abs(i - idx);
                        if (dist < minDist) { minDist = dist; closest = i; }
                    }
                }
                return closest;
            };
            const currentAnchor = findClosestStraight(lfo.syncRateIndex);
            
            // Calculate current offset
            const currentOffset = lfo.syncRateIndex - currentAnchor;
            
            fine.min = -5;
            fine.max = 5;
            fine.step = 1;
            fine.value = currentOffset;
            
            fine.oninput = (e) => {
                const offset = parseInt(e.target.value);
                // New index = Anchor + Offset
                let newIndex = currentAnchor + offset;
                // Boundary check
                if (newIndex < 0) newIndex = 0;
                if (newIndex >= LFO.SYNC_RATES.length) newIndex = LFO.SYNC_RATES.length - 1;
                
                lfo.syncRateIndex = newIndex;
            };
            fine.onchange = () => this.render();
        } else {
            // Hz Fine
            const decPart = lfo.rate % 1;
            fine.min = 0.0; fine.max = 0.999; fine.step = 0.001;
            fine.value = decPart;
            
            fine.oninput = (e) => {
                const newDec = parseFloat(e.target.value);
                const currentInt = Math.floor(lfo.rate);
                lfo.rate = currentInt + newDec;
            };
            fine.onchange = () => this.render();
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