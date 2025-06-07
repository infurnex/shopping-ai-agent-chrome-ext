import { searchAction } from './searchAction';
import { clickAction } from './clickAction';
import { navigateAction } from './navigateAction';
import { analyzeAction } from './analyzeAction';

export interface ActionParams {
  selector?: string[];
  value?: string;
  [key: string]: any;
}

export interface ExecutorResult {
  type: string;
  selector: string[];
  value?: string;
  success: boolean;
  message?: string;
}

export async function executeAction(action: any, currentDom: string): Promise<boolean> {
  try {
    console.log('Executing action:', action);
    
    // Import executor agent dynamically
    const { callExecutorAgent } = await import('../services/executorAgent');
    
    // Call executor agent with current DOM
    const executorResult: ExecutorResult = await callExecutorAgent(action, currentDom);
    
    console.log('Executor result:', executorResult);
    
    if (!executorResult.success) {
      console.error('Executor failed:', executorResult.message);
      return false;
    }
    
    // Execute the browser action based on executor result
    const success = await performBrowserAction(executorResult);
    
    return success;
  } catch (error) {
    console.error('Error executing action:', error);
    return false;
  }
}

async function performBrowserAction(executorResult: ExecutorResult): Promise<boolean> {
  try {
    switch (executorResult.type) {
      case 'search':
        return await searchAction(executorResult.selector, executorResult.value || '');
      
      case 'click':
        return await clickAction(executorResult.selector);
      
      case 'navigate':
        return await navigateAction(executorResult.selector);
      
      case 'analyze':
        return await analyzeAction(executorResult.selector);
      
      default:
        console.warn(`Unknown action type: ${executorResult.type}`);
        return false;
    }
  } catch (error) {
    console.error('Error performing browser action:', error);
    return false;
  }
}