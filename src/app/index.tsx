import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './components/App';
import './index.css';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  const rootElement = document.getElementById('frame-root');
  
  if (rootElement) {
    createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  }
});

// Enhanced message handling for React app
class FrameMessagesHandler {
  constructor() {
    this.setupMessageListener();
    this.notifyFrameReady();
  }

  setupMessageListener() {
    window.addEventListener('message', (event) => {
      this.handleMessage(event.data);
    });
  }

  handleMessage(data: any) {
    console.log('Message received in frame:', data);

    switch (data.action) {
      case 'initialize':
        this.handleInitialize(data);
        break;
      
      case 'showWelcomeMessage':
        this.handleWelcomeMessage(data);
        break;
      
      case 'actionError':
        this.handleActionError(data);
        break;
      
      case 'updateConfig':
        this.handleUpdateConfig(data);
        break;
      
      default:
        console.log('Unhandled message action:', data.action);
    }
  }

  handleInitialize(data: any) {
    console.log('Frame initialized with config:', data.config);
    // Store config or perform initialization tasks
    if (data.config) {
      (window as any).frameConfig = data.config;
    }
  }

  handleWelcomeMessage(data: any) {
    console.log('Welcome message:', data.message);
    // Could trigger a welcome animation or notification
  }

  handleActionError(data: any) {
    console.error('Action error:', data.error, 'for action:', data.actionData);
    // Could show error message in UI
  }

  handleUpdateConfig(data: any) {
    console.log('Config updated:', data.config);
    if (data.config) {
      (window as any).frameConfig = { ...(window as any).frameConfig, ...data.config };
    }
  }

  notifyFrameReady() {
    // Notify content script that frame is ready
    setTimeout(() => {
      window.parent.postMessage({
        action: 'frameReady',
        timestamp: Date.now()
      }, '*');
    }, 100);
  }

  sendMessage(action: string, data: any = {}) {
    window.parent.postMessage({
      action,
      ...data
    }, '*');
  }

  logToContent(level: 'log' | 'info' | 'warn' | 'error', message: string, data?: any) {
    this.sendMessage('logMessage', {
      level,
      message,
      data,
      timestamp: Date.now()
    });
  }
}

// Initialize frame messages handler
const frameMessagesHandler = new FrameMessagesHandler();

// Export for use in components
(window as any).frameMessagesHandler = frameMessagesHandler;