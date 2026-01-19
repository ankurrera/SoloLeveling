-- Create workout_sessions table to track individual workout sessions
CREATE TABLE public.workout_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  duration_minutes INTEGER,
  notes TEXT,
  total_xp_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create session_exercises table to track exercises within a session
CREATE TABLE public.session_exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  exercise_type TEXT, -- e.g., 'strength', 'cardio', 'flexibility'
  order_index INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create exercise_sets table to track individual sets and reps
CREATE TABLE public.exercise_sets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exercise_id UUID NOT NULL REFERENCES public.session_exercises(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL,
  reps INTEGER NOT NULL,
  weight NUMERIC, -- weight in user's preferred unit (kg or lbs)
  duration_seconds INTEGER, -- for timed exercises like planks
  distance_meters NUMERIC, -- for cardio exercises
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_sets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for workout_sessions
CREATE POLICY "Users can view their own sessions"
  ON public.workout_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sessions"
  ON public.workout_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
  ON public.workout_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
  ON public.workout_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS policies for session_exercises
CREATE POLICY "Users can view their own exercises"
  ON public.session_exercises FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.workout_sessions ws
    WHERE ws.id = session_exercises.session_id
    AND ws.user_id = auth.uid()
  ));

CREATE POLICY "Users can create exercises in their sessions"
  ON public.session_exercises FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.workout_sessions ws
    WHERE ws.id = session_exercises.session_id
    AND ws.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own exercises"
  ON public.session_exercises FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.workout_sessions ws
    WHERE ws.id = session_exercises.session_id
    AND ws.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own exercises"
  ON public.session_exercises FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.workout_sessions ws
    WHERE ws.id = session_exercises.session_id
    AND ws.user_id = auth.uid()
  ));

-- Create RLS policies for exercise_sets
CREATE POLICY "Users can view their own sets"
  ON public.exercise_sets FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.session_exercises se
    INNER JOIN public.workout_sessions ws ON ws.id = se.session_id
    WHERE se.id = exercise_sets.exercise_id
    AND ws.user_id = auth.uid()
  ));

CREATE POLICY "Users can create sets in their exercises"
  ON public.exercise_sets FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.session_exercises se
    INNER JOIN public.workout_sessions ws ON ws.id = se.session_id
    WHERE se.id = exercise_sets.exercise_id
    AND ws.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own sets"
  ON public.exercise_sets FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.session_exercises se
    INNER JOIN public.workout_sessions ws ON ws.id = se.session_id
    WHERE se.id = exercise_sets.exercise_id
    AND ws.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own sets"
  ON public.exercise_sets FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.session_exercises se
    INNER JOIN public.workout_sessions ws ON ws.id = se.session_id
    WHERE se.id = exercise_sets.exercise_id
    AND ws.user_id = auth.uid()
  ));

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_workout_sessions_updated_at
  BEFORE UPDATE ON public.workout_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_session_exercises_updated_at
  BEFORE UPDATE ON public.session_exercises
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_exercise_sets_updated_at
  BEFORE UPDATE ON public.exercise_sets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to calculate XP from session data
-- XP Reward System: 10 XP per exercise + 5 XP per set
-- This encourages both variety (different exercises) and volume (more sets)
CREATE OR REPLACE FUNCTION public.calculate_session_xp(session_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
  total_xp INTEGER := 0;
  exercise_count INTEGER;
  set_count INTEGER;
  XP_PER_EXERCISE CONSTANT INTEGER := 10;
  XP_PER_SET CONSTANT INTEGER := 5;
BEGIN
  -- Count exercises in session
  SELECT COUNT(*) INTO exercise_count
  FROM public.session_exercises
  WHERE session_id = session_id_param;
  
  -- Count total sets across all exercises
  SELECT COUNT(*) INTO set_count
  FROM public.exercise_sets es
  INNER JOIN public.session_exercises se ON se.id = es.exercise_id
  WHERE se.session_id = session_id_param;
  
  -- Calculate XP using reward constants
  total_xp := (exercise_count * XP_PER_EXERCISE) + (set_count * XP_PER_SET);
  
  RETURN total_xp;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to update profile stats after session
CREATE OR REPLACE FUNCTION public.update_profile_after_session()
RETURNS TRIGGER AS $$
DECLARE
  earned_xp INTEGER;
  current_level INTEGER;
  current_xp INTEGER;
  new_xp INTEGER;
  new_level INTEGER;
BEGIN
  -- Calculate XP for the session
  earned_xp := calculate_session_xp(NEW.id);
  
  -- Update session with earned XP
  UPDATE public.workout_sessions
  SET total_xp_earned = earned_xp
  WHERE id = NEW.id;
  
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
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to update profile after session is completed
CREATE TRIGGER update_profile_stats_after_session
  AFTER INSERT ON public.workout_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profile_after_session();
