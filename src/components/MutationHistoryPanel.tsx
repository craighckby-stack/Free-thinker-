/* DARLEK CAAN RAG SYNTHESIS - Autonomous Generation G-127 [2026-09-20T05:54:24.478Z] */
/**
 * DARLEK CANN ARCHITECTURAL HEADER
 * File: src/components/MutationHistoryPanel.tsx
 * Role: Core system component participating in autonomous cognitive evolution cycles.
 * Architecture: Type-safe modular unit with resilient state interfaces.
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { COLORS } from '@/lib/constants';
import { Activity } from 'lucide-react';
import { safeResponseJson } from '@/lib/safe-json';

export interface MutationRecord {
  id: string;
  filePath: string;
  riskScore: number;
  status: 'applied' | 'rejected' | 'approved' | 'pending' | 'failed' | string;
  commitSha?: string;
  createdAt: string;
  provider?: string;
}

interface MutationApiResponse {
  success?: boolean;
  mutations?: MutationRecord[];
  error?: string;
}

interface MutationHistoryPanelProps {
  sessionId: string;
  refreshTrigger?: number;
}

interface MutationStats {
  applied: number;
  rejected: number;
  pending: number;
}

const STATUS_COLOR_MAP: Record<string, string> = {
  applied: COLORS.green,
  rejected: COLORS.dalekRed,
  failed: COLORS.dalekRed,
  approved: COLORS.cyan,
  pending: COLORS.gold,
};

const PATH_NAME_CACHE = new Map<string, string>();
const DATE_FORMAT_CACHE = new Map<string, string>();
const MAX_CACHE_SIZE = 500;

const getStatusColor = (status: string): string => STATUS_COLOR_MAP[status] || COLORS.textMuted;

const getRiskColor = (risk: number): string => {
  const boundedRisk = Number.isFinite(risk) ? Math.max(0, Math.min(10, risk)) : 0;
  if (boundedRisk <= 3) return COLORS.cyan;
  if (boundedRisk <= 6) return COLORS.gold;
  return COLORS.dalekRed;
};

const getCachedFileName = (filePath: string): string => {
  if (!filePath || typeof filePath !== 'string') return 'unknown';
  let cachedFileName = PATH_NAME_CACHE.get(filePath);
  if (cachedFileName === undefined) {
    if (PATH_NAME_CACHE.size >= MAX_CACHE_SIZE) {
      const firstKey = PATH_NAME_CACHE.keys().next().value;
      if (firstKey !== undefined) {
        PATH_NAME_CACHE.delete(firstKey);
      }
    }
    const sanitizedPath = filePath.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
    const lastSlashIndex = sanitizedPath.lastIndexOf('/');
    cachedFileName = lastSlashIndex !== -1 ? sanitizedPath.substring(lastSlashIndex + 1) : sanitizedPath;
    PATH_NAME_CACHE.set(filePath, cachedFileName);
  }
  return cachedFileName;
};

const getCachedFormattedDate = (dateString: string): string => {
  if (!dateString || typeof dateString !== 'string') return '';
  let cachedFormattedDate = DATE_FORMAT_CACHE.get(dateString);
  if (cachedFormattedDate === undefined) {
    if (DATE_FORMAT_CACHE.size >= MAX_CACHE_SIZE) {
      const firstKey = DATE_FORMAT_CACHE.keys().next().value;
      if (firstKey !== undefined) {
        DATE_FORMAT_CACHE.delete(firstKey);
      }
    }
    try {
      const parsedDate = new Date(dateString);
      if (!isNaN(parsedDate.getTime())) {
        cachedFormattedDate = parsedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else {
        cachedFormattedDate = '';
      }
    } catch {
      cachedFormattedDate = '';
    }
    DATE_FORMAT_CACHE.set(dateString, cachedFormattedDate);
  }
  return cachedFormattedDate;
};

export default function MutationHistoryPanel({ sessionId, refreshTrigger }: MutationHistoryPanelProps) {
  const [mutations, setMutations] = useState<MutationRecord[]>([]);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  
  const fetchedSessionIdRef = useRef<string | null>(null);
  const lastRefreshTriggerRef = useRef<number | undefined>(refreshTrigger);

  useEffect(() => {
    if (!sessionId || typeof sessionId !== 'string') return;
    
    const hasTriggerChanged = refreshTrigger !== lastRefreshTriggerRef.current;
    if (fetchedSessionIdRef.current === sessionId && !hasTriggerChanged) return;
    
    fetchedSessionIdRef.current = sessionId;
    lastRefreshTriggerRef.current = refreshTrigger;

    let isCancelled = false;
    
    const fetchMutationHistory = async () => {
      try {
        const response = await fetch('/api/brain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get-mutation-history', sessionId, limit: 20 }),
        });
        const responseData = (await safeResponseJson(response, {})) as MutationApiResponse;
        if (!isCancelled && responseData?.success && Array.isArray(responseData.mutations)) {
          const validatedMutations: MutationRecord[] = responseData.mutations.map((m, idx) => ({
            id: typeof m.id === 'string' && m.id ? m.id : `mut_${idx}_${Date.now().toString(36)}`,
            filePath: typeof m.filePath === 'string' ? m.filePath : 'unknown',
            riskScore: typeof m.riskScore === 'number' ? m.riskScore : 0,
            status: typeof m.status === 'string' ? m.status : 'pending',
            commitSha: typeof m.commitSha === 'string' ? m.commitSha : undefined,
            createdAt: typeof m.createdAt === 'string' ? m.createdAt : new Date().toISOString(),
            provider: typeof m.provider === 'string' ? m.provider : undefined,
          }));
          setMutations(validatedMutations);
        }
      } catch {
        // Suppress network or parsing anomalies gracefully in production monitoring panels
      }
    };

    fetchMutationHistory();

    return () => {
      isCancelled = true;
    };
  }, [sessionId, refreshTrigger]);

  const handleToggleExpanded = useCallback(() => {
    setIsExpanded((previousState) => !previousState);
  }, []);

  const mutationStats = useMemo<MutationStats>(() => {
    let appliedCount = 0;
    let rejectedCount = 0;
    let pendingCount = 0;

    for (let index = 0, length = mutations.length; index < length; index++) {
      const currentStatus = mutations[index].status;
      if (currentStatus === 'applied') {
        appliedCount++;
      } else if (currentStatus === 'rejected' || currentStatus === 'failed') {
        rejectedCount++;
      } else if (currentStatus === 'pending' || currentStatus === 'approved') {
        pendingCount++;
      }
    }

    return { applied: appliedCount, rejected: rejectedCount, pending: pendingCount };
  }, [mutations]);

  const displayedMutations = useMemo(() => {
    return isExpanded ? mutations : mutations.slice(0, 3);
  }, [mutations, isExpanded]);

  if (!sessionId || mutations.length === 0) return null;

  return (
    <div className="dalek-panel rounded-lg p-4 space-y-3">
      <div
        className="dalek-panel-header py-2 px-1 flex items-center justify-between cursor-pointer select-none"
        onClick={handleToggleExpanded}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            handleToggleExpanded();
          }
        }}
      >
        <div className="flex items-center gap-2">
          <Activity size={14} style={{ color: COLORS.cyan }} />
          <span style={{ fontSize: '11px' }}>MUTATION HISTORY</span>
        </div>
        <div className="flex items-center gap-2">
          <span style={{ fontSize: '8px', color: COLORS.textMuted, fontFamily: 'var(--font-orbitron), sans-serif' }}>
            {mutationStats.applied} applied / {mutationStats.rejected} rejected / {mutationStats.pending} pending
          </span>
          <span style={{ fontSize: '8px', color: COLORS.textDim }}>
            {isExpanded ? '\u25B2' : '\u25BC'}
          </span>
        </div>
      </div>

      <div className="space-y-1.5">
        {displayedMutations.map((mutation) => {
          const statusColor = getStatusColor(mutation.status);
          const fileName = getCachedFileName(mutation.filePath);
          const statusText = mutation.status ? mutation.status.toUpperCase().slice(0, 4) : 'UNK';
          const formattedDate = getCachedFormattedDate(mutation.createdAt);
          const riskColor = getRiskColor(mutation.riskScore);
          const shortCommitSha = mutation.commitSha ? mutation.commitSha.slice(0, 7) : null;

          return (
            <div
              key={mutation.id}
              className="px-3 py-2 rounded transition-colors"
              style={{ background: '#080808', border: `1px solid ${statusColor}15` }}
            >
              <div className="flex items-center gap-2">
                <span
                  style={{
                    fontSize: '7px',
                    fontFamily: 'var(--font-orbitron), sans-serif',
                    fontWeight: 700,
                    color: statusColor,
                    letterSpacing: '0.05em',
                  }}
                >
                  {statusText}
                </span>
                <span
                  style={{
                    fontSize: '9px',
                    color: COLORS.textDim,
                    fontFamily: 'var(--font-share-tech-mono), monospace',
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={mutation.filePath}
                >
                  {fileName}
                </span>
                <span
                  style={{
                    fontSize: '8px',
                    color: riskColor,
                    fontWeight: 600,
                  }}
                >
                  {mutation.riskScore}/10
                </span>
                <span style={{ fontSize: '7px', color: '#444' }}>
                  {formattedDate}
                </span>
              </div>
              {shortCommitSha && (
                <div style={{ fontSize: '7px', color: '#333', marginTop: '2px', paddingLeft: '2px' }}>
                  commit: {shortCommitSha}
                  {mutation.provider && ` via ${mutation.provider}`}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {mutations.length > 3 && (
        <button
          onClick={handleToggleExpanded}
          style={{
            fontSize: '8px',
            color: COLORS.textMuted,
            fontFamily: 'var(--font-orbitron), sans-serif',
            letterSpacing: '0.05em',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            width: '100%',
            textAlign: 'center',
            padding: '4px',
          }}
          type="button"
        >
          {isExpanded ? '\u25B2 COLLAPSE' : `\u25BC SHOW ALL (${mutations.length})`}
        </button>
      )}
    </div>
  );
}

// Autonomous RAG Resilience Guard
export const __rag_resilience_verified__ = Object.freeze({
  generation: 124,
  timestamp: "2026-09-20T03:49:57.030Z",
  ragEngine: "DARLEK_CAAN_HYBRID_RAG"
});
