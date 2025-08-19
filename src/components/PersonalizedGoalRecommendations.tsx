import React, { useState, useEffect } from 'react';
import { 
  Target, 
  Star, 
  TrendingUp, 
  Clock, 
  Brain, 
  Lightbulb,
  ArrowRight,
  CheckCircle,
  Zap,
  Users,
  Award,
  RefreshCw,
  Eye,
  Sparkles,
  Info,
  DollarSign
} from 'lucide-react';
import { personalizedGoalService } from '../services/personalizedGoalService';
import { Goal } from '../types/goals';
import Tooltip from './Tooltip';

interface PersonalizedRecommendation {
  goal: Goal;
  relevanceScore: number;
  reasoning: string;
  expectedImpact: string;
  setupPriority: number;
  personalizedDescription: string;
  estimatedROI: number;
  timeToValue: string;
  prerequisites?: string[];
  customizationSuggestions: string[];
}

interface PersonalizedGoalRecommendationsProps {
  userId?: string;
  onGoalSelect?: (goal: Goal) => void;
  maxRecommendations?: number;
  showReasoningDetails?: boolean;
  compactView?: boolean;
}

const PersonalizedGoalRecommendations: React.FC<PersonalizedGoalRecommendationsProps> = ({
  userId = 'default-user',
  onGoalSelect,
  maxRecommendations = 6,
  showReasoningDetails = true,
  compactView = false
}) => {
  const [recommendations, setRecommendations] = useState<PersonalizedRecommendation[]>([]);
  const [selectedRecommendation, setSelectedRecommendation] = useState<PersonalizedRecommendation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAllRecommendations, setShowAllRecommendations] = useState(false);
  const [filter, setFilter] = useState<'all' | 'high-impact' | 'quick-wins' | 'strategic'>('all');
  const [hasError, setHasError] = useState(false);

  // Load personalized recommendations
  useEffect(() => {
    console.log('🎯 Loading personalized recommendations...');
    loadRecommendations();
  }, [userId]);

  const loadRecommendations = async (refresh: boolean = false) => {
    setIsLoading(true);
    setHasError(false);
    try {
      console.log('🎯 Generating personalized recommendations...');
      const recs = await personalizedGoalService.generatePersonalizedRecommendations(userId, refresh);
      console.log(`✅ Loaded ${recs.length} recommendations`);
      setRecommendations(recs.slice(0, maxRecommendations));
    } catch (error) {
      console.error('Failed to load recommendations:', error);
      setHasError(true);
      // Set empty recommendations on error to prevent blank screen
      setRecommendations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoalSelect = (recommendation: PersonalizedRecommendation) => {
    // Learn from the selection
    personalizedGoalService.learnFromGoalSelection(userId, recommendation.goal.id);
    
    if (onGoalSelect) {
      onGoalSelect(recommendation.goal);
    }
  };

  const getFilteredRecommendations = () => {
    switch (filter) {
      case 'high-impact':
        return recommendations.filter(r => r.estimatedROI >= 20000);
      case 'quick-wins':
        return recommendations.filter(r => r.setupPriority <= 3);
      case 'strategic':
        return recommendations.filter(r => r.goal.complexity === 'Advanced');
      default:
        return recommendations;
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority <= 2) return 'text-red-400 bg-red-500/20';
    if (priority <= 5) return 'text-orange-400 bg-orange-500/20';
    return 'text-green-400 bg-green-500/20';
  };

  const getRelevanceColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 75) return 'text-blue-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-gray-400';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Brain className="h-6 w-6 text-blue-400 animate-pulse" />
          <h3 className="text-xl font-bold text-white">Analyzing Your Business Needs...</h3>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="bg-slate-700/30 rounded-xl p-6 border border-slate-600/30 animate-pulse">
              <div className="w-full h-4 bg-slate-600/50 rounded mb-3"></div>
              <div className="w-3/4 h-3 bg-slate-600/50 rounded mb-2"></div>
              <div className="w-1/2 h-3 bg-slate-600/50 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  // Error state
  if (hasError && recommendations.length === 0) {
    return (
      <div className="bg-yellow-500/10 border border-yellow-400/30 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="h-6 w-6 text-yellow-400" />
          <h3 className="text-xl font-bold text-white">Recommendations Temporarily Unavailable</h3>
        </div>
        <p className="text-yellow-200 mb-4">
          We're having trouble generating personalized recommendations right now. This could be due to:
        </p>
        <ul className="text-yellow-200 text-sm space-y-1 mb-4 ml-4">
          <li>• API configuration issues</li>
          <li>• Database connection problems</li>
          <li>• Temporary service unavailability</li>
        </ul>
        <div className="flex gap-3">
          <button
            onClick={() => loadRecommendations(true)}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
          <button
            onClick={() => {
              // Show default high-priority goals as fallback
              const fallbackRecs = personalizedGoalService.getFallbackRecommendations();
              setRecommendations(fallbackRecs);
              setHasError(false);
            }}
            className="px-4 py-2 border border-yellow-400 text-yellow-400 hover:bg-yellow-400/10 rounded-lg font-medium transition-colors"
          >
            Show Default Goals
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-white dark:bg-transparent">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Target className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Personalized Recommendations</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">GPT-5 analyzed your business and recommends these goals</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            {['all', 'high-impact', 'quick-wins', 'strategic'].map(filterType => (
              <button
                key={filterType}
                onClick={() => setFilter(filterType as any)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-300 ${
                  filter === filterType
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-600'
                }`}
              >
                {filterType.replace('-', ' ')}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => loadRecommendations(true)}
            className="p-2 rounded-lg bg-purple-500/20 border border-purple-400/30 text-purple-600 dark:text-purple-300 hover:bg-purple-500/30 transition-colors"
            title="Refresh recommendations"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Recommendations Grid */}
      <div className={`grid ${compactView ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'} gap-6`}>
        {getFilteredRecommendations().map((recommendation, index) => (
          <div
            key={recommendation.goal.id}
            className={`relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 cursor-pointer transition-all duration-300 transform hover:scale-105 hover:border-blue-500/30 group ${
              recommendation.setupPriority <= 2 ? 'ring-2 ring-blue-500/20' : ''
            }`}
            onClick={() => setSelectedRecommendation(recommendation)}
          >
            {/* Priority Badge */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(recommendation.setupPriority)}`}>
                Priority #{recommendation.setupPriority}
              </span>
              <div className={`text-lg font-bold ${getRelevanceColor(recommendation.relevanceScore)}`}>
                {recommendation.relevanceScore}%
              </div>
            </div>

            {/* Recommended Badge for Top Priority */}
            {recommendation.setupPriority === 1 && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  RECOMMENDED
                </div>
              </div>
            )}

            {/* Goal Header */}
            <div className="mb-4">
              <h4 className="text-lg font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">
                {recommendation.goal.title}
              </h4>
              <p className="text-sm text-gray-300 mb-3 line-clamp-2">
                {recommendation.personalizedDescription}
              </p>
            </div>

            {/* Value Metrics */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-3 bg-green-500/10 border border-green-400/30 rounded-lg">
                <div className="text-lg font-bold text-green-400">
                  ${(recommendation.estimatedROI / 1000).toFixed(0)}k
                </div>
                <div className="text-xs text-gray-400">Est. ROI</div>
              </div>
              <div className="text-center p-3 bg-blue-500/10 border border-blue-400/30 rounded-lg">
                <div className="text-lg font-bold text-blue-400">{recommendation.timeToValue}</div>
                <div className="text-xs text-gray-400">Time to Value</div>
              </div>
            </div>

            {/* Expected Impact */}
            <div className="mb-4 p-3 bg-purple-500/10 border border-purple-400/30 rounded-lg">
              <div className="text-xs font-medium text-purple-400 mb-1 flex items-center gap-2">
                <TrendingUp className="h-3 w-3" />
                Expected Impact for You
              </div>
              <div className="text-sm text-purple-200">{recommendation.expectedImpact}</div>
            </div>

            {/* Prerequisites */}
            {recommendation.prerequisites && recommendation.prerequisites.length > 0 && (
              <div className="mb-4">
                <div className="text-xs font-medium text-orange-400 mb-2 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Prerequisites:
                </div>
                <div className="space-y-1">
                  {recommendation.prerequisites.map((prereq, i) => (
                    <div key={i} className="text-xs text-orange-200 flex items-center gap-2">
                      <div className="w-1 h-1 bg-orange-400 rounded-full"></div>
                      {prereq}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleGoalSelect(recommendation);
              }}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-all duration-300 transform group-hover:scale-105"
            >
              <span className="flex items-center justify-center gap-2">
                <Zap className="h-4 w-4" />
                Execute This Goal
              </span>
            </button>

            {/* View Details Link */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedRecommendation(recommendation);
              }}
              className="w-full mt-2 py-2 text-gray-400 hover:text-white text-sm transition-colors"
            >
              View personalized details →
            </button>
          </div>
        ))}
      </div>

      {/* Detailed Recommendation Modal */}
      {selectedRecommendation && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">{selectedRecommendation.goal.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-lg font-bold ${getRelevanceColor(selectedRecommendation.relevanceScore)}`}>
                        {selectedRecommendation.relevanceScore}% match
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedRecommendation.setupPriority)}`}>
                        Priority #{selectedRecommendation.setupPriority}
                      </span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => setSelectedRecommendation(null)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                {/* Personalized Description */}
                <div className="bg-blue-500/10 border border-blue-400/30 rounded-xl p-4">
                  <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <Brain className="h-5 w-5 text-blue-400" />
                    Why This Goal is Perfect for You
                  </h4>
                  <p className="text-blue-200 text-sm leading-relaxed">{selectedRecommendation.reasoning}</p>
                </div>

                {/* Expected Impact */}
                <div className="bg-green-500/10 border border-green-400/30 rounded-xl p-4">
                  <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-400" />
                    Expected Impact for Your Business
                  </h4>
                  <p className="text-green-200 text-sm leading-relaxed">{selectedRecommendation.expectedImpact}</p>
                </div>

                {/* Value Metrics */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-slate-700/30 rounded-xl">
                    <div className="text-2xl font-bold text-green-400 mb-1">
                      ${(selectedRecommendation.estimatedROI / 1000).toFixed(0)}k
                    </div>
                    <div className="text-sm text-gray-400">Estimated ROI</div>
                  </div>
                  <div className="text-center p-4 bg-slate-700/30 rounded-xl">
                    <div className="text-2xl font-bold text-blue-400 mb-1">{selectedRecommendation.timeToValue}</div>
                    <div className="text-sm text-gray-400">Time to Value</div>
                  </div>
                  <div className="text-center p-4 bg-slate-700/30 rounded-xl">
                    <div className="text-2xl font-bold text-purple-400 mb-1">{selectedRecommendation.goal.agentsRequired.length}</div>
                    <div className="text-sm text-gray-400">AI Agents</div>
                  </div>
                </div>

                {/* Customization Suggestions */}
                {selectedRecommendation.customizationSuggestions.length > 0 && (
                  <div className="bg-purple-500/10 border border-purple-400/30 rounded-xl p-4">
                    <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-purple-400" />
                      Customization Suggestions
                    </h4>
                    <div className="space-y-2">
                      {selectedRecommendation.customizationSuggestions.map((suggestion, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Lightbulb className="h-4 w-4 text-purple-400" />
                          <span className="text-sm text-purple-200">{suggestion}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Prerequisites */}
                {selectedRecommendation.prerequisites && selectedRecommendation.prerequisites.length > 0 && (
                  <div className="bg-orange-500/10 border border-orange-400/30 rounded-xl p-4">
                    <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                      <Clock className="h-5 w-5 text-orange-400" />
                      Recommended Prerequisites
                    </h4>
                    <div className="space-y-2">
                      {selectedRecommendation.prerequisites.map((prereq, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-orange-400" />
                          <span className="text-sm text-orange-200">{prereq}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Required Agents */}
                <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/30">
                  <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-400" />
                    AI Agents Required
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedRecommendation.goal.agentsRequired.map((agent, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">
                        {agent}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      handleGoalSelect(selectedRecommendation);
                      setSelectedRecommendation(null);
                    }}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-xl font-semibold transition-all duration-300"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <Zap className="h-5 w-5" />
                      Execute This Goal
                    </span>
                  </button>
                  <button
                    onClick={() => setSelectedRecommendation(null)}
                    className="px-6 py-3 border border-slate-600 text-gray-300 hover:text-white hover:border-slate-500 rounded-xl font-medium transition-colors"
                  >
                    Maybe Later
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Show More Button */}
      {recommendations.length > maxRecommendations && (
        <div className="text-center">
          <button
            onClick={() => setShowAllRecommendations(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-700/50 border border-slate-600/50 hover:border-blue-500/30 text-gray-300 hover:text-white rounded-xl font-medium transition-all duration-300"
          >
            <Eye className="h-5 w-5" />
            View All Personalized Recommendations
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Learning Indicator */}
      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-400/30 rounded-xl p-4">
        <div className="flex items-center gap-3 mb-2">
          <Brain className="h-5 w-5 text-purple-400" />
          <span className="font-semibold text-purple-300">AI Learning Active</span>
          <Tooltip 
            content="GPT-5 learns from your selections and improves recommendations over time"
            position="top"
          />
        </div>
        <p className="text-purple-200 text-sm">
          These recommendations improve as I learn more about your business patterns and preferences. 
          Each goal you select helps me understand your priorities better.
        </p>
      </div>
    </div>
  );
};

export default PersonalizedGoalRecommendations;