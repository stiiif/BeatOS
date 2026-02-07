// js/ui/components/AutomationPanel.js
import { NUM_LFOS, MODULATION_TARGETS } from '../../utils/constants.js';

export class AutomationPanel {
    constructor() {
        this.tracks = [];
        this.selectedTrackIndex = 0;
        // Keep track of which LFO is "enabled" (has amount > 0 or user toggled it)
        // In this UI, toggling LFO effectively sets/unsets amount or just visual state?
        // Request said: "act as switch buttons that enable/disable the LFO (without clearing the destination matrix!)"
        // This implies a separate 'enabled' state or caching the amount.
        // For simplicity, we'll store a local 'disabled' state for each LFO of the current track
        // OR better: use the LFO's amount. If amount > 0, it's ON. If 0, it's OFF.
        // To support "disable without clearing", we need to store the "previous amount" in the LFO object itself?
        // Since we can't easily modify the LFO class structure here, we'll assume LFO ON = amount > 0.
        // If user clicks OFF, we set amount to 0. If user clicks ON, we restore to 1.0 or previous?
        // Let's modify the UI to simply visualize Amount > 0 as ON.
    }

    setTracks(tracks) {
        this.tracks = tracks;
    }

    setSelectedTrackIndex(idx) {
        this.selectedTrackIndex = idx;
        this.render();
    }

    // Since the main logic is now "The Monolith", we replace the old initialization
    initialize(onSetSelectedLfoIndex, onUpdateLfoUI) {
        // We no longer use the old tabs. We render the matrix into #lfoSection
        // We need to hijack the #lfoSection container from the main HTML or TrackControls
        // TrackControls.js currently manages #lfoSection visibility.
        // We will render the monolith inside #lfoSection.
        this.render();
    }

    render() {
        const container = document.getElementById('lfoSection');
        if (!container) return;
        
        const track = this.tracks[this.selectedTrackIndex];
        if (!track || track.type !== 'granular') {
            // AutomationPanel only for Granular tracks currently
            return;
        }

        // --- NEW: COLLAPSIBLE STRUCTURE LOGIC ---
        // Check if we have already built the outer shell (Header + Wrapper)
        // This prevents rebuilding the DOM on every update, keeping the collapse state
        let contentWrapper = document.getElementById('modulatorContent');
        
        if (!contentWrapper) {
            // Build the Shell
            container.innerHTML = ''; // Clear old static content

            // Collapsible Header
            const header = document.createElement('div');
            header.className = 'flex justify-between items-center mb-2 cursor-pointer select-none group';
            // Trigger the global toggleSection function
            header.onclick = () => {
                if (window.toggleSection) {
                    window.toggleSection('modulatorContent', header);
                }
            };
            
            // Fixed font size to match exactly granular engine [10px]
            header.innerHTML = `
                <label class="text-[10px] text-neutral-500 uppercase font-bold group-hover:text-neutral-300 transition-colors pointer-events-none cursor-pointer">
                    <i class="fas fa-wave-square mr-1"></i> MODULATORS
                </label>
                <i class="fas fa-chevron-down text-[10px] text-neutral-600 transition-transform duration-200"></i>
            `;
            container.appendChild(header);

            // Wrapper for Content
            contentWrapper = document.createElement('div');
            contentWrapper.id = 'modulatorContent';
            contentWrapper.className = 'transition-all duration-300 origin-top block'; // Ensure visible by default
            container.appendChild(contentWrapper);
        }

        // --- RENDER CONTENT INTO WRAPPER ---
        contentWrapper.innerHTML = '';

        // Scrollable Matrix Container
        const scrollArea = document.createElement('div');
        // Changed h-64 to h-auto to allow content-based height
        scrollArea.className = 'overflow-y-auto custom-scrollbar bg-[#0a0a0a] rounded border border-neutral-800 h-auto max-h-[80vh]'; 
        
        // The Grid
        const grid = document.createElement('div');
        grid.className = 'synthi-grid';
        // Dynamic Columns: 1 Label + NUM_LFOS columns
        grid.style.gridTemplateColumns = `70px repeat(${NUM_LFOS}, 1fr)`;
        
        scrollArea.appendChild(grid);
        contentWrapper.appendChild(scrollArea);

        this.renderSourceRow(grid, track);
        this.renderWaveRow(grid, track);
        this.renderRateRow(grid, track);
        this.renderAmtRow(grid, track);
        this.renderClearRow(grid, track);
        this.renderDestinations(grid, track);
    }

    renderSourceRow(grid, track) {
        // Label
        const lbl = document.createElement('div');
        lbl.className = 'grid-cell sticky top-0 z-50 bg-[#181818] border-b border-neutral-700 font-bold text-[9px] text-neutral-500 justify-end pr-2';
        lbl.innerText = 'SOURCE';
        grid.appendChild(lbl);

        // LFO Headers
        track.lfos.forEach((lfo, i) => {
            if (i >= NUM_LFOS) return;
            const cell = document.createElement('div');
            cell.className = 'grid-cell sticky top-0 z-50 bg-[#111] border-b border-neutral-700 p-0 shadow-lg';
            
            const isOn = lfo.amount > 0;
            const colorClass = `lfo-color-${i % 6}`;
            
            const switchBtn = document.createElement('div');
            switchBtn.className = `lfo-switch ${isOn ? 'on' : ''} ${colorClass}`;
            switchBtn.innerHTML = `<span class="text-[10px] font-bold">L${i+1}</span>`;
            
            switchBtn.onclick = () => {
                // Toggle Logic: If ON, mute (amt=0). If OFF, restore (amt=0.5 or 1).
                // We'll use a property on LFO if available, else default.
                if (lfo.amount > 0) {
                    lfo._lastAmount = lfo.amount; // Hack: store prev amount on object
                    lfo.amount = 0;
                } else {
                    lfo.amount = lfo._lastAmount || 0.5;
                }
                this.render(); // Re-render to update UI
            };

            cell.appendChild(switchBtn);
            grid.appendChild(cell);
        });
    }

    renderWaveRow(grid, track) {
        // Label
        const lbl = document.createElement('div');
        lbl.className = 'grid-cell bg-[#161616] text-[9px] text-neutral-500 font-bold justify-end pr-2 border-b border-neutral-800';
        lbl.style.height = '48px';
        lbl.innerText = 'WAVE';
        grid.appendChild(lbl);

        const waves = ['sine', 'square', 'sawtooth', 'triangle', 'pulse', 'random'];
        const icons = ['water', 'square-full', 'bolt', 'play', 'grip-lines', 'random']; // FontAwesome mapping

        track.lfos.forEach((lfo, i) => {
            if (i >= NUM_LFOS) return;
            const cell = document.createElement('div');
            cell.className = 'grid-cell p-0 border-b border-neutral-800';
            cell.style.height = '48px';

            const microGrid = document.createElement('div');
            microGrid.className = 'wave-micro-grid';

            waves.forEach((wave, idx) => {
                const btn = document.createElement('div');
                const isActive = lfo.wave === wave;
                const activeClass = isActive ? `active lfo-color-${i % 6}` : '';
                
                // Special rotation for Triangle (play icon)
                const rotateClass = wave === 'triangle' ? '-rotate-90' : '';
                
                btn.className = `wave-btn ${activeClass}`;
                btn.title = wave;
                btn.innerHTML = `<i class="fas fa-${icons[idx]} ${rotateClass}"></i>`;
                
                btn.onclick = () => {
                    lfo.wave = wave;
                    this.render();
                };
                microGrid.appendChild(btn);
            });

            cell.appendChild(microGrid);
            grid.appendChild(cell);
        });
    }

    renderRateRow(grid, track) {
        // Label
        const lbl = document.createElement('div');
        lbl.className = 'grid-cell bg-[#161616] text-[9px] text-neutral-500 font-bold justify-end pr-2 border-b border-neutral-800';
        lbl.innerText = 'RATE';
        grid.appendChild(lbl);

        track.lfos.forEach((lfo, i) => {
            if (i >= NUM_LFOS) return;
            const cell = document.createElement('div');
            cell.className = 'grid-cell border-b border-neutral-800';
            
            const slider = document.createElement('input');
            slider.type = 'range';
            slider.min = 0.1; slider.max = 20; slider.step = 0.1;
            slider.value = lfo.rate;
            slider.className = `micro-slider slider-active lfo-color-${i % 6}`;
            slider.title = `Rate: ${lfo.rate.toFixed(1)} Hz`;
            
            slider.oninput = (e) => {
                lfo.rate = parseFloat(e.target.value);
                slider.title = `Rate: ${lfo.rate.toFixed(1)} Hz`;
            };

            cell.appendChild(slider);
            grid.appendChild(cell);
        });
    }

    renderAmtRow(grid, track) {
        // Label
        const lbl = document.createElement('div');
        lbl.className = 'grid-cell bg-[#161616] text-[9px] text-neutral-500 font-bold justify-end pr-2 border-b border-neutral-800';
        lbl.innerText = 'AMT';
        grid.appendChild(lbl);

        track.lfos.forEach((lfo, i) => {
            if (i >= NUM_LFOS) return;
            const cell = document.createElement('div');
            cell.className = 'grid-cell border-b border-neutral-800';
            
            const slider = document.createElement('input');
            slider.type = 'range';
            slider.min = 0; slider.max = 1; slider.step = 0.01;
            slider.value = lfo.amount;
            slider.className = `micro-slider slider-active lfo-color-${i % 6}`;
            slider.title = `Amount: ${lfo.amount.toFixed(2)}`;
            
            slider.oninput = (e) => {
                lfo.amount = parseFloat(e.target.value);
                slider.title = `Amount: ${lfo.amount.toFixed(2)}`;
                // Update header switch state if it goes 0 -> >0 or vice versa
                // Ideally optimize this but re-rendering full UI on drag is heavy.
                // We'll trust visual feedback of slider for now.
            };
            
            // Re-render on change to update Header Switch state visually
            slider.onchange = () => this.render();

            cell.appendChild(slider);
            grid.appendChild(cell);
        });
    }

    renderClearRow(grid, track) {
        const lbl = document.createElement('div');
        lbl.className = 'grid-cell bg-[#222] text-[8px] text-neutral-400 font-bold uppercase tracking-widest justify-end pr-2 h-6';
        lbl.innerText = 'CLEAR';
        grid.appendChild(lbl);

        track.lfos.forEach((lfo, i) => {
            if (i >= NUM_LFOS) return;
            const cell = document.createElement('div');
            cell.className = 'grid-cell bg-[#222] p-0 h-6';
            
            const btn = document.createElement('button');
            btn.className = 'w-full h-full flex items-center justify-center text-neutral-600 hover:text-red-500 hover:bg-[#331111] transition text-[8px]';
            btn.title = 'Clear Column';
            btn.innerHTML = '<i class="fas fa-trash"></i>';
            btn.onclick = () => {
                lfo.targets = []; // Clear all targets
                this.render();
            };

            cell.appendChild(btn);
            grid.appendChild(cell);
        });
    }

    renderDestinations(grid, track) {
        MODULATION_TARGETS.forEach(target => {
            // Label
            const lbl = document.createElement('div');
            lbl.className = 'grid-cell bg-[#141414] text-[9px] text-neutral-400 justify-end pr-2 font-mono border-b border-neutral-800/50 hover:text-white transition';
            lbl.innerText = target.name;
            grid.appendChild(lbl);

            // Matrix Cells
            track.lfos.forEach((lfo, i) => {
                if (i >= NUM_LFOS) return;
                const cell = document.createElement('div');
                // Added cursor-pointer to the cell to indicate interaction
                cell.className = 'grid-cell border-b border-neutral-800/50 hover:bg-[#1a1a1a] cursor-pointer';
                
                // Check if this target ID is in the lfo.targets array
                const isActive = lfo.targets.includes(target.id);
                const activeClass = isActive ? `node-active lfo-color-${i % 6}` : '';
                
                const node = document.createElement('div');
                node.className = `circuit-node ${activeClass}`;
                
                // Moved onclick handler from the small 'node' div to the parent 'cell' div
                cell.onclick = () => {
                    // Toggle logic: Add or Remove target from array
                    if (lfo.targets.includes(target.id)) {
                        // Remove
                        lfo.targets = lfo.targets.filter(t => t !== target.id);
                    } else {
                        // Add
                        lfo.targets.push(target.id);
                    }
                    this.render();
                };

                cell.appendChild(node);
                grid.appendChild(cell);
            });
        });
    }
}