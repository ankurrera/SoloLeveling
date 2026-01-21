-- ============================================
-- Fix Workout Session Timestamp Tracking
-- ============================================
-- This migration fixes the critical bug where start_time is not being stored
-- and ensures proper timestamp and duration tracking for workout sessions.

-- 1. Add status column to track session state
ALTER TABLE public.workout_sessions 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' 
CHECK (status IN ('active', 'paused', 'completed'));

-- 2. Make start_time NOT NULL (with default to now())
-- First, backfill any NULL start_times with created_at or session_date
UPDATE public.workout_sessions
SET start_time = COALESCE(start_time, created_at, session_date)
WHERE start_time IS NULL;

-- Now make it NOT NULL
ALTER TABLE public.workout_sessions 
ALTER COLUMN start_time SET NOT NULL;

-- 3. Add validation constraint: end_time must be after start_time
ALTER TABLE public.workout_sessions 
ADD CONSTRAINT end_time_after_start_time 
CHECK (end_time IS NULL OR end_time > start_time);

-- 4. Update the duration calculation trigger to handle status changes
CREATE OR REPLACE FUNCTION update_session_duration()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure start_time is set on INSERT if not provided
  IF TG_OP = 'INSERT' AND NEW.start_time IS NULL THEN
    NEW.start_time := now();
  END IF;
  
  -- Override end_time with server time when status changes to 'completed'
  -- This ensures we always use server clock, not client clock
  IF NEW.status = 'completed' AND (TG_OP = 'INSERT' OR OLD.status != 'completed') THEN
    -- Set end_time to server time if not already set or if status just changed
    IF NEW.end_time IS NULL OR (TG_OP = 'UPDATE' AND OLD.status != 'completed') THEN
      NEW.end_time := now();
    END IF;
  END IF;
  
  -- Also handle legacy is_completed field
  IF NEW.is_completed = true AND (TG_OP = 'INSERT' OR OLD.is_completed IS DISTINCT FROM true) THEN
    IF NEW.end_time IS NULL THEN
      NEW.end_time := now();
    END IF;
  END IF;
  
  -- Automatically calculate duration when end_time is set
  IF NEW.end_time IS NOT NULL AND NEW.start_time IS NOT NULL THEN
    NEW.duration_minutes := ROUND(
      EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 60
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Backfill duration_minutes for existing sessions with timestamps but no duration
UPDATE public.workout_sessions
SET duration_minutes = ROUND(EXTRACT(EPOCH FROM (end_time - start_time)) / 60)
WHERE start_time IS NOT NULL 
  AND end_time IS NOT NULL 
  AND duration_minutes IS NULL;

-- 6. Update status for completed sessions
UPDATE public.workout_sessions
SET status = 'completed'
WHERE (is_completed = true OR end_time IS NOT NULL OR completion_time IS NOT NULL)
  AND status != 'completed';

-- 7. Add helpful comments
COMMENT ON COLUMN public.workout_sessions.status IS 
  'Current status of the workout session: active (ongoing), paused (temporarily stopped), completed (finished)';
COMMENT ON COLUMN public.workout_sessions.start_time IS 
  'Server timestamp when workout session started. Set automatically on creation. NOT NULL.';
COMMENT ON COLUMN public.workout_sessions.end_time IS 
  'Server timestamp when workout session completed. Set automatically when status changes to completed.';
COMMENT ON COLUMN public.workout_sessions.duration_minutes IS 
  'Duration in minutes, automatically calculated from end_time - start_time. Do not set manually.';
