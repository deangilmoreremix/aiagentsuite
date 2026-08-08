import { useState } from 'react';
import { Bot, Mic, Zap, Brain, Play, Volume2, Target, Database, Presentation, Users, Shield } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'agent' | 'system';
  content: string;
  agentName?: string;
  timestamp: Date;
  processing?: boolean;
}

const demoAgentSystem = [
  { name: 'Voice Input Agent', color: 'blue', icon: Mic, description: 'OpenAI Whisper transcription' },
  { name: 'Command Analyzer', color: 'purple', icon: Brain, description: 'Gemini + GPT-4 intent analysis' },
  { name: 'Function Caller', color: 'orange', icon: Zap, description: 'Real CRM action execution' },
  { name: 'Voice Output', color: 'green', icon: Volume2, description: 'ElevenLabs natural speech' },
  { name: 'UI Renderer', color: 'teal', icon: Presentation, description: 'Visual demo generation' },
  { name: 'Timeline Logger', color: 'indigo', icon: Target, description: 'Audit trail creation' },
  { name: 'Structured Output', color: 'pink', icon: Database, description: 'JSON formatting' },
  { name: 'Demo Generator', color: 'amber', icon: Presentation, description: 'Slide & walkthrough creation' },
  { name: 'Objection Handler', color: 'red', icon: Shield, description: 'Smart objection responses' },
  { name: 'Action Advisor', color: 'cyan', icon: Users, description: 'Next-step recommendations' }
];

const demoScenarios = [
  {
    user: "Create a new contact for Sarah Johnson at TechCorp",
    agentFlow: [
      { agent: 'Voice Input Agent', message: 'Voice command received and transcribed', delay: 300 },
      { agent: 'Command Analyzer', message: 'Detected: Contact creation request for Sarah Johnson, TechCorp', delay: 600 },
      { agent: 'Function Caller', message: 'Executing createContact() with validated data', delay: 1000 },
      { agent: 'Timeline Logger', message: 'Logging contact creation event to CRM timeline', delay: 1300 },
      { agent: 'Voice Output', message: 'Contact created successfully! Sarah Johnson from TechCorp is now in your CRM.', delay: 1600 },
      { agent: 'UI Renderer', message: '✅ Rendering success confirmation with contact card', delay: 1900 }
    ]
  },
  {
    user: "Schedule a demo meeting with John for Friday at 2 PM",
    agentFlow: [
      { agent: 'Voice Input Agent', message: 'Meeting request captured via voice input', delay: 300 },
      { agent: 'Command Analyzer', message: 'Parsed: Demo meeting, contact "John", Friday 2 PM', delay: 600 },
      { agent: 'Function Caller', message: 'Checking Google Calendar availability for Friday 2 PM...', delay: 1000 },
      { agent: 'Function Caller', message: 'Creating Zoom meeting and calendar event', delay: 1400 },
      { agent: 'Timeline Logger', message: 'Meeting scheduled and logged to contact timeline', delay: 1700 },
      { agent: 'Voice Output', message: 'Perfect! Demo meeting with John scheduled for Friday at 2 PM. Zoom invite sent.', delay: 2000 },
      { agent: 'UI Renderer', message: '📅 Displaying meeting confirmation with Zoom link', delay: 2300 }
    ]
  },
  {
    user: "Send a follow-up email to all leads from last week",
    agentFlow: [
      { agent: 'Voice Input Agent', message: 'Bulk email request processed', delay: 300 },
      { agent: 'Command Analyzer', message: 'Identified: Bulk follow-up for leads from past 7 days', delay: 600 },
      { agent: 'Function Caller', message: 'Querying CRM database: Found 47 leads from last week', delay: 1000 },
      { agent: 'Function Caller', message: 'Generating personalized email content for each lead', delay: 1400 },
      { agent: 'Function Caller', message: 'Sending emails via Gmail API integration', delay: 1800 },
      { agent: 'Timeline Logger', message: 'Bulk email campaign logged with delivery tracking', delay: 2100 },
      { agent: 'Voice Output', message: 'Campaign complete! 47 personalized follow-up emails sent to last week\'s leads.', delay: 2400 },
      { agent: 'UI Renderer', message: '📧 Campaign summary with open/click tracking enabled', delay: 2700 }
    ]
  },
  {
    user: "What's the ROI on our current sales process?",
    agentFlow: [
      { agent: 'Voice Input Agent', message: 'Analytics query received', delay: 300 },
      { agent: 'Command Analyzer', message: 'Request type: Sales ROI analysis and reporting', delay: 600 },
      { agent: 'Function Caller', message: 'Aggregating sales data from past 90 days', delay: 1000 },
      { agent: 'Function Caller', message: 'Calculating conversion rates, deal values, and cycle times', delay: 1400 },
      { agent: 'Demo Generator', message: 'Creating ROI visualization with charts and metrics', delay: 1800 },
      { agent: 'Voice Output', message: 'Your current sales ROI is 3.4x. Average deal size: $12,400. Conversion rate: 18%.', delay: 2200 },
      { agent: 'UI Renderer', message: '📊 Interactive ROI dashboard with drill-down capabilities', delay: 2500 }
    ]
  }
];

const MultiAgentDemo = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentScenario, setCurrentScenario] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [activeAgents, setActiveAgents] = useState<string[]>([]);
  const [, setCurrentStep] = useState(0);

  const runDemo = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setMessages([]);
    setActiveAgents([]);
    setCurrentStep(0);
    
    const scenario = demoScenarios[currentScenario];
    
    // Add user message
    const userMessage: Message = {
      id: 'user-' + Date.now(),
      type: 'user',
      content: scenario.user,
      timestamp: new Date()
    };
    setMessages([userMessage]);
    
    // Process agent flow
    for (let i = 0; i < scenario.agentFlow.length; i++) {
      const step = scenario.agentFlow[i];
      await new Promise(resolve => setTimeout(resolve, step.delay));
      
      setCurrentStep(i);
      setActiveAgents([step.agent]);
      
      const agentMessage: Message = {
        id: 'agent-' + Date.now() + Math.random(),
        type: 'agent',
        content: step.message,
        agentName: step.agent,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, agentMessage]);
    }
    
    setActiveAgents([]);
    setCurrentStep(0);
    setIsRunning(false);
  };

  const nextScenario = () => {
    setCurrentScenario((prev) => (prev + 1) % demoScenarios.length);
  };

  const getAgentColor = (agentName: string) => {
    const agent = demoAgentSystem.find(a => a.name === agentName);
    return agent?.color || 'gray';
  };

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-500/20 border-blue-400/30 text-blue-300',
      purple: 'bg-purple-500/20 border-purple-400/30 text-purple-300',
      orange: 'bg-orange-500/20 border-orange-400/30 text-orange-300',
      green: 'bg-green-500/20 border-green-400/30 text-green-300',
      teal: 'bg-teal-500/20 border-teal-400/30 text-teal-300',
      indigo: 'bg-indigo-500/20 border-indigo-400/30 text-indigo-300',
      pink: 'bg-pink-500/20 border-pink-400/30 text-pink-300',
      amber: 'bg-amber-500/20 border-amber-400/30 text-amber-300',
      red: 'bg-red-500/20 border-red-400/30 text-red-300',
      cyan: 'bg-cyan-500/20 border-cyan-400/30 text-cyan-300',
      gray: 'bg-gray-500/20 border-gray-400/30 text-gray-300'
    };
    return colors[color as keyof typeof colors];
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold text-white mb-4">
          Demo Agent Multi-System in Action
        </h2>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
          Watch how the Demo Agent's 10 internal sub-agents collaborate in real-time to execute complex CRM tasks. 
          Each agent specializes in a specific function and passes work seamlessly through the system.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Agent Flow Visualization */}
        <div className="lg:col-span-2">
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <Bot className="h-6 w-6 text-blue-400" />
              Demo Agent Internal System Flow
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {demoAgentSystem.map((agent) => {
                const IconComponent = agent.icon;
                const isActive = activeAgents.includes(agent.name);
                
                return (
                  <div
                    key={agent.name}
                    className={`flex items-center gap-3 p-4 rounded-lg border transition-all duration-300 ${
                      isActive 
                        ? getColorClasses(agent.color)
                        : 'bg-slate-800/30 border-slate-700/30'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${isActive ? 'bg-white/20' : 'bg-slate-700/50'}`}>
                      <IconComponent className={`h-4 w-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium text-sm ${isActive ? 'text-white' : 'text-gray-300'}`}>
                        {agent.name}
                      </div>
                      <div className="text-xs text-gray-400 truncate">
                        {agent.description}
                      </div>
                      {isActive && (
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="text-xs text-green-400">Processing...</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Live Demo Chat</h3>
              <div className="flex gap-2">
                <button
                  onClick={nextScenario}
                  className="px-3 py-1 text-sm bg-slate-700 text-gray-300 rounded-lg hover:bg-slate-600 transition-colors"
                >
                  Scenario {currentScenario + 1}/{demoScenarios.length}
                </button>
              </div>
            </div>

            <div className="h-96 overflow-y-auto mb-4 space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.type === 'agent' && (
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getColorClasses(getAgentColor(message.agentName || ''))}`}>
                      <Bot className="h-4 w-4" />
                    </div>
                  )}
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      message.type === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700/50 text-gray-200'
                    }`}
                  >
                    {message.agentName && (
                      <div className="text-xs font-medium opacity-75 mb-1">
                        {message.agentName}
                      </div>
                    )}
                    <div className="text-sm">{message.content}</div>
                  </div>
                  {message.type === 'user' && (
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-medium">You</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <div className="text-center text-sm text-gray-400">
                Current Scenario: "{demoScenarios[currentScenario].user}"
              </div>
              <button
                onClick={runDemo}
                disabled={isRunning}
                className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 ${
                  isRunning
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white hover:shadow-lg transform hover:scale-105'
                }`}
              >
                {isRunning ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Processing Multi-Agent Flow...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Play className="h-4 w-4" />
                    Run Multi-Agent Demo
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* System Architecture Overview */}
      <div className="mt-16 bg-gradient-to-r from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8">
        <h4 className="text-2xl font-bold text-white text-center mb-8">
          Demo Agent Architecture Overview
        </h4>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mic className="h-8 w-8 text-white" />
            </div>
            <div className="text-white font-medium mb-2">Input Processing</div>
            <div className="text-sm text-gray-400">Voice & text capture with Whisper AI</div>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <div className="text-white font-medium mb-2">Intent Analysis</div>
            <div className="text-sm text-gray-400">GPT-4 & Gemini powered understanding</div>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="h-8 w-8 text-white" />
            </div>
            <div className="text-white font-medium mb-2">Action Execution</div>
            <div className="text-sm text-gray-400">Real CRM functions via Supabase</div>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Volume2 className="h-8 w-8 text-white" />
            </div>
            <div className="text-white font-medium mb-2">Voice Response</div>
            <div className="text-sm text-gray-400">ElevenLabs natural speech output</div>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Presentation className="h-8 w-8 text-white" />
            </div>
            <div className="text-white font-medium mb-2">Visual Output</div>
            <div className="text-sm text-gray-400">UI rendering & demo generation</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MultiAgentDemo;