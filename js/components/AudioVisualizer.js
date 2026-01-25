import { BaseComponent } from './BaseComponent.js';
import { appStore } from '../state/Store.js';
// We need access to the AudioGraph to get the analyser node.
// In a pure Flux architecture, components shouldn't touch the engine directly.
// However, for high-performance visualization (60fps), passing data via Store is too slow.
// We will look for the AudioEngine instance on the window or export a singleton if possible.
// For this refactor, we will assume we can import the engine instance or graph from the main entry 
// once it's initialized, OR we pass the analyser node to this component.
//
// BETTER APPROACH: The component manages its own rAF loop and queries the engine singleton.
// We haven't exported the engine singleton yet (it's created in main.js).
// Let's create a shared accessor for the Engine in the next step (4.2). 
// For now, I will prepare the component to accept an `analyser-node` property or look for a global.

export class AudioVisualizer extends BaseComponent {
    constructor() {
        super();
        this.canvas = null;
        this.ctx = null;
        this.animationFrame = null;
        this.analyser = null;
        this.buffer = null; // For static waveform
        this.mode = 'wave'; // 'wave' or 'spectrum'
    }

    connectedCallback() {
        super.connectedCallback();
        this.render();
        this.initCanvas();
        
        // Listen for track selection to update the source
        this.subscribe('STATE_CHANGED:selectedTrackId', () => {
            this.updateSource();
        });

        // Start loop
        this.draw();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
    }

    /**
     * Public method to set the source analyser node
     * @param {AnalyserNode} analyserNode 
     */
    setAnalyser(analyserNode) {
        this.analyser = analyserNode;
    }

    /**
     * Public method to set a static buffer for waveform display
     * @param {AudioBuffer} buffer 
     */
    setBuffer(buffer) {
        this.buffer = buffer;
    }

    updateSource() {
        // This will be called by the parent or main loop to inject the correct analyser
        // We emit an event asking for the analyser? 
        // Or we rely on the parent (Inspector) to call setAnalyser.
        this.dispatchEvent(new CustomEvent('visualizer-needs-update', {
            bubbles: true,
            composed: true,
            detail: { trackId: appStore.state.selectedTrackId }
        }));
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    width: 100%;
                    height: 100%;
                    background: #111;
                    position: relative;
                }
                canvas {
                    width: 100%;
                    height: 100%;
                    display: block;
                }
                .overlay {
                    position: absolute;
                    top: 5px;
                    left: 5px;
                    font-family: monospace;
                    font-size: 10px;
                    color: #555;
                    pointer-events: none;
                }
            </style>
            <canvas></canvas>
            <div class="overlay">VISUALIZER</div>
        `;
    }

    initCanvas() {
        this.canvas = this.shadowRoot.querySelector('canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Handle High DPI
        const dpr = window.devicePixelRatio || 1;
        const rect = this.getBoundingClientRect();
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);
    }

    draw() {
        this.animationFrame = requestAnimationFrame(() => this.draw());
        
        if (!this.ctx || !this.canvas) return;

        const width = this.canvas.width / (window.devicePixelRatio || 1);
        const height = this.canvas.height / (window.devicePixelRatio || 1);

        // Clear
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, 0, width, height);

        if (this.analyser) {
            this.drawRealtime(width, height);
        } else if (this.buffer) {
            this.drawStaticBuffer(width, height);
        } else {
            this.ctx.fillStyle = '#333';
            this.ctx.textAlign = 'center';
            this.ctx.font = '10px monospace';
            this.ctx.fillText("NO SIGNAL", width / 2, height / 2);
        }
    }

    drawRealtime(w, h) {
        if (!this.analyser) return;

        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.analyser.getByteTimeDomainData(dataArray);

        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = '#10b981'; // Emerald
        this.ctx.beginPath();

        const sliceWidth = w * 1.0 / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0;
            const y = v * h / 2;

            if (i === 0) this.ctx.moveTo(x, y);
            else this.ctx.lineTo(x, y);

            x += sliceWidth;
        }

        this.ctx.lineTo(w, h / 2);
        this.ctx.stroke();
    }

    drawStaticBuffer(w, h) {
        // Optimization: Don't redraw static buffer every frame if it hasn't changed?
        // For now, keep it simple.
        const data = this.buffer.getChannelData(0);
        const step = Math.ceil(data.length / w);
        const amp = h / 2;

        this.ctx.fillStyle = '#10b981';
        this.ctx.beginPath();
        
        for (let i = 0; i < w; i++) {
            let min = 1.0;
            let max = -1.0;
            for (let j = 0; j < step; j++) {
                const datum = data[(i * step) + j];
                if (datum < min) min = datum;
                if (datum > max) max = datum;
            }
            this.ctx.fillRect(i, (1 + min) * amp, 1, Math.max(1, (max - min) * amp));
        }
    }
}

customElements.define('audio-visualizer', AudioVisualizer);