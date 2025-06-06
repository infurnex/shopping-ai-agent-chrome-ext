import { SearchActionModule } from './searchActionModule';
import { ActionModule } from '../../types/aiTypes';

export class ActionModuleManager {
  private modules: Map<string, ActionModule> = new Map();

  constructor() {
    // Register available action modules
    this.modules.set('search', new SearchActionModule());
  }

  async executeAction(type: string, params: any): Promise<void> {
    const module = this.modules.get(type);
    
    if (!module) {
      console.warn(`Action module not found for type: ${type}`);
      return;
    }

    try {
      await module.execute(params);
      console.log(`Successfully executed action: ${type}`);
    } catch (error) {
      console.error(`Error executing action ${type}:`, error);
    }
  }

  getAvailableActions(): string[] {
    return Array.from(this.modules.keys());
  }

  registerModule(type: string, module: ActionModule): void {
    this.modules.set(type, module);
  }
}