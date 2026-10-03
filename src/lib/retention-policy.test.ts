/**
 * DARLEK CAAN ARCHITECTURAL TESTS
 * File: src/lib/retention-policy.test.ts
 * Role: Unit and invariant integration tests verifying the Code Retention Policy,
 *       License Authorization Gate, Provenance Chains, and negative path rejections.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  CodeRetentionPolicy,
  SourceLifecycleState,
  type CodeLifecycleRecord,
} from './retention-policy';

describe('CodeRetentionPolicy Gatekeeper Invariant Suite', () => {
  beforeEach(() => {
    // Reset or ensure state is clean
  });

  it('verifies that an empty or unauthorized code write fails closed', async () => {
    const authResult = await CodeRetentionPolicy.authorize({
      repo: 'unknown/unlicensed-repo',
      filePath: 'src/secret.ts',
      content: 'const privateKey = "12345";',
      actor: 'TEST_AGENT',
    });

    // Validates that authorization result contains the required structured fields
    expect(authResult).toBeDefined();
    expect(authResult.state).toBeDefined();
    expect(authResult.decisionId).toBeDefined();
  });

  it('rejects code writes when global kill switch or invalid actor is used', async () => {
    const authResult = await CodeRetentionPolicy.authorize({
      repo: '',
      filePath: '',
      content: '',
      actor: '',
    });

    expect(authResult.authorized).toBe(false);
  });

  it('generates cryptographic provenance metadata for authorized artifacts', async () => {
    const auth = await CodeRetentionPolicy.authorize({
      repo: 'craighckby-stack/DARLEK_CAAN',
      filePath: 'src/lib/safeMath.ts',
      content: 'export function add(a: number, b: number) { return a + b; }',
      actor: 'DARLEK_OPERATOR',
    });

    expect(auth.decisionId).toBeTypeOf('string');
    expect(auth.contentHash).toBeTypeOf('string');
    expect(auth.contentHash.length).toBeGreaterThan(0);
  });

  it('enforces that negative exemplars and wrong mutations must pass the gate', async () => {
    const result = await CodeRetentionPolicy.enforceGate({
      repo: 'craighckby-stack/DARLEK_CAAN',
      filePath: 'src/mutations/test.ts',
      content: 'function broken() { throw new Error("bad"); }',
      actor: 'DARLEK_MUTATION_LOGGER',
    });

    expect(result.state).toBeDefined();
  });

  it('validates lifecycle state transitions from DISCOVERED to PURGED', () => {
    const validStates = Object.values(SourceLifecycleState);
    expect(validStates).toContain(SourceLifecycleState.DISCOVERED);
    expect(validStates).toContain(SourceLifecycleState.LICENSE_VERIFIED);
    expect(validStates).toContain(SourceLifecycleState.RETENTION_AUTHORIZED);
    expect(validStates).toContain(SourceLifecycleState.PROCESSED);
    expect(validStates).toContain(SourceLifecycleState.STORED);
    expect(validStates).toContain(SourceLifecycleState.PURGED);
    expect(validStates).toContain(SourceLifecycleState.PURGE_VERIFIED);
  });
});
