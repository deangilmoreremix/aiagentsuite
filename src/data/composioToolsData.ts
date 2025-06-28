export interface ComposioTool {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  status: 'active' | 'coming-soon';
  popularityScore?: number;
  setupTime?: string;
  useCases?: string[];
  authType?: 'oauth' | 'apiKey' | 'both';
}

export interface ComposioToolCategory {
  id: string;
  name: string;
  description: string;
  iconText: string;
  color: string;
  count: number;
}

// Tool categories
export const composioToolCategories: ComposioToolCategory[] = [
  {
    id: 'email',
    name: 'Email & Communication',
    description: 'Send emails, manage campaigns, and track engagement',
    iconText: '📧',
    color: 'blue',
    count: 12
  },
  {
    id: 'calendar',
    name: 'Calendar & Scheduling',
    description: 'Book meetings, manage availability, and send invites',
    iconText: '📅',
    color: 'purple',
    count: 8
  },
  {
    id: 'crm',
    name: 'CRM & Sales',
    description: 'Manage leads, track deals, and update contacts',
    iconText: '🏢',
    color: 'green',
    count: 15
  },
  {
    id: 'productivity',
    name: 'Productivity & Project',
    description: 'Track tasks, manage projects, and improve workflows',
    iconText: '✅',
    color: 'orange',
    count: 18
  },
  {
    id: 'social',
    name: 'Social Media & Marketing',
    description: 'Post updates, run campaigns, and track performance',
    iconText: '📱',
    color: 'pink',
    count: 21
  },
  {
    id: 'messaging',
    name: 'Messaging & Chat',
    description: 'Send instant messages, chat with teams, and manage channels',
    iconText: '💬',
    color: 'teal',
    count: 14
  },
  {
    id: 'content',
    name: 'Content & Documents',
    description: 'Create, manage and share documents and content',
    iconText: '📄',
    color: 'red',
    count: 10
  },
  {
    id: 'ecommerce',
    name: 'E-commerce & Payments',
    description: 'Sell products, process payments, and manage inventory',
    iconText: '🛒',
    color: 'indigo',
    count: 16
  },
  {
    id: 'analytics',
    name: 'Analytics & Data',
    description: 'Track metrics, analyze data, and generate reports',
    iconText: '📊',
    color: 'yellow',
    count: 12
  },
  {
    id: 'developer',
    name: 'Developer Tools',
    description: 'APIs, webhooks, and technical integrations',
    iconText: '⚙️',
    color: 'cyan',
    count: 11
  }
];

// Comprehensive list of Composio integrations
export const composioTools: ComposioTool[] = [
  // Email & Communication
  {
    id: 'gmail',
    name: 'Gmail',
    category: 'email',
    description: 'Send personalized emails, manage threads, track opens, and handle attachments',
    icon: '📧',
    status: 'active',
    popularityScore: 98,
    authType: 'oauth',
    setupTime: '2 min',
    useCases: ['Cold outreach', 'Follow-ups', 'Newsletters']
  },
  {
    id: 'outlook',
    name: 'Microsoft Outlook',
    category: 'email',
    description: 'Connect to Outlook for email sending, scheduling, and calendar management',
    icon: '📨',
    status: 'active',
    popularityScore: 92,
    authType: 'oauth',
    setupTime: '3 min',
    useCases: ['Enterprise emails', 'Office365 integration']
  },
  {
    id: 'mailchimp',
    name: 'Mailchimp',
    category: 'email',
    description: 'Create and manage email campaigns, lists, templates, and automation workflows',
    icon: '📬',
    status: 'active',
    popularityScore: 89,
    authType: 'apiKey',
    setupTime: '5 min',
    useCases: ['Email marketing', 'Newsletter automation']
  },
  {
    id: 'sendgrid',
    name: 'SendGrid',
    category: 'email',
    description: 'Send transactional and marketing emails with high deliverability',
    icon: '📩',
    status: 'active',
    popularityScore: 88,
    authType: 'apiKey',
    setupTime: '5 min',
    useCases: ['Transactional emails', 'Mass sending']
  },
  
  // Calendar & Scheduling
  {
    id: 'google_calendar',
    name: 'Google Calendar',
    category: 'calendar',
    description: 'Schedule meetings, check availability, and manage events across calendars',
    icon: '📅',
    status: 'active',
    popularityScore: 96,
    authType: 'oauth',
    setupTime: '2 min',
    useCases: ['Meeting scheduling', 'Availability checks']
  },
  {
    id: 'calendly',
    name: 'Calendly',
    category: 'calendar',
    description: 'Set availability and let others book times with your automated scheduling pages',
    icon: '🗓️',
    status: 'active',
    popularityScore: 90,
    authType: 'apiKey',
    setupTime: '3 min',
    useCases: ['Automated booking', 'Scheduling pages']
  },
  {
    id: 'outlook_calendar',
    name: 'Outlook Calendar',
    category: 'calendar',
    description: 'Manage events, meetings, and schedules in Microsoft's ecosystem',
    icon: '📆',
    status: 'active',
    popularityScore: 87,
    authType: 'oauth',
    setupTime: '3 min',
    useCases: ['Corporate scheduling', 'Team availability']
  },
  
  // CRM & Sales
  {
    id: 'hubspot',
    name: 'HubSpot',
    category: 'crm',
    description: 'Manage contacts, deals, and marketing automation in one platform',
    icon: '🏢',
    status: 'active',
    popularityScore: 95,
    authType: 'oauth',
    setupTime: '5 min',
    useCases: ['Contact management', 'Deal tracking']
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    category: 'crm',
    description: 'Enterprise CRM for sales, service, and marketing automation',
    icon: '☁️',
    status: 'active',
    popularityScore: 93,
    authType: 'oauth',
    setupTime: '8 min',
    useCases: ['Enterprise sales', 'Advanced pipeline management']
  },
  {
    id: 'pipedrive',
    name: 'Pipedrive',
    category: 'crm',
    description: 'Sales CRM designed for ease-of-use and pipeline visualization',
    icon: '🔄',
    status: 'active',
    popularityScore: 87,
    authType: 'apiKey',
    setupTime: '4 min',
    useCases: ['Visual pipeline', 'Sales management']
  },
  {
    id: 'zoho_crm',
    name: 'Zoho CRM',
    category: 'crm',
    description: 'Manage your sales, marketing, and support in one CRM platform',
    icon: '📊',
    status: 'active',
    popularityScore: 85,
    authType: 'oauth',
    setupTime: '5 min',
    useCases: ['SMB sales automation', 'Lead management']
  },
  
  // Productivity & Project Management
  {
    id: 'trello',
    name: 'Trello',
    category: 'productivity',
    description: 'Visual project management with boards, cards, and lists',
    icon: '📋',
    status: 'active',
    popularityScore: 94,
    authType: 'oauth',
    setupTime: '3 min',
    useCases: ['Visual task management', 'Kanban workflows']
  },
  {
    id: 'asana',
    name: 'Asana',
    category: 'productivity',
    description: 'Track, organize, and manage work across teams',
    icon: '✅',
    status: 'active',
    popularityScore: 92,
    authType: 'oauth',
    setupTime: '4 min',
    useCases: ['Project timelines', 'Task assignments']
  },
  {
    id: 'notion',
    name: 'Notion',
    category: 'productivity',
    description: 'All-in-one workspace for notes, docs, wikis, and projects',
    icon: '📝',
    status: 'active',
    popularityScore: 91,
    authType: 'oauth',
    setupTime: '4 min',
    useCases: ['Knowledge management', 'Project planning']
  },
  {
    id: 'monday',
    name: 'Monday.com',
    category: 'productivity',
    description: 'Work OS for teams to run processes, projects, and workflows',
    icon: '📅',
    status: 'active',
    popularityScore: 88,
    authType: 'oauth',
    setupTime: '5 min',
    useCases: ['Team coordination', 'Visual workflows']
  },
  
  // Social Media & Marketing
  {
    id: 'linkedin',
    name: 'LinkedIn',
    category: 'social',
    description: 'Connect with professional contacts, share updates, and engage with content',
    icon: '💼',
    status: 'active',
    popularityScore: 96,
    authType: 'oauth',
    setupTime: '4 min',
    useCases: ['B2B networking', 'Professional updates']
  },
  {
    id: 'twitter',
    name: 'Twitter',
    category: 'social',
    description: 'Post tweets, engage with followers, and track mentions',
    icon: '🐦',
    status: 'active',
    popularityScore: 91,
    authType: 'oauth',
    setupTime: '3 min',
    useCases: ['Social engagement', 'Trend monitoring']
  },
  {
    id: 'facebook',
    name: 'Facebook',
    category: 'social',
    description: 'Manage pages, post updates, and engage with your audience',
    icon: '👤',
    status: 'active',
    popularityScore: 90,
    authType: 'oauth',
    setupTime: '4 min',
    useCases: ['Community management', 'Social content']
  },
  {
    id: 'facebook_ads',
    name: 'Facebook Ads',
    category: 'social',
    description: 'Create and manage Facebook ad campaigns and analyze performance',
    icon: '📢',
    status: 'active',
    popularityScore: 88,
    authType: 'oauth',
    setupTime: '5 min',
    useCases: ['Ad campaigns', 'Audience targeting']
  },
  {
    id: 'instagram',
    name: 'Instagram',
    category: 'social',
    description: 'Share photos and videos, manage content, and engage with followers',
    icon: '📸',
    status: 'active',
    popularityScore: 93,
    authType: 'oauth',
    setupTime: '4 min',
    useCases: ['Visual content', 'Brand storytelling']
  },
  
  // Messaging & Chat
  {
    id: 'slack',
    name: 'Slack',
    category: 'messaging',
    description: 'Send messages, create channels, and manage notifications',
    icon: '💬',
    status: 'active',
    popularityScore: 97,
    authType: 'oauth',
    setupTime: '3 min',
    useCases: ['Team communication', 'Alert notifications']
  },
  {
    id: 'microsoft_teams',
    name: 'Microsoft Teams',
    category: 'messaging',
    description: 'Collaborate with team members, share files, and manage meetings',
    icon: '👥',
    status: 'active',
    popularityScore: 89,
    authType: 'oauth',
    setupTime: '4 min',
    useCases: ['Enterprise collaboration', 'Office integration']
  },
  {
    id: 'whatsapp_business',
    name: 'WhatsApp Business',
    category: 'messaging',
    description: 'Send messages, create templates, and engage with customers',
    icon: '📱',
    status: 'active',
    popularityScore: 94,
    authType: 'apiKey',
    setupTime: '6 min',
    useCases: ['Customer messaging', 'Quick responses']
  },
  {
    id: 'discord',
    name: 'Discord',
    category: 'messaging',
    description: 'Create servers, send messages, and manage communities',
    icon: '🎮',
    status: 'active',
    popularityScore: 86,
    authType: 'oauth',
    setupTime: '4 min',
    useCases: ['Community building', 'Group discussions']
  },
  {
    id: 'telegram',
    name: 'Telegram',
    category: 'messaging',
    description: 'Send messages, create bots, and manage group chats',
    icon: '✈️',
    status: 'active',
    popularityScore: 85,
    authType: 'apiKey',
    setupTime: '5 min',
    useCases: ['Bot automation', 'Broadcast channels']
  },
  
  // Video & Meeting
  {
    id: 'zoom',
    name: 'Zoom',
    category: 'calendar',
    description: 'Create meetings, manage participants, and handle recordings',
    icon: '📹',
    status: 'active',
    popularityScore: 95,
    authType: 'oauth',
    setupTime: '4 min',
    useCases: ['Virtual meetings', 'Webinars']
  },
  {
    id: 'google_meet',
    name: 'Google Meet',
    category: 'calendar',
    description: 'Schedule video conferences and manage participants',
    icon: '🎦',
    status: 'active',
    popularityScore: 87,
    authType: 'oauth',
    setupTime: '3 min',
    useCases: ['Team meetings', 'Video calls']
  },
  
  // Content & Documents
  {
    id: 'google_sheets',
    name: 'Google Sheets',
    category: 'content',
    description: 'Create, edit, and manage spreadsheets with real-time collaboration',
    icon: '📊',
    status: 'active',
    popularityScore: 96,
    authType: 'oauth',
    setupTime: '3 min',
    useCases: ['Data management', 'Reports', 'Calculations']
  },
  {
    id: 'google_docs',
    name: 'Google Docs',
    category: 'content',
    description: 'Create and edit documents with collaborative features',
    icon: '📄',
    status: 'active',
    popularityScore: 94,
    authType: 'oauth',
    setupTime: '3 min',
    useCases: ['Document creation', 'Team editing']
  },
  {
    id: 'google_drive',
    name: 'Google Drive',
    category: 'content',
    description: 'Store, access, and share files and folders in the cloud',
    icon: '📁',
    status: 'active',
    popularityScore: 93,
    authType: 'oauth',
    setupTime: '3 min',
    useCases: ['File storage', 'Document sharing']
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    category: 'content',
    description: 'Store and share files, folders, and documents',
    icon: '📦',
    status: 'active',
    popularityScore: 90,
    authType: 'oauth',
    setupTime: '4 min',
    useCases: ['File sharing', 'Backup solutions']
  },
  
  // E-commerce & Payments
  {
    id: 'shopify',
    name: 'Shopify',
    category: 'ecommerce',
    description: 'Manage products, orders, customers, and e-commerce operations',
    icon: '🛒',
    status: 'active',
    popularityScore: 93,
    authType: 'oauth',
    setupTime: '6 min',
    useCases: ['Order management', 'Product listings']
  },
  {
    id: 'stripe',
    name: 'Stripe',
    category: 'ecommerce',
    description: 'Process payments, manage subscriptions, and handle invoices',
    icon: '💳',
    status: 'active',
    popularityScore: 96,
    authType: 'apiKey',
    setupTime: '5 min',
    useCases: ['Payment processing', 'Subscription management']
  },
  {
    id: 'paypal',
    name: 'PayPal',
    category: 'ecommerce',
    description: 'Send invoices, receive payments, and manage transactions',
    icon: '💲',
    status: 'active',
    popularityScore: 91,
    authType: 'oauth',
    setupTime: '5 min',
    useCases: ['Payment collection', 'Money transfers']
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    category: 'ecommerce',
    description: 'Manage your WordPress-based online store',
    icon: '🏪',
    status: 'active',
    popularityScore: 88,
    authType: 'apiKey',
    setupTime: '7 min',
    useCases: ['WordPress stores', 'Product management']
  },
  
  // Analytics & Data
  {
    id: 'google_analytics',
    name: 'Google Analytics',
    category: 'analytics',
    description: 'Track website traffic, user behavior, and conversion metrics',
    icon: '📈',
    status: 'active',
    popularityScore: 92,
    authType: 'oauth',
    setupTime: '5 min',
    useCases: ['Website analytics', 'User tracking']
  },
  {
    id: 'amplitude',
    name: 'Amplitude',
    category: 'analytics',
    description: 'Product analytics for understanding user behavior',
    icon: '📊',
    status: 'active',
    popularityScore: 84,
    authType: 'apiKey',
    setupTime: '6 min',
    useCases: ['User journey analysis', 'Behavior tracking']
  },
  {
    id: 'mixpanel',
    name: 'Mixpanel',
    category: 'analytics',
    description: 'Product analytics to track user interactions and events',
    icon: '📉',
    status: 'active',
    popularityScore: 83,
    authType: 'apiKey',
    setupTime: '6 min',
    useCases: ['Event tracking', 'Conversion analysis']
  },
  
  // Developer Tools
  {
    id: 'github',
    name: 'GitHub',
    category: 'developer',
    description: 'Manage repositories, issues, and pull requests',
    icon: '🐙',
    status: 'active',
    popularityScore: 95,
    authType: 'oauth',
    setupTime: '4 min',
    useCases: ['Code management', 'Issue tracking']
  },
  {
    id: 'jira',
    name: 'Jira',
    category: 'developer',
    description: 'Track issues, manage projects, and coordinate software development',
    icon: '🔄',
    status: 'active',
    popularityScore: 91,
    authType: 'oauth',
    setupTime: '5 min',
    useCases: ['Project tracking', 'Issue management']
  },
  {
    id: 'twilio',
    name: 'Twilio',
    category: 'messaging',
    description: 'Send SMS, make calls, and build communication apps',
    icon: '📞',
    status: 'active',
    popularityScore: 90,
    authType: 'apiKey',
    setupTime: '6 min',
    useCases: ['SMS notifications', 'Voice calling']
  },
  {
    id: 'airtable',
    name: 'Airtable',
    category: 'productivity',
    description: 'Flexible database with spreadsheet interface',
    icon: '📓',
    status: 'active',
    popularityScore: 89,
    authType: 'apiKey',
    setupTime: '4 min',
    useCases: ['Database management', 'Project organization']
  },
  {
    id: 'webflow',
    name: 'Webflow',
    category: 'content',
    description: 'Design and build responsive websites visually',
    icon: '🌐',
    status: 'active',
    popularityScore: 85,
    authType: 'oauth',
    setupTime: '5 min',
    useCases: ['Website updates', 'CMS management']
  },
  
  // Coming soon integrations
  {
    id: 'intercom',
    name: 'Intercom',
    category: 'crm',
    description: 'Customer messaging platform for sales, marketing, and support',
    icon: '💬',
    status: 'coming-soon',
    popularityScore: 88,
    authType: 'oauth',
    setupTime: '5 min',
    useCases: ['Customer support', 'In-app messaging']
  },
  {
    id: 'zendesk',
    name: 'Zendesk',
    category: 'crm',
    description: 'Customer service software and support ticket system',
    icon: '🎫',
    status: 'coming-soon',
    popularityScore: 87,
    authType: 'oauth',
    setupTime: '6 min',
    useCases: ['Help desk', 'Ticket management']
  },
  {
    id: 'quickbooks',
    name: 'QuickBooks',
    category: 'ecommerce',
    description: 'Accounting software for invoicing, payments, and financial reporting',
    icon: '📒',
    status: 'coming-soon',
    popularityScore: 86,
    authType: 'oauth',
    setupTime: '6 min',
    useCases: ['Accounting', 'Financial management']
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    category: 'social',
    description: 'Create and manage TikTok marketing campaigns',
    icon: '🎵',
    status: 'coming-soon',
    popularityScore: 89,
    authType: 'oauth',
    setupTime: '5 min',
    useCases: ['Video marketing', 'Trend leveraging']
  },
  {
    id: 'pinterest',
    name: 'Pinterest',
    category: 'social',
    description: 'Visual discovery engine for finding ideas and inspiration',
    icon: '📌',
    status: 'coming-soon',
    popularityScore: 83,
    authType: 'oauth',
    setupTime: '4 min',
    useCases: ['Visual marketing', 'Product discovery']
  }
];

// Helper functions

// Get tools by category
export const getToolsByCategory = (categoryId: string): ComposioTool[] => {
  if (categoryId === 'all') return composioTools;
  return composioTools.filter(tool => tool.category === categoryId);
};

// Get tools by status
export const getToolsByStatus = (status: 'active' | 'coming-soon'): ComposioTool[] => {
  return composioTools.filter(tool => tool.status === status);
};

// Get popular tools (top N by popularity score)
export const getPopularTools = (limit = 10): ComposioTool[] => {
  return [...composioTools]
    .filter(tool => tool.status === 'active')
    .sort((a, b) => (b.popularityScore || 0) - (a.popularityScore || 0))
    .slice(0, limit);
};

// Search tools by name or description
export const searchTools = (query: string): ComposioTool[] => {
  if (!query) return composioTools;
  
  const lowercaseQuery = query.toLowerCase();
  return composioTools.filter(
    tool => 
      tool.name.toLowerCase().includes(lowercaseQuery) || 
      tool.description.toLowerCase().includes(lowercaseQuery)
  );
};