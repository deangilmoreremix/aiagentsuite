import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  TrendingUp, 
  Lightbulb, 
  MessageSquare, 
  BarChart3,
  Clock,
  Star,
  Target,
  CheckCircle,
  ArrowRight,
  Eye,
  Sparkles,
  Activity,
  Award,
  RefreshCw
} from 'lucide-react';
import { conversationInsightsService } from '../services/conversationInsightsService';
import Tooltip from './Tooltip';

interface ConversationInsight {
  id: string;
  type: 'communication_pattern' | 'effectiveness_tip' | 'goal_suggestion' | 'optimization_opportunity';
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
  suggestedAction?: string;
  potentialImpact: string;
  createdAt: Date;
}

interface ConversationAnalytics {
  totalInteractions: number;
  averageResponseTime: number;
  userSatisfactionScore: number;
  topTopics: string[];
  communicationPatterns: {
    preferredStyle: 'concise' | 'detailed' | 'conversational';
    peakActivityTimes: string[];
    frequentRequests: string[];
  };
  improvementOpportunities: string[];
}

interface ConversationInsightsPanelProps {
  userId?: string;
  realMode?: boolean;
  compact?: boolean;
  onInsightAction?: (insight: ConversationInsight) => void;
}

const ConversationInsightsPanel: React.FC<ConversationInsightsPanelProps> = ({
  userId = 'default-user',
  realMode = false,
  compact = false,
  onInsightAction
}) => {
  const [insights, setInsights] = useState<ConversationInsight[]>([]);
  const [analytics, setAnalytics] = useState<ConversationAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<ConversationInsight | null>(null);

  // Load insights when component mounts or realMode changes
  useEffect(() => {
    if (realMode) {
      loadInsights();
      loadAnalytics();
    }
  }, [userId, realMode]);

  const loadInsights = async () => {
    setIsLoading(true);
    try {
      const newInsights = await conversationInsightsService.generateConversationInsights(userId);
      setInsights(newInsights);
    } catch (error) {
      console.error('Failed to load conversation insights:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const newAnalytics = await conversationInsightsService.analyzeConversationEffectiveness(userId);
      setAnalytics(newAnalytics);
    } catch (error) {
      console.error('Failed to load conversation analytics:', error);
    }
  };

  const handleInsightAction = (insight: ConversationInsight) => {
    if (onInsightAction) {
      onInsightAction(insight);
    }
    
    // Remove insight after action
    setInsights(prev => prev.filter(i => i.id !== insight.id));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'communication_pattern': return MessageSquare;
      case 'effectiveness_tip': return TrendingUp;
      case 'goal_suggestion': return Target;
      case 'optimization_opportunity': return Sparkles;
      default: return Lightbulb;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'communication_pattern': return 'text-blue-400 bg-blue-500/20 border-blue-400/30';
      case 'effectiveness_tip': return 'text-green-400 bg-green-500/20 border-green-400/30';
      case 'goal_suggestion': return 'text-purple-400 bg-purple-500/20 border-purple-400/30';
      case 'optimization_opportunity': return 'text-orange-400 bg-orange-500/20 border-orange-400/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-400/30';
    }
  };

  if (!realMode) {
    return (
      <div className="bg-slate-700/30 dark:bg-white/5 rounded-xl p-4 border border-slate-600/30 dark:border-white/10">
        <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 mb-2">
          <Brain className="h-4 w-4" />
          <span className={compact ? 'text-sm' : 'text-base'}>Conversation Insights</span>
        </div>
        <p className="text-gray-300 dark:text-gray-400 text-sm">
          Switch to Live Mode to get AI-powered insights about your communication patterns and effectiveness.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="h-6 w-6 text-blue-400 dark:text-blue-300" />
          <div>
            <h3 className={`font-bold text-white dark:text-gray-200 ${compact ? 'text-lg' : 'text-xl'}`}>
              Conversation Insights
            </h3>
            <p className="text-gray-300 dark:text-gray-400 text-sm">
              AI analysis of your communication patterns
            </p>
          </div>
        </div>

        <button
          onClick={loadInsights}
          disabled={isLoading}
          className="p-2 rounded-lg bg-blue-500/20 dark:bg-blue-400/20 border border-blue-400/30 dark:border-blue-300/30 text-blue-300 dark:text-blue-200 hover:bg-blue-500/30 dark:hover:bg-blue-400/30 transition-colors disabled:opacity-50"
        >
          {isLoading ? (
            <div className="animate-spin w-4 h-4 border-2 border-blue-400 dark:border-blue-300 border-t-transparent rounded-full"></div>
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Analytics Summary */}
      {analytics && (
        <div className="bg-gradient-to-r from-slate-700/30 to-slate-800/30 dark:from-white/5 dark:to-white/10 rounded-xl p-6 border border-slate-600/30 dark:border-white/10">
          <h4 className="font-semibold text-white dark:text-gray-200 mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-green-400 dark:text-green-300" />
            Communication Analytics
          </h4>
          
          <div className="grid md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400 dark:text-blue-300">{analytics.totalInteractions}</div>
              <div className="text-sm text-gray-400 dark:text-gray-500">Total Interactions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400 dark:text-green-300">{analytics.averageResponseTime.toFixed(1)}s</div>
              <div className="text-sm text-gray-400 dark:text-gray-500">Avg Response Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400 dark:text-purple-300">{analytics.userSatisfactionScore}%</div>
              <div className="text-sm text-gray-400 dark:text-gray-500">Satisfaction Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-400 dark:text-orange-300 capitalize">{analytics.communicationPatterns.preferredStyle}</div>
              <div className="text-sm text-gray-400 dark:text-gray-500">Preferred Style</div>
            </div>
          </div>

          {/* Top Topics */}
          {analytics.topTopics.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-600/30 dark:border-white/10">
              <div className="text-sm font-medium text-gray-400 dark:text-gray-500 mb-2">Top Discussion Topics:</div>
              <div className="flex flex-wrap gap-2">
                {analytics.topTopics.map((topic, index) => (
                  <span key={index} className="px-3 py-1 bg-blue-500/20 dark:bg-blue-400/20 text-blue-300 dark:text-blue-200 rounded-full text-sm">
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Insights List */}
      <div className="space-y-3">
        {insights.length === 0 && !isLoading && (
          <div className="text-center py-8 bg-slate-700/30 dark:bg-white/5 rounded-xl border border-slate-600/30 dark:border-white/10">
            <MessageSquare className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4 opacity-50" />
            <p className="text-gray-300 dark:text-gray-400">Continue conversations to generate insights</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm">AI analyzes your communication patterns for improvement suggestions</p>
          </div>
        )}

        {insights.map((insight) => {
          const TypeIcon = getTypeIcon(insight.type);
          
          return (
            <div
              key={insight.id}
              className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 hover:scale-102 group ${getTypeColor(insight.type)}`}
              onClick={() => setSelectedInsight(insight)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <TypeIcon className="h-5 w-5" />
                  <div>
                    <h4 className="font-semibold text-white dark:text-gray-200">{insight.title}</h4>
                    <p className="text-sm opacity-90 mt-1">{insight.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-white/10 dark:bg-black/10 px-2 py-1 rounded-full">
                    {insight.confidence}%
                  </span>
                  <Tooltip 
                    content={insight.potentialImpact}
                    position="left"
                  />
                </div>
              </div>

              {insight.actionable && insight.suggestedAction && (
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-300 dark:text-gray-400 font-mono bg-slate-800/50 dark:bg-black/20 px-2 py-1 rounded">
                    {insight.suggestedAction}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleInsightAction(insight);
                    }}
                    className="flex items-center gap-1 text-xs bg-white/10 dark:bg-black/10 hover:bg-white/20 dark:hover:bg-black/20 px-3 py-1 rounded-full transition-colors"
                  >
                    Apply
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Detailed Insight Modal */}
      {selectedInsight && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 dark:from-white dark:to-gray-100 rounded-2xl border border-slate-700 dark:border-gray-300 max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {React.createElement(getTypeIcon(selectedInsight.type), {
                    className: "h-6 w-6 text-blue-400 dark:text-blue-600"
                  })}
                  <h3 className="text-lg font-bold text-white dark:text-gray-900">{selectedInsight.title}</h3>
                </div>
                <button
                  onClick={() => setSelectedInsight(null)}
                  className="text-gray-400 dark:text-gray-600 hover:text-white dark:hover:text-gray-900"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-gray-300 dark:text-gray-700 leading-relaxed">{selectedInsight.description}</p>

                <div className="bg-blue-500/10 dark:bg-blue-100 border border-blue-400/30 dark:border-blue-300 rounded-lg p-3">
                  <div className="text-sm font-medium text-blue-400 dark:text-blue-600 mb-1">Potential Impact</div>
                  <div className="text-blue-200 dark:text-blue-800 text-sm">{selectedInsight.potentialImpact}</div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-slate-700/30 dark:bg-gray-200 rounded-lg">
                    <div className="text-lg font-bold text-green-400 dark:text-green-600">{selectedInsight.confidence}%</div>
                    <div className="text-xs text-gray-400 dark:text-gray-600">Confidence</div>
                  </div>
                  <div className="text-center p-3 bg-slate-700/30 dark:bg-gray-200 rounded-lg">
                    <div className="text-lg font-bold text-purple-400 dark:text-purple-600 capitalize">{selectedInsight.type.replace('_', ' ')}</div>
                    <div className="text-xs text-gray-400 dark:text-gray-600">Type</div>
                  </div>
                </div>

                {selectedInsight.suggestedAction && (
                  <div className="bg-slate-700/30 dark:bg-gray-200 rounded-lg p-3">
                    <div className="text-sm font-medium text-gray-400 dark:text-gray-600 mb-2">Suggested Action:</div>
                    <div className="text-sm text-white dark:text-gray-900 font-mono bg-slate-800/50 dark:bg-gray-300 p-2 rounded">
                      {selectedInsight.suggestedAction}
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  {selectedInsight.actionable && selectedInsight.suggestedAction && (
                    <button
                      onClick={() => {
                        handleInsightAction(selectedInsight);
                        setSelectedInsight(null);
                      }}
                      className="flex-1 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white py-3 rounded-lg font-semibold transition-colors"
                    >
                      Apply Insight
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedInsight(null)}
                    className="px-6 py-3 border border-gray-600 dark:border-gray-300 text-gray-300 dark:text-gray-700 hover:text-white dark:hover:text-gray-900 hover:border-gray-500 dark:hover:border-gray-400 rounded-lg font-medium transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-3 text-blue-400 dark:text-blue-600">
            <div className="animate-spin w-5 h-5 border-2 border-blue-400 dark:border-blue-600 border-t-transparent rounded-full"></div>
            <span>Analyzing conversation patterns...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConversationInsightsPanel;