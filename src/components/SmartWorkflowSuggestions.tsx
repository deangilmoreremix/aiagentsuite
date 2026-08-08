import React, { useState, useEffect } from 'react';
import { 
  Workflow, 
  GitBranch, 
  Zap, 
  Clock, 
  Settings,
  Plus,
  ArrowRight,
  CheckCircle,
  TrendingUp,
  Activity
} from 'lucide-react';
import { smartWorkflowService } from '../services/smartWorkflowService';

interface WorkflowSuggestion {
  id: string;
  name: string;
  description: string;
  triggerConditions: string[];
  steps: WorkflowStep[];
  estimatedImpact: string;
  confidence: number;
  frequency: 'daily' | 'weekly' | 'monthly' | 'triggered';
  category: 'sales' | 'marketing' | 'customer_service' | 'data_management';
  priority: 'low' | 'medium' | 'high';
  requiredTools: string[];
  estimatedSetupTime: string;
  potentialROI: number;
}

interface WorkflowStep {
  stepNumber: number;
  agentName: string;
  action: string;
  parameters: Record<string, any>;
  dependsOn?: number[];
  estimatedDuration: number;
}

interface SmartWorkflowSuggestionsProps {
  userId?: string;
  realMode?: boolean;
  onWorkflowCreate?: (workflow: WorkflowSuggestion) => void;
  compact?: boolean;
}

const SmartWorkflowSuggestions: React.FC<SmartWorkflowSuggestionsProps> = ({
  userId = 'default-user',
  realMode = false,
  onWorkflowCreate,
  compact = false
}) => {
  const [suggestions, setSuggestions] = useState<WorkflowSuggestion[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowSuggestion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'high-priority' | 'quick-setup'>('all');

  useEffect(() => {
    if (realMode) {
      loadWorkflowSuggestions();
    }
  }, [userId, realMode]);

  const loadWorkflowSuggestions = async () => {
    setIsLoading(true);
    try {
      const newSuggestions = await smartWorkflowService.generateWorkflowSuggestions(userId);
      setSuggestions(newSuggestions);
    } catch (error) {
      console.error('Failed to load workflow suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateWorkflow = (workflow: WorkflowSuggestion) => {
    if (onWorkflowCreate) {
      onWorkflowCreate(workflow);
    }
    console.log('Creating workflow:', workflow.name);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'sales': return 'text-blue-400 bg-blue-500/20 border-blue-400/30';
      case 'marketing': return 'text-purple-400 bg-purple-500/20 border-purple-400/30';
      case 'customer_service': return 'text-green-400 bg-green-500/20 border-green-400/30';
      case 'data_management': return 'text-orange-400 bg-orange-500/20 border-orange-400/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-400/30';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20';
      case 'low': return 'text-green-400 bg-green-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getFilteredSuggestions = () => {
    switch (filter) {
      case 'high-priority':
        return suggestions.filter(s => s.priority === 'high');
      case 'quick-setup':
        return suggestions.filter(s => parseInt(s.estimatedSetupTime) <= 15);
      default:
        return suggestions;
    }
  };

  if (!realMode) {
    return (
      <div className="bg-slate-700/30 dark:bg-white/5 rounded-xl p-4 border border-slate-600/30 dark:border-white/10">
        <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 mb-2">
          <Workflow className="h-4 w-4" />
          <span className={compact ? 'text-sm' : 'text-base'}>Smart Workflows</span>
        </div>
        <p className="text-gray-300 dark:text-gray-400 text-sm">
          Switch to Live Mode to get AI-suggested workflow automations based on your usage patterns.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Workflow className="h-6 w-6 text-purple-400 dark:text-purple-600" />
          <div>
            <h3 className={`font-bold text-white dark:text-gray-900 ${compact ? 'text-lg' : 'text-xl'}`}>
              Smart Workflow Suggestions
            </h3>
            <p className="text-gray-300 dark:text-gray-600 text-sm">
              AI-generated automations based on your patterns
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {['all', 'high-priority', 'quick-setup'].map(filterType => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType as any)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-300 ${
                filter === filterType
                  ? 'bg-purple-600 dark:bg-purple-500 text-white'
                  : 'bg-slate-700 dark:bg-gray-300 text-gray-300 dark:text-gray-700 hover:bg-slate-600 dark:hover:bg-gray-400'
              }`}
            >
              {filterType.replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Workflow Suggestions */}
      <div className="space-y-4">
        {getFilteredSuggestions().map((workflow) => (
          <div
            key={workflow.id}
            className="bg-slate-700/30 dark:bg-white/5 border border-slate-600/30 dark:border-white/10 rounded-xl p-6 hover:border-purple-500/30 dark:hover:border-purple-400/30 transition-all duration-300 cursor-pointer group"
            onClick={() => setSelectedWorkflow(workflow)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="text-lg font-semibold text-white dark:text-gray-900 group-hover:text-purple-300 dark:group-hover:text-purple-600 transition-colors">
                    {workflow.name}
                  </h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(workflow.priority)}`}>
                    {workflow.priority}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(workflow.category)}`}>
                    {workflow.category}
                  </span>
                </div>
                <p className="text-gray-300 dark:text-gray-600 mb-3">{workflow.description}</p>
              </div>
              
              <div className="text-right ml-4">
                <div className="text-green-400 dark:text-green-600 font-bold">${(workflow.potentialROI / 1000).toFixed(0)}k</div>
                <div className="text-xs text-gray-400 dark:text-gray-500">Potential ROI</div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-400 dark:text-blue-600" />
                <span className="text-sm text-gray-300 dark:text-gray-600">Setup: {workflow.estimatedSetupTime}</span>
              </div>
              <div className="flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-purple-400 dark:text-purple-600" />
                <span className="text-sm text-gray-300 dark:text-gray-600">{workflow.steps.length} steps</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-orange-400 dark:text-orange-600" />
                <span className="text-sm text-gray-300 dark:text-gray-600 capitalize">{workflow.frequency}</span>
              </div>
            </div>

            <div className="mb-4">
              <div className="text-sm font-medium text-gray-400 dark:text-gray-500 mb-2">Trigger Conditions:</div>
              <div className="flex flex-wrap gap-2">
                {workflow.triggerConditions.map((condition, index) => (
                  <span key={index} className="text-xs bg-slate-600/30 dark:bg-gray-300 text-gray-300 dark:text-gray-700 px-2 py-1 rounded-full">
                    {condition}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-green-400 dark:text-green-600">{workflow.estimatedImpact}</div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCreateWorkflow(workflow);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 dark:bg-purple-500 hover:bg-purple-700 dark:hover:bg-purple-600 text-white rounded-lg font-medium transition-colors"
              >
                <Plus className="h-4 w-4" />
                Create Workflow
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {getFilteredSuggestions().length === 0 && !isLoading && (
        <div className="text-center py-8 bg-slate-700/30 dark:bg-white/5 rounded-xl border border-slate-600/30 dark:border-white/10">
          <Workflow className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4 opacity-50" />
          <p className="text-gray-300 dark:text-gray-400">No workflow suggestions yet</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm">Continue using the system to get personalized automation suggestions</p>
        </div>
      )}

      {/* Detailed Workflow Modal */}
      {selectedWorkflow && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 dark:from-white dark:to-gray-100 rounded-2xl border border-slate-700 dark:border-gray-300 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <GitBranch className="h-6 w-6 text-purple-400 dark:text-purple-600" />
                  <h3 className="text-2xl font-bold text-white dark:text-gray-900">{selectedWorkflow.name}</h3>
                </div>
                <button
                  onClick={() => setSelectedWorkflow(null)}
                  className="text-gray-400 dark:text-gray-600 hover:text-white dark:hover:text-gray-900"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <p className="text-gray-300 dark:text-gray-700 text-lg leading-relaxed">
                  {selectedWorkflow.description}
                </p>

                {/* Workflow Steps */}
                <div className="bg-slate-700/30 dark:bg-gray-200 rounded-xl p-4 border border-slate-600/30 dark:border-gray-300">
                  <h4 className="font-semibold text-white dark:text-gray-900 mb-4 flex items-center gap-2">
                    <GitBranch className="h-5 w-5 text-purple-400 dark:text-purple-600" />
                    Workflow Steps
                  </h4>
                  
                  <div className="space-y-3">
                    {selectedWorkflow.steps.map((step, index) => (
                      <div key={step.stepNumber} className="flex items-center gap-4 p-3 bg-slate-600/30 dark:bg-gray-300 rounded-lg">
                        <div className="w-8 h-8 bg-purple-600 dark:bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {step.stepNumber}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-white dark:text-gray-900">{step.action}</div>
                          <div className="text-sm text-purple-300 dark:text-purple-600">{step.agentName}</div>
                          <div className="text-xs text-gray-400 dark:text-gray-500">{step.estimatedDuration}s estimated</div>
                        </div>
                        {index < selectedWorkflow.steps.length - 1 && (
                          <ArrowRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Trigger Conditions */}
                <div className="bg-blue-500/10 dark:bg-blue-100 border border-blue-400/30 dark:border-blue-300 rounded-lg p-4">
                  <h4 className="font-semibold text-white dark:text-gray-900 mb-3 flex items-center gap-2">
                    <Zap className="h-5 w-5 text-blue-400 dark:text-blue-600" />
                    Trigger Conditions
                  </h4>
                  <div className="space-y-2">
                    {selectedWorkflow.triggerConditions.map((condition, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-blue-400 dark:text-blue-600" />
                        <span className="text-sm text-blue-200 dark:text-blue-800">{condition}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Impact & Metrics */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-slate-700/30 dark:bg-gray-200 rounded-xl">
                    <div className="text-2xl font-bold text-green-400 dark:text-green-600">
                      ${(selectedWorkflow.potentialROI / 1000).toFixed(0)}k
                    </div>
                    <div className="text-sm text-gray-400 dark:text-gray-600">Potential ROI</div>
                  </div>
                  <div className="text-center p-4 bg-slate-700/30 dark:bg-gray-200 rounded-xl">
                    <div className="text-2xl font-bold text-blue-400 dark:text-blue-600">{selectedWorkflow.estimatedSetupTime}</div>
                    <div className="text-sm text-gray-400 dark:text-gray-600">Setup Time</div>
                  </div>
                  <div className="text-center p-4 bg-slate-700/30 dark:bg-gray-200 rounded-xl">
                    <div className="text-2xl font-bold text-purple-400 dark:text-purple-600">{selectedWorkflow.confidence}%</div>
                    <div className="text-sm text-gray-400 dark:text-gray-600">Confidence</div>
                  </div>
                </div>

                {/* Required Tools */}
                <div className="bg-slate-700/30 dark:bg-gray-200 rounded-lg p-4 border border-slate-600/30 dark:border-gray-300">
                  <h4 className="font-semibold text-white dark:text-gray-900 mb-3 flex items-center gap-2">
                    <Settings className="h-5 w-5 text-orange-400 dark:text-orange-600" />
                    Required Tools
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedWorkflow.requiredTools.map((tool, index) => (
                      <span key={index} className="px-3 py-1 bg-orange-500/20 dark:bg-orange-200 text-orange-300 dark:text-orange-700 rounded-full text-sm">
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Expected Impact */}
                <div className="bg-green-500/10 dark:bg-green-100 border border-green-400/30 dark:border-green-300 rounded-lg p-4">
                  <h4 className="font-semibold text-white dark:text-gray-900 mb-2 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-400 dark:text-green-600" />
                    Expected Impact
                  </h4>
                  <p className="text-green-200 dark:text-green-800 text-sm">{selectedWorkflow.estimatedImpact}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      handleCreateWorkflow(selectedWorkflow);
                      setSelectedWorkflow(null);
                    }}
                    className="flex-1 bg-purple-600 dark:bg-purple-500 hover:bg-purple-700 dark:hover:bg-purple-600 text-white py-3 rounded-xl font-semibold transition-colors"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <Plus className="h-5 w-5" />
                      Create This Workflow
                    </span>
                  </button>
                  <button
                    onClick={() => setSelectedWorkflow(null)}
                    className="px-6 py-3 border border-gray-600 dark:border-gray-400 text-gray-300 dark:text-gray-600 hover:text-white dark:hover:text-gray-900 hover:border-gray-500 dark:hover:border-gray-500 rounded-xl font-medium transition-colors"
                  >
                    Maybe Later
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
          <div className="flex items-center gap-3 text-purple-400 dark:text-purple-600">
            <div className="animate-spin w-5 h-5 border-2 border-purple-400 dark:border-purple-600 border-t-transparent rounded-full"></div>
            <span>Analyzing usage patterns for workflow suggestions...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartWorkflowSuggestions;