-- Add calendar-based development fields to skills table
ALTER TABLE public.skills
  ADD COLUMN goal_type TEXT DEFAULT 'daily' CHECK (goal_type IN ('daily', 'weekly')),
  ADD COLUMN goal_minutes INTEGER NOT NULL DEFAULT 30,
  ADD COLUMN base_xp INTEGER NOT NULL DEFAULT 50,
  ADD COLUMN current_streak INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN best_streak INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN consistency_state TEXT DEFAULT 'neutral' CHECK (consistency_state IN ('consistent', 'partial', 'broken', 'neutral'));

-- Add calendar-based development fields to characteristics table
ALTER TABLE public.characteristics
  ADD COLUMN goal_type TEXT DEFAULT 'daily' CHECK (goal_type IN ('daily', 'weekly')),
  ADD COLUMN goal_minutes INTEGER NOT NULL DEFAULT 30,
  ADD COLUMN base_xp INTEGER NOT NULL DEFAULT 50,
  ADD COLUMN current_streak INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN best_streak INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN consistency_state TEXT DEFAULT 'neutral' CHECK (consistency_state IN ('consistent', 'partial', 'broken', 'neutral'));

-- Create skill_attendance table
CREATE TABLE public.skill_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  time_spent_minutes INTEGER NOT NULL DEFAULT 0,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(skill_id, user_id, attendance_date)
);

-- Create characteristic_attendance table
CREATE TABLE public.characteristic_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  characteristic_id UUID NOT NULL REFERENCES public.characteristics(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  time_spent_minutes INTEGER NOT NULL DEFAULT 0,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(characteristic_id, user_id, attendance_date)
);

-- Create indexes for attendance tables
CREATE INDEX idx_skill_attendance_skill_id ON public.skill_attendance(skill_id);
CREATE INDEX idx_skill_attendance_user_id ON public.skill_attendance(user_id);
CREATE INDEX idx_skill_attendance_date ON public.skill_attendance(attendance_date);
CREATE INDEX idx_characteristic_attendance_characteristic_id ON public.characteristic_attendance(characteristic_id);
CREATE INDEX idx_characteristic_attendance_user_id ON public.characteristic_attendance(user_id);
CREATE INDEX idx_characteristic_attendance_date ON public.characteristic_attendance(attendance_date);

-- Enable Row Level Security
ALTER TABLE public.skill_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.characteristic_attendance ENABLE ROW LEVEL SECURITY;

-- RLS Policies for skill_attendance
CREATE POLICY "Users can view their own skill attendance"
  ON public.skill_attendance
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own skill attendance"
  ON public.skill_attendance
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own skill attendance"
  ON public.skill_attendance
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own skill attendance"
  ON public.skill_attendance
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for characteristic_attendance
CREATE POLICY "Users can view their own characteristic attendance"
  ON public.characteristic_attendance
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own characteristic attendance"
  ON public.characteristic_attendance
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own characteristic attendance"
  ON public.characteristic_attendance
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own characteristic attendance"
  ON public.characteristic_attendance
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add comments for documentation
COMMENT ON TABLE public.skill_attendance IS 'Tracks daily time spent and XP earned for skills';
COMMENT ON TABLE public.characteristic_attendance IS 'Tracks daily time spent and XP earned for characteristics';

-- Function to calculate XP with consistency multiplier
CREATE OR REPLACE FUNCTION calculate_consistency_multiplier(
  current_streak_count INTEGER,
  consistency_state_value TEXT
)
RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Consistency multipliers based on streak and state
  -- Consistent: High XP (1.0 + streak bonus)
  -- Partial: Normal XP (0.7-0.9)
  -- Broken: Low XP (0.5-0.6)
  -- Neutral: Base XP (1.0)
  
  RETURN CASE consistency_state_value
    WHEN 'consistent' THEN
      -- Progressive bonus: starts at 1.0, increases by 0.05 per streak day, caps at 2.0
      LEAST(1.0 + (current_streak_count * 0.05), 2.0)
    WHEN 'partial' THEN
      -- Reduced XP for partial consistency
      0.8
    WHEN 'broken' THEN
      -- Penalty for broken consistency
      0.5
    ELSE
      -- Neutral state: base XP
      1.0
  END;
END;
$$;

-- Function to calculate XP earned for a day
CREATE OR REPLACE FUNCTION calculate_daily_xp(
  base_xp_value INTEGER,
  time_spent INTEGER,
  goal_minutes INTEGER,
  current_streak_count INTEGER,
  consistency_state_value TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  goal_completion_ratio NUMERIC;
  time_multiplier NUMERIC;
  consistency_multiplier NUMERIC;
  final_xp INTEGER;
BEGIN
  -- Calculate how much of the goal was met (0.0 to 1.0+)
  goal_completion_ratio := LEAST(time_spent::NUMERIC / NULLIF(goal_minutes, 0), 1.0);
  
  -- Time multiplier: partial credit for partial completion
  -- 0% = 0x, 50% = 0.5x, 100% = 1x, 150%+ = 1x
  time_multiplier := goal_completion_ratio;
  
  -- Get consistency multiplier
  consistency_multiplier := calculate_consistency_multiplier(current_streak_count, consistency_state_value);
  
  -- Calculate final XP
  final_xp := FLOOR(base_xp_value * time_multiplier * consistency_multiplier);
  
  RETURN GREATEST(final_xp, 0);
END;
$$;

-- Trigger to auto-update skill XP when attendance is added/updated
CREATE OR REPLACE FUNCTION update_skill_xp_from_attendance()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  skill_record RECORD;
  calculated_xp INTEGER;
BEGIN
  -- Get the skill record
  SELECT * INTO skill_record
  FROM public.skills
  WHERE id = NEW.skill_id;
  
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;
  
  -- Calculate XP for this attendance entry
  calculated_xp := calculate_daily_xp(
    skill_record.base_xp,
    NEW.time_spent_minutes,
    skill_record.goal_minutes,
    skill_record.current_streak,
    skill_record.consistency_state
  );
  
  -- Store the calculated XP in the attendance record
  NEW.xp_earned := calculated_xp;
  NEW.updated_at := now();
  
  RETURN NEW;
END;
$$;

-- Trigger to auto-update characteristic XP when attendance is added/updated
CREATE OR REPLACE FUNCTION update_characteristic_xp_from_attendance()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  char_record RECORD;
  calculated_xp INTEGER;
BEGIN
  -- Get the characteristic record
  SELECT * INTO char_record
  FROM public.characteristics
  WHERE id = NEW.characteristic_id;
  
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;
  
  -- Calculate XP for this attendance entry
  calculated_xp := calculate_daily_xp(
    char_record.base_xp,
    NEW.time_spent_minutes,
    char_record.goal_minutes,
    char_record.current_streak,
    char_record.consistency_state
  );
  
  -- Store the calculated XP in the attendance record
  NEW.xp_earned := calculated_xp;
  NEW.updated_at := now();
  
  RETURN NEW;
END;
$$;

-- Create triggers for XP calculation
CREATE TRIGGER trigger_update_skill_attendance_xp
  BEFORE INSERT OR UPDATE
  ON public.skill_attendance
  FOR EACH ROW
  EXECUTE FUNCTION update_skill_xp_from_attendance();

CREATE TRIGGER trigger_update_characteristic_attendance_xp
  BEFORE INSERT OR UPDATE
  ON public.characteristic_attendance
  FOR EACH ROW
  EXECUTE FUNCTION update_characteristic_xp_from_attendance();
