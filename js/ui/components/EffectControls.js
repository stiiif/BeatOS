export class EffectControls {
    constructor(effectsManager) {
        this.manager = effectsManager;
        this.container = document.getElementById('effectsControlsContainer');
        this.activeLfos = [0, 0]; // Active LFO Tab for FX A and FX B
        this.isDragging = false;
        
        // Bind animate loop
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    render() {
        if (!this.container) return;
        this.container.innerHTML = '';

        // Render both FX A and FX B stacked
        [0, 1].forEach(fxId => {
            const state = this.manager.getEffectState(fxId);
            const color = fxId === 0 ? 'text-emerald-400' : 'text-purple-400';
            const borderColor = fxId === 0 ? 'border-emerald-500/30' : 'border-purple-500/30';
            const label = fxId === 0 ? 'FX A (DELAY)' : 'FX B (REVERB)';
            
            const section = document.createElement('div');
            section.className = `mb-4 bg-neutral-900/50 rounded border ${borderColor} p-2 flex flex-col gap-2`;
            section.id = `fx-section-${fxId}`;
            
            // Header
            const header = document.createElement('div');
            header.className = `text-[10px] font-bold ${color} border-b border-neutral-800 pb-1 mb-1`;
            header.innerText = label;
            section.appendChild(header);

            // Main Content Grid - 3 Columns (1/3 each)
            const content = document.createElement('div');
            content.className = 'flex gap-2 items-start';

            // 1. LEFT: 4 Knobs (P1, P2, P3, Mix) - 1/3 Width
            const knobsDiv = document.createElement('div');
            knobsDiv.className = 'flex-1 min-w-0 flex flex-col gap-2 shrink-0 border-r border-neutral-800 pr-2';
            const paramNames = fxId === 0 
                ? ['Time', 'Fdbk', 'Color', 'Mix'] 
                : ['Tone', 'Size', 'PreD', 'Mix']; 

            state.params.forEach((val, idx) => {
                const wrap = document.createElement('div');
                wrap.className = 'flex flex-col items-center w-full';
                wrap.innerHTML = `
                    <div class="flex justify-between w-full mb-0.5">
                        <label class="text-[8px] text-neutral-500">${paramNames[idx]}</label>
                        <span class="text-[8px] text-neutral-400 font-mono val-disp"></span>
                    </div>
                    <input type="range" min="0" max="1" step="0.01" value="${val}" class="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer fx-param-slider" data-fx="${fxId}" data-target="${idx}">
                `;
                const input = wrap.querySelector('input');
                const valDisp = wrap.querySelector('.val-disp');
                valDisp.innerText = val.toFixed(2);
                
                input.addEventListener('mousedown', () => this.isDragging = true);
                input.addEventListener('mouseup', () => this.isDragging = false);
                input.oninput = (e) => {
                    const v = parseFloat(e.target.value);
                    this.manager.setParam(fxId, idx, v);
                    valDisp.innerText = v.toFixed(2);
                };
                knobsDiv.appendChild(wrap);
            });
            content.appendChild(knobsDiv);

            // 2. MIDDLE: LFO Controls (Switched Tabs) - 1/3 Width
            const lfoDiv = document.createElement('div');
            lfoDiv.className = 'flex-1 min-w-0 flex flex-col border-r border-neutral-800 px-2';
            
            // Tabs
            const lfoTabs = document.createElement('div');
            lfoTabs.className = 'flex gap-1 mb-2 bg-neutral-800 rounded p-0.5 w-full';
            [0, 1, 2].forEach(i => {
                const btn = document.createElement('button');
                btn.className = `flex-1 text-[8px] font-bold rounded py-0.5 ${this.activeLfos[fxId] === i ? 'bg-neutral-600 text-white' : 'text-neutral-500'}`;
                btn.innerText = `LFO ${i+1}`;
                btn.onclick = () => {
                    this.activeLfos[fxId] = i;
                    this.render(); 
                };
                lfoTabs.appendChild(btn);
            });
            lfoDiv.appendChild(lfoTabs);

            const activeLfoIdx = this.activeLfos[fxId];
            const lfo = state.lfos[activeLfoIdx];
            const rateTargetIdx = 4 + (activeLfoIdx * 3);
            const amtTargetIdx = 5 + (activeLfoIdx * 3);

            const controlsWrap = document.createElement('div');
            controlsWrap.className = "flex flex-col gap-2 w-full";
            controlsWrap.innerHTML = `
                <div class="flex justify-between items-center bg-neutral-800/50 p-1 rounded">
                    <span class="text-[8px] text-neutral-500 font-bold">WAVE</span>
                    <select class="lfo-wave bg-transparent text-[8px] text-neutral-300 outline-none font-mono cursor-pointer border border-neutral-700 rounded px-1">
                        <option value="sine" ${lfo.wave==='sine'?'selected':''}>SINE</option>
                        <option value="square" ${lfo.wave==='square'?'selected':''}>SQR</option>
                        <option value="sawtooth" ${lfo.wave==='sawtooth'?'selected':''}>SAW</option>
                        <option value="random" ${lfo.wave==='random'?'selected':''}>RND</option>
                    </select>
                </div>
                <div class="w-full">
                    <div class="flex justify-between w-full mb-0.5">
                        <label class="text-[8px] text-neutral-500">RATE</label>
                        <span class="text-[8px] text-neutral-400 font-mono lfo-rate-disp">${lfo.rate.toFixed(1)}</span>
                    </div>
                    <input type="range" class="lfo-rate w-full h-1 bg-neutral-700 rounded fx-param-slider" min="0.1" max="20" step="0.1" value="${lfo.rate}" data-fx="${fxId}" data-target="${rateTargetIdx}">
                </div>
                <div class="w-full">
                    <div class="flex justify-between w-full mb-0.5">
                        <label class="text-[8px] text-neutral-500">AMT</label>
                        <span class="text-[8px] text-neutral-400 font-mono lfo-amt-disp">${lfo.amount.toFixed(2)}</span>
                    </div>
                    <input type="range" class="lfo-amt w-full h-1 bg-neutral-700 rounded fx-param-slider" min="0" max="1" step="0.01" value="${lfo.amount}" data-fx="${fxId}" data-target="${amtTargetIdx}">
                </div>
            `;
            
            const lfoRateInput = controlsWrap.querySelector('.lfo-rate');
            const lfoAmtInput = controlsWrap.querySelector('.lfo-amt');
            const lfoRateDisp = controlsWrap.querySelector('.lfo-rate-disp');
            const lfoAmtDisp = controlsWrap.querySelector('.lfo-amt-disp');
            
            [lfoRateInput, lfoAmtInput].forEach(inp => {
                inp.addEventListener('mousedown', () => this.isDragging = true);
                inp.addEventListener('mouseup', () => this.isDragging = false);
            });

            controlsWrap.querySelector('.lfo-wave').onchange = (e) => this.manager.setLfoParam(fxId, activeLfoIdx, 'wave', e.target.value);
            
            lfoRateInput.oninput = (e) => {
                const v = parseFloat(e.target.value);
                this.manager.setLfoParam(fxId, activeLfoIdx, 'rate', v);
                lfoRateDisp.innerText = v.toFixed(1);
            };
            
            lfoAmtInput.oninput = (e) => {
                const v = parseFloat(e.target.value);
                this.manager.setLfoParam(fxId, activeLfoIdx, 'amount', v);
                lfoAmtDisp.innerText = v.toFixed(2);
            };
            
            lfoDiv.appendChild(controlsWrap);
            content.appendChild(lfoDiv);

            // 3. RIGHT: Transposed Matrix (Vertical) - 1/3 Width
            // Rows: Targets (13), Cols: Sources (LFO 1, 2, 3)
            const matrixDiv = document.createElement('div');
            matrixDiv.className = 'flex-1 min-w-0 pl-2 overflow-y-auto max-h-[160px] custom-scrollbar'; 
            
            const grid = document.createElement('div');
            grid.style.display = 'grid';
            // First col: Labels (approx width), Next 3 cols: Pins (equal width)
            grid.style.gridTemplateColumns = '25px repeat(3, 1fr)';
            grid.style.gap = '2px';
            grid.style.alignItems = 'center';

            // --- Header Row ---
            const corner = document.createElement('div');
            grid.appendChild(corner); // Empty top-left

            ['L1', 'L2', 'L3'].forEach(label => {
                const hCol = document.createElement('div');
                hCol.className = 'text-[7px] text-neutral-500 font-bold text-center';
                hCol.innerText = label;
                grid.appendChild(hCol);
            });

            // --- Rows (Targets) ---
            const targetLabels = [
                'P1', 'P2', 'P3', 'MIX',
                'L1 R', 'L1 A', 'L1 W',
                'L2 R', 'L2 A', 'L2 W',
                'L3 R', 'L3 A', 'L3 W'
            ];

            const targetTooltips = [
                'Param 1', 'Param 2', 'Param 3', 'Dry/Wet Mix',
                'LFO 1 Rate', 'LFO 1 Amount', 'LFO 1 Wave',
                'LFO 2 Rate', 'LFO 2 Amount', 'LFO 2 Wave',
                'LFO 3 Rate', 'LFO 3 Amount', 'LFO 3 Wave'
            ];

            for(let targetIdx = 0; targetIdx < 13; targetIdx++) {
                // Row Label
                const rowLbl = document.createElement('div');
                rowLbl.className = 'text-[7px] text-neutral-500 font-mono text-right pr-1';
                rowLbl.innerText = targetLabels[targetIdx];
                rowLbl.title = targetTooltips[targetIdx];
                
                // Styling for parameter groups
                if (targetIdx === 0) rowLbl.classList.add('text-emerald-500'); // Params
                if (targetIdx === 4) rowLbl.classList.add('text-blue-400', 'mt-1'); // LFO 1 targets
                if (targetIdx === 7) rowLbl.classList.add('text-blue-400', 'mt-1'); // LFO 2 targets
                if (targetIdx === 10) rowLbl.classList.add('text-blue-400', 'mt-1'); // LFO 3 targets
                
                // Add margin-top to pins in these rows too
                const mtClass = (targetIdx === 4 || targetIdx === 7 || targetIdx === 10) ? 'mt-1' : '';
                rowLbl.className += ` ${mtClass}`;

                grid.appendChild(rowLbl);

                // Pins for LFO 1, 2, 3
                for(let sourceIdx = 0; sourceIdx < 3; sourceIdx++) {
                    const pinContainer = document.createElement('div');
                    pinContainer.className = `flex justify-center ${mtClass}`;
                    
                    const pin = document.createElement('div');
                    const isActive = state.matrix[sourceIdx][targetIdx];
                    
                    pin.className = `w-2 h-2 rounded-full border border-neutral-700 flex items-center justify-center cursor-pointer hover:border-white transition-colors ${isActive ? 'bg-white' : 'bg-neutral-900'}`;
                    
                    if (!isActive) {
                        pin.innerHTML = '<div class="w-0.5 h-0.5 bg-neutral-800 rounded-full"></div>';
                    } else {
                        pin.style.backgroundColor = fxId === 0 ? '#34d399' : '#c084fc';
                        pin.style.boxShadow = `0 0 4px ${fxId === 0 ? '#34d399' : '#c084fc'}`;
                    }

                    pin.title = `Src: LFO ${sourceIdx+1} -> Dest: ${targetTooltips[targetIdx]}`;
                    
                    pin.onclick = () => {
                        this.manager.toggleMatrix(fxId, sourceIdx, targetIdx);
                        this.render();
                    };

                    pinContainer.appendChild(pin);
                    grid.appendChild(pinContainer);
                }
            }

            matrixDiv.appendChild(grid);
            content.appendChild(matrixDiv);
            section.appendChild(content);
            this.container.appendChild(section);
        });
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
                if (liveValues && liveValues.length > targetIdx) {
                    const val = liveValues[targetIdx];
                    if (Math.abs(slider.value - val) > 0.005) {
                        slider.value = val;
                        // Also update text display if sibling exists
                        const display = slider.parentElement.querySelector('span[class*="-disp"]');
                        if (display) {
                            // Format depends on target
                            if (targetIdx >= 4 && (targetIdx - 4) % 3 === 0) { // Rates
                                display.innerText = val.toFixed(1);
                            } else {
                                display.innerText = val.toFixed(2);
                            }
                        } else {
                            // Fallback for Main Params using .val-disp
                            const valDisp = slider.parentElement.querySelector('.val-disp');
                            if (valDisp) valDisp.innerText = val.toFixed(2);
                        }
                    }
                }
            }
        });

        requestAnimationFrame(this.animate);
    }
}