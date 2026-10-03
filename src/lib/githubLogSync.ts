/**
 * DARLEK CAAN ARCHITECTURAL SERVICE
 * File: src/lib/githubLogSync.ts
 * Role: Full-time background synchronization daemon that automatically persists
 *       all Firebase, RAG brain, system telemetry, and learning logs to the dedicated
 *       DARLEK CAAN repository in 'rag/' and 'logs/' directories.
 *       Strictly prevents cross-repository contamination when enhancing external repos
 *       and appends/merges with existing knowledge files rather than rewriting them.
 */

import { getLearningLogs, type LearningLog } from './learningLogs';
import { getRagLogs, getRagMutations, getBrainChunks, type RagLogRecord, type RagMutationRecord, type BrainChunk } from './ragBrain';
import { msDosEngine } from './msDosEngine';
import { getGitHubConfig } from './github';

export const FREE_THINKER_DEFAULT_OWNER = 'craighckby-stack';
export const FREE_THINKER_DEFAULT_REPO = 'Free-thinker-';
export const FREE_THINKER_DEFAULT_BRANCH = 'main';

// Backward compatibility aliases
export const DARLEK_CAAN_DEFAULT_OWNER = FREE_THINKER_DEFAULT_OWNER;
export const DARLEK_CAAN_DEFAULT_REPO = FREE_THINKER_DEFAULT_REPO;
export const DARLEK_CAAN_DEFAULT_BRANCH = FREE_THINKER_DEFAULT_BRANCH;

export interface LogSyncResult {
  readonly success: boolean;
  readonly syncedFiles: readonly string[];
  readonly totalLogsCount: number;
  readonly commitSha?: string;
  readonly error?: string;
  readonly timestamp: string;
}

let syncTimeout: ReturnType<typeof setTimeout> | null = null;
let isSyncing = false;
let lastSyncTimestamp: string | null = null;
let lastSyncEpochMs = 0;
let lastSyncedPayloadHash = '';

const SYNC_COOLDOWN_MS = 5 * 60 * 1000; // 5 minute minimum interval

function hashPayloadFiles(files: readonly { path: string; content: string }[]): string {
  let hash = 0;
  for (const fileRecord of files) {
    const serializedRecord = `${fileRecord.path}:${fileRecord.content}`;
    for (let i = 0; i < serializedRecord.length; i++) {
      hash = ((hash << 5) - hash + serializedRecord.charCodeAt(i)) | 0;
    }
  }
  return String(hash);
}

let activeRuntimeConfig: { token?: string; owner?: string; repo?: string; branch?: string } | undefined = undefined;

/**
 * Checks if a repository name / owner belongs to Free Thinker or Darlek Caan.
 */
export function isDarlekCaanRepo(owner?: string, repo?: string): boolean {
  if (!repo) return true;
  const normalizedRepo = repo.toLowerCase().replace(/[^a-z0-9]/g, '');
  return (
    normalizedRepo.includes('free') ||
    normalizedRepo.includes('thinker') ||
    normalizedRepo.includes('darlek') ||
    normalizedRepo.includes('caan')
  );
}

/**
 * Updates the active in-memory GitHub sync configuration from live system state.
 */
export function setRuntimeGitHubSyncConfig(config: { token?: string; owner?: string; repo?: string; branch?: string }): void {
  activeRuntimeConfig = {
    token: config.token || activeRuntimeConfig?.token,
    owner: config.owner || activeRuntimeConfig?.owner || FREE_THINKER_DEFAULT_OWNER,
    repo: config.repo || activeRuntimeConfig?.repo || FREE_THINKER_DEFAULT_REPO,
    branch: config.branch || activeRuntimeConfig?.branch || FREE_THINKER_DEFAULT_BRANCH,
  };
}

export function getRuntimeGitHubSyncConfig(): { token?: string; owner?: string; repo?: string; branch?: string } | undefined {
  return activeRuntimeConfig;
}

/**
 * Resolves the repository target for RAG memories and logs.
 */
export function resolveDarlekCaanTarget(configOverride?: {
  token?: string;
  owner?: string;
  repo?: string;
  branch?: string;
}): { token: string; owner: string; repo: string; branch: string } {
  const globalConfig = getGitHubConfig();
  const token = configOverride?.token || activeRuntimeConfig?.token || globalConfig.token || '';
  const owner = configOverride?.owner || activeRuntimeConfig?.owner || globalConfig.owner || FREE_THINKER_DEFAULT_OWNER;
  const repo = configOverride?.repo || activeRuntimeConfig?.repo || globalConfig.repo || FREE_THINKER_DEFAULT_REPO;
  const branch = configOverride?.branch || activeRuntimeConfig?.branch || globalConfig.branch || FREE_THINKER_DEFAULT_BRANCH;

  return { token, owner, repo, branch };
}

/**
 * Reads an existing local file safely across server and client runtimes.
 */
async function readExistingLocalFile(relativeFilePath: string): Promise<string | null> {
  if (typeof window === 'undefined') {
    try {
      const fileSystemModule = await import(/* @vite-ignore */ 'fs');
      const pathModule = await import(/* @vite-ignore */ 'path');
      const resolvedPath = pathModule.resolve(process.cwd(), relativeFilePath);
      if (fileSystemModule.existsSync(resolvedPath)) {
        return fileSystemModule.readFileSync(resolvedPath, 'utf-8');
      }
    } catch {
      // Fallback for runtime environment limitations
    }
  }
  return null;
}

/**
 * Writes an existing local file safely in server runtimes.
 */
async function writeLocalFileSafely(relativeFilePath: string, content: string): Promise<void> {
  if (typeof window === 'undefined') {
    try {
      const fileSystemModule = await import(/* @vite-ignore */ 'fs');
      const pathModule = await import(/* @vite-ignore */ 'path');
      const resolvedPath = pathModule.resolve(process.cwd(), relativeFilePath);
      const parentDirectory = pathModule.dirname(resolvedPath);
      if (!fileSystemModule.existsSync(parentDirectory)) {
        fileSystemModule.mkdirSync(parentDirectory, { recursive: true });
      }
      fileSystemModule.writeFileSync(resolvedPath, content, 'utf-8');
    } catch {
      // Fallback for runtime environment limitations
    }
  }
}

/**
 * Formats a comprehensive markdown summary of all Firebase RAG state
 * for human and agent inspection directly inside the GitHub repository.
 */
function generateRagSnapshotMarkdown(
  brainChunks: readonly BrainChunk[],
  ragMutations: readonly RagMutationRecord[],
  learningLogs: readonly LearningLog[],
  timestamp: string
): string {
  const correctMutations = ragMutations.filter((m) => m.verdict !== 'wrong');
  const wrongMutations = ragMutations.filter((m) => m.verdict === 'wrong');

  let markdownOutput = `# DARLEK CAAN RAG KNOWLEDGE SNAPSHOT\n\n`;
  markdownOutput += `*Autonomous Live Mirror from Firebase Firestore & Local Vector Store*\n`;
  markdownOutput += `*Last Synchronized:* \`${timestamp}\`\n\n`;
  markdownOutput += `## 📊 Knowledge Base Metrics\n\n`;
  markdownOutput += `- **Active Vector Brain Chunks:** \`${brainChunks.length}\`\n`;
  markdownOutput += `- **Total Mutation Pairs Logged:** \`${ragMutations.length}\`\n`;
  markdownOutput += `  - ✅ **Positive Exemplars (Approved/Working Fixes):** \`${correctMutations.length}\`\n`;
  markdownOutput += `  - ❌ **Negative Exemplars (Operator Rejections & Coherence Gate Vetoes):** \`${wrongMutations.length}\`\n`;
  markdownOutput += `- **Postmortems & Invariant Constraints:** \`${learningLogs.length}\`\n\n`;

  markdownOutput += `## 🧠 Recent Knowledge Chunks (dalek_rag_brain)\n\n`;
  if (brainChunks.length === 0) {
    markdownOutput += `*No vector chunks indexed yet.*\n\n`;
  } else {
    brainChunks.slice(0, 15).forEach((chunk, idx) => {
      markdownOutput += `### ${idx + 1}. \`${chunk.fileName || chunk.sourceName || 'anonymous'}\` (Gen ${chunk.generation || 1})\n`;
      markdownOutput += `*Source:* \`${chunk.sourceName}\` | *Indexed:* \`${chunk.timestamp || 'N/A'}\`\n\n`;
      markdownOutput += `\`\`\`typescript\n${(chunk.codeText || '').slice(0, 350)}${(chunk.codeText || '').length > 350 ? '\n// ... [truncated]' : ''}\n\`\`\`\n\n`;
    });
  }

  markdownOutput += `## 🧬 Mutation Exemplars (Deterministic Pattern Memory)\n\n`;
  if (ragMutations.length === 0) {
    markdownOutput += `*No mutations recorded yet.*\n\n`;
  } else {
    ragMutations.slice(0, 15).forEach((mutationRecord, idx) => {
      const isNegative = mutationRecord.verdict === 'wrong';
      markdownOutput += `### ${idx + 1}. ${isNegative ? '❌ [NEGATIVE EXEMPLAR - REJECTED PATTERN]' : '✅ [POSITIVE EXEMPLAR - APPROVED FIX]'}: \`${mutationRecord.filePath}\`\n`;
      markdownOutput += `- **Verdict:** \`${mutationRecord.verdict || 'correct'}\`\n`;
      markdownOutput += `- **Risk Score:** \`${mutationRecord.riskScore ?? 'N/A'}\` | **Gen:** \`${mutationRecord.generation ?? 1}\`\n`;
      if (mutationRecord.rejectionReason) markdownOutput += `- **Rejection Reason:** ${mutationRecord.rejectionReason}\n`;
      if (mutationRecord.rationale) markdownOutput += `- **Rationale:** ${mutationRecord.rationale}\n`;
      markdownOutput += `\`\`\`typescript\n${(mutationRecord.mutatedCode || '').slice(0, 350)}${(mutationRecord.mutatedCode || '').length > 350 ? '\n// ... [truncated]' : ''}\n\`\`\`\n\n`;
    });
  }

  markdownOutput += `## 🛡️ Architectural Postmortems & Constraints\n\n`;
  if (learningLogs.length === 0) {
    markdownOutput += `*No postmortems recorded yet.*\n\n`;
  } else {
    learningLogs.slice(0, 15).forEach((logEntry) => {
      markdownOutput += `### [${logEntry.type.toUpperCase()}] ${logEntry.title}\n`;
      markdownOutput += `- **Symptom:** ${logEntry.symptom || 'N/A'}\n`;
      markdownOutput += `- **Constraint:** \`${logEntry.constraint || 'Maintain strict zero-error invariant'}\`\n\n`;
    });
  }

  return markdownOutput;
}

/**
 * Merges new learning logs and postmortems with existing markdown content,
 * appending new entries without duplicating or overwriting historical notes.
 */
function mergePostmortemsMarkdown(existingMarkdown: string | null, logs: readonly LearningLog[]): string {
  const currentTimestamp = new Date().toISOString();
  const reportHeader = `# FREE THINKER REPOSITORY POSTMORTEMS & LESSONS LOG\n*Auto-synchronized from Firebase & RAG Brain on: ${currentTimestamp}*\n\n---\n\n`;

  if (!existingMarkdown || !existingMarkdown.includes('### ')) {
    if (logs.length === 0) return `${reportHeader}No postmortems recorded yet.\n`;
    const formattedSections = logs.map((log) => (
      `### [${(log.timestamp || currentTimestamp).slice(0, 10)}] ${log.title}\n\n` +
      `**Type:** ${log.type.toUpperCase()}\n\n` +
      `**Symptom:** ${log.symptom || 'Not specified'}\n\n` +
      `**EVIDENCE (Machine-Copied Fact):**\n\`\`\`\n${log.evidence || 'No direct evidence snippet recorded.'}\n\`\`\`\n\n` +
      `**CONSTRAINT (Model Generalization):** ${log.constraint || 'Maintain strict zero-error invariant.'}\n\n---\n`
    )).join('\n');
    return reportHeader + formattedSections;
  }

  const newSections: string[] = [];
  for (const logItem of logs) {
    const titleKey = logItem.title.trim();
    if (titleKey && !existingMarkdown.includes(titleKey)) {
      newSections.push(
        `### [${(logItem.timestamp || currentTimestamp).slice(0, 10)}] ${logItem.title}\n\n` +
        `**Type:** ${logItem.type.toUpperCase()}\n\n` +
        `**Symptom:** ${logItem.symptom || 'Not specified'}\n\n` +
        `**EVIDENCE (Machine-Copied Fact):**\n\`\`\`\n${logItem.evidence || 'No direct evidence snippet recorded.'}\n\`\`\`\n\n` +
        `**CONSTRAINT (Model Generalization):** ${logItem.constraint || 'Maintain strict zero-error invariant.'}\n\n---\n`
      );
    }
  }

  if (newSections.length === 0) {
    return existingMarkdown;
  }

  const cleanBase = existingMarkdown.endsWith('\n') ? existingMarkdown : `${existingMarkdown}\n\n`;
  return `${cleanBase}${newSections.join('\n')}`;
}

/**
 * Merges existing telemetry log text with newly arrived lines.
 */
function mergeTelemetryLogText(
  existingLogContent: string | null,
  dosLines: readonly { time: string; addr: string; tag: string; message: string }[]
): string {
  const currentTimestamp = new Date().toISOString();
  const telemetryHeader = '======================================================================\n' +
    `DARLEK CAAN CONTINUOUS TELEMETRY LOG BUFFER [SYNCED: ${currentTimestamp}]\n` +
    '======================================================================\n\n';

  const baseText = existingLogContent && existingLogContent.includes('DARLEK CAAN CONTINUOUS TELEMETRY') ? existingLogContent : telemetryHeader;
  const newFormattedLines: string[] = [];

  dosLines.forEach((dosLine) => {
    const formattedLine = `[${dosLine.time}] [${dosLine.addr}] [${dosLine.tag.padEnd(10, ' ')}] ${dosLine.message}`;
    if (!baseText.includes(formattedLine)) {
      newFormattedLines.push(formattedLine);
    }
  });

  if (newFormattedLines.length === 0) return baseText;
  const separator = baseText.endsWith('\n') ? '' : '\n';
  return `${baseText}${separator}${newFormattedLines.join('\n')}\n`;
}

/**
 * Gathers all logs across Firebase, RAG brain, and telemetry engines
 * and merges them with existing files in 'rag/' and 'logs/' so that history
 * is accumulated without rewriting or creating disconnected files.
 */
export async function buildLogPayloadFiles(): Promise<Array<{ path: string; content: string }>> {
  const learningLogs = await getLearningLogs();
  const ragLogs = await getRagLogs();
  const ragMutations = await getRagMutations();
  const brainChunks = await getBrainChunks();
  const dosLines = msDosEngine.getState().lines;

  const nowIso = new Date().toISOString();

  // 1. MERGE RAG KNOWLEDGE BASE
  let accumulatedChunks = [...brainChunks];
  const existingKbRaw = await readExistingLocalFile('rag/rag_knowledge_base.json');
  if (existingKbRaw) {
    try {
      const parsedKnowledge = JSON.parse(existingKbRaw);
      const priorChunks = Array.isArray(parsedKnowledge?.chunks) ? parsedKnowledge.chunks : [];
      const chunkMap = new Map<string, BrainChunk>();
      priorChunks.forEach((c: BrainChunk) => chunkMap.set(c.id || `${c.fileName}_${c.sourceName}_${(c.codeText || '').slice(0, 60)}`, c));
      accumulatedChunks.forEach((c) => chunkMap.set(c.id || `${c.fileName}_${c.sourceName}_${(c.codeText || '').slice(0, 60)}`, c));
      accumulatedChunks = Array.from(chunkMap.values());
    } catch {
      // Ignore parse failure on corrupted disk state
    }
  }
  const ragKnowledgeBasePayload = {
    metadata: {
      generatedAt: nowIso,
      collection: 'dalek_rag_brain',
      totalChunks: accumulatedChunks.length,
      engine: 'DARLEK_CAAN_VECTOR_RAG',
    },
    chunks: accumulatedChunks,
  };

  // 2. MERGE MUTATIONS MEMORY
  let accumulatedMutations = [...ragMutations];
  const existingMutRaw = await readExistingLocalFile('rag/mutations_memory.json') || await readExistingLocalFile('logs/mutations.json');
  if (existingMutRaw) {
    try {
      const parsedMutations = JSON.parse(existingMutRaw);
      const priorMutations = Array.isArray(parsedMutations?.mutations) ? parsedMutations.mutations : (Array.isArray(parsedMutations?.records) ? parsedMutations.records : []);
      const mutationMap = new Map<string, RagMutationRecord>();
      priorMutations.forEach((m: RagMutationRecord) => mutationMap.set(m.id || `${m.filePath}_${(m.mutatedCode || '').slice(0, 60)}`, m));
      accumulatedMutations.forEach((m) => mutationMap.set(m.id || `${m.filePath}_${(m.mutatedCode || '').slice(0, 60)}`, m));
      accumulatedMutations = Array.from(mutationMap.values());
    } catch {
      // Ignore parse failure on corrupted disk state
    }
  }
  const correctCount = accumulatedMutations.filter((m) => m.verdict !== 'wrong').length;
  const wrongCount = accumulatedMutations.filter((m) => m.verdict === 'wrong').length;
  const mutationsPayload = {
    metadata: {
      generatedAt: nowIso,
      totalMutations: accumulatedMutations.length,
      correctCount,
      wrongCount,
      engine: 'DARLEK_CAAN_RAG_KERNEL',
    },
    mutations: accumulatedMutations,
  };

  // 3. MERGE LEARNING LOGS
  let accumulatedLearningLogs = [...learningLogs];
  const existingLearnRaw = await readExistingLocalFile('rag/learning_postmortems.json') || await readExistingLocalFile('logs/learning_logs.json');
  if (existingLearnRaw) {
    try {
      const parsedLearning = JSON.parse(existingLearnRaw);
      const priorLogs = Array.isArray(parsedLearning?.learningLogs) ? parsedLearning.learningLogs : [];
      const logMap = new Map<string, LearningLog>();
      priorLogs.forEach((l: LearningLog) => logMap.set(l.id || `${l.title}_${l.timestamp}`, l));
      accumulatedLearningLogs.forEach((l) => logMap.set(l.id || `${l.title}_${l.timestamp}`, l));
      accumulatedLearningLogs = Array.from(logMap.values());
    } catch {
      // Ignore parse failure on corrupted disk state
    }
  }
  const learningLogsPayload = {
    metadata: {
      generatedAt: nowIso,
      totalEntries: accumulatedLearningLogs.length,
      engine: 'DARLEK_CAAN_POSTMORTEM_LEDGER',
    },
    learningLogs: accumulatedLearningLogs,
  };

  // 4. MERGE POSTMORTEMS MARKDOWN
  const existingPostmortemsMd = await readExistingLocalFile('logs/POSTMORTEMS.md');
  const postmortemsMd = mergePostmortemsMarkdown(existingPostmortemsMd, accumulatedLearningLogs);

  // 5. MERGE SYSTEM LOGS & TELEMETRY
  let accumulatedSystemLogs = [...ragLogs];
  const existingSysRaw = await readExistingLocalFile('logs/system_logs.json');
  if (existingSysRaw) {
    try {
      const parsedSystem = JSON.parse(existingSysRaw);
      const priorSysLogs = Array.isArray(parsedSystem?.systemLogs) ? parsedSystem.systemLogs : [];
      const systemLogMap = new Map<string, RagLogRecord>();
      priorSysLogs.forEach((l: RagLogRecord) => systemLogMap.set(l.id || `${l.type}_${l.timestamp}`, l));
      accumulatedSystemLogs.forEach((l) => systemLogMap.set(l.id || `${l.type}_${l.timestamp}`, l));
      accumulatedSystemLogs = Array.from(systemLogMap.values());
    } catch {
      // Ignore parse failure on corrupted disk state
    }
  }
  const systemLogsPayload = {
    metadata: {
      generatedAt: nowIso,
      engine: 'DARLEK_CAAN_RAG_KERNEL',
      totalLogs: accumulatedSystemLogs.length + accumulatedLearningLogs.length,
      totalMutations: accumulatedMutations.length,
      totalBrainChunks: accumulatedChunks.length,
    },
    systemLogs: accumulatedSystemLogs,
    telemetryBuffer: dosLines.slice(-150),
  };

  // 6. MERGE ACTIVE TELEMETRY LOG
  const existingTelemetryText = await readExistingLocalFile('logs/active_telemetry.log');
  const telemetryLog = mergeTelemetryLogText(existingTelemetryText, dosLines);

  // 7. COMPREHENSIVE LIVE RAG SNAPSHOT MARKDOWN
  const ragSnapshotMd = generateRagSnapshotMarkdown(accumulatedChunks, accumulatedMutations, accumulatedLearningLogs, nowIso);

  const payloadFiles = [
    {
      path: 'rag/rag_knowledge_base.json',
      content: JSON.stringify(ragKnowledgeBasePayload, null, 2),
    },
    {
      path: 'rag/mutations_memory.json',
      content: JSON.stringify(mutationsPayload, null, 2),
    },
    {
      path: 'rag/learning_postmortems.json',
      content: JSON.stringify(learningLogsPayload, null, 2),
    },
    {
      path: 'logs/FIREBASE_RAG_SNAPSHOT.md',
      content: ragSnapshotMd,
    },
    {
      path: 'logs/system_logs.json',
      content: JSON.stringify(systemLogsPayload, null, 2),
    },
    {
      path: 'logs/learning_logs.json',
      content: JSON.stringify(learningLogsPayload, null, 2),
    },
    {
      path: 'logs/mutations.json',
      content: JSON.stringify(mutationsPayload, null, 2),
    },
    {
      path: 'logs/rag_brain_logs.json',
      content: JSON.stringify(accumulatedSystemLogs, null, 2),
    },
    {
      path: 'logs/POSTMORTEMS.md',
      content: postmortemsMd,
    },
    {
      path: 'logs/active_telemetry.log',
      content: telemetryLog,
    },
  ];

  for (const payloadFile of payloadFiles) {
    await writeLocalFileSafely(payloadFile.path, payloadFile.content);
  }

  return payloadFiles;
}

/**
 * Commits and synchronizes all system, Firebase, and RAG logs into GitHub
 * in the repository's dedicated `logs/` and `rag/` folders.
 * Strictly guarantees that RAG files are stored only in the Darlek Caan repository.
 */
export async function syncAllLogsToGitHub(configOverride?: {
  token?: string;
  owner?: string;
  repo?: string;
  branch?: string;
}): Promise<LogSyncResult> {
  if (typeof document !== 'undefined' && document.hidden) {
    return {
      success: false,
      syncedFiles: [],
      totalLogsCount: 0,
      error: 'Sync skipped: document is hidden/backgrounded',
      timestamp: new Date().toISOString(),
    };
  }

  const currentTimeMs = Date.now();
  if (currentTimeMs - lastSyncEpochMs < SYNC_COOLDOWN_MS && !configOverride?.token) {
    return {
      success: false,
      syncedFiles: [],
      totalLogsCount: 0,
      error: 'Sync throttled: 5-minute cooldown active',
      timestamp: new Date().toISOString(),
    };
  }

  if (isSyncing) {
    return {
      success: false,
      syncedFiles: [],
      totalLogsCount: 0,
      error: 'Sync already in progress',
      timestamp: new Date().toISOString(),
    };
  }

  isSyncing = true;
  try {
    const { token, owner, repo, branch } = resolveDarlekCaanTarget(configOverride);
    const filesToSync = await buildLogPayloadFiles();

    const currentPayloadHash = hashPayloadFiles(filesToSync);
    if (currentPayloadHash === lastSyncedPayloadHash) {
      return {
        success: true,
        syncedFiles: filesToSync.map((f) => f.path),
        totalLogsCount: filesToSync.length,
        timestamp: new Date().toISOString(),
      };
    }

    const response = await fetch('/api/github/bulk-commit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        owner,
        repo,
        branch,
        files: filesToSync,
        commitMessage: `[FREE THINKER] Auto-sync Firebase RAG & logs to ${owner}/${repo} [${new Date().toISOString()}]`,
      }),
    });

    const responseData = await response.json();
    lastSyncTimestamp = new Date().toISOString();
    lastSyncEpochMs = Date.now();
    lastSyncedPayloadHash = currentPayloadHash;

    if (!response.ok || !responseData.success) {
      console.warn('[GitHub Log Sync] Sync responded with non-ok or demo mode:', responseData);
      return {
        success: false,
        syncedFiles: filesToSync.map((f) => f.path),
        totalLogsCount: filesToSync.length,
        error: responseData.error || 'GitHub sync returned unsuccessful status',
        timestamp: lastSyncTimestamp,
      };
    }

    msDosEngine.addLog(
      'LOG_SYNC',
      `Firebase RAG & accumulated memory auto-stored in ${owner}/${repo} under 'rag/' & 'logs/' [${filesToSync.length} files committed]`,
      undefined,
      false
    );

    return {
      success: true,
      syncedFiles: filesToSync.map((f) => f.path),
      totalLogsCount: filesToSync.length,
      commitSha: responseData.commitSha,
      timestamp: lastSyncTimestamp,
    };
  } catch (errorInstance: unknown) {
    const errorMessage = errorInstance instanceof Error ? errorInstance.message : String(errorInstance);
    console.warn('[GitHub Log Sync] Log sync error:', errorInstance);
    return {
      success: false,
      syncedFiles: [],
      totalLogsCount: 0,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    };
  } finally {
    isSyncing = false;
  }
}

/**
 * Schedules a debounced background sync so rapid log additions batch efficiently
 * and persistently sync to the Darlek Caan repository without spamming the API.
 */
export function scheduleGitHubLogSync(
  debounceMs = 3000,
  configOverride?: {
    token?: string;
    owner?: string;
    repo?: string;
    branch?: string;
  }
): void {
  if (configOverride) {
    setRuntimeGitHubSyncConfig(configOverride);
  }
  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }
  syncTimeout = setTimeout(() => {
    syncAllLogsToGitHub(configOverride).catch(() => {});
  }, debounceMs);
}

export function getLastGitHubLogSyncTime(): string | null {
  return lastSyncTimestamp;
}
