/* DARLEK CAAN RAG SYNTHESIS - Autonomous Generation G-93 [2026-09-20T05:41:23.352Z] */
/**
 * DARLEK CANN ARCHITECTURAL HEADER
 * File: src/app/api/github/delete-file/route.ts
 * Role: Core system component participating in autonomous cognitive evolution cycles.
 * Architecture: Type-safe modular unit with resilient state interfaces.
 */

import { NextRequest, NextResponse } from '@/lib/next-mock';
import { safeReqJson } from '@/lib/safe-json';

export const dynamic = 'force-dynamic';

interface DeleteFileRequestBody {
  token?: string;
  owner?: string;
  repo?: string;
  branch?: string;
  path?: string;
  sha?: string;
  commitMessage?: string;
}

interface GitHubContentResponse {
  sha?: string;
}

interface GitHubDeleteResponse {
  commit?: {
    sha?: string;
    html_url?: string;
  };
}

const GITHUB_API_BASE_URL = 'https://api.github.com';
const GITHUB_API_VERSION_HEADER = 'application/vnd.github.v3+json';

const HEADERS_CACHE = new Map<string, Record<string, string>>();

const ALPHA_NUMERIC_HYPHEN_UNDERSCORE_REGEX = /^[a-zA-Z0-9\-_]+$/;

function validateOwnerOrRepo(value: string): boolean {
  return typeof value === 'string' && value.length > 0 && value.length <= 100 && ALPHA_NUMERIC_HYPHEN_UNDERSCORE_REGEX.test(value);
}

function validateBranch(value: string): boolean {
  return typeof value === 'string' && value.length > 0 && value.length <= 255;
}

function validateToken(value: string): boolean {
  return typeof value === 'string' && value.length > 0 && value.length <= 500;
}

function buildGitHubHeaders(token: string, includeJsonContentType = false): Record<string, string> {
  const cacheKey = `${token}_${includeJsonContentType ? 1 : 0}`;
  let cached = HEADERS_CACHE.get(cacheKey);
  
  if (!cached) {
    cached = {
      'Authorization': `Bearer ${token}`,
      'Accept': GITHUB_API_VERSION_HEADER,
      ...(includeJsonContentType && { 'Content-Type': 'application/json' }),
    };
    HEADERS_CACHE.set(cacheKey, cached);
  }
  
  return cached;
}

function sanitizePath(filePath: string): string {
  if (typeof filePath !== 'string') {
    return '';
  }
  const segments = filePath.split('/');
  const filteredSegments = segments.filter((segment: string): boolean => segment.length > 0 && segment !== '.' && segment !== '..');
  
  if (filteredSegments.length === 0) {
    return '';
  }

  return filteredSegments.map((segment: string): string => encodeURIComponent(segment)).join('/');
}

async function getFileSha(
  token: string,
  owner: string,
  repo: string,
  branch: string,
  filePath: string
): Promise<string | null> {
  try {
    const encodedPath = sanitizePath(filePath);
    if (!encodedPath) {
      return null;
    }
    const endpoint = `${GITHUB_API_BASE_URL}/repos/${owner}/${repo}/contents/${encodedPath}?ref=${encodeURIComponent(branch)}`;
    
    const response = await fetch(endpoint, {
      headers: buildGitHubHeaders(token),
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as GitHubContentResponse;
    return typeof data?.sha === 'string' ? data.sha : null;
  } catch {
    return null;
  }
}

async function deleteGitHubFileResource(
  token: string,
  owner: string,
  repo: string,
  branch: string,
  filePath: string,
  sha: string,
  commitMessage?: string
): Promise<Response> {
  const encodedPath = sanitizePath(filePath);
  const endpoint = `${GITHUB_API_BASE_URL}/repos/${owner}/${repo}/contents/${encodedPath}`;

  const payload = {
    message: commitMessage ?? `[DARLEK CANN] Delete ${filePath}`,
    sha,
    branch,
  };

  return fetch(endpoint, {
    method: 'DELETE',
    headers: buildGitHubHeaders(token, true),
    body: JSON.stringify(payload),
    cache: 'no-store',
  });
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ status: 'online', service: 'GITHUB_DELETE_FILE_API' });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await safeReqJson(req, {})) as DeleteFileRequestBody;
    const { token, owner, repo, branch, path: filePath, sha, commitMessage } = body;

    if (!token || !owner || !repo || !branch || !filePath) {
      return NextResponse.json(
        { error: 'All fields are required: token, owner, repo, branch, path.' },
        { status: 400 }
      );
    }

    if (!validateToken(token)) {
      return NextResponse.json({ error: 'Invalid token format.' }, { status: 400 });
    }

    if (!validateOwnerOrRepo(owner)) {
      return NextResponse.json({ error: 'Invalid owner format.' }, { status: 400 });
    }

    if (!validateOwnerOrRepo(repo)) {
      return NextResponse.json({ error: 'Invalid repo format.' }, { status: 400 });
    }

    if (!validateBranch(branch)) {
      return NextResponse.json({ error: 'Invalid branch format.' }, { status: 400 });
    }

    const resolvedSha = sha ?? (await getFileSha(token, owner, repo, branch, filePath));

    if (!resolvedSha) {
      return NextResponse.json({
        success: true,
        message: 'File did not exist, no deletion necessary.',
      });
    }

    const githubResponse = await deleteGitHubFileResource(
      token,
      owner,
      repo,
      branch,
      filePath,
      resolvedSha,
      commitMessage
    );

    if (!githubResponse.ok) {
      const errorDetails = await githubResponse.text();
      return NextResponse.json(
        { error: `GitHub API error during deletion: ${errorDetails}` },
        { status: githubResponse.status }
      );
    }

    const responseData = (await githubResponse.json()) as GitHubDeleteResponse;

    return NextResponse.json({
      success: true,
      commitSha: responseData.commit?.sha,
      commitUrl: responseData.commit?.html_url,
    });
  } catch (error: unknown) {
    console.error('Delete file error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

