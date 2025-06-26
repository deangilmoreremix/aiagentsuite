import React, { useState, useEffect } from 'react';
import Hero from './components/Hero';
import AgentShowcase from './components/AgentShowcase';
import CRMModules from './components/CRMModules';
import Features from './components/Features';
import MultiAgentDemo from './components/MultiAgentDemo';
import InteractiveGoalExplorer from './components/InteractiveGoalExplorer';
import ApiSetupGuide from './components/ApiSetupGuide';
import HowItWorks from './components/HowItWorks';
import Integrations from './components/Integrations';
import Pricing from './components/Pricing';
import Footer from './components/Footer';
import { getDefaultMode, validateApiSetup, logApiStatus } from './config/apiConfig';

function App() {
  const [globalRealMode, setGlobalRealMode] = useState(false);
  const [showApiSetup, setShowApiSetup] = useState(false);

  // Initialize with the appropriate mode based on API configuration
  useEffect(() => {
    const defaultMode = getDefaultMode();
    const validation = validateApiSetup();
    
    setGlobalRealMode(defaultMode);
    
    // Log API status on app start
    logApiStatus();
    
    // Show API setup guide if no APIs are configured
    if (!validation.canUseRealMode && !localStorage.getItem('api-setup-dismissed')) {
      setShowApiSetup(true);
    }
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
    const validation = validateApiSetup();
    
    if (mode && !validation.canUseRealMode) {
      // User wants to enable real mode but APIs aren't configured
      setShowApiSetup(true);
      return;
    }
    
    setGlobalRealMode(mode);
    
    // Log mode change
    console.log(`🔄 Mode switched to: ${mode ? '🔴 LIVE MODE' : '🔵 DEMO MODE'}`);
    if (mode) {
      console.warn('⚠️ LIVE MODE: Real AI agents will execute with your actual APIs and tools');
    }
  };

  const handleApiSetupComplete = () => {
    const validation = validateApiSetup();
    if (validation.canUseRealMode) {
      setGlobalRealMode(true);
      console.log('✅ API setup complete! Switching to Live Mode.');
    }
  };

  const handleApiSetupClose = () => {
    setShowApiSetup(false);
    localStorage.setItem('api-setup-dismissed', 'true');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* API Setup Guide Modal */}
      <ApiSetupGuide
        isOpen={showApiSetup}
        onClose={handleApiSetupClose}
        onSetupComplete={handleApiSetupComplete}
      />

      {/* Global API Status Indicator */}
      <div className="fixed top-4 right-4 z-40">
        <div className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-300 ${
          globalRealMode 
            ? 'bg-red-500/20 border-red-400/30 text-red-300' 
            : 'bg-blue-500/20 border-blue-400/30 text-blue-300'
        }`}>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full animate-pulse ${
              globalRealMode ? 'bg-red-400' : 'bg-blue-400'
            }`}></div>
            <span>{globalRealMode ? '🔴 LIVE MODE' : '🔵 DEMO MODE'}</span>
            <button
              onClick={() => setShowApiSetup(true)}
              className="ml-2 text-xs underline hover:no-underline transition-all"
            >
              Settings
            </button>
          </div>
        </div>
      </div>

      {/* Compact Hero Section */}
      <Hero />
      
      {/* Interactive Goal Explorer - Primary Feature */}
      <section id="goal-explorer-section" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <InteractiveGoalExplorer 
          realMode={globalRealMode}
          onModeToggle={handleModeToggle}
        />
      </section>

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

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default App;