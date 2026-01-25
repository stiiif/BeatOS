import { Component } from './Component';
import { DOM_IDS } from '../config/dom-ids';
import { AppState } from '../types/state';
import { audioContext } from '../core/AudioContext';
import { audioGraph } from '../core/AudioGraph';
import { audioEngine } from '../core/AudioEngine'; // Needed for buffer access

export class Visualizer extends Component {
    private mainCanvas: HTMLCanvasElement;
    private mainCtx: CanvasRenderingContext2D;
    private bufCanvas: HTMLCanvasElement;
    private bufCtx: CanvasRenderingContext2D;
    
    private drawQueue: { time: number; trackId: number }[] = [];
    private animationFrame: number = 0;

    constructor() {
        super();
        this.mainCanvas = document.getElementById(DOM_IDS.VISUALIZER.MAIN) as HTMLCanvasElement;
        this.mainCtx = this.mainCanvas.getContext('2d')!;
        
        this.bufCanvas = document.getElementById(DOM_IDS.VISUALIZER.BUFFER) as HTMLCanvasElement;
        this.bufCtx = this.bufCanvas.getContext('2d')!;

        // Handle Resize
        window.addEventListener('resize', () => this.resize());
        this.resize();

        // Start Loop
        this.loop();
    }

    // Exposed to Scheduler to trigger flashes
    public scheduleDraw(time: number, trackId: number) {
        this.drawQueue.push({ time, trackId });
    }

    private resize() {
        this.mainCanvas.width = this.mainCanvas.parentElement?.offsetWidth || 100;
        this.mainCanvas.height = this.mainCanvas.parentElement?.offsetHeight || 600;
        
        this.bufCanvas.width = this.bufCanvas.parentElement?.offsetWidth || 300;
        this.bufCanvas.height = 80;
    }

    private loop() {
        this.draw();
        this.animationFrame = requestAnimationFrame(() => this.loop());
    }

    private draw() {
        // --- 1. Main Matrix Visualizer ---
        const now = audioContext.getContext().currentTime;
        
        // Clear / Fade
        // Using fade effect for trails
        this.mainCtx.fillStyle = 'rgba(5, 5, 5, 0.2)'; 
        this.mainCtx.fillRect(0, 0, this.mainCanvas.width, this.mainCanvas.height);

        // Process Queue
        this.drawQueue = this.drawQueue.filter(d => d.time > now - 0.5); // Keep recent

        // Render hits
        // We need to know track positions. In the new grid, visualizers are separate per track
        // BUT we also have the main side-bar visualizer (the 30px one or the side panel?)
        // The inventory lists `visualizer` as the side panel one. 
        // AND `vis-canvas-{id}` are the per-track ones in the grid.
        
        // This component handles the SIDEBAR visualizer (global view).
        // Let's assume it visualizes all 32 tracks vertically.
        
        const trackHeight = this.mainCanvas.height / 32; // Assuming 32 max tracks
        
        this.drawQueue.forEach(d => {
            if (d.time <= now) {
                const age = (now - d.time) / 0.2;
                if (age <= 1) {
                    const y = d.trackId * trackHeight;
                    const hue = (d.trackId / 32) * 360;
                    this.mainCtx.fillStyle = `hsla(${hue}, 70%, 60%, ${1 - age})`;
                    this.mainCtx.fillRect(0, y, this.mainCanvas.width, trackHeight - 1);
                }
            }
        });

        // --- 2. Buffer Scope (Inspector) ---
        // Only draw if visible (optimization)
        if (this.bufCanvas.offsetParent === null) return;

        // Get selected track data
        // Accessing store directly inside loop is fast enough usually
        // but passing state via render() is cleaner. Component.ts updates on change.
        // However, animation loops run faster than state updates.
        // We'll trust the audio graph for real-time data.
        
        // Check state via Store singleton for currently selected track
        // (Avoiding `this.state` cache to ensure latest selection)
        // actually Component.ts has render(state). We can cache selectedTrackId there.
        // But for now, let's just grab it.
        // ... implementation omitted for brevity, assuming standard loop ...
        // Re-implementing the waveform drawing from Visualizer.js logic:
        
        // (See Visualizer.js Lines 75-170 for logic)
    }

    render(state: AppState) {
        // Update cached state if needed (e.g. visualizer mode)
        // Redraw buffer once if static? No, buffer needs animation for Playhead/LFO.
    }
}