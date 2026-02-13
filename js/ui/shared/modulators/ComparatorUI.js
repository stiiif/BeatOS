// js/ui/shared/modulators/ComparatorUI.js

import { COMP_MODE } from '../../../modules/modulators/Modulator.js';

const MODE_LABELS = [
    { value: COMP_MODE.DIFFERENCE, label: 'DIFF' },
    { value: COMP_MODE.MULTIPLY,   label: 'MULT' },
    { value: COMP_MODE.GATE,       label: 'GATE' },
    { value: COMP_MODE.MIN,        label: 'MIN' },
    { value: COMP_MODE.MAX,        label: 'MAX' },
    { value: COMP_MODE.XOR,        label: 'XOR' },
];

export function renderComparatorUI(grid, mod, slotIndex, colorClass, onRender, idPrefix) {
    // Row 1: Source A / Source B selector
    const srcCell = document.createElement('div');
    srcCell.className = `grid-cell ${colorClass}`;
    srcCell.style.display = 'flex'; srcCell.style.gap = '2px'; srcCell.style.alignItems = 'center';

    const slots = [0, 1, 2].filter(i => i !== slotIndex); // Can't reference self

    const mkSel = (current, setter) => {
        const sel = document.createElement('select');
        sel.style.cssText = 'width:45%; background:#1a1a1a; color:#ccc; border:1px solid #333; font-size:8px; padding:1px; border-radius:3px;';
        slots.forEach(i => {
            const opt = document.createElement('option');
            opt.value = i; opt.innerText = `Slot ${i + 1}`;
            if (i === current) opt.selected = true;
            sel.appendChild(opt);
        });
        sel.onchange = (e) => { setter(parseInt(e.target.value)); onRender(); };
        return sel;
    };

    srcCell.appendChild(mkSel(mod.sourceA, (v) => { mod.sourceA = v; }));
    const arrow = document.createElement('span');
    arrow.innerText = '×';
    arrow.style.cssText = 'color:#666; font-size:8px;';
    srcCell.appendChild(arrow);
    srcCell.appendChild(mkSel(mod.sourceB, (v) => { mod.sourceB = v; }));
    grid.appendChild(srcCell);

    // Row 2: MODE selector (mini-buttons)
    const modeCell = document.createElement('div');
    modeCell.className = `grid-cell ${colorClass}`;
    const modeGrid = document.createElement('div');
    modeGrid.style.cssText = 'display:grid; grid-template-columns:repeat(3, 1fr); gap:1px;';
    MODE_LABELS.forEach(({ value, label }) => {
        const btn = document.createElement('button');
        btn.className = `wave-btn ${mod.mode === value ? 'active' : ''}`;
        btn.innerText = label;
        btn.style.fontSize = '7px';
        btn.onclick = () => { mod.mode = value; onRender(); };
        modeGrid.appendChild(btn);
    });
    modeCell.appendChild(modeGrid);
    grid.appendChild(modeCell);

    // Row 3: THRESHOLD slider
    _addSlider(grid, colorClass, mod.threshold, 0, 1, 0.01, (v) => { mod.threshold = v; });

    // Row 4: RECTIFY + SMOOTH
    const mixCell = document.createElement('div');
    mixCell.className = `grid-cell ${colorClass}`;
    mixCell.style.display = 'flex'; mixCell.style.gap = '2px'; mixCell.style.alignItems = 'center';

    const rectBtn = document.createElement('div');
    rectBtn.className = `wave-btn ${mod.rectify ? 'active' : ''}`;
    rectBtn.innerText = 'RECT';
    rectBtn.style.cssText = 'font-size:7px; flex:0 0 auto; padding:1px 3px;';
    rectBtn.onclick = () => { mod.rectify = !mod.rectify; onRender(); };
    mixCell.appendChild(rectBtn);

    const smoothSlider = document.createElement('input');
    smoothSlider.type = 'range'; smoothSlider.className = 'micro-slider';
    smoothSlider.min = 0; smoothSlider.max = 1; smoothSlider.step = 0.01;
    smoothSlider.value = mod.smooth; smoothSlider.style.flex = '1';
    smoothSlider.title = `Smooth: ${mod.smooth.toFixed(2)}`;
    smoothSlider.oninput = (e) => {
        mod.smooth = parseFloat(e.target.value);
        smoothSlider.title = `Smooth: ${mod.smooth.toFixed(2)}`;
    };
    mixCell.appendChild(smoothSlider);
    grid.appendChild(mixCell);
}

function _addSlider(grid, colorClass, value, min, max, step, setter) {
    const cell = document.createElement('div');
    cell.className = `grid-cell ${colorClass}`;
    const input = document.createElement('input');
    input.type = 'range'; input.className = 'micro-slider';
    input.min = min; input.max = max; input.step = step;
    input.value = value;
    input.oninput = (e) => setter(parseFloat(e.target.value));
    cell.appendChild(input);
    grid.appendChild(cell);
}
