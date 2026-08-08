import {
  Zap, 
  Brain, 
  Layers, 
  Settings, 
  Shield, 
  Rocket, 
  MessageSquare, 
  Database,
  Workflow,
  Users,
  BarChart3,
  Globe
} from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: '15+ Specialized Agents',
    description: 'From SDR outreach to objection handling, each agent is trained for specific sales tasks.',
    color: 'blue'
  },
  {
    icon: Brain,
    title: 'GPT-4o + Gemini Powered',
    description: 'Latest AI models for reasoning, planning, and natural language processing.',
    color: 'purple'
  },
  {
    icon: Layers,
    title: 'Embedded in CRM UI',
    description: 'Agents live directly in your Contacts, Deals, Calendar, and Campaign modules.',
    color: 'green'
  },
  {
    icon: Settings,
    title: 'Real Tool Execution',
    description: 'Actually sends emails via Gmail, schedules Zoom calls, updates Trello boards.',
    color: 'orange'
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'OAuth integration, encrypted data, and compliance-ready architecture.',
    color: 'red'
  },
  {
    icon: Rocket,
    title: 'One-Click Setup',
    description: 'Pre-integrated tool picker with automatic CRM injection. No coding needed.',
    color: 'teal'
  },
  {
    icon: MessageSquare,
    title: 'Voice + Vision Ready',
    description: 'ElevenLabs voice output and GPT Vision for multimedia interactions.',
    color: 'indigo'
  },
  {
    icon: Database,
    title: 'Context-Aware',
    description: 'Agents receive your full CRM data context for personalized responses.',
    color: 'pink'
  },
  {
    icon: Workflow,
    title: 'Multi-Agent Workflows',
    description: 'Agents collaborate and pass tasks to each other for complex automations.',
    color: 'amber'
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Share agent outputs, export reports, and maintain full audit trails.',
    color: 'cyan'
  },
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    description: 'Track agent performance, success rates, and ROI metrics in real-time.',
    color: 'emerald'
  },
  {
    icon: Globe,
    title: '50+ Integrations',
    description: 'Works with Gmail, Slack, Zoom, Trello, Stripe, Shopify, and many more.',
    color: 'violet'
  }
];

const getColorClasses = (color: string) => {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600',
    red: 'from-red-500 to-red-600',
    teal: 'from-teal-500 to-teal-600',
    indigo: 'from-indigo-500 to-indigo-600',
    pink: 'from-pink-500 to-pink-600',
    amber: 'from-amber-500 to-amber-600',
    cyan: 'from-cyan-500 to-cyan-600',
    emerald: 'from-emerald-500 to-emerald-600',
    violet: 'from-violet-500 to-violet-600'
  };
  return colors[color as keyof typeof colors];
};

const Features = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold text-white mb-4">
          Enterprise-Grade AI Sales Automation
        </h2>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
          Every feature designed to transform your CRM into a living, breathing AI sales machine.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {features.map((feature, index) => {
          const IconComponent = feature.icon;
          
          return (
            <div
              key={index}
              className="group relative bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:bg-slate-800/80 transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
            >
              <div className="mb-4">
                <div className={`inline-flex p-3 rounded-lg bg-gradient-to-r ${getColorClasses(feature.color)} group-hover:scale-110 transition-transform duration-300`}>
                  <IconComponent className="h-6 w-6 text-white" />
                </div>
              </div>
              
              <h3 className="text-lg font-semibold text-white mb-3 group-hover:text-blue-300 transition-colors">
                {feature.title}
              </h3>
              
              <p className="text-gray-300 text-sm leading-relaxed">
                {feature.description}
              </p>
              
              {/* Hover Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </div>
          );
        })}
      </div>

      {/* Stats Section */}
      <div className="mt-20 bg-gradient-to-r from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
              98.2%
            </div>
            <div className="text-gray-300 font-medium">Success Rate</div>
            <div className="text-sm text-gray-400">Agent task completion</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold bg-gradient-to-r from-green-400 to-teal-400 bg-clip-text text-transparent mb-2">
              0.8s
            </div>
            <div className="text-gray-300 font-medium">Response Time</div>
            <div className="text-sm text-gray-400">Average agent response</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent mb-2">
              10x
            </div>
            <div className="text-gray-300 font-medium">Productivity Gain</div>
            <div className="text-sm text-gray-400">vs manual processes</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
              24/7
            </div>
            <div className="text-gray-300 font-medium">Always Active</div>
            <div className="text-sm text-gray-400">Never miss an opportunity</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;