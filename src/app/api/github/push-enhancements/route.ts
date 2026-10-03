/* DARLEK CAAN RAG SYNTHESIS - Autonomous Generation G-94 [2026-09-20T05:41:45.311Z] */
import { NextRequest, NextResponse } from '@/lib/next-mock';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { safeReqJson } from '@/lib/safe-json';
import { sanitizeContent } from '@/lib/scanner';
import { CodeRetentionPolicy } from '@/lib/retention-policy';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

const EXCLUDE_DIRS = new Set(['node_modules', '.next', '.git', 'dist', '.vite', 'build', '.darlek-backups']);
const EXTENSIONS_TO_INCLUDE = new Set(['.ts', '.tsx', '.js', '.jsx', '.css', '.json', '.html', '.md', '.sql', '.mjs', '.cjs']);

function scanProjectFilesRecursively(dir: string, base = ''): { path: string; content: string }[] {
  let results: { path: string; content: string }[] = [];
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const name = entry.name;
      const fullPath = join(dir, name);
      const relPath = base ? `${base}/${name}` : name;
      if (EXCLUDE_DIRS.has(name) || (name.startsWith('.') && name !== '.gitignore' && name !== '.env.example')) continue;
      if (entry.isDirectory()) {
        results = results.concat(scanProjectFilesRecursively(fullPath, relPath));
      } else if (entry.isFile()) {
        const ext = name.includes('.') ? name.slice(name.lastIndexOf('.')).toLowerCase() : '';
        if (EXTENSIONS_TO_INCLUDE.has(ext) || name === 'package.json' || name === 'README.md') {
          try {
            const content = readFileSync(fullPath, 'utf-8');
            results.push({ path: relPath, content });
          } catch {}
        }
      }
    }
  } catch {}
  return results;
}

interface CustomFilePayload {
  path?: string;
  content?: string;
}

interface PushEnhancementRequestBody {
  token?: string;
  owner?: string;
  repo?: string;
  branch?: string;
  files?: CustomFilePayload[];
}

interface PushDetail {
  file: string;
  success: boolean;
  error?: string;
}

interface GitTreeItem {
  path: string;
  mode: string;
  type: string;
  content: string;
}

/** Pre-cached static GitHub headers template generator */
function createGitHubHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
    'User-Agent': 'Dalek-Cognition-Architecture/1.0',
  };
}

/** Validates owner, repo, and branch identifiers against strict pattern matching to prevent injection */
function validateGitHubIdentifiers(owner?: string, repo?: string, branch?: string): boolean {
  if (!owner || !repo || !branch) return false;
  const safeIdentifierRegex = /^[a-zA-Z0-9_.-]+$/;
  const safeBranchRegex = /^[a-zA-Z0-9_./-]+$/;
  return (
    safeIdentifierRegex.test(owner) &&
    safeIdentifierRegex.test(repo) &&
    safeBranchRegex.test(branch)
  );
}

async function ensureRepositoryExists(
  owner: string,
  repo: string,
  headers: Record<string, string>
): Promise<NextResponse | null> {
  const verifyResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });

  if (verifyResponse.status === 404) {
    const createResponse = await fetch('https://api.github.com/user/repos', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: repo,
        private: false,
        auto_init: true,
      }),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      return NextResponse.json(
        { error: `Failed to auto-create missing repository ${repo}: ${errorText}` },
        { status: 400 }
      );
    }

    await new Promise<void>((resolveTimer) => setTimeout(resolveTimer, 3000));
  }

  return null;
}

async function resolveBranchSha(
  owner: string,
  repo: string,
  branch: string,
  headers: Record<string, string>
): Promise<string | null> {
  const refUrl = `https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${branch}`;
  const refResponse = await fetch(refUrl, { headers });

  if (refResponse.ok) {
    const refData = await refResponse.json();
    return refData.object?.sha ?? null;
  }

  if (refResponse.status === 404) {
    const mainRefUrl = `https://api.github.com/repos/${owner}/${repo}/git/ref/heads/main`;
    const mainRefResponse = await fetch(mainRefUrl, { headers });

    if (mainRefResponse.ok) {
      const mainRefData = await mainRefResponse.json();
      const mainSha: string | undefined = mainRefData.object?.sha;

      if (mainSha) {
        const createRefResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            ref: `refs/heads/${branch}`,
            sha: mainSha,
          }),
        });

        if (createRefResponse.ok) {
          return mainSha;
        }
      }
    }
  }

  return null;
}

async function resolveBaseTreeSha(
  owner: string,
  repo: string,
  refSha: string | null,
  headers: Record<string, string>
): Promise<string | null> {
  if (!refSha) return null;

  const commitUrl = `https://api.github.com/repos/${owner}/${repo}/git/commits/${refSha}`;
  const commitResponse = await fetch(commitUrl, { headers });

  if (commitResponse.ok) {
    const commitData = await commitResponse.json();
    return commitData.tree?.sha ?? null;
  }

  return null;
}

function collectTreeItemsAndDetails(
  files: CustomFilePayload[] | undefined,
  projectRoot: string
): { treeItemsMap: Map<string, GitTreeItem>; pushDetails: PushDetail[] } {
  const treeItemsMap = new Map<string, GitTreeItem>();
  const pushDetails: PushDetail[] = [];

  if (Array.isArray(files) && files.length > 0) {
    for (const customFile of files) {
      if (!customFile?.path || typeof customFile.content !== 'string') continue;
      
      const cleanPath = customFile.path.replace(/^\/+|\/+$/g, '').replace(/\.\./g, '');
      const { sanitized: safeContent } = sanitizeContent(customFile.content);

      try {
        const localPath = resolve(projectRoot, cleanPath);
        if (localPath.startsWith(projectRoot)) {
          const parentDir = dirname(localPath);
          if (!existsSync(parentDir)) {
            mkdirSync(parentDir, { recursive: true });
          }
          writeFileSync(localPath, safeContent, 'utf-8');
        }
      } catch (diskError) {
        console.warn(`[Push Enhancements] Local disk write warning for ${cleanPath}:`, diskError);
      }

      treeItemsMap.set(cleanPath, {
        path: cleanPath,
        mode: '100644',
        type: 'blob',
        content: safeContent,
      });
      pushDetails.push({ file: cleanPath, success: true });
    }
  }

  // If no specific files passed or in addition, scan all workspace source files
  const scanned = scanProjectFilesRecursively(projectRoot);
  for (const item of scanned) {
    if (!treeItemsMap.has(item.path)) {
      const { sanitized: safeContent } = sanitizeContent(item.content);
      treeItemsMap.set(item.path, {
        path: item.path,
        mode: '100644',
        type: 'blob',
        content: safeContent,
      });
      pushDetails.push({ file: item.path, success: true });
    }
  }

  return { treeItemsMap, pushDetails };
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ status: 'online', service: 'GITHUB_PUSH_ENHANCEMENTS_API' });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await safeReqJson(req, {})) as PushEnhancementRequestBody;
    const { token, owner, repo, branch, files } = body;

    if (!token || !owner || !repo || !branch) {
      return NextResponse.json(
        { error: 'All fields required: token, owner, repo, branch' },
        { status: 400 }
      );
    }

    if (!validateGitHubIdentifiers(owner, repo, branch)) {
      return NextResponse.json(
        { error: 'Invalid character sequence detected in repository parameters' },
        { status: 400 }
      );
    }

    const headers = createGitHubHeaders(token);

    const repoErrorResponse = await ensureRepositoryExists(owner, repo, headers);
    if (repoErrorResponse) {
      return repoErrorResponse;
    }

    const [refSha, projectRoot] = await Promise.all([
      resolveBranchSha(owner, repo, branch, headers),
      Promise.resolve(resolve(process.cwd()))
    ]);

    const baseTreeSha = await resolveBaseTreeSha(owner, repo, refSha, headers);
    const { treeItemsMap, pushDetails } = collectTreeItemsAndDetails(files, projectRoot);

    // Enforce retention gate on all files staged for push
    for (const item of treeItemsMap.values()) {
      const auth = await CodeRetentionPolicy.enforceGate({
        repo: `${owner}/${repo}`,
        filePath: item.path,
        content: item.content,
        actor: 'GITHUB_PUSH_ENHANCEMENTS_API',
      });
      if (!auth.authorized) {
        return NextResponse.json(
          { error: `Retention Policy rejected push of file "${item.path}": ${auth.error}` },
          { status: 403 }
        );
      }
    }

    const treeItems = Array.from(treeItemsMap.values());

    const treeItemsLength = treeItems.length;
    if (treeItemsLength === 0) {
      return NextResponse.json({ error: 'No files valid for push' }, { status: 400 });
    }

    const treeBody: { tree: unknown[]; base_tree?: string } = { tree: treeItems };
    if (baseTreeSha) {
      treeBody.base_tree = baseTreeSha;
    }

    const treeResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees`, {
      method: 'POST',
      headers,
      body: JSON.stringify(treeBody),
    });

    if (!treeResponse.ok) {
      const errorMsg = await treeResponse.text();
      return NextResponse.json({ error: `Failed to create active git tree: ${errorMsg}` }, { status: treeResponse.status });
    }

    const treeData = await treeResponse.json();
    const newTreeSha: string = treeData.sha;

    const commitMsg = `[DARLEK CAAN] Deploy State Backup: ${treeItemsLength} core files`;
    const commitBody = {
      message: commitMsg,
      tree: newTreeSha,
      parents: refSha ? [refSha] : [],
    };

    const createCommitResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits`, {
      method: 'POST',
      headers,
      body: JSON.stringify(commitBody),
    });

    if (!createCommitResponse.ok) {
      const errorMsg = await createCommitResponse.text();
      return NextResponse.json({ error: `Failed to synthesize git commit: ${errorMsg}` }, { status: createCommitResponse.status });
    }

    const createdCommitData = await createCommitResponse.json();
    const newCommitSha: string = createdCommitData.sha;

    const updateRefResponse = refSha
      ? await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ sha: newCommitSha, force: false }),
        })
      : await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: newCommitSha }),
        });

    if (!updateRefResponse.ok) {
      const errorMsg = await updateRefResponse.text();
      return NextResponse.json(
        { error: `Failed to update head reference of branch ${branch}: ${errorMsg}` },
        { status: updateRefResponse.status }
      );
    }

    const failedCount = pushDetails.filter((detail) => !detail.success).length;

    return NextResponse.json({
      success: true,
      pushed: treeItemsLength,
      failed: failedCount,
      total: ENHANCEMENT_FILES.length,
      commitSha: newCommitSha,
      summary: `${treeItemsLength}/${ENHANCEMENT_FILES.length} active system files securely backup-committed to ${owner}/${repo}@${branch} under single commit: ${newCommitSha.slice(
        0,
        7
      )}`,
      results: pushDetails,
    });
  } catch (error: unknown) {
    console.error('Push enhancements error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

