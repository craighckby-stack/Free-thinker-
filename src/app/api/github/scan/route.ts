/* DARLEK CAAN RAG SYNTHESIS - Autonomous Generation G-97 [2026-09-20T05:42:53.525Z] */
/**
 * DARLEK CANN ARCHITECTURAL HEADER
 * File: src/app/api/github/scan/route.ts
 * Role: Core system component participating in autonomous cognitive evolution cycles.
 * Architecture: Type-safe modular unit with resilient state interfaces.
 */

import { NextRequest, NextResponse } from '@/lib/next-mock';
import type { ScanRepoBody, GitHubFile } from '@/lib/types';
import { safeReqJson } from '@/lib/safe-json';

export const dynamic = 'force-dynamic';

const GITHUB_API_BASE_URL = 'https://api.github.com';
const GITHUB_API_VERSION_HEADER = 'application/vnd.github.v3+json';

const MAX_OWNER_LENGTH = 100;
const MAX_REPO_LENGTH = 100;
const MAX_BRANCH_LENGTH = 255;
const MAX_TOKEN_LENGTH = 500;
const MAX_TREE_ITEMS = 50000;

const SAFE_NAME_REGEX = /^[a-zA-Z0-9_.-]+$/;

const EXCLUDED_DIRECTORIES = Object.freeze([
  'node_modules/',
  '.git/',
  'dist/',
  'build/',
  '.next/',
  '__pycache__/',
  '.svn/',
]);

const EXCLUDED_FILES_SET = Object.freeze(
  new Set([
    '.env',
    '.env.local',
    'package-lock.json',
    'yarn.lock',
    '.DS_Store',
  ])
);

interface GitHubTreeItem {
  readonly path: string;
  readonly size: number;
  readonly type: string;
  readonly sha: string;
}

interface GitHubTreeResponse {
  readonly tree?: GitHubTreeItem[];
}

/**
 * Determines whether a given tree item is a valid file that passes exclusion filters and bounds constraints.
 */
function isValidBlobItem(item: GitHubTreeItem): boolean {
  if (!item || item.type !== 'blob' || typeof item.path !== 'string' || typeof item.size !== 'number') {
    return false;
  }

  const { path } = item;
  if (path.length > 1024 || path.includes('..') || path.startsWith('/')) {
    return false;
  }

  if (EXCLUDED_DIRECTORIES.some((dir) => path.includes(dir))) {
    return false;
  }

  const lastSlashIndex = path.lastIndexOf('/');
  const fileName = lastSlashIndex === -1 ? path : path.substring(lastSlashIndex + 1);

  return !EXCLUDED_FILES_SET.has(fileName);
}

/**
 * Handles health-check requests for the GitHub scan service.
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ status: 'online', service: 'GITHUB_SCAN_API' });
}

/**
 * Scans a GitHub repository tree recursively while filtering out ignored files and directories with strict input validation.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await safeReqJson<ScanRepoBody>(req, {} as ScanRepoBody);
    let { token, owner, repo, branch } = body;

    if (!token || !owner || !repo) {
      return NextResponse.json(
        { error: 'Missing required parameters: token, owner, or repo.' },
        { status: 400 }
      );
    }

    // Clean and sanitize repository coordinates
    owner = owner.trim();
    repo = repo.trim();
    branch = (branch || 'main').trim();

    if (owner.startsWith('https://github.com/')) {
      owner = owner.replace('https://github.com/', '');
    }
    if (owner.includes('/')) {
      const parts = owner.split('/').filter(Boolean);
      if (parts.length >= 2) {
        owner = parts[0];
        repo = parts[1];
      }
    }
    if (repo.startsWith('https://github.com/')) {
      repo = repo.replace('https://github.com/', '');
      const parts = repo.split('/').filter(Boolean);
      if (parts.length >= 2) {
        owner = parts[0];
        repo = parts[1];
      }
    }

    owner = owner.replace(/^\/+|\/+$/g, '');
    repo = repo.replace(/^\/+|\/+$/g, '');

    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: GITHUB_API_VERSION_HEADER,
      'User-Agent': 'Free-Thinker-Engine/1.0',
    };

    // First check repository existence & detect true default branch
    let defaultBranch = branch || 'main';
    const repoInfoRes = await fetch(`${GITHUB_API_BASE_URL}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`, { headers });
    
    if (repoInfoRes.ok) {
      const repoInfo = await repoInfoRes.json();
      if (repoInfo.default_branch) {
        defaultBranch = repoInfo.default_branch;
      }
    } else if (repoInfoRes.status === 404) {
      // Auto-create the repo if it does not exist under the user account
      const createRes = await fetch(`${GITHUB_API_BASE_URL}/user/repos`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: repo,
          description: 'Free Thinker unconstrained cognitive engine repository',
          auto_init: true,
          private: false,
        }),
      });
      if (createRes.ok) {
        const createData = await createRes.json();
        defaultBranch = createData.default_branch || 'main';
        await new Promise(r => setTimeout(r, 2500));
      }
    }

    const branchToTry = branch || defaultBranch;
    let repositoryTreeUrl = `${GITHUB_API_BASE_URL}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/trees/${encodeURIComponent(branchToTry)}?recursive=1`;

    let githubResponse = await fetch(repositoryTreeUrl, { headers });

    // If branch failed (e.g. 404), try defaultBranch or master
    if (!githubResponse.ok && defaultBranch !== branchToTry) {
      repositoryTreeUrl = `${GITHUB_API_BASE_URL}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/trees/${encodeURIComponent(defaultBranch)}?recursive=1`;
      githubResponse = await fetch(repositoryTreeUrl, { headers });
    }

    if (!githubResponse.ok && branchToTry !== 'master') {
      repositoryTreeUrl = `${GITHUB_API_BASE_URL}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/trees/master?recursive=1`;
      githubResponse = await fetch(repositoryTreeUrl, { headers });
    }

    if (!githubResponse.ok) {
      // If repository is completely empty (Git tree has not been committed yet)
      if (githubResponse.status === 404 || githubResponse.status === 409) {
        return NextResponse.json({
          files: [],
          total: 0,
          repoTotal: 0,
          branch: defaultBranch,
          isEmptyRepo: true,
          message: `Repository ${owner}/${repo} is ready. No files committed yet. Use 'PUSH SYSTEM TO GITHUB' to deploy all workspace files.`,
        });
      }

      const errorDetails = await githubResponse.text();
      return NextResponse.json(
        { error: `GitHub API error (${githubResponse.status}): ${errorDetails}` },
        { status: githubResponse.status }
      );
    }

    const data: GitHubTreeResponse = await githubResponse.json();
    const tree = data.tree || [];

    const blobItems = tree.filter((item): item is GitHubTreeItem => item !== null && item.type === 'blob');
    const repoTotal = blobItems.length;

    const filteredFiles: GitHubFile[] = blobItems
      .filter(isValidBlobItem)
      .map((item) => ({
        path: item.path,
        size: item.size,
        type: item.type,
        sha: item.sha,
      }));

    return NextResponse.json({
      files: filteredFiles,
      total: filteredFiles.length,
      repoTotal,
      branch: defaultBranch,
    });
  } catch (error: unknown) {
    console.error('Scan repo error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
