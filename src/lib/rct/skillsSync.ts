import { supabase } from '../supabase';
import type { OntologyNode } from './types';

export type SyncResult = { ok: true } | { ok: false; error: string };

export async function upsertRctEvidence(
  userId: string,
  domainName: string,
  node: OntologyNode,
  levelIndex: number,
  cret: number,
): Promise<SyncResult> {
  const level = node.levels[levelIndex];
  if (!level) return { ok: true };

  const skillName = `${domainName}: ${node.label} (${level.tier})`;
  const evidence = [
    `RCT convergence cleared at ${level.tier} tier.`,
    `Anchor: ${level.anchor.artifact}`,
    `New case: ${level.newCase}`,
    `Witness: ${level.witness.prompt}`,
    `C_ret score: ${cret.toFixed(2)}`,
  ].join('\n');

  const { data: existing, error: lookupErr } = await supabase
    .from('skills')
    .select('id')
    .eq('user_id', userId)
    .eq('rct_node_id', node.id)
    .eq('rct_tier', level.tier)
    .maybeSingle();

  if (lookupErr) return { ok: false, error: lookupErr.message };

  const payload = {
    user_id: userId,
    name: skillName,
    level: tierToSkillLevel(level.tier),
    evidence,
    tags: ['rct', domainName.toLowerCase(), node.id],
    source: 'rct' as const,
    rct_node_id: node.id,
    rct_domain: domainName,
    rct_tier: level.tier,
    rct_cret: cret,
    rct_cleared_at: new Date().toISOString(),
  };

  const { error } = existing?.id
    ? await supabase.from('skills').update(payload).eq('id', existing.id)
    : await supabase.from('skills').insert(payload);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

function tierToSkillLevel(tier: string): 'beginner' | 'intermediate' | 'advanced' | 'expert' {
  if (tier === 'Junior') return 'beginner';
  if (tier === 'Mid') return 'intermediate';
  if (tier === 'Senior') return 'expert';
  return 'advanced';
}
