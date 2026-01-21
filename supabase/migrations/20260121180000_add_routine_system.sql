-- Create muscle_groups table
CREATE TABLE public.muscle_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create exercises table with muscle group tags
CREATE TABLE public.exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  muscle_groups TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  equipment TEXT,
  difficulty TEXT, -- 'beginner', 'intermediate', 'advanced'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create routines table
CREATE TABLE public.routines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  muscle_groups TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  exercise_ids UUID[] NOT NULL DEFAULT ARRAY[]::UUID[],
  is_favorite BOOLEAN DEFAULT false,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workout_sets table for set-wise logging (separate from exercise_sets)
CREATE TABLE public.workout_sets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE RESTRICT,
  set_number INTEGER NOT NULL,
  weight_kg NUMERIC,
  reps INTEGER NOT NULL,
  rest_time_seconds INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add routine_id to workout_sessions
ALTER TABLE public.workout_sessions
ADD COLUMN routine_id UUID REFERENCES public.routines(id) ON DELETE SET NULL,
ADD COLUMN start_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN end_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN is_completed BOOLEAN DEFAULT false; -- Explicit completion flag, distinct from completion_time which is for audit trail

-- Enable Row Level Security
ALTER TABLE public.muscle_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sets ENABLE ROW LEVEL SECURITY;

-- RLS policies for muscle_groups (public read)
CREATE POLICY "Anyone can view muscle groups"
  ON public.muscle_groups FOR SELECT
  USING (true);

-- RLS policies for exercises (public read)
CREATE POLICY "Anyone can view exercises"
  ON public.exercises FOR SELECT
  USING (true);

-- RLS policies for routines
CREATE POLICY "Users can view their own routines"
  ON public.routines FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own routines"
  ON public.routines FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own routines"
  ON public.routines FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own routines"
  ON public.routines FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for workout_sets
CREATE POLICY "Users can view their own workout sets"
  ON public.workout_sets FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.workout_sessions ws
    WHERE ws.id = workout_sets.session_id
    AND ws.user_id = auth.uid()
  ));

CREATE POLICY "Users can create sets in their sessions"
  ON public.workout_sets FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.workout_sessions ws
    WHERE ws.id = workout_sets.session_id
    AND ws.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own sets"
  ON public.workout_sets FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.workout_sessions ws
    WHERE ws.id = workout_sets.session_id
    AND ws.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own sets"
  ON public.workout_sets FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.workout_sessions ws
    WHERE ws.id = workout_sets.session_id
    AND ws.user_id = auth.uid()
  ));

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_exercises_updated_at
  BEFORE UPDATE ON public.exercises
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_routines_updated_at
  BEFORE UPDATE ON public.routines
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workout_sets_updated_at
  BEFORE UPDATE ON public.workout_sets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better query performance
CREATE INDEX idx_exercises_muscle_groups ON public.exercises USING GIN (muscle_groups);
CREATE INDEX idx_routines_user_id ON public.routines(user_id);
CREATE INDEX idx_routines_muscle_groups ON public.routines USING GIN (muscle_groups);
CREATE INDEX idx_workout_sets_session_id ON public.workout_sets(session_id);
CREATE INDEX idx_workout_sets_exercise_id ON public.workout_sets(exercise_id);
CREATE INDEX idx_workout_sessions_routine_id ON public.workout_sessions(routine_id);

-- Seed muscle groups
INSERT INTO public.muscle_groups (name, description) VALUES
  ('Chest', 'Pectoral muscles - major and minor'),
  ('Back', 'Latissimus dorsi, trapezius, rhomboids'),
  ('Legs', 'Quadriceps, hamstrings, glutes, calves'),
  ('Shoulders', 'Deltoids - anterior, lateral, posterior'),
  ('Biceps', 'Biceps brachii and brachialis'),
  ('Triceps', 'Triceps brachii - long, lateral, medial heads'),
  ('Core', 'Abdominals, obliques, lower back');

-- Seed common exercises
INSERT INTO public.exercises (name, description, muscle_groups, equipment, difficulty) VALUES
  -- Chest exercises
  ('Bench Press', 'Classic compound chest exercise', ARRAY['Chest', 'Triceps', 'Shoulders'], 'Barbell', 'intermediate'),
  ('Incline Dumbbell Press', 'Upper chest focus', ARRAY['Chest', 'Shoulders', 'Triceps'], 'Dumbbells', 'intermediate'),
  ('Chest Fly', 'Isolation exercise for chest', ARRAY['Chest'], 'Dumbbells', 'beginner'),
  ('Push-ups', 'Bodyweight chest exercise', ARRAY['Chest', 'Triceps', 'Core'], 'Bodyweight', 'beginner'),
  ('Dips', 'Compound exercise for lower chest', ARRAY['Chest', 'Triceps'], 'Bodyweight', 'intermediate'),
  
  -- Back exercises
  ('Pull-ups', 'Classic back and biceps exercise', ARRAY['Back', 'Biceps'], 'Bodyweight', 'intermediate'),
  ('Barbell Row', 'Compound back exercise', ARRAY['Back', 'Biceps'], 'Barbell', 'intermediate'),
  ('Lat Pulldown', 'Machine-based back exercise', ARRAY['Back', 'Biceps'], 'Cable Machine', 'beginner'),
  ('Deadlift', 'Full-body compound exercise', ARRAY['Back', 'Legs', 'Core'], 'Barbell', 'advanced'),
  ('Face Pulls', 'Rear deltoid and upper back', ARRAY['Back', 'Shoulders'], 'Cable Machine', 'beginner'),
  
  -- Leg exercises
  ('Squat', 'King of leg exercises', ARRAY['Legs', 'Core'], 'Barbell', 'intermediate'),
  ('Leg Press', 'Machine-based leg exercise', ARRAY['Legs'], 'Machine', 'beginner'),
  ('Romanian Deadlift', 'Hamstring focus', ARRAY['Legs', 'Back'], 'Barbell', 'intermediate'),
  ('Leg Curl', 'Hamstring isolation', ARRAY['Legs'], 'Machine', 'beginner'),
  ('Leg Extension', 'Quadriceps isolation', ARRAY['Legs'], 'Machine', 'beginner'),
  ('Calf Raises', 'Calf muscle development', ARRAY['Legs'], 'Machine', 'beginner'),
  ('Lunges', 'Unilateral leg exercise', ARRAY['Legs'], 'Dumbbells', 'beginner'),
  
  -- Shoulder exercises
  ('Overhead Press', 'Primary shoulder builder', ARRAY['Shoulders', 'Triceps'], 'Barbell', 'intermediate'),
  ('Lateral Raises', 'Lateral deltoid isolation', ARRAY['Shoulders'], 'Dumbbells', 'beginner'),
  ('Front Raises', 'Anterior deltoid isolation', ARRAY['Shoulders'], 'Dumbbells', 'beginner'),
  ('Rear Delt Fly', 'Posterior deltoid isolation', ARRAY['Shoulders'], 'Dumbbells', 'beginner'),
  ('Arnold Press', 'Full deltoid development', ARRAY['Shoulders', 'Triceps'], 'Dumbbells', 'intermediate'),
  
  -- Bicep exercises
  ('Barbell Curl', 'Classic bicep builder', ARRAY['Biceps'], 'Barbell', 'beginner'),
  ('Hammer Curl', 'Brachialis focus', ARRAY['Biceps'], 'Dumbbells', 'beginner'),
  ('Preacher Curl', 'Isolated bicep exercise', ARRAY['Biceps'], 'Barbell', 'intermediate'),
  ('Concentration Curl', 'Peak contraction for biceps', ARRAY['Biceps'], 'Dumbbells', 'beginner'),
  
  -- Tricep exercises
  ('Tricep Pushdown', 'Cable tricep isolation', ARRAY['Triceps'], 'Cable Machine', 'beginner'),
  ('Overhead Tricep Extension', 'Long head focus', ARRAY['Triceps'], 'Dumbbells', 'beginner'),
  ('Close-Grip Bench Press', 'Compound tricep exercise', ARRAY['Triceps', 'Chest'], 'Barbell', 'intermediate'),
  ('Skull Crushers', 'Tricep isolation', ARRAY['Triceps'], 'Barbell', 'intermediate'),
  
  -- Core exercises
  ('Plank', 'Isometric core exercise', ARRAY['Core'], 'Bodyweight', 'beginner'),
  ('Crunches', 'Abdominal isolation', ARRAY['Core'], 'Bodyweight', 'beginner'),
  ('Russian Twists', 'Oblique focus', ARRAY['Core'], 'Bodyweight', 'beginner'),
  ('Hanging Leg Raises', 'Advanced core exercise', ARRAY['Core'], 'Bodyweight', 'advanced'),
  ('Cable Crunches', 'Weighted ab exercise', ARRAY['Core'], 'Cable Machine', 'intermediate');
