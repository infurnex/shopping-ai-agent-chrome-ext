import { ActionModule } from '../../types/aiTypes';

export class SearchActionModule implements ActionModule {
  async execute(params: { query: string }): Promise<void> {
    try {
      console.log(`Executing search action with query: "${params.query}"`);
      
      // Check if we're on Google search page
      if (window.location.hostname.includes('google.com')) {
        this.performGoogleSearch(params.query);
      } else {
        // Navigate to Google and search
        this.navigateToGoogleSearch(params.query);
      }
    } catch (error) {
      console.error('Error executing search action:', error);
    }
  }

  private performGoogleSearch(query: string): void {
    // Try to find the search input field
    const searchInput = document.querySelector('input[name="q"]') as HTMLInputElement ||
                       document.querySelector('textarea[name="q"]') as HTMLTextAreaElement ||
                       document.querySelector('[role="combobox"]') as HTMLInputElement;
    
    if (searchInput) {
      // Clear existing search and enter new query
      searchInput.value = query;
      searchInput.focus();
      
      // Trigger input event
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      
      // Try to submit the search
      setTimeout(() => {
        // Look for search button or form
        const searchButton = document.querySelector('input[type="submit"][value*="Search"]') ||
                           document.querySelector('button[type="submit"]') ||
                           document.querySelector('[role="button"][aria-label*="Search"]');
        
        if (searchButton) {
          (searchButton as HTMLElement).click();
        } else {
          // Fallback: press Enter
          searchInput.dispatchEvent(new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            bubbles: true
          }));
        }
      }, 500);
    } else {
      // Fallback to navigation
      this.navigateToGoogleSearch(query);
    }
  }

  private navigateToGoogleSearch(query: string): void {
    const encodedQuery = encodeURIComponent(query);
    const searchUrl = `https://www.google.com/search?q=${encodedQuery}`;
    
    // Navigate to Google search
    window.location.href = searchUrl;
  }

  // Additional helper methods for more sophisticated search actions
  private async waitForElement(selector: string, timeout: number = 5000): Promise<Element | null> {
    return new Promise((resolve) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }

      const observer = new MutationObserver(() => {
        const element = document.querySelector(selector);
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      // Timeout fallback
      setTimeout(() => {
        observer.disconnect();
        resolve(null);
      }, timeout);
    });
  }

  // Method to extract search results (for future use)
  extractSearchResults(): Array<{ title: string; url: string; snippet: string }> {
    const results: Array<{ title: string; url: string; snippet: string }> = [];
    
    // Google search result selectors
    const resultElements = document.querySelectorAll('div[data-ved] h3');
    
    resultElements.forEach((titleElement) => {
      const linkElement = titleElement.closest('a') as HTMLAnchorElement;
      const snippetElement = titleElement.closest('[data-ved]')?.querySelector('[data-sncf]');
      
      if (linkElement && titleElement.textContent) {
        results.push({
          title: titleElement.textContent.trim(),
          url: linkElement.href,
          snippet: snippetElement?.textContent?.trim() || ''
        });
      }
    });
    
    return results;
  }
}