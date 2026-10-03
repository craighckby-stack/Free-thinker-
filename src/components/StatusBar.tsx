/* DARLEK CAAN RAG SYNTHESIS - Autonomous Generation G-135 [2026-09-20T05:57:36.645Z] */
/**
 * DARLEK CANN ARCHITECTURAL HEADER
 * File: src/components/StatusBar.tsx
 * Role: Core system component participating in autonomous cognitive evolution cycles.
 * Architecture: Type-safe modular unit with resilient state interfaces.
 */


import React, { useMemo } from 'react';
import type { ConnectionStatus, RepoConfig } from '@/lib/types';
import { COLORS, HEALTH_STATUS_COLORS } from '@/lib/constants';
import { GitBranch, RotateCw, Activity, Clock } from 'lucide-react';

export interface StatusBarProps {
  readonly connectionStatus: ConnectionStatus;
  readonly repoConfig: RepoConfig;
  readonly evolutionCycle: number;
  readonly overallHealth: 'healthy' | 'warning' | 'critical';
  readonly sessionStart: Date | string | number;
  readonly userReposCount?: number;
}

interface ProviderConfig {
  readonly id: keyof ConnectionStatus;
  readonly label: string;
}

const PROVIDERS: readonly ProviderConfig[] = [
  { id: 'gemini', label: 'GEMINI' },
  { id: 'github', label: 'GITHUB' },
] as const;

const STATUS_COLORS = {
  connected: COLORS.cyan,
  error: COLORS.dalekRed,
  testing: COLORS.gold,
  default: '#333',
} as const;

const STATUS_TEXTS = {
  connected: 'ONLINE',
  error: 'OFFLINE',
  testing: 'TESTING',
  default: 'IDLE',
} as const;

export default function StatusBar({
  connectionStatus,
  repoConfig,
  evolutionCycle,
  overallHealth,
  sessionStart,
  userReposCount,
}: StatusBarProps): React.JSX.Element {
  const sessionTime = useMemo(() => {
    try {
      const date = sessionStart instanceof Date ? sessionStart : new Date(sessionStart);
      return Number.isFinite(date.getTime())
        ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '--:--';
    } catch {
      return '--:--';
    }
  }, [sessionStart]);

  const targetRepoLabel = useMemo(() => {
    const owner = typeof repoConfig?.owner === 'string' ? repoConfig.owner.replace(/[<>]/g, '') : '';
    const repo = typeof repoConfig?.repo === 'string' ? repoConfig.repo.replace(/[<>]/g, '') : '';
    return owner && repo
      ? `${owner}/${repo}`
      : 'NOT CONFIGURED';
  }, [repoConfig?.owner, repoConfig?.repo]);

  const branchLabel = useMemo(() => {
    return typeof repoConfig?.branch === 'string' ? repoConfig.branch.replace(/[<>]/g, '') : '';
  }, [repoConfig?.branch]);

  const healthColor = useMemo(
    () => HEALTH_STATUS_COLORS[overallHealth] || COLORS.textMuted,
    [overallHealth]
  );

  const safeEvolutionCycle = useMemo(() => {
    return typeof evolutionCycle === 'number' && Number.isFinite(evolutionCycle)
      ? Math.max(0, Math.floor(evolutionCycle))
      : 0;
  }, [evolutionCycle]);

  const safeUserReposCount = useMemo(() => {
    return typeof userReposCount === 'number' && Number.isFinite(userReposCount)
      ? Math.max(0, Math.floor(userReposCount))
      : undefined;
  }, [userReposCount]);

  return (
    <div className="dalek-panel rounded-lg p-4 space-y-4">
      <div className="dalek-panel-header py-2 px-1 flex items-center gap-2">
        <Activity size={14} style={{ color: COLORS.dalekRed }} />
        <span style={{ fontSize: '11px' }}>SYSTEM STATUS</span>
      </div>

      {/* Connection indicators */}
      <div className="space-y-2">
        <span
          style={{
            fontSize: '9px',
            color: COLORS.textMuted,
            fontFamily: 'var(--font-orbitron), sans-serif',
            letterSpacing: '0.12em',
          }}
        >
          API CONNECTIONS
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {PROVIDERS.map(({ id, label }) => {
            const status = connectionStatus?.[id];
            const statusColor = STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS.default;
            const statusText = STATUS_TEXTS[status as keyof typeof STATUS_TEXTS] || STATUS_TEXTS.default;
            const isConnected = status === 'connected';

            return (
              <div
                key={id}
                className="flex items-center gap-2 px-3 py-2 rounded-sm"
                style={{ background: '#080808', border: `1px solid ${COLORS.panelBorder}` }}
              >
                <div
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${isConnected ? 'pulse-cyan' : ''}`}
                  style={{
                    background: statusColor,
                    boxShadow: isConnected ? `0 0 4px ${statusColor}` : 'none',
                  }}
                />
                <span
                  style={{
                    fontSize: '9px',
                    color: isConnected ? '#ccc' : COLORS.textDim,
                    fontFamily: 'var(--font-orbitron), sans-serif',
                    letterSpacing: '0.05em',
                  }}
                >
                  {label}
                </span>
                <span className="ml-auto" style={{ fontSize: '8px', color: statusColor }}>
                  {statusText}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Repo info */}
      <div className="space-y-2">
        <span
          style={{
            fontSize: '9px',
            color: COLORS.textMuted,
            fontFamily: 'var(--font-orbitron), sans-serif',
            letterSpacing: '0.12em',
          }}
        >
          TARGET
        </span>
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-sm"
          style={{ background: '#080808', border: `1px solid ${COLORS.panelBorder}` }}
        >
          <GitBranch size={12} style={{ color: COLORS.gold }} />
          <span
            style={{
              fontSize: '11px',
              color: COLORS.gold,
              fontFamily: 'var(--font-share-tech-mono), monospace',
            }}
          >
            {targetRepoLabel}
          </span>
          {branchLabel && (
            <span className="ml-auto" style={{ fontSize: '9px', color: COLORS.textMuted }}>
              {branchLabel}
            </span>
          )}
        </div>
      </div>

      {/* Portfolio Status */}
      {typeof safeUserReposCount === 'number' && safeUserReposCount > 0 && (
        <div className="space-y-2 animate-fade-in">
          <span
            style={{
              fontSize: '9px',
              color: COLORS.textMuted,
              fontFamily: 'var(--font-orbitron), sans-serif',
              letterSpacing: '0.12em',
            }}
          >
            PORTFOLIO & SIPHON CONTEXT
          </span>
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-sm"
            style={{ background: '#080808', border: `1px solid ${COLORS.panelBorder}` }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span
              style={{
                fontSize: '10px',
                color: '#10b981',
                fontFamily: 'var(--font-share-tech-mono), monospace',
              }}
            >
              {safeUserReposCount} GLOBAL/USER SIPHONS
            </span>
            <span
              className="ml-auto text-emerald-500/80 uppercase"
              style={{ fontSize: '7.5px', fontFamily: 'var(--font-orbitron), sans-serif' }}
            >
              active context
            </span>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2">
        <div
          className="px-3 py-2 rounded-sm"
          style={{ background: '#080808', border: `1px solid ${COLORS.panelBorder}` }}
        >
          <div className="flex items-center gap-1 mb-1">
            <RotateCw size={10} style={{ color: COLORS.purple }} />
            <span
              style={{
                fontSize: '8px',
                color: COLORS.textMuted,
                fontFamily: 'var(--font-orbitron), sans-serif',
                letterSpacing: '0.1em',
              }}
            >
              CYCLE
            </span>
          </div>
          <span
            style={{
              fontSize: '16px',
              fontWeight: 700,
              color: COLORS.purple,
              fontFamily: 'var(--font-orbitron), sans-serif',
            }}
          >
            {safeEvolutionCycle}
          </span>
        </div>
        <div
          className="px-3 py-2 rounded-sm"
          style={{ background: '#080808', border: `1px solid ${COLORS.panelBorder}` }}
        >
          <div className="flex items-center gap-1 mb-1">
            <Activity size={10} style={{ color: healthColor }} />
            <span
              style={{
                fontSize: '8px',
                color: COLORS.textMuted,
                fontFamily: 'var(--font-orbitron), sans-serif',
                letterSpacing: '0.1em',
              }}
            >
              HEALTH
            </span>
          </div>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: healthColor,
              textTransform: 'uppercase',
              fontFamily: 'var(--font-orbitron), sans-serif',
            }}
          >
            {overallHealth}
          </span>
        </div>
        <div
          className="px-3 py-2 rounded-sm col-span-2"
          style={{ background: '#080808', border: `1px solid ${COLORS.panelBorder}` }}
        >
          <div className="flex items-center gap-1 mb-1">
            <Clock size={10} style={{ color: COLORS.textMuted }} />
            <span
              style={{
                fontSize: '8px',
                color: COLORS.textMuted,
                fontFamily: 'var(--font-orbitron), sans-serif',
                letterSpacing: '0.1em',
              }}
            >
              TIMELINE
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span
              style={{
                fontSize: '10px',
                color: COLORS.gold,
                fontFamily: 'var(--font-orbitron), sans-serif',
                fontWeight: 600,
              }}
            >
              ALPHA
            </span>
            <span style={{ fontSize: '9px', color: COLORS.textDim }}>
              Session: {sessionTime}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Autonomous RAG Resilience Guard
export const __rag_resilience_verified__ = Object.freeze({
  generation: 135,
  timestamp: "2026-09-20T05:57:36.645Z",
  ragEngine: "DARLEK_CAAN_HYBRID_RAG"
});
