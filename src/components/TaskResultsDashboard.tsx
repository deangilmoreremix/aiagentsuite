import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  Users, 
  Target,
  Activity,
  ArrowRight,
  DollarSign,
  Zap,
  Filter,
  Download,
  Eye,
  Bot,
  Database,
  MessageSquare,
  Brain
} from 'lucide-react';
import { gpt5TaskOrchestrator } from '../services/gpt5TaskOrchestrator';
import { CompletedTaskResult } from '../types/taskExecution';

interface TaskResultsDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

const TaskResultsDashboard: React.FC<TaskResultsDashboardProps> = ({ isOpen, onClose }) => {
  const [completedTasks, setCompletedTasks] = useState<CompletedTaskResult[]>([]);
  const [selectedTask, setSelectedTask] = useState<CompletedTaskResult | null>(null);
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'all'>('week');
  const [taskTypeFilter, setTaskTypeFilter] = useState<string>('all');

  // Load completed tasks from orchestrator
  useEffect(() => {
    if (isOpen) {
      const tasks = gpt5TaskOrchestrator.getTaskHistory();
      setCompletedTasks(tasks);
    }
  }, [isOpen]);

  // Calculate aggregate metrics
  const aggregateMetrics = {
    totalTasks: completedTasks.length,
    totalRevenue: completedTasks.reduce((sum, task) => sum + task.businessOutcome.revenueImpact, 0),
    totalTimeSaved: completedTasks.reduce((sum, task) => sum + task.businessOutcome.timeSaved, 0),
    averageEfficiency: completedTasks.length > 0 ? 
      completedTasks.reduce((sum, task) => sum + task.businessOutcome.efficiencyGain, 0) / completedTasks.length : 0,
    contactsCreated: completedTasks.reduce((sum, task) => sum + task.businessOutcome.contactsCreated, 0),
    emailsSent: completedTasks.reduce((sum, task) => sum + task.businessOutcome.emailsSent, 0),
    meetingsScheduled: completedTasks.reduce((sum, task) => sum + task.businessOutcome.meetingsScheduled, 0)
  };

  const getTaskTypeIcon = (taskType: string) => {
    switch (taskType) {
      case 'sales': return Target;
      case 'marketing': return MessageSquare;
      case 'customer_service': return Users;
      case 'analytics': return BarChart3;
      case 'automation': return Zap;
      default: return Bot;
    }
  };

  const getTaskTypeColor = (taskType: string) => {
    switch (taskType) {
      case 'sales': return 'text-blue-400 bg-blue-500/20';
      case 'marketing': return 'text-purple-400 bg-purple-500/20';
      case 'customer_service': return 'text-green-400 bg-green-500/20';
      case 'analytics': return 'text-orange-400 bg-orange-500/20';
      case 'automation': return 'text-yellow-400 bg-yellow-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full h-full flex items-center justify-center p-4">
        <div className="w-full max-w-7xl max-h-[90vh] bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
          
          {/* Header */}
          <div className="p-6 border-b border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-blue-500">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Task Results Dashboard</h2>
                <p className="text-gray-300">Track completed tasks and business impact</p>
              </div>
            </div>
            
            <button onClick={onClose} className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-gray-400 hover:text-white transition-colors">
              ✕
            </button>
          </div>

          <div className="flex h-full">
            {/* Main Dashboard */}
            <div className="flex-1 p-6 overflow-y-auto">
              {/* Aggregate Metrics */}
              <div className="grid md:grid-cols-4 gap-6 mb-8">
                <div className="bg-slate-700/30 rounded-xl p-6 border border-slate-600/30 text-center">
                  <div className="text-3xl font-bold text-blue-400 mb-2">{aggregateMetrics.totalTasks}</div>
                  <div className="text-gray-300 font-medium">Tasks Completed</div>
                  <div className="text-sm text-gray-400">AI-powered automation</div>
                </div>
                <div className="bg-slate-700/30 rounded-xl p-6 border border-slate-600/30 text-center">
                  <div className="text-3xl font-bold text-green-400 mb-2">
                    ${aggregateMetrics.totalRevenue.toLocaleString()}
                  </div>
                  <div className="text-gray-300 font-medium">Revenue Impact</div>
                  <div className="text-sm text-gray-400">Generated business value</div>
                </div>
                <div className="bg-slate-700/30 rounded-xl p-6 border border-slate-600/30 text-center">
                  <div className="text-3xl font-bold text-purple-400 mb-2">{aggregateMetrics.totalTimeSaved}h</div>
                  <div className="text-gray-300 font-medium">Time Saved</div>
                  <div className="text-sm text-gray-400">Automation efficiency</div>
                </div>
                <div className="bg-slate-700/30 rounded-xl p-6 border border-slate-600/30 text-center">
                  <div className="text-3xl font-bold text-orange-400 mb-2">
                    {Math.round(aggregateMetrics.averageEfficiency)}%
                  </div>
                  <div className="text-gray-300 font-medium">Efficiency Gain</div>
                  <div className="text-sm text-gray-400">Performance improvement</div>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-400" />
                  <span className="text-gray-300">Time Range:</span>
                  <div className="flex gap-2">
                    {['today', 'week', 'month', 'all'].map(range => (
                      <button
                        key={range}
                        onClick={() => setTimeRange(range as any)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-300 ${
                          timeRange === range
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                        }`}
                      >
                        {range.charAt(0).toUpperCase() + range.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-purple-400" />
                  <span className="text-gray-300">Task Type:</span>
                  <select
                    value={taskTypeFilter}
                    onChange={(e) => setTaskTypeFilter(e.target.value)}
                    className="px-3 py-1 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
                  >
                    <option value="all">All Types</option>
                    <option value="sales">Sales</option>
                    <option value="marketing">Marketing</option>
                    <option value="customer_service">Customer Service</option>
                    <option value="analytics">Analytics</option>
                    <option value="automation">Automation</option>
                  </select>
                </div>
              </div>

              {/* Task List */}
              <div className="space-y-4">
                {completedTasks.map((task, _index) => {
                  const IconComponent = getTaskTypeIcon(task.originalTask.taskType);
                  
                  return (
                    <div
                      key={task.taskExecutionId}
                      onClick={() => setSelectedTask(task)}
                      className="p-6 bg-slate-700/30 border border-slate-600/30 rounded-xl hover:border-blue-500/30 hover:bg-slate-700/50 transition-all duration-300 cursor-pointer group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className={`p-3 rounded-lg ${getTaskTypeColor(task.originalTask.taskType)}`}>
                            <IconComponent className="h-6 w-6" />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="text-lg font-semibold text-white group-hover:text-blue-300 transition-colors">
                                {task.originalTask.taskTitle}
                              </h4>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTaskTypeColor(task.originalTask.taskType)}`}>
                                {task.originalTask.taskType}
                              </span>
                            </div>
                            
                            <p className="text-gray-300 mb-3">{task.originalTask.taskDescription}</p>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-400" />
                                <span className="text-sm text-gray-300">
                                  {task.executionSummary.successfulSteps}/{task.executionSummary.totalSteps} steps
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-green-400" />
                                <span className="text-sm text-green-300">
                                  ${task.businessOutcome.revenueImpact.toLocaleString()}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-blue-400" />
                                <span className="text-sm text-blue-300">
                                  {Math.round(task.executionSummary.totalDuration / 1000)}s
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-purple-400" />
                                <span className="text-sm text-purple-300">
                                  {task.executionSummary.agentsUsed} agents
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-sm text-gray-400 mb-1">
                            {new Date(task.completedAt).toLocaleDateString()}
                          </div>
                          <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Empty State */}
              {completedTasks.length === 0 && (
                <div className="text-center py-16">
                  <Database className="h-20 w-20 text-gray-400 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold text-white mb-4">No completed tasks yet</h3>
                  <p className="text-gray-300 max-w-md mx-auto">
                    Start executing tasks with AI agents to see your results and business impact here.
                  </p>
                </div>
              )}
            </div>

            {/* Sidebar - Task Details */}
            {selectedTask && (
              <div className="w-96 bg-slate-800/50 border-l border-slate-700 p-6 overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white">Task Details</h3>
                  <button
                    onClick={() => setSelectedTask(null)}
                    className="p-1 rounded text-gray-400 hover:text-white transition-colors"
                  >
                    ✕
                  </button>
                </div>

                {/* Task Overview */}
                <div className="space-y-6">
                  <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/30">
                    <h4 className="font-medium text-white mb-2">Task Overview</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-400">Title:</span>
                        <span className="text-white ml-2">{selectedTask.originalTask.taskTitle}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Type:</span>
                        <span className="text-blue-400 ml-2 capitalize">{selectedTask.originalTask.taskType}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Priority:</span>
                        <span className="text-purple-400 ml-2 capitalize">{selectedTask.originalTask.priority}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Completed:</span>
                        <span className="text-green-400 ml-2">
                          {new Date(selectedTask.completedAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Business Impact */}
                  <div className="bg-green-500/10 border border-green-400/30 rounded-lg p-4">
                    <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-400" />
                      Business Impact
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Revenue Impact</span>
                        <span className="text-green-400 font-bold">
                          ${selectedTask.businessOutcome.revenueImpact.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Time Saved</span>
                        <span className="text-blue-400 font-bold">{selectedTask.businessOutcome.timeSaved}h</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Efficiency Gain</span>
                        <span className="text-purple-400 font-bold">{selectedTask.businessOutcome.efficiencyGain}%</span>
                      </div>
                    </div>
                  </div>

                  {/* CRM Updates */}
                  <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/30">
                    <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                      <Database className="h-4 w-4 text-blue-400" />
                      CRM Updates
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-400">{selectedTask.businessOutcome.contactsCreated}</div>
                        <div className="text-gray-400">Contacts Created</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-400">{selectedTask.businessOutcome.dealsProgressed}</div>
                        <div className="text-gray-400">Deals Advanced</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-purple-400">{selectedTask.businessOutcome.emailsSent}</div>
                        <div className="text-gray-400">Emails Sent</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-orange-400">{selectedTask.businessOutcome.meetingsScheduled}</div>
                        <div className="text-gray-400">Meetings Booked</div>
                      </div>
                    </div>
                  </div>

                  {/* Execution Summary */}
                  <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/30">
                    <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                      <Activity className="h-4 w-4 text-orange-400" />
                      Execution Summary
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Duration</span>
                        <span className="text-white">{Math.round(selectedTask.executionSummary.totalDuration / 1000)}s</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Agents Used</span>
                        <span className="text-purple-400">{selectedTask.executionSummary.agentsUsed}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Tools Utilized</span>
                        <span className="text-blue-400">{selectedTask.executionSummary.toolsUtilized.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Success Rate</span>
                        <span className="text-green-400">
                          {Math.round((selectedTask.executionSummary.successfulSteps / selectedTask.executionSummary.totalSteps) * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* AI Insights */}
                  <div className="bg-purple-500/10 border border-purple-400/30 rounded-lg p-4">
                    <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                      <Brain className="h-4 w-4 text-purple-400" />
                      AI Insights
                    </h4>
                    <div className="space-y-2">
                      {selectedTask.lessonsLearned.slice(0, 3).map((lesson, index) => (
                        <div key={index} className="text-sm text-purple-200 p-2 bg-purple-500/5 rounded border-l-2 border-purple-400">
                          {lesson.length > 100 ? lesson.substring(0, 100) + '...' : lesson}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Next Actions */}
                  {selectedTask.nextRecommendedActions.length > 0 && (
                    <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-4">
                      <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                        <ArrowRight className="h-4 w-4 text-blue-400" />
                        Recommended Next Actions
                      </h4>
                      <div className="space-y-2">
                        {selectedTask.nextRecommendedActions.map((action, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-blue-400" />
                            <span className="text-sm text-blue-200">{action}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Export Options */}
                  <div className="space-y-3">
                    <button className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                      <Download className="h-5 w-5" />
                      Export Detailed Report
                    </button>
                    <button className="w-full flex items-center justify-center gap-2 py-2 border border-gray-600 text-gray-300 hover:text-white hover:border-gray-500 rounded-lg font-medium transition-colors">
                      <Eye className="h-4 w-4" />
                      View Full Timeline
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskResultsDashboard;