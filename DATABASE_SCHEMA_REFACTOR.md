# Database Schema Refactoring - Exercise System

## Overview

This document describes the major refactoring of the exercise database schema to support a normalized, scalable, and feature-rich exercise management system.

## Migration File

**File**: `supabase/migrations/20260121190000_refactor_exercise_schema.sql`

## Key Changes

### 1. New Tables Created

#### `equipment`
Stores all available gym equipment types.
- **Columns**:
  - `id` (UUID, primary key)
  - `name` (TEXT, unique, not null)
  - `created_at` (TIMESTAMP WITH TIME ZONE)
- **Count**: 17 equipment types

#### `exercise_muscle_groups`
Junction table linking exercises to muscle groups (many-to-many).
- **Columns**:
  - `exercise_id` (UUID, foreign key to exercises)
  - `muscle_group_id` (UUID, foreign key to muscle_groups)
  - `created_at` (TIMESTAMP WITH TIME ZONE)
- **Primary Key**: Composite (exercise_id, muscle_group_id)

#### `exercise_equipment`
Junction table linking exercises to equipment (many-to-many).
- **Columns**:
  - `exercise_id` (UUID, foreign key to exercises)
  - `equipment_id` (UUID, foreign key to equipment)
  - `created_at` (TIMESTAMP WITH TIME ZONE)
- **Primary Key**: Composite (exercise_id, equipment_id)

### 2. Modified Tables

#### `exercises`
Updated to support difficulty levels and cardio flag.
- **New Columns**:
  - `difficulty` (CHAR(1), CHECK constraint: 'B', 'I', or 'A')
    - B = Beginner
    - I = Intermediate
    - A = Advanced
  - `is_cardio` (BOOLEAN, default false)
- **Removed Columns**:
  - `equipment` (TEXT) - moved to junction table
- **Kept Columns**:
  - `muscle_groups` (TEXT[]) - kept for backward compatibility, populated from junction table

#### `muscle_groups`
No structural changes, but data fully reseeded.

### 3. Data Seeding

#### Muscle Groups (12 total)
- Chest
- Back
- Shoulders
- Biceps
- Triceps
- Forearms
- Abs / Core
- Legs
- Calves
- Glutes
- Cardio / Conditioning
- Neck

#### Equipment (17 total)
- Dumbbells
- Barbells
- Smith Machine
- Cable Machine
- Pec Deck
- Benches
- Lat Pulldown Machine
- Pull-Up Machine
- Lower Back Machine
- Leg Press Machine
- Leg Curl Machine
- Calves Machine
- Treadmill
- Cycling Cycle
- Boxing Bag
- Bodyweight
- Bicep Curl Machine

#### Exercises (108 total)
All exercises from the problem statement are seeded with:
- Exact names
- Correct difficulty levels (B/I/A)
- Proper muscle group mappings
- Correct equipment associations
- Cardio flag where applicable (8 cardio exercises)

**Distribution by Difficulty**:
- Beginner (B): 53 exercises
- Intermediate (I): 41 exercises
- Advanced (A): 14 exercises

**Distribution by Muscle Group**:
- Chest: 14 exercises
- Back: 17 exercises
- Shoulders: 11 exercises
- Biceps: 11 exercises
- Triceps: 9 exercises
- Forearms: 6 exercises
- Abs / Core: 7 exercises
- Legs: 15 exercises
- Calves: 4 exercises
- Glutes: 4 exercises
- Cardio / Conditioning: 8 exercises (is_cardio = true)
- Neck: 2 exercises

### 4. Row Level Security (RLS)

All new tables have RLS enabled with public read access:
- `equipment`: Anyone can view
- `exercise_muscle_groups`: Anyone can view
- `exercise_equipment`: Anyone can view

This allows unauthenticated users to browse exercises and equipment, while maintaining security for user-specific data.

### 5. Performance Optimizations

**New Indexes**:
- `idx_exercise_muscle_groups_exercise_id`
- `idx_exercise_muscle_groups_muscle_group_id`
- `idx_exercise_equipment_exercise_id`
- `idx_exercise_equipment_equipment_id`

**View Created**: `exercises_with_details`
- Joins exercises with their muscle groups and equipment
- Returns denormalized data for easy querying
- Security invoker mode enabled
- Accessible to anon and authenticated users

### 6. Idempotency

The migration is fully idempotent and safe to run multiple times:
- Tables created with `IF NOT EXISTS`
- Policies dropped before creation
- Data truncated before seeding
- Helper function dropped after use

## Frontend Integration

### Updated TypeScript Types

**New Types** (`src/integrations/supabase/types.ts`):
- `equipment` table types
- `exercise_equipment` table types
- `exercise_muscle_groups` table types
- Updated `exercises` table types (removed equipment field, added difficulty and is_cardio)

### Updated Hooks

**Updated** (`src/hooks/useExercises.ts`):
- Added `Equipment` type export
- Added `equipment` query
- Added `getExercisesByDifficulty()` function
- Added `getCardioExercises()` function
- Existing `getExercisesByMuscleGroups()` continues to work

## Usage Examples

### Query Exercises by Difficulty
```typescript
const { getExercisesByDifficulty } = useExercises();
const beginnerExercises = getExercisesByDifficulty('B');
```

### Query Cardio Exercises
```typescript
const { getCardioExercises } = useExercises();
const cardioExercises = getCardioExercises();
```

### Query Equipment
```typescript
const { equipment } = useExercises();
// equipment array is now available
```

### Using the View (Direct Query)
```sql
-- Get all exercises with their muscle groups and equipment
SELECT * FROM exercises_with_details;

-- Filter by difficulty
SELECT * FROM exercises_with_details WHERE difficulty = 'B';

-- Filter by cardio
SELECT * FROM exercises_with_details WHERE is_cardio = true;
```

## Benefits

1. **Normalized Schema**: Proper many-to-many relationships
2. **Scalable**: Can easily add more exercises, muscle groups, or equipment
3. **Query Efficient**: Indexes on all foreign keys
4. **Difficulty Aware**: Enables beginner/intermediate/advanced filtering
5. **Cardio Support**: Separate tracking for cardio exercises
6. **Backward Compatible**: Existing code using muscle_groups array still works
7. **Type Safe**: Full TypeScript support
8. **Secure**: RLS policies prevent unauthorized access
9. **Idempotent**: Safe to run migration multiple times
10. **Well Documented**: Complete data seed with all 108 exercises

## XP Calculation Integration

The new difficulty field enables:
- Different XP multipliers based on exercise difficulty
- Progression tracking (beginner → intermediate → advanced)
- More accurate RPG-style leveling system
- Difficulty-aware routine recommendations

## Future Enhancements

Possible future additions:
1. Exercise categories (compound vs isolation)
2. Primary vs secondary muscle group targeting
3. Exercise variations and progressions
4. Video/image URLs for exercise demonstrations
5. Estimated calories burned per exercise
6. Equipment alternatives for exercises

## Migration Checklist

When deploying this migration:

- [ ] Backup existing database
- [ ] Run migration: `20260121190000_refactor_exercise_schema.sql`
- [ ] Verify all 108 exercises are inserted
- [ ] Verify junction tables are populated
- [ ] Test exercise queries in frontend
- [ ] Test routine creation with new exercises
- [ ] Verify XP calculation works with difficulty levels
- [ ] Update any hardcoded exercise lists in code (should be none)

## Rollback (If Needed)

To rollback this migration:
1. Drop new tables: `equipment`, `exercise_equipment`, `exercise_muscle_groups`
2. Restore previous exercises table schema
3. Restore previous exercise data from backup

However, since the migration keeps backward compatibility (muscle_groups array), partial rollback may not be necessary.
