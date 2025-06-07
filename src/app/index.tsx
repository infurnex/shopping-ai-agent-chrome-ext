import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './components/App';
import './index.css';

console.log('Frame script loading...');

// Wait for DOM to be ready
const initializeFrame = () => {
  const rootElement = document.getElementById('frame-root');
  
  if (rootElement) {
    console.log('Frame root found, initializing React app...');
    createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } else {
    console.error('Frame root element not found!');
  }
};

// Initialize immediately if DOM is ready, otherwise wait
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeFrame);
} else {
  initializeFrame();
}

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

  handleMessage(data) {
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

  handleInitialize(data) {
    console.log('Frame initialized with config:', data.config);
    if (data.config) {
      window.frameConfig = data.config;
    }
  }

  handleWelcomeMessage(data) {
    console.log('Welcome message:', data.message);
  }

  handleActionError(data) {
    console.error('Action error:', data.error, 'for action:', data.actionData);
  }

  handleUpdateConfig(data) {
    console.log('Config updated:', data.config);
    if (data.config) {
      window.frameConfig = { ...window.frameConfig, ...data.config };
    }
  }

  notifyFrameReady() {
    setTimeout(() => {
      window.parent.postMessage({
        action: 'frameReady',
        timestamp: Date.now()
      }, '*');
      console.log('Frame ready notification sent');
    }, 100);
  }

  sendMessage(action, data = {}) {
    window.parent.postMessage({
      action,
      ...data
    }, '*');
  }

  logToContent(level, message, data) {
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
window.frameMessagesHandler = frameMessagesHandler;

console.log('Frame script initialized');