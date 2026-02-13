// js/ui/shared/modulators/EnvFollowUI.js
import { TRACKS_PER_GROUP } from '../../../utils/constants.js';

/**
 * Build source options dynamically from actual tracks/groups/returns.
 */
function _buildSourceOptions() {
    const options = [{ value: 'master', label: 'Master' }];

    // Tracks — read actual count from DOM or TrackManager via global
    const trackEls = document.querySelectorAll('.mixer-strip:not(.master-strip):not(.group-strip):not(.return-strip)');
    const trackCount = Math.max(trackEls.length, 8); // fallback min 8
    for (let i = 0; i < trackCount; i++) {
        options.push({ value: `track:${i}`, label: `Trk ${i + 1}` });
    }

    // Groups — derive from track count
    const groupCount = Math.ceil(trackCount / TRACKS_PER_GROUP);
    for (let i = 0; i < groupCount; i++) {
        options.push({ value: `group:${i}`, label: `Grp ${i + 1}` });
    }

    // Returns — currently fixed at 2 (Delay/Reverb)
    options.push({ value: 'return:0', label: 'Ret A' });
    options.push({ value: 'return:1', label: 'Ret B' });

    return options;
}

/**
 * Render EnvelopeFollower-specific controls.
 */
export function renderEnvFollowUI(grid, mod, slotIndex, colorClass, onRender, idPrefix) {
    // Row 1: SOURCE selector (built dynamically)
    _addSelectRow(grid, colorClass, mod.source, _buildSourceOptions(), (v) => { mod.source = v; onRender(); });

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
