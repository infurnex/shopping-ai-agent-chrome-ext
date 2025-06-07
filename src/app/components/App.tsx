import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Minimize2, 
  Maximize2, 
  Send, 
  Image as ImageIcon, 
  Bot,
  User,
  Loader2,
  Search,
  Play,
  Square,
  RotateCcw
} from 'lucide-react';
import { callPlannerAgent, PlannerResponse } from '../services/plannerAgent';

interface Message {
  id: string;
  type: 'user' | 'ai' | 'action' | 'system';
  content: string;
  timestamp: Date;
  image?: string;
  actions?: any[];
}

interface QueueStatus {
  queueLength: number;
  isProcessing: boolean;
  currentAction?: string;
}

const App: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: 'Hello! I\'m your AI shopping assistant. I can help you automate shopping tasks. Try saying "buy red t-shirt" or "search for wireless headphones" to see the workflow in action!',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [queueStatus, setQueueStatus] = useState<QueueStatus>({ queueLength: 0, isProcessing: false });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Listen for messages from content script
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.action === 'actionCompleted') {
        addSystemMessage(`✅ Action completed: ${event.data.actionData.goal}`);
        updateQueueStatus();
      } else if (event.data.action === 'actionFailed') {
        addSystemMessage(`❌ Action failed: ${event.data.actionData.goal} - ${event.data.error}`);
        updateQueueStatus();
      } else if (event.data.action === 'queueStatusUpdate') {
        setQueueStatus(event.data.status);
      } else if (event.data.action === 'queueCleared') {
        addSystemMessage('🧹 Action queue cleared');
        setQueueStatus({ queueLength: 0, isProcessing: false });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const addSystemMessage = (content: string) => {
    const systemMessage: Message = {
      id: Date.now().toString(),
      type: 'system',
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, systemMessage]);
  };

  const updateQueueStatus = () => {
    window.parent.postMessage({ action: 'getQueueStatus' }, '*');
  };

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

  const triggerWorkflowSimulation = () => {
    // Simulate a complex shopping workflow
    const mockActions = [
      { goal: "search", query: "red t-shirt" },
      { goal: "select", target: "first product" },
      { goal: "click", target: "add to cart" },
      { goal: "checkout" }
    ];

    // Add workflow message
    const workflowMessage: Message = {
      id: Date.now().toString(),
      type: 'system',
      content: '🚀 Starting workflow simulation: Search → Select → Add to Cart → Checkout',
      timestamp: new Date(),
      actions: mockActions
    };

    setMessages(prev => [...prev, workflowMessage]);

    // Send actions to content script
    window.parent.postMessage({
      action: 'triggerWorkflow',
      actions: mockActions
    }, '*');

    // Update queue status
    setTimeout(() => updateQueueStatus(), 500);
  };

  const clearQueue = () => {
    window.parent.postMessage({ action: 'clearQueue' }, '*');
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
      const plannerResponse: PlannerResponse = await callPlannerAgent(currentInput, !!selectedImage);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: plannerResponse.message,
        timestamp: new Date(),
        actions: plannerResponse.actions
      };

      setMessages(prev => [...prev, aiMessage]);
      
      // If planner created actions, add them to queue
      if (plannerResponse.actions && plannerResponse.actions.length > 0) {
        setTimeout(() => {
          window.parent.postMessage({
            action: 'triggerWorkflow',
            actions: plannerResponse.actions
          }, '*');
          
          // Update queue status
          setTimeout(() => updateQueueStatus(), 500);
        }, 1000);
      }
      
    } catch (error) {
      console.error('Error getting planner response:', error);
      
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
          {queueStatus.queueLength > 0 && (
            <span className="queue-badge">{queueStatus.queueLength}</span>
          )}
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
          <div className="workflow-controls">
            <button 
              className="workflow-btn simulate-btn"
              onClick={triggerWorkflowSimulation}
              disabled={queueStatus.isProcessing}
            >
              <Play size={16} />
              Simulate Workflow
            </button>
            <button 
              className="workflow-btn clear-btn"
              onClick={clearQueue}
              disabled={queueStatus.queueLength === 0}
            >
              <RotateCcw size={16} />
              Clear Queue
            </button>
            {queueStatus.isProcessing && (
              <div className="processing-indicator">
                <Loader2 size={16} className="animate-spin" />
                Processing...
              </div>
            )}
          </div>

          <div className="messages-container">
            {messages.map((message) => (
              <div key={message.id} className={`message ${message.type}`}>
                <div className="message-avatar">
                  {message.type === 'ai' ? (
                    <Bot size={16} />
                  ) : message.type === 'system' ? (
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
                  {message.actions && message.actions.length > 0 && (
                    <div className="actions-preview">
                      <div className="actions-title">Planned Actions:</div>
                      {message.actions.map((action, index) => (
                        <div key={index} className="action-item">
                          {index + 1}. {action.goal} {action.query && `"${action.query}"`} {action.target && `(${action.target})`}
                        </div>
                      ))}
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
                    <span>AI is planning...</span>
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
                placeholder="Try: 'buy red t-shirt' or 'search for wireless headphones'"
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