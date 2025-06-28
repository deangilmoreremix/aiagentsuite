import React, { useState, useEffect } from 'react';
import { Goal } from '../types/goals';
import { goalCategories, allGoals } from '../data/goalsData';
import InteractiveGoalCard from './InteractiveGoalCard';
import GoalExecutionModal from './GoalExecutionModal';
import PageWalkthrough from './PageWalkthrough';
import EnhancedModeToggle from './EnhancedModeToggle';
import Tooltip from './Tooltip';
import { 
  Target, 
  Filter, 
  Search, 
  Zap, 
  Star, 
  TrendingUp,
  ArrowRight,
  Play,
  Eye,
  Sparkles,
  Brain,
  Users,
  Activity,
  BarChart3,
  Network,
  Bot,
  Award,
  Lightbulb,
  HelpCircle,
  Settings,
  Info
} from 'lucide-react';

interface InteractiveGoalExplorerProps {
  realMode?: boolean;
  onModeToggle?: (mode: boolean) => void;
  onOpenApiSetup?: () => void;
}

const InteractiveGoalExplorer: React.FC<InteractiveGoalExplorerProps> = ({
  realMode = false,
  onModeToggle,
  onOpenApiSetup
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [complexityFilter, setComplexityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [executingGoal, setExecutingGoal] = useState<Goal | null>(null);
  const [showExecutionModal, setShowExecutionModal] = useState(false);
  const [executingGoals, setExecutingGoals] = useState<Set<string>>(new Set());
  const [executionProgress, setExecutionProgress] = useState<Record<string, number>>({});
  const [completedGoals, setCompletedGoals] = useState<Set<string>>(new Set());
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [hasSeenWalkthrough, setHasSeenWalkthrough] = useState(false);
  const [liveStats, setLiveStats] = useState({
    totalGoals: allGoals.length,
    executing: 0,
    completed: 0,
    estimatedValue: 0,
    agentsActive: 0,
    crmUpdates: 0
  });

  // Check if user has seen walkthrough and auto-start when section comes into view
  useEffect(() => {
    const seen = localStorage.getItem('goal-explorer-walkthrough-seen');
    setHasSeenWalkthrough(!!seen);
    
    // Auto-start walkthrough for new users when they reach this section
    if (!seen) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && entry.intersectionRatio > 0.3) {
              // Delay to ensure smooth scrolling is complete
              setTimeout(() => {
                setShowWalkthrough(true);
              }, 1000);
              observer.disconnect(); // Only trigger once
            }
          });
        },
        { threshold: 0.3 }
      );

      const goalExplorerElement = document.getElementById('goal-explorer-section');
      if (goalExplorerElement) {
        observer.observe(goalExplorerElement);
      }

      return () => observer.disconnect();
    }

    // Listen for global walkthrough trigger
    const handleTriggerWalkthrough = () => {
      setShowWalkthrough(true);
    };

    document.addEventListener('trigger-walkthrough', handleTriggerWalkthrough);
    return () => document.removeEventListener('trigger-walkthrough', handleTriggerWalkthrough);
  }, []);

  // Filter goals based on selected criteria
  const filteredGoals = allGoals.filter(goal => {
    const categoryMatch = selectedCategory === 'all' || 
      goal.category.toLowerCase() === selectedCategory.toLowerCase();
    const priorityMatch = priorityFilter === 'all' || goal.priority === priorityFilter;
    const complexityMatch = complexityFilter === 'all' || goal.complexity === complexityFilter;
    const searchMatch = searchQuery === '' || 
      goal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      goal.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    return categoryMatch && priorityMatch && complexityMatch && searchMatch;
  });

  // Update live stats
  useEffect(() => {
    setLiveStats({
      totalGoals: allGoals.length,
      executing: executingGoals.size,
      completed: completedGoals.size,
      estimatedValue: (completedGoals.size * 15000) + (executingGoals.size * 7500),
      agentsActive: executingGoals.size * 3, // Estimate 3 agents per goal
      crmUpdates: completedGoals.size * 12 + executingGoals.size * 6
    });
  }, [executingGoals, completedGoals]);

  // Handle goal execution
  const handleExecuteGoal = async (goal: Goal) => {
    if (executingGoals.has(goal.id)) return;

    setExecutingGoals(prev => new Set([...prev, goal.id]));
    setExecutionProgress(prev => ({ ...prev, [goal.id]: 0 }));

    // Show the modal
    setExecutingGoal(goal);
    setShowExecutionModal(true);

    // Simulate execution progress
    const progressInterval = setInterval(() => {
      setExecutionProgress(prev => {
        const currentProgress = prev[goal.id] || 0;
        const newProgress = Math.min(100, currentProgress + Math.random() * 12 + 3);
        
        if (newProgress >= 100) {
          clearInterval(progressInterval);
          setExecutingGoals(current => {
            const newSet = new Set(current);
            newSet.delete(goal.id);
            return newSet;
          });
          setCompletedGoals(current => new Set([...current, goal.id]));
          return { ...prev, [goal.id]: 100 };
        }
        
        return { ...prev, [goal.id]: newProgress };
      });
    }, 800);
  };

  // Handle goal completion from modal
  const handleExecutionComplete = (result: any) => {
    console.log('Goal execution completed:', result);
    setCompletedGoals(prev => new Set([...prev, result.goalId]));
    
    // The modal will auto-close after showing results
  };

  // Handle modal close
  const handleCloseModal = () => {
    setShowExecutionModal(false);
    setExecutingGoal(null);
  };

  // Handle viewing execution for already executing goals
  const handleViewExecution = (goalId: string) => {
    const goal = allGoals.find(g => g.id === goalId);
    if (goal) {
      setExecutingGoal(goal);
      setShowExecutionModal(true);
    }
  };

  // Handle walkthrough - manual trigger and completion
  const handleStartWalkthrough = () => {
    setShowWalkthrough(true);
  };

  const handleWalkthroughComplete = () => {
    localStorage.setItem('goal-explorer-walkthrough-seen', 'true');
    setHasSeenWalkthrough(true);
  };

  const handleWalkthroughClose = () => {
    setShowWalkthrough(false);
  };

  const getPriorityCount = (priority: string) => {
    return allGoals.filter(g => g.priority === priority).length;
  };

  const getCategoryCount = (categoryId: string) => {
    if (categoryId === 'all') return allGoals.length;
    return allGoals.filter(g => g.category.toLowerCase() === categoryId.toLowerCase()).length;
  };

  return (
    <div className="space-y-8">
      {/* Enhanced Interactive Header */}
      <div className="text-center space-y-8" data-walkthrough="header">
        <div className="relative">
          <h1 className="text-6xl font-bold text-white mb-6">
            Interactive AI Goal Explorer
          </h1>
          <div className="absolute -top-4 -right-4 animate-float">
            <Sparkles className="h-12 w-12 text-blue-400" />
          </div>
          <div className="absolute -bottom-2 -left-4 animate-float" style={{animationDelay: '1s'}}>
            <Brain className="h-10 w-10 text-purple-400" />
          </div>
          
          {/* Enhanced Walkthrough Trigger Button */}
          <Tooltip 
            content="Take a guided tour of the Goal Explorer interface"
            position="bottom"
          >
            <button
              onClick={handleStartWalkthrough}
              className="absolute top-0 right-0 p-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 rounded-full text-blue-400 hover:text-blue-300 transition-all duration-300 group"
              title="Take a guided tour"
            >
              <HelpCircle className="h-6 w-6 group-hover:rotate-12 transition-transform duration-300" />
            </button>
          </Tooltip>
        </div>
        
        <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
          Choose your business goals and watch AI agents execute them in real-time on a live CRM interface. 
          Every goal comes with step-by-step execution, live progress tracking, and measurable business impact.
        </p>

        {/* Enhanced Live Stats Dashboard */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8 relative overflow-hidden" data-walkthrough="dashboard">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 25% 25%, #3b82f6 1px, transparent 1px)',
              backgroundSize: '30px 30px'
            }}></div>
          </div>

          <div className="relative z-10">
            <div className="flex items-center justify-center gap-3 mb-8">
              <Network className="h-8 w-8 text-blue-400" />
              <h2 className="text-2xl font-bold text-white">Live System Dashboard</h2>
              <Activity className="h-6 w-6 text-green-400 animate-pulse" />
              <Tooltip 
                content="Real-time metrics showing system activity and business impact"
                position="top"
              />
            </div>

            <div className="grid md:grid-cols-6 gap-6">
              <div className="text-center p-4 bg-slate-700/30 rounded-xl border border-slate-600/30">
                <div className="text-3xl font-bold text-blue-400 mb-2">{liveStats.totalGoals}</div>
                <div className="text-gray-300 font-medium">Available Goals</div>
                <div className="text-sm text-gray-400">Ready to execute</div>
              </div>
              <div className="text-center p-4 bg-slate-700/30 rounded-xl border border-slate-600/30">
                <div className="text-3xl font-bold text-orange-400 mb-2 flex items-center justify-center gap-2">
                  {liveStats.executing}
                  {liveStats.executing > 0 && <Activity className="h-6 w-6 animate-pulse" />}
                </div>
                <div className="text-gray-300 font-medium">Executing Now</div>
                <div className="text-sm text-gray-400">Active workflows</div>
              </div>
              <div className="text-center p-4 bg-slate-700/30 rounded-xl border border-slate-600/30">
                <div className="text-3xl font-bold text-green-400 mb-2 flex items-center justify-center gap-2">
                  {liveStats.completed}
                  {liveStats.completed > 0 && <Award className="h-6 w-6" />}
                </div>
                <div className="text-gray-300 font-medium">Completed</div>
                <div className="text-sm text-gray-400">Successfully achieved</div>
              </div>
              <div className="text-center p-4 bg-slate-700/30 rounded-xl border border-slate-600/30">
                <div className="text-3xl font-bold text-purple-400 mb-2">{liveStats.agentsActive}</div>
                <div className="text-gray-300 font-medium">AI Agents</div>
                <div className="text-sm text-gray-400">Currently working</div>
              </div>
              <div className="text-center p-4 bg-slate-700/30 rounded-xl border border-slate-600/30">
                <div className="text-3xl font-bold text-cyan-400 mb-2">{liveStats.crmUpdates}</div>
                <div className="text-gray-300 font-medium">CRM Updates</div>
                <div className="text-sm text-gray-400">Data changes made</div>
              </div>
              <div className="text-center p-4 bg-slate-700/30 rounded-xl border border-slate-600/30">
                <div className="text-3xl font-bold text-emerald-400 mb-2">${(liveStats.estimatedValue).toLocaleString()}</div>
                <div className="text-gray-300 font-medium">Business Value</div>
                <div className="text-sm text-gray-400">Generated ROI</div>
              </div>
            </div>

            {/* Enhanced Active Executions Indicator */}
            {executingGoals.size > 0 && (
              <div className="mt-8 p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-400/30 rounded-xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-blue-600/5 animate-pulse"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-full bg-blue-500/20 border border-blue-400/30">
                        <Bot className="h-6 w-6 text-blue-400 animate-pulse" />
                      </div>
                      <div>
                        <span className="text-blue-300 font-semibold text-lg">
                          {executingGoals.size} goal{executingGoals.size > 1 ? 's' : ''} executing
                        </span>
                        <div className="text-sm text-blue-200">
                          AI agents are working on your CRM in real-time
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const firstExecuting = Array.from(executingGoals)[0];
                        handleViewExecution(firstExecuting);
                      }}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                      <Eye className="h-5 w-5" />
                      Watch Live Execution
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Filters & Search */}
      <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6" data-walkthrough="filters">
        <div className="space-y-6">
          {/* Enhanced Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" />
            <input
              type="text"
              placeholder="Search goals by name, description, or business impact..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-4 py-4 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            )}
            <Tooltip 
              content="Search through all 50+ business goals by keywords, categories, or business impact"
              position="top"
              className="absolute right-14 top-1/2 transform -translate-y-1/2"
            />
          </div>

          {/* Enhanced Category Filters */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Filter className="h-5 w-5 text-blue-400" />
              <h3 className="text-white font-semibold">Goal Categories</h3>
              <Tooltip 
                content="Filter goals by business category to find automations for your specific needs"
                position="top"
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`p-4 rounded-xl border transition-all duration-300 text-left hover:scale-105 ${
                  selectedCategory === 'all'
                    ? 'bg-blue-500/20 border-blue-400/30 text-blue-300 shadow-lg'
                    : 'bg-slate-700/30 border-slate-600/30 text-gray-300 hover:border-blue-500/30'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-5 w-5 text-blue-400" />
                  <span className="font-medium">All Goals</span>
                </div>
                <div className="text-xs text-gray-400">{getCategoryCount('all')} available</div>
              </button>
              
              {goalCategories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`p-4 rounded-xl border transition-all duration-300 text-left hover:scale-105 ${
                    selectedCategory === category.id
                      ? 'bg-blue-500/20 border-blue-400/30 text-blue-300 shadow-lg'
                      : 'bg-slate-700/30 border-slate-600/30 text-gray-300 hover:border-blue-500/30'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <category.icon className="h-5 w-5" />
                    <span className="font-medium text-sm">{category.name.replace(' Goals', '')}</span>
                  </div>
                  <div className="text-xs text-gray-400">{getCategoryCount(category.id)} goals</div>
                </button>
              ))}
            </div>
          </div>

          {/* Enhanced Priority & Complexity Filters */}
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="h-5 w-5 text-red-400" />
                <h4 className="text-white font-medium">Priority Level</h4>
                <Tooltip 
                  content="High priority goals offer maximum business impact and ROI"
                  position="top"
                />
              </div>
              <div className="flex gap-3">
                {['all', 'High', 'Medium', 'Low'].map(priority => (
                  <button
                    key={priority}
                    onClick={() => setPriorityFilter(priority)}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 ${
                      priorityFilter === priority
                        ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg'
                        : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                    }`}
                  >
                    {priority === 'all' ? 'All Priorities' : priority}
                    {priority !== 'all' && (
                      <span className="ml-2 text-xs opacity-75">
                        ({getPriorityCount(priority)})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-4">
                <Star className="h-5 w-5 text-purple-400" />
                <h4 className="text-white font-medium">Complexity Level</h4>
                <Tooltip 
                  content="Simple goals can be set up in minutes, while advanced goals offer more sophisticated automation"
                  position="top"
                />
              </div>
              <div className="flex gap-3">
                {['all', 'Simple', 'Intermediate', 'Advanced'].map(complexity => (
                  <button
                    key={complexity}
                    onClick={() => setComplexityFilter(complexity)}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 ${
                      complexityFilter === complexity
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                        : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                    }`}
                  >
                    {complexity === 'all' ? 'All Levels' : complexity}
                    {complexity !== 'all' && complexity === 'Simple' && <Zap className="inline w-3 h-3 ml-1" />}
                    {complexity !== 'all' && complexity === 'Intermediate' && <Target className="inline w-3 h-3 ml-1" />}
                    {complexity !== 'all' && complexity === 'Advanced' && <Star className="inline w-3 h-3 ml-1" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Results Summary with Mode Toggle */}
      <div className="grid lg:grid-cols-3  gap-6">
        <div className="lg:col-span-2 bg-gradient-to-r from-slate-800/50 to-slate-900/50 rounded-xl p-6 border border-slate-700/50">
          <div className="flex items-center justify-between">
            <div className="text-gray-300">
              Showing <span className="text-white font-bold text-lg">{filteredGoals.length}</span> of{' '}
              <span className="text-white font-bold text-lg">{allGoals.length}</span> goals
              {searchQuery && (
                <span> matching "<span className="text-blue-400 font-medium">{searchQuery}</span>"</span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Tooltip 
                content={realMode ? 
                  "Live Mode is active - AI agents will execute real actions in your business tools" :
                  "Demo Mode is active - AI responses are simulated for safe exploration"
                }
                position="top"
              >
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${
                  realMode 
                    ? 'bg-red-500/20 border-red-400/30 text-red-300' 
                    : 'bg-blue-500/20 border-blue-400/30 text-blue-300'
                }`}>
                  <div className="w-3 h-3 rounded-full animate-pulse" style={{
                    backgroundColor: realMode ? '#f87171' : '#60a5fa'
                  }}></div>
                  <span className="font-medium">{realMode ? 'Live Mode' : 'Demo Mode'}</span>
                </div>
              </Tooltip>
              
              <Tooltip 
                content="Click to switch between Demo and Live modes"
                position="top"
              >
                <button
                  onClick={() => onModeToggle?.(!realMode)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 ${
                    realMode
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  Switch to {realMode ? 'Demo' : 'Live'} Mode
                </button>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Enhanced Mode Toggle Panel */}
        <div className="lg:col-span-1" data-walkthrough="mode-toggle">
          <EnhancedModeToggle 
            realMode={realMode}
            onToggle={(mode) => onModeToggle?.(mode)}
            onOpenApiSetup={() => onOpenApiSetup?.()}
            size="medium"
            showFullDetails={false}
          />
        </div>
      </div>

      {/* Enhanced Interactive Goal Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8" data-walkthrough="goal-cards">
        {filteredGoals.map(goal => (
          <div key={goal.id} className="animate-fadeIn" data-walkthrough="goal-card">
            <InteractiveGoalCard
              goal={goal}
              onExecute={handleExecuteGoal}
              isExecuting={executingGoals.has(goal.id)}
              executionProgress={executionProgress[goal.id] || 0}
              realMode={realMode}
            />
          </div>
        ))}
      </div>

      {/* Enhanced Empty State */}
      {filteredGoals.length === 0 && (
        <div className="text-center py-16 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700/50">
          <div className="mb-6">
            <Search className="h-20 w-20 text-gray-400 mx-auto mb-6 animate-float" />
            <h3 className="text-3xl font-bold text-white mb-4">No goals found</h3>
            <p className="text-gray-300 max-w-md mx-auto text-lg">
              Try adjusting your filters or search terms to find the perfect goals for your business.
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setPriorityFilter('all');
              setComplexityFilter('all');
              setSearchQuery('');
            }}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
          >
            Clear All Filters
          </button>
        </div>
      )}

      {/* Enhanced Quick Actions */}
      {filteredGoals.length > 0 && (
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8" data-walkthrough="quick-actions">
          <div className="flex items-center gap-3 mb-6">
            <Lightbulb className="h-8 w-8 text-yellow-400" />
            <h3 className="text-2xl font-semibold text-white">Smart Quick Actions</h3>
            <Tooltip 
              content="Execute multiple goals at once with these pre-built strategies"
              position="top"
            />
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <button
              onClick={() => {
                const highPriorityGoals = filteredGoals.filter(g => g.priority === 'High');
                highPriorityGoals.slice(0, 3).forEach(goal => handleExecuteGoal(goal));
              }}
              className="p-6 bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-400/30 rounded-xl hover:from-red-500/20 hover:to-orange-500/20 transition-all duration-300 text-left group hover:scale-105"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-full bg-red-500/20">
                  <TrendingUp className="h-6 w-6 text-red-400" />
                </div>
                <span className="font-semibold text-white text-lg">Execute High Priority</span>
                <ArrowRight className="h-5 w-5 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-gray-300 mb-2">Run top 3 high-priority goals simultaneously</p>
              <p className="text-sm text-red-300">Maximum business impact strategy</p>
            </button>

            <button
              onClick={() => {
                const simpleGoals = filteredGoals.filter(g => g.complexity === 'Simple');
                simpleGoals.slice(0, 5).forEach(goal => handleExecuteGoal(goal));
              }}
              className="p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-400/30 rounded-xl hover:from-green-500/20 hover:to-emerald-500/20 transition-all duration-300 text-left group hover:scale-105"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-full bg-green-500/20">
                  <Zap className="h-6 w-6 text-green-400" />
                </div>
                <span className="font-semibold text-white text-lg">Quick Wins</span>
                <ArrowRight className="h-5 w-5 text-green-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-gray-300 mb-2">Execute all simple goals for fast results</p>
              <p className="text-sm text-green-300">Immediate productivity boost</p>
            </button>

            <button
              onClick={() => {
                const salesGoals = filteredGoals.filter(g => g.category === 'Sales');
                salesGoals.slice(0, 3).forEach(goal => handleExecuteGoal(goal));
              }}
              className="p-6 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-400/30 rounded-xl hover:from-blue-500/20 hover:to-purple-500/20 transition-all duration-300 text-left group hover:scale-105"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-full bg-blue-500/20">
                  <Users className="h-6 w-6 text-blue-400" />
                </div>
                <span className="font-semibold text-white text-lg">Sales Focus</span>
                <ArrowRight className="h-5 w-5 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-gray-300 mb-2">Focus on revenue-generating goals</p>
              <p className="text-sm text-blue-300">Direct revenue impact</p>
            </button>
          </div>
        </div>
      )}

      {/* Full Screen Goal Execution Modal */}
      <GoalExecutionModal
        goal={executingGoal}
        isOpen={showExecutionModal}
        onClose={handleCloseModal}
        realMode={realMode}
        onComplete={handleExecutionComplete}
      />

      {/* Page Walkthrough - Auto-triggers for new users */}
      <PageWalkthrough
        isOpen={showWalkthrough}
        onClose={handleWalkthroughClose}
        onComplete={handleWalkthroughComplete}
        onOpenApiSetup={onOpenApiSetup}
      />
    </div>
  );
};

export default InteractiveGoalExplorer;