import { FrameHandler } from './frameHandler';
import { createMessagesHandler, MessagesHandler } from './messagesHandler';

// Initialize frame handler and messages handler
const frameHandler = new FrameHandler();
const messagesHandler = createMessagesHandler(frameHandler);

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

  // Listen for action execution
  messagesHandler.on('window:executeAction', (data: any) => {
    console.log('Action executed:', data.actionData);
  });

  // Listen for frame ready event
  messagesHandler.on('window:frameReady', () => {
    console.log('Frame is ready and initialized');
  });

  // Example: Send welcome message when frame is ready
  messagesHandler.on('window:frameReady', () => {
    setTimeout(() => {
      messagesHandler.sendMessageToFrame({
        action: 'showWelcomeMessage',
        message: 'Welcome to AI Shopping Assistant!'
      });
    }, 1000);
  });
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  frameHandler.destroy();
  messagesHandler.destroy();
});

// Export for debugging purposes
(window as any).frameHandler = frameHandler;
(window as any).messagesHandler = messagesHandler;