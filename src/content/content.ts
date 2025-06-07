import { FrameHandler } from './frameHandler';
import { createMessagesHandler, MessagesHandler } from './messagesHandler';
import { ActionProcessor } from './actionProcessor';

// Initialize frame handler, messages handler, and action processor
const frameHandler = new FrameHandler();
const messagesHandler = createMessagesHandler(frameHandler);
const actionProcessor = new ActionProcessor();

// Set up the connection between components
frameHandler.setMessagesHandler(messagesHandler);

// Initialize the frame
frameHandler.initialize();

// Set up custom event listeners for additional functionality
setupCustomEventListeners();

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
window.addEventListener('beforeunload', () => {
  frameHandler.destroy();
  messagesHandler.destroy();
  actionProcessor.destroy();
});

// Export for debugging purposes
(window as any).frameHandler = frameHandler;
(window as any).messagesHandler = messagesHandler;
(window as any).actionProcessor = actionProcessor;