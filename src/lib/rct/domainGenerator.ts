import type { Domain, OntologyNode } from './types';

const FN_BASE = '/.netlify/functions';

function buildAccept(keywords: string[], negativeKeywords: string[]) {
  return (a: string) => {
    const x = (a || '').toLowerCase();
    const hit = (keywords || []).some(k => x.includes(String(k).toLowerCase()));
    const neg = (negativeKeywords || []).some(k => x.includes(String(k).toLowerCase()));
    return hit && !neg;
  };
}

interface RawWitness {
  prompt: string;
  example?: string;
  acceptKeywords?: string[];
  rejectKeywords?: string[];
}

interface RawAnti {
  mutation: string;
  prompt: string;
  trap: string;
  example?: string;
  acceptKeywords?: string[];
  rejectKeywords?: string[];
}

interface RawLevel {
  tier: 'Junior' | 'Mid' | 'Senior';
  anchor: { artifact: string; known: string };
  newCase: string;
  witness: RawWitness;
  antiwitness?: RawAnti;
  antiwitnesses?: RawAnti[];
  hints: [string, string];
}

interface RawNode {
  id: string;
  eat: { entity: string; action: string; target: string };
  label: string;
  gist?: string;
  example?: string;
  requires: string[];
  col: number;
  row: number;
  levels: RawLevel[];
}

export function hydrateGenerated(raw: { name: string; root: string; helloPom?: string | null; nodes: RawNode[]; generated?: boolean }): Domain {
  const nodes: OntologyNode[] = raw.nodes.map(n => ({
    ...n,
    levels: n.levels.map(L => {
      const aws = L.antiwitnesses || (L.antiwitness ? [L.antiwitness] : []);
      return {
        tier: L.tier,
        anchor: L.anchor,
        newCase: L.newCase,
        witness: {
          prompt: L.witness.prompt,
          example: L.witness.example,
          accept: buildAccept(L.witness.acceptKeywords || [], L.witness.rejectKeywords || []),
        },
        antiwitnesses: aws.map(a => ({
          mutation: a.mutation,
          prompt: a.prompt,
          trap: a.trap,
          example: a.example,
          accept: buildAccept(a.acceptKeywords || [], a.rejectKeywords || []),
        })),
        hints: L.hints,
      };
    }),
  }));

  return {
    name: raw.name,
    root: raw.root,
    nodes,
    helloPom: raw.helloPom || undefined,
    generated: true,
  };
}

export async function generateDomain(prompt: string, context: string): Promise<Domain> {
  const res = await fetch(`${FN_BASE}/rct-generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: prompt.trim(), context: context.trim() }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Generation failed');

  if (!data.nodes?.length) throw new Error('No nodes returned');
  data.nodes.forEach((n: RawNode) => {
    if (!n.id || !n.levels?.length) throw new Error(`Malformed node: ${n.id || '?'}`);
  });

  return hydrateGenerated(data);
}

export function domainKeyFromName(name: string): string {
  return 'gen:' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
}
