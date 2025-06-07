export async function searchAction(selectors: string[], value: string): Promise<boolean> {
  console.log('Executing search action with selectors:', selectors, 'value:', value);
  
  if (selectors.length < 2) {
    console.error('Search action requires at least 2 selectors: input and button');
    return false;
  }
  
  const inputSelector = selectors[0];
  const buttonSelector = selectors[1];
  
  try {
    // Find search input
    const searchInput = document.querySelector(inputSelector) as HTMLInputElement;
    if (!searchInput) {
      console.error(`Search input not found with selector: ${inputSelector}`);
      return false;
    }
    
    // Find search button
    const searchButton = document.querySelector(buttonSelector) as HTMLButtonElement;
    if (!searchButton) {
      console.error(`Search button not found with selector: ${buttonSelector}`);
      return false;
    }
    
    console.log('Found search input and button');
    
    // Scroll input into view
    searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Highlight input briefly
    const originalInputStyle = searchInput.style.cssText;
    searchInput.style.cssText += 'outline: 3px solid #4ecdc4; outline-offset: 2px;';
    
    // Clear existing value and set new value
    searchInput.value = '';
    searchInput.focus();
    
    // Type the value character by character for more realistic behavior
    for (let i = 0; i < value.length; i++) {
      searchInput.value += value[i];
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 50));
    }
    
    // Dispatch additional events
    searchInput.dispatchEvent(new Event('change', { bubbles: true }));
    searchInput.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
    
    console.log(`Entered search value: ${value}`);
    
    // Wait a moment then click search button
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Highlight button briefly
    const originalButtonStyle = searchButton.style.cssText;
    searchButton.style.cssText += 'outline: 3px solid #ff6b6b; outline-offset: 2px;';
    
    // Click search button
    searchButton.click();
    
    console.log('Search button clicked');
    
    // Restore original styles
    setTimeout(() => {
      searchInput.style.cssText = originalInputStyle;
      searchButton.style.cssText = originalButtonStyle;
    }, 1000);
    
    return true;
    
  } catch (error) {
    console.error('Error performing search action:', error);
    return false;
  }
}