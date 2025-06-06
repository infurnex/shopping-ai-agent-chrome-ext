// Frame management functionality
export class FrameManager {
  private persistentIframe: HTMLIFrameElement | null = null;
  private hostElement: HTMLElement | null = null;

  // Function to create persistent iframe that survives page reloads
  createPersistentFrame() {
    // Create host element that will be attached to document.documentElement
    // instead of document.body to survive most page manipulations
    this.hostElement = document.createElement('div');
    this.hostElement.id = 'react-frame-host-persistent';
    
    // Apply styles to make it completely independent
    Object.assign(this.hostElement.style, {
      position: 'fixed',
      bottom: '20px',
      left: '20px',
      width: '380px',
      height: '500px',
      zIndex: '2147483647',
      border: 'none',
      margin: '0',
      padding: '0',
      overflow: 'hidden',
      pointerEvents: 'auto',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      isolation: 'isolate', // Create new stacking context
    });
    
    // Create shadow DOM for complete isolation
    const shadow = this.hostElement.attachShadow({ mode: 'closed' });
    
    // Create the iframe
    this.persistentIframe = document.createElement('iframe');
    this.persistentIframe.id = 'react-frame-iframe-persistent';
    this.persistentIframe.frameBorder = '0';
    this.persistentIframe.allowTransparency = 'true';
    
    Object.assign(this.persistentIframe.style, {
      width: '100%',
      height: '100%',
      border: 'none',
      borderRadius: '16px',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      background: 'transparent',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    });
    
    // Set iframe source
    this.persistentIframe.src = chrome.runtime.getURL('frame.html');
    
    // Append to shadow DOM
    shadow.appendChild(this.persistentIframe);
    
    // Attach to document.documentElement instead of body
    // This makes it more resistant to page manipulations
    document.documentElement.appendChild(this.hostElement);
    
    // Add drag functionality
    this.enableDragging(this.hostElement);
    
    // Store reference for persistence
    (window as any).__reactFramePersistent = {
      hostElement: this.hostElement,
      iframe: this.persistentIframe
    };
    
    return { hostElement: this.hostElement, iframe: this.persistentIframe };
  }

  // Function to restore existing persistent frame
  restorePersistentFrame() {
    const existing = (window as any).__reactFramePersistent;
    if (existing && existing.hostElement && existing.iframe) {
      this.hostElement = existing.hostElement;
      this.persistentIframe = existing.iframe;
      
      // Re-attach event listeners if needed
      if (document.documentElement.contains(this.hostElement)) {
        console.log('Persistent frame restored successfully');
        return { hostElement: this.hostElement, iframe: this.persistentIframe };
      }
    }
    return null;
  }

  // Function to create and inject the frame
  injectFrame() {
    // First try to restore existing persistent frame
    const restored = this.restorePersistentFrame();
    if (restored) {
      return restored;
    }
    
    // If no persistent frame exists, create new one
    return this.createPersistentFrame();
  }

  // Function to handle frame resizing
  handleFrameResize(hostElement: HTMLElement, isCollapsed: boolean) {
    if (isCollapsed) {
      hostElement.style.width = '320px';
      hostElement.style.height = '48px';
    } else {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      let width = '380px';
      let height = '500px';
      
      if (viewportWidth < 768) {
        width = Math.min(viewportWidth - 40, 350) + 'px';
        height = Math.min(viewportHeight - 100, 450) + 'px';
      } else if (viewportWidth < 1024) {
        width = '360px';
        height = '480px';
      }
      
      hostElement.style.width = width;
      hostElement.style.height = height;
      
      this.ensureFrameInBounds(hostElement);
    }
  }

  // Function to handle frame closing
  handleFrameClose(hostElement: HTMLElement) {
    hostElement.style.transform = 'translateY(100%) scale(0.95)';
    hostElement.style.opacity = '0';
    
    setTimeout(() => {
      if (hostElement.parentNode) {
        hostElement.parentNode.removeChild(hostElement);
      }
      // Clear persistent reference
      delete (window as any).__reactFramePersistent;
      chrome.storage.local.set({ frameVisible: false });
    }, 300);
  }

  // Function to ensure frame stays within viewport bounds
  ensureFrameInBounds(hostElement: HTMLElement) {
    const rect = hostElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let newLeft = parseInt(hostElement.style.left, 10) || 20;
    let newBottom = parseInt(hostElement.style.bottom, 10) || 20;
    
    const newTop = viewportHeight - newBottom - rect.height;
    
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
    hostElement.style.top = 'auto';
  }

  // Function to enable dragging
  private enableDragging(element: HTMLElement) {
    let isDragging = false;
    let offsetX = 0, offsetY = 0;
    
    const dragHandle = document.createElement('div');
    Object.assign(dragHandle.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '48px',
      cursor: 'move',
      zIndex: '2147483646',
      backgroundColor: 'transparent',
      borderRadius: '16px 16px 0 0',
    });
    
    element.appendChild(dragHandle);
    
    dragHandle.addEventListener('mousedown', (e) => {
      isDragging = true;
      const rect = element.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      e.preventDefault();
      
      element.style.cursor = 'grabbing';
      dragHandle.style.cursor = 'grabbing';
    });
    
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      
      const newLeft = e.clientX - offsetX;
      const newTop = e.clientY - offsetY;
      
      const maxX = window.innerWidth - element.offsetWidth;
      const maxY = window.innerHeight - element.offsetHeight;
      
      const constrainedLeft = Math.max(0, Math.min(newLeft, maxX));
      const constrainedTop = Math.max(0, Math.min(newTop, maxY));
      
      element.style.left = `${constrainedLeft}px`;
      element.style.top = `${constrainedTop}px`;
      element.style.bottom = 'auto';
    });
    
    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        element.style.cursor = 'auto';
        dragHandle.style.cursor = 'move';
        
        const rect = element.getBoundingClientRect();
        const bottomPosition = window.innerHeight - rect.bottom;
        element.style.bottom = `${bottomPosition}px`;
        element.style.top = 'auto';
      }
    });
  }

  // Function to handle visibility
  setFrameVisibility(isVisible: boolean) {
    const hostElement = document.getElementById('react-frame-host-persistent');
    if (hostElement) {
      if (isVisible) {
        hostElement.style.display = 'block';
        hostElement.style.transform = 'translateY(0) scale(1)';
        hostElement.style.opacity = '1';
      } else {
        hostElement.style.transform = 'translateY(100%) scale(0.95)';
        hostElement.style.opacity = '0';
        setTimeout(() => {
          hostElement.style.display = 'none';
        }, 300);
      }
    }
  }

  // Enhanced initialization with persistence check
  initializeFrame() {
    chrome.storage.local.get(['frameVisible'], (result) => {
      const isVisible = result.frameVisible !== undefined ? result.frameVisible : true;
      
      if (isVisible) {
        // Check if persistent frame already exists
        const existing = (window as any).__reactFramePersistent;
        if (existing && existing.hostElement && document.documentElement.contains(existing.hostElement)) {
          console.log('Persistent frame already exists, skipping creation');
          return;
        }
        
        // Create new frame
        const { hostElement } = this.injectFrame();
        
        // Add entrance animation only for new frames
        if (!existing) {
          hostElement.style.transform = 'translateY(100%) scale(0.95)';
          hostElement.style.opacity = '0';
          
          setTimeout(() => {
            hostElement.style.transform = 'translateY(0) scale(1)';
            hostElement.style.opacity = '1';
          }, 100);
        }
      }
    });
  }

  // Enhanced frame persistence monitoring
  ensureFrameExists() {
    chrome.storage.local.get(['frameVisible'], (result) => {
      const isVisible = result.frameVisible !== undefined ? result.frameVisible : true;
      
      if (isVisible) {
        const existing = (window as any).__reactFramePersistent;
        if (existing && existing.hostElement) {
          // Check if frame is still in DOM
          if (!document.documentElement.contains(existing.hostElement)) {
            console.log('Persistent frame was removed from DOM, re-attaching');
            document.documentElement.appendChild(existing.hostElement);
          }
        } else {
          // No persistent frame exists, create new one
          console.log('No persistent frame found, creating new one');
          this.initializeFrame();
        }
      }
    });
  }

  // Setup frame monitoring and event listeners
  setupFrameMonitoring() {
    // Check periodically but less frequently since we have persistence
    setInterval(() => this.ensureFrameExists(), 5000);

    // Enhanced mutation observer for better persistence
    const observer = new MutationObserver((mutations) => {
      let shouldCheck = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.removedNodes.forEach((node) => {
            if (node instanceof Element && 
                (node.id === 'react-frame-host-persistent' || 
                 node.querySelector('#react-frame-host-persistent'))) {
              shouldCheck = true;
            }
          });
        }
      });
      
      if (shouldCheck) {
        setTimeout(() => this.ensureFrameExists(), 100);
      }
    });

    // Observe document.documentElement instead of body for better persistence
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });

    // Handle window resize
    window.addEventListener('resize', () => {
      const hostElement = document.getElementById('react-frame-host-persistent');
      if (hostElement) {
        this.ensureFrameInBounds(hostElement);
        const isCollapsed = hostElement.style.height === '48px';
        if (!isCollapsed) {
          this.handleFrameResize(hostElement, false);
        }
      }
    });

    // Handle orientation change
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        const hostElement = document.getElementById('react-frame-host-persistent');
        if (hostElement) {
          this.ensureFrameInBounds(hostElement);
          const isCollapsed = hostElement.style.height === '48px';
          if (!isCollapsed) {
            this.handleFrameResize(hostElement, false);
          }
        }
      }, 500);
    });

    // Prevent frame removal during page transitions
    window.addEventListener('beforeunload', () => {
      // Store frame state before page unload
      const existing = (window as any).__reactFramePersistent;
      if (existing && existing.hostElement) {
        // The frame will persist in memory and be restored
        console.log('Page unloading, frame will persist');
      }
    });

    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        // Page became visible again, ensure frame exists
        setTimeout(() => this.ensureFrameExists(), 100);
      }
    });
  }
}