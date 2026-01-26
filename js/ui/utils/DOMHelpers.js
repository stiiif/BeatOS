// js/ui/utils/DOMHelpers.js
export class DOMHelpers {
    static setElementVisibility(elementId, visible) {
        const el = document.getElementById(elementId);
        if (!el) return;
        if (visible) {
            el.classList.remove('hidden');
        } else {
            el.classList.add('hidden');
        }
    }

    static toggleClass(elementId, className, condition) {
        const el = document.getElementById(elementId);
        if (!el) return;
        if (condition) {
            el.classList.add(className);
        } else {
            el.classList.remove(className);
        }
    }

    static setElementValue(elementId, value) {
        const el = document.getElementById(elementId);
        if (el) el.value = value;
    }

    static setElementText(elementId, text) {
        const el = document.getElementById(elementId);
        if (el) el.innerText = text;
    }

    static createButton(config) {
        const btn = document.createElement('button');
        if (config.id) btn.id = config.id;
        if (config.className) btn.className = config.className;
        if (config.innerHTML) btn.innerHTML = config.innerHTML;
        if (config.title) btn.title = config.title;
        if (config.dataset) {
            Object.keys(config.dataset).forEach(key => {
                btn.dataset[key] = config.dataset[key];
            });
        }
        if (config.onClick) btn.addEventListener('click', config.onClick);
        return btn;
    }

    static createDiv(config = {}) {
        const div = document.createElement('div');
        if (config.id) div.id = config.id;
        if (config.className) div.className = config.className;
        if (config.innerHTML) div.innerHTML = config.innerHTML;
        if (config.title) div.title = config.title;
        return div;
    }
}