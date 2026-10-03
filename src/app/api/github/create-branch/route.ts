/* DARLEK CAAN RAG SYNTHESIS - Autonomous Generation G-90 [2026-09-20T05:40:15.835Z] */
/**
 * DARLEK CANN ARCHITECTURAL HEADER
 * File: src/app/api/github/create-branch/route.ts
 * Role: Core system component participating in autonomous cognitive evolution cycles.
 * Architecture: Type-safe modular unit with resilient state interfaces.
 */

import { NextRequest, NextResponse } from '@/lib/next-mock';
import { safeReqJson } from "@/lib/safe-json";

export const dynamic = "force-dynamic";

interface CreateBranchPayload {
  token?: string;
  owner?: string;
  repo?: string;
  baseBranch?: string;
  newBranch?: string;
}

interface GitHubRefResponse {
  object?: {
    sha?: string;
  };
}

interface GitHubErrorResponse {
  message?: string;
}

const GITHUB_API_BASE = "https://api.github.com";
const USER_AGENT = "Darlek Caan-v49-Neural-Code-Optimizer";
const GITHUB_API_VERSION = "application/vnd.github.v3+json";

const BASE_HEADERS_CACHE: Readonly<Record<string, string>> = Object.freeze({
  Accept: GITHUB_API_VERSION,
  "User-Agent": USER_AGENT,
});

const POST_HEADERS_CACHE: Readonly<Record<string, string>> = Object.freeze({
  Accept: GITHUB_API_VERSION,
  "User-Agent": USER_AGENT,
  "Content-Type": "application/json",
});

/**
 * Generates HTTP headers utilizing pre-allocated reference objects with the provided authentication token.
 */
function createGitHubHeaders(token: string, isPost: boolean = false): Record<string, string> {
  return {
    ...(isPost ? POST_HEADERS_CACHE : BASE_HEADERS_CACHE),
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Safely parses and extracts descriptive error messages from failed GitHub API responses.
 */
async function parseGitHubError(response: Response, defaultMessage: string): Promise<string> {
  const errorData = (await response.json().catch(() => ({}))) as GitHubErrorResponse;
  return errorData.message || `${defaultMessage}: ${response.status}`;
}

/**
 * Validates payload fields required to execute a branch creation operation.
 */
function validatePayload(payload: CreateBranchPayload): string | null {
  const { token, owner, repo, baseBranch, newBranch } = payload;
  if (!token || !owner || !repo || !baseBranch || !newBranch) {
    return "token, owner, repo, baseBranch, and newBranch are required";
  }
  return null;
}

/**
 * Fetches the commit SHA associated with a given base branch reference.
 */
async function fetchBaseBranchSha(
  owner: string,
  repo: string,
  baseBranch: string,
  token: string
): Promise<{ sha?: string; errorResponse?: NextResponse }> {
  const baseRefUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(baseBranch)}`;
  const response = await fetch(baseRefUrl, {
    headers: createGitHubHeaders(token, false),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorMessage = await parseGitHubError(response, "Failed to fetch base branch ref");
    return { errorResponse: NextResponse.json({ error: errorMessage }, { status: response.status }) };
  }

  const refData = (await response.json()) as GitHubRefResponse;
  const sha = refData?.object?.sha;

  if (!sha) {
    return {
      errorResponse: NextResponse.json(
        { error: "Failed to resolve SHA from base branch reference data." },
        { status: 502 }
      ),
    };
  }

  return { sha };
}

/**
 * Creates a new git reference branch pointing to the specified commit SHA.
 */
async function createNewBranchReference(
  owner: string,
  repo: string,
  newBranch: string,
  baseSha: string,
  token: string
): Promise<NextResponse> {
  const createRefUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/git/refs`;
  const response = await fetch(createRefUrl, {
    method: "POST",
    headers: createGitHubHeaders(token, true),
    body: JSON.stringify({
      ref: `refs/heads/${newBranch}`,
      sha: baseSha,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorMessage = await parseGitHubError(response, "Failed to create branch");
    return NextResponse.json({ error: errorMessage }, { status: response.status });
  }

  return NextResponse.json({ success: true, branch: newBranch });
}

export function GET(): NextResponse {
  return NextResponse.json({ status: "online", service: "GITHUB_CREATE_BRANCH_API" });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await safeReqJson(req, {})) as CreateBranchPayload;
    
    const validationError = validatePayload(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const { token, owner, repo, baseBranch, newBranch } = body;

    const { sha: baseSha, errorResponse: shaError } = await fetchBaseBranchSha(
      owner!,
      repo!,
      baseBranch!,
      token!
    );

    if (shaError) {
      return shaError;
    }

    return await createNewBranchReference(
      owner!,
      repo!,
      newBranch!,
      baseSha!,
      token!
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("Create branch internal execution error:", errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

