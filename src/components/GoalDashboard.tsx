import React, { useState, useEffect } from 'react';
import { Goal, GoalProgress } from '../types/goals';
import { allGoals, goalCategories } from '../data/goalsData';
import { 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  BarChart3, 
  Target, 
  Zap,
  Users,
  Star,
  ArrowRight,
  Play,
  Trophy,
  Activity
} from 'lucide-react';

interface GoalDashboardProps {
  userGoals?: string[];
  showRecommendations?: boolean;
}

const GoalDashboard: React.FC<GoalDashboardProps> = ({ 
  userGoals = [], 
  showRecommendations = true 
}) => {
  const [goalProgress, setGoalProgress] = useState<Record<string, GoalProgress>>({});
  const [activeGoal, setActiveGoal] = useState<Goal | null>(null);
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'quarter'>('month');

  // Simulate goal progress data
  useEffect(() => {
    const simulatedProgress: Record<string, GoalProgress> = {};
    
    allGoals.forEach(goal => {
      simulatedProgress[goal.id] = {
        goalId: goal.id,
        status: Math.random() > 0.7 ? 'completed' : Math.random() > 0.4 ? 'in_progress' : 'not_started',
        progress: Math.floor(Math.random() * 100),
        completedSteps: [],
        lastUpdated: new Date(),
        metrics: {
          roi: Math.floor(Math.random() * 500) + 100,
          timeSaved: Math.floor(Math.random() * 20) + 5,
          improvement: Math.floor(Math.random() * 300) + 50
        }
      };
    });
    
    setGoalProgress(simulatedProgress);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400 bg-green-500/20';
      case 'in_progress': return 'text-blue-400 bg-blue-500/20';
      case 'not_started': return 'text-gray-400 bg-gray-500/20';
      case 'failed': return 'text-red-400 bg-red-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      case 'not_started': return <AlertCircle className="h-4 w-4" />;
      case 'failed': return <AlertCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const completedGoals = Object.values(goalProgress).filter(p => p.status === 'completed').length;
  const inProgressGoals = Object.values(goalProgress).filter(p => p.status === 'in_progress').length;
  const totalGoals = Object.keys(goalProgress).length;

  const overallProgress = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;

  const highPriorityGoals = allGoals.filter(goal => goal.priority === 'High').slice(0, 6);

  return (
    <div className="space-y-8">
      {/* Header & Overview */}
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Goal Achievement Dashboard</h2>
                <p className="text-gray-300">Track your progress across all 50 business automation goals</p>
              </div>
              <div className="flex gap-3">
                {['week', 'month', 'quarter'].map(period => (
                  <button
                    key={period}
                    onClick={() => setTimeframe(period as any)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                      timeframe === period
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                    }`}
                  >
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Progress Overview */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400 mb-2">{completedGoals}</div>
                <div className="text-sm text-gray-300">Completed Goals</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400 mb-2">{inProgressGoals}</div>
                <div className="text-sm text-gray-300">In Progress</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400 mb-2">{totalGoals}</div>
                <div className="text-sm text-gray-300">Total Goals</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-400 mb-2">{Math.round(overallProgress)}%</div>
                <div className="text-sm text-gray-300">Overall Progress</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">Overall Achievement</span>
                <span className="text-blue-400">{Math.round(overallProgress)}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${overallProgress}%` }}
                ></div>
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {goalCategories.map(category => {
                const categoryGoals = allGoals.filter(g => g.category.toLowerCase() === category.id);
                const categoryCompleted = categoryGoals.filter(g => 
                  goalProgress[g.id]?.status === 'completed'
                ).length;
                const categoryProgress = categoryGoals.length > 0 ? 
                  (categoryCompleted / categoryGoals.length) * 100 : 0;

                return (
                  <div key={category.id} className="bg-slate-700/30 rounded-lg p-4 text-center">
                    <category.icon className="h-6 w-6 text-blue-400 mx-auto mb-2" />
                    <div className="text-white font-medium text-sm mb-1">{category.name}</div>
                    <div className="text-xs text-gray-400 mb-2">{categoryCompleted}/{categoryGoals.length}</div>
                    <div className="w-full bg-slate-600 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${categoryProgress}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Achievements & Stats */}
        <div className="space-y-6">
          {/* Achievement Summary */}
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Trophy className="h-6 w-6 text-yellow-400" />
              <h3 className="text-lg font-semibold text-white">Achievements</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-400/30 rounded-lg">
                <Star className="h-5 w-5 text-green-400" />
                <div>
                  <div className="text-green-300 font-medium text-sm">Sales Automation Expert</div>
                  <div className="text-xs text-green-400">Completed 5+ sales goals</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-blue-500/10 border border-blue-400/30 rounded-lg">
                <Zap className="h-5 w-5 text-blue-400" />
                <div>
                  <div className="text-blue-300 font-medium text-sm">Automation Pioneer</div>
                  <div className="text-xs text-blue-400">10+ workflows automated</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-purple-500/10 border border-purple-400/30 rounded-lg">
                <Activity className="h-5 w-5 text-purple-400" />
                <div>
                  <div className="text-purple-300 font-medium text-sm">Productivity Master</div>
                  <div className="text-xs text-purple-400">500% efficiency increase</div>
                </div>
              </div>
            </div>
          </div>

          {/* This Week's Metrics */}
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="h-6 w-6 text-orange-400" />
              <h3 className="text-lg font-semibold text-white">This {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-300 text-sm">Goals Completed</span>
                <span className="text-green-400 font-bold">12</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300 text-sm">ROI Generated</span>
                <span className="text-blue-400 font-bold">$45.2k</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300 text-sm">Time Saved</span>
                <span className="text-purple-400 font-bold">28 hours</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300 text-sm">Efficiency Gain</span>
                <span className="text-orange-400 font-bold">340%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Goals */}
      {showRecommendations && (
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Target className="h-6 w-6 text-blue-400" />
              <h3 className="text-2xl font-semibold text-white">Recommended High-Impact Goals</h3>
            </div>
            <button className="text-blue-400 hover:text-blue-300 text-sm font-medium">
              View All Goals →
            </button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {highPriorityGoals.map(goal => {
              const progress = goalProgress[goal.id];
              const isCompleted = progress?.status === 'completed';

              return (
                <div
                  key={goal.id}
                  className={`p-6 rounded-xl border transition-all duration-300 cursor-pointer transform hover:scale-105 ${
                    isCompleted
                      ? 'bg-green-500/10 border-green-400/30'
                      : 'bg-slate-700/30 border-slate-600/30 hover:border-blue-500/30'
                  }`}
                  onClick={() => setActiveGoal(goal)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
                      High Priority
                    </span>
                    {progress && (
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(progress.status)}`}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(progress.status)}
                          {progress.status.replace('_', ' ')}
                        </div>
                      </div>
                    )}
                  </div>

                  <h4 className="text-lg font-semibold text-white mb-2">{goal.title}</h4>
                  <p className="text-sm text-gray-300 mb-4">{goal.description}</p>

                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Expected ROI</span>
                      <span className="text-green-400 font-medium">{goal.roi}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Setup Time</span>
                      <span className="text-blue-400">{goal.estimatedSetupTime}</span>
                    </div>
                  </div>

                  {progress && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">Progress</span>
                        <span className="text-blue-400">{progress.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-600 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  <button className={`w-full py-2 rounded-lg font-medium transition-all duration-300 ${
                    isCompleted
                      ? 'bg-green-600 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}>
                    <span className="flex items-center justify-center gap-2">
                      {isCompleted ? (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          Completed
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4" />
                          Start Goal
                        </>
                      )}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Goal Details Modal */}
      {activeGoal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">{activeGoal.title}</h3>
                <button
                  onClick={() => setActiveGoal(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">Description</h4>
                  <p className="text-gray-300">{activeGoal.description}</p>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">Business Impact</h4>
                  <p className="text-green-400">{activeGoal.businessImpact}</p>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">Required Agents</h4>
                  <div className="flex flex-wrap gap-2">
                    {activeGoal.agentsRequired.map((agent, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">
                        {agent}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">Tools Needed</h4>
                  <div className="flex flex-wrap gap-2">
                    {activeGoal.toolsNeeded.map((tool, index) => (
                      <span key={index} className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">Success Metrics</h4>
                  <ul className="list-disc list-inside text-gray-300 space-y-1">
                    {activeGoal.successMetrics.map((metric, index) => (
                      <li key={index}>{metric}</li>
                    ))}
                  </ul>
                </div>

                <div className="flex gap-4">
                  <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-all duration-300">
                    Start This Goal
                  </button>
                  <button className="px-6 py-3 border border-slate-600 text-gray-300 hover:text-white hover:border-slate-500 rounded-lg font-medium transition-all duration-300">
                    Learn More
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalDashboard;