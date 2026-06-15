-- WitnessSkills: full database setup (run once in Supabase SQL editor)
-- Combines migrations 20260613000001 + 20260615000001

create extension if not exists "uuid-ossp";

create table if not exists public.skills (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  level text not null check (level in ('beginner', 'intermediate', 'advanced', 'expert')),
  evidence text,
  tags text[] default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists skills_user_id_idx on public.skills(user_id);
create index if not exists skills_created_at_idx on public.skills(created_at desc);

alter table public.skills enable row level security;

do $$ begin
  create policy "Users can view own skills" on public.skills for select using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Users can insert own skills" on public.skills for insert with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Users can update own skills" on public.skills for update using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Users can delete own skills" on public.skills for delete using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists skills_updated_at on public.skills;
create trigger skills_updated_at
  before update on public.skills
  for each row
  execute function public.handle_updated_at();

-- RCT fields for Learn → Skills integration
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
