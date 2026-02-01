// Visualizer Module
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

    drawVisuals() {
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
        
        requestAnimationFrame(() => this.drawVisuals());
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
        
        switch(this.waveStyle) {
            case 'mirror': this.drawStyleMirror(ctx, data, w, h); break;
            case 'neon':   this.drawStyleNeon(ctx, data, w, h); break;
            case 'bars':   this.drawStyleBars(ctx, data, w, h); break;
            case 'precision': this.drawStylePrecision(ctx, data, w, h); break;
            default:       this.drawStyleMirror(ctx, data, w, h);
        }

        // Draw Overlays (Grain Position, Spray, etc.)
        this.drawOverlays(ctx, t, w, h, audioCtx.currentTime);
    }

    // --- DRAWING STYLES ---

    // Style 1: Mirror Gradient (SoundCloud style)
    // Beautiful, filled, symmetrical, with a gradient fade.
    drawStyleMirror(ctx, data, w, h) {
        const step = Math.ceil(data.length / w);
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
            for (let j = 0; j < step; j++) {
                const datum = data[(i * step) + j];
                if (datum < min) min = datum;
                if (datum > max) max = datum;
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
    // Glowing, continuous line. Very sci-fi.
    drawStyleNeon(ctx, data, w, h) {
        const step = Math.ceil(data.length / w);
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
            // Average sampling for smoother line
            for (let j = 0; j < step; j++) {
                val += data[(i * step) + j];
            }
            val /= step;
            
            const y = mid - (val * amp * 0.9);
            if (i === 0) ctx.moveTo(i, y);
            else ctx.lineTo(i, y);
        }
        ctx.stroke();
        
        // Reset Shadow for other draws
        ctx.shadowBlur = 0;
    }

    // Style 3: Digital Bars
    // Discrete columns, tech look.
    drawStyleBars(ctx, data, w, h) {
        const barWidth = 2;
        const gap = 1;
        const totalBars = Math.floor(w / (barWidth + gap));
        const step = Math.floor(data.length / totalBars);
        const mid = h / 2;
        const amp = h / 2;

        ctx.fillStyle = '#06b6d4'; // Cyan

        for (let i = 0; i < totalBars; i++) {
            let rms = 0;
            for (let j = 0; j < step; j++) {
                const s = data[(i * step) + j];
                rms += s * s;
            }
            rms = Math.sqrt(rms / step);
            
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
    // Ultra-thin, white, anti-aliased. No glow.
    drawStylePrecision(ctx, data, w, h) {
        const step = Math.ceil(data.length / w);
        const amp = h / 2;
        const mid = h / 2;

        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.lineWidth = 0.5; // Sub-pixel rendering feel
        ctx.beginPath();

        for (let i = 0; i < w; i++) {
            // Peak sampling for detail
            let max = 0;
            for (let j = 0; j < step; j++) {
                const d = Math.abs(data[(i * step) + j]);
                if (d > max) max = d;
            }
            // Restore polarity roughly or just draw envelope? 
            // Let's draw the raw sample at the step index for true precision
            const raw = data[i * step];
            
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

    drawOverlays(ctx, t, w, h, time) {
        // Calculate LFO Modulation for Visualization
        let mod = { position:0, spray:0, grainSize:0, overlap:0, density:0 };
        
        t.lfos.forEach(lfo => {
            const v = lfo.getValue(time);
            if(mod[lfo.target] !== undefined) mod[lfo.target] += v;
        });

        const p = t.params;
        // Use playhead if scanning, otherwise param position
        const effectivePos = (p.scanSpeed !== 0) ? t.playhead : p.position;
        
        const finalPos = Math.max(0, Math.min(1, effectivePos + mod.position));
        const finalSpray = Math.max(0, p.spray + mod.spray);
        const finalGrainSize = Math.max(0.01, p.grainSize + mod.grainSize);
        const bufDur = t.buffer ? t.buffer.duration : 1;
        const grainPx = Math.max(2, (finalGrainSize / bufDur) * w); // Ensure visible width
        const posPx = finalPos * w;

        // 1. Draw Spray Range (Yellow Transparent)
        if (finalSpray > 0) {
            const sprayLeft = Math.max(0, finalPos - finalSpray) * w;
            const sprayRight = Math.min(1, finalPos + finalSpray) * w;
            ctx.fillStyle = 'rgba(234, 179, 8, 0.15)';
            ctx.fillRect(sprayLeft, 0, sprayRight - sprayLeft, h);
        }

        // 2. Draw Density/Overlap Indicator
        const rawOverlap = (p.overlap || 0) + mod.overlap;
        
        if (rawOverlap > 0.01) {
            // --- OVERLAP MODE (Explicit) ---
            // Visual: Stacked Green Blocks (Discrete Layers)
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
            // --- DENSITY MODE (Frequency) ---
            // Visual: Solid Cyan Bar (Continuous Intensity)
            // Height represents density value directly
            const finalDensity = Math.max(1, (p.density || 20) + mod.density);
            
            // Map density (approx 1-100) to height
            // 60hz density will fill the screen height roughly
            const densityHeight = Math.min(h, (finalDensity / 60) * h); 
            
            // Draw a solid, glowing bar
            const glow = ctx.createLinearGradient(0, h - densityHeight, 0, h);
            glow.addColorStop(0, 'rgba(6, 182, 212, 0.9)'); // Cyan Top
            glow.addColorStop(1, 'rgba(6, 182, 212, 0.1)'); // Cyan Bottom

            ctx.fillStyle = glow;
            ctx.fillRect(Math.max(0, posPx - grainPx/2), h - densityHeight, grainPx, densityHeight);
            
            // Add a "top cap" line for precision
            ctx.fillStyle = '#22d3ee'; // Bright Cyan
            ctx.fillRect(Math.max(0, posPx - grainPx/2), h - densityHeight, grainPx, 2);
        }

        // 3. Draw Position Head (White Line)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(posPx, 0);
        ctx.lineTo(posPx, h);
        ctx.stroke();
    }
}