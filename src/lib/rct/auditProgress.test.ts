import { describe, it, expect, beforeEach } from 'vitest';
import { getAuditSummary } from './auditProgress';
import { auditStorageKey } from './auditUtils';
import { AUDIT_SEED } from './auditSeed';

describe('auditProgress', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns maven seed coverage by default', () => {
    const summary = getAuditSummary('maven');
    expect(summary.questions).toBe(AUDIT_SEED.length);
    expect(summary.coveragePct).toBeGreaterThan(0);
  });

  it('counts uncovered questions from stored audit items', () => {
    const items = AUDIT_SEED.map((it, i) => (i === 0 ? { ...it, nodes: [] as string[] } : it));
    localStorage.setItem(auditStorageKey('maven'), JSON.stringify(items));
    expect(getAuditSummary('maven').uncovered).toBeGreaterThan(0);
  });

  it('returns zeros for non-maven domains', () => {
    expect(getAuditSummary('gen:foo')).toEqual({
      coveragePct: 0,
      uncovered: 0,
      questions: 0,
      orphanNodes: 0,
    });
  });
});
