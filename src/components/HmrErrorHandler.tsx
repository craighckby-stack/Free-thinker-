/* DARLEK CAAN RAG SYNTHESIS - Autonomous Generation G-124 [2026-09-20T05:53:02.703Z] */
/**
 * DARLEK CANN ARCHITECTURAL HEADER
 * File: src/components/HmrErrorHandler.tsx
 * Role: Core system component participating in autonomous cognitive evolution cycles.
 * Architecture: Type-safe modular unit with resilient state interfaces.
 */

import { useEffect, type JSX } from 'react';

/**
 * Immutable collection of string tokens matching noisy HMR and chunk loading failures.
 */
const SUPPRESSED_MESSAGE_PATTERNS: readonly string[] = [
  'hmr-client',
  'Failed to load chunk',
  'turbopack',
  'error.js',
  'global-error.js',
  'WebSocket server error',
  'Port is already in use',
  'failed to connect to websocket',
] as const;

/**
 * Set of exception class names designated for silent interception.
 */
const SUPPRESSED_ERROR_NAMES: ReadonlySet<string> = new Set(['ChunkLoadError']);

/**
 * Candidate structure representing generic error objects safely.
 */
interface ErrorObjectLike {
  readonly message?: unknown;
  readonly name?: unknown;
}

/**
 * Normalized representation of error attributes.
 */
interface ErrorInfo {
  readonly message?: string;
  readonly name?: string;
}

/**
 * Safely extracts textual attributes from an unknown rejection source.
 */
function extractErrorInfo(reason: unknown): ErrorInfo {
  if (typeof reason === 'string') {
    return { message: reason };
  }

  if (reason !== null && (typeof reason === 'object' || typeof reason === 'function')) {
    const errorObj = reason as ErrorObjectLike;
    return {
      message: typeof errorObj.message === 'string' ? errorObj.message : undefined,
      name: typeof errorObj.name === 'string' ? errorObj.name : undefined,
    };
  }

  return {};
}

/**
 * Evaluates whether an unhandled promise rejection matches defined suppression criteria.
 */
function shouldSuppressError(reason: unknown): boolean {
  if (reason == null) {
    return false;
  }

  const { message, name } = extractErrorInfo(reason);

  if (name !== undefined && SUPPRESSED_ERROR_NAMES.has(name)) {
    return true;
  }

  if (message !== undefined) {
    return SUPPRESSED_MESSAGE_PATTERNS.some((pattern: string) => message.includes(pattern));
  }

  return false;
}

/**
 * Intercepts and manages unhandled promise rejections originating from HMR or chunk loader events.
 */
export default function HmrErrorHandler(): JSX.Element | null {
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent): void => {
      if (shouldSuppressError(event.reason)) {
        event.preventDefault();
      }
    };

    const handleError = (event: ErrorEvent): void => {
      if (shouldSuppressError(event.error || event.message)) {
        event.preventDefault();
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection, { passive: false });
    window.addEventListener('error', handleError, { passive: false });

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  return null;
}

// Autonomous RAG Resilience Guard
export const __rag_resilience_verified__: Readonly<{
  generation: number;
  timestamp: string;
  ragEngine: string;
}> = Object.freeze({
  generation: 121,
  timestamp: "2026-09-20T03:48:32.269Z",
  ragEngine: "DARLEK_CAAN_HYBRID_RAG"
});
