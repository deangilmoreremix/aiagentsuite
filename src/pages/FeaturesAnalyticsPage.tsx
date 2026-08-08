import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PersonalizedGoalRecommendations from '../components/PersonalizedGoalRecommendations';
import ProactiveAssistantPanel from '../components/ProactiveAssistantPanel';
import ConversationInsightsPanel from '../components/ConversationInsightsPanel';
import DataQualityDashboard from '../components/DataQualityDashboard';
import SmartWorkflowSuggestions from '../components/SmartWorkflowSuggestions';
import AgentLearningPanel from '../components/AgentLearningPanel';
import TaskExecutionEntry from '../components/TaskExecutionEntry';
import Footer from '../components/Footer';
import ThemeToggle from '../components/ThemeToggle';
import { getDefaultMode } from '../config/apiConfig';
import { 
  ArrowLeft, 
  BarChart3, 
  Brain, 
  Sparkles, 
  Target, 
  Activity,
  Users,
  TrendingUp,
  Database,
  Workflow,
  Eye,
  Home,
  Lightbulb
} from 'lucide-react';
import Tooltip from '../components/Tooltip';

// Lazy load heavy showcase components
const AgentShowcase = React.lazy(() => import('../components/AgentShowcase'));
const CRMModules = React.lazy(() => import('../components/CRMModules'));
const Features = React.lazy(() => import('../components/Features'));
const MultiAgentDemo = React.lazy(() => import('../components/MultiAgentDemo'));
const HowItWorks = React.lazy(() => import('../components/HowItWorks'));
const Integrations = React.lazy(() => import('../components/Integrations'));
const Pricing = React.lazy(() => import('../components/Pricing'));

const FeaturesAnalyticsPage = () => {
  const [globalRealMode, setGlobalRealMode] = useState(false);

  useEffect(() => {
    console.log('🚀 Initializing Advanced Features & Analytics Page...');
    
    const defaultMode = getDefaultMode();
    setGlobalRealMode(defaultMode);
    
    console.log('✅ Advanced page initialization complete');
  }, []);

  const handleModeToggle = (mode: boolean) => {
    setGlobalRealMode(mode);
    console.log(`🔄 Mode switched to: ${mode ? '🔴 LIVE MODE' : '🔵 DEMO MODE'}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-blue-100 to-gray-100 dark:from-slate-900 dark:via-blue-900 dark:to-slate-900 transition-colors duration-300">
      
      {/* Navigation Header */}
      <div className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-gray-200 dark:border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link
                to="/"
                className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors group"
              >
                <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform duration-300" />
                <span className="font-medium">Back to Core Features</span>
              </Link>
              
              <div className="h-6 w-px bg-gray-300 dark:bg-slate-600"></div>
              
              <div className="flex items-center gap-3">
                <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Advanced Features & Analytics</h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle size="medium" />
              
              {/* Mode Indicator */}
              <div className={`px-3 py-2 rounded-lg border text-sm font-medium ${
                globalRealMode 
                  ? 'bg-red-500/20 dark:bg-red-400/20 border-red-400/30 dark:border-red-300/30 text-red-600 dark:text-red-200' 
                  : 'bg-blue-500/20 dark:bg-blue-400/20 border-blue-400/30 dark:border-blue-300/30 text-blue-600 dark:text-blue-200'
              }`}>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full animate-pulse ${
                    globalRealMode ? 'bg-red-500 dark:bg-red-300' : 'bg-blue-500 dark:bg-blue-300'
                  }`}></div>
                  <span>{globalRealMode ? 'Live' : 'Demo'}</span>
                </div>
              </div>
              
              <button
                onClick={() => handleModeToggle(!globalRealMode)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  globalRealMode
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                Switch to {globalRealMode ? 'Demo' : 'Live'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Page Header */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center">
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 dark:border-blue-300/30">
              <Brain className="h-12 w-12 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 dark:border-purple-300/30">
              <BarChart3 className="h-12 w-12 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="p-4 rounded-2xl bg-gradient-to-r from-green-500/20 to-teal-500/20 border border-green-400/30 dark:border-green-300/30">
              <Activity className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
          </div>
          
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Advanced AI Features & Analytics
          </h1>
          <p className="text-xl text-gray-700 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed">
            Deep-dive into the intelligence layer of SmartCRM. Explore personalized AI recommendations, 
            advanced analytics, agent learning systems, and comprehensive business automation tools.
          </p>
        </div>
      </section>

      {/* Enhanced Task Execution with GPT-5 */}
      <TaskExecutionEntry realMode={globalRealMode} />

      {/* Intelligence Enhancement Features Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">Intelligence Enhancement Suite</h2>
          <p className="text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
            AI systems that learn, adapt, and optimize your business processes continuously.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-8">
            {/* Personalized Recommendations */}
            <div className="bg-white/90 dark:bg-gradient-to-br dark:from-slate-800/80 dark:to-slate-900/80 backdrop-blur-xl rounded-2xl border border-gray-300/50 dark:border-slate-700/50 p-6">
              <div className="flex items-center gap-3 mb-6">
                <Target className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Personalized AI Recommendations</h3>
              </div>
              <PersonalizedGoalRecommendations 
                userId="default-user"
                maxRecommendations={4}
                compactView={true}
                onGoalSelect={(goal) => {
                  console.log('Selected personalized goal:', goal.title);
                }}
              />
            </div>

            {/* Conversation Insights */}
            <div className="bg-white/90 dark:bg-gradient-to-br dark:from-slate-800/80 dark:to-slate-900/80 backdrop-blur-xl rounded-2xl border border-gray-300/50 dark:border-slate-700/50 p-6">
              <ConversationInsightsPanel 
                userId="default-user"
                realMode={globalRealMode}
                compact={true}
                onInsightAction={(insight) => {
                  console.log('Applied conversation insight:', insight.title);
                }}
              />
            </div>

            {/* Data Quality Dashboard */}
            <div className="bg-white/90 dark:bg-gradient-to-br dark:from-slate-800/80 dark:to-slate-900/80 backdrop-blur-xl rounded-2xl border border-gray-300/50 dark:border-slate-700/50 p-6">
              <DataQualityDashboard 
                userId="default-user"
                realMode={globalRealMode}
                compact={true}
                onAutoFix={(issues) => {
                  console.log('Auto-fixed data issues:', issues.length);
                }}
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Proactive Assistant */}
            <div className="bg-white/90 dark:bg-gradient-to-br dark:from-slate-800/80 dark:to-slate-900/80 backdrop-blur-xl rounded-2xl border border-gray-300/50 dark:border-slate-700/50 p-6">
              <ProactiveAssistantPanel 
                userId="default-user"
                realMode={globalRealMode}
                compact={true}
                onSuggestionExecute={(suggestion) => {
                  console.log('Executed proactive suggestion:', suggestion.title);
                }}
              />
            </div>

            {/* Smart Workflow Suggestions */}
            <div className="bg-white/90 dark:bg-gradient-to-br dark:from-slate-800/80 dark:to-slate-900/80 backdrop-blur-xl rounded-2xl border border-gray-300/50 dark:border-slate-700/50 p-6">
              <SmartWorkflowSuggestions 
                userId="default-user"
                realMode={globalRealMode}
                compact={true}
                onWorkflowCreate={(workflow) => {
                  console.log('Created workflow:', workflow.name);
                }}
              />
            </div>

            {/* Agent Learning Panel */}
            <div className="bg-white/90 dark:bg-gradient-to-br dark:from-slate-800/80 dark:to-slate-900/80 backdrop-blur-xl rounded-2xl border border-gray-300/50 dark:border-slate-700/50 p-6">
              <AgentLearningPanel 
                userId="default-user"
                realMode={globalRealMode}
                compact={true}
                onInsightApply={(insight) => {
                  console.log('Applied learning insight:', insight.title);
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Lazy-Loaded Showcase Components */}
      <React.Suspense fallback={
        <div className="flex items-center justify-center py-16">
          <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400">
            <div className="animate-spin w-8 h-8 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full"></div>
            <span className="text-lg font-medium">Loading Advanced Components...</span>
          </div>
        </div>
      }>
        {/* Agent Team Overview */}
        <AgentShowcase />

        {/* Multi-Agent Live Demo */}
        <MultiAgentDemo />

        {/* CRM Integration Details */}
        <CRMModules />

        {/* Key Features */}
        <Features />

        {/* How It Works */}
        <HowItWorks />

        {/* Tool Integrations */}
        <Integrations />

        {/* Pricing */}
        <Pricing />
      </React.Suspense>

      {/* Footer */}
      <Footer />

      {/* Back to Core CTA */}
      <div className="fixed bottom-6 left-6 z-40">
        <Link
          to="/"
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
        >
          <Home className="h-5 w-5" />
          Back to Core Features
        </Link>
      </div>
    </div>
  );
};

export default FeaturesAnalyticsPage;