import React from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

const Options = () => {
  return (
    <div className="options-container">
      <h1>React Frame Injector Options</h1>
      <p>More configuration options coming soon.</p>
    </div>
  );
};

document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('options-root');
  if (root) {
    createRoot(root).render(
      <React.StrictMode>
        <Options />
      </React.StrictMode>
    );
  }
});