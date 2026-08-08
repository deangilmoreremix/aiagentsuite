import { useState, useEffect } from 'react';
import { 
  Bot, 
  Sparkles, 
  ArrowRight,
  Play,
  Brain,
  Zap,
  Star
} from 'lucide-react';

const Hero = () => {
  const [typedText, setTypedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const phrases = [
    'AI agents that work 24/7',
    'Automated sales workflows',
    'Intelligent lead scoring',
    'Personalized email campaigns'
  ];

  useEffect(() => {
    const currentPhrase = phrases[currentIndex];
    let charIndex = 0;

    const typeTimer = setInterval(() => {
      if (charIndex <= currentPhrase.length) {
        setTypedText(currentPhrase.slice(0, charIndex));
        charIndex++;
      } else {
        clearInterval(typeTimer);
        setTimeout(() => {
          setCurrentIndex((prevIndex) => (prevIndex + 1) % phrases.length);
        }, 2000);
      }
    }, 100);

    return () => clearInterval(typeTimer);
  }, [currentIndex]);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 25% 25%, #3b82f6 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-20 animate-float">
        <div className="p-4 rounded-full bg-blue-500/10 border border-blue-400/30">
          <Bot className="h-8 w-8 text-blue-400" />
        </div>
      </div>
      
      <div className="absolute top-40 right-32 animate-float" style={{animationDelay: '2s'}}>
        <div className="p-3 rounded-full bg-purple-500/10 border border-purple-400/30">
          <Brain className="h-6 w-6 text-purple-400" />
        </div>
      </div>

      <div className="absolute bottom-32 left-32 animate-float" style={{animationDelay: '1s'}}>
        <div className="p-3 rounded-full bg-green-500/10 border border-green-400/30">
          <Zap className="h-6 w-6 text-green-400" />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="mb-8">
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 rounded-full px-6 py-3 mb-8">
            <Star className="h-5 w-5 text-yellow-400" />
            <span className="text-white font-medium">World's First Multi-Agent Sales Automation Platform</span>
            <Sparkles className="h-4 w-4 text-blue-400" />
          </div>
        </div>

        <h1 className="text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
          Transform Your CRM with{' '}
          <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            AI Agents
          </span>
        </h1>

        <div className="text-2xl lg:text-3xl text-gray-300 mb-8 h-20 flex items-center justify-center">
          <span className="min-h-[1em]">
            {typedText}
            <span className="animate-pulse">|</span>
          </span>
        </div>

        <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
          Deploy 15+ specialized AI agents that work together to automate your entire sales process. 
          From lead generation to deal closing - your AI team never sleeps.
        </p>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-400 mb-2">15+</div>
            <div className="text-gray-300">AI Agents</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-green-400 mb-2">98.2%</div>
            <div className="text-gray-300">Success Rate</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-purple-400 mb-2">24/7</div>
            <div className="text-gray-300">Always Active</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-orange-400 mb-2">10x</div>
            <div className="text-gray-300">Productivity</div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
          <button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-xl">
            <span className="flex items-center gap-3">
              <Play className="h-6 w-6" />
              Try Interactive Demo
              <Sparkles className="h-5 w-5" />
            </span>
          </button>
          
          <button className="px-8 py-4 border-2 border-blue-500/50 text-blue-400 hover:bg-blue-500/10 rounded-xl font-semibold text-lg transition-all duration-300 hover:border-blue-400">
            <span className="flex items-center gap-3">
              <Bot className="h-6 w-6" />
              View AI Agents
              <ArrowRight className="h-5 w-5" />
            </span>
          </button>
        </div>

        {/* Feature Highlights */}
        <div className="grid md:grid-cols-3 gap-8 text-left">
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
            <div className="p-3 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 w-fit mb-4">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">15+ Specialized Agents</h3>
            <p className="text-gray-300">Each agent masters specific sales tasks - from lead generation to objection handling.</p>
          </div>

          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
            <div className="p-3 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 w-fit mb-4">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">GPT-4 Powered</h3>
            <p className="text-gray-300">Latest AI models for intelligent reasoning, planning, and natural conversations.</p>
          </div>

          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
            <div className="p-3 rounded-lg bg-gradient-to-r from-green-500 to-green-600 w-fit mb-4">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Real Tool Integration</h3>
            <p className="text-gray-300">Actually sends emails, books meetings, and updates your CRM with real results.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;