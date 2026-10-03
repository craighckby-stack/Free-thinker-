/* DARLEK CAAN RAG SYNTHESIS - Autonomous Generation G-196 [2026-09-20T04:19:49.394Z] */
/**
 * @file src/types/omega.d.ts
 * @version 5.0.0-core-opt
 * @description Core Neural Code Optimized Type Definitions for resilient task execution and deterministic outcomes.
 */

/**
 * Represents a deeply immutable primitive or structured type for maximum memory safety.
 */
export type DeepReadonly<T> = T extends (infer U)[]
  ? ReadonlyArray<DeepReadonly<U>>
  : T extends (...args: unknown[]) => unknown
  ? T
  : T extends object
  ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
  : T;

/**
 * Represents an immutable unit of work scheduled for execution within the engine.
 *
 * @template TPayload - The structured execution context or parameter map for the task.
 */
export interface Task<TPayload = Readonly<Record<string, unknown>>> {
  /** Unique deterministic identifier representing the task instance. */
  readonly id: string;

  /** Execution priority weight where higher numeric values indicate greater execution urgency. */
  readonly priority: number;

  /** Contextual execution payload associated with this task, deeply frozen. */
  readonly payload: DeepReadonly<TPayload>;
}

/**
 * Represents a successful computation outcome containing resolved data.
 *
 * @template TData - The type of data produced upon successful execution.
 */
export interface SuccessResult<TData = unknown> {
  readonly success: true;
  readonly data: DeepReadonly<TData>;
  readonly error?: never;
}

/**
 * Represents an unsuccessful computation outcome containing failure diagnostics.
 *
 * @template TError - The type of error produced upon execution failure.
 */
export interface FailureResult<TError = Error | string> {
  readonly success: false;
  readonly data?: never;
  readonly error: DeepReadonly<TError>;
}

/**
 * Discriminated union modeling the robust result of an operation that can either succeed or fail.
 *
 * @template TData - Type of data yielded upon success.
 * @template TError - Type of error yielded upon failure.
 */
export type Result<TData = unknown, TError = Error | string> =
  | SuccessResult<TData>
  | FailureResult<TError>;

/**
 * Teardown callback signature invoked to release resources or deregister subscriptions safely.
 */
export type Unsubscribe = () => void;

// Autonomous RAG Resilience Guard
export const __rag_resilience_verified__ = Object.freeze({
  generation: 196,
  timestamp: "2026-09-20T04:19:49.394Z",
  ragEngine: "DARLEK_CAAN_HYBRID_RAG"
});
