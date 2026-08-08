import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import InteractiveGoalExplorer from '../components/InteractiveGoalExplorer';
import EnhancedAIConsole from '../components/EnhancedAIConsole';
import CRMWorkspace from '../components/CRMWorkspace';
import Footer from '../components/Footer';
import HowToUse from '../components/HowToUse';
import ApiSetupGuide from '../components/ApiSetupGuide';
import { getDefaultMode, logApiStatus } from '../config/apiConfig';
import { 
  ArrowRight, 
  Sparkles, 
  Brain, 
  Target, 
  BarChart3, 
  Settings,
  Book,
  Bot
} from 'lucide-react';
import Tooltip from '../components/Tooltip';

const CoreInteractionPage = () => {
  const [globalRealMode, setGlobalRealMode] = useState(false);
  const [showHowToUse, setShowHowToUse] = useState(false);
  const [showApiSetup, setShowApiSetup] = useState(false);
  const [hasError, setHasError] = useState(false);
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Initialize with the appropriate mode based on API configuration
  useEffect(() => {
    try {
      console.log('🚀 Initializing Core Interaction Page...');
      
      const defaultMode = getDefaultMode();
      if (isMountedRef.current) {
        setGlobalRealMode(defaultMode);
      }
      logApiStatus();
      
      console.log('✅ Core page initialization complete');
    } catch (error) {
      console.error('❌ Core page initialization failed:', error);
      if (isMountedRef.current) {
        setHasError(true);
      }
    }
  }, []);

  const handleModeToggle = (mode: boolean) => {
    try {
      if (isMountedRef.current) {
        setGlobalRealMode(mode);
        console.log(`🔄 Mode switched to: ${mode ? '🔴 LIVE MODE' : '🔵 DEMO MODE'}`);
      }
    } catch (error) {
      console.error('❌ Mode toggle failed:', error);
    }
  };

  // Error state
  if (hasError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-blue-100 to-gray-100 dark:from-slate-900 dark:via-blue-900 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🔧</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Core Page Loading Error</h1>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            There was an issue initializing the core page. This might be due to configuration problems.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => {
                setHasError(false);
                window.location.reload();
              }}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Reload Page
            </button>
            <button
              onClick={() => setHasError(false)}
              className="px-6 py-3 border border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-blue-100 to-gray-100 dark:from-slate-900 dark:via-blue-900 dark:to-slate-900 transition-colors duration-300">
      
      {/* Fixed Top Navigation */}
      <div className="fixed top-4 right-4 z-40 flex items-center gap-3">
        {/* Mode Indicator */}
        <div className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all duration-300 ${
          globalRealMode 
            ? 'bg-red-500/20 dark:bg-red-400/20 border-red-400/30 dark:border-red-300/30 text-red-600 dark:text-red-200 shadow-lg shadow-red-500/20' 
            : 'bg-blue-500/20 dark:bg-blue-400/20 border-blue-400/30 dark:border-blue-300/30 text-blue-600 dark:text-blue-200 shadow-lg shadow-blue-500/20'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full animate-pulse ${
              globalRealMode ? 'bg-red-500 dark:bg-red-300' : 'bg-blue-500 dark:bg-blue-300'
            }`}></div>
            <span className="font-semibold">
              {globalRealMode ? '🔴 LIVE MODE' : '🔵 DEMO MODE'}
            </span>
          </div>
        </div>

        {/* Quick Access Buttons */}
        <Tooltip content="Advanced features and analytics" position="bottom">
          <Link
            to="/features-analytics"
            className="p-3 rounded-xl bg-orange-500/20 dark:bg-orange-400/20 border border-orange-400/30 dark:border-orange-300/30 text-orange-600 dark:text-orange-200 hover:bg-orange-500/30 dark:hover:bg-orange-400/30 transition-all duration-300"
          >
            <BarChart3 className="h-5 w-5" />
          </Link>
        </Tooltip>

        <Tooltip content="Setup guide and documentation" position="bottom">
          <button
            onClick={() => setShowHowToUse(true)}
            className="p-3 rounded-xl bg-blue-500/20 dark:bg-blue-400/20 border border-blue-400/30 dark:border-blue-300/30 text-blue-600 dark:text-blue-200 hover:bg-blue-500/30 dark:hover:bg-blue-400/30 transition-all duration-300"
          >
            <Book className="h-5 w-5" />
          </button>
        </Tooltip>

        <Tooltip content="API configuration" position="bottom">
          <button
            onClick={() => setShowApiSetup(true)}
            className="p-3 rounded-xl bg-green-500/20 dark:bg-green-400/20 border border-green-400/30 dark:border-green-300/30 text-green-600 dark:text-green-200 hover:bg-green-500/30 dark:hover:bg-green-400/30 transition-all duration-300"
          >
            <Settings className="h-5 w-5" />
          </button>
        </Tooltip>
      </div>

      {/* Hero Section */}
      <Hero />
      
      {/* Enhanced AI Console */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Navigation Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bot className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">SmartCRM AI Agent Suite</span>
          </div>
          
          <Link
            to="/features-analytics"
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            <BarChart3 className="h-5 w-5" />
            Advanced Features & Analytics
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Brain className="h-10 w-10 text-blue-600 dark:text-blue-400" />
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white">AI Agent Console</h2>
            <Sparkles className="h-8 w-8 text-purple-600 dark:text-purple-400" />
          </div>
          <p className="text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
            Command your AI agents with natural language. Watch them execute tasks in real-time.
          </p>
        </div>
        
        <React.Suspense fallback={
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400">
              <div className="animate-spin w-8 h-8 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full"></div>
              <span className="text-lg font-medium">Loading AI Console...</span>
            </div>
          </div>
        }>
          <EnhancedAIConsole 
            realMode={globalRealMode}
            onModeToggle={() => handleModeToggle(!globalRealMode)}
            showProactiveSuggestions={true}
          />
        </React.Suspense>
      </section>

      {/* Interactive Goal Explorer - Main Feature */}
      <section id="goal-explorer-section" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Target className="h-10 w-10 text-blue-600 dark:text-blue-400" />
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white">Choose Your Business Goals</h2>
            <Target className="h-10 w-10 text-purple-600 dark:text-purple-400" />
          </div>
          <p className="text-xl text-gray-700 dark:text-gray-300 max-w-4xl mx-auto">
            Select from 50+ business automation goals and watch AI agents execute them step-by-step. 
            Every goal delivers measurable business impact.
          </p>
        </div>

        <React.Suspense fallback={
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400">
              <div className="animate-spin w-8 h-8 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full"></div>
              <span className="text-lg font-medium">Loading Goal Explorer...</span>
            </div>
          </div>
        }>
          <InteractiveGoalExplorer 
            realMode={globalRealMode}
            onModeToggle={handleModeToggle}
            onOpenApiSetup={() => setShowApiSetup(true)}
          />
        </React.Suspense>
      </section>

      {/* Simple CRM Preview */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Live CRM Integration</h2>
          <p className="text-lg text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
            Watch AI agents work directly in your CRM interface. See real-time updates as automation happens.
          </p>
        </div>
        
        {/* Sample goal for CRM demo */}
        <React.Suspense fallback={
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400">
              <div className="animate-spin w-8 h-8 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full"></div>
              <span className="text-lg font-medium">Loading CRM Workspace...</span>
            </div>
          </div>
        }>
          <CRMWorkspace 
            goal={{
              id: 'sample-goal',
              category: 'Sales',
              title: 'Sample Goal Execution',
              description: 'Demonstrating live CRM integration',
              priority: 'High',
              agentsRequired: ['AI SDR Agent'],
              toolsNeeded: ['supabase'],
              estimatedSetupTime: '5 minutes',
              businessImpact: 'Real-time CRM updates',
              complexity: 'Simple',
              realWorldExample: 'Watch CRM data change in real-time',
              successMetrics: ['CRM updated successfully'],
              roi: 'Immediate value'
            }}
            isExecuting={false}
          />
        </React.Suspense>
      </section>

      {/* Call-to-Action for Advanced Features */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-12 text-center relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 25% 25%, #3b82f6 1px, transparent 1px)',
              backgroundSize: '30px 30px'
            }}></div>
          </div>

          <div className="relative z-10">
            <div className="flex items-center justify-center gap-3 mb-6">
              <BarChart3 className="h-12 w-12 text-blue-400" />
              <Sparkles className="h-10 w-10 text-purple-400" />
            </div>
            
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready for Advanced AI Features?
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              Explore advanced analytics, personalized recommendations, proactive insights, 
              and comprehensive agent learning systems.
            </p>

            <div className="grid md:grid-cols-3 gap-8 mb-8">
              <div className="text-center">
                <div className="p-4 rounded-xl bg-blue-500/20 border border-blue-400/30 mb-4 mx-auto w-fit">
                  <Brain className="h-8 w-8 text-blue-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">Advanced Analytics</h3>
                <p className="text-gray-300 text-sm">Deep insights into agent performance and business impact</p>
              </div>
              <div className="text-center">
                <div className="p-4 rounded-xl bg-purple-500/20 border border-purple-400/30 mb-4 mx-auto w-fit">
                  <Target className="h-8 w-8 text-purple-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">Personalized AI</h3>
                <p className="text-gray-300 text-sm">AI that learns your patterns and suggests optimal workflows</p>
              </div>
              <div className="text-center">
                <div className="p-4 rounded-xl bg-green-500/20 border border-green-400/30 mb-4 mx-auto w-fit">
                  <BarChart3 className="h-8 w-8 text-green-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">Enterprise Tools</h3>
                <p className="text-gray-300 text-sm">Data quality management and workflow automation</p>
              </div>
            </div>

            <Link
              to="/features-analytics"
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <BarChart3 className="h-6 w-6" />
              Explore Advanced Features
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />

      {/* Modals */}
      <HowToUse
        isOpen={showHowToUse}
        onClose={() => setShowHowToUse(false)}
        onOpenApiSetup={() => setShowApiSetup(true)}
      />

      <ApiSetupGuide
        isOpen={showApiSetup}
        onClose={() => setShowApiSetup(false)}
        onSetupComplete={() => {
          setGlobalRealMode(true);
          setShowApiSetup(false);
        }}
      />
    </div>
  );
};

export default CoreInteractionPage;