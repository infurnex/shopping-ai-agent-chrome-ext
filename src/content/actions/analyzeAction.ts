export async function analyzeAction(selectors: string[]): Promise<boolean> {
  console.log('Executing analyze action with selectors:', selectors);
  
  const results: any[] = [];
  
  for (const selector of selectors) {
    try {
      const elements = document.querySelectorAll(selector);
      
      if (elements.length > 0) {
        console.log(`Found ${elements.length} elements with selector: ${selector}`);
        
        elements.forEach((element, index) => {
          // Highlight elements briefly for visual feedback
          const originalStyle = (element as HTMLElement).style.cssText;
          (element as HTMLElement).style.cssText += 'outline: 2px solid #45b7d1; outline-offset: 1px;';
          
          setTimeout(() => {
            (element as HTMLElement).style.cssText = originalStyle;
          }, 2000);
          
          // Extract useful information
          const elementInfo = {
            selector,
            index,
            tagName: element.tagName,
            textContent: element.textContent?.trim().substring(0, 100),
            className: element.className,
            id: element.id,
            href: element.getAttribute('href'),
            src: element.getAttribute('src'),
            alt: element.getAttribute('alt')
          };
          
          results.push(elementInfo);
        });
        
        console.log(`Analysis results for ${selector}:`, results.filter(r => r.selector === selector));
        return true;
      }
    } catch (error) {
      console.warn(`Failed to analyze selector ${selector}:`, error);
    }
  }
  
  if (results.length === 0) {
    console.error('No elements found for analysis with provided selectors');
    return false;
  }
  
  console.log('Complete analysis results:', results);
  return true;
}