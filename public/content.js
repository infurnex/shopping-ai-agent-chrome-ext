// Content script for injecting React frame
class FrameHandler {
  constructor() {
    this.hostElement = null;
    this.iframe = null;
    this.setupEventListeners();
    this.initialize();
  }

  initialize() {
    // Check saved visibility state and create frame
    chrome.storage.local.get(['frameVisible'], (result) => {
      const isVisible = result.frameVisible !== undefined ? result.frameVisible : true;
      
      if (isVisible) {
        this.injectFrame();
      }
    });
  }

  injectFrame() {
    // Remove existing frame if any
    const existing = document.getElementById('react-frame-host');
    if (existing) {
      existing.remove();
    }

    // Create host element
    const hostElement = document.createElement('div');
    hostElement.id = 'react-frame-host';
    document.body.appendChild(hostElement);
    
    // Apply styles
    Object.assign(hostElement.style, {
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
    });
    
    // Create shadow DOM
    const shadow = hostElement.attachShadow({ mode: 'closed' });
    
    // Create iframe
    const iframe = document.createElement('iframe');
    iframe.id = 'react-frame-iframe';
    iframe.frameBorder = '0';
    iframe.allowTransparency = 'true';
    
    Object.assign(iframe.style, {
      width: '100%',
      height: '100%',
      border: 'none',
      borderRadius: '16px',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      background: 'transparent',
    });
    
    // Set iframe source
    iframe.src = chrome.runtime.getURL('frame.html');
    
    shadow.appendChild(iframe);
    
    this.hostElement = hostElement;
    this.iframe = iframe;
    
    console.log('Frame injected successfully');
  }

  setupEventListeners() {
    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'toggleFrameVisibility') {
        this.handleToggleVisibility(message.isVisible);
        sendResponse({ success: true });
      }
      return true;
    });

    // Listen for messages from frame
    window.addEventListener('message', (event) => {
      if (event.data.action === 'close') {
        this.handleFrameClose();
      } else if (event.data.action === 'resize') {
        this.handleFrameResize(event.data.isCollapsed);
      }
    });
  }

  handleToggleVisibility(isVisible) {
    if (isVisible) {
      if (!this.hostElement) {
        this.injectFrame();
      } else {
        this.hostElement.style.display = 'block';
      }
    } else {
      if (this.hostElement) {
        this.hostElement.style.display = 'none';
      }
    }
  }

  handleFrameClose() {
    if (this.hostElement) {
      this.hostElement.remove();
      this.hostElement = null;
      this.iframe = null;
    }
    chrome.storage.local.set({ frameVisible: false });
  }

  handleFrameResize(isCollapsed) {
    if (this.hostElement) {
      if (isCollapsed) {
        this.hostElement.style.height = '48px';
      } else {
        this.hostElement.style.height = '500px';
      }
    }
  }
}

// Initialize frame handler
const frameHandler = new FrameHandler();

console.log('Content script loaded');