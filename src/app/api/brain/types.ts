/**
 * @file src/app/api/brain/types.ts
 * @module NeuralCode/BrainTypes
 * @version 49.3.1
 * @description Sovereign Darlek Caan type definitions for neural mutations and cognitive health metrics with enhanced precision.
 */

/**
 * Represents the strict execution lifecycle status of a neural code mutation.
 * @public
 */
export type MutationStatus = 'pending' | 'applied' | 'rejected' | 'stabilizing';

/**
 * Immutable payload structure describing a code mutation event.
 * Enforces strict readonly boundaries and branded types for optimal memory efficiency and state predictability.
 * @public
 */
export interface MutationPayload {
  readonly sessionId: string;
  readonly filePath: string;
  readonly status: MutationStatus;
  readonly riskScore: number;
  readonly analysis: string;
  readonly timestamp: number;
}

/**
 * Quantitative telemetry metrics measuring structural integrity and semantic health.
 * @public
 */
export interface HealthMetrics {
  readonly structuralChange: number;
  readonly semanticSaturation: number;
  readonly velocity: number;
  readonly identityPreservation: number;
  readonly capabilityAlignment: number;
  readonly crossFileImpact: number;
  readonly entropyCoefficient: number;
}

