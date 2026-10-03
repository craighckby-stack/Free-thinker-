/* DARLEK CAAN RAG SYNTHESIS - Autonomous Generation G-119 [2026-09-20T05:51:04.857Z] */
/**
 * DARLEK CANN ARCHITECTURAL HEADER
 * File: src/components/ErrorBoundary.tsx
 * Role: Core system component participating in autonomous cognitive evolution cycles.
 * Architecture: Type-safe modular unit with resilient state interfaces.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Database } from 'lucide-react';
import { isQuotaExceededError, evictNonEssentialStorage } from '@/lib/safeStorage';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ParsedErrorDetails {
  errorMessage: string;
  isFirestoreError: boolean;
  isQuotaError: boolean;
}

const CHUNK_RELOAD_COOLDOWN_MS: number = 10000;
const LAST_CHUNK_RELOAD_KEY: string = 'last_chunk_reload';

/**
 * Encapsulates runtime exceptions, automatically handles chunk loading retries,
 * and renders a styled fallback interface for unrecoverable errors with sovereign type-safety.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[EMG Neural Engine] Uncaught error detected:', error, errorInfo);
    
    if (this.props.onError) {
      try {
        this.props.onError(error, errorInfo);
      } catch (callbackError: unknown) {
        console.error('[EMG Neural Engine] Error in onError callback:', callbackError);
      }
    }

    this.handleChunkLoadError(error);
  }

  private handleChunkLoadError(error: Error): void {
    const message: string | undefined = error?.message;
    const isChunkError: boolean = (Boolean(message) && message.includes('Loading chunk')) || error?.name === 'ChunkLoadError';

    if (!isChunkError) return;

    try {
      const lastReloadTimestamp: string | null = sessionStorage.getItem(LAST_CHUNK_RELOAD_KEY);
      const now: number = Date.now();
      const hasCooldownPassed: boolean = !lastReloadTimestamp || now - parseInt(lastReloadTimestamp, 10) > CHUNK_RELOAD_COOLDOWN_MS;

      if (hasCooldownPassed) {
        sessionStorage.setItem(LAST_CHUNK_RELOAD_KEY, now.toString());
        window.location.reload();
      }
    } catch (storageError: unknown) {
      console.warn('[EMG Neural Engine] Session storage access denied during chunk recovery:', storageError);
    }
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleClearAndReset = (): void => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleNavigateHome = (): void => {
    window.location.href = '/';
  };

  private parseErrorDetails(error: Error | null): ParsedErrorDetails {
    if (!error?.message) {
      return { errorMessage: 'An unexpected system anomaly occurred.', isFirestoreError: false, isQuotaError: false };
    }

    if (isQuotaExceededError(error)) {
      // Proactively evict non-essential caches so immediate Reboot will succeed without manual reset
      evictNonEssentialStorage();
      return {
        errorMessage: 'Storage Quota Exceeded (browser localStorage quota reached). Bloated cache keys have been automatically evicted. Click "Reboot" to restore normal operation without losing keys.',
        isFirestoreError: false,
        isQuotaError: true,
      };
    }

    try {
      const parsed: unknown = JSON.parse(error.message);
      
      if (parsed && typeof parsed === 'object' && 'operationType' in parsed && 'authInfo' in parsed) {
        const operation: string = String((parsed as Record<string, unknown>).operationType).toUpperCase();
        const path: string = String((parsed as Record<string, unknown>).path || 'unknown');
        const detailError: string = String((parsed as Record<string, unknown>).error || '');
        return {
          errorMessage: `Firestore ${operation} error at path: ${path}. ${detailError}`,
          isFirestoreError: true,
          isQuotaError: false,
        };
      }
      return { errorMessage: String(error.message || error), isFirestoreError: false, isQuotaError: false };
    } catch {
      return { errorMessage: String(error.message || error), isFirestoreError: false, isQuotaError: false };
    }
  }

  public render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.props.fallback) {
      return this.props.fallback;
    }

    const { errorMessage, isFirestoreError } = this.parseErrorDetails(this.state.error);

    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 font-mono select-none">
        <div className="max-w-md w-full border border-red-900/30 bg-[#0A0000] p-8 rounded-lg shadow-2xl relative overflow-hidden">
          {/* Glitch Effect Background Pattern */}
          <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-red-950/50 rounded border border-red-900/50 animate-pulse">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <h1 className="text-xl font-bold text-red-500 tracking-tighter uppercase italic">Neural Collapse</h1>
            </div>

            <div className="space-y-4 mb-8">
              <div className="p-4 bg-black border border-red-900/20 rounded text-[10px] text-red-400/80 leading-relaxed overflow-auto max-h-48 font-mono">
                <div className="font-bold mb-1 text-red-500 uppercase tracking-widest text-[8px]">Synaptic Error Signature:</div>
                {errorMessage}
              </div>
              
              {isFirestoreError && (
                <p className="text-[9px] text-red-600/60 italic uppercase tracking-tight">
                  CRITICAL: Security rules or authentication state preventing neural synchronization.
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={this.handleReset}
                className="flex items-center justify-center gap-1.5 p-2.5 bg-red-950/40 border border-red-800/50 text-red-400 hover:bg-red-900/50 transition-all rounded text-[9px] font-bold uppercase tracking-wider cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                Reboot
              </button>
              <button
                type="button"
                onClick={this.handleClearAndReset}
                className="flex items-center justify-center gap-1.5 p-2.5 bg-red-900/30 border border-red-600/50 text-red-300 hover:bg-red-800/50 transition-all rounded text-[9px] font-bold uppercase tracking-wider cursor-pointer"
              >
                <RefreshCw className="w-3 h-3 text-amber-400" />
                Clear & Reset
              </button>
              <button
                type="button"
                onClick={this.handleNavigateHome}
                className="flex items-center justify-center gap-1.5 p-2.5 bg-[#111] border border-[#333] text-gray-400 hover:text-white transition-all rounded text-[9px] font-bold uppercase tracking-wider cursor-pointer"
              >
                <Home className="w-3 h-3" />
                Home
              </button>
            </div>
          </div>

          {/* Decorative Scanline */}
          <div className="absolute top-0 left-0 w-full h-1 bg-red-500/10 animate-scanline pointer-events-none" />
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;

// Autonomous RAG Resilience Guard
export const __rag_resilience_verified__ = Object.freeze({
  generation: 119,
  timestamp: "2026-09-20T05:51:04.857Z",
  ragEngine: "DARLEK_CAAN_HYBRID_RAG"
});
