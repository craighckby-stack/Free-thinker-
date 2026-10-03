/* DARLEK CAAN RAG SYNTHESIS - Autonomous Generation G-101 [2026-09-20T05:44:23.216Z] */
/**
 * DARLEK CANN ARCHITECTURAL HEADER
 * File: src/app/api/route.ts
 * Role: Core system component participating in autonomous cognitive evolution cycles.
 * Architecture: Type-safe modular unit with resilient state interfaces.
 */

import { NextResponse, type NextRequest } from '@/lib/next-mock';

export const dynamic = "force-dynamic";

/**
 * Standard immutable structure for API responses.
 */
interface ApiResponse {
  readonly success: boolean;
  readonly message: string;
  readonly timestamp: string;
}

const HTTP_STATUS_OK = 200;
const HTTP_STATUS_INTERNAL_ERROR = 500;
const DEFAULT_ERROR_MESSAGE = "Internal Server Error";
const GREETING_MESSAGE = "Hello, world!";

const RESPONSE_HEADERS = Object.freeze({
  "Cache-Control": "no-store, max-age=0, must-revalidate",
  "Content-Type": "application/json; charset=utf-8",
});

const SUCCESS_INIT = Object.freeze({
  status: HTTP_STATUS_OK,
  headers: RESPONSE_HEADERS,
});

const ERROR_INIT = Object.freeze({
  status: HTTP_STATUS_INTERNAL_ERROR,
  headers: RESPONSE_HEADERS,
});

/**
 * Generates an immutable standardized API response object with an ISO timestamp.
 */
function createApiResponse(success: boolean, message: string): ApiResponse {
  return Object.freeze({
    success,
    message,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Safely extracts an error message from an unknown caught exception with type narrowing.
 */
function resolveErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  if (typeof error === "string" && error.trim().length > 0) {
    return error;
  }
  return DEFAULT_ERROR_MESSAGE;
}

/**
 * Handles GET requests to the root API endpoint with memory efficiency and error handling.
 */
export async function GET(_request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const payload = createApiResponse(true, GREETING_MESSAGE);
    return NextResponse.json(payload, SUCCESS_INIT);
  } catch (error: unknown) {
    const errorMessage = resolveErrorMessage(error);
    const payload = createApiResponse(false, errorMessage);
    return NextResponse.json(payload, ERROR_INIT);
  }
}
