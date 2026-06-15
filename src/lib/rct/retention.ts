import type { NodeState } from './types';

export const DAY = 24 * 60 * 60 * 1000;

const BASE_INTERVALS = [1, 1, 3, 7, 16, 35];

export function nextInterval(reps: number, cret: number): number {
  const i = Math.min(Math.max(1, reps || 1), BASE_INTERVALS.length - 1);
  const base = BASE_INTERVALS[i];
  return Math.max(DAY * 0.5, base * DAY * (0.4 + 0.6 * cret));
}

export function dueIn(st: NodeState, now: number): number {
  if (st.cleared < 0) return Infinity;
  return (st.lastRetrieved + nextInterval(st.reps || 0, st.cret)) - now;
}

export function freshNodeState(requires: string[]): NodeState {
  return {
    depth: 0,
    cleared: -1,
    unlocked: requires.length === 0,
    lastRetrieved: 0,
    cret: 1,
    awSurvived: 0,
    attempts: 0,
    hintsUsed: 0,
    shallowHits: 0,
    reps: 0,
  };
}
