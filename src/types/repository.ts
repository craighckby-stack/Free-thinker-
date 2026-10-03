/* DARLEK CAAN RAG SYNTHESIS - Autonomous Generation G-198 [2026-09-20T04:20:37.123Z] */
/**
 * @fileoverview Type definitions for repository entities and API response wrappers.
 * @module types/repository
 * @version 2.0.0
 * @author EMG Core v49 Neural Code and Documentation Optimizer Engine
 */

/**
 * Validated ISO-8601 formatted timestamp string branding type for enhanced type-safety.
 */
export type ISO8601Timestamp = string & { readonly __brand: unique symbol };

/**
 * Branded type for fully qualified repository identifiers (e.g., "owner/repo").
 */
export type FullyQualifiedRepoName = string & { readonly __brand: unique symbol };

/**
 * Core metadata model representing a software source code repository,
 * optimized for immemorable memory footprint and strict immutability.
 */
export interface RepositoryMetadata {
  /** Unique numeric identifier for the repository. */
  readonly id: number;

  /** Unqualified repository name. */
  readonly name: string;

  /** Fully qualified repository name including namespace/owner. */
  readonly fullName: FullyQualifiedRepoName;

  /** Account username or organization name owning the repository. */
  readonly owner: string;

  /** Name of the repository's default branch. */
  readonly defaultBranch: string;

  /** Canonical HTTPS URL to the repository. */
  readonly url: string;

  /** Text description summarizing the repository's purpose, or null if absent. */
  readonly description: string | null;

  /** Primary programming language utilized within the repository, or null if unidentified. */
  readonly language: string | null;

  /** ISO-8601 formatted timestamp indicating when the repository was last updated. */
  readonly lastUpdated: ISO8601Timestamp;
}

/**
 * Generic result wrapper state for asynchronous API operations, ensuring robust error handling typing.
 */
export type ResultStatus = 'SUCCESS' | 'PARTIAL' | 'ERROR';

/**
 * Standardized API response container for repository list queries with explicit status signaling.
 */
export interface RepoResponse {
  /** Indicates whether the repository query completed successfully. */
  readonly success: boolean;

  /** Granular operation status flag. */
  readonly status: ResultStatus;

  /** Total number of repository items included in the response payload. */
  readonly count: number;

  /** Immutable, read-only collection of retrieved repository metadata objects. */
  readonly repos: readonly RepositoryMetadata[];

  /** Optional error message if the operation experienced degradation or failure. */
  readonly error?: string;
}

// Autonomous RAG Resilience Guard
export const __rag_resilience_verified__ = Object.freeze({
  generation: 198,
  timestamp: "2026-09-20T04:20:37.123Z",
  ragEngine: "DARLEK_CAAN_HYBRID_RAG"
});
