/**
 * EventBus.js
 * UNIVERSAL SINGLETON IMPLEMENTATION
 * * This robust implementation guarantees that all parts of the app
 * communicate on the exact same channel, regardless of import style.
 */

class EventBus {
    constructor() {
        // Singleton pattern: If an instance exists, return it.
        // This ensures 'new EventBus()' in main.js returns the SAME object
        // as the one used in Scheduler.js
        if (EventBus.instance) {
            return EventBus.instance;
        }

        this.listeners = {};
        EventBus.instance = this;
    }

    /**
     * Subscribe to an event
     */
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    /**
     * Unsubscribe from an event
     */
    off(event, callback) {
        if (!this.listeners[event]) return;
        this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }

    /**
     * Emit an event to all subscribers
     */
    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }

    /**
     * Dispatch alias (for compatibility with some event bus patterns)
     */
    dispatch(event, data) {
        this.emit(event, data);
    }

    // ============================================================
    // STATIC PROXIES
    // These allow calls like 'EventBus.emit()' to work directly
    // without needing to instantiate the class first.
    // ============================================================

    static on(event, callback) {
        if (!this.instance) new EventBus();
        this.instance.on(event, callback);
    }

    static off(event, callback) {
        if (!this.instance) new EventBus();
        this.instance.off(event, callback);
    }

    static emit(event, data) {
        if (!this.instance) new EventBus();
        this.instance.emit(event, data);
    }
}

// Initialize the singleton immediately
const eventBusInstance = new EventBus();

// Export the Class (which behaves as a Singleton factory)
export { EventBus };

// Export the Instance as default (for robust importing)
export default eventBusInstance;