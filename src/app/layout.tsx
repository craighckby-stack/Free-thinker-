'use client';

import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import './globals.css';

export const dynamic = 'force-dynamic';

export interface RootLayoutProps {
  children: React.ReactNode;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo?: ErrorInfo | null;
  copySuccess?: boolean;
}

class RootLayoutErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  private _isMounted = false;
  private _copyTimeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, copySuccess: false };
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    let resolvedError: Error;
    if (error instanceof Error) {
      resolvedError = error;
    } else if (typeof error === 'string') {
      resolvedError = new Error(error);
    } else if (error && typeof error === 'object' && 'message' in error && typeof (error as Record<string, unknown>).message === 'string') {
      resolvedError = new Error(String((error as Record<string, unknown>).message));
    } else {
      resolvedError = new Error('Unknown runtime error encountered in RootLayout');
    }

    return {
      hasError: true,
      error: resolvedError,
      copySuccess: false,
    };
  }

  componentDidMount(): void {
    this._isMounted = true;
  }

  componentDidUpdate(prevProps: { children: ReactNode }): void {
    if (this.state.hasError && prevProps.children !== this.props.children) {
      this.setState({ hasError: false, error: null, errorInfo: null, copySuccess: false });
    }
  }

  componentWillUnmount(): void {
    this._isMounted = false;
    if (this._copyTimeoutId !== null) {
      clearTimeout(this._copyTimeoutId);
      this._copyTimeoutId = null;
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (this._isMounted) {
      this.setState({ errorInfo });
    }
    if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
      try {
        console.error('[RootLayout] Uncaught render exception:', error, errorInfo);
      } catch {
        // Defensive no-op against console logging failures in restricted sandboxes
      }
    }
  }

  private handleReload = (): void => {
    try {
      if (this._isMounted) {
        this.setState({ hasError: false, error: null, errorInfo: null, copySuccess: false });
      }
      if (typeof window !== 'undefined' && window.location) {
        try {
          window.location.reload();
        } catch {
          window.location.href = window.location.pathname || '/';
        }
      }
    } catch (reloadErr) {
      if (process.env.NODE_ENV !== 'production') {
        try {
          console.error('[RootLayout] Recovery reload failed:', reloadErr);
        } catch {
          // Silent fallback
        }
      }
    }
  };

  private handleGoHome = (): void => {
    try {
      if (this._isMounted) {
        this.setState({ hasError: false, error: null, errorInfo: null, copySuccess: false });
      }
      if (typeof window !== 'undefined' && window.location) {
        window.location.href = '/';
      }
    } catch {
      // Fallback reload if href assignment fails in restricted environments
      this.handleReload();
    }
  };

  private handleCopyDiagnostics = async (): Promise<void> => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const diagnosticPayload = {
        name: this.state.error?.name || 'Error',
        message: this.state.error?.message || 'Unknown error',
        stack: this.state.error?.stack || null,
        componentStack: this.state.errorInfo?.componentStack || null,
        timestamp: new Date().toISOString(),
        url: typeof window.location !== 'undefined' ? window.location.href : 'N/A',
        userAgent: typeof window.navigator !== 'undefined' ? window.navigator.userAgent : 'N/A',
      };

      let serialized = '';
      try {
        serialized = JSON.stringify(diagnosticPayload, null, 2);
      } catch {
        serialized = `[Diagnostic serialization error]\n${String(this.state.error?.message || '')}`;
      }

      if (typeof navigator !== 'undefined' && navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(serialized);
      } else if (typeof document !== 'undefined' && document.body) {
        // Fallback for environments where clipboard writeText is restricted
        const textarea = document.createElement('textarea');
        textarea.value = serialized;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '0';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        try {
          document.execCommand('copy');
        } finally {
          document.body.removeChild(textarea);
        }
      }

      if (this._isMounted) {
        if (this._copyTimeoutId !== null) {
          clearTimeout(this._copyTimeoutId);
        }
        this.setState({ copySuccess: true });
        this._copyTimeoutId = setTimeout(() => {
          if (this._isMounted) {
            this.setState({ copySuccess: false });
          }
          this._copyTimeoutId = null;
        }, 2000);
      }
    } catch {
      // Defensive no-op if clipboard permissions are restricted
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const errorMessage =
        this.state.error?.message && typeof this.state.error.message === 'string'
          ? this.state.error.message
          : 'The application encountered an unexpected runtime failure during layout orchestration.';
      const isDev = process.env.NODE_ENV !== 'production';

      return (
        <main
          id="main-content"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
          className="flex min-h-screen flex-col items-center justify-center bg-[#050811] p-6 text-center text-white selection:bg-cyan-500/30 selection:text-cyan-200"
        >
          <div className="w-full max-w-md rounded-2xl border border-cyan-500/30 bg-[#0b1021]/90 p-8 shadow-2xl backdrop-blur-xl transition-all">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/20">
              <svg
                aria-hidden="true"
                className="h-6 w-6 stroke-current"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-cyan-400">Application Initialization Error</h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-400 break-words">
              {errorMessage}
            </p>

            {isDev && (this.state.error?.stack || this.state.errorInfo?.componentStack) ? (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-xs font-mono text-cyan-400/80 hover:text-cyan-300 select-none">
                  Inspect Diagnostics
                </summary>
                <div className="mt-2 relative">
                  <pre className="max-h-40 overflow-auto rounded bg-[#050811]/90 p-2.5 font-mono text-[10px] text-slate-400 select-all border border-slate-800 whitespace-pre-wrap">
                    {this.state.error?.stack || this.state.errorInfo?.componentStack || 'No stack trace available.'}
                  </pre>
                  <button
                    type="button"
                    onClick={this.handleCopyDiagnostics}
                    className="mt-1.5 inline-block text-[10px] font-mono text-cyan-400/70 hover:text-cyan-300 focus:outline-none focus:underline"
                  >
                    {this.state.copySuccess ? 'Copied to clipboard!' : 'Copy diagnostic info'}
                  </button>
                </div>
              </details>
            ) : null}

            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={this.handleReload}
                className="inline-flex items-center justify-center rounded-lg bg-cyan-500/20 px-5 py-2.5 text-sm font-semibold text-cyan-200 transition-all duration-200 hover:bg-cyan-500/30 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-[#050811] active:scale-[0.98]"
              >
                Reload Application
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="inline-flex items-center justify-center rounded-lg border border-slate-700/60 bg-slate-800/40 px-5 py-2.5 text-sm font-semibold text-slate-300 transition-all duration-200 hover:bg-slate-700/50 hover:text-white focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-[#050811] active:scale-[0.98]"
              >
                Return Home
              </button>
            </div>
          </div>
        </main>
      );
    }

    return this.props.children ?? null;
  }
}

export default function RootLayout({ children }: RootLayoutProps): React.JSX.Element {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#050811" />
        <meta name="color-scheme" content="dark" />
        <meta name="format-detection" content="telephone=no, date=no, address=no, email=no" />
      </head>
      <body
        className="bg-[#050811] text-white min-h-screen antialiased selection:bg-cyan-500/30 selection:text-cyan-200 overflow-x-hidden"
        suppressHydrationWarning
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-cyan-500 focus:px-4 focus:py-2 focus:text-black focus:font-bold focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-300"
        >
          Skip to main content
        </a>
        <RootLayoutErrorBoundary>
          {children ?? null}
        </RootLayoutErrorBoundary>
      </body>
    </html>
  );
}
