"use client";

import React from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Optional custom fallback. Receives the error and a reset callback. */
  fallback?: (error: Error, reset: () => void) => React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Top-level safety net. Catches render-time errors in any descendant and shows
 * a friendly recovery screen instead of a blank white page. Does not interfere
 * with normal application logic — it only activates when a component throws.
 */
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Keep console diagnostics for developers; never surface raw details to users.
    console.error("[ErrorBoundary] Uncaught render error:", error, errorInfo);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background px-6">
          <div className="w-full max-w-md text-center space-y-6 animate-fade-in-up">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-destructive/10">
              <AlertTriangle className="h-10 w-10 text-destructive" />
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-black font-lora tracking-tight">
                Something went wrong
              </h1>
              <p className="text-base text-muted-foreground leading-relaxed">
                An unexpected error stopped this page from loading. Your data is safe — try
                again, or head back home.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={this.handleReload} className="rounded-xl font-bold gap-2">
                <RefreshCw className="h-4 w-4" />
                Reload page
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  window.location.href = "/";
                }}
                className="rounded-xl font-bold gap-2"
              >
                <Home className="h-4 w-4" />
                Go home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
