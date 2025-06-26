import React from 'react';
import { ArrowRight, Bot, Zap, Target, CheckCircle } from 'lucide-react';

const steps = [
  {
    number: '01',
    title: 'One-Click Setup',
    description: 'Install the AI Agent Suite directly into your SmartCRM with zero configuration required.',
    icon: Bot,
    color: 'blue'
  },
  {
    number: '02',
    title: 'Connect Your Tools',
    description: 'OAuth integration with Gmail, Slack, Zoom, Trello, and 50+ other business tools.',
    icon: Zap,
    color: 'purple'
  },
  {
    number: '03',
    title: 'Agents Take Action',
    description: 'AI agents analyze your CRM data and execute tasks across all connected platforms.',
    icon: Target,
    color: 'orange'
  },
  {
    number: '04',
    title: 'Results & Analytics',
    description: 'Track performance, export reports, and optimize your AI-powered sales workflows.',
    icon: CheckCircle,
    color: 'green'
  }
];

const HowItWorks = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold text-white mb-4">
          How It Works
        </h2>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
          Get your AI agent team up and running in minutes, not months. 
          Our plug-and-play architecture means you're productive from day one.
        </p>
      </div>

      <div className="relative">
        {/* Connection Lines */}
        <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent transform -translate-y-1/2"></div>
        
        <div className="grid lg:grid-cols-4 gap-8">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            const getColorClasses = (color: string) => {
              const colors = {
                blue: 'from-blue-500 to-blue-600',
                purple: 'from-purple-500 to-purple-600',
                orange: 'from-orange-500 to-orange-600',
                green: 'from-green-500 to-green-600'
              };
              return colors[color as keyof typeof colors];
            };

            return (
              <div key={index} className="relative">
                <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8 text-center group hover:border-blue-500/30 transition-all duration-300">
                  {/* Step Number */}
                  <div className="text-6xl font-bold text-slate-700/50 mb-4 group-hover:text-slate-600/50 transition-colors">
                    {step.number}
                  </div>

                  {/* Icon */}
                  <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${getColorClasses(step.color)} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="h-8 w-8 text-white" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-semibold text-white mb-4 group-hover:text-blue-300 transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {step.description}
                  </p>

                  {/* Arrow (for larger screens) */}
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                      <ArrowRight className="h-6 w-6 text-blue-400" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Implementation Timeline */}
      <div className="mt-20 bg-gradient-to-r from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8">
        <h3 className="text-2xl font-bold text-white text-center mb-8">
          Implementation Timeline
        </h3>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-4xl font-bold text-green-400 mb-2">5 min</div>
            <div className="text-lg font-medium text-white mb-2">Installation</div>
            <div className="text-sm text-gray-400">Plug-and-play setup</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-400 mb-2">15 min</div>
            <div className="text-lg font-medium text-white mb-2">Configuration</div>
            <div className="text-sm text-gray-400">Connect your tools</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-purple-400 mb-2">Live</div>
            <div className="text-lg font-medium text-white mb-2">Go Live</div>
            <div className="text-sm text-gray-400">Agents start working</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;