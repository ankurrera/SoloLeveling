-- Create function to calculate user statistics from workout sessions
-- This includes: Strength, Endurance, Recovery, Consistency, and Mobility

-- Function to get total workout volume for strength calculation
CREATE OR REPLACE FUNCTION public.calculate_total_volume(user_id_param UUID)
RETURNS NUMERIC AS $$
DECLARE
  total_volume NUMERIC := 0;
BEGIN
  SELECT COALESCE(SUM(es.weight_kg * es.reps), 0) INTO total_volume
  FROM public.exercise_sets es
  INNER JOIN public.session_exercises se ON se.id = es.exercise_id
  INNER JOIN public.workout_sessions ws ON ws.id = se.session_id
  WHERE ws.user_id = user_id_param;
  
  RETURN total_volume;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to calculate progressive overload (for Strength stat)
-- Tracks if recent sessions have higher weights than older sessions
CREATE OR REPLACE FUNCTION public.calculate_strength_stat(user_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
  total_sessions INTEGER;
  total_volume NUMERIC;
  recent_volume NUMERIC;
  base_strength INTEGER := 30;
  strength_from_sessions INTEGER;
  strength_from_progression INTEGER;
  final_strength INTEGER;
BEGIN
  -- Count total sessions
  SELECT COUNT(*) INTO total_sessions
  FROM public.workout_sessions
  WHERE user_id = user_id_param;
  
  -- Get total volume
  total_volume := calculate_total_volume(user_id_param);
  
  -- Get volume from last 30 days
  SELECT COALESCE(SUM(es.weight_kg * es.reps), 0) INTO recent_volume
  FROM public.exercise_sets es
  INNER JOIN public.session_exercises se ON se.id = es.exercise_id
  INNER JOIN public.workout_sessions ws ON ws.id = se.session_id
  WHERE ws.user_id = user_id_param
    AND ws.session_date > (NOW() - INTERVAL '30 days');
  
  -- Calculate strength: base + sessions contribution + progression
  strength_from_sessions := LEAST(40, total_sessions * 2);
  strength_from_progression := LEAST(30, FLOOR(total_volume / 1000));
  
  final_strength := base_strength + strength_from_sessions + strength_from_progression;
  
  RETURN LEAST(100, final_strength);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to calculate endurance (based on session duration and total reps)
CREATE OR REPLACE FUNCTION public.calculate_endurance_stat(user_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
  total_hours NUMERIC;
  total_reps INTEGER;
  base_endurance INTEGER := 25;
  endurance_from_time INTEGER;
  endurance_from_reps INTEGER;
  final_endurance INTEGER;
BEGIN
  -- Get total training hours
  SELECT COALESCE(SUM(duration_minutes), 0) / 60.0 INTO total_hours
  FROM public.workout_sessions
  WHERE user_id = user_id_param;
  
  -- Get total reps across all exercises
  SELECT COALESCE(SUM(es.reps), 0) INTO total_reps
  FROM public.exercise_sets es
  INNER JOIN public.session_exercises se ON se.id = es.exercise_id
  INNER JOIN public.workout_sessions ws ON ws.id = se.session_id
  WHERE ws.user_id = user_id_param;
  
  -- Calculate endurance
  endurance_from_time := LEAST(45, FLOOR(total_hours * 3));
  endurance_from_reps := LEAST(30, FLOOR(total_reps / 100));
  
  final_endurance := base_endurance + endurance_from_time + endurance_from_reps;
  
  RETURN LEAST(100, final_endurance);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to calculate recovery (based on rest days and avoiding overtraining)
CREATE OR REPLACE FUNCTION public.calculate_recovery_stat(user_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
  sessions_last_7_days INTEGER;
  sessions_last_30_days INTEGER;
  days_since_last_session INTEGER;
  base_recovery INTEGER := 50;
  recovery_penalty INTEGER := 0;
  recovery_bonus INTEGER := 0;
  final_recovery INTEGER;
BEGIN
  -- Count sessions in last 7 days
  SELECT COUNT(*) INTO sessions_last_7_days
  FROM public.workout_sessions
  WHERE user_id = user_id_param
    AND session_date > (NOW() - INTERVAL '7 days');
  
  -- Count sessions in last 30 days
  SELECT COUNT(*) INTO sessions_last_30_days
  FROM public.workout_sessions
  WHERE user_id = user_id_param
    AND session_date > (NOW() - INTERVAL '30 days');
  
  -- Get days since last session
  SELECT COALESCE(EXTRACT(DAY FROM NOW() - MAX(session_date)), 999) INTO days_since_last_session
  FROM public.workout_sessions
  WHERE user_id = user_id_param;
  
  -- Penalize overtraining (more than 5 sessions per week)
  IF sessions_last_7_days > 5 THEN
    recovery_penalty := (sessions_last_7_days - 5) * 10;
  END IF;
  
  -- Bonus for having rest days (ideal is 3-4 sessions per week)
  IF sessions_last_7_days >= 3 AND sessions_last_7_days <= 4 THEN
    recovery_bonus := 20;
  ELSIF sessions_last_7_days >= 2 AND sessions_last_7_days <= 5 THEN
    recovery_bonus := 10;
  END IF;
  
  -- Penalty for being inactive too long
  IF days_since_last_session > 7 THEN
    recovery_penalty := recovery_penalty + LEAST(30, (days_since_last_session - 7) * 5);
  END IF;
  
  final_recovery := base_recovery + recovery_bonus - recovery_penalty;
  
  RETURN LEAST(100, GREATEST(0, final_recovery));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to calculate consistency (percentage of planned vs completed sessions)
CREATE OR REPLACE FUNCTION public.calculate_consistency_stat(user_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
  sessions_last_30_days INTEGER;
  ideal_sessions INTEGER := 12; -- 3 per week for 4 weeks
  consistency_percentage NUMERIC;
BEGIN
  -- Count sessions in last 30 days
  SELECT COUNT(*) INTO sessions_last_30_days
  FROM public.workout_sessions
  WHERE user_id = user_id_param
    AND session_date > (NOW() - INTERVAL '30 days');
  
  -- Calculate consistency as percentage of ideal
  consistency_percentage := (sessions_last_30_days::NUMERIC / ideal_sessions::NUMERIC) * 100;
  
  RETURN LEAST(100, FLOOR(consistency_percentage));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to calculate mobility (based on session variety and exercise types)
-- For now, we'll base it on exercise variety and session count
CREATE OR REPLACE FUNCTION public.calculate_mobility_stat(user_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
  unique_exercises INTEGER;
  total_sessions INTEGER;
  base_mobility INTEGER := 30;
  mobility_from_variety INTEGER;
  mobility_from_sessions INTEGER;
  final_mobility INTEGER;
BEGIN
  // Count unique exercise names
  SELECT COUNT(DISTINCT LOWER(exercise_name)) INTO unique_exercises
  FROM public.session_exercises se
  INNER JOIN public.workout_sessions ws ON ws.id = se.session_id
  WHERE ws.user_id = user_id_param;
  
  -- Count total sessions
  SELECT COUNT(*) INTO total_sessions
  FROM public.workout_sessions
  WHERE user_id = user_id_param;
  
  -- Calculate mobility
  mobility_from_variety := LEAST(40, unique_exercises * 2);
  mobility_from_sessions := LEAST(30, total_sessions);
  
  final_mobility := base_mobility + mobility_from_variety + mobility_from_sessions;
  
  RETURN LEAST(100, final_mobility);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add functional index for case-insensitive exercise name searches
-- This improves performance of the mobility stat calculation
CREATE INDEX IF NOT EXISTS idx_session_exercises_lower_name 
  ON public.session_exercises (LOWER(exercise_name));

-- Function to calculate all stats at once
CREATE OR REPLACE FUNCTION public.calculate_user_stats(user_id_param UUID)
RETURNS TABLE(
  strength INTEGER,
  endurance INTEGER,
  recovery INTEGER,
  consistency INTEGER,
  mobility INTEGER,
  health INTEGER
) AS $$
DECLARE
  str INTEGER;
  end_stat INTEGER;
  rec INTEGER;
  con INTEGER;
  mob INTEGER;
  hlth INTEGER;
BEGIN
  str := calculate_strength_stat(user_id_param);
  end_stat := calculate_endurance_stat(user_id_param);
  rec := calculate_recovery_stat(user_id_param);
  con := calculate_consistency_stat(user_id_param);
  mob := calculate_mobility_stat(user_id_param);
  
  -- Health is average of recovery, endurance, and consistency
  hlth := FLOOR((rec + end_stat + con) / 3.0);
  
  RETURN QUERY SELECT str, end_stat, rec, con, mob, hlth;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to get activity calendar (training days in a given month)
CREATE OR REPLACE FUNCTION public.get_training_calendar(
  user_id_param UUID,
  year_param INTEGER,
  month_param INTEGER
)
RETURNS TABLE(day_of_month INTEGER, has_workout BOOLEAN) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    EXTRACT(DAY FROM session_date)::INTEGER as day_of_month,
    TRUE as has_workout
  FROM public.workout_sessions
  WHERE user_id = user_id_param
    AND EXTRACT(YEAR FROM session_date) = year_param
    AND EXTRACT(MONTH FROM session_date) = month_param
  ORDER BY session_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to calculate behavior patterns for "potions"
CREATE OR REPLACE FUNCTION public.calculate_behavior_patterns(user_id_param UUID)
RETURNS TABLE(
  rest_days INTEGER,
  consistency_streaks INTEGER,
  deload_weeks INTEGER,
  recovery_patterns INTEGER
) AS $$
DECLARE
  rest_count INTEGER;
  streak_count INTEGER;
  deload_count INTEGER;
  recovery_count INTEGER;
BEGIN
  -- Count rest days in last 30 days (days without workouts)
  SELECT 30 - COUNT(*) INTO rest_count
  FROM public.workout_sessions
  WHERE user_id = user_id_param
    AND session_date > (NOW() - INTERVAL '30 days');
  
  -- Count weeks with consistent training (3+ sessions per week)
  SELECT COUNT(*) INTO streak_count
  FROM (
    SELECT 
      DATE_TRUNC('week', session_date) as week,
      COUNT(*) as sessions_in_week
    FROM public.workout_sessions
    WHERE user_id = user_id_param
      AND session_date > (NOW() - INTERVAL '90 days')
    GROUP BY DATE_TRUNC('week', session_date)
    HAVING COUNT(*) >= 3
  ) weeks;
  
  -- Count deload weeks (weeks with 1-2 sessions when normally doing 3+)
  SELECT COUNT(*) INTO deload_count
  FROM (
    SELECT 
      DATE_TRUNC('week', session_date) as week,
      COUNT(*) as sessions_in_week
    FROM public.workout_sessions
    WHERE user_id = user_id_param
      AND session_date > (NOW() - INTERVAL '90 days')
    GROUP BY DATE_TRUNC('week', session_date)
    HAVING COUNT(*) BETWEEN 1 AND 2
  ) weeks;
  
  -- Recovery patterns based on proper rest between sessions
  recovery_count := LEAST(10, FLOOR(rest_count / 3));
  
  RETURN QUERY SELECT rest_count, streak_count, deload_count, recovery_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
