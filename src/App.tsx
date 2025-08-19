import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import CoreInteractionPage from './pages/CoreInteractionPage';

// Lazy load the advanced features page for optimal performance
const FeaturesAnalyticsPage = React.lazy(() => import('./pages/FeaturesAnalyticsPage'));

function App() {
  useEffect(() => {
    console.log('🚀 SmartCRM AI Agent Suite - Router Initialized');
  }, []);

  return (
    <ThemeProvider>
      <ErrorBoundary
        fallbackTitle="SmartCRM Router Error"
        fallbackMessage="The application router encountered an error. This might be due to routing or component loading issues."
        onError={(error, errorInfo) => {
          console.error('Router-level error:', error, errorInfo);
        }}
      >
        <Router>
          <Routes>
            {/* Core Interaction Page - Fast loading essentials */}
            <Route 
              path="/" 
              element={
                <ErrorBoundary 
                  fallbackTitle="Core Page Error" 
                  fallbackMessage="The core interaction page failed to load."
                  showRetry={true}
                >
                  <CoreInteractionPage />
                </ErrorBoundary>
              } 
            />
            
            {/* Advanced Features & Analytics Page - Lazy loaded */}
            <Route 
              path="/features-analytics" 
              element={
                <ErrorBoundary 
                  fallbackTitle="Advanced Features Error" 
                  fallbackMessage="The advanced features page failed to load."
                  showRetry={true}
                >
                  <React.Suspense fallback={
                    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 via-blue-100 to-gray-100 dark:from-slate-900 dark:via-blue-900 dark:to-slate-900">
                      <LoadingSpinner 
                        message="Loading Advanced Features & Analytics..." 
                        size="large" 
                        showIcon={true}
                      />
                    </div>
                  }>
                    <FeaturesAnalyticsPage />
                  </React.Suspense>
                </ErrorBoundary>
              } 
            />
            
            {/* Fallback route for any unmatched paths */}
            <Route 
              path="*" 
              element={
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 via-blue-100 to-gray-100 dark:from-slate-900 dark:via-blue-900 dark:to-slate-900">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Page Not Found</h1>
                    <p className="text-gray-700 dark:text-gray-300 mb-6">The page you're looking for doesn't exist.</p>
                    <Link 
                      to="/" 
                      className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      <ArrowLeft className="h-5 w-5" />
                      Back to Home
                    </Link>
                  </div>
                </div>
              } 
            />
          </Routes>
        </Router>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;