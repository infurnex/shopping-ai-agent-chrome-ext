// Message handling between content script and React app
import { FrameManager } from './frameManager';
import { SearchManager } from './searchManager';
import { ProductManager } from './productManager';

export class MessageHandler {
  private frameManager: FrameManager;
  private searchManager: SearchManager;
  private productManager: ProductManager;

  constructor() {
    this.frameManager = new FrameManager();
    this.searchManager = new SearchManager();
    this.productManager = new ProductManager();
  }

  // Initialize all message listeners
  initializeMessageListeners() {
    // Listen for messages from React app
    window.addEventListener('message', (event) => {
      this.handleWindowMessage(event);
    });

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((message) => {
      return this.handleChromeMessage(message);
    });
  }

  // Handle messages from the React app window
  private handleWindowMessage(event: MessageEvent) {
    const { action, data } = event.data;

    switch (action) {
      case 'resize':
        this.handleFrameResize(event.data.isCollapsed);
        break;
      
      case 'close':
        this.handleFrameClose();
        break;
      
      case 'performSearch':
        this.searchManager.performSearch(event.data.searchTerm);
        // After search, automatically look for products
        setTimeout(() => {
          this.productManager.findAndClickFirstProduct(event.data.searchTerm);
        }, 3000);
        break;
      
      case 'clickFirstProduct':
        this.productManager.findAndClickFirstProduct();
        break;
      
      default:
        console.log('Unknown window message action:', action);
    }
  }

  // Handle messages from Chrome extension (popup, etc.)
  private handleChromeMessage(message: any): boolean {
    const { action } = message;

    switch (action) {
      case 'toggleFrameVisibility':
        this.handleToggleFrameVisibility(message.isVisible);
        break;
      
      default:
        console.log('Unknown chrome message action:', action);
    }

    return true; // Keep message channel open
  }

  // Handle frame resize requests
  private handleFrameResize(isCollapsed: boolean) {
    const hostElement = document.getElementById('react-frame-host-persistent');
    if (hostElement) {
      this.frameManager.handleFrameResize(hostElement, isCollapsed);
    }
  }

  // Handle frame close requests
  private handleFrameClose() {
    const hostElement = document.getElementById('react-frame-host-persistent');
    if (hostElement) {
      this.frameManager.handleFrameClose(hostElement);
    }
  }

  // Handle frame visibility toggle
  private handleToggleFrameVisibility(isVisible: boolean) {
    if (isVisible) {
      const existingFrame = document.getElementById('react-frame-host-persistent');
      if (!existingFrame) {
        const { hostElement } = this.frameManager.injectFrame();
        hostElement.style.transform = 'translateY(100%) scale(0.95)';
        hostElement.style.opacity = '0';
        setTimeout(() => {
          hostElement.style.transform = 'translateY(0) scale(1)';
          hostElement.style.opacity = '1';
        }, 100);
      } else {
        this.frameManager.setFrameVisibility(true);
      }
    } else {
      this.frameManager.setFrameVisibility(false);
    }
  }

  // Get frame manager instance for external access
  getFrameManager(): FrameManager {
    return this.frameManager;
  }

  // Get search manager instance for external access
  getSearchManager(): SearchManager {
    return this.searchManager;
  }

  // Get product manager instance for external access
  getProductManager(): ProductManager {
    return this.productManager;
  }
}