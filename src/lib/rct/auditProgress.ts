import { AUDIT_SEED } from './auditSeed';
import { auditStorageKey, domainToAuditNodes } from './auditUtils';
import { DOMAINS } from './mavenOntology';

export interface AuditSummary {
  coveragePct: number;
  uncovered: number;
  questions: number;
  orphanNodes: number;
}

export function getAuditSummary(domainKey: string): AuditSummary {
  const isMaven = domainKey === 'maven';
  if (!isMaven) {
    return { coveragePct: 0, uncovered: 0, questions: 0, orphanNodes: 0 };
  }

  const domain = DOMAINS.maven;
  let items = AUDIT_SEED;
  try {
    const raw = localStorage.getItem(auditStorageKey(domainKey));
    if (raw) items = JSON.parse(raw);
  } catch {
    /* use seed */
  }

  const auditNodes = domainToAuditNodes(domain);
  const coverage = Object.fromEntries(auditNodes.map(n => [n.id, { count: 0, freq: 0 }]));
  items.forEach(it => it.nodes.forEach(nid => {
    if (coverage[nid]) {
      coverage[nid].count++;
      coverage[nid].freq += it.freq;
    }
  }));

  const totalFreq = items.reduce((a, it) => a + it.freq, 0);
  const coveredFreq = items.filter(it => it.nodes.length > 0).reduce((a, it) => a + it.freq, 0);
  const coveragePct = totalFreq ? Math.round((coveredFreq / totalFreq) * 100) : 0;
  const uncovered = items.filter(it => it.nodes.length === 0).length;
  const orphanNodes = auditNodes.filter(n => (coverage[n.id]?.count ?? 0) === 0).length;

  return { coveragePct, uncovered, questions: items.length, orphanNodes };
}
