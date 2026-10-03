/* DARLEK CAAN RAG SYNTHESIS - Autonomous Generation G-104 [2026-09-20T05:45:29.871Z] */
/**
 * DARLEK CANN ARCHITECTURAL HEADER
 * File: src/app/api/system/scaffold/route.ts
 * Role: Core system component participating in autonomous cognitive evolution cycles.
 * Architecture: Type-safe modular unit with resilient state interfaces.
 */

import { NextRequest, NextResponse } from '@/lib/next-mock';

export const dynamic: string = 'force-dynamic';

interface SystemStatusResponse {
  readonly status: 'online';
  readonly service: string;
}

interface ScaffoldSuccessResponse {
  readonly success: true;
  readonly message: string;
  readonly timestamp: string;
}

interface ErrorResponse {
  readonly error: string;
  readonly timestamp: string;
}

const SERVICE_NAME: string = 'SYSTEM_SCAFFOLD_API';
const SUCCESS_MESSAGE: string = 'System scaffold initialized successfully';
const DEFAULT_ERROR_MESSAGE: string = 'An unexpected error occurred during system scaffold initialization';
const MAX_PAYLOAD_SIZE_BYTES: number = 1048576;

const STATIC_GET_RESPONSE: SystemStatusResponse = {
  status: 'online',
  service: SERVICE_NAME,
};

const JSON_HEADERS: Readonly<Record<string, string>> = {
  'Content-Type': 'application/json',
} as const;

/**
 * Generates an ISO timestamp string.
 */
function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Safely parses the request JSON body if the content type is application/json with strict bounds and size validation.
 */
async function parseOptionalJsonBody(request: NextRequest): Promise<unknown> {
  const contentType: string | null = request.headers.get('content-type');
  
  if (!contentType || !contentType.toLowerCase().includes('application/json')) {
    return null;
  }

  const contentLengthHeader: string | null = request.headers.get('content-length');
  if (contentLengthHeader !== null) {
    const contentLength: number = Number.parseInt(contentLengthHeader, 10);
    if (Number.isNaN(contentLength) || contentLength > MAX_PAYLOAD_SIZE_BYTES) {
      throw new Error('Payload too large or malformed content-length header.');
    }
  }
  
  try {
    const parsedBody: unknown = await request.json();
    return parsedBody;
  } catch {
    throw new Error('Invalid JSON payload format.');
  }
}

export async function GET(): Promise<NextResponse<SystemStatusResponse>> {
  const response: NextResponse<SystemStatusResponse> = NextResponse.json(STATIC_GET_RESPONSE, { headers: JSON_HEADERS });
  return response;
}

export async function POST(request: NextRequest): Promise<NextResponse<ScaffoldSuccessResponse | ErrorResponse>> {
  try {
    await parseOptionalJsonBody(request);

    const successPayload: ScaffoldSuccessResponse = {
      success: true,
      message: SUCCESS_MESSAGE,
      timestamp: getCurrentTimestamp(),
    };

    const successResponse: NextResponse<ScaffoldSuccessResponse> = NextResponse.json(successPayload, { headers: JSON_HEADERS });
    return successResponse;
  } catch (error: unknown) {
    const errorMessage: string = error instanceof Error ? error.message : DEFAULT_ERROR_MESSAGE;
    
    const errorPayload: ErrorResponse = {
      error: errorMessage,
      timestamp: getCurrentTimestamp(),
    };

    const errorResponse: NextResponse<ErrorResponse> = NextResponse.json(errorPayload, { status: 400, headers: JSON_HEADERS });
    return errorResponse;
  }
}
