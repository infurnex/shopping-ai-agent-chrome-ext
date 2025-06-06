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
  Search
} from 'lucide-react';
import { callAIAgent, AIResponse } from '../services/aiService';

interface Message {
  id: string;
  type: 'user' | 'ai' | 'action';
  content: string;
  timestamp: Date;
  image?: string;
  action?: {
    type: string;
    params: any;
  };
}

const App: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: 'Hello! I\'m your AI shopping assistant. I can help you search for products on this website. Try asking me to "search for red t-shirt" or upload an image of something you\'d like to find!',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  const executeAction = (action: { type: string; params: any }) => {
    // Send message to content script to execute browser action
    window.parent.postMessage({
      action: 'executeAction',
      actionData: action
    }, '*');
    
    // Add action message to chat
    const actionMessage: Message = {
      id: (Date.now() + 2).toString(),
      type: 'action',
      content: `🔍 Searching for "${action.params.query}"...`,
      timestamp: new Date(),
      action: action
    };
    
    setMessages(prev => [...prev, actionMessage]);
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
      const aiResponse: AIResponse = await callAIAgent(currentInput, !!selectedImage);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: aiResponse.message,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
      
      // Execute action if AI decided to take action
      if (aiResponse.takeAction && aiResponse.action) {
        setTimeout(() => {
          executeAction(aiResponse.action!);
        }, 500); // Small delay for better UX
      }
      
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`app-container ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="frame-header">
        <div className="frame-title">
          <Bot size={16} />
          AI Shopping Assistant
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
          <div className="messages-container">
            {messages.map((message) => (
              <div key={message.id} className={`message ${message.type}`}>
                <div className="message-avatar">
                  {message.type === 'ai' ? (
                    <Bot size={16} />
                  ) : message.type === 'action' ? (
                    <Search size={16} />
                  ) : (
                    <User size={16} />
                  )}
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
            {selectedImage && (
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
                placeholder="Try: 'search for red t-shirt' or 'find wireless headphones'"
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
          </div>
        </div>
      )}
    </div>
  );
};

export default App;