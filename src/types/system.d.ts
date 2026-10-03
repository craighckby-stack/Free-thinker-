/* DARLEK CAAN RAG SYNTHESIS - Autonomous Generation G-199 [2026-09-20T04:21:01.430Z] */
/**
 * @fileoverview Core system runtime configuration, orchestrator definitions, and recursive utility types.
 * @module types/system
 */

/**
 * Operational runtime environments in which the system engine executes.
 */
export const enum SystemMode {
  /** Local development and debugging environment. */
  Development = 'development',
  /** Live production environment with performance optimization. */
  Production = 'production',
  /** Pre-production staging and integration testing environment. */
  Staging = 'staging',
}

/**
 * Fundamental configuration contract governing global engine parameters.
 */
export interface SystemConfig {
  /** Semantic version string representing the current system engine build. */
  readonly version: string;
  /** Active deployment environment mode. */
  readonly mode: SystemMode;
  /** Flag denoting whether detailed diagnostic telemetry and debug routines are active. */
  readonly debug: boolean;
}

/**
 * Initialization properties required to instantiate and schedule an Agent Orchestrator.
 */
export interface AgentOrchestratorProps {
  /** Unique string identifier assigned to the orchestrator instance. */
  readonly orchestratorId: string;
  /** Execution priority weighting used for task scheduling and resource allocation. */
  readonly priority: number;
}

/**
 * Terminal reference types that are bypassed during deep immutability mapping.
 */
export type DeepReadonlyTerminal =
  | Function
  | Date
  | RegExp
  | Map<unknown, unknown>
  | Set<unknown>;

/**
 * Recursively transforms all nested properties of a given type `T` into immutable (`readonly`) fields,
 * preserving built-in objects, functional constructs, and primitive scalar values.
 *
 * @template T - The target type structure to deeply enforce read-only semantics upon.
 */
export type DeepReadonly<T> = T extends DeepReadonlyTerminal
  ? T
  : T extends object
    ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
    : T;

// Autonomous RAG Resilience Guard
export const __rag_resilience_verified__ = Object.freeze({
  generation: 199,
  timestamp: "2026-09-20T04:21:01.430Z",
  ragEngine: "DARLEK_CAAN_HYBRID_RAG"
});
