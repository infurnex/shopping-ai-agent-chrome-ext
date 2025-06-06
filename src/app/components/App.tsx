import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Minimize2, 
  Maximize2, 
  Send, 
  Image as ImageIcon, 
  Paperclip,
  Bot,
  User,
  Loader2,
  Search,
  ShoppingCart,
  CheckCircle,
  AlertCircle,
  Settings,
  Zap
} from 'lucide-react';
import { AIService, AIAction } from '../services/aiService';
import ActionsList from './ActionsList';

interface Message {
  id: string;
  type: 'user' | 'ai' | 'search' | 'system';
  content: string;
  timestamp: Date;
  image?: string;
  searchTerm?: string;
  success?: boolean;
  actions?: AIAction[];
  confidence?: number;
}

const App: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: 'Hello! I\'m your AI shopping assistant. I can understand your needs and create automated actions to help you browse and shop. Just tell me what you\'re looking for!',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'search' | 'actions'>('chat');
  const [showSettings, setShowSettings] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Initialize AI service
  const [aiService] = useState(() => new AIService());

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Listen for product click results from content script
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.action === 'productClickResult') {
        const resultMessage: Message = {
          id: Date.now().toString(),
          type: 'system',
          content: event.data.message,
          timestamp: new Date(),
          success: event.data.success,
          searchTerm: event.data.searchTerm
        };
        setMessages(prev => [...prev, resultMessage]);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
    
    window.parent.postMessage({ 
      action: 'resize', 
      isCollapsed: !isCollapsed 
    }, '*');
  };

  const handleClose = () => {
    window.parent.postMessage({ action: 'close' }, '*');
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() && !selectedImage) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
      image: selectedImage || undefined
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue.trim();
    setInputValue('');
    setSelectedImage(null);
    setIsLoading(true);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    try {
      // Send message to AI agent
      const aiResponse = await aiService.sendMessage(currentInput, {
        currentUrl: window.location.href,
        pageTitle: document.title,
        userIntent: 'shopping_assistance'
      });
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: aiResponse.message,
        timestamp: new Date(),
        actions: aiResponse.actions.map((action, index) => ({
          ...action,
          id: `action_${Date.now()}_${index}`,
          status: 'pending' as const,
          timestamp: new Date()
        })),
        confidence: aiResponse.confidence
      };

      setMessages(prev => [...prev, aiMessage]);

      // If AI suggested actions, show actions tab
      if (aiResponse.actions.length > 0) {
        setTimeout(() => setActiveTab('actions'), 1000);
      }

    } catch (error) {
      console.error('Error getting AI response:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: 'I apologize, but I\'m having trouble connecting to my AI service right now. I can still help you with basic search and product finding using the Search tab.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchValue.trim()) return;

    const searchMessage: Message = {
      id: Date.now().toString(),
      type: 'search',
      content: `Searching for: "${searchValue}"`,
      timestamp: new Date(),
      searchTerm: searchValue
    };

    setMessages(prev => [...prev, searchMessage]);
    
    // Send message to content script to perform search
    window.parent.postMessage({ 
      action: 'performSearch', 
      searchTerm: searchValue 
    }, '*');

    const currentSearchTerm = searchValue;
    setSearchValue('');
    
    // Add confirmation message
    setTimeout(() => {
      const confirmMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: `I've initiated a search for "${currentSearchTerm}" on this website. I'll search for the product and automatically click on the first result found.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, confirmMessage]);
    }, 500);
  };

  const handleClickFirstProduct = () => {
    const clickMessage: Message = {
      id: Date.now().toString(),
      type: 'search',
      content: 'Looking for the first product on this page...',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, clickMessage]);
    
    // Send message to content script to find and click first product
    window.parent.postMessage({ 
      action: 'clickFirstProduct'
    }, '*');
    
    // Add confirmation message
    setTimeout(() => {
      const confirmMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: 'I\'m scanning the page for the first available product and will click on it automatically.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, confirmMessage]);
    }, 500);
  };

  const handleExecuteAction = async (action: AIAction) => {
    try {
      // Update action status to executing
      await aiService.updateActionStatus(action.id, 'executing');
      
      // Execute the action based on its type
      switch (action.type) {
        case 'search':
          window.parent.postMessage({ 
            action: 'performSearch', 
            searchTerm: action.parameters.searchTerm 
          }, '*');
          break;
          
        case 'click':
          if (action.parameters.target === 'first_product') {
            window.parent.postMessage({ 
              action: 'clickFirstProduct'
            }, '*');
          }
          break;
          
        case 'wait':
          setTimeout(async () => {
            await aiService.updateActionStatus(action.id, 'completed');
          }, action.parameters.duration || 1000);
          return; // Early return to avoid immediate completion
          
        default:
          console.log('Action type not yet implemented:', action.type);
      }
      
      // Mark as completed after a delay (for search/click actions)
      setTimeout(async () => {
        await aiService.updateActionStatus(action.id, 'completed');
      }, 2000);
      
    } catch (error) {
      console.error('Error executing action:', error);
      await aiService.updateActionStatus(action.id, 'failed');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (activeTab === 'chat') {
        handleSendMessage();
      } else if (activeTab === 'search') {
        handleSearch();
      }
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getMessageIcon = (message: Message) => {
    switch (message.type) {
      case 'ai':
        return <Bot size={16} />;
      case 'search':
        return <Search size={16} />;
      case 'system':
        return message.success ? <CheckCircle size={16} /> : <AlertCircle size={16} />;
      default:
        return <User size={16} />;
    }
  };

  return (
    <div className={`app-container ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="frame-header">
        <div className="frame-title">
          <Zap size={16} />
          AI Shopping Assistant
        </div>
        <div className="frame-controls">
          <button 
            className="control-button"
            onClick={() => setShowSettings(!showSettings)}
            title="Settings"
          >
            <Settings size={16} />
          </button>
          <button className="control-button" onClick={toggleCollapse}>
            {isCollapsed ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </button>
          <button className="control-button" onClick={handleClose}>
            <X size={16} />
          </button>
        </div>
      </div>
      
      {!isCollapsed && (
        <div className="chat-container">
          <div className="tab-container">
            <button 
              className={`tab-button ${activeTab === 'chat' ? 'active' : ''}`}
              onClick={() => setActiveTab('chat')}
            >
              <Bot size={16} />
              AI Chat
            </button>
            <button 
              className={`tab-button ${activeTab === 'search' ? 'active' : ''}`}
              onClick={() => setActiveTab('search')}
            >
              <Search size={16} />
              Manual
            </button>
            <button 
              className={`tab-button ${activeTab === 'actions' ? 'active' : ''}`}
              onClick={() => setActiveTab('actions')}
            >
              <Zap size={16} />
              Actions
            </button>
          </div>

          {activeTab === 'actions' ? (
            <ActionsList 
              aiService={aiService}
              onExecuteAction={handleExecuteAction}
            />
          ) : (
            <>
              <div className="messages-container">
                {messages.map((message) => (
                  <div key={message.id} className={`message ${message.type}`}>
                    <div className="message-avatar">
                      {getMessageIcon(message)}
                    </div>
                    <div className="message-content">
                      {message.image && (
                        <div className="message-image">
                          <img src={message.image} alt="Uploaded content" />
                        </div>
                      )}
                      <div className="message-text">{message.content}</div>
                      
                      {message.actions && message.actions.length > 0 && (
                        <div className="message-actions-preview">
                          <div className="actions-header">
                            <Zap size={14} />
                            <span>Generated {message.actions.length} action(s)</span>
                            {message.confidence && (
                              <span className="confidence">
                                {Math.round(message.confidence * 100)}% confidence
                              </span>
                            )}
                          </div>
                          <div className="actions-list-preview">
                            {message.actions.slice(0, 3).map((action, index) => (
                              <div key={index} className="action-preview">
                                <span className="action-type">{action.type}</span>
                                <span className="action-desc">{action.description}</span>
                              </div>
                            ))}
                            {message.actions.length > 3 && (
                              <div className="more-actions">
                                +{message.actions.length - 3} more actions
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div className="message-time">{formatTime(message.timestamp)}</div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="message ai">
                    <div className="message-avatar">
                      <Bot size={16} />
                    </div>
                    <div className="message-content">
                      <div className="typing-indicator">
                        <Loader2 size={16} className="animate-spin" />
                        <span>AI is analyzing and creating actions...</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
              
              <div className="input-container">
                {selectedImage && activeTab === 'chat' && (
                  <div className="selected-image-preview">
                    <img src={selectedImage} alt="Selected for upload" />
                    <button 
                      className="remove-image-btn"
                      onClick={removeSelectedImage}
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
                
                {activeTab === 'chat' ? (
                  <div className="input-row">
                    <div className="input-actions">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        style={{ display: 'none' }}
                      />
                      <button 
                        className="action-btn"
                        onClick={() => fileInputRef.current?.click()}
                        title="Upload image"
                      >
                        <ImageIcon size={18} />
                      </button>
                    </div>
                    
                    <textarea
                      ref={textareaRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Tell me what you want to find or buy..."
                      className="message-input"
                      rows={1}
                      disabled={isLoading}
                    />
                    
                    <button 
                      className="send-btn"
                      onClick={handleSendMessage}
                      disabled={(!inputValue.trim() && !selectedImage) || isLoading}
                    >
                      <Send size={18} />
                    </button>
                  </div>
                ) : (
                  <div className="search-controls">
                    <div className="input-row">
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Enter product name (e.g., red tshirt)..."
                        className="search-input"
                      />
                      
                      <button 
                        className="search-btn"
                        onClick={handleSearch}
                        disabled={!searchValue.trim()}
                      >
                        <Search size={18} />
                        Find
                      </button>
                    </div>
                    
                    <div className="product-actions">
                      <button 
                        className="product-click-btn"
                        onClick={handleClickFirstProduct}
                        title="Find and click the first product on this page"
                      >
                        <ShoppingCart size={18} />
                        Click First Product
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default App;