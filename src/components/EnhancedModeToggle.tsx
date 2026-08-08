import React from 'react';
import { Zap, PlayCircle, Shield, AlertTriangle, CheckCircle, Settings, Eye } from 'lucide-react';
import Tooltip from './Tooltip';

interface EnhancedModeToggleProps {
  realMode: boolean;
  onToggle: (mode: boolean) => void;
  onOpenApiSetup: () => void;
  size?: 'small' | 'medium' | 'large';
  showFullDetails?: boolean;
}

const EnhancedModeToggle: React.FC<EnhancedModeToggleProps> = ({ 
  realMode, 
  onToggle, 
  onOpenApiSetup,
  size = 'medium',
  showFullDetails = true 
}) => {
  const validation = {
    canUseRealMode: true, // This would come from your API config validation
    hasOpenAI: true,
    hasComposio: false,
    hasVoice: false
  };

  return (
    <div className={`${
      size === 'large' ? 'p-6' : size === 'medium' ? 'p-4' : 'p-3'
    } bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 relative overflow-hidden`}>
      
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 25% 25%, #3b82f6 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }}></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Shield className="h-6 w-6 text-blue-400" />
              <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${realMode ? 'bg-red-400' : 'bg-blue-400'} animate-pulse`}></div>
            </div>
            <div>
              <h3 className={`font-semibold text-white ${size === 'large' ? 'text-xl' : 'text-lg'}`}>
                Execution Mode
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm">Current:</span>
                <span className={`font-medium ${realMode ? 'text-red-300' : 'text-blue-300'}`}>
                  {realMode ? 'Live Mode' : 'Demo Mode'}
                </span>
                <Tooltip 
                  content={realMode ? 
                    "Live Mode executes real actions with your APIs and tools. Use carefully!" :
                    "Demo Mode shows simulated AI responses. Safe to explore and experiment."
                  }
                  position="top"
                  trigger="hover"
                />
              </div>
            </div>
          </div>
          
          <button
            onClick={onOpenApiSetup}
            className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-gray-400 hover:text-white transition-all duration-300 group"
            title="Open API setup"
          >
            <Settings className="h-5 w-5 group-hover:rotate-45 transition-transform duration-300" />
          </button>
        </div>

        {/* Mode Toggle Buttons */}
        <div className="flex bg-slate-700/50 rounded-xl p-1 mb-4 relative overflow-hidden">
          <div 
            className={`absolute top-1 bottom-1 bg-gradient-to-r transition-all duration-300 rounded-lg ${
              realMode 
                ? 'right-1 left-1/2 from-red-500 to-orange-500' 
                : 'left-1 right-1/2 from-blue-500 to-purple-500'
            }`}
          />
          
          <button
            onClick={() => onToggle(false)}
            className={`relative flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
              !realMode
                ? 'text-white shadow-lg z-10'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            <PlayCircle className="h-5 w-5" />
            <span className={size === 'large' ? 'text-base' : 'text-sm'}>Demo Mode</span>
            {!realMode && <div className="w-2 h-2 bg-blue-300 rounded-full animate-pulse" />}
          </button>
          
          <button
            onClick={() => onToggle(true)}
            className={`relative flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
              realMode
                ? 'text-white shadow-lg z-10'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            <Zap className="h-5 w-5" />
            <span className={size === 'large' ? 'text-base' : 'text-sm'}>Live Mode</span>
            {realMode && <div className="w-2 h-2 bg-red-300 rounded-full animate-pulse" />}
          </button>
        </div>

        {/* Current Mode Status */}
        <div className={`p-4 rounded-xl border ${
          realMode 
            ? 'bg-red-500/10 border-red-400/30' 
            : 'bg-blue-500/10 border-blue-400/30'
        }`}>
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-3 h-3 rounded-full animate-pulse ${
              realMode ? 'bg-red-400' : 'bg-blue-400'
            }`}></div>
            <span className={`font-semibold ${
              realMode ? 'text-red-300' : 'text-blue-300'
            }`}>
              {realMode ? '🔴 LIVE MODE ACTIVE' : '🔵 DEMO MODE ACTIVE'}
            </span>
            <Tooltip 
              content={realMode ? 
                "Real AI agents are executing actual business actions with your configured APIs." :
                "Simulated AI responses for safe exploration. No real actions are performed."
              }
              position="top"
            />
          </div>
          
          <p className={`text-sm ${
            realMode ? 'text-red-200' : 'text-blue-200'
          }`}>
            {realMode 
              ? 'Real AI agents executing with your API keys and connected tools'
              : 'Simulated AI responses for demonstration purposes'
            }
          </p>
        </div>

        {/* API Status Indicators (for Live Mode) */}
        {realMode && showFullDetails && (
          <div className="mt-4 space-y-3">
            <h4 className="text-white font-medium text-sm flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              API Connections Status
            </h4>
            
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center justify-between p-2 bg-slate-700/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${validation.hasOpenAI ? 'bg-green-400' : 'bg-red-400'}`}></div>
                  <span className="text-sm text-gray-300">OpenAI</span>
                </div>
                <span className={`text-xs ${validation.hasOpenAI ? 'text-green-400' : 'text-red-400'}`}>
                  {validation.hasOpenAI ? 'Connected' : 'Not configured'}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-2 bg-slate-700/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${validation.hasComposio ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                  <span className="text-sm text-gray-300">Composio</span>
                </div>
                <span className={`text-xs ${validation.hasComposio ? 'text-green-400' : 'text-yellow-400'}`}>
                  {validation.hasComposio ? 'Connected' : 'Optional'}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-2 bg-slate-700/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${validation.hasVoice ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                  <span className="text-sm text-gray-300">ElevenLabs</span>
                </div>
                <span className={`text-xs ${validation.hasVoice ? 'text-green-400' : 'text-yellow-400'}`}>
                  {validation.hasVoice ? 'Connected' : 'Optional'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Feature Comparison (for Demo Mode) */}
        {!realMode && showFullDetails && (
          <div className="mt-4 space-y-3">
            <h4 className="text-white font-medium text-sm flex items-center gap-2">
              <Eye className="h-4 w-4 text-blue-400" />
              Demo Mode Features
            </h4>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-400" />
                <span className="text-gray-300">Full UI interaction</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-400" />
                <span className="text-gray-300">Simulated AI responses</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-400" />
                <span className="text-gray-300">Safe to experiment</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-400" />
                <span className="text-gray-300">No API keys required</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-4 flex gap-3">
          {!realMode && (
            <button
              onClick={() => onToggle(true)}
              className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 text-sm"
            >
              Switch to Live Mode
            </button>
          )}
          
          <button
            onClick={onOpenApiSetup}
            className={`px-4 py-2 border border-gray-600 text-gray-300 hover:text-white hover:border-gray-500 rounded-lg font-medium transition-all duration-300 text-sm ${
              !realMode ? '' : 'flex-1'
            }`}
          >
            {realMode ? 'Manage APIs' : 'Setup APIs'}
          </button>
        </div>

        {/* Warning for Live Mode */}
        {realMode && (
          <div className="mt-4 p-3 bg-orange-500/10 border border-orange-400/30 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-orange-400" />
              <span className="font-medium text-orange-300 text-sm">Live Mode Active</span>
            </div>
            <p className="text-orange-200 text-xs">
              AI agents will perform real actions in your connected tools. Monitor executions carefully.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedModeToggle;