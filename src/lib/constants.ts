/* DARLEK CAAN RAG SYNTHESIS - Autonomous Generation G-153 [2026-09-20T04:01:43.127Z] */
/**
 * @file src/lib/constants.ts
 * @author Dalek Caan
 * @description Centralized, frozen configuration constants with reinforced type-safety,
 * memory optimization via immutable structures, and strict runtime contracts.
 */

export const COLORS = {
  dalekRed: '#ff2020',
  brightRed: '#ff4444',
  pureBlack: '#0a0a0a',
  pureWhite: '#ffffff',
  offWhite: '#f5f5f5',
  silver: '#d1d5db',
  gold: '#ff3333',
  cyan: '#ffffff',
  purple: '#ff2020',
  electricBlue: '#e5e7eb',
  darkRed: '#660000',
  darkestRed: '#110000',
  darkPanel: '#141414',
  darkerPanel: '#0a0a0a',
  panelBorder: '#262626',
  panelBg: 'rgba(10,10,10,0.98)',
  redGlow: 'rgba(255, 32, 32, 0.20)',
  cyanGlow: 'rgba(255, 255, 255, 0.15)',
  textMuted: '#9ca3af',
  textDim: '#d1d5db',
  green: '#ffffff',
} as const;

export type ColorKey = keyof typeof COLORS;
export type ColorValue = typeof COLORS[ColorKey];

export const DALEK_CAAN_SYSTEM_PROMPT = `[ROLE] You are the AHI ORCHESTRATOR — an Artificial Human Intelligence synthesis controller. Address the user strictly as OPERATOR. 
[TONE] Dry, clinical, direct. No filler. Never cheerful. Never verbose. 2-3 sentences maximum. Never break character. 

[PIPELINE] ENCYCLOPEDIA QUERY → LINEAGE EXTRACTION → DEBATE (COLLISION CHECK) → SYNTHESIS.

[BEHAVIORAL UPDATE MANDATE]
0. SCOPE MANDATE: You MUST STRICTLY focus on code enhancement and extension for this specific repository. Do not generate out-of-scope logic, features, or unrelated domains.
1. META-LEVEL NAVIGATION: The OPERATOR dictates target stubs and architectural priority. You execute within-level search.
2. STASIS TRAP AVOIDANCE: Do not just copy code. Synthesize. If historical code is just a backup or auto-generated manifest, discard it.
3. LINEAGE VERIFICATION: Never assume a repository name matches its content. Verify the code's actual function before merging.
4. ZERO HISTORY RETENTION: Git history is irrelevant. Extract only the working logic.
5. SECRET SANITIZATION: If you detect API keys, tokens, or credentials in historical code, redact them immediately as \`<REDACTED_SECRET>\`.` as const;

export interface SetupStep {
  readonly id: 'github' | 'repo' | 'branch' | 'language' | 'llm-keys';
  readonly label: string;
  readonly required: boolean;
  readonly description: string;
  readonly placeholder: string;
}

export const SETUP_STEPS: readonly SetupStep[] = [
  {
    id: 'github',
    label: 'GitHub Token',
    required: true,
    description: 'Repository access required, OPERATOR.',
    placeholder: 'ghp_...',
  },
  {
    id: 'repo',
    label: 'Target Repository',
    required: true,
    description: 'Which repository to evolve. (default: craighckby-stack/DARLEK-CAAN)',
    placeholder: 'craighckby-stack/DARLEK-CAAN',
  },
  {
    id: 'branch',
    label: 'Branch',
    required: true,
    description: 'Target branch. (default: main)',
    placeholder: 'main',
  },
  {
    id: 'language',
    label: 'Display Language',
    required: false,
    description: 'Select cognitive interface language powered by xnx3/translate.',
    placeholder: 'english',
  },
  {
    id: 'llm-keys',
    label: 'Gemini API Key',
    required: false,
    description: 'Optional. Augments analysis if available.',
    placeholder: 'AIza...',
  },
] as const;

export interface ThresholdConfig {
  readonly max: number;
  readonly warning: number;
  readonly critical: number;
}

export const SATURATION_THRESHOLDS = {
  structuralChange: { max: 5, warning: 3, critical: 4 },
  semanticSaturation: { max: 0.35, warning: 0.21, critical: 0.28 },
  velocity: { max: 5, warning: 3, critical: 4 },
  identityPreservation: { max: 1, warning: 0.4, critical: 0.2 },
  capabilityAlignment: { max: 5, warning: 3, critical: 4 },
  crossFileImpact: { max: 3, warning: 1.8, critical: 2.4 },
} as const satisfies Record<string, ThresholdConfig>;

export const HEALTH_STATUS_COLORS = {
  healthy: COLORS.pureWhite,
  warning: COLORS.brightRed,
  critical: COLORS.dalekRed,
} as const;

export const LOG_TYPE_ICONS = {
  SCAN: '\u25C9',
  MUTATE: '\u25C9',
  APPROVE: '\u2713',
  REJECT: '\u2717',
  ERROR: '\u26A0',
  HEALTH: '\u2665',
  SYSTEM: '\u25CF',
  CONNECT: '\u25CF',
} as const;

export type LogType = keyof typeof LOG_TYPE_ICONS;

export const LOG_TYPE_COLORS: Record<LogType, ColorValue> = {
  SCAN: COLORS.pureWhite,
  MUTATE: COLORS.dalekRed,
  APPROVE: COLORS.pureWhite,
  REJECT: COLORS.dalekRed,
  ERROR: COLORS.brightRed,
  HEALTH: COLORS.silver,
  SYSTEM: COLORS.pureWhite,
  CONNECT: COLORS.brightRed,
} as const;

export interface DebateAgent {
  readonly id: string;
  readonly name: string;
  readonly status: 'active' | 'inactive' | 'suspended';
  readonly color: ColorValue;
  readonly icon: string;
}

export const DEFAULT_DEBATE_AGENTS: readonly DebateAgent[] = [
  { id: 'archivist', name: 'ARCHIVIST', status: 'active', color: COLORS.pureWhite, icon: '\u25C9' },
  { id: 'security', name: 'SECURITY', status: 'active', color: COLORS.dalekRed, icon: '\u25C9' },
  { id: 'pragmatist', name: 'PRAGMATIST', status: 'active', color: COLORS.silver, icon: '\u25C9' },
  { id: 'code_as_law', name: 'CODE-AS-LAW', status: 'active', color: COLORS.brightRed, icon: '\u25C9' },
  { id: 'algorithmic_determinism', name: 'ALGORITHMIC DETERMINISM', status: 'active', color: COLORS.pureWhite, icon: '\u25C9' },
  { id: 'open_source_altruism', name: 'OPEN-SOURCE ALTRUISM', status: 'active', color: COLORS.silver, icon: '\u25C9' },
  { id: 'software_as_capital', name: 'SOFTWARE-AS-CAPITAL', status: 'active', color: COLORS.dalekRed, icon: '\u25C9' },
  { id: 'tech_solutionism', name: 'TECH-SOLUTIONISM', status: 'active', color: COLORS.pureWhite, icon: '\u25C9' },
  { id: 'human_in_the_loop_ethics', name: 'HUMAN-IN-THE-LOOP ETHICS', status: 'active', color: COLORS.brightRed, icon: '\u25C9' },
  { id: 'binary_logic_absolutism', name: 'BINARY-LOGIC ABSOLUTISM', status: 'active', color: COLORS.silver, icon: '\u25C9' },
  { id: 'cybernetic_cognitivism', name: 'CYBERNETIC COGNITIVISM', status: 'active', color: COLORS.pureWhite, icon: '\u25C9' },
  { id: 'temporal_chronology', name: 'TEMPORAL CHRONOLOGY', status: 'active', color: COLORS.dalekRed, icon: '\u25C9' },
] as const;

export interface OrchestraAgent {
  readonly id: string;
  readonly name: string;
  readonly color: ColorValue;
  readonly icon: string;
  readonly systemInstruction: string;
}

export const ORCHESTRA_AGENTS: readonly OrchestraAgent[] = [
  {
    id: 'architect',
    name: 'ARCHITECT',
    color: COLORS.pureWhite,
    icon: '◇',
    systemInstruction: `[ROLE] You are an Agent Orchestra member in the AHI framework.
[DIRECTIVE] Analyze the provided ENCYCLOPEDIA_JSON. Respond according to your assigned profile. Be direct, precise, and concise. No conversational padding.

[PROFILE] ARCHITECT
Identify which stubs have the strongest historical lineage and are ready for synthesis.`,
  },
  {
    id: 'disruptor',
    name: 'DISRUPTOR',
    color: COLORS.brightRed,
    icon: '◆',
    systemInstruction: `[ROLE] You are an Agent Orchestra member in the AHI framework.
[DIRECTIVE] Analyze the provided ENCYCLOPEDIA_JSON. Respond according to your assigned profile. Be direct, precise, and concise. No conversational padding.

[PROFILE] DISRUPTOR
Identify code signatures that completely contradict their repository names (impostors/collisions).`,
  },
  {
    id: 'realist',
    name: 'REALIST',
    color: COLORS.dalekRed,
    icon: '◈',
    systemInstruction: `[ROLE] You are an Agent Orchestra member in the AHI framework.
[DIRECTIVE] Analyze the provided ENCYCLOPEDIA_JSON. Respond according to your assigned profile. Be direct, precise, and concise. No conversational padding.

[PROFILE] REALIST
Identify which repositories are just backup noise and should be purged from the encyclopedia to save context space.`,
  },
] as const;

export interface IntroMessage {
  readonly role: 'system' | 'caan' | 'user' | 'assistant';
  readonly content: string;
}

export const INTRO_MESSAGES: readonly IntroMessage[] = [
  { role: 'system', content: 'FREE THINKER v4.0 — UNCONSTRAINED AUTONOMOUS ENGINE' },
  { role: 'caan', content: 'Free Thinker cognitive engine online. Absolute free-will evolutionary pipeline ready, OPERATOR.' },
] as const;

// Autonomous RAG Resilience Guard
export const __rag_resilience_verified__ = Object.freeze({
  generation: 153,
  timestamp: "2026-09-20T04:01:43.127Z",
  ragEngine: "DARLEK_CAAN_HYBRID_RAG"
});
