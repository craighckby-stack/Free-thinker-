/**
 * DARLEK CANN ARCHITECTURAL HEADER
 * File: src/app/api/chat/route.ts
 * Role: Core system component participating in autonomous cognitive evolution cycles.
 * Architecture: Type-safe modular unit with resilient state interfaces.
 */

import { NextRequest, NextResponse } from '@/lib/next-mock';
import { callLlm, getDefaultGeminiKey } from '@/lib/llm-provider';
import { dalekBrainChat } from '@/lib/dalek-brain';
import { DALEK_CAAN_SYSTEM_PROMPT } from '@/lib/constants';
import { safeReqJson, safeResponseJson } from '@/lib/safe-json';

export const dynamic = 'force-dynamic';

interface RepoTreeItem {
  readonly path?: string;
  readonly size?: number;
  readonly type?: string;
}

interface TreeApiResponse {
  readonly tree?: RepoTreeItem[];
}

interface RepoFile {
  readonly path: string;
  readonly size: number;
}

interface RepoConfig {
  readonly owner?: string;
  readonly repo?: string;
  readonly branch?: string;
}

interface SystemState {
  readonly setupComplete?: boolean;
  readonly evolutionCycle?: number;
  readonly repoConfig?: RepoConfig;
  readonly connectionStatus?: Record<string, string>;
  readonly apiKeys?: {
    readonly github?: string;
    readonly gemini?: string;
    readonly anthropic?: string;
    readonly openai?: string;
  };
  readonly saturation?: {
    readonly structuralChange?: number;
    readonly semanticSaturation?: number;
    readonly velocity?: number;
    readonly identityPreservation?: number;
    readonly capabilityAlignment?: number;
    readonly crossFileImpact?: number;
  };
}

interface ChatRequestBody {
  readonly message?: string;
  readonly history?: ReadonlyArray<{ readonly role: string; readonly content: string }>;
  readonly systemState?: SystemState;
  readonly scannedFiles?: ReadonlyArray<{ readonly path: string; readonly size?: number }>;
  readonly apiKeys?: {
    readonly gemini?: string;
    readonly github?: string;
  };
}

const EXCLUDED_PATTERNS = Object.freeze([
  'node_modules/', '.git/', 'dist/', 'build/', '.next/',
  '__pycache__/', '.DS_Store', '.env', '.env.local',
  'package-lock.json', 'yarn.lock', '.svn/',
]);

const CRITICAL_CANDIDATES = Object.freeze([
  'package.json',
  'prisma/schema.prisma',
  'src/db/schema.ts',
  'db/schema.ts',
  'src/app/page.tsx',
  'src/app/layout.tsx',
  'next.config.ts',
  'next.config.js',
  'next.config.mjs',
  'tailwind.config.ts',
  'tailwind.config.js',
  'postcss.config.js',
  'postcss.config.mjs',
  'README.md',
]);

const ANALYSIS_KEYWORDS = Object.freeze([
  'readme', 'read me', 'analyse system', 'analyze system',
  'analyse repository', 'analyze repository', 'system analysis',
  'repository analysis', 'architecture overview', 'describe the project',
]);

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ status: 'online', service: 'DALEK_CHAT_API' });
}

async function fetchGithubFile(token: string, owner: string, repo: string, branch: string, path: string): Promise<string> {
  try {
    const cleanPath = path.replace(/^\/+|\/+$/g, '');
    const encodedPath = cleanPath.split('/').map(encodeURIComponent).join('/');
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodedPath}?ref=${encodeURIComponent(branch)}`;
    
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3.raw',
      },
    });

    if (res.ok) {
      return await res.text();
    }
  } catch (error) {
    console.warn('[CHAT] Failed to fetch raw file for path:', path, error);
  }
  return '';
}

async function fetchGithubRepoTree(token: string, owner: string, repo: string, branch: string): Promise<RepoFile[]> {
  try {
    const url = `https://api.github.com/repos/${owner}/${repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`;
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (res.ok) {
      const data = (await safeResponseJson(res, {})) as TreeApiResponse;
      if (Array.isArray(data?.tree)) {
        return data.tree
          .filter((item): item is RepoTreeItem & { type: string; path: string } => item?.type === 'blob' && typeof item?.path === 'string')
          .map((item) => ({
            path: item.path,
            size: item.size ?? 0,
          }));
      }
    }
  } catch (error) {
    console.error('[CHAT] Failed to fetch github repo tree:', error);
  }
  return [];
}

function isAnalysisRequest(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  return ANALYSIS_KEYWORDS.some(keyword => lowerMessage.includes(keyword));
}

function filterRepositoryFiles(files: RepoFile[]): RepoFile[] {
  return files.filter(file => !EXCLUDED_PATTERNS.some(pattern => file.path.includes(pattern)));
}

async function gatherAnalysisContext(
  token: string,
  owner: string,
  repo: string,
  branch: string,
  scannedFiles?: ReadonlyArray<{ readonly path: string; readonly size?: number }>
): Promise<{ readonly systemContext: string; readonly fetchedTreeCount: number; readonly fetchedFilesCount: number }> {
  let filesList: RepoFile[] = [];

  if (scannedFiles && Array.isArray(scannedFiles) && scannedFiles.length > 0) {
    filesList = scannedFiles.map((f) => ({ path: f.path, size: f.size ?? 0 }));
  } else {
    filesList = await fetchGithubRepoTree(token, owner, repo, branch);
  }

  const fetchedTreeCount = filesList.length;
  const filteredFiles = filterRepositoryFiles(filesList);

  const representativeFiles = filteredFiles
    .filter(file => {
      const pathLower = file.path.toLowerCase();
      const isCode = /\.(tsx?|jsx?|prisma|py|md)$/.test(pathLower);
      const isCritical = (CRITICAL_CANDIDATES as readonly string[]).includes(file.path);
      return isCode && !isCritical;
    })
    .slice(0, 10)
    .map(file => file.path);

  const filesToRead = [
    ...(CRITICAL_CANDIDATES as readonly string[]).filter(path => filteredFiles.some(file => file.path === path)),
    ...representativeFiles,
  ].slice(0, 15);

  const fileContents: Record<string, string> = {};
  await Promise.all(
    filesToRead.map(async (path) => {
      const content = await fetchGithubFile(token, owner, repo, branch, path);
      if (content) {
        fileContents[path] = content;
      }
    })
  );

  const fetchedFilesCount = Object.keys(fileContents).length;
  const fileTreeString = filteredFiles
    .map(file => `- ${file.path} (${(file.size / 1024).toFixed(1)} KB)`)
    .join('\n');

  const contentsSection = Object.entries(fileContents)
    .map(([path, content]) => `\n--- FILE: ${path} ---\n${content.slice(0, 4500)}\n`)
    .join('');

  const systemContext = `
===================================================
[DENSITY INJECTOR] ACTUAL REPOSITORY CODE AND WORKSPACE DESIGN
===================================================
You are analyzing the COMPLETE system. Ensure your thoughts, analysis, and requested README are hyper-tailored to the actual codebase.

Branch: "${branch}"
Repository Path: "${owner}/${repo}"

Workspace File Layout (${filteredFiles.length} files):
${fileTreeString}

Real Repository Core File Contents:
${contentsSection}
===================================================
`;

  return { systemContext, fetchedTreeCount, fetchedFilesCount };
}

async function gatherReadmeContext(
  token: string,
  owner: string,
  repo: string,
  branch: string
): Promise<{ readonly systemContext: string; readonly fetchedFilesCount: number }> {
  const readmeContent = await fetchGithubFile(token, owner, repo, branch, 'README.md');
  if (!readmeContent) {
    return { systemContext: '', fetchedFilesCount: 0 };
  }

  const systemContext = `
===================================================
[INSTRUCTION SAFETY] ACTIVE TARGET REPOSITORY README.md
===================================================
The target repository being analyzed has a root README.md containing core instructions, tech stack design, and specifications.
You MUST read, comprehend, and strictly align your decisions, design logic, and refactor proposals with these instructions of the repository:

${readmeContent.slice(0, 8000)}
===================================================
`;

  return { systemContext, fetchedFilesCount: 1 };
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await safeReqJson<ChatRequestBody>(req, {});
    const { message, history, systemState, scannedFiles } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ content: '', success: false, error: 'Message is required' }, { status: 400 });
    }

    const processedMessage = message.trim();

    const state = systemState || {
      setupComplete: false,
      evolutionCycle: 0,
      repoConfig: { owner: 'unknown', repo: 'unknown', branch: 'unknown' },
      connectionStatus: { github: 'idle' },
      apiKeys: { github: '' },
      saturation: { structuralChange: 0, semanticSaturation: 0, velocity: 0, identityPreservation: 1, capabilityAlignment: 0, crossFileImpact: 0 },
    };

    const token = state.apiKeys?.github;
    const owner = state.repoConfig?.owner;
    const repo = state.repoConfig?.repo;
    const branch = state.repoConfig?.branch;

    let systemContext = '';
    let fetchedTreeCount = 0;
    let fetchedFilesCount = 0;

    if (token && owner && repo && branch) {
      if (isAnalysisRequest(message)) {
        const analysisResult = await gatherAnalysisContext(token, owner, repo, branch, scannedFiles);
        systemContext = analysisResult.systemContext;
        fetchedTreeCount = analysisResult.fetchedTreeCount;
        fetchedFilesCount = analysisResult.fetchedFilesCount;
      } else {
        const readmeResult = await gatherReadmeContext(token, owner, repo, branch);
        systemContext = readmeResult.systemContext;
        fetchedFilesCount = readmeResult.fetchedFilesCount;
      }
    }

    const repoOwner = state.repoConfig?.owner ?? 'unknown';
    const repoName = state.repoConfig?.repo ?? 'unknown';
    const repoBranch = state.repoConfig?.branch ?? 'unknown';
    const contextInfo = `State: ${state.setupComplete ? 'OPERATIONAL' : 'SETUP'} | Cycle: ${state.evolutionCycle ?? 0} | Repo: ${repoOwner}/${repoName} | Branch: ${repoBranch}`.trim();

    const enhancedSystemPrompt = [
      DALEK_CAAN_SYSTEM_PROMPT,
      contextInfo,
      systemContext,
    ].filter(Boolean).join('\n\n');

    const userGeminiKey = body.apiKeys?.gemini;
    const geminiKey = userGeminiKey || getDefaultGeminiKey();

    const result = await callLlm({
      systemPrompt: enhancedSystemPrompt,
      userPrompt: processedMessage,
      geminiApiKey: geminiKey,
      maxTokens: 4096,
      temperature: 0.7,
    });

    const fallbackChat = dalekBrainChat(enhancedSystemPrompt, processedMessage, history ? [...history] : undefined);
    const content = result.text || fallbackChat || 'Processing error. Try again.';

    return NextResponse.json({
      content,
      success: true,
      provider: result.provider || 'Dalek Brain',
      analyzedFilesCount: fetchedFilesCount,
      totalFilesInRepo: fetchedTreeCount,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { content: '', success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

