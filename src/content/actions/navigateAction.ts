export async function navigateAction(selectors: string[]): Promise<boolean> {
  console.log('Executing navigate action with selectors:', selectors);
  
  for (const selector of selectors) {
    try {
      const element = document.querySelector(selector) as HTMLElement;
      
      if (element) {
        console.log(`Found navigation element with selector: ${selector}`);
        
        // Scroll element into view
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Wait a bit for scroll to complete
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Highlight element briefly for visual feedback
        const originalStyle = element.style.cssText;
        element.style.cssText += 'outline: 3px solid #4ecdc4; outline-offset: 2px;';
        
        setTimeout(() => {
          element.style.cssText = originalStyle;
        }, 1000);
        
        // Check if it's a link or button
        if (element.tagName === 'A' && element.getAttribute('href')) {
          // For links, navigate to href
          const href = element.getAttribute('href');
          if (href?.startsWith('http') || href?.startsWith('/')) {
            window.location.href = href;
          } else {
            element.click();
          }
        } else {
          // For buttons or other elements, click them
          element.click();
        }
        
        console.log(`Successfully navigated using element: ${selector}`);
        return true;
      }
    } catch (error) {
      console.warn(`Failed to navigate with selector ${selector}:`, error);
    }
  }
  
  console.error('No navigation elements found with provided selectors');
  return false;
}