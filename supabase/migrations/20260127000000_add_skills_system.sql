-- Create characteristics table
CREATE TABLE public.characteristics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '⭐',
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create skills table
CREATE TABLE public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  area TEXT,
  cover_image TEXT,
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  related_characteristics UUID[] DEFAULT ARRAY[]::UUID[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_characteristics_user_id ON public.characteristics(user_id);
CREATE INDEX idx_skills_user_id ON public.skills(user_id);
CREATE INDEX idx_skills_is_active ON public.skills(is_active);
CREATE INDEX idx_skills_area ON public.skills(area);

-- Enable Row Level Security
ALTER TABLE public.characteristics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;

-- RLS Policies for characteristics table
CREATE POLICY "Users can view their own characteristics"
  ON public.characteristics
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own characteristics"
  ON public.characteristics
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own characteristics"
  ON public.characteristics
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own characteristics"
  ON public.characteristics
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for skills table
CREATE POLICY "Users can view their own skills"
  ON public.skills
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own skills"
  ON public.skills
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own skills"
  ON public.skills
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own skills"
  ON public.skills
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add comments for documentation
COMMENT ON TABLE public.characteristics IS 'Stores user characteristics (attributes) with XP and levels';
COMMENT ON TABLE public.skills IS 'Stores user skills with XP, levels, and areas';

-- Function to calculate level from XP
CREATE OR REPLACE FUNCTION calculate_level_from_xp(xp_amount INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Level calculation: Level = floor(sqrt(XP / 100)) + 1
  -- XP Thresholds:
  -- Level 1: 0-99 XP
  -- Level 2: 100-399 XP
  -- Level 3: 400-899 XP
  -- Level 4: 900-1599 XP
  -- Level 5: 1600-2499 XP
  -- Level 10: 8100-9999 XP
  -- Level 20: 36100-40099 XP
  RETURN FLOOR(SQRT(xp_amount / 100.0)) + 1;
END;
$$;

-- Trigger function to auto-update level when XP changes for characteristics
CREATE OR REPLACE FUNCTION update_characteristic_level()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.level := calculate_level_from_xp(NEW.xp);
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- Trigger function to auto-update level when XP changes for skills
CREATE OR REPLACE FUNCTION update_skill_level()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.level := calculate_level_from_xp(NEW.xp);
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER trigger_update_characteristic_level
  BEFORE INSERT OR UPDATE OF xp
  ON public.characteristics
  FOR EACH ROW
  EXECUTE FUNCTION update_characteristic_level();

CREATE TRIGGER trigger_update_skill_level
  BEFORE INSERT OR UPDATE OF xp
  ON public.skills
  FOR EACH ROW
  EXECUTE FUNCTION update_skill_level();
