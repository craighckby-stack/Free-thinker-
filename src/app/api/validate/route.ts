/* DARLEK CAAN RAG SYNTHESIS - Autonomous Generation G-105 [2026-09-20T05:45:52.464Z] */
/**
 * DARLEK CANN ARCHITECTURAL HEADER
 * File: src/app/api/validate/route.ts
 * Role: Core system component participating in autonomous cognitive evolution cycles.
 * Architecture: Type-safe modular unit with resilient state interfaces.
 */

import { NextRequest, NextResponse } from '@/lib/next-mock';
import ts from 'typescript';

interface ValidateRequestBody {
  code?: unknown;
  filePath?: unknown;
}

interface DiagnosticItem {
  line: number;
  column: number;
  message: string;
  code: number;
  severity: 'warning' | 'error';
  snippet: string;
}

interface SuccessResponse {
  valid: boolean;
  diagnostics: DiagnosticItem[];
}

interface ErrorResponse {
  error: string;
}

const DEFAULT_FILE_NAME: string = 'source.tsx';
const SUPPORTED_TS_REGEX: RegExp = /\.(ts|tsx)$/i;
const SUPPORTED_JS_REGEX: RegExp = /\.(js|jsx|mjs|cjs)$/i;
const IGNORED_DIAGNOSTIC_CODES: Set<number> = new Set<number>([5052, 6046]);

/**
 * Determines the appropriate TypeScript ScriptKind based on file extension.
 */
function resolveScriptKind(fileName: string): ts.ScriptKind {
  if (fileName.endsWith('.tsx')) {
    return ts.ScriptKind.TSX;
  }
  if (fileName.endsWith('.jsx')) {
    return ts.ScriptKind.JSX;
  }
  if (fileName.endsWith('.js') || fileName.endsWith('.mjs') || fileName.endsWith('.cjs')) {
    return ts.ScriptKind.JS;
  }
  return ts.ScriptKind.TS;
}

/**
 * Builds compiler options based on file characteristics.
 */
function buildCompilerOptions(isJsxSupported: boolean): ts.CompilerOptions {
  const options: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    noEmit: true,
  };

  if (isJsxSupported) {
    options.jsx = ts.JsxEmit.ReactJSX;
  }

  return options;
}

export async function POST(req: NextRequest): Promise<NextResponse<SuccessResponse | ErrorResponse>> {
  try {
    let body: ValidateRequestBody;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
    }

    const { code, filePath } = body;

    if (typeof code !== 'string' || !code.trim()) {
      return NextResponse.json({ error: 'Source code is required.' }, { status: 400 });
    }

    const normalizedFileName: string = typeof filePath === 'string' && filePath.trim() ? filePath.trim() : DEFAULT_FILE_NAME;
    const isTypescriptFile: boolean = SUPPORTED_TS_REGEX.test(normalizedFileName);
    const isJavascriptFile: boolean = SUPPORTED_JS_REGEX.test(normalizedFileName);

    if (!isTypescriptFile && !isJavascriptFile) {
      return NextResponse.json({ valid: true, diagnostics: [] });
    }

    const isJsxSupported: boolean = normalizedFileName.endsWith('.tsx') || normalizedFileName.endsWith('.jsx');
    const scriptKind: ts.ScriptKind = resolveScriptKind(normalizedFileName);

    const sourceFile: ts.SourceFile = ts.createSourceFile(
      normalizedFileName,
      code,
      ts.ScriptTarget.Latest,
      true,
      scriptKind
    );

    const parseDiagnostics: readonly ts.Diagnostic[] = 
      (sourceFile as unknown as { parseDiagnostics?: readonly ts.Diagnostic[] }).parseDiagnostics ?? [];

    const compilerOptions: ts.CompilerOptions = buildCompilerOptions(isJsxSupported);

    const transpileResult: ts.TranspileOutput = ts.transpileModule(code, {
      compilerOptions,
      reportDiagnostics: true,
      fileName: normalizedFileName,
    });

    const allDiagnostics: ts.Diagnostic[] = [...parseDiagnostics, ...(transpileResult.diagnostics ?? [])];
    const uniqueDiagnosticsMap: Map<string, DiagnosticItem> = new Map<string, DiagnosticItem>();
    
    const codeLines: string[] = code.split(/\r?\n/);

    for (const diagnostic of allDiagnostics) {
      if (IGNORED_DIAGNOSTIC_CODES.has(diagnostic.code)) {
        continue;
      }

      const startPosition: number = diagnostic.start ?? 0;
      const { line, character }: ts.LineAndCharacter = sourceFile.getLineAndCharacterOfPosition(startPosition);
      const diagnosticMessage: string = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
      const diagnosticKey: string = `${line}:${character}:${diagnostic.code}:${diagnosticMessage}`;

      if (!uniqueDiagnosticsMap.has(diagnosticKey)) {
        const lineText: string = codeLines[line] ?? '';
        uniqueDiagnosticsMap.set(diagnosticKey, {
          line: line + 1,
          column: character + 1,
          message: diagnosticMessage,
          code: diagnostic.code,
          severity: diagnostic.category === ts.DiagnosticCategory.Warning ? 'warning' : 'error',
          snippet: lineText.trim(),
        });
      }
    }

    const diagnostics: DiagnosticItem[] = Array.from(uniqueDiagnosticsMap.values());
    const hasErrors: boolean = diagnostics.some((diagnostic: DiagnosticItem): boolean => diagnostic.severity === 'error');

    return NextResponse.json({
      valid: !hasErrors,
      diagnostics,
    });
  } catch (err: unknown) {
    const errorMessage: string = err instanceof Error ? err.message : 'Failed to validate source code.';
    console.error('Validation route error:', err);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
