import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowRight, 
  ArrowLeft, 
  X, 
  Play, 
  ChevronRight,
  Lightbulb,
  Target,
  Zap,
  Eye,
  Star,
  Sparkles,
  Bot,
  CheckCircle,
  ArrowDown,
  ArrowUp,
  ArrowLeftIcon,
  ArrowRightIcon,
  Settings,
  AlertTriangle,
  Info,
  Brain,
  MessageSquare
} from 'lucide-react';

interface WalkthroughStep {
  id: string;
  title: string;
  description: string;
  targetSelector: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  icon?: any;
  highlight?: boolean;
  actionText?: string;
  offset?: { x: number; y: number };
  tip?: string;
  warning?: string;
}

interface PageWalkthroughProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  onOpenApiSetup?: () => void;
}

const walkthroughSteps: WalkthroughStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to AI Goal Explorer! 🚀',
    description: 'This interactive page lets you discover, select, and execute business goals using AI agents. You can experience it in two different modes - let me explain the difference!',
    targetSelector: '[data-walkthrough="header"]',
    position: 'bottom',
    icon: Sparkles,
    highlight: true,
    actionText: 'Start Tour',
    offset: { x: 0, y: 20 },
    tip: 'This tour will guide you through all the key features. You can restart it anytime by clicking the "?" button.'
  },
  {
    id: 'mode-explanation',
    title: 'Two Modes: Demo vs Live 🔄',
    description: 'SmartCRM operates in two distinct modes. Demo Mode shows simulated AI responses (safe to explore), while Live Mode executes real actions with your APIs (requires setup).',
    targetSelector: '[data-walkthrough="mode-toggle"]',
    position: 'left',
    icon: Brain,
    highlight: true,
    offset: { x: -20, y: 0 },
    tip: 'Always start with Demo Mode to understand how everything works before switching to Live Mode.',
    warning: 'Live Mode performs real actions - only enable after setting up your API keys!'
  },
  {
    id: 'live-dashboard',
    title: 'Live System Dashboard 📊',
    description: 'Watch real-time metrics as AI agents work on your goals. Track active executions, completed goals, business value generated, and agent activity across your entire system.',
    targetSelector: '[data-walkthrough="dashboard"]',
    position: 'bottom',
    icon: Target,
    highlight: true,
    offset: { x: 0, y: 20 },
    tip: 'These metrics update in real-time as you execute goals. In Live Mode, these represent actual business results!'
  },
  {
    id: 'search-filters',
    title: 'Smart Goal Discovery 🔍',
    description: 'Use the search bar and filters to find goals that match your business needs. Filter by category (Sales, Marketing, etc.), priority level, or complexity to find the perfect automation.',
    targetSelector: '[data-walkthrough="filters"]',
    position: 'bottom',
    icon: Lightbulb,
    highlight: true,
    offset: { x: 0, y: 20 },
    tip: 'Start with "High Priority" + "Simple" complexity for quick wins!'
  },
  {
    id: 'goal-cards',
    title: 'Interactive Goal Cards ⚡',
    description: 'Each goal card shows business impact, required agents, and setup time. Hover to see live metrics like estimated value and success probability. Each card is a complete automation workflow.',
    targetSelector: '[data-walkthrough="goal-card"]:first-child',
    position: 'right',
    icon: Zap,
    highlight: true,
    offset: { x: 20, y: 0 },
    tip: 'Try hovering over this goal card to see additional metrics and details appear!'
  },
  {
    id: 'execution-demo',
    title: 'Goal Execution Experience 🤖',
    description: 'Click "Start Interactive Demo" to watch AI agents work step-by-step on a live CRM interface. In Demo Mode, you\'ll see simulated responses. In Live Mode, real actions are performed!',
    targetSelector: '[data-walkthrough="goal-card"]:first-child button',
    position: 'top',
    icon: Bot,
    highlight: true,
    offset: { x: 0, y: -20 },
    tip: 'This opens a full-screen execution modal where you can watch agents collaborate in real-time.'
  },
  {
    id: 'ai-console-intro',
    title: 'AI Console & Voice Interaction 💬',
    description: 'The AI console in the header lets you interact with agents using natural language - either by typing or speaking. Try commands like "Create contact for John Smith" or "Schedule demo for Friday".',
    targetSelector: '.hero input[type="text"]',
    position: 'bottom',
    icon: MessageSquare,
    highlight: true,
    offset: { x: 0, y: 20 },
    tip: 'You can use voice commands by clicking the microphone icon! The AI understands natural speech patterns.'
  },
  {
    id: 'quick-actions',
    title: 'Smart Quick Actions 🎯',
    description: 'Execute multiple goals at once with pre-built strategies. Choose "High Priority" for maximum impact, "Quick Wins" for fast results, or "Sales Focus" for revenue generation.',
    targetSelector: '[data-walkthrough="quick-actions"]',
    position: 'top',
    icon: Star,
    highlight: true,
    offset: { x: 0, y: -20 },
    tip: 'These batch actions let you automate entire workflows with a single click!'
  },
  {
    id: 'api-setup',
    title: 'Live Mode Setup 🔴',
    description: 'To use Live Mode, you\'ll need to configure API keys for OpenAI (required), Composio (tool integrations), and optionally ElevenLabs (voice). Click "Settings" next to the mode toggle to begin setup.',
    targetSelector: '[data-walkthrough="mode-toggle"]',
    position: 'left',
    icon: Settings,
    highlight: true,
    offset: { x: -20, y: 0 },
    warning: 'Only set up Live Mode when you\'re ready for real AI execution in your business tools!'
  },
  {
    id: 'complete',
    title: 'You\'re Ready to Go! 🎉',
    description: 'Start by selecting a goal that matches your business needs, then watch AI agents execute it in real-time. Remember: Demo Mode for safe exploration, Live Mode for actual business automation!',
    targetSelector: '[data-walkthrough="goal-cards"]',
    position: 'top',
    icon: CheckCircle,
    highlight: true,
    actionText: 'Start Exploring',
    offset: { x: 0, y: -20 },
    tip: 'Pro tip: Begin with "Score and prioritize leads" - it\'s simple but provides immediate value!'
  }
];

const PageWalkthrough: React.FC<PageWalkthroughProps> = ({
  isOpen,
  onClose,
  onComplete,
  onOpenApiSetup
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);

  const step = walkthroughSteps[currentStep];

  // Scroll target element into view and calculate tooltip position
  useEffect(() => {
    if (!isOpen || !step) return;

    const targetEl = document.querySelector(step.targetSelector) as HTMLElement;
    if (!targetEl || !tooltipRef.current) return;

    setTargetElement(targetEl);

    // Smooth scroll to target element
    targetEl.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'center'
    });

    // Wait for scroll to complete before positioning tooltip
    setTimeout(() => {
      const targetRect = targetEl.getBoundingClientRect();
      const tooltipRect = tooltipRef.current!.getBoundingClientRect();
      const padding = 20;
      const offset = step.offset || { x: 0, y: 0 };

      let top = 0;
      let left = 0;

      switch (step.position) {
        case 'top':
          top = targetRect.top - tooltipRect.height - padding + offset.y;
          left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2) + offset.x;
          break;
        case 'bottom':
          top = targetRect.bottom + padding + offset.y;
          left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2) + offset.x;
          break;
        case 'left':
          top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2) + offset.y;
          left = targetRect.left - tooltipRect.width - padding + offset.x;
          break;
        case 'right':
          top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2) + offset.y;
          left = targetRect.right + padding + offset.x;
          break;
      }

      // Keep tooltip within viewport
      const maxTop = window.innerHeight - tooltipRect.height - padding;
      const maxLeft = window.innerWidth - tooltipRect.width - padding;
      
      top = Math.max(padding, Math.min(top, maxTop));
      left = Math.max(padding, Math.min(left, maxLeft));

      setTooltipPosition({ top, left });
    }, 300);
  }, [currentStep, step, isOpen]);

  // Enhanced highlight effect for target element
  useEffect(() => {
    if (!isOpen || !targetElement || !step.highlight) return;

    const originalStyle = {
      position: targetElement.style.position,
      zIndex: targetElement.style.zIndex,
      boxShadow: targetElement.style.boxShadow,
      transform: targetElement.style.transform,
      outline: targetElement.style.outline,
      outlineOffset: targetElement.style.outlineOffset
    };

    // Enhanced highlight with pulsing effect
    targetElement.style.position = 'relative';
    targetElement.style.zIndex = '40';
    targetElement.style.outline = '3px solid rgba(59, 130, 246, 0.8)';
    targetElement.style.outlineOffset = '4px';
    targetElement.style.boxShadow = `
      0 0 0 8px rgba(59, 130, 246, 0.2),
      0 0 30px rgba(59, 130, 246, 0.4),
      0 0 60px rgba(59, 130, 246, 0.2)
    `;
    targetElement.style.transform = 'scale(1.02)';
    targetElement.style.transition = 'all 0.3s ease';

    // Add pulsing animation
    const pulseKeyframes = `
      @keyframes walkthroughPulse {
        0%, 100% { 
          outline-color: rgba(59, 130, 246, 0.8);
          box-shadow: 
            0 0 0 8px rgba(59, 130, 246, 0.2),
            0 0 30px rgba(59, 130, 246, 0.4),
            0 0 60px rgba(59, 130, 246, 0.2);
        }
        50% { 
          outline-color: rgba(59, 130, 246, 1);
          box-shadow: 
            0 0 0 12px rgba(59, 130, 246, 0.3),
            0 0 40px rgba(59, 130, 246, 0.6),
            0 0 80px rgba(59, 130, 246, 0.3);
        }
      }
    `;

    // Add keyframes to document if not already present
    if (!document.querySelector('#walkthrough-pulse-styles')) {
      const style = document.createElement('style');
      style.id = 'walkthrough-pulse-styles';
      style.textContent = pulseKeyframes;
      document.head.appendChild(style);
    }

    targetElement.style.animation = 'walkthroughPulse 2s ease-in-out infinite';

    return () => {
      // Restore original styles
      Object.entries(originalStyle).forEach(([prop, value]) => {
        (targetElement.style as any)[prop] = value;
      });
      targetElement.style.animation = '';
      
      // Remove keyframes when walkthrough is done
      const styleElement = document.querySelector('#walkthrough-pulse-styles');
      if (styleElement && !isOpen) {
        styleElement.remove();
      }
    };
  }, [targetElement, step.highlight, isOpen]);

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const styleElement = document.querySelector('#walkthrough-pulse-styles');
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, []);

  const nextStep = () => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    
    setTimeout(() => {
      if (currentStep < walkthroughSteps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        onComplete();
        onClose();
      }
      setIsTransitioning(false);
    }, 150);
  };

  const prevStep = () => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    
    setTimeout(() => {
      if (currentStep > 0) {
        setCurrentStep(currentStep - 1);
      }
      setIsTransitioning(false);
    }, 150);
  };

  const skipTour = () => {
    onClose();
  };

  if (!isOpen || !step) return null;

  const IconComponent = step.icon || Target;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === walkthroughSteps.length - 1;

  // Get arrow icon based on position
  const getArrowIcon = () => {
    switch (step.position) {
      case 'top': return ArrowDown;
      case 'bottom': return ArrowUp;
      case 'left': return ArrowRightIcon;
      case 'right': return ArrowLeftIcon;
      default: return ArrowDown;
    }
  };

  const ArrowIcon = getArrowIcon();

  return (
    <>
      {/* Enhanced Backdrop Overlay with spotlight effect */}
      <div className="fixed inset-0 z-30 animate-fadeIn">
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
        
        {/* Spotlight effect around target */}
        {targetElement && (
          <div 
            ref={spotlightRef}
            className="absolute pointer-events-none"
            style={{
              background: `radial-gradient(circle at ${tooltipPosition.left + 200}px ${tooltipPosition.top + 100}px, 
                transparent 120px, 
                rgba(0,0,0,0.3) 180px, 
                rgba(0,0,0,0.7) 300px)`
            }}
          />
        )}
      </div>

      {/* Enhanced Tooltip with connection line */}
      <div
        ref={tooltipRef}
        className="fixed z-50 max-w-md animate-scaleIn"
        style={{
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
          opacity: isTransitioning ? 0 : 1,
          transform: isTransitioning ? 'scale(0.95)' : 'scale(1)',
          transition: 'opacity 0.15s ease, transform 0.15s ease'
        }}
      >
        <div className="bg-gradient-to-br from-slate-800/98 to-slate-900/98 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl relative overflow-hidden">
          {/* Enhanced background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 25% 25%, #3b82f6 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}></div>
          </div>

          {/* Glowing border */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 rounded-2xl blur-sm"></div>

          {/* Enhanced tooltip arrow with glow */}
          <div className={`absolute z-10 ${
            step.position === 'top' ? 'bottom-[-12px] left-1/2 -translate-x-1/2' :
            step.position === 'bottom' ? 'top-[-12px] left-1/2 -translate-x-1/2' :
            step.position === 'left' ? 'right-[-12px] top-1/2 -translate-y-1/2' :
            'left-[-12px] top-1/2 -translate-y-1/2'
          }`}>
            <div className="relative">
              <div className={`w-6 h-6 bg-slate-800 border border-slate-700/50 transform rotate-45 ${
                step.position === 'top' ? 'border-b border-r' :
                step.position === 'bottom' ? 'border-t border-l' :
                step.position === 'left' ? 'border-t border-r' :
                'border-b border-l'
              }`} />
              <div className="absolute inset-0 w-6 h-6 bg-blue-500/20 transform rotate-45 blur-sm"></div>
            </div>
          </div>

          {/* Direction indicator */}
          <div className={`absolute z-20 ${
            step.position === 'top' ? 'bottom-[-24px] left-1/2 -translate-x-1/2' :
            step.position === 'bottom' ? 'top-[-24px] left-1/2 -translate-x-1/2' :
            step.position === 'left' ? 'right-[-24px] top-1/2 -translate-y-1/2' :
            'left-[-24px] top-1/2 -translate-y-1/2'
          }`}>
            <div className="p-1 rounded-full bg-blue-500/20 border border-blue-400/30">
              <ArrowIcon className="h-3 w-3 text-blue-400 animate-bounce" />
            </div>
          </div>

          <div className="relative z-10 p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 relative">
                  <IconComponent className="h-5 w-5 text-white" />
                  <div className="absolute -inset-1 bg-white/20 rounded-lg animate-pulse"></div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{step.title}</h3>
                  <div className="text-sm text-gray-400">
                    Step {currentStep + 1} of {walkthroughSteps.length}
                  </div>
                </div>
              </div>
              
              <button
                onClick={skipTour}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-slate-700/50 transition-all duration-300 group"
                title="Skip tour"
              >
                <X className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </div>

            {/* Description */}
            <p className="text-gray-300 mb-6 leading-relaxed">{step.description}</p>

            {/* Warning or Tip */}
            {step.warning && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-400/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  <span className="text-red-300 text-sm font-medium">Warning:</span>
                </div>
                <p className="text-red-200 text-sm mt-1">{step.warning}</p>
              </div>
            )}

            {step.tip && (
              <div className="mb-4 p-3 bg-blue-500/10 border border-blue-400/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-blue-400" />
                  <span className="text-blue-300 text-sm font-medium">Pro Tip:</span>
                </div>
                <p className="text-blue-200 text-sm mt-1">{step.tip}</p>
              </div>
            )}

            {/* Enhanced Progress Bar */}
            <div className="mb-6">
              <div className="w-full bg-slate-700/50 rounded-full h-3 relative overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 h-3 rounded-full transition-all duration-500 relative"
                  style={{ width: `${((currentStep + 1) / walkthroughSteps.length) * 100}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>Progress</span>
                <span>{Math.round(((currentStep + 1) / walkthroughSteps.length) * 100)}%</span>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {!isFirstStep && (
                  <button
                    onClick={prevStep}
                    disabled={isTransitioning}
                    className="flex items-center gap-2 px-3 py-2 text-gray-300 hover:text-white transition-colors disabled:opacity-50"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Previous
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={skipTour}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Skip Tour
                </button>
                
                {/* Special action for API setup step */}
                {step.id === 'api-setup' && onOpenApiSetup && (
                  <button
                    onClick={() => {
                      onOpenApiSetup();
                      onClose();
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-all duration-300"
                  >
                    <Settings className="h-4 w-4" />
                    Open Setup
                  </button>
                )}
                
                <button
                  onClick={nextStep}
                  disabled={isTransitioning}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:hover:scale-100"
                >
                  {step.actionText || (isLastStep ? 'Complete' : 'Next')}
                  {!isLastStep && <ChevronRight className="h-4 w-4" />}
                  {isLastStep && <CheckCircle className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Special mode explanation for mode steps */}
            {step.id === 'mode-explanation' && (
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div className="p-2 bg-blue-500/10 border border-blue-400/30 rounded">
                  <div className="font-medium text-blue-300 mb-1">🔵 Demo Mode</div>
                  <div className="text-blue-200">Safe simulation - perfect for learning</div>
                </div>
                <div className="p-2 bg-red-500/10 border border-red-400/30 rounded">
                  <div className="font-medium text-red-300 mb-1">🔴 Live Mode</div>
                  <div className="text-red-200">Real execution - requires API setup</div>
                </div>
              </div>
            )}

            {isLastStep && (
              <div className="mt-4 p-3 bg-green-500/10 border border-green-400/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-green-400" />
                  <span className="text-green-300 text-sm font-medium">You're all set!</span>
                </div>
                <p className="text-green-200 text-sm mt-1">
                  Start with a simple goal to see the magic happen. Every goal shows real business impact!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default PageWalkthrough;