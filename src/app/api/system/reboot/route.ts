/* DARLEK CAAN RAG SYNTHESIS - Autonomous Generation G-103 [2026-09-20T05:45:07.801Z] */
/**
 * DARLEK CANN ARCHITECTURAL HEADER
 * File: src/app/api/system/reboot/route.ts
 * Role: Core system component participating in autonomous cognitive evolution cycles.
 * Architecture: Type-safe modular unit with resilient state interfaces.
 */

import { NextRequest, NextResponse } from '@/lib/next-mock';
import { promises as fs } from 'fs';
import path from 'path';
import { db } from '@/lib/db';
import { safeReqJson } from '@/lib/safe-json';

export const maxDuration: number = 120;
export const dynamic: string = 'force-dynamic';

export interface RebootFileResult {
  file: string;
  status: 'updated' | 'skipped' | 'error';
  backup?: string;
  error?: string;
}

export interface RebootRequestBody {
  token?: string;
  owner?: string;
  repo?: string;
  branch?: string;
  sessionId?: string;
}

interface GitHubTreeItem {
  type: string;
  path: string;
}

interface GitHubTreeResponse {
  tree?: GitHubTreeItem[];
}

interface GitHubContentResponse {
  encoding?: string;
  content?: string;
}

const ALLOWED_ROOT_FILES: ReadonlySet<string> = new Set([
  'package.json',
  'next.config.ts',
  'next.config.js',
  'next.config.mjs',
  'tsconfig.json',
  'tailwind.config.ts',
  'tailwind.config.js',
  'postcss.config.js',
  'postcss.config.mjs',
  '.eslintrc.json',
  '.eslintrc.js',
]);

const SOURCE_EXTENSIONS: ReadonlySet<string> = new Set(['.ts', '.tsx', '.js', '.jsx', '.css', '.json', '.html']);
const RATE_LIMIT_DELAY_MS: number = 300;
const FETCH_TIMEOUT_MS: number = 8000;

function isAllowedFile(filePath: string): boolean {
  return filePath.startsWith('src/') || filePath.startsWith('public/') || ALLOWED_ROOT_FILES.has(filePath);
}

function createGitHubHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
  };
}

async function fetchSessionMutations(sessionId: string): Promise<string[]> {
  try {
    const mutations = await db.mutationHistory.findMany({
      where: { sessionId, status: 'applied' },
      orderBy: { createdAt: 'desc' },
      select: { filePath: true },
    });
    return mutations.map((mutation: { filePath: string }) => mutation.filePath);
  } catch {
    return [];
  }
}

function isValidSourcePath(filePath: string): boolean {
  if (
    filePath.includes('node_modules/') ||
    filePath.includes('.next/') ||
    filePath.includes('.git/')
  ) {
    return false;
  }

  const extension = path.extname(filePath).toLowerCase();
  if (SOURCE_EXTENSIONS.has(extension)) {
    return true;
  }

  return (
    filePath.startsWith('next.config.') ||
    filePath === 'package.json' ||
    filePath === 'tsconfig.json' ||
    filePath.startsWith('tailwind.config.') ||
    filePath.startsWith('postcss.config.') ||
    filePath.startsWith('.eslintrc.')
  );
}

async function fetchRepositoryTreeSources(
  owner: string,
  repo: string,
  branch: string,
  token: string
): Promise<string[]> {
  const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`;
  const response = await fetch(treeUrl, { headers: createGitHubHeaders(token) });

  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as GitHubTreeResponse;
  const treeItems = data.tree;
  if (!treeItems) {
    return [];
  }

  return treeItems
    .filter((item: GitHubTreeItem) => item.type === 'blob' && isValidSourcePath(item.path))
    .map((item: GitHubTreeItem) => item.path);
}

async function createTimestampedBackupDir(projectRoot: string): Promise<{ backupDir: string; timestamp: string }> {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const backupDir = path.join(projectRoot, '.darleK-backups', `pre-reboot-${timestamp}`);
  await fs.mkdir(backupDir, { recursive: true });
  return { backupDir, timestamp };
}

async function fetchGitHubFileContent(
  owner: string,
  repo: string,
  filePath: string,
  branch: string,
  token: string
): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const fileUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath)}?ref=${encodeURIComponent(branch)}`;

    const response = await fetch(fileUrl, {
      headers: createGitHubHeaders(token),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`GitHub API returned status ${response.status}`);
    }

    const fileData = (await response.json()) as GitHubContentResponse;
    if (fileData.encoding !== 'base64' || !fileData.content) {
      throw new Error('Retrieved file content is empty or uses an unsupported encoding');
    }

    return Buffer.from(fileData.content, 'base64').toString('utf-8');
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ status: 'online', service: 'SYSTEM_REBOOT_API' });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await safeReqJson(req, {})) as RebootRequestBody;
    const { token, owner, repo, branch, sessionId } = body;

    if (!token || !owner || !repo || !branch) {
      return NextResponse.json(
        { error: 'Missing required configuration: token, owner, repo, and branch are mandatory.' },
        { status: 400 }
      );
    }

    let mutatedFiles: string[] = sessionId ? await fetchSessionMutations(sessionId) : [];

    if (mutatedFiles.length === 0) {
      mutatedFiles = await fetchRepositoryTreeSources(owner, repo, branch, token);
    }

    if (mutatedFiles.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No files to reboot — no mutations or repository sources found.',
        results: [],
        total: 0,
        updated: 0,
        failed: 0,
      });
    }

    const projectRoot: string = process.cwd();
    const { backupDir, timestamp } = await createTimestampedBackupDir(projectRoot);

    const results: RebootFileResult[] = [];
    let updatedCount: number = 0;
    let failedCount: number = 0;
    let skippedCount: number = 0;

    for (const [index, filePath] of mutatedFiles.entries()) {
      if (!isAllowedFile(filePath)) {
        results.push({ file: filePath, status: 'skipped' });
        skippedCount++;
        continue;
      }

      try {
        if (index > 0) {
          await new Promise<void>((resolve: () => void) => setTimeout(resolve, RATE_LIMIT_DELAY_MS));
        }

        const [newContent, fileExistsInfo] = await Promise.all([
          fetchGitHubFileContent(owner, repo, filePath, branch, token),
          fs.stat(path.join(projectRoot, filePath)).then(() => true).catch(() => false)
        ]);

        const localPath = path.join(projectRoot, filePath);

        if (fileExistsInfo) {
          const backupPath = path.join(backupDir, filePath);
          await fs.mkdir(path.dirname(backupPath), { recursive: true });
          
          const [existingContent] = await Promise.all([
            fs.readFile(localPath, 'utf-8'),
            fs.copyFile(localPath, backupPath)
          ]);

          if (existingContent === newContent) {
            results.push({ file: filePath, status: 'skipped', backup: backupPath });
            skippedCount++;
            continue;
          }
        }

        await fs.mkdir(path.dirname(localPath), { recursive: true });
        await fs.writeFile(localPath, newContent, 'utf-8');
        updatedCount++;

        results.push({ file: filePath, status: 'updated' });
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error encountered';
        results.push({ file: filePath, status: 'error', error: errorMessage });
        failedCount++;
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Reboot complete. ${updatedCount} files updated, ${skippedCount} skipped, ${failedCount} failed.`,
      results,
      total: mutatedFiles.length,
      updated: updatedCount,
      failed: failedCount,
      backupDir: `.darleK-backups/pre-reboot-${timestamp}`,
    });
  } catch (error: unknown) {
    console.error('System reboot encountered an unhandled error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
