import React, { useState } from 'react';
import { 
  PlayCircle, 
  Settings, 
  Zap, 
  MessageSquare, 
  Target, 
  Users, 
  CheckCircle,
  AlertTriangle,
  Info,
  Lightbulb,
  Rocket,
  Eye,
  Bot,
  Key,
  ExternalLink
} from 'lucide-react';

interface HowToUseProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenApiSetup: () => void;
}

const HowToUse: React.FC<HowToUseProps> = ({ isOpen, onClose, onOpenApiSetup }) => {
  const [activeSection, setActiveSection] = useState('overview');

  if (!isOpen) return null;

  const sections = [
    {
      id: 'overview',
      title: 'Getting Started',
      icon: Rocket,
      content: (
        <div className="space-y-6">
          <div className="bg-blue-500/10 border border-blue-400/30 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
              <PlayCircle className="h-6 w-6 text-blue-400" />
              Welcome to SmartCRM AI Agent Suite
            </h3>
            <p className="text-gray-300 mb-4 leading-relaxed">
              This is an interactive AI-powered CRM where specialized agents work together to automate your entire sales process. 
              You can experience it in two modes:
            </p>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                  <span className="font-semibold text-blue-300">Demo Mode</span>
                </div>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Simulated AI responses</li>
                  <li>• No setup required</li>
                  <li>• Perfect for exploring features</li>
                  <li>• Safe to experiment with</li>
                </ul>
              </div>
              
              <div className="bg-red-500/10 border border-red-400/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
                  <span className="font-semibold text-red-300">Live Mode</span>
                </div>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Real AI execution</li>
                  <li>• Requires API setup</li>
                  <li>• Actual business actions</li>
                  <li>• Production-ready results</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-white text-lg">Quick Start Steps:</h4>
            <div className="space-y-3">
              {[
                'Start with Demo Mode to explore the interface safely',
                'Try the interactive goal explorer to see available automations',
                'Use the AI console to interact with agents via voice or text',
                'When ready, set up your APIs for Live Mode execution',
                'Execute real goals to automate your actual business processes'
              ].map((step, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-slate-700/30 rounded-lg">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-1">
                    {index + 1}
                  </div>
                  <span className="text-gray-300">{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'ai-console',
      title: 'AI Console',
      icon: MessageSquare,
      content: (
        <div className="space-y-6">
          <div className="bg-purple-500/10 border border-purple-400/30 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
              <Bot className="h-6 w-6 text-purple-400" />
              How to Use the AI Console
            </h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-white mb-2">Voice Interaction:</h4>
                <ul className="text-gray-300 space-y-1 ml-4">
                  <li>• Click the microphone icon to start voice input</li>
                  <li>• Speak naturally: "Create a contact for John Smith at TechCorp"</li>
                  <li>• The system will transcribe and execute your command</li>
                  <li>• In Live Mode, you'll hear AI voice responses</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-white mb-2">Text Commands:</h4>
                <ul className="text-gray-300 space-y-1 ml-4">
                  <li>• Type commands in natural language</li>
                  <li>• Examples: "Schedule demo with Sarah for Friday", "Send follow-up to warm leads"</li>
                  <li>• Press Enter or click Send to execute</li>
                </ul>
              </div>
              
              <div className="bg-slate-700/30 rounded-lg p-4">
                <h4 className="font-semibold text-blue-400 mb-2">Example Commands to Try:</h4>
                <div className="space-y-2">
                  {[
                    "Create a new contact for Sarah Johnson at TechCorp",
                    "Schedule a demo meeting with John for Friday at 2 PM", 
                    "Send a follow-up email to all leads from last week",
                    "What's the ROI on our current sales process?",
                    "Handle this objection: 'Your price is too high'"
                  ].map((command, index) => (
                    <div key={index} className="bg-slate-600/30 rounded p-2 text-sm text-gray-300 font-mono">
                      "{command}"
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'goals',
      title: 'Goal System',
      icon: Target,
      content: (
        <div className="space-y-6">
          <div className="bg-green-500/10 border border-green-400/30 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
              <Target className="h-6 w-6 text-green-400" />
              Understanding Business Goals
            </h3>
            
            <div className="space-y-4">
              <p className="text-gray-300">
                Goals are pre-built automation workflows that solve specific business problems. 
                Each goal involves multiple AI agents working together to achieve a specific outcome.
              </p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-white mb-2">Goal Categories:</h4>
                  <ul className="text-gray-300 space-y-1 text-sm">
                    <li>• <strong>Sales:</strong> Lead generation, closing deals, outreach</li>
                    <li>• <strong>Marketing:</strong> Campaigns, nurturing, content</li>
                    <li>• <strong>Relationship:</strong> Customer interactions, memory</li>
                    <li>• <strong>Automation:</strong> Workflows, reminders, tasks</li>
                    <li>• <strong>Analytics:</strong> Forecasting, reporting, insights</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-white mb-2">Priority Levels:</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                      <span className="text-red-300 font-medium">High:</span>
                      <span className="text-gray-300 text-sm">Maximum business impact</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      <span className="text-yellow-300 font-medium">Medium:</span>
                      <span className="text-gray-300 text-sm">Good ROI, moderate setup</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      <span className="text-green-300 font-medium">Low:</span>
                      <span className="text-gray-300 text-sm">Nice-to-have features</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-700/30 rounded-lg p-4">
                <h4 className="font-semibold text-blue-400 mb-2">How to Execute Goals:</h4>
                <ol className="text-gray-300 space-y-2 text-sm">
                  <li>1. Browse goals by category or use search filters</li>
                  <li>2. Click on a goal card to see details and requirements</li>
                  <li>3. Click "Start Interactive Demo" for Demo Mode execution</li>
                  <li>4. Watch the multi-agent workflow in the execution modal</li>
                  <li>5. See real-time CRM updates and business impact</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'live-mode',
      title: 'Live Mode Setup',
      icon: Zap,
      content: (
        <div className="space-y-6">
          <div className="bg-red-500/10 border border-red-400/30 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
              <Zap className="h-6 w-6 text-red-400" />
              Setting Up Live Mode
            </h3>
            
            <div className="bg-orange-500/10 border border-orange-400/30 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-orange-400" />
                <span className="font-semibold text-orange-300">Important:</span>
              </div>
              <p className="text-orange-200 text-sm">
                Live Mode executes real actions with your actual tools and APIs. Only enable this when you're ready 
                for the AI to perform actual business operations.
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                  <Key className="h-4 w-4 text-blue-400" />
                  Required API Keys:
                </h4>
                <div className="space-y-3">
                  <div className="bg-slate-700/30 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-blue-400">OpenAI (Required)</span>
                      <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-full">Critical</span>
                    </div>
                    <p className="text-gray-300 text-sm">Powers all AI agent intelligence and natural language processing</p>
                    <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" 
                       className="text-blue-400 hover:text-blue-300 text-sm inline-flex items-center gap-1 mt-1">
                      Get API Key <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  
                  <div className="bg-slate-700/30 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-purple-400">Composio (Recommended)</span>
                      <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">Tools</span>
                    </div>
                    <p className="text-gray-300 text-sm">Enables 50+ tool integrations (Gmail, Calendar, Slack, etc.)</p>
                    <a href="https://app.composio.dev/" target="_blank" rel="noopener noreferrer" 
                       className="text-purple-400 hover:text-purple-300 text-sm inline-flex items-center gap-1 mt-1">
                      Get API Key <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  
                  <div className="bg-slate-700/30 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-green-400">ElevenLabs (Optional)</span>
                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">Voice</span>
                    </div>
                    <p className="text-gray-300 text-sm">AI voice generation and text-to-speech features</p>
                    <a href="https://elevenlabs.io/" target="_blank" rel="noopener noreferrer" 
                       className="text-green-400 hover:text-green-300 text-sm inline-flex items-center gap-1 mt-1">
                      Get API Key <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-4">
                <button
                  onClick={onOpenApiSetup}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <Settings className="h-5 w-5" />
                  Open API Setup Guide
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'agents',
      title: 'AI Agents',
      icon: Users,
      content: (
        <div className="space-y-6">
          <div className="bg-indigo-500/10 border border-indigo-400/30 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
              <Users className="h-6 w-6 text-indigo-400" />
              Understanding AI Agents
            </h3>
            
            <p className="text-gray-300 mb-4">
              The SmartCRM system uses 15+ specialized AI agents that work together like a real sales team. 
              Each agent has specific expertise and responsibilities.
            </p>
            
            <div className="grid gap-4">
              <div className="bg-slate-700/30 rounded-lg p-4">
                <h4 className="font-semibold text-blue-400 mb-2">Core Sales Agents:</h4>
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <div>• <strong>AI SDR Agent:</strong> Finds and qualifies leads</div>
                  <div>• <strong>AI AE Agent:</strong> Manages full sales process</div>
                  <div>• <strong>Lead Scoring Agent:</strong> Prioritizes prospects</div>
                  <div>• <strong>Follow-up Agent:</strong> Ensures no lead is forgotten</div>
                </div>
              </div>
              
              <div className="bg-slate-700/30 rounded-lg p-4">
                <h4 className="font-semibold text-purple-400 mb-2">Communication Agents:</h4>
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <div>• <strong>Voice Agent:</strong> Handles speech input/output</div>
                  <div>• <strong>Email Agent:</strong> Writes personalized emails</div>
                  <div>• <strong>SMS Agent:</strong> Manages text campaigns</div>
                  <div>• <strong>Objection Handler:</strong> Responds to concerns</div>
                </div>
              </div>
              
              <div className="bg-slate-700/30 rounded-lg p-4">
                <h4 className="font-semibold text-green-400 mb-2">How Agents Collaborate:</h4>
                <ol className="text-gray-300 space-y-1 text-sm">
                  <li>1. <strong>Command Analyzer</strong> understands your request</li>
                  <li>2. <strong>Function Trigger</strong> executes CRM actions</li>
                  <li>3. <strong>Specialized agents</strong> handle specific tasks</li>
                  <li>4. <strong>Timeline Logger</strong> records all activities</li>
                  <li>5. <strong>Voice Agent</strong> provides feedback</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'tips',
      title: 'Tips & Best Practices',
      icon: Lightbulb,
      content: (
        <div className="space-y-6">
          <div className="bg-yellow-500/10 border border-yellow-400/30 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
              <Lightbulb className="h-6 w-6 text-yellow-400" />
              Pro Tips for Maximum Success
            </h3>
            
            <div className="space-y-4">
              <div className="bg-green-500/10 border border-green-400/30 rounded-lg p-4">
                <h4 className="font-semibold text-green-400 mb-2 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Best Practices:
                </h4>
                <ul className="text-gray-300 space-y-1 text-sm">
                  <li>• Start with Demo Mode to familiarize yourself with the interface</li>
                  <li>• Begin with simple, high-priority goals for quick wins</li>
                  <li>• Use natural language when interacting with agents</li>
                  <li>• Monitor the live activity feed to understand agent behavior</li>
                  <li>• Set up your most important tool integrations first</li>
                  <li>• Review execution results to optimize future automations</li>
                </ul>
              </div>
              
              <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-4">
                <h4 className="font-semibold text-blue-400 mb-2 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Recommended Goal Sequence:
                </h4>
                <ol className="text-gray-300 space-y-1 text-sm">
                  <li>1. <strong>"Score and prioritize leads"</strong> - Quick setup, immediate value</li>
                  <li>2. <strong>"Auto-log lead interactions"</strong> - Keeps CRM clean automatically</li>
                  <li>3. <strong>"Book meetings without back-and-forth"</strong> - Saves tons of time</li>
                  <li>4. <strong>"Generate leads automatically"</strong> - Fills your pipeline</li>
                  <li>5. <strong>"Cold outreach without writing"</strong> - Scales your outreach</li>
                </ol>
              </div>
              
              <div className="bg-orange-500/10 border border-orange-400/30 rounded-lg p-4">
                <h4 className="font-semibold text-orange-400 mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Common Mistakes to Avoid:
                </h4>
                <ul className="text-gray-300 space-y-1 text-sm">
                  <li>• Don't jump into Live Mode without understanding the goal first</li>
                  <li>• Don't execute multiple complex goals simultaneously at first</li>
                  <li>• Don't ignore the API setup requirements for Live Mode</li>
                  <li>• Don't forget to monitor the CRM workspace during execution</li>
                  <li>• Don't skip reading the success metrics before starting</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  const currentSection = sections.find(s => s.id === activeSection) || sections[0];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      
      <div className="relative w-full h-full flex items-center justify-center p-4">
        <div className="w-full max-w-6xl h-full max-h-[90vh] bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
          
          {/* Header */}
          <div className="p-6 border-b border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500">
                  <Eye className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">How to Use SmartCRM AI</h1>
                  <p className="text-gray-300">Complete guide to mastering the AI Agent Suite</p>
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="flex h-full">
            {/* Sidebar Navigation */}
            <div className="w-80 bg-slate-800/50 border-r border-slate-700 p-6 overflow-y-auto">
              <h3 className="text-lg font-semibold text-white mb-4">Guide Sections</h3>
              <div className="space-y-2">
                {sections.map((section) => {
                  const IconComponent = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-300 ${
                        activeSection === section.id
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-300 hover:bg-slate-700/50 hover:text-white'
                      }`}
                    >
                      <IconComponent className="h-5 w-5" />
                      {section.title}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="max-w-4xl">
                {currentSection.content}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowToUse;