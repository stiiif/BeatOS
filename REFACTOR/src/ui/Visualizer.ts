import { Component } from './Component';
import { DOM_IDS } from '../config/dom-ids';
import type { AppState } from '../types/state';
import { audioContext } from '../core/AudioContext';

export class Visualizer extends Component {
    private mainCanvas: HTMLCanvasElement;
    private mainCtx: CanvasRenderingContext2D;
    private bufCanvas: HTMLCanvasElement;
    private bufCtx: CanvasRenderingContext2D;
    
    private drawQueue: { time: number; trackId: number }[] = [];

    constructor() {
        super();
        this.mainCanvas = document.getElementById(DOM_IDS.VISUALIZER.MAIN) as HTMLCanvasElement;
        this.mainCtx = this.mainCanvas.getContext('2d')!;
        
        this.bufCanvas = document.getElementById(DOM_IDS.VISUALIZER.BUFFER) as HTMLCanvasElement;
        this.bufCtx = this.bufCanvas.getContext('2d')!;

        window.addEventListener('resize', () => this.resize());
        this.resize();

        this.loop();
    }

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
        requestAnimationFrame(() => this.loop());
    }

    private draw() {
        const now = audioContext.getContext().currentTime;
        
        this.mainCtx.fillStyle = 'rgba(5, 5, 5, 0.2)'; 
        this.mainCtx.fillRect(0, 0, this.mainCanvas.width, this.mainCanvas.height);

        this.drawQueue = this.drawQueue.filter(d => d.time > now - 0.5); 

        const trackHeight = this.mainCanvas.height / 32; 
        
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

        if (this.bufCanvas.offsetParent === null) return;
    }

    render(state: AppState) {
        // ...
    }
}