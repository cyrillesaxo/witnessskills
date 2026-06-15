import { describe, it, expect, beforeEach } from 'vitest';
import { getDueSummary, getLearnProgress } from './learnProgress';
import { freshNodeState } from './retention';
import { storageKeyFor } from './utils';
import type { OntologyNode } from './types';

const nodes = [
  { id: 'a', label: 'Alpha', requires: [], levels: [{ tier: 'Junior' }] },
  { id: 'b', label: 'Beta', requires: [], levels: [{ tier: 'Junior' }] },
] as unknown as OntologyNode[];

describe('learnProgress', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('getDueSummary counts overdue cleared nodes', () => {
    const key = storageKeyFor('test');
    localStorage.setItem(key, JSON.stringify({
      a: { ...freshNodeState([]), cleared: 0, lastRetrieved: 0, reps: 1, cret: 1 },
      b: freshNodeState([]),
    }));
    expect(getDueSummary('test', nodes).count).toBe(1);
    expect(getDueSummary('test', nodes).labels).toEqual(['Alpha']);
  });

  it('getLearnProgress reports cleared tiers and stage', () => {
    const key = storageKeyFor('test');
    localStorage.setItem(key, JSON.stringify({
      __stage: 2,
      a: { ...freshNodeState([]), cleared: 0 },
      b: freshNodeState([]),
    }));
    const progress = getLearnProgress('test', nodes);
    expect(progress.cleared).toBe(1);
    expect(progress.total).toBe(2);
    expect(progress.stage).toBe(2);
  });
});
