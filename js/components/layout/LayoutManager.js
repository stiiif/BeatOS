export class LayoutManager {
    constructor() {
        this.container = document.querySelector('.app-container');
        this.newLeftPanel = document.querySelector('.new-left-panel');
        this.middlePane = document.querySelector('.middle-pane');
        this.rightPane = document.querySelector('.right-pane');
        this.sequencerPanel = document.querySelector('.sequencer-panel');
        this.futurePanel = document.querySelector('.future-panel');

        this.resizerLeft = document.getElementById('resizer-left');
        this.resizerRight = document.getElementById('resizer-right');
        this.resizerH = document.querySelector('.resizer-h');

        this.isResizingLeft = false;
        this.isResizingRight = false;
        this.isResizingH = false;

        this.init();
    }

    init() {
        if(this.resizerLeft) {
            this.resizerLeft.addEventListener('mousedown', () => {
                this.isResizingLeft = true;
                this.resizerLeft.classList.add('resizing');
                document.body.style.cursor = 'col-resize';
                document.body.style.userSelect = 'none';
            });
        }

        if(this.resizerRight) {
            this.resizerRight.addEventListener('mousedown', () => {
                this.isResizingRight = true;
                this.resizerRight.classList.add('resizing');
                document.body.style.cursor = 'col-resize';
                document.body.style.userSelect = 'none';
            });
        }

        if(this.resizerH) {
            this.resizerH.addEventListener('mousedown', () => {
                this.isResizingH = true;
                this.resizerH.classList.add('resizing');
                document.body.style.cursor = 'row-resize';
                document.body.style.userSelect = 'none';
            });
        }

        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        document.addEventListener('mouseup', () => this.stopResizing());
    }

    handleMouseMove(e) {
        if (!this.isResizingLeft && !this.isResizingRight && !this.isResizingH) return;

        if (this.isResizingLeft && this.container && this.newLeftPanel) {
            const containerRect = this.container.getBoundingClientRect();
            const newLeftWidth = e.clientX - containerRect.left;
            if (newLeftWidth > 200 && newLeftWidth < 600) {
                this.newLeftPanel.style.width = `${newLeftWidth}px`;
                window.dispatchEvent(new Event('resize'));
            }
        }

        if (this.isResizingRight && this.container && this.rightPane) {
            const containerRect = this.container.getBoundingClientRect();
            const newRightWidth = containerRect.right - e.clientX;
            if (newRightWidth > 250 && newRightWidth < 800) {
                this.rightPane.style.width = `${newRightWidth}px`;
                window.dispatchEvent(new Event('resize'));
            }
        }

        if (this.isResizingH && this.middlePane && this.sequencerPanel && this.futurePanel) {
            const middlePaneRect = this.middlePane.getBoundingClientRect();
            const relativeY = e.clientY - middlePaneRect.top;
            const totalHeight = middlePaneRect.height;
            const topHeight = Math.max(100, Math.min(totalHeight - 100, relativeY));
            const bottomHeight = totalHeight - topHeight;
            this.sequencerPanel.style.flex = `${topHeight}`;
            this.futurePanel.style.flex = `${bottomHeight}`;
        }
    }

    stopResizing() {
        this.isResizingLeft = false;
        this.isResizingRight = false;
        this.isResizingH = false;
        if(this.resizerLeft) this.resizerLeft.classList.remove('resizing');
        if(this.resizerRight) this.resizerRight.classList.remove('resizing');
        if(this.resizerH) this.resizerH.classList.remove('resizing');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    }
}