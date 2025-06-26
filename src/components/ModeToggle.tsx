import React from 'react';
import { Zap, PlayCircle, Shield, ExternalLink, Info } from 'lucide-react';

interface ModeToggleProps {
  realMode: boolean;
  onToggle: (mode: boolean) => void;
  size?: 'small' | 'large';
  showDescription?: boolean;
}

const ModeToggle: React.FC<ModeToggleProps> = ({ 
  realMode, 
  onToggle, 
  size = 'large',
  showDescription = true 
}) => {
  return (
    <div className={`${size === 'large' ? 'p-6' : 'p-4'} bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <Shield className="h-6 w-6 text-blue-400" />
          <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${realMode ? 'bg-red-400' : 'bg-blue-400'} animate-pulse`}></div>
        </div>
        <h3 className={`font-semibold text-white ${size === 'large' ? 'text-xl' : 'text-lg'}`}>
          Execution Mode
        </h3>
        <div className="ml-auto">
          <Info className="h-4 w-4 text-gray-400" />
        </div>
      </div>

      {/* Mode Toggle Buttons */}
      <div className="flex bg-slate-700/50 rounded-xl p-1 mb-4">
        <button
          onClick={() => onToggle(false)}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
            !realMode
              ? 'bg-blue-600 text-white shadow-lg transform scale-105'
              : 'text-gray-300 hover:text-white hover:bg-slate-600/50'
          }`}
        >
          <PlayCircle className="h-5 w-5" />
          <span className={size === 'large' ? 'text-base' : 'text-sm'}>Demo Mode</span>
        </button>
        <button
          onClick={() => onToggle(true)}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
            realMode
              ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg transform scale-105'
              : 'text-gray-300 hover:text-white hover:bg-slate-600/50'
          }`}
        >
          <Zap className="h-5 w-5" />
          <span className={size === 'large' ? 'text-base' : 'text-sm'}>Live Mode</span>
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

      {/* Detailed Descriptions */}
      {showDescription && (
        <div className="mt-4 space-y-4">
          <div className={`p-4 rounded-xl border transition-all duration-300 ${
            !realMode 
              ? 'bg-blue-500/10 border-blue-400/30' 
              : 'bg-slate-700/30 border-slate-600/30 opacity-60'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <PlayCircle className="h-4 w-4 text-blue-400" />
              <span className="font-medium text-blue-300">Demo Mode</span>
              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">FREE</span>
            </div>
            <ul className="text-xs text-gray-300 space-y-1">
              <li>• Simulated AI responses</li>
              <li>• No API keys required</li>
              <li>• Perfect for testing interface</li>
              <li>• No real actions performed</li>
            </ul>
          </div>

          <div className={`p-4 rounded-xl border transition-all duration-300 ${
            realMode 
              ? 'bg-red-500/10 border-red-400/30' 
              : 'bg-slate-700/30 border-slate-600/30 opacity-60'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-red-400" />
              <span className="font-medium text-red-300">Live Mode</span>
              <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full">REQUIRES SETUP</span>
            </div>
            <ul className="text-xs text-gray-300 space-y-1">
              <li>• Real OpenAI GPT-4 execution</li>
              <li>• Actual tool integrations</li>
              <li>• Real emails, meetings, actions</li>
              <li>• Production-ready results</li>
            </ul>
          </div>
        </div>
      )}

      {/* Setup Requirements for Live Mode */}
      {realMode && (
        <div className="mt-4 p-4 bg-orange-500/10 border border-orange-400/30 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <ExternalLink className="h-4 w-4 text-orange-400" />
            <span className="font-medium text-orange-300">Setup Required</span>
          </div>
          <ul className="text-xs text-orange-200 space-y-1">
            <li>• OpenAI API key configured</li>
            <li>• Connected business tools (Gmail, Slack, etc.)</li>
            <li>• OAuth permissions granted</li>
          </ul>
          <button className="mt-2 text-xs text-orange-400 hover:text-orange-300 underline">
            View setup guide →
          </button>
        </div>
      )}
    </div>
  );
};

export default ModeToggle;