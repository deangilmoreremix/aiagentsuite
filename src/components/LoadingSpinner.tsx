import React from 'react';
import { useState, useEffect } from 'react';
import { Bot, Brain, Activity } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = 'Loading...', 
  size = 'medium',
  showIcon = true 
}) => {
  // Add error boundary protection
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const errorHandler = (error: ErrorEvent) => {
      console.error('LoadingSpinner error:', error);
      setHasError(true);
    };

    window.addEventListener('error', errorHandler);
    return () => window.removeEventListener('error', errorHandler);
  }, []);

  if (hasError) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="text-red-400 mb-2">Loading error occurred</div>
          <button 
            onClick={() => setHasError(false)}
            className="text-blue-400 hover:text-blue-300 text-sm underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8', 
    large: 'h-12 w-12'
  };

  const containerSizes = {
    small: 'py-4',
    medium: 'py-8',
    large: 'py-12'
  };

  return (
    <div className={`flex items-center justify-center ${containerSizes[size]}`}>
      <div className="text-center">
        {showIcon && (
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="relative">
              <Bot className={`${sizeClasses[size]} text-blue-400 animate-pulse`} />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <Brain className={`${sizeClasses[size]} text-purple-400 animate-pulse`} style={{animationDelay: '0.5s'}} />
            <Activity className={`${sizeClasses[size]} text-orange-400 animate-pulse`} style={{animationDelay: '1s'}} />
          </div>
        )}
        
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className={`animate-spin ${sizeClasses[size]} border-2 border-blue-400 border-t-transparent rounded-full`}></div>
          <span className="text-white dark:text-gray-200 font-medium">{message}</span>
        </div>
        
        <p className="text-sm text-gray-400 dark:text-gray-500">
          Loading AI-powered components...
        </p>
      </div>
    </div>
  );
};

export default LoadingSpinner;