import React, { useState, useEffect } from 'react';
import { Goal } from '../types/goals';
import { 
  Play, 
  Pause, 
  CheckCircle, 
  Clock, 
  Zap, 
  Users, 
  Target,
  ArrowRight,
  Star,
  TrendingUp,
  Activity,
  Bot,
  Settings,
  ExternalLink,
  Sparkles,
  GitBranch,
  Info,
  HelpCircle
} from 'lucide-react';
import { runComposioAgent } from '../agents/composioAgentRunner';
import Tooltip from './Tooltip';

interface InteractiveGoalCardProps {
  goal: Goal;
  onExecute: (goal: Goal) => void;
  isExecuting?: boolean;
  executionProgress?: number;
  realMode?: boolean;
}

const InteractiveGoalCard: React.FC<InteractiveGoalCardProps> = ({
  goal,
  onExecute,
  isExecuting = false,
  executionProgress = 0,
  realMode = false
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [liveMetrics, setLiveMetrics] = useState({
    estimatedValue: Math.floor(Math.random() * 50000) + 10000,
    timeToComplete: Math.floor(Math.random() * 30) + 5,
    confidence: Math.floor(Math.random() * 20) + 80
  });

  // Simulate live metrics updates
  useEffect(() => {
    if (isExecuting) {
      const interval = setInterval(() => {
        setLiveMetrics(prev => ({
          ...prev,
          estimatedValue: prev.estimatedValue + Math.floor(Math.random() * 1000),
          timeToComplete: Math.max(1, prev.timeToComplete - 1),
          confidence: Math.min(99, prev.confidence + Math.floor(Math.random() * 3))
        }));
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isExecuting]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'red';
      case 'Medium': return 'yellow';
      case 'Low': return 'green';
      default: return 'gray';
    }
  };

  const getComplexityIcon = (complexity: string) => {
    switch (complexity) {
      case 'Simple': return <Zap className="h-4 w-4 text-green-400" />;
      case 'Intermediate': return <Target className="h-4 w-4 text-yellow-400" />;
      case 'Advanced': return <Star className="h-4 w-4 text-red-400" />;
      default: return <Zap className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div 
      className={`relative group cursor-pointer transition-all duration-500 transform ${
        isHovered ? 'scale-105 z-10' : ''
      } ${isExecuting ? 'ring-2 ring-blue-500/50 ring-offset-2 ring-offset-slate-900' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main Goal Card */}
      <div className={`relative p-6 rounded-2xl border backdrop-blur-xl transition-all duration-500 overflow-hidden ${
        isExecuting 
          ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-blue-400/50'
          : isHovered
          ? 'bg-gradient-to-br from-slate-800/90 to-slate-900/90 border-blue-500/30 shadow-xl shadow-blue-500/10'
          : 'bg-gradient-to-br from-slate-800/70 to-slate-900/70 border-slate-700/50'
      }`}>
        
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className={`absolute inset-0 transition-all duration-1000 ${
            isHovered ? 'scale-110 rotate-1' : 'scale-100'
          }`} style={{
            backgroundImage: 'radial-gradient(circle at 25% 25%, #3b82f6 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}></div>
        </div>

        {/* Execution Progress Overlay */}
        {isExecuting && (
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 animate-pulse">
            <div 
              className="h-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 transition-all duration-300"
              style={{ width: `${executionProgress}%` }}
            />
          </div>
        )}

        {/* Header */}
        <div className="relative z-10 mb-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-medium bg-${getPriorityColor(goal.priority)}-500/20 text-${getPriorityColor(goal.priority)}-400 border border-${getPriorityColor(goal.priority)}-500/30`}>
                {goal.priority} Priority
              </span>
              {getComplexityIcon(goal.complexity)}
              <Tooltip 
                content={`${goal.complexity} complexity, ${goal.priority} priority goal`}
                position="top"
              />
            </div>
            
            {isExecuting && (
              <div className="flex items-center gap-2 bg-blue-500/20 px-3 py-1 rounded-full border border-blue-400/30">
                <Activity className="h-4 w-4 text-blue-400 animate-pulse" />
                <span className="text-xs text-blue-300">Executing</span>
              </div>
            )}
          </div>

          <h3 className={`text-lg font-bold transition-colors duration-300 ${
            isHovered ? 'text-white' : 'text-gray-200'
          }`}>
            {goal.title}
          </h3>
          <p className="text-sm text-gray-300 mt-2 line-clamp-2">{goal.description}</p>
        </div>

        {/* Business Impact */}
        <div className="relative z-10 mb-4 p-3 rounded-lg bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-400/20">
          <div className="text-xs font-medium text-green-400 mb-1 flex items-center gap-2">
            <TrendingUp className="h-3 w-3" />
            Business Impact
            <Tooltip 
              content="The measurable business outcome this goal delivers"
              position="top"
            />
          </div>
          <div className="text-sm text-gray-300">{goal.businessImpact}</div>
        </div>

        {/* Live Metrics (when hovered or executing) */}
        {(isHovered || isExecuting) && (
          <div className="relative z-10 mb-4 space-y-3 animate-fadeIn">
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-2 bg-slate-700/30 rounded-lg">
                <div className="text-lg font-bold text-green-400">${liveMetrics.estimatedValue.toLocaleString()}</div>
                <div className="text-xs text-gray-400">Est. Value</div>
              </div>
              <div className="text-center p-2 bg-slate-700/30 rounded-lg">
                <div className="text-lg font-bold text-blue-400">{liveMetrics.timeToComplete}m</div>
                <div className="text-xs text-gray-400">Setup</div>
              </div>
              <div className="text-center p-2 bg-slate-700/30 rounded-lg">
                <div className="text-lg font-bold text-purple-400">{liveMetrics.confidence}%</div>
                <div className="text-xs text-gray-400">Success</div>
              </div>
            </div>
          </div>
        )}

        {/* Agents Required */}
        <div className="relative z-10 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-purple-400" />
            <span className="text-xs font-medium text-purple-300">AI Agents Required</span>
            <Tooltip 
              content="Specialized AI agents that collaborate to execute this goal"
              position="top"
            />
          </div>
          <div className="flex flex-wrap gap-1">
            {goal.agentsRequired.slice(0, 3).map((agent, index) => (
              <div key={index} className="flex items-center gap-1 bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full text-xs">
                <Bot className="h-3 w-3" />
                {agent}
              </div>
            ))}
            {goal.agentsRequired.length > 3 && (
              <span className="text-xs bg-slate-600/30 text-gray-400 px-2 py-1 rounded-full">
                +{goal.agentsRequired.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Tools & ROI */}
        <div className="relative z-10 mb-6 grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-400 mb-1 flex items-center gap-1">
              Setup Time
              <Tooltip 
                content="Time required to configure this automation"
                position="top"
              >
                <Info className="h-3 w-3 text-gray-500" />
              </Tooltip>
            </div>
            <div className="flex items-center gap-1 text-blue-400">
              <Clock className="h-4 w-4" />
              {goal.estimatedSetupTime}
            </div>
          </div>
          <div>
            <div className="text-gray-400 mb-1 flex items-center gap-1">
              Expected ROI
              <Tooltip 
                content="Return on investment based on time saved and value generated"
                position="top"
              >
                <Info className="h-3 w-3 text-gray-500" />
              </Tooltip>
            </div>
            <div className="text-green-400 font-medium">{goal.roi}</div>
          </div>
        </div>

        {/* Execution Progress Bar */}
        {isExecuting && (
          <div className="relative z-10 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-blue-300">Execution Progress</span>
              <span className="text-sm text-blue-400">{Math.round(executionProgress)}%</span>
            </div>
            <div className="w-full bg-slate-700/50 rounded-full h-3 relative overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300 relative"
                style={{ width: `${executionProgress}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="relative z-10 space-y-3">
          <button
            onClick={() => onExecute(goal)}
            disabled={isExecuting}
            className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 transform ${
              isExecuting
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : realMode
                ? 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white hover:scale-105 shadow-lg hover:shadow-xl'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white hover:scale-105 shadow-lg hover:shadow-xl'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              {isExecuting ? (
                <>
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                  Executing Goal...
                </>
              ) : (
                <>
                  <Play className="h-5 w-5" />
                  {realMode ? 'Execute Real Goal' : 'Start Interactive Demo'}
                </>
              )}
            </span>
          </button>

          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full py-2 text-gray-300 hover:text-white transition-colors text-sm font-medium"
          >
            <span className="flex items-center justify-center gap-2">
              <Settings className="h-4 w-4" />
              {showDetails ? 'Hide Details' : 'View Details'}
            </span>
          </button>
        </div>

        {/* Floating Action Indicators */}
        {isHovered && !isExecuting && (
          <div className="absolute top-4 right-4 space-y-2 animate-fadeIn">
            <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center border border-blue-400/30">
              <Sparkles className="h-4 w-4 text-blue-400" />
            </div>
          </div>
        )}

        {/* Agent Network Indicator */}
        {isExecuting && (
          <div className="absolute bottom-4 right-4 flex items-center gap-2 animate-pulse">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full" style={{animationDelay: '0.5s'}}></div>
            <div className="w-2 h-2 bg-green-400 rounded-full" style={{animationDelay: '1s'}}></div>
            <GitBranch className="h-4 w-4 text-gray-400" />
          </div>
        )}

        {/* Mode Indicator for Live Mode */}
        {realMode && (
          <div className="absolute top-4 right-4">
            <div className="flex items-center gap-2 bg-red-500/20 px-2 py-1 rounded-full border border-red-400/30">
              <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-red-300">Live</span>
            </div>
          </div>
        )}

        {/* Help Button */}
        <div className="absolute bottom-4 left-4">
          <Tooltip 
            content={`${goal.complexity} complexity goal with ${goal.agentsRequired.length} agents. Expected ROI: ${goal.roi}`}
            position="top"
            trigger="hover"
            icon="help"
          />
        </div>
      </div>

      {/* Expanded Details Panel */}
      {showDetails && (
        <div className="mt-4 p-6 bg-slate-800/80 backdrop-blur-xl rounded-xl border border-slate-700/50 animate-slideDown">
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                Real-World Example
                <Tooltip 
                  content="How this goal works in an actual business scenario"
                  position="top"
                />
              </h4>
              <p className="text-sm text-gray-300">{goal.realWorldExample}</p>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                Success Metrics
                <Tooltip 
                  content="Measurable outcomes that indicate successful execution"
                  position="top"
                />
              </h4>
              <div className="grid grid-cols-1 gap-2">
                {goal.successMetrics.map((metric, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-sm text-gray-300">{metric}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                Tools Integration
                <Tooltip 
                  content="Business tools required for this automation"
                  position="top"
                />
              </h4>
              <div className="flex flex-wrap gap-2">
                {goal.toolsNeeded.map((tool, index) => (
                  <span key={index} className="text-xs bg-slate-600/30 text-gray-400 px-2 py-1 rounded-full">
                    {tool}
                  </span>
                ))}
              </div>
            </div>

            {/* Mode-specific information */}
            {realMode ? (
              <div className="p-3 bg-red-500/10 border border-red-400/30 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  <span className="text-red-300 text-sm font-medium">Live Mode Warning</span>
                </div>
                <p className="text-red-200 text-xs">
                  This goal will execute real actions using your configured APIs and business tools.
                  Make sure you've set up the required integrations before proceeding.
                </p>
              </div>
            ) : (
              <div className="p-3 bg-blue-500/10 border border-blue-400/30 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Info className="h-4 w-4 text-blue-400" />
                  <span className="text-blue-300 text-sm font-medium">Demo Mode Info</span>
                </div>
                <p className="text-blue-200 text-xs">
                  In Demo Mode, this goal will simulate execution with realistic responses, but no real actions will be performed.
                  Perfect for exploring how this automation works.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveGoalCard;