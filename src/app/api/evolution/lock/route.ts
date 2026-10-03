/**
 * DARLEK CANN ARCHITECTURAL HEADER
 * File: src/app/api/evolution/lock/route.ts
 * Role: API endpoint providing centralized lock status, acquisition, and release
 *       across both server and client execution contexts.
 */

import { NextRequest, NextResponse } from '@/lib/next-mock';
import { evolutionLock } from '@/lib/evolutionLock';
import { safeReqJson } from '@/lib/safe-json';

export const dynamic: string = 'force-dynamic';

interface LockRequestBody {
  action?: 'acquire' | 'release' | 'force-release';
  owner?: string;
  ttlMs?: number;
}

const DEFAULT_OWNER: string = 'unknown';
const DEFAULT_TTL_MS: number = 60_000;
const MIN_TTL_MS: number = 1_000;
const MAX_TTL_MS: number = 300_000;
const MAX_OWNER_LENGTH: number = 64;

function sanitizeOwner(rawOwner: unknown): string {
  if (typeof rawOwner !== 'string') {
    return DEFAULT_OWNER;
  }
  const trimmed: string = rawOwner.trim();
  return trimmed.length > 0 ? trimmed.slice(0, MAX_OWNER_LENGTH) : DEFAULT_OWNER;
}

function sanitizeTtl(rawTtl: unknown): number {
  if (typeof rawTtl !== 'number' || Number.isNaN(rawTtl)) {
    return DEFAULT_TTL_MS;
  }
  return Math.max(MIN_TTL_MS, Math.min(MAX_TTL_MS, rawTtl));
}

function verifyForceReleaseAuthorization(req: NextRequest): NextResponse | null {
  const authHeader: string = req.headers.get('authorization') || '';
  const secret: string | undefined = process.env.OPERATOR_SECRET || process.env.ADMIN_SECRET;
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized force-release' }, { status: 401 });
  }
  return null;
}

export async function GET(): Promise<NextResponse> {
  const status = evolutionLock.getStatus();
  return NextResponse.json({
    success: true,
    ...status,
  });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body: LockRequestBody = await safeReqJson<LockRequestBody>(req, {});

    const action = body.action ?? 'acquire';
    const owner: string = sanitizeOwner(body.owner);
    const ttlMs: number = sanitizeTtl(body.ttlMs);

    if (action === 'acquire') {
      const acquired: boolean = evolutionLock.acquire(owner, ttlMs);
      const status = evolutionLock.getStatus();
      return NextResponse.json({
        success: acquired,
        ...status,
      }, { status: acquired ? 200 : 429 });
    }

    if (action === 'release') {
      const released: boolean = evolutionLock.release(owner);
      const status = evolutionLock.getStatus();
      return NextResponse.json({
        success: released,
        ...status,
      });
    }

    if (action === 'force-release') {
      const authErrorResponse: NextResponse | null = verifyForceReleaseAuthorization(req);
      if (authErrorResponse) {
        return authErrorResponse;
      }
      evolutionLock.forceRelease(owner || 'OPERATOR_OVERRIDE');
      const status = evolutionLock.getStatus();
      return NextResponse.json({
        success: true,
        ...status,
      });
    }

    return NextResponse.json({ error: 'Invalid lock action' }, { status: 400 });
  } catch (err: unknown) {
    const errorMsg: string = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMsg, success: false }, { status: 500 });
  }
}
