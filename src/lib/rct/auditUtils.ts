import type { Domain, OntologyNode } from './types';
import type { AuditNode } from './auditSeed';

export function auditStorageKey(domainKey: string) {
  return `witnessskills-audit-v1:${domainKey || 'maven'}`;
}

export function domainToAuditNodes(domain: Domain): AuditNode[] {
  return domain.nodes.map(n => ({
    id: n.id,
    label: n.label,
    note: `${n.eat.entity} · ${n.eat.action} → ${n.eat.target}`,
  }));
}

export interface NodeEpistemic {
  tier: string;
  witness?: string;
  traps: string[];
}

export function domainToEpistemics(domain: Domain): Record<string, NodeEpistemic[]> {
  return Object.fromEntries(domain.nodes.map(n => [n.id, nodeToEpistemics(n)]));
}

function nodeToEpistemics(n: OntologyNode): NodeEpistemic[] {
  return (n.levels || []).map(L => {
    const aws = L.antiwitnesses || (L.antiwitness ? [L.antiwitness] : []);
    return {
      tier: L.tier,
      witness: L.witness?.prompt,
      traps: aws.map(a => a.trap).filter(Boolean),
    };
  });
}
