-- Update the XP calculation system to work with client-side calculations
-- The client will calculate XP using the sophisticated formula and pass it to the database

-- Drop the old XP calculation function as we now calculate XP on the client
DROP FUNCTION IF EXISTS public.calculate_session_xp(UUID);

-- Update the profile update function to work with XP passed from client
CREATE OR REPLACE FUNCTION public.update_profile_after_session()
RETURNS TRIGGER AS $$
DECLARE
  earned_xp INTEGER;
  current_level INTEGER;
  current_xp INTEGER;
  new_xp INTEGER;
  new_level INTEGER;
BEGIN
  -- Only process completed sessions that have XP
  IF NEW.is_completed = true AND NEW.total_xp_earned IS NOT NULL THEN
    earned_xp := NEW.total_xp_earned;
    
    -- Get current profile stats
    SELECT level, xp INTO current_level, current_xp
    FROM public.profiles
    WHERE user_id = NEW.user_id;
    
    -- Calculate new XP and level
    new_xp := COALESCE(current_xp, 0) + earned_xp;
    new_level := COALESCE(current_level, 1);
    
    -- Level up logic: 100 XP per level
    WHILE new_xp >= (new_level * 100) LOOP
      new_xp := new_xp - (new_level * 100);
      new_level := new_level + 1;
    END LOOP;
    
    -- Update profile
    UPDATE public.profiles
    SET 
      xp = new_xp,
      level = new_level
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate the trigger to use the updated function
DROP TRIGGER IF EXISTS update_profile_stats_after_session ON public.workout_sessions;
CREATE TRIGGER update_profile_stats_after_session
  AFTER INSERT OR UPDATE ON public.workout_sessions
  FOR EACH ROW
  WHEN (NEW.is_completed = true AND NEW.total_xp_earned IS NOT NULL)
  EXECUTE FUNCTION public.update_profile_after_session();

-- Add helpful comment
COMMENT ON FUNCTION public.update_profile_after_session() IS 
'Updates user profile level and XP after session completion. XP is calculated on the client using the sophisticated formula that accounts for volume, intensity, work density, fatigue, and consistency.';
