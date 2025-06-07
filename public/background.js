// Background script for managing action queue and communication
class ActionQueueManager {
  constructor() {
    this.actionQueue = [];
    this.currentActionId = null;
    this.isProcessing = false;
    this.setupMessageListener();
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep message channel open for async responses
    });
  }

  handleMessage(message, sender, sendResponse) {
    console.log('Background received message:', message);

    switch (message.action) {
      case 'addActionsToQueue':
        this.addActionsToQueue(message.actions);
        sendResponse({ success: true, queueLength: this.actionQueue.length });
        break;

      case 'getNextAction':
        this.getNextAction(sendResponse);
        break;

      case 'actionCompleted':
        this.handleActionCompleted(message, sendResponse);
        break;

      case 'actionFailed':
        this.handleActionFailed(message, sendResponse);
        break;

      case 'clearQueue':
        this.clearQueue();
        sendResponse({ success: true });
        break;

      case 'getQueueStatus':
        sendResponse({
          queueLength: this.actionQueue.length,
          isProcessing: this.isProcessing,
          currentAction: this.currentActionId
        });
        break;

      default:
        sendResponse({ success: false, error: 'Unknown action' });
    }
  }

  addActionsToQueue(actions) {
    // Add unique IDs to actions
    const actionsWithIds = actions.map((action, index) => ({
      ...action,
      id: `action_${Date.now()}_${index}`,
      status: 'pending',
      timestamp: Date.now()
    }));

    this.actionQueue.push(...actionsWithIds);
    console.log('Actions added to queue:', actionsWithIds);
    console.log('Current queue length:', this.actionQueue.length);
  }

  getNextAction(sendResponse) {
    if (this.actionQueue.length === 0) {
      sendResponse({ 
        success: true, 
        action: null, 
        message: 'Queue is empty' 
      });
      return;
    }

    const nextAction = this.actionQueue.shift();
    this.currentActionId = nextAction.id;
    this.isProcessing = true;

    console.log('Returning next action:', nextAction);
    sendResponse({ 
      success: true, 
      action: nextAction,
      remainingActions: this.actionQueue.length
    });
  }

  handleActionCompleted(message, sendResponse) {
    console.log('Action completed:', message.actionId);
    this.currentActionId = null;
    this.isProcessing = false;
    sendResponse({ success: true });
  }

  handleActionFailed(message, sendResponse) {
    console.log('Action failed:', message.actionId, message.error);
    this.clearQueue();
    this.currentActionId = null;
    this.isProcessing = false;
    sendResponse({ success: true, message: 'Queue cleared due to action failure' });
  }

  clearQueue() {
    this.actionQueue = [];
    this.currentActionId = null;
    this.isProcessing = false;
    console.log('Action queue cleared');
  }
}

// Initialize the action queue manager
const actionQueueManager = new ActionQueueManager();

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed, background script ready');
});