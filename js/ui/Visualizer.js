// Visualizer Module - Lo-Fi Optimized
import { globalBus } from '../events/EventBus.js';

export class Visualizer {
    constructor(canvasId, bufferCanvasId, audioEngine) {
        this.bufCanvas = document.getElementById(bufferCanvasId);
        if(this.bufCanvas) {
            this.bufCtx = this.bufCanvas.getContext('2d', { alpha: false }); 
        }
        this.audioEngine = audioEngine;
        this.drawQueue = [];
        this.tracks = [];
        this.selectedTrackIndex = 0;
        this.scopeMode = 'wave'; 
        
        this.waveStyle = 'mirror';

        this.isRunning = false;
        this.needsRedraw = false;
        this.lastDrawTime = 0;
        this.isVisible = true;
        this.canvasCache = new Map();

        globalBus.on('playback:start', () => this.startLoop());
        globalBus.on('playback:stop', () => this.stopLoop());

        document.addEventListener('visibilitychange', () => {
            this.isVisible = !document.hidden;
            if (this.isVisible && this.isRunning) {
                this.drawVisuals();
            }
        });
    }

    setTracks(tracks) {
        this.tracks = tracks;
    }

    setSelectedTrackIndex(index) {
        this.selectedTrackIndex = index;
    }

    setScopeMode(mode) {
        this.scopeMode = mode;
    }

    cycleWaveStyle() {
        const styles = ['mirror', 'neon', 'bars', 'precision'];
        const currentIdx = styles.indexOf(this.waveStyle);
        this.waveStyle = styles[(currentIdx + 1) % styles.length];
        return this.waveStyle; 
    }

    resizeCanvas() {
        if (this.bufCanvas) {
            this.bufCanvas.width = this.bufCanvas.parentElement.offsetWidth;
            this.bufCanvas.height = 80;
            this.drawBufferDisplay();
        }
    }

    scheduleVisualDraw(time, trackId) {
        this.drawQueue.push({time, trackId});
    }

    startLoop() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.drawVisuals();
        }
    }

    stopLoop() {
        this.isRunning = false;
    }

    triggerRedraw() {
        this.needsRedraw = true;
        if (!this.isRunning && this.isVisible) {
            requestAnimationFrame((t) => this.drawVisuals(t, true));
        }
    }

    getTrackCanvas(trackId) {
        if (!this.canvasCache.has(trackId)) {
            const el = document.getElementById(`vis-canvas-${trackId}`);
            if (el) this.canvasCache.set(trackId, el);
        }
        return this.canvasCache.get(trackId);
    }

    drawVisuals(timestamp, forceOnce = false) {
        if (!this.isVisible && !forceOnce) return;
        if (!this.isRunning && !this.needsRedraw && !forceOnce) return;

        // Throttled to 24 FPS (~41ms)
        if (timestamp && (timestamp - this.lastDrawTime < 41) && !forceOnce) {
            if (this.isRunning) requestAnimationFrame((t) => this.drawVisuals(t));
            return;
        }
        this.lastDrawTime = timestamp;

        const audioCtx = this.audioEngine.getContext();
        const now = audioCtx ? audioCtx.currentTime : 0;
        
        let activeCount = 0;
        for (let i = 0; i < this.drawQueue.length; i++) {
            if (this.drawQueue[i].time > now - 0.5) {
                if (i !== activeCount) this.drawQueue[activeCount] = this.drawQueue[i];
                activeCount++;
            }
        }
        this.drawQueue.length = activeCount;

        for(let i=0; i<this.tracks.length; i++) {
            const canvas = this.getTrackCanvas(i); 
            if(canvas) {
                const ctx = canvas.getContext('2d', { alpha: true });
                ctx.fillStyle = 'rgba(0,0,0,0.2)'; 
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
        }

        for(let d of this.drawQueue) {
            if (d.time <= now) {
                const age = (now - d.time) / 0.2; 
                if(age > 1) continue;
                
                const canvas = this.getTrackCanvas(d.trackId); 
                if(canvas) {
                    const ctx = canvas.getContext('2d');
                    const w = canvas.width;
                    const h = canvas.height;
                    const hue = (d.trackId / this.tracks.length) * 360;
                    ctx.fillStyle = `hsla(${hue}, 70%, 60%, ${1-age})`;
                    ctx.fillRect(0, 0, w, h);
                }
            }
        }
        
        if(this.bufCanvas) this.drawBufferDisplay();
        this.needsRedraw = false;

        if (this.isRunning) {
            requestAnimationFrame((t) => this.drawVisuals(t));
        }
    }

    drawBufferDisplay() {
        if(!this.bufCanvas) return;
        
        const w = this.bufCanvas.width;
        const h = this.bufCanvas.height;
        const ctx = this.bufCtx;
        const t = this.tracks[this.selectedTrackIndex];
        const audioCtx = this.audioEngine.getContext();

        ctx.fillStyle = '#0f0f0f'; 
        ctx.fillRect(0, 0, w, h);

        if (this.scopeMode === 'spectrum') {
            if (!audioCtx || !t || !t.bus || !t.bus.analyser) {
                this.drawNoSignal(ctx, w, h);
                return;
            }
            this.drawSpectrum(ctx, w, h, t.bus.analyser);
            return;
        }

        if (!audioCtx || !t || !t.buffer) {
            this.drawNoDataMessage(ctx, w, h, t);
            return;
        }

        const data = t.buffer.getChannelData(0);
        let sampleStart = t.params.sampleStart || 0;
        let sampleEnd = t.params.sampleEnd !== undefined ? t.params.sampleEnd : 1;
        if (sampleStart > sampleEnd) { const temp = sampleStart; sampleStart = sampleEnd; sampleEnd = temp; }
        
        const startIdx = Math.floor(sampleStart * data.length);
        const endIdx = Math.floor(sampleEnd * data.length);
        const windowLength = Math.max(1, endIdx - startIdx); 
        
        // LO-FI DRAWING: Simpler path drawing
        this.drawStyleLoFi(ctx, data, w, h, startIdx, windowLength);

        this.drawOverlays(ctx, t, w, h, audioCtx.currentTime, sampleStart, sampleEnd);
    }

    drawStyleLoFi(ctx, data, w, h, startIdx, windowLength) {
        // Optimize step to skip more samples
        const step = Math.max(1, Math.ceil(windowLength / w));
        const amp = h / 2;
        const mid = h / 2;

        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 1;
        ctx.beginPath();

        // Very sparse sampling
        for (let i = 0; i < w; i+=2) { // Skip every other pixel horizontally
            const idx = startIdx + (i * step);
            if (idx >= data.length) break;
            
            // Just take one sample, no loop/min/max search
            const val = data[idx]; 
            const y = mid - (val * amp);
            
            if (i===0) ctx.moveTo(i, y);
            else ctx.lineTo(i, y);
        }
        ctx.stroke();
    }

    drawSpectrum(ctx, w, h, analyser) {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);

        const barWidth = (w / bufferLength) * 2.5; 
        let x = 0;

        for(let i = 0; i < bufferLength; i+=4) { // Draw fewer bars
            const val = dataArray[i];
            if (val < 5) continue;

            const barHeight = (val / 255) * h;
            const hue = 200 + ((i / bufferLength) * 120); 
            ctx.fillStyle = `hsl(${hue}, 80%, 60%)`;
            ctx.fillRect(x, h - barHeight, barWidth*4, barHeight);

            x += (barWidth * 4) + 1;
            if (x > w) break; 
        }
    }

    drawNoDataMessage(ctx, w, h, t) {
        ctx.fillStyle = '#444';
        ctx.font = '10px monospace';
        if (t && t.type === 'simple-drum') { ctx.fillStyle = '#f97316'; ctx.fillText("909 ENGINE ACTIVE", 10, 40); } 
        else if (t && t.type === 'automation') { ctx.fillStyle = '#818cf8'; ctx.fillText("AUTOMATION TRACK", 10, 40); } 
        else { ctx.fillText("No Buffer Data", 10, 40); }
    }

    drawNoSignal(ctx, w, h) { ctx.fillStyle = '#333'; ctx.font = '10px monospace'; ctx.fillText("No Signal", 10, 40); }

    drawOverlays(ctx, t, w, h, time, start, end) {
        let mod = { position:0, spray:0, density:0, grainSize:0, sampleStart:0, sampleEnd:0 };
        t.lfos.forEach(lfo => {
            if (lfo.amount > 0 && lfo.target !== 'none') {
                const v = lfo.getValue(time);
                if(mod[lfo.target] !== undefined) mod[lfo.target] += v;
            }
        });

        const p = t.params;
        let actStart = Math.max(0, Math.min(1, (p.sampleStart || 0) + mod.sampleStart));
        let actEnd = Math.max(0, Math.min(1, (p.sampleEnd !== undefined ? p.sampleEnd : 1) + mod.sampleEnd));
        if (actStart > actEnd) { const temp = actStart; actStart = actEnd; actEnd = temp; }
        
        const viewStart = start;
        const viewEnd = end;
        const viewRange = Math.max(0.0001, viewEnd - viewStart);
        const mapToView = (absPos) => ((absPos - viewStart) / viewRange) * w;

        const effectivePos = (p.scanSpeed !== 0) ? t.playhead : p.position;
        let relativePos = effectivePos + mod.position;
        relativePos = Math.max(0, Math.min(1, relativePos));
        
        const absPos = actStart + (relativePos * (actEnd - actStart));
        const finalPos = Math.max(0, Math.min(1, absPos)); 
        
        const posPx = mapToView(finalPos);
        
        if (posPx >= 0 && posPx <= w) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fillRect(posPx, 0, 1, h); // Simple rect instead of path
        }
    }
}