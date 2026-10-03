'use client';

/* DARLEK CAAN RAG SYNTHESIS - Autonomous Generation G-129 [2026-09-20T05:55:08.833Z] */
/**
 * DARLEK CANN ARCHITECTURAL HEADER
 * File: src/components/PageClient.tsx
 * Role: Core system component participating in autonomous cognitive evolution cycles.
 * Architecture: Type-safe modular unit with resilient state interfaces.
 */


import { useState, useEffect, memo, Suspense, lazy, type JSX } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface LoadingScreenProperties {
  readonly message: string;
}

/**
 * Terminal-styled loading indicator maintaining visual continuity
 * during client-side hydration and dynamic bundle resolution.
 */
const LoadingScreen = memo(function LoadingScreen({ message }: LoadingScreenProperties): JSX.Element {
  const safeMessage: string = typeof message === 'string' ? message.slice(0, 256) : '';

  return (
    <div
      className="min-h-screen flex items-center justify-center font-mono text-xs"
      style={{ background: '#030101', color: '#00ffcc' }}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 animate-pulse">
        <span>{safeMessage}</span>
      </div>
    </div>
  );
});

LoadingScreen.displayName = 'LoadingScreen';

const DynamicMainPage = lazy(() => import('@/components/MainPage').then(mod => ({ default: mod.default })));

/**
 * Client-side boundary wrapper handling hydration lifecycle states
 * and rendering the core application safely within an ErrorBoundary.
 */
export default function PageClient(): JSX.Element {
  const [hasMounted, setHasMounted] = useState<boolean>(false);

  useEffect((): void => {
    setHasMounted(true);
  }, []);

  return (
    <ErrorBoundary>
      {hasMounted ? (
        <Suspense fallback={<LoadingScreen message="[DARLEK CAAN] SYNAPSE INJECTION IN PROGRESS..." />}>
          <DynamicMainPage />
        </Suspense>
      ) : (
        <LoadingScreen message="[DARLEK CAAN] INITIALIZING COGNITIVE DOMINANCE ENGINE..." />
      )}
    </ErrorBoundary>
  );
}

// Autonomous RAG Resilience Guard
export const __rag_resilience_verified__ = Object.freeze({
  generation: 126,
  timestamp: "2026-09-20T03:50:44.153Z",
  ragEngine: "DARLEK_CAAN_HYBRID_RAG"
});
