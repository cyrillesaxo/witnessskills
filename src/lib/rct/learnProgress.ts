import type { OntologyNode, NodeState } from './types';
import { dueIn } from './retention';
import { storageKeyFor } from './utils';

export interface DueSummary {
  count: number;
  labels: string[];
}

export function getDueSummary(domainKey: string, nodes: OntologyNode[]): DueSummary {
  try {
    const raw = localStorage.getItem(storageKeyFor(domainKey));
    if (!raw) return { count: 0, labels: [] };

    const saved = JSON.parse(raw);
    const nodeState: Record<string, NodeState> = saved.__nodes || saved;
    const now = Date.now();
    const labels: string[] = [];

    for (const n of nodes) {
      const st = nodeState[n.id];
      if (st && st.cleared >= 0 && dueIn(st, now) <= 0) {
        labels.push(n.label);
      }
    }

    return { count: labels.length, labels };
  } catch {
    return { count: 0, labels: [] };
  }
}

export function getLearnProgress(domainKey: string, nodes: OntologyNode[]) {
  try {
    const raw = localStorage.getItem(storageKeyFor(domainKey));
    if (!raw) return { cleared: 0, total: 0, stage: 0 };

    const saved = JSON.parse(raw);
    const nodeState: Record<string, NodeState> = saved.__nodes || saved;
    const stage = saved.__stage ?? 0;
    let cleared = 0;
    let total = 0;

    for (const n of nodes) {
      total += n.levels.length;
      const st = nodeState[n.id];
      if (st && st.cleared >= 0) cleared += st.cleared + 1;
    }

    return { cleared, total, stage };
  } catch {
    return { cleared: 0, total: nodes.reduce((a, n) => a + n.levels.length, 0), stage: 0 };
  }
}
