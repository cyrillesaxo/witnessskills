import { describe, it, expect } from 'vitest';
import { parseJsonResponse } from './parseJson';

describe('parseJsonResponse', () => {
  it('parses raw JSON', () => {
    expect(parseJsonResponse('{"verdict":"converged"}')).toEqual({ verdict: 'converged' });
  });

  it('strips markdown fences', () => {
    const raw = '```json\n{"grade":"strong","note":"good"}\n```';
    expect(parseJsonResponse(raw)).toEqual({ grade: 'strong', note: 'good' });
  });
});
