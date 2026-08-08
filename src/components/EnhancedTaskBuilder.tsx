import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Target, 
  Users, 
  ArrowRight, 
  CheckCircle, 
  AlertTriangle,
  Lightbulb,
  Settings,
  Play,
  Star,
  TrendingUp,
  Bot,
  Sparkles,
  Activity
} from 'lucide-react';
import { gpt5TaskOrchestrator } from '../services/gpt5TaskOrchestrator';
import { EnhancedTaskInput, GPT5TaskAnalysis, RequiredTaskField } from '../types/taskExecution';
import Tooltip from './Tooltip';

interface EnhancedTaskBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreate: (task: EnhancedTaskInput) => void;
  realMode?: boolean;
}

const EnhancedTaskBuilder: React.FC<EnhancedTaskBuilderProps> = ({
  isOpen,
  onClose,
  onTaskCreate,
  realMode = false
}) => {
  const [step, setStep] = useState<'input' | 'analysis' | 'fields' | 'review' | 'execution'>('input');
  const [userInput, setUserInput] = useState('');
  const [analysis, setAnalysis] = useState<GPT5TaskAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep('input');
      setUserInput('');
      setAnalysis(null);
      setFormData({});
      setValidationErrors({});
      setSelectedAgents([]);
    }
  }, [isOpen]);

  // Analyze task with GPT-5
  const analyzeTask = async () => {
    if (!userInput.trim()) return;

    setIsAnalyzing(true);
    try {
      const taskAnalysis = await gpt5TaskOrchestrator.analyzeTaskRequirements(userInput);
      setAnalysis(taskAnalysis);
      setSelectedAgents(taskAnalysis.suggestedAgents.map(a => a.agentName));
      setStep('analysis');
    } catch (error) {
      console.error('Task analysis failed:', error);
      alert('Task analysis failed. Please check your API configuration.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Validate form field
  const validateField = (field: RequiredTaskField, value: any): string | null => {
    if (field.isRequired && (!value || value.toString().trim() === '')) {
      return `${field.fieldLabel} is required`;
    }
    
    if (field.fieldType === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return 'Please enter a valid email address';
      }
    }
    
    if (field.fieldType === 'phone' && value) {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''))) {
        return 'Please enter a valid phone number';
      }
    }
    
    return null;
  };

  // Handle form submission
  const handleFormSubmit = () => {
    if (!analysis) return;

    const errors: Record<string, string> = {};
    
    // Validate all required fields
    analysis.requiredInformation.forEach(field => {
      const error = validateField(field, formData[field.fieldName]);
      if (error) {
        errors[field.fieldName] = error;
      }
    });

    setValidationErrors(errors);

    if (Object.keys(errors).length === 0) {
      setStep('review');
    }
  };

  // Create final task
  const createTask = () => {
    if (!analysis) return;

    const enhancedTask: EnhancedTaskInput = {
      id: `task-${Date.now()}`,
      taskTitle: userInput.split('.')[0] || userInput.substring(0, 50),
      taskDescription: userInput,
      taskType: 'custom' as any,
      priority: 'medium',
      complexity: 'intermediate',
      requiredAgents: selectedAgents,
      userProvidedData: formData,
      crmContext: {},
      expectedOutcome: analysis.expectedBusinessImpact ? 
        `Revenue: $${analysis.expectedBusinessImpact.estimatedRevenue}, Time Saved: ${analysis.expectedBusinessImpact.timeSaved}h` : 
        'Significant business improvement',
      successCriteria: analysis.estimatedSteps.map(step => step.businessImpact),
      estimatedDuration: analysis.estimatedSteps.reduce((acc, step) => acc + step.estimatedDuration, 0),
      businessValue: analysis.expectedBusinessImpact?.estimatedRevenue || 10000,
      tags: ['gpt5-generated', 'custom'],
      createdBy: 'user',
      createdAt: new Date().toISOString()
    };

    onTaskCreate(enhancedTask);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full h-full flex items-center justify-center p-4">
        <div className="w-full max-w-4xl max-h-[90vh] bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
          
          {/* Header */}
          <div className="p-6 border-b border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Enhanced Task Builder</h2>
                <p className="text-gray-300">Create custom tasks powered by GPT-5 intelligence</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className={`px-3 py-1 rounded-full text-sm ${
                realMode 
                  ? 'bg-red-500/20 border border-red-400/30 text-red-300' 
                  : 'bg-blue-500/20 border border-blue-400/30 text-blue-300'
              }`}>
                {realMode ? '🔴 Live Mode' : '🔵 Demo Mode'}
              </div>
              <button onClick={onClose} className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-gray-400 hover:text-white transition-colors">
                ✕
              </button>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="p-6 border-b border-slate-700/50">
            <div className="flex items-center justify-between mb-4">
              {[
                { id: 'input', label: 'Describe Task', icon: Brain },
                { id: 'analysis', label: 'GPT-5 Analysis', icon: Activity },
                { id: 'fields', label: 'Provide Details', icon: Settings },
                { id: 'review', label: 'Review & Execute', icon: Play }
              ].map((stepItem, index) => {
                const IconComponent = stepItem.icon;
                const isActive = step === stepItem.id;
                const isCompleted = ['input', 'analysis', 'fields'].indexOf(step) > ['input', 'analysis', 'fields'].indexOf(stepItem.id);
                
                return (
                  <div key={stepItem.id} className="flex items-center">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                      isActive 
                        ? 'bg-blue-600 text-white' 
                        : isCompleted 
                          ? 'bg-green-600 text-white' 
                          : 'bg-slate-700 text-gray-400'
                    }`}>
                      <IconComponent className="h-5 w-5" />
                      <span className="font-medium">{stepItem.label}</span>
                    </div>
                    {index < 3 && (
                      <ArrowRight className="h-5 w-5 text-gray-400 mx-3" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {step === 'input' && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 mb-6 mx-auto w-fit">
                    <Sparkles className="h-12 w-12 text-blue-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">What business task do you need help with?</h3>
                  <p className="text-gray-300 mb-6">
                    Describe your task in natural language. GPT-5 will analyze it and create a customized execution plan with the right AI agents.
                  </p>
                </div>

                <div className="space-y-4">
                  <textarea
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Example: 'I need to follow up with all prospects from last week's webinar and schedule discovery calls with the most engaged ones'"
                    className="w-full h-32 p-4 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 resize-none"
                  />
                  
                  <div className="grid md:grid-cols-3 gap-4">
                    {[
                      'Send follow-up emails to all warm leads from this month',
                      'Create a nurture sequence for SaaS prospects in the trial phase',
                      'Schedule discovery calls with all qualified leads who requested demos'
                    ].map((example, index) => (
                      <button
                        key={index}
                        onClick={() => setUserInput(example)}
                        className="p-3 text-left bg-slate-700/30 hover:bg-slate-700/50 border border-slate-600/30 hover:border-blue-500/30 rounded-lg transition-all duration-300 text-sm text-gray-300 hover:text-white"
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={analyzeTask}
                    disabled={!userInput.trim() || isAnalyzing}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-lg font-semibold transition-all duration-300"
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                        Analyzing with GPT-5...
                      </>
                    ) : (
                      <>
                        <Brain className="h-5 w-5" />
                        Analyze Task
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {step === 'analysis' && analysis && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-400/30 mb-4 mx-auto w-fit">
                    <CheckCircle className="h-12 w-12 text-green-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">GPT-5 Analysis Complete</h3>
                  <p className="text-gray-300">Your task has been analyzed and an execution plan has been created</p>
                </div>

                {/* Feasibility Score */}
                <div className="bg-slate-700/30 rounded-xl p-6 border border-slate-600/30">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xl font-semibold text-white flex items-center gap-2">
                      <Target className="h-6 w-6 text-blue-400" />
                      Task Feasibility Analysis
                    </h4>
                    <div className={`text-2xl font-bold ${
                      analysis.feasibilityScore >= 80 ? 'text-green-400' :
                      analysis.feasibilityScore >= 60 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {analysis.feasibilityScore}%
                    </div>
                  </div>
                  
                  <div className="w-full bg-slate-600 rounded-full h-3 mb-4">
                    <div 
                      className={`h-3 rounded-full transition-all duration-500 ${
                        analysis.feasibilityScore >= 80 ? 'bg-gradient-to-r from-green-500 to-green-600' :
                        analysis.feasibilityScore >= 60 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                        'bg-gradient-to-r from-red-500 to-red-600'
                      }`}
                      style={{ width: `${analysis.feasibilityScore}%` }}
                    />
                  </div>
                  
                  <div className="text-sm text-gray-300">
                    {analysis.feasibilityScore >= 80 ? 
                      'High feasibility - This task can be executed successfully with current capabilities' :
                      analysis.feasibilityScore >= 60 ?
                      'Medium feasibility - Task can be completed with some additional setup' :
                      'Low feasibility - This task may require significant manual intervention'
                    }
                  </div>
                </div>

                {/* Recommended Agents */}
                <div className="bg-slate-700/30 rounded-xl p-6 border border-slate-600/30">
                  <h4 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <Users className="h-6 w-6 text-purple-400" />
                    Recommended AI Agents
                    <Tooltip 
                      content="GPT-5 has analyzed your task and recommended the best agents for execution"
                      position="top"
                    />
                  </h4>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    {analysis.suggestedAgents.map((agent, index) => (
                      <div key={index} className="p-4 bg-slate-600/30 rounded-lg border border-slate-500/30">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Bot className="h-5 w-5 text-blue-400" />
                            <span className="font-medium text-white">{agent.agentName}</span>
                          </div>
                          <div className="text-sm text-green-400">{agent.confidence}% match</div>
                        </div>
                        <p className="text-sm text-gray-300 mb-2">{agent.reasoning}</p>
                        <div className="text-xs text-purple-300">{agent.estimatedContribution}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Execution Steps Preview */}
                <div className="bg-slate-700/30 rounded-xl p-6 border border-slate-600/30">
                  <h4 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <Activity className="h-6 w-6 text-orange-400" />
                    Execution Plan
                  </h4>
                  
                  <div className="space-y-3">
                    {analysis.estimatedSteps.map((step, index) => (
                      <div key={index} className="flex items-center gap-4 p-3 bg-slate-600/30 rounded-lg">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {step.stepNumber}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-white">{step.stepName}</div>
                          <div className="text-sm text-gray-300">{step.stepDescription}</div>
                          <div className="text-xs text-blue-400 mt-1">
                            {step.assignedAgent} • {step.estimatedDuration}min
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Business Impact */}
                {analysis.expectedBusinessImpact && (
                  <div className="bg-green-500/10 border border-green-400/30 rounded-xl p-6">
                    <h4 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                      <TrendingUp className="h-6 w-6 text-green-400" />
                      Expected Business Impact
                    </h4>
                    
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-400">
                          ${analysis.expectedBusinessImpact.estimatedRevenue.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-300">Revenue Impact</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-400">
                          {analysis.expectedBusinessImpact.timeSaved}h
                        </div>
                        <div className="text-sm text-gray-300">Time Saved</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-400">
                          {analysis.expectedBusinessImpact.efficiencyGain}%
                        </div>
                        <div className="text-sm text-gray-300">Efficiency Gain</div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between">
                  <button
                    onClick={() => setStep('input')}
                    className="px-6 py-3 text-gray-400 hover:text-white transition-colors"
                  >
                    ← Back to Input
                  </button>
                  <button
                    onClick={() => setStep('fields')}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all duration-300"
                  >
                    Continue to Details
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}

            {step === 'fields' && analysis && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-400/30 mb-4 mx-auto w-fit">
                    <Settings className="h-12 w-12 text-orange-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Provide Task Details</h3>
                  <p className="text-gray-300">GPT-5 has identified the information needed to execute your task</p>
                </div>

                <div className="space-y-6">
                  {analysis.requiredInformation.map((field, index) => (
                    <div key={index} className="space-y-2">
                      <label className="block text-white font-medium">
                        {field.fieldLabel}
                        {field.isRequired && <span className="text-red-400 ml-1">*</span>}
                        <Tooltip 
                          content={field.fieldDescription}
                          position="top"
                          className="ml-2"
                        />
                      </label>
                      
                      {field.fieldType === 'select' ? (
                        <select
                          value={formData[field.fieldName] || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, [field.fieldName]: e.target.value }))}
                          className="w-full p-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-blue-500/50"
                        >
                          <option value="">Select {field.fieldLabel}</option>
                          {field.gpt5Suggestions?.map((suggestion, i) => (
                            <option key={i} value={suggestion}>{suggestion}</option>
                          ))}
                        </select>
                       ) : field.fieldType === 'text' ? (
                        <textarea
                          value={formData[field.fieldName] || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, [field.fieldName]: e.target.value }))}
                          placeholder={field.placeholder}
                          className="w-full h-24 p-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50 resize-none"
                        />
                      ) : (
                        <input
                          type={field.fieldType === 'email' ? 'email' : field.fieldType === 'phone' ? 'tel' : 'text'}
                          value={formData[field.fieldName] || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, [field.fieldName]: e.target.value }))}
                          placeholder={field.placeholder}
                          className="w-full p-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50"
                        />
                      )}
                      
                      {validationErrors[field.fieldName] && (
                        <div className="flex items-center gap-2 text-red-400 text-sm">
                          <AlertTriangle className="h-4 w-4" />
                          {validationErrors[field.fieldName]}
                        </div>
                      )}
                      
                      {field.gpt5Suggestions && field.gpt5Suggestions.length > 0 && (
                        <div className="text-xs text-blue-400">
                          <Lightbulb className="inline h-3 w-3 mr-1" />
                          Suggestions: {field.gpt5Suggestions.slice(0, 3).join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={() => setStep('analysis')}
                    className="px-6 py-3 text-gray-400 hover:text-white transition-colors"
                  >
                    ← Back to Analysis
                  </button>
                  <button
                    onClick={handleFormSubmit}
                    className="flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-all duration-300"
                  >
                    Review Task
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}

            {step === 'review' && analysis && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 mb-4 mx-auto w-fit">
                    <Star className="h-12 w-12 text-purple-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Ready to Execute</h3>
                  <p className="text-gray-300">Review your task details and execute with AI agents</p>
                </div>

                {/* Task Summary */}
                <div className="bg-slate-700/30 rounded-xl p-6 border border-slate-600/30">
                  <h4 className="text-lg font-semibold text-white mb-4">Task Summary</h4>
                  <div className="space-y-3">
                    <div>
                      <span className="text-gray-400">Task:</span>
                      <span className="text-white ml-2">{userInput}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Type:</span>
                      <span className="text-blue-400 ml-2 capitalize">{'custom'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Agents:</span>
                      <span className="text-purple-400 ml-2">{selectedAgents.length} selected</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Estimated Duration:</span>
                      <span className="text-orange-400 ml-2">
                        {analysis.estimatedSteps.reduce((acc, step) => acc + step.estimatedDuration, 0)} minutes
                      </span>
                    </div>
                  </div>
                </div>

                {/* Provided Data Summary */}
                <div className="bg-slate-700/30 rounded-xl p-6 border border-slate-600/30">
                  <h4 className="text-lg font-semibold text-white mb-4">Provided Information</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    {Object.entries(formData).map(([key, value]) => (
                      <div key={key} className="p-3 bg-slate-600/30 rounded-lg">
                        <div className="text-sm text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}</div>
                        <div className="text-white font-medium">{value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={() => setStep('fields')}
                    className="px-6 py-3 text-gray-400 hover:text-white transition-colors"
                  >
                    ← Edit Details
                  </button>
                  <button
                    onClick={createTask}
                    className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white rounded-lg font-semibold text-lg transition-all duration-300 transform hover:scale-105"
                  >
                    <Play className="h-6 w-6" />
                    Execute Task with AI Agents
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedTaskBuilder;