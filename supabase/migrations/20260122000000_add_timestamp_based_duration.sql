-- ============================================
-- Timestamp-Based Duration Tracking
-- ============================================
-- This migration enables automatic duration calculation from start_time and end_time
-- Removes the need for manual duration input
-- Uses server-side timestamps for security and accuracy

-- Add default value for start_time to use server timestamp
DO $$ 
BEGIN
  ALTER TABLE public.workout_sessions 
    ALTER COLUMN start_time SET DEFAULT now();
EXCEPTION
  WHEN others THEN
    NULL; -- Ignore if already has default
END $$;

-- Add a trigger to automatically calculate duration_minutes and ensure server timestamps
CREATE OR REPLACE FUNCTION update_session_duration()
RETURNS TRIGGER AS $$
BEGIN
  -- Override end_time with server time when it's being set
  -- This ensures we always use server clock, not client clock
  IF NEW.end_time IS NOT NULL THEN
    -- For INSERT or UPDATE, if end_time is being set, use server time
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.end_time IS NULL) THEN
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

-- Drop trigger if it exists and recreate
DROP TRIGGER IF EXISTS calculate_duration_on_end_time ON public.workout_sessions;

CREATE TRIGGER calculate_duration_on_end_time
  BEFORE INSERT OR UPDATE ON public.workout_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_session_duration();

-- Backfill duration_minutes for existing sessions that have start_time and end_time
UPDATE public.workout_sessions
SET duration_minutes = ROUND(EXTRACT(EPOCH FROM (end_time - start_time)) / 60)
WHERE start_time IS NOT NULL 
  AND end_time IS NOT NULL 
  AND duration_minutes IS NULL;

-- Add comment to document the new behavior
COMMENT ON COLUMN public.workout_sessions.duration_minutes IS 
  'Duration in minutes, automatically calculated from end_time - start_time. Should not be manually set.';
COMMENT ON COLUMN public.workout_sessions.start_time IS 
  'Server timestamp when workout session started. Set on session creation.';
COMMENT ON COLUMN public.workout_sessions.end_time IS 
  'Server timestamp when workout session completed. Set on completion.';
