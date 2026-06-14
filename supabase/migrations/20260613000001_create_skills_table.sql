-- WitnessSkills: Initial database schema
-- Migration: 20260613000001

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Skills table
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

-- Indexes
create index if not exists skills_user_id_idx on public.skills(user_id);
create index if not exists skills_created_at_idx on public.skills(created_at desc);

-- Row Level Security
alter table public.skills enable row level security;

-- RLS Policies: users can only access their own skills
create policy "Users can view own skills"
  on public.skills for select
  using (auth.uid() = user_id);

create policy "Users can insert own skills"
  on public.skills for insert
  with check (auth.uid() = user_id);

create policy "Users can update own skills"
  on public.skills for update
  using (auth.uid() = user_id);

create policy "Users can delete own skills"
  on public.skills for delete
  using (auth.uid() = user_id);

-- Auto-update updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger skills_updated_at
  before update on public.skills
  for each row
  execute function public.handle_updated_at();
