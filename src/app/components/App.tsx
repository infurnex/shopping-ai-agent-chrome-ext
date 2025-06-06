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
  AlertCircle
} from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'ai' | 'search' | 'system';
  content: string;
  timestamp: Date;
  image?: string;
  searchTerm?: string;
  success?: boolean;
}

const App: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: 'Hello! I\'m your AI shopping assistant. You can chat with me, upload images, or use the search feature to find and automatically select products on this website.',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'search'>('chat');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  const simulateAIResponse = async (userMessage: string, hasImage: boolean): Promise<string> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    const responses = [
      "That's an interesting question! Let me help you with that.",
      "I understand what you're asking. Here's my perspective on this topic.",
      "Great question! Based on what you've shared, I think...",
      "I can definitely help you with that. Let me break this down for you.",
      "That's a thoughtful inquiry. Here's what I would suggest..."
    ];

    const imageResponses = [
      "I can see the image you've uploaded. It appears to show...",
      "Thanks for sharing that image! I can analyze what I see here.",
      "Interesting image! Let me describe what I observe and provide some insights.",
      "I've analyzed your image. Here's what stands out to me..."
    ];

    if (hasImage) {
      return imageResponses[Math.floor(Math.random() * imageResponses.length)] + " " + 
             responses[Math.floor(Math.random() * responses.length)];
    }
    
    return responses[Math.floor(Math.random() * responses.length)];
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
    setInputValue('');
    setSelectedImage(null);
    setIsLoading(true);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    try {
      const aiResponse = await simulateAIResponse(userMessage.content, !!userMessage.image);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: aiResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (activeTab === 'chat') {
        handleSendMessage();
      } else {
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
          <ShoppingCart size={16} />
          Shopping Assistant
        </div>
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
        <div className="chat-container">
          <div className="tab-container">
            <button 
              className={`tab-button ${activeTab === 'chat' ? 'active' : ''}`}
              onClick={() => setActiveTab('chat')}
            >
              <Bot size={16} />
              Chat
            </button>
            <button 
              className={`tab-button ${activeTab === 'search' ? 'active' : ''}`}
              onClick={() => setActiveTab('search')}
            >
              <Search size={16} />
              Auto-Shop
            </button>
          </div>

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
                    <span>AI is thinking...</span>
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
                  placeholder="Type your message..."
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
                  Find & Click
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;