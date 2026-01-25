import { store } from '../state/Store';
import { AppState } from '../types/state';

export abstract class Component {
    protected element: HTMLElement | null = null;
    protected unsubscribe: () => void;

    constructor(elementId?: string) {
        if (elementId) {
            this.element = document.getElementById(elementId);
            if (!this.element) console.warn(`Element #${elementId} not found`);
        }
        
        // Auto-subscribe to store
        this.unsubscribe = store.subscribe((state) => this.render(state));
    }

    // Override this to update DOM based on state
    abstract render(state: AppState): void;

    destroy() {
        this.unsubscribe();
    }
}