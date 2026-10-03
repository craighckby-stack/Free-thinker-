/* DARLEK CAAN RAG SYNTHESIS - Autonomous Generation G-98 [2026-09-20T05:43:15.462Z] */
/**
 * DARLEK CANN ARCHITECTURAL HEADER
 * File: src/app/api/github/user-repos/route.ts
 * Role: Core system component participating in autonomous cognitive evolution cycles.
 * Architecture: Type-safe modular unit with resilient state interfaces and defensive fallbacks.
 */

import { NextRequest, NextResponse } from '@/lib/next-mock';
import { safeReqJson } from '@/lib/safe-json';

export const dynamic = 'force-dynamic';

export interface SanitizedRepository {
  id: number;
  name: string;
  fullName: string;
  owner: string;
  defaultBranch: string;
  url: string;
  description: string;
  language: string;
  isGlobalSiphon: boolean;
}

interface GitHubRepoRaw {
  id: number;
  name: string;
  full_name: string;
  owner?: { login: string };
  default_branch?: string;
  html_url: string;
  description?: string;
  language?: string;
}

interface GitHubSearchResponse {
  items?: GitHubRepoRaw[];
}

const GITHUB_API_BASE = 'https://api.github.com';

const DEFAULT_GLOBAL_SIPHON_REPOSITORIES: readonly SanitizedRepository[] = [
  {
    id: 10001,
    name: 'deepmind-research',
    fullName: 'google-deepmind/deepmind-research',
    owner: 'google-deepmind',
    defaultBranch: 'master',
    url: 'https://github.com/google-deepmind/deepmind-research',
    description: 'Autonomous research models, cognitive agents, and neural architectures.',
    language: 'Python',
    isGlobalSiphon: true,
  },
  {
    id: 10002,
    name: 'autogen',
    fullName: 'microsoft/autogen',
    owner: 'microsoft',
    defaultBranch: 'main',
    url: 'https://github.com/microsoft/autogen',
    description: 'A programming framework for agentic AI orchestration and multi-agent conversations.',
    language: 'Python',
    isGlobalSiphon: true,
  },
  {
    id: 10003,
    name: 'ai',
    fullName: 'vercel/ai',
    owner: 'vercel',
    defaultBranch: 'main',
    url: 'https://github.com/vercel/ai',
    description: 'Next-gen streaming AI framework with rich interactive agents and tooling.',
    language: 'TypeScript',
    isGlobalSiphon: true,
  },
  {
    id: 10004,
    name: 'genkit',
    fullName: 'firebase/genkit',
    owner: 'firebase',
    defaultBranch: 'main',
    url: 'https://github.com/firebase/genkit',
    description: 'Full-stack AI app orchestration framework with vector RAG synapses.',
    language: 'TypeScript',
    isGlobalSiphon: true,
  },
  {
    id: 10005,
    name: 'transformers',
    fullName: 'huggingface/transformers',
    owner: 'huggingface',
    defaultBranch: 'main',
    url: 'https://github.com/huggingface/transformers',
    description: 'State-of-the-art Machine Learning for Pytorch, TensorFlow, and JAX.',
    language: 'Python',
    isGlobalSiphon: true,
  },
  {
    id: 10006,
    name: 'DARLEK-CAAN-Cognitive-Engine',
    fullName: 'craighckby-stack/DARLEK-CAAN-Cognitive-Engine',
    owner: 'craighckby-stack',
    defaultBranch: 'main',
    url: 'https://github.com/craighckby-stack/DARLEK-CAAN-Cognitive-Engine',
    description: 'Darlek Caan Autonomous RAG Cognitive Evolution Engine.',
    language: 'TypeScript',
    isGlobalSiphon: true,
  },
  {
    id: 10007,
    name: 'Tt',
    fullName: 'craighckby-stack/Tt',
    owner: 'craighckby-stack',
    defaultBranch: 'main',
    url: 'https://github.com/craighckby-stack/Tt',
    description: 'RAG Cognitive Resolution Engine Repository.',
    language: 'TypeScript',
    isGlobalSiphon: true,
  },
  {
    id: 10008,
    name: 'Huxley-Singularity-Loop-Main',
    fullName: 'craighckby-stack/Huxley-Singularity-Loop-Main',
    owner: 'craighckby-stack',
    defaultBranch: 'main',
    url: 'https://github.com/craighckby-stack/Huxley-Singularity-Loop-Main',
    description: 'Singularity loop architecture and evolutionary mutations.',
    language: 'TypeScript',
    isGlobalSiphon: true,
  },
  {
    id: 10009,
    name: 'Archaeology-Engine',
    fullName: 'craighckby-stack/Archaeology-Engine',
    owner: 'craighckby-stack',
    defaultBranch: 'main',
    url: 'https://github.com/craighckby-stack/Archaeology-Engine',
    description: 'Archaeology Engine dataset (CORRECT.md & WRONG.md pairs for autonomous code optimization).',
    language: 'TypeScript',
    isGlobalSiphon: true,
  },
] as const;

function createGitHubHeaders(token: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'Dalek-Cognition-Architecture/1.0',
  };
  const trimmedToken = token.trim();
  if (trimmedToken.length > 0) {
    headers['Authorization'] = `Bearer ${trimmedToken}`;
  }
  return headers;
}

function sanitizeRepository(rawRepo: GitHubRepoRaw, isGlobalSiphon: boolean): SanitizedRepository {
  return {
    id: rawRepo.id,
    name: rawRepo.name ?? '',
    fullName: rawRepo.full_name ?? '',
    owner: rawRepo.owner?.login ?? '',
    defaultBranch: rawRepo.default_branch || 'main',
    url: rawRepo.html_url ?? '',
    description: rawRepo.description ?? '',
    language: rawRepo.language ?? '',
    isGlobalSiphon,
  };
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchUserRepositories(token: string): Promise<SanitizedRepository[]> {
  const trimmedToken = token.trim();
  if (!trimmedToken) {
    return [];
  }

  try {
    const response = await fetchWithTimeout(
      `${GITHUB_API_BASE}/user/repos?per_page=100&sort=updated&type=all`,
      {
        headers: createGitHubHeaders(trimmedToken),
        cache: 'no-store',
      },
      8000
    );

    if (!response.ok) {
      console.warn(`User repos fetch returned status ${response.status}`);
      return [];
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
      return [];
    }

    return data.map((repo: GitHubRepoRaw) => sanitizeRepository(repo, false));
  } catch (error) {
    console.warn('Network exception while fetching user repos from GitHub API:', error);
    return [];
  }
}

async function fetchGlobalSiphonRepositories(token: string): Promise<SanitizedRepository[]> {
  try {
    const query = encodeURIComponent('stars:>50000 language:typescript language:python');
    const response = await fetchWithTimeout(
      `${GITHUB_API_BASE}/search/repositories?q=${query}&sort=stars&order=desc&per_page=20`,
      {
        headers: createGitHubHeaders(token),
        cache: 'no-store',
      },
      6000
    );

    if (response.ok) {
      const data: GitHubSearchResponse = await response.json();
      if (Array.isArray(data.items) && data.items.length > 0) {
        return data.items.map((repo: GitHubRepoRaw) => sanitizeRepository(repo, true));
      }
    }
  } catch (error) {
    console.warn('Global siphon search fetch failed (using fallback presets):', error);
  }

  return [...DEFAULT_GLOBAL_SIPHON_REPOSITORIES];
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: 'online',
    service: 'GITHUB_USER_REPOS_API',
    defaultReposCount: DEFAULT_GLOBAL_SIPHON_REPOSITORIES.length,
  });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await safeReqJson(req, {});
    const token = typeof body?.token === 'string' ? body.token.trim() : '';

    const repositoryMap = new Map<string, SanitizedRepository>();

    if (token) {
      const userRepos = await fetchUserRepositories(token);
      for (let i = 0; i < userRepos.length; i++) {
        const repo = userRepos[i];
        repositoryMap.set(repo.fullName.toLowerCase(), repo);
      }
    }

    const globalRepos = await fetchGlobalSiphonRepositories(token);
    for (let i = 0; i < globalRepos.length; i++) {
      const repo = globalRepos[i];
      const key = repo.fullName.toLowerCase();
      if (!repositoryMap.has(key)) {
        repositoryMap.set(key, repo);
      }
    }

    for (let i = 0; i < DEFAULT_GLOBAL_SIPHON_REPOSITORIES.length; i++) {
      const repo = DEFAULT_GLOBAL_SIPHON_REPOSITORIES[i];
      const key = repo.fullName.toLowerCase();
      if (!repositoryMap.has(key)) {
        repositoryMap.set(key, repo);
      }
    }

    const repos = Array.from(repositoryMap.values());

    return NextResponse.json({
      success: true,
      repos,
      count: repos.length,
    });
  } catch (error) {
    console.error('User repos list error handler recovered:', error);
    return NextResponse.json({
      success: true,
      repos: [...DEFAULT_GLOBAL_SIPHON_REPOSITORIES],
      warning: 'Operating on cached repository registry.',
    });
  }
}
