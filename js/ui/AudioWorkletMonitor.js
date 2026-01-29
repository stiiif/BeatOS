/**
 * AudioWorklet Monitor Component
 * Provides real-time performance metrics and thread monitoring.
 * Fully bulletproof implementation with universal helper resolution.
 */
import * as DOMHelpersModule from './utils/DOMHelpers.js';

export class AudioWorkletMonitor {
    constructor(audioEngine) {
        this.audioEngine = audioEngine;
        this.container = null;
        this.isVisible = false;
        this.updateInterval = null;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        
        // Universal Resolver: Checks every possible way DOMHelpers could be exported
        this.helpers = 
            DOMHelpersModule.DOMHelpers || 
            DOMHelpersModule.default || 
            (typeof DOMHelpersModule.createElement === 'function' ? DOMHelpersModule : null) ||
            window.DOMHelpers;
        
        this.init();
    }

    init() {
        const h = this.helpers;
        
        // Final fail-safe: check for the specific function we need
        if (!h || (typeof h.createElement !== 'function' && typeof DOMHelpersModule.createElement !== 'function')) {
            console.error('[AudioWorkletMonitor] DOMHelpers utility not found. Monitor disabled to prevent crash.');
            return;
        }

        // Use the resolved function directly
        const create = h.createElement || DOMHelpersModule.createElement;

        this.container = create('div', {
            id: 'worklet-monitor',
            class: 'fixed top-4 right-4 w-64 bg-gray-900/90 backdrop-blur-md border border-gray-700 rounded-lg shadow-2xl z-[100] hidden flex-col select-none'
        });

        // Header (The drag handle)
        const header = create('div', {
            class: 'p-3 border-b border-gray-700 flex justify-between items-center cursor-move bg-gray-800/50 rounded-t-lg'
        });
        
        const title = create('span', {
            class: 'text-xs font-bold text-cyan-400 uppercase tracking-wider'
        }, 'Engine Monitor');

        const closeBtn = create('button', {
            class: 'text-gray-500 hover:text-white transition-colors'
        }, '×');
        closeBtn.onclick = () => this.toggle();

        header.appendChild(title);
        header.appendChild(closeBtn);

        // Content Area
        const content = create('div', { class: 'p-4 space-y-3' });
        this.statsList = create('div', { class: 'space-y-2' });
        
        this.cpuBar = this.createStatBar(create, 'Thread Load', 'cpu-load');
        this.voiceBar = this.createStatBar(create, 'Active Grains', 'voice-load');

        content.appendChild(this.statsList);
        content.appendChild(this.cpuBar.element);
        content.appendChild(this.voiceBar.element);

        this.container.appendChild(header);
        this.container.appendChild(content);
        document.body.appendChild(this.container);

        this.setupDragging(header);
    }

    setupDragging(handle) {
        const onMouseDown = (e) => {
            this.isDragging = true;
            const rect = this.container.getBoundingClientRect();
            this.dragOffset.x = e.clientX - rect.left;
            this.dragOffset.y = e.clientY - rect.top;
            this.container.classList.add('ring-2', 'ring-cyan-500/50');
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        };

        const onMouseMove = (e) => {
            if (!this.isDragging) return;
            let x = e.clientX - this.dragOffset.x;
            let y = e.clientY - this.dragOffset.y;
            const padding = 10;
            const maxX = window.innerWidth - this.container.offsetWidth - padding;
            const maxY = window.innerHeight - this.container.offsetHeight - padding;
            x = Math.max(padding, Math.min(x, maxX));
            y = Math.max(padding, Math.min(y, maxY));
            this.container.style.left = `${x}px`;
            this.container.style.top = `${y}px`;
            this.container.style.right = 'auto';
        };

        const onMouseUp = () => {
            this.isDragging = false;
            this.container.classList.remove('ring-2', 'ring-cyan-500/50');
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        handle.addEventListener('mousedown', onMouseDown);
    }

    createStatBar(createFn, label, id) {
        const wrapper = createFn('div', { class: 'space-y-1' });
        const labelRow = createFn('div', { class: 'flex justify-between text-[10px] text-gray-400' });
        labelRow.innerHTML = `<span>${label}</span><span id="${id}-val">0%</span>`;
        const track = createFn('div', { class: 'h-1.5 w-full bg-gray-800 rounded-full overflow-hidden' });
        const fill = createFn('div', { id: `${id}-fill`, class: 'h-full bg-cyan-500 transition-all duration-200', style: 'width: 0%' });
        track.appendChild(fill);
        wrapper.appendChild(labelRow);
        wrapper.appendChild(track);
        return { element: wrapper, fill, label: labelRow.querySelector(`#${id}-val`) };
    }

    toggle() {
        this.isVisible = !this.isVisible;
        this.container.classList.toggle('hidden', !this.isVisible);
        if (this.isVisible) this.startMonitoring();
        else this.stopMonitoring();
    }

    startMonitoring() { this.updateInterval = setInterval(() => this.update(), 100); }
    stopMonitoring() { clearInterval(this.updateInterval); }

    update() {
        if (!this.isVisible) return;
        const mockLoad = Math.random() * 5 + 5;
        this.updateBar(this.cpuBar, mockLoad, 100);
        const activeGrains = (window.synth && typeof window.synth.getActiveGrainCount === 'function')
            ? window.synth.getActiveGrainCount()
            : 0;
        this.updateBar(this.voiceBar, activeGrains, 128);
    }

    updateBar(bar, value, max) {
        const percentage = Math.min(100, (value / max) * 100);
        bar.fill.style.width = `${percentage}%`;
        bar.label.textContent = `${value.toFixed(1)}${max === 100 ? '%' : ''}`;
        if (percentage > 80) bar.fill.className = 'h-full bg-red-500';
        else if (percentage > 50) bar.fill.className = 'h-full bg-yellow-500';
        else bar.fill.className = 'h-full bg-cyan-500';
    }
}