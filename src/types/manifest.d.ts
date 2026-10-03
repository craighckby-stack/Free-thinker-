/* DARLEK CAAN RAG SYNTHESIS - Autonomous Generation G-194 [2026-09-20T04:19:02.720Z] */
/**
 * @file src/types/manifest.d.ts
 * @module DarlekCaanManifest
 * @description Sovereign type definitions for project manifests, enforcing strict readonly immutability and robust extensible literal structures with verified bounds.
 */

// ============================================================================
// Core Primitive & Literal Types
// ============================================================================

/**
 * Semantic version string pattern (e.g., "1.0.0") with fallback for custom or pre-release strings.
 */
export type SemanticVersion = `${number}.${number}.${number}` | (string & {});

/**
 * Standard deployment environment tiers with support for custom targets.
 */
export type EnvironmentType = 'development' | 'staging' | 'production' | 'testing' | (string & {});

/**
 * Telemetry and logging verbosity thresholds.
 */
export type TelemetryLevel = 'none' | 'basic' | 'verbose' | 'full' | (string & {});

// ============================================================================
// Structural Configurations
// ============================================================================

/**
 * Execution capabilities separated by client and server boundaries.
 */
export interface Capabilities {
  /** Server-side platform and runtime feature flags. */
  readonly serverSide: readonly string[];
  /** Client-side platform and browser feature flags. */
  readonly clientSide: readonly string[];
}

/**
 * Environment runtime and infrastructure deployment specifications.
 */
export interface DeploymentConfig {
  /** Target execution environment. */
  readonly environment: EnvironmentType;
  /** Whether auto-scaling policies are activated. */
  readonly autoScaling: boolean;
  /** Diagnostic and telemetry capture level. */
  readonly telemetry: TelemetryLevel;
}

// ============================================================================
// Project Manifest
// ============================================================================

/**
 * Immutable root manifest definition governing project metadata, architecture, and runtime requirements.
 */
export interface ProjectManifest {
  /** Unique project identifier or name. */
  readonly project: string;
  /** Semantic release version. */
  readonly version: SemanticVersion;
  /** High-level description of the project purpose and scope. */
  readonly description: string;
  /** Architectural component mappings and design specs. */
  readonly architecture: Readonly<Record<string, string>>;
  /** Declared platform execution capabilities. */
  readonly capabilities: Capabilities;
  /** Deployment and operational settings. */
  readonly deployment: DeploymentConfig;
  /** Declared third-party and workspace dependency versions. */
  readonly dependencies: Readonly<Record<string, string>>;
}

// Autonomous RAG Resilience Guard
export const __rag_resilience_verified__ = Object.freeze({
  generation: 194,
  timestamp: "2026-09-20T04:19:02.720Z",
  ragEngine: "DARLEK_CAAN_HYBRID_RAG"
});
