import { Goal, GoalCategory } from '../types/goals';
import { 
  Target, 
  Users, 
  MessageSquare, 
  Zap, 
  BarChart3, 
  FileText, 
  Shield, 
  Brain 
} from 'lucide-react';

export const goalCategories: GoalCategory[] = [
  {
    id: 'sales',
    name: 'Sales Goals',
    description: 'Automate your entire sales process from lead generation to closing',
    icon: Target,
    color: 'blue',
    totalGoals: 14
  },
  {
    id: 'marketing',
    name: 'Marketing Goals', 
    description: 'Launch campaigns and nurture leads across multiple channels',
    icon: MessageSquare,
    color: 'purple',
    totalGoals: 8
  },
  {
    id: 'relationship',
    name: 'Relationship Goals',
    description: 'Build stronger relationships with intelligent conversation memory',
    icon: Users,
    color: 'green',
    totalGoals: 8
  },
  {
    id: 'automation',
    name: 'Automation Goals',
    description: 'Create workflows that run your business while you sleep',
    icon: Zap,
    color: 'orange',
    totalGoals: 8
  },
  {
    id: 'analytics',
    name: 'Analytics Goals',
    description: 'Get insights and forecasts from your sales data',
    icon: BarChart3,
    color: 'red',
    totalGoals: 4
  },
  {
    id: 'content',
    name: 'Content Goals',
    description: 'Generate personalized content and communications',
    icon: FileText,
    color: 'teal',
    totalGoals: 4
  },
  {
    id: 'admin',
    name: 'Admin Goals',
    description: 'Keep your data clean and organized automatically',
    icon: Shield,
    color: 'indigo',
    totalGoals: 2
  },
  {
    id: 'ai-native',
    name: 'AI-Native Goals',
    description: 'Experience the future of AI-powered business automation',
    icon: Brain,
    color: 'pink',
    totalGoals: 2
  }
];

export const allGoals: Goal[] = [
  // SALES GOALS (14)
  {
    id: 'generate-leads-automatically',
    category: 'Sales',
    title: 'Generate leads automatically',
    description: 'Discover qualified prospects based on target profiles using AI',
    priority: 'High',
    agentsRequired: ['Lead Enrichment Agent', 'AI SDR Agent', 'Lead Scoring Agent'],
    toolsNeeded: ['linkedin', 'hubspot', 'google_sheets'],
    estimatedSetupTime: '15 minutes',
    businessImpact: 'Fill your pipeline with 50+ qualified leads per week',
    complexity: 'Intermediate',
    realWorldExample: 'AI finds 50 SaaS prospects matching your ICP and adds them to your CRM with contact info',
    successMetrics: ['50+ leads per week', '90%+ data accuracy', '30% qualification rate'],
    roi: '300% ROI within 30 days'
  },
  {
    id: 'score-prioritize-leads',
    category: 'Sales',
    title: 'Score and prioritize leads',
    description: 'Identify which leads are hot, warm, or cold using behavioral analysis',
    priority: 'High',
    agentsRequired: ['Lead Scoring Agent', 'Emotion & Intent Detection Agent'],
    toolsNeeded: ['hubspot', 'salesforce', 'google_sheets'],
    estimatedSetupTime: '10 minutes',
    businessImpact: 'Focus on leads 5x more likely to close',
    complexity: 'Simple',
    realWorldExample: 'AI analyzes email opens, website visits, and engagement to rank your leads',
    successMetrics: ['80% accuracy', '5x better conversion', '50% time savings'],
    roi: '400% increase in close rate'
  },
  {
    id: 'cold-outreach-no-writing',
    category: 'Sales',
    title: 'Cold outreach without writing emails',
    description: 'Auto-generate and send personalized intro messages that get responses',
    priority: 'High',
    agentsRequired: ['AI SDR Agent', 'Personalized Email Agent', 'Follow-up Agent'],
    toolsNeeded: ['gmail', 'hubspot', 'linkedin'],
    estimatedSetupTime: '20 minutes',
    businessImpact: 'Send 100+ personalized emails daily with 25%+ response rates',
    complexity: 'Intermediate',
    realWorldExample: 'AI writes and sends personalized cold emails to 100 prospects daily',
    successMetrics: ['100+ emails daily', '25% response rate', '90% deliverability'],
    roi: '10x cost savings vs hiring SDRs'
  },
  {
    id: 'book-meetings-no-back-forth',
    category: 'Sales',
    title: 'Book meetings without back-and-forth',
    description: 'Schedule discovery or demo calls with minimal manual effort',
    priority: 'High',
    agentsRequired: ['Meetings Agent', 'AI Sales Assistant Agent'],
    toolsNeeded: ['google_calendar', 'zoom', 'calendly'],
    estimatedSetupTime: '10 minutes',
    businessImpact: 'Book 20+ qualified meetings per week automatically',
    complexity: 'Simple',
    realWorldExample: 'AI handles scheduling, sends calendar invites, and sets up Zoom links',
    successMetrics: ['20+ meetings/week', '90% show rate', '0 scheduling conflicts'],
    roi: '80% time savings on scheduling'
  },
  {
    id: 'follow-up-multiple-channels',
    category: 'Sales',
    title: 'Follow up across multiple channels',
    description: 'Ensure no lead goes cold after initial contact',
    priority: 'Medium',
    agentsRequired: ['Follow-up Agent', 'AI Journeys Agent'],
    toolsNeeded: ['gmail', 'slack', 'whatsapp_business'],
    estimatedSetupTime: '15 minutes',
    businessImpact: 'Increase response rates by 200% with multi-touch sequences',
    complexity: 'Intermediate',
    realWorldExample: 'AI follows up via email, LinkedIn, and phone across 7 touchpoints',
    successMetrics: ['7 touchpoints', '200% response increase', '0 leads forgotten'],
    roi: '200% increase in pipeline velocity'
  },
  {
    id: 'handle-objections-ai',
    category: 'Sales',
    title: 'Handle objections using AI',
    description: 'Auto-respond to common price/feature pushbacks with proven responses',
    priority: 'High',
    agentsRequired: ['Objection Handler Agent', 'Voice Agent', 'AI Sales Assistant Agent'],
    toolsNeeded: ['stripe', 'google_sheets', 'elevenlabs'],
    estimatedSetupTime: '20 minutes',
    businessImpact: 'Convert 40% more objections into closed deals',
    complexity: 'Advanced',
    realWorldExample: 'AI detects "too expensive" and responds with ROI calculator and case studies',
    successMetrics: ['40% objection conversion', 'Sub-2min response time', '85% satisfaction'],
    roi: '300% improvement in objection handling'
  },
  {
    id: 'close-deals-automatically',
    category: 'Sales',
    title: 'Close deals automatically',
    description: 'Move prospects to closed-won with AI support and automated nurturing',
    priority: 'High',
    agentsRequired: ['Cold Outreach Closer Agent', 'AI AE Agent', 'Objection Handler Agent'],
    toolsNeeded: ['gmail', 'stripe', 'zoom'],
    estimatedSetupTime: '30 minutes',
    businessImpact: 'Close 25% more deals with automated closing sequences',
    complexity: 'Advanced',
    realWorldExample: 'AI executes 9-step closing sequence from interest to signed contract',
    successMetrics: ['25% close rate increase', '50% faster sales cycles', '90% accuracy'],
    roi: '500% ROI on closed deals'
  },
  {
    id: 'proposals-created-sent-ai',
    category: 'Sales',
    title: 'Proposals created & sent by AI',
    description: 'Generate, customize, and deliver proposals/contracts automatically',
    priority: 'Medium',
    agentsRequired: ['AI AE Agent', 'Structured Output Agent', 'Voice Agent'],
    toolsNeeded: ['google_sheets', 'stripe', 'zoom'],
    estimatedSetupTime: '25 minutes',
    businessImpact: 'Generate custom proposals 10x faster than manual creation',
    complexity: 'Advanced',
    realWorldExample: 'AI creates custom proposals with pricing, terms, and case studies in minutes',
    successMetrics: ['10x faster creation', '95% accuracy', '60% acceptance rate'],
    roi: '1000% time savings on proposals'
  },
  {
    id: 'revive-stale-deals',
    category: 'Sales',
    title: 'Revive stale deals',
    description: 'Re-engage cold or unresponsive prospects with targeted campaigns',
    priority: 'Medium',
    agentsRequired: ['Reengagement Agent', 'AI SDR Agent'],
    toolsNeeded: ['gmail', 'facebook_ads', 'hubspot'],
    estimatedSetupTime: '15 minutes',
    businessImpact: 'Recover 30% of stale deals worth $10k+ each',
    complexity: 'Intermediate',
    realWorldExample: 'AI identifies dormant deals and launches targeted re-engagement campaigns',
    successMetrics: ['30% deal recovery', '$10k average value', '60 day revival cycle'],
    roi: '2000% ROI on recovered deals'
  },
  {
    id: 'detect-high-close-potential',
    category: 'Sales',
    title: 'Detect high-close-potential leads',
    description: 'Identify which leads are most likely to close this week using AI scoring',
    priority: 'High',
    agentsRequired: ['Lead Scoring Agent', 'Emotion & Intent Detection Agent'],
    toolsNeeded: ['hubspot', 'salesforce', 'google_sheets'],
    estimatedSetupTime: '10 minutes',
    businessImpact: 'Focus on leads 10x more likely to close immediately',
    complexity: 'Intermediate',
    realWorldExample: 'AI analyzes 50+ signals to predict which leads will close in next 7 days',
    successMetrics: ['90% prediction accuracy', '10x close probability', '50% faster cycles'],
    roi: '800% increase in weekly closes'
  },
  {
    id: 'close-deals-sms-whatsapp',
    category: 'Sales',
    title: 'Close deals over SMS/WhatsApp',
    description: 'Have AI handle short-form sales conversations via text messaging',
    priority: 'Medium',
    agentsRequired: ['SMS Campaigner Agent', 'WhatsApp Nurturer Agent', 'Voice Agent'],
    toolsNeeded: ['twilio', 'whatsapp_business', 'hubspot'],
    estimatedSetupTime: '20 minutes',
    businessImpact: 'Close deals 5x faster with instant messaging',
    complexity: 'Advanced',
    realWorldExample: 'AI handles objections and closes deals via WhatsApp conversations',
    successMetrics: ['5x faster closing', '80% response rate', '40% close rate'],
    roi: '400% increase in mobile closes'
  },
  {
    id: 'alerts-email-opens',
    category: 'Sales',
    title: 'Get alerts when leads open email',
    description: 'Real-time notifications on engagement with instant follow-up triggers',
    priority: 'Low',
    agentsRequired: ['Timeline Logger Agent', 'Follow-up Agent'],
    toolsNeeded: ['gmail', 'slack', 'hubspot'],
    estimatedSetupTime: '5 minutes',
    businessImpact: 'Respond to hot leads within 60 seconds of engagement',
    complexity: 'Simple',
    realWorldExample: 'Get Slack notification when prospect opens pricing email',
    successMetrics: ['60 second response time', '90% engagement tracking', '300% response rates'],
    roi: '250% improvement in response timing'
  },
  {
    id: 'qualify-leads-chatbot',
    category: 'Sales',
    title: 'Qualify leads via chatbot or form',
    description: 'Automatically ask qualification questions and update records',
    priority: 'Medium',
    agentsRequired: ['Smart Demo Bot Agent', 'Command Analyzer Agent', 'Function Trigger Agent'],
    toolsNeeded: ['typeform', 'hubspot', 'google_sheets'],
    estimatedSetupTime: '15 minutes',
    businessImpact: 'Qualify 100+ leads daily without human intervention',
    complexity: 'Intermediate',
    realWorldExample: 'AI chatbot qualifies website visitors and scores them automatically',
    successMetrics: ['100+ qualifications daily', '85% accuracy', '90% completion rate'],
    roi: '600% increase in qualified leads'
  },
  {
    id: 'update-pipeline-voice',
    category: 'Sales',
    title: 'Update pipeline with voice commands',
    description: 'Move deals through stages by speaking or typing natural language',
    priority: 'Medium',
    agentsRequired: ['Whisper Listener Agent', 'Command Analyzer Agent', 'Function Trigger Agent'],
    toolsNeeded: ['whisper', 'supabase', 'hubspot'],
    estimatedSetupTime: '10 minutes',
    businessImpact: 'Update CRM 10x faster with voice commands',
    complexity: 'Simple',
    realWorldExample: 'Say "Move Acme Corp to Negotiation stage" and watch it happen instantly',
    successMetrics: ['10x faster updates', '95% accuracy', '0 clicks required'],
    roi: '1000% time savings on CRM updates'
  },

  // MARKETING GOALS (8)
  {
    id: 'nurture-sequences-auto',
    category: 'Marketing',
    title: 'Send nurture sequences automatically',
    description: 'Run multi-step drip campaigns via email/SMS/WhatsApp without manual work',
    priority: 'High',
    agentsRequired: ['AI Journeys Agent', 'SMS Campaigner Agent', 'WhatsApp Nurturer Agent'],
    toolsNeeded: ['gmail', 'twilio', 'whatsapp_business'],
    estimatedSetupTime: '20 minutes',
    businessImpact: 'Nurture 1000+ leads simultaneously across 3 channels',
    complexity: 'Intermediate',
    realWorldExample: '30-day nurture sequence with educational content and case studies',
    successMetrics: ['1000+ leads nurtured', '3 channels', '45% engagement'],
    roi: '800% increase in lead nurturing capacity'
  },
  {
    id: 'launch-campaigns-one-screen',
    category: 'Marketing',
    title: 'Launch SMS, WhatsApp, email campaigns from one screen',
    description: 'Unified campaign builder that manages all your marketing channels',
    priority: 'High',
    agentsRequired: ['AI Journeys Agent', 'SMS Campaigner Agent', 'WhatsApp Nurturer Agent', 'Personalized Email Agent'],
    toolsNeeded: ['gmail', 'twilio', 'whatsapp_business', 'facebook_ads'],
    estimatedSetupTime: '25 minutes',
    businessImpact: 'Launch campaigns 5x faster with unified control panel',
    complexity: 'Advanced',
    realWorldExample: 'Single interface controls email, SMS, WhatsApp, and social campaigns',
    successMetrics: ['5x faster launches', '4 channels unified', '90% consistency'],
    roi: '500% improvement in campaign efficiency'
  },
  {
    id: 'personalize-followups-behavior',
    category: 'Marketing',
    title: 'Personalize follow-ups based on clicks or views',
    description: 'Dynamic content delivery based on prospect behavior and engagement',
    priority: 'Medium',
    agentsRequired: ['Follow-up Agent', 'Emotion & Intent Detection Agent', 'AI Journeys Agent'],
    toolsNeeded: ['gmail', 'hubspot', 'google_sheets'],
    estimatedSetupTime: '15 minutes',
    businessImpact: 'Increase engagement by 300% with behavioral triggers',
    complexity: 'Intermediate',
    realWorldExample: 'Send pricing info to those who clicked features, case studies to pricing viewers',
    successMetrics: ['300% engagement increase', '90% relevance score', '50% conversion boost'],
    roi: '400% improvement in content relevance'
  },
  {
    id: 'webinar-followups-auto',
    category: 'Marketing',
    title: 'Run webinar follow-ups automatically',
    description: 'Automated reminders, recordings delivery, and survey collection',
    priority: 'Low',
    agentsRequired: ['Follow-up Agent', 'Voice Agent', 'Timeline Logger Agent'],
    toolsNeeded: ['zoom', 'gmail', 'google_sheets'],
    estimatedSetupTime: '20 minutes',
    businessImpact: 'Convert 40% more webinar attendees into qualified leads',
    complexity: 'Advanced',
    realWorldExample: 'Auto-send recordings, surveys, and book follow-up calls for attendees',
    successMetrics: ['40% conversion increase', '100% recording delivery', '80% survey completion'],
    roi: '300% increase in webinar ROI'
  },
  {
    id: 'educational-sequences-30day',
    category: 'Marketing',
    title: 'Build 30-day educational sequences',
    description: 'Onboarding or thought-leadership flows that establish expertise',
    priority: 'Medium',
    agentsRequired: ['AI Journeys Agent', 'Slide Generator Agent', 'Voice Agent'],
    toolsNeeded: ['gmail', 'google_sheets', 'elevenlabs'],
    estimatedSetupTime: '30 minutes',
    businessImpact: 'Position yourself as industry expert with automated education',
    complexity: 'Advanced',
    realWorldExample: '30-day sequence teaching SaaS growth strategies with actionable tips',
    successMetrics: ['30 educational touches', '70% completion rate', '90% brand recall'],
    roi: '600% increase in thought leadership'
  },
  {
    id: 'deliver-content-based-tags',
    category: 'Marketing',
    title: 'Deliver content based on tags',
    description: 'Smart content routing for videos, PDFs, testimonials by audience segment',
    priority: 'Medium',
    agentsRequired: ['Structured Output Agent', 'AI Sales Assistant Agent'],
    toolsNeeded: ['google_sheets', 'hubspot', 'typeform'],
    estimatedSetupTime: '15 minutes',
    businessImpact: 'Deliver perfectly targeted content to each prospect segment',
    complexity: 'Intermediate',
    realWorldExample: 'Send SaaS case studies to software prospects, retail cases to ecommerce',
    successMetrics: ['100% content relevance', '80% engagement increase', '50% conversion boost'],
    roi: '400% improvement in content effectiveness'
  },
  {
    id: 'reengage-after-inactivity',
    category: 'Marketing',
    title: 'Re-engage users after inactivity',
    description: 'Automated re-engagement triggers when prospects go quiet',
    priority: 'Medium',
    agentsRequired: ['Reengagement Agent', 'Emotion & Intent Detection Agent'],
    toolsNeeded: ['gmail', 'facebook_ads', 'hubspot'],
    estimatedSetupTime: '10 minutes',
    businessImpact: 'Recover 25% of inactive leads with targeted campaigns',
    complexity: 'Simple',
    realWorldExample: 'Auto-trigger "Miss us?" campaign after 14 days of inactivity',
    successMetrics: ['25% reactivation rate', '14 day trigger time', '60% engagement recovery'],
    roi: '300% recovery of dormant leads'
  },
  {
    id: 'collect-social-proof',
    category: 'Marketing',
    title: 'Collect social proof from customers',
    description: 'Automated testimonial requests and review management system',
    priority: 'Low',
    agentsRequired: ['Follow-up Agent', 'AI Sales Assistant Agent'],
    toolsNeeded: ['gmail', 'google_sheets', 'typeform'],
    estimatedSetupTime: '15 minutes',
    businessImpact: 'Collect 50+ customer testimonials per month automatically',
    complexity: 'Simple',
    realWorldExample: 'Auto-request testimonials 30 days after deal close with custom forms',
    successMetrics: ['50+ testimonials monthly', '60% response rate', '90% quality score'],
    roi: '500% increase in social proof collection'
  },

  // RELATIONSHIP GOALS (8)
  {
    id: 'summarize-lead-history',
    category: 'Relationship',
    title: 'Summarize lead history instantly',
    description: 'Get complete timeline and context for any prospect in seconds',
    priority: 'High',
    agentsRequired: ['Timeline Logger Agent', 'Structured Output Agent', 'Command Analyzer Agent'],
    toolsNeeded: ['supabase', 'hubspot', 'gmail'],
    estimatedSetupTime: '5 minutes',
    businessImpact: 'Never lose context in sales conversations again',
    complexity: 'Simple',
    realWorldExample: 'Ask "Tell me about John Smith" and get full interaction history instantly',
    successMetrics: ['Sub-3 second response', '100% context retention', '95% accuracy'],
    roi: '800% improvement in conversation quality'
  },
  {
    id: 'track-emotion-sentiment',
    category: 'Relationship',
    title: 'Track emotion/sentiment from email or messages',
    description: 'Detect urgency, frustration, happiness, and buying signals automatically',
    priority: 'High',
    agentsRequired: ['Emotion & Intent Detection Agent', 'Emotion Detection Agent'],
    toolsNeeded: ['gmail', 'slack', 'gemini'],
    estimatedSetupTime: '10 minutes',
    businessImpact: 'Respond appropriately to prospect emotions with 90% accuracy',
    complexity: 'Intermediate',
    realWorldExample: 'AI detects frustration in email and suggests empathetic response',
    successMetrics: ['90% emotion accuracy', 'Real-time detection', '70% response improvement'],
    roi: '400% improvement in relationship quality'
  },
  {
    id: 'conversation-memory',
    category: 'Relationship',
    title: 'Know what to say next (conversation memory)',
    description: 'Instant context recall and intelligent conversation suggestions',
    priority: 'High',
    agentsRequired: ['Agent Persona Memory Agent', 'Command Analyzer Agent', 'AI Sales Assistant Agent'],
    toolsNeeded: ['supabase', 'openai', 'hubspot'],
    estimatedSetupTime: '10 minutes',
    businessImpact: 'Always know the perfect thing to say in any conversation',
    complexity: 'Advanced',
    realWorldExample: 'AI suggests next talking points based on previous conversation patterns',
    successMetrics: ['100% context recall', '85% suggestion relevance', '50% conversation improvement'],
    roi: '600% improvement in conversation effectiveness'
  },
  {
    id: 'assign-leads-right-rep',
    category: 'Relationship',
    title: 'Assign lead to right rep based on rules',
    description: 'Auto-routing by region, industry, value, and rep expertise',
    priority: 'Medium',
    agentsRequired: ['Lead Scoring Agent', 'CRM Action Advisor Agent'],
    toolsNeeded: ['hubspot', 'salesforce', 'google_sheets'],
    estimatedSetupTime: '15 minutes',
    businessImpact: 'Match leads with best-fit reps for 40% higher close rates',
    complexity: 'Intermediate',
    realWorldExample: 'Route enterprise SaaS leads to senior reps, SMB to junior reps',
    successMetrics: ['40% close rate increase', '100% rule compliance', '90% rep satisfaction'],
    roi: '300% improvement in lead-rep matching'
  },
  {
    id: 'transcribe-calls-notes',
    category: 'Relationship',
    title: 'Transcribe calls/voice notes',
    description: 'Whisper-powered transcription with automatic CRM logging',
    priority: 'Medium',
    agentsRequired: ['Whisper Listener Agent', 'Timeline Logger Agent'],
    toolsNeeded: ['whisper', 'supabase', 'zoom'],
    estimatedSetupTime: '10 minutes',
    businessImpact: 'Never miss important details from sales calls again',
    complexity: 'Simple',
    realWorldExample: 'Auto-transcribe Zoom calls and extract action items for CRM',
    successMetrics: ['95% transcription accuracy', '100% call logging', '80% action item extraction'],
    roi: '500% improvement in call documentation'
  },
  {
    id: 'auto-log-interactions',
    category: 'Relationship',
    title: 'Auto-log lead interactions',
    description: 'Emails, calls, meetings logged without manual entry',
    priority: 'High',
    agentsRequired: ['Timeline Logger Agent', 'Function Trigger Agent'],
    toolsNeeded: ['gmail', 'zoom', 'supabase'],
    estimatedSetupTime: '10 minutes',
    businessImpact: 'Save 2 hours daily on CRM data entry',
    complexity: 'Simple',
    realWorldExample: 'Every email, call, and meeting automatically appears in lead timeline',
    successMetrics: ['100% interaction logging', '2 hours daily savings', '95% data accuracy'],
    roi: '1000% time savings on data entry'
  },
  {
    id: 'detect-happy-frustrated',
    category: 'Relationship',
    title: 'Detect happy/frustrated customers',
    description: 'Proactive service alerts and upsell triggers based on sentiment',
    priority: 'Medium',
    agentsRequired: ['Emotion & Intent Detection Agent', 'CRM Action Advisor Agent'],
    toolsNeeded: ['gmail', 'slack', 'hubspot'],
    estimatedSetupTime: '15 minutes',
    businessImpact: 'Prevent churn and identify upsell opportunities proactively',
    complexity: 'Advanced',
    realWorldExample: 'Alert when customer expresses frustration, suggest upsell for happy customers',
    successMetrics: ['90% sentiment accuracy', '50% churn reduction', '30% upsell increase'],
    roi: '700% improvement in customer retention'
  },
  {
    id: 'pickup-abandoned-conversations',
    category: 'Relationship',
    title: 'Pick up abandoned conversations',
    description: 'Resume interactions exactly where they left off with full context',
    priority: 'Medium',
    agentsRequired: ['Agent Persona Memory Agent', 'Timeline Logger Agent', 'Command Analyzer Agent'],
    toolsNeeded: ['supabase', 'gmail', 'slack'],
    estimatedSetupTime: '10 minutes',
    businessImpact: 'Never lose momentum in important conversations',
    complexity: 'Intermediate',
    realWorldExample: 'Pick up conversation from 3 weeks ago with full context and next steps',
    successMetrics: ['100% context preservation', '90% conversation continuity', '60% reengagement success'],
    roi: '400% improvement in conversation consistency'
  },

  // AUTOMATION GOALS (8)
  {
    id: 'ai-daily-task-list',
    category: 'Automation',
    title: 'AI tells me what to do today',
    description: 'Personalized daily task list based on pipeline analysis and priorities',
    priority: 'High',
    agentsRequired: ['CRM Action Advisor Agent', 'Lead Scoring Agent', 'Timeline Logger Agent'],
    toolsNeeded: ['supabase', 'google_calendar', 'hubspot'],
    estimatedSetupTime: '10 minutes',
    businessImpact: 'Start each day with a perfect prioritized task list',
    complexity: 'Intermediate',
    realWorldExample: 'AI analyzes your pipeline and suggests: "Call John (hot lead), follow up with Acme Corp"',
    successMetrics: ['100% daily task coverage', '90% priority accuracy', '70% productivity increase'],
    roi: '500% improvement in daily productivity'
  },
  {
    id: 'workflow-no-code',
    category: 'Automation',
    title: 'Run entire workflow without writing code',
    description: 'Visual "if this, then that" builder for complex business processes',
    priority: 'High',
    agentsRequired: ['Command Analyzer Agent', 'Function Trigger Agent', 'Structured Output Agent'],
    toolsNeeded: ['supabase', 'composio', 'zapier'],
    estimatedSetupTime: '30 minutes',
    businessImpact: 'Build complex automations 10x faster than custom code',
    complexity: 'Advanced',
    realWorldExample: 'If lead scores 80+, then send pricing, book meeting, notify sales manager',
    successMetrics: ['10x faster automation', '95% workflow reliability', '0 code required'],
    roi: '2000% reduction in automation development time'
  },
  {
    id: 'update-crm-after-calls',
    category: 'Automation',
    title: 'Update CRM after every call or email',
    description: 'Auto-log activities and move deal stages based on conversation content',
    priority: 'High',
    agentsRequired: ['Timeline Logger Agent', 'Function Trigger Agent', 'Whisper Listener Agent'],
    toolsNeeded: ['supabase', 'zoom', 'gmail'],
    estimatedSetupTime: '15 minutes',
    businessImpact: 'Keep CRM 100% accurate without manual data entry',
    complexity: 'Intermediate',
    realWorldExample: 'After pricing call, AI moves deal to "Proposal" stage and logs next steps',
    successMetrics: ['100% CRM accuracy', '0 manual entry', '95% stage progression accuracy'],
    roi: '800% improvement in CRM data quality'
  },
  {
    id: 'smart-segmenting',
    category: 'Automation',
    title: 'Smart segmenting without rules',
    description: 'Auto-tag leads based on behavior patterns and AI analysis',
    priority: 'Medium',
    agentsRequired: ['Lead Scoring Agent', 'Emotion & Intent Detection Agent'],
    toolsNeeded: ['hubspot', 'google_sheets', 'gmail'],
    estimatedSetupTime: '20 minutes',
    businessImpact: 'Segment leads with 95% accuracy using behavioral AI',
    complexity: 'Advanced',
    realWorldExample: 'AI automatically tags leads as "Price Sensitive", "Feature Focused", "Decision Maker"',
    successMetrics: ['95% segmentation accuracy', '50+ behavioral signals', '80% engagement improvement'],
    roi: '600% improvement in targeting precision'
  },
  {
    id: 'trigger-reminders-deal-stage',
    category: 'Automation',
    title: 'Trigger reminders based on deal stage',
    description: 'Never miss a follow-up with intelligent reminder automation',
    priority: 'High',
    agentsRequired: ['CRM Action Advisor Agent', 'Timeline Logger Agent'],
    toolsNeeded: ['google_calendar', 'slack', 'hubspot'],
    estimatedSetupTime: '10 minutes',
    businessImpact: 'Never lose a deal due to missed follow-ups',
    complexity: 'Simple',
    realWorldExample: 'Auto-reminder: "Follow up with Acme Corp in 3 days - proposal sent"',
    successMetrics: ['100% follow-up coverage', '0 missed opportunities', '90% timing accuracy'],
    roi: '400% improvement in follow-up consistency'
  },
  {
    id: 'auto-create-todos-calls',
    category: 'Automation',
    title: 'Auto-create to-dos from calls/meetings',
    description: 'Extract action items automatically from meeting transcripts',
    priority: 'Medium',
    agentsRequired: ['Whisper Listener Agent', 'Command Analyzer Agent', 'Function Trigger Agent'],
    toolsNeeded: ['zoom', 'supabase', 'google_calendar'],
    estimatedSetupTime: '15 minutes',
    businessImpact: 'Never forget action items from important meetings',
    complexity: 'Intermediate',
    realWorldExample: 'After demo call, AI creates: "Send pricing proposal by Friday, schedule technical call"',
    successMetrics: ['95% action item extraction', '100% task creation', '80% completion tracking'],
    roi: '500% improvement in meeting follow-through'
  },
  {
    id: 'coordinate-multiple-agents',
    category: 'Automation',
    title: 'Coordinate multiple agents to complete a task',
    description: 'Multi-agent orchestration for complex business processes',
    priority: 'High',
    agentsRequired: ['Command Analyzer Agent', 'Function Trigger Agent', 'CRM Action Advisor Agent'],
    toolsNeeded: ['google_calendar', 'zoom', 'gmail', 'supabase'],
    estimatedSetupTime: '25 minutes',
    businessImpact: 'Execute complex workflows with perfect coordination',
    complexity: 'Advanced',
    realWorldExample: 'Book demo + send calendar + update deal + set reminder + notify team',
    successMetrics: ['5 agent coordination', '100% task completion', '95% workflow success'],
    roi: '1000% improvement in process efficiency'
  },
  {
    id: 'crm-works-while-sleep',
    category: 'Automation',
    title: 'Let CRM work while I sleep',
    description: 'Fully autonomous overnight sequences and lead management',
    priority: 'High',
    agentsRequired: ['AI SDR Agent', 'Follow-up Agent', 'Lead Scoring Agent', 'Timeline Logger Agent'],
    toolsNeeded: ['gmail', 'hubspot', 'supabase'],
    estimatedSetupTime: '30 minutes',
    businessImpact: 'Generate and nurture leads 24/7 without human intervention',
    complexity: 'Advanced',
    realWorldExample: 'While you sleep: AI finds 20 leads, sends outreach, scores responses, books meetings',
    successMetrics: ['24/7 operation', '20+ leads nightly', '90% autonomous operation'],
    roi: '2400% increase in working hours'
  },

  // ANALYTICS GOALS (4)
  {
    id: 'forecast-revenue',
    category: 'Analytics',
    title: 'Forecast revenue',
    description: 'Predict upcoming deals and revenue with AI-powered analysis',
    priority: 'High',
    agentsRequired: ['Lead Scoring Agent', 'Structured Output Agent'],
    toolsNeeded: ['hubspot', 'google_sheets', 'salesforce'],
    estimatedSetupTime: '15 minutes',
    businessImpact: 'Predict revenue 90 days out with 85% accuracy',
    complexity: 'Advanced',
    realWorldExample: 'AI predicts: "$125k revenue next month, $380k next quarter" with confidence intervals',
    successMetrics: ['85% forecast accuracy', '90 day prediction', '95% confidence intervals'],
    roi: '600% improvement in revenue planning'
  },
  {
    id: 'visualize-deal-movement',
    category: 'Analytics',
    title: 'Visualize deal movement',
    description: 'See funnel stages, values, and velocity with interactive dashboards',
    priority: 'Medium',
    agentsRequired: ['Structured Output Agent', 'Timeline Logger Agent'],
    toolsNeeded: ['google_sheets', 'hubspot', 'supabase'],
    estimatedSetupTime: '10 minutes',
    businessImpact: 'Identify bottlenecks and optimize your sales funnel',
    complexity: 'Intermediate',
    realWorldExample: 'Visual dashboard shows: 45% of deals stuck in demo stage for 2+ weeks',
    successMetrics: ['Real-time visualization', '100% deal tracking', '50% funnel optimization'],
    roi: '400% improvement in pipeline visibility'
  },
  {
    id: 'track-campaign-roi',
    category: 'Analytics',
    title: 'Track campaign ROI',
    description: 'Consolidate email/SMS/ad performance into unified analytics',
    priority: 'Medium',
    agentsRequired: ['Timeline Logger Agent', 'Structured Output Agent'],
    toolsNeeded: ['gmail', 'facebook_ads', 'google_sheets'],
    estimatedSetupTime: '20 minutes',
    businessImpact: 'Know exactly which campaigns drive the highest ROI',
    complexity: 'Advanced',
    realWorldExample: 'See: Email campaign ROI 400%, SMS ROI 250%, Facebook ads ROI 180%',
    successMetrics: ['Multi-channel tracking', '100% attribution accuracy', '90% ROI visibility'],
    roi: '500% improvement in marketing attribution'
  },
  {
    id: 'spot-funnel-bottlenecks',
    category: 'Analytics',
    title: 'Spot funnel bottlenecks',
    description: 'Identify where deals stall and get optimization recommendations',
    priority: 'High',
    agentsRequired: ['Lead Scoring Agent', 'Timeline Logger Agent', 'CRM Action Advisor Agent'],
    toolsNeeded: ['hubspot', 'supabase', 'google_sheets'],
    estimatedSetupTime: '15 minutes',
    businessImpact: 'Increase conversion rates by 40% with bottleneck elimination',
    complexity: 'Advanced',
    realWorldExample: 'AI identifies: "67% of deals stall at pricing - recommend ROI calculator"',
    successMetrics: ['40% conversion increase', '100% bottleneck detection', '90% optimization accuracy'],
    roi: '800% improvement in funnel efficiency'
  },

  // CONTENT & COMMUNICATION GOALS (4)
  {
    id: 'summarize-threads-pdfs',
    category: 'Content',
    title: 'Summarize long threads or PDFs',
    description: 'One-sentence recap plus action items from any document or conversation',
    priority: 'Medium',
    agentsRequired: ['Structured Output Agent', 'Command Analyzer Agent'],
    toolsNeeded: ['openai', 'gmail', 'google_sheets'],
    estimatedSetupTime: '5 minutes',
    businessImpact: 'Process information 10x faster with AI summarization',
    complexity: 'Simple',
    realWorldExample: 'Summarize 50-page proposal into: "Pricing concerns addressed, next: technical demo"',
    successMetrics: ['10x faster processing', '95% summary accuracy', '90% action item extraction'],
    roi: '1000% improvement in information processing'
  },
  {
    id: 'write-replies-tone-control',
    category: 'Content',
    title: 'Write replies with tone control',
    description: 'Generate responses with empathy, urgency, authority, or any desired tone',
    priority: 'High',
    agentsRequired: ['AI Sales Assistant Agent', 'Emotion Detection Agent'],
    toolsNeeded: ['openai', 'gmail', 'hubspot'],
    estimatedSetupTime: '10 minutes',
    businessImpact: 'Perfect tone matching increases response rates by 200%',
    complexity: 'Intermediate',
    realWorldExample: 'Write empathetic response to frustrated customer, authoritative response to technical questions',
    successMetrics: ['200% response rate increase', '95% tone accuracy', '85% satisfaction scores'],
    roi: '400% improvement in communication effectiveness'
  },
  {
    id: 'auto-create-stage-content',
    category: 'Content',
    title: 'Auto-create content for each stage',
    description: 'Email, SMS, WhatsApp copy generated for each funnel phase automatically',
    priority: 'High',
    agentsRequired: ['AI Sales Assistant Agent', 'Personalized Email Agent', 'Structured Output Agent'],
    toolsNeeded: ['openai', 'gmail', 'twilio'],
    estimatedSetupTime: '20 minutes',
    businessImpact: 'Generate perfect content for every stage without writing',
    complexity: 'Advanced',
    realWorldExample: 'Auto-generate awareness emails, consideration case studies, decision pricing docs',
    successMetrics: ['100% stage coverage', '95% content relevance', '80% engagement rates'],
    roi: '800% improvement in content creation speed'
  },
  {
    id: 'dynamic-proposal-generation',
    category: 'Content',
    title: 'Dynamic proposal generation',
    description: 'Auto-build proposals with pricing, clauses, and case studies based on prospect',
    priority: 'High',
    agentsRequired: ['AI AE Agent', 'Structured Output Agent', 'Slide Generator Agent'],
    toolsNeeded: ['openai', 'google_sheets', 'stripe'],
    estimatedSetupTime: '25 minutes',
    businessImpact: 'Generate custom proposals 20x faster with 90% win rates',
    complexity: 'Advanced',
    realWorldExample: 'Create SaaS proposal with enterprise pricing, security clauses, relevant case studies',
    successMetrics: ['20x faster creation', '90% proposal win rate', '100% customization'],
    roi: '2000% improvement in proposal efficiency'
  },

  // ADMIN & SUPPORT GOALS (2)
  {
    id: 'auto-clean-merge-records',
    category: 'Admin',
    title: 'Auto-clean and merge lead records',
    description: 'Dedupe and normalize data automatically to maintain clean CRM',
    priority: 'Medium',
    agentsRequired: ['Lead Enrichment Agent', 'Function Trigger Agent'],
    toolsNeeded: ['supabase', 'hubspot', 'google_sheets'],
    estimatedSetupTime: '15 minutes',
    businessImpact: 'Maintain 99% clean data without manual cleanup',
    complexity: 'Intermediate',
    realWorldExample: 'AI identifies and merges duplicate John Smith records from different sources',
    successMetrics: ['99% data cleanliness', '95% dedup accuracy', '0 manual cleanup'],
    roi: '500% improvement in data quality'
  },
  {
    id: 'import-messy-spreadsheets',
    category: 'Admin',
    title: 'Import messy spreadsheets and tag them automatically',
    description: 'Bulk upload and enrichment with intelligent data formatting',
    priority: 'Low',
    agentsRequired: ['Lead Enrichment Agent', 'Structured Output Agent', 'Function Trigger Agent'],
    toolsNeeded: ['google_sheets', 'supabase', 'openai'],
    estimatedSetupTime: '20 minutes',
    businessImpact: 'Import and clean 1000+ leads in minutes instead of hours',
    complexity: 'Advanced',
    realWorldExample: 'Upload messy CSV with mixed formats, AI cleans and enriches all 1000 records',
    successMetrics: ['1000+ leads processed', '95% format accuracy', '90% enrichment success'],
    roi: '2000% time savings on data import'
  },

  // AI-NATIVE GOALS (2)
  {
    id: 'talk-to-crm-voice',
    category: 'AI-Native',
    title: 'Talk to CRM with voice or commands',
    description: 'Natural-language control of your entire CRM through voice or chat',
    priority: 'High',
    agentsRequired: ['Whisper Listener Agent', 'Command Analyzer Agent', 'Voice Output Agent', 'Function Trigger Agent'],
    toolsNeeded: ['whisper', 'elevenlabs', 'supabase', 'openai'],
    estimatedSetupTime: '15 minutes',
    businessImpact: 'Control your entire CRM 10x faster with natural language',
    complexity: 'Advanced',
    realWorldExample: 'Say "Show me hot leads from this week" and watch results appear instantly',
    successMetrics: ['10x faster CRM control', '95% voice accuracy', '100% command coverage'],
    roi: '1000% improvement in CRM efficiency'
  },
  {
    id: 'ai-manages-full-cycle',
    category: 'AI-Native',
    title: 'Let AI manage entire sales cycle from cold to close',
    description: 'True hands-off selling with AI handling every step autonomously',
    priority: 'High',
    agentsRequired: ['AI SDR Agent', 'AI AE Agent', 'Cold Outreach Closer Agent', 'Objection Handler Agent', 'Timeline Logger Agent'],
    toolsNeeded: ['gmail', 'zoom', 'stripe', 'supabase', 'openai'],
    estimatedSetupTime: '45 minutes',
    businessImpact: 'Run a completely autonomous sales machine that closes deals 24/7',
    complexity: 'Advanced',
    realWorldExample: 'AI finds lead, nurtures them, handles objections, sends proposal, closes deal',
    successMetrics: ['100% autonomous operation', '24/7 selling', '75% human-level performance'],
    roi: '5000% increase in sales capacity'
  }
];

// Helper functions for goal management
export function getGoalsByCategory(category: string): Goal[] {
  return allGoals.filter(goal => goal.category.toLowerCase() === category.toLowerCase());
}

export function getGoalsByPriority(priority: 'High' | 'Medium' | 'Low'): Goal[] {
  return allGoals.filter(goal => goal.priority === priority);
}

export function getGoalsByComplexity(complexity: 'Simple' | 'Intermediate' | 'Advanced'): Goal[] {
  return allGoals.filter(goal => goal.complexity === complexity);
}

export function getGoalsRequiringAgent(agentName: string): Goal[] {
  return allGoals.filter(goal => 
    goal.agentsRequired.some(agent => 
      agent.toLowerCase().includes(agentName.toLowerCase())
    )
  );
}

export function getGoalsUsingTool(toolName: string): Goal[] {
  return allGoals.filter(goal => 
    goal.toolsNeeded.some(tool => 
      tool.toLowerCase().includes(toolName.toLowerCase())
    )
  );
}

export function getRecommendedGoalsForUser(userProfile: {
  businessType: string;
  teamSize: string;
  experience: string;
}): Goal[] {
  // Simple recommendation logic - can be enhanced with ML later
  const { businessType, teamSize, experience } = userProfile;
  
  let recommended = allGoals.filter(goal => goal.priority === 'High');
  
  if (experience === 'beginner') {
    recommended = recommended.filter(goal => goal.complexity === 'Simple');
  }
  
  if (teamSize === 'small') {
    recommended = recommended.filter(goal => 
      goal.estimatedSetupTime.includes('minutes') && 
      parseInt(goal.estimatedSetupTime) <= 20
    );
  }
  
  return recommended.slice(0, 6);
}