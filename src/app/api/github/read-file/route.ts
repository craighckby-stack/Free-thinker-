/* DARLEK CAAN RAG SYNTHESIS - Autonomous Generation G-95 [2026-09-20T05:42:08.796Z] */
/**
 * DARLEK CANN ARCHITECTURAL HEADER
 * File: src/app/api/github/read-file/route.ts
 * Role: Core system component participating in autonomous cognitive evolution cycles.
 * Architecture: Type-safe modular unit with resilient state interfaces.
 */

import { NextRequest, NextResponse } from '@/lib/next-mock';
import type { ReadFileBody } from '@/lib/types';
import { safeReqJson } from '@/lib/safe-json';

export const dynamic = 'force-dynamic';

const TIMEOUT_CONFIG = {
  DEFAULT: 15000,
  HEAD: 10000,
  RAW: 20000,
} as const;

const LARGE_FILE_THRESHOLD_BYTES = 1_000_000;

interface GitHubContentResponse {
  sha: string;
  name: string;
  size: number;
  encoding?: string;
  content?: string;
  type?: string;
}

interface ParsedFileResult {
  content: string;
  sha: string;
  name: string;
  size: number;
}

/**
 * Executes a network fetch request with an enforced timeout via AbortController.
 */
async function fetchWithTimeout(
  url: string,
  options: Omit<RequestInit, 'signal'>,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Generates standardized authorization and media type headers for GitHub API requests.
 */
function createGitHubHeaders(token: string, acceptType: 'json' | 'raw'): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: acceptType === 'json' ? 'application/vnd.github.v3+json' : 'application/vnd.github.v3.raw',
    'User-Agent': 'Dalek-Cognition-Architecture/1.0',
  };
}

/**
 * Fetches raw file content text with dedicated timeout and error handling.
 */
async function fetchRawFileContent(url: string, token: string): Promise<string> {
  const rawResponse = await fetchWithTimeout(
    url,
    { headers: createGitHubHeaders(token, 'raw') },
    TIMEOUT_CONFIG.RAW
  );

  if (!rawResponse.ok) {
    const errorText = await rawResponse.text();
    throw new Error(`Raw content read failed (${rawResponse.status}): ${errorText}`);
  }

  return rawResponse.text();
}

/**
 * Attempts to parse specialized document formats (PDF, DOCX) using optional buffers.
 */
async function parseSpecializedDocument(
  buffer: Buffer,
  filePath: string,
  baseMetadata: Omit<ParsedFileResult, 'content'>
): Promise<ParsedFileResult> {
  const lowerPath = filePath.toLowerCase();

  try {
    if (lowerPath.endsWith('.pdf')) {
      const pdfParseModule = await import('pdf-parse');
      type PdfParserFn = (buf: Buffer) => Promise<{ text: string }>;
      const pdfParse: PdfParserFn = typeof pdfParseModule === 'function'
        ? (pdfParseModule as unknown as PdfParserFn)
        : ((pdfParseModule as { default?: PdfParserFn }).default ?? (pdfParseModule as unknown as PdfParserFn));
      const pdfData = await pdfParse(buffer);
      
      return {
        ...baseMetadata,
        content: `[PDF CONTENT EXTRACTED]\n\n${pdfData.text}`,
      };
    }

    if (lowerPath.endsWith('.docx')) {
      const mammothModule = await import('mammoth');
      const mammoth = (mammothModule as { default?: { extractRawText: (opts: { buffer: Buffer }) => Promise<{ value: string }> } }).default ?? mammothModule;
      const docxData = await mammoth.extractRawText({ buffer });

      return {
        ...baseMetadata,
        content: `[DOCX CONTENT EXTRACTED]\n\n${docxData.value}`,
      };
    }

    if (lowerPath.endsWith('.zip')) {
      return {
        ...baseMetadata,
        content: '[ZIP FILE - CANNOT EXTRACT TEXT DIRECTLY]',
      };
    }
  } catch (parseError: unknown) {
    const errorMsg = parseError instanceof Error ? parseError.message : 'Unknown parsing error';
    console.error('Failed to parse binary document:', parseError);
    return {
      ...baseMetadata,
      content: `[ERROR PARSING DOCUMENT: ${errorMsg}]`,
    };
  }

  return {
    ...baseMetadata,
    content: buffer.toString('utf-8'),
  };
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ status: 'online', service: 'GITHUB_READ_FILE_API' });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body: ReadFileBody = await safeReqJson(req, {} as ReadFileBody);
    const { token, owner, repo, branch, path: filePath } = body;

    if (!token || !owner || !repo || !branch || !filePath) {
      return NextResponse.json(
        { error: 'Missing required parameters: token, owner, repo, branch, or path.' },
        { status: 400 }
      );
    }

    const cleanPath = filePath.replace(/^\/+|\/+$/g, '');
    const encodedPath = cleanPath.split('/').map(encodeURIComponent).join('/');
    const fileUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${encodedPath}?ref=${encodeURIComponent(branch)}`;

    const standardHeaders = createGitHubHeaders(token, 'json');

    // 1. Initial metadata fetch
    let metadataResponse: Response;
    try {
      metadataResponse = await fetchWithTimeout(fileUrl, { headers: standardHeaders }, TIMEOUT_CONFIG.DEFAULT);
    } catch (fetchError: unknown) {
      const errorMsg = fetchError instanceof Error ? fetchError.message : 'Network timeout or failure';
      return NextResponse.json({ error: `GitHub API connection failed: ${errorMsg}` }, { status: 504 });
    }

    // 2. Handle HTTP 403 (Rate limiting or large file restrictions requiring HEAD/RAW fallback)
    if (metadataResponse.status === 403) {
      let headResponse: Response | null = null;
      try {
        headResponse = await fetchWithTimeout(fileUrl, { method: 'HEAD', headers: standardHeaders }, TIMEOUT_CONFIG.HEAD);
      } catch {
        // Fallback gracefully if HEAD request fails
      }

      const etag = headResponse?.headers.get('etag');
      const sha = etag ? etag.replace(/W\//, '').replace(/"/g, '') : '';
      const size = parseInt(headResponse?.headers.get('content-length') || '0', 10);

      try {
        const textContent = await fetchRawFileContent(fileUrl, token);
        return NextResponse.json({
          content: textContent,
          sha,
          name: cleanPath.split('/').pop() || '',
          size,
        });
      } catch (rawError: unknown) {
        const errorMsg = rawError instanceof Error ? rawError.message : 'Timeout reading raw content';
        const isTimeout = errorMsg.includes('timed out') || errorMsg.includes('aborted');
        return NextResponse.json({ error: `Large file read failed: ${errorMsg}` }, { status: isTimeout ? 504 : 400 });
      }
    }

    if (!metadataResponse.ok) {
      const errorText = await metadataResponse.text();
      return NextResponse.json({ error: `GitHub API error: ${errorText}` }, { status: metadataResponse.status });
    }

    const data: GitHubContentResponse | GitHubContentResponse[] = await metadataResponse.json();

    if (Array.isArray(data)) {
      return NextResponse.json(
        { error: 'Selected path is a directory, not a file.' },
        { status: 400 }
      );
    }

    const baseMetadata = {
      sha: data.sha,
      name: data.name,
      size: data.size,
    };

    // 3. Handle large files directly via raw endpoint
    if (data.size && data.size >= LARGE_FILE_THRESHOLD_BYTES) {
      try {
        const textContent = await fetchRawFileContent(fileUrl, token);
        return NextResponse.json({ content: textContent, ...baseMetadata });
      } catch (rawError: unknown) {
        const errorMsg = rawError instanceof Error ? rawError.message : 'Timeout reading raw content';
        return NextResponse.json({ error: `Large file content read failure: ${errorMsg}` }, { status: 504 });
      }
    }

    // 4. Handle base64 encoded payloads with document parser support
    if (data.encoding === 'base64' && data.content) {
      const buffer = Buffer.from(data.content, 'base64');
      const parsedResult = await parseSpecializedDocument(buffer, filePath, baseMetadata);
      return NextResponse.json(parsedResult);
    }

    // 5. Fallback raw content read
    try {
      const textContent = await fetchRawFileContent(fileUrl, token);
      return NextResponse.json({ content: textContent, ...baseMetadata });
    } catch {
      return NextResponse.json(
        { error: 'Unable to decode file content. File may be binary.' },
        { status: 400 }
      );
    }
  } catch (error: unknown) {
    console.error('Read file unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

