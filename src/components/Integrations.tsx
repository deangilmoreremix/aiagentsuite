import React, { useState } from 'react';
import { Check, Search, Filter, Grid, List } from 'lucide-react';

const integrations = [
  {
    name: 'Gmail',
    category: 'Email',
    logo: '📧',
    description: 'Send personalized emails, manage threads, track opens',
    status: 'active'
  },
  {
    name: 'Slack',
    category: 'Communication',
    logo: '💬',
    description: 'Post messages, create channels, manage notifications',
    status: 'active'
  },
  {
    name: 'Zoom',
    category: 'Video',
    logo: '📹',
    description: 'Schedule meetings, create rooms, manage recordings',
    status: 'active'
  },
  {
    name: 'Google Calendar',
    category: 'Calendar',
    logo: '📅',
    description: 'Schedule events, check availability, send invites',
    status: 'active'
  },
  {
    name: 'Trello',
    category: 'Project Management',
    logo: '📋',
    description: 'Create boards, manage cards, track progress',
    status: 'active'
  },
  {
    name: 'Stripe',
    category: 'Payments',
    logo: '💳',
    description: 'Process payments, manage subscriptions, track revenue',
    status: 'active'
  },
  {
    name: 'Shopify',
    category: 'E-commerce',
    logo: '🛒',
    description: 'Manage products, orders, customer data',
    status: 'active'
  },
  {
    name: 'WhatsApp',
    category: 'Messaging',
    logo: '📱',
    description: 'Send messages, manage contacts, broadcast updates',
    status: 'active'
  },
  {
    name: 'LinkedIn',
    category: 'Social',
    logo: '💼',
    description: 'Connect with prospects, send messages, post content',
    status: 'coming-soon'
  },
  {
    name: 'HubSpot',
    category: 'CRM',
    logo: '🎯',
    description: 'Sync contacts, deals, and pipeline data',
    status: 'coming-soon'
  },
  {
    name: 'Salesforce',
    category: 'CRM',
    logo: '☁️',
    description: 'Integrate with Salesforce CRM and Sales Cloud',
    status: 'coming-soon'
  },
  {
    name: 'Microsoft Teams',
    category: 'Communication',
    logo: '🤝',
    description: 'Schedule meetings, send messages, share files',
    status: 'coming-soon'
  }
];

const categories = ['All', 'Email', 'Communication', 'Video', 'Calendar', 'Project Management', 'Payments', 'E-commerce', 'Messaging', 'Social', 'CRM'];

const Integrations = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredIntegrations = selectedCategory === 'All' 
    ? integrations 
    : integrations.filter(integration => integration.category === selectedCategory);

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold text-white mb-4">
          250+ Tool Integrations
        </h2>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
          Your agents work across your entire tech stack. One-click OAuth setup 
          connects to all your favorite business tools.
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap justify-center gap-3 mb-12">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
              selectedCategory === category
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-slate-800/50 text-gray-300 hover:bg-slate-700/50 hover:text-white'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Integration Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredIntegrations.map((integration, index) => (
          <div
            key={index}
            className={`relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-xl border p-6 transition-all duration-300 transform hover:scale-105 ${
              integration.status === 'active'
                ? 'border-slate-700/50 hover:border-blue-500/30 hover:shadow-xl'
                : 'border-yellow-500/30 hover:border-yellow-400/50'
            }`}
          >
            {/* Status Badge */}
            <div className="absolute top-3 right-3">
              {integration.status === 'active' ? (
                <div className="flex items-center gap-1 bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs font-medium">
                  <Check className="h-3 w-3" />
                  Active
                </div>
              ) : (
                <div className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full text-xs font-medium">
                  Coming Soon
                </div>
              )}
            </div>

            {/* Integration Info */}
            <div className="mb-4">
              <div className="text-4xl mb-3">{integration.logo}</div>
              <h3 className="text-lg font-semibold text-white mb-1">
                {integration.name}
              </h3>
              <div className="text-sm text-blue-400 mb-3">
                {integration.category}
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">
                {integration.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* OAuth Setup Info */}
      <div className="mt-16 bg-gradient-to-r from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-white mb-4">
            Secure OAuth Integration
          </h3>
          <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
            All integrations use industry-standard OAuth 2.0 authentication. 
            Your credentials are never stored - only secure access tokens that you can revoke anytime.
          </p>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-center justify-center gap-3 p-4 bg-slate-700/30 rounded-lg">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-white font-medium">Encrypted Connections</span>
            </div>
            <div className="flex items-center justify-center gap-3 p-4 bg-slate-700/30 rounded-lg">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span className="text-white font-medium">Revocable Access</span>
            </div>
            <div className="flex items-center justify-center gap-3 p-4 bg-slate-700/30 rounded-lg">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <span className="text-white font-medium">GDPR Compliant</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Integrations;