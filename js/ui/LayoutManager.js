export class LayoutManager {
    constructor() {
        this.container = document.querySelector('.app-container');
        this.leftPane = document.querySelector('.left-pane');
        this.rightPane = document.querySelector('.right-pane');
        this.sequencerPanel = document.querySelector('.sequencer-panel');
        this.futurePanel = document.querySelector('.future-panel');
        
        this.resizerV = document.querySelector('.resizer-v');
        this.resizerH = document.querySelector('.resizer-h');
        
        this.isResizingV = false;
        this.isResizingH = false;

        this.init();
    }

    init() {
        if(!this.resizerV || !this.resizerH) return;

        // Vertical Resize (Left vs Right)
        this.resizerV.addEventListener('mousedown', (e) => {
            this.isResizingV = true;
            this.resizerV.classList.add('resizing');
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        });

        // Horizontal Resize (Sequencer vs Future)
        this.resizerH.addEventListener('mousedown', (e) => {
            this.isResizingH = true;
            this.resizerH.classList.add('resizing');
            document.body.style.cursor = 'row-resize';
            document.body.style.userSelect = 'none';
        });

        // Global Mouse Move
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        
        // Global Mouse Up
        document.addEventListener('mouseup', () => this.stopResizing());
    }

    handleMouseMove(e) {
        if (!this.isResizingV && !this.isResizingH) return;

        if (this.isResizingV) {
            // Calculate new width for right pane
            const containerRect = this.container.getBoundingClientRect();
            const newRightWidth = containerRect.right - e.clientX;
            
            // Constrain width
            if (newRightWidth > 250 && newRightWidth < 800) {
                this.rightPane.style.width = `${newRightWidth}px`;
                window.dispatchEvent(new Event('resize'));
            }
        }

        if (this.isResizingH) {
            // Calculate relative heights using flex-grow
            const leftPaneRect = this.leftPane.getBoundingClientRect();
            const relativeY = e.clientY - leftPaneRect.top;
            
            const totalHeight = leftPaneRect.height;
            const topHeight = Math.max(100, Math.min(totalHeight - 100, relativeY));
            const bottomHeight = totalHeight - topHeight;
            
            this.sequencerPanel.style.flex = `${topHeight}`;
            this.futurePanel.style.flex = `${bottomHeight}`;
        }
    }

    stopResizing() {
        this.isResizingV = false;
        this.isResizingH = false;
        if(this.resizerV) this.resizerV.classList.remove('resizing');
        if(this.resizerH) this.resizerH.classList.remove('resizing');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    }
}