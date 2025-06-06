// Frame handler module for managing the injected React frame
export class FrameHandler {
  private hostElement: HTMLElement | null = null;
  private iframe: HTMLIFrameElement | null = null;
  private observer: MutationObserver | null = null;
  private dragHandle: HTMLElement | null = null;
  private isDragging = false;
  private offsetX = 0;
  private offsetY = 0;

  constructor() {
    this.setupEventListeners();
    this.setupMutationObserver();
  }

  // Create and inject the frame
  injectFrame(): { hostElement: HTMLElement; iframe: HTMLIFrameElement } {
    // Create shadow root to isolate styles
    const hostElement = document.createElement('div');
    hostElement.id = 'react-frame-host';
    document.body.appendChild(hostElement);
    
    // Apply initial styles to the host element
    Object.assign(hostElement.style, {
      position: 'fixed',
      bottom: '20px',
      left: '20px',
      width: '380px', // Increased width for better chat experience
      height: '500px', // Increased height for better chat experience
      zIndex: '2147483647', // Max z-index
      border: 'none',
      margin: '0',
      padding: '0',
      overflow: 'hidden',
      pointerEvents: 'auto',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', // Smooth transitions
    });
    
    // Create shadow DOM
    const shadow = hostElement.attachShadow({ mode: 'closed' });
    
    // Create iframe inside shadow DOM
    const iframe = document.createElement('iframe');
    iframe.id = 'react-frame-iframe';
    
    // Set iframe attributes
    iframe.frameBorder = '0';
    iframe.allowTransparency = 'true';
    
    // Set iframe styles
    Object.assign(iframe.style, {
      width: '100%',
      height: '100%',
      border: 'none',
      borderRadius: '16px',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      background: 'transparent',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    });
    
    // Set iframe source to the extension's frame.html
    iframe.src = chrome.runtime.getURL('frame.html');
    
    // Append iframe to shadow DOM
    shadow.appendChild(iframe);
    
    // Store references
    this.hostElement = hostElement;
    this.iframe = iframe;
    
    // Add drag functionality
    this.enableDragging(hostElement);
    
    return { hostElement, iframe };
  }

  // Handle frame resizing
  handleFrameResize(hostElement: HTMLElement, isCollapsed: boolean): void {
    if (isCollapsed) {
      // Collapsed state - just show header
      hostElement.style.width = '320px';
      hostElement.style.height = '48px';
    } else {
      // Expanded state - full chat window
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Responsive sizing based on viewport
      let width = '380px';
      let height = '500px';
      
      // Adjust for smaller screens
      if (viewportWidth < 768) {
        width = Math.min(viewportWidth - 40, 350) + 'px';
        height = Math.min(viewportHeight - 100, 450) + 'px';
      } else if (viewportWidth < 1024) {
        width = '360px';
        height = '480px';
      }
      
      hostElement.style.width = width;
      hostElement.style.height = height;
      
      // Ensure frame stays within viewport bounds after resize
      this.ensureFrameInBounds(hostElement);
    }
  }

  // Handle frame closing
  handleFrameClose(hostElement: HTMLElement): void {
    // Animate out and remove
    hostElement.style.transform = 'translateY(100%) scale(0.95)';
    hostElement.style.opacity = '0';
    
    setTimeout(() => {
      if (hostElement.parentNode) {
        hostElement.parentNode.removeChild(hostElement);
      }
      // Update storage to hide frame
      chrome.storage.local.set({ frameVisible: false });
      
      // Clear references
      this.hostElement = null;
      this.iframe = null;
    }, 300);
  }

  // Ensure frame stays within viewport bounds
  ensureFrameInBounds(hostElement: HTMLElement): void {
    const rect = hostElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let newLeft = parseInt(hostElement.style.left, 10) || 20;
    let newBottom = parseInt(hostElement.style.bottom, 10) || 20;
    
    // Calculate top position from bottom
    const newTop = viewportHeight - newBottom - rect.height;
    
    // Ensure frame doesn't go outside viewport
    if (rect.right > viewportWidth) {
      newLeft = viewportWidth - rect.width - 20;
    }
    if (newLeft < 20) {
      newLeft = 20;
    }
    if (newTop < 20) {
      newBottom = viewportHeight - rect.height - 20;
    }
    if (newBottom < 20) {
      newBottom = 20;
    }
    
    hostElement.style.left = `${newLeft}px`;
    hostElement.style.bottom = `${newBottom}px`;
    hostElement.style.top = 'auto'; // Reset top to use bottom positioning
  }

  // Enable dragging functionality
  enableDragging(element: HTMLElement): void {
    // Create drag handle and append to host element
    const dragHandle = document.createElement('div');
    Object.assign(dragHandle.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '48px', // Height of the header
      cursor: 'move',
      zIndex: '2147483646',
      backgroundColor: 'transparent',
      borderRadius: '16px 16px 0 0',
    });
    
    element.appendChild(dragHandle);
    this.dragHandle = dragHandle;
    
    // Mouse events for dragging
    dragHandle.addEventListener('mousedown', this.handleMouseDown.bind(this));
  }

  // Handle mouse down for drag start
  private handleMouseDown(e: MouseEvent): void {
    if (!this.hostElement) return;
    
    this.isDragging = true;
    const rect = this.hostElement.getBoundingClientRect();
    this.offsetX = e.clientX - rect.left;
    this.offsetY = e.clientY - rect.top;
    e.preventDefault();
    
    // Add dragging class for visual feedback
    this.hostElement.style.cursor = 'grabbing';
    if (this.dragHandle) {
      this.dragHandle.style.cursor = 'grabbing';
    }
  }

  // Handle mouse move for dragging
  private handleMouseMove(e: MouseEvent): void {
    if (!this.isDragging || !this.hostElement) return;
    
    const newLeft = e.clientX - this.offsetX;
    const newTop = e.clientY - this.offsetY;
    
    // Ensure the frame stays within viewport bounds
    const maxX = window.innerWidth - this.hostElement.offsetWidth;
    const maxY = window.innerHeight - this.hostElement.offsetHeight;
    
    const constrainedLeft = Math.max(0, Math.min(newLeft, maxX));
    const constrainedTop = Math.max(0, Math.min(newTop, maxY));
    
    this.hostElement.style.left = `${constrainedLeft}px`;
    this.hostElement.style.top = `${constrainedTop}px`;
    this.hostElement.style.bottom = 'auto'; // Use top positioning while dragging
  }

  // Handle mouse up for drag end
  private handleMouseUp(): void {
    if (this.isDragging && this.hostElement) {
      this.isDragging = false;
      this.hostElement.style.cursor = 'auto';
      if (this.dragHandle) {
        this.dragHandle.style.cursor = 'move';
      }
      
      // Convert back to bottom positioning for consistency
      const rect = this.hostElement.getBoundingClientRect();
      const bottomPosition = window.innerHeight - rect.bottom;
      this.hostElement.style.bottom = `${bottomPosition}px`;
      this.hostElement.style.top = 'auto';
    }
  }

  // Set frame visibility
  setFrameVisibility(isVisible: boolean): void {
    const hostElement = document.getElementById('react-frame-host');
    if (hostElement) {
      if (isVisible) {
        hostElement.style.display = 'block';
        // Animate in
        hostElement.style.transform = 'translateY(0) scale(1)';
        hostElement.style.opacity = '1';
      } else {
        // Animate out
        hostElement.style.transform = 'translateY(100%) scale(0.95)';
        hostElement.style.opacity = '0';
        setTimeout(() => {
          hostElement.style.display = 'none';
        }, 300);
      }
    }
  }

  // Ensure frame exists and re-inject if needed
  ensureFrameExists(): void {
    chrome.storage.local.get(['frameVisible'], (result) => {
      const isVisible = result.frameVisible !== undefined ? result.frameVisible : true;
      
      if (isVisible) {
        const hostElement = document.getElementById('react-frame-host');
        if (!hostElement || !document.body.contains(hostElement)) {
          // Frame was removed, re-inject it
          const { hostElement: newHostElement } = this.injectFrame();
          // No animation for re-injection to avoid jarring experience
          newHostElement.style.transform = 'translateY(0) scale(1)';
          newHostElement.style.opacity = '1';
        }
      }
    });
  }

  // Handle window resize
  private handleWindowResize(): void {
    const hostElement = document.getElementById('react-frame-host');
    if (hostElement) {
      // Ensure frame stays in bounds
      this.ensureFrameInBounds(hostElement);
      
      // Check if frame is collapsed and adjust accordingly
      const isCollapsed = hostElement.style.height === '48px';
      if (!isCollapsed) {
        // Re-apply responsive sizing for expanded state
        this.handleFrameResize(hostElement, false);
      }
    }
  }

  // Handle orientation change
  private handleOrientationChange(): void {
    setTimeout(() => {
      const hostElement = document.getElementById('react-frame-host');
      if (hostElement) {
        this.ensureFrameInBounds(hostElement);
        const isCollapsed = hostElement.style.height === '48px';
        if (!isCollapsed) {
          this.handleFrameResize(hostElement, false);
        }
      }
    }, 500); // Delay to allow orientation change to complete
  }

  // Execute browser action
  private executeBrowserAction(actionData: any): void {
    // Import and execute browser action
    import('./actions/index').then(({ browserAction }) => {
      browserAction(actionData);
    }).catch((error) => {
      console.error('Error executing browser action:', error);
    });
  }

  // Handle messages from React app
  private handleMessage(event: MessageEvent): void {
    if (event.data.action === 'resize') {
      const hostElement = document.getElementById('react-frame-host');
      if (hostElement) {
        this.handleFrameResize(hostElement, event.data.isCollapsed);
      }
    } else if (event.data.action === 'close') {
      const hostElement = document.getElementById('react-frame-host');
      if (hostElement) {
        this.handleFrameClose(hostElement);
      }
    } else if (event.data.action === 'executeAction') {
      // Execute browser action when requested by React app
      this.executeBrowserAction(event.data.actionData);
    }
  }

  // Setup event listeners
  private setupEventListeners(): void {
    // Listen for resize messages from the React app
    window.addEventListener('message', this.handleMessage.bind(this));
    
    // Mouse events for dragging
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));
    
    // Window resize and orientation change
    window.addEventListener('resize', this.handleWindowResize.bind(this));
    window.addEventListener('orientationchange', this.handleOrientationChange.bind(this));
  }

  // Setup mutation observer
  private setupMutationObserver(): void {
    this.observer = new MutationObserver((mutations) => {
      let shouldCheck = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          // Check if our frame was removed
          mutation.removedNodes.forEach((node) => {
            if (node instanceof Element && 
                (node.id === 'react-frame-host' || node.querySelector('#react-frame-host'))) {
              shouldCheck = true;
            }
          });
        }
      });
      
      if (shouldCheck) {
        setTimeout(() => this.ensureFrameExists(), 100);
      }
    });

    // Start observing
    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Initialize the frame handler
  initialize(): void {
    // Check saved visibility state and create frame
    chrome.storage.local.get(['frameVisible'], (result) => {
      // Default to visible if setting doesn't exist
      const isVisible = result.frameVisible !== undefined ? result.frameVisible : true;
      
      if (isVisible) {
        // Create the frame
        const { hostElement } = this.injectFrame();
        
        // Add entrance animation
        hostElement.style.transform = 'translateY(100%) scale(0.95)';
        hostElement.style.opacity = '0';
        
        // Trigger animation after a brief delay
        setTimeout(() => {
          hostElement.style.transform = 'translateY(0) scale(1)';
          hostElement.style.opacity = '1';
        }, 100);
      }
    });

    // Check periodically if frame exists and re-inject if needed
    setInterval(() => this.ensureFrameExists(), 2000);
  }

  // Handle toggle visibility message
  handleToggleVisibility(isVisible: boolean): void {
    if (isVisible) {
      // Create frame if it doesn't exist
      const existingFrame = document.getElementById('react-frame-host');
      if (!existingFrame) {
        const { hostElement } = this.injectFrame();
        // Add entrance animation
        hostElement.style.transform = 'translateY(100%) scale(0.95)';
        hostElement.style.opacity = '0';
        setTimeout(() => {
          hostElement.style.transform = 'translateY(0) scale(1)';
          hostElement.style.opacity = '1';
        }, 100);
      } else {
        this.setFrameVisibility(true);
      }
    } else {
      this.setFrameVisibility(false);
    }
  }

  // Cleanup method
  destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
    
    // Remove event listeners
    window.removeEventListener('message', this.handleMessage.bind(this));
    document.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    document.removeEventListener('mouseup', this.handleMouseUp.bind(this));
    window.removeEventListener('resize', this.handleWindowResize.bind(this));
    window.removeEventListener('orientationchange', this.handleOrientationChange.bind(this));
    
    // Remove frame if it exists
    const hostElement = document.getElementById('react-frame-host');
    if (hostElement && hostElement.parentNode) {
      hostElement.parentNode.removeChild(hostElement);
    }
    
    // Clear references
    this.hostElement = null;
    this.iframe = null;
    this.dragHandle = null;
  }
}