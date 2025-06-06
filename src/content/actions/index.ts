import { searchAction } from './searchAction';

export interface ActionParams {
  query?: string;
  [key: string]: any;
}

export interface Action {
  type: string;
  params: ActionParams;
}

export function browserAction(action: Action): void {
  switch (action.type) {
    case 'search':
      if (action.params.query) {
        searchAction(action.params);
      }
      break;
    default:
      console.warn(`Unknown action type: ${action.type}`);
  }
}