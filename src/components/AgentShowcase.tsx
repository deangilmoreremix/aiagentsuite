import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Phone, 
  User, 
  Workflow, 
  Volume2, 
  Calendar, 
  Shield, 
  RotateCcw,
  ArrowRight,
  Mail,
  Target,
  Database,
  Presentation,
  MessageCircle,
  Send,
  Heart,
  Zap,
  Star,
  TrendingUp,
  Users,
  Smartphone,
  Trophy,
  Brain,
  Mic,
  Play,
  Pause,
  Activity,
  Network,
  GitBranch,
  Settings,
  Eye,
  Clock,
  CheckCircle,
  ExternalLink,
  AlertTriangle,
  BarChart3,
  DollarSign,
  FileText,
  Lightbulb,
  Sparkles,
  Award,
  Globe,
  Link,
  PlusCircle,
  MinusCircle,
  RefreshCw,
  Monitor,
  Layers,
  Command
} from 'lucide-react';
import { executeAgentWithTools } from '../agents/useOpenAIAgentSuite';
import ModeToggle from './ModeToggle';

interface TaskStep {
  id: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  result?: string;
  duration?: number;
  businessImpact?: string;
  dataCreated?: any;
  crmChanges?: string[];
  metricsImpact?: {
    revenue?: number;
    timeSaved?: number;
    efficiency?: number;
    contacts?: number;
  };
}

interface AgentExecution {
  agentId: string;
  isRunning: boolean;
  currentStep: number;
  steps: TaskStep[];
  startTime?: Date;
  completionTime?: Date;
  businessMetrics: {
    revenue: number;
    timeSaved: number;
    tasksCompleted: number;
    dataProcessed: number;
    contactsCreated: number;
    emailsSent: number;
    meetingsScheduled: number;
    dealsClosed: number;
  };
  crmSnapshot: {
    before: any;
    after: any;
    changes: string[];
  };
}

interface LiveMetrics {
  totalRevenue: number;
  totalTimeSaved: number;
  totalTasks: number;
  activeAgents: number;
  totalContacts: number;
  totalEmails: number;
  totalMeetings: number;
  successRate: number;
}

const specializedAgents = [
  {
    id: 'sdr',
    name: 'AI SDR Agent',
    icon: User,
    color: 'blue',
    description: 'Generates & sends cold outreach with follow-ups',
    demo: 'Analyzing 500 leads, crafting personalized outreach...',
    metrics: { sent: 247, opened: 89, replied: 23 },
    category: 'Sales',
    tools: ['gmail', 'linkedin', 'hubspot'],
    realDemo: 'Create personalized cold email campaign for SaaS prospects',
    taskSteps: [
      {
        id: 'lead-research',
        description: 'Researching ideal customer profile and finding qualified prospects',
        businessImpact: 'Identified 47 high-value prospects matching your ICP',
        crmChanges: ['Added 47 new prospects to CRM', 'Tagged prospects by industry and size'],
        metricsImpact: { contacts: 47, revenue: 15000 }
      },
      {
        id: 'email-personalization',
        description: 'Creating personalized email templates with dynamic content',
        businessImpact: 'Generated 47 unique emails with 95% personalization score',
        crmChanges: ['Created email templates', 'Added personalization tokens'],
        metricsImpact: { timeSaved: 8, efficiency: 90 }
      },
      {
        id: 'sequence-deployment',
        description: 'Deploying 5-touch email sequence with smart timing',
        businessImpact: 'Launched automated sequence reaching 47 prospects over 14 days',
        crmChanges: ['Enrolled prospects in sequence', 'Set up automated follow-ups'],
        metricsImpact: { emailsSent: 235, efficiency: 300 }
      },
      {
        id: 'engagement-tracking',
        description: 'Monitoring opens, clicks, and replies with real-time alerts',
        businessImpact: 'Achieved 34% open rate, 12% click rate, 8% reply rate',
        crmChanges: ['Updated engagement scores', 'Triggered hot lead alerts'],
        metricsImpact: { revenue: 25000, efficiency: 150 }
      },
      {
        id: 'lead-qualification',
        description: 'Qualifying responding prospects and booking discovery calls',
        businessImpact: 'Qualified 12 hot prospects and scheduled 8 discovery calls',
        crmChanges: ['Updated lead status to qualified', 'Scheduled discovery meetings'],
        metricsImpact: { meetingsScheduled: 8, revenue: 40000 }
      }
    ]
  },
  {
    id: 'dialer',
    name: 'AI Dialer Agent',
    icon: Phone,
    color: 'green',
    description: 'Initiates call workflows and syncs transcripts',
    demo: 'Dialing prospects and updating CRM with call outcomes...',
    metrics: { calls: 45, connected: 32, scheduled: 8 },
    category: 'Sales',
    tools: ['twilio', 'zoom', 'google_calendar'],
    realDemo: 'Execute calling campaign with automatic CRM updates',
    taskSteps: [
      {
        id: 'call-list-prep',
        description: 'Preparing prioritized call list based on lead scores and timing',
        businessImpact: 'Organized 35 hot prospects for optimal calling sequence',
        crmChanges: ['Created call queue', 'Prioritized by lead score'],
        metricsImpact: { contacts: 35, timeSaved: 2 }
      },
      {
        id: 'automated-dialing',
        description: 'Making automated calls with natural conversation detection',
        businessImpact: 'Connected with 28 prospects, 80% connection rate',
        crmChanges: ['Logged call attempts', 'Updated contact preferences'],
        metricsImpact: { timeSaved: 12, efficiency: 400 }
      },
      {
        id: 'conversation-analysis',
        description: 'Analyzing conversations for buying signals and objections',
        businessImpact: 'Detected 15 buying signals and 8 objections to address',
        crmChanges: ['Added conversation notes', 'Tagged buying signals'],
        metricsImpact: { efficiency: 200, revenue: 18000 }
      },
      {
        id: 'meeting-booking',
        description: 'Booking qualified meetings directly during calls',
        businessImpact: 'Scheduled 12 demos and 6 strategy calls on-the-spot',
        crmChanges: ['Created calendar events', 'Updated deal stages'],
        metricsImpact: { meetingsScheduled: 18, revenue: 75000 }
      },
      {
        id: 'follow-up-automation',
        description: 'Setting up automated follow-up sequences for all call outcomes',
        businessImpact: 'Configured custom follow-ups for 28 contacts based on call results',
        crmChanges: ['Enrolled in follow-up sequences', 'Set callback reminders'],
        metricsImpact: { efficiency: 300, timeSaved: 5 }
      }
    ]
  },
  {
    id: 'ae',
    name: 'AI AE Agent',
    icon: Presentation,
    color: 'purple',
    description: 'Personalized product demos & live proposal generation',
    demo: 'Creating custom demo environment and pricing proposals...',
    metrics: { demos: 12, proposals: 8, closed: 3 },
    category: 'Sales',
    tools: ['zoom', 'google_sheets', 'stripe'],
    realDemo: 'Generate enterprise demo and close deals with AI',
    taskSteps: [
      {
        id: 'demo-customization',
        description: 'Building personalized demo environment with prospect data',
        businessImpact: 'Created custom demo showcasing prospect\'s exact use case',
        crmChanges: ['Built demo environment', 'Added prospect branding'],
        metricsImpact: { timeSaved: 6, efficiency: 250 }
      },
      {
        id: 'needs-analysis',
        description: 'Conducting AI-powered needs assessment and gap analysis',
        businessImpact: 'Identified 5 critical pain points and 3 high-value opportunities',
        crmChanges: ['Documented pain points', 'Created solution mapping'],
        metricsImpact: { efficiency: 300, revenue: 25000 }
      },
      {
        id: 'live-demonstration',
        description: 'Delivering interactive product demo with real-time adaptation',
        businessImpact: 'Demonstrated $2.3M annual ROI with interactive calculator',
        crmChanges: ['Logged demo engagement', 'Updated interest scores'],
        metricsImpact: { revenue: 150000, efficiency: 400 }
      },
      {
        id: 'proposal-generation',
        description: 'Creating detailed proposal with custom pricing and terms',
        businessImpact: 'Generated $500k proposal with enterprise terms in 15 minutes',
        crmChanges: ['Created proposal record', 'Updated opportunity value'],
        metricsImpact: { revenue: 500000, timeSaved: 10 }
      },
      {
        id: 'objection-handling',
        description: 'Addressing concerns with AI-powered objection responses',
        businessImpact: 'Resolved all 4 objections with ROI data and case studies',
        crmChanges: ['Logged objections and responses', 'Updated close probability'],
        metricsImpact: { dealsClosed: 1, revenue: 500000 }
      }
    ]
  },
  {
    id: 'journeys',
    name: 'AI Journeys Agent',
    icon: Workflow,
    color: 'orange',
    description: 'Multi-step drip campaigns across platforms',
    demo: 'Orchestrating cross-platform nurture campaigns...',
    metrics: { sequences: 156, completed: 89, converted: 34 },
    category: 'Marketing',
    tools: ['gmail', 'slack', 'whatsapp_business'],
    realDemo: 'Deploy omnichannel nurture campaigns',
    taskSteps: [
      {
        id: 'journey-design',
        description: 'Designing intelligent customer journey maps across channels',
        businessImpact: 'Created 8-touch journey across email, SMS, and social',
        crmChanges: ['Built journey workflow', 'Set up channel integrations'],
        metricsImpact: { timeSaved: 15, efficiency: 500 }
      },
      {
        id: 'audience-segmentation',
        description: 'Segmenting audience based on behavior and preferences',
        businessImpact: 'Segmented 1,200 leads into 8 high-converting groups',
        crmChanges: ['Created audience segments', 'Applied behavioral tags'],
        metricsImpact: { contacts: 1200, efficiency: 200 }
      },
      {
        id: 'content-creation',
        description: 'Generating personalized content for each touchpoint',
        businessImpact: 'Created 64 pieces of personalized content (8 touches × 8 segments)',
        crmChanges: ['Stored content templates', 'Set personalization rules'],
        metricsImpact: { timeSaved: 40, efficiency: 800 }
      },
      {
        id: 'campaign-deployment',
        description: 'Launching synchronized campaigns across all channels',
        businessImpact: 'Deployed to 1,200 contacts with optimal timing',
        crmChanges: ['Enrolled contacts in journeys', 'Activated campaigns'],
        metricsImpact: { emailsSent: 9600, efficiency: 600 }
      },
      {
        id: 'performance-optimization',
        description: 'Real-time optimization based on engagement data',
        businessImpact: 'Achieved 52% engagement rate and 28% conversion to opportunity',
        crmChanges: ['Updated engagement scores', 'Optimized send times'],
        metricsImpact: { revenue: 180000, efficiency: 400 }
      }
    ]
  },
  {
    id: 'voice',
    name: 'Voice Agent',
    icon: Volume2,
    color: 'red',
    description: 'Converts content to natural speech with ElevenLabs',
    demo: 'Converting sales content to engaging voice presentations...',
    metrics: { generated: 234, played: 189, engagement: '94%' },
    category: 'Communication',
    tools: ['elevenlabs', 'zoom', 'slack'],
    realDemo: 'Create voice-powered sales presentations',
    taskSteps: [
      {
        id: 'content-analysis',
        description: 'Analyzing written content for voice optimization',
        businessImpact: 'Processed 25 sales documents for voice conversion',
        crmChanges: ['Catalogued voice-ready content', 'Added content tags'],
        metricsImpact: { timeSaved: 5, efficiency: 150 }
      },
      {
        id: 'voice-generation',
        description: 'Converting text to natural, professional speech',
        businessImpact: 'Generated 2 hours of high-quality voice content',
        crmChanges: ['Stored voice assets', 'Tagged by use case'],
        metricsImpact: { timeSaved: 20, efficiency: 400 }
      },
      {
        id: 'presentation-enhancement',
        description: 'Adding voice narration to sales presentations',
        businessImpact: 'Enhanced 12 presentations with professional voice-over',
        crmChanges: ['Updated presentation library', 'Added voice versions'],
        metricsImpact: { efficiency: 300, revenue: 35000 }
      },
      {
        id: 'personalized-messages',
        description: 'Creating personalized voice messages for key prospects',
        businessImpact: 'Generated 45 personalized voice messages for enterprise prospects',
        crmChanges: ['Added voice messages to prospect records', 'Set delivery schedules'],
        metricsImpact: { contacts: 45, revenue: 85000 }
      },
      {
        id: 'engagement-tracking',
        description: 'Tracking voice content engagement and effectiveness',
        businessImpact: 'Achieved 94% completion rate and 67% positive response',
        crmChanges: ['Updated engagement metrics', 'Tagged high-performers'],
        metricsImpact: { efficiency: 250, revenue: 125000 }
      }
    ]
  },
  {
    id: 'meetings',
    name: 'Meetings Agent',
    icon: Calendar,
    color: 'teal',
    description: 'Books meetings using Google Calendar + Zoom',
    demo: 'Coordinating complex meeting schedules across time zones...',
    metrics: { scheduled: 67, confirmed: 59, completed: 52 },
    category: 'Scheduling',
    tools: ['google_calendar', 'zoom', 'calendly'],
    realDemo: 'Automate enterprise meeting coordination',
    taskSteps: [
      {
        id: 'availability-analysis',
        description: 'Analyzing availability across multiple calendars and time zones',
        businessImpact: 'Found optimal slots for 45 complex multi-party meetings',
        crmChanges: ['Synced calendar availability', 'Set timezone preferences'],
        metricsImpact: { timeSaved: 12, efficiency: 600 }
      },
      {
        id: 'intelligent-scheduling',
        description: 'Booking meetings with automatic conflict resolution',
        businessImpact: 'Scheduled 45 meetings with zero conflicts or reschedules',
        crmChanges: ['Created calendar events', 'Added meeting details'],
        metricsImpact: { meetingsScheduled: 45, timeSaved: 18 }
      },
      {
        id: 'meeting-preparation',
        description: 'Preparing agendas and materials for each meeting',
        businessImpact: 'Generated custom agendas and prep materials for all meetings',
        crmChanges: ['Added meeting agendas', 'Attached relevant documents'],
        metricsImpact: { efficiency: 400, timeSaved: 15 }
      },
      {
        id: 'automated-reminders',
        description: 'Setting up intelligent reminder sequences',
        businessImpact: 'Configured multi-channel reminders reducing no-shows by 85%',
        crmChanges: ['Set up reminder workflows', 'Added notification preferences'],
        metricsImpact: { efficiency: 300, meetingsScheduled: 45 }
      },
      {
        id: 'post-meeting-followup',
        description: 'Automating post-meeting actions and follow-ups',
        businessImpact: 'Generated meeting summaries and follow-up tasks for all attendees',
        crmChanges: ['Created meeting summaries', 'Added follow-up tasks'],
        metricsImpact: { efficiency: 250, timeSaved: 10 }
      }
    ]
  }
  // Add more agents with similar detailed structures...
];

const AgentShowcase = () => {
  const [activeAgent, setActiveAgent] = useState(specializedAgents[0]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'execution' | 'metrics'>('grid');
  const [realMode, setRealMode] = useState(false);
  const [agentExecutions, setAgentExecutions] = useState<Record<string, AgentExecution>>({});
  const [globalMetrics, setGlobalMetrics] = useState<LiveMetrics>({
    totalRevenue: 0,
    totalTimeSaved: 0,
    totalTasks: 0,
    activeAgents: 0,
    totalContacts: 0,
    totalEmails: 0,
    totalMeetings: 0,
    successRate: 98.5
  });
  const [simulatedCRM, setSimulatedCRM] = useState({
    contacts: 1247,
    deals: 89,
    emails: 12439,
    meetings: 387,
    revenue: 2340000
  });

  const categories = ['All', 'Sales', 'Marketing', 'Communication', 'Scheduling', 'Analytics', 'Data'];
  
  const filteredAgents = selectedCategory === 'All' 
    ? specializedAgents 
    : specializedAgents.filter(agent => agent.category === selectedCategory);

  // Update global metrics when agents execute
  useEffect(() => {
    const metrics = Object.values(agentExecutions).reduce((acc, execution) => ({
      totalRevenue: acc.totalRevenue + execution.businessMetrics.revenue,
      totalTimeSaved: acc.totalTimeSaved + execution.businessMetrics.timeSaved,
      totalTasks: acc.totalTasks + execution.businessMetrics.tasksCompleted,
      activeAgents: acc.activeAgents + (execution.isRunning ? 1 : 0),
      totalContacts: acc.totalContacts + execution.businessMetrics.contactsCreated,
      totalEmails: acc.totalEmails + execution.businessMetrics.emailsSent,
      totalMeetings: acc.totalMeetings + execution.businessMetrics.meetingsScheduled,
      successRate: 98.5 + (acc.totalTasks * 0.1)
    }), { 
      totalRevenue: 0, 
      totalTimeSaved: 0, 
      totalTasks: 0, 
      activeAgents: 0,
      totalContacts: 0,
      totalEmails: 0,
      totalMeetings: 0,
      successRate: 98.5
    });

    setGlobalMetrics(metrics);
  }, [agentExecutions]);

  // Simulate CRM updates
  useEffect(() => {
    if (Object.values(agentExecutions).some(e => e.isRunning)) {
      const interval = setInterval(() => {
        setSimulatedCRM(prev => ({
          contacts: prev.contacts + Math.floor(Math.random() * 3),
          deals: prev.deals + Math.floor(Math.random() * 2),
          emails: prev.emails + Math.floor(Math.random() * 25) + 10,
          meetings: prev.meetings + Math.floor(Math.random() * 2),
          revenue: prev.revenue + Math.floor(Math.random() * 15000) + 5000
        }));
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [agentExecutions]);

  const executeAgent = async (agent: any) => {
    const agentId = agent.id;
    
    // Initialize execution state
    const execution: AgentExecution = {
      agentId,
      isRunning: true,
      currentStep: 0,
      steps: agent.taskSteps.map((step: any) => ({ ...step, status: 'pending' })),
      startTime: new Date(),
      businessMetrics: { 
        revenue: 0, 
        timeSaved: 0, 
        tasksCompleted: 0, 
        dataProcessed: 0,
        contactsCreated: 0,
        emailsSent: 0,
        meetingsScheduled: 0,
        dealsClosed: 0
      },
      crmSnapshot: {
        before: { ...simulatedCRM },
        after: { ...simulatedCRM },
        changes: []
      }
    };

    setAgentExecutions(prev => ({ ...prev, [agentId]: execution }));

    // Execute each step with realistic business impact
    for (let i = 0; i < agent.taskSteps.length; i++) {
      const step = agent.taskSteps[i];
      
      // Update current step and set to running
      setAgentExecutions(prev => ({
        ...prev,
        [agentId]: {
          ...prev[agentId],
          currentStep: i,
          steps: prev[agentId].steps.map((s, index) => 
            index === i ? { ...s, status: 'running' } : s
          )
        }
      }));

      // Simulate realistic execution time
      const executionTime = Math.random() * 4000 + 2000;
      await new Promise(resolve => setTimeout(resolve, executionTime));

      // Complete the step with business metrics
      setAgentExecutions(prev => ({
        ...prev,
        [agentId]: {
          ...prev[agentId],
          steps: prev[agentId].steps.map((s, index) => 
            index === i ? { 
              ...s, 
              status: 'completed', 
              result: step.businessImpact,
              duration: executionTime 
            } : s
          ),
          businessMetrics: {
            ...prev[agentId].businessMetrics,
            revenue: prev[agentId].businessMetrics.revenue + (step.metricsImpact?.revenue || 0),
            timeSaved: prev[agentId].businessMetrics.timeSaved + (step.metricsImpact?.timeSaved || 0),
            tasksCompleted: prev[agentId].businessMetrics.tasksCompleted + 1,
            dataProcessed: prev[agentId].businessMetrics.dataProcessed + Math.floor(Math.random() * 100) + 20,
            contactsCreated: prev[agentId].businessMetrics.contactsCreated + (step.metricsImpact?.contacts || 0),
            emailsSent: prev[agentId].businessMetrics.emailsSent + (step.metricsImpact?.emailsSent || 0),
            meetingsScheduled: prev[agentId].businessMetrics.meetingsScheduled + (step.metricsImpact?.meetingsScheduled || 0),
            dealsClosed: prev[agentId].businessMetrics.dealsClosed + (step.metricsImpact?.dealsClosed || 0)
          },
          crmSnapshot: {
            ...prev[agentId].crmSnapshot,
            changes: [...prev[agentId].crmSnapshot.changes, ...(step.crmChanges || [])]
          }
        }
      }));
    }

    // Mark execution as complete
    setAgentExecutions(prev => ({
      ...prev,
      [agentId]: {
        ...prev[agentId],
        isRunning: false,
        completionTime: new Date()
      }
    }));
  };

  const executeAllAgents = async () => {
    const topAgents = filteredAgents.slice(0, 6);
    for (const agent of topAgents) {
      // Stagger the execution
      setTimeout(() => executeAgent(agent), Math.random() * 2000);
    }
  };

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'from-blue-500 to-blue-600 border-blue-400/30 bg-blue-500/10',
      green: 'from-green-500 to-green-600 border-green-400/30 bg-green-500/10',
      purple: 'from-purple-500 to-purple-600 border-purple-400/30 bg-purple-500/10',
      orange: 'from-orange-500 to-orange-600 border-orange-400/30 bg-orange-500/10',
      red: 'from-red-500 to-red-600 border-red-400/30 bg-red-500/10',
      teal: 'from-teal-500 to-teal-600 border-teal-400/30 bg-teal-500/10'
    };
    return colors[color as keyof typeof colors];
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-5xl font-bold text-white mb-6">
          Watch 15+ AI Agents Execute Real Business Tasks
        </h2>
        <p className="text-xl text-gray-300 max-w-4xl mx-auto mb-8">
          See every specialized agent complete step-by-step workflows that generate measurable business value. 
          Each execution shows live CRM updates, revenue impact, and efficiency gains in real-time.
        </p>

        {/* Enhanced Global Metrics Dashboard */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-700/50 p-8 mb-8 relative overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 20% 20%, #3b82f6 1px, transparent 1px)',
              backgroundSize: '40px 40px'
            }}></div>
          </div>

          <div className="relative z-10">
            <div className="flex items-center justify-center gap-4 mb-8">
              <Network className="h-10 w-10 text-blue-400" />
              <h3 className="text-3xl font-bold text-white">Live Agent Performance Center</h3>
              <Activity className="h-8 w-8 text-green-400 animate-pulse" />
            </div>

            {/* Primary Metrics */}
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              <div className="text-center p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-400/30 rounded-2xl">
                <div className="text-4xl font-bold text-green-400 mb-3">${globalMetrics.totalRevenue.toLocaleString()}</div>
                <div className="text-gray-300 font-semibold text-lg">Revenue Generated</div>
                <div className="text-sm text-gray-400">By AI agents in this session</div>
                <div className="mt-3 flex items-center justify-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-400" />
                  <span className="text-green-400 text-sm">+{Math.round(globalMetrics.totalRevenue / 1000)}% ROI</span>
                </div>
              </div>
              
              <div className="text-center p-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-400/30 rounded-2xl">
                <div className="text-4xl font-bold text-blue-400 mb-3">{globalMetrics.totalTimeSaved}h</div>
                <div className="text-gray-300 font-semibold text-lg">Time Saved</div>
                <div className="text-sm text-gray-400">Human hours automated</div>
                <div className="mt-3 flex items-center justify-center gap-2">
                  <Clock className="h-4 w-4 text-blue-400" />
                  <span className="text-blue-400 text-sm">≈ ${(globalMetrics.totalTimeSaved * 75).toLocaleString()} value</span>
                </div>
              </div>
              
              <div className="text-center p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-400/30 rounded-2xl">
                <div className="text-4xl font-bold text-purple-400 mb-3 flex items-center justify-center gap-3">
                  {globalMetrics.activeAgents}
                  {globalMetrics.activeAgents > 0 && <Activity className="h-8 w-8 animate-pulse" />}
                </div>
                <div className="text-gray-300 font-semibold text-lg">Active Agents</div>
                <div className="text-sm text-gray-400">Currently executing tasks</div>
                <div className="mt-3 flex items-center justify-center gap-2">
                  <Bot className="h-4 w-4 text-purple-400" />
                  <span className="text-purple-400 text-sm">{globalMetrics.successRate.toFixed(1)}% success rate</span>
                </div>
              </div>
              
              <div className="text-center p-6 bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-400/30 rounded-2xl">
                <div className="text-4xl font-bold text-orange-400 mb-3">{globalMetrics.totalTasks}</div>
                <div className="text-gray-300 font-semibold text-lg">Tasks Completed</div>
                <div className="text-sm text-gray-400">Business workflows automated</div>
                <div className="mt-3 flex items-center justify-center gap-2">
                  <CheckCircle className="h-4 w-4 text-orange-400" />
                  <span className="text-orange-400 text-sm">100% automation rate</span>
                </div>
              </div>
            </div>

            {/* Secondary Metrics */}
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-slate-700/30 rounded-xl border border-slate-600/30">
                <div className="text-2xl font-bold text-cyan-400">{simulatedCRM.contacts.toLocaleString()}</div>
                <div className="text-sm text-gray-300">CRM Contacts</div>
                <div className="text-xs text-cyan-400">+{globalMetrics.totalContacts} today</div>
              </div>
              <div className="text-center p-4 bg-slate-700/30 rounded-xl border border-slate-600/30">
                <div className="text-2xl font-bold text-emerald-400">{simulatedCRM.emails.toLocaleString()}</div>
                <div className="text-sm text-gray-300">Emails Sent</div>
                <div className="text-xs text-emerald-400">+{globalMetrics.totalEmails} by AI</div>
              </div>
              <div className="text-center p-4 bg-slate-700/30 rounded-xl border border-slate-600/30">
                <div className="text-2xl font-bold text-violet-400">{simulatedCRM.meetings}</div>
                <div className="text-sm text-gray-300">Meetings Booked</div>
                <div className="text-xs text-violet-400">+{globalMetrics.totalMeetings} scheduled</div>
              </div>
              <div className="text-center p-4 bg-slate-700/30 rounded-xl border border-slate-600/30">
                <div className="text-2xl font-bold text-rose-400">{simulatedCRM.deals}</div>
                <div className="text-sm text-gray-300">Active Deals</div>
                <div className="text-xs text-rose-400">${(simulatedCRM.revenue/1000000).toFixed(1)}M pipeline</div>
              </div>
            </div>

            {/* Live Activity Indicator */}
            {globalMetrics.activeAgents > 0 && (
              <div className="mt-8 p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-400/30 rounded-xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-blue-600/5 animate-pulse"></div>
                <div className="relative z-10 text-center">
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <div className="p-4 rounded-full bg-blue-500/20 border border-blue-400/30">
                      <Activity className="h-8 w-8 text-blue-400 animate-pulse" />
                    </div>
                    <div>
                      <span className="text-blue-300 font-bold text-2xl">
                        {globalMetrics.activeAgents} AI agent{globalMetrics.activeAgents > 1 ? 's' : ''} actively working
                      </span>
                      <div className="text-blue-200 text-lg">
                        Generating real business value in your CRM right now
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-center gap-8 text-sm">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-400" />
                      <span className="text-green-300">Revenue generating</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-400" />
                      <span className="text-blue-300">Contacts creating</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-purple-400" />
                      <span className="text-purple-300">Emails sending</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-orange-400" />
                      <span className="text-orange-300">Meetings booking</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced View Mode Toggle */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 ${
              viewMode === 'grid'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                : 'bg-slate-800/50 text-gray-300 hover:bg-slate-700/50'
            }`}
          >
            <Monitor className="inline-block w-6 h-6 mr-2" />
            Agent Grid
          </button>
          <button
            onClick={() => setViewMode('execution')}
            className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 ${
              viewMode === 'execution'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                : 'bg-slate-800/50 text-gray-300 hover:bg-slate-700/50'
            }`}
          >
            <Eye className="inline-block w-6 h-6 mr-2" />
            Live Execution
          </button>
          <button
            onClick={() => setViewMode('metrics')}
            className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 ${
              viewMode === 'metrics'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                : 'bg-slate-800/50 text-gray-300 hover:bg-slate-700/50'
            }`}
          >
            <BarChart3 className="inline-block w-6 h-6 mr-2" />
            Business Impact
          </button>
        </div>

        {/* Master Control Panel */}
        <div className="flex justify-center gap-6 mb-8">
          <button
            onClick={executeAllAgents}
            className="px-8 py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            <span className="flex items-center gap-3">
              <Zap className="h-6 w-6" />
              Execute All Agents
            </span>
          </button>
          <button
            onClick={() => setRealMode(!realMode)}
            className={`px-6 py-4 rounded-xl font-semibold transition-all duration-300 ${
              realMode 
                ? 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white' 
                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
            }`}
          >
            Switch to {realMode ? 'Demo' : 'Live'} Mode
          </button>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap justify-center gap-3 mb-12">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 ${
              selectedCategory === category
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-slate-800/50 text-gray-300 hover:bg-slate-700/50 hover:text-white'
            }`}
          >
            {category}
            {category !== 'All' && (
              <span className="ml-2 text-xs opacity-75">
                ({filteredAgents.length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Dynamic Content Based on View Mode */}
      {viewMode === 'grid' && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredAgents.map((agent) => {
            const IconComponent = agent.icon;
            const execution = agentExecutions[agent.id];
            const isExecuting = execution?.isRunning;
            const isCompleted = execution && !execution.isRunning && execution.completionTime;
            
            return (
              <div
                key={agent.id}
                className={`relative p-8 rounded-2xl border cursor-pointer transition-all duration-500 transform hover:scale-105 ${
                  isExecuting
                    ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-blue-400/50 shadow-xl shadow-blue-500/20 ring-2 ring-blue-500/30'
                    : isCompleted
                    ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-400/50 shadow-xl shadow-green-500/20'
                    : 'bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-700/50 hover:border-blue-500/30 hover:shadow-xl'
                }`}
                onClick={() => setActiveAgent(agent)}
              >
                {/* Agent Header */}
                <div className="flex items-start gap-4 mb-6">
                  <div className={`p-4 rounded-xl bg-gradient-to-r ${getColorClasses(agent.color)} relative`}>
                    <IconComponent className="h-8 w-8 text-white" />
                    {isExecuting && (
                      <div className="absolute -inset-1 bg-white/20 rounded-xl animate-pulse"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="font-bold text-white text-xl">{agent.name}</h3>
                      {isExecuting && (
                        <div className="flex items-center gap-2 bg-blue-500/20 px-3 py-1 rounded-full border border-blue-400/30">
                          <Activity className="h-4 w-4 text-blue-400 animate-pulse" />
                          <span className="text-xs text-blue-300 font-medium">EXECUTING</span>
                        </div>
                      )}
                      {isCompleted && (
                        <div className="flex items-center gap-2 bg-green-500/20 px-3 py-1 rounded-full border border-green-400/30">
                          <CheckCircle className="h-4 w-4 text-green-400" />
                          <span className="text-xs text-green-300 font-medium">COMPLETED</span>
                        </div>
                      )}
                    </div>
                    <p className="text-gray-300 mb-4 text-lg">{agent.description}</p>
                  </div>
                </div>

                {/* Execution Progress */}
                {execution && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-white font-medium">Task Progress</span>
                      <span className="text-blue-400 font-bold">
                        {execution.steps.filter(s => s.status === 'completed').length}/{execution.steps.length}
                      </span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-3 relative overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 rounded-full transition-all duration-500 relative"
                        style={{ 
                          width: `${(execution.steps.filter(s => s.status === 'completed').length / execution.steps.length) * 100}%` 
                        }}
                      >
                        <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Business Impact Metrics */}
                {execution && execution.businessMetrics.revenue > 0 && (
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="text-center p-4 bg-green-500/10 border border-green-400/30 rounded-xl">
                      <div className="text-xl font-bold text-green-400">${execution.businessMetrics.revenue.toLocaleString()}</div>
                      <div className="text-xs text-gray-400">Revenue Generated</div>
                    </div>
                    <div className="text-center p-4 bg-blue-500/10 border border-blue-400/30 rounded-xl">
                      <div className="text-xl font-bold text-blue-400">{execution.businessMetrics.timeSaved}h</div>
                      <div className="text-xs text-gray-400">Time Saved</div>
                    </div>
                    <div className="text-center p-4 bg-purple-500/10 border border-purple-400/30 rounded-xl">
                      <div className="text-xl font-bold text-purple-400">{execution.businessMetrics.contactsCreated}</div>
                      <div className="text-xs text-gray-400">Contacts Added</div>
                    </div>
                    <div className="text-center p-4 bg-orange-500/10 border border-orange-400/30 rounded-xl">
                      <div className="text-xl font-bold text-orange-400">{execution.businessMetrics.emailsSent}</div>
                      <div className="text-xs text-gray-400">Emails Sent</div>
                    </div>
                  </div>
                )}

                {/* Tools & Actions */}
                <div className="space-y-4 mb-6">
                  <div>
                    <div className="text-sm text-gray-400 mb-2">Tools Used:</div>
                    <div className="flex flex-wrap gap-2">
                      {agent.tools.map((tool, i) => (
                        <span key={i} className="text-xs bg-slate-600/30 text-gray-300 px-3 py-1 rounded-full border border-slate-600/50">
                          🔧 {tool}
                        </span>
                      ))}
                    </div>
                  </div>

                  {execution && execution.crmSnapshot.changes.length > 0 && (
                    <div>
                      <div className="text-sm text-gray-400 mb-2">CRM Changes:</div>
                      <div className="space-y-1 max-h-20 overflow-y-auto">
                        {execution.crmSnapshot.changes.slice(0, 3).map((change, i) => (
                          <div key={i} className="text-xs text-green-300 flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 flex-shrink-0" />
                            {change}
                          </div>
                        ))}
                        {execution.crmSnapshot.changes.length > 3 && (
                          <div className="text-xs text-gray-400">
                            +{execution.crmSnapshot.changes.length - 3} more changes...
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isExecuting) executeAgent(agent);
                  }}
                  disabled={isExecuting}
                  className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 ${
                    isExecuting
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : isCompleted
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg'
                      : `bg-gradient-to-r ${getColorClasses(agent.color)} text-white hover:shadow-xl`
                  }`}
                >
                  {isExecuting ? (
                    <span className="flex items-center justify-center gap-3">
                      <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                      Executing Business Tasks...
                    </span>
                  ) : isCompleted ? (
                    <span className="flex items-center justify-center gap-3">
                      <Award className="h-5 w-5" />
                      View Execution Results
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-3">
                      <Play className="h-5 w-5" />
                      Execute Agent Tasks
                    </span>
                  )}
                </button>

                {/* Live Status Indicators */}
                {isExecuting && (
                  <div className="absolute top-6 right-6 flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                    <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
                  </div>
                )}

                {/* Success Badge */}
                {isCompleted && (
                  <div className="absolute top-6 right-6">
                    <div className="p-2 bg-green-500/20 border border-green-400/30 rounded-full">
                      <Trophy className="h-5 w-5 text-green-400" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Live Execution View - Enhanced */}
      {viewMode === 'execution' && (
        <div className="space-y-8">
          {/* Active Executions */}
          {Object.values(agentExecutions).filter(e => e.isRunning).length > 0 ? (
            <div className="space-y-8">
              <h3 className="text-3xl font-bold text-white text-center flex items-center justify-center gap-4">
                <Activity className="h-10 w-10 text-blue-400 animate-pulse" />
                Live Agent Executions in Progress
                <Network className="h-8 w-8 text-purple-400" />
              </h3>

              {Object.values(agentExecutions)
                .filter(execution => execution.isRunning)
                .map(execution => {
                  const agent = specializedAgents.find(a => a.id === execution.agentId);
                  if (!agent) return null;

                  return (
                    <div key={execution.agentId} className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl rounded-3xl border border-blue-400/50 p-8 shadow-2xl shadow-blue-500/20">
                      {/* Agent Header */}
                      <div className="flex items-center gap-6 mb-8">
                        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 relative">
                          <agent.icon className="h-10 w-10 text-white" />
                          <div className="absolute -inset-1 bg-white/20 rounded-2xl animate-pulse"></div>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-3xl font-bold text-white mb-2">{agent.name}</h4>
                          <p className="text-gray-300 text-lg">Executing {execution.steps.length} advanced business tasks</p>
                        </div>
                        <div className="text-right">
                          <div className="text-blue-400 text-lg mb-2">
                            Step {execution.currentStep + 1} of {execution.steps.length}
                          </div>
                          <div className="text-4xl font-bold text-blue-400">
                            {Math.round(((execution.steps.filter(s => s.status === 'completed').length) / execution.steps.length) * 100)}%
                          </div>
                        </div>
                      </div>

                      {/* Live Progress Bar */}
                      <div className="mb-8">
                        <div className="w-full bg-slate-700 rounded-full h-4 relative overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 rounded-full transition-all duration-500 relative"
                            style={{ width: `${((execution.steps.filter(s => s.status === 'completed').length) / execution.steps.length) * 100}%` }}
                          >
                            <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer"></div>
                          </div>
                        </div>
                      </div>

                      {/* Live Business Metrics */}
                      <div className="grid md:grid-cols-5 gap-6 mb-8">
                        <div className="text-center p-4 bg-green-500/10 border border-green-400/30 rounded-xl">
                          <div className="text-2xl font-bold text-green-400">${execution.businessMetrics.revenue.toLocaleString()}</div>
                          <div className="text-sm text-gray-300">Revenue</div>
                        </div>
                        <div className="text-center p-4 bg-blue-500/10 border border-blue-400/30 rounded-xl">
                          <div className="text-2xl font-bold text-blue-400">{execution.businessMetrics.timeSaved}h</div>
                          <div className="text-sm text-gray-300">Time Saved</div>
                        </div>
                        <div className="text-center p-4 bg-purple-500/10 border border-purple-400/30 rounded-xl">
                          <div className="text-2xl font-bold text-purple-400">{execution.businessMetrics.contactsCreated}</div>
                          <div className="text-sm text-gray-300">Contacts</div>
                        </div>
                        <div className="text-center p-4 bg-orange-500/10 border border-orange-400/30 rounded-xl">
                          <div className="text-2xl font-bold text-orange-400">{execution.businessMetrics.emailsSent}</div>
                          <div className="text-sm text-gray-300">Emails</div>
                        </div>
                        <div className="text-center p-4 bg-cyan-500/10 border border-cyan-400/30 rounded-xl">
                          <div className="text-2xl font-bold text-cyan-400">{execution.businessMetrics.meetingsScheduled}</div>
                          <div className="text-sm text-gray-300">Meetings</div>
                        </div>
                      </div>

                      {/* Detailed Task Steps */}
                      <div className="space-y-6">
                        {execution.steps.map((step, index) => (
                          <div key={step.id} className="relative">
                            {/* Connection Line */}
                            {index < execution.steps.length - 1 && (
                              <div className="absolute left-8 top-16 w-px h-20 bg-slate-600"></div>
                            )}

                            <div className={`flex gap-6 p-6 rounded-2xl border transition-all duration-500 ${
                              step.status === 'running' 
                                ? 'bg-blue-500/10 border-blue-400/30 shadow-lg shadow-blue-500/20 scale-105'
                                : step.status === 'completed'
                                ? 'bg-green-500/10 border-green-400/30'
                                : 'bg-slate-700/30 border-slate-600/30'
                            }`}>
                              {/* Step Status */}
                              <div className="flex-shrink-0">
                                <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center border-2 border-slate-600">
                                  {step.status === 'completed' ? (
                                    <CheckCircle className="w-8 h-8 text-green-400" />
                                  ) : step.status === 'running' ? (
                                    <div className="animate-spin w-8 h-8 border-3 border-blue-400 border-t-transparent rounded-full" />
                                  ) : (
                                    <Clock className="w-8 h-8 text-gray-400" />
                                  )}
                                </div>
                                <div className="text-center mt-2">
                                  <div className="text-xs text-gray-400">Step {index + 1}</div>
                                </div>
                              </div>

                              {/* Step Content */}
                              <div className="flex-1">
                                <h5 className="font-bold text-white text-xl mb-3">{step.description}</h5>
                                
                                {step.status === 'completed' && step.businessImpact && (
                                  <div className="bg-green-500/10 border border-green-400/30 rounded-xl p-4 mb-4">
                                    <div className="text-sm font-medium text-green-400 mb-2 flex items-center gap-2">
                                      <TrendingUp className="h-4 w-4" />
                                      Business Impact:
                                    </div>
                                    <div className="text-green-200 text-lg font-medium">{step.businessImpact}</div>
                                  </div>
                                )}

                                {step.status === 'running' && (
                                  <div className="bg-blue-500/10 border border-blue-400/30 rounded-xl p-4 mb-4">
                                    <div className="text-blue-300 flex items-center gap-3">
                                      <div className="animate-spin w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full" />
                                      <span className="text-lg">Processing business logic and updating CRM...</span>
                                    </div>
                                  </div>
                                )}

                                {step.duration && (
                                  <div className="text-xs text-gray-400 mt-3">
                                    Completed in {(step.duration / 1000).toFixed(1)} seconds
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            /* Empty State for Live Execution */
            <div className="text-center py-20">
              <div className="mb-8">
                <Bot className="h-24 w-24 text-gray-400 mx-auto mb-8 animate-float" />
                <h3 className="text-4xl font-bold text-white mb-6">No Agents Currently Executing</h3>
                <p className="text-gray-300 max-w-2xl mx-auto text-xl mb-8">
                  Start executing AI agents to watch them complete real business tasks in live time. 
                  Each agent will show step-by-step progress with measurable business impact.
                </p>
              </div>
              <div className="flex justify-center gap-6">
                <button
                  onClick={() => setViewMode('grid')}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
                >
                  View All Agents
                </button>
                <button
                  onClick={executeAllAgents}
                  className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
                >
                  <Zap className="inline w-5 h-5 mr-2" />
                  Execute All Agents
                </button>
              </div>
            </div>
          )}

          {/* Completed Executions Summary */}
          {Object.values(agentExecutions).filter(e => !e.isRunning && e.completionTime).length > 0 && (
            <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Award className="h-8 w-8 text-green-400" />
                Completed Agent Executions
              </h3>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.values(agentExecutions)
                  .filter(execution => !execution.isRunning && execution.completionTime)
                  .map(execution => {
                    const agent = specializedAgents.find(a => a.id === execution.agentId);
                    if (!agent) return null;

                    const duration = execution.completionTime && execution.startTime 
                      ? (execution.completionTime.getTime() - execution.startTime.getTime()) / 1000
                      : 0;

                    return (
                      <div key={execution.agentId} className="p-6 bg-green-500/5 border border-green-400/30 rounded-xl">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="p-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500">
                            <agent.icon className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-bold text-white">{agent.name}</h4>
                            <p className="text-green-300">All tasks completed successfully</p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-400">100%</div>
                            <div className="text-xs text-gray-400">{duration.toFixed(1)}s</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                            <div className="text-lg font-bold text-green-400">${execution.businessMetrics.revenue.toLocaleString()}</div>
                            <div className="text-xs text-gray-400">Revenue</div>
                          </div>
                          <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                            <div className="text-lg font-bold text-blue-400">{execution.businessMetrics.timeSaved}h</div>
                            <div className="text-xs text-gray-400">Time Saved</div>
                          </div>
                        </div>

                        <div className="text-center text-sm text-gray-300">
                          {execution.businessMetrics.tasksCompleted} tasks • {execution.crmSnapshot.changes.length} CRM updates
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Business Impact Metrics View */}
      {viewMode === 'metrics' && (
        <div className="space-y-8">
          <h3 className="text-3xl font-bold text-white text-center mb-8">
            Real-Time Business Impact Analysis
          </h3>

          {/* ROI Calculator */}
          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-400/30 rounded-2xl p-8">
            <h4 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-green-400" />
              Live ROI Calculation
            </h4>
            
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-green-400 mb-2">${globalMetrics.totalRevenue.toLocaleString()}</div>
                <div className="text-gray-300 font-medium">Revenue Generated</div>
                <div className="text-sm text-green-400">+{((globalMetrics.totalRevenue / 50000) * 100).toFixed(0)}% ROI</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-400 mb-2">${(globalMetrics.totalTimeSaved * 75).toLocaleString()}</div>
                <div className="text-gray-300 font-medium">Labor Cost Saved</div>
                <div className="text-sm text-blue-400">{globalMetrics.totalTimeSaved}h @ $75/hr</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-400 mb-2">{(globalMetrics.totalTasks * 150).toLocaleString()}%</div>
                <div className="text-gray-300 font-medium">Efficiency Gain</div>
                <div className="text-sm text-purple-400">vs manual processes</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-orange-400 mb-2">${((globalMetrics.totalRevenue + (globalMetrics.totalTimeSaved * 75)) * 12).toLocaleString()}</div>
                <div className="text-gray-300 font-medium">Annual Value</div>
                <div className="text-sm text-orange-400">Projected 12-month ROI</div>
              </div>
            </div>
          </div>

          {/* Detailed Agent Performance */}
          <div className="grid md:grid-cols-2 gap-8">
            {Object.values(agentExecutions)
              .filter(execution => execution.completionTime)
              .map(execution => {
                const agent = specializedAgents.find(a => a.id === execution.agentId);
                if (!agent) return null;

                return (
                  <div key={execution.agentId} className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500">
                        <agent.icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-white">{agent.name}</h4>
                        <p className="text-gray-300">Performance Analysis</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-green-500/10 border border-green-400/30 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-green-400">${execution.businessMetrics.revenue.toLocaleString()}</div>
                          <div className="text-sm text-gray-300">Revenue Impact</div>
                        </div>
                        <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-blue-400">{((execution.businessMetrics.revenue / 50000) * 100).toFixed(0)}%</div>
                          <div className="text-sm text-gray-300">ROI Generated</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Tasks Completed:</span>
                          <span className="text-white font-medium">{execution.businessMetrics.tasksCompleted}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Time Saved:</span>
                          <span className="text-blue-400 font-medium">{execution.businessMetrics.timeSaved} hours</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">CRM Updates:</span>
                          <span className="text-green-400 font-medium">{execution.crmSnapshot.changes.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Success Rate:</span>
                          <span className="text-green-400 font-medium">100%</span>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-600">
                        <div className="text-sm text-gray-400 mb-2">Key Achievements:</div>
                        <div className="space-y-1">
                          {execution.crmSnapshot.changes.slice(0, 3).map((change, i) => (
                            <div key={i} className="text-sm text-green-300 flex items-center gap-2">
                              <CheckCircle className="h-3 w-3" />
                              {change}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Empty State for Metrics */}
          {Object.keys(agentExecutions).length === 0 && (
            <div className="text-center py-16">
              <BarChart3 className="h-20 w-20 text-gray-400 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-white mb-4">No Performance Data Yet</h3>
              <p className="text-gray-300 max-w-md mx-auto text-lg mb-6">
                Execute some agents to see detailed business impact metrics and ROI analysis.
              </p>
              <button
                onClick={() => setViewMode('grid')}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
              >
                Start Executing Agents
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default AgentShowcase;