export interface ChromeMessage {
  action: string;
  [key: string]: any;
}

export interface WindowMessage {
  action: string;
  [key: string]: any;
}

export class MessagesHandler {
  private frameHandler: any;
  private listeners: Map<string, Function[]> = new Map();

  constructor(frameHandler: any) {
    this.frameHandler = frameHandler;
    this.setupChromeMessageListener();
    this.setupWindowMessageListener();
  }

  // Setup Chrome runtime message listener
  private setupChromeMessageListener(): void {
    chrome.runtime.onMessage.addListener((message: ChromeMessage, sender, sendResponse) => {
      this.handleChromeMessage(message, sender, sendResponse);
      return true; // Keep the message channel open for async responses
    });
  }

  // Setup window message listener
  private setupWindowMessageListener(): void {
    window.addEventListener('message', (event: MessageEvent<WindowMessage>) => {
      this.handleWindowMessage(event);
    });
  }

  // Handle Chrome extension messages
  private handleChromeMessage(message: ChromeMessage, sender: any, sendResponse: Function): void {
    console.log('Chrome message received:', message);

    switch (message.action) {
      case 'toggleFrameVisibility':
        this.handleToggleFrameVisibility(message);
        sendResponse({ success: true });
        break;

      case 'getFrameStatus':
        this.handleGetFrameStatus(sendResponse);
        break;

      case 'updateFrameSettings':
        this.handleUpdateFrameSettings(message, sendResponse);
        break;

      default:
        console.warn('Unknown Chrome message action:', message.action);
        sendResponse({ success: false, error: 'Unknown action' });
    }

    // Emit to custom listeners
    this.emit('chrome:' + message.action, message, sender, sendResponse);
  }

  // Handle window messages (from React app)
  private handleWindowMessage(event: MessageEvent<WindowMessage>): void {
    // Only handle messages from our iframe
    if (!this.isValidSource(event)) {
      return;
    }

    console.log('Window message received:', event.data);

    switch (event.data.action) {
      case 'resize':
        this.handleFrameResize(event.data);
        break;

      case 'close':
        this.handleFrameClose(event.data);
        break;

      case 'executeAction':
        this.handleExecuteAction(event.data);
        break;

      case 'frameReady':
        this.handleFrameReady(event.data);
        break;

      case 'logMessage':
        this.handleLogMessage(event.data);
        break;

      default:
        console.warn('Unknown window message action:', event.data.action);
    }

    // Emit to custom listeners
    this.emit('window:' + event.data.action, event.data, event);
  }

  // Validate message source
  private isValidSource(event: MessageEvent): boolean {
    // Check if message is from our extension's iframe
    const frameElement = document.getElementById('react-frame-host');
    if (!frameElement) return false;

    // Additional validation can be added here
    return true;
  }

  // Handle frame visibility toggle
  private handleToggleFrameVisibility(message: ChromeMessage): void {
    if (this.frameHandler && typeof this.frameHandler.handleToggleVisibility === 'function') {
      this.frameHandler.handleToggleVisibility(message.isVisible);
    }
  }

  // Handle get frame status
  private handleGetFrameStatus(sendResponse: Function): void {
    const frameElement = document.getElementById('react-frame-host');
    const isVisible = frameElement && frameElement.style.display !== 'none';
    const isCollapsed = frameElement && frameElement.style.height === '48px';

    sendResponse({
      success: true,
      status: {
        exists: !!frameElement,
        visible: isVisible,
        collapsed: isCollapsed,
        position: frameElement ? {
          left: frameElement.style.left,
          bottom: frameElement.style.bottom,
          width: frameElement.style.width,
          height: frameElement.style.height
        } : null
      }
    });
  }

  // Handle frame settings update
  private handleUpdateFrameSettings(message: ChromeMessage, sendResponse: Function): void {
    try {
      const frameElement = document.getElementById('react-frame-host');
      if (frameElement && message.settings) {
        // Apply settings to frame
        if (message.settings.position) {
          Object.assign(frameElement.style, message.settings.position);
        }
        if (message.settings.size) {
          Object.assign(frameElement.style, message.settings.size);
        }
      }
      sendResponse({ success: true });
    } catch (error) {
      console.error('Error updating frame settings:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  // Handle frame resize
  private handleFrameResize(data: WindowMessage): void {
    const frameElement = document.getElementById('react-frame-host');
    if (frameElement && this.frameHandler && typeof this.frameHandler.handleFrameResize === 'function') {
      this.frameHandler.handleFrameResize(frameElement, data.isCollapsed);
    }
  }

  // Handle frame close
  private handleFrameClose(data: WindowMessage): void {
    const frameElement = document.getElementById('react-frame-host');
    if (frameElement && this.frameHandler && typeof this.frameHandler.handleFrameClose === 'function') {
      this.frameHandler.handleFrameClose(frameElement);
    }
  }

  // Handle execute action
  private handleExecuteAction(data: WindowMessage): void {
    if (data.actionData) {
      // Import and execute browser action
      import('./actions/index').then(({ browserAction }) => {
        browserAction(data.actionData);
      }).catch((error) => {
        console.error('Error executing browser action:', error);
        this.sendMessageToFrame({
          action: 'actionError',
          error: error.message,
          actionData: data.actionData
        });
      });
    }
  }

  // Handle frame ready
  private handleFrameReady(data: WindowMessage): void {
    console.log('Frame is ready');
    
    // Send any pending messages or initialization data
    this.sendMessageToFrame({
      action: 'initialize',
      config: {
        website: window.location.hostname,
        timestamp: Date.now()
      }
    });
  }

  // Handle log message from frame
  private handleLogMessage(data: WindowMessage): void {
    const level = data.level || 'log';
    const message = data.message || 'No message';
    
    switch (level) {
      case 'error':
        console.error('[Frame]', message, data.data);
        break;
      case 'warn':
        console.warn('[Frame]', message, data.data);
        break;
      case 'info':
        console.info('[Frame]', message, data.data);
        break;
      default:
        console.log('[Frame]', message, data.data);
    }
  }

  // Send message to React frame
  sendMessageToFrame(message: any): void {
    const frameElement = document.getElementById('react-frame-host');
    if (frameElement) {
      const iframe = frameElement.shadowRoot?.querySelector('iframe') as HTMLIFrameElement;
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage(message, '*');
      }
    }
  }

  // Send message to Chrome extension
  sendChromeMessage(message: ChromeMessage): Promise<any> {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    });
  }

  // Event emitter functionality
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  emit(event: string, ...args: any[]): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    }
  }

  // Utility methods
  broadcastToAllTabs(message: ChromeMessage): void {
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, message).catch(() => {
            // Suppress errors for tabs where content script isn't loaded
          });
        }
      });
    });
  }

  // Get current tab info
  getCurrentTabInfo(): Promise<chrome.tabs.Tab | null> {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        resolve(tabs[0] || null);
      });
    });
  }

  // Storage helpers
  async saveToStorage(key: string, value: any): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: value }, () => {
        resolve();
      });
    });
  }

  async getFromStorage(key: string): Promise<any> {
    return new Promise((resolve) => {
      chrome.storage.local.get([key], (result) => {
        resolve(result[key]);
      });
    });
  }

  // Cleanup method
  destroy(): void {
    // Remove all event listeners
    this.listeners.clear();
    
    // Remove window message listener
    window.removeEventListener('message', this.handleWindowMessage.bind(this));
    
    console.log('MessagesHandler destroyed');
  }
}

// Export singleton instance creator
export function createMessagesHandler(frameHandler: any): MessagesHandler {
  return new MessagesHandler(frameHandler);
}