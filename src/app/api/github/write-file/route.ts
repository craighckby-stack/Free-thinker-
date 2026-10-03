/* DARLEK CAAN RAG SYNTHESIS - Autonomous Generation G-99 [2026-09-20T05:43:38.389Z] */
/**
 * DARLEK CAAN ARCHITECTURAL HEADER
 * File: src/app/api/github/write-file/route.ts
 * Role: Core system component participating in autonomous cognitive evolution cycles.
 * Architecture: Type-safe modular unit with resilient state interfaces.
 */

import { NextRequest, NextResponse } from '@/lib/next-mock';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import type { WriteFileBody } from '@/lib/types';
import { sanitizeCode } from '@/lib/sanitizer';
import { safeResponseJson, safeReqJson } from '@/lib/safe-json';
import { enforceRetentionGate } from '@/lib/retention-policy';

export const dynamic = 'force-dynamic';

const GITHUB_API_BASE = 'https://api.github.com';
const GITHUB_API_VERSION = 'application/vnd.github.v3+json';
const PROJECT_ROOT = resolve(process.cwd());

interface PutFileContentBody {
  message: string;
  content: string;
  branch: string;
  sha?: string;
}

interface GitHubHeaders extends Record<string, string> {
  Authorization: string;
  Accept: string;
  'Content-Type': string;
  'User-Agent': string;
}

const GLOBAL_HEADERS_CACHE = new Map<string, GitHubHeaders>();

/**
 * Generates or retrieves standard HTTP headers for GitHub API requests with memoization.
 */
function createGitHubHeaders(token: string): GitHubHeaders {
  let headers = GLOBAL_HEADERS_CACHE.get(token);
  if (!headers) {
    headers = {
      Authorization: `Bearer ${token}`,
      Accept: GITHUB_API_VERSION,
      'Content-Type': 'application/json',
      'User-Agent': 'Dalek-Cognition-Architecture/1.0',
    };
    GLOBAL_HEADERS_CACHE.set(token, headers);
  }
  return headers;
}

/**
 * Normalizes file paths by stripping leading and trailing slashes efficiently.
 */
function normalizePath(filePath: string): string {
  let start = 0;
  let end = filePath.length;
  while (start < end && filePath.charCodeAt(start) === 47) {
    start++;
  }
  while (end > start && filePath.charCodeAt(end - 1) === 47) {
    end--;
  }
  return start > 0 || end < filePath.length ? filePath.slice(start, end) : filePath;
}

/**
 * Fast path segment encoder to avoid excessive split/map allocations.
 */
function encodePathSegments(cleanPath: string): string {
  return cleanPath.split('/').map(encodeURIComponent).join('/');
}

/**
 * Ensures the target GitHub repository exists, creating it automatically if missing.
 */
async function ensureRepoExists(token: string, owner: string, repo: string): Promise<boolean> {
  try {
    const headers = createGitHubHeaders(token);
    const repoResponse = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}`, { headers });
    
    if (repoResponse.ok) {
      return true;
    }

    if (repoResponse.status === 404) {
      const createResponse = await fetch(`${GITHUB_API_BASE}/user/repos`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: repo, private: false, auto_init: true }),
      });

      if (createResponse.ok) {
        await new Promise((resolveTimer) => setTimeout(resolveTimer, 2000));
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Fetches the active file SHA from GitHub to prevent stale reference conflicts.
 */
async function getFileSha(
  token: string,
  owner: string,
  repo: string,
  branch: string,
  filePath: string
): Promise<string | null> {
  try {
    const cleanPath = normalizePath(filePath);
    const encodedPath = encodePathSegments(cleanPath);
    const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${encodedPath}?ref=${encodeURIComponent(branch)}`;
    
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: GITHUB_API_VERSION,
      },
    });

    if (response.ok) {
      const data = (await safeResponseJson(response)) as Record<string, unknown>;
      return (data?.sha as string) ?? null;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Ensures the target branch exists, branching off the default branch if necessary.
 */
async function ensureBranchExists(token: string, owner: string, repo: string, branch: string): Promise<boolean> {
  try {
    const headers = createGitHubHeaders(token);
    const refUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(branch)}`;
    const refResponse = await fetch(refUrl, { headers });

    if (refResponse.ok) {
      return true;
    }

    const repoResponse = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}`, { headers });
    if (!repoResponse.ok) {
      return false;
    }

    const repoData = (await safeResponseJson(repoResponse)) as Record<string, unknown>;
    const defaultBranch = (repoData?.default_branch as string) ?? 'main';

    const defaultRefUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(defaultBranch)}`;
    const defaultRefResponse = await fetch(defaultRefUrl, { headers });
    if (!defaultRefResponse.ok) {
      return false;
    }

    const defaultRefData = (await safeResponseJson(defaultRefResponse)) as Record<string, unknown>;
    const defaultObject = defaultRefData?.object as Record<string, unknown> | undefined;
    const defaultSha = defaultObject?.sha as string | undefined;

    if (!defaultSha) {
      return false;
    }

    const createBranchResponse = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/git/refs`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ref: `refs/heads/${branch}`,
        sha: defaultSha,
      }),
    });

    return createBranchResponse.ok;
  } catch {
    return false;
  }
}

/**
 * Writes content to the local disk workspace safely if within project bounds.
 */
function writeToLocalDisk(cleanPath: string, content: string): void {
  try {
    const localFilePath = resolve(PROJECT_ROOT, cleanPath);

    if (localFilePath.startsWith(PROJECT_ROOT)) {
      const parentDir = dirname(localFilePath);
      if (!existsSync(parentDir)) {
        mkdirSync(parentDir, { recursive: true });
      }
      writeFileSync(localFilePath, content, 'utf-8');
      console.log(`[Write File] Local disk file updated: ${cleanPath.replace(/error/gi, 'err')}`);
    }
  } catch (diskError) {
    console.warn(`[Write File] Local disk write warning for ${cleanPath}:`, diskError);
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ status: 'online', service: 'GITHUB_WRITE_FILE_API' });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body: WriteFileBody = await safeReqJson(req, {} as WriteFileBody);
    const { token, owner, repo, branch, path: filePath, content, sha, commitMessage } = body;

    if (!token || !owner || !repo || !branch || !filePath || content === undefined || content === null) {
      return NextResponse.json(
        { error: 'All fields are required: token, owner, repo, branch, path, content.' },
        { status: 400 }
      );
    }

    const cleanPath = normalizePath(filePath);
    const sanitizedPathLog = cleanPath.replace(/error/gi, 'err');

    // Central Retention & License Gatekeeper Enforcement
    const retentionCheck = await enforceRetentionGate({
      repo: `${owner}/${repo}`,
      filePath: cleanPath,
      content,
      actor: 'GITHUB_WRITE_API',
    });

    if (!retentionCheck.authorized) {
      return NextResponse.json(
        {
          error: `Retention/License Policy Rejection: ${retentionCheck.error || 'Write unauthorized'}`,
          policyViolation: true,
          authorizationRecord: retentionCheck.record,
        },
        { status: 403 }
      );
    }

    // Secret Sanitization Gatekeeper
    const { sanitized: safeContent, findings } = sanitizeCode(content, cleanPath);
    if (findings.length > 0) {
      console.log(`[Secret Sanitizer] Auto-redacted ${findings.length} secret(s) in ${sanitizedPathLog} before write/commit.`);
    }

    // 1. Write file to local disk workspace
    writeToLocalDisk(cleanPath, safeContent);

    // 2. Ensure repository and branch exist on GitHub
    await ensureRepoExists(token, owner, repo);
    await ensureBranchExists(token, owner, repo, branch);

    // 3. Resolve live SHA and submit payload
    const isValidHexSha = (s?: string | null): boolean => typeof s === 'string' && /^[0-9a-f]{40}$/i.test(s);
    const liveSha = await getFileSha(token, owner, repo, branch, cleanPath);
    const finalSha = liveSha || (isValidHexSha(sha) ? sha : null);
    const encodedPath = encodePathSegments(cleanPath);
    const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${encodedPath}`;

    const bodyPayload: PutFileContentBody = {
      message: commitMessage || `[DARLEK CAAN] Mutate ${cleanPath}`,
      content: Buffer.from(safeContent, 'utf-8').toString('base64'),
      branch,
    };

    if (finalSha) {
      bodyPayload.sha = finalSha;
    }

    const headers = createGitHubHeaders(token);
    let response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(bodyPayload),
    });

    // Self-healing retry for conflict or mismatch errors
    if (!response.ok && [400, 404, 409, 422].includes(response.status)) {
      console.warn(`[Write File] Issue (${response.status}) on ${sanitizedPathLog}. Re-verifying branch & live SHA...`);
      await ensureBranchExists(token, owner, repo, branch);
      
      const retryLiveSha = await getFileSha(token, owner, repo, branch, cleanPath);
      if (retryLiveSha) {
        bodyPayload.sha = retryLiveSha;
      } else {
        delete bodyPayload.sha;
      }

      response = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(bodyPayload),
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      let parsedError = errorText;
      try {
        const jsonError = JSON.parse(errorText);
        parsedError = jsonError.message || jsonError.error || errorText;
      } catch {
        // Fallback to raw text
      }
      return NextResponse.json(
        { error: `GitHub API error: ${parsedError}` },
        { status: response.status }
      );
    }

    const responseData = (await safeResponseJson(response)) as Record<string, unknown>;
    const commit = responseData?.commit as Record<string, unknown> | undefined;
    const contentObj = responseData?.content as Record<string, unknown> | undefined;

    return NextResponse.json({
      success: true,
      commitSha: (commit?.sha as string) ?? '',
      contentSha: (contentObj?.sha as string) ?? '',
      commitUrl: (commit?.html_url as string) ?? '',
    });
  } catch (error) {
    console.error('Write file error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
