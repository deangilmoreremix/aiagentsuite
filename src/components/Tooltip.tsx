import React, { useState, useRef, useEffect } from 'react';
import { Info, HelpCircle } from 'lucide-react';

interface TooltipProps {
  content: string;
  children?: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  trigger?: 'hover' | 'click';
  icon?: 'info' | 'help';
  className?: string;
}

const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  trigger = 'hover',
  icon = 'info',
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const IconComponent = icon === 'help' ? HelpCircle : Info;

  useEffect(() => {
    if (!isVisible || !tooltipRef.current || !triggerRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const padding = 8;

    let top = 0;
    let left = 0;

    switch (position) {
      case 'top':
        top = triggerRect.top - tooltipRect.height - padding;
        left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
        break;
      case 'bottom':
        top = triggerRect.bottom + padding;
        left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
        break;
      case 'left':
        top = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2);
        left = triggerRect.left - tooltipRect.width - padding;
        break;
      case 'right':
        top = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2);
        left = triggerRect.right + padding;
        break;
    }

    // Keep tooltip within viewport
    const maxTop = window.innerHeight - tooltipRect.height - padding;
    const maxLeft = window.innerWidth - tooltipRect.width - padding;
    
    top = Math.max(padding, Math.min(top, maxTop));
    left = Math.max(padding, Math.min(left, maxLeft));

    setTooltipPosition({ top, left });
  }, [isVisible, position]);

  const handleMouseEnter = () => {
    if (trigger === 'hover') setIsVisible(true);
  };

  const handleMouseLeave = () => {
    if (trigger === 'hover') setIsVisible(false);
  };

  const handleClick = () => {
    if (trigger === 'click') setIsVisible(!isVisible);
  };

  const handleClickOutside = (e: MouseEvent) => {
    if (trigger === 'click' && 
        tooltipRef.current && 
        triggerRef.current && 
        !tooltipRef.current.contains(e.target as Node) && 
        !triggerRef.current.contains(e.target as Node)) {
      setIsVisible(false);
    }
  };

  useEffect(() => {
    if (trigger === 'click') {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [trigger]);

  return (
    <>
      <div
        ref={triggerRef}
        className={`inline-flex items-center ${className}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        {children || (
          <IconComponent className="h-4 w-4 text-gray-400 hover:text-blue-400 cursor-help transition-colors" />
        )}
      </div>

      {isVisible && (
        <div
          ref={tooltipRef}
          className="fixed z-50 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg border border-slate-600 shadow-lg max-w-xs"
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
          }}
        >
          {content}
          <div className={`absolute w-2 h-2 bg-slate-800 border transform rotate-45 ${
            position === 'top' ? 'bottom-[-4px] left-1/2 -translate-x-1/2 border-b border-r border-slate-600' :
            position === 'bottom' ? 'top-[-4px] left-1/2 -translate-x-1/2 border-t border-l border-slate-600' :
            position === 'left' ? 'right-[-4px] top-1/2 -translate-y-1/2 border-t border-r border-slate-600' :
            'left-[-4px] top-1/2 -translate-y-1/2 border-b border-l border-slate-600'
          }`}></div>
        </div>
      )}
    </>
  );
};

export default Tooltip;