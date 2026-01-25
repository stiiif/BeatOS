export class BaseComponent {
    constructor(container = null) {
        this.element = null;
        this.container = container;
        if (typeof container === 'string') {
            this.container = document.querySelector(container);
        }
    }

    // Helper to create elements with classes and attributes
    createElement(tag, classes = '', innerHTML = '', attributes = {}) {
        const el = document.createElement(tag);
        if (classes) el.className = classes;
        if (innerHTML) el.innerHTML = innerHTML;
        
        Object.entries(attributes).forEach(([key, value]) => {
            if (key.startsWith('on') && typeof value === 'function') {
                el.addEventListener(key.substring(2).toLowerCase(), value);
            } else if (key === 'dataset' && typeof value === 'object') {
                Object.entries(value).forEach(([dKey, dVal]) => {
                    el.dataset[dKey] = dVal;
                });
            } else {
                el.setAttribute(key, value);
            }
        });
        return el;
    }

    mount(parent = this.container) {
        if (parent && this.element) {
            parent.appendChild(this.element);
        }
    }

    unmount() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}