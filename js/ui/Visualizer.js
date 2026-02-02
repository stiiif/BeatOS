// Visualizer Module
export class Visualizer {
    constructor(canvasId, bufferCanvasId, audioEngine) {
        // Main canvas ID ignored now if we move to per-track logic, but kept for compatibility
        this.bufCanvas = document.getElementById(bufferCanvasId);
        if(this.bufCanvas) {
            this.bufCtx = this.bufCanvas.getContext('2d', { alpha: false }); // Optimize
        }
        this.audioEngine = audioEngine;
        this.drawQueue = [];
        this.tracks = [];
        this.selectedTrackIndex = 0;
        this.scopeMode = 'wave'; 
        this.waveStyle = 'mirror'; 
        
        // Optimization flags
        this.lastDrawTime = 0;
        this.fpsThrottle = 1000 / 60; // Max 60fps
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

    drawVisuals() {
        requestAnimationFrame(() => this.drawVisuals());

        const now = performance.now();
        if (now - this.lastDrawTime < this.fpsThrottle) return;
        this.lastDrawTime = now;

        const audioCtx = this.audioEngine.getContext();
        // OPTIMIZATION: Stop drawing if context is suspended or not running
        if (!audioCtx || audioCtx.state !== 'running') return;

        const currentTime = audioCtx.currentTime;
        
        // 1. Clean up old events from queue
        this.drawQueue = this.drawQueue.filter(d => d.time > currentTime - 0.5);

        // 2. Only redraw flashing indicators if there are active events
        if (this.drawQueue.length > 0) {
            // Fade out all track canvases (This is heavy, maybe optimize?)
            // We can iterate only active tracks if we tracked them, but 32 small canvases isn't too bad
            // if we use a single clearRect or similar. 
            // For now, let's keep it but skip if queue is empty.
            
            for(let i=0; i<this.tracks.length; i++) {
                const canvas = document.getElementById(`vis-canvas-${i}`);
                if(canvas) {
                    const ctx = canvas.getContext('2d');
                    // Optimization: Check if canvas is actually dirty? 
                    // Hard to know without state. Just fading is okay for now.
                    ctx.fillStyle = 'rgba(0,0,0,0.2)'; 
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }
            }

            // Draw new hits
            for(let d of this.drawQueue) {
                if (d.time <= currentTime) {
                    const age = (currentTime - d.time) / 0.2; 
                    if(age > 1) continue;
                    
                    const canvas = document.getElementById(`vis-canvas-${d.trackId}`);
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
        }
        
        // Continuous animate buffer scope
        if(this.bufCanvas) this.drawBufferDisplay();
    }

    drawBufferDisplay() {
        if(!this.bufCanvas) return;
        
        const w = this.bufCanvas.width;
        const h = this.bufCanvas.height;
        const ctx = this.bufCtx;
        const t = this.tracks[this.selectedTrackIndex];
        const audioCtx = this.audioEngine.getContext();

        // Clear
        ctx.fillStyle = '#0f0f0f'; 
        ctx.fillRect(0, 0, w, h);

        if (!t) return;

        if (t.isProcessing) {
            ctx.fillStyle = '#10b981';
            ctx.font = '12px monospace';
            ctx.textAlign = 'center';
            ctx.fillText("ANALYZING...", w / 2, h / 2 + 4);
            return;
        }
        ctx.textAlign = 'left';

        // --- SPECTRUM MODE ---
        if (this.scopeMode === 'spectrum') {
            if (!audioCtx || !t || !t.bus || !t.bus.analyser) {
                this.drawNoSignal(ctx, w, h);
                return;
            }
            this.drawSpectrum(ctx, w, h, t.bus.analyser);
            return;
        }

        // --- WAVEFORM MODE ---
        if (!audioCtx || !t || !t.buffer) {
            this.drawNoDataMessage(ctx, w, h, t);
            return;
        }

        // Draw the waveform based on selected style
        const data = t.buffer.getChannelData(0);
        let sampleStart = t.params.sampleStart || 0;
        let sampleEnd = t.params.sampleEnd !== undefined ? t.params.sampleEnd : 1;
        
        if (sampleStart > sampleEnd) { const temp = sampleStart; sampleStart = sampleEnd; sampleEnd = temp; }
        
        const startIdx = Math.floor(sampleStart * data.length);
        const endIdx = Math.floor(sampleEnd * data.length);
        const windowLength = Math.max(1, endIdx - startIdx); 
        
        // Optimizing draw calls: Ensure we don't draw if window is tiny or invalid
        if (windowLength < 2) return;

        switch(this.waveStyle) {
            case 'mirror': this.drawStyleMirror(ctx, data, w, h, startIdx, windowLength); break;
            case 'neon':   this.drawStyleNeon(ctx, data, w, h, startIdx, windowLength); break;
            case 'bars':   this.drawStyleBars(ctx, data, w, h, startIdx, windowLength); break;
            case 'precision': this.drawStylePrecision(ctx, data, w, h, startIdx, windowLength); break;
            default:       this.drawStyleMirror(ctx, data, w, h, startIdx, windowLength);
        }

        this.drawOverlays(ctx, t, w, h, audioCtx.currentTime, sampleStart, sampleEnd);
    }

    // ... drawStyleMirror, drawStyleNeon, drawStyleBars, drawStylePrecision, drawSpectrum, drawNoDataMessage, drawNoSignal, drawOverlays ...
    // (Existing drawing methods preserved, just ensuring they are part of the class)
    
    drawStyleMirror(ctx, data, w, h, startIdx, windowLength) {
        const step = Math.max(1, Math.ceil(windowLength / w));
        const amp = h / 2;
        const mid = h / 2;
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#10b981');   
        grad.addColorStop(0.5, '#34d399'); 
        grad.addColorStop(1, '#10b981');   
        ctx.fillStyle = grad;
        ctx.beginPath();
        for (let i = 0; i < w; i++) {
            let min = 1.0; let max = -1.0;
            const chunkStart = startIdx + (i * step);
            if (chunkStart >= data.length) break;
            for (let j = 0; j < step; j++) {
                const idx = chunkStart + j;
                if (idx < data.length) {
                    const datum = data[idx];
                    if (datum < min) min = datum;
                    if (datum > max) max = datum;
                }
            }
            if (max < min) { max = 0.01; min = -0.01; }
            const y1 = mid + (min * amp * 0.9);
            const y2 = mid + (max * amp * 0.9);
            ctx.rect(i, y1, 1, Math.max(1, y2 - y1));
        }
        ctx.fill();
    }

    drawStyleNeon(ctx, data, w, h, startIdx, windowLength) {
        const step = Math.max(1, Math.ceil(windowLength / w));
        const amp = h / 2;
        const mid = h / 2;
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#22c55e';
        ctx.strokeStyle = '#4ade80'; 
        ctx.lineWidth = 1.5;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        for (let i = 0; i < w; i++) {
            let val = 0;
            const chunkStart = startIdx + (i * step);
            if (chunkStart >= data.length) break;
            let count = 0;
            for (let j = 0; j < step; j++) {
                const idx = chunkStart + j;
                if (idx < data.length) { val += data[idx]; count++; }
            }
            if (count > 0) val /= count;
            const y = mid - (val * amp * 0.9);
            if (i === 0) ctx.moveTo(i, y); else ctx.lineTo(i, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    drawStyleBars(ctx, data, w, h, startIdx, windowLength) {
        const barWidth = 2;
        const gap = 1;
        const totalBars = Math.floor(w / (barWidth + gap));
        const step = Math.max(1, Math.floor(windowLength / totalBars));
        const mid = h / 2;
        const amp = h / 2;
        ctx.fillStyle = '#06b6d4'; 
        for (let i = 0; i < totalBars; i++) {
            let rms = 0;
            const chunkStart = startIdx + (i * step);
            if (chunkStart >= data.length) break;
            let count = 0;
            for (let j = 0; j < step; j++) {
                const idx = chunkStart + j;
                if (idx < data.length) { const s = data[idx]; rms += s * s; count++; }
            }
            if (count > 0) rms = Math.sqrt(rms / count);
            const height = Math.max(2, rms * h * 1.5); 
            const x = i * (barWidth + gap);
            const y = mid - (height / 2);
            ctx.globalAlpha = Math.min(1, 0.4 + rms * 2);
            ctx.fillRect(x, y, barWidth, height);
        }
        ctx.globalAlpha = 1.0;
    }

    drawStylePrecision(ctx, data, w, h, startIdx, windowLength) {
        const step = Math.max(1, Math.ceil(windowLength / w));
        const amp = h / 2;
        const mid = h / 2;
        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.lineWidth = 0.5; 
        ctx.beginPath();
        for (let i = 0; i < w; i++) {
            const idx = startIdx + (i * step);
            if (idx >= data.length) break;
            const raw = data[idx];
            const y = mid - (raw * amp * 0.95);
            if (i === 0) ctx.moveTo(i, y); else ctx.lineTo(i, y);
        }
        ctx.stroke();
    }

    drawSpectrum(ctx, w, h, analyser) {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);
        const barWidth = (w / bufferLength) * 2.5; 
        let x = 0;
        for(let i = 0; i < bufferLength; i++) {
            const barHeight = (dataArray[i] / 255) * h;
            const hue = 200 + ((i / bufferLength) * 120); 
            ctx.fillStyle = `hsl(${hue}, 80%, 60%)`;
            ctx.fillRect(x, h - barHeight, barWidth, barHeight);
            x += barWidth + 1;
            if (x > w) break; 
        }
    }

    drawNoDataMessage(ctx, w, h, t) {
        ctx.fillStyle = '#444';
        ctx.font = '10px monospace';
        if (t && t.type === 'simple-drum') {
            ctx.fillStyle = '#f97316'; ctx.fillText("909 ENGINE ACTIVE", 10, 40);
        } else if (t && t.type === 'automation') {
            ctx.fillStyle = '#818cf8'; ctx.fillText("AUTOMATION TRACK", 10, 40);
        } else {
            ctx.fillText("No Buffer Data", 10, 40);
        }
    }

    drawNoSignal(ctx, w, h) {
        ctx.fillStyle = '#333';
        ctx.font = '10px monospace';
        ctx.fillText("No Signal", 10, 40);
    }

    drawOverlays(ctx, t, w, h, time, start, end) {
        let mod = { position:0, spray:0, grainSize:0, overlap:0, density:0, sampleStart:0, sampleEnd:0 };
        t.lfos.forEach(lfo => {
            const v = lfo.getValue(time);
            if(mod[lfo.target] !== undefined) mod[lfo.target] += v;
        });
        const p = t.params;
        let actStart = Math.max(0, Math.min(1, (p.sampleStart || 0) + mod.sampleStart));
        let actEnd = Math.max(0, Math.min(1, (p.sampleEnd !== undefined ? p.sampleEnd : 1) + mod.sampleEnd));
        if (actStart > actEnd) { const temp = actStart; actStart = actEnd; actEnd = temp; }
        const viewStart = start;
        const viewEnd = end;
        const viewRange = Math.max(0.0001, viewEnd - viewStart);
        const mapToView = (absPos) => { return ((absPos - viewStart) / viewRange) * w; };
        const effectivePos = (p.scanSpeed !== 0) ? t.playhead : p.position;
        let relativePos = effectivePos + mod.position;
        relativePos = Math.max(0, Math.min(1, relativePos));
        const absPos = actStart + (relativePos * (actEnd - actStart));
        const finalPos = Math.max(0, Math.min(1, absPos)); 
        const bufDur = t.buffer ? t.buffer.duration : 1;
        const finalGrainSizeSec = Math.max(0.01, p.grainSize + mod.grainSize);
        const finalGrainSizeFrac = finalGrainSizeSec / bufDur;
        const posPx = mapToView(finalPos);
        const grainPx = Math.max(2, (finalGrainSizeFrac / viewRange) * w); 
        const finalSpray = Math.max(0, p.spray + mod.spray);
        
        if (Math.abs(actStart - viewStart) > 0.001 || Math.abs(actEnd - viewEnd) > 0.001) {
            const lfoStartPx = mapToView(actStart);
            const lfoEndPx = mapToView(actEnd);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            if (lfoStartPx > 0) ctx.fillRect(0, 0, lfoStartPx, h);
            if (lfoEndPx < w) ctx.fillRect(lfoEndPx, 0, w - lfoEndPx, h);
            ctx.strokeStyle = 'rgba(100, 200, 255, 0.5)';
            ctx.lineWidth = 1;
            if (lfoStartPx > 0 && lfoStartPx < w) { ctx.beginPath(); ctx.moveTo(lfoStartPx, 0); ctx.lineTo(lfoStartPx, h); ctx.stroke(); }
            if (lfoEndPx > 0 && lfoEndPx < w) { ctx.beginPath(); ctx.moveTo(lfoEndPx, 0); ctx.lineTo(lfoEndPx, h); ctx.stroke(); }
        }

        if (finalSpray > 0) {
            const sprayLeftAbs = Math.max(0, finalPos - finalSpray);
            const sprayRightAbs = Math.min(1, finalPos + finalSpray);
            const sprayLeftPx = mapToView(sprayLeftAbs);
            const sprayRightPx = mapToView(sprayRightAbs);
            ctx.fillStyle = 'rgba(234, 179, 8, 0.15)';
            const sX = Math.max(0, sprayLeftPx);
            const sW = Math.min(w, sprayRightPx) - sX;
            if (sW > 0) ctx.fillRect(sX, 0, sW, h);
        }

        const rawOverlap = (p.overlap || 0) + mod.overlap;
        if (rawOverlap > 0.01) {
            const displayOverlap = Math.max(0.1, rawOverlap);
            const stackCount = Math.ceil(displayOverlap);
            const barHeight = 4;
            const barSpacing = 1;
            const baseAlpha = 0.6;
            for(let i=0; i<stackCount; i++) {
                let alpha = baseAlpha;
                if (i === stackCount - 1) {
                    const frac = displayOverlap - Math.floor(displayOverlap);
                    if (frac > 0.01) alpha = baseAlpha * frac;
                }
                ctx.fillStyle = `rgba(34, 197, 94, ${alpha})`; 
                const y = h - 4 - (i * (barHeight + barSpacing));
                if (y > 0) ctx.fillRect(Math.max(0, posPx - grainPx/2), y, grainPx, barHeight);
            }
        } else {
            const finalDensity = Math.max(1, (p.density || 20) + mod.density);
            const densityHeight = Math.min(h, (finalDensity / 60) * h); 
            const glow = ctx.createLinearGradient(0, h - densityHeight, 0, h);
            glow.addColorStop(0, 'rgba(6, 182, 212, 0.9)'); 
            glow.addColorStop(1, 'rgba(6, 182, 212, 0.1)'); 
            ctx.fillStyle = glow;
            ctx.fillRect(Math.max(0, posPx - grainPx/2), h - densityHeight, grainPx, densityHeight);
            ctx.fillStyle = '#22d3ee'; 
            ctx.fillRect(Math.max(0, posPx - grainPx/2), h - densityHeight, grainPx, 2);
        }

        if (posPx >= 0 && posPx <= w) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(posPx, 0);
            ctx.lineTo(posPx, h);
            ctx.stroke();
        }
    }
}