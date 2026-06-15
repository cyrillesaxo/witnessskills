-- ApplyAI Feature: Job Applications & Scan Runs
-- Run this in your Supabase SQL editor after setup_all.sql

-- job_applications
create table if not exists public.job_applications (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade not null,
  company       text not null,
  title         text not null,
  url           text,
  email         text,
  resume_version text default 'A' check (resume_version in ('A', 'B')),
  status        text default 'sent' check (status in ('sent', 'opened', 'replied', 'rejected', 'interview')),
  jd_text       text,
  jd_skills     text[],
  source        text default 'manual' check (source in ('manual', 'scan', 'referral')),
  notes         text,
  sent_at       timestamptz default now(),
  updated_at    timestamptz default now()
);

alter table public.job_applications enable row level security;

create policy "Users manage own applications"
  on public.job_applications
  for all using (auth.uid() = user_id);

-- scan_runs
create table if not exists public.scan_runs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade not null,
  run_date      date default current_date,
  jobs_found    int default 0,
  emails_sent   int default 0,
  queries_used  text[],
  created_at    timestamptz default now()
);

alter table public.scan_runs enable row level security;

create policy "Users manage own scan runs"
  on public.scan_runs
  for all using (auth.uid() = user_id);

-- skill_gaps
create table if not exists public.skill_gaps (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade not null,
  skill_name    text not null,
  source        text default 'job_market',
  frequency     int default 1,
  added_to_learn boolean default false,
  first_seen    timestamptz default now(),
  updated_at    timestamptz default now()
);

alter table public.skill_gaps enable row level security;

create policy "Users manage own skill gaps"
  on public.skill_gaps
  for all using (auth.uid() = user_id);

-- indexes
create index if not exists idx_job_applications_user_id on public.job_applications(user_id);
create index if not exists idx_job_applications_sent_at on public.job_applications(sent_at desc);
create index if not exists idx_scan_runs_user_id on public.scan_runs(user_id);
create index if not exists idx_skill_gaps_user_id on public.skill_gaps(user_id);

-- updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_job_applications_updated
  before update on public.job_applications
  for each row execute procedure public.handle_updated_at();

create trigger on_skill_gaps_updated
  before update on public.skill_gaps
  for each row execute procedure public.handle_updated_at();
