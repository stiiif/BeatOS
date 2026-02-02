// Visualizer Module
import { globalBus } from '../events/EventBus.js';

export class Visualizer {
    constructor(canvasId, bufferCanvasId, audioEngine) {
        // Main canvas ID ignored now if we move to per-track logic, but kept for compatibility
        this.bufCanvas = document.getElementById(bufferCanvasId);
        if(this.bufCanvas) {
            this.bufCtx = this.bufCanvas.getContext('2d');
        }
        this.audioEngine = audioEngine;
        this.drawQueue = [];
        this.tracks = [];
        this.selectedTrackIndex = 0;
        this.scopeMode = 'wave'; // 'wave' or 'spectrum'
        
        // Visual Styles: 'mirror', 'neon', 'bars', 'precision'
        this.waveStyle = 'mirror';

        // NEW: State Flags for Optimization
        this.isRunning = false;
        this.needsRedraw = false;

        // NEW: Event Subscriptions
        globalBus.on('playback:start', () => this.startLoop());
        globalBus.on('playback:stop', () => this.stopLoop());
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
        return this.waveStyle; // Return for UI feedback
    }

    resizeCanvas() {
        // Only resize buffer canvas here. Track canvases are handled via CSS/Creation
        if (this.bufCanvas) {
            this.bufCanvas.width = this.bufCanvas.parentElement.offsetWidth;
            this.bufCanvas.height = 80;
            this.drawBufferDisplay();
        }
    }

    scheduleVisualDraw(time, trackId) {
        this.drawQueue.push({time, trackId});
    }

    // NEW: Loop Control Methods
    startLoop() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.drawVisuals();
        }
    }

    stopLoop() {
        this.isRunning = false;
        // Optional: Draw one final frame to ensure clean state or clear
        // requestAnimationFrame(() => this.drawVisuals(true)); 
    }

    triggerRedraw() {
        this.needsRedraw = true;
        if (!this.isRunning) {
            // Trigger a single frame if not currently looping
            requestAnimationFrame(() => this.drawVisuals(true));
        }
    }

    drawVisuals(forceOnce = false) {
        // Stop if not running, not forced, and no redraw requested
        if (!this.isRunning && !this.needsRedraw && !forceOnce) return;

        const audioCtx = this.audioEngine.getContext();
        const now = audioCtx ? audioCtx.currentTime : 0;
        
        // 1. Clean up old events from queue
        this.drawQueue = this.drawQueue.filter(d => d.time > now - 0.5);

        // 2. Fade out all track canvases
        for(let i=0; i<this.tracks.length; i++) {
            const canvas = document.getElementById(`vis-canvas-${i}`);
            if(canvas) {
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = 'rgba(0,0,0,0.2)'; // Fade trail
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
        }

        // 3. Draw new hits
        for(let d of this.drawQueue) {
            if (d.time <= now) {
                const age = (now - d.time) / 0.2; 
                if(age > 1) continue;
                
                const canvas = document.getElementById(`vis-canvas-${d.trackId}`);
                if(canvas) {
                    const ctx = canvas.getContext('2d');
                    const w = canvas.width;
                    const h = canvas.height;
                    
                    // Simple flash effect
                    const hue = (d.trackId / this.tracks.length) * 360;
                    ctx.fillStyle = `hsla(${hue}, 70%, 60%, ${1-age})`;
                    ctx.fillRect(0, 0, w, h);
                }
            }
        }
        
        // Continuous animate buffer scope to show LFOs or Spectrum
        if(this.bufCanvas) this.drawBufferDisplay();
        
        // Reset single-shot flag
        this.needsRedraw = false;

        // Continue loop ONLY if running
        if (this.isRunning) {
            requestAnimationFrame(() => this.drawVisuals());
        }
    }

    drawBufferDisplay() {
        if(!this.bufCanvas) return;
        
        const w = this.bufCanvas.width;
        const h = this.bufCanvas.height;
        const ctx = this.bufCtx;
        const t = this.tracks[this.selectedTrackIndex];
        const audioCtx = this.audioEngine.getContext();

        // Clear Background
        ctx.fillStyle = '#0f0f0f'; // Very dark grey instead of pure black for softer look
        ctx.fillRect(0, 0, w, h);

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
        
        // Get Sample Window (Zoom)
        let sampleStart = t.params.sampleStart || 0;
        let sampleEnd = t.params.sampleEnd !== undefined ? t.params.sampleEnd : 1;
        
        // Ensure start < end
        if (sampleStart > sampleEnd) {
            const temp = sampleStart; sampleStart = sampleEnd; sampleEnd = temp;
        }
        
        // Calculate sample indices
        const startIdx = Math.floor(sampleStart * data.length);
        const endIdx = Math.floor(sampleEnd * data.length);
        const windowLength = Math.max(1, endIdx - startIdx); // Prevent division by zero
        
        switch(this.waveStyle) {
            case 'mirror': this.drawStyleMirror(ctx, data, w, h, startIdx, windowLength); break;
            case 'neon':   this.drawStyleNeon(ctx, data, w, h, startIdx, windowLength); break;
            case 'bars':   this.drawStyleBars(ctx, data, w, h, startIdx, windowLength); break;
            case 'precision': this.drawStylePrecision(ctx, data, w, h, startIdx, windowLength); break;
            default:       this.drawStyleMirror(ctx, data, w, h, startIdx, windowLength);
        }

        // Draw Overlays (Grain Position, Spray, etc.)
        this.drawOverlays(ctx, t, w, h, audioCtx.currentTime, sampleStart, sampleEnd);
    }

    // --- DRAWING STYLES (Updated for Zoom) ---

    // Style 1: Mirror Gradient (SoundCloud style)
    drawStyleMirror(ctx, data, w, h, startIdx, windowLength) {
        const step = Math.max(1, Math.ceil(windowLength / w));
        const amp = h / 2;
        const mid = h / 2;

        // Create Gradient
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#10b981');   // Emerald top
        grad.addColorStop(0.5, '#34d399'); // Lighter middle
        grad.addColorStop(1, '#10b981');   // Emerald bottom

        ctx.fillStyle = grad;
        ctx.beginPath();

        for (let i = 0; i < w; i++) {
            let min = 1.0;
            let max = -1.0;
            
            const chunkStart = startIdx + (i * step);
            // Safety check for bounds
            if (chunkStart >= data.length) break;

            for (let j = 0; j < step; j++) {
                const idx = chunkStart + j;
                if (idx < data.length) {
                    const datum = data[idx];
                    if (datum < min) min = datum;
                    if (datum > max) max = datum;
                }
            }
            // Clamp to avoid drawing nothing on silence
            if (max < min) { max = 0.01; min = -0.01; }
            
            // Draw vertical slice
            const y1 = mid + (min * amp * 0.9); // 0.9 to leave some padding
            const y2 = mid + (max * amp * 0.9);
            ctx.rect(i, y1, 1, Math.max(1, y2 - y1));
        }
        ctx.fill();
    }

    // Style 2: Neon Pulse (Oscilloscope)
    drawStyleNeon(ctx, data, w, h, startIdx, windowLength) {
        const step = Math.max(1, Math.ceil(windowLength / w));
        const amp = h / 2;
        const mid = h / 2;

        ctx.shadowBlur = 8;
        ctx.shadowColor = '#22c55e';
        ctx.strokeStyle = '#4ade80'; // Bright green
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
                if (idx < data.length) {
                    val += data[idx];
                    count++;
                }
            }
            if (count > 0) val /= count;
            
            const y = mid - (val * amp * 0.9);
            if (i === 0) ctx.moveTo(i, y);
            else ctx.lineTo(i, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    // Style 3: Digital Bars
    drawStyleBars(ctx, data, w, h, startIdx, windowLength) {
        const barWidth = 2;
        const gap = 1;
        const totalBars = Math.floor(w / (barWidth + gap));
        const step = Math.max(1, Math.floor(windowLength / totalBars));
        const mid = h / 2;
        const amp = h / 2;

        ctx.fillStyle = '#06b6d4'; // Cyan

        for (let i = 0; i < totalBars; i++) {
            let rms = 0;
            const chunkStart = startIdx + (i * step);
            if (chunkStart >= data.length) break;

            let count = 0;
            for (let j = 0; j < step; j++) {
                const idx = chunkStart + j;
                if (idx < data.length) {
                    const s = data[idx];
                    rms += s * s;
                    count++;
                }
            }
            if (count > 0) rms = Math.sqrt(rms / count);
            
            const height = Math.max(2, rms * h * 1.5); // Boost gain slightly
            const x = i * (barWidth + gap);
            const y = mid - (height / 2);
            
            // Opacity based on height for depth
            ctx.globalAlpha = Math.min(1, 0.4 + rms * 2);
            ctx.fillRect(x, y, barWidth, height);
        }
        ctx.globalAlpha = 1.0;
    }

    // Style 4: Precision Line
    drawStylePrecision(ctx, data, w, h, startIdx, windowLength) {
        const step = Math.max(1, Math.ceil(windowLength / w));
        const amp = h / 2;
        const mid = h / 2;

        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.lineWidth = 0.5; // Sub-pixel rendering feel
        ctx.beginPath();

        for (let i = 0; i < w; i++) {
            const idx = startIdx + (i * step);
            if (idx >= data.length) break;

            const raw = data[idx];
            
            const y = mid - (raw * amp * 0.95);
            if (i === 0) ctx.moveTo(i, y);
            else ctx.lineTo(i, y);
        }
        ctx.stroke();
    }

    // --- HELPERS ---

    drawSpectrum(ctx, w, h, analyser) {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);

        const barWidth = (w / bufferLength) * 2.5; 
        let x = 0;

        for(let i = 0; i < bufferLength; i++) {
            const barHeight = (dataArray[i] / 255) * h;
            const hue = 200 + ((i / bufferLength) * 120); // Blue to Purple range
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
            ctx.fillStyle = '#f97316'; // orange
            ctx.fillText("909 ENGINE ACTIVE", 10, 40);
        } else if (t && t.type === 'automation') {
            ctx.fillStyle = '#818cf8'; // indigo
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

    drawOverlays(ctx, t, w, h, time, start, end) {
        // Calculate LFO Modulation for Visualization
        let mod = { position:0, spray:0, grainSize:0, overlap:0, density:0, sampleStart:0, sampleEnd:0 };
        
        t.lfos.forEach(lfo => {
            const v = lfo.getValue(time);
            if(mod[lfo.target] !== undefined) mod[lfo.target] += v;
        });

        const p = t.params;
        
        // --- Calculate ACTIVE Window (Parameter + LFO) ---
        let actStart = Math.max(0, Math.min(1, (p.sampleStart || 0) + mod.sampleStart));
        let actEnd = Math.max(0, Math.min(1, (p.sampleEnd !== undefined ? p.sampleEnd : 1) + mod.sampleEnd));
        if (actStart > actEnd) { const temp = actStart; actStart = actEnd; actEnd = temp; }
        
        // --- Calculate View Window (Zoom) ---
        const viewStart = start;
        const viewEnd = end;
        const viewRange = Math.max(0.0001, viewEnd - viewStart);

        const mapToView = (absPos) => {
            return ((absPos - viewStart) / viewRange) * w;
        };

        // --- Calculate Playhead Position ---
        const effectivePos = (p.scanSpeed !== 0) ? t.playhead : p.position;
        
        let relativePos = effectivePos + mod.position;
        relativePos = Math.max(0, Math.min(1, relativePos));
        
        const absPos = actStart + (relativePos * (actEnd - actStart));
        const finalPos = Math.max(0, Math.min(1, absPos)); 
        
        const bufDur = t.buffer ? t.buffer.duration : 1;
        const finalGrainSizeSec = Math.max(0.01, p.grainSize + mod.grainSize);
        const finalGrainSizeFrac = finalGrainSizeSec / bufDur;
        
        // Map to Pixel Coords
        const posPx = mapToView(finalPos);
        const grainPx = Math.max(2, (finalGrainSizeFrac / viewRange) * w); 
        
        const finalSpray = Math.max(0, p.spray + mod.spray);
        
        // 1. Draw Active Window LFO Movement
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

        // 2. Draw Spray Range
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

        // 3. Draw Density/Overlap Indicator
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
                
                ctx.fillStyle = `rgba(34, 197, 94, ${alpha})`; // Green
                const y = h - 4 - (i * (barHeight + barSpacing));
                if (y > 0) {
                    ctx.fillRect(Math.max(0, posPx - grainPx/2), y, grainPx, barHeight);
                }
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

        // 4. Draw Position Head (White Line)
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