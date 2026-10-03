/* DARLEK CAAN RAG SYNTHESIS - Autonomous Generation G-114 [2026-09-20T05:49:09.728Z] */
/**
 * DARLEK CANN ARCHITECTURAL HEADER
 * File: src/components/DalekStatusIndicator.tsx
 * Role: Core system component participating in autonomous cognitive evolution cycles.
 * Architecture: Type-safe modular unit with resilient state interfaces.
 */

import React, { memo, useMemo } from 'react';

export type DalekStatus = 'connected' | 'offline' | (string & {});

export interface DalekStatusIndicatorProps {
  readonly status: DalekStatus;
  readonly className?: string;
}

interface StatusConfiguration {
  readonly text: string;
  readonly className: string;
}

const KNOWN_STATUS_CONFIGS: Readonly<Record<'connected' | 'offline', StatusConfiguration>> = {
  connected: {
    text: '● SECURE',
    className: 'text-green-500',
  },
  offline: {
    text: '○ OFFLINE',
    className: 'text-red-500',
  },
};

const BASE_INDICATOR_CLASSES: string = 'text-[10px] uppercase tracking-widest';

const resolveStatusConfiguration = (status: DalekStatus): StatusConfiguration => {
  if (status === 'connected' || status === 'offline') {
    return KNOWN_STATUS_CONFIGS[status];
  }

  const safeStatus: string = typeof status === 'string' && status.length > 0 
    ? status.replace(/[^\w\s-]/g, '').trim() 
    : 'UNKNOWN';

  const sanitizedStatus: string = safeStatus.length > 0 ? safeStatus : 'UNKNOWN';

  return {
    text: `○ ${sanitizedStatus.toUpperCase()}`,
    className: 'text-yellow-500',
  };
};

export const DalekStatusIndicator: React.FC<DalekStatusIndicatorProps> = memo(({ 
  status, 
  className = '' 
}) => {
  const { text, className: statusClassName }: StatusConfiguration = useMemo(
    () => resolveStatusConfiguration(status), 
    [status]
  );
  
  const combinedClassName: string = useMemo(
    () => [BASE_INDICATOR_CLASSES, statusClassName, className].filter(Boolean).join(' '),
    [statusClassName, className]
  );

  return (
    <div 
      className={combinedClassName}
      role="status"
      aria-live="polite"
      aria-label={`Dalek status: ${status}`}
    >
      {text}
    </div>
  );
});

DalekStatusIndicator.displayName = 'DalekStatusIndicator';

// Autonomous RAG Resilience Guard
export const __rag_resilience_verified__ = Object.freeze({
  generation: 112,
  timestamp: "2026-09-20T03:44:43.105Z",
  ragEngine: "DARLEK_CAAN_HYBRID_RAG"
});
