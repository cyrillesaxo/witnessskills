-- Migration: Add sent_at column to job_applications table
-- BUG-001 fix: The ORDER BY sent_at was failing because the column didn't exist.
-- This migration adds sent_at with a default of created_at for existing rows.

-- Add sent_at column if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'job_applications' AND column_name = 'sent_at'
  ) THEN
    ALTER TABLE job_applications 
    ADD COLUMN sent_at timestamptz DEFAULT now();
    
    -- Backfill existing rows from created_at
    UPDATE job_applications SET sent_at = created_at WHERE sent_at IS NULL;
  END IF;
END $$;

-- Also ensure RLS policies exist for skill_gaps table (BUG-002/BUG-008)
-- This is a no-op if policies already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'skill_gaps' AND policyname = 'Users can manage their own skill gaps'
  ) THEN
    CREATE POLICY "Users can manage their own skill gaps"
    ON skill_gaps
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
