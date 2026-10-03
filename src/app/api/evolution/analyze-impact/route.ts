import { NextRequest, NextResponse } from '@/lib/next-mock';
import { callLlm, getDefaultGeminiKey } from '@/lib/llm-provider';
import { safeReqJson } from '@/lib/safe-json';
import type { ApiKeys } from '@/lib/types';

export const dynamic = 'force-dynamic';

// --- Types & Interfaces ---

export type IssueSeverity = 'high' | 'medium' | 'low';

export interface StaticIssue {
  readonly type: string;
  readonly severity: IssueSeverity;
  readonly message: string;
}

export interface AnalyzeImpactBody {
  readonly originalCode: string;
  readonly proposedCode: string;
  readonly filePath: string;
  readonly riskScore: number;
  readonly apiKeys?: ApiKeys;
}

export interface AnalysisResponseSuccess {
  readonly success: true;
  readonly staticIssues: readonly StaticIssue[];
  readonly llmAnalysis: string;
  readonly llmProvider: string;
  readonly totalIssues: number;
  readonly highSeverity: number;
  readonly mediumSeverity: number;
  readonly lowSeverity: number;
  readonly overallRisk: 'HIGH' | 'MEDIUM' | 'LOW';
  readonly summary: string;
}

export interface AnalysisResponseError {
  readonly error: string;
}

// --- Constants ---

const MAX_CODE_LENGTH = 35_000;
const LLM_MAX_TOKENS = 512;
const LLM_TEMPERATURE = 0.2;

const ARCHITECTURAL_VERIFIER_SYSTEM_PROMPT = `[ROLE] You are the automated architecture verifier for the AHI Loop. 
[TASK] Analyze the synthesized code against the target taxonomy structure.

[SCAN FOCUS]
- SCOPE VIOLATION: The code attempts to generate out-of-scope features or domains unrelated to code enhancement for this repository.
- Taxonomy violation (e.g., a UI component placed in \`00_Foundational_Knowledge\`).
- Missing \`__init__.py\` or broken local imports.
- Unresolved dependencies from deleted historical branches.

[OUTPUT FORMAT]
Programmatic string only. Keep under 150 words.
If clean, output exactly: STATUS: PASS
If broken, output exactly: STATUS: FAIL followed by a concise line-separated list of architectural breaks.`;

// Pre-compiled regex patterns for execution efficiency
const EXPORT_REGEX = /export\s+(?:default\s+)?(?:function|class|const|let|var|type|interface|enum)\s+(\w+)/g;
const DEFINITION_REGEX = /(?:function|class)\s+(\w+)/g;
const IMPORT_REGEX = /import\s+.*?from\s+['"](.+?)['"]/g;
const TODO_REGEX = /\/\/\s*(TODO|FIXME|HACK|XXX|BUG)[^\n]*/gi;
const DEBUG_LOG_REGEX = /console\.(log|debug|info)\s*\(/g;
const ANY_TYPE_REGEX = /:\s*any\b/g;
const TRY_CATCH_REGEX = /try\s*\{/g;

// --- Static Analysis Helpers ---

function extractMatches(code: string, regex: RegExp, groupIndex = 1): string[] {
  regex.lastIndex = 0;
  const matches: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(code)) !== null) {
    if (match[groupIndex]) {
      matches.push(match[groupIndex]);
    }
  }
  return matches;
}

function countMatches(code: string, regex: RegExp): number {
  regex.lastIndex = 0;
  let count = 0;
  while (regex.exec(code) !== null) {
    count++;
  }
  return count;
}

function detectStaticIssues(originalCode: string, proposedCode: string): StaticIssue[] {
  const issues: StaticIssue[] = [];

  // 1. Export Analysis
  const originalExports = new Set(extractMatches(originalCode, EXPORT_REGEX));
  const proposedExports = new Set(extractMatches(proposedCode, EXPORT_REGEX));
  const removedExports = Array.from(originalExports).filter(exp => !proposedExports.has(exp));

  if (removedExports.length > 0) {
    issues.push({
      type: 'REMOVED_EXPORT',
      severity: 'high',
      message: `Export(s) removed: ${removedExports.join(', ')}. Other files may import these.`,
    });
  }

  // 2. Internal Definition Analysis
  const originalFuncs = new Set(extractMatches(originalCode, DEFINITION_REGEX));
  const proposedFuncs = new Set(extractMatches(proposedCode, DEFINITION_REGEX));
  const removedFuncs = Array.from(originalFuncs).filter(
    func => !proposedFuncs.has(func) && !removedExports.includes(func)
  );

  if (removedFuncs.length > 0) {
    issues.push({
      type: 'REMOVED_DEFINITION',
      severity: 'medium',
      message: `Function/class removed: ${removedFuncs.join(', ')}. May be referenced internally.`,
    });
  }

  // 3. Import Analysis
  const originalImports = new Set(extractMatches(originalCode, IMPORT_REGEX));
  const proposedImports = new Set(extractMatches(proposedCode, IMPORT_REGEX));
  
  const newImports = Array.from(proposedImports).filter(imp => !originalImports.has(imp));
  const removedImports = Array.from(originalImports).filter(imp => !proposedImports.has(imp));

  if (removedImports.length > 0) {
    issues.push({
      type: 'REMOVED_IMPORT',
      severity: 'medium',
      message: `Import(s) removed: ${removedImports.join(', ')}. Code may use these modules.`,
    });
  }
  if (newImports.length > 0) {
    issues.push({
      type: 'NEW_IMPORT',
      severity: 'low',
      message: `New import(s): ${newImports.join(', ')}. Ensure these packages are available.`,
    });
  }

  // 4. Size Deviation Analysis
  const sizeChangeRatio = (proposedCode.length - originalCode.length) / Math.max(1, originalCode.length);
  if (Math.abs(sizeChangeRatio) > 0.5) {
    const direction = sizeChangeRatio > 0 ? 'increased' : 'decreased';
    const percentage = Math.abs(Math.round(sizeChangeRatio * 100));
    const implication = sizeChangeRatio < 0 ? 'May indicate removed functionality.' : 'May indicate added complexity.';
    issues.push({
      type: 'SIZE_CHANGE',
      severity: 'low',
      message: `File size ${direction} by ${percentage}%. ${implication}`,
    });
  }

  // 5. Technical Debt Annotations (TODO/FIXME)
  const newTodos = extractMatches(proposedCode, TODO_REGEX, 0);
  if (newTodos.length > 0) {
    issues.push({
      type: 'NEW_TODO',
      severity: 'low',
      message: `${newTodos.length} TODO/FIXME comment(s) found in proposed code.`,
    });
  }

  // 6. Debug Artifacts
  const newConsoleLogs = countMatches(proposedCode, DEBUG_LOG_REGEX);
  const origConsoleLogs = countMatches(originalCode, DEBUG_LOG_REGEX);
  if (newConsoleLogs > origConsoleLogs) {
    issues.push({
      type: 'DEBUG_CODE',
      severity: 'low',
      message: `${newConsoleLogs - origConsoleLogs} new console.log/debug call(s) added. May be debug leftovers.`,
    });
  }

  // 7. TypeScript Type Safety Analysis
  const newAnyCount = countMatches(proposedCode, ANY_TYPE_REGEX);
  const origAnyCount = countMatches(originalCode, ANY_TYPE_REGEX);
  if (newAnyCount > origAnyCount) {
    issues.push({
      type: 'TYPE_SAFETY',
      severity: 'medium',
      message: `${newAnyCount - origAnyCount} new 'any' type usage(s). Type safety reduced.`,
    });
  }

  // 8. Error Handling Robustness
  const origTryCatch = countMatches(originalCode, TRY_CATCH_REGEX);
  const propTryCatch = countMatches(proposedCode, TRY_CATCH_REGEX);
  if (propTryCatch < origTryCatch) {
    issues.push({
      type: 'ERROR_HANDLING',
      severity: 'high',
      message: `${origTryCatch - propTryCatch} try/catch block(s) removed. Error handling weakened.`,
    });
  }

  return issues;
}

// --- Response Builder ---

function truncateCode(code: string): string {
  if (code.length <= MAX_CODE_LENGTH) {
    return code;
  }
  return `${code.slice(0, MAX_CODE_LENGTH)}\n// ... [truncated]`;
}

function buildResponse(staticIssues: readonly StaticIssue[], llmAnalysis: string, llmProvider: string): NextResponse<AnalysisResponseSuccess> {
  const severityCounts = staticIssues.reduce(
    (acc, issue) => {
      acc[issue.severity]++;
      return acc;
    },
    { high: 0, medium: 0, low: 0 }
  );

  const { high: highCount, medium: mediumCount, low: lowCount } = severityCounts;

  const overallRisk = highCount > 0 ? 'HIGH' : mediumCount > 2 ? 'MEDIUM' : 'LOW';
  const llmSummaryPart = llmAnalysis ? ` LLM review: ${llmProvider}.` : ' No LLM available — static analysis only.';
  const summary = `Static analysis: ${staticIssues.length} issues (${highCount} high, ${mediumCount} medium, ${lowCount} low).${llmSummaryPart}`;

  return NextResponse.json({
    success: true,
    staticIssues,
    llmAnalysis,
    llmProvider,
    totalIssues: staticIssues.length,
    highSeverity: highCount,
    mediumSeverity: mediumCount,
    lowSeverity: lowCount,
    overallRisk,
    summary,
  });
}

// --- Route Handlers ---

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ 
    status: 'online', 
    service: 'EVOLUTION_ANALYZE_IMPACT_API' 
  });
}

export async function POST(req: NextRequest): Promise<NextResponse<AnalysisResponseSuccess | AnalysisResponseError>> {
  try {
    const body = await safeReqJson<AnalyzeImpactBody>(req, {} as AnalyzeImpactBody);
    const { originalCode, proposedCode, filePath, riskScore, apiKeys } = body;

    if (!originalCode || !proposedCode || !filePath) {
      return NextResponse.json(
        { error: 'originalCode, proposedCode, and filePath required.' }, 
        { status: 400 }
      );
    }

    // Phase 1: Local deterministic static analysis
    const staticIssues = detectStaticIssues(originalCode, proposedCode);

    // Phase 2: LLM-powered architectural deep inspection
    const truncatedOriginal = truncateCode(originalCode);
    const truncatedProposed = truncateCode(proposedCode);

    const userPrompt = [
      `File: ${filePath}`,
      `Risk: ${riskScore}/10`,
      '',
      'ORIGINAL:',
      '```',
      truncatedOriginal,
      '```',
      '',
      'PROPOSED:',
      '```',
      truncatedProposed,
      '```',
      '',
      'Analyze impact and coherence.'
    ].join('\n');

    const geminiKey = apiKeys?.['gemini'] || getDefaultGeminiKey();

    const llmResult = await callLlm({
      systemPrompt: ARCHITECTURAL_VERIFIER_SYSTEM_PROMPT,
      userPrompt,
      geminiApiKey: geminiKey,
      maxTokens: LLM_MAX_TOKENS,
      temperature: LLM_TEMPERATURE,
    });

    return buildResponse(staticIssues, llmResult.text ?? '', llmResult.provider ?? '');
  } catch (error: unknown) {
    console.error('[AnalyzeImpact API] Error executing code impact analysis:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown internal execution error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

