// js/ui/shared/LfoRateSlider.js
// Shared factory for LFO rate slider UI.
// Single source of truth — used by AutomationPanel and EffectControls.

import { LFO } from '../../modules/modulators/LFO.js';

/**
 * Create a rate slider cell for an LFO.
 * @param {HTMLElement} grid - Parent grid to append to
 * @param {LFO} lfo - LFO instance
 * @param {string} displayId - Unique ID for the rate display element (e.g. 'lfo-rate-val-0' or 'fx-lfo-rate-0-1')
 * @param {string} colorClass - CSS color class
 * @param {Function} onValueChange - Called with (key, value) when slider changes. key is 'rate' or 'syncRateIndex'
 * @param {Function} onCommit - Called on mouseup/change to trigger re-render
 */
export function createLfoRateSlider(grid, lfo, displayId, colorClass, onValueChange, onCommit) {
    const cell = document.createElement('div');
    cell.className = `grid-cell ${colorClass}`;

    const updateDisplay = () => {
        const el = document.getElementById(displayId);
        if (!el) return;
        if (lfo.sync) {
            const entry = LFO.SYNC_RATES[lfo.syncRateIndex];
            el.innerText = entry.label;
            const type = entry.type;
            if (type === 'triplet') el.style.color = '#60a5fa';
            else if (type === 'dotted') el.style.color = '#f472b6';
            else if (type === 'quintuplet') el.style.color = '#a78bfa';
            else if (type === 'septuplet') el.style.color = '#fbbf24';
            else el.style.color = '';
        } else {
            el.innerText = lfo.rate < 1 ? lfo.rate.toFixed(2) + 'Hz' : lfo.rate.toFixed(1) + 'Hz';
            el.style.color = '';
        }
    };

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.className = 'micro-slider';

    if (lfo.sync) {
        // Sync mode: step through all SYNC_RATES entries
        slider.min = 0;
        slider.max = LFO.SYNC_RATES.length - 1;
        slider.step = 1;
        slider.value = lfo.syncRateIndex;

        slider.oninput = (e) => {
            const idx = parseInt(e.target.value);
            lfo.syncRateIndex = idx;
            if (onValueChange) onValueChange('syncRateIndex', idx);
            updateDisplay();
        };
        slider.onchange = () => { if (onCommit) onCommit(); };
    } else {
        // Free mode: logarithmic scale 0.05Hz - 20Hz
        const LOG_MIN = Math.log(0.05);
        const LOG_MAX = Math.log(20);
        const STEPS = 1000;

        const rateToSlider = (rate) => {
            const clamped = Math.max(0.05, Math.min(20, rate));
            return Math.round(((Math.log(clamped) - LOG_MIN) / (LOG_MAX - LOG_MIN)) * STEPS);
        };
        const sliderToRate = (val) => {
            return Math.exp(LOG_MIN + (val / STEPS) * (LOG_MAX - LOG_MIN));
        };

        slider.min = 0;
        slider.max = STEPS;
        slider.step = 1;
        slider.value = rateToSlider(lfo.rate);

        slider.oninput = (e) => {
            const rate = parseFloat(sliderToRate(parseInt(e.target.value)).toFixed(3));
            lfo.rate = rate;
            if (onValueChange) onValueChange('rate', rate);
            updateDisplay();
        };
        slider.onchange = () => { if (onCommit) onCommit(); };
    }

    cell.appendChild(slider);
    grid.appendChild(cell);
}

/**
 * Create a sync display cell for an LFO (SYNC button + rate label).
 * @param {HTMLElement} grid - Parent grid to append to
 * @param {LFO} lfo - LFO instance
 * @param {string} displayId - Same ID used by createLfoRateSlider for the rate display
 * @param {string} colorClass - CSS color class
 * @param {Function} onToggle - Called when sync is toggled (should trigger re-render)
 */
export function createLfoSyncCell(grid, lfo, displayId, colorClass, onToggle) {
    const cell = document.createElement('div');
    cell.className = `grid-cell p-0 ${colorClass}`;

    const content = document.createElement('div');
    content.className = 'sync-cell-content';

    // Sync button
    const btn = document.createElement('div');
    btn.className = `sync-btn ${lfo.sync ? 'active' : ''}`;
    btn.innerText = 'SYNC';
    btn.onclick = () => {
        lfo.sync = !lfo.sync;
        if (onToggle) onToggle();
    };

    // Rate value display
    const rateVal = document.createElement('div');
    rateVal.className = 'sync-val';
    rateVal.id = displayId;
    if (lfo.sync) {
        const entry = LFO.SYNC_RATES[lfo.syncRateIndex];
        rateVal.innerText = entry.label;
        const type = entry.type;
        if (type === 'triplet') rateVal.style.color = '#60a5fa';
        else if (type === 'dotted') rateVal.style.color = '#f472b6';
        else if (type === 'quintuplet') rateVal.style.color = '#a78bfa';
        else if (type === 'septuplet') rateVal.style.color = '#fbbf24';
    } else {
        rateVal.innerText = lfo.rate < 1 ? lfo.rate.toFixed(2) + 'Hz' : lfo.rate.toFixed(1) + 'Hz';
    }

    content.appendChild(btn);
    content.appendChild(rateVal);
    cell.appendChild(content);
    grid.appendChild(cell);
}
