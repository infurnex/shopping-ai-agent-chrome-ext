// Content script entry point - Chrome extension content script
// This file is injected into web pages and manages the React frame

import { FrameHandler } from './frameHandler';
import { createMessagesHandler, MessagesHandler } from './messagesHandler';
import { ActionProcessor } from './actionProcessor';

// Wrap everything in an IIFE to avoid global scope pollution
(function() {
  'use strict';
  
  console.log('Content script loading...');

  // Initialize frame handler, messages handler, and action processor
  let frameHandler: FrameHandler;
  let messagesHandler: MessagesHandler;
  let actionProcessor: ActionProcessor;

  // Initialize the extension
  function initializeExtension() {
    try {
      frameHandler = new FrameHandler();
      messagesHandler = createMessagesHandler(frameHandler);
      actionProcessor = new ActionProcessor();

      // Set up the connection between components
      frameHandler.setMessagesHandler(messagesHandler);

      // Initialize the frame
      frameHandler.initialize();

      // Set up custom event listeners for additional functionality
      setupCustomEventListeners();

      console.log('Content script initialized successfully');
    } catch (error) {
      console.error('Error initializing content script:', error);
    }
  }

  function setupCustomEventListeners(): void {
    // Listen for frame visibility changes
    messagesHandler.on('chrome:toggleFrameVisibility', (message: any) => {
      console.log('Frame visibility toggled:', message.isVisible);
    });

    // Listen for frame resize events
    messagesHandler.on('window:resize', (data: any) => {
      console.log('Frame resized:', data);
    });

    // Listen for action execution from frame
    messagesHandler.on('window:executeAction', (data: any) => {
      console.log('Action executed:', data.actionData);
    });

    // Listen for frame ready event
    messagesHandler.on('window:frameReady', () => {
      console.log('Frame is ready and initialized');
    });

    // Listen for workflow trigger from frame
    messagesHandler.on('window:triggerWorkflow', async (data: any) => {
      console.log('Workflow triggered with actions:', data.actions);
      
      if (data.actions && data.actions.length > 0) {
        await actionProcessor.addActionsToQueue(data.actions);
      }
    });

    // Listen for queue status requests
    messagesHandler.on('window:getQueueStatus', async (data: any) => {
      const status = await actionProcessor.getQueueStatus();
      messagesHandler.sendMessageToFrame({
        action: 'queueStatusUpdate',
        status: status
      });
    });

    // Listen for clear queue requests
    messagesHandler.on('window:clearQueue', async () => {
      await actionProcessor.clearQueue();
      messagesHandler.sendMessageToFrame({
        action: 'queueCleared'
      });
    });

    // Example: Send welcome message when frame is ready
    messagesHandler.on('window:frameReady', () => {
      setTimeout(() => {
        messagesHandler.sendMessageToFrame({
          action: 'showWelcomeMessage',
          message: 'Welcome to AI Shopping Assistant! Try the workflow simulation.'
        });
      }, 1000);
    });
  }

  // Cleanup on page unload
  function cleanup() {
    if (frameHandler) frameHandler.destroy();
    if (messagesHandler) messagesHandler.destroy();
    if (actionProcessor) actionProcessor.destroy();
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeExtension);
  } else {
    initializeExtension();
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', cleanup);

  // Export for debugging purposes (attach to window for global access)
  (window as any).extensionDebug = {
    frameHandler: () => frameHandler,
    messagesHandler: () => messagesHandler,
    actionProcessor: () => actionProcessor,
    cleanup
  };

})();