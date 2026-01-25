import { Component } from './Component';
import { DOM_IDS } from '../config/dom-ids';
import type { AppState } from '../types/state';

export class Layout extends Component {
    private container: HTMLElement;
    private leftPanel: HTMLElement;
    private rightPane: HTMLElement;
    private middlePane: HTMLElement;
    private sequencerPanel: HTMLElement;
    private futurePanel: HTMLElement;
    
    private resizerLeft: HTMLElement;
    private resizerRight: HTMLElement;
    
    private resizerH: HTMLElement;

    private isResizingLeft = false;
    private isResizingRight = false;
    private isResizingH = false;

    constructor() {
        super();
        this.container = document.querySelector('.app-container') as HTMLElement;
        this.leftPanel = document.querySelector('.new-left-panel') as HTMLElement;
        this.rightPane = document.querySelector('.right-pane') as HTMLElement;
        this.middlePane = document.querySelector('.middle-pane') as HTMLElement;
        this.sequencerPanel = document.querySelector('.sequencer-panel') as HTMLElement;
        this.futurePanel = document.querySelector('.future-panel') as HTMLElement;

        this.resizerLeft = document.getElementById(DOM_IDS.LAYOUT.RESIZER_LEFT)!;
        this.resizerRight = document.getElementById(DOM_IDS.LAYOUT.RESIZER_RIGHT)!;
        this.resizerH = document.querySelector('.resizer-h') as HTMLElement;

        this.bindEvents();
    }

    private bindEvents() {
        this.resizerLeft.addEventListener('mousedown', () => {
            this.isResizingLeft = true;
            this.startResize('col-resize');
        });

        this.resizerRight.addEventListener('mousedown', () => {
            this.isResizingRight = true;
            this.startResize('col-resize');
        });

        if (this.resizerH) {
            this.resizerH.addEventListener('mousedown', () => {
                this.isResizingH = true;
                this.startResize('row-resize');
            });
        }

        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        document.addEventListener('mouseup', () => this.stopResizing());
    }

    private startResize(cursor: string) {
        document.body.style.cursor = cursor;
        document.body.style.userSelect = 'none';
    }

    private handleMouseMove(e: MouseEvent) {
        if (!this.isResizingLeft && !this.isResizingRight && !this.isResizingH) return;

        const containerRect = this.container.getBoundingClientRect();

        if (this.isResizingLeft) {
            const width = e.clientX - containerRect.left;
            if (width > 200 && width < 600) {
                this.leftPanel.style.width = `${width}px`;
                this.triggerResizeEvent();
            }
        }

        if (this.isResizingRight) {
            const width = containerRect.right - e.clientX;
            if (width > 250 && width < 800) {
                this.rightPane.style.width = `${width}px`;
                this.triggerResizeEvent();
            }
        }

        if (this.isResizingH) {
            const midRect = this.middlePane.getBoundingClientRect();
            const relY = e.clientY - midRect.top;
            const totalH = midRect.height;
            const topH = Math.max(100, Math.min(totalH - 100, relY));
            const botH = totalH - topH;
            
            this.sequencerPanel.style.flex = `${topH}`;
            this.futurePanel.style.flex = `${botH}`;
        }
    }

    private stopResizing() {
        this.isResizingLeft = false;
        this.isResizingRight = false;
        this.isResizingH = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    }

    private triggerResizeEvent() {
        window.dispatchEvent(new Event('resize'));
    }

    render(state: AppState) {
    }
}