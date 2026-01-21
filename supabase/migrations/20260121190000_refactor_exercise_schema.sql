-- ============================================
-- Refactor Exercise Schema with Normalized Relations
-- ============================================
-- This migration transforms the exercises table from using TEXT[] arrays
-- to a properly normalized schema with junction tables for many-to-many relationships.
-- All operations are idempotent and safe to run multiple times.

-- ============================================
-- 1. CREATE EQUIPMENT TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.equipment (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- 2. UPDATE MUSCLE_GROUPS TABLE
-- ============================================
-- Ensure muscle_groups has the correct structure (already exists from previous migration)
-- Add any missing columns if needed
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'muscle_groups' 
    AND column_name = 'description'
  ) THEN
    ALTER TABLE public.muscle_groups ADD COLUMN description TEXT;
  END IF;
END $$;

-- ============================================
-- 3. ALTER EXERCISES TABLE
-- ============================================
-- Add new columns if they don't exist
DO $$ 
BEGIN
  -- Add difficulty column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'exercises' 
    AND column_name = 'difficulty'
    AND (data_type = 'character' OR udt_name = 'bpchar')
  ) THEN
    -- First drop the old difficulty column if it exists as TEXT
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'exercises' 
      AND column_name = 'difficulty'
      AND data_type = 'text'
    ) THEN
      ALTER TABLE public.exercises DROP COLUMN difficulty;
    END IF;
    
    ALTER TABLE public.exercises 
    ADD COLUMN difficulty CHAR(1) CHECK (difficulty IN ('B', 'I', 'A'));
  END IF;
  
  -- Add is_cardio column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'exercises' 
    AND column_name = 'is_cardio'
  ) THEN
    ALTER TABLE public.exercises ADD COLUMN is_cardio BOOLEAN DEFAULT false;
  END IF;
END $$;

-- ============================================
-- 4. CREATE JUNCTION TABLES
-- ============================================
CREATE TABLE IF NOT EXISTS public.exercise_muscle_groups (
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  muscle_group_id UUID NOT NULL REFERENCES public.muscle_groups(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (exercise_id, muscle_group_id)
);

CREATE TABLE IF NOT EXISTS public.exercise_equipment (
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  equipment_id UUID NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (exercise_id, equipment_id)
);

-- ============================================
-- 5. ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_muscle_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_equipment ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. CREATE RLS POLICIES (Public Read)
-- ============================================
DROP POLICY IF EXISTS "Anyone can view equipment" ON public.equipment;
CREATE POLICY "Anyone can view equipment"
  ON public.equipment FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can view exercise_muscle_groups" ON public.exercise_muscle_groups;
CREATE POLICY "Anyone can view exercise_muscle_groups"
  ON public.exercise_muscle_groups FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can view exercise_equipment" ON public.exercise_equipment;
CREATE POLICY "Anyone can view exercise_equipment"
  ON public.exercise_equipment FOR SELECT
  USING (true);

-- ============================================
-- 7. CREATE INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_exercise_muscle_groups_exercise_id 
  ON public.exercise_muscle_groups(exercise_id);
CREATE INDEX IF NOT EXISTS idx_exercise_muscle_groups_muscle_group_id 
  ON public.exercise_muscle_groups(muscle_group_id);
CREATE INDEX IF NOT EXISTS idx_exercise_equipment_exercise_id 
  ON public.exercise_equipment(exercise_id);
CREATE INDEX IF NOT EXISTS idx_exercise_equipment_equipment_id 
  ON public.exercise_equipment(equipment_id);

-- ============================================
-- 8. CLEAR EXISTING DATA (Idempotent)
-- ============================================
-- WARNING: This will delete all existing exercise data!
-- The migration re-seeds with the complete exercise dataset from the problem statement.
-- If you have custom exercises or user data dependent on exercises, back up before running.

-- Clear junction tables first (foreign key constraints)
TRUNCATE TABLE public.exercise_equipment CASCADE;
TRUNCATE TABLE public.exercise_muscle_groups CASCADE;
-- Clear exercises (will be re-seeded)
TRUNCATE TABLE public.exercises CASCADE;
-- Clear muscle groups and equipment (will be re-seeded)
TRUNCATE TABLE public.muscle_groups CASCADE;
TRUNCATE TABLE public.equipment CASCADE;

-- ============================================
-- 9. SEED MUSCLE GROUPS
-- ============================================
INSERT INTO public.muscle_groups (name) VALUES
  ('Chest'),
  ('Back'),
  ('Shoulders'),
  ('Biceps'),
  ('Triceps'),
  ('Forearms'),
  ('Abs / Core'),
  ('Legs'),
  ('Calves'),
  ('Glutes'),
  ('Cardio / Conditioning'),
  ('Neck')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 10. SEED EQUIPMENT
-- ============================================
INSERT INTO public.equipment (name) VALUES
  ('Dumbbells'),
  ('Barbells'),
  ('Smith Machine'),
  ('Cable Machine'),
  ('Pec Deck'),
  ('Benches'),
  ('Lat Pulldown Machine'),
  ('Pull-Up Machine'),
  ('Lower Back Machine'),
  ('Leg Press Machine'),
  ('Leg Curl Machine'),
  ('Calves Machine'),
  ('Treadmill'),
  ('Cycling Cycle'),
  ('Boxing Bag'),
  ('Bodyweight'),
  ('Bicep Curl Machine')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 11. SEED EXERCISES WITH DIFFICULTY AND CARDIO FLAG
-- ============================================

-- Helper function to insert exercise and link to muscle groups and equipment
CREATE OR REPLACE FUNCTION insert_exercise_with_relations(
  p_name TEXT,
  p_difficulty CHAR(1),
  p_is_cardio BOOLEAN,
  p_muscle_groups TEXT[],
  p_equipment TEXT[]
) RETURNS VOID AS $$
DECLARE
  v_exercise_id UUID;
  v_muscle_group_id UUID;
  v_equipment_id UUID;
  v_muscle_group TEXT;
  v_equipment_item TEXT;
BEGIN
  -- Insert or get exercise
  INSERT INTO public.exercises (name, difficulty, is_cardio)
  VALUES (p_name, p_difficulty, p_is_cardio)
  ON CONFLICT (name) DO UPDATE SET 
    difficulty = EXCLUDED.difficulty,
    is_cardio = EXCLUDED.is_cardio
  RETURNING id INTO v_exercise_id;
  
  -- Link muscle groups
  FOREACH v_muscle_group IN ARRAY p_muscle_groups
  LOOP
    SELECT id INTO v_muscle_group_id 
    FROM public.muscle_groups 
    WHERE name = v_muscle_group;
    
    IF v_muscle_group_id IS NOT NULL THEN
      INSERT INTO public.exercise_muscle_groups (exercise_id, muscle_group_id)
      VALUES (v_exercise_id, v_muscle_group_id)
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
  
  -- Link equipment
  FOREACH v_equipment_item IN ARRAY p_equipment
  LOOP
    SELECT id INTO v_equipment_id 
    FROM public.equipment 
    WHERE name = v_equipment_item;
    
    IF v_equipment_id IS NOT NULL THEN
      INSERT INTO public.exercise_equipment (exercise_id, equipment_id)
      VALUES (v_exercise_id, v_equipment_id)
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- CHEST EXERCISES
-- ============================================
SELECT insert_exercise_with_relations('Dumbbell Flat Bench Press', 'B', false, ARRAY['Chest'], ARRAY['Dumbbells', 'Benches']);
SELECT insert_exercise_with_relations('Dumbbell Incline Bench Press', 'I', false, ARRAY['Chest'], ARRAY['Dumbbells', 'Benches']);
SELECT insert_exercise_with_relations('Dumbbell Decline Bench Press', 'I', false, ARRAY['Chest'], ARRAY['Dumbbells', 'Benches']);
SELECT insert_exercise_with_relations('Dumbbell Chest Fly', 'I', false, ARRAY['Chest'], ARRAY['Dumbbells', 'Benches']);
SELECT insert_exercise_with_relations('Barbell Flat Bench Press', 'I', false, ARRAY['Chest'], ARRAY['Barbells', 'Benches']);
SELECT insert_exercise_with_relations('Barbell Incline Bench Press', 'I', false, ARRAY['Chest'], ARRAY['Barbells', 'Benches']);
SELECT insert_exercise_with_relations('Barbell Decline Bench Press', 'A', false, ARRAY['Chest'], ARRAY['Barbells', 'Benches']);
SELECT insert_exercise_with_relations('Smith Machine Bench Press', 'B', false, ARRAY['Chest'], ARRAY['Smith Machine', 'Benches']);
SELECT insert_exercise_with_relations('Smith Machine Incline Press', 'B', false, ARRAY['Chest'], ARRAY['Smith Machine', 'Benches']);
SELECT insert_exercise_with_relations('Cable Chest Fly (Mid)', 'B', false, ARRAY['Chest'], ARRAY['Cable Machine']);
SELECT insert_exercise_with_relations('Cable Chest Fly (Low)', 'I', false, ARRAY['Chest'], ARRAY['Cable Machine']);
SELECT insert_exercise_with_relations('Cable Chest Fly (High)', 'I', false, ARRAY['Chest'], ARRAY['Cable Machine']);
SELECT insert_exercise_with_relations('Pec Deck Fly', 'B', false, ARRAY['Chest'], ARRAY['Pec Deck']);
SELECT insert_exercise_with_relations('Bench Push-Ups', 'B', false, ARRAY['Chest'], ARRAY['Bodyweight', 'Benches']);

-- ============================================
-- BACK EXERCISES
-- ============================================
SELECT insert_exercise_with_relations('Dumbbell Bent-Over Row', 'I', false, ARRAY['Back'], ARRAY['Dumbbells']);
SELECT insert_exercise_with_relations('One-Arm Dumbbell Row', 'B', false, ARRAY['Back'], ARRAY['Dumbbells']);
SELECT insert_exercise_with_relations('Dumbbell Deadlift', 'I', false, ARRAY['Back'], ARRAY['Dumbbells']);
SELECT insert_exercise_with_relations('Barbell Bent-Over Row', 'A', false, ARRAY['Back'], ARRAY['Barbells']);
SELECT insert_exercise_with_relations('Barbell Deadlift', 'A', false, ARRAY['Back'], ARRAY['Barbells']);
SELECT insert_exercise_with_relations('Barbell Rack Pull', 'A', false, ARRAY['Back'], ARRAY['Barbells']);
SELECT insert_exercise_with_relations('Smith Machine Row', 'B', false, ARRAY['Back'], ARRAY['Smith Machine']);
SELECT insert_exercise_with_relations('Smith Machine Deadlift', 'I', false, ARRAY['Back'], ARRAY['Smith Machine']);
SELECT insert_exercise_with_relations('Wide Grip Lat Pulldown', 'B', false, ARRAY['Back'], ARRAY['Lat Pulldown Machine']);
SELECT insert_exercise_with_relations('Close Grip Lat Pulldown', 'B', false, ARRAY['Back'], ARRAY['Lat Pulldown Machine']);
SELECT insert_exercise_with_relations('Reverse Grip Lat Pulldown', 'I', false, ARRAY['Back'], ARRAY['Lat Pulldown Machine']);
SELECT insert_exercise_with_relations('Seated Cable Row', 'B', false, ARRAY['Back'], ARRAY['Cable Machine']);
SELECT insert_exercise_with_relations('Straight Arm Pulldown', 'I', false, ARRAY['Back'], ARRAY['Cable Machine']);
SELECT insert_exercise_with_relations('Face Pull', 'B', false, ARRAY['Back'], ARRAY['Cable Machine']);
SELECT insert_exercise_with_relations('Assisted Pull-Ups', 'B', false, ARRAY['Back'], ARRAY['Pull-Up Machine']);
SELECT insert_exercise_with_relations('Assisted Chin-Ups', 'B', false, ARRAY['Back'], ARRAY['Pull-Up Machine']);
SELECT insert_exercise_with_relations('Back Extension', 'B', false, ARRAY['Back'], ARRAY['Lower Back Machine']);

-- ============================================
-- SHOULDER EXERCISES
-- ============================================
SELECT insert_exercise_with_relations('Dumbbell Shoulder Press', 'B', false, ARRAY['Shoulders'], ARRAY['Dumbbells']);
SELECT insert_exercise_with_relations('Dumbbell Lateral Raise', 'B', false, ARRAY['Shoulders'], ARRAY['Dumbbells']);
SELECT insert_exercise_with_relations('Dumbbell Front Raise', 'B', false, ARRAY['Shoulders'], ARRAY['Dumbbells']);
SELECT insert_exercise_with_relations('Dumbbell Rear Delt Fly', 'I', false, ARRAY['Shoulders'], ARRAY['Dumbbells']);
SELECT insert_exercise_with_relations('Barbell Overhead Press', 'A', false, ARRAY['Shoulders'], ARRAY['Barbells']);
SELECT insert_exercise_with_relations('Barbell Upright Row', 'I', false, ARRAY['Shoulders'], ARRAY['Barbells']);
SELECT insert_exercise_with_relations('Smith Machine Shoulder Press', 'B', false, ARRAY['Shoulders'], ARRAY['Smith Machine']);
SELECT insert_exercise_with_relations('Smith Machine Upright Row', 'I', false, ARRAY['Shoulders'], ARRAY['Smith Machine']);
SELECT insert_exercise_with_relations('Cable Lateral Raise', 'I', false, ARRAY['Shoulders'], ARRAY['Cable Machine']);
SELECT insert_exercise_with_relations('Cable Front Raise', 'I', false, ARRAY['Shoulders'], ARRAY['Cable Machine']);
SELECT insert_exercise_with_relations('Cable Rear Delt Fly', 'I', false, ARRAY['Shoulders'], ARRAY['Cable Machine']);

-- ============================================
-- BICEP EXERCISES
-- ============================================
SELECT insert_exercise_with_relations('Dumbbell Bicep Curl', 'B', false, ARRAY['Biceps'], ARRAY['Dumbbells']);
SELECT insert_exercise_with_relations('Hammer Curl', 'B', false, ARRAY['Biceps'], ARRAY['Dumbbells']);
SELECT insert_exercise_with_relations('Concentration Curl', 'I', false, ARRAY['Biceps'], ARRAY['Dumbbells']);
SELECT insert_exercise_with_relations('Barbell Curl', 'I', false, ARRAY['Biceps'], ARRAY['Barbells']);
SELECT insert_exercise_with_relations('EZ-Bar Curl', 'B', false, ARRAY['Biceps'], ARRAY['Barbells']);
SELECT insert_exercise_with_relations('Close-Grip Curl', 'I', false, ARRAY['Biceps'], ARRAY['Barbells']);
SELECT insert_exercise_with_relations('Cable Bicep Curl', 'B', false, ARRAY['Biceps'], ARRAY['Cable Machine']);
SELECT insert_exercise_with_relations('Rope Hammer Curl', 'B', false, ARRAY['Biceps'], ARRAY['Cable Machine']);
SELECT insert_exercise_with_relations('Machine Bicep Curl', 'B', false, ARRAY['Biceps'], ARRAY['Bicep Curl Machine']);
SELECT insert_exercise_with_relations('Incline Dumbbell Curl', 'I', false, ARRAY['Biceps'], ARRAY['Dumbbells']);
SELECT insert_exercise_with_relations('Preacher Curl', 'I', false, ARRAY['Biceps'], ARRAY['Barbells']);

-- ============================================
-- TRICEP EXERCISES
-- ============================================
SELECT insert_exercise_with_relations('Dumbbell Overhead Extension', 'B', false, ARRAY['Triceps'], ARRAY['Dumbbells']);
SELECT insert_exercise_with_relations('Dumbbell Kickback', 'B', false, ARRAY['Triceps'], ARRAY['Dumbbells']);
SELECT insert_exercise_with_relations('Skull Crushers', 'I', false, ARRAY['Triceps'], ARRAY['Barbells']);
SELECT insert_exercise_with_relations('Close-Grip Bench Press', 'A', false, ARRAY['Triceps'], ARRAY['Barbells', 'Benches']);
SELECT insert_exercise_with_relations('Smith Machine Close-Grip Press', 'I', false, ARRAY['Triceps'], ARRAY['Smith Machine', 'Benches']);
SELECT insert_exercise_with_relations('Tricep Pushdown (Straight Bar)', 'B', false, ARRAY['Triceps'], ARRAY['Cable Machine']);
SELECT insert_exercise_with_relations('Tricep Pushdown (Rope)', 'B', false, ARRAY['Triceps'], ARRAY['Cable Machine']);
SELECT insert_exercise_with_relations('Overhead Cable Extension', 'I', false, ARRAY['Triceps'], ARRAY['Cable Machine']);
SELECT insert_exercise_with_relations('Bench Dips', 'I', false, ARRAY['Triceps'], ARRAY['Bodyweight', 'Benches']);

-- ============================================
-- FOREARM EXERCISES
-- ============================================
SELECT insert_exercise_with_relations('Wrist Curl', 'B', false, ARRAY['Forearms'], ARRAY['Dumbbells']);
SELECT insert_exercise_with_relations('Reverse Wrist Curl', 'B', false, ARRAY['Forearms'], ARRAY['Dumbbells']);
SELECT insert_exercise_with_relations('Farmers Walk', 'I', false, ARRAY['Forearms'], ARRAY['Dumbbells']);
SELECT insert_exercise_with_relations('Barbell Wrist Curl', 'B', false, ARRAY['Forearms'], ARRAY['Barbells']);
SELECT insert_exercise_with_relations('Reverse Barbell Curl', 'I', false, ARRAY['Forearms'], ARRAY['Barbells']);
SELECT insert_exercise_with_relations('Cable Wrist Curl', 'B', false, ARRAY['Forearms'], ARRAY['Cable Machine']);

-- ============================================
-- ABS / CORE EXERCISES
-- ============================================
SELECT insert_exercise_with_relations('Crunches', 'B', false, ARRAY['Abs / Core'], ARRAY['Bodyweight']);
SELECT insert_exercise_with_relations('Decline Sit-Ups', 'I', false, ARRAY['Abs / Core'], ARRAY['Benches']);
SELECT insert_exercise_with_relations('Cable Crunch', 'B', false, ARRAY['Abs / Core'], ARRAY['Cable Machine']);
SELECT insert_exercise_with_relations('Cable Woodchopper', 'I', false, ARRAY['Abs / Core'], ARRAY['Cable Machine']);
SELECT insert_exercise_with_relations('Roman Chair Leg Raises', 'I', false, ARRAY['Abs / Core'], ARRAY['Benches']);
SELECT insert_exercise_with_relations('Plank', 'B', false, ARRAY['Abs / Core'], ARRAY['Bodyweight']);
SELECT insert_exercise_with_relations('Hanging Knee Raises', 'I', false, ARRAY['Abs / Core'], ARRAY['Bodyweight']);

-- ============================================
-- LEG EXERCISES
-- ============================================
SELECT insert_exercise_with_relations('Goblet Squat', 'B', false, ARRAY['Legs'], ARRAY['Dumbbells']);
SELECT insert_exercise_with_relations('Dumbbell Lunges', 'B', false, ARRAY['Legs'], ARRAY['Dumbbells']);
SELECT insert_exercise_with_relations('Dumbbell Step-Ups', 'B', false, ARRAY['Legs'], ARRAY['Dumbbells']);
SELECT insert_exercise_with_relations('Barbell Squat', 'A', false, ARRAY['Legs'], ARRAY['Barbells']);
SELECT insert_exercise_with_relations('Front Squat', 'A', false, ARRAY['Legs'], ARRAY['Barbells']);
SELECT insert_exercise_with_relations('Barbell Lunges', 'I', false, ARRAY['Legs'], ARRAY['Barbells']);
SELECT insert_exercise_with_relations('Romanian Deadlift', 'A', false, ARRAY['Legs'], ARRAY['Barbells']);
SELECT insert_exercise_with_relations('Smith Machine Squat', 'B', false, ARRAY['Legs'], ARRAY['Smith Machine']);
SELECT insert_exercise_with_relations('Smith Machine Lunges', 'B', false, ARRAY['Legs'], ARRAY['Smith Machine']);
SELECT insert_exercise_with_relations('Leg Press', 'B', false, ARRAY['Legs'], ARRAY['Leg Press Machine']);
SELECT insert_exercise_with_relations('Narrow Stance Leg Press', 'I', false, ARRAY['Legs'], ARRAY['Leg Press Machine']);
SELECT insert_exercise_with_relations('Wide Stance Leg Press', 'I', false, ARRAY['Legs'], ARRAY['Leg Press Machine']);
SELECT insert_exercise_with_relations('Lying Leg Curl', 'B', false, ARRAY['Legs'], ARRAY['Leg Curl Machine']);
SELECT insert_exercise_with_relations('Seated Leg Curl', 'B', false, ARRAY['Legs'], ARRAY['Leg Curl Machine']);
SELECT insert_exercise_with_relations('Bulgarian Split Squat', 'A', false, ARRAY['Legs'], ARRAY['Dumbbells']);

-- ============================================
-- CALVES EXERCISES
-- ============================================
SELECT insert_exercise_with_relations('Standing Calf Raise', 'B', false, ARRAY['Calves'], ARRAY['Calves Machine']);
SELECT insert_exercise_with_relations('Seated Calf Raise', 'B', false, ARRAY['Calves'], ARRAY['Calves Machine']);
SELECT insert_exercise_with_relations('Smith Machine Calf Raises', 'B', false, ARRAY['Calves'], ARRAY['Smith Machine']);
SELECT insert_exercise_with_relations('Leg Press Calf Raises', 'B', false, ARRAY['Calves'], ARRAY['Leg Press Machine']);

-- ============================================
-- GLUTES EXERCISES
-- ============================================
SELECT insert_exercise_with_relations('Hip Thrust', 'I', false, ARRAY['Glutes'], ARRAY['Barbells', 'Benches']);
SELECT insert_exercise_with_relations('Barbell Glute Bridge', 'I', false, ARRAY['Glutes'], ARRAY['Barbells']);
SELECT insert_exercise_with_relations('Smith Machine Hip Thrust', 'B', false, ARRAY['Glutes'], ARRAY['Smith Machine', 'Benches']);
SELECT insert_exercise_with_relations('Cable Kickbacks', 'B', false, ARRAY['Glutes'], ARRAY['Cable Machine']);

-- ============================================
-- CARDIO / CONDITIONING EXERCISES (is_cardio = true)
-- ============================================
SELECT insert_exercise_with_relations('Walking', 'B', true, ARRAY['Cardio / Conditioning'], ARRAY['Treadmill']);
SELECT insert_exercise_with_relations('Jogging', 'B', true, ARRAY['Cardio / Conditioning'], ARRAY['Treadmill']);
SELECT insert_exercise_with_relations('Sprinting', 'A', true, ARRAY['Cardio / Conditioning'], ARRAY['Treadmill']);
SELECT insert_exercise_with_relations('Incline Walk', 'I', true, ARRAY['Cardio / Conditioning'], ARRAY['Treadmill']);
SELECT insert_exercise_with_relations('Steady Cycling', 'B', true, ARRAY['Cardio / Conditioning'], ARRAY['Cycling Cycle']);
SELECT insert_exercise_with_relations('High-Resistance Cycling', 'I', true, ARRAY['Cardio / Conditioning'], ARRAY['Cycling Cycle']);
SELECT insert_exercise_with_relations('Heavy Bag Punching', 'I', true, ARRAY['Cardio / Conditioning'], ARRAY['Boxing Bag']);
SELECT insert_exercise_with_relations('Boxing Conditioning Rounds', 'A', true, ARRAY['Cardio / Conditioning'], ARRAY['Boxing Bag']);

-- ============================================
-- NECK EXERCISES
-- ============================================
SELECT insert_exercise_with_relations('Neck Flexion', 'A', false, ARRAY['Neck'], ARRAY['Bodyweight']);
SELECT insert_exercise_with_relations('Neck Extension', 'A', false, ARRAY['Neck'], ARRAY['Bodyweight']);

-- Drop the helper function after use
DROP FUNCTION IF EXISTS insert_exercise_with_relations;

-- ============================================
-- 12. CREATE VIEW FOR EASY QUERYING
-- ============================================
-- Create a view that joins exercises with their muscle groups and equipment
-- This makes it easy to query exercises with their related data
CREATE OR REPLACE VIEW public.exercises_with_details AS
SELECT 
  e.id,
  e.name,
  e.description,
  e.difficulty,
  e.is_cardio,
  e.created_at,
  e.updated_at,
  COALESCE(
    ARRAY_AGG(DISTINCT mg.name) FILTER (WHERE mg.name IS NOT NULL),
    ARRAY[]::TEXT[]
  ) as muscle_groups,
  COALESCE(
    ARRAY_AGG(DISTINCT eq.name) FILTER (WHERE eq.name IS NOT NULL),
    ARRAY[]::TEXT[]
  ) as equipment_list
FROM public.exercises e
LEFT JOIN public.exercise_muscle_groups emg ON e.id = emg.exercise_id
LEFT JOIN public.muscle_groups mg ON emg.muscle_group_id = mg.id
LEFT JOIN public.exercise_equipment ee ON e.id = ee.exercise_id
LEFT JOIN public.equipment eq ON ee.equipment_id = eq.id
GROUP BY e.id, e.name, e.description, e.difficulty, e.is_cardio, e.created_at, e.updated_at;

-- Enable RLS on the view
ALTER VIEW public.exercises_with_details SET (security_invoker = true);

-- Grant permissions on the view
GRANT SELECT ON public.exercises_with_details TO anon, authenticated;

-- ============================================
-- 13. UPDATE EXERCISES TABLE WITH MUSCLE_GROUPS ARRAY (For backward compatibility)
-- ============================================
-- Populate the muscle_groups array column from the junction table
-- This ensures backward compatibility with existing code
UPDATE public.exercises e
SET muscle_groups = COALESCE(
  (
    SELECT ARRAY_AGG(mg.name)
    FROM public.exercise_muscle_groups emg
    JOIN public.muscle_groups mg ON emg.muscle_group_id = mg.id
    WHERE emg.exercise_id = e.id
  ),
  ARRAY[]::TEXT[]
);

-- ============================================
-- 14. REMOVE OLD COLUMNS FROM EXERCISES (Optional - for clean schema)
-- ============================================
-- We can optionally remove the old equipment column since it's now in junction table
-- Keep muscle_groups for backward compatibility
ALTER TABLE public.exercises DROP COLUMN IF EXISTS equipment;

-- ============================================
-- END OF MIGRATION
-- ============================================
