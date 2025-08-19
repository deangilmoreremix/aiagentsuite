import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import Hero from './components/Hero';
import AgentShowcase from './components/AgentShowcase';
import CRMModules from './components/CRMModules';
import Features from './components/Features';
import MultiAgentDemo from './components/MultiAgentDemo';
import InteractiveGoalExplorer from './components/InteractiveGoalExplorer';
import HowToUse from './components/HowToUse';
import HowItWorks from './components/HowItWorks';
import Integrations from './components/Integrations';
import ComposioIntegrationModal from './components/ComposioIntegrationModal';
import Pricing from './components/Pricing';
import Footer from './components/Footer';
import TaskExecutionEntry from './components/TaskExecutionEntry';
import EnhancedAIConsole from './components/EnhancedAIConsole';
import PersonalizedGoalRecommendations from './components/PersonalizedGoalRecommendations';
import ProactiveAssistantPanel from './components/ProactiveAssistantPanel';
import ConversationInsightsPanel from './components/ConversationInsightsPanel';
import SmartWorkflowSuggestions from './components/SmartWorkflowSuggestions';
import DataQualityDashboard from './components/DataQualityDashboard';
import AgentLearningPanel from './components/AgentLearningPanel';
import ThemeToggle from './components/ThemeToggle';
import Tooltip from './components/Tooltip';
import { getDefaultMode, validateApiSetup, logApiStatus } from './config/apiConfig';
import { Settings, HelpCircle, Book, Eye, Globe } from 'lucide-react';

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
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-blue-100 to-gray-100 dark:from-slate-900 dark:via-blue-900 dark:to-slate-900 transition-colors duration-300">
        {/* How to Use Guide Modal */}
        <HowToUse
          isOpen={showHowToUse}
          onClose={() => setShowHowToUse(false)}
          onOpenApiSetup={() => {}}
        />

        {/* Composio Integration Modal */}
        <ComposioIntegrationModal
          isOpen={showComposioModal}
          onClose={() => setShowComposioModal(false)}
        />

        {/* Enhanced Global Status Header */}
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

        {/* Quick Access Notification for New Users */}
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

        {/* Compact Hero Section */}
        <Hero />
        
        {/* Interactive Goal Explorer - Primary Feature */}
        <section id="goal-explorer-section" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {/* Enhanced AI Console Integration */}
          <div className="mb-16">
            <EnhancedAIConsole 
              realMode={globalRealMode}
              onModeToggle={() => handleModeToggle(!globalRealMode)}
              showProactiveSuggestions={true}
            />
          </div>

          {/* Personalized Goal Recommendations */}
          <div className="mb-16">
            <PersonalizedGoalRecommendations 
              userId="default-user"
              onGoalSelect={(goal) => {
                // Integration with existing goal execution system
                console.log('Selected personalized goal:', goal.title);
              }}
              maxRecommendations={6}
              showReasoningDetails={true}
            />
          </div>

          <InteractiveGoalExplorer 
            realMode={globalRealMode}
            onModeToggle={handleModeToggle}
            onOpenApiSetup={() => {}}
          />
        </section>

        {/* Proactive Assistant Panel */}
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

        {/* Phase 1 Intelligence Enhancements */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-8">
              {/* Conversation Insights */}
              <ConversationInsightsPanel 
                userId="default-user"
                realMode={globalRealMode}
                onInsightAction={(insight) => {
                  console.log('Applied conversation insight:', insight.title);
                }}
              />
              
              {/* Data Quality Dashboard */}
              <DataQualityDashboard 
                userId="default-user"
                realMode={globalRealMode}
                onAutoFix={(issues) => {
                  console.log('Auto-fixed data issues:', issues.length);
                }}
              />
            </div>

            {/* Right Column */}
            <div className="space-y-8">
              {/* Smart Workflow Suggestions */}
              <SmartWorkflowSuggestions 
                userId="default-user"
                realMode={globalRealMode}
                onWorkflowCreate={(workflow) => {
                  console.log('Created workflow:', workflow.name);
                }}
              />
              
              {/* Agent Learning Panel */}
              <AgentLearningPanel 
                userId="default-user"
                realMode={globalRealMode}
                onInsightApply={(insight) => {
                  console.log('Applied learning insight:', insight.title);
                }}
              />
            </div>
          </div>
        </section>

        {/* Enhanced Task Execution with GPT-5 */}
        <TaskExecutionEntry realMode={globalRealMode} />

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
        <Integrations onOpenComposioModal={handleOpenComposioModal} />

        {/* Pricing */}
        <Pricing />

        {/* Footer */}
        <Footer />
      </div>
    </ThemeProvider>
  );
}

export default App;