// Singleton wrapper for the Web Audio Context
// Ensures we only ever have one context and handles the "User Gesture" unlock requirement.

class AudioContextManager {
    private context: AudioContext | null = null;

    public getContext(): AudioContext {
        if (!this.context) {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            this.context = new AudioContextClass();
        }
        return this.context;
    }

    public async resume(): Promise<void> {
        const ctx = this.getContext();
        if (ctx.state === 'suspended') {
            await ctx.resume();
        }
    }

    public get sampleRate(): number {
        return this.getContext().sampleRate;
    }
}

export const audioContext = new AudioContextManager();