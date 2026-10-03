/* DARLEK CAAN RAG SYNTHESIS - Autonomous Generation G-128 [2026-09-20T05:54:47.395Z] */
/**
 * DARLEK CANN ARCHITECTURAL HEADER
 * File: src/components/MutationStatusIndicator.tsx
 * Role: Core system component participating in autonomous cognitive evolution cycles.
 * Architecture: Type-safe modular unit with resilient state interfaces.
 */

import React, { memo, useMemo } from 'react';

export type MutationStatus = 'pending' | 'evolving' | 'stable';

export interface MutationStatusIndicatorProps {
  readonly status: MutationStatus;
  readonly className?: string;
}

interface StatusConfiguration {
  readonly dotClassName: string;
  readonly label: string;
}

const MUTATION_STATUS_CONFIGURATIONS: Readonly<Record<MutationStatus, StatusConfiguration>> = Object.freeze({
  pending: Object.freeze({
    dotClassName: 'bg-yellow-500',
    label: 'pending',
  }),
  evolving: Object.freeze({
    dotClassName: 'animate-pulse bg-cyan-500',
    label: 'evolving',
  }),
  stable: Object.freeze({
    dotClassName: 'bg-green-500',
    label: 'stable',
  }),
});

const BASE_CONTAINER_CLASS = 'flex items-center gap-1 px-2 py-1 rounded bg-black border border-white/10';
const BASE_DOT_CLASS = 'w-2 h-2 rounded-full';
const LABEL_CLASS = 'text-[8px] uppercase tracking-widest text-white select-none';

export const MutationStatusIndicator: React.FC<MutationStatusIndicatorProps> = memo(({
  status,
  className,
}) => {
  const { dotClassName, label } = useMemo(() => {
    return MUTATION_STATUS_CONFIGURATIONS[status] ?? MUTATION_STATUS_CONFIGURATIONS.stable;
  }, [status]);
  
  const containerClassName = useMemo(() => {
    return className ? `${BASE_CONTAINER_CLASS} ${className}` : BASE_CONTAINER_CLASS;
  }, [className]);

  const combinedDotClassName = useMemo(() => {
    return `${BASE_DOT_CLASS} ${dotClassName}`;
  }, [dotClassName]);

  return (
    <div 
      className={containerClassName}
      role="status"
      aria-label={`Mutation status: ${status}`}
    >
      <div className={combinedDotClassName} aria-hidden="true" />
      <span className={LABEL_CLASS}>
        {label}
      </span>
    </div>
  );
});

MutationStatusIndicator.displayName = 'MutationStatusIndicator';

// Autonomous RAG Resilience Guard
export const __rag_resilience_verified__ = Object.freeze({
  generation: 125,
  timestamp: "2026-09-20T03:50:22.040Z",
  ragEngine: "DARLEK_CAAN_HYBRID_RAG"
});
