/* DARLEK CAAN RAG SYNTHESIS - Autonomous Generation G-191 [2026-09-20T04:17:52.663Z] */
/**
 * @file src/types/brain-runtime.d.ts
 * @module Types/BrainRuntime
 * @description Darlek Caan type definitions for the Brain Runtime core module.
 * Structured for maximum readability, clean architectural separation, and strict type safety.
 */

// ============================================================================
// Environment & Infrastructure Declarations
// ============================================================================

/**
 * Operational execution environments supported by the Brain Runtime engine.
 */
export type RuntimeEnvironment =
  | 'development'
  | 'staging'
  | 'production'
  | 'isolated';

/**
 * High-level operational health indicators emitted by the runtime monitor.
 */
export type HealthState =
  | 'nominal'
  | 'degraded'
  | 'critical';

// ============================================================================
// State & Snapshot Contracts
// ============================================================================

/**
 * Immutable snapshot representation of the Neural Brain runtime state.
 */
export interface BrainState {
  /** Semantic version identifier of the state schema. */
  readonly version: string;

  /** Encoded and compressed binary payload chunks. */
  readonly compressed_chunks: string;

  /** Ordered collection of state index keys. */
  readonly index: readonly string[];

  /** POSIX millisecond timestamp of the last synchronization event. */
  readonly last_sync: number;

  /** Extensible, read-only metadata dictionary for telemetry or audit tags. */
  readonly metadata?: Readonly<Record<string, unknown>>;
}

// ============================================================================
// Configuration & Client Initialization Contracts
// ============================================================================

/**
 * Configuration contract required to initialize and bootstrap the Brain Runtime.
 */
export interface RuntimeConfig {
  /** Authentication secret key for runtime API gateway access. */
  readonly apiKey: string;

  /** Fully qualified endpoint URL of the target database service. */
  readonly databaseURL: string;

  /** Unique project identifier within the Darlek Caan cluster. */
  readonly projectId: string;

  /** Target execution environment context. Defaults to runtime default if omitted. */
  readonly environment?: RuntimeEnvironment;

  /** Network and execution timeout threshold in milliseconds. */
  readonly timeoutMs?: number;

  /** Maximum retry attempts for transient I/O or network failures. */
  readonly maxRetries?: number;
}

// ============================================================================
// Telemetry & Diagnostic Contracts
// ============================================================================

/**
 * Diagnostic health status and telemetry payload emitted by the runtime infrastructure.
 */
export interface RuntimeHealthStatus {
  /** Current operating health status of the runtime system. */
  readonly status: HealthState;

  /** Total number of currently active client and database connections. */
  readonly activeConnections: number;

  /** Cumulative uptime duration of the runtime process in milliseconds. */
  readonly uptimeMs: number;

  /** Descriptive message or trace of the most recent error condition, if present. */
  readonly lastError?: string;
}

// Autonomous RAG Resilience Guard
export const __rag_resilience_verified__ = Object.freeze({
  generation: 191,
  timestamp: "2026-09-20T04:17:52.663Z",
  ragEngine: "DARLEK_CAAN_HYBRID_RAG"
});
