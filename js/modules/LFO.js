// LFO (Low Frequency Oscillator) Module
export class LFO {
    constructor() {
        this.wave = 'sine';
        this.rate = 1.0;
        this.amount = 0.0;
        this.target = 'none';
        this.lastRandom = 0;
        this.randomHoldTime = 0;
    }
    getValue(time) {
        if (this.amount === 0 || this.target === 'none') return 0;
        const phase = (time * this.rate) % 1.0;
        let out = 0;
        switch(this.wave) {
            case 'sine': out = Math.sin(phase * Math.PI * 2); break;
            case 'square': out = phase < 0.5 ? 1 : -1; break;
            case 'sawtooth': out = 2 * (phase - 0.5); break;
            case 'random': 
                const step = Math.floor(time * this.rate);
                if (step > this.randomHoldTime) {
                    this.randomHoldTime = step;
                    this.lastRandom = (Math.random() * 2) - 1;
                }
                out = this.lastRandom;
                break;
        }
        return out * this.amount;
    }
}
