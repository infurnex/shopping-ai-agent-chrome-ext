// Enhanced content script with iframe persistence
let persistentIframe: HTMLIFrameElement | null = null;
let hostElement: HTMLElement | null = null;

// Function to create persistent iframe that survives page reloads
function createPersistentFrame() {
  // Create host element that will be attached to document.documentElement
  // instead of document.body to survive most page manipulations
  hostElement = document.createElement('div');
  hostElement.id = 'react-frame-host-persistent';
  
  // Apply styles to make it completely independent
  Object.assign(hostElement.style, {
    position: 'fixed',
    bottom: '20px',
    left: '20px',
    width: '380px',
    height: '500px',
    zIndex: '2147483647',
    border: 'none',
    margin: '0',
    padding: '0',
    overflow: 'hidden',
    pointerEvents: 'auto',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    isolation: 'isolate', // Create new stacking context
  });
  
  // Create shadow DOM for complete isolation
  const shadow = hostElement.attachShadow({ mode: 'closed' });
  
  // Create the iframe
  persistentIframe = document.createElement('iframe');
  persistentIframe.id = 'react-frame-iframe-persistent';
  persistentIframe.frameBorder = '0';
  persistentIframe.allowTransparency = 'true';
  
  Object.assign(persistentIframe.style, {
    width: '100%',
    height: '100%',
    border: 'none',
    borderRadius: '16px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    background: 'transparent',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  });
  
  // Set iframe source
  persistentIframe.src = chrome.runtime.getURL('frame.html');
  
  // Append to shadow DOM
  shadow.appendChild(persistentIframe);
  
  // Attach to document.documentElement instead of body
  // This makes it more resistant to page manipulations
  document.documentElement.appendChild(hostElement);
  
  // Add drag functionality
  enableDragging(hostElement);
  
  // Store reference for persistence
  (window as any).__reactFramePersistent = {
    hostElement,
    iframe: persistentIframe
  };
  
  return { hostElement, iframe: persistentIframe };
}

// Function to restore existing persistent frame
function restorePersistentFrame() {
  const existing = (window as any).__reactFramePersistent;
  if (existing && existing.hostElement && existing.iframe) {
    hostElement = existing.hostElement;
    persistentIframe = existing.iframe;
    
    // Re-attach event listeners if needed
    if (document.documentElement.contains(hostElement)) {
      console.log('Persistent frame restored successfully');
      return { hostElement, iframe: persistentIframe };
    }
  }
  return null;
}

// Function to create and inject the frame
function injectFrame() {
  // First try to restore existing persistent frame
  const restored = restorePersistentFrame();
  if (restored) {
    return restored;
  }
  
  // If no persistent frame exists, create new one
  return createPersistentFrame();
}

// Enhanced function to perform search on the website
function performSearch(searchTerm: string) {
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
          triggerSearch(searchInput!, searchTerm);
        }, 300);
        
      }, 100);
      
      console.log('Search performed successfully for:', searchTerm);
      
    } catch (error) {
      console.error('Error performing search:', error);
    }
  } else {
    console.warn('No search input found on this page');
    tryAlternativeSearchMethods(searchTerm);
  }
}

// Function to trigger search submission
function triggerSearch(searchInput: HTMLInputElement, searchTerm: string) {
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
function tryAlternativeSearchMethods(searchTerm: string) {
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
              triggerSearch(newSearchInput, searchTerm);
            }, 200);
          }
        }, 500);
        
        return; // Try only the first viable trigger
      }
    }
  }
  
  console.warn('No search functionality found on this page');
}

// Function to handle frame resizing
function handleFrameResize(hostElement: HTMLElement, isCollapsed: boolean) {
  if (isCollapsed) {
    hostElement.style.width = '320px';
    hostElement.style.height = '48px';
  } else {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let width = '380px';
    let height = '500px';
    
    if (viewportWidth < 768) {
      width = Math.min(viewportWidth - 40, 350) + 'px';
      height = Math.min(viewportHeight - 100, 450) + 'px';
    } else if (viewportWidth < 1024) {
      width = '360px';
      height = '480px';
    }
    
    hostElement.style.width = width;
    hostElement.style.height = height;
    
    ensureFrameInBounds(hostElement);
  }
}

// Function to handle frame closing
function handleFrameClose(hostElement: HTMLElement) {
  hostElement.style.transform = 'translateY(100%) scale(0.95)';
  hostElement.style.opacity = '0';
  
  setTimeout(() => {
    if (hostElement.parentNode) {
      hostElement.parentNode.removeChild(hostElement);
    }
    // Clear persistent reference
    delete (window as any).__reactFramePersistent;
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
  
  const newTop = viewportHeight - newBottom - rect.height;
  
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
  hostElement.style.top = 'auto';
}

// Function to enable dragging
function enableDragging(element: HTMLElement) {
  let isDragging = false;
  let offsetX = 0, offsetY = 0;
  
  const dragHandle = document.createElement('div');
  Object.assign(dragHandle.style, {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    height: '48px',
    cursor: 'move',
    zIndex: '2147483646',
    backgroundColor: 'transparent',
    borderRadius: '16px 16px 0 0',
  });
  
  element.appendChild(dragHandle);
  
  dragHandle.addEventListener('mousedown', (e) => {
    isDragging = true;
    const rect = element.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    e.preventDefault();
    
    element.style.cursor = 'grabbing';
    dragHandle.style.cursor = 'grabbing';
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    const newLeft = e.clientX - offsetX;
    const newTop = e.clientY - offsetY;
    
    const maxX = window.innerWidth - element.offsetWidth;
    const maxY = window.innerHeight - element.offsetHeight;
    
    const constrainedLeft = Math.max(0, Math.min(newLeft, maxX));
    const constrainedTop = Math.max(0, Math.min(newTop, maxY));
    
    element.style.left = `${constrainedLeft}px`;
    element.style.top = `${constrainedTop}px`;
    element.style.bottom = 'auto';
  });
  
  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      element.style.cursor = 'auto';
      dragHandle.style.cursor = 'move';
      
      const rect = element.getBoundingClientRect();
      const bottomPosition = window.innerHeight - rect.bottom;
      element.style.bottom = `${bottomPosition}px`;
      element.style.top = 'auto';
    }
  });
}

// Function to handle visibility
function setFrameVisibility(isVisible: boolean) {
  const hostElement = document.getElementById('react-frame-host-persistent');
  if (hostElement) {
    if (isVisible) {
      hostElement.style.display = 'block';
      hostElement.style.transform = 'translateY(0) scale(1)';
      hostElement.style.opacity = '1';
    } else {
      hostElement.style.transform = 'translateY(100%) scale(0.95)';
      hostElement.style.opacity = '0';
      setTimeout(() => {
        hostElement.style.display = 'none';
      }, 300);
    }
  }
}

// Enhanced initialization with persistence check
function initializeFrame() {
  chrome.storage.local.get(['frameVisible'], (result) => {
    const isVisible = result.frameVisible !== undefined ? result.frameVisible : true;
    
    if (isVisible) {
      // Check if persistent frame already exists
      const existing = (window as any).__reactFramePersistent;
      if (existing && existing.hostElement && document.documentElement.contains(existing.hostElement)) {
        console.log('Persistent frame already exists, skipping creation');
        return;
      }
      
      // Create new frame
      const { hostElement } = injectFrame();
      
      // Add entrance animation only for new frames
      if (!existing) {
        hostElement.style.transform = 'translateY(100%) scale(0.95)';
        hostElement.style.opacity = '0';
        
        setTimeout(() => {
          hostElement.style.transform = 'translateY(0) scale(1)';
          hostElement.style.opacity = '1';
        }, 100);
      }
    }
  });
}

// Initialize frame
initializeFrame();

// Listen for messages from React app
window.addEventListener('message', (event) => {
  if (event.data.action === 'resize') {
    const hostElement = document.getElementById('react-frame-host-persistent');
    if (hostElement) {
      handleFrameResize(hostElement, event.data.isCollapsed);
    }
  } else if (event.data.action === 'close') {
    const hostElement = document.getElementById('react-frame-host-persistent');
    if (hostElement) {
      handleFrameClose(hostElement);
    }
  } else if (event.data.action === 'performSearch') {
    performSearch(event.data.searchTerm);
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'toggleFrameVisibility') {
    if (message.isVisible) {
      const existingFrame = document.getElementById('react-frame-host-persistent');
      if (!existingFrame) {
        const { hostElement } = injectFrame();
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

// Enhanced frame persistence monitoring
function ensureFrameExists() {
  chrome.storage.local.get(['frameVisible'], (result) => {
    const isVisible = result.frameVisible !== undefined ? result.frameVisible : true;
    
    if (isVisible) {
      const existing = (window as any).__reactFramePersistent;
      if (existing && existing.hostElement) {
        // Check if frame is still in DOM
        if (!document.documentElement.contains(existing.hostElement)) {
          console.log('Persistent frame was removed from DOM, re-attaching');
          document.documentElement.appendChild(existing.hostElement);
        }
      } else {
        // No persistent frame exists, create new one
        console.log('No persistent frame found, creating new one');
        initializeFrame();
      }
    }
  });
}

// Check periodically but less frequently since we have persistence
setInterval(ensureFrameExists, 5000);

// Enhanced mutation observer for better persistence
const observer = new MutationObserver((mutations) => {
  let shouldCheck = false;
  
  mutations.forEach((mutation) => {
    if (mutation.type === 'childList') {
      mutation.removedNodes.forEach((node) => {
        if (node instanceof Element && 
            (node.id === 'react-frame-host-persistent' || 
             node.querySelector('#react-frame-host-persistent'))) {
          shouldCheck = true;
        }
      });
    }
  });
  
  if (shouldCheck) {
    setTimeout(ensureFrameExists, 100);
  }
});

// Observe document.documentElement instead of body for better persistence
observer.observe(document.documentElement, {
  childList: true,
  subtree: true
});

// Handle window resize
window.addEventListener('resize', () => {
  const hostElement = document.getElementById('react-frame-host-persistent');
  if (hostElement) {
    ensureFrameInBounds(hostElement);
    const isCollapsed = hostElement.style.height === '48px';
    if (!isCollapsed) {
      handleFrameResize(hostElement, false);
    }
  }
});

// Handle orientation change
window.addEventListener('orientationchange', () => {
  setTimeout(() => {
    const hostElement = document.getElementById('react-frame-host-persistent');
    if (hostElement) {
      ensureFrameInBounds(hostElement);
      const isCollapsed = hostElement.style.height === '48px';
      if (!isCollapsed) {
        handleFrameResize(hostElement, false);
      }
    }
  }, 500);
});

// Prevent frame removal during page transitions
window.addEventListener('beforeunload', () => {
  // Store frame state before page unload
  const existing = (window as any).__reactFramePersistent;
  if (existing && existing.hostElement) {
    // The frame will persist in memory and be restored
    console.log('Page unloading, frame will persist');
  }
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    // Page became visible again, ensure frame exists
    setTimeout(ensureFrameExists, 100);
  }
});