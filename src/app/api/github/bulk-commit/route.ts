/* DARLEK CAAN RAG SYNTHESIS - Autonomous Generation G-89 [2026-09-20T05:39:53.419Z] */
/**
 * DARLEK CANN ARCHITECTURAL HEADER
 * File: src/app/api/github/bulk-commit/route.ts
 * Role: Core system component participating in autonomous cognitive evolution cycles.
 * Architecture: Type-safe modular unit with resilient state interfaces.
 */

import { NextRequest, NextResponse } from '@/lib/next-mock';
import { promises as fs } from 'fs';
import { resolve, dirname } from 'path';
import { safeReqJson } from '@/lib/safe-json';
import { sanitizeContent } from '@/lib/scanner';
import { CodeRetentionPolicy } from '@/lib/retention-policy';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

interface CommittableFile {
  path: string;
  content: string;
}

interface BulkCommitRequestBody {
  token?: string;
  owner?: string;
  repo?: string;
  branch?: string;
  files?: CommittableFile[];
  commitMessage?: string;
}

interface GitHubGitObjectRef {
  object?: {
    sha?: string;
  };
}

interface GitHubRepoInfo {
  default_branch?: string;
}

interface GitHubBlobResponse {
  sha?: string;
}

interface GitHubTreeResponse {
  sha?: string;
}

interface GitHubCommitResponse {
  sha?: string;
}

interface GitTreeItem {
  path: string;
  mode: '100644';
  type: 'blob';
  sha: string;
}

const GITHUB_API_BASE = 'https://api.github.com';
const projectRoot = resolve(process.cwd());

/**
 * Creates standard HTTP headers for GitHub API communication with security constraints.
 */
function createGitHubHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
    'User-Agent': 'Dalek-Cognition-Architecture/1.0',
  };
}

/**
 * Validates that owner, repo, and branch names contain only allowed characters to prevent injection.
 */
function validateGitIdentifiers(owner: string, repo: string, branch: string): boolean {
  const safeIdentifierRegex = /^[a-zA-Z0-9_.-]+$/;
  return (
    safeIdentifierRegex.test(owner) &&
    safeIdentifierRegex.test(repo) &&
    safeIdentifierRegex.test(branch)
  );
}

/**
 * Sanitizes all committable files to redact any accidental secrets or sensitive credentials.
 */
function sanitizeCommittableFiles(files: CommittableFile[]): CommittableFile[] {
  return files.map((file) => {
    if (!file || typeof file.content !== 'string') {
      return file;
    }

    const { sanitized, findings } = sanitizeContent(file.content);
    if (findings.length > 0) {
      console.log(`[Secret Sanitizer] Auto-redacted ${findings.length} secret(s) in safe file payload before bulk commit.`);
    }

    return {
      path: file.path,
      content: sanitized,
    };
  });
}

/**
 * Ensures the target repository exists, dynamically creating it if missing.
 */
async function ensureRepositoryExists(owner: string, repo: string, headers: Record<string, string>): Promise<NextResponse | null> {
  const repoUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}`;
  const verifyResponse = await fetch(repoUrl, { headers });

  if (verifyResponse.status === 404) {
    const createResponse = await fetch(`${GITHUB_API_BASE}/user/repos`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: repo,
        private: false,
        auto_init: true,
      }),
    });

    if (!createResponse.ok) {
      const errorDetails = await createResponse.text();
      console.error('Failed to create missing repo in bulk commit:', errorDetails);
      return NextResponse.json(
        { error: `Failed to auto-create missing repository ${repo}: ${errorDetails}` },
        { status: 400 }
      );
    }

    await new Promise<void>((resolveTimer) => setTimeout(resolveTimer, 3000));
  }

  return null;
}

/**
 * Resolves or creates the target branch reference, falling back to the default branch if needed.
 */
async function resolveBranchCommitSha(
  owner: string,
  repo: string,
  branch: string,
  headers: Record<string, string>
): Promise<{ sha?: string; errorResponse?: NextResponse }> {
  const refUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(branch)}`;
  let refResponse = await fetch(refUrl, { headers });

  if (!refResponse.ok) {
    const repoInfoResponse = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}`, { headers });
    if (repoInfoResponse.ok) {
      const repoInfo = (await repoInfoResponse.json()) as GitHubRepoInfo;
      const defaultBranch = repoInfo.default_branch || 'main';

      const defaultRefUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(defaultBranch)}`;
      const defaultRefResponse = await fetch(defaultRefUrl, { headers });

      if (defaultRefResponse.ok) {
        const defaultRefData = (await defaultRefResponse.json()) as GitHubGitObjectRef;
        const defaultCommitSha = defaultRefData.object?.sha;

        if (defaultCommitSha) {
          const createRefResponse = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/git/refs`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              ref: `refs/heads/${branch}`,
              sha: defaultCommitSha,
            }),
          });

          if (createRefResponse.ok) {
            refResponse = await fetch(refUrl, { headers });
          }
        }
      }
    }
  }

  if (!refResponse.ok) {
    const errorText = await refResponse.text();
    return {
      errorResponse: NextResponse.json(
        { error: `Could not fetch or create branch ref: ${errorText}` },
        { status: refResponse.status }
      ),
    };
  }

  const refData = (await refResponse.json()) as GitHubGitObjectRef;
  const latestCommitSha = refData.object?.sha;

  if (!latestCommitSha) {
    return {
      errorResponse: NextResponse.json(
        { error: 'Could not resolve latest commit SHA from branch.' },
        { status: 500 }
      ),
    };
  }

  return { sha: latestCommitSha };
}

/**
 * Resolves the base tree SHA from a given commit SHA.
 */
async function resolveBaseTreeSha(
  owner: string,
  repo: string,
  commitSha: string,
  headers: Record<string, string>
): Promise<{ sha?: string; errorResponse?: NextResponse }> {
  const commitUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/git/commits/${commitSha}`;
  const commitResponse = await fetch(commitUrl, { headers });

  if (!commitResponse.ok) {
    const errorText = await commitResponse.text();
    return {
      errorResponse: NextResponse.json(
        { error: `Could not fetch commit details: ${errorText}` },
        { status: commitResponse.status }
      ),
    };
  }

  const commitData = (await commitResponse.json()) as { tree?: { sha?: string } };
  const baseTreeSha = commitData.tree?.sha;

  if (!baseTreeSha) {
    return {
      errorResponse: NextResponse.json(
        { error: 'Could not resolve base tree SHA.' },
        { status: 500 }
      ),
    };
  }

  return { sha: baseTreeSha };
}

/**
 * Writes committable files to local disk asynchronously with strict path bounds checking.
 */
async function writeFilesToLocalDisk(files: CommittableFile[]): Promise<void> {
  try {
    const promises = files.map(async (file) => {
      if (!file || !file.path || typeof file.content !== 'string') return;

      const cleanPath = file.path.replace(/^\/+|\/+$/g, '');
      const localFilePath = resolve(projectRoot, cleanPath);
      
      if (localFilePath.startsWith(projectRoot) && !localFilePath.includes('..')) {
        const parentDir = dirname(localFilePath);
        await fs.mkdir(parentDir, { recursive: true });
        await fs.writeFile(localFilePath, file.content, 'utf-8');
      }
    });

    await Promise.all(promises);
  } catch (diskError: unknown) {
    console.warn('[Bulk Commit] Disk write warning:', diskError);
  }
}

/**
 * Generates Git blobs for each file and builds the tree payload items.
 */
async function generateTreeItems(
  owner: string,
  repo: string,
  files: CommittableFile[],
  headers: Record<string, string>
): Promise<{ items?: GitTreeItem[]; errorResponse?: NextResponse }> {
  const blobUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/git/blobs`;

  try {
    const treeItemsPromises = files.map(async (file): Promise<GitTreeItem> => {
      const sanitizedPath = file.path.replace(/^\/+|\/+$/g, '');
      if (sanitizedPath.includes('..')) {
        throw new Error('Invalid file path traversal detected.');
      }

      const blobResponse = await fetch(blobUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          content: Buffer.from(file.content, 'utf-8').toString('base64'),
          encoding: 'base64',
        }),
      });

      if (!blobResponse.ok) {
        const errorMsg = await blobResponse.text();
        throw new Error(`Failed to create git blob: ${errorMsg}`);
      }

      const blobData = (await blobResponse.json()) as GitHubBlobResponse;
      if (!blobData.sha) {
        throw new Error('Git blob API did not return SHA for file.');
      }

      return {
        path: sanitizedPath,
        mode: '100644',
        type: 'blob',
        sha: blobData.sha,
      };
    });

    const treeItems = await Promise.all(treeItemsPromises);
    return { items: treeItems };
  } catch (blobError: unknown) {
    const errorMessage = blobError instanceof Error ? blobError.message : 'Failed during file blob generation.';
    return {
      errorResponse: NextResponse.json({ error: errorMessage }, { status: 500 }),
    };
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ status: 'online', service: 'GITHUB_BULK_COMMIT_API' });
}

function isDarlekCaanTarget(owner?: string, repo?: string): boolean {
  if (!repo) return true;
  const clean = repo.toLowerCase().replace(/[^a-z0-9]/g, '');
  return clean.includes('darlek') || clean.includes('caan');
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await safeReqJson(req, {})) as BulkCommitRequestBody;
    const { token, owner, repo, branch, files, commitMessage } = body;

    if (!token || !owner || !repo || !branch) {
      return NextResponse.json(
        { error: 'All connection fields are required: token, owner, repo, branch.' },
        { status: 400 }
      );
    }

    if (!validateGitIdentifiers(owner, repo, branch)) {
      return NextResponse.json(
        { error: 'Invalid repository, owner, or branch format detected.' },
        { status: 400 }
      );
    }

    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided for bulk committing. Collect approved mutations first.' },
        { status: 400 }
      );
    }

    const safeFiles = sanitizeCommittableFiles(files);

    // Cross-Repository RAG Protection:
    // If the target repository being modified is an external repository, do NOT commit rag/ or logs/ to it.
    const isTargetDarlek = isDarlekCaanTarget(owner, repo);
    const committableFiles = isTargetDarlek
      ? safeFiles
      : safeFiles.filter(
          (f) => !f.path.startsWith('rag/') && !f.path.startsWith('logs/')
        );

    if (committableFiles.length === 0) {
      // If all files were RAG/logs intended for Darlek Caan repo, avoid erroring out
      return NextResponse.json({
        success: true,
        message: 'RAG and log files filtered out from external repository commit.',
        commitSha: 'skipped_foreign_repo',
      });
    }

    // Enforce Authoritative Code Retention Policy Gate on all bulk commit payloads
    for (const f of committableFiles) {
      const auth = await CodeRetentionPolicy.enforceGate({
        repo: `${owner}/${repo}`,
        filePath: f.path,
        content: f.content,
        actor: 'GITHUB_BULK_COMMIT_API',
      });
      if (!auth.authorized) {
        return NextResponse.json(
          { error: `Retention Policy Gatekeeper rejected file "${f.path}": ${auth.error}` },
          { status: 403 }
        );
      }
    }

    const headers = createGitHubHeaders(token);

    const repoErrorResponse = await ensureRepositoryExists(owner, repo, headers);
    if (repoErrorResponse) return repoErrorResponse;

    const branchResult = await resolveBranchCommitSha(owner, repo, branch, headers);
    if (branchResult.errorResponse) return branchResult.errorResponse;
    const latestCommitSha = branchResult.sha!;

    const treeResult = await resolveBaseTreeSha(owner, repo, latestCommitSha, headers);
    if (treeResult.errorResponse) return treeResult.errorResponse;
    const baseTreeSha = treeResult.sha!;

    // Persist RAG/log files locally in all contexts
    const ragAndLogFiles = safeFiles.filter((f) => f.path.startsWith('rag/') || f.path.startsWith('logs/'));
    if (ragAndLogFiles.length > 0) {
      await writeFilesToLocalDisk(ragAndLogFiles);
    }
    if (isTargetDarlek) {
      await writeFilesToLocalDisk(safeFiles);
    }

    const treeItemsResult = await generateTreeItems(owner, repo, committableFiles, headers);
    if (treeItemsResult.errorResponse) return treeItemsResult.errorResponse;
    const treeItems = treeItemsResult.items!;

    const treeUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/git/trees`;
    const createTreeResponse = await fetch(treeUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        base_tree: baseTreeSha,
        tree: treeItems,
      }),
    });

    if (!createTreeResponse.ok) {
      const errorText = await createTreeResponse.text();
      return NextResponse.json(
        { error: `Could not create dynamic tree: ${errorText}` },
        { status: createTreeResponse.status }
      );
    }

    const createTreeData = (await createTreeResponse.json()) as GitHubTreeResponse;
    const newTreeSha = createTreeData.sha;

    if (!newTreeSha) {
      return NextResponse.json(
        { error: 'Could not create new tree SHA.' },
        { status: 500 }
      );
    }

    const createCommitUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/git/commits`;
    const defaultCommitMsg = `[DARLEK CAAN] Bulk Commit: Staged system evolution of ${files.length} file${files.length > 1 ? 's' : ''}`;
    
    const createCommitResponse = await fetch(createCommitUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message: commitMessage || defaultCommitMsg,
        tree: newTreeSha,
        parents: [latestCommitSha],
      }),
    });

    if (!createCommitResponse.ok) {
      const errorText = await createCommitResponse.text();
      return NextResponse.json(
        { error: `Could not create commit resource: ${errorText}` },
        { status: createCommitResponse.status }
      );
    }

    const createCommitData = (await createCommitResponse.json()) as GitHubCommitResponse;
    const newCommitSha = createCommitData.sha;

    if (!newCommitSha) {
      return NextResponse.json(
        { error: 'Could not create commit.' },
        { status: 500 }
      );
    }

    const updateRefUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/git/refs/heads/${branch}`;
    const updateRefResponse = await fetch(updateRefUrl, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        sha: newCommitSha,
        force: false,
      }),
    });

    if (!updateRefResponse.ok) {
      const errorText = await updateRefResponse.text();
      return NextResponse.json(
        { error: `Could not direct branch head reference: ${errorText}` },
        { status: updateRefResponse.status }
      );
    }

    return NextResponse.json({
      success: true,
      commitSha: newCommitSha,
      filesCommitted: files.length,
      commitUrl: `https://github.com/${owner}/${repo}/commit/${newCommitSha}`,
    });
  } catch (error: unknown) {
    console.error('Bulk commit API crash:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown exception';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

