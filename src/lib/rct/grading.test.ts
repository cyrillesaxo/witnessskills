import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { gradeConvergence } from './grading';

describe('grading', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('offline'))));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('gradeConvergence uses fallback when API unavailable', async () => {
    const result = await gradeConvergence({
      kind: 'witness',
      anchorKnown: 'junit cached',
      newCase: 'slf4j missing',
      prompt: 'Where did it come from?',
      answer: 'downloaded from central into .m2',
      fallback: a => a.includes('central') && a.includes('.m2'),
    });
    expect(result.verdict).toBe('converged');
    expect(result.graded).toBe('fallback');
  });

  it('gradeConvergence returns off when fallback rejects', async () => {
    const result = await gradeConvergence({
      kind: 'witness',
      anchorKnown: 'x',
      newCase: 'y',
      prompt: 'z',
      answer: 'no idea',
      fallback: () => false,
    });
    expect(result.verdict).toBe('off');
    expect(result.graded).toBe('fallback');
  });

  it('gradeConvergence uses model verdict when API succeeds', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ verdict: 'shallow', reason: 'generic' }),
      } as Response),
    ));

    const result = await gradeConvergence({
      kind: 'anti',
      anchorKnown: 'a',
      newCase: 'b',
      prompt: 'c',
      answer: 'mapped',
      fallback: () => true,
    });
    expect(result.verdict).toBe('shallow');
    expect(result.graded).toBe('model');
  });
});
