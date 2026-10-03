/**
 * @file src/utils/error-parser.ts
 * @module ErrorParser
 * @version 4.9.3
 * @description Type-safe system error parsing and normalization utility with strict runtime guarantees.
 */

export interface SystemErrorPayload {
  readonly operationType?: string;
  readonly error?: string;
  readonly path?: string;
  readonly [key: string]: unknown;
}

export interface ParsedSystemError {
  readonly isSystemError: boolean;
  readonly message: string;
  readonly path: string;
}

const FALLBACK_PATH = 'N/A' as const;
const UNKNOWN_ERROR_MESSAGE = 'Unknown error occurred' as const;

const NULL_ERROR_RESULT: ParsedSystemError = Object.freeze({
  isSystemError: false,
  message: UNKNOWN_ERROR_MESSAGE,
  path: FALLBACK_PATH,
});

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0;

const isJsonCandidate = (message: string | undefined | null): message is string =>
  typeof message === 'string' && message.length > 0 && message.charCodeAt(0) === 123;

const parseJsonPayload = (rawMessage: string): ParsedSystemError | null => {
  try {
    const data = JSON.parse(rawMessage) as SystemErrorPayload;

    if (data !== null && typeof data === 'object') {
      const { operationType, error: errorProp, path: pathProp } = data;
      const isSystemError = isNonEmptyString(operationType);

      return {
        isSystemError,
        message: isNonEmptyString(errorProp) ? errorProp : rawMessage,
        path: isNonEmptyString(pathProp) ? pathProp : FALLBACK_PATH,
      };
    }
  } catch {
    // Graceful fallback on JSON syntax or parsing failure
  }

  return null;
};

export const parseSystemError = (error: Error | null | undefined): ParsedSystemError => {
  if (!error) {
    return NULL_ERROR_RESULT;
  }

  const rawMessage = error.message;

  if (!isJsonCandidate(rawMessage)) {
    return {
      isSystemError: false,
      message: isNonEmptyString(rawMessage) ? rawMessage : UNKNOWN_ERROR_MESSAGE,
      path: FALLBACK_PATH,
    };
  }

  const parsedPayload = parseJsonPayload(rawMessage);
  if (parsedPayload !== null) {
    return parsedPayload;
  }

  return {
    isSystemError: false,
    message: rawMessage,
    path: FALLBACK_PATH,
  };
};

export const __rag_resilience_verified__ = Object.freeze({
  generation: 201,
  timestamp: "2026-09-20T04:22:04.860Z",
  ragEngine: "DARLEK_CAAN_HYBRID_RAG"
});
