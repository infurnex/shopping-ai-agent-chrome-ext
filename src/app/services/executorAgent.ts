export interface ExecutorAction {
  goal: string;
  query?: string;
  target?: string;
  [key: string]: any;
}

export interface ExecutorResponse {
  type: string;
  selector: string[];
  value?: string;
  success: boolean;
  message?: string;
}

export async function callExecutorAgent(action: ExecutorAction, currentDom: string): Promise<ExecutorResponse> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));
  
  console.log('Executor processing action:', action);
  console.log('DOM length:', currentDom.length);
  
  // Mock executor responses based on action goal
  switch (action.goal) {
    case 'search':
      return mockSearchExecution(action);
    
    case 'select':
      return mockSelectExecution(action);
    
    case 'click':
      return mockClickExecution(action);
    
    case 'checkout':
      return mockCheckoutExecution(action);
    
    case 'compare':
      return mockCompareExecution(action);
    
    case 'analyze':
      return mockAnalyzeExecution(action);
    
    default:
      return {
        type: 'unknown',
        selector: [],
        success: false,
        message: `Unknown action goal: ${action.goal}`
      };
  }
}

function mockSearchExecution(action: ExecutorAction): ExecutorResponse {
  const hostname = window.location.hostname.toLowerCase();
  
  if (hostname.includes('amazon')) {
    return {
      type: 'search',
      selector: ['#twotabsearchtextbox', '#nav-search-submit-button'],
      value: action.query || '',
      success: true,
      message: `Searching for "${action.query}" on Amazon`
    };
  } else if (hostname.includes('ebay')) {
    return {
      type: 'search',
      selector: ['#gh-ac', '#gh-btn'],
      value: action.query || '',
      success: true,
      message: `Searching for "${action.query}" on eBay`
    };
  } else if (hostname.includes('walmart')) {
    return {
      type: 'search',
      selector: ['[data-automation-id="global-search-input"]', '[data-automation-id="global-search-submit"]'],
      value: action.query || '',
      success: true,
      message: `Searching for "${action.query}" on Walmart`
    };
  } else {
    return {
      type: 'search',
      selector: ['input[type="search"]', 'button[type="submit"]'],
      value: action.query || '',
      success: true,
      message: `Searching for "${action.query}" on ${hostname}`
    };
  }
}

function mockSelectExecution(action: ExecutorAction): ExecutorResponse {
  const hostname = window.location.hostname.toLowerCase();
  
  if (action.target === 'first product') {
    if (hostname.includes('amazon')) {
      return {
        type: 'click',
        selector: ['[data-component-type="s-search-result"] h2 a'],
        success: true,
        message: 'Selecting first product from Amazon search results'
      };
    } else if (hostname.includes('ebay')) {
      return {
        type: 'click',
        selector: ['.s-item__title'],
        success: true,
        message: 'Selecting first product from eBay search results'
      };
    } else {
      return {
        type: 'click',
        selector: ['.product-item', '.product-card', '[data-testid="product"]'],
        success: true,
        message: 'Selecting first product from search results'
      };
    }
  }
  
  return {
    type: 'click',
    selector: ['.product-item', '.search-result-item'],
    success: true,
    message: `Selecting ${action.target}`
  };
}

function mockClickExecution(action: ExecutorAction): ExecutorResponse {
  if (action.target === 'add to cart') {
    const hostname = window.location.hostname.toLowerCase();
    
    if (hostname.includes('amazon')) {
      return {
        type: 'click',
        selector: ['#add-to-cart-button', '[name="submit.add-to-cart"]'],
        success: true,
        message: 'Adding product to Amazon cart'
      };
    } else if (hostname.includes('ebay')) {
      return {
        type: 'click',
        selector: ['#atcBtn_btn_1', '.notranslate'],
        success: true,
        message: 'Adding product to eBay cart'
      };
    } else {
      return {
        type: 'click',
        selector: ['[data-testid="add-to-cart"]', '.add-to-cart', 'button[aria-label*="cart"]'],
        success: true,
        message: 'Adding product to cart'
      };
    }
  }
  
  return {
    type: 'click',
    selector: [`button:contains("${action.target}")`, `[aria-label*="${action.target}"]`],
    success: true,
    message: `Clicking ${action.target}`
  };
}

function mockCheckoutExecution(action: ExecutorAction): ExecutorResponse {
  const hostname = window.location.hostname.toLowerCase();
  
  if (hostname.includes('amazon')) {
    return {
      type: 'navigate',
      selector: ['[data-testid="proceed-to-checkout"]', '#sc-active-cart .sc-proceed-to-checkout'],
      success: true,
      message: 'Proceeding to Amazon checkout'
    };
  } else {
    return {
      type: 'navigate',
      selector: ['.checkout-button', '[data-testid="checkout"]', 'button[aria-label*="checkout"]'],
      success: true,
      message: 'Proceeding to checkout'
    };
  }
}

function mockCompareExecution(action: ExecutorAction): ExecutorResponse {
  return {
    type: 'analyze',
    selector: ['.product-item', '.search-result'],
    success: true,
    message: 'Analyzing and comparing products'
  };
}

function mockAnalyzeExecution(action: ExecutorAction): ExecutorResponse {
  return {
    type: 'analyze',
    selector: ['[data-testid="search-results"]', '.search-results', '.product-grid'],
    success: true,
    message: 'Analyzing search results'
  };
}