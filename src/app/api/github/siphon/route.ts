/**
 * FREE THINKER - REPOSITORY SIPHON API ENDPOINT
 * Autonomously searches, inspects, and siphons files from any GitHub repository.
 */

import { NextRequest, NextResponse } from '@/lib/next-mock';
import { safeReqJson } from '@/lib/safe-json';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

interface SiphonRequestBody {
  token?: string;
  repoUrlOrName?: string;
  query?: string;
  category?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await safeReqJson(req, {})) as SiphonRequestBody;
    const { token, repoUrlOrName, query, category } = body;

    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Free-Thinker-Autonomous-Siphon/1.0',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let targetOwner = '';
    let targetRepo = '';

    // If query provided without specific repo, search GitHub for the best matching repository
    if (query && !repoUrlOrName) {
      const searchUrl = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}+stars:>10&sort=stars&order=desc&per_page=5`;
      const searchRes = await fetch(searchUrl, { headers });
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (searchData.items && searchData.items.length > 0) {
          const best = searchData.items[0];
          targetOwner = best.owner.login;
          targetRepo = best.name;
        }
      }
    }

    // If direct repoUrlOrName provided (e.g. "facebook/react" or "https://github.com/owner/repo")
    if (repoUrlOrName) {
      let clean = repoUrlOrName.trim();
      if (clean.startsWith('https://github.com/')) {
        clean = clean.replace('https://github.com/', '');
      }
      clean = clean.replace(/^\/+|\/+$/g, '').replace(/\.git$/, '');
      const parts = clean.split('/');
      if (parts.length >= 2) {
        targetOwner = parts[0];
        targetRepo = parts[1];
      }
    }

    if (!targetOwner || !targetRepo) {
      targetOwner = 'craighckby-stack';
      targetRepo = 'Free-Thinker';
    }

    // Fetch repository metadata
    const repoRes = await fetch(`https://api.github.com/repos/${targetOwner}/${targetRepo}`, { headers });
    let repoData: any = {};
    if (repoRes.ok) {
      repoData = await repoRes.json();
    }

    const defaultBranch = repoData.default_branch || 'main';

    // Fetch repository Git tree
    const treeRes = await fetch(`https://api.github.com/repos/${targetOwner}/${targetRepo}/git/trees/${defaultBranch}?recursive=1`, { headers });
    let treeData: any = { tree: [] };
    if (treeRes.ok) {
      treeData = await treeRes.json();
    }

    const files = (treeData.tree || []).filter((item: any) =>
      item.type === 'blob' &&
      /\.(ts|tsx|js|jsx|py|rs|go|json|css|md)$/i.test(item.path) &&
      !['node_modules', 'dist', '.git', 'build', '.next'].some(d => item.path.includes(d))
    );

    // Pick top high-value files to siphon (algorithms, core, utils, models, hooks)
    const prioritized = files.filter((f: any) => {
      const p = f.path.toLowerCase();
      return ['core', 'lib', 'util', 'algorithm', 'model', 'agent', 'engine', 'hook', 'service'].some(k => p.includes(k));
    });

    const candidateFiles = prioritized.length > 0 ? prioritized.slice(0, 5) : files.slice(0, 5);

    // Fetch file contents in parallel
    const siphonedFiles = await Promise.all(
      candidateFiles.map(async (file: any) => {
        try {
          const contentRes = await fetch(`https://api.github.com/repos/${targetOwner}/${targetRepo}/contents/${file.path}?ref=${defaultBranch}`, { headers });
          if (!contentRes.ok) return null;
          const contentData = await contentRes.json();
          if (!contentData.content) return null;

          const rawCode = Buffer.from(contentData.content, 'base64').toString('utf8');
          return {
            path: file.path,
            description: `Siphoned module: ${file.path} (${(rawCode.length / 1024).toFixed(1)} KB)`,
            codeSnippet: rawCode.slice(0, 8000),
            extractedAt: new Date().toISOString(),
          };
        } catch {
          return null;
        }
      })
    );

    const validSiphoned = siphonedFiles.filter(Boolean);

    const result = {
      id: `siphon_${Date.now()}`,
      fullName: `${targetOwner}/${targetRepo}`,
      owner: targetOwner,
      repo: targetRepo,
      description: repoData.description || 'Siphoned repository intelligence',
      stars: repoData.stargazers_count || 0,
      language: repoData.language || 'TypeScript',
      category: category || 'architecture',
      siphonedFiles: validSiphoned,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      siphonedRepo: result,
      message: `Successfully siphoned ${validSiphoned.length} modules from ${targetOwner}/${targetRepo}`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to siphon repository' },
      { status: 500 }
    );
  }
}
