// components/ErrorBoundary.tsx
'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    
    // Send to telemetry endpoint
    try {
      const errorData = {
        error_message: error.message || String(error),
        error_stack: error.stack,
        route: window.location.pathname,
        user_agent: navigator.userAgent,
        metadata: {
          componentStack: errorInfo.componentStack,
          screen: `${window.innerWidth}x${window.innerHeight}`,
          language: navigator.language,
        }
      };

      fetch("/api/telemetry/errors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(errorData),
      }).catch(err => {
        // Silently fail if telemetry fails
        console.error("Failed to send error telemetry");
      });
    } catch (e) {
      // Ignore
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-100 dark:border-red-900/30 m-4">
          <h2 className="text-xl font-semibold text-red-800 dark:text-red-400 mb-2">Something went wrong</h2>
          <p className="text-sm text-red-600 dark:text-red-300 mb-6 max-w-md">
            {this.state.error?.message || "An unexpected error occurred in the application."}
          </p>
          <button
            onClick={this.handleRetry}
            className="px-4 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/50 dark:hover:bg-red-900/80 text-red-800 dark:text-red-300 rounded-lg font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
