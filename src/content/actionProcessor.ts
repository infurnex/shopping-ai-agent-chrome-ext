export class ActionProcessor {
  private isProcessing = false;
  private currentActionId: string | null = null;
  private processingInterval: number | null = null;

  constructor() {
    this.startProcessingLoop();
  }

  startProcessingLoop(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }

    // Check for new actions every 2 seconds
    this.processingInterval = window.setInterval(() => {
      if (!this.isProcessing) {
        this.processNextAction();
      }
    }, 2000);

    console.log('Action processing loop started');
  }

  stopProcessingLoop(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    console.log('Action processing loop stopped');
  }

  async processNextAction(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    try {
      this.isProcessing = true;

      // Request next action from background script
      const response = await this.sendMessageToBackground({
        action: 'getNextAction'
      });

      if (!response.success) {
        console.error('Failed to get next action:', response.error);
        return;
      }

      if (!response.action) {
        // No more actions in queue
        console.log('No more actions to process');
        return;
      }

      const actionToProcess = response.action;
      this.currentActionId = actionToProcess.id;

      console.log('Processing action:', actionToProcess);

      // Get current DOM
      const currentDom = document.documentElement.outerHTML;

      // Execute the action
      const { executeAction } = await import('./actions/index');
      const success = await executeAction(actionToProcess, currentDom);

      if (success) {
        console.log('Action completed successfully:', actionToProcess.id);
        
        // Notify background script of completion
        await this.sendMessageToBackground({
          action: 'actionCompleted',
          actionId: actionToProcess.id
        });

        // Send success message to frame
        this.sendMessageToFrame({
          action: 'actionCompleted',
          actionData: actionToProcess,
          success: true
        });

      } else {
        console.error('Action failed:', actionToProcess.id);
        
        // Notify background script of failure
        await this.sendMessageToBackground({
          action: 'actionFailed',
          actionId: actionToProcess.id,
          error: 'Action execution failed'
        });

        // Send failure message to frame
        this.sendMessageToFrame({
          action: 'actionFailed',
          actionData: actionToProcess,
          error: 'Action execution failed'
        });

        // Stop processing on failure
        this.stopProcessingLoop();
      }

    } catch (error) {
      console.error('Error processing action:', error);
      
      if (this.currentActionId) {
        await this.sendMessageToBackground({
          action: 'actionFailed',
          actionId: this.currentActionId,
          error: error.message
        });
      }

      this.stopProcessingLoop();
    } finally {
      this.isProcessing = false;
      this.currentActionId = null;
    }
  }

  async addActionsToQueue(actions: any[]): Promise<void> {
    try {
      const response = await this.sendMessageToBackground({
        action: 'addActionsToQueue',
        actions: actions
      });

      if (response.success) {
        console.log(`Added ${actions.length} actions to queue. Queue length: ${response.queueLength}`);
        
        // Start processing if not already running
        if (!this.processingInterval) {
          this.startProcessingLoop();
        }
      } else {
        console.error('Failed to add actions to queue:', response.error);
      }
    } catch (error) {
      console.error('Error adding actions to queue:', error);
    }
  }

  async clearQueue(): Promise<void> {
    try {
      await this.sendMessageToBackground({
        action: 'clearQueue'
      });
      
      this.stopProcessingLoop();
      console.log('Action queue cleared');
    } catch (error) {
      console.error('Error clearing queue:', error);
    }
  }

  async getQueueStatus(): Promise<any> {
    try {
      const response = await this.sendMessageToBackground({
        action: 'getQueueStatus'
      });
      
      return response;
    } catch (error) {
      console.error('Error getting queue status:', error);
      return { queueLength: 0, isProcessing: false };
    }
  }

  private sendMessageToBackground(message: any): Promise<any> {
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

  private sendMessageToFrame(message: any): void {
    const frameElement = document.getElementById('react-frame-host');
    if (frameElement) {
      const iframe = frameElement.shadowRoot?.querySelector('iframe') as HTMLIFrameElement;
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage(message, '*');
      }
    }
  }

  destroy(): void {
    this.stopProcessingLoop();
    this.isProcessing = false;
    this.currentActionId = null;
  }
}