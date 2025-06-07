export async function clickAction(selectors: string[]): Promise<boolean> {
  console.log('Executing click action with selectors:', selectors);
  
  for (const selector of selectors) {
    try {
      const element = document.querySelector(selector) as HTMLElement;
      
      if (element) {
        console.log(`Found element with selector: ${selector}`);
        
        // Scroll element into view
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Wait a bit for scroll to complete
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Highlight element briefly for visual feedback
        const originalStyle = element.style.cssText;
        element.style.cssText += 'outline: 3px solid #ff6b6b; outline-offset: 2px;';
        
        setTimeout(() => {
          element.style.cssText = originalStyle;
        }, 1000);
        
        // Simulate click
        element.click();
        
        console.log(`Successfully clicked element: ${selector}`);
        return true;
      }
    } catch (error) {
      console.warn(`Failed to click selector ${selector}:`, error);
    }
  }
  
  console.error('No clickable elements found with provided selectors');
  return false;
}