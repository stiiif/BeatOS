// js/ui/shared/modulators/PhysicsUI.js

import { PHYSICS_MODE } from '../../../modules/modulators/Modulator.js';

const MODE_LABELS = [
    { value: PHYSICS_MODE.BOUNCE,   label: 'BNCE' },
    { value: PHYSICS_MODE.PENDULUM, label: 'PEND' },
    { value: PHYSICS_MODE.SPRING,   label: 'SPRG' },
];

const TRIGGER_LABELS = [
    { value: 'loop', label: 'LOOP' },
    { value: 'bar',  label: 'BAR' },
    { value: 'free', label: 'FREE' },
];

export function renderPhysicsUI(grid, mod, slotIndex, colorClass, onRender, idPrefix) {
    // Row 1: Physics mode (mini-buttons)
    const modeCell = document.createElement('div');
    modeCell.className = `grid-cell ${colorClass}`;
    const modeGrid = document.createElement('div');
    modeGrid.className = 'micro-grid-4';
    MODE_LABELS.forEach(({ value, label }) => {
        const btn = document.createElement('button');
        btn.className = `wave-btn ${mod.physics === value ? 'active' : ''}`;
        btn.innerText = label;
        btn.onclick = () => { mod.physics = value; onRender(); };
        modeGrid.appendChild(btn);
    });
    modeCell.appendChild(modeGrid);
    grid.appendChild(modeCell);

    // Row 2: GRAVITY slider (0.1 - 10)
    _addSlider(grid, colorClass, mod.gravity, 0.1, 10, 0.1, (v) => { mod.gravity = v; });

    // Row 3: DAMPING slider (0 - 0.99)
    _addSlider(grid, colorClass, mod.damping, 0, 0.99, 0.01, (v) => { mod.damping = v; });

    // Row 4: TRIGGER mode + INITIAL
    const trigCell = document.createElement('div');
    trigCell.className = `grid-cell ${colorClass}`;
    trigCell.style.display = 'flex'; trigCell.style.gap = '2px'; trigCell.style.alignItems = 'center';

    TRIGGER_LABELS.forEach(({ value, label }) => {
        const btn = document.createElement('div');
        btn.className = `wave-btn ${mod.trigger === value ? 'active' : ''}`;
        btn.innerText = label;
        btn.style.cssText = 'font-size:7px; flex:1; text-align:center; padding:1px 0;';
        btn.onclick = () => { mod.trigger = value; onRender(); };
        trigCell.appendChild(btn);
    });
    grid.appendChild(trigCell);
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
