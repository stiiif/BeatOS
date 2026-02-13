// js/ui/shared/modulators/LfoUI.js
import { LFO } from '../../../modules/modulators/LFO.js';
import { createLfoRateSlider, createLfoSyncCell } from '../LfoRateSlider.js';

/**
 * Render LFO-specific controls into the grid.
 * @param {HTMLElement} grid
 * @param {LFO} mod - The LFO modulator
 * @param {number} slotIndex
 * @param {string} colorClass
 * @param {Function} onRender - Re-render callback
 * @param {string} idPrefix - Unique prefix for element IDs
 */
export function renderLfoUI(grid, mod, slotIndex, colorClass, onRender, idPrefix) {
    const waves = ['sine', 'square', 'sawtooth', 'random'];
    const waveLabels = ['SIN', 'SQR', 'SAW', 'RND'];

    // WAVE row
    const cell = document.createElement('div');
    cell.className = `grid-cell ${colorClass}`;
    const microGrid = document.createElement('div');
    microGrid.className = 'micro-grid-4';
    waves.forEach((w, idx) => {
        const b = document.createElement('button');
        const active = mod.wave === w;
        b.className = `wave-btn ${active ? 'active' : ''}`;
        b.innerText = waveLabels[idx];
        b.onclick = () => { mod.wave = w; onRender(); };
        microGrid.appendChild(b);
    });
    cell.appendChild(microGrid);
    grid.appendChild(cell);

    // SYNC row
    const displayId = `${idPrefix}-rate-val-${slotIndex}`;
    createLfoSyncCell(grid, mod, displayId, colorClass, onRender);

    // RATE row
    createLfoRateSlider(grid, mod, displayId, colorClass, null, onRender);
}
