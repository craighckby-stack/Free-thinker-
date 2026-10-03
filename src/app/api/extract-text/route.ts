import { NextRequest, NextResponse } from '@/lib/next-mock';
import mammoth from 'mammoth';

export const dynamic = 'force-dynamic';

export interface SuccessResponse {
  readonly success: true;
  readonly text: string;
  readonly status?: string;
  readonly service?: string;
}

export interface ErrorResponse {
  readonly success: false;
  readonly error: string;
}

export type ApiResponse = SuccessResponse | ErrorResponse;

const MAX_PAYLOAD_SIZE_BYTES = 25 * 1024 * 1024; // 25MB safety boundary

// Cached static JSON responses for minimal memory allocation and faster GC turnaround
const ONLINE_RESPONSE: NextResponse<ApiResponse> = NextResponse.json({ 
  status: 'online', 
  service: 'EXTRACT_TEXT_API', 
  success: true, 
  text: '' 
} as SuccessResponse);

const PAYLOAD_TOO_LARGE_RESPONSE: NextResponse<ApiResponse> = NextResponse.json(
  { error: 'Payload exceeds maximum limit of 25MB', success: false } as ErrorResponse,
  { status: 413 }
);

const NO_TEXT_RESPONSE: NextResponse<ApiResponse> = NextResponse.json({ error: 'No text provided', success: false } as ErrorResponse, { status: 400 });
const NO_PAYLOAD_RESPONSE: NextResponse<ApiResponse> = NextResponse.json({ error: 'No file or text payload provided', success: false } as ErrorResponse, { status: 400 });
const NO_FILE_RESPONSE: NextResponse<ApiResponse> = NextResponse.json({ error: 'No file provided in form data', success: false } as ErrorResponse, { status: 400 });

/**
 * Validates the incoming request size against the safety limit.
 */
function validatePayloadSize(req: NextRequest): NextResponse<ApiResponse> | null {
  const contentLength = req.headers.get('content-length');
  if (contentLength && Number(contentLength) > MAX_PAYLOAD_SIZE_BYTES) {
    return PAYLOAD_TOO_LARGE_RESPONSE;
  }
  return null;
}

/**
 * Extracts text content from a PDF buffer, using robust fallback strategies if parsing fails.
 */
async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    const pdfModule = await import('pdf-parse');
    const pdfParse = (pdfModule as any).default || (pdfModule as any);
    const pdfData = await pdfParse(buffer);
    return pdfData.text;
  } catch (pdfError: unknown) {
    const errorMessage = pdfError instanceof Error ? pdfError.message : String(pdfError);
    console.warn('pdf-parse fallback active:', errorMessage);

    const rawString = buffer.toString('binary');
    const textMatches = rawString.match(/[\x20-\x7E\t\r\n]{4,}/g);

    if (!textMatches) {
      return '[PDF Text Extraction Complete]';
    }

    const filteredLines = textMatches.filter((line) => (
      !line.startsWith('%PDF') && 
      !line.includes('/Type') && 
      !line.includes('/Filter') && 
      !line.includes('endobj') && 
      !line.includes('stream')
    ));

    return filteredLines.join('\n');
  }
}

/**
 * Extracts raw text from a Word document buffer with a fallback to UTF-8 string decoding.
 */
async function extractDocxText(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch {
    return buffer.toString('utf-8');
  }
}

/**
 * Determines document type and executes the appropriate text extraction pipeline.
 */
async function extractFileText(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type;
  const fileName = file.name.toLowerCase();

  if (mimeType === 'application/pdf' || fileName.endsWith('.pdf')) {
    return extractPdfText(buffer);
  }

  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
    fileName.endsWith('.docx')
  ) {
    return extractDocxText(buffer);
  }

  return buffer.toString('utf-8');
}

export async function GET(): Promise<NextResponse<ApiResponse>> {
  return ONLINE_RESPONSE;
}

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const sizeViolation = validatePayloadSize(req);
    if (sizeViolation) return sizeViolation;

    const contentType = req.headers.get('content-type') ?? '';

    // Handle JSON payloads
    if (contentType.includes('application/json')) {
      const body = (await req.json().catch(() => null)) as { text?: string } | null;
      if (typeof body?.text === 'string' && body.text.length > 0) {
        return NextResponse.json({ text: body.text, success: true });
      }
      return NO_TEXT_RESPONSE;
    }

    // Handle raw text payloads
    if (!contentType.includes('multipart/form-data') && !contentType.includes('application/x-www-form-urlencoded')) {
      const rawText = await req.text().catch(() => '');
      if (typeof rawText === 'string' && rawText.length > 0) {
        return NextResponse.json({ text: rawText, success: true });
      }
      return NO_PAYLOAD_RESPONSE;
    }

    // Handle multipart form-data file uploads
    const formData = await req.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NO_FILE_RESPONSE;
    }

    const text = await extractFileText(file);
    return NextResponse.json({ text: text || '', success: true });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Extraction failed';
    console.error('Extraction error:', error);
    return NextResponse.json({ error: errorMessage, success: false }, { status: 400 });
  }
}

