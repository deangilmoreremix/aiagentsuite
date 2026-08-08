import React, { useState, useEffect, useRef } from 'react';
import { 
  Lightbulb, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Target,
  Zap,
  ArrowRight,
  X,
  Star,
  Activity,
  Brain,
  Sparkles,
  Info,
  DollarSign
} from 'lucide-react';
import { proactiveAssistantService } from '../services/proactiveAssistantService';
import Tooltip from './Tooltip';

interface ProactiveSuggestion {
  id: string;
  type: 'action' | 'insight' | 'goal' | 'optimization' | 'warning';
  title: string;
  description: string;
  confidence: number;
  category: string;
  actionable: boolean;
  suggestedCommand?: string;
  estimatedValue?: number;
  priority: 'low' | 'medium' | 'high';
  expiresAt?: Date;
}

interface ProactiveAssistantPanelProps {
  userId?: string;
  realMode?: boolean;
  onSuggestionExecute?: (suggestion: ProactiveSuggestion) => void;
  onInsightView?: (insight: string) => void;
  compact?: boolean;
}

const ProactiveAssistantPanel: React.FC<ProactiveAssistantPanelProps> = ({
  userId = 'default-user',
  realMode = false,
  onSuggestionExecute,
  compact = false
}) => {
  const [suggestions, setSuggestions] = useState<ProactiveSuggestion[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<ProactiveSuggestion | null>(null);
  const [filter, setFilter] = useState<'all' | 'high' | 'actionable'>('all');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Load suggestions and insights
  useEffect(() => {
    if (realMode) {
      loadSuggestions();
      loadInsights();
    }
  }, [userId, realMode]);

  // Auto-refresh suggestions
  useEffect(() => {
    if (!realMode) return;

    const interval = setInterval(() => {
      loadSuggestions();
      if (isMountedRef.current) {
        setLastRefresh(new Date());
      }
    }, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [realMode, userId]);

  const loadSuggestions = async () => {
    if (!realMode) return;
    
    if (isMountedRef.current) {
      setIsLoading(true);
    }
    try {
      const newSuggestions = await proactiveAssistantService.generateProactiveSuggestions(userId);
      if (isMountedRef.current) {
        setSuggestions(newSuggestions);
      }
    } catch (error) {
      console.error('Failed to load proactive suggestions:', error);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const loadInsights = async () => {
    if (!realMode) return;

    try {
      const newInsights = await proactiveAssistantService.getPersonalizedInsights(userId);
      setInsights(newInsights);
    } catch (error) {
      console.error('Failed to load insights:', error);
    }
  };

  const handleSuggestionClick = async (suggestion: ProactiveSuggestion) => {
    try {
      if (suggestion.actionable && suggestion.suggestedCommand) {
        await proactiveAssistantService.executeSuggestion(userId, suggestion);
        
        // Remove executed suggestion
        setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
        
        if (onSuggestionExecute) {
          onSuggestionExecute(suggestion);
        }
      }
    } catch (error) {
      console.error('Failed to execute suggestion:', error);
    }
  };

  const dismissSuggestion = (suggestionId: string) => {
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
    proactiveAssistantService.dismissSuggestion(userId, suggestionId);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'action': return Zap;
      case 'insight': return Lightbulb;
      case 'goal': return Target;
      case 'optimization': return TrendingUp;
      case 'warning': return AlertTriangle;
      default: return Info;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'action': return 'text-blue-400 bg-blue-500/20 border-blue-400/30';
      case 'insight': return 'text-purple-400 bg-purple-500/20 border-purple-400/30';
      case 'goal': return 'text-green-400 bg-green-500/20 border-green-400/30';
      case 'optimization': return 'text-orange-400 bg-orange-500/20 border-orange-400/30';
      case 'warning': return 'text-red-400 bg-red-500/20 border-red-400/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-400/30';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <Star className="h-4 w-4 text-red-400" />;
      case 'medium': return <Clock className="h-4 w-4 text-yellow-400" />;
      case 'low': return <CheckCircle className="h-4 w-4 text-green-400" />;
      default: return <Info className="h-4 w-4 text-gray-400" />;
    }
  };

  const filteredSuggestions = suggestions.filter(s => {
    if (filter === 'high') return s.priority === 'high';
    if (filter === 'actionable') return s.actionable && s.suggestedCommand;
    return true;
  });

  if (!realMode) {
    return (
      <div className={`bg-slate-700/30 rounded-xl p-4 border border-slate-600/30 ${compact ? 'text-sm' : ''}`}>
        <div className="flex items-center gap-2 text-gray-400 mb-2">
          <Lightbulb className="h-4 w-4" />
          <span>Proactive AI Assistant</span>
        </div>
        <p className="text-gray-300 text-sm">
          Switch to Live Mode to enable proactive suggestions and AI insights based on your CRM data and conversation context.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Lightbulb className="h-6 w-6 text-yellow-400" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          </div>
          <div>
            <h3 className={`font-bold text-white ${compact ? 'text-lg' : 'text-xl'}`}>
              Proactive AI Assistant
            </h3>
            <p className="text-gray-300 text-sm">
              GPT-5 analyzes your CRM and suggests helpful actions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-xs text-gray-400">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </div>
          <button
            onClick={loadSuggestions}
            disabled={isLoading}
            className="p-2 rounded-lg bg-purple-500/20 border border-purple-400/30 text-purple-300 hover:bg-purple-500/30 transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <div className="animate-spin w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full"></div>
            ) : (
              <Brain className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['all', 'high', 'actionable'].map(filterType => (
          <button
            key={filterType}
            onClick={() => setFilter(filterType as any)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-300 ${
              filter === filterType
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
            }`}
          >
            {filterType === 'all' ? 'All' : filterType === 'high' ? 'High Priority' : 'Actionable'}
          </button>
        ))}
      </div>

      {/* AI Insights */}
      {insights.length > 0 && (
        <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-400/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="h-5 w-5 text-purple-400" />
            <h4 className="font-semibold text-white">AI Insights</h4>
            <Tooltip 
              content="GPT-5 generated insights based on your business patterns"
              position="top"
            />
          </div>
          <div className="space-y-2">
            {insights.slice(0, compact ? 2 : 3).map((insight, index) => (
              <div key={index} className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-purple-400 mt-1 flex-shrink-0" />
                <span className="text-sm text-purple-200">{insight}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Proactive Suggestions */}
      <div className="space-y-3">
        {filteredSuggestions.length === 0 && !isLoading && (
          <div className="text-center py-8 bg-slate-700/30 rounded-xl border border-slate-600/30">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4 opacity-50" />
            <p className="text-gray-300">No active suggestions right now.</p>
            <p className="text-gray-400 text-sm">I'll analyze your CRM activity and suggest helpful actions.</p>
          </div>
        )}

        {filteredSuggestions.map((suggestion) => {
          const TypeIcon = getTypeIcon(suggestion.type);
          
          return (
            <div
              key={suggestion.id}
              className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 hover:scale-102 group ${getTypeColor(suggestion.type)}`}
              onClick={() => setSelectedSuggestion(suggestion)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <TypeIcon className="h-5 w-5" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-white">{suggestion.title}</h4>
                      {getPriorityIcon(suggestion.priority)}
                      <span className="text-xs bg-white/10 px-2 py-1 rounded-full">
                        {suggestion.confidence}%
                      </span>
                    </div>
                    <p className="text-sm opacity-90 mt-1">{suggestion.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {suggestion.estimatedValue && (
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                      ${suggestion.estimatedValue.toLocaleString()}
                    </span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      dismissSuggestion(suggestion.id);
                    }}
                    className="p-1 rounded text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {suggestion.actionable && suggestion.suggestedCommand && (
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-300 font-mono bg-slate-800/50 px-2 py-1 rounded">
                    "{suggestion.suggestedCommand}"
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSuggestionClick(suggestion);
                    }}
                    className="flex items-center gap-1 text-xs bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full transition-colors"
                  >
                    Execute
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Detailed Suggestion Modal */}
      {selectedSuggestion && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {React.createElement(getTypeIcon(selectedSuggestion.type), {
                    className: "h-6 w-6 text-blue-400"
                  })}
                  <h3 className="text-lg font-bold text-white">{selectedSuggestion.title}</h3>
                </div>
                <button
                  onClick={() => setSelectedSuggestion(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-gray-300 leading-relaxed">{selectedSuggestion.description}</p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                    <div className="text-lg font-bold text-blue-400">{selectedSuggestion.confidence}%</div>
                    <div className="text-xs text-gray-400">Confidence</div>
                  </div>
                  <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                    <div className="text-lg font-bold text-purple-400 capitalize">{selectedSuggestion.priority}</div>
                    <div className="text-xs text-gray-400">Priority</div>
                  </div>
                  <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                    <div className="text-lg font-bold text-green-400 capitalize">{selectedSuggestion.type}</div>
                    <div className="text-xs text-gray-400">Type</div>
                  </div>
                </div>

                {selectedSuggestion.estimatedValue && (
                  <div className="bg-green-500/10 border border-green-400/30 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="h-4 w-4 text-green-400" />
                      <span className="font-medium text-green-300">Estimated Business Value</span>
                    </div>
                    <div className="text-2xl font-bold text-green-400">
                      ${selectedSuggestion.estimatedValue.toLocaleString()}
                    </div>
                  </div>
                )}

                {selectedSuggestion.suggestedCommand && (
                  <div className="bg-slate-700/30 rounded-lg p-3">
                    <div className="text-sm font-medium text-gray-400 mb-2">Suggested Command:</div>
                    <div className="text-sm text-white font-mono bg-slate-800/50 p-2 rounded">
                      "{selectedSuggestion.suggestedCommand}"
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  {selectedSuggestion.actionable && (
                    <button
                      onClick={() => {
                        handleSuggestionClick(selectedSuggestion);
                        setSelectedSuggestion(null);
                      }}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors"
                    >
                      Execute Suggestion
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedSuggestion(null)}
                    className="px-6 py-3 border border-gray-600 text-gray-300 hover:text-white hover:border-gray-500 rounded-lg font-medium transition-colors"
                  >
                    {selectedSuggestion.actionable ? 'Maybe Later' : 'Close'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assistant Activity Status */}
      <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-400" />
            <span className="font-medium text-white">AI Assistant Status</span>
          </div>
          <div className="flex items-center gap-2 text-green-400 text-sm">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            Active
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-400">Suggestions Generated</div>
            <div className="text-white font-medium">{suggestions.length}</div>
          </div>
          <div>
            <div className="text-gray-400">High Priority</div>
            <div className="text-red-400 font-medium">
              {suggestions.filter(s => s.priority === 'high').length}
            </div>
          </div>
          <div>
            <div className="text-gray-400">Actionable Items</div>
            <div className="text-blue-400 font-medium">
              {suggestions.filter(s => s.actionable).length}
            </div>
          </div>
          <div>
            <div className="text-gray-400">Potential Value</div>
            <div className="text-green-400 font-medium">
              ${suggestions.reduce((sum, s) => sum + (s.estimatedValue || 0), 0).toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProactiveAssistantPanel;