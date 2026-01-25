/**
 * EventBus - A simple Publish/Subscribe system for decoupling components.
 * Usage:
 * import { globalBus } from './EventBus.js';
 * globalBus.on('EVENT_NAME', (data) => { ... });
 * globalBus.emit('EVENT_NAME', { some: 'data' });
 */
export class EventBus {
    constructor() {
        this.listeners = {};
    }

    /**
     * Subscribe to an event
     * @param {string} event - The event name
     * @param {Function} callback - The function to call when event is emitted
     */
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
        
        // Return unsubscribe function for convenience
        return () => this.off(event, callback);
    }

    /**
     * Unsubscribe from an event
     * @param {string} event 
     * @param {Function} callback 
     */
    off(event, callback) {
        if (!this.listeners[event]) return;
        this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }

    /**
     * Emit an event to all subscribers
     * @param {string} event 
     * @param {any} data 
     */
    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in EventBus listener for "${event}":`, error);
                }
            });
        }
    }
    
    /**
     * Clear all listeners (useful for testing/reset)
     */
    clear() {
        this.listeners = {};
    }
}

// Export a singleton instance for global use
export const globalBus = new EventBus();