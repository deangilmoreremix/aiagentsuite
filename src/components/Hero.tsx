import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Bot, 
  Zap, 
  Brain, 
  MessageSquare, 
  Mic, 
  Play, 
  Send, 
  Volume2, 
  Users, 
  Shield, 
  Globe, 
  Sparkles, 
  Activity, 
  Network, 
  ArrowRight, 
  Star, 
  Clock, 
  CheckCircle, 
  TrendingUp, 
  Target, 
  Mail, 
  Calendar, 
  Phone,
  Eye,
  Pause,
  Settings,
  PlayCircle,
  MicOff,
  BarChart3,
  Workflow,
  ExternalLink,
  Database,
  Presentation,
  AlertTriangle,
  Info,
  HelpCircle
} from 'lucide-react';
import { executeAgentWithTools, composioToolPickerOptions, composioAuthMap } from '../agents/useOpenAIAgentSuite';
import ModeToggle from './ModeToggle';
import Tooltip from './Tooltip';

interface Message {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  agentName?: string;
  thinking?: string;
  actions?: string[];
  toolsUsed?: any[];
  realExecution?: boolean;
}

interface AgentActivity {
  id: string;
  agent: string;
  action: string;
  status: 'processing' | 'completed' | 'waiting';
  timestamp: Date;
  icon: any;
  color: string;
  result?: string;
  toolsUsed?: string[];
}

interface ConnectedTool {
  id: string;
  name: string;
  icon: string;
  status: 'connected' | 'disconnected' | 'connecting';
  lastUsed?: Date;
}

const heroFeatures = [
  {
    title: "Voice-Powered AI Conversations",
    description: "Talk naturally to your CRM like a real assistant",
    icon: Mic,
    color: "blue",
    demo: "Try saying: 'Schedule a demo with John for Friday'"
  },
  {
    title: "Multi-Agent Intelligence Network", 
    description: "15+ specialized agents work together automatically",
    icon: Network,
    color: "purple",
    demo: "Watch agents collaborate in real-time"
  },
  {
    title: "Real CRM Actions",
    description: "AI actually executes tasks in your business tools",
    icon: Zap,
    color: "orange", 
    demo: "Creates contacts, sends emails, books meetings"
  },
  {
    title: "Enterprise-Grade Security",
    description: "SOC2 compliant with encrypted data handling",
    icon: Shield,
    color: "green",
    demo: "Bank-level security for your sales data"
  }
];

const examplePrompts = [
  "Create a new contact for Sarah Johnson at TechCorp",
  "Schedule a demo meeting with John for Friday at 2 PM", 
  "Send a follow-up email to all leads from last week",
  "What's the ROI on our current sales process?",
  "Handle this objection: 'Your price is too high'",
  "Create a call script for fitness studios in NYC"
];

const liveAgentActivities = [
  {
    agent: "AI SDR Agent",
    action: "Crafting personalized outreach for 47 new leads",
    icon: Mail,
    color: "blue",
    result: "89% open rate achieved",
    toolsUsed: ["gmail", "linkedin"]
  },
  {
    agent: "Voice Output Agent", 
    action: "Converting proposal to natural speech",
    icon: Volume2,
    color: "green",
    result: "Voice response ready",
    toolsUsed: ["elevenlabs"]
  },
  {
    agent: "Meeting Scheduler",
    action: "Finding optimal time slots for prospect",
    icon: Calendar,
    color: "purple",
    result: "3 options identified",
    toolsUsed: ["google_calendar", "zoom"]
  },
  {
    agent: "Lead Scoring Agent",
    action: "Analyzing 300 leads for priority ranking",
    icon: TrendingUp,
    color: "orange",
    result: "12 hot leads identified",
    toolsUsed: ["hubspot", "salesforce"]
  },
  {
    agent: "Objection Handler",
    action: "Preparing response to pricing concern",
    icon: Shield,
    color: "red",
    result: "ROI calculator generated",
    toolsUsed: ["stripe", "google_sheets"]
  }
];

const trustIndicators = [
  { label: "Active Users", value: "2,847", trend: "+23%" },
  { label: "Uptime", value: "99.9%", trend: "24/7" },
  { label: "Emails Sent Today", value: "12,439", trend: "+156%" },
  { label: "Meetings Scheduled", value: "387", trend: "This week" }
];

const Hero = () => {
  const [activeFeature, setActiveFeature] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [agentActivities, setAgentActivities] = useState<AgentActivity[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [liveStats, setLiveStats] = useState(trustIndicators);
  const [connectedTools, setConnectedTools] = useState<ConnectedTool[]>([]);
  const [showToolPicker, setShowToolPicker] = useState(false);
  const [realMode, setRealMode] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Initialize connected tools from composio options
  useEffect(() => {
    const initialTools = composioToolPickerOptions.slice(0, 6).map(tool => ({
      id: tool.value,
      name: tool.label,
      icon: tool.icon || '🔧',
      status: Math.random() > 0.3 ? 'connected' : 'disconnected' as 'connected' | 'disconnected',
      lastUsed: Math.random() > 0.5 ? new Date(Date.now() - Math.random() * 86400000) : undefined
    }));
    setConnectedTools(initialTools);
  }, []);

  // Rotate features every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (isMountedRef.current) {
        setActiveFeature((prev) => (prev + 1) % heroFeatures.length);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Rotate example prompts
  useEffect(() => {
    const interval = setInterval(() => {
      if (isMountedRef.current) {
        setCurrentPromptIndex((prev) => (prev + 1) % examplePrompts.length);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Simulate live agent activity
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isMountedRef.current) return;
      
      const randomActivity = liveAgentActivities[Math.floor(Math.random() * liveAgentActivities.length)];
      const newActivity: AgentActivity = {
        id: Date.now().toString(),
        agent: randomActivity.agent,
        action: randomActivity.action,
        status: 'processing',
        timestamp: new Date(),
        icon: randomActivity.icon,
        color: randomActivity.color,
        result: randomActivity.result,
        toolsUsed: randomActivity.toolsUsed
      };

      setAgentActivities(prev => {
        const updated = [newActivity, ...prev.slice(0, 4)];
        // Complete the activity after 2 seconds
        setTimeout(() => {
          if (isMountedRef.current) {
            setAgentActivities(current => 
              current.map(activity => 
                activity.id === newActivity.id 
                  ? { ...activity, status: 'completed' }
                  : activity
              )
            );
          }
        }, 2000);
        return updated;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Update live stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (isMountedRef.current) {
        setLiveStats(prev => prev.map(stat => ({
          ...stat,
          value: stat.label === "Active Users" 
            ? (parseInt(stat.value.replace(',', '')) + Math.floor(Math.random() * 3)).toLocaleString()
            : stat.label === "Emails Sent Today"
            ? (parseInt(stat.value.replace(',', '')) + Math.floor(Math.random() * 50)).toLocaleString()
            : stat.label === "Meetings Scheduled"
            ? (parseInt(stat.value) + Math.floor(Math.random() * 2)).toString()
            : stat.value
        })));
      }
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Show tooltip for new users
  useEffect(() => {
    if (!localStorage.getItem('console-tooltip-seen')) {
      setTimeout(() => {
        if (isMountedRef.current) {
          setShowTooltip(true);
          setTimeout(() => {
            if (isMountedRef.current) {
              setShowTooltip(false);
              localStorage.setItem('console-tooltip-seen', 'true');
            }
          }, 8000);
        }
      }, 3000);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');
    setIsProcessing(true);

    if (realMode) {
      // Real agent execution
      try {
        const thinkingMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'system',
          content: 'Executing real AI agents with OpenAI + Composio...',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, thinkingMessage]);

        // Execute real agent
        const result = await executeAgentWithTools(
          "Smart Assistant Agent", 
          currentInput, 
          ["gmail", "google_calendar", "slack"]
        );

        // Remove thinking message
        setMessages(prev => prev.filter(msg => msg.id !== thinkingMessage.id));

        const aiResponse: Message = {
          id: (Date.now() + 2).toString(),
          type: 'ai',
          content: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
          agentName: "Smart Assistant Agent",
          timestamp: new Date(),
          realExecution: true,
          toolsUsed: ["OpenAI GPT-4", "Composio", "Real APIs"]
        };

        setMessages(prev => [...prev, aiResponse]);

      } catch (error) {
        console.error('Real agent execution failed:', error);
        const errorMessage: Message = {
          id: (Date.now() + 3).toString(),
          type: 'system',
          content: 'Real agent execution failed. Please check your API keys and connections.',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } else {
      // Simulated execution
      const thinkingMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'system',
        content: 'AI agents analyzing your request...',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, thinkingMessage]);

      // Simulate agent processing steps
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Remove thinking message and add agent responses
      setMessages(prev => prev.filter(msg => msg.id !== thinkingMessage.id));

      const agentResponses = [
        {
          agentName: "Command Analyzer",
          content: "Intent detected: Contact creation. Extracting entities...",
          thinking: "Parsing natural language for contact details and required actions",
          actions: ["entity_extraction", "intent_classification"]
        },
        {
          agentName: "Function Trigger",
          content: "Executing createContact() with validated data",
          thinking: "Creating contact record in Supabase with proper data validation",
          actions: ["database_insert", "data_validation"]
        },
        {
          agentName: "Voice Output",
          content: "✅ Contact created successfully! I've added them to your CRM and scheduled a follow-up reminder.",
          thinking: "Generating natural language confirmation with next steps",
          actions: ["text_to_speech", "confirmation_message"]
        }
      ];

      for (let i = 0; i < agentResponses.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const response = agentResponses[i];
        const aiMessage: Message = {
          id: (Date.now() + i + 2).toString(),
          type: 'ai',
          content: response.content,
          agentName: response.agentName,
          thinking: response.thinking,
          actions: response.actions,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, aiMessage]);
      }
    }

    setIsProcessing(false);
  };

  const handleVoiceToggle = () => {
    setIsListening(!isListening);
    if (!isListening) {
      // Simulate voice input
      setTimeout(() => {
        setInputValue(examplePrompts[Math.floor(Math.random() * examplePrompts.length)]);
        setIsListening(false);
      }, 3000);
    }
  };

  const handleTryExample = () => {
    setInputValue(examplePrompts[currentPromptIndex]);
  };

  const handleToolConnection = async (toolValue: string) => {
    setConnectedTools(prev => prev.map(tool => 
      tool.id === toolValue ? { ...tool, status: 'connecting' } : tool
    ));

    try {
      // Extract app name from composio tool value
      const appName = toolValue.replace('composio:', '');
      const authFunction = composioAuthMap[`connect${appName.replace(/(^|_)(\w)/g, (_, p1, p2) => p2.toUpperCase())}OAuth`];
      
      if (authFunction) {
        await authFunction();
        setConnectedTools(prev => prev.map(tool => 
          tool.id === toolValue ? { 
            ...tool, 
            status: 'connected',
            lastUsed: new Date()
          } : tool
        ));
      }
    } catch (error) {
      console.error('Tool connection failed:', error);
      setConnectedTools(prev => prev.map(tool => 
        tool.id === toolValue ? { ...tool, status: 'disconnected' } : tool
      ));
    } catch (error) {
      console.error('Failed to generate enhanced demo:', error);
      return {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: `I understand you want to work with "${input}". I'm currently in demo mode, so I'll provide simulated responses.`,
        agentName: 'Enhanced Demo Agent',
        timestamp: new Date(),
        thinking: 'Demo mode: Providing simulated response due to generation error',
        emotionalTone: 'professional'
      };
    }
  };

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'from-blue-500 to-blue-600',
      purple: 'from-purple-500 to-purple-600', 
      orange: 'from-orange-500 to-orange-600',
      green: 'from-green-500 to-green-600',
      red: 'from-red-500 to-red-600'
    };
    return colors[color as keyof typeof colors];
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-white via-blue-50 to-gray-50 dark:from-slate-900 dark:via-blue-900 dark:to-slate-900">
      {/* Animated Background with Particles */}
      <div className="absolute inset-0">
        {/* Particle System */}
        <div className="absolute inset-0">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-blue-400/10 dark:bg-blue-400/10 animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: `${Math.random() * 3 + 1}px`,
                height: `${Math.random() * 3 + 1}px`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${Math.random() * 3 + 2}s`
              }}
            />
          ))}
        </div>

        {/* Data Flow Lines */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400 dark:via-blue-500 to-transparent animate-pulse"></div>
          <div className="absolute top-3/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400 dark:via-purple-500 to-transparent animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-0 bottom-0 left-1/4 w-px bg-gradient-to-b from-transparent via-blue-400 dark:via-blue-500 to-transparent animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-0 bottom-0 right-1/4 w-px bg-gradient-to-b from-transparent via-purple-400 dark:via-purple-500 to-transparent animate-pulse" style={{animationDelay: '3s'}}></div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-section="dashboard">
        {/* Compact Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="relative">
              <Bot className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">SmartCRM</span>
            <span className="text-blue-600 dark:text-blue-400">AI Agent Suite</span>
          </div>
        </div>

        {/* Main Hero Content - More Compact */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          {/* Left: Value Proposition */}
          <div className="space-y-6">
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
              Transform Your CRM Into an{' '}
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 dark:from-blue-400 dark:via-purple-400 dark:to-blue-400 bg-clip-text text-transparent animate-pulse">
                AI Sales Machine
              </span>
            </h1>
            
            <p className="text-xl text-gray-700 dark:text-gray-300 leading-relaxed">
              Deploy 15+ specialized AI agents that work 24/7 to automate your entire sales process. 
              From lead generation to closing deals — all powered by voice, vision, and intelligence.
            </p>

            {/* Compact Stats */}
            <div className="grid grid-cols-4 gap-4 py-6">
              {liveStats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/features-analytics"
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <BarChart3 className="inline-block w-6 h-6 mr-3" />
                Advanced Features & Analytics
              </Link>
              <button className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                <PlayCircle className="inline-block w-6 h-6 mr-3" />
                Try Interactive Demo
              </button>
              <button className="border-2 border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 hover:bg-blue-600 dark:hover:bg-blue-400 hover:text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300">
                <Eye className="inline-block w-5 h-5 mr-2" />
                Watch Live Demo
              </button>
            </div>
          </div>

          {/* Right: Interactive Demo Console */}
          <div className="space-y-6">
            {/* Global Mode Toggle */}
            <div className={`p-4 rounded-xl border transition-all duration-300 bg-white dark:bg-slate-800/50 ${
              realMode 
                ? 'border-red-400/50 dark:border-red-400/30' 
                : 'border-blue-400/50 dark:border-blue-400/30'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full animate-pulse ${
                    realMode ? 'bg-red-500' : 'bg-blue-500'
                  }`}></div>
                  <span className={`font-semibold ${
                    realMode ? 'text-red-600 dark:text-red-300' : 'text-blue-600 dark:text-blue-300'
                  }`}>
                    {realMode ? '🔴 LIVE MODE' : '🔵 DEMO MODE'}
                  </span>
                  <Tooltip 
                    content={realMode ? 
                      "Live Mode: Real AI execution with your APIs. Use carefully!" : 
                      "Demo Mode: Safe simulation for exploring features"
                    }
                    position="top"
                  />
                </div>
                <button
                  onClick={() => setRealMode(!realMode)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                    realMode 
                      ? 'bg-red-600 hover:bg-red-700 text-white' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  Switch Mode
                </button>
              </div>
              <p className={`text-sm ${
                realMode ? 'text-red-600 dark:text-red-200' : 'text-blue-600 dark:text-blue-200'
              }`}>
                {realMode 
                  ? 'Real AI agents executing with your API keys'
                  : 'Simulated AI responses for demonstration'
                }
              </p>
            </div>

            {/* Compact Interactive Console */}
            <div className="bg-white/95 dark:bg-gradient-to-br dark:from-slate-800/90 dark:to-slate-900/90 backdrop-blur-xl rounded-2xl border border-gray-300/50 dark:border-slate-700/50 p-6 h-96 flex flex-col relative shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex gap-2">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                </div>
                <span className="text-gray-900 dark:text-white font-semibold">AI Agent Console</span>
                <Tooltip 
                  content="Interact with AI agents using natural language. Try typing or using voice commands."
                  position="top"
                />
                <div className="ml-auto flex items-center gap-2">
                  <Activity className="h-4 w-4 text-green-400 animate-pulse" />
                  <span className="text-sm text-green-600 dark:text-green-400">Live</span>
                </div>
              </div>

              {/* Compact Messages */}
              <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                {messages.length === 0 && (
                  <div className="text-center py-8">
                    <Bot className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                    <h3 className="text-gray-900 dark:text-white font-semibold mb-2">Try the AI Console</h3>
                    <button
                      onClick={handleTryExample}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
                    >
                      Try: "{examplePrompts[currentPromptIndex]}"
                    </button>
                  </div>
                )}

                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.type !== 'user' && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                    )}
                    
                    <div className={`max-w-xs ${message.type === 'user' ? 'order-2' : ''}`}>
                      {message.agentName && (
                        <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">{message.agentName}</div>
                      )}
                      
                      <div
                        className={`px-4 py-3 rounded-xl text-sm ${
                          message.type === 'user'
                            ? 'bg-blue-600 text-white'
                            : message.type === 'system'
                            ? realMode 
                              ? 'bg-red-50 dark:bg-red-500/20 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-500/30'
                              : 'bg-yellow-50 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-500/30'
                            : 'bg-gray-100 dark:bg-slate-700/50 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-slate-600/30'
                        }`}
                      >
                        {message.content}
                      </div>
                    </div>

                    {message.type === 'user' && (
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 order-3">
                        <span className="text-white text-xs font-medium">You</span>
                      </div>
                    )}
                  </div>
                ))}
                
                {isProcessing && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    </div>
                    <div className="bg-gray-200/50 dark:bg-slate-700/50 px-4 py-3 rounded-xl border border-gray-300/30 dark:border-slate-600/30">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-700 dark:text-gray-300">AI agents processing...</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Compact Input */}
              <div className="flex items-center gap-3 relative">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Command your AI agents..."
                    className="w-full pl-4 pr-4 py-3 bg-white/70 dark:bg-slate-700/50 border border-gray-300/50 dark:border-slate-600/50 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500/50"
                    disabled={isProcessing}
                  />
                </div>
                
                <button
                  onClick={handleVoiceToggle}
                  className={`p-3 rounded-xl transition-all duration-300 ${
                    isListening
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-600 hover:text-gray-900 dark:hover:text-white'
                  }`}
                  disabled={isProcessing}
                >
                  {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </button>
                
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isProcessing}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 text-white p-3 rounded-xl transition-all duration-300"
                >
                  <Send className="h-5 w-5" />
                </button>

                {/* Interactive Tooltip for New Users */}
                {showTooltip && (
                  <div className="absolute -top-24 right-0 bg-blue-500/20 dark:bg-blue-500/20 border border-blue-400/30 dark:border-blue-400/30 rounded-lg p-3 w-64 animate-fadeIn shadow-lg">
                    <div className="flex items-start gap-2">
                      <HelpCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
                      <div>
                        <p className="text-blue-700 dark:text-blue-300 text-sm">Try typing a command or click the microphone to use voice!</p>
                        <button 
                          className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mt-2"
                          onClick={() => {
                            setShowTooltip(false);
                            handleTryExample();
                          }}
                        >
                          Try an example →
                        </button>
                      </div>
                    </div>
                    <div className="absolute bottom-[-8px] right-12 w-4 h-4 bg-blue-500/20 dark:bg-blue-500/20 border border-blue-400/30 dark:border-blue-400/30 transform rotate-45"></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Compact Feature Preview */}
        <div className="bg-white/90 dark:bg-gradient-to-r dark:from-slate-800/80 dark:to-slate-900/80 backdrop-blur-xl rounded-2xl border border-gray-300/50 dark:border-slate-700/50 p-8 shadow-xl">
          <div className="grid md:grid-cols-4 gap-6 text-center">
            {heroFeatures.map((feature, index) => {
              const IconComponent = feature.icon;
              const isActive = activeFeature === index;
              
              return (
                <div
                  key={index}
                  className={`p-6 rounded-xl border transition-all duration-500 ${
                    isActive 
                      ? 'bg-blue-500/10 dark:bg-blue-500/10 border-blue-400/30 dark:border-blue-400/30 transform scale-105'
                      : 'bg-gray-100/30 dark:bg-slate-700/30 border-gray-300/30 dark:border-slate-600/30'
                  }`}
                >
                  <div className={`p-3 rounded-lg bg-gradient-to-r ${getColorClasses(feature.color)} mb-4 mx-auto w-fit`}>
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{feature.description}</p>
                  <Tooltip 
                    content={feature.demo}
                    position="bottom"
                    className="mt-2 inline-block"
                  >
                    <Info className="h-4 w-4 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" />
                  </Tooltip>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;