document.addEventListener('DOMContentLoaded', () => {
  const frameToggle = document.getElementById('frame-toggle');
  
  // Load saved state
  chrome.storage.local.get(['frameVisible'], (result) => {
    if (result.frameVisible !== undefined) {
      frameToggle.checked = result.frameVisible;
    }
  });
  
  // Save state and send message to content script
  frameToggle.addEventListener('change', () => {
    const isVisible = frameToggle.checked;
    chrome.storage.local.set({ frameVisible: isVisible });
    
    // Send message to all tabs
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, { 
          action: 'toggleFrameVisibility',
          isVisible: isVisible 
        }).catch(() => {
          // Suppress errors for tabs where content script isn't loaded
        });
      });
    });
  });
});