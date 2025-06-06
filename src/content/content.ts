// Function to create and inject the frame
function injectFrame() {
  // Create shadow root to isolate styles
  const hostElement = document.createElement('div');
  hostElement.id = 'react-frame-host';
  document.body.appendChild(hostElement);
  
  // Apply initial styles to the host element
  Object.assign(hostElement.style, {
    position: 'fixed',
    bottom: '20px',
    left: '20px',
    width: '380px', // Increased width for better chat experience
    height: '500px', // Increased height for better chat experience
    zIndex: '2147483647', // Max z-index
    border: 'none',
    margin: '0',
    padding: '0',
    overflow: 'hidden',
    pointerEvents: 'auto',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', // Smooth transitions
  });
  
  // Create shadow DOM
  const shadow = hostElement.attachShadow({ mode: 'closed' });
  
  // Create iframe inside shadow DOM
  const iframe = document.createElement('iframe');
  iframe.id = 'react-frame-iframe';
  
  // Set iframe attributes
  iframe.frameBorder = '0';
  iframe.allowTransparency = 'true';
  
  // Set iframe styles
  Object.assign(iframe.style, {
    width: '100%',
    height: '100%',
    border: 'none',
    borderRadius: '16px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    background: 'transparent',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  });
  
  // Set iframe source to the extension's frame.html
  iframe.src = chrome.runtime.getURL('frame.html');
  
  // Append iframe to shadow DOM
  shadow.appendChild(iframe);
  
  // Add drag functionality
  enableDragging(hostElement);
  
  // Listen for resize messages from the React app
  window.addEventListener('message', (event) => {
    if (event.data.action === 'resize') {
      handleFrameResize(hostElement, event.data.isCollapsed);
    } else if (event.data.action === 'close') {
      handleFrameClose(hostElement);
    } else if (event.data.action === 'performSearch') {
      performSearch(event.data.searchTerm);
    }
  });
  
  return { hostElement, iframe };
}

// Function to perform search on the website
function performSearch(searchTerm: string) {
  console.log('Performing search for:', searchTerm);
  
  // Common search input selectors
  const searchSelectors = [
    'input[type="search"]',
    'input[name*="search" i]',
    'input[placeholder*="search" i]',
    'input[id*="search" i]',
    'input[class*="search" i]',
    '.search-input input',
    '.search-box input',
    '#search-input',
    '#search-box',
    '#search',
    '.search',
    '[data-testid*="search" i]',
    '[aria-label*="search" i]',
    'input[role="searchbox"]'
  ];
  
  let searchInput: HTMLInputElement | null = null;
  
  // Try to find search input using various selectors
  for (const selector of searchSelectors) {
    const element = document.querySelector(selector) as HTMLInputElement;
    if (element && element.type !== 'hidden' && element.offsetParent !== null) {
      searchInput = element;
      break;
    }
  }
  
  if (!searchInput) {
    // Fallback: look for any visible input that might be a search box
    const allInputs = document.querySelectorAll('input[type="text"], input:not([type])') as NodeListOf<HTMLInputElement>;
    for (const input of allInputs) {
      if (input.offsetParent !== null && 
          (input.placeholder?.toLowerCase().includes('search') ||
           input.name?.toLowerCase().includes('search') ||
           input.id?.toLowerCase().includes('search') ||
           input.className?.toLowerCase().includes('search'))) {
        searchInput = input;
        break;
      }
    }
  }
  
  if (searchInput) {
    try {
      // Focus the input
      searchInput.focus();
      
      // Clear existing value
      searchInput.value = '';
      
      // Set the search term
      searchInput.value = searchTerm;
      
      // Trigger input events to ensure the website recognizes the change
      const inputEvent = new Event('input', { bubbles: true, cancelable: true });
      const changeEvent = new Event('change', { bubbles: true, cancelable: true });
      
      searchInput.dispatchEvent(inputEvent);
      searchInput.dispatchEvent(changeEvent);
      
      // Try to find and click search button
      const searchButtonSelectors = [
        'button[type="submit"]',
        'input[type="submit"]',
        'button[aria-label*="search" i]',
        '.search-button',
        '.search-btn',
        '#search-button',
        '#search-btn',
        '[data-testid*="search" i] button',
        'form button',
        '.search-form button'
      ];
      
      let searchButton: HTMLElement | null = null;
      const form = searchInput.closest('form');
      
      // First, try to find search button within the same form
      if (form) {
        for (const selector of searchButtonSelectors) {
          const button = form.querySelector(selector) as HTMLElement;
          if (button && button.offsetParent !== null) {
            searchButton = button;
            break;
          }
        }
      }
      
      // If no button found in form, search globally
      if (!searchButton) {
        for (const selector of searchButtonSelectors) {
          const button = document.querySelector(selector) as HTMLElement;
          if (button && button.offsetParent !== null) {
            searchButton = button;
            break;
          }
        }
      }
      
      // Click the search button or submit the form
      if (searchButton) {
        setTimeout(() => {
          searchButton!.click();
        }, 100);
      } else if (form) {
        // If no button found, try submitting the form
        setTimeout(() => {
          form.submit();
        }, 100);
      } else {
        // As a last resort, try pressing Enter
        setTimeout(() => {
          const enterEvent = new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            bubbles: true,
            cancelable: true
          });
          searchInput!.dispatchEvent(enterEvent);
          
          const enterUpEvent = new KeyboardEvent('keyup', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            bubbles: true,
            cancelable: true
          });
          searchInput!.dispatchEvent(enterUpEvent);
        }, 100);
      }
      
      console.log('Search performed successfully for:', searchTerm);
      
    } catch (error) {
      console.error('Error performing search:', error);
    }
  } else {
    console.warn('No search input found on this page');
    
    // Try alternative approach: look for search links or buttons that might open search
    const searchTriggers = document.querySelectorAll('[aria-label*="search" i], [title*="search" i], .search-trigger, .search-icon');
    if (searchTriggers.length > 0) {
      const trigger = searchTriggers[0] as HTMLElement;
      trigger.click();
      
      // Wait a bit and try to find search input again
      setTimeout(() => {
        const newSearchInput = document.querySelector('input[type="search"], input[placeholder*="search" i]') as HTMLInputElement;
        if (newSearchInput) {
          newSearchInput.focus();
          newSearchInput.value = searchTerm;
          
          const inputEvent = new Event('input', { bubbles: true });
          newSearchInput.dispatchEvent(inputEvent);
          
          // Try to submit
          setTimeout(() => {
            const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
            newSearchInput.dispatchEvent(enterEvent);
          }, 100);
        }
      }, 500);
    }
  }
}

// Function to handle frame resizing
function handleFrameResize(hostElement: HTMLElement, isCollapsed: boolean) {
  if (isCollapsed) {
    // Collapsed state - just show header
    hostElement.style.width = '320px';
    hostElement.style.height = '48px';
  } else {
    // Expanded state - full chat window
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Responsive sizing based on viewport
    let width = '380px';
    let height = '500px';
    
    // Adjust for smaller screens
    if (viewportWidth < 768) {
      width = Math.min(viewportWidth - 40, 350) + 'px';
      height = Math.min(viewportHeight - 100, 450) + 'px';
    } else if (viewportWidth < 1024) {
      width = '360px';
      height = '480px';
    }
    
    hostElement.style.width = width;
    hostElement.style.height = height;
    
    // Ensure frame stays within viewport bounds after resize
    ensureFrameInBounds(hostElement);
  }
}

// Function to handle frame closing
function handleFrameClose(hostElement: HTMLElement) {
  // Animate out and remove
  hostElement.style.transform = 'translateY(100%) scale(0.95)';
  hostElement.style.opacity = '0';
  
  setTimeout(() => {
    if (hostElement.parentNode) {
      hostElement.parentNode.removeChild(hostElement);
    }
    // Update storage to hide frame
    chrome.storage.local.set({ frameVisible: false });
  }, 300);
}

// Function to ensure frame stays within viewport bounds
function ensureFrameInBounds(hostElement: HTMLElement) {
  const rect = hostElement.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  let newLeft = parseInt(hostElement.style.left, 10) || 20;
  let newBottom = parseInt(hostElement.style.bottom, 10) || 20;
  
  // Calculate top position from bottom
  const newTop = viewportHeight - newBottom - rect.height;
  
  // Ensure frame doesn't go outside viewport
  if (rect.right > viewportWidth) {
    newLeft = viewportWidth - rect.width - 20;
  }
  if (newLeft < 20) {
    newLeft = 20;
  }
  if (newTop < 20) {
    newBottom = viewportHeight - rect.height - 20;
  }
  if (newBottom < 20) {
    newBottom = 20;
  }
  
  hostElement.style.left = `${newLeft}px`;
  hostElement.style.bottom = `${newBottom}px`;
  hostElement.style.top = 'auto'; // Reset top to use bottom positioning
}

// Function to enable dragging
function enableDragging(element: HTMLElement) {
  let isDragging = false;
  let offsetX = 0, offsetY = 0;
  
  // Create drag handle and append to host element
  const dragHandle = document.createElement('div');
  Object.assign(dragHandle.style, {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    height: '48px', // Height of the header
    cursor: 'move',
    zIndex: '2147483646',
    backgroundColor: 'transparent',
    borderRadius: '16px 16px 0 0',
  });
  
  element.appendChild(dragHandle);
  
  // Mouse events for dragging
  dragHandle.addEventListener('mousedown', (e) => {
    isDragging = true;
    const rect = element.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    e.preventDefault();
    
    // Add dragging class for visual feedback
    element.style.cursor = 'grabbing';
    dragHandle.style.cursor = 'grabbing';
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    const newLeft = e.clientX - offsetX;
    const newTop = e.clientY - offsetY;
    
    // Ensure the frame stays within viewport bounds
    const maxX = window.innerWidth - element.offsetWidth;
    const maxY = window.innerHeight - element.offsetHeight;
    
    const constrainedLeft = Math.max(0, Math.min(newLeft, maxX));
    const constrainedTop = Math.max(0, Math.min(newTop, maxY));
    
    element.style.left = `${constrainedLeft}px`;
    element.style.top = `${constrainedTop}px`;
    element.style.bottom = 'auto'; // Use top positioning while dragging
  });
  
  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      element.style.cursor = 'auto';
      dragHandle.style.cursor = 'move';
      
      // Convert back to bottom positioning for consistency
      const rect = element.getBoundingClientRect();
      const bottomPosition = window.innerHeight - rect.bottom;
      element.style.bottom = `${bottomPosition}px`;
      element.style.top = 'auto';
    }
  });
}

// Function to handle visibility
function setFrameVisibility(isVisible: boolean) {
  const hostElement = document.getElementById('react-frame-host');
  if (hostElement) {
    if (isVisible) {
      hostElement.style.display = 'block';
      // Animate in
      hostElement.style.transform = 'translateY(0) scale(1)';
      hostElement.style.opacity = '1';
    } else {
      // Animate out
      hostElement.style.transform = 'translateY(100%) scale(0.95)';
      hostElement.style.opacity = '0';
      setTimeout(() => {
        hostElement.style.display = 'none';
      }, 300);
    }
  }
}

// Check saved visibility state and create frame
chrome.storage.local.get(['frameVisible'], (result) => {
  // Default to visible if setting doesn't exist
  const isVisible = result.frameVisible !== undefined ? result.frameVisible : true;
  
  if (isVisible) {
    // Create the frame
    const { hostElement } = injectFrame();
    
    // Add entrance animation
    hostElement.style.transform = 'translateY(100%) scale(0.95)';
    hostElement.style.opacity = '0';
    
    // Trigger animation after a brief delay
    setTimeout(() => {
      hostElement.style.transform = 'translateY(0) scale(1)';
      hostElement.style.opacity = '1';
    }, 100);
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'toggleFrameVisibility') {
    if (message.isVisible) {
      // Create frame if it doesn't exist
      const existingFrame = document.getElementById('react-frame-host');
      if (!existingFrame) {
        const { hostElement } = injectFrame();
        // Add entrance animation
        hostElement.style.transform = 'translateY(100%) scale(0.95)';
        hostElement.style.opacity = '0';
        setTimeout(() => {
          hostElement.style.transform = 'translateY(0) scale(1)';
          hostElement.style.opacity = '1';
        }, 100);
      } else {
        setFrameVisibility(true);
      }
    } else {
      setFrameVisibility(false);
    }
  }
  return true;
});

// Ensure frame stays in the DOM even if page manipulates DOM
function ensureFrameExists() {
  chrome.storage.local.get(['frameVisible'], (result) => {
    const isVisible = result.frameVisible !== undefined ? result.frameVisible : true;
    
    if (isVisible) {
      const hostElement = document.getElementById('react-frame-host');
      if (!hostElement || !document.body.contains(hostElement)) {
        // Frame was removed, re-inject it
        const { hostElement: newHostElement } = injectFrame();
        // No animation for re-injection to avoid jarring experience
        newHostElement.style.transform = 'translateY(0) scale(1)';
        newHostElement.style.opacity = '1';
      }
    }
  });
}

// Check periodically if frame exists and re-inject if needed
setInterval(ensureFrameExists, 2000);

// Re-inject frame on significant DOM changes
const observer = new MutationObserver((mutations) => {
  let shouldCheck = false;
  
  mutations.forEach((mutation) => {
    if (mutation.type === 'childList') {
      // Check if our frame was removed
      mutation.removedNodes.forEach((node) => {
        if (node instanceof Element && 
            (node.id === 'react-frame-host' || node.querySelector('#react-frame-host'))) {
          shouldCheck = true;
        }
      });
    }
  });
  
  if (shouldCheck) {
    setTimeout(ensureFrameExists, 100);
  }
});

// Start observing
observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Handle window resize to keep frame in view and adjust dimensions
window.addEventListener('resize', () => {
  const hostElement = document.getElementById('react-frame-host');
  if (hostElement) {
    // Ensure frame stays in bounds
    ensureFrameInBounds(hostElement);
    
    // Check if frame is collapsed and adjust accordingly
    const isCollapsed = hostElement.style.height === '48px';
    if (!isCollapsed) {
      // Re-apply responsive sizing for expanded state
      handleFrameResize(hostElement, false);
    }
  }
});

// Handle orientation change on mobile devices
window.addEventListener('orientationchange', () => {
  setTimeout(() => {
    const hostElement = document.getElementById('react-frame-host');
    if (hostElement) {
      ensureFrameInBounds(hostElement);
      const isCollapsed = hostElement.style.height === '48px';
      if (!isCollapsed) {
        handleFrameResize(hostElement, false);
      }
    }
  }, 500); // Delay to allow orientation change to complete
});