"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { usePathname } from "next/navigation";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundaryInner extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    
    // Attempt to log the error to our telemetry endpoint
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
        console.error("Failed to send telemetry:", err);
      });
    } catch (telemetryError) {
      console.error("Failed to prepare telemetry:", telemetryError);
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-gray-900 p-6">
          <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl space-y-6 text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">Something went wrong</h1>
              <p className="mt-2 text-sm text-gray-500">
                We&apos;ve automatically logged this issue and our team will look into it. 
                Please try reloading the page.
              </p>
            </div>
            
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function GlobalErrorBoundary({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  
  // By passing pathname as key, we force the ErrorBoundary to unmount and remount when the route changes.
  // This allows the user to navigate away from an error page.
  return <ErrorBoundaryInner key={pathname}>{children}</ErrorBoundaryInner>;
}
