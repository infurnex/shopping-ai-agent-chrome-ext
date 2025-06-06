// AI Service for communicating with external AI agent
export interface AIAction {
  id: string;
  type: 'search' | 'click' | 'navigate' | 'extract' | 'wait' | 'scroll';
  description: string;
  parameters: Record<string, any>;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  timestamp: Date;
}

export interface AIResponse {
  message: string;
  actions: Omit<AIAction, 'id' | 'status' | 'timestamp'>[];
  confidence: number;
  reasoning?: string;
}

export class AIService {
  private apiEndpoint: string;
  private apiKey?: string;

  constructor() {
    // Default to a mock endpoint - can be configured
    this.apiEndpoint = 'https://api.example.com/ai-agent';
    this.loadConfiguration();
  }

  // Load AI service configuration from storage
  private async loadConfiguration() {
    try {
      const config = await this.getFromStorage('ai_config');
      if (config) {
        this.apiEndpoint = config.endpoint || this.apiEndpoint;
        this.apiKey = config.apiKey;
      }
    } catch (error) {
      console.warn('Could not load AI configuration:', error);
    }
  }

  // Send message to AI agent and get response with actions
  async sendMessage(message: string, context?: {
    currentUrl?: string;
    pageTitle?: string;
    userIntent?: string;
  }): Promise<AIResponse> {
    try {
      const payload = {
        message,
        context: {
          currentUrl: window.location.href,
          pageTitle: document.title,
          timestamp: new Date().toISOString(),
          ...context
        },
        user_id: await this.getUserId()
      };

      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`AI Agent responded with status: ${response.status}`);
      }

      const aiResponse: AIResponse = await response.json();
      
      // Validate response structure
      if (!aiResponse.message || !Array.isArray(aiResponse.actions)) {
        throw new Error('Invalid AI response format');
      }

      // Store the actions in local storage
      await this.storeActions(aiResponse.actions, message);

      return aiResponse;

    } catch (error) {
      console.error('Error communicating with AI agent:', error);
      
      // Return fallback response for demo purposes
      return this.getFallbackResponse(message);
    }
  }

  // Store AI actions in local storage
  private async storeActions(actions: Omit<AIAction, 'id' | 'status' | 'timestamp'>[], originalMessage: string) {
    try {
      const actionList: AIAction[] = actions.map((action, index) => ({
        ...action,
        id: `action_${Date.now()}_${index}`,
        status: 'pending' as const,
        timestamp: new Date()
      }));

      // Get existing actions
      const existingActions = await this.getFromStorage('ai_actions') || [];
      
      // Add new actions
      const updatedActions = [...existingActions, ...actionList];
      
      // Keep only last 100 actions to prevent storage bloat
      const trimmedActions = updatedActions.slice(-100);
      
      await this.setInStorage('ai_actions', trimmedActions);
      
      // Store action session info
      await this.setInStorage('last_ai_session', {
        message: originalMessage,
        actionCount: actionList.length,
        timestamp: new Date().toISOString()
      });

      console.log(`Stored ${actionList.length} AI actions in local storage`);
      
    } catch (error) {
      console.error('Error storing AI actions:', error);
    }
  }

  // Get stored actions from local storage
  async getStoredActions(): Promise<AIAction[]> {
    try {
      return await this.getFromStorage('ai_actions') || [];
    } catch (error) {
      console.error('Error retrieving stored actions:', error);
      return [];
    }
  }

  // Update action status
  async updateActionStatus(actionId: string, status: AIAction['status'], result?: any) {
    try {
      const actions = await this.getStoredActions();
      const actionIndex = actions.findIndex(action => action.id === actionId);
      
      if (actionIndex !== -1) {
        actions[actionIndex].status = status;
        if (result) {
          actions[actionIndex].parameters.result = result;
        }
        
        await this.setInStorage('ai_actions', actions);
        console.log(`Updated action ${actionId} status to ${status}`);
      }
    } catch (error) {
      console.error('Error updating action status:', error);
    }
  }

  // Clear stored actions
  async clearStoredActions() {
    try {
      await this.setInStorage('ai_actions', []);
      console.log('Cleared all stored AI actions');
    } catch (error) {
      console.error('Error clearing stored actions:', error);
    }
  }

  // Get pending actions
  async getPendingActions(): Promise<AIAction[]> {
    const actions = await this.getStoredActions();
    return actions.filter(action => action.status === 'pending');
  }

  // Fallback response for when AI agent is unavailable
  private getFallbackResponse(message: string): AIResponse {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('search') || lowerMessage.includes('find')) {
      const searchTerm = message.replace(/search|find|for|the/gi, '').trim();
      return {
        message: `I'll help you search for "${searchTerm}". Let me break this down into steps.`,
        actions: [
          {
            type: 'search',
            description: `Search for "${searchTerm}" on the current website`,
            parameters: { searchTerm, method: 'auto' }
          },
          {
            type: 'wait',
            description: 'Wait for search results to load',
            parameters: { duration: 2000 }
          },
          {
            type: 'click',
            description: 'Click on the first relevant product',
            parameters: { target: 'first_product', searchTerm }
          }
        ],
        confidence: 0.8,
        reasoning: 'Detected search intent, will perform automated search and product selection'
      };
    }

    if (lowerMessage.includes('buy') || lowerMessage.includes('purchase')) {
      return {
        message: 'I can help you find and select products to purchase. What are you looking for?',
        actions: [
          {
            type: 'extract',
            description: 'Extract product information from current page',
            parameters: { target: 'product_details' }
          }
        ],
        confidence: 0.7,
        reasoning: 'Detected purchase intent, will extract product information'
      };
    }

    return {
      message: 'I understand you want me to help with browsing. Could you be more specific about what you\'d like me to do?',
      actions: [],
      confidence: 0.5,
      reasoning: 'Generic response due to unclear intent'
    };
  }

  // Helper methods for storage
  private async getFromStorage(key: string): Promise<any> {
    return new Promise((resolve) => {
      chrome.storage.local.get([key], (result) => {
        resolve(result[key]);
      });
    });
  }

  private async setInStorage(key: string, value: any): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: value }, () => {
        resolve();
      });
    });
  }

  // Get or generate user ID
  private async getUserId(): Promise<string> {
    let userId = await this.getFromStorage('user_id');
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await this.setInStorage('user_id', userId);
    }
    return userId;
  }

  // Configure AI service
  async configure(endpoint: string, apiKey?: string) {
    this.apiEndpoint = endpoint;
    this.apiKey = apiKey;
    
    await this.setInStorage('ai_config', {
      endpoint,
      apiKey
    });
    
    console.log('AI service configured with new endpoint');
  }
}