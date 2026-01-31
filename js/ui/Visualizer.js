// Visualizer Module
export class Visualizer {
    constructor(canvasId, bufferCanvasId, audioEngine) {
        // Main canvas ID ignored now if we move to per-track logic, but kept for compatibility
        this.bufCanvas = document.getElementById(bufferCanvasId);
        if (this.bufCanvas) {
            this.bufCtx = this.bufCanvas.getContext('2d');
        }
        this.audioEngine = audioEngine;
        this.drawQueue = [];
        this.tracks = [];
        this.selectedTrackIndex = 0;
        this.scopeMode = 'wave'; // 'wave' or 'spectrum'
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

    resizeCanvas() {
        // Only resize buffer canvas here. Track canvases are handled via CSS/Creation
        if (this.bufCanvas) {
            this.bufCanvas.width = this.bufCanvas.parentElement.offsetWidth;
            this.bufCanvas.height = 80;
            this.drawBufferDisplay();
        }
    }

    scheduleVisualDraw(time, trackId) {
        this.drawQueue.push({ time, trackId });
    }

    drawVisuals() {
        const audioCtx = this.audioEngine.getContext();
        const now = audioCtx ? audioCtx.currentTime : 0;

        // 1. Clean up old events from queue
        this.drawQueue = this.drawQueue.filter(d => d.time > now - 0.5);

        // 2. Fade out all track canvases
        for (let i = 0; i < this.tracks.length; i++) {
            const canvas = document.getElementById(`vis-canvas-${i}`);
            if (canvas) {
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = 'rgba(0,0,0,0.2)'; // Fade trail
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
        }

        // 3. Draw new hits
        for (let d of this.drawQueue) {
            if (d.time <= now) {
                const age = (now - d.time) / 0.2;
                if (age > 1) continue;

                const canvas = document.getElementById(`vis-canvas-${d.trackId}`);
                if (canvas) {
                    const ctx = canvas.getContext('2d');
                    const w = canvas.width;
                    const h = canvas.height;

                    // Simple flash effect
                    const hue = (d.trackId / this.tracks.length) * 360;
                    ctx.fillStyle = `hsla(${hue}, 70%, 60%, ${1 - age})`;
                    ctx.fillRect(0, 0, w, h);
                }
            }
        }

        // Continuous animate buffer scope to show LFOs or Spectrum
        if (this.bufCanvas) this.drawBufferDisplay();

        requestAnimationFrame(() => this.drawVisuals());
    }

    // js/ui/Visualizer.js
    drawVisuals() {
        const audioCtx = this.audioEngine.getContext();
        const now = audioCtx ? audioCtx.currentTime : 0;

        // 1. Clean up old events from queue
        this.drawQueue = this.drawQueue.filter(d => d.time > now - 0.5);

        // 2. Fade out all track canvases (NOT the buffer display!)
        for (let i = 0; i < this.tracks.length; i++) {
            const canvas = document.getElementById(`vis-canvas-${i}`);
            if (canvas) {
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = 'rgba(0,0,0,0.2)'; // Fade trail
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
        }

        // 3. Draw new hits
        for (let d of this.drawQueue) {
            if (d.time <= now) {
                const age = (now - d.time) / 0.2;
                if (age > 1) continue;

                const canvas = document.getElementById(`vis-canvas-${d.trackId}`);
                if (canvas) {
                    const ctx = canvas.getContext('2d');
                    const w = canvas.width;
                    const h = canvas.height;

                    // Simple flash effect
                    const hue = (d.trackId / this.tracks.length) * 360;
                    ctx.fillStyle = `hsla(${hue}, 70%, 60%, ${1 - age})`;
                    ctx.fillRect(0, 0, w, h);
                }
            }
        }

        // 4. Update buffer scope SEPARATELY (not in the fade loop!)
        // MOVED: Only redraw buffer display when needed, not every frame
        // Remove the continuous call here to prevent fading

        requestAnimationFrame(() => this.drawVisuals());
    }

    drawBufferDisplay() {
        if (!this.bufCanvas) return;

        const w = this.bufCanvas.width;
        const h = this.bufCanvas.height;
        const t = this.tracks[this.selectedTrackIndex];
        const audioCtx = this.audioEngine.getContext();

        // --- SPECTRUM MODE ---
        if (this.scopeMode === 'spectrum') {
            // Clear with solid fill (not fade!)
            this.bufCtx.fillStyle = '#111';
            this.bufCtx.fillRect(0, 0, w, h);

            if (!audioCtx || !t || !t.bus || !t.bus.analyser) {
                this.bufCtx.fillStyle = '#444';
                this.bufCtx.font = '10px monospace';
                this.bufCtx.fillText("No Signal", 10, 40);
                return;
            }

            const analyser = t.bus.analyser;
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            analyser.getByteFrequencyData(dataArray);

            const barWidth = (w / bufferLength) * 2.5;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                const barHeight = (dataArray[i] / 255) * h;

                const hue = 240 - ((i / bufferLength) * 240);
                this.bufCtx.fillStyle = `hsl(${hue}, 80%, 50%)`;
                this.bufCtx.fillRect(x, h - barHeight, barWidth, barHeight);

                x += barWidth + 1;
                if (x > w) break;
            }
            return;
        }

        // --- WAVEFORM MODE (Default) ---
        if (!audioCtx || !t || !t.buffer) {
            // Clear with solid fill
            this.bufCtx.fillStyle = '#111';
            this.bufCtx.fillRect(0, 0, w, h);
            this.bufCtx.fillStyle = '#444';
            this.bufCtx.font = '10px monospace';

            if (t && t.type === 'simple-drum') {
                this.bufCtx.fillStyle = '#f97316';
                this.bufCtx.fillText("909 ENGINE ACTIVE", 10, 40);
            } else if (t && t.type === 'automation') {
                this.bufCtx.fillStyle = '#818cf8';
                this.bufCtx.fillText("AUTOMATION TRACK", 10, 40);
            } else {
                this.bufCtx.fillText("No Buffer Data", 10, 40);
            }
            return;
        }

        const data = t.buffer.getChannelData(0);

        // Clear with SOLID fill (not fade!)
        this.bufCtx.fillStyle = '#111';
        this.bufCtx.fillRect(0, 0, w, h);

        // Draw Waveform
        this.bufCtx.beginPath();
        this.bufCtx.strokeStyle = '#22c55e';
        this.bufCtx.lineWidth = 1;
        const step = Math.ceil(data.length / w);
        const amp = h / 2;

        for (let i = 0; i < w; i++) {
            let min = 1.0;
            let max = -1.0;
            for (let j = 0; j < step; j++) {
                const datum = data[(i * step) + j];
                if (datum < min) min = datum;
                if (datum > max) max = datum;
            }
            this.bufCtx.moveTo(i, (1 + min) * amp);
            this.bufCtx.lineTo(i, (1 + max) * amp);
        }
        this.bufCtx.stroke();

        // Calculate LFO Modulation for Visualization
        let mod = { position: 0, spray: 0, density: 0, grainSize: 0, pitch: 0, filter: 0, hpFilter: 0 };
        const time = audioCtx.currentTime;

        t.lfos.forEach(lfo => {
            const v = lfo.getValue(time);
            if (lfo.target === 'filter') mod.filter += v * 5000;
            else if (lfo.target === 'hpFilter') mod.hpFilter += v * 2000;
            else if (mod[lfo.target] !== undefined) mod[lfo.target] += v;
        });

        const p = t.params;
        const finalPos = Math.max(0, Math.min(1, p.position + mod.position));
        const finalSpray = Math.max(0, p.spray + mod.spray);
        const finalGrainSize = Math.max(0.01, p.grainSize + mod.grainSize);

        // Draw Position (Cyan)
        const posPx = finalPos * w;
        this.bufCtx.strokeStyle = '#06b6d4';
        this.bufCtx.lineWidth = 2;
        this.bufCtx.beginPath();
        this.bufCtx.moveTo(posPx, 0);
        this.bufCtx.lineTo(posPx, h);
        this.bufCtx.stroke();

        // Draw Spray Range (Yellow Transparent)
        const sprayLeft = Math.max(0, finalPos - finalSpray) * w;
        const sprayRight = Math.min(1, finalPos + finalSpray) * w;
        this.bufCtx.fillStyle = 'rgba(234, 179, 8, 0.15)';
        this.bufCtx.fillRect(sprayLeft, 0, sprayRight - sprayLeft, h);

        // Draw Grain Size (Green box)
        const bufDur = t.buffer.duration;
        const grainPx = (finalGrainSize / bufDur) * w;
        this.bufCtx.fillStyle = 'rgba(34, 197, 94, 0.2)';
        this.bufCtx.fillRect(Math.max(0, posPx - grainPx / 2), h - 10, grainPx, 10);

        // Redraw position line on top
        this.bufCtx.strokeStyle = '#06b6d4';
        this.bufCtx.lineWidth = 1;
        this.bufCtx.beginPath();
        this.bufCtx.moveTo(posPx, 0);
        this.bufCtx.lineTo(posPx, h);
        this.bufCtx.stroke();
    }
}