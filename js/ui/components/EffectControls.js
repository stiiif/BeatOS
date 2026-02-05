export class EffectControls {
    constructor(effectsManager) {
        this.manager = effectsManager;
        this.container = document.getElementById('effectsControlsContainer');
        this.activeFx = 0; // 0 = FX A, 1 = FX B
    }

    render() {
        if (!this.container) return;
        this.container.innerHTML = '';

        const state = this.manager.getEffectState(this.activeFx);
        const color = this.activeFx === 0 ? 'text-emerald-400' : 'text-purple-400';
        const borderColor = this.activeFx === 0 ? 'border-emerald-500/30' : 'border-purple-500/30';

        // 1. Header & Tabs
        const header = document.createElement('div');
        header.className = 'flex justify-between items-center mb-3 pb-2 border-b border-neutral-800';
        header.innerHTML = `
            <div class="flex gap-2">
                <button class="fx-tab ${this.activeFx===0 ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-neutral-300'} text-[10px] font-bold px-2 py-1 rounded transition" data-id="0">FX A (DLY)</button>
                <button class="fx-tab ${this.activeFx===1 ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-neutral-300'} text-[10px] font-bold px-2 py-1 rounded transition" data-id="1">FX B (VRB)</button>
            </div>
            <span class="text-[9px] font-mono text-neutral-600">MOD MATRIX</span>
        `;
        
        header.querySelectorAll('.fx-tab').forEach(btn => {
            btn.onclick = () => {
                this.activeFx = parseInt(btn.dataset.id);
                this.render();
            };
        });
        this.container.appendChild(header);

        // 2. Main Parameters (3 Knobs)
        const paramsDiv = document.createElement('div');
        paramsDiv.className = `grid grid-cols-3 gap-2 mb-4 bg-neutral-900/50 p-2 rounded border ${borderColor}`;
        
        const paramNames = this.activeFx === 0 
            ? ['Time', 'Feedbk', 'Color'] 
            : ['Tone', 'Drive', 'Width'];

        state.params.forEach((val, idx) => {
            const wrap = document.createElement('div');
            wrap.className = 'flex flex-col items-center';
            wrap.innerHTML = `
                <label class="text-[9px] ${color} font-bold mb-1">${paramNames[idx]}</label>
                <input type="range" min="0" max="1" step="0.01" value="${val}" class="param-slider w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer">
            `;
            wrap.querySelector('input').oninput = (e) => {
                this.manager.setParam(this.activeFx, idx, parseFloat(e.target.value));
            };
            paramsDiv.appendChild(wrap);
        });
        this.container.appendChild(paramsDiv);

        // 3. LFOs & Matrix Container
        const gridContainer = document.createElement('div');
        gridContainer.className = 'flex flex-col gap-2';

        state.lfos.forEach((lfo, lfoIdx) => {
            const row = document.createElement('div');
            row.className = 'flex items-center gap-2 bg-neutral-800/30 p-1.5 rounded border border-neutral-800';
            
            // LFO Controls
            const controls = document.createElement('div');
            controls.className = 'flex flex-col gap-1 w-20 shrink-0 border-r border-neutral-800 pr-2';
            controls.innerHTML = `
                <div class="flex justify-between items-center">
                    <span class="text-[9px] font-bold text-neutral-500">LFO ${lfoIdx+1}</span>
                    <select class="bg-transparent text-[9px] text-neutral-400 outline-none w-10 text-right">
                        <option value="sine" ${lfo.wave==='sine'?'selected':''}>SIN</option>
                        <option value="square" ${lfo.wave==='square'?'selected':''}>SQR</option>
                        <option value="sawtooth" ${lfo.wave==='sawtooth'?'selected':''}>SAW</option>
                        <option value="random" ${lfo.wave==='random'?'selected':''}>RND</option>
                    </select>
                </div>
                <input type="range" class="w-full h-1 bg-neutral-700 rounded" min="0.1" max="20" step="0.1" value="${lfo.rate}" title="Rate">
                <input type="range" class="w-full h-1 bg-neutral-700 rounded" min="0" max="1" step="0.01" value="${lfo.amount}" title="Amount">
            `;
            
            // Bind LFO Inputs
            const sel = controls.querySelector('select');
            sel.onchange = (e) => this.manager.setLfoParam(this.activeFx, lfoIdx, 'wave', e.target.value);
            const ranges = controls.querySelectorAll('input');
            ranges[0].oninput = (e) => this.manager.setLfoParam(this.activeFx, lfoIdx, 'rate', parseFloat(e.target.value));
            ranges[1].oninput = (e) => this.manager.setLfoParam(this.activeFx, lfoIdx, 'amount', parseFloat(e.target.value));

            row.appendChild(controls);

            // Matrix Dots (12 targets)
            const matrix = document.createElement('div');
            matrix.className = 'flex-1 grid grid-cols-12 gap-0.5 h-full items-center';
            
            // Targets: P1 P2 P3 | L1R L1A L1W | L2R...
            for(let t=0; t<12; t++) {
                const cell = document.createElement('div');
                const isActive = state.matrix[lfoIdx][t];
                cell.className = `w-full h-3 rounded-sm cursor-pointer transition-colors ${isActive ? 'bg-emerald-500' : 'bg-neutral-700 hover:bg-neutral-600'}`;
                cell.title = `LFO ${lfoIdx+1} -> Target ${t+1}`;
                
                // Visual grouping spacing
                if (t === 2 || t === 5 || t === 8) {
                    cell.style.marginRight = '2px';
                }

                cell.onclick = () => {
                    const newVal = this.manager.toggleMatrix(this.activeFx, lfoIdx, t);
                    cell.className = `w-full h-3 rounded-sm cursor-pointer transition-colors ${newVal ? 'bg-emerald-500' : 'bg-neutral-700 hover:bg-neutral-600'}`;
                };
                matrix.appendChild(cell);
            }
            
            row.appendChild(matrix);
            gridContainer.appendChild(row);
        });

        // Matrix Labels Footer
        const footer = document.createElement('div');
        footer.className = 'flex text-[7px] text-neutral-600 font-mono pt-1 pl-[5.5rem]'; // Padding to align with matrix
        footer.innerHTML = `
            <span class="flex-1 text-center">P1</span><span class="flex-1 text-center">P2</span><span class="flex-1 text-center mr-1">P3</span>
            <span class="flex-[3] text-center border-l border-neutral-800 mr-1">LFO 1</span>
            <span class="flex-[3] text-center border-l border-neutral-800 mr-1">LFO 2</span>
            <span class="flex-[3] text-center border-l border-neutral-800">LFO 3</span>
        `;
        gridContainer.appendChild(footer);

        this.container.appendChild(gridContainer);
    }
}