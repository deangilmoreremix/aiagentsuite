import React, { useState } from 'react';
import { 
  Brain, 
  Plus, 
  Target, 
  Users, 
  Activity,
  Sparkles,
  ArrowRight,
  TrendingUp,
  BarChart3,
  Bot,
  Play
} from 'lucide-react';
import EnhancedTaskBuilder from './EnhancedTaskBuilder';
import EnhancedTaskExecution from './EnhancedTaskExecution';
import TaskResultsDashboard from './TaskResultsDashboard';
import { EnhancedTaskInput } from '../types/taskExecution';
import { gpt5TaskOrchestrator } from '../services/gpt5TaskOrchestrator';

interface TaskExecutionEntryProps {
  realMode?: boolean;
}

const TaskExecutionEntry: React.FC<TaskExecutionEntryProps> = ({ realMode = false }) => {
  const [showTaskBuilder, setShowTaskBuilder] = useState(false);
  const [showTaskExecution, setShowTaskExecution] = useState(false);
  const [showResultsDashboard, setShowResultsDashboard] = useState(false);
  const [currentTask, setCurrentTask] = useState<EnhancedTaskInput | null>(null);
  const [executingTasks, setExecutingTasks] = useState<Set<string>>(new Set());
  const [completedTasks, setCompletedTasks] = useState(0);

  // Update stats from orchestrator
  React.useEffect(() => {
    const updateStats = () => {
      const history = gpt5TaskOrchestrator.getTaskHistory();
      const executing = gpt5TaskOrchestrator.getCurrentlyExecutingTasks();
      
      setCompletedTasks(history.length);
      setExecutingTasks(new Set(executing.keys()));
    };

    updateStats();
    const interval = setInterval(updateStats, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleTaskCreate = (task: EnhancedTaskInput) => {
    setCurrentTask(task);
    setShowTaskExecution(true);
  };

  const quickTaskExamples = [
    {
      title: 'Lead Nurture Campaign',
      description: 'Create and execute a 5-touch nurture sequence for leads who downloaded our whitepaper',
      agents: ['Email Agent', 'Follow-up Agent', 'Content Generator Agent'],
      estimatedValue: 25000,
      duration: '20 minutes'
    },
    {
      title: 'Demo Booking Automation',
      description: 'Contact all qualified leads from this week and schedule product demos',
      agents: ['AI SDR Agent', 'Calendar Agent', 'Email Agent'],
      estimatedValue: 40000,
      duration: '15 minutes'
    },
    {
      title: 'Pipeline Review & Optimization',
      description: 'Analyze current deals, identify bottlenecks, and suggest optimization strategies',
      agents: ['Analytics Agent', 'Lead Scoring Agent', 'CRM Action Advisor'],
      estimatedValue: 15000,
      duration: '25 minutes'
    }
  ];

  return (
    <>
      {/* Main Entry Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="relative">
              <Brain className="h-12 w-12 text-blue-400" />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
            </div>
            <span className="text-3xl font-bold text-white">GPT-5 Enhanced Task Execution</span>
          </div>
          
          <h2 className="text-5xl font-bold text-white mb-6">
            Delegate Real Business Tasks to AI Agents
          </h2>
          <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
            Describe any business task in natural language and watch GPT-5 coordinate specialized AI agents 
            to execute it with precision. From lead generation to deal closing - your AI workforce handles it all.
          </p>
        </div>

        {/* Live System Status */}
        <div className="grid md:grid-cols-4 gap-6 mb-16">
          <div className="bg-slate-700/30 rounded-xl p-6 border border-slate-600/30 text-center">
            <div className="text-3xl font-bold text-blue-400 mb-2">15+</div>
            <div className="text-gray-300 font-medium">AI Agents Ready</div>
            <div className="text-sm text-gray-400">Specialized workforce</div>
          </div>
          <div className="bg-slate-700/30 rounded-xl p-6 border border-slate-600/30 text-center">
            <div className="text-3xl font-bold text-orange-400 mb-2 flex items-center justify-center gap-2">
              {executingTasks.size}
              {executingTasks.size > 0 && <Activity className="h-6 w-6 animate-pulse" />}
            </div>
            <div className="text-gray-300 font-medium">Tasks Executing</div>
            <div className="text-sm text-gray-400">Currently active</div>
          </div>
          <div className="bg-slate-700/30 rounded-xl p-6 border border-slate-600/30 text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">{completedTasks}</div>
            <div className="text-gray-300 font-medium">Tasks Completed</div>
            <div className="text-sm text-gray-400">Lifetime total</div>
          </div>
          <div className="bg-slate-700/30 rounded-xl p-6 border border-slate-600/30 text-center">
            <div className="text-3xl font-bold text-purple-400 mb-2">98.2%</div>
            <div className="text-gray-300 font-medium">Success Rate</div>
            <div className="text-sm text-gray-400">GPT-5 coordination</div>
          </div>
        </div>

        {/* Main Action Buttons */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* Create Custom Task */}
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8 relative overflow-hidden group hover:border-blue-500/30 transition-all duration-300">
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0" style={{
                backgroundImage: 'radial-gradient(circle at 25% 25%, #3b82f6 1px, transparent 1px)',
                backgroundSize: '20px 20px'
              }}></div>
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500">
                  <Plus className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Create Custom Task</h3>
                  <p className="text-gray-300">Describe any business task in natural language</p>
                </div>
              </div>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3 text-gray-300">
                  <Brain className="h-5 w-5 text-blue-400" />
                  <span>GPT-5 analyzes your task and creates an execution plan</span>
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                  <Users className="h-5 w-5 text-purple-400" />
                  <span>Recommends the best AI agents for your specific needs</span>
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                  <Target className="h-5 w-5 text-green-400" />
                  <span>Coordinates multi-agent execution with real-time adaptation</span>
                </div>
              </div>
              
              <button
                onClick={() => setShowTaskBuilder(true)}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold text-lg transition-all duration-300 transform group-hover:scale-105"
              >
                <span className="flex items-center justify-center gap-3">
                  <Brain className="h-6 w-6" />
                  Create Task with GPT-5
                  <ArrowRight className="h-5 w-5" />
                </span>
              </button>
            </div>
          </div>

          {/* View Results Dashboard */}
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8 relative overflow-hidden group hover:border-green-500/30 transition-all duration-300">
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0" style={{
                backgroundImage: 'radial-gradient(circle at 75% 75%, #10b981 1px, transparent 1px)',
                backgroundSize: '20px 20px'
              }}></div>
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-4 rounded-xl bg-gradient-to-r from-green-500 to-teal-500">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">View Results Dashboard</h3>
                  <p className="text-gray-300">Track completed tasks and business impact</p>
                </div>
              </div>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3 text-gray-300">
                  <BarChart3 className="h-5 w-5 text-green-400" />
                  <span>Comprehensive business impact analytics</span>
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                  <TrendingUp className="h-5 w-5 text-blue-400" />
                  <span>ROI tracking and performance metrics</span>
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                  <Activity className="h-5 w-5 text-purple-400" />
                  <span>Agent performance and learning insights</span>
                </div>
              </div>
              
              <button
                onClick={() => setShowResultsDashboard(true)}
                className="w-full py-4 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white rounded-xl font-semibold text-lg transition-all duration-300 transform group-hover:scale-105"
              >
                <span className="flex items-center justify-center gap-3">
                  <BarChart3 className="h-6 w-6" />
                  View Task Results
                  <ArrowRight className="h-5 w-5" />
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Task Examples */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-white mb-4">Quick Start Examples</h3>
            <p className="text-gray-300">Try these common business tasks to see GPT-5 coordination in action</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {quickTaskExamples.map((example, index) => (
              <div key={index} className="bg-slate-700/30 border border-slate-600/30 rounded-xl p-6 hover:border-blue-500/30 transition-all duration-300 group">
                <div className="flex items-center gap-3 mb-4">
                  <Target className="h-6 w-6 text-blue-400" />
                  <h4 className="font-semibold text-white">{example.title}</h4>
                </div>
                
                <p className="text-gray-300 text-sm mb-4">{example.description}</p>
                
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Est. Value:</span>
                    <span className="text-green-400 font-medium">${example.estimatedValue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Duration:</span>
                    <span className="text-blue-400">{example.duration}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Agents:</span>
                    <span className="text-purple-400">{example.agents.length}</span>
                  </div>
                </div>
                
                <div className="space-y-2 mb-6">
                  <div className="text-xs text-gray-400 mb-2">Required Agents:</div>
                  {example.agents.slice(0, 2).map((agent, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Bot className="h-3 w-3 text-blue-400" />
                      <span className="text-xs text-gray-300">{agent}</span>
                    </div>
                  ))}
                  {example.agents.length > 2 && (
                    <div className="text-xs text-gray-400">+{example.agents.length - 2} more agents</div>
                  )}
                </div>
                
                <button
                  onClick={() => {
                    const quickTask: EnhancedTaskInput = {
                      id: `quick-task-${Date.now()}`,
                      taskTitle: example.title,
                      taskDescription: example.description,
                      taskType: 'sales',
                      priority: 'medium',
                      complexity: 'intermediate',
                      requiredAgents: example.agents,
                      userProvidedData: {},
                      crmContext: {},
                      expectedOutcome: `Generate ${example.estimatedValue.toLocaleString()} in business value`,
                      successCriteria: ['Task completed successfully', 'CRM updated with results'],
                      estimatedDuration: parseInt(example.duration),
                      businessValue: example.estimatedValue,
                      tags: ['quick-start', 'example'],
                      createdBy: 'user',
                      createdAt: new Date().toISOString()
                    };
                    handleTaskCreate(quickTask);
                  }}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all duration-300 group-hover:scale-105"
                >
                  <span className="flex items-center justify-center gap-2">
                    <Play className="h-4 w-4" />
                    Try This Example
                  </span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 mb-6 mx-auto w-fit">
              <Brain className="h-12 w-12 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-4">GPT-5 Intelligence</h3>
            <p className="text-gray-300">
              Advanced reasoning capabilities analyze your tasks and coordinate the perfect agent team for optimal results.
            </p>
          </div>
          
          <div className="text-center">
            <div className="p-6 rounded-2xl bg-gradient-to-r from-green-500/20 to-teal-500/20 border border-green-400/30 mb-6 mx-auto w-fit">
              <Users className="h-12 w-12 text-green-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-4">Multi-Agent Coordination</h3>
            <p className="text-gray-300">
              Watch specialized agents collaborate seamlessly, sharing data and coordinating actions for complex business tasks.
            </p>
          </div>
          
          <div className="text-center">
            <div className="p-6 rounded-2xl bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-400/30 mb-6 mx-auto w-fit">
              <TrendingUp className="h-12 w-12 text-orange-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-4">Measurable Impact</h3>
            <p className="text-gray-300">
              Every task execution provides detailed business impact metrics, ROI calculations, and performance analytics.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-16 flex justify-center gap-6">
          <button
            onClick={() => setShowTaskBuilder(true)}
            className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            <Plus className="h-6 w-6" />
            Create Custom Task
            <Sparkles className="h-5 w-5" />
          </button>
          
          <button
            onClick={() => setShowResultsDashboard(true)}
            className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            <BarChart3 className="h-6 w-6" />
            View Results
          </button>
        </div>
      </section>

      {/* Modals */}
      <EnhancedTaskBuilder
        isOpen={showTaskBuilder}
        onClose={() => setShowTaskBuilder(false)}
        onTaskCreate={handleTaskCreate}
        realMode={realMode}
      />

      {currentTask && (
        <EnhancedTaskExecution
          task={currentTask}
          isOpen={showTaskExecution}
          onClose={() => {
            setShowTaskExecution(false);
            setCurrentTask(null);
          }}
          realMode={realMode}
        />
      )}

      <TaskResultsDashboard
        isOpen={showResultsDashboard}
        onClose={() => setShowResultsDashboard(false)}
      />
    </>
  );
};

export default TaskExecutionEntry;