import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

const Popup = () => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Load saved state
    chrome.storage.local.get(['frameVisible'], (result) => {
      if (result.frameVisible !== undefined) {
        setIsVisible(result.frameVisible);
      }
    });
  }, []);

  const handleToggle = () => {
    const newState = !isVisible;
    setIsVisible(newState);
    
    // Save state
    chrome.storage.local.set({ frameVisible: newState });
    
    // Send message to content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'toggleFrameVisibility',
          isVisible: newState
        }).catch(() => {
          // Suppress errors if content script isn't loaded
        });
      }
    });
  };

  return (
    <div className="popup-container">
      <h1>React Frame Injector</h1>
      <div className="options">
        <div className="option-row">
          <span>Show frame</span>
          <label className="toggle">
            <input 
              type="checkbox" 
              checked={isVisible}
              onChange={handleToggle}
            />
            <span className="slider"></span>
          </label>
        </div>
      </div>
    </div>
  );
};

document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('popup-root');
  if (root) {
    createRoot(root).render(
      <React.StrictMode>
        <Popup />
      </React.StrictMode>
    );
  }
});