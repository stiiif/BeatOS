// AudioWorklet Performance Monitor
// Add this to your UI to visualize worklet performance in real-time

export class AudioWorkletMonitor {
    constructor(granularSynth) {
        this.granularSynth = granularSynth;
        this.stats = {
            activeVoices: 0,
            maxVoices: 64,
            loadedBuffers: 0,
            totalGrains: 0,
            cpuLoad: 0,
            latency: 0,
            glitchCount: 0
        };
        
        this.createUI();
        this.startMonitoring();
    }
    
    createUI() {
        // Create monitor panel
        const panel = document.createElement('div');
        panel.id = 'audioworklet-monitor';
        panel.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.85);
            color: #0f0;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            padding: 15px;
            border-radius: 8px;
            border: 2px solid #0f0;
            z-index: 10000;
            min-width: 300px;
            box-shadow: 0 4px 20px rgba(0, 255, 0, 0.3);
        `;
        
        panel.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 10px; font-size: 14px; color: #0ff;">
                🎵 AudioWorklet Monitor
            </div>
            <div id="awm-content"></div>
            <canvas id="awm-graph" width="280" height="60" style="margin-top: 10px; border: 1px solid #0f0;"></canvas>
        `;
        
        document.body.appendChild(panel);
        
        this.panel = panel;
        this.content = document.getElementById('awm-content');
        this.canvas = document.getElementById('awm-graph');
        this.ctx = this.canvas.getContext('2d');
        
        // History for graph
        this.voiceHistory = [];
        this.maxHistory = 280;
    }
    
    startMonitoring() {
        // Request stats every 100ms
        setInterval(() => {
            if (this.granularSynth?.isInitialized) {
                this.granularSynth.getStats();
            }
            this.updateDisplay();
        }, 100);
        
        // Listen for stats from worklet
        if (this.granularSynth?.workletNode) {
            this.granularSynth.workletNode.port.onmessage = (e) => {
                if (e.data.type === 'stats') {
                    this.stats = {
                        ...this.stats,
                        ...e.data.data
                    };
                }
            };
        }
    }
    
    updateDisplay() {
        if (!this.granularSynth?.isInitialized) {
            this.content.innerHTML = `
                <div style="color: #f00;">❌ AudioWorklet not initialized</div>
            `;
            return;
        }
        
        // Get current stats
        const activeCount = this.granularSynth.getActiveGrainCount();
        const audioCtx = this.granularSynth.audioEngine?.getContext();
        
        // Calculate CPU load estimate
        const cpuLoad = (activeCount / this.stats.maxVoices * 100).toFixed(1);
        
        // Get latency
        const latency = audioCtx ? (audioCtx.baseLatency * 1000).toFixed(2) : 0;
        
        // Color coding
        const voiceColor = activeCount > 50 ? '#f00' : activeCount > 30 ? '#ff0' : '#0f0';
        const cpuColor = cpuLoad > 80 ? '#f00' : cpuLoad > 50 ? '#ff0' : '#0f0';
        
        // Update display
        this.content.innerHTML = `
            <div style="margin: 5px 0;">
                <span style="color: #888;">Active Grains:</span> 
                <span style="color: ${voiceColor}; font-weight: bold;">${activeCount}</span> / ${this.stats.maxVoices}
            </div>
            <div style="margin: 5px 0;">
                <span style="color: #888;">CPU Load:</span> 
                <span style="color: ${cpuColor}; font-weight: bold;">${cpuLoad}%</span>
            </div>
            <div style="margin: 5px 0;">
                <span style="color: #888;">Latency:</span> 
                <span style="color: #0ff;">${latency}ms</span>
            </div>
            <div style="margin: 5px 0;">
                <span style="color: #888;">Loaded Buffers:</span> 
                <span style="color: #0f0;">${this.granularSynth.loadedBuffers?.size || 0}</span>
            </div>
            <div style="margin: 5px 0;">
                <span style="color: #888;">Total Grains:</span> 
                <span style="color: #888;">${this.stats.totalGrains || 0}</span>
            </div>
        `;
        
        // Update graph
        this.voiceHistory.push(activeCount);
        if (this.voiceHistory.length > this.maxHistory) {
            this.voiceHistory.shift();
        }
        
        this.drawGraph();
    }
    
    drawGraph() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Clear
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);
        
        // Draw grid
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 1;
        for (let i = 0; i < height; i += 15) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(width, i);
            ctx.stroke();
        }
        
        // Draw history
        if (this.voiceHistory.length < 2) return;
        
        ctx.strokeStyle = '#0f0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        const scaleY = height / this.stats.maxVoices;
        
        for (let i = 0; i < this.voiceHistory.length; i++) {
            const x = i;
            const y = height - (this.voiceHistory[i] * scaleY);
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.stroke();
        
        // Draw max line
        ctx.strokeStyle = '#f00';
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(0, height - (50 * scaleY)); // 50 = warning threshold
        ctx.lineTo(width, height - (50 * scaleY));
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Draw labels
        ctx.fillStyle = '#888';
        ctx.font = '10px Courier';
        ctx.fillText('64', 5, 12);
        ctx.fillText('0', 5, height - 5);
    }
    
    destroy() {
        if (this.panel) {
            this.panel.remove();
        }
    }
}
