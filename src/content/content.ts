// Function to create and inject the frame
function injectFrame() {
  // Create shadow root to isolate styles
  const hostElement = document.createElement('div');
  hostElement.id = 'react-frame-host';
  document.body.appendChild(hostElement);
  
  // Apply styles to the host element
  Object.assign(hostElement.style, {
    position: 'fixed',
    bottom: '20px',
    left: '20px',
    width: '320px',
    height: '240px',
    zIndex: '2147483647', // Max z-index
    border: 'none',
    margin: '0',
    padding: '0',
    overflow: 'hidden',
    pointerEvents: 'auto',
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
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    background: 'transparent',
  });
  
  // Set iframe source to the extension's frame.html
  iframe.src = chrome.runtime.getURL('frame.html');
  
  // Append iframe to shadow DOM
  shadow.appendChild(iframe);
  
  // Add drag functionality
  enableDragging(hostElement);
  
  return { hostElement, iframe };
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
    height: '30px',
    cursor: 'move',
    zIndex: '2147483646', // One less than the max
    backgroundColor: 'transparent',
  });
  
  element.appendChild(dragHandle);
  
  // Mouse events for dragging
  dragHandle.addEventListener('mousedown', (e) => {
    isDragging = true;
    offsetX = e.clientX - element.offsetLeft;
    offsetY = e.clientY - element.offsetTop;
    e.preventDefault();
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    const newLeft = e.clientX - offsetX;
    const newTop = e.clientY - offsetY;
    
    // Ensure the frame stays within viewport bounds
    const maxX = window.innerWidth - element.offsetWidth;
    const maxY = window.innerHeight - element.offsetHeight;
    
    element.style.left = `${Math.max(0, Math.min(newLeft, maxX))}px`;
    element.style.top = `${Math.max(0, Math.min(newTop, maxY))}px`;
  });
  
  document.addEventListener('mouseup', () => {
    isDragging = false;
  });
}

// Function to handle visibility
function setFrameVisibility(isVisible: boolean) {
  const hostElement = document.getElementById('react-frame-host');
  if (hostElement) {
    hostElement.style.display = isVisible ? 'block' : 'none';
  }
}

// Check saved visibility state
chrome.storage.local.get(['frameVisible'], (result) => {
  // Default to visible if setting doesn't exist
  const isVisible = result.frameVisible !== undefined ? result.frameVisible : true;
  
  // Create the frame
  const { hostElement } = injectFrame();
  
  // Apply initial visibility
  if (!isVisible) {
    hostElement.style.display = 'none';
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'toggleFrameVisibility') {
    setFrameVisibility(message.isVisible);
  }
  return true;
});

// Ensure frame stays in the DOM even if page manipulates DOM
function ensureFrameExists() {
  const hostElement = document.getElementById('react-frame-host');
  if (!hostElement || !document.body.contains(hostElement)) {
    // Frame was removed, re-inject it
    chrome.storage.local.get(['frameVisible'], (result) => {
      const isVisible = result.frameVisible !== undefined ? result.frameVisible : true;
      const { hostElement } = injectFrame();
      if (!isVisible) {
        hostElement.style.display = 'none';
      }
    });
  }
}

// Check periodically if frame exists and re-inject if needed
setInterval(ensureFrameExists, 1000);

// Re-inject frame on DOM content changes
const observer = new MutationObserver(() => {
  ensureFrameExists();
});

// Start observing
observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Handle window resize to keep frame in view
window.addEventListener('resize', () => {
  const hostElement = document.getElementById('react-frame-host');
  if (hostElement) {
    const maxX = window.innerWidth - hostElement.offsetWidth;
    const maxY = window.innerHeight - hostElement.offsetHeight;
    
    const currentLeft = parseInt(hostElement.style.left, 10) || 20;
    const currentTop = parseInt(hostElement.style.top, 10) || 20;
    
    hostElement.style.left = `${Math.min(currentLeft, maxX)}px`;
    hostElement.style.bottom = `${Math.min(currentTop, maxY)}px`;
  }
});