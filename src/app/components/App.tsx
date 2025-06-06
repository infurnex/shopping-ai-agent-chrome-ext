import React, { useState } from 'react';
import { X, Minimize2, Maximize2, Settings } from 'lucide-react';

const App: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('home');

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
    
    // Send message to parent (content script) about collapse state
    window.parent.postMessage({ 
      action: 'resize', 
      isCollapsed: !isCollapsed 
    }, '*');
  };

  const handleClose = () => {
    // Send message to content script to hide the frame
    window.parent.postMessage({ action: 'close' }, '*');
  };

  return (
    <div className={`app-container ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="frame-header">
        <div className="frame-title">React App</div>
        <div className="frame-controls">
          <button className="control-button" onClick={toggleCollapse}>
            {isCollapsed ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </button>
          <button className="control-button" onClick={handleClose}>
            <X size={16} />
          </button>
        </div>
      </div>
      
      {!isCollapsed && (
        <div className="frame-content">
          <div className="tabs">
            <button 
              className={`tab ${activeTab === 'home' ? 'active' : ''}`} 
              onClick={() => setActiveTab('home')}
            >
              Home
            </button>
            <button 
              className={`tab ${activeTab === 'settings' ? 'active' : ''}`} 
              onClick={() => setActiveTab('settings')}
            >
              <Settings size={16} />
            </button>
          </div>
          
          <div className="tab-content">
            {activeTab === 'home' && (
              <div className="home-tab">
                <h2>Welcome to the React Frame</h2>
                <p>This is a React application injected into the page.</p>
                <button className="action-button">Take Action</button>
              </div>
            )}
            
            {activeTab === 'settings' && (
              <div className="settings-tab">
                <h2>Settings</h2>
                <div className="setting-item">
                  <label htmlFor="setting1">Enable notifications</label>
                  <input type="checkbox" id="setting1" />
                </div>
                <div className="setting-item">
                  <label htmlFor="setting2">Dark mode</label>
                  <input type="checkbox" id="setting2" />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;