-- Add bodyweight_kg column to profiles table for XP normalization
-- This allows XP to be calculated based on relative effort (volume/bodyweight)
-- rather than absolute load, making progression fair across different body sizes

ALTER TABLE public.profiles
ADD COLUMN bodyweight_kg NUMERIC(5,2) CHECK (bodyweight_kg IS NULL OR (bodyweight_kg >= 30 AND bodyweight_kg <= 250));

COMMENT ON COLUMN public.profiles.bodyweight_kg IS 'User bodyweight in kilograms. Used for normalizing XP calculations to ensure fair progression across different body sizes. Valid range: 30-250 kg.';
