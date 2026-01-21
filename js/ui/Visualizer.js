// Visualizer Module
export class Visualizer {
    constructor(canvasId, bufferCanvasId, audioEngine) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.bufCanvas = document.getElementById(bufferCanvasId);
        this.bufCtx = this.bufCanvas.getContext('2d');
        this.audioEngine = audioEngine;
        this.drawQueue = [];
        this.tracks = [];
        this.selectedTrackIndex = 0;
    }

    setTracks(tracks) {
        this.tracks = tracks;
    }

    setSelectedTrackIndex(index) {
        this.selectedTrackIndex = index;
    }

    resizeCanvas() {
        this.canvas.width = this.canvas.parentElement.offsetWidth;
        this.canvas.height = 50;
        this.bufCanvas.width = this.bufCanvas.parentElement.offsetWidth;
        this.bufCanvas.height = 80;
        // Immediate static draw before animation loop
        this.drawBufferDisplay();
    }

    scheduleVisualDraw(time, trackId) {
        this.drawQueue.push({time, trackId});
    }

    drawVisuals() {
        this.ctx.fillStyle = 'rgba(10,10,10,0.2)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        const audioCtx = this.audioEngine.getContext();
        const now = audioCtx ? audioCtx.currentTime : 0;
        this.drawQueue = this.drawQueue.filter(d => d.time > now - 0.2);
        for(let d of this.drawQueue) {
            if (d.time <= now) {
                const age = (now - d.time) / 0.2; 
                if(age > 1) continue;
                const x = (d.trackId / this.tracks.length) * this.canvas.width;
                const w = (this.canvas.width / this.tracks.length) - 1;
                const h = (1-age) * 40;
                const y = (this.canvas.height - h) / 2;
                const hue = (d.trackId / this.tracks.length) * 360;
                this.ctx.fillStyle = `hsla(${hue}, 70%, 60%, ${1-age})`;
                this.ctx.fillRect(x, y, w, h);
            }
        }
        
        // Continuous animate buffer scope to show LFOs
        this.drawBufferDisplay();
        
        requestAnimationFrame(() => this.drawVisuals());
    }

    drawBufferDisplay() {
        const audioCtx = this.audioEngine.getContext();
        if (!audioCtx || !this.tracks[this.selectedTrackIndex] || !this.tracks[this.selectedTrackIndex].buffer) {
            this.bufCtx.fillStyle = '#111';
            this.bufCtx.fillRect(0,0,this.bufCanvas.width, this.bufCanvas.height);
            this.bufCtx.fillStyle = '#444';
            this.bufCtx.font = '10px monospace';
            this.bufCtx.fillText("No Buffer Data", 10, 40);
            return;
        }

        const w = this.bufCanvas.width;
        const h = this.bufCanvas.height;
        const t = this.tracks[this.selectedTrackIndex];
        const data = t.buffer.getChannelData(0);
        
        // Clear
        this.bufCtx.fillStyle = '#111';
        this.bufCtx.fillRect(0, 0, w, h);

        // Draw Waveform
        this.bufCtx.beginPath();
        this.bufCtx.strokeStyle = '#22c55e'; // Green
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
        let mod = { position:0, spray:0, density:0, grainSize:0, pitch:0, filter:0, hpFilter:0 };
        const time = audioCtx.currentTime;
        
        t.lfos.forEach(lfo => {
            const v = lfo.getValue(time);
            if (lfo.target === 'filter') mod.filter += v * 5000;
            else if (lfo.target === 'hpFilter') mod.hpFilter += v * 2000;
            else if(mod[lfo.target] !== undefined) mod[lfo.target] += v;
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
        this.bufCtx.fillRect(Math.max(0, posPx - grainPx/2), h - 10, grainPx, 10);

        // Redraw position line on top
        this.bufCtx.strokeStyle = '#06b6d4';
        this.bufCtx.lineWidth = 1;
        this.bufCtx.beginPath();
        this.bufCtx.moveTo(posPx, 0);
        this.bufCtx.lineTo(posPx, h);
        this.bufCtx.stroke();
    }
}
