-- WitnessSkills · PackSpec persistence layer
-- Learner PackSpec table: stores one RCT convergence record per (user, skill_id)
-- Run in Supabase SQL editor after setup_all.sql

create extension if not exists "uuid-ossp";

-- ── learner_packspecs ──────────────────────────────────────────────────────
-- Each row is a PackSpec for one learner × one skill (CUS scope):
--   pack          JSONB  – full PackSpec document (schema v0.1 CUS)
--   iteration     int    – RC convergence iteration count (Theorem 11)
--   H_total       float  – current total governance entropy (bits)
--   L_t_min       float  – lowest temporal reliability across admitted witnesses
--   status        text   – 'converging' | 'certified' | 'decaying'
--   last_probe_at timestamptz – when the last regimeReader session event was received

create table if not exists public.learner_packspecs (
    id              uuid primary key default uuid_generate_v4(),
    user_id         uuid not null references auth.users(id) on delete cascade,
    skill_id        uuid not null references public.skills(id) on delete cascade,
    pack            jsonb not null default '{}',
    iteration       integer not null default 0,
    H_total         numeric(8,4) not null default 42.0,
    L_t_min         numeric(5,4) not null default 0.5,
    status          text not null default 'converging'
                      check (status in ('converging', 'certified', 'decaying')),
    last_probe_at   timestamptz,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now(),
    unique (user_id, skill_id)
  );

create index if not exists lps_user_skill_idx  on public.learner_packspecs(user_id, skill_id);
create index if not exists lps_status_idx      on public.learner_packspecs(status);
create index if not exists lps_H_total_idx     on public.learner_packspecs(H_total);

-- ── Row-Level Security ─────────────────────────────────────────────────────
alter table public.learner_packspecs enable row level security;

do $$ begin
  create policy "Users can view own packspecs"
    on public.learner_packspecs for select using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Users can insert own packspecs"
    on public.learner_packspecs for insert with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Users can update own packspecs"
    on public.learner_packspecs for update using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Users can delete own packspecs"
    on public.learner_packspecs for delete using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- ── updated_at trigger ─────────────────────────────────────────────────────
drop trigger if exists lps_updated_at on public.learner_packspecs;
create trigger lps_updated_at
  before update on public.learner_packspecs
  for each row execute function public.handle_updated_at();

-- ── witness_events ─────────────────────────────────────────────────────────
-- Append-only probe channel: each row is one session event from regimeReader.
-- These are the raw witness promotion events that drive PackSpec iteration.

create table if not exists public.witness_events (
    id              uuid primary key default uuid_generate_v4(),
    user_id         uuid not null references auth.users(id) on delete cascade,
    skill_id        uuid not null references public.skills(id) on delete cascade,
    packspec_id     uuid not null references public.learner_packspecs(id) on delete cascade,
    location        text not null,  -- depth | breadth | channel | frame | implicature
  verdict         text not null,  -- converged | shallow | trap | off
  regime_depth    integer,        -- R1..R5 slider position
  doc_name        text,
    admitted        boolean not null default false,
    posterior       numeric(5,4),
    created_at      timestamptz not null default now()
  );

create index if not exists we_user_skill_idx on public.witness_events(user_id, skill_id);
create index if not exists we_location_idx   on public.witness_events(location);
create index if not exists we_admitted_idx   on public.witness_events(admitted);

alter table public.witness_events enable row level security;

do $$ begin
  create policy "Users can view own witness events"
    on public.witness_events for select using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Users can insert own witness events"
    on public.witness_events for insert with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
