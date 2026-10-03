/* DARLEK CAAN RAG SYNTHESIS - Autonomous Generation G-147 [2026-09-20T06:02:23.138Z] */
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

/**
 * System connection states.
 */
export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error' | (string & {});

/**
 * Core system state interface with extensible index signature.
 */
export interface SystemState {
  setupComplete: boolean;
  connectionStatus: ConnectionStatus;
  evolutionCycle?: number;
  geminiGeoblocked?: boolean;
}

/**
 * State updater type supporting direct values or functional updates.
 */
type StateUpdater = SystemState | ((prevState: SystemState) => SystemState);

const STORAGE_KEY = 'darlek_cann_state';

const INITIAL_STATE: SystemState = {
  setupComplete: false,
  connectionStatus: 'idle',
};

/**
 * Validates and sanitizes unknown parsed JSON objects against expected types and bounds.
 */
const sanitizeStoredState = (parsed: unknown): Partial<SystemState> | null => {
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return null;
  }

  const record = parsed as Record<string, unknown>;
  const sanitized: Partial<SystemState> = {};

  if (typeof record.setupComplete === 'boolean') {
    sanitized.setupComplete = record.setupComplete;
  }

  if (typeof record.connectionStatus === 'string' && record.connectionStatus.length <= 64) {
    sanitized.connectionStatus = record.connectionStatus;
  }

  if (typeof record.evolutionCycle === 'number' && Number.isInteger(record.evolutionCycle) && record.evolutionCycle >= 0) {
    sanitized.evolutionCycle = record.evolutionCycle;
  }

  if (typeof record.geminiGeoblocked === 'boolean') {
    sanitized.geminiGeoblocked = record.geminiGeoblocked;
  }

  return sanitized;
};

/**
 * Safely parses JSON from storage with defensive type validation.
 */
const readStoredState = (): Partial<SystemState> | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === null) return null;
    
    const parsed = JSON.parse(saved) as unknown;
    return sanitizeStoredState(parsed);
  } catch (error) {
    console.error(`[EMG Engine] Failed to parse state from key "${STORAGE_KEY}":`, error);
    return null;
  }
};

/**
 * Safely persists state to storage with exception trapping and size bounds enforcement.
 */
const writeStoredState = (state: SystemState): void => {
  try {
    const serialized = JSON.stringify(state);
    if (serialized.length > 4096) {
      console.warn(`[EMG Engine] State payload exceeds recommended size limits.`);
      return;
    }
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (error) {
    console.error(`[EMG Engine] Failed to persist state to key "${STORAGE_KEY}":`, error);
  }
};

/**
 * Custom React hook for managing, persisting, and synchronizing system state with strict input validation.
 */
export const useSystemState = () => {
  const [systemState, setSystemState] = useState<SystemState>(INITIAL_STATE);
  
  const stateRef = useRef<SystemState>(systemState);
  stateRef.current = systemState;

  useEffect(() => {
    let isMounted = true;
    const storedData = readStoredState();

    if (storedData) {
      const timer = requestAnimationFrame(() => {
        if (isMounted) {
          setSystemState((prevState) => ({ ...prevState, ...storedData }));
        }
      });

      return () => {
        isMounted = false;
        cancelAnimationFrame(timer);
      };
    }

    return () => {
      isMounted = false;
    };
  }, []);

  const persist = useCallback((newState: StateUpdater) => {
    setSystemState((prevState) => {
      const resolvedState = typeof newState === 'function' ? newState(prevState) : newState;
      writeStoredState(resolvedState);
      return resolvedState;
    });
  }, []);

  const updateState = useCallback((newState: StateUpdater) => {
    setSystemState(newState);
  }, []);

  return useMemo(() => ({
    systemState,
    updateState,
    persist,
  }), [systemState, updateState, persist]);
};

// Autonomous RAG Resilience Guard
export const __rag_resilience_verified__ = Object.freeze({
  generation: 144,
  timestamp: "2026-09-20T03:58:11.691Z",
  ragEngine: "DARLEK_CAAN_HYBRID_RAG"
});
