import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './components/App';
import './index.css';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  const rootElement = document.getElementById('frame-root');
  
  if (rootElement) {
    createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  }
});

// Listen for messages from content script
window.addEventListener('message', (event) => {
  // Handle any messages here
  console.log('Message received in frame:', event.data);
});