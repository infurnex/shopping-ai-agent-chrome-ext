import { AIResponse } from '../types/aiTypes';

export class AIService {
  private static instance: AIService;
  private apiEndpoint = 'https://api.example.com/ai'; // Mock endpoint

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  async sendMessage(message: string, image?: string): Promise<AIResponse> {
    // Mock API call - replace with actual AI service
    return this.mockAIResponse(message, image);
  }

  private async mockAIResponse(message: string, image?: string): Promise<AIResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    // Analyze message for action triggers
    const lowerMessage = message.toLowerCase();
    
    // Search action triggers
    if (lowerMessage.includes('search for') || 
        lowerMessage.includes('find') || 
        lowerMessage.includes('look up') ||
        lowerMessage.includes('google')) {
      
      const searchQuery = this.extractSearchQuery(message);
      
      return {
        message: `I'll search for "${searchQuery}" for you. Let me open Google and perform the search.`,
        takeAction: true,
        action: {
          type: 'search',
          query: searchQuery
        }
      };
    }

    // Image analysis responses
    if (image) {
      const imageResponses = [
        "I can see the image you've uploaded. Based on what I observe, this appears to be quite interesting. Would you like me to search for more information about what's shown in the image?",
        "Thanks for sharing that image! I can analyze what I see here. If you'd like me to find similar images or related information, just let me know.",
        "I've analyzed your image. It shows some fascinating details. Would you like me to perform a search to find more information about this topic?",
        "Interesting image! I can see various elements here. If you want me to search for more details about anything specific in this image, just ask."
      ];
      
      return {
        message: imageResponses[Math.floor(Math.random() * imageResponses.length)],
        takeAction: false
      };
    }

    // Regular conversation responses
    const responses = [
      "That's an interesting question! I'm here to help you with information and can also perform web searches if needed.",
      "I understand what you're asking. If you need me to search for specific information, just say 'search for [your query]'.",
      "Great question! I can help you with that. I can also perform web searches - just ask me to 'find' or 'search for' something.",
      "I can definitely help you with that. Let me know if you'd like me to search for any specific information online.",
      "That's a thoughtful inquiry. I'm equipped to have conversations and also perform web searches when you need them."
    ];

    return {
      message: responses[Math.floor(Math.random() * responses.length)],
      takeAction: false
    };
  }

  private extractSearchQuery(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    // Extract query after common search phrases
    const searchPhrases = [
      'search for ',
      'find ',
      'look up ',
      'google ',
      'search ',
      'find me ',
      'look for '
    ];

    for (const phrase of searchPhrases) {
      const index = lowerMessage.indexOf(phrase);
      if (index !== -1) {
        const query = message.substring(index + phrase.length).trim();
        // Remove common ending words
        return query.replace(/\s+(please|for me|online)$/i, '').trim();
      }
    }

    // Fallback: use the entire message as query
    return message.trim();
  }

  // Method to simulate different AI personalities or models
  setPersonality(personality: 'helpful' | 'technical' | 'creative'): void {
    // This could modify response patterns in the future
    console.log(`AI personality set to: ${personality}`);
  }

  // Method to get AI capabilities
  getCapabilities(): string[] {
    return [
      'Natural conversation',
      'Image analysis',
      'Web search automation',
      'Information retrieval',
      'Task automation'
    ];
  }
}