import { store } from '../state/Store';
import type { AppState } from '../types/state';

export abstract class Component {
    protected element: HTMLElement | null = null;
    protected unsubscribe: () => void;

    constructor(elementId?: string) {
        if (elementId) {
            this.element = document.getElementById(elementId);
            if (!this.element) console.warn(`Element #${elementId} not found`);
        }
        
        this.unsubscribe = store.subscribe((state) => this.render(state));
    }

    abstract render(state: AppState): void;

    destroy() {
        this.unsubscribe();
    }
}