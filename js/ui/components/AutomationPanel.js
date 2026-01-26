// js/ui/components/AutomationPanel.js
import { NUM_LFOS } from '../../utils/constants.js';

export class AutomationPanel {
    constructor() {
        this.selectedLfoIndex = 0;
    }

    initialize(setSelectedLfoCallback) {
        this.generateLfoTabs(setSelectedLfoCallback);
        this.bindAutomationControls();
    }

    generateLfoTabs(setSelectedLfoCallback) {
        const container = document.getElementById('lfoTabs');
        if (!container) return;
        
        container.innerHTML = '';
        
        for (let i = 0; i < NUM_LFOS; i++) {
            const btn = document.createElement('button');
            btn.className = 'lfo-tab';
            btn.dataset.lfo = i;
            btn.innerText = `LFO ${i + 1}`;
            
            btn.addEventListener('click', () => {
                setSelectedLfoCallback(i);
            });
            
            container.appendChild(btn);
        }
    }

    bindAutomationControls() {
        // Bind LFO control listeners
        const lfoTarget = document.getElementById('lfoTarget');
        const lfoWave = document.getElementById('lfoWave');
        const lfoRate = document.getElementById('lfoRate');
        const lfoAmt = document.getElementById('lfoAmt');
        
        if (lfoTarget) {
            lfoTarget.addEventListener('change', (e) => {
                // Handle in main UIManager
                window.dispatchEvent(new CustomEvent('lfoTargetChange', {
                    detail: { value: e.target.value }
                }));
            });
        }
        
        // Similar for other controls...
    }

    handleSliderWheel(e) {
        e.preventDefault();
        const slider = e.target;
        const delta = e.deltaY > 0 ? -0.01 : 0.01;
        const step = parseFloat(slider.step) || 0.01;
        const min = parseFloat(slider.min);
        const max = parseFloat(slider.max);
        let newVal = parseFloat(slider.value) + (delta * step * 10);
        newVal = Math.max(min, Math.min(max, newVal));
        slider.value = newVal;
        slider.dispatchEvent(new Event('input', { bubbles: true }));
    }
}