import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  ExternalLink, 
  Eye, 
  EyeOff, 
  Copy, 
  Key,
  Zap,
  RefreshCw,
  Info,
  HelpCircle,
  Shield,
  Database,
  Brain
} from 'lucide-react';
import { apiConfig, validateApiSetup, logApiStatus } from '../config/apiConfig';
import Tooltip from './Tooltip';

interface ApiSetupGuideProps {
  isOpen: boolean;
  onClose: () => void;
  onSetupComplete: () => void;
}

const ApiSetupGuide: React.FC<ApiSetupGuideProps> = ({ isOpen, onClose, onSetupComplete }) => {
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  const [isTesting, setIsTesting] = useState(false);
  const [activeTab, setActiveTab] = useState<'setup' | 'help' | 'security'>('setup');

  const toggleShowKey = (service: string) => {
    setShowKeys(prev => ({ ...prev, [service]: !prev[service] }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const testApiConnections = async () => {
    setIsTesting(true);
    try {
      const results: Record<string, boolean> = {
        openai: apiConfig.openai.isConfigured,
        gemini: apiConfig.gemini.isConfigured,
        'openai agents': apiConfig.openai.isConfigured,
        elevenlabs: apiConfig.elevenlabs.isConfigured,
        supabase: apiConfig.supabase.isConfigured
      };
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
      description: 'Powers AI agent intelligence with GPT-4 or other OpenAI models',
      setupUrl: 'https://platform.openai.com/api-keys',
      isConfigured: apiConfig.openai.isConfigured,
      currentValue: apiConfig.openai.apiKey,
      instructions: [
        'Go to OpenAI Platform',
        'Sign in or create an account',
        'Navigate to API Keys section',
        'Create a new secret key',
        'Copy and paste it into your .env file'
      ],
      helpText: 'OpenAI provides powerful LLM capabilities for AI agents. You need either OpenAI or Gemini for Live Mode.'
    },
    {
      name: 'Gemini',
      key: 'VITE_GEMINI_API_KEY',
      description: 'Alternative LLM provider using Google\'s Gemini models',
      setupUrl: 'https://aistudio.google.com/app/apikey',
      isConfigured: apiConfig.gemini.isConfigured,
      currentValue: apiConfig.gemini.apiKey,
      instructions: [
        'Go to Google AI Studio',
        'Sign in with your Google account',
        'Navigate to the API Keys section',
        'Create a new API key',
        'Copy and paste it into your .env file'
      ],
      helpText: 'Gemini is Google\'s alternative to OpenAI, providing advanced LLM capabilities. You need either OpenAI or Gemini for Live Mode.'
    },
    {
      name: 'OpenAI Agents',
      key: 'VITE_OPENAI_API_KEY',
      description: 'Required for tool integrations (email, calendar, Slack, CRM records)',
      setupUrl: 'https://platform.openai.com/docs/guides/agents',
      isConfigured: apiConfig.openai.isConfigured,
      currentValue: apiConfig.openai.apiKey,
      instructions: [
        'Go to the OpenAI Agents documentation',
        'Sign in to your OpenAI account',
        'Navigate to the API Keys section',
        'Create a new secret key',
        'Copy and paste it into your .env file'
      ],
      helpText: 'The OpenAI Agents SDK enables CRM tool calls such as send_email, create_calendar_event, send_slack_message, create_contact, create_deal, log_activity and search_contacts. Without an OpenAI key, tool actions will be simulated.'
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
      ],
      helpText: 'ElevenLabs provides natural voice responses from AI agents. This is optional but enhances the experience.'
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
      ],
      helpText: 'Supabase provides the database for storing CRM data. Without this, data will not persist between sessions.'
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

          {/* Tabs */}
          <div className="flex border-b border-slate-700">
            <button
              onClick={() => setActiveTab('setup')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'setup' 
                  ? 'text-blue-400 border-b-2 border-blue-400' 
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              API Setup
            </button>
            <button
              onClick={() => setActiveTab('help')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'help' 
                  ? 'text-blue-400 border-b-2 border-blue-400' 
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Help & FAQ
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'security' 
                  ? 'text-blue-400 border-b-2 border-blue-400' 
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Security
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[70vh]">
            {activeTab === 'setup' && (
              <>
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
                    <Tooltip 
                      content={validation.isValid ? 
                        "Your system is ready for Live Mode execution" : 
                        "Some required APIs are missing or misconfigured"
                      }
                      position="top"
                    />
                  </div>
                  
                  <div className="bg-slate-800/50 rounded-lg p-3 mt-3">
                    <div className="text-sm text-blue-300 mb-2 font-medium">Available LLM Providers:</div>
                    <div className="flex flex-wrap gap-3">
                      <div className={`px-3 py-1 rounded-full text-xs flex items-center gap-1 ${
                        validation.hasOpenAI ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        <div className={`w-2 h-2 rounded-full ${
                          validation.hasOpenAI ? 'bg-green-400' : 'bg-gray-400'
                        }`}></div>
                        OpenAI {validation.hasOpenAI ? 'Connected' : 'Not Configured'}
                      </div>
                      
                      <div className={`px-3 py-1 rounded-full text-xs flex items-center gap-1 ${
                        validation.hasGemini ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        <div className={`w-2 h-2 rounded-full ${
                          validation.hasGemini ? 'bg-green-400' : 'bg-gray-400'
                        }`}></div>
                        Gemini {validation.hasGemini ? 'Connected' : 'Not Configured'}
                      </div>
                    </div>
                  </div>
                  
                  {!validation.isValid && (
                    <div className="space-y-1 mt-3">
                      {validation.issues.map((issue, index) => (
                        <div key={index} className="text-red-200 text-sm">• {issue}</div>
                      ))}
                    </div>
                  )}
                  
                  {validation.isValid && (
                    <div className="text-green-200 text-sm mt-3">
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
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-white text-lg">
                                {service.name}
                                {service.optional && <span className="text-gray-400 text-sm ml-2">(Optional)</span>}
                              </h4>
                              <Tooltip 
                                content={service.helpText || service.description}
                                position="top"
                              />
                            </div>
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
                              '•'.repeat(Math.min(service.currentValue.length, 30))
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

                      {/* LLM Provider Info for Gemini */}
                      {service.name === 'Gemini' && (
                        <div className="mt-4 p-3 bg-purple-500/10 border border-purple-400/30 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Brain className="h-4 w-4 text-purple-400" />
                            <span className="font-medium text-purple-300 text-sm">New Alternative to OpenAI</span>
                          </div>
                          <p className="text-purple-200 text-xs">
                            Gemini is Google's alternative to OpenAI's models. You can use either Gemini or OpenAI for your 
                            AI agent intelligence - only one LLM provider is required. Each has different strengths and pricing.
                          </p>
                        </div>
                      )}

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
                  <div className="flex items-center gap-3 mb-4">
                    <Zap className="h-6 w-6 text-purple-400" />
                    <h4 className="font-semibold text-white">Test API Connections</h4>
                    <Tooltip 
                      content="Verify all your API connections before switching to Live Mode"
                      position="top"
                    />
                  </div>
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
              </>
            )}

            {activeTab === 'help' && (
              <div className="space-y-6">
                <div className="bg-blue-500/10 border border-blue-400/30 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <HelpCircle className="h-6 w-6 text-blue-400" />
                    <h3 className="text-xl font-semibold text-white">Frequently Asked Questions</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-slate-700/30 rounded-lg p-4">
                      <h4 className="font-semibold text-white mb-2">What's the difference between OpenAI and Gemini?</h4>
                      <p className="text-gray-300 text-sm">
                        <strong>OpenAI</strong> and <strong>Gemini</strong> are both powerful LLM providers with some key differences:
                        <br /><br />
                        • <strong>OpenAI</strong> offers GPT-4 and other models with strong tool usage capabilities<br />
                        • <strong>Gemini</strong> is Google's alternative with strong reasoning abilities<br />
                        • You only need to configure one of them (not both)<br />
                        • They have different pricing models and capabilities<br />
                        • Our system supports seamless switching between them
                      </p>
                    </div>
                    
                    <div className="bg-slate-700/30 rounded-lg p-4">
                      <h4 className="font-semibold text-white mb-2">Which API keys are absolutely required?</h4>
                      <p className="text-gray-300 text-sm">
                        <strong>Either OpenAI or Gemini</strong> is required for Live Mode to function. For full functionality:
                        <br /><br />
                        • <strong>OpenAI Agents</strong> enables integration with business tools<br />
                        • <strong>ElevenLabs</strong> provides voice capabilities<br />
                        • <strong>Supabase</strong> enables data persistence
                      </p>
                    </div>
                    
                    <div className="bg-slate-700/30 rounded-lg p-4">
                      <h4 className="font-semibold text-white mb-2">How do I get started with minimal setup?</h4>
                      <p className="text-gray-300 text-sm">
                        1. Start with <strong>either OpenAI or Gemini API key</strong> only - this enables basic Live Mode<br />
                        2. Begin with simple goals like "Score and prioritize leads"<br />
                        3. Add more API integrations as you get comfortable<br />
                        4. Gradually move to more complex goals
                      </p>
                    </div>
                    
                    <div className="bg-slate-700/30 rounded-lg p-4">
                      <h4 className="font-semibold text-white mb-2">What if I don't want to set up APIs?</h4>
                      <p className="text-gray-300 text-sm">
                        You can use Demo Mode indefinitely! It provides a complete simulation of all features without requiring any API keys. It's perfect for exploring the system's capabilities before committing to Live Mode.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-500/10 border border-purple-400/30 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Info className="h-6 w-6 text-purple-400" />
                    <h3 className="text-xl font-semibold text-white">Troubleshooting</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-slate-700/30 rounded-lg p-4">
                      <h4 className="font-semibold text-white mb-2">API Key Not Working</h4>
                      <ul className="text-gray-300 text-sm space-y-2">
                        <li>• Ensure your API key is correctly copied without extra spaces</li>
                        <li>• Verify your OpenAI account has billing enabled</li>
                        <li>• Check if your API key has the correct permissions</li>
                        <li>• Try generating a new API key if problems persist</li>
                      </ul>
                    </div>
                    
                    <div className="bg-slate-700/30 rounded-lg p-4">
                      <h4 className="font-semibold text-white mb-2">Rate Limit Errors</h4>
                      <ul className="text-gray-300 text-sm space-y-2">
                        <li>• Both OpenAI and Gemini have rate limits based on your account tier</li>
                        <li>• Avoid executing multiple complex goals simultaneously</li>
                        <li>• Wait a minute before retrying if you hit a rate limit</li>
                        <li>• Consider upgrading your LLM provider plan for higher limits</li>
                      </ul>
                    </div>
                    
                    <div className="bg-slate-700/30 rounded-lg p-4">
                      <h4 className="font-semibold text-white mb-2">Tool Connection Issues</h4>
                      <ul className="text-gray-300 text-sm space-y-2">
                        <li>• Ensure your OpenAI account has access to the Agents SDK tools</li>
                        <li>• Check that you've granted the required permissions</li>
                        <li>• Some tools require additional setup in their respective dashboards</li>
                        <li>• Verify your tool credentials are still valid and not expired</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="bg-green-500/10 border border-green-400/30 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Shield className="h-6 w-6 text-green-400" />
                    <h3 className="text-xl font-semibold text-white">Security Information</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-slate-700/30 rounded-lg p-4">
                      <h4 className="font-semibold text-white mb-2">How Your API Keys Are Handled</h4>
                      <ul className="text-gray-300 text-sm space-y-2">
                        <li>• API keys are stored locally in your browser's localStorage</li>
                        <li>• Keys are never sent to our servers or third parties</li>
                        <li>• API calls are made directly from your browser to the respective services</li>
                        <li>• Your keys are automatically cleared when you clear browser data</li>
                      </ul>
                    </div>
                    
                    <div className="bg-slate-700/30 rounded-lg p-4">
                      <h4 className="font-semibold text-white mb-2">Data Privacy</h4>
                      <ul className="text-gray-300 text-sm space-y-2">
                        <li>• Your CRM data remains private and is processed locally</li>
                        <li>• In Live Mode, data is sent directly to the APIs you've configured</li>
                        <li>• We follow standard security practices for all data handling</li>
                        <li>• You maintain full control over your data and integrations</li>
                      </ul>
                    </div>
                    
                    <div className="bg-slate-700/30 rounded-lg p-4">
                      <h4 className="font-semibold text-white mb-2">Best Practices</h4>
                      <ul className="text-gray-300 text-sm space-y-2">
                        <li>• Use API keys with appropriate permission scopes</li>
                        <li>• Regularly rotate your API keys for enhanced security</li>
                        <li>• Monitor your API usage in the respective dashboards</li>
                        <li>• Set usage limits to prevent unexpected charges</li>
                        <li>• Use a private/incognito browser window when working in public</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-400/30 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Database className="h-6 w-6 text-blue-400" />
                    <h3 className="text-xl font-semibold text-white">Data Handling</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-slate-700/30 rounded-lg p-4">
                      <h4 className="font-semibold text-white mb-2">LLM Provider Data Usage</h4>
                      <p className="text-gray-300 text-sm">
                        Data sent to OpenAI or Gemini is subject to their respective data usage policies. By default, these providers may use your data for service improvement. If this is a concern, you can request data opt-out through their respective platforms.
                      </p>
                      <div className="flex gap-4 mt-2">
                        <a 
                          href="https://platform.openai.com/docs/data-usage-policies" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 text-sm inline-flex items-center gap-1"
                        >
                          OpenAI Policies <ExternalLink className="h-3 w-3" />
                        </a>
                        <a 
                          href="https://ai.google.dev/docs/safety_guidance" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-purple-400 hover:text-purple-300 text-sm inline-flex items-center gap-1"
                        >
                          Gemini Policies <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                    
                    <div className="bg-slate-700/30 rounded-lg p-4">
                      <h4 className="font-semibold text-white mb-2">Tool Integration Security</h4>
                      <p className="text-gray-300 text-sm">
                        When connecting tools via OpenAI Agents, you grant access permissions to those services. Review the specific permissions requested during the OAuth flow to ensure they align with your security requirements.
                      </p>
                    </div>
                    
                    <div className="bg-slate-700/30 rounded-lg p-4">
                      <h4 className="font-semibold text-white mb-2">Compliance Considerations</h4>
                      <p className="text-gray-300 text-sm">
                        If you're handling sensitive or regulated data (PII, PHI, financial information), ensure your usage complies with relevant regulations like GDPR, HIPAA, or CCPA. Consider using data anonymization techniques when appropriate.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400 flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-400" />
                API keys are stored locally in your browser and never sent to our servers.
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