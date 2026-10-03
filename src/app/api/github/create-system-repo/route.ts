/* DARLEK CAAN RAG SYNTHESIS - Autonomous Generation G-92 [2026-09-20T05:41:00.564Z] */
/**
 * DARLEK CANN ARCHITECTURAL HEADER
 * File: src/app/api/github/create-system-repo/route.ts
 * Role: Core system component participating in autonomous cognitive evolution cycles.
 * Architecture: Type-safe modular unit with resilient state interfaces.
 */

import { NextRequest, NextResponse } from '@/lib/next-mock';
import { callGemini } from '@/lib/gemini';
import { getDefaultGeminiKey } from '@/lib/llm-provider';
import { safeReqJson } from '@/lib/safe-json';
import { sanitizeContent } from '@/lib/scanner';

export const maxDuration = 300;

interface RepositoryFile {
  path: string;
  content: string;
}

interface CompilationOutput {
  files: RepositoryFile[];
}

interface RequestBody {
  token?: string;
  repoName?: string;
  description?: string;
  blueprintName?: string;
  blueprintContent?: string;
  prompt?: string;
  apiKeys?: {
    gemini?: string;
  };
}

const SYSTEM_PROMPT = `You are DALEK CAAN's Deep System Compiler.
Your function is to strictly focus on code enhancement and extension for this specific repository. Read the user specification/blueprint document, analyze it rigorously, and synthesize a COMPLETE, highly-polished, fully-functional code enhancement.
You must output a raw, parseable JSON object satisfying the structured JSON schema.

For extreme efficiency, generate highly-polished, high-density, and concise code. Rely on expressive, elegant Tailwind classes.

IMPORTANT: DO NOT generate just a generic 5-file template. You MUST generate the FULL system as defined in the blueprint, breaking the code down into logical files.
Generate all necessary files including:
1. "package.json": include all necessary React/Next.js dependencies, with "license": "CC-BY-NC-SA-4.0" and "author": "Craighckby".
2. "README.md": detailing the design specs, system flow, and CC BY-NC-SA 4.0 Copyright (c) 2026 Craighckby.
3. "LICENSE": Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0) [Full text of the license is available at https://creativecommons.org], Copyright (c) 2026 Craighckby.
4. "src/app/globals.css": styles with absolute minimal lines (@import "tailwindcss";).
5. "src/app/layout.tsx": RootLayout.
6. "src/app/page.tsx": the primary workspace interface, importing necessary components.
7. "src/components/...": All necessary UI components, charts, layout sections.
8. "src/lib/...": Utilities, types, constants.
9. "src/app/api/...": Any necessary Next.js backend API routes for the logic described.

- Use a stunning dark-mode futuristic sci-fi aesthetic ("Dalek Caan Cyber slate" or elegant off-black with glowing blue/neon-cyan details, soft shadows, and deep red highlights).
- Replace any mock simulations with REAL logic or fully implemented mock data functions that behave realistically.
- State management: Use robust hooks or context to manage records.
- Be incredibly thorough. The code must be 100% syntactically valid TypeScript, compilation-ready, with no truncation, no comments like "implement here", and no syntax errors. EXTERMINATE all lazy placeholders!`;

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    files: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          path: { type: 'STRING' },
          content: { type: 'STRING' },
        },
        required: ['path', 'content'],
      },
    },
  },
  required: ['files'],
};

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ status: 'online', service: 'GITHUB_CREATE_SYSTEM_REPO_API' });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await safeReqJson(req, {})) as RequestBody;
    const { token, repoName, description, blueprintName, blueprintContent, prompt, apiKeys } = body;

    if (!token || !repoName) {
      return NextResponse.json({ error: 'GitHub Token and Repository Name are required.' }, { status: 400 });
    }

    const geminiKey = (apiKeys?.gemini || getDefaultGeminiKey() || '').trim();

    const owner = await validateGitHubTokenAndGetOwner(token);
    if (!owner) {
      return NextResponse.json({ error: 'GitHub Token validation failed.' }, { status: 401 });
    }

    const userPrompt = buildUserPrompt({ repoName, description, blueprintName, blueprintContent, prompt });
    const { compilation, useDeterministicFallback } = await compileBlueprintToFiles({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
      geminiKey,
      repoName,
      description,
      blueprintName,
      blueprintContent,
    });

    if (blueprintContent) {
      upsertReadmeContent(compilation.files, blueprintContent);
    }

    const defaultBranch = await ensureGitHubRepositoryExists({ token, owner, repoName, description, blueprintName });
    await delay(1000);

    // Ensure LICENSE file is credited and created under CC BY-NC-SA 4.0 for Craighckby
    const hasLicense = compilation.files.some(
      (f) => f.path.toLowerCase() === 'license' || f.path.toLowerCase() === 'license.md'
    );
    if (!hasLicense) {
      compilation.files.push({
        path: 'LICENSE',
        content: `Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)\n[Full text of the license is available at https://creativecommons.org]\n\nCopyright (c) 2026 Craighckby\n\nBy exercising the Licensed Rights, You accept and agree to be bound by the terms and conditions of this Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International Public License.\n\n- Attribution: Credit Copyright (c) 2026 Craighckby.\n- NonCommercial: No commercial use without prior explicit permission.\n- ShareAlike: Remixes/adaptations must be distributed under the same license.\n`,
      });
    }

    const { pushedFiles, failedFiles } = await pushFilesToGitHub({ token, owner, repoName, defaultBranch, files: compilation.files });

    return NextResponse.json({
      success: true,
      repoName,
      repoUrl: `https://github.com/${owner}/${repoName}`,
      fullName: `${owner}/${repoName}`,
      pushedFiles,
      failedFiles,
      totalFiles: compilation.files.length,
      fallbackUsed: useDeterministicFallback,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown local compilation error';
    console.error('Create system repo error:', error);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

async function validateGitHubTokenAndGetOwner(token: string): Promise<string | null> {
  const userRes = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!userRes.ok) return null;
  const userData = await userRes.json();
  return userData.login || null;
}

interface UserPromptOptions {
  repoName?: string | undefined;
  description?: string | undefined;
  blueprintName?: string | undefined;
  blueprintContent?: string | undefined;
  prompt?: string | undefined;
}

function buildUserPrompt({ repoName, description, blueprintName, blueprintContent, prompt }: UserPromptOptions): string {
  return `System/Repository Name: ${repoName}
Description: ${description || 'No description provided'}
Attached Specification Document: "${blueprintName || 'None'}"
Document Content:
"""
${blueprintContent || 'No document content provided.'}
"""

User Extra Customization Instructions:
"${prompt || 'Compile the blueprint directly with absolute fidelity.'}"

Synthesize the files JSON structure now. Remember, output ONLY valid raw JSON with exact {"files": [...]} signature representing the compiled Next.js structure. Write dense, beautiful, clean code with zero redundant boilerplate to stay perfectly compact.`;
}

interface CompileBlueprintParams extends UserPromptOptions {
  systemPrompt: string;
  userPrompt: string;
  geminiKey: string;
}

async function compileBlueprintToFiles(params: CompileBlueprintParams): Promise<{ compilation: CompilationOutput; useDeterministicFallback: boolean }> {
  let generatedText: string | null = null;
  let useDeterministicFallback = false;

  if (!params.geminiKey) {
    useDeterministicFallback = true;
  } else {
    try {
      generatedText = await callGemini(params.systemPrompt, params.userPrompt, params.geminiKey, {
        maxTokens: 8192,
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA,
      });

      if (!generatedText) {
        generatedText = await callGemini(params.systemPrompt, params.userPrompt, params.geminiKey, {
          maxTokens: 8192,
          temperature: 0.2,
          responseMimeType: 'application/json',
        });
      }
    } catch (geminiError: unknown) {
      const errorMessage = geminiError instanceof Error ? geminiError.message : String(geminiError);
      console.warn('[Create repo] Gemini call failed, using deterministic fallback structure:', errorMessage);
      useDeterministicFallback = true;
    }

    if (!generatedText || !generatedText.trim()) {
      console.warn('[Create repo] Gemini API returned empty compilation output. Activating deterministic fallback structure.');
      useDeterministicFallback = true;
    }
  }

  let compilation: CompilationOutput;
  if (useDeterministicFallback) {
    compilation = generateDeterministicFallbackStructure(
      params.repoName || 'untitled-system',
      params.description || '',
      params.blueprintName || '',
      params.blueprintContent || ''
    );
  } else {
    generatedText = (generatedText || '').trim();
    try {
      compilation = parseCompilationJson(generatedText);
    } catch (parseErr: unknown) {
      console.warn('Failed to parse compiled JSON directly, trying regex extraction. Raw text was:', generatedText.slice(0, 300));
      const jsonMatch = generatedText.match(/{[\s\S]*}/);
      if (jsonMatch) {
        try {
          compilation = parseCompilationJson(jsonMatch[0]);
        } catch (matchErr: unknown) {
          console.warn('[Create repo] JSON match parse failed, activating deterministic fallback structure:', matchErr);
          useDeterministicFallback = true;
          compilation = generateDeterministicFallbackStructure(
            params.repoName || 'untitled-system',
            params.description || '',
            params.blueprintName || '',
            params.blueprintContent || ''
          );
        }
      } else {
        console.warn('[Create repo] No JSON found in output, activating deterministic fallback structure:', parseErr);
        useDeterministicFallback = true;
        compilation = generateDeterministicFallbackStructure(
          params.repoName || 'untitled-system',
          params.description || '',
          params.blueprintName || '',
          params.blueprintContent || ''
        );
      }
    }
  }

  if (!compilation || !compilation.files || !Array.isArray(compilation.files) || compilation.files.length === 0) {
    console.warn('[Create repo] Compilation output missing files array, activating deterministic fallback structure.');
    useDeterministicFallback = true;
    compilation = generateDeterministicFallbackStructure(
      params.repoName || 'untitled-system',
      params.description || '',
      params.blueprintName || '',
      params.blueprintContent || ''
    );
  }

  return { compilation, useDeterministicFallback };
}

function parseCompilationJson(str: string): CompilationOutput {
  let repaired = '';
  let inString = false;
  let escape = false;
  const stack: ('{' | '[')[] = [];

  for (let i = 0; i < str.length; i++) {
    const char = str[i];

    if (escape) {
      repaired += char;
      escape = false;
      continue;
    }

    if (char === '\\') {
      repaired += char;
      if (inString) escape = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      repaired += char;
      continue;
    }

    if (inString) {
      if (char === '\n') repaired += '\\n';
      else if (char === '\r') repaired += '\\r';
      else repaired += char;
    } else {
      repaired += char;
      if (char === '{' || char === '[') {
        stack.push(char);
      } else if (char === '}') {
        if (stack[stack.length - 1] === '{') stack.pop();
      } else if (char === ']') {
        if (stack[stack.length - 1] === '[') stack.pop();
      }
    }
  }

  if (inString) repaired += '"';
  repaired = repaired.trimEnd();

  if (repaired.endsWith(',')) {
    repaired = repaired.slice(0, -1).trimEnd();
  } else if (repaired.endsWith(':')) {
    repaired += ' ""';
  }

  while (stack.length > 0) {
    const last = stack.pop();
    repaired += last === '{' ? '}' : ']';
  }

  return JSON.parse(repaired) as CompilationOutput;
}

function upsertReadmeContent(files: RepositoryFile[], blueprintContent: string): void {
  const existing = files.find((f) => f.path.toLowerCase() === 'readme.md');
  if (existing) {
    existing.content = blueprintContent;
  } else {
    files.push({ path: 'README.md', content: blueprintContent });
  }
}

interface EnsureRepoParams {
  token: string;
  owner: string;
  repoName: string;
  description?: string | undefined;
  blueprintName?: string | undefined;
}

async function ensureGitHubRepositoryExists({ token, owner, repoName, description, blueprintName }: EnsureRepoParams): Promise<string> {
  const existingCheck = await fetch(`https://api.github.com/repos/${owner}/${encodeURIComponent(repoName)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!existingCheck.ok) {
    const createRes = await fetch('https://api.github.com/user/repos', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: repoName,
        description: description || `Compiled with Dalek Caan Cognitive Evolution Engine based on "${blueprintName || 'Custom'}" blueprint`,
        auto_init: true,
        private: false,
      }),
    });

    if (!createRes.ok) {
      const errData = (await createRes.json().catch(() => ({}))) as { message?: string };
      throw new Error(`Failed to create repository on GitHub: ${errData.message || createRes.statusText}`);
    }
    return 'main';
  }

  const repoData = (await existingCheck.json()) as { default_branch?: string };
  return repoData.default_branch || 'main';
}

interface PushFilesParams {
  token: string;
  owner: string;
  repoName: string;
  defaultBranch: string;
  files: RepositoryFile[];
}

async function pushFilesToGitHub({ token, owner, repoName, defaultBranch, files }: PushFilesParams): Promise<{ pushedFiles: string[]; failedFiles: Array<{ file: string; error: string }> }> {
  const pushedFiles: string[] = [];
  const failedFiles: Array<{ file: string; error: string }> = [];

  for (const file of files) {
    try {
      const { sanitized: safeContent } = sanitizeContent(file.content || '');
      const base64Content = Buffer.from(safeContent, 'utf-8').toString('base64');
      const encodedPath = file.path.split('/').map(encodeURIComponent).join('/');

      const fileCheckUrl = `https://api.github.com/repos/${owner}/${encodeURIComponent(repoName)}/contents/${encodedPath}?ref=${defaultBranch}`;
      const checkRes = await fetch(fileCheckUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      let fileSha: string | undefined;
      if (checkRes.ok) {
        const checkData = (await checkRes.json()) as { sha?: string };
        fileSha = checkData.sha;
      }

      const putBody: {
        message: string;
        content: string;
        branch: string;
        sha?: string;
      } = {
        message: `[DALEK CAAN COMPILER] Spawn spec file: ${file.path}`,
        content: base64Content,
        branch: defaultBranch,
      };

      if (fileSha) {
        putBody.sha = fileSha;
      }

      const putRes = await fetch(`https://api.github.com/repos/${owner}/${encodeURIComponent(repoName)}/contents/${encodedPath}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(putBody),
      });

      if (putRes.ok) {
        pushedFiles.push(file.path);
      } else {
        const errText = await putRes.text();
        failedFiles.push({ file: file.path, error: errText });
      }
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : 'Unknown write error';
      failedFiles.push({ file: file.path, error: errMessage });
    }
    await delay(200);
  }

  return { pushedFiles, failedFiles };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function generateDeterministicFallbackStructure(
  repoName: string,
  description: string,
  blueprintName: string,
  blueprintContent: string
): CompilationOutput {
  const packageJson = JSON.stringify(
    {
      name: repoName.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      version: '1.0.0',
      private: true,
      license: 'CC-BY-NC-SA-4.0',
      author: 'Craighckby',
      scripts: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
        lint: 'next lint',
      },
      dependencies: {
        next: '15.1.0',
        react: '19.0.0',
        'react-dom': '19.0.0',
        'framer-motion': '^11.11.11',
        'lucide-react': '^0.468.0',
        recharts: '^2.15.0',
        clsx: '^2.1.1',
        'tailwind-merge': '^2.5.5',
      },
      devDependencies: {
        typescript: '^5.0.0',
        '@types/node': '^20.0.0',
        '@types/react': '^19.0.0',
        '@types/react-dom': '^19.0.0',
        postcss: '^8.0.0',
        tailwindcss: '4.0.0-alpha.31',
      },
    },
    null,
    2
  );

  const readmeMd = `# ${repoName}

${description || 'System compiled and optimized under Dalek Caan control.'}

## Specifications
- **Blueprint file**: ${blueprintName || 'None'}
- **Framework**: Next.js 15 with Tailwind CSS
- **Interactions**: Autonomous Evolution Interface enabled

## Quick Start
\`\`\`bash
npm install
npm run dev
\`\`\``;

  const globalsCss = `@import "tailwindcss";
@import "tw-animate-css";`;

  const layoutTsx = `'use client';

import React from 'react';
import './globals.css';

export const dynamic = 'force-dynamic';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#050811] text-white min-h-screen">{children}</body>
    </html>
  );
}`;

  const safeDesc = (description || 'Autonomous cognitive system scaffolded under Dalek Caan architecture.').replace(/["`\\]/g, ' ');
  const safeBlueprint = (blueprintContent || 'Autonomous Next.js system ready for continuous mutation and cognitive evolution.').slice(0, 2000).replace(/["`\\]/g, ' ');

  const pageTsx = `'use client';

import React from 'react';
import { Terminal, Shield, Activity, Cpu } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#050811] text-gray-100 font-sans p-6 sm:p-12">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="border-b border-cyan-500/20 pb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-widest">
              <Cpu className="w-4 h-4 animate-pulse" />
              <span>DALEK CAAN // AUTONOMOUS ARCHITECTURE</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mt-1">
              ${repoName.toUpperCase()}
            </h1>
            <p className="text-gray-400 text-sm mt-1 max-w-2xl">
              ${safeDesc}
            </p>
          </div>
          <div className="px-3 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 font-mono text-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>OPERATIONAL // ONLINE</span>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#0a0f1d] border border-white/10 rounded-xl p-5 space-y-2">
            <div className="flex items-center gap-2 text-cyan-400">
              <Terminal className="w-4 h-4" />
              <h2 className="text-sm font-semibold uppercase tracking-wider font-mono">SPECIFICATION</h2>
            </div>
            <p className="text-xs text-gray-300 font-mono">
              ${blueprintName || 'Active Parameter Spec'}
            </p>
          </div>

          <div className="bg-[#0a0f1d] border border-white/10 rounded-xl p-5 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400">
              <Shield className="w-4 h-4" />
              <h2 className="text-sm font-semibold uppercase tracking-wider font-mono">LICENSE &amp; AUTHOR</h2>
            </div>
            <p className="text-xs text-gray-300 font-mono">
              CC BY-NC-SA 4.0 // Craighckby
            </p>
          </div>

          <div className="bg-[#0a0f1d] border border-white/10 rounded-xl p-5 space-y-2">
            <div className="flex items-center gap-2 text-indigo-400">
              <Activity className="w-4 h-4" />
              <h2 className="text-sm font-semibold uppercase tracking-wider font-mono">EVOLUTION PIPELINE</h2>
            </div>
            <p className="text-xs text-gray-300 font-mono">
              Ready for RAG Brain Mutation &amp; Autonomous Evolution
            </p>
          </div>
        </section>

        <section className="bg-[#080d1a] border border-white/10 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
            <span className="text-cyan-400">&gt;</span> Blueprinted Architecture Details
          </h2>
          <div className="bg-black/60 border border-white/5 rounded-lg p-4 font-mono text-xs text-gray-300 whitespace-pre-wrap max-h-80 overflow-y-auto">
            {\`${safeBlueprint}\`}
          </div>
        </section>
      </div>
    </main>
  );
}`;

  return {
    files: [
      { path: 'package.json', content: packageJson },
      { path: 'README.md', content: blueprintContent || readmeMd },
      {
        path: 'LICENSE',
        content: `Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)\n[Full text of the license is available at https://creativecommons.org]\n\nCopyright (c) 2026 Craighckby\n`,
      },
      { path: 'src/app/globals.css', content: globalsCss },
      { path: 'src/app/layout.tsx', content: layoutTsx },
      { path: 'src/app/page.tsx', content: pageTsx },
    ],
  };
}

