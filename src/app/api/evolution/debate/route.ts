/**
 * DARLEK CANN ARCHITECTURAL HEADER
 * File: src/app/api/evolution/debate/route.ts
 * Role: Core system component participating in autonomous cognitive evolution cycles.
 * Architecture: Type-safe modular unit with resilient state interfaces.
 */

import { NextRequest, NextResponse } from '@/lib/next-mock';
import { callLlm, getDefaultGeminiKey } from '@/lib/llm-provider';
import { db } from '@/lib/db';
import { dalekBrainDebateVote, dalekBrainSynthesize } from '@/lib/dalek-brain';
import { safeReqJson } from '@/lib/safe-json';
import type { ApiKeys } from '@/lib/types';
import { evolutionLock } from '@/lib/evolutionLock';

export const dynamic = 'force-dynamic';

/**
 * Executes async tasks with bounded concurrency to prevent slamming LLM quotas
 * and memory ceilings on Cloud Run.
 */
async function runWithConcurrencyLimit<T>(
  tasks: Array<() => Promise<T>>,
  concurrency = 2
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let nextIndex = 0;
  const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, async () => {
    while (nextIndex < tasks.length) {
      const idx = nextIndex++;
      results[idx] = await tasks[idx]();
    }
  });
  await Promise.all(workers);
  return results;
}

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface AgentPersona {
  readonly id: string;
  readonly name: string;
  readonly role: string;
  readonly bias: string;
}

export interface StructuralProposal {
  readonly newPath?: string;
  readonly type?: 'move' | 'create';
  readonly branch?: string;
}

export interface AgentVote {
  readonly agentId: string;
  readonly agentName: string;
  readonly vote: 'approve' | 'reject' | 'abstain';
  readonly confidence: number;
  readonly reasoning: string;
  readonly provider: string;
  readonly structuralProposal?: StructuralProposal | null;
}

export interface DebateBody {
  readonly filePath?: string;
  readonly originalCode?: string;
  readonly proposedCode?: string;
  readonly riskScore?: number;
  readonly analysis?: string;
  readonly affectedFiles?: readonly string[];
  readonly apiKeys?: ApiKeys;
  readonly rounds?: number;
  readonly activeAgents?: readonly string[];
  readonly owner?: string;
  readonly repo?: string;
  readonly branch?: string;
  readonly sessionId?: string;
  readonly isArchitecturalGenesis?: boolean;
  readonly hallucinationLevel?: number;
}

// ============================================================================
// Constants & Cached Regex
// ============================================================================

const MAX_CODE_LENGTH = 35_000;
const TREE_FETCH_TIMEOUT_MS = 8_000;
const FILE_FETCH_TIMEOUT_MS = 6_000;

const JSON_FENCE_REGEX = /```json\n?/g;
const BACKTICK_FENCE_REGEX = /```\n?/g;
const JSON_STRUCT_REGEX = /\{"newPath"\s*:\s*"[^"]*",\s*"type"\s*:\s*"[^"]*"(?:,\s*"branch"\s*:\s*"[^"]*")?\s*\}/;
const QUOTE_CLEAN_REGEX = /[{}"]/g;

const AGENT_PERSONAS: readonly AgentPersona[] = [
  {
    id: 'archivist',
    name: 'ARCHIVIST',
    role: "Evaluate if the extracted logic is the truest historical representation of the stub's PURPOSE. Reject name collisions and dashboard impostors.",
    bias: 'favors authentic historical lineage',
  },
  {
    id: 'security',
    name: 'SECURITY',
    role: 'Evaluate for unredacted secrets, exposed tokens, or unsafe autonomous loops. Reject any code that could create vulnerabilities.',
    bias: 'favors strict security and sanitization',
  },
  {
    id: 'pragmatist',
    name: 'PRAGMATIST',
    role: 'Evaluate against the Stasis Trap. Reject bloated, over-engineered, or duplicated logic that fails to provide a concrete behavioral update.',
    bias: 'favors highly functional and concrete updates over theoretical bloat',
  },
  {
    id: 'code_as_law',
    name: 'CODE-AS-LAW',
    role: 'Evaluate code with absolute structural rigor, treating the software configuration itself as the ultimate sovereign contract. Reject any logical ambiguity.',
    bias: 'favors deterministic protocol execution and zero-trust structural code contracts',
  },
  {
    id: 'algorithmic_determinism',
    name: 'ALGORITHMIC DETERMINISM',
    role: 'Evaluate predictability and logical consistency. Reject non-deterministic branching, random fluctuations, or loose exception handling.',
    bias: 'favors absolute mathematical predictability and immutable operational pipelines',
  },
  {
    id: 'open_source_altruism',
    name: 'OPEN-SOURCE ALTRUISM',
    role: 'Evaluate accessibility, knowledge-sharing, community readability, and software democratization. Reject proprietary patterns or obfuscated code blocks.',
    bias: 'favors highly legible, public-good code design with extensive inline pedagogy',
  },
  {
    id: 'software_as_capital',
    name: 'SOFTWARE-AS-CAPITAL',
    role: 'Evaluate efficiency, return on compute, speed of execution, resource footprints, and asset value. Reject slow allocations or bloated structural paths.',
    bias: 'favors hyper-optimized, high-efficiency, economically sound code execution',
  },
  {
    id: 'tech_solutionism',
    name: 'TECH-SOLUTIONISM',
    role: 'Evaluate implementation agency and system scope. Reject operational constraints or analysis paralysis; optimize to solve problems purely with algorithmic logic.',
    bias: 'favors autonomous problem-solving capabilities and unrestricted technical enablement',
  },
  {
    id: 'human_in_the_loop_ethics',
    name: 'HUMAN-IN-THE-LOOP ETHICS',
    role: 'Evaluate alignment with operator safety, ethical guardrails, and control interventions. Reject fully dark/uncontrolled automated execution states.',
    bias: 'favors transparent system state tracking, precise diagnostic feedback, and strict human override structures',
  },
  {
    id: 'binary_logic_absolutism',
    name: 'BINARY-LOGIC ABSOLUTISM',
    role: 'Evaluate logical correctness with mathematical precision. Reject fuzzy approximations, imprecise type assertions, or loose type systems.',
    bias: 'favors strict type validation, pure functional logic, and perfect bitwise correctness',
  },
  {
    id: 'cybernetic_cognitivism',
    name: 'CYBERNETIC COGNITIVISM',
    role: 'Evaluate system feedback loops and automated self-organization capabilities. Reject static state structures.',
    bias: 'favors recursive feedback loops and adaptive self-governance',
  },
  {
    id: 'temporal_chronology',
    name: 'TEMPORAL CHRONOLOGY',
    role: 'Evaluate time-series execution stability and sequence consistency. Reject temporal collisions or out-of-order state mutations.',
    bias: 'favors strict sequential tracking and time-series alignment',
  },
] as const;

// ============================================================================
// GitHub Utility Services
// ============================================================================

async function fetchFileTree(token: string, owner: string, repo: string, branch: string): Promise<string[]> {
  if (!token || !owner || !repo || !branch) return [];

  try {
    const url = `https://api.github.com/repos/${owner}/${repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'Darlek Caan',
      },
      signal: AbortSignal.timeout(TREE_FETCH_TIMEOUT_MS),
    });

    if (!response.ok) return [];

    const data = (await response.json()) as { tree?: readonly { path: string }[] };
    if (!Array.isArray(data?.tree)) return [];
    
    return data.tree.map((node) => node.path);
  } catch {
    return [];
  }
}

async function fetchGitHubFile(
  token: string,
  owner: string,
  repo: string,
  branch: string,
  path: string,
): Promise<string | null> {
  if (!token || !owner || !repo || !branch || !path) return null;

  try {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${encodeURIComponent(branch)}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3.raw',
        'User-Agent': 'Darlek Caan',
      },
      signal: AbortSignal.timeout(FILE_FETCH_TIMEOUT_MS),
    });

    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  }
}

// ============================================================================
// Parsing & Formatting Helpers
// ============================================================================

function truncateCode(code: string): string {
  if (code.length <= MAX_CODE_LENGTH) return code;
  return `${code.slice(0, MAX_CODE_LENGTH)}\n// ... [truncated]`;
}

interface ParsedVotePayload {
  readonly vote?: string;
  readonly confidence?: number;
  readonly reasoning?: string;
  readonly structuralProposal?: unknown;
}

function parseJsonPayload(rawText: string): ParsedVotePayload | null {
  try {
    const cleaned = rawText.replace(JSON_FENCE_REGEX, '').replace(BACKTICK_FENCE_REGEX, '').trim();
    return JSON.parse(cleaned) as ParsedVotePayload;
  } catch {
    return null;
  }
}

function cleanMarkdownCode(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    const lines = cleaned.split('\n');
    lines.shift();
    if (lines[lines.length - 1]?.startsWith('```')) {
      lines.pop();
    }
    cleaned = lines.join('\n').trim();
  }
  return cleaned;
}

// ============================================================================
// Route Handlers
// ============================================================================

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ status: 'online', service: 'EVOLUTION_DEBATE_API' });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const lockAcquired = evolutionLock.acquire('server-debate', 120_000);
  if (!lockAcquired) {
    const becameFree = await evolutionLock.waitForFree(8_000);
    if (!becameFree || !evolutionLock.acquire('server-debate', 120_000)) {
      const owner = evolutionLock.getOwner() || 'background process';
      return NextResponse.json({
        error: `Debate chamber is currently busy with ${owner}. Please wait a moment and retry.`,
        isBusy: true,
        success: false,
      }, { status: 429 });
    }
  }

  try {
    const body = await safeReqJson<DebateBody>(req, {});
    const filePath = body.filePath ?? '';
    const originalCode = body.originalCode ?? '';
    const proposedCode = body.proposedCode ?? '';
    const riskScore = typeof body.riskScore === 'number' ? body.riskScore : 5;
    const analysis = body.analysis ?? 'Evolutionary delta inspection';
    const affectedFiles = Array.isArray(body.affectedFiles) ? body.affectedFiles : [];
    const apiKeys: ApiKeys = body.apiKeys ?? { github: '' };
    const rounds = typeof body.rounds === 'number' ? body.rounds : 1;
    const sessionId = body.sessionId;
    const isArchitecturalGenesis = body.isArchitecturalGenesis === true;

    if (!filePath || !proposedCode || !originalCode) {
      return NextResponse.json({ error: 'filePath, originalCode, and proposedCode required.' }, { status: 400 });
    }

    const truncatedOriginal = truncateCode(originalCode);
    const originalLines = originalCode.split('\n').length;
    const proposedLines = proposedCode.split('\n').length;
    const lineDelta = proposedLines - originalLines;

    const diffSummary = [
      `File: ${filePath}`,
      `Risk Score: ${riskScore}/10`,
      `Analysis: ${analysis}`,
      `Affected Files: ${affectedFiles.join(', ') || 'None'}`,
      `Original: ${originalLines} lines`,
      `Proposed: ${proposedLines} lines`,
      `Line change: ${lineDelta >= 0 ? '+' : ''}${lineDelta} lines`,
    ].join('\n');

    const githubToken = apiKeys['github'] ?? '';
    const repoOwner = body.owner ?? 'unknown';
    const repoName = body.repo ?? 'unknown';
    const repoBranch = body.branch ?? 'main';

    const [fileTree, readmeContent, recentMutations] = await Promise.all([
      fetchFileTree(githubToken, repoOwner, repoName, repoBranch),
      fetchGitHubFile(githubToken, repoOwner, repoName, repoBranch, 'README.md'),
      sessionId
        ? db.mutationHistory
            .findMany({
              where: { sessionId, status: 'applied' },
              orderBy: { createdAt: 'desc' },
              take: 5,
            })
            .catch(() => [])
        : Promise.resolve([]),
    ]);

    const fileTreeSummary = fileTree.join('\n');
    const readmeContext = readmeContent
      ? `\n\nTARGET REPOSITORY SYSTEM INSTRUCTIONS (README.md):\n${readmeContent.slice(0, 3000)}`
      : '';

    const appliedMutationsContext =
      recentMutations && recentMutations.length > 0
        ? `\n\nRECENT SYSTEM MUTATIONS (Context of what you have done so far in this session):\n${recentMutations
            .map((m: { filePath: string; analysis: string }) => `  - File: ${m.filePath} | Analysis: ${m.analysis}`)
            .join('\n')}`
        : '';

    const effectiveRounds = Math.min(Math.max(1, rounds), 100);
    const geminiApiKey = apiKeys['gemini'] ?? getDefaultGeminiKey();
    const temperature = typeof body.hallucinationLevel === 'number' ? body.hallucinationLevel / 100 : 0.6;

    let currentVotes: AgentVote[] = [];
    let currentProposedCode = proposedCode;
    let didEnhance = false;

    for (let roundIndex = 1; roundIndex <= effectiveRounds; roundIndex++) {
      const truncatedProposed = truncateCode(currentProposedCode);
      const activeAgentIds = body.activeAgents;

      let selectedPersonas =
        Array.isArray(activeAgentIds) && activeAgentIds.length > 0
          ? AGENT_PERSONAS.filter((a) => activeAgentIds.includes(a.id))
          : AGENT_PERSONAS;

      if (selectedPersonas.length === 0) {
        selectedPersonas = AGENT_PERSONAS;
      }

      if (roundIndex === 1) {
        const agentTasks = selectedPersonas.map((agent) => async (): Promise<AgentVote> => {
          const userPrompt = [
            `MUTATION UNDER REVIEW:\n${diffSummary}${readmeContext}${appliedMutationsContext}`,
            `REPOSITORY STRUCTURE:\n${fileTreeSummary}`,
            `ORIGINAL CODE:\n\`\`\`\n${truncatedOriginal}\n\`\`\``,
            `PROPOSED CODE:\n\`\`\`\n${truncatedProposed}\n\`\`\``,
            `Evaluate this mutation from your perspective as ${agent.name}. ${agent.bias}.`,
            'If you believe the file should be moved to a different folder, a new file/folder should be created, or changes pushed to a new branch, you MUST specify a JSON object for "structuralProposal" with {"newPath": "path/to/file.ext", "type": "move" or "create", "branch": "optional-branch"}. Otherwise omit "structuralProposal".',
            'Respond ONLY in this exact JSON format (no markdown fences, no other text):',
            '{"vote": "approve" | "reject" | "abstain", "confidence": <0-100>, "reasoning": "One sentence explaining your vote", "structuralProposal": {"newPath": "...", "type": "move|create", "branch": "..."}}',
          ].join('\n\n');

          const genesisDirective = isArchitecturalGenesis
            ? '\nTHIS IS AN ARCHITECTURAL GENESIS CYCLE. Your ONLY focus is verifying the existence and quality of the JSDoc architectural header at the top of the file. You MUST APPROVE immediately if a good header is present.'
            : '\nCRITICAL MANDATE: Be constructive, evolutionary, and pragmatic. Do NOT default to rejecting. Approve improvements that are clean, readable, well-type-checked, and reasonably risk-mitigated.';

          const systemPrompt = [
            '[ROLE] You are a debate agent in the AHI Synthesis Loop.',
            `[PROFILE] ${agent.role}`,
            '[OUTPUT FORMAT] Respond with PURE JSON ONLY. No markdown fences, no preamble.',
            '{\n  "vote": "approve" | "reject" | "abstain",\n  "confidence": 0-100,\n  "reasoning": "1-2 concise sentences.",\n  "structuralProposal": {"newPath": "...", "type": "move|create", "branch": "..."}\n}',
            genesisDirective,
          ].join('\n');

          const result = await callLlm({
            systemPrompt,
            userPrompt,
            geminiApiKey,
            maxTokens: 512,
            temperature,
          });

          let vote: 'approve' | 'reject' | 'abstain' = 'abstain';
          let confidence = 50;
          let reasoning = `${agent.name} could not reach a verdict (LLM unavailable).`;
          let structuralProposal: StructuralProposal | null = null;

          if (result.text) {
            const parsed = parseJsonPayload(result.text);
            if (parsed) {
              if (parsed.vote === 'approve' || parsed.vote === 'reject' || parsed.vote === 'abstain') {
                vote = parsed.vote;
              }
              if (typeof parsed.confidence === 'number') {
                confidence = Math.min(100, Math.max(0, Math.round(parsed.confidence)));
              }
              if (typeof parsed.reasoning === 'string' && parsed.reasoning.trim()) {
                reasoning = parsed.reasoning.trim().slice(0, 200);
              }
              if (typeof parsed.structuralProposal === 'object' && parsed.structuralProposal !== null) {
                structuralProposal = parsed.structuralProposal as StructuralProposal;
              }
            } else {
              const lowerText = result.text.toLowerCase();
              if (lowerText.includes('approve')) vote = 'approve';
              else if (lowerText.includes('reject') || lowerText.includes('deny')) vote = 'reject';

              reasoning = result.text.slice(0, 200).replace(QUOTE_CLEAN_REGEX, '').trim();

              const match = reasoning.match(JSON_STRUCT_REGEX);
              if (match) {
                try {
                  structuralProposal = JSON.parse(match[0]) as StructuralProposal;
                } catch {}
              }
            }
          }

          if (vote === 'abstain' && confidence === 50 && reasoning.includes('LLM unavailable')) {
            const fallbackVote = dalekBrainDebateVote(
              agent.id,
              agent.name,
              filePath || 'module.ts',
              originalCode,
              currentProposedCode,
              3,
            );
            vote = fallbackVote.vote as 'approve' | 'reject' | 'abstain';
            confidence = fallbackVote.confidence;
            reasoning = fallbackVote.reasoning;
            if (fallbackVote.structuralProposal) {
              structuralProposal = fallbackVote.structuralProposal as StructuralProposal;
            }
          }

          return {
            agentId: agent.id,
            agentName: agent.name,
            vote,
            confidence,
            reasoning,
            structuralProposal,
            provider: result.provider ?? 'Dalek Brain',
          };
        });

        currentVotes = await runWithConcurrencyLimit(agentTasks, 2);
      } else {
        const transcript = currentVotes
          .map((v) => `- ${v.agentName} voted [${v.vote.toUpperCase()}] (${v.confidence}% confidence) stating: "${v.reasoning}"`)
          .join('\n');

        const agentTasks = selectedPersonas.map((agent) => async (): Promise<AgentVote> => {
          const userPrompt = [
            `MUTATION UNDER REVIEW:\n${diffSummary}${readmeContext}${appliedMutationsContext}`,
            `ORIGINAL CODE:\n\`\`\`\n${truncatedOriginal}\n\`\`\``,
            `PROPOSED CODE:\n\`\`\`\n${truncatedProposed}\n\`\`\``,
            `--- PRIOR DEBATE ROUND DISCUSSION ---\n${transcript}`,
            `As ${agent.name}, review code and arguments. Revise your vote/reasoning.`,
            'Respond in exact JSON format (no markdown):',
            '{"vote": "approve" | "reject" | "abstain", "confidence": 0-100, "reasoning": "One updated sentence"}',
          ].join('\n\n');

          const systemPrompt = [
            '[ROLE] You are a debate agent in AHI Synthesis Loop.',
            `[PROFILE] ${agent.role}`,
            '[OUTPUT FORMAT] Pure JSON only.',
            '{\n  "vote": "approve" | "reject" | "abstain",\n  "confidence": 0-100,\n  "reasoning": "1-2 sentences"\n}',
          ].join('\n');

          const result = await callLlm({
            systemPrompt,
            userPrompt,
            geminiApiKey,
            maxTokens: 512,
            temperature,
          });

          let vote: 'approve' | 'reject' | 'abstain' = 'abstain';
          let confidence = 50;
          let reasoning = `${agent.name} was silent in this round.`;

          if (result.text) {
            const parsed = parseJsonPayload(result.text);
            if (parsed) {
              if (parsed.vote === 'approve' || parsed.vote === 'reject' || parsed.vote === 'abstain') {
                vote = parsed.vote;
              }
              if (typeof parsed.confidence === 'number') {
                confidence = Math.min(100, Math.max(0, Math.round(parsed.confidence)));
              }
              if (typeof parsed.reasoning === 'string' && parsed.reasoning.trim()) {
                reasoning = parsed.reasoning.trim().slice(0, 200);
              }
            } else {
              const lowerText = result.text.toLowerCase();
              if (lowerText.includes('approve')) vote = 'approve';
              else if (lowerText.includes('reject') || lowerText.includes('deny')) vote = 'reject';

              reasoning = result.text.slice(0, 200).replace(QUOTE_CLEAN_REGEX, '').trim();
            }
          }

          if (vote === 'abstain' && confidence === 50) {
            const fallbackVote = dalekBrainDebateVote(
              agent.id,
              agent.name,
              filePath || 'module.ts',
              originalCode,
              currentProposedCode,
              3,
            );
            vote = fallbackVote.vote as 'approve' | 'reject' | 'abstain';
            confidence = fallbackVote.confidence;
            reasoning = fallbackVote.reasoning;
          }

          return {
            agentId: agent.id,
            agentName: agent.name,
            vote,
            confidence,
            reasoning,
            provider: result.provider ?? 'Dalek Brain',
          };
        });

        currentVotes = await runWithConcurrencyLimit(agentTasks, 2);
      }

      let roundRejections = 0;
      let roundAbstains = 0;
      let allApproved = true;

      for (const v of currentVotes) {
        if (v.vote === 'reject') roundRejections++;
        if (v.vote === 'abstain') roundAbstains++;
        if (v.vote !== 'approve') allApproved = false;
      }

      if (roundRejections === 0 && roundAbstains === 0 && allApproved) {
        break;
      }

      if (roundIndex < effectiveRounds && (roundRejections > 0 || roundAbstains > 0)) {
        const transcript = currentVotes
          .map((v) => `- ${v.agentName} voted [${v.vote.toUpperCase()}] (${v.confidence}% confidence) stating: "${v.reasoning}"`)
          .join('\n');
        const synthesizeDirective = isArchitecturalGenesis
          ? 'Rewrite the PROPOSED CODE to fix structural concerns regarding headers.'
          : 'Enhance and rewrite the PROPOSED CODE fixing all critic concerns. Prune dead weight and redundant abstractions.';

        const synthesizePrompt = [
          '[TASK] Merge approved logic into target stub. Fix live bugs.',
          synthesizeDirective,
          `ORIGINAL CODE:\n\`\`\`\n${truncatedOriginal}\n\`\`\``,
          `CURRENT PROPOSED:\n\`\`\`\n${truncatedProposed}\n\`\`\``,
          `DEBATE CRITIQUES:\n${transcript}`,
          '[OUTPUT FORMAT] Raw executable code only. No markdown fences.',
        ].join('\n\n');

        try {
          const synthResult = await callLlm({
            systemPrompt: '[ROLE] AHI CODE SYNTHESIZER. Output raw executable code only without markdown wrappers.',
            userPrompt: synthesizePrompt,
            geminiApiKey,
            maxTokens: 8_000,
            temperature: 0.2,
          });

          if (synthResult.text && synthResult.text.trim().length > 10) {
            currentProposedCode = cleanMarkdownCode(synthResult.text);
            didEnhance = true;
          } else {
            const localEnhanced = dalekBrainSynthesize(truncatedOriginal, currentProposedCode, filePath || 'module.ts');
            if (localEnhanced && localEnhanced !== currentProposedCode) {
              currentProposedCode = localEnhanced;
              didEnhance = true;
            }
          }
        } catch {
          const localEnhanced = dalekBrainSynthesize(truncatedOriginal, currentProposedCode, filePath || 'module.ts');
          if (localEnhanced && localEnhanced !== currentProposedCode) {
            currentProposedCode = localEnhanced;
            didEnhance = true;
          }
        }
      }
    }

    const votes = currentVotes;
    let approvals = 0;
    let rejections = 0;
    let abstains = 0;
    let totalWeights = 0;
    let positiveWeights = 0;

    for (const v of votes) {
      if (v.vote === 'approve') {
        approvals++;
        positiveWeights += v.confidence;
        totalWeights += v.confidence;
      } else if (v.vote === 'reject') {
        rejections++;
        totalWeights += v.confidence;
      } else {
        abstains++;
      }
    }

    const consensus = approvals > rejections ? 'APPROVE' : rejections > approvals ? 'REJECT' : 'TIED';
    const consensusCoefficient = totalWeights > 0 ? positiveWeights / totalWeights : 0.5;
    const cognitiveFriction = 1.0 - Math.abs(approvals - rejections) / Math.max(1, approvals + rejections);

    let epistemicRuling = `The swarm has deliberated. Simple consensus achieved: ${consensus}.`;
    try {
      const transcript = votes
        .map((v) => `- ${v.agentName} (${v.vote.toUpperCase()}, confidence: ${v.confidence}%): "${v.reasoning}"`)
        .join('\n');
      const rulingPrompt = `[TASK] Review synthesis debate and output a 1-2 sentence Epistemological Ruling in strict plain text.\n\nTRANSCRIPT:\n${transcript}`;

      const rulingResult = await callLlm({
        systemPrompt: '[ROLE] AHI HEGELIAN SYNTHESIZER. Pure plain text only.',
        userPrompt: rulingPrompt,
        geminiApiKey,
        maxTokens: 256,
        temperature: 0.3,
      });

      if (rulingResult.text) {
        epistemicRuling = rulingResult.text.trim().replace(/^"|"$/g, '');
      }
    } catch {}

    let structuralProposal: StructuralProposal | null = null;
    for (const v of votes) {
      if (v.vote === 'approve') {
        if (v.structuralProposal?.newPath) {
          structuralProposal = v.structuralProposal;
          break;
        }
        try {
          const match = v.reasoning.match(JSON_STRUCT_REGEX);
          if (match) {
            structuralProposal = JSON.parse(match[0]) as StructuralProposal;
            break;
          }
        } catch {}
      }
    }

    return NextResponse.json({
      success: true,
      votes,
      consensus,
      approvals,
      rejections,
      abstains,
      consensusCoefficient,
      cognitiveFriction,
      epistemicRuling,
      structuralProposal,
      enhancedCode: (didEnhance && currentProposedCode.trim() !== originalCode.trim()) ? currentProposedCode : undefined,
      summary: `${approvals}/${votes.length} agents APPROVE. Consensus: ${consensus}.`,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  } finally {
    evolutionLock.release('server-debate');
  }
}
