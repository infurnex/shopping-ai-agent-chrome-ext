export interface PlannerAction {
  goal: string;
  query?: string;
  target?: string;
  [key: string]: any;
}

export interface PlannerResponse {
  message: string;
  actions: PlannerAction[];
}

export async function callPlannerAgent(userMessage: string, hasImage: boolean = false): Promise<PlannerResponse> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 2000));
  
  const lowerMessage = userMessage.toLowerCase();
  
  // Mock planner responses based on user input
  if (lowerMessage.includes('buy') || lowerMessage.includes('purchase') || lowerMessage.includes('shop')) {
    const productQuery = extractProductQuery(userMessage);
    
    return {
      message: `I'll help you buy "${productQuery}". Let me break this down into steps: first I'll search for the product, then select the best option, add it to cart, and proceed to checkout.`,
      actions: [
        { goal: "search", query: productQuery },
        { goal: "select", target: "first product" },
        { goal: "click", target: "add to cart" },
        { goal: "checkout" }
      ]
    };
  }
  
  if (lowerMessage.includes('search') || lowerMessage.includes('find') || lowerMessage.includes('look for')) {
    const searchQuery = extractProductQuery(userMessage);
    
    return {
      message: `I'll search for "${searchQuery}" and show you the results.`,
      actions: [
        { goal: "search", query: searchQuery },
        { goal: "select", target: "show results" }
      ]
    };
  }
  
  if (lowerMessage.includes('compare')) {
    const productQuery = extractProductQuery(userMessage);
    
    return {
      message: `I'll help you compare different "${productQuery}" options by searching and analyzing the results.`,
      actions: [
        { goal: "search", query: productQuery },
        { goal: "select", target: "multiple products" },
        { goal: "compare", target: "selected products" }
      ]
    };
  }
  
  // Default response for complex requests
  return {
    message: "I understand your request. Let me create a plan to help you with that.",
    actions: [
      { goal: "search", query: extractProductQuery(userMessage) || "general search" },
      { goal: "analyze", target: "search results" }
    ]
  };
}

function extractProductQuery(message: string): string {
  const lowerMessage = message.toLowerCase();
  const keywords = ['search for', 'find', 'look for', 'buy', 'purchase', 'shop for', 'compare'];
  
  for (const keyword of keywords) {
    if (lowerMessage.includes(keyword)) {
      const index = lowerMessage.indexOf(keyword);
      let query = message.substring(index + keyword.length).trim();
      
      // Clean up the query
      query = query.replace(/^(a |an |the )/i, '').trim();
      return query || 'product';
    }
  }
  
  // Fallback: try to extract meaningful words
  const words = message.split(' ').filter(word => 
    word.length > 2 && 
    !['the', 'and', 'for', 'with', 'can', 'you', 'help', 'me', 'please'].includes(word.toLowerCase())
  );
  
  return words.slice(0, 3).join(' ') || 'product';
}