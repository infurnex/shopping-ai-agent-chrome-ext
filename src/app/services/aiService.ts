export interface AIResponse {
  message: string;
  takeAction: boolean;
  action?: {
    type: string;
    params: {
      query?: string;
      [key: string]: any;
    };
  };
}

export async function callAIAgent(userMessage: string, hasImage: boolean = false): Promise<AIResponse> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  // Mock AI responses based on user input
  const lowerMessage = userMessage.toLowerCase();
  
  // Check if user is asking for a search
  const searchKeywords = ['search for', 'find', 'look for', 'buy', 'purchase', 'shop for'];
  const isSearchQuery = searchKeywords.some(keyword => lowerMessage.includes(keyword));
  
  if (isSearchQuery) {
    // Extract search query
    let query = userMessage;
    
    // Try to extract the actual search term
    for (const keyword of searchKeywords) {
      if (lowerMessage.includes(keyword)) {
        const index = lowerMessage.indexOf(keyword);
        query = userMessage.substring(index + keyword.length).trim();
        break;
      }
    }
    
    // Clean up the query
    query = query.replace(/^(a |an |the )/i, '').trim();
    
    return {
      message: `I'll help you search for "${query}". Let me find that for you on this website.`,
      takeAction: true,
      action: {
        type: 'search',
        params: {
          query: query
        }
      }
    };
  }
  
  // Handle image uploads
  if (hasImage) {
    const imageResponses = [
      "I can see the image you've uploaded. Based on what I observe, I can help you find similar products.",
      "Thanks for sharing that image! I can analyze what I see and help you search for similar items.",
      "Interesting image! Let me help you find products related to what I see here.",
      "I've analyzed your image. Would you like me to search for similar products?"
    ];
    
    return {
      message: imageResponses[Math.floor(Math.random() * imageResponses.length)],
      takeAction: false
    };
  }
  
  // General conversation responses
  const generalResponses = [
    "That's an interesting question! How can I help you find what you're looking for?",
    "I understand. Is there something specific you'd like me to search for?",
    "Great question! I can help you search for products or answer questions about shopping.",
    "I'm here to help! Try asking me to search for something like 'search for wireless headphones'.",
    "I can assist you with finding products. Just tell me what you're looking for!"
  ];
  
  return {
    message: generalResponses[Math.floor(Math.random() * generalResponses.length)],
    takeAction: false
  };
}