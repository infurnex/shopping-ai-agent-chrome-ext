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
  Loader2
} from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  image?: string;
}

const App: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: 'Hello! I\'m your AI assistant. How can I help you today? Feel free to ask questions or upload images for analysis.',
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
          AI Assistant
        </div>
        <div className="frame-controls">
          <button 
            className="control-button" 
            onClick={toggleCollapse}
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            {isCollapsed ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </button>
          <button 
            className="control-button" 
            onClick={handleClose}
            title="Close"
          >
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
                  {message.type === 'ai' ? <Bot size={16} /> : <User size={16} />}
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
          </div>
        </div>
      )}
    </div>
  );
};

export default App;