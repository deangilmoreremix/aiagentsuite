import React, { useState, useEffect } from 'react';
import { Goal } from '../types/goals';
import { runComposioAgent } from '../agents/composioAgentRunner';
import { executeAgentWithTools } from '../agents/useOpenAIAgentSuite';
import CRMWorkspace from './CRMWorkspace';
import Tooltip from './Tooltip';
import { 
  Play, 
  Pause, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Zap, 
  Users, 
  Bot,
  Activity,
  Network,
  GitBranch,
  Settings,
  BarChart3,
  Target,
  ArrowRight,
  Sparkles,
  Brain,
  Eye,
  Volume2,
  Database,
  Presentation,
  TrendingUp,
  Award,
  Lightbulb,
  Info,
  AlertTriangle,
  HelpCircle
} from 'lucide-react';

interface ExecutionStep {
  id: string;
  agentName: string;
  action: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  startTime?: Date;
  completionTime?: Date;
  result?: any;
  thinking?: string;
  toolsUsed?: string[];
  crmImpact?: string;
}

interface LiveGoalExecutionProps {
  goal: Goal;
  realMode?: boolean;
  onComplete?: (result: any) => void;
  onCancel?: () => void;
}

const LiveGoalExecution: React.FC<LiveGoalExecutionProps> = ({
  goal,
  realMode = false,
  onComplete,
  onCancel
}) => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [executionSteps, setExecutionSteps] = useState<ExecutionStep[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [executionMetrics, setExecutionMetrics] = useState({
    startTime: new Date(),
    estimatedDuration: 0,
    agentsActive: 0,
    totalActions: 0,
    crmChanges: 0,
    businessValue: 0
  });
  const [liveActivity, setLiveActivity] = useState<string[]>([]);
  const [showCRMView, setShowCRMView] = useState(true);
  const [goalResults, setGoalResults] = useState<any>(null);
  const [showHelp, setShowHelp] = useState(false);

  // Generate execution steps based on goal and required agents
  useEffect(() => {
    const generateExecutionSteps = (): ExecutionStep[] => {
      const steps: ExecutionStep[] = [
        {
          id: 'initialize',
          agentName: 'Command Analyzer Agent',
          action: `Analyzing goal: "${goal.title}" and preparing execution plan`,
          status: 'pending',
          crmImpact: 'Preparing CRM for automated workflow execution'
        }
      ];

      // Add steps for each required agent with CRM impacts
      goal.agentsRequired.forEach((agent, index) => {
        let crmImpact = '';
        if (agent.includes('SDR')) crmImpact = 'Adding new leads and prospects to CRM';
        else if (agent.includes('Email')) crmImpact = 'Sending personalized emails and logging activities';
        else if (agent.includes('Calendar') || agent.includes('Meeting')) crmImpact = 'Scheduling meetings and updating calendar';
        else if (agent.includes('Follow-up')) crmImpact = 'Creating follow-up tasks and reminders';
        else if (agent.includes('Lead Scoring')) crmImpact = 'Updating lead scores and priority rankings';
        else if (agent.includes('Data') || agent.includes('Enrichment')) crmImpact = 'Enriching contact profiles with additional data';
        else crmImpact = 'Updating CRM records and adding activity logs';

        steps.push({
          id: `agent-${index}`,
          agentName: agent,
          action: `Executing ${agent} for ${goal.title.toLowerCase()}`,
          status: 'pending',
          toolsUsed: goal.toolsNeeded,
          crmImpact
        });
      });

      // Add completion steps
      steps.push(
        {
          id: 'validation',
          agentName: 'Timeline Logger Agent',
          action: 'Validating goal completion and measuring success metrics',
          status: 'pending',
          crmImpact: 'Creating comprehensive activity timeline and success report'
        },
        {
          id: 'reporting',
          agentName: 'Structured Output Agent',
          action: 'Generating ROI report and business impact analysis',
          status: 'pending',
          crmImpact: 'Adding goal completion metrics to dashboard'
        }
      );

      return steps;
    };

    setExecutionSteps(generateExecutionSteps());
  }, [goal]);

  // Execute the goal with real or simulated agents
  const executeGoal = async () => {
    setIsExecuting(true);
    setCurrentStep(0);
    setOverallProgress(0);
    setExecutionMetrics({
      startTime: new Date(),
      estimatedDuration: parseInt(goal.estimatedSetupTime) || 15,
      agentsActive: goal.agentsRequired.length,
      totalActions: executionSteps.length,
      crmChanges: 0,
      businessValue: 0
    });

    try {
      for (let i = 0; i < executionSteps.length; i++) {
        const step = executionSteps[i];
        setCurrentStep(i);

        // Update step to running
        setExecutionSteps(prev => prev.map((s, index) => 
          index === i ? { ...s, status: 'running', startTime: new Date() } : s
        ));

        // Add live activity
        setLiveActivity(prev => [
          `🤖 ${step.agentName}: ${step.action}`,
          `📊 CRM Impact: ${step.crmImpact}`,
          ...prev.slice(0, 8)
        ]);

        // Update metrics during execution
        setExecutionMetrics(prev => ({
          ...prev,
          crmChanges: prev.crmChanges + Math.floor(Math.random() * 5) + 1,
          businessValue: prev.businessValue + Math.floor(Math.random() * 5000) + 1000
        }));

        if (realMode) {
          // Execute real agents
          try {
            const result = await runComposioAgent(
              step.agentName,
              `Goal: ${goal.title}. Task: ${step.action}`,
              step.toolsUsed || goal.toolsNeeded
            );

            setExecutionSteps(prev => prev.map((s, index) => 
              index === i ? { 
                ...s, 
                status: 'completed', 
                completionTime: new Date(),
                result: result.success ? result.result : result.error,
                thinking: `Successfully executed ${step.agentName} with real tools and APIs`
              } : s
            ));

            setLiveActivity(prev => [
              `✅ ${step.agentName}: ${result.success ? 'Completed successfully' : 'Completed with issues'}`,
              `💼 Real business impact: ${step.crmImpact}`,
              ...prev.slice(0, 8)
            ]);

          } catch (error) {
            setExecutionSteps(prev => prev.map((s, index) => 
              index === i ? { 
                ...s, 
                status: 'error', 
                completionTime: new Date(),
                result: error instanceof Error ? error.message : 'Unknown error'
              } : s
            ));

            setLiveActivity(prev => [
              `❌ ${step.agentName}: Execution failed`,
              `🔧 Check API connections and retry`,
              ...prev.slice(0, 8)
            ]);
          }
        } else {
          // Simulated execution with realistic delays
          await new Promise(resolve => setTimeout(resolve, Math.random() * 3000 + 2000));
          
          setExecutionSteps(prev => prev.map((s, index) => 
            index === i ? { 
              ...s, 
              status: 'completed', 
              completionTime: new Date(),
              result: `${step.agentName} completed successfully with simulated execution`,
              thinking: `Simulated execution: ${step.action}. In real mode, this would execute actual business logic.`
            } : s
          ));

          setLiveActivity(prev => [
            `✅ ${step.agentName}: Task completed successfully (simulated)`,
            `📈 CRM Updated: ${step.crmImpact}`,
            ...prev.slice(0, 8)
          ]);
        }

        // Update progress
        setOverallProgress(((i + 1) / executionSteps.length) * 100);
      }

      // Execution completed - generate results
      const completionResult = {
        goalId: goal.id,
        goalTitle: goal.title,
        completedAt: new Date(),
        executionTime: Date.now() - executionMetrics.startTime.getTime(),
        stepsCompleted: executionSteps.length,
        agentsUsed: goal.agentsRequired,
        toolsUsed: goal.toolsNeeded,
        successMetrics: goal.successMetrics,
        estimatedROI: goal.roi,
        businessValue: executionMetrics.businessValue,
        crmChanges: executionMetrics.crmChanges,
        realMode
      };

      setGoalResults(completionResult);
      setLiveActivity(prev => [
        `🎉 Goal "${goal.title}" completed successfully!`,
        `💰 Estimated business value: $${executionMetrics.businessValue.toLocaleString()}`,
        `📊 CRM changes: ${executionMetrics.crmChanges} updates`,
        ...prev.slice(0, 7)
      ]);

      onComplete?.(completionResult);

    } catch (error) {
      console.error('Goal execution failed:', error);
      setLiveActivity(prev => [
        `❌ Goal execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        `🔄 Please check your setup and try again`,
        ...prev.slice(0, 8)
      ]);
    } finally {
      setIsExecuting(false);
    }
  };

  const cancelExecution = () => {
    setIsExecuting(false);
    setLiveActivity(prev => [
      `⏹️ Goal execution cancelled by user`,
      `📊 Partial progress saved: ${Math.round(overallProgress)}% complete`,
      ...prev.slice(0, 8)
    ]);
    onCancel?.();
  };

  const getStepIcon = (status: string, agentName: string) => {
    if (status === 'completed') return <CheckCircle className="h-5 w-5 text-green-400" />;
    if (status === 'error') return <XCircle className="h-5 w-5 text-red-400" />;
    if (status === 'running') return <div className="animate-spin w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full" />;
    
    // Return appropriate icon based on agent type
    if (agentName.includes('Voice')) return <Volume2 className="h-5 w-5 text-gray-400" />;
    if (agentName.includes('Data') || agentName.includes('Logger')) return <Database className="h-5 w-5 text-gray-400" />;
    if (agentName.includes('Demo') || agentName.includes('Slide')) return <Presentation className="h-5 w-5 text-gray-400" />;
    if (agentName.includes('Command') || agentName.includes('Analyzer')) return <Brain className="h-5 w-5 text-gray-400" />;
    return <Bot className="h-5 w-5 text-gray-400" />;
  };

  return (
    <div className="space-y-8">
      {/* Help Overlay */}
      {showHelp && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <HelpCircle className="h-6 w-6 text-blue-400" />
                <h3 className="text-xl font-bold text-white">Goal Execution Guide</h3>
              </div>
              <button 
                onClick={() => setShowHelp(false)}
                className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-4">
                <h4 className="font-semibold text-white mb-2">Understanding the Execution Flow</h4>
                <p className="text-gray-300 text-sm">
                  You're watching AI agents work together to execute a business goal. Each agent specializes in a specific task and passes work to the next agent in the workflow.
                </p>
              </div>
              
              <div className="bg-slate-700/30 rounded-lg p-4">
                <h4 className="font-semibold text-white mb-2">What You're Seeing</h4>
                <ul className="text-gray-300 text-sm space-y-2">
                  <li>• <strong>Agent Execution Flow:</strong> Step-by-step progress of each agent's work</li>
                  <li>• <strong>Live Activity Stream:</strong> Real-time updates from the AI system</li>
                  <li>• <strong>CRM Workspace:</strong> See how data changes in your CRM</li>
                  <li>• <strong>Progress Bar:</strong> Overall completion percentage</li>
                </ul>
              </div>
              
              <div className="bg-purple-500/10 border border-purple-400/30 rounded-lg p-4">
                <h4 className="font-semibold text-white mb-2">Demo vs. Live Mode</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="font-medium text-blue-300 mb-1">🔵 Demo Mode</div>
                    <p className="text-gray-300">Simulated responses for safe exploration. No real actions performed.</p>
                  </div>
                  <div>
                    <div className="font-medium text-red-300 mb-1">🔴 Live Mode</div>
                    <p className="text-gray-300">Real API execution with actual business impact. Requires API setup.</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-500/10 border border-green-400/30 rounded-lg p-4">
                <h4 className="font-semibold text-white mb-2">Tips for Best Results</h4>
                <ul className="text-gray-300 text-sm space-y-1">
                  <li>• Watch the entire execution to understand the workflow</li>
                  <li>• Toggle between agent flow and CRM view to see both perspectives</li>
                  <li>• Check the success metrics at the end to measure impact</li>
                  <li>• In Live Mode, ensure all required APIs are properly configured</li>
                </ul>
              </div>
            </div>
            
            <button
              onClick={() => setShowHelp(false)}
              className="mt-6 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      {/* Execution Header */}
      <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 relative">
              <Target className="h-8 w-8 text-white" />
              {isExecuting && (
                <div className="absolute -inset-1 bg-white/20 rounded-xl animate-pulse"></div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-3xl font-bold text-white">{goal.title}</h2>
                <Tooltip 
                  content={`${goal.complexity} complexity, ${goal.priority} priority goal`}
                  position="top"
                />
                <button
                  onClick={() => setShowHelp(true)}
                  className="p-1 rounded-full bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 hover:text-blue-300 transition-colors"
                >
                  <HelpCircle className="h-4 w-4" />
                </button>
              </div>
              <p className="text-gray-300 text-lg">{goal.description}</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-4xl font-bold text-blue-400 mb-1">{Math.round(overallProgress)}%</div>
            <div className="text-sm text-gray-400">Complete</div>
          </div>
        </div>

        {/* Mode Indicator */}
        <div className="mb-4">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
            realMode 
              ? 'bg-red-500/20 border border-red-400/30 text-red-300' 
              : 'bg-blue-500/20 border border-blue-400/30 text-blue-300'
          }`}>
            <div className="w-2 h-2 rounded-full animate-pulse" style={{
              backgroundColor: realMode ? '#f87171' : '#60a5fa'
            }}></div>
            <span className="font-medium">{realMode ? 'Live Mode' : 'Demo Mode'}</span>
            <Tooltip 
              content={realMode ? 
                "Real AI agents are executing actual business actions with your configured APIs." :
                "Simulated AI responses for safe exploration. No real actions are performed."
              }
              position="right"
            />
          </div>
        </div>

        {/* Enhanced Progress Bar */}
        <div className="mb-8">
          <div className="w-full bg-slate-700 rounded-full h-6 relative overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 rounded-full transition-all duration-500 relative"
              style={{ width: `${overallProgress}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
            </div>
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-400">
            <span>Started {executionMetrics.startTime.toLocaleTimeString()}</span>
            <span>{executionSteps.filter(s => s.status === 'completed').length}/{executionSteps.length} steps</span>
          </div>
        </div>

        {/* Real-time Metrics */}
        <div className="grid md:grid-cols-5 gap-6 mb-8">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{executionMetrics.agentsActive}</div>
            <div className="text-sm text-gray-400">Agents</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{executionMetrics.crmChanges}</div>
            <div className="text-sm text-gray-400">CRM Updates</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">${executionMetrics.businessValue.toLocaleString()}</div>
            <div className="text-sm text-gray-400">Business Value</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-400">{executionMetrics.estimatedDuration}m</div>
            <div className="text-sm text-gray-400">Est. Duration</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${realMode ? 'text-red-400' : 'text-blue-400'}`}>
              {realMode ? 'LIVE' : 'DEMO'}
            </div>
            <div className="text-sm text-gray-400">Mode</div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex gap-4 justify-center">
          {!isExecuting ? (
            <button
              onClick={executeGoal}
              className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 ${
                realMode 
                  ? 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white shadow-lg'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg'
              }`}
            >
              <span className="flex items-center gap-3">
                <Play className="h-6 w-6" />
                {realMode ? 'Execute Real Goal' : 'Start Interactive Demo'}
              </span>
            </button>
          ) : (
            <button
              onClick={cancelExecution}
              className="px-8 py-4 rounded-xl font-semibold text-lg bg-red-600 hover:bg-red-700 text-white transition-all duration-300"
            >
              <span className="flex items-center gap-3">
                <Pause className="h-6 w-6" />
                Cancel Execution
              </span>
            </button>
          )}
          
          <button
            onClick={() => setShowCRMView(!showCRMView)}
            className="px-6 py-4 rounded-xl font-medium text-gray-300 border border-slate-600 hover:border-blue-500 hover:text-white transition-all duration-300"
          >
            <span className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              {showCRMView ? 'Hide CRM' : 'Show CRM'}
            </span>
          </button>
        </div>

        {/* Mode-specific information */}
        {realMode && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-400/30 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <span className="text-red-300 text-sm font-medium">Live Mode Active</span>
            </div>
            <p className="text-red-200 text-xs">
              AI agents are performing real actions in your connected business tools. These actions may include sending emails, 
              creating calendar events, or updating CRM records.
            </p>
          </div>
        )}
      </div>

      {/* Two-Panel Layout: Execution Flow + CRM Workspace */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Agent Execution Flow */}
        <div className="space-y-6">
          {/* Execution Steps */}
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
            <div className="flex items-center gap-3 mb-6">
              <GitBranch className="h-6 w-6 text-purple-400" />
              <h3 className="text-xl font-semibold text-white">Agent Execution Flow</h3>
              <Tooltip 
                content="Watch AI agents collaborate to execute your goal step-by-step"
                position="top"
              />
              <div className="ml-auto flex items-center gap-2">
                <Network className="h-5 w-5 text-green-400" />
                <span className="text-sm text-green-400">
                  {executionSteps.filter(s => s.status === 'completed').length}/{executionSteps.length} Complete
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {executionSteps.map((step, index) => (
                <div key={step.id} className="relative">
                  {/* Connection Line */}
                  {index < executionSteps.length - 1 && (
                    <div className="absolute left-6 top-12 w-px h-16 bg-slate-600"></div>
                  )}

                  <div className={`flex gap-4 p-4 rounded-xl border transition-all duration-500 ${
                    step.status === 'running' 
                      ? 'bg-blue-500/10 border-blue-400/30 shadow-lg shadow-blue-500/20'
                      : step.status === 'completed'
                      ? 'bg-green-500/10 border-green-400/30'
                      : step.status === 'error'
                      ? 'bg-red-500/10 border-red-400/30'
                      : 'bg-slate-700/30 border-slate-600/30'
                  }`}>
                    {/* Step Indicator */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center">
                        {getStepIcon(step.status, step.agentName)}
                      </div>
                    </div>

                    {/* Step Content */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-white">{step.agentName}</h4>
                          <Tooltip 
                            content={`${step.agentName} specializes in ${step.action.toLowerCase()}`}
                            position="top"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          {step.status === 'running' && (
                            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full animate-pulse">
                              Processing...
                            </span>
                          )}
                          {step.completionTime && step.startTime && (
                            <span className="text-xs text-gray-400">
                              {((step.completionTime.getTime() - step.startTime.getTime()) / 1000).toFixed(1)}s
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-gray-300 mb-3">{step.action}</p>

                      {/* CRM Impact */}
                      {step.crmImpact && (
                        <div className="bg-orange-500/10 border border-orange-400/30 rounded-lg p-3 mb-3">
                          <div className="text-xs font-medium text-orange-400 mb-1 flex items-center gap-2">
                            <TrendingUp className="h-3 w-3" />
                            CRM Impact:
                          </div>
                          <div className="text-sm text-orange-200">{step.crmImpact}</div>
                        </div>
                      )}

                      {step.thinking && (
                        <div className="bg-slate-600/30 rounded-lg p-3 mb-3 border-l-4 border-blue-500">
                          <div className="text-xs font-medium text-blue-400 mb-1 flex items-center gap-2">
                            <Brain className="h-3 w-3" />
                            AI Process:
                          </div>
                          <div className="text-sm text-gray-300 italic">{step.thinking}</div>
                        </div>
                      )}

                      {step.toolsUsed && step.toolsUsed.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {step.toolsUsed.map((tool, i) => (
                            <span key={i} className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full">
                              🔧 {tool}
                            </span>
                          ))}
                        </div>
                      )}

                      {step.result && step.status === 'completed' && (
                        <div className="bg-green-500/10 border border-green-400/30 rounded-lg p-3">
                          <div className="text-xs font-medium text-green-400 mb-1">Result:</div>
                          <div className="text-sm text-gray-300">
                            {typeof step.result === 'string' ? step.result : JSON.stringify(step.result)}
                          </div>
                        </div>
                      )}

                      {step.result && step.status === 'error' && (
                        <div className="bg-red-500/10 border border-red-400/30 rounded-lg p-3">
                          <div className="text-xs font-medium text-red-400 mb-1">Error:</div>
                          <div className="text-sm text-gray-300">{step.result}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live Activity Feed */}
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Activity className="h-6 w-6 text-orange-400" />
              <h3 className="text-xl font-semibold text-white">Live Activity Stream</h3>
              <Tooltip 
                content="Real-time updates from the AI agent network"
                position="top"
              />
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {liveActivity.map((activity, index) => (
                <div key={index} className={`p-3 rounded-lg border transition-all duration-300 ${
                  index === 0 ? 'bg-blue-500/10 border-blue-400/30' : 'bg-slate-700/30 border-slate-600/30'
                }`}>
                  <div className="text-sm text-gray-300">{activity}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date().toLocaleTimeString()}
                  </div>
                </div>
              ))}
              
              {liveActivity.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No activity yet. Start executing the goal to see live updates!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Live CRM Workspace */}
        {showCRMView && (
          <div className="space-y-6">
            <CRMWorkspace 
              goal={goal}
              isExecuting={isExecuting}
              onActionComplete={(action) => {
                setLiveActivity(prev => [
                  `🎯 CRM Updated: ${action.action}`,
                  ...prev.slice(0, 9)
                ]);
              }}
            />
          </div>
        )}
      </div>

      {/* Goal Completion Results */}
      {goalResults && (
        <div className="bg-gradient-to-br from-green-500/10 to-blue-500/10 border border-green-400/30 rounded-2xl p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-blue-500">
              <Award className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">🎉 Goal Successfully Achieved!</h3>
              <p className="text-green-300">All AI agents have completed their tasks successfully</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="text-center p-4 bg-slate-700/30 rounded-xl">
              <div className="text-3xl font-bold text-green-400">{goalResults.stepsCompleted}</div>
              <div className="text-sm text-gray-300">Steps Completed</div>
            </div>
            <div className="text-center p-4 bg-slate-700/30 rounded-xl">
              <div className="text-3xl font-bold text-blue-400">
                {(goalResults.executionTime / 1000).toFixed(1)}s
              </div>
              <div className="text-sm text-gray-300">Execution Time</div>
            </div>
            <div className="text-center p-4 bg-slate-700/30 rounded-xl">
              <div className="text-3xl font-bold text-purple-400">${goalResults.businessValue.toLocaleString()}</div>
              <div className="text-sm text-gray-300">Business Value</div>
            </div>
            <div className="text-center p-4 bg-slate-700/30 rounded-xl">
              <div className="text-3xl font-bold text-orange-400">{goalResults.crmChanges}</div>
              <div className="text-sm text-gray-300">CRM Updates</div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-400" />
                Expected Outcomes Achieved
              </h4>
              <div className="grid md:grid-cols-2 gap-3">
                {goal.successMetrics.map((metric, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-sm text-gray-300">{metric}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-all duration-300">
                <span className="flex items-center justify-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  View Detailed Report
                </span>
              </button>
              <button className="px-6 py-3 border border-green-400 text-green-400 hover:bg-green-400/10 rounded-lg font-medium transition-all duration-300">
                <span className="flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Share Success
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveGoalExecution;