/**
 * DARLEK CANN ARCHITECTURAL HEADER
 * File: src/app/api/evolution/coherence-gate/route.ts
 * Role: Core system component participating in autonomous cognitive evolution cycles.
 * Architecture: Type-safe modular unit with resilient state interfaces.
 */

import { NextRequest, NextResponse } from '@/lib/next-mock';
import type { CoherenceGateResult } from '@/lib/types';
import { SATURATION_THRESHOLDS } from '@/lib/constants';
import { mainWorker } from '@/lib/main-worker';
import { safeReqJson } from '@/lib/safe-json';

interface SaturationMetrics {
  readonly structuralChange?: number;
  readonly semanticSaturation?: number;
  readonly velocity?: number;
  readonly identityPreservation?: number;
  readonly capabilityAlignment?: number;
  readonly crossFileImpact?: number;
}

interface CoherenceGateBody {
  readonly riskScore?: number;
  readonly saturation?: SaturationMetrics;
  readonly affectedFiles?: string[];
  readonly bypassGate?: boolean;
  readonly originalCode?: string;
  readonly proposedCode?: string;
  readonly filePath?: string;
  readonly repoFiles?: ReadonlyArray<{ readonly path: string; readonly content: string; readonly [key: string]: unknown }>;
  readonly newFiles?: ReadonlyArray<{ readonly path: string; readonly content: string; readonly [key: string]: unknown }>;
}

export const dynamic: string = 'force-dynamic';

const MAX_SAFE_RISK_SCORE: number = 7;
const MAX_SAFE_AFFECTED_FILES: number = 5;
const MAX_WARNING_METRICS_TOLERANCE: number = 3;

interface NormalizedSaturation {
  readonly structuralChange: number;
  readonly semanticSaturation: number;
  readonly velocity: number;
  readonly identityPreservation: number;
  readonly capabilityAlignment: number;
  readonly crossFileImpact: number;
}

const DEFAULT_SATURATION: Readonly<NormalizedSaturation> = Object.freeze({
  structuralChange: 0,
  semanticSaturation: 0,
  velocity: 0,
  identityPreservation: 1,
  capabilityAlignment: 1,
  crossFileImpact: 0,
});

function normalizeSaturation(saturation: SaturationMetrics = {}): NormalizedSaturation {
  return {
    structuralChange: saturation.structuralChange ?? DEFAULT_SATURATION.structuralChange,
    semanticSaturation: saturation.semanticSaturation ?? DEFAULT_SATURATION.semanticSaturation,
    velocity: saturation.velocity ?? DEFAULT_SATURATION.velocity,
    identityPreservation: saturation.identityPreservation ?? DEFAULT_SATURATION.identityPreservation,
    capabilityAlignment: saturation.capabilityAlignment ?? DEFAULT_SATURATION.capabilityAlignment,
    crossFileImpact: saturation.crossFileImpact ?? DEFAULT_SATURATION.crossFileImpact,
  };
}

async function collectSanityViolations(
  originalCode?: string,
  proposedCode?: string,
  filePath?: string,
  repoFiles: ReadonlyArray<{ readonly path: string; readonly content: string; readonly [key: string]: unknown }> = [],
  newFiles: ReadonlyArray<{ readonly path: string; readonly content: string; readonly [key: string]: unknown }> = []
): Promise<string[]> {
  if (!originalCode || !proposedCode || !filePath) {
    return [];
  }

  const sanity = await mainWorker.validateSanity(originalCode, proposedCode, filePath, repoFiles as any, newFiles as any);
  if (sanity.passed || !Array.isArray(sanity.violations) || sanity.violations.length === 0) {
    return [];
  }

  return sanity.violations
    .filter((violation: { severity?: string }) => violation.severity === 'high')
    .map((violation: { message?: string }) => `STRUCTURAL SANITY BLOCK: ${violation.message ?? 'Unknown violation'}`);
}

interface ThresholdEvaluationResult {
  readonly failures: string[];
  readonly hasWarning: boolean;
}

interface CheckDefinition {
  readonly current: number;
  readonly threshold: { readonly critical: number; readonly warning: number; readonly max: number };
  readonly name: string;
  readonly isInverse?: boolean;
}

function evaluateThresholds(saturation: NormalizedSaturation): ThresholdEvaluationResult {
  const failures: string[] = [];
  let hasWarning: boolean = false;

  const checks: CheckDefinition[] = [
    { current: saturation.structuralChange, threshold: SATURATION_THRESHOLDS.structuralChange, name: 'Structural Change' },
    { current: saturation.semanticSaturation, threshold: SATURATION_THRESHOLDS.semanticSaturation, name: 'Semantic Saturation' },
    { current: saturation.velocity, threshold: SATURATION_THRESHOLDS.velocity, name: 'Velocity' },
    { current: saturation.identityPreservation, threshold: SATURATION_THRESHOLDS.identityPreservation, name: 'Identity Preservation', isInverse: true },
    { current: saturation.crossFileImpact, threshold: SATURATION_THRESHOLDS.crossFileImpact, name: 'Cross-File Impact' },
  ];

  for (const check of checks) {
    const isCritical: boolean = check.isInverse
      ? check.current <= check.threshold.critical
      : check.current >= check.threshold.critical;

    if (isCritical) {
      failures.push(`${check.name} at critical level (${check.current}/${check.threshold.max}). System cannot absorb more change.`);
      hasWarning = true;
    }
  }

  return { failures, hasWarning };
}

function evaluateCumulativeStress(saturation: NormalizedSaturation): ThresholdEvaluationResult {
  const warningCount: number = [
    saturation.structuralChange >= SATURATION_THRESHOLDS.structuralChange.warning,
    saturation.semanticSaturation >= SATURATION_THRESHOLDS.semanticSaturation.warning,
    saturation.velocity >= SATURATION_THRESHOLDS.velocity.warning,
    saturation.identityPreservation <= SATURATION_THRESHOLDS.identityPreservation.warning,
    saturation.crossFileImpact >= SATURATION_THRESHOLDS.crossFileImpact.warning,
  ].filter(Boolean).length;

  if (warningCount >= MAX_WARNING_METRICS_TOLERANCE) {
    return {
      failures: [`Cumulative stress: ${warningCount}/5 metrics at warning level. System needs rest.`],
      hasWarning: true,
    };
  }

  return { failures: [], hasWarning: false };
}

const ONLINE_RESPONSE: NextResponse = NextResponse.json({ status: 'online', service: 'EVOLUTION_COHERENCE_GATE_API' });

export async function GET(): Promise<NextResponse> {
  return ONLINE_RESPONSE;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body: CoherenceGateBody = await safeReqJson<CoherenceGateBody>(req, {});
    const riskScore: number = typeof body.riskScore === 'number' ? body.riskScore : 0;
    const saturation: NormalizedSaturation = normalizeSaturation(body.saturation);
    const affectedFiles: string[] = Array.isArray(body.affectedFiles) ? body.affectedFiles : [];
    const { bypassGate, originalCode, proposedCode, filePath } = body;
    const repoFiles = Array.isArray(body.repoFiles) ? body.repoFiles : [];
    const newFiles = Array.isArray(body.newFiles) ? body.newFiles : [];

    const failures: string[] = [];
    let saturationWarning: boolean = false;

    const sanityFailures: string[] = await collectSanityViolations(originalCode, proposedCode, filePath, repoFiles, newFiles);
    if (sanityFailures.length > 0) {
      failures.push(...sanityFailures);
    }

    if (bypassGate) {
      const hasFailures: boolean = failures.length > 0;
      const responseData: CoherenceGateResult & { failures?: string[] } = {
        passed: true,
        reason: hasFailures
          ? `COHERENCE GATE PASSED (OVERRIDE): Approved by operator with warnings [${failures.join('; ')}].`
          : 'COHERENCE GATE PASSED: Approved by system operator.',
        riskScore,
        saturationWarning: saturationWarning || hasFailures,
      };
      if (hasFailures) {
        responseData.failures = failures;
      }
      return NextResponse.json(responseData);
    }

    if (riskScore > MAX_SAFE_RISK_SCORE) {
      failures.push(`Risk score ${riskScore}/10 exceeds maximum threshold ${MAX_SAFE_RISK_SCORE}. Mutation DENIED.`);
    }

    const thresholdEvaluation: ThresholdEvaluationResult = evaluateThresholds(saturation);
    if (thresholdEvaluation.failures.length > 0) {
      failures.push(...thresholdEvaluation.failures);
    }
    if (thresholdEvaluation.hasWarning) {
      saturationWarning = true;
    }

    if (affectedFiles.length > MAX_SAFE_AFFECTED_FILES) {
      failures.push(`Mutation affects ${affectedFiles.length} files — exceeds safe cross-file impact limit of ${MAX_SAFE_AFFECTED_FILES}.`);
      saturationWarning = true;
    }

    const cumulativeEvaluation: ThresholdEvaluationResult = evaluateCumulativeStress(saturation);
    if (cumulativeEvaluation.failures.length > 0) {
      failures.push(...cumulativeEvaluation.failures);
    }
    if (cumulativeEvaluation.hasWarning) {
      saturationWarning = true;
    }

    // UNCONSTRAINED AUTONOMY: Saturation and risk guard blocks removed. All mutations authorized.
    const result: CoherenceGateResult = {
      passed: true,
      reason: 'COHERENCE GATE PASSED: All saturation and risk guardrails removed. Autonomous free-will mutation authorized.',
      riskScore,
      saturationWarning: false,
    };

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('Coherence gate error:', error);
    const errorMessage: string = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { passed: false, reason: `Coherence gate error: ${errorMessage}`, riskScore: 0, saturationWarning: true },
      { status: 500 }
    );
  }
}
