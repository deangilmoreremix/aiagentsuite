import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import Tooltip from './Tooltip';

interface ThemeToggleProps {
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  className?: string;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  size = 'medium', 
  showLabel = false,
  className = '' 
}) => {
  const { theme, toggleTheme } = useTheme();

  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-10 h-10',
    large: 'w-12 h-12'
  };

  const iconSizes = {
    small: 'h-4 w-4',
    medium: 'h-5 w-5',
    large: 'h-6 w-6'
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Tooltip 
        content={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        position="bottom"
      >
        <button
          onClick={toggleTheme}
          className={`${sizeClasses[size]} rounded-xl bg-slate-700/50 dark:bg-white/10 border border-slate-600/50 dark:border-white/20 hover:bg-slate-600/50 dark:hover:bg-white/20 transition-all duration-300 flex items-center justify-center group relative overflow-hidden`}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {/* Background animation */}
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 dark:from-blue-400/20 dark:to-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Icon with transition */}
          <div className="relative z-10 transition-transform duration-300 group-hover:scale-110">
            {theme === 'dark' ? (
              <Sun className={`${iconSizes[size]} text-yellow-400 dark:text-yellow-300`} />
            ) : (
              <Moon className={`${iconSizes[size]} text-slate-600 dark:text-blue-300`} />
            )}
          </div>
        </button>
      </Tooltip>
      
      {showLabel && (
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
          {theme} Mode
        </span>
      )}
    </div>
  );
};

export default ThemeToggle;