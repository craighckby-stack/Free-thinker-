/**
 * ── SOURCE CODE SYNTAX & AST VALIDATOR ──
 * File: src/lib/validator.ts
 * Provides resilient, high-speed syntax validation and AST diagnostics using TypeScript transpileModule.
 */

import ts from 'typescript';

export interface ValidationError {
  line: number;
  column?: number;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  autoHealed?: boolean;
  healedCode?: string;
  source?: string;
}

/**
 * Strips markdown code block wrappers (e.g. ```typescript ... ```) if present.
 */
function stripMarkdownFences(code: string): { stripped: string; didStrip: boolean } {
  const trimmed = code.trim();
  const fenceRegex = /^```(?:[a-zA-Z0-9_\-+]*)\r?\n([\s\S]*?)\r?\n```$/;
  const match = trimmed.match(fenceRegex);
  if (match && match[1]) {
    return { stripped: match[1], didStrip: true };
  }
  return { stripped: code, didStrip: false };
}

/**
 * Checks whether the working code contains known placeholder or truncated comment patterns.
 */
function hasPlaceholderContent(code: string): boolean {
  return (
    code.includes('// ... rest unchanged') ||
    code.includes('/* ... rest unchanged') ||
    code.includes('// rest of the code remains the same')
  );
}

/**
 * Validates JSON content format.
 */
function validateJsonContent(code: string, errors: ValidationError[]): void {
  try {
    JSON.parse(code);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    errors.push({
      line: 1,
      message: `Invalid JSON: ${errorMessage}`,
    });
  }
}

/**
 * Validates TypeScript or JavaScript source code using compiler diagnostics.
 */
function validateTypeScriptOrJavaScript(
  code: string,
  filePath: string,
  isJsx: boolean,
  errors: ValidationError[]
): void {
  try {
    const transpileResult = ts.transpileModule(code, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext,
        jsx: isJsx ? ts.JsxEmit.ReactJSX : ts.JsxEmit.None,
        noEmit: true,
      },
      reportDiagnostics: true,
      fileName: filePath,
    });

    if (transpileResult.diagnostics && transpileResult.diagnostics.length > 0) {
      const sourceFile = ts.createSourceFile(
        filePath,
        code,
        ts.ScriptTarget.ES2022,
        true
      );

      for (const diag of transpileResult.diagnostics) {
        let line = 1;
        let col = 1;
        if (diag.start !== undefined) {
          const pos = sourceFile.getLineAndCharacterOfPosition(diag.start);
          line = pos.line + 1;
          col = pos.character + 1;
        }
        const message =
          typeof diag.messageText === 'string'
            ? diag.messageText
            : diag.messageText.messageText;

        errors.push({
          line,
          column: col,
          message,
        });
      }
    }
  } catch (transpileErr: unknown) {
    const errorMessage = transpileErr instanceof Error ? transpileErr.message : String(transpileErr);
    errors.push({
      line: 1,
      message: `Compilation error: ${errorMessage}`,
    });
  }
}

/**
 * Validates source code using TypeScript compiler diagnostics for TS/JS files
 * and JSON.parse for JSON files. Does not perform bracket-counting heuristics.
 */
export async function validateSourceCode(
  code: string,
  filePath = 'unknown.ts'
): Promise<ValidationResult> {
  if (!code || typeof code !== 'string') {
    return {
      valid: false,
      errors: [{ line: 1, message: 'Source code is empty or not a string' }],
    };
  }

  // 1. Strip markdown fences if present
  const { stripped, didStrip } = stripMarkdownFences(code);
  const workingCode = stripped;
  const lowerPath = filePath.toLowerCase();
  const errors: ValidationError[] = [];

  // 2. Reject truncated placeholder blocks
  if (hasPlaceholderContent(workingCode)) {
    errors.push({
      line: 1,
      message: 'Detected placeholder or truncated comment indicating incomplete code.',
    });
    return {
      valid: false,
      errors,
      source: workingCode,
    };
  }

  // 3. JSON validation
  if (lowerPath.endsWith('.json')) {
    validateJsonContent(workingCode, errors);
    return {
      valid: errors.length === 0,
      errors,
      autoHealed: didStrip,
      healedCode: didStrip ? workingCode : undefined,
      source: workingCode,
    };
  }

  // 4. TS/JS validation via ts.transpileModule diagnostics
  const isTypeScriptOrJavaScript =
    lowerPath.endsWith('.ts') ||
    lowerPath.endsWith('.tsx') ||
    lowerPath.endsWith('.js') ||
    lowerPath.endsWith('.jsx');

  if (isTypeScriptOrJavaScript) {
    const isJsx = lowerPath.endsWith('.tsx') || lowerPath.endsWith('.jsx');
    validateTypeScriptOrJavaScript(workingCode, filePath, isJsx, errors);

    return {
      valid: errors.length === 0,
      errors,
      autoHealed: didStrip,
      healedCode: didStrip ? workingCode : undefined,
      source: workingCode,
    };
  }

  // 5. Non-JS/TS/JSON files: pass without bracket counting
  return {
    valid: true,
    errors: [],
    autoHealed: didStrip,
    healedCode: didStrip ? workingCode : undefined,
    source: workingCode,
  };
}
