import React, { useState } from 'react';
import { 
  Users, 
  Target, 
  CheckSquare, 
  Calendar, 
  Megaphone,
  Mail,
  MessageCircle,
  Phone,
  Video,
  BarChart3,
  Bot,
  ArrowRight,
  Zap,
  Star,
  Brain,
  Volume2,
  Presentation,
  Shield,
  Database,
  Heart,
  Mic,
  FileText,
  UserCheck,
  PlayCircle,
  Settings,
  GitBranch,
  Network,
  Workflow
} from 'lucide-react';

const crmModules = [
  {
    id: 'contacts',
    name: 'Contacts & Lead Intelligence',
    icon: Users,
    color: 'blue',
    description: 'AI-powered lead management with intelligent contact extraction and behavior analysis',
    agents: [
      {
        name: 'Command Analyzer Agent',
        purpose: 'Extracts intent from user commands',
        example: 'Processes "Add John from Tesla" into structured contact data',
        technology: 'GPT-4 + Intent Classification'
      },
      {
        name: 'CRM Action Advisor Agent',
        purpose: 'Recommends next best actions',
        example: 'Suggests "Send intro email?" or "Set meeting?" after contact creation',
        technology: 'Gemini + CRM Analytics'
      },
      {
        name: 'Function Trigger Agent',
        purpose: 'Creates contacts in Supabase database',
        example: 'Executes contact creation with validated data fields',
        technology: 'Supabase + OpenAI Function Calling'
      },
      {
        name: 'Emotion & Intent Detection Agent',
        purpose: 'Detects lead urgency and sales stage',
        example: 'Identifies "High Priority" leads based on behavior patterns',
        technology: 'Gemini + Sentiment Analysis'
      },
      {
        name: 'Timeline Logger Agent',
        purpose: 'Logs all conversations and actions',
        example: 'Records "Voice call handled by AI. Prospect interested in demos."',
        technology: 'Supabase + Timeline Generation'
      },
      {
        name: 'AI SDR Agent',
        purpose: 'Generates and qualifies new leads automatically',
        example: 'Finds 50 qualified prospects matching your ICP and adds to CRM',
        technology: 'GPT-4 + Lead Generation APIs'
      },
      {
        name: 'Lead Scoring Agent',
        purpose: 'Scores leads based on engagement and fit',
        example: 'Assigns scores 1-100 based on email opens, website visits, company size',
        technology: 'ML Models + Behavioral Analytics'
      },
      {
        name: 'Lead Enrichment Agent',
        purpose: 'Enriches contact data with additional information',
        example: 'Adds LinkedIn profiles, company info, and social data to contacts',
        technology: 'Data Enrichment APIs + AI Processing'
      }
    ]
  },
  {
    id: 'deals',
    name: 'Deals & Pipelines',
    icon: Target,
    color: 'green',
    description: 'Intelligent deal progression with automated stage management and objection handling',
    agents: [
      {
        name: 'Command Analyzer Agent',
        purpose: 'Understands deal stage commands',
        example: 'Processes "Move Tesla to Negotiation stage" automatically',
        technology: 'GPT-4 + Pipeline Logic'
      },
      {
        name: 'CRM Action Advisor Agent',
        purpose: 'Suggests deal progression actions',
        example: 'Recommends follow-up timing based on deal stage',
        technology: 'Gemini + Deal Analytics'
      },
      {
        name: 'Structured Output Agent',
        purpose: 'Formats deal data for pipeline UI',
        example: 'Creates visual deal cards with progress indicators',
        technology: 'OpenAI + JSON Formatting'
      },
      {
        name: 'Objection Handler Agent',
        purpose: 'Handles objections and suggests responses',
        example: 'Responds to "We\'re not ready" with strategic next steps',
        technology: 'GPT-4 + Objection Database'
      },
      {
        name: 'Function Trigger Agent',
        purpose: 'Executes deal stage changes',
        example: 'Updates deal status with reasoning logs',
        technology: 'Supabase + State Management'
      },
      {
        name: 'AI AE Agent',
        purpose: 'Manages entire sales process from demo to close',
        example: 'Conducts product demos and handles complex negotiations',
        technology: 'GPT-4 + Sales Methodology Engine'
      },
      {
        name: 'Cold Outreach Closer Agent',
        purpose: 'Specializes in closing deals from cold outreach',
        example: 'Converts cold leads to signed contracts through strategic sequences',
        technology: 'Advanced GPT-4 + Closing Frameworks'
      },
      {
        name: 'Proposal Generator Agent',
        purpose: 'Creates custom proposals and contracts',
        example: 'Generates tailored proposals with pricing and terms',
        technology: 'GPT-4 + Document Generation'
      }
    ]
  },
  {
    id: 'sales-assistant',
    name: 'Sales Assistant & Email Composer',
    icon: Mail,
    color: 'purple',
    description: 'AI-powered email composition with personalization and tone matching',
    agents: [
      {
        name: 'Command Analyzer Agent',
        purpose: 'Processes email composition requests',
        example: 'Understands "Write follow-up for Tesla deal"',
        technology: 'GPT-4 + Context Analysis'
      },
      {
        name: 'AI Sales Assistant Agent',
        purpose: 'Writes personalized emails',
        example: 'Creates cold emails, follow-ups using contact history',
        technology: 'GPT-4 + Personalization Engine'
      },
      {
        name: 'Structured Output Agent',
        purpose: 'Formats email output with actions',
        example: 'Provides email with Send, Edit, Schedule options',
        technology: 'OpenAI + UI Generation'
      },
      {
        name: 'Voice Output Agent',
        purpose: 'Reads emails aloud for review',
        example: 'Natural voice playback of composed emails',
        technology: 'ElevenLabs + Audio Generation'
      },
      {
        name: 'Objection Handler Agent',
        purpose: 'Handles negative customer responses',
        example: 'Adjusts tone when customers respond negatively',
        technology: 'GPT-4 + Response Analysis'
      },
      {
        name: 'Emotion Detection Agent',
        purpose: 'Matches customer tone and emotion',
        example: 'Suggests formal vs casual tone based on customer style',
        technology: 'Gemini + Emotion AI'
      },
      {
        name: 'Personalized Email Agent',
        purpose: 'Creates highly personalized email content',
        example: 'Writes unique emails based on prospect\'s industry and role',
        technology: 'GPT-4 + Personalization Algorithms'
      },
      {
        name: 'AI Journeys Agent',
        purpose: 'Manages multi-step email sequences',
        example: 'Creates 7-step nurture sequence with automated triggers',
        technology: 'Workflow Engine + AI Content Generation'
      },
      {
        name: 'Follow-up Agent',
        purpose: 'Ensures no lead goes uncontacted',
        example: 'Automatically schedules and sends follow-up emails',
        technology: 'Scheduling Engine + GPT-4'
      },
      {
        name: 'Reengagement Agent',
        purpose: 'Revives dormant leads and conversations',
        example: 'Sends targeted campaigns to inactive prospects',
        technology: 'Behavioral Analysis + GPT-4'
      },
      {
        name: 'WhatsApp Nurturer Agent',
        purpose: 'Manages WhatsApp conversations and nurturing',
        example: 'Sends personalized WhatsApp messages with high engagement',
        technology: 'WhatsApp API + Conversational AI'
      },
      {
        name: 'SMS Campaigner Agent',
        purpose: 'Executes SMS marketing campaigns',
        example: 'Sends timely SMS follow-ups with 60%+ response rates',
        technology: 'Twilio + AI Message Optimization'
      }
    ]
  },
  {
    id: 'calendar',
    name: 'Calendar & Meeting Scheduling',
    icon: Calendar,
    color: 'orange',
    description: 'Automated meeting scheduling with natural language processing and calendar integration',
    agents: [
      {
        name: 'CRM Action Advisor Agent',
        purpose: 'Suggests optimal meeting times',
        example: 'Recommends best times based on prospect timezone',
        technology: 'Gemini + Calendar Analytics'
      },
      {
        name: 'Function Trigger Agent',
        purpose: 'Creates calendar events automatically',
        example: 'Books "Demo with John Friday at 3pm" in Google Calendar',
        technology: 'Google Calendar API + Supabase'
      },
      {
        name: 'Command Analyzer Agent',
        purpose: 'Parses natural meeting requests',
        example: 'Understands "Schedule demo next Tuesday afternoon"',
        technology: 'GPT-4 + Date/Time Processing'
      },
      {
        name: 'Voice Agent',
        purpose: 'Speaks availability back to user',
        example: 'Announces "Your 3pm slot is available" in natural voice',
        technology: 'ElevenLabs + Calendar Integration'
      },
      {
        name: 'Meetings Agent',
        purpose: 'Manages end-to-end meeting coordination',
        example: 'Books meeting, sends invites, creates agenda, sets reminders',
        technology: 'Calendar APIs + Workflow Automation'
      },
      {
        name: 'AI Dialer Agent',
        purpose: 'Handles automated calling and scheduling',
        example: 'Calls prospects to schedule meetings when email fails',
        technology: 'Voice AI + Call Automation'
      }
    ]
  },
  {
    id: 'timeline',
    name: 'CRM Timeline + Activity Logging',
    icon: BarChart3,
    color: 'red',
    description: 'Comprehensive activity tracking with AI-powered summaries and insights',
    agents: [
      {
        name: 'Timeline Logger Agent',
        purpose: 'Logs every interaction automatically',
        example: 'Records AI calls, emails, meetings with timestamps',
        technology: 'Supabase + Activity Tracking'
      },
      {
        name: 'Structured Output Agent',
        purpose: 'Creates timeline summaries',
        example: 'Generates "Last 7 days: 3 emails, 2 calls, 1 demo"',
        technology: 'Gemini + Summary Generation'
      },
      {
        name: 'Command Analyzer Agent',
        purpose: 'Processes timeline queries',
        example: 'Understands "Show me Tesla interactions this month"',
        technology: 'GPT-4 + Query Processing'
      }
    ]
  },
  {
    id: 'video-walkthrough',
    name: 'AI Video Walkthrough Generator',
    icon: Video,
    color: 'teal',
    description: 'Automated video tutorial creation with AI narration and branded content',
    agents: [
      {
        name: 'Slide Generator Agent',
        purpose: 'Creates visual tutorial slides',
        example: 'Generates 5-10 slide walkthrough for any CRM process',
        technology: 'GPT-4 + Slide Generation Engine'
      },
      {
        name: 'Voice Output Agent',
        purpose: 'Provides AI narration',
        example: 'Natural voice narration with ElevenLabs synthesis',
        technology: 'ElevenLabs + Script Reading'
      },
      {
        name: 'Timeline Logger Agent',
        purpose: 'Tracks video usage and sharing',
        example: 'Logs which videos were viewed and shared with prospects',
        technology: 'Supabase + Usage Analytics'
      },
      {
        name: 'Command Analyzer Agent',
        purpose: 'Processes video creation requests',
        example: 'Understands "Create walkthrough for uploading contacts"',
        technology: 'GPT-4 + Tutorial Planning'
      }
    ]
  },
  {
    id: 'call-scripts',
    name: 'Call Script Generator',
    icon: Phone,
    color: 'indigo',
    description: 'Dynamic call script generation with objection handling and industry customization',
    agents: [
      {
        name: 'Command Analyzer Agent',
        purpose: 'Processes script generation requests',
        example: 'Understands "Call script for fitness studio in NYC"',
        technology: 'GPT-4 + Industry Analysis'
      },
      {
        name: 'Objection Handler Agent',
        purpose: 'Generates objection responses',
        example: 'Creates responses for price, timing, authority objections',
        technology: 'GPT-4 + Objection Database'
      },
      {
        name: 'Structured Output Agent',
        purpose: 'Formats scripts with sections',
        example: 'Creates Cold Open → Qualification → Pitch → Close structure',
        technology: 'OpenAI + Script Formatting'
      },
      {
        name: 'Voice Output Agent',
        purpose: 'Reads scripts aloud for practice',
        example: 'Natural voice reading of entire call script',
        technology: 'ElevenLabs + Speech Generation'
      }
    ]
  },
  {
    id: 'voice-conversation',
    name: 'Live AI Conversation Agent',
    icon: Mic,
    color: 'pink',
    description: 'Real-time voice conversations with emotion detection and seamless handoffs',
    agents: [
      {
        name: 'Whisper Listener Agent',
        purpose: 'Real-time voice transcription',
        example: 'Continuous listening and accurate speech-to-text',
        technology: 'OpenAI Whisper + Real-time Processing'
      },
      {
        name: 'Command Analyzer Agent',
        purpose: 'Processes spoken commands',
        example: 'Understands natural speech patterns and intent',
        technology: 'GPT-4 + Conversational AI'
      },
      {
        name: 'Voice Output Agent',
        purpose: 'Instant natural voice responses',
        example: 'Replies in natural conversation flow',
        technology: 'ElevenLabs + Low-latency Generation'
      },
      {
        name: 'Timeline Logger Agent',
        purpose: 'Records conversation transcripts',
        example: 'Saves full conversation with timestamps in CRM',
        technology: 'Supabase + Conversation Logging'
      },
      {
        name: 'Emotion Detection Agent',
        purpose: 'Detects customer emotional state',
        example: 'Identifies "frustrated" or "interested" tones',
        technology: 'Gemini + Emotion Recognition'
      },
      {
        name: 'Voice Input Agent',
        purpose: 'Processes and normalizes voice input',
        example: 'Handles various accents and speaking speeds',
        technology: 'Advanced Speech Processing + AI'
      }
    ]
  },
  {
    id: 'persona-builder',
    name: 'AI Persona Builder & Memory',
    icon: UserCheck,
    color: 'amber',
    description: 'Persistent AI memory system that learns user preferences and improves over time',
    agents: [
      {
        name: 'Agent Persona Memory Agent',
        purpose: 'Stores user preferences and patterns',
        example: 'Remembers "This user prefers voice responses"',
        technology: 'Supabase + Memory Management'
      },
      {
        name: 'Command Analyzer Agent',
        purpose: 'Learns from user behavior',
        example: 'Adapts responses based on previous interactions',
        technology: 'GPT-4 + Learning Patterns'
      }
    ]
  },
  {
    id: 'demo-presenter',
    name: 'Demo Presenter (Sales Agent)',
    icon: Presentation,
    color: 'cyan',
    description: 'Complete sales presentation system with live demos and objection handling',
    agents: [
      {
        name: 'Slide Generator Agent',
        purpose: 'Creates custom demo presentations',
        example: 'Builds product demos based on prospect needs',
        technology: 'GPT-4 + Presentation Engine'
      },
      {
        name: 'Voice Output Agent',
        purpose: 'Narrates live demos',
        example: 'Professional voice-over for presentations',
        technology: 'ElevenLabs + Presentation Sync'
      },
      {
        name: 'Command Analyzer Agent',
        purpose: 'Customizes demos based on input',
        example: 'Tailors presentations to industry and use case',
        technology: 'GPT-4 + Demo Customization'
      },
      {
        name: 'Objection Handler Agent',
        purpose: 'Handles demo questions and objections',
        example: 'Addresses concerns during live presentations',
        technology: 'GPT-4 + Real-time Response'
      },
      {
        name: 'Timeline Logger Agent',
        purpose: 'Tracks demo engagement',
        example: 'Records which demos were viewed and shared',
        technology: 'Supabase + Engagement Analytics'
      },
      {
        name: 'Smart Demo Bot Agent',
        purpose: 'Interactive demo guidance and assistance',
        example: 'Guides prospects through product features intelligently',
        technology: 'Conversational AI + Product Knowledge'
      }
    ]
  }
];

const CRMModules = () => {
  const [activeModule, setActiveModule] = useState(crmModules[0]);
  const [selectedAgent, setSelectedAgent] = useState(0);

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'from-blue-500 to-blue-600 border-blue-400/30 bg-blue-500/10',
      green: 'from-green-500 to-green-600 border-green-400/30 bg-green-500/10',
      purple: 'from-purple-500 to-purple-600 border-purple-400/30 bg-purple-500/10',
      orange: 'from-orange-500 to-orange-600 border-orange-400/30 bg-orange-500/10',
      red: 'from-red-500 to-red-600 border-red-400/30 bg-red-500/10',
      teal: 'from-teal-500 to-teal-600 border-teal-400/30 bg-teal-500/10',
      indigo: 'from-indigo-500 to-indigo-600 border-indigo-400/30 bg-indigo-500/10',
      pink: 'from-pink-500 to-pink-600 border-pink-400/30 bg-pink-500/10',
      amber: 'from-amber-500 to-amber-600 border-amber-400/30 bg-amber-500/10',
      cyan: 'from-cyan-500 to-cyan-600 border-cyan-400/30 bg-cyan-500/10'
    };
    return colors[color as keyof typeof colors];
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Intro Section */}
      <div className="text-center mb-16">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="relative">
            <Bot className="h-10 w-10 text-blue-400" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
          </div>
          <span className="text-2xl font-bold text-white">SmartCRM Multi-Agent System</span>
          <Network className="h-8 w-8 text-purple-400" />
        </div>
        <h2 className="text-4xl font-bold text-white mb-6">
          AI-Powered Sales Ecosystem
        </h2>
        <p className="text-xl text-gray-300 max-w-4xl mx-auto mb-8">
          SmartCRM isn't just a CRM – it's an AI-powered sales ecosystem where specialized agents work behind the scenes 
          to do the thinking, writing, speaking, scheduling, and closing for you. Each module contains a team of AI agents 
          working together to automate your entire sales process.
        </p>
        
        <div className="grid md:grid-cols-5 gap-6 mt-12">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400 mb-2">47+</div>
            <div className="text-gray-300">AI Agents</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">10</div>
            <div className="text-gray-300">Core Modules</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-400 mb-2">100%</div>
            <div className="text-gray-300">Automated</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-400 mb-2">24/7</div>
            <div className="text-gray-300">Active</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-400 mb-2">0</div>
            <div className="text-gray-300">Code Required</div>
          </div>
        </div>
      </div>

      {/* Module Network Grid with Visual Connections */}
      <div className="relative mb-16">
        {/* Background Connection Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>
          <div className="absolute top-0 bottom-0 left-1/2 w-px bg-gradient-to-b from-transparent via-purple-500 to-transparent"></div>
        </div>

        <div className="relative grid md:grid-cols-2 lg:grid-cols-5 gap-6">
          {crmModules.map((module, index) => {
            const IconComponent = module.icon;
            const isActive = activeModule.id === module.id;
            
            return (
              <div key={module.id} className="relative">
                <button
                  onClick={() => {
                    setActiveModule(module);
                    setSelectedAgent(0);
                  }}
                  className={`w-full p-6 rounded-xl border transition-all duration-300 transform hover:scale-105 text-left relative overflow-hidden ${
                    isActive 
                      ? `${getColorClasses(module.color)} shadow-lg shadow-${module.color}-500/20` 
                      : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600/50'
                  }`}
                >
                  {/* Connection Nodes */}
                  {isActive && (
                    <>
                      <div className="absolute top-2 left-2 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                      <div className="absolute top-2 right-2 w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                      <div className="absolute bottom-2 left-2 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <div className="absolute bottom-2 right-2 w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                    </>
                  )}

                  <div className="relative z-10">
                    <div className={`p-3 rounded-lg bg-gradient-to-r ${getColorClasses(module.color).split(' ')[0]} ${getColorClasses(module.color).split(' ')[1]} mb-4 relative`}>
                      <IconComponent className="h-6 w-6 text-white" />
                      {isActive && (
                        <div className="absolute -inset-1 bg-white/20 rounded-lg blur animate-pulse"></div>
                      )}
                    </div>
                    <h3 className="font-semibold text-white mb-2 text-sm leading-tight">{module.name}</h3>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-400">{module.agents.length} agents</p>
                      {isActive && (
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="text-xs text-green-400">Active</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Animated Background for Active Module */}
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-blue-600/5 rounded-xl animate-pulse"></div>
                  )}
                </button>

                {/* Connection Lines to Adjacent Modules */}
                {index < crmModules.length - 1 && index % 5 !== 4 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                    <div className="w-6 h-px bg-gradient-to-r from-gray-600/50 to-transparent"></div>
                    <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
                      <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
                    </div>
                  </div>
                )}

                {/* Vertical Connection Lines */}
                {index < crmModules.length - 5 && (
                  <div className="hidden lg:block absolute -bottom-3 left-1/2 transform -translate-x-1/2">
                    <div className="h-6 w-px bg-gradient-to-b from-gray-600/50 to-transparent"></div>
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
                      <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Central Hub Indicator */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute inset-2 bg-white rounded-full opacity-30"></div>
        </div>
      </div>

      {/* Active Module Details */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Module Info & Agent List */}
        <div className="lg:col-span-2">
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8 relative overflow-hidden">
            {/* Connection Pattern Background */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0" style={{
                backgroundImage: `radial-gradient(circle at 25% 25%, ${activeModule.color === 'blue' ? '#3b82f6' : activeModule.color === 'green' ? '#10b981' : activeModule.color === 'purple' ? '#8b5cf6' : '#f59e0b'} 1px, transparent 1px)`,
                backgroundSize: '20px 20px'
              }}></div>
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-8">
                <div className={`p-4 rounded-xl bg-gradient-to-r ${getColorClasses(activeModule.color)} relative`}>
                  <activeModule.icon className="h-8 w-8 text-white" />
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur animate-pulse"></div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-2xl font-bold text-white">{activeModule.name}</h3>
                    <GitBranch className="h-5 w-5 text-blue-400" />
                  </div>
                  <p className="text-gray-300">{activeModule.description}</p>
                </div>
              </div>

              <div className="space-y-4">
                {activeModule.agents.map((agent, index) => (
                  <div key={index} className="relative">
                    <div
                      onClick={() => setSelectedAgent(index)}
                      className={`p-6 rounded-xl border cursor-pointer transition-all duration-300 hover:border-blue-500/30 relative overflow-hidden ${
                        selectedAgent === index
                          ? 'bg-blue-500/10 border-blue-400/30'
                          : 'bg-slate-700/30 border-slate-600/30'
                      }`}
                    >
                      {/* Agent Connection Indicator */}
                      <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1">
                        <div className={`w-2 h-2 rounded-full ${
                          selectedAgent === index ? 'bg-blue-400 animate-pulse' : 'bg-gray-600'
                        }`}></div>
                      </div>

                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Bot className="h-5 w-5 text-blue-400" />
                          <h4 className="font-semibold text-white text-lg">{agent.name}</h4>
                        </div>
                        {selectedAgent === index && (
                          <div className="flex items-center gap-2">
                            <ArrowRight className="h-5 w-5 text-blue-400" />
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          </div>
                        )}
                      </div>
                      
                      <p className="text-blue-400 font-medium mb-2">{agent.purpose}</p>
                      <p className="text-gray-300 text-sm mb-3">{agent.example}</p>
                      
                      <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4 text-gray-400" />
                        <span className="text-xs text-gray-400">{agent.technology}</span>
                      </div>

                      {/* Agent Flow Line */}
                      {index < activeModule.agents.length - 1 && (
                        <div className="absolute -bottom-2 left-6 w-px h-4 bg-gradient-to-b from-blue-500/50 to-transparent"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Selected Agent Detail Panel */}
        <div className="lg:col-span-1">
          <div className="sticky top-8">
            <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 relative overflow-hidden">
              {/* Connection Visualization */}
              <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
                <Workflow className="w-full h-full text-blue-400" />
              </div>

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 relative">
                    <Bot className="h-6 w-6 text-white" />
                    <div className="absolute -inset-1 bg-white/20 rounded-lg animate-pulse"></div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">{activeModule.agents[selectedAgent]?.name}</h4>
                    <p className="text-sm text-gray-400">{activeModule.name}</p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="bg-slate-700/50 rounded-lg p-4 border-l-4 border-blue-500">
                    <div className="text-sm font-medium text-blue-400 mb-2">Primary Function</div>
                    <div className="text-sm text-gray-300">{activeModule.agents[selectedAgent]?.purpose}</div>
                  </div>

                  <div className="bg-slate-700/50 rounded-lg p-4 border-l-4 border-purple-500">
                    <div className="text-sm font-medium text-purple-400 mb-2">Real-World Example</div>
                    <div className="text-sm text-gray-300">{activeModule.agents[selectedAgent]?.example}</div>
                  </div>

                  <div className="bg-slate-700/50 rounded-lg p-4 border-l-4 border-green-500">
                    <div className="text-sm font-medium text-green-400 mb-2">Technology Stack</div>
                    <div className="text-sm text-gray-300">{activeModule.agents[selectedAgent]?.technology}</div>
                  </div>

                  <div className="bg-slate-700/50 rounded-lg p-4 border-l-4 border-orange-500">
                    <div className="text-sm font-medium text-orange-400 mb-3">Agent Network Status</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-xs text-green-300">Connected</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <span className="text-xs text-blue-300">Ready</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                        <span className="text-xs text-purple-300">Learning</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                        <span className="text-xs text-orange-300">Synced</span>
                      </div>
                    </div>
                  </div>
                </div>

                <button className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold transition-all duration-300 transform hover:scale-105 relative overflow-hidden">
                  <span className="flex items-center justify-center gap-2 relative z-10">
                    <Zap className="h-4 w-4" />
                    Activate Agent Network
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 animate-pulse"></div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Result Summary with Flow Connections */}
      <div className="mt-20 bg-gradient-to-r from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8 relative overflow-hidden">
        {/* Background Network Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, #3b82f6 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        <div className="relative z-10">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Network className="h-8 w-8 text-blue-400" />
              <h3 className="text-3xl font-bold text-white">The Result: Complete Sales Automation</h3>
              <Workflow className="h-8 w-8 text-purple-400" />
            </div>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Watch how all AI agents work together in perfect harmony to create an unstoppable sales machine
            </p>
          </div>
          
          <div className="relative grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Flow Connections */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 via-purple-500/30 via-green-500/30 to-transparent transform -translate-y-1/2"></div>
            
            {[
              {
                icon: Brain,
                title: 'Understand',
                description: 'AI agents understand you and your prospects through natural language processing',
                color: 'blue',
                step: '01'
              },
              {
                icon: Zap,
                title: 'Take Action',
                description: 'Execute intelligent actions inside your CRM automatically',
                color: 'purple',
                step: '02'
              },
              {
                icon: Volume2,
                title: 'Communicate',
                description: 'Talk like a real sales assistant with natural voice and emotion',
                color: 'green',
                step: '03'
              },
              {
                icon: Star,
                title: 'Learn & Improve',
                description: 'Get better every time you use it with persistent memory',
                color: 'orange',
                step: '04'
              }
            ].map((step, index) => {
              const IconComponent = step.icon;
              return (
                <div key={index} className="relative text-center">
                  {/* Connection Node */}
                  <div className="absolute top-1/2 -left-2 w-4 h-4 bg-slate-800 border-2 border-blue-400 rounded-full transform -translate-y-1/2 z-10"></div>
                  
                  <div className="bg-slate-700/30 rounded-xl p-6 border border-slate-600/30 hover:border-blue-500/30 transition-all duration-300 transform hover:scale-105 relative overflow-hidden">
                    {/* Step Number */}
                    <div className="absolute top-2 right-2 text-2xl font-bold text-slate-600/50">
                      {step.step}
                    </div>

                    <div className={`w-16 h-16 bg-gradient-to-r from-${step.color}-500 to-${step.color}-600 rounded-full flex items-center justify-center mx-auto mb-4 relative`}>
                      <IconComponent className="h-8 w-8 text-white" />
                      <div className="absolute -inset-1 bg-white/20 rounded-full animate-pulse"></div>
                    </div>
                    <div className="text-white font-medium mb-2">{step.title}</div>
                    <div className="text-sm text-gray-400">{step.description}</div>

                    {/* Flowing Arrow */}
                    {index < 3 && (
                      <div className="hidden lg:block absolute top-1/2 -right-6 transform -translate-y-1/2">
                        <ArrowRight className="h-6 w-6 text-blue-400 animate-pulse" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-12 text-center">
            <p className="text-xl text-gray-300 mb-6">
              This is <strong className="text-white">no-code, AI-powered sales execution</strong> using a plug-and-play modular agent system.
            </p>
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-xl px-8 py-4">
              <PlayCircle className="h-6 w-6 text-blue-400" />
              <span className="text-white font-medium text-lg">Ready to deploy in your CRM</span>
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CRMModules;