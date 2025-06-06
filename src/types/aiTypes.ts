export interface AIResponse {
  message: string;
  takeAction: boolean;
  action?: {
    type: string;
    query?: string;
    [key: string]: any;
  };
}

export interface ActionModule {
  execute(params: any): Promise<void>;
}