import React, { useState, useEffect } from 'react';
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
import Tooltip from './components/Tooltip';
import { getDefaultMode, validateApiSetup, logApiStatus } from './config/apiConfig';
import { Settings, HelpCircle, Book, Eye, Globe } from 'lucide-react';

function App() {
  const [globalRealMode, setGlobalRealMode] = useState(false);
  const [showHowToUse, setShowHowToUse] = useState(false);
  const [showComposioModal, setShowComposioModal] = useState(false);

  // Initialize with the appropriate mode based on API configuration
  useEffect(() => {
    const defaultMode = getDefaultMode();
    
    setGlobalRealMode(defaultMode);
    
    // Log API status on app start
    logApiStatus();
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
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
          <Tooltip 
            content="View all 250+ Composio integrations"
            position="bottom"
          >
            <button
              onClick={handleOpenComposioModal}
              className="p-3 rounded-xl bg-purple-500/20 border border-purple-400/30 text-purple-300 hover:text-purple-200 hover:bg-purple-500/30 transition-all duration-300 group"
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
              className="p-3 rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-300 hover:text-blue-200 hover:bg-blue-500/30 transition-all duration-300 group"
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
              className="p-3 rounded-xl bg-green-500/20 border border-green-400/30 text-green-300 hover:text-green-200 hover:bg-green-500/30 transition-all duration-300 group"
            >
              <HelpCircle className="h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
            </button>
          </Tooltip>
        </div>

        {/* Enhanced Mode Indicator */}
        <div className={`px-6 py-3 rounded-xl border text-sm font-medium transition-all duration-300 ${
          globalRealMode 
            ? 'bg-red-500/20 border-red-400/30 text-red-300 shadow-lg shadow-red-500/20' 
            : 'bg-blue-500/20 border-blue-400/30 text-blue-300 shadow-lg shadow-blue-500/20'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full animate-pulse ${
              globalRealMode ? 'bg-red-400' : 'bg-blue-400'
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
                  className="p-1 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-300 group"
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
          <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 rounded-xl p-4 backdrop-blur-xl">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <HelpCircle className="h-5 w-5 text-blue-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-white font-medium text-sm mb-1">New to SmartCRM?</h4>
                <p className="text-gray-300 text-xs mb-3">
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
                    className="px-3 py-1 text-gray-400 hover:text-white text-xs transition-colors"
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
  );
}

export default App;