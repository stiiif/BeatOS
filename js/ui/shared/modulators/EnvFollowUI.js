// js/ui/shared/modulators/EnvFollowUI.js

/**
 * Render EnvelopeFollower-specific controls.
 */
export function renderEnvFollowUI(grid, mod, slotIndex, colorClass, onRender, idPrefix) {
    // Row 1: SOURCE selector
    _addSelectRow(grid, colorClass, mod.source, [
        { value: 'master', label: 'Master' },
        { value: 'track:0', label: 'Trk 1' }, { value: 'track:1', label: 'Trk 2' },
        { value: 'track:2', label: 'Trk 3' }, { value: 'track:3', label: 'Trk 4' },
        { value: 'track:4', label: 'Trk 5' }, { value: 'track:5', label: 'Trk 6' },
        { value: 'track:6', label: 'Trk 7' }, { value: 'track:7', label: 'Trk 8' },
        { value: 'group:0', label: 'Grp 1' }, { value: 'group:1', label: 'Grp 2' },
        { value: 'group:2', label: 'Grp 3' }, { value: 'group:3', label: 'Grp 4' },
        { value: 'return:0', label: 'Ret A' }, { value: 'return:1', label: 'Ret B' },
    ], (v) => { mod.source = v; onRender(); });

    // Row 2: ATK slider (1-500ms)
    _addSliderRow(grid, colorClass, mod.attack, 1, 500, 1, (v) => { mod.attack = v; }, 'ms');

    // Row 3: REL slider (10-2000ms)
    _addSliderRow(grid, colorClass, mod.release, 10, 2000, 1, (v) => { mod.release = v; }, 'ms');

    // Row 4: INVERT toggle
    const invCell = document.createElement('div');
    invCell.className = `grid-cell ${colorClass}`;
    const invBtn = document.createElement('div');
    invBtn.className = `wave-btn ${mod.invert ? 'active' : ''}`;
    invBtn.innerText = mod.invert ? 'INV' : 'NRM';
    invBtn.style.width = '100%';
    invBtn.style.fontSize = '8px';
    invBtn.onclick = () => { mod.invert = !mod.invert; onRender(); };
    invCell.appendChild(invBtn);
    grid.appendChild(invCell);
}

function _addSliderRow(grid, colorClass, value, min, max, step, setter, suffix = '') {
    const cell = document.createElement('div');
    cell.className = `grid-cell ${colorClass}`;
    const input = document.createElement('input');
    input.type = 'range'; input.className = 'micro-slider';
    input.min = min; input.max = max; input.step = step;
    input.value = value;
    input.title = value + suffix;
    input.oninput = (e) => {
        setter(parseFloat(e.target.value));
        input.title = parseFloat(e.target.value) + suffix;
    };
    cell.appendChild(input);
    grid.appendChild(cell);
}

function _addSelectRow(grid, colorClass, currentValue, options, setter) {
    const cell = document.createElement('div');
    cell.className = `grid-cell ${colorClass}`;
    const sel = document.createElement('select');
    sel.style.cssText = 'width:100%; background:#1a1a1a; color:#ccc; border:1px solid #333; font-size:8px; padding:1px; border-radius:3px;';
    options.forEach(o => {
        const opt = document.createElement('option');
        opt.value = o.value; opt.innerText = o.label;
        if (o.value === currentValue) opt.selected = true;
        sel.appendChild(opt);
    });
    sel.onchange = (e) => setter(e.target.value);
    cell.appendChild(sel);
    grid.appendChild(cell);
}
