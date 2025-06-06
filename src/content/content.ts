// Main content script - now clean and modular
import { MessageHandler } from './modules/messageHandler';

// Initialize the main message handler which coordinates all functionality
const messageHandler = new MessageHandler();

// Get individual managers for direct access if needed
const frameManager = messageHandler.getFrameManager();
const searchManager = messageHandler.getSearchManager();
const productManager = messageHandler.getProductManager();

// Initialize the extension
function initializeExtension() {
  // Initialize frame
  frameManager.initializeFrame();
  
  // Setup frame monitoring and event listeners
  frameManager.setupFrameMonitoring();
  
  // Initialize message listeners
  messageHandler.initializeMessageListeners();
  
  console.log('Chrome Extension Content Script Initialized');
}

// Start the extension
initializeExtension();

// Export managers for potential external access (debugging, etc.)
(window as any).__extensionManagers = {
  messageHandler,
  frameManager,
  searchManager,
  productManager
};