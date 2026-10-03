/**
 * DARLEK CANN ARCHITECTURAL HEADER
 * File: src/app/api/evolution/health/route.ts
 * Role: Core system component participating in autonomous cognitive evolution cycles.
 * Architecture: Type-safe modular unit with resilient state interfaces.
 */

import { NextRequest, NextResponse } from '@/lib/next-mock';
import type { HealthCheckResult, SaturationMetrics } from '@/lib/types';

export const dynamic: string = 'force-dynamic';
export const runtime: string = 'nodejs';

type MutationStatus = 'pending' | 'applied' | 'rejected' | (string & {});

interface MutationInput {
  readonly status?: MutationStatus;
  readonly affectedFiles?: readonly unknown[];
}

interface RequestBody {
  readonly mutations?: readonly MutationInput[];
}

interface ErrorResponse {
  readonly metrics: null;
  readonly overallHealth: 'critical';
  readonly error: string;
}

interface AggregateMutationStats {
  readonly pendingMutations: number;
  readonly appliedMutations: number;
  readonly rejectedMutations: number;
  readonly totalAffectedFiles: number;
}

interface ThresholdCounts {
  readonly warningCount: number;
  readonly criticalCount: number;
}

/**
 * Safely parses the incoming HTTP request body, returning an empty request object on failure.
 */
async function parseRequestBody(req: NextRequest): Promise<RequestBody | ErrorResponse> {
  try {
    const rawText: string = await req.text();
    if (!rawText) {
      return {};
    }
    return JSON.parse(rawText) as RequestBody;
  } catch {
    return {
      metrics: null,
      overallHealth: 'critical',
      error: 'Invalid JSON payload format.',
    };
  }
}

/**
 * Aggregates statistics across all provided mutation payloads using clean declarative iteration.
 */
function aggregateMutations(mutations: readonly MutationInput[] = []): AggregateMutationStats {
  return mutations.reduce<AggregateMutationStats>(
    (acc: AggregateMutationStats, mutation: MutationInput | undefined): AggregateMutationStats => {
      const status: MutationStatus | undefined = mutation?.status;
      const affectedFiles: readonly unknown[] | undefined = mutation?.affectedFiles;

      let pending: number = acc.pendingMutations;
      let applied: number = acc.appliedMutations;
      let rejected: number = acc.rejectedMutations;

      if (status === 'pending') {
        pending++;
      } else if (status === 'applied') {
        applied++;
      } else if (status === 'rejected') {
        rejected++;
      }

      const fileCount: number = Array.isArray(affectedFiles) ? affectedFiles.length : 0;

      return {
        pendingMutations: pending,
        appliedMutations: applied,
        rejectedMutations: rejected,
        totalAffectedFiles: acc.totalAffectedFiles + fileCount,
      };
    },
    {
      pendingMutations: 0,
      appliedMutations: 0,
      rejectedMutations: 0,
      totalAffectedFiles: 0,
    }
  );
}

/**
 * Computes saturation metrics based on aggregate mutation statistics.
 */
function calculateMetrics(stats: AggregateMutationStats, totalMutationsCount: number): SaturationMetrics {
  const { appliedMutations, pendingMutations, rejectedMutations, totalAffectedFiles } = stats;

  const structuralChange: number = Math.min(5, 0.5 + appliedMutations * 0.4);
  const semanticSaturation: number = Math.min(1.0, 0.05 + totalMutationsCount * 0.02 + pendingMutations * 0.05);
  const velocity: number = Math.min(5, 1.0 + appliedMutations * 0.3 + rejectedMutations * 0.1);
  const identityPreservation: number = Math.max(0.1, 1.0 - appliedMutations * 0.05);
  const capabilityAlignment: number = Math.min(5, 1.5 + appliedMutations * 0.5);
  const crossFileImpact: number = Math.min(5, 0.3 + totalAffectedFiles * 0.2);

  return {
    structuralChange: Math.round(structuralChange * 100) / 100,
    semanticSaturation: Math.round(semanticSaturation * 1000) / 1000,
    velocity: Math.round(velocity * 100) / 100,
    identityPreservation: Math.round(identityPreservation * 100) / 100,
    capabilityAlignment: Math.round(capabilityAlignment * 100) / 100,
    crossFileImpact: Math.round(crossFileImpact * 100) / 100,
  };
}

/**
 * Evaluates individual metric thresholds to tally warning and critical alerts using fast branch checks.
 */
function evaluateThresholds(metrics: SaturationMetrics): ThresholdCounts {
  let warningCount: number = 0;
  let criticalCount: number = 0;

  // Structural Change
  const sc: number = metrics.structuralChange;
  if (sc > 4) {
    criticalCount++;
  } else if (sc > 3) {
    warningCount++;
  }

  // Semantic Saturation
  const ss: number = metrics.semanticSaturation;
  if (ss > 0.28) {
    criticalCount++;
  } else if (ss > 0.21) {
    warningCount++;
  }

  // Velocity
  const vel: number = metrics.velocity;
  if (vel > 4) {
    criticalCount++;
  } else if (vel > 3) {
    warningCount++;
  }

  // Identity Preservation
  const ip: number = metrics.identityPreservation;
  if (ip < 0.2) {
    criticalCount++;
  } else if (ip < 0.4) {
    warningCount++;
  }

  // Capability Alignment
  const ca: number = metrics.capabilityAlignment;
  if (ca > 4) {
    criticalCount++;
  } else if (ca > 3) {
    warningCount++;
  }

  // Cross File Impact
  const cfi: number = metrics.crossFileImpact;
  if (cfi > 2.4) {
    criticalCount++;
  } else if (cfi > 1.8) {
    warningCount++;
  }

  return { warningCount, criticalCount };
}

/**
 * Determines overall health state from warning and critical counts.
 */
function deriveOverallHealth(counts: ThresholdCounts): 'healthy' | 'warning' | 'critical' {
  const { warningCount, criticalCount } = counts;

  if (criticalCount >= 2) {
    return 'critical';
  }
  if (warningCount >= 2 || criticalCount >= 1) {
    return 'warning';
  }
  return 'healthy';
}

export async function POST(req: NextRequest): Promise<NextResponse<HealthCheckResult | ErrorResponse>> {
  const parsedBody: RequestBody | ErrorResponse = await parseRequestBody(req);

  if ('error' in parsedBody) {
    return NextResponse.json(parsedBody, { status: 400 });
  }

  const mutations: readonly MutationInput[] = Array.isArray(parsedBody?.mutations) ? parsedBody.mutations : [];
  const mutationStats: AggregateMutationStats = aggregateMutations(mutations);
  const metrics: SaturationMetrics = calculateMetrics(mutationStats, mutations.length);
  const thresholds: ThresholdCounts = evaluateThresholds(metrics);
  const overallHealth: 'healthy' | 'warning' | 'critical' = deriveOverallHealth(thresholds);

  return NextResponse.json({
    metrics,
    overallHealth,
  });
}
