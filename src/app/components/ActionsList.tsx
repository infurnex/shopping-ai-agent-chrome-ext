import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Play, 
  Trash2,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { AIAction, AIService } from '../services/aiService';

interface ActionsListProps {
  aiService: AIService;
  onExecuteAction?: (action: AIAction) => void;
}

const ActionsList: React.FC<ActionsListProps> = ({ aiService, onExecuteAction }) => {
  const [actions, setActions] = useState<AIAction[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load actions from storage
  const loadActions = async () => {
    setIsLoading(true);
    try {
      const storedActions = await aiService.getStoredActions();
      setActions(storedActions);
    } catch (error) {
      console.error('Error loading actions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadActions();
    
    // Refresh actions every 5 seconds
    const interval = setInterval(loadActions, 5000);
    return () => clearInterval(interval);
  }, [aiService]);

  const getStatusIcon = (status: AIAction['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'executing':
        return <RefreshCw size={16} className="text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertCircle size={16} className="text-red-500" />;
      default:
        return <Clock size={16} className="text-yellow-500" />;
    }
  };

  const getStatusColor = (status: AIAction['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200';
      case 'executing':
        return 'bg-blue-50 border-blue-200';
      case 'failed':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-yellow-50 border-yellow-200';
    }
  };

  const handleExecuteAction = (action: AIAction) => {
    if (onExecuteAction) {
      onExecuteAction(action);
    }
  };

  const handleClearActions = async () => {
    try {
      await aiService.clearStoredActions();
      setActions([]);
    } catch (error) {
      console.error('Error clearing actions:', error);
    }
  };

  const pendingActions = actions.filter(action => action.status === 'pending');
  const completedActions = actions.filter(action => action.status === 'completed');
  const failedActions = actions.filter(action => action.status === 'failed');

  if (!isVisible) {
    return (
      <div className="actions-toggle">
        <button 
          className="toggle-actions-btn"
          onClick={() => setIsVisible(true)}
          title="Show AI Actions"
        >
          <Eye size={16} />
          <span>Actions ({actions.length})</span>
        </button>
      </div>
    );
  }

  return (
    <div className="actions-container">
      <div className="actions-header">
        <div className="actions-title">
          <Play size={16} />
          AI Actions
        </div>
        <div className="actions-controls">
          <button 
            className="control-btn"
            onClick={loadActions}
            disabled={isLoading}
            title="Refresh actions"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <button 
            className="control-btn"
            onClick={handleClearActions}
            title="Clear all actions"
          >
            <Trash2 size={14} />
          </button>
          <button 
            className="control-btn"
            onClick={() => setIsVisible(false)}
            title="Hide actions"
          >
            <EyeOff size={14} />
          </button>
        </div>
      </div>

      <div className="actions-stats">
        <div className="stat">
          <span className="stat-label">Pending:</span>
          <span className="stat-value pending">{pendingActions.length}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Completed:</span>
          <span className="stat-value completed">{completedActions.length}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Failed:</span>
          <span className="stat-value failed">{failedActions.length}</span>
        </div>
      </div>

      <div className="actions-list">
        {actions.length === 0 ? (
          <div className="no-actions">
            <Clock size={24} />
            <p>No AI actions yet</p>
            <span>Send a message to generate actions</span>
          </div>
        ) : (
          actions.slice().reverse().map((action) => (
            <div 
              key={action.id} 
              className={`action-item ${getStatusColor(action.status)}`}
            >
              <div className="action-header">
                <div className="action-status">
                  {getStatusIcon(action.status)}
                  <span className="action-type">{action.type.toUpperCase()}</span>
                </div>
                <div className="action-time">
                  {action.timestamp.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
              
              <div className="action-description">
                {action.description}
              </div>
              
              {Object.keys(action.parameters).length > 0 && (
                <div className="action-parameters">
                  {Object.entries(action.parameters).map(([key, value]) => (
                    <div key={key} className="parameter">
                      <span className="parameter-key">{key}:</span>
                      <span className="parameter-value">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              
              {action.status === 'pending' && (
                <div className="action-controls">
                  <button 
                    className="execute-btn"
                    onClick={() => handleExecuteAction(action)}
                  >
                    <Play size={12} />
                    Execute
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ActionsList;