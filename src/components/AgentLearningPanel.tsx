import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  TrendingUp, 
  Users, 
  Target, 
  Activity,
  AlertTriangle,
  BarChart3,
  Lightbulb,
  RefreshCw,
  Bot,
  Zap
} from 'lucide-react';
import { agentLearningService } from '../services/agentLearningService';
import Tooltip from './Tooltip';

interface LearningInsight {
  id: string;
  agentName: string;
  insightType: 'performance_improvement' | 'user_preference' | 'process_optimization' | 'error_pattern';
  title: string;
  description: string;
  actionable: boolean;
  implementationSuggestion?: string;
  expectedImprovement: string;
  confidence: number;
  createdAt: Date;
}

interface AgentPerformanceData {
  agentName: string;
  totalExecutions: number;
  successRate: number;
  averageExecutionTime: number;
  userSatisfactionScore: number;
  improvementTrends: {
    timeframe: string;
    metricChange: number;
  }[];
  commonFailureReasons: string[];
  optimizationSuggestions: string[];
}

interface AgentLearningPanelProps {
  userId?: string;
  realMode?: boolean;
  compact?: boolean;
  onInsightApply?: (insight: LearningInsight) => void;
}

const AgentLearningPanel: React.FC<AgentLearningPanelProps> = ({
  userId = 'default-user',
  realMode = false,
  compact = false,
  onInsightApply
}) => {
  const [learningInsights, setLearningInsights] = useState<LearningInsight[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [agentPerformance, setAgentPerformance] = useState<Record<string, AgentPerformanceData>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showPerformanceDetails, setShowPerformanceDetails] = useState(false);

  const agentNames = [
    'AI SDR Agent', 'AI AE Agent', 'Email Agent', 'Voice Agent',
    'Calendar Agent', 'Follow-up Agent', 'Lead Scoring Agent', 'Timeline Logger Agent'
  ];

  useEffect(() => {
    if (realMode) {
      loadLearningInsights();
      loadAgentPerformance();
    }
  }, [userId, realMode]);

  const loadLearningInsights = async () => {
    setIsAnalyzing(true);
    try {
      const insights = await agentLearningService.analyzeAgentPerformance(userId);
      setLearningInsights(insights);
    } catch (error) {
      console.error('Failed to load learning insights:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const loadAgentPerformance = async () => {
    try {
      const performanceData: Record<string, AgentPerformanceData> = {};
      
      agentNames.forEach(agentName => {
        const data = agentLearningService.getAgentPerformance(agentName);
        if (data) {
          performanceData[agentName] = data;
        }
      });

      setAgentPerformance(performanceData);
    } catch (error) {
      console.error('Failed to load agent performance:', error);
    }
  };

  const handleApplyInsight = async (insight: LearningInsight) => {
    try {
      await agentLearningService.applyLearningInsights(userId, [insight]);
      
      // Remove applied insight from list
      setLearningInsights(prev => prev.filter(i => i.id !== insight.id));
      
      if (onInsightApply) {
        onInsightApply(insight);
      }

      console.log('✅ Applied learning insight:', insight.title);
    } catch (error) {
      console.error('Failed to apply insight:', error);
    }
  };

  const getInsightTypeIcon = (type: string) => {
    switch (type) {
      case 'performance_improvement': return TrendingUp;
      case 'user_preference': return Users;
      case 'process_optimization': return Target;
      case 'error_pattern': return AlertTriangle;
      default: return Lightbulb;
    }
  };

  const getInsightTypeColor = (type: string) => {
    switch (type) {
      case 'performance_improvement': return 'text-green-400 bg-green-500/20 border-green-400/30';
      case 'user_preference': return 'text-blue-400 bg-blue-500/20 border-blue-400/30';
      case 'process_optimization': return 'text-purple-400 bg-purple-500/20 border-purple-400/30';
      case 'error_pattern': return 'text-red-400 bg-red-500/20 border-red-400/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-400/30';
    }
  };

  const getPerformanceColor = (value: number, metric: string) => {
    let threshold = 80;
    if (metric === 'successRate' || metric === 'userSatisfactionScore') threshold = 85;
    if (metric === 'averageExecutionTime') return value < 2000 ? 'text-green-400 dark:text-green-600' : 'text-yellow-400 dark:text-yellow-600';
    
    return value >= threshold ? 'text-green-400 dark:text-green-600' : value >= 70 ? 'text-yellow-400 dark:text-yellow-600' : 'text-red-400 dark:text-red-600';
  };

  if (!realMode) {
    return (
      <div className="bg-slate-700/30 dark:bg-white/5 rounded-xl p-4 border border-slate-600/30 dark:border-white/10">
        <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 mb-2">
          <Brain className="h-4 w-4" />
          <span className={compact ? 'text-sm' : 'text-base'}>Agent Learning</span>
        </div>
        <p className="text-gray-300 dark:text-gray-400 text-sm">
          Switch to Live Mode to enable agent learning and performance optimization based on usage patterns.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="h-6 w-6 text-purple-400 dark:text-purple-600" />
          <div>
            <h3 className={`font-bold text-white dark:text-gray-900 ${compact ? 'text-lg' : 'text-xl'}`}>
              Agent Learning & Performance
            </h3>
            <p className="text-gray-300 dark:text-gray-600 text-sm">
              AI agents continuously improve based on results
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPerformanceDetails(!showPerformanceDetails)}
            className="p-2 rounded-lg bg-purple-500/20 dark:bg-purple-200 border border-purple-400/30 dark:border-purple-400 text-purple-300 dark:text-purple-600 hover:bg-purple-500/30 dark:hover:bg-purple-300 transition-colors"
          >
            <BarChart3 className="h-4 w-4" />
          </button>
          
          <button
            onClick={loadLearningInsights}
            disabled={isAnalyzing}
            className="p-2 rounded-lg bg-blue-500/20 dark:bg-blue-200 border border-blue-400/30 dark:border-blue-400 text-blue-300 dark:text-blue-600 hover:bg-blue-500/30 dark:hover:bg-blue-300 transition-colors disabled:opacity-50"
          >
            {isAnalyzing ? (
              <div className="animate-spin w-4 h-4 border-2 border-blue-400 dark:border-blue-600 border-t-transparent rounded-full"></div>
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Agent Performance Overview */}
      {showPerformanceDetails && Object.keys(agentPerformance).length > 0 && (
        <div className="bg-slate-700/30 dark:bg-white/5 rounded-xl p-6 border border-slate-600/30 dark:border-white/10">
          <h4 className="font-semibold text-white dark:text-gray-900 mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-400 dark:text-blue-600" />
            Agent Performance Metrics
          </h4>
          
          <div className="grid gap-4">
            {Object.values(agentPerformance).slice(0, compact ? 4 : 6).map((agent) => (
              <div key={agent.agentName} className="p-4 bg-slate-600/30 dark:bg-gray-200 rounded-lg border border-slate-500/30 dark:border-gray-300">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Bot className="h-5 w-5 text-purple-400 dark:text-purple-600" />
                    <span className="font-medium text-white dark:text-gray-900">{agent.agentName}</span>
                  </div>
                  <div className="text-sm text-gray-400 dark:text-gray-500">
                    {agent.totalExecutions} executions
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="text-center">
                    <div className={`font-bold ${getPerformanceColor(agent.successRate, 'successRate')}`}>
                      {Math.round(agent.successRate)}%
                    </div>
                    <div className="text-gray-400 dark:text-gray-500 text-xs">Success Rate</div>
                  </div>
                  <div className="text-center">
                    <div className={`font-bold ${getPerformanceColor(agent.averageExecutionTime, 'averageExecutionTime')}`}>
                      {(agent.averageExecutionTime / 1000).toFixed(1)}s
                    </div>
                    <div className="text-gray-400 dark:text-gray-500 text-xs">Avg Time</div>
                  </div>
                  <div className="text-center">
                    <div className={`font-bold ${getPerformanceColor(agent.userSatisfactionScore, 'userSatisfactionScore')}`}>
                      {Math.round(agent.userSatisfactionScore)}%
                    </div>
                    <div className="text-gray-400 dark:text-gray-500 text-xs">Satisfaction</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Learning Insights */}
      <div className="space-y-3">
        {learningInsights.length === 0 && !isAnalyzing && (
          <div className="text-center py-8 bg-slate-700/30 dark:bg-white/5 rounded-xl border border-slate-600/30 dark:border-white/10">
            <Brain className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4 opacity-50" />
            <p className="text-gray-300 dark:text-gray-400">Learning insights will appear as agents gain experience</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm">Execute some goals to start the learning process</p>
          </div>
        )}

        {learningInsights.map((insight) => {
          const TypeIcon = getInsightTypeIcon(insight.insightType);
          
          return (
            <div
              key={insight.id}
              className={`p-4 rounded-xl border transition-all duration-300 hover:scale-102 ${getInsightTypeColor(insight.insightType)}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <TypeIcon className="h-5 w-5" />
                  <div>
                    <h4 className="font-semibold text-white dark:text-gray-900">{insight.title}</h4>
                    <p className="text-sm opacity-90 mt-1">{insight.description}</p>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                      Agent: {insight.agentName} • Confidence: {insight.confidence}%
                    </div>
                  </div>
                </div>
              </div>

              {insight.actionable && insight.implementationSuggestion && (
                <div className="mt-3 p-3 bg-slate-800/50 dark:bg-white/20 rounded-lg border-l-4 border-blue-500 dark:border-blue-600">
                  <div className="text-sm font-medium text-blue-300 dark:text-blue-700 mb-1">Implementation Suggestion:</div>
                  <div className="text-sm text-blue-200 dark:text-blue-800">{insight.implementationSuggestion}</div>
                  <div className="text-xs text-green-300 dark:text-green-700 mt-2">
                    Expected improvement: {insight.expectedImprovement}
                  </div>
                </div>
              )}

              {insight.actionable && (
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={() => handleApplyInsight(insight)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg font-medium transition-colors text-sm"
                  >
                    <Zap className="h-4 w-4" />
                    Apply Learning
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Agent Selection for Detailed View */}
      {Object.keys(agentPerformance).length > 0 && (
        <div className="bg-slate-700/30 dark:bg-white/5 rounded-xl p-4 border border-slate-600/30 dark:border-white/10">
          <h4 className="font-medium text-white dark:text-gray-900 mb-3 flex items-center gap-2">
            <Target className="h-4 w-4 text-orange-400 dark:text-orange-600" />
            Agent Performance Tracking
          </h4>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {agentNames.slice(0, compact ? 4 : 8).map((agentName) => {
              const performance = agentPerformance[agentName];
              
              return (
                <button
                  key={agentName}
                  onClick={() => setSelectedAgent(selectedAgent === agentName ? '' : agentName)}
                  className={`p-3 rounded-lg border transition-all duration-300 text-left ${
                    selectedAgent === agentName
                      ? 'bg-purple-500/20 dark:bg-purple-200 border-purple-400/30 dark:border-purple-400'
                      : 'bg-slate-600/30 dark:bg-gray-300 border-slate-500/30 dark:border-gray-400 hover:border-purple-500/30 dark:hover:border-purple-400'
                  }`}
                >
                  <div className="font-medium text-white dark:text-gray-900 text-sm mb-1">
                    {agentName.replace(' Agent', '')}
                  </div>
                  {performance && (
                    <div className="flex items-center gap-2">
                      <div className={`text-xs font-bold ${getPerformanceColor(performance.successRate, 'successRate')}`}>
                        {Math.round(performance.successRate)}%
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500">success</div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected Agent Details */}
          {selectedAgent && agentPerformance[selectedAgent] && (
            <div className="mt-4 p-4 bg-slate-600/30 dark:bg-gray-200 rounded-lg border border-slate-500/30 dark:border-gray-300">
              <h5 className="font-medium text-white dark:text-gray-900 mb-3">{selectedAgent} Performance</h5>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className={`text-lg font-bold ${getPerformanceColor(agentPerformance[selectedAgent].successRate, 'successRate')}`}>
                    {Math.round(agentPerformance[selectedAgent].successRate)}%
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">Success Rate</div>
                </div>
                <div className="text-center">
                  <div className={`text-lg font-bold ${getPerformanceColor(agentPerformance[selectedAgent].averageExecutionTime, 'averageExecutionTime')}`}>
                    {(agentPerformance[selectedAgent].averageExecutionTime / 1000).toFixed(1)}s
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">Avg Time</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-400 dark:text-blue-600">
                    {agentPerformance[selectedAgent].totalExecutions}
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">Total Runs</div>
                </div>
                <div className="text-center">
                  <div className={`text-lg font-bold ${getPerformanceColor(agentPerformance[selectedAgent].userSatisfactionScore, 'userSatisfactionScore')}`}>
                    {Math.round(agentPerformance[selectedAgent].userSatisfactionScore)}%
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">Satisfaction</div>
                </div>
              </div>

              {/* Common Failure Reasons */}
              {agentPerformance[selectedAgent].commonFailureReasons.length > 0 && (
                <div className="mt-4">
                  <div className="text-sm font-medium text-red-400 dark:text-red-600 mb-2">Common Issues:</div>
                  <div className="space-y-1">
                    {agentPerformance[selectedAgent].commonFailureReasons.map((reason, index) => (
                      <div key={index} className="text-xs text-red-300 dark:text-red-700 flex items-center gap-2">
                        <AlertTriangle className="h-3 w-3" />
                        {reason}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Learning Status */}
      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 dark:from-purple-100 dark:to-pink-100 border border-purple-400/30 dark:border-purple-400 rounded-xl p-4">
        <div className="flex items-center gap-3 mb-2">
          <Activity className="h-5 w-5 text-purple-400 dark:text-purple-600" />
          <span className="font-semibold text-purple-300 dark:text-purple-700">Learning System Active</span>
          <Tooltip 
            content="AI agents learn from every interaction to improve their performance"
            position="top"
          />
        </div>
        <p className="text-purple-200 dark:text-purple-800 text-sm">
          {learningInsights.length} new insights generated from recent agent executions. 
          Applying these insights will improve future agent performance.
        </p>
      </div>
    </div>
  );
};

export default AgentLearningPanel;