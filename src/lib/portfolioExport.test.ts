import { describe, it, expect } from 'vitest';
import { skillsToMarkdown } from './portfolioExport';

const base = { tags: [] as string[], created_at: '2026-01-01T00:00:00Z' };

describe('portfolioExport', () => {
  it('builds markdown with skill details and RCT metadata', () => {
    const md = skillsToMarkdown([
      { ...base, name: 'Maven Conflict Resolution', level: 'advanced', evidence: 'Resolved conflicts', source: 'rct', rct_tier: 'T2', rct_cret: 0.85 },
      { ...base, name: 'Git Basics', level: 'beginner', evidence: '', source: 'manual' },
    ], 'user@example.com');

    expect(md).toContain('# WitnessSkills Portfolio');
    expect(md).toContain('user@example.com');
    expect(md).toContain('## Maven Conflict Resolution');
    expect(md).toContain('RCT convergence');
    expect(md).toContain('**C_ret:** 0.85');
    expect(md).toContain('## Git Basics');
    expect(md).toContain('Manual entry');
  });

  it('handles empty portfolio', () => {
    const md = skillsToMarkdown([]);
    expect(md).toContain('# WitnessSkills Portfolio');
    expect(md).toContain('**Skills:** 0');
  });
});
