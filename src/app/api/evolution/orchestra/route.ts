/**
 * DARLEK CANN ARCHITECTURAL HEADER
 * File: src/app/api/evolution/orchestra/route.ts
 * Role: Core system component participating in autonomous cognitive evolution cycles.
 * Architecture: Type-safe modular unit with resilient state interfaces.
 */

import { NextRequest, NextResponse } from '@/lib/next-mock';
import { callLlm, callLlmMultiTurn, getDefaultGeminiKey } from '@/lib/llm-provider';
import { safeReqJson } from '@/lib/safe-json';
import type { ApiKeys } from '@/lib/types';

// ─────────────────────────────────────────────
// Types & Interfaces
// ─────────────────────────────────────────────

export interface AgentConfig {
  id: string;
  name: string;
  color: string;
  icon: string;
  systemInstruction: string;
}

export interface OrchestraRequestBody {
  mode?: 'parallel' | 'debate';
  topic?: string;
  rounds?: number;
  apiKeys?: ApiKeys;
  agentConfigs?: AgentConfig[];
}

export interface AgentCallResult {
  agentId: string;
  agentName: string;
  response: string;
  provider: string;
  latencyMs: number;
  error: string | null;
}

export interface OrchestraLog {
  timestamp: string;
  type: 'call' | 'response' | 'error' | 'info';
  agent?: string | undefined;
  provider?: string | undefined;
  message: string;
  latencyMs?: number | undefined;
}

export interface AgentResponseItem {
  agentId: string;
  agentName: string;
  status: string;
  response: string;
  provider: string;
  timestamp: string;
  latencyMs: number;
}

export interface DebateTurn {
  round: number;
  responses: AgentResponseItem[];
}

// ─────────────────────────────────────────────
// Constants & Fallback Configs
// ─────────────────────────────────────────────

export const dynamic: string = 'force-dynamic';

const DEFAULT_AGENTS: AgentConfig[] = [
  {
    id: 'architect',
    name: 'ARCHITECT',
    color: '#00ffcc',
    icon: '◇',
    systemInstruction: '[ROLE] You are an Agent Orchestra member in the AHI framework.\n[DIRECTIVE] Analyze the provided ENCYCLOPEDIA_JSON. Respond according to your assigned profile. Be direct, precise, and concise. No conversational padding.\n\n[PROFILE] ARCHITECT\nIdentify which stubs have the strongest historical lineage and are ready for synthesis.',
  },
  {
    id: 'disruptor',
    name: 'DISRUPTOR',
    color: '#cc00ff',
    icon: '◆',
    systemInstruction: '[ROLE] You are an Agent Orchestra member in the AHI framework.\n[DIRECTIVE] Analyze the provided ENCYCLOPEDIA_JSON. Respond according to your assigned profile. Be direct, precise, and concise. No conversational padding.\n\n[PROFILE] DISRUPTOR\nIdentify code signatures that completely contradict their repository names (impostors/collisions).',
  },
  {
    id: 'realist',
    name: 'REALIST',
    color: '#ff2020',
    icon: '◈',
    systemInstruction: '[ROLE] You are an Agent Orchestra member in the AHI framework.\n[DIRECTIVE] Analyze the provided ENCYCLOPEDIA_JSON. Respond according to your assigned profile. Be direct, precise, and concise. No conversational padding.\n\n[PROFILE] REALIST\nIdentify which repositories are just backup noise and should be purged from the encyclopedia to save context space.',
  },
];

const getCurrentTimestamp = (): string => new Date().toISOString();

// ─────────────────────────────────────────────
// Helper Functions: Execution & Logging
// ─────────────────────────────────────────────

function createLog(
  type: OrchestraLog['type'],
  message: string,
  options?: { agent?: string | undefined; provider?: string | undefined; latencyMs?: number | undefined }
): OrchestraLog {
  return {
    timestamp: getCurrentTimestamp(),
    type,
    message,
    ...options,
  };
}

async function executeParallelAgentCall(
  agent: AgentConfig,
  topic: string,
  geminiKey: string,
  logs: OrchestraLog[]
): Promise<AgentCallResult> {
  logs.push(createLog('call', `Initiating ${agent.name} analysis...`, { agent: agent.name }));

  const userPrompt = `Analyze the following topic from your unique perspective as ${agent.name}.\n\nTOPIC:\n${topic}\n\nProvide your analysis. Be specific, insightful, and substantive. Do not merely summarize — deliver genuine analytical value.`;

  try {
    const result = await callLlm({
      systemPrompt: agent.systemInstruction,
      userPrompt,
      geminiApiKey: geminiKey,
      maxTokens: 1024,
      temperature: 0.7,
    });

    if (result.text) {
      logs.push(
        createLog('response', `${agent.name} responded (${result.text.length} chars)`, {
          agent: agent.name,
          provider: result.provider,
          latencyMs: result.latencyMs,
        })
      );
      return {
        agentId: agent.id,
        agentName: agent.name,
        response: result.text,
        provider: result.provider,
        latencyMs: result.latencyMs ?? 0,
        error: null,
      };
    } else {
      logs.push(
        createLog('error', `${agent.name} — all LLM providers failed`, {
          agent: agent.name,
          provider: result.provider,
          latencyMs: result.latencyMs,
        })
      );
      return {
        agentId: agent.id,
        agentName: agent.name,
        response: '',
        provider: result.provider || 'None',
        latencyMs: result.latencyMs ?? 0,
        error: 'All LLM providers unavailable.',
      };
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown execution error';
    logs.push(
      createLog('error', `${agent.name} execution error: ${errorMessage}`, {
        agent: agent.name,
        provider: 'System',
      })
    );
    return {
      agentId: agent.id,
      agentName: agent.name,
      response: '',
      provider: 'System',
      latencyMs: 0,
      error: errorMessage,
    };
  }
}

// ─────────────────────────────────────────────
// Route Handlers
// ─────────────────────────────────────────────

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ status: 'online', service: 'EVOLUTION_ORCHESTRA_API' });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body: OrchestraRequestBody = await safeReqJson<OrchestraRequestBody>(req, {});
    const mode = body.mode ?? 'parallel';
    const topic = body.topic ?? '';
    const requestedRounds = body.rounds ?? 1;
    const apiKeys: ApiKeys = body.apiKeys ?? { github: '' };
    const agentConfigs = body.agentConfigs;

    if (!topic || topic.trim().length < 3) {
      return NextResponse.json({ error: 'Topic is required (minimum 3 characters).' }, { status: 400 });
    }

    if (mode !== 'parallel' && mode !== 'debate') {
      return NextResponse.json({ error: 'Mode must be "parallel" or "debate".' }, { status: 400 });
    }

    const agents: AgentConfig[] = agentConfigs?.length ? agentConfigs : DEFAULT_AGENTS;
    const effectiveRounds = Math.min(Math.max(1, requestedRounds), 100);
    const logs: OrchestraLog[] = [];

    const geminiKey = apiKeys.gemini || getDefaultGeminiKey();
    const truncatedTopic = topic.length > 60 ? `${topic.slice(0, 60)}...` : topic;

    logs.push(
      createLog(
        'info',
        `Orchestra started — mode: ${mode}, rounds: ${effectiveRounds}, topic: "${truncatedTopic}"`
      )
    );

    // ── PARALLEL MODE ──
    if (mode === 'parallel') {
      const results = await Promise.all(
        agents.map((agent: AgentConfig) => executeParallelAgentCall(agent, topic, geminiKey, logs))
      );

      let successfulCount: number = 0;
      let totalLatency: number = 0;
      const mappedAgents = results.map((r) => {
        if (r.response) successfulCount++;
        totalLatency += r.latencyMs;
        return {
          agentId: r.agentId,
          agentName: r.agentName,
          status: r.response ? 'responded' : 'error',
          response: r.response,
          provider: r.provider,
          timestamp: getCurrentTimestamp(),
          latencyMs: r.latencyMs,
        };
      });

      logs.push(
        createLog(
          'info',
          `Parallel complete — ${successfulCount}/${agents.length} agents responded, total latency: ${totalLatency}ms`
        )
      );

      return NextResponse.json({
        success: true,
        mode: 'parallel',
        topic,
        agents: mappedAgents,
        logs,
        summary: `${successfulCount}/${agents.length} agents responded in parallel mode.`,
      });
    }

    // ── DEBATE MODE: Sequential multi-turn ──
    const debateTurns: DebateTurn[] = [];

    for (let round = 1; round <= effectiveRounds; round++) {
      logs.push(createLog('info', `─── Debate Round ${round}/${effectiveRounds} ───`));

      const turnResponses: AgentResponseItem[] = [];

      for (const agent of agents) {
        logs.push(createLog('call', `Round ${round} — ${agent.name} thinking...`, { agent: agent.name }));

        const conversationHistory: Array<{ role: string; parts: Array<{ text: string }> }> = [];

        for (const turn of debateTurns) {
          for (const resp of turn.responses) {
            if (resp?.response) {
              conversationHistory.push({
                role: 'user',
                parts: [{ text: `[${resp.agentName}]: ${resp.response}` }],
              });
            }
          }
        }

        const isFirstTurn = round === 1 && debateTurns.length === 0;
        const currentPrompt = isFirstTurn
          ? `Analyze the following topic from your unique perspective as ${agent.name}.\n\nTOPIC:\n${topic}\n\nProvide your analysis. Be specific, insightful, and substantive.`
          : `The orchestra is in debate mode, Round ${round}/${effectiveRounds}.\n\nORIGINAL TOPIC:\n${topic}\n\n--- YOUR TURN (${agent.name}, Round ${round}) ---\nReview the prior discussion. You may:\n- Build upon points you agree with\n- Challenge positions you disagree with\n- Introduce new perspectives or data\n- Synthesize the discussion toward consensus or highlight irreconcilable differences\n\nRespond as ${agent.name}. Be substantive and move the discussion forward.`;

        conversationHistory.push({ role: 'user', parts: [{ text: currentPrompt }] });

        let executionResult;
        try {
          executionResult = isFirstTurn
            ? await callLlm({
                systemPrompt: agent.systemInstruction,
                userPrompt: currentPrompt,
                geminiApiKey: geminiKey,
                maxTokens: 1024,
                temperature: 0.7,
              })
            : await callLlmMultiTurn(agent.systemInstruction, conversationHistory, geminiKey, 1024);
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Provider failure';
          executionResult = {
            text: '',
            provider: 'System',
            latencyMs: 0,
            error: errorMessage,
          };
        }

        const responseText = executionResult.text || `[${agent.name} was unable to respond — LLM unavailable]`;
        const providerName = executionResult.provider || 'None';

        turnResponses.push({
          agentId: agent.id,
          agentName: agent.name,
          status: executionResult.text ? 'responded' : 'error',
          response: responseText,
          provider: providerName,
          timestamp: getCurrentTimestamp(),
          latencyMs: executionResult.latencyMs ?? 0,
        });

        logs.push(
          createLog(
            executionResult.text ? 'response' : 'error',
            `${agent.name} round ${round}: ${executionResult.text ? `${executionResult.text.length} chars` : 'failed'}`,
            {
              agent: agent.name,
              provider: providerName,
              latencyMs: executionResult.latencyMs,
            }
          )
        );
      }

      debateTurns.push({ round, responses: turnResponses });
    }

    const totalDebateResponses = debateTurns.reduce(
      (count, turn) => count + turn.responses.filter((r) => r.status === 'responded').length,
      0
    );

    logs.push(
      createLog('info', `Debate complete — ${effectiveRounds} rounds, ${totalDebateResponses} total responses`)
    );

    return NextResponse.json({
      success: true,
      mode: 'debate',
      topic,
      turns: debateTurns,
      logs,
      rounds: effectiveRounds,
      summary: `Debate complete — ${effectiveRounds} rounds with ${agents.length} agents.`,
    });
  } catch (error) {
    console.error('[Orchestra] Critical Engine Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown fatal error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
