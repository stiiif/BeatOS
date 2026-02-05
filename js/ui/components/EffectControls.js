export class EffectControls {
    constructor(effectsManager) {
        this.manager = effectsManager;
        this.container = document.getElementById('effectsControlsContainer');
        this.activeLfos = [0, 0]; // Track active LFO tab for each FX (0, 1, or 2)
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
                    <input type="range" min="0" max="1" step="0.01" value="${val}" class="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer">
                `;
                wrap.querySelector('input').oninput = (e) => {
                    this.manager.setParam(fxId, idx, parseFloat(e.target.value));
                };
                knobsDiv.appendChild(wrap);
            });
            content.appendChild(knobsDiv);

            // 2. MIDDLE: LFO Controls (Switched)
            const lfoDiv = document.createElement('div');
            lfoDiv.className = 'w-24 shrink-0 flex flex-col border-l border-neutral-800 pl-2';
            
            // LFO Tabs
            const lfoTabs = document.createElement('div');
            lfoTabs.className = 'flex gap-1 mb-2 bg-neutral-800 rounded p-0.5';
            [0, 1, 2].forEach(i => {
                const btn = document.createElement('button');
                btn.className = `flex-1 text-[8px] font-bold rounded py-0.5 ${this.activeLfos[fxId] === i ? 'bg-neutral-600 text-white' : 'text-neutral-500'}`;
                btn.innerText = `L${i+1}`;
                btn.onclick = () => {
                    this.activeLfos[fxId] = i;
                    this.render(); // Re-render to update inputs
                };
                lfoTabs.appendChild(btn);
            });
            lfoDiv.appendChild(lfoTabs);

            // Active LFO Controls
            const activeLfoIdx = this.activeLfos[fxId];
            const lfo = state.lfos[activeLfoIdx];
            
            lfoDiv.innerHTML += `
                <div class="flex flex-col gap-2">
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
                        <input type="range" class="lfo-rate w-full h-1 bg-neutral-700 rounded" min="0.1" max="20" step="0.1" value="${lfo.rate}">
                    </div>
                    <div>
                        <label class="text-[8px] text-neutral-500 block">Amt</label>
                        <input type="range" class="lfo-amt w-full h-1 bg-neutral-700 rounded" min="0" max="1" step="0.01" value="${lfo.amount}">
                    </div>
                </div>
            `;
            
            // Bind LFO inputs dynamically after HTML injection
            // Note: lfoTabs are lost by innerHTML overwrite, need to append them again or structure differently.
            // Better to structure properly.
            lfoDiv.innerHTML = '';
            lfoDiv.appendChild(lfoTabs);
            
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
                    <input type="range" class="lfo-rate w-full h-1 bg-neutral-700 rounded" min="0.1" max="20" step="0.1" value="${lfo.rate}">
                </div>
                <div>
                    <label class="text-[8px] text-neutral-500 block">Amt</label>
                    <input type="range" class="lfo-amt w-full h-1 bg-neutral-700 rounded" min="0" max="1" step="0.01" value="${lfo.amount}">
                </div>
            `;
            
            controlsWrap.querySelector('.lfo-wave').onchange = (e) => this.manager.setLfoParam(fxId, activeLfoIdx, 'wave', e.target.value);
            controlsWrap.querySelector('.lfo-rate').oninput = (e) => this.manager.setLfoParam(fxId, activeLfoIdx, 'rate', parseFloat(e.target.value));
            controlsWrap.querySelector('.lfo-amt').oninput = (e) => this.manager.setLfoParam(fxId, activeLfoIdx, 'amount', parseFloat(e.target.value));
            
            lfoDiv.appendChild(controlsWrap);
            content.appendChild(lfoDiv);

            // 3. RIGHT: 4x9 Matrix (Pin Matrix Style)
            const matrixDiv = document.createElement('div');
            matrixDiv.className = 'flex-1 border-l border-neutral-800 pl-2 overflow-x-auto';
            
            const grid = document.createElement('div');
            grid.className = 'grid grid-cols-9 gap-1';
            // Custom tiny grid gap
            grid.style.gap = '2px';

            // 4 Rows (Sources): L1, L2, L3, RND
            const sourceLabels = ['L1', 'L2', 'L3', 'RND'];
            // 9 Cols (Targets): P1, P2, P3, Mix, L1R, L1A, L2R, L2A, L3R
            // Tooltips
            const targetTooltips = ['P1', 'P2', 'P3', 'Mix', 'L1 Rate', 'L1 Amt', 'L2 Rate', 'L2 Amt', 'L3 Rate'];

            for(let row=0; row<4; row++) {
                // Source Label (Left of row? No, matrix usually just grid)
                // Let's add row headers visually? Or just tooltips?
                // Pin matrix usually has labels on axes.
                // Space is tight. Tooltips for now.
                
                for(let col=0; col<9; col++) {
                    const pin = document.createElement('div');
                    const isActive = state.matrix[row][col];
                    // Pin Matrix Style: Circle with hole
                    pin.className = `w-3 h-3 rounded-full border border-neutral-700 flex items-center justify-center cursor-pointer hover:border-white transition-colors ${isActive ? 'bg-white' : 'bg-neutral-900'}`;
                    
                    // Inner dot for "hole" look if inactive
                    if (!isActive) {
                        pin.innerHTML = '<div class="w-1 h-1 bg-neutral-800 rounded-full"></div>';
                    } else {
                        // Active pin color based on FX
                        pin.style.backgroundColor = fxId === 0 ? '#34d399' : '#c084fc';
                        pin.style.boxShadow = `0 0 4px ${fxId === 0 ? '#34d399' : '#c084fc'}`;
                    }

                    pin.title = `Src: ${sourceLabels[row]} -> Dest: ${targetTooltips[col]}`;
                    
                    pin.onclick = () => {
                        this.manager.toggleMatrix(fxId, row, col);
                        this.render();
                    };
                    
                    grid.appendChild(pin);
                }
            }
            matrixDiv.appendChild(grid);
            
            // Matrix Axis Labels (Bottom)
            const axisX = document.createElement('div');
            axisX.className = 'grid grid-cols-9 gap-1 mt-1 text-[6px] text-neutral-500 font-mono text-center';
            axisX.style.gap = '2px';
            ['P1','P2','P3','Mix','R1','A1','R2','A2','R3'].forEach(l => {
                const sp = document.createElement('span');
                sp.innerText = l;
                axisX.appendChild(sp);
            });
            matrixDiv.appendChild(axisX);

            content.appendChild(matrixDiv);
            section.appendChild(content);
            this.container.appendChild(section);
        });
    }
}