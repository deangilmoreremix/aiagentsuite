import React, { useState, useEffect } from 'react';
import { Goal } from '../types/goals';
import { allGoals } from '../data/goalsData';
import { executeAgentWithTools } from '../agents/useOpenAIAgentSuite';
import { runComposioAgent } from '../agents/composioAgentRunner';
import { 
  Play, 
  CheckCircle, 
  Clock, 
  ArrowRight, 
  Bot, 
  Zap, 
  Users, 
  Target,
  AlertTriangle,
  ExternalLink,
  Settings,
  BarChart3,
  Trophy,
  Star
} from 'lucide-react';

interface GoalAchievementFlowProps {
  goal: Goal;
  onComplete?: (result: any) => void;
  realMode?: boolean;
}

interface ExecutionStep {
  id: string;
  name: string;
  description: string;
  agent: string;
  tools: string[];
  status: 'pending' | 'running' | 'completed' | 'error';
  result?: any;
  duration?: number;
}

const GoalAchievementFlow: React.FC<GoalAchievementFlowProps> = ({ 
  goal, 
  onComplete, 
  realMode = false 
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<ExecutionStep[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [executionResult, setExecutionResult] = useState<any>(null);

  // Generate execution steps based on goal
  useEffect(() => {
    const generateSteps = (): ExecutionStep[] => {
      const baseSteps: ExecutionStep[] = [
        {
          id: 'setup',
          name: 'Initialize Goal Setup',
          description: 'Prepare agents and validate tool connections',
          agent: 'Command Analyzer Agent',
          tools: ['supabase'],
          status: 'pending'
        },
        {
          id: 'planning',
          name: 'Create Execution Plan',
          description: 'Analyze goal requirements and create optimal workflow',
          agent: 'CRM Action Advisor Agent',
          tools: ['openai'],
          status: 'pending'
        }
      ];

      // Add goal-specific steps based on agents required
      goal.agentsRequired.forEach((agent, index) => {
        baseSteps.push({
          id: `agent-${index}`,
          name: `Execute ${agent}`,
          description: `Deploy ${agent} to work on goal requirements`,
          agent: agent,
          tools: goal.toolsNeeded,
          status: 'pending'
        });
      });

      // Add completion steps
      baseSteps.push(
        {
          id: 'validation',
          name: 'Validate Results',
          description: 'Verify goal completion and measure success metrics',
          agent: 'Timeline Logger Agent',
          tools: ['supabase'],
          status: 'pending'
        },
        {
          id: 'reporting',
          name: 'Generate Report',
          description: 'Create achievement report with ROI metrics',
          agent: 'Structured Output Agent',
          tools: ['supabase', 'openai'],
          status: 'pending'
        }
      );

      return baseSteps;
    };

    setSteps(generateSteps());
  }, [goal]);

  const executeGoal = async () => {
    if (isRunning) return;

    setIsRunning(true);
    setCurrentStep(0);
    setOverallProgress(0);

    try {
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        
        // Update current step
        setCurrentStep(i);
        setSteps(prev => prev.map((s, index) => 
          index === i ? { ...s, status: 'running' } : s
        ));

        const startTime = Date.now();

        if (realMode) {
          // Execute real agent
          try {
            const result = await runComposioAgent(
              step.agent,
              `Execute goal: ${goal.title}. Step: ${step.description}`,
              step.tools
            );
            
            const duration = Date.now() - startTime;
            
            setSteps(prev => prev.map((s, index) => 
              index === i ? { 
                ...s, 
                status: 'completed', 
                result: result.success ? result.result : result.error,
                duration
              } : s
            ));
          } catch (error) {
            setSteps(prev => prev.map((s, index) => 
              index === i ? { 
                ...s, 
                status: 'error', 
                result: error instanceof Error ? error.message : 'Unknown error'
              } : s
            ));
            break;
          }
        } else {
          // Simulate execution
          await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));
          
          const duration = Date.now() - startTime;
          
          setSteps(prev => prev.map((s, index) => 
            index === i ? { 
              ...s, 
              status: 'completed', 
              result: `${step.name} completed successfully`,
              duration
            } : s
          ));
        }

        // Update progress
        setOverallProgress(((i + 1) / steps.length) * 100);
      }

      // Generate final result
      const finalResult = {
        goalId: goal.id,
        goalTitle: goal.title,
        completedAt: new Date(),
        stepsCompleted: steps.length,
        totalDuration: steps.reduce((acc, step) => acc + (step.duration || 0), 0),
        successMetrics: goal.successMetrics,
        estimatedROI: goal.roi,
        agentsUsed: goal.agentsRequired,
        toolsUsed: goal.toolsNeeded
      };

      setExecutionResult(finalResult);
      onComplete?.(finalResult);

    } catch (error) {
      console.error('Goal execution failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getStepStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400 bg-green-500/20 border-green-400/30';
      case 'running': return 'text-blue-400 bg-blue-500/20 border-blue-400/30';
      case 'error': return 'text-red-400 bg-red-500/20 border-red-400/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-400/30';
    }
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-5 w-5" />;
      case 'running': return <div className="animate-spin w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full" />;
      case 'error': return <AlertTriangle className="h-5 w-5" />;
      default: return <Clock className="h-5 w-5" />;
    }
  };

  const completedSteps = steps.filter(s => s.status === 'completed').length;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Goal Header */}
      <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <Target className="h-8 w-8 text-blue-400" />
              <h2 className="text-2xl font-bold text-white">{goal.title}</h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                goal.priority === 'High' ? 'bg-red-500/20 text-red-400' :
                goal.priority === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-green-500/20 text-green-400'
              }`}>
                {goal.priority} Priority
              </span>
            </div>
            <p className="text-gray-300 mb-4">{goal.description}</p>
            <div className="text-green-400 font-medium">{goal.businessImpact}</div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-white mb-1">{Math.round(overallProgress)}%</div>
            <div className="text-sm text-gray-400">Complete</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="w-full bg-slate-700 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${overallProgress}%` }}
            ></div>
          </div>
        </div>

        {/* Goal Metrics */}
        <div className="grid md:grid-cols-4 gap-6 mb-6">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-400">{goal.estimatedSetupTime}</div>
            <div className="text-sm text-gray-400">Setup Time</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-400">{goal.agentsRequired.length}</div>
            <div className="text-sm text-gray-400">Agents Required</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-orange-400">{goal.toolsNeeded.length}</div>
            <div className="text-sm text-gray-400">Tools Needed</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-400">{goal.roi}</div>
            <div className="text-sm text-gray-400">Expected ROI</div>
          </div>
        </div>

        {/* Execution Button */}
        <div className="flex justify-center">
          <button
            onClick={executeGoal}
            disabled={isRunning}
            className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 ${
              isRunning
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : realMode
                ? 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white transform hover:scale-105'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transform hover:scale-105'
            }`}
          >
            <span className="flex items-center gap-3">
              {isRunning ? (
                <>
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                  Executing Goal...
                </>
              ) : (
                <>
                  <Play className="h-5 w-5" />
                  {realMode ? 'Execute Real Goal' : 'Start Goal Achievement'}
                </>
              )}
            </span>
          </button>
        </div>
      </div>

      {/* Execution Steps */}
      <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8">
        <div className="flex items-center gap-3 mb-8">
          <Bot className="h-6 w-6 text-purple-400" />
          <h3 className="text-xl font-semibold text-white">Execution Steps</h3>
          <div className="ml-auto text-sm text-gray-400">
            {completedSteps}/{steps.length} completed
          </div>
        </div>

        <div className="space-y-6">
          {steps.map((step, index) => (
            <div key={step.id} className="relative">
              {/* Connection Line */}
              {index < steps.length - 1 && (
                <div className="absolute left-6 top-12 w-px h-16 bg-slate-600"></div>
              )}

              <div className={`flex gap-6 p-6 rounded-xl border transition-all duration-300 ${
                getStepStatusColor(step.status)
              }`}>
                {/* Step Indicator */}
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center">
                    {getStepIcon(step.status)}
                  </div>
                </div>

                {/* Step Content */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-white">{step.name}</h4>
                    <div className="flex items-center gap-2">
                      {step.duration && (
                        <span className="text-xs text-gray-400">
                          {(step.duration / 1000).toFixed(1)}s
                        </span>
                      )}
                      {step.status === 'running' && index === currentStep && (
                        <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">
                          Current
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-gray-300 mb-3">{step.description}</p>

                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-purple-400" />
                      <span className="text-sm text-purple-300">{step.agent}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4 text-blue-400" />
                      <span className="text-sm text-blue-300">{step.tools.length} tools</span>
                    </div>
                  </div>

                  {step.tools.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {step.tools.map((tool, i) => (
                        <span key={i} className="text-xs bg-slate-600/30 text-gray-400 px-2 py-1 rounded-full">
                          {tool}
                        </span>
                      ))}
                    </div>
                  )}

                  {step.result && (
                    <div className="bg-slate-700/30 rounded-lg p-3">
                      <div className="text-xs font-medium text-gray-400 mb-1">Result</div>
                      <div className="text-sm text-gray-300">
                        {typeof step.result === 'string' ? step.result : JSON.stringify(step.result)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Execution Result */}
      {executionResult && (
        <div className="bg-gradient-to-br from-green-500/10 to-blue-500/10 border border-green-400/30 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <Trophy className="h-8 w-8 text-yellow-400" />
            <h3 className="text-2xl font-semibold text-white">Goal Achieved!</h3>
            <Star className="h-6 w-6 text-yellow-400" />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{executionResult.stepsCompleted}</div>
              <div className="text-sm text-gray-300">Steps Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {(executionResult.totalDuration / 1000).toFixed(1)}s
              </div>
              <div className="text-sm text-gray-300">Total Duration</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{executionResult.agentsUsed.length}</div>
              <div className="text-sm text-gray-300">Agents Deployed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-400">{executionResult.estimatedROI}</div>
              <div className="text-sm text-gray-300">Estimated ROI</div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-white mb-2">Success Metrics Achieved</h4>
              <div className="grid md:grid-cols-2 gap-3">
                {executionResult.successMetrics.map((metric: string, index: number) => (
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
                  <ExternalLink className="h-4 w-4" />
                  Share Achievement
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalAchievementFlow;