import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  ExternalLink, 
  Eye, 
  EyeOff, 
  Copy, 
  Settings,
  Key,
  Link,
  Zap,
  RefreshCw
} from 'lucide-react';
import { apiConfig, validateApiSetup, logApiStatus } from '../config/apiConfig';
import { realApiService } from '../services/realApiService';

interface ApiSetupGuideProps {
  isOpen: boolean;
  onClose: () => void;
  onSetupComplete: () => void;
}

const ApiSetupGuide: React.FC<ApiSetupGuideProps> = ({ isOpen, onClose, onSetupComplete }) => {
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  const [isTesting, setIsTesting] = useState(false);

  const toggleShowKey = (service: string) => {
    setShowKeys(prev => ({ ...prev, [service]: !prev[service] }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const testApiConnections = async () => {
    setIsTesting(true);
    try {
      const results = await realApiService.testConnections();
      setTestResults(results);
    } catch (error) {
      console.error('API test failed:', error);
    } finally {
      setIsTesting(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      logApiStatus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const validation = validateApiSetup();

  const apiServices = [
    {
      name: 'OpenAI',
      key: 'VITE_OPENAI_API_KEY',
      description: 'Required for AI agent intelligence and natural language processing',
      setupUrl: 'https://platform.openai.com/api-keys',
      isConfigured: apiConfig.openai.isConfigured,
      currentValue: apiConfig.openai.apiKey,
      instructions: [
        'Go to OpenAI Platform',
        'Sign in or create an account',
        'Navigate to API Keys section',
        'Create a new secret key',
        'Copy and paste it into your .env file'
      ]
    },
    {
      name: 'Composio',
      key: 'VITE_COMPOSIO_API_KEY',
      description: 'Required for tool integrations (Gmail, Calendar, Slack, etc.)',
      setupUrl: 'https://app.composio.dev/',
      isConfigured: apiConfig.composio.isConfigured,
      currentValue: apiConfig.composio.apiKey,
      instructions: [
        'Go to Composio Dashboard',
        'Sign up for an account',
        'Navigate to API Keys section',
        'Generate a new API key',
        'Copy and paste it into your .env file'
      ]
    },
    {
      name: 'ElevenLabs',
      key: 'VITE_ELEVENLABS_API_KEY',
      description: 'Optional: For AI voice generation and text-to-speech features',
      setupUrl: 'https://elevenlabs.io/',
      isConfigured: apiConfig.elevenlabs.isConfigured,
      currentValue: apiConfig.elevenlabs.apiKey,
      optional: true,
      instructions: [
        'Go to ElevenLabs website',
        'Create an account',
        'Navigate to API section',
        'Copy your API key',
        'Add it to your .env file'
      ]
    },
    {
      name: 'Supabase',
      key: 'VITE_SUPABASE_URL',
      description: 'Required for CRM data storage and user management',
      setupUrl: 'https://supabase.com/',
      isConfigured: apiConfig.supabase.isConfigured,
      currentValue: apiConfig.supabase.url,
      instructions: [
        'Go to Supabase Dashboard',
        'Create a new project',
        'Copy your project URL and anon key',
        'Add both to your .env file',
        'Set up your database schema'
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      
      <div className="relative w-full h-full flex items-center justify-center p-4">
        <div className="w-full max-w-4xl max-h-[90vh] bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
          
          {/* Header */}
          <div className="p-6 border-b border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500">
                  <Key className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">API Configuration Setup</h2>
                  <p className="text-gray-300">Configure your API keys to enable real AI agent execution</p>
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[70vh]">
            
            {/* Status Overview */}
            <div className={`p-4 rounded-xl border mb-6 ${
              validation.isValid 
                ? 'bg-green-500/10 border-green-400/30' 
                : 'bg-red-500/10 border-red-400/30'
            }`}>
              <div className="flex items-center gap-3 mb-2">
                {validation.isValid ? (
                  <CheckCircle className="h-6 w-6 text-green-400" />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-red-400" />
                )}
                <h3 className={`font-semibold ${validation.isValid ? 'text-green-300' : 'text-red-300'}`}>
                  {validation.isValid ? 'All APIs Configured!' : 'API Configuration Required'}
                </h3>
              </div>
              
              {!validation.isValid && (
                <div className="space-y-1">
                  {validation.issues.map((issue, index) => (
                    <div key={index} className="text-red-200 text-sm">• {issue}</div>
                  ))}
                </div>
              )}
              
              {validation.isValid && (
                <div className="text-green-200 text-sm">
                  Your app is ready to use real AI agents! Switch to Live Mode to start executing with real APIs.
                </div>
              )}
            </div>

            {/* API Services */}
            <div className="space-y-6">
              {apiServices.map((service) => (
                <div key={service.name} className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full ${
                        service.isConfigured ? 'bg-green-400' : 'bg-red-400'
                      }`} />
                      <div>
                        <h4 className="font-semibold text-white text-lg">
                          {service.name}
                          {service.optional && <span className="text-gray-400 text-sm ml-2">(Optional)</span>}
                        </h4>
                        <p className="text-gray-300 text-sm">{service.description}</p>
                      </div>
                    </div>
                    
                    <a
                      href={service.setupUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Setup
                    </a>
                  </div>

                  {/* Current Status */}
                  <div className="bg-slate-700/50 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-300 text-sm font-medium">{service.key}</span>
                      <div className="flex items-center gap-2">
                        {service.currentValue && (
                          <button
                            onClick={() => toggleShowKey(service.name)}
                            className="p-1 rounded text-gray-400 hover:text-white transition-colors"
                          >
                            {showKeys[service.name] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        )}
                        {service.currentValue && (
                          <button
                            onClick={() => copyToClipboard(service.currentValue)}
                            className="p-1 rounded text-gray-400 hover:text-white transition-colors"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-sm font-mono bg-slate-900/50 rounded p-2">
                      {service.currentValue ? (
                        showKeys[service.name] ? 
                          service.currentValue : 
                          '•'.repeat(service.currentValue.length)
                      ) : (
                        <span className="text-red-400">Not configured</span>
                      )}
                    </div>
                  </div>

                  {/* Setup Instructions */}
                  <div className="space-y-2">
                    <h5 className="text-white font-medium text-sm">Setup Instructions:</h5>
                    <ol className="space-y-1">
                      {service.instructions.map((instruction, index) => (
                        <li key={index} className="text-gray-300 text-sm flex items-start gap-2">
                          <span className="text-blue-400 font-medium">{index + 1}.</span>
                          {instruction}
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Test Connection */}
                  {service.isConfigured && (
                    <div className="mt-4 pt-4 border-t border-slate-700">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-300">Connection Status:</span>
                        {testResults[service.name.toLowerCase()] ? (
                          <div className="flex items-center gap-2 text-green-400 text-sm">
                            <CheckCircle className="h-4 w-4" />
                            Connected
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-yellow-400 text-sm">
                            <AlertTriangle className="h-4 w-4" />
                            Not tested
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Test All Connections */}
            <div className="mt-8 p-6 bg-slate-800/50 rounded-xl border border-slate-700">
              <h4 className="font-semibold text-white mb-4">Test API Connections</h4>
              <p className="text-gray-300 text-sm mb-4">
                Test all your API connections to ensure they're working properly before switching to Live Mode.
              </p>
              
              <button
                onClick={testApiConnections}
                disabled={isTesting || !validation.canUseRealMode}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                {isTesting ? (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                ) : (
                  <Zap className="h-5 w-5" />
                )}
                {isTesting ? 'Testing Connections...' : 'Test All Connections'}
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">
                💡 Tip: All API keys are stored locally in your browser and never sent to our servers.
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Close
                </button>
                
                {validation.isValid && (
                  <button
                    onClick={() => {
                      onSetupComplete();
                      onClose();
                    }}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Start Using Real APIs
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiSetupGuide;