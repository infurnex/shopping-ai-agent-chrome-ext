import { FrameHandler } from './frameHandler';

// Initialize frame handler
const frameHandler = new FrameHandler();

// Initialize the frame
frameHandler.initialize();

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'toggleFrameVisibility') {
    frameHandler.handleToggleVisibility(message.isVisible);
  }
  return true;
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  frameHandler.destroy();
});