-- Add fatigue tracking to profiles table
-- Fatigue represents accumulated training stress (0-100)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS fatigue_level INTEGER DEFAULT 0 CHECK (fatigue_level >= 0 AND fatigue_level <= 100);

-- Add completion tracking to workout_sessions table
ALTER TABLE public.workout_sessions 
ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS completion_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT false;

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.fatigue_level IS 'Accumulated training stress level (0-100). Affects XP efficiency.';
COMMENT ON COLUMN public.workout_sessions.is_completed IS 'Whether the workout session has been marked as complete';
COMMENT ON COLUMN public.workout_sessions.completion_time IS 'Timestamp when the session was marked as complete';
COMMENT ON COLUMN public.workout_sessions.is_edited IS 'Whether the session was edited after completion (applies 0.8x multiplier to XP)';

-- Create function to update fatigue level after workout
-- Fatigue increases based on workout intensity and decreases over time
CREATE OR REPLACE FUNCTION public.update_fatigue_after_session()
RETURNS TRIGGER AS $$
DECLARE
  current_fatigue INTEGER;
  session_xp INTEGER;
  fatigue_increase INTEGER;
  new_fatigue INTEGER;
BEGIN
  -- Only process when session is marked as completed
  IF NEW.is_completed = true AND (OLD.is_completed IS NULL OR OLD.is_completed = false) THEN
    -- Get current fatigue level
    SELECT COALESCE(fatigue_level, 0) INTO current_fatigue
    FROM public.profiles
    WHERE user_id = NEW.user_id;
    
    -- Get session XP (higher XP = more fatigue)
    session_xp := COALESCE(NEW.total_xp_earned, 0);
    
    -- Calculate fatigue increase (XP / 5, capped at 25 per session)
    fatigue_increase := LEAST(25, session_xp / 5);
    
    -- Add to current fatigue
    new_fatigue := LEAST(100, current_fatigue + fatigue_increase);
    
    -- Update profile fatigue
    UPDATE public.profiles
    SET fatigue_level = new_fatigue
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to update fatigue after session completion
DROP TRIGGER IF EXISTS update_fatigue_on_session_complete ON public.workout_sessions;
CREATE TRIGGER update_fatigue_on_session_complete
  AFTER UPDATE ON public.workout_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_fatigue_after_session();

-- Create function to recover fatigue over time (called periodically)
-- Fatigue decreases by ~5 points per day of rest
CREATE OR REPLACE FUNCTION public.recover_fatigue_for_user(user_id_param UUID)
RETURNS void AS $$
DECLARE
  days_since_last_session NUMERIC;
  current_fatigue INTEGER;
  recovery_amount INTEGER;
  new_fatigue INTEGER;
BEGIN
  -- Get current fatigue
  SELECT COALESCE(fatigue_level, 0) INTO current_fatigue
  FROM public.profiles
  WHERE user_id = user_id_param;
  
  -- Get days since last session
  SELECT COALESCE(EXTRACT(EPOCH FROM (NOW() - MAX(session_date))) / 86400, 0) INTO days_since_last_session
  FROM public.workout_sessions
  WHERE user_id = user_id_param;
  
  -- Calculate recovery (5 points per day)
  recovery_amount := FLOOR(days_since_last_session * 5);
  
  -- Update fatigue (cannot go below 0)
  new_fatigue := GREATEST(0, current_fatigue - recovery_amount);
  
  -- Update profile
  UPDATE public.profiles
  SET fatigue_level = new_fatigue
  WHERE user_id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
