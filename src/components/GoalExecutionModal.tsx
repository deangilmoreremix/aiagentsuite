import React, { useEffect } from 'react';
import { Goal } from '../types/goals';
import LiveGoalExecution from './LiveGoalExecution';
import { X, Maximize2, Minimize2, HelpCircle, AlertTriangle } from 'lucide-react';
import Tooltip from './Tooltip';

interface GoalExecutionModalProps {
  goal: Goal | null;
  isOpen: boolean;
  onClose: () => void;
  realMode?: boolean;
  onComplete?: (result: any) => void;
}

const GoalExecutionModal: React.FC<GoalExecutionModalProps> = ({
  goal,
  isOpen,
  onClose,
  realMode = false,
  onComplete
}) => {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleComplete = (result: any) => {
    onComplete?.(result);
    // Auto-close modal after showing results for a moment
    setTimeout(() => {
      onClose();
    }, 5000);
  };

  if (!isOpen || !goal) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="relative w-full h-full flex items-center justify-center p-4">
        <div className="relative w-full max-w-6xl h-full max-h-[90vh] bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900 rounded-2xl border border-slate-700/50 overflow-hidden animate-scaleIn shadow-2xl">
          
          {/* Modal Header */}
          <div className="relative z-20 flex items-center justify-between p-4 bg-gradient-to-r from-slate-800/90 to-slate-900/90 backdrop-blur-xl border-b border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500">
                <Maximize2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-white">{goal.title}</h1>
                  <Tooltip 
                    content="Watch AI agents work together to execute this goal in real-time"
                    position="top"
                  />
                </div>
                <p className="text-gray-300 text-sm">Watch AI agents work in real-time</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {realMode && (
                <div className="flex items-center gap-2 bg-red-500/20 px-3 py-1 rounded-full border border-red-400/30">
                  <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                  <span className="text-red-300 font-medium text-xs">LIVE MODE</span>
                  <Tooltip 
                    content="Live Mode: Real AI execution with your APIs. Actions will affect your actual business tools."
                    position="left"
                  />
                </div>
              )}
              
              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-gray-400 hover:text-white transition-all duration-300 group"
                title="Close (ESC)"
              >
                <X className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </div>
          </div>

          {/* Animated Background */}
          <div className="absolute inset-0 opacity-10">
            {/* Particle System */}
            <div className="absolute inset-0">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute rounded-full bg-blue-400/20 animate-pulse"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    width: `${Math.random() * 3 + 1}px`,
                    height: `${Math.random() * 3 + 1}px`,
                    animationDelay: `${Math.random() * 3}s`,
                    animationDuration: `${Math.random() * 4 + 3}s`
                  }}
                />
              ))}
            </div>

            {/* Data Flow Lines */}
            <div className="absolute inset-0">
              <div className="absolute top-1/3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent animate-pulse"></div>
              <div className="absolute top-2/3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent animate-pulse" style={{animationDelay: '1s'}}></div>
              <div className="absolute top-0 bottom-0 left-1/3 w-px bg-gradient-to-b from-transparent via-blue-500/30 to-transparent animate-pulse" style={{animationDelay: '2s'}}></div>
              <div className="absolute top-0 bottom-0 right-1/3 w-px bg-gradient-to-b from-transparent via-purple-500/30 to-transparent animate-pulse" style={{animationDelay: '3s'}}></div>
            </div>
          </div>
          
          {/* Modal Content */}
          <div className="relative z-10 h-full overflow-auto custom-scrollbar">
            <div className="p-4 pb-16">
              <LiveGoalExecution
                goal={goal}
                realMode={realMode}
                onComplete={handleComplete}
                onCancel={onClose}
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="absolute bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-slate-900/95 via-slate-900/80 to-transparent backdrop-blur-sm">
            <div className="flex items-center justify-center gap-4">
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span>AI agents working on your CRM</span>
              </div>
              <div className="text-gray-500">•</div>
              <div className="text-gray-400 text-sm">Press ESC to close</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoalExecutionModal;