import React, { useState } from 'react';
import { Check, Zap, Crown, Rocket, ArrowRight } from 'lucide-react';

const plans = [
  {
    name: 'Starter',
    price: 97,
    period: 'month',
    description: 'Perfect for small teams getting started with AI automation',
    icon: Zap,
    color: 'blue',
    features: [
      '5 AI Agents included',
      '1,000 actions per month',
      '10 tool integrations',
      'Email support',
      'Basic analytics',
      'CRM integration'
    ],
    cta: 'Try Interactive Demo',
    popular: false
  },
  {
    name: 'Professional',
    price: 197,
    period: 'month',
    description: 'Ideal for growing businesses ready to scale with AI',
    icon: Crown,
    color: 'purple',
    features: [
      '15 AI Agents included',
      '10,000 actions per month',
      '50+ tool integrations',
      'Priority support',
      'Advanced analytics',
      'Custom agent training',
      'Voice & vision features',
      'Multi-team collaboration'
    ],
    cta: 'Try Interactive Demo',
    popular: true
  },
  {
    name: 'Enterprise',
    price: 497,
    period: 'month',
    description: 'For organizations requiring maximum AI automation power',
    icon: Rocket,
    color: 'orange',
    features: [
      'All 15+ AI Agents',
      'Unlimited actions',
      'All integrations',
      'Dedicated support',
      'Custom reporting',
      'White-label options',
      'API access',
      'Custom agent development',
      'SLA guarantee'
    ],
    cta: 'Contact Sales',
    popular: false
  }
];

const Pricing = () => {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'from-blue-500 to-blue-600',
      purple: 'from-purple-500 to-purple-600',
      orange: 'from-orange-500 to-orange-600'
    };
    return colors[color as keyof typeof colors];
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold text-white mb-4">
          Simple, Transparent Pricing
        </h2>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
          Choose the plan that fits your business. All plans include a 14-day free trial 
          with full access to features.
        </p>

        {/* Billing Toggle */}
        <div className="inline-flex items-center bg-slate-800/50 rounded-lg p-1 border border-slate-700/50">
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={`px-4 py-2 rounded-md font-medium transition-all duration-300 ${
              billingPeriod === 'monthly'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingPeriod('yearly')}
            className={`px-4 py-2 rounded-md font-medium transition-all duration-300 ${
              billingPeriod === 'yearly'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            Yearly
            <span className="ml-2 text-xs bg-green-500 text-white px-2 py-1 rounded-full">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {plans.map((plan, index) => {
          const IconComponent = plan.icon;
          const yearlyPrice = Math.round(plan.price * 0.8);
          const displayPrice = billingPeriod === 'yearly' ? yearlyPrice : plan.price;

          return (
            <div
              key={index}
              className={`relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl border p-8 transition-all duration-300 transform hover:scale-105 ${
                plan.popular
                  ? 'border-purple-500/50 shadow-purple-500/20 shadow-2xl'
                  : 'border-slate-700/50 hover:border-blue-500/30'
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </div>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-8">
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${getColorClasses(plan.color)} mb-4`}>
                  <IconComponent className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-gray-300 text-sm mb-4">{plan.description}</p>
                
                <div className="mb-4">
                  <span className="text-4xl font-bold text-white">${displayPrice}</span>
                  <span className="text-gray-400 ml-2">/{plan.period}</span>
                  {billingPeriod === 'yearly' && (
                    <div className="text-sm text-green-400 mt-1">
                      Save ${(plan.price - yearlyPrice) * 12}/year
                    </div>
                  )}
                </div>
              </div>

              {/* Features */}
              <div className="space-y-3 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-400 flex-shrink-0" />
                    <span className="text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <button
                className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 ${
                  plan.popular
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl'
                    : `bg-gradient-to-r ${getColorClasses(plan.color)} hover:shadow-lg text-white`
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  {plan.cta}
                  <ArrowRight className="h-4 w-4" />
                </span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Money Back Guarantee */}
      <div className="mt-16 text-center">
        <div className="bg-gradient-to-r from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8">
          <h3 className="text-2xl font-bold text-white mb-4">
            30-Day Money-Back Guarantee
          </h3>
          <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
            Try SmartCRM AI Agent Suite completely risk-free. If you're not satisfied 
            within 30 days, we'll refund your money, no questions asked.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-3xl mb-2">🚀</div>
              <div className="text-white font-medium">14-Day Free Trial</div>
              <div className="text-sm text-gray-400">Full feature access</div>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">💳</div>
              <div className="text-white font-medium">No Setup Fees</div>
              <div className="text-sm text-gray-400">Start immediately</div>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">🔒</div>
              <div className="text-white font-medium">Cancel Anytime</div>
              <div className="text-sm text-gray-400">No long-term contracts</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;