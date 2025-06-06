// Product finding and clicking functionality
export class ProductManager {
  
  // Enhanced function to find and click the first product
  findAndClickFirstProduct(searchTerm: string = 'product') {
    console.log('Looking for first product related to:', searchTerm);
    
    // Wait for search results to load
    setTimeout(() => {
      // Comprehensive product selectors for various e-commerce sites
      const productSelectors = [
        // Generic product selectors
        '.product',
        '.product-item',
        '.product-card',
        '.product-tile',
        '.product-container',
        '.item',
        '.listing',
        '.search-result',
        '.result-item',
        
        // Amazon specific
        '[data-component-type="s-search-result"]',
        '.s-result-item',
        '.a-section.a-spacing-base',
        
        // eBay specific
        '.s-item',
        '.srp-results .s-item',
        
        // Walmart specific
        '[data-testid="item"]',
        '.search-result-gridview-item',
        
        // Target specific
        '[data-test="product-card"]',
        '.ProductCard',
        
        // Best Buy specific
        '.sku-item',
        '.sr-item',
        
        // Generic e-commerce patterns
        '[class*="product"]',
        '[class*="item"]',
        '[data-testid*="product"]',
        '[data-test*="product"]',
        '.grid-item',
        '.catalog-item',
        '.merchandise',
        '.goods',
        
        // Link-based selectors (for product links)
        'a[href*="/product"]',
        'a[href*="/item"]',
        'a[href*="/p/"]',
        'a[href*="/dp/"]', // Amazon
        'a[href*="/gp/"]', // Amazon
        'a[href*="/itm/"]', // eBay
      ];
      
      let firstProduct: HTMLElement | null = null;
      let productLink: HTMLAnchorElement | null = null;
      
      // Try to find the first visible product
      for (const selector of productSelectors) {
        const products = document.querySelectorAll(selector) as NodeListOf<HTMLElement>;
        
        for (const product of products) {
          // Check if product is visible and not an ad
          if (this.isElementVisible(product) && !this.isAdvertisement(product)) {
            // Check if it's already a clickable link
            if (product.tagName.toLowerCase() === 'a') {
              productLink = product as HTMLAnchorElement;
              firstProduct = product;
              break;
            }
            
            // Look for clickable elements within the product
            const clickableElements = product.querySelectorAll('a, button, [role="button"]') as NodeListOf<HTMLElement>;
            for (const clickable of clickableElements) {
              if (this.isProductLink(clickable) && this.isElementVisible(clickable)) {
                firstProduct = product;
                productLink = clickable as HTMLAnchorElement;
                break;
              }
            }
            
            if (firstProduct) break;
          }
        }
        
        if (firstProduct) break;
      }
      
      // If no specific product found, try more generic approaches
      if (!firstProduct) {
        // Look for any clickable elements that might be products
        const allLinks = document.querySelectorAll('a[href]') as NodeListOf<HTMLAnchorElement>;
        
        for (const link of allLinks) {
          if (this.isElementVisible(link) && 
              this.isProductLink(link) && 
              !this.isAdvertisement(link) &&
              this.isLikelyProductResult(link, searchTerm)) {
            firstProduct = link;
            productLink = link;
            break;
          }
        }
      }
      
      if (firstProduct && productLink) {
        console.log('Found first product, clicking:', firstProduct);
        
        // Scroll to the product to ensure it's visible
        firstProduct.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        
        // Highlight the product briefly for visual feedback
        this.highlightElement(firstProduct);
        
        // Click the product after a short delay
        setTimeout(() => {
          try {
            // Try multiple click methods for better compatibility
            productLink!.click();
            
            // Fallback: dispatch click event
            const clickEvent = new MouseEvent('click', {
              bubbles: true,
              cancelable: true,
              view: window
            });
            productLink!.dispatchEvent(clickEvent);
            
            // If it's a link, we can also try navigation
            if (productLink!.href) {
              console.log('Navigating to product:', productLink!.href);
              // Let the click handle navigation naturally
            }
            
            console.log('Successfully clicked first product');
            
            // Send feedback to the chat
            this.sendProductClickFeedback(searchTerm, true);
            
          } catch (error) {
            console.error('Error clicking product:', error);
            this.sendProductClickFeedback(searchTerm, false);
          }
        }, 1000);
        
      } else {
        console.warn('No products found on this page');
        this.sendProductClickFeedback(searchTerm, false);
      }
      
    }, 2000); // Wait 2 seconds for search results to load
  }

  // Helper function to check if element is visible
  private isElementVisible(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    
    return (
      rect.width > 0 &&
      rect.height > 0 &&
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0' &&
      element.offsetParent !== null
    );
  }

  // Helper function to check if element is an advertisement
  private isAdvertisement(element: HTMLElement): boolean {
    const adIndicators = [
      'ad', 'ads', 'advertisement', 'sponsored', 'promo', 'promotion',
      'banner', 'commercial', 'marketing'
    ];
    
    const elementText = element.textContent?.toLowerCase() || '';
    const className = element.className?.toLowerCase() || '';
    const id = element.id?.toLowerCase() || '';
    
    return adIndicators.some(indicator => 
      elementText.includes(indicator) ||
      className.includes(indicator) ||
      id.includes(indicator)
    );
  }

  // Helper function to check if element is a product link
  private isProductLink(element: HTMLElement): boolean {
    if (element.tagName.toLowerCase() !== 'a') {
      return false;
    }
    
    const link = element as HTMLAnchorElement;
    const href = link.href?.toLowerCase() || '';
    
    // Check for product-related URL patterns
    const productPatterns = [
      '/product', '/item', '/p/', '/dp/', '/gp/', '/itm/',
      'product-', 'item-', 'sku-', 'catalog'
    ];
    
    return productPatterns.some(pattern => href.includes(pattern));
  }

  // Helper function to check if link is likely a product result
  private isLikelyProductResult(element: HTMLElement, searchTerm: string): boolean {
    const text = element.textContent?.toLowerCase() || '';
    const searchWords = searchTerm.toLowerCase().split(' ');
    
    // Check if the element contains words from the search term
    const containsSearchTerms = searchWords.some(word => 
      word.length > 2 && text.includes(word)
    );
    
    // Check if it's in a results area
    const isInResults = element.closest([
      '.search-results',
      '.results',
      '.product-list',
      '.listing-results',
      '[class*="result"]',
      '[class*="search"]'
    ].join(', ')) !== null;
    
    return containsSearchTerms || isInResults;
  }

  // Helper function to highlight element
  private highlightElement(element: HTMLElement) {
    const originalStyle = {
      outline: element.style.outline,
      boxShadow: element.style.boxShadow
    };
    
    // Add highlight
    element.style.outline = '3px solid #10b981';
    element.style.boxShadow = '0 0 0 6px rgba(16, 185, 129, 0.3)';
    
    // Remove highlight after 2 seconds
    setTimeout(() => {
      element.style.outline = originalStyle.outline;
      element.style.boxShadow = originalStyle.boxShadow;
    }, 2000);
  }

  // Function to send feedback to the chat
  private sendProductClickFeedback(searchTerm: string, success: boolean) {
    window.postMessage({
      action: 'productClickResult',
      searchTerm,
      success,
      message: success 
        ? `Successfully found and clicked the first product for "${searchTerm}"`
        : `Could not find any products for "${searchTerm}" on this page`
    }, '*');
  }
}