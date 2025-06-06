import { ActionParams } from './index';

export function searchAction(params: ActionParams): void {
  const { query } = params;
  
  if (!query) {
    console.warn('Search action called without query parameter');
    return;
  }

  // Detect the current website and perform appropriate search
  const hostname = window.location.hostname.toLowerCase();
  
  try {
    if (hostname.includes('amazon')) {
      performAmazonSearch(query);
    } else if (hostname.includes('ebay')) {
      performEbaySearch(query);
    } else if (hostname.includes('walmart')) {
      performWalmartSearch(query);
    } else if (hostname.includes('target')) {
      performTargetSearch(query);
    } else {
      // Default to Google search if on unsupported site
      performGoogleSearch(query);
    }
  } catch (error) {
    console.error('Error performing search action:', error);
    // Fallback to Google search
    performGoogleSearch(query);
  }
}

function performAmazonSearch(query: string): void {
  // Try to find Amazon's search input
  const searchInput = document.querySelector('#twotabsearchtextbox') as HTMLInputElement;
  const searchButton = document.querySelector('#nav-search-submit-button') as HTMLButtonElement;
  
  if (searchInput && searchButton) {
    searchInput.value = query;
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    searchButton.click();
  } else {
    // Fallback: navigate to search URL
    window.location.href = `https://www.amazon.com/s?k=${encodeURIComponent(query)}`;
  }
}

function performEbaySearch(query: string): void {
  const searchInput = document.querySelector('#gh-ac') as HTMLInputElement;
  const searchButton = document.querySelector('#gh-btn') as HTMLButtonElement;
  
  if (searchInput && searchButton) {
    searchInput.value = query;
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    searchButton.click();
  } else {
    window.location.href = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}`;
  }
}

function performWalmartSearch(query: string): void {
  const searchInput = document.querySelector('[data-automation-id="global-search-input"]') as HTMLInputElement;
  const searchButton = document.querySelector('[data-automation-id="global-search-submit"]') as HTMLButtonElement;
  
  if (searchInput && searchButton) {
    searchInput.value = query;
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    searchButton.click();
  } else {
    window.location.href = `https://www.walmart.com/search?q=${encodeURIComponent(query)}`;
  }
}

function performTargetSearch(query: string): void {
  const searchInput = document.querySelector('[data-test="@web/Search/SearchInput"]') as HTMLInputElement;
  
  if (searchInput) {
    searchInput.value = query;
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    
    // Simulate Enter key press
    const enterEvent = new KeyboardEvent('keydown', {
      key: 'Enter',
      code: 'Enter',
      keyCode: 13,
      bubbles: true
    });
    searchInput.dispatchEvent(enterEvent);
  } else {
    window.location.href = `https://www.target.com/s?searchTerm=${encodeURIComponent(query)}`;
  }
}

function performGoogleSearch(query: string): void {
  // Open Google search in new tab
  window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
}