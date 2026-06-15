-- WitnessSkills: RCT evidence fields for Learn → Skills integration
-- Migration: 20260615000001

alter table public.skills
  add column if not exists source text not null default 'manual'
    check (source in ('manual', 'rct')),
  add column if not exists rct_node_id text,
  add column if not exists rct_domain text,
  add column if not exists rct_tier text,
  add column if not exists rct_cret numeric(4,3),
  add column if not exists rct_cleared_at timestamptz;

create index if not exists skills_rct_node_idx on public.skills(user_id, rct_node_id, rct_tier)
  where source = 'rct';
