import { describe, it, expect } from 'vitest';
import { nextInterval, dueIn, freshNodeState, DAY } from './retention';
import type { NodeState } from './types';

describe('retention', () => {
  it('nextInterval scales with cret', () => {
    const low = nextInterval(2, 0.2);
    const high = nextInterval(2, 1);
    expect(high).toBeGreaterThan(low);
  });

  it('dueIn returns negative when overdue', () => {
    const st: NodeState = {
      ...freshNodeState([]),
      cleared: 0,
      lastRetrieved: Date.now() - DAY * 10,
      reps: 1,
      cret: 1,
    };
    expect(dueIn(st, Date.now())).toBeLessThanOrEqual(0);
  });

  it('dueIn returns Infinity for uncleared nodes', () => {
    const st = freshNodeState([]);
    expect(dueIn(st, Date.now())).toBe(Infinity);
  });
});
