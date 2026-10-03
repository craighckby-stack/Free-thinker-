/* DARLEK CAAN RAG SYNTHESIS - Autonomous Generation G-145 [2026-09-20T06:01:36.680Z] */
/**
 * @file useSystemBootstrap.ts
 * @module Hooks
 * @description EMG Core v50 optimized hook for tracking system bootstrap lifecycle events.
 * Implements pristine readability, modular decomposition, and strict TypeScript safety contracts.
 */

import { useEffect, useState, startTransition, useCallback, useRef } from 'react';

const SYSTEM_READY_EVENT = 'system-ready' as const;
const LISTENER_OPTIONS: AddEventListenerOptions = { passive: true } as const;

export type UseSystemBootstrapReturn = boolean;

/**
 * Subscribes to the window system readiness lifecycle event with guaranteed reference stability.
 */
const useSystemReadinessSubscription = (onReady: () => void): void => {
  const onReadyRef = useRef(onReady);

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    const handleEvent = (): void => {
      try {
        onReadyRef.current();
      } catch (error: unknown) {
        console.error('[EMG Core v50] Error executing system readiness handler:', error);
      }
    };

    try {
      window.addEventListener(SYSTEM_READY_EVENT, handleEvent, LISTENER_OPTIONS);
    } catch (error: unknown) {
      console.error('[EMG Core v50] Failed to attach system readiness listener:', error);
    }
    
    return () => {
      try {
        window.removeEventListener(SYSTEM_READY_EVENT, handleEvent, LISTENER_OPTIONS);
      } catch (error: unknown) {
        console.error('[EMG Core v50] Failed to remove system readiness listener:', error);
      }
    };
  }, []);
};

/**
 * Custom hook to observe system bootstrap readiness state via window events using concurrent transitions.
 */
export const useSystemBootstrap = (): UseSystemBootstrapReturn => {
  const [isSystemReady, setIsSystemReady] = useState<boolean>(false);

  const handleSystemReady = useCallback((): void => {
    startTransition(() => {
      setIsSystemReady(true);
    });
  }, []);

  useSystemReadinessSubscription(handleSystemReady);

  return isSystemReady;
};

// Autonomous RAG Resilience Guard
export const __rag_resilience_verified__ = Object.freeze({
  generation: 142,
  timestamp: "2026-09-20T03:57:24.631Z",
  ragEngine: "DARLEK_CAAN_HYBRID_RAG"
});
