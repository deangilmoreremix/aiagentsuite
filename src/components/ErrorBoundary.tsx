import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Bug, Eye, Home, HelpCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  showRetry?: boolean;
  showDetails?: boolean;
  onError?: (error: Error, errorInfo: any) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
  showDetails: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      showDetails: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      showDetails: false
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  toggleDetails = () => {
    this.setState(prevState => ({ 
      showDetails: !prevState.showDetails 
    }));
  };

  render() {
    if (this.state.hasError) {
      const { 
        fallbackTitle = "Something went wrong", 
        fallbackMessage = "This section encountered an unexpected error.",
        showRetry = true,
        showDetails = true
      } = this.props;

      return (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-400/30 rounded-xl p-8 text-center max-w-2xl mx-auto my-8">
          {/* Error Icon */}
          <div className="p-4 rounded-full bg-red-100 dark:bg-red-500/20 mx-auto mb-6 w-fit">
            <AlertTriangle className="h-12 w-12 text-red-600 dark:text-red-400" />
          </div>

          {/* Error Title */}
          <h2 className="text-2xl font-bold text-red-800 dark:text-red-300 mb-4">
            {fallbackTitle}
          </h2>

          {/* Error Message */}
          <p className="text-red-700 dark:text-red-200 mb-6 leading-relaxed">
            {fallbackMessage}
          </p>

          {/* Error Details Toggle */}
          {showDetails && this.state.error && (
            <div className="mb-6">
              <button
                onClick={this.toggleDetails}
                className="flex items-center gap-2 mx-auto px-4 py-2 bg-red-100 dark:bg-red-500/20 hover:bg-red-200 dark:hover:bg-red-500/30 text-red-700 dark:text-red-300 rounded-lg transition-colors"
              >
                <Bug className="h-4 w-4" />
                {this.state.showDetails ? 'Hide' : 'Show'} Error Details
              </button>

              {this.state.showDetails && (
                <div className="mt-4 p-4 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-500/30 rounded-lg text-left">
                  <div className="text-sm text-red-800 dark:text-red-200 mb-2 font-medium">
                    Error: {this.state.error.message}
                  </div>
                  <div className="text-xs text-red-600 dark:text-red-400 font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
                    {this.state.error.stack}
                  </div>
                  {this.state.errorInfo && (
                    <div className="mt-2 text-xs text-red-600 dark:text-red-400 font-mono whitespace-pre-wrap max-h-24 overflow-y-auto">
                      Component Stack: {this.state.errorInfo.componentStack}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {showRetry && (
              <button
                onClick={this.handleRetry}
                className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                <RefreshCw className="h-5 w-5" />
                Try Again
              </button>
            )}
            
            <button
              onClick={this.handleReload}
              className="flex items-center gap-2 px-6 py-3 border border-red-600 dark:border-red-400 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg font-medium transition-colors"
            >
              <Home className="h-5 w-5" />
              Reload Page
            </button>

            <button
              onClick={() => window.open('https://github.com/your-repo/issues', '_blank')}
              className="flex items-center gap-2 px-4 py-3 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
            >
              <HelpCircle className="h-4 w-4" />
              Report Issue
            </button>
          </div>

          {/* Recovery Tips */}
          <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-400/30 rounded-lg">
            <h3 className="font-medium text-yellow-800 dark:text-yellow-300 mb-2">Quick Recovery Tips:</h3>
            <ul className="text-sm text-yellow-700 dark:text-yellow-200 space-y-1 text-left">
              <li>• Check your browser console (F12) for more error details</li>
              <li>• Try refreshing the page to clear any temporary issues</li>
              <li>• If in Live Mode, verify your API keys are properly configured</li>
              <li>• Switch to Demo Mode if you're experiencing API-related errors</li>
            </ul>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;