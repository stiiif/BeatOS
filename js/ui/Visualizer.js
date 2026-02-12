// Visualizer Module
import { globalBus } from '../events/EventBus.js';
import { GranularLogic } from '../utils/GranularLogic.js'; // NEW IMPORT

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
        this.scopeMode = 'wave'; // 'wave' or 'spectrum'
        
        // Visual Styles: 'mirror', 'neon', 'bars', 'precision'
        this.waveStyle = 'mirror';

        // State Flags for Optimization
        this.isRunning = false;
        this.needsRedraw = false;
        this.lastDrawTime = 0;
        this.isVisible = true;

        // Event Subscriptions
        globalBus.on('playback:start', () => this.startLoop());
        globalBus.on('playback:stop', () => this.stopLoop());
        
        // Cache track canvases to avoid getElementById in the loop
        this.canvasCache = new Map();
        
        // Track triggers and bar starts
        this.lastTriggerTimes = new Map();
        this.lastBarStartTimes = new Map(); 
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

    scheduleVisualDraw(time, trackId, stepIndex = -1) {
        this.drawQueue.push({time, trackId});
        // Store trigger time for reset logic
        this.lastTriggerTimes.set(trackId, time);
        
        // If stepIndex is 0 (first step of bar), track bar start
        if (stepIndex === 0) {
            this.lastBarStartTimes.set(trackId, time);
        }
    }

    startLoop() {
        this.isRunning = true;
    }

    stopLoop() {
        this.isRunning = false;
    }

    triggerRedraw() {
        this.needsRedraw = true;
    }

    getTrackCanvas(trackId) {
        if (!this.canvasCache.has(trackId)) {
            const el = document.getElementById(`vis-canvas-${trackId}`);
            if (el) this.canvasCache.set(trackId, el);
        }
        return this.canvasCache.get(trackId);
    }

    /** Called by RenderLoop — replaces internal rAF */
    update(timestamp) {
        if (!this.isRunning && !this.needsRedraw) return;

        // Check if the buffer display canvas is actually visible (parent not collapsed)
        if (this.bufCanvas && this.bufCanvas.offsetParent === null && !this.needsRedraw) {
            // Buffer display is hidden (collapsed section) — only draw mini track canvases
            this._drawMiniCanvasesOnly(timestamp);
            return;
        }

        this.drawVisuals(timestamp);
    }

    _drawMiniCanvasesOnly(timestamp) {
        if (!this.isRunning) return;

        const audioCtx = this.audioEngine.getContext();
        const now = audioCtx ? audioCtx.currentTime : 0;

        // Clean drawQueue
        let activeCount = 0;
        for (let i = 0; i < this.drawQueue.length; i++) {
            if (this.drawQueue[i].time > now - 0.5) {
                if (i !== activeCount) this.drawQueue[activeCount] = this.drawQueue[i];
                activeCount++;
            }
        }
        this.drawQueue.length = activeCount;

        // Only draw mini canvases that are visible
        for (let i = 0; i < this.tracks.length; i++) {
            const canvas = this.getTrackCanvas(i);
            if (!canvas || canvas.offsetParent === null) continue;
            const ctx = canvas.getContext('2d', { alpha: true });
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        for (let d of this.drawQueue) {
            if (d.time <= now) {
                const age = (now - d.time) / 0.2;
                if (age > 1) continue;
                const canvas = this.getTrackCanvas(d.trackId);
                if (!canvas || canvas.offsetParent === null) continue;
                const ctx = canvas.getContext('2d');
                const w = canvas.width;
                const h = canvas.height;
                const hue = (d.trackId / this.tracks.length) * 360;
                ctx.fillStyle = `hsla(${hue}, 70%, 60%, ${1 - age})`;
                ctx.fillRect(0, 0, w, h);
            }
        }
        this.needsRedraw = false;
    }

    drawVisuals(timestamp, forceOnce = false) {
        if (!this.isRunning && !this.needsRedraw && !forceOnce) return;

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
            if (!canvas || canvas.offsetParent === null) continue; // Skip hidden canvases
            const ctx = canvas.getContext('2d', { alpha: true });
            ctx.fillStyle = 'rgba(0,0,0,0.2)'; 
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        for(let d of this.drawQueue) {
            if (d.time <= now) {
                const age = (now - d.time) / 0.2; 
                if(age > 1) continue;
                
                const canvas = this.getTrackCanvas(d.trackId);
                if (!canvas || canvas.offsetParent === null) continue;
                const ctx = canvas.getContext('2d');
                const w = canvas.width;
                const h = canvas.height;
                
                const hue = (d.trackId / this.tracks.length) * 360;
                ctx.fillStyle = `hsla(${hue}, 70%, 60%, ${1-age})`;
                ctx.fillRect(0, 0, w, h);
            }
        }
        
        // Only draw buffer display if its canvas is visible
        if(this.bufCanvas && this.bufCanvas.offsetParent !== null) this.drawBufferDisplay();
        this.needsRedraw = false;
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
        
        // --- ZOOM LOGIC ---
        // Determine the "active window" based on parameters only (unmodulated)
        // This makes the zoom stable, so it doesn't jitter with LFOs.
        // Or should it follow modulation? 
        // "changing start and end parameters... display it as a zoom in zoom out"
        // implies the base parameter change drives the zoom.
        // LFOs should animate the playhead within this zoomed view, OR move the view if we want "following" camera.
        // Standard UX: View is defined by knobs (Start/End).
        
        let viewStart = t.params.sampleStart || 0;
        let viewEnd = t.params.sampleEnd !== undefined ? t.params.sampleEnd : 1;
        
        if (viewStart > viewEnd) {
            const temp = viewStart; viewStart = viewEnd; viewEnd = temp;
        }
        
        // Safety clamp
        viewStart = Math.max(0, Math.min(1, viewStart));
        viewEnd = Math.max(0, Math.min(1, viewEnd));
        
        // Ensure minimum view width to avoid division by zero or extreme zoom
        if (viewEnd - viewStart < 0.001) viewEnd = viewStart + 0.001;

        // Calculate data indices for this window
        const startIdx = Math.floor(viewStart * data.length);
        const endIdx = Math.floor(viewEnd * data.length);
        const windowLength = endIdx - startIdx;
        
        // Only draw the data within the window, mapped to full canvas width
        
        switch(this.waveStyle) {
            case 'mirror': this.drawStyleMirror(ctx, data, w, h, startIdx, windowLength); break;
            case 'neon':   this.drawStyleNeon(ctx, data, w, h, startIdx, windowLength); break;
            case 'bars':   this.drawStyleBars(ctx, data, w, h, startIdx, windowLength); break;
            case 'precision': this.drawStylePrecision(ctx, data, w, h, startIdx, windowLength); break;
            default:       this.drawStyleMirror(ctx, data, w, h, startIdx, windowLength);
        }

        this.drawOverlays(ctx, t, w, h, audioCtx.currentTime, viewStart, viewEnd);
    }

    drawStyleMirror(ctx, data, w, h, startIdx, windowLength) {
        // Step size relative to the visible window length, not full buffer
        const step = Math.max(1, windowLength / w); 
        const amp = h / 2;
        const mid = h / 2;

        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#10b981');
        grad.addColorStop(0.5, '#34d399');
        grad.addColorStop(1, '#10b981');

        ctx.fillStyle = grad;
        ctx.beginPath();

        for (let i = 0; i < w; i++) {
            let min = 1.0;
            let max = -1.0;
            // Map pixel i to data index
            const chunkStart = Math.floor(startIdx + (i * step));
            if (chunkStart >= data.length) break;
            
            // Sub-sampling for performance if step is large
            const innerStep = Math.max(1, Math.floor(step / 10)); 
            const chunkEnd = Math.min(data.length, Math.floor(chunkStart + step));
            
            for (let j = chunkStart; j < chunkEnd; j += innerStep) {
                const datum = data[j];
                if (datum < min) min = datum;
                if (datum > max) max = datum;
            }
            if (max < min) { max = 0.01; min = -0.01; } // Flatline case
            
            const y1 = mid + (min * amp * 0.9);
            const y2 = mid + (max * amp * 0.9);
            ctx.rect(i, y1, 1, Math.max(1, y2 - y1));
        }
        ctx.fill();
    }

    drawStyleNeon(ctx, data, w, h, startIdx, windowLength) {
        const step = Math.max(1, windowLength / w);
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
            const chunkStart = Math.floor(startIdx + (i * step));
            if (chunkStart >= data.length) break;
            
            let count = 0;
            const innerStep = Math.max(1, Math.floor(step / 10));
            const chunkEnd = Math.min(data.length, Math.floor(chunkStart + step));

            for (let j = chunkStart; j < chunkEnd; j += innerStep) {
                val += data[j];
                count++;
            }
            if (count > 0) val /= count;
            const y = mid - (val * amp * 0.9);
            if (i === 0) ctx.moveTo(i, y);
            else ctx.lineTo(i, y);
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
            const chunkStart = Math.floor(startIdx + (i * step));
            if (chunkStart >= data.length) break;
            
            let count = 0;
            const innerStep = Math.max(1, Math.floor(step / 10));
            const chunkEnd = Math.min(data.length, Math.floor(chunkStart + step));

            for (let j = chunkStart; j < chunkEnd; j += innerStep) {
                const s = data[j];
                rms += s * s;
                count++;
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
        const step = Math.max(1, windowLength / w);
        const amp = h / 2;
        const mid = h / 2;
        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        for (let i = 0; i < w; i++) {
            const idx = Math.floor(startIdx + (i * step));
            if (idx >= data.length) break;
            const raw = data[idx];
            const y = mid - (raw * amp * 0.95);
            if (i === 0) ctx.moveTo(i, y);
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
        for(let i = 0; i < bufferLength; i++) {
            const val = dataArray[i];
            if (val < 5) continue; 
            const barHeight = (val / 255) * h;
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
            ctx.fillStyle = '#f97316'; 
            ctx.fillText("909 ENGINE ACTIVE", 10, 40);
        } else if (t && t.type === 'automation') {
            ctx.fillStyle = '#818cf8'; 
            ctx.fillText("AUTOMATION TRACK", 10, 40);
        } else {
            ctx.fillText("No Buffer Data", 10, 40);
        }
    }

    drawNoSignal(ctx, w, h) {
        ctx.fillStyle = '#333';
        ctx.font = '10px monospace';
        ctx.fillText("No Signal", 10, 40);
    }

    drawOverlays(ctx, t, w, h, time, viewStart, viewEnd) {
        let mod = { position:0, spray:0, grainSize:0, overlap:0, density:0, sampleStart:0, sampleEnd:0, scanSpeed:0 };
        
        t.lfos.forEach(lfo => {
            if (lfo.amount > 0) {
                const v = lfo.getValue(time);
                if (lfo.targets && lfo.targets.length > 0) {
                    lfo.targets.forEach(target => {
                        if(mod[target] !== undefined) mod[target] += v;
                    });
                } else if (lfo.target && lfo.target !== 'none') {
                    if(mod[lfo.target] !== undefined) mod[lfo.target] += v;
                }
            }
        });

        const p = t.params;
        
        // --- HANDLE VISUALIZER RESET LOGIC ---
        let scanTime = time;
        if (t.resetOnTrig) {
            const lastTrigger = this.lastTriggerTimes.get(t.id) || 0;
            scanTime = Math.max(0, time - lastTrigger);
        } else if (t.resetOnBar) {
            const lastBarStart = this.lastBarStartTimes.get(t.id) || 0;
            scanTime = Math.max(0, time - lastBarStart);
        }

        // --- USE SHARED LOGIC ---
        const { absPos, actStart, actEnd } = GranularLogic.calculateEffectivePosition(p, mod, time, scanTime);
        
        // --- MAP TO ZOOMED VIEW ---
        const viewRange = viewEnd - viewStart;
        if (viewRange < 0.000001) return; // Divide by zero safety

        const mapToView = (absolutePos) => {
            // Calculate relative position within the view (0..1)
            const relative = (absolutePos - viewStart) / viewRange;
            // Map to pixels
            return relative * w;
        };

        const posPx = mapToView(absPos);
        
        // Grain size also needs to scale with zoom
        const bufDur = t.buffer ? t.buffer.duration : 1;
        const finalGrainSizeSec = Math.max(0.01, p.grainSize + mod.grainSize);
        const finalGrainSizeFrac = finalGrainSizeSec / bufDur;
        // Scale grain width by zoom factor (1 / viewRange)
        const grainPx = Math.max(2, (finalGrainSizeFrac / viewRange) * w); 
        
        const finalSpray = Math.max(0, p.spray + mod.spray);
        
        // Draw Window Overlays (Dimmed areas outside Start/End *within* the view)
        // Since the view IS the Start/End (mostly), this primarily shows LFO modulation of start/end boundaries
        // relative to the static knob settings.
        
        // Map effective (modulated) boundaries to the view (static knob settings)
        const lfoStartPx = mapToView(actStart);
        const lfoEndPx = mapToView(actEnd);
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'; // Darken areas
        
        // Left side dimming
        if (lfoStartPx > 0) ctx.fillRect(0, 0, lfoStartPx, h);
        // Right side dimming
        if (lfoEndPx < w) ctx.fillRect(lfoEndPx, 0, w - lfoEndPx, h);
        
        // Boundary lines
        ctx.strokeStyle = 'rgba(100, 200, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        if (lfoStartPx > -w && lfoStartPx < 2*w) { ctx.moveTo(lfoStartPx, 0); ctx.lineTo(lfoStartPx, h); }
        if (lfoEndPx > -w && lfoEndPx < 2*w) { ctx.moveTo(lfoEndPx, 0); ctx.lineTo(lfoEndPx, h); }
        ctx.stroke();

        // Spray visualization
        if (finalSpray > 0) {
            const sprayLeftAbs = Math.max(0, absPos - finalSpray);
            const sprayRightAbs = Math.min(1, absPos + finalSpray);
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
            const baseAlpha = 0.6;
            for(let i=0; i<stackCount; i++) {
                let alpha = baseAlpha;
                if (i === stackCount - 1) {
                    const frac = displayOverlap - Math.floor(displayOverlap);
                    if (frac > 0.01) alpha = baseAlpha * frac;
                }
                ctx.fillStyle = `rgba(34, 197, 94, ${alpha})`;
                const y = h - 4 - (i * 5); 
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

        // Draw Playhead
        // Check if playhead is within view
        if (posPx >= -5 && posPx <= w + 5) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(posPx, 0);
            ctx.lineTo(posPx, h);
            ctx.stroke();
        }
    }
}