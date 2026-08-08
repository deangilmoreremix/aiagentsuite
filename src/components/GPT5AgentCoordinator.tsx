import React, { useState, useEffect } from 'react';
import { 
  Network, 
  Bot, 
  Activity, 
  Brain, 
  CheckCircle, 
  ArrowRight,
  Users,
  Play,
  Star,
  GitBranch,
  Database,
  MessageSquare,
  Calendar
} from 'lucide-react';
import { EnhancedTaskInput } from '../types/taskExecution';
import Tooltip from './Tooltip';

interface AgentStatus {
  name: string;
  status: 'idle' | 'analyzing' | 'executing' | 'waiting' | 'completed' | 'error';
  currentAction?: string;
  progress: number;
  estimatedTimeRemaining: number;
  toolsInUse: string[];
  collaboratingWith: string[];
  businessImpact: string;
}

interface CoordinationEvent {
  id: string;
  timestamp: Date;
  type: 'coordination' | 'execution' | 'completion' | 'error';
  agentName: string;
  message: string;
  details?: any;
}

interface GPT5AgentCoordinatorProps {
  task: EnhancedTaskInput;
  isExecuting: boolean;
  onComplete?: (result: any) => void;
  onCancel?: () => void;
  realMode?: boolean;
}

const GPT5AgentCoordinator: React.FC<GPT5AgentCoordinatorProps> = ({
  task,
  isExecuting,
  onComplete: _onComplete,
  onCancel: _onCancel,
  realMode: _realMode = false
}) => {
  const [agentStatuses, setAgentStatuses] = useState<Record<string, AgentStatus>>({});
  const [coordinationEvents, setCoordinationEvents] = useState<CoordinationEvent[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [currentPhase] = useState<'planning' | 'execution' | 'validation' | 'completion'>('planning');
  const [networkVisualization, setNetworkVisualization] = useState<any[]>([]);
  const [gpt5Insights, setGPT5Insights] = useState<string[]>([]);

  // Initialize agent statuses
  useEffect(() => {
    const initialStatuses: Record<string, AgentStatus> = {};
    
    task.requiredAgents.forEach(agentName => {
      initialStatuses[agentName] = {
        name: agentName,
        status: 'idle',
        progress: 0,
        estimatedTimeRemaining: Math.floor(Math.random() * 300) + 60,
        toolsInUse: [],
        collaboratingWith: [],
        businessImpact: generateBusinessImpact(agentName)
      };
    });

    setAgentStatuses(initialStatuses);
  }, [task]);

  // Simulate real-time agent coordination when executing
  useEffect(() => {
    if (!isExecuting) return;

    const interval = setInterval(() => {
      updateAgentStatuses();
      updateCoordinationEvents();
      updateNetworkVisualization();
      updateGPT5Insights();
    }, 2000);

    return () => clearInterval(interval);
  }, [isExecuting]);

  const generateBusinessImpact = (agentName: string): string => {
    const impacts: Record<string, string> = {
      'AI SDR Agent': 'Generating qualified leads and prospect data',
      'AI AE Agent': 'Managing deal progression and closing activities',
      'Email Agent': 'Creating and sending personalized communications',
      'Voice Agent': 'Processing speech and generating natural responses',
      'Calendar Agent': 'Scheduling meetings and managing availability',
      'Follow-up Agent': 'Ensuring no prospects are forgotten',
      'Lead Scoring Agent': 'Prioritizing prospects by conversion likelihood',
      'Timeline Logger Agent': 'Maintaining complete activity audit trail',
      'Content Generator Agent': 'Creating compelling sales and marketing materials'
    };
    return impacts[agentName] || 'Contributing to overall task success';
  };

  const updateAgentStatuses = () => {
    setAgentStatuses(prev => {
      const updated = { ...prev };
      
      Object.keys(updated).forEach(agentName => {
        const agent = updated[agentName];
        
        // Update progress
        if (agent.status === 'executing') {
          agent.progress = Math.min(100, agent.progress + Math.random() * 15 + 5);
          agent.estimatedTimeRemaining = Math.max(0, agent.estimatedTimeRemaining - 2);
          
          if (agent.progress >= 100) {
            agent.status = 'completed';
            agent.estimatedTimeRemaining = 0;
          }
        } else if (agent.status === 'idle' && Math.random() > 0.7) {
          agent.status = 'analyzing';
          agent.currentAction = 'Analyzing task requirements with GPT-5';
        } else if (agent.status === 'analyzing' && Math.random() > 0.6) {
          agent.status = 'executing';
          agent.currentAction = `Executing ${agentName.toLowerCase()} tasks`;
          agent.toolsInUse = getRandomTools();
        }
      });
      
      return updated;
    });

    // Update overall progress
    const totalAgents = Object.keys(agentStatuses).length;
    const completedAgents = Object.values(agentStatuses).filter(agent => agent.status === 'completed').length;
    setOverallProgress(totalAgents > 0 ? (completedAgents / totalAgents) * 100 : 0);
  };

  const updateCoordinationEvents = () => {
    const events = [
      'GPT-5 coordinating agent handoff from SDR to AE',
      'Analyzing prospect engagement data for personalization',
      'Optimizing email timing based on recipient behavior',
      'Coordinating calendar availability across multiple prospects',
      'Validating data quality before CRM updates',
      'Generating personalized content based on prospect profile'
    ];

    const newEvent: CoordinationEvent = {
      id: `event-${Date.now()}`,
      timestamp: new Date(),
      type: 'coordination',
      agentName: 'GPT-5 Coordinator',
      message: events[Math.floor(Math.random() * events.length)]
    };

    setCoordinationEvents(prev => [newEvent, ...prev.slice(0, 9)]);
  };

  const updateNetworkVisualization = () => {
    // Simulate network connections between agents
    const connections = task.requiredAgents.map(agent => ({
      agent,
      connections: task.requiredAgents.filter(other => other !== agent && Math.random() > 0.6),
      strength: Math.random() * 100
    }));
    
    setNetworkVisualization(connections);
  };

  const updateGPT5Insights = () => {
    const insights = [
      'Optimal timing detected: Send emails at 10 AM for maximum engagement',
      'Cross-reference pattern found: TechCorp prospects respond better to technical content',
      'Efficiency opportunity: Batch similar tasks to reduce API overhead',
      'Quality improvement: Adding personalization increased response rates by 23%',
      'Risk mitigation: Validating email addresses prevented 12 bounces'
    ];

    if (Math.random() > 0.7) {
      const newInsight = insights[Math.floor(Math.random() * insights.length)];
      setGPT5Insights(prev => [newInsight, ...prev.slice(0, 4)]);
    }
  };

  const getRandomTools = (): string[] => {
    const tools = ['gmail', 'google_calendar', 'slack', 'hubspot', 'zoom'];
    return tools.slice(0, Math.floor(Math.random() * 3) + 1);
  };

  const getAgentIcon = (agentName: string) => {
    if (agentName.includes('Voice')) return MessageSquare;
    if (agentName.includes('Email')) return MessageSquare;
    if (agentName.includes('Calendar')) return Calendar;
    if (agentName.includes('Data') || agentName.includes('Logger')) return Database;
    return Bot;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'executing': return 'text-blue-400 bg-blue-500/20';
      case 'completed': return 'text-green-400 bg-green-500/20';
      case 'error': return 'text-red-400 bg-red-500/20';
      case 'waiting': return 'text-yellow-400 bg-yellow-500/20';
      case 'analyzing': return 'text-purple-400 bg-purple-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  return (
    <div className="space-y-8">
      {/* GPT-5 Coordination Header */}
      <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 relative">
              <Network className="h-8 w-8 text-white" />
              <div className="absolute -inset-1 bg-white/20 rounded-xl animate-pulse"></div>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">GPT-5 Agent Coordination</h2>
              <p className="text-gray-300">Multi-agent collaboration powered by advanced AI reasoning</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-4xl font-bold text-blue-400 mb-1">{Math.round(overallProgress)}%</div>
            <div className="text-sm text-gray-400">Overall Progress</div>
          </div>
        </div>

        {/* Phase Indicator */}
        <div className="flex items-center justify-center gap-4 mb-6">
          {[
            { phase: 'planning', label: 'Planning', icon: Brain, color: 'blue' },
            { phase: 'execution', label: 'Execution', icon: Play, color: 'purple' },
            { phase: 'validation', label: 'Validation', icon: CheckCircle, color: 'green' },
            { phase: 'completion', label: 'Completion', icon: Star, color: 'yellow' }
          ].map((phaseItem, index) => {
            const IconComponent = phaseItem.icon;
            const isActive = currentPhase === phaseItem.phase;
            const isCompleted = ['planning', 'execution', 'validation'].indexOf(currentPhase) > 
              ['planning', 'execution', 'validation'].indexOf(phaseItem.phase);
            
            return (
              <div key={phaseItem.phase} className="flex items-center">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                  isActive 
                    ? `bg-${phaseItem.color}-600 text-white shadow-lg`
                    : isCompleted 
                      ? 'bg-green-600 text-white' 
                      : 'bg-slate-700 text-gray-400'
                }`}>
                  <IconComponent className="h-5 w-5" />
                  <span className="font-medium">{phaseItem.label}</span>
                </div>
                {index < 3 && (
                  <ArrowRight className="h-5 w-5 text-gray-400 mx-3" />
                )}
              </div>
            );
          })}
        </div>

        {/* Enhanced Progress Bar */}
        <div className="w-full bg-slate-700 rounded-full h-4 relative overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 rounded-full transition-all duration-500 relative"
            style={{ width: `${overallProgress}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Agent Network Status */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Users className="h-6 w-6 text-purple-400" />
            <h3 className="text-xl font-semibold text-white">Agent Network Status</h3>
            <Tooltip 
              content="Real-time status of all AI agents working on your task"
              position="top"
            />
          </div>

          <div className="space-y-4">
            {Object.values(agentStatuses).map((agent, _index) => {
              const IconComponent = getAgentIcon(agent.name);
              
              return (
                <div key={agent.name} className={`p-4 rounded-xl border transition-all duration-300 ${getStatusColor(agent.status)}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <IconComponent className="h-5 w-5" />
                      <span className="font-medium text-white">{agent.name}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {agent.status === 'executing' && (
                        <div className="animate-spin w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full"></div>
                      )}
                      <span className="text-xs font-medium capitalize">{agent.status}</span>
                    </div>
                  </div>

                  {agent.currentAction && (
                    <div className="text-sm text-gray-300 mb-2">{agent.currentAction}</div>
                  )}

                  <div className="mb-3">
                    <div className="w-full bg-slate-600/50 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${agent.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-gray-400">Business Impact:</span>
                      <div className="text-gray-300">{agent.businessImpact}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Time Remaining:</span>
                      <div className="text-blue-400">{agent.estimatedTimeRemaining}s</div>
                    </div>
                  </div>

                  {agent.toolsInUse.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {agent.toolsInUse.map((tool, i) => (
                        <span key={i} className="text-xs bg-slate-600/30 text-gray-400 px-2 py-1 rounded-full">
                          {tool}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Coordination Events & GPT-5 Insights */}
        <div className="space-y-6">
          {/* Live Coordination Events */}
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Brain className="h-6 w-6 text-blue-400" />
              <h3 className="text-xl font-semibold text-white">GPT-5 Coordination Events</h3>
              <Tooltip 
                content="Real-time coordination decisions made by GPT-5"
                position="top"
              />
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto">
              {coordinationEvents.map((event) => (
                <div key={event.id} className="p-3 bg-slate-700/30 border border-slate-600/30 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    <span className="font-medium text-white">{event.agentName}</span>
                    <span className="text-xs text-gray-400">{event.timestamp.toLocaleTimeString()}</span>
                  </div>
                  <div className="text-sm text-gray-300">{event.message}</div>
                </div>
              ))}
              
              {coordinationEvents.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Coordination events will appear here during execution</p>
                </div>
              )}
            </div>
          </div>

          {/* GPT-5 Insights */}
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Star className="h-6 w-6 text-yellow-400" />
              <h3 className="text-xl font-semibold text-white">AI Insights</h3>
              <Tooltip 
                content="GPT-5 generated insights and optimizations during execution"
                position="top"
              />
            </div>

            <div className="space-y-3">
              {gpt5Insights.map((insight, index) => (
                <div key={index} className="p-3 bg-yellow-500/10 border border-yellow-400/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Star className="h-4 w-4 text-yellow-400 mt-1 flex-shrink-0" />
                    <span className="text-sm text-yellow-200">{insight}</span>
                  </div>
                </div>
              ))}
              
              {gpt5Insights.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>GPT-5 insights will appear here during execution</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Network Visualization */}
      <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8">
        <div className="flex items-center gap-3 mb-6">
          <GitBranch className="h-6 w-6 text-green-400" />
          <h3 className="text-xl font-semibold text-white">Agent Collaboration Network</h3>
          <Tooltip 
            content="Visual representation of how agents are collaborating on your task"
            position="top"
          />
        </div>

        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
          {networkVisualization.map((node, index) => (
            <div key={index} className="text-center">
              <div className="relative mx-auto w-16 h-16 mb-3">
                <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <Bot className="h-8 w-8 text-white" />
                </div>
                {node.connections.length > 0 && (
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-xs text-white font-bold">
                    {node.connections.length}
                  </div>
                )}
              </div>
              <div className="text-sm font-medium text-white mb-1">
                {node.agent.replace('Agent', '')}
              </div>
              <div className="text-xs text-gray-400">
                {Math.round(node.strength)}% active
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GPT5AgentCoordinator;