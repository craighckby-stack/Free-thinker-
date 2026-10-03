/* DARLEK CAAN RAG SYNTHESIS - Autonomous Generation G-91 [2026-09-20T05:40:39.095Z] */
/**
 * DARLEK CANN ARCHITECTURAL HEADER
 * File: src/app/api/github/create-repo/route.ts
 * Role: Core system component participating in autonomous cognitive evolution cycles.
 * Architecture: Type-safe modular unit with resilient state interfaces.
 */

import { NextRequest, NextResponse } from '@/lib/next-mock';
import { promises as fs } from 'fs';
import path from 'path';
import { safeReqJson } from '@/lib/safe-json';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

interface CreateRepoRequestBody {
  token?: string;
  repoName?: string;
  description?: string;
}

interface GitHubUser {
  login: string;
}

interface GitHubRepo {
  default_branch?: string;
}

interface FileItem {
  path: string;
  content: string;
}

interface GitHubErrorResponse {
  message?: string;
}

const EXTENSIONS_TO_INCLUDE = new Set(['.ts', '.tsx', '.js', '.jsx', '.css', '.json', '.html', '.prisma']);
const EXCLUDE_DIRS = new Set(['node_modules', '.next', '.git', 'download', 'work', 'upload', '.darleK-backups']);
const EXCLUDE_FILES = new Set(['db/custom.db']);
const CONFIG_FILES = new Set([
  'package.json', 'next.config.ts', 'next.config.js', 'next.config.mjs', 
  'tsconfig.json', 'tailwind.config.ts', 'tailwind.config.js', 
  'postcss.config.js', 'postcss.config.mjs', '.eslintrc.json', 
  '.eslintrc.js', 'eslint.config.mjs', 'README.md', '.gitignore', '.env.example'
]);

function buildGitHubHeaders(token: string): Record<string, string> {
  return {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };
}

async function collectProjectFiles(dir: string, base: string = ''): Promise<FileItem[]> {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }

  const promises = entries.map(async (entry): Promise<FileItem[]> => {
    const entryName = entry.name;
    const fullPath = path.join(dir, entryName);
    const relativePath = base ? `${base}/${entryName}` : entryName;

    if (EXCLUDE_DIRS.has(entryName)) return [];
    if (entryName.charCodeAt(0) === 46 && !CONFIG_FILES.has(relativePath)) return [];

    if (entry.isFile()) {
      const dotIndex = entryName.lastIndexOf('.');
      const ext = dotIndex !== -1 ? entryName.substring(dotIndex).toLowerCase() : '';
      const isConfig = CONFIG_FILES.has(relativePath);
      
      if ((EXTENSIONS_TO_INCLUDE.has(ext) || isConfig) && !EXCLUDE_FILES.has(relativePath)) {
        try {
          const content = await fs.readFile(fullPath, 'utf-8');
          return [{ path: relativePath, content }];
        } catch {
          return [];
        }
      }
      return [];
    }
    
    if (entry.isDirectory()) {
      return collectProjectFiles(fullPath, relativePath);
    }
    
    return [];
  });

  const nestedResults = await Promise.all(promises);
  return nestedResults.flat();
}

async function fetchBranchReference(
  owner: string,
  repoName: string,
  defaultBranch: string,
  headers: Record<string, string>,
  maxRetries = 5,
  delayMs = 1500
): Promise<string | null> {
  const refUrl = `https://api.github.com/repos/${owner}/${encodeURIComponent(repoName)}/git/ref/heads/${defaultBranch}`;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (attempt > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
    try {
      const response = await fetch(refUrl, { headers });
      if (response.ok) {
        const data = await response.json();
        if (data.object?.sha) {
          return data.object.sha;
        }
      }
    } catch (error) {
      console.error(`Error fetching branch ref (attempt ${attempt + 1}):`, error);
    }
  }
  return null;
}

async function fetchBaseTreeSha(
  owner: string,
  repoName: string,
  refSha: string,
  headers: Record<string, string>
): Promise<string | null> {
  const commitUrl = `https://api.github.com/repos/${owner}/${encodeURIComponent(repoName)}/git/commits/${refSha}`;
  try {
    const response = await fetch(commitUrl, { headers });
    if (response.ok) {
      const data = await response.json();
      return data.tree?.sha || null;
    }
  } catch (error) {
    console.error('Error fetching base tree SHA:', error);
  }
  return null;
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ status: 'online', service: 'GITHUB_CREATE_REPO_API' });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await safeReqJson(req, {})) as CreateRepoRequestBody;
    const { token, repoName, description } = body;

    if (!token || !repoName) {
      return NextResponse.json({ error: 'token and repoName are required' }, { status: 400 });
    }

    const headers = buildGitHubHeaders(token);

    const [userRes, filesToPush] = await Promise.all([
      fetch('https://api.github.com/user', { headers }),
      collectProjectFiles(process.cwd())
    ]);

    if (!userRes.ok) {
      return NextResponse.json({ error: 'GitHub authentication failed' }, { status: 401 });
    }
    
    const userData = (await userRes.json()) as GitHubUser;
    const owner = userData.login;

    const existingRepoRes = await fetch(`https://api.github.com/repos/${owner}/${encodeURIComponent(repoName)}`, { headers });

    let repoCreated = existingRepoRes.ok;
    let defaultBranch = 'main';

    if (!repoCreated) {
      const createRes = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: repoName,
          description: description || 'DARLEK CANN v3.0 — Code Evolution Engine',
          auto_init: true,
          private: false,
        }),
      });

      if (!createRes.ok) {
        const errData = (await createRes.json().catch(() => ({}))) as GitHubErrorResponse;
        return NextResponse.json(
          { error: `Failed to create repo: ${errData.message || createRes.statusText}` }, 
          { status: createRes.status }
        );
      }
      repoCreated = true;
    } else {
      const repoData = (await existingRepoRes.json()) as GitHubRepo;
      defaultBranch = repoData.default_branch || 'main';
    }

    if (filesToPush.length === 0) {
      return NextResponse.json({ error: 'No files valid for push' }, { status: 400 });
    }

    const refSha = await fetchBranchReference(owner, repoName, defaultBranch, headers);
    const baseTreeSha = refSha ? await fetchBaseTreeSha(owner, repoName, refSha, headers) : null;

    const totalFiles = filesToPush.length;
    const treeItems = filesToPush.map(file => ({
      path: file.path,
      mode: '100644',
      type: 'blob',
      content: file.content,
    }));

    const treeBody: Record<string, unknown> = {
      tree: treeItems,
      ...(baseTreeSha && { base_tree: baseTreeSha }),
    };

    const actualTreeRes = await fetch(`https://api.github.com/repos/${owner}/${encodeURIComponent(repoName)}/git/trees`, {
      method: 'POST',
      headers,
      body: JSON.stringify(treeBody),
    });

    if (!actualTreeRes.ok) {
      const errMsg = await actualTreeRes.text();
      return NextResponse.json({ error: `Failed to create active git tree: ${errMsg}` }, { status: actualTreeRes.status });
    }

    const treeData = await actualTreeRes.json();
    const newTreeSha = treeData.sha;

    const commitMsg = `[DARLEK CANN] Deploy Initial Codebase: ${totalFiles} source files`;
    const commitBody = {
      message: commitMsg,
      tree: newTreeSha,
      parents: refSha ? [refSha] : [],
    };

    const createCommitRes = await fetch(`https://api.github.com/repos/${owner}/${encodeURIComponent(repoName)}/git/commits`, {
      method: 'POST',
      headers,
      body: JSON.stringify(commitBody),
    });

    if (!createCommitRes.ok) {
      const errMsg = await createCommitRes.text();
      return NextResponse.json({ error: `Failed to synthesize git commit: ${errMsg}` }, { status: createCommitRes.status });
    }

    const createdCommitData = await createCommitRes.json();
    const newCommitSha = createdCommitData.sha;

    const updateRefEndpoint = refSha
      ? `https://api.github.com/repos/${owner}/${encodeURIComponent(repoName)}/git/refs/heads/${defaultBranch}`
      : `https://api.github.com/repos/${owner}/${encodeURIComponent(repoName)}/git/refs`;

    const updateRefMethod = refSha ? 'PATCH' : 'POST';
    const updateRefPayload = refSha
      ? { sha: newCommitSha, force: true }
      : { ref: `refs/heads/${defaultBranch}`, sha: newCommitSha };

    const updateRefRes = await fetch(updateRefEndpoint, {
      method: updateRefMethod,
      headers,
      body: JSON.stringify(updateRefPayload),
    });

    if (!updateRefRes.ok) {
      const errMsg = await updateRefRes.text();
      return NextResponse.json({ error: `Failed to update default branch head pointer to ${defaultBranch}: ${errMsg}` }, { status: updateRefRes.status });
    }

    const repoUrl = `https://github.com/${owner}/${repoName}`;
    return NextResponse.json({
      success: true,
      message: `Deploy complete to ${owner}/${repoName}. ${totalFiles} files pushed.`,
      repoUrl,
      fullName: `${owner}/${repoName}`,
      url: repoUrl,
      total: totalFiles,
      pushed: totalFiles,
      failed: 0,
      failures: [],
    });
  } catch (error) {
    console.error('Create repo error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
