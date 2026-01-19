-- Update XP calculation to follow the proper formula:
-- XP = (total_volume / 100) + (session_duration × 0.5)
-- This rewards both volume (weight × reps) and time spent training

-- Drop the old function and recreate with new formula
DROP FUNCTION IF EXISTS public.calculate_session_xp(UUID);

CREATE OR REPLACE FUNCTION public.calculate_session_xp(session_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
  total_xp INTEGER := 0;
  total_volume NUMERIC := 0;
  session_duration INTEGER := 0;
  volume_xp NUMERIC;
  duration_xp NUMERIC;
BEGIN
  -- Get session duration
  SELECT COALESCE(duration_minutes, 0) INTO session_duration
  FROM public.workout_sessions
  WHERE id = session_id_param;
  
  -- Calculate total volume (weight × reps) for this session
  SELECT COALESCE(SUM(es.weight_kg * es.reps), 0) INTO total_volume
  FROM public.exercise_sets es
  INNER JOIN public.session_exercises se ON se.id = es.exercise_id
  WHERE se.session_id = session_id_param;
  
  -- Apply XP formula: (volume / 100) + (duration × 0.5)
  volume_xp := total_volume / 100.0;
  duration_xp := session_duration * 0.5;
  
  total_xp := FLOOR(volume_xp + duration_xp);
  
  -- Ensure minimum XP of 10 for any completed session
  IF total_xp < 10 THEN
    total_xp := 10;
  END IF;
  
  RETURN total_xp;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- The update_profile_after_session function already exists and will use this updated calculation
-- No need to modify it as it calls calculate_session_xp
