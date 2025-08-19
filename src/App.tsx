import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import Hero from './components/Hero';
import InteractiveGoalExplorer from './components/InteractiveGoalExplorer';
import HowToUse from './components/HowToUse';
import ComposioIntegrationModal from './components/ComposioIntegrationModal';
import EnhancedAIConsole from './components/EnhancedAIConsole';
import PersonalizedGoalRecommendations from './components/PersonalizedGoalRecommendations';
import ProactiveAssistantPanel from './components/ProactiveAssistantPanel';
import ConversationInsightsPanel from './components/ConversationInsightsPanel';
import SmartWorkflowSuggestions from './components/SmartWorkflowSuggestions';
import DataQualityDashboard from './components/DataQualityDashboard';
import AgentLearningPanel from './components/AgentLearningPanel';
import ThemeToggle from './components/ThemeToggle';
import LoadingSpinner from './components/LoadingSpinner';
import Tooltip from './components/Tooltip';
import { getDefaultMode, validateApiSetup, logApiStatus } from './config/apiConfig';
import { Settings, HelpCircle, Book, Eye, Globe } from 'lucide-react';

// Lazy load heavy components that are not immediately visible
const AgentShowcase = React.lazy(() => import('./components/AgentShowcase'));
const CRMModules = React.lazy(() => import('./components/CRMModules'));
const Features = React.lazy(() => import('./components/Features'));
const MultiAgentDemo = React.lazy(() => import('./components/MultiAgentDemo'));
const HowItWorks = React.lazy(() => import('./components/HowItWorks'));
const Integrations = React.lazy(() => import('./components/Integrations'));
const Pricing = React.lazy(() => import('./components/Pricing'));
const Footer = React.lazy(() => import('./components/Footer'));
const TaskExecutionEntry = React.lazy(() => import('./components/TaskExecutionEntry'));

function App() {
  const [globalRealMode, setGlobalRealMode] = useState(false);
  const [showHowToUse, setShowHowToUse] = useState(false);
  const [showComposioModal, setShowComposioModal] = useState(false);

  // Initialize with the appropriate mode based on API configuration
  useEffect(() => {
    console.log('🚀 Initializing SmartCRM AI Agent Suite...');
    
    const defaultMode = getDefaultMode();
    console.log('🔧 Default mode determined:', defaultMode ? 'Live Mode' : 'Demo Mode');
    
    setGlobalRealMode(defaultMode);
    
    // Log API status on app start
    logApiStatus();
    
    console.log('✅ App initialization complete');
  }, []);

  // Auto-scroll to Goal Explorer after page loads
  useEffect(() => {
    const scrollToGoalExplorer = () => {
      setTimeout(() => {
        const goalExplorerElement = document.getElementById('goal-explorer-section');
        if (goalExplorerElement) {
          goalExplorerElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }, 2000); // Wait 2 seconds to let the header show first
    };

    // Only auto-scroll on initial page load
    const hasAutoScrolled = sessionStorage.getItem('hasAutoScrolled');
    if (!hasAutoScrolled) {
      scrollToGoalExplorer();
      sessionStorage.setItem('hasAutoScrolled', 'true');
    }
  }, []);

  const handleModeToggle = (mode: boolean) => {
    setGlobalRealMode(mode);
    
    // Log mode change
    console.log(`🔄 Mode switched to: ${mode ? '🔴 LIVE MODE' : '🔵 DEMO MODE'}`);
    if (mode) {
      console.warn('⚠️ LIVE MODE: Real AI agents will execute with your actual APIs and tools');
    }
  };

  const handleOpenHowToUse = () => {
    setShowHowToUse(true);
  };

  const handleOpenComposioModal = () => {
    setShowComposioModal(true);
  };

  return (
    <ThemeProvider>
      <ErrorBoundary
        fallbackTitle="SmartCRM Initialization Error"
        fallbackMessage="The application encountered an error during startup. This might be due to API configuration or component loading issues."
        onError={(error, errorInfo) => {
          console.error('App-level error:', error, errorInfo);
        }}
      >
        <div className="min-h-screen bg-gradient-to-br from-gray-100 via-blue-100 to-gray-100 dark:from-slate-900 dark:via-blue-900 dark:to-slate-900 transition-colors duration-300">
          {/* How to Use Guide Modal */}
          <ErrorBoundary fallbackTitle="Guide Error" fallbackMessage="The how-to guide failed to load." showRetry={true}>
            <HowToUse
              isOpen={showHowToUse}
              onClose={() => setShowHowToUse(false)}
              onOpenApiSetup={() => {}}
            />
          </ErrorBoundary>

          {/* Composio Integration Modal */}
          <ErrorBoundary fallbackTitle="Integration Error" fallbackMessage="The integration modal failed to load." showRetry={true}>
            <ComposioIntegrationModal
              isOpen={showComposioModal}
              onClose={() => setShowComposioModal(false)}
            />
          </ErrorBoundary>

          {/* Enhanced Global Status Header */}
          <ErrorBoundary fallbackTitle="Header Error" fallbackMessage="The header section failed to load." showRetry={false}>
            <div className="fixed top-4 right-4 z-40 flex items-center gap-3">
              {/* Help & Documentation Buttons */}
              <div className="flex items-center gap-2">
                <ThemeToggle size="medium" />
                
                <Tooltip 
                  content="View all 250+ Composio integrations"
                  position="bottom"
                >
                  <button
                    onClick={handleOpenComposioModal}
                    className="p-3 rounded-xl bg-purple-500/20 dark:bg-purple-400/20 border border-purple-400/30 dark:border-purple-300/30 text-purple-600 dark:text-purple-200 hover:text-purple-700 dark:hover:text-purple-100 hover:bg-purple-500/30 dark:hover:bg-purple-400/30 transition-all duration-300 group"
                  >
                    <Globe className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                  </button>
                </Tooltip>
                
                <Tooltip 
                  content="Complete guide on how to use SmartCRM AI Agent Suite"
                  position="bottom"
                >
                  <button
                    onClick={handleOpenHowToUse}
                    className="p-3 rounded-xl bg-blue-500/20 dark:bg-blue-400/20 border border-blue-400/30 dark:border-blue-300/30 text-blue-600 dark:text-blue-200 hover:text-blue-700 dark:hover:text-blue-100 hover:bg-blue-500/30 dark:hover:bg-blue-400/30 transition-all duration-300 group"
                  >
                    <Book className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                  </button>
                </Tooltip>

                <Tooltip 
                  content="Take a guided tour of the interface"
                  position="bottom"
                >
                  <button
                    onClick={() => {
                      // This will trigger the walkthrough in the goal explorer
                      const event = new CustomEvent('trigger-walkthrough');
                      document.dispatchEvent(event);
                    }}
                    className="p-3 rounded-xl bg-green-500/20 dark:bg-green-400/20 border border-green-400/30 dark:border-green-300/30 text-green-600 dark:text-green-200 hover:text-green-700 dark:hover:text-green-100 hover:bg-green-500/30 dark:hover:bg-green-400/30 transition-all duration-300 group"
                  >
                    <HelpCircle className="h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
                  </button>
                </Tooltip>
              </div>

              {/* Enhanced Mode Indicator */}
              <div className={`px-6 py-3 rounded-xl border text-sm font-medium transition-all duration-300 ${
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
                  
                  <div className="flex items-center gap-2">
                    <Tooltip 
                      content="Switch between Demo and Live modes"
                      position="bottom"
                    >
                      <button
                        onClick={() => handleModeToggle(!globalRealMode)}
                        className="p-1 rounded-lg bg-slate-200/50 dark:bg-white/10 hover:bg-slate-200/70 dark:hover:bg-white/20 transition-all duration-300 group"
                      >
                        <Eye className="h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
                      </button>
                    </Tooltip>
                  </div>
                </div>
                
                {/* Mode Description */}
                <div className="text-xs opacity-75 mt-1">
                  {globalRealMode 
                    ? 'Real AI execution active' 
                    : 'Safe simulation mode'
                  }
                </div>
              </div>
            </div>
          </ErrorBoundary>

          {/* Quick Access Notification for New Users */}
          <ErrorBoundary fallbackTitle="Notification Error" fallbackMessage="The welcome notification failed to load." showRetry={false}>
            {!localStorage.getItem('first-visit-complete') && (
              <div className="fixed bottom-4 left-4 z-40 max-w-sm">
                <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 dark:from-blue-400/20 dark:to-purple-400/20 border border-blue-400/30 dark:border-blue-300/30 rounded-xl p-4 backdrop-blur-xl shadow-lg">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/20 dark:bg-blue-400/20">
                      <HelpCircle className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-gray-900 dark:text-gray-200 font-medium text-sm mb-1">New to SmartCRM?</h4>
                      <p className="text-gray-700 dark:text-gray-400 text-xs mb-3">
                        Take a quick tour or read the guide to get started with AI automation!
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            handleOpenHowToUse();
                            localStorage.setItem('first-visit-complete', 'true');
                          }}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors"
                        >
                          Read Guide
                        </button>
                        <button
                          onClick={() => localStorage.setItem('first-visit-complete', 'true')}
                          className="px-3 py-1 text-gray-600 dark:text-gray-500 hover:text-gray-800 dark:hover:text-gray-300 text-xs transition-colors"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </ErrorBoundary>

          {/* Compact Hero Section */}
          <ErrorBoundary fallbackTitle="Hero Section Error" fallbackMessage="The hero section failed to load. This might be due to component or API configuration issues." showRetry={true}>
            <Hero />
          </ErrorBoundary>
          
          {/* Interactive Goal Explorer - Primary Feature */}
          <ErrorBoundary fallbackTitle="Goal Explorer Error" fallbackMessage="The goal explorer section encountered an error. This might be due to data loading or component issues." showRetry={true}>
            <section id="goal-explorer-section" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
              {/* Enhanced AI Console Integration */}
              <div className="mb-16">
                <ErrorBoundary fallbackTitle="AI Console Error" fallbackMessage="The AI console failed to load." showRetry={true}>
                  <EnhancedAIConsole 
                    realMode={globalRealMode}
                    onModeToggle={() => handleModeToggle(!globalRealMode)}
                    showProactiveSuggestions={true}
                  />
                </ErrorBoundary>
              </div>

              {/* Personalized Goal Recommendations */}
              <div className="mb-16">
                <ErrorBoundary fallbackTitle="Recommendations Error" fallbackMessage="The personalized recommendations failed to load." showRetry={true}>
                  <PersonalizedGoalRecommendations 
                    userId="default-user"
                    onGoalSelect={(goal) => {
                      // Integration with existing goal execution system
                      console.log('Selected personalized goal:', goal.title);
                    }}
                    maxRecommendations={6}
                    showReasoningDetails={true}
                  />
                </ErrorBoundary>
              </div>

              <ErrorBoundary fallbackTitle="Interactive Explorer Error" fallbackMessage="The interactive goal explorer failed to load." showRetry={true}>
                <InteractiveGoalExplorer 
                  realMode={globalRealMode}
                  onModeToggle={handleModeToggle}
                  onOpenApiSetup={() => {}}
                />
              </ErrorBoundary>
            </section>
          </ErrorBoundary>

          {/* Proactive Assistant Panel */}
          <ErrorBoundary fallbackTitle="Assistant Panel Error" fallbackMessage="The proactive assistant panel failed to load." showRetry={true}>
            <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
              <ProactiveAssistantPanel 
                userId="default-user"
                realMode={globalRealMode}
                onSuggestionExecute={(suggestion) => {
                  console.log('Executed proactive suggestion:', suggestion.title);
                }}
                onInsightView={(insight) => {
                  console.log('Viewed insight:', insight);
                }}
              />
            </section>
          </ErrorBoundary>

          {/* Phase 1 Intelligence Enhancements */}
          <ErrorBoundary fallbackTitle="Intelligence Features Error" fallbackMessage="The intelligence enhancement features failed to load." showRetry={true}>
            <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-8">
                  {/* Conversation Insights */}
                  <ErrorBoundary fallbackTitle="Insights Error" fallbackMessage="Conversation insights failed to load." showRetry={true}>
                    <ConversationInsightsPanel 
                      userId="default-user"
                      realMode={globalRealMode}
                      onInsightAction={(insight) => {
                        console.log('Applied conversation insight:', insight.title);
                      }}
                    />
                  </ErrorBoundary>
                  
                  {/* Data Quality Dashboard */}
                  <ErrorBoundary fallbackTitle="Data Quality Error" fallbackMessage="Data quality dashboard failed to load." showRetry={true}>
                    <DataQualityDashboard 
                      userId="default-user"
                      realMode={globalRealMode}
                      onAutoFix={(issues) => {
                        console.log('Auto-fixed data issues:', issues.length);
                      }}
                    />
                  </ErrorBoundary>
                </div>

                {/* Right Column */}
                <div className="space-y-8">
                  {/* Smart Workflow Suggestions */}
                  <ErrorBoundary fallbackTitle="Workflow Error" fallbackMessage="Smart workflow suggestions failed to load." showRetry={true}>
                    <SmartWorkflowSuggestions 
                      userId="default-user"
                      realMode={globalRealMode}
                      onWorkflowCreate={(workflow) => {
                        console.log('Created workflow:', workflow.name);
                      }}
                    />
                  </ErrorBoundary>
                  
                  {/* Agent Learning Panel */}
                  <ErrorBoundary fallbackTitle="Learning Panel Error" fallbackMessage="Agent learning panel failed to load." showRetry={true}>
                    <AgentLearningPanel 
                      userId="default-user"
                      realMode={globalRealMode}
                      onInsightApply={(insight) => {
                        console.log('Applied learning insight:', insight.title);
                      }}
                    />
                  </ErrorBoundary>
                </div>
              </div>
            </section>
          </ErrorBoundary>

          {/* Enhanced Task Execution with GPT-5 */}
          <ErrorBoundary fallbackTitle="Task Execution Error" fallbackMessage="Task execution feature failed to load." showRetry={true}>
            <React.Suspense fallback={<LoadingSpinner message="Loading Task Execution..." size="large" />}>
              <TaskExecutionEntry realMode={globalRealMode} />
            </React.Suspense>
          </ErrorBoundary>

          {/* Agent Team Overview */}
          <ErrorBoundary fallbackTitle="Agent Showcase Error" fallbackMessage="Agent showcase failed to load." showRetry={true}>
            <React.Suspense fallback={<LoadingSpinner message="Loading Agent Showcase..." />}>
              <AgentShowcase />
            </React.Suspense>
          </ErrorBoundary>

          {/* Multi-Agent Live Demo */}
          <ErrorBoundary fallbackTitle="Demo Error" fallbackMessage="Multi-agent demo failed to load." showRetry={true}>
            <React.Suspense fallback={<LoadingSpinner message="Loading Multi-Agent Demo..." />}>
              <MultiAgentDemo />
            </React.Suspense>
          </ErrorBoundary>

          {/* CRM Integration Details */}
          <ErrorBoundary fallbackTitle="CRM Modules Error" fallbackMessage="CRM modules failed to load." showRetry={true}>
            <React.Suspense fallback={<LoadingSpinner message="Loading CRM Modules..." />}>
              <CRMModules />
            </React.Suspense>
          </ErrorBoundary>

          {/* Key Features */}
          <ErrorBoundary fallbackTitle="Features Error" fallbackMessage="Features section failed to load." showRetry={true}>
            <React.Suspense fallback={<LoadingSpinner message="Loading Features..." />}>
              <Features />
            </React.Suspense>
          </ErrorBoundary>

          {/* How It Works */}
          <ErrorBoundary fallbackTitle="How It Works Error" fallbackMessage="How it works section failed to load." showRetry={true}>
            <React.Suspense fallback={<LoadingSpinner message="Loading How It Works..." />}>
              <HowItWorks />
            </React.Suspense>
          </ErrorBoundary>

          {/* Tool Integrations */}
          <ErrorBoundary fallbackTitle="Integrations Error" fallbackMessage="Integrations section failed to load." showRetry={true}>
            <React.Suspense fallback={<LoadingSpinner message="Loading Integrations..." />}>
              <Integrations onOpenComposioModal={handleOpenComposioModal} />
            </React.Suspense>
          </ErrorBoundary>

          {/* Pricing */}
          <ErrorBoundary fallbackTitle="Pricing Error" fallbackMessage="Pricing section failed to load." showRetry={true}>
            <React.Suspense fallback={<LoadingSpinner message="Loading Pricing..." />}>
              <Pricing />
            </React.Suspense>
          </ErrorBoundary>

          {/* Footer */}
          <ErrorBoundary fallbackTitle="Footer Error" fallbackMessage="Footer failed to load." showRetry={true}>
            <React.Suspense fallback={<LoadingSpinner message="Loading Footer..." />}>
              <Footer />
            </React.Suspense>
          </ErrorBoundary>
        </div>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;