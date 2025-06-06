// Search functionality for websites
export class SearchManager {
  
  // Enhanced function to perform search on the website
  performSearch(searchTerm: string) {
    console.log('Performing search for:', searchTerm);
    
    // Common search input selectors (expanded list)
    const searchSelectors = [
      'input[type="search"]',
      'input[name*="search" i]',
      'input[placeholder*="search" i]',
      'input[id*="search" i]',
      'input[class*="search" i]',
      '.search-input input',
      '.search-box input',
      '.search-field input',
      '#search-input',
      '#search-box',
      '#search',
      '.search',
      '[data-testid*="search" i]',
      '[aria-label*="search" i]',
      'input[role="searchbox"]',
      // E-commerce specific selectors
      'input[name="q"]',
      'input[name="query"]',
      'input[name="keywords"]',
      '.searchbox input',
      '.search-form input',
      '#searchbox',
      '.header-search input',
      '.site-search input'
    ];
    
    let searchInput: HTMLInputElement | null = null;
    
    // Try to find search input using various selectors
    for (const selector of searchSelectors) {
      const elements = document.querySelectorAll(selector) as NodeListOf<HTMLInputElement>;
      for (const element of elements) {
        if (element && 
            element.type !== 'hidden' && 
            element.offsetParent !== null &&
            !element.disabled &&
            element.style.display !== 'none') {
          searchInput = element;
          break;
        }
      }
      if (searchInput) break;
    }
    
    if (!searchInput) {
      // Enhanced fallback: look for any visible input that might be a search box
      const allInputs = document.querySelectorAll('input[type="text"], input:not([type])') as NodeListOf<HTMLInputElement>;
      for (const input of allInputs) {
        const isVisible = input.offsetParent !== null && 
                         input.style.display !== 'none' && 
                         !input.disabled;
        
        if (isVisible) {
          const searchIndicators = [
            input.placeholder?.toLowerCase().includes('search'),
            input.name?.toLowerCase().includes('search'),
            input.id?.toLowerCase().includes('search'),
            input.className?.toLowerCase().includes('search'),
            input.getAttribute('aria-label')?.toLowerCase().includes('search'),
            // Check parent elements for search context
            input.closest('.search, .searchbox, .search-form, [class*="search"]') !== null
          ];
          
          if (searchIndicators.some(indicator => indicator)) {
            searchInput = input;
            break;
          }
        }
      }
    }
    
    if (searchInput) {
      try {
        // Scroll to the search input to ensure it's visible
        searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Focus the input with a slight delay
        setTimeout(() => {
          searchInput!.focus();
          
          // Clear existing value
          searchInput!.value = '';
          
          // Set the search term using multiple methods for compatibility
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
          if (nativeInputValueSetter) {
            nativeInputValueSetter.call(searchInput, searchTerm);
          }
          searchInput!.value = searchTerm;
          
          // Trigger comprehensive events
          const events = [
            new Event('input', { bubbles: true, cancelable: true }),
            new Event('change', { bubbles: true, cancelable: true }),
            new KeyboardEvent('keydown', { key: 'a', ctrlKey: true, bubbles: true }),
            new KeyboardEvent('keyup', { key: 'a', ctrlKey: true, bubbles: true }),
            new Event('focus', { bubbles: true }),
            new Event('blur', { bubbles: true })
          ];
          
          events.forEach(event => {
            setTimeout(() => searchInput!.dispatchEvent(event), 50);
          });
          
          // Re-focus after events
          setTimeout(() => {
            searchInput!.focus();
            searchInput!.setSelectionRange(searchTerm.length, searchTerm.length);
          }, 200);
          
          // Try to find and trigger search
          setTimeout(() => {
            this.triggerSearch(searchInput!, searchTerm);
          }, 300);
          
        }, 100);
        
        console.log('Search performed successfully for:', searchTerm);
        
      } catch (error) {
        console.error('Error performing search:', error);
      }
    } else {
      console.warn('No search input found on this page');
      this.tryAlternativeSearchMethods(searchTerm);
    }
  }

  // Function to trigger search submission
  private triggerSearch(searchInput: HTMLInputElement, searchTerm: string) {
    const form = searchInput.closest('form');
    
    // Enhanced search button selectors
    const searchButtonSelectors = [
      'button[type="submit"]',
      'input[type="submit"]',
      'button[aria-label*="search" i]',
      '.search-button',
      '.search-btn',
      '.btn-search',
      '#search-button',
      '#search-btn',
      '[data-testid*="search" i] button',
      'form button',
      '.search-form button',
      '.searchbox button',
      'button[class*="search" i]',
      '.search-submit',
      '.search-go'
    ];
    
    let searchButton: HTMLElement | null = null;
    
    // First, try to find search button within the same form
    if (form) {
      for (const selector of searchButtonSelectors) {
        const button = form.querySelector(selector) as HTMLElement;
        if (button && button.offsetParent !== null && !button.disabled) {
          searchButton = button;
          break;
        }
      }
    }
    
    // If no button found in form, search globally near the input
    if (!searchButton) {
      const inputParent = searchInput.parentElement;
      if (inputParent) {
        for (const selector of searchButtonSelectors) {
          const button = inputParent.querySelector(selector) as HTMLElement;
          if (button && button.offsetParent !== null && !button.disabled) {
            searchButton = button;
            break;
          }
        }
      }
    }
    
    // Global search if still not found
    if (!searchButton) {
      for (const selector of searchButtonSelectors) {
        const buttons = document.querySelectorAll(selector) as NodeListOf<HTMLElement>;
        for (const button of buttons) {
          if (button && button.offsetParent !== null && !button.disabled) {
            // Check if button is near the search input
            const buttonRect = button.getBoundingClientRect();
            const inputRect = searchInput.getBoundingClientRect();
            const distance = Math.sqrt(
              Math.pow(buttonRect.left - inputRect.right, 2) + 
              Math.pow(buttonRect.top - inputRect.top, 2)
            );
            
            if (distance < 200) { // Within 200px
              searchButton = button;
              break;
            }
          }
        }
        if (searchButton) break;
      }
    }
    
    // Execute search
    if (searchButton) {
      console.log('Clicking search button');
      searchButton.click();
      
    } else if (form) {
      console.log('Submitting form');
      form.submit();
      
    } else {
      // Try Enter key as last resort
      console.log('Trying Enter key');
      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true,
        cancelable: true
      });
      searchInput.dispatchEvent(enterEvent);
    }
  }

  // Alternative search methods for sites without traditional search boxes
  private tryAlternativeSearchMethods(searchTerm: string) {
    // Look for search triggers that might open search modals/overlays
    const searchTriggers = [
      '[aria-label*="search" i]',
      '[title*="search" i]',
      '.search-trigger',
      '.search-icon',
      '.search-toggle',
      '[data-search]',
      '.header-search-trigger'
    ];
    
    for (const selector of searchTriggers) {
      const triggers = document.querySelectorAll(selector) as NodeListOf<HTMLElement>;
      for (const trigger of triggers) {
        if (trigger.offsetParent !== null) {
          console.log('Trying search trigger:', trigger);
          trigger.click();
          
          // Wait and try to find search input again
          setTimeout(() => {
            const newSearchInput = document.querySelector('input[type="search"], input[placeholder*="search" i], input[aria-label*="search" i]') as HTMLInputElement;
            if (newSearchInput && newSearchInput.offsetParent !== null) {
              console.log('Found search input after trigger');
              newSearchInput.focus();
              newSearchInput.value = searchTerm;
              
              const inputEvent = new Event('input', { bubbles: true });
              newSearchInput.dispatchEvent(inputEvent);
              
              setTimeout(() => {
                this.triggerSearch(newSearchInput, searchTerm);
              }, 200);
            }
          }, 500);
          
          return; // Try only the first viable trigger
        }
      }
    }
    
    console.warn('No search functionality found on this page');
  }
}