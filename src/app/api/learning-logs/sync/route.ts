/* DARLEK CAAN RAG SYNTHESIS - Autonomous Generation G-100 [2026-09-20T05:44:00.210Z] */
/**
 * DARLEK CANN ARCHITECTURAL HEADER
 * File: src/app/api/learning-logs/sync/route.ts
 * Role: Core system component participating in autonomous cognitive evolution cycles.
 * Architecture: Type-safe modular unit with resilient state interfaces.
 */

import { NextResponse } from '@/lib/next-mock';
import { syncPostmortemsToFirebase, getLearningLogs } from '@/lib/learningLogs';

export const dynamic = 'force-dynamic';

interface SyncSuccessResponse {
  readonly success: true;
  readonly logs: unknown;
}

interface SyncErrorResponse {
  readonly success: false;
  readonly error: string;
}

type SyncApiResponse = SyncSuccessResponse | SyncErrorResponse;

/**
 * Handles HTTP POST requests to synchronize post-mortems and retrieve current learning logs.
 */
export async function POST(): Promise<NextResponse<SyncApiResponse>> {
  try {
    await syncPostmortemsToFirebase();
    const logs = await getLearningLogs();
    
    return NextResponse.json({ 
      success: true, 
      logs 
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred during synchronization';
    
    console.error('[Darlek Caan API] Error in sync postmortems API:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage 
      }, 
      { status: 500 }
    );
  }
}
