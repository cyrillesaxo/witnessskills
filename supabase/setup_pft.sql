-- WitnessSkills: PFT Engine Setup
-- Combined migration for the Promoted Field-Test engine
-- Run this in Supabase Dashboard > SQL Editor
-- Migration files: 20260616000002_create_pft_engine.sql + 20260616000003_seed_pft_packs.sql

-- STEP 1: Enable UUID extension (may already exist)
create extension if not exists "uuid-ossp";

-- STEP 2: Run migration 20260616000002_create_pft_engine.sql
-- (Copy the full contents of supabase/migrations/20260616000002_create_pft_engine.sql here)

-- STEP 3: Run migration 20260616000003_seed_pft_packs.sql
-- (Copy the full contents of supabase/migrations/20260616000003_seed_pft_packs.sql here)

-- STEP 4: Verify the setup
select count(*) as pack_count from public.domain_packs where status = 'published';
select count(*) as node_count from public.mechanism_nodes;
select count(*) as mutation_count from public.antiwitness_mutations;
select count(*) as sig_count from public.misconception_signatures;

-- Expected results after running both migrations:
-- pack_count: 5
-- node_count: 17
-- mutation_count: 5
-- sig_count: 7

-- STEP 5: If you see 0 rows for domain_packs but no error,
-- the table was created but seed data needs to be applied.
-- Re-run migration 20260616000003_seed_pft_packs.sql.
