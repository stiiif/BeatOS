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

            // Main Content Grid
            const content = document.createElement('div');
            content.className = 'flex gap-2';

            // 1. LEFT: 4 Knobs (P1, P2, P3, Mix)
            const knobsDiv = document.createElement('div');
            knobsDiv.className = 'w-16 flex flex-col gap-2 shrink-0';
            const paramNames = fxId === 0 
                ? ['Time', 'Fdbk', 'Color', 'Mix'] 
                : ['Tone', 'Size', '---', 'Mix'];

            state.params.forEach((val, idx) => {
                const wrap = document.createElement('div');
                wrap.className = 'flex flex-col items-center';
                wrap.innerHTML = `
                    <label class="text-[8px] text-neutral-500 mb-0.5 w-full text-left truncate">${paramNames[idx]}</label>
                    <input type="range" min="0" max="1" step="0.01" value="${val}" class="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer fx-param-slider" data-fx="${fxId}" data-target="${idx}">
                `;
                const input = wrap.querySelector('input');
                input.addEventListener('mousedown', () => this.isDragging = true);
                input.addEventListener('mouseup', () => this.isDragging = false);
                input.oninput = (e) => {
                    this.manager.setParam(fxId, idx, parseFloat(e.target.value));
                };
                knobsDiv.appendChild(wrap);
            });
            content.appendChild(knobsDiv);

            // 2. MIDDLE: LFO Controls (Switched Tabs)
            const lfoDiv = document.createElement('div');
            lfoDiv.className = 'w-24 shrink-0 flex flex-col border-l border-neutral-800 pl-2';
            
            // Tabs
            const lfoTabs = document.createElement('div');
            lfoTabs.className = 'flex gap-1 mb-2 bg-neutral-800 rounded p-0.5';
            [0, 1, 2].forEach(i => {
                const btn = document.createElement('button');
                btn.className = `flex-1 text-[8px] font-bold rounded py-0.5 ${this.activeLfos[fxId] === i ? 'bg-neutral-600 text-white' : 'text-neutral-500'}`;
                btn.innerText = `L${i+1}`;
                btn.onclick = () => {
                    this.activeLfos[fxId] = i;
                    this.render(); 
                };
                lfoTabs.appendChild(btn);
            });
            lfoDiv.appendChild(lfoTabs);

            const activeLfoIdx = this.activeLfos[fxId];
            const lfo = state.lfos[activeLfoIdx];
            
            // Map LFO param indices for visualization
            // Rate index = 4 + (lfoIdx * 3)
            // Amt index = 5 + (lfoIdx * 3)
            const rateTargetIdx = 4 + (activeLfoIdx * 3);
            const amtTargetIdx = 5 + (activeLfoIdx * 3);

            const controlsWrap = document.createElement('div');
            controlsWrap.className = "flex flex-col gap-2";
            controlsWrap.innerHTML = `
                <div class="flex justify-between items-center">
                    <span class="text-[8px] text-neutral-500">Wave</span>
                    <select class="lfo-wave bg-transparent text-[8px] text-neutral-400 outline-none w-10 text-right">
                        <option value="sine" ${lfo.wave==='sine'?'selected':''}>SIN</option>
                        <option value="square" ${lfo.wave==='square'?'selected':''}>SQR</option>
                        <option value="sawtooth" ${lfo.wave==='sawtooth'?'selected':''}>SAW</option>
                        <option value="random" ${lfo.wave==='random'?'selected':''}>RND</option>
                    </select>
                </div>
                <div>
                    <label class="text-[8px] text-neutral-500 block">Rate</label>
                    <input type="range" class="lfo-rate w-full h-1 bg-neutral-700 rounded fx-param-slider" min="0.1" max="20" step="0.1" value="${lfo.rate}" data-fx="${fxId}" data-target="${rateTargetIdx}">
                </div>
                <div>
                    <label class="text-[8px] text-neutral-500 block">Amt</label>
                    <input type="range" class="lfo-amt w-full h-1 bg-neutral-700 rounded fx-param-slider" min="0" max="1" step="0.01" value="${lfo.amount}" data-fx="${fxId}" data-target="${amtTargetIdx}">
                </div>
            `;
            
            const lfoRateInput = controlsWrap.querySelector('.lfo-rate');
            const lfoAmtInput = controlsWrap.querySelector('.lfo-amt');
            
            [lfoRateInput, lfoAmtInput].forEach(inp => {
                inp.addEventListener('mousedown', () => this.isDragging = true);
                inp.addEventListener('mouseup', () => this.isDragging = false);
            });

            controlsWrap.querySelector('.lfo-wave').onchange = (e) => this.manager.setLfoParam(fxId, activeLfoIdx, 'wave', e.target.value);
            lfoRateInput.oninput = (e) => this.manager.setLfoParam(fxId, activeLfoIdx, 'rate', parseFloat(e.target.value));
            lfoAmtInput.oninput = (e) => this.manager.setLfoParam(fxId, activeLfoIdx, 'amount', parseFloat(e.target.value));
            
            lfoDiv.appendChild(controlsWrap);
            content.appendChild(lfoDiv);

            // 3. RIGHT: 3x13 Matrix (Synthi Style)
            const matrixDiv = document.createElement('div');
            matrixDiv.className = 'flex-1 border-l border-neutral-800 pl-2 overflow-x-auto';
            
            const grid = document.createElement('div');
            grid.style.display = 'grid';
            grid.style.gridTemplateColumns = 'repeat(13, minmax(0, 1fr))';
            grid.style.gap = '2px';

            const sourceLabels = ['L1', 'L2', 'L3'];
            const targetTooltips = [
                'P1', 'P2', 'P3', 'Mix',
                'L1 Rate', 'L1 Amt', 'L1 Wav',
                'L2 Rate', 'L2 Amt', 'L2 Wav',
                'L3 Rate', 'L3 Amt', 'L3 Wav'
            ];

            // 3 Rows (LFOs)
            for(let row=0; row<3; row++) {
                for(let col=0; col<13; col++) {
                    const pin = document.createElement('div');
                    const isActive = state.matrix[row][col];
                    
                    pin.className = `w-2 h-2 rounded-full border border-neutral-700 flex items-center justify-center cursor-pointer hover:border-white transition-colors ${isActive ? 'bg-white' : 'bg-neutral-900'}`;
                    
                    if (!isActive) {
                        pin.innerHTML = '<div class="w-0.5 h-0.5 bg-neutral-800 rounded-full"></div>';
                    } else {
                        pin.style.backgroundColor = fxId === 0 ? '#34d399' : '#c084fc';
                        pin.style.boxShadow = `0 0 4px ${fxId === 0 ? '#34d399' : '#c084fc'}`;
                    }

                    pin.title = `Src: ${sourceLabels[row]} -> Dest: ${targetTooltips[col]}`;
                    
                    pin.onclick = () => {
                        this.manager.toggleMatrix(fxId, row, col);
                        this.render();
                    };
                    
                    // Visual separation
                    if (col === 3 || col === 6 || col === 9) {
                        pin.style.marginRight = '3px';
                    }

                    grid.appendChild(pin);
                }
            }
            matrixDiv.appendChild(grid);
            
            // Labels
            const axisX = document.createElement('div');
            axisX.style.display = 'grid';
            axisX.style.gridTemplateColumns = 'repeat(13, minmax(0, 1fr))';
            axisX.style.gap = '2px';
            axisX.className = 'mt-1 text-[5px] text-neutral-500 font-mono text-center';
            
            ['P1','P2','P3','Mx', 'R','A','W', 'R','A','W', 'R','A','W'].forEach((l, idx) => {
                const sp = document.createElement('span');
                sp.innerText = l;
                if (idx === 3 || idx === 6 || idx === 9) sp.style.marginRight = '3px';
                axisX.appendChild(sp);
            });
            matrixDiv.appendChild(axisX);

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

        // Update all sliders with "data-fx" and "data-target"
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