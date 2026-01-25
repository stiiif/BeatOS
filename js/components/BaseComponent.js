import { appStore } from '../state/Store.js';

/**
 * BaseComponent - Foundation for all BeatOS Web Components.
 * Handles shadow DOM attachment and Store subscription lifecycle.
 */
export class BaseComponent extends HTMLElement {
    constructor() {
        super();
        this.unsubscribeFunctions = [];
        this.attachShadow({ mode: 'open' });
        this.isRendered = false;
    }

    connectedCallback() {
        if (!this.isRendered) {
            this.render();
            this.isRendered = true;
        }
        this.addGlobalStyles();
    }

    disconnectedCallback() {
        // Auto-cleanup store subscriptions
        this.unsubscribeFunctions.forEach(fn => fn());
        this.unsubscribeFunctions = [];
    }

    /**
     * Subscribe to store changes. 
     * Automatically cleans up when component is removed from DOM.
     * @param {string} event 
     * @param {Function} callback 
     */
    subscribe(event, callback) {
        const unsub = appStore.on(event, callback);
        this.unsubscribeFunctions.push(unsub);
    }

    /**
     * Inject shared CSS variables into the Shadow DOM
     */
    addGlobalStyles() {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'css/variables.css';
        this.shadowRoot.appendChild(link);
    }

    /**
     * Method to be overridden by child classes
     */
    render() {
        console.warn('BaseComponent: render() not implemented');
    }
}