# Skills System Implementation

## Overview

The Skills System is a fully functional, editable, and persistent RPG-style feature that allows users to track skills and characteristics with XP and levels. It follows Notion's clean, minimal design philosophy while incorporating RPG mechanics underneath.

## Features

### 1. Two-Column Layout
- **Left Column (30%)**: Characteristics Panel
- **Right Column (70%)**: Skills Grid
- Desktop-optimized locked grid layout

### 2. Skills Management
- Create, read, update, and delete skills
- Each skill includes:
  - Name and description
  - Area/category classification
  - Cover image support
  - XP and auto-calculated level
  - Active/Inactive toggle
  - Related characteristics (optional)

### 3. Characteristics Management
- Create, read, update, and delete characteristics
- Each characteristic includes:
  - Icon (customizable emoji)
  - Name
  - XP and auto-calculated level
  - Progress bar visualization

### 4. XP and Level System
- **Level Formula**: `Level = floor(sqrt(XP / 100)) + 1`
- **XP Thresholds**:
  - Level 1: 0-99 XP
  - Level 2: 100-399 XP
  - Level 3: 400-899 XP
  - Level 4: 900-1599 XP
  - Level 5: 1600-2499 XP
  - Level 10: 8100-9999 XP
  - Level 20: 36100-40099 XP

### 5. Data Persistence
- All data stored in Supabase PostgreSQL
- Row Level Security (RLS) policies ensure user data isolation
- Real-time sync using TanStack React Query
- Automatic cache invalidation on mutations

### 6. UI/UX Features
- **Quick Create Panel**: Fast creation of skills and characteristics
- **Search**: Filter skills by name or description
- **Filters**: Active/Inactive/All skills
- **Inline Editing**: Edit characteristics directly in cards
- **Confirmation Dialogs**: Custom modal confirmations for deletions
- **Progress Visualization**: 
  - Standard progress bars for characteristics
  - Segmented progress bars (10 blocks) for skills
- **Toast Notifications**: User feedback for all operations

## Navigation

The Skills page is accessible via:
1. **Habits Page**: "Skills" button next to "+ Create Habit"
2. **Direct URL**: `/skills`
3. **Back Button**: Returns to home page from Skills page

## Database Schema

### Skills Table
```sql
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
```

### Characteristics Table
```sql
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
```

### Auto-Level Calculation
Database triggers automatically update the `level` field when `xp` changes:
- `trigger_update_skill_level` on `skills` table
- `trigger_update_characteristic_level` on `characteristics` table

## TypeScript Interfaces

### Skill Interface
```typescript
interface Skill {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  area: string | null;
  cover_image: string | null;
  xp: number;
  level: number;
  is_active: boolean;
  related_characteristics: string[];
  created_at: string;
  updated_at: string;
}
```

### Characteristic Interface
```typescript
interface Characteristic {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  xp: number;
  level: number;
  created_at: string;
  updated_at: string;
}
```

## Custom Hooks

### useSkills
```typescript
const {
  skills,        // Array of user's skills
  isLoading,     // Loading state
  createSkill,   // Mutation to create skill
  updateSkill,   // Mutation to update skill
  deleteSkill,   // Mutation to delete skill
} = useSkills();
```

### useCharacteristics
```typescript
const {
  characteristics,        // Array of user's characteristics
  isLoading,             // Loading state
  createCharacteristic,  // Mutation to create characteristic
  updateCharacteristic,  // Mutation to update characteristic
  deleteCharacteristic,  // Mutation to delete characteristic
} = useCharacteristics();
```

## Components Structure

```
src/
├── pages/
│   └── Skills.tsx                    # Main Skills page
├── components/skills/
│   ├── CharacteristicsPanel.tsx     # Left column container
│   ├── CharacteristicCard.tsx       # Individual characteristic display
│   ├── CreateCharacteristicForm.tsx # Inline characteristic creation
│   ├── SkillsGrid.tsx               # Right column container
│   ├── SkillCard.tsx                # Individual skill card
│   ├── CreateSkillForm.tsx          # Inline skill creation
│   ├── EditSkillDialog.tsx          # Modal for editing skills
│   ├── QuickCreatePanel.tsx         # Top quick create buttons
│   └── ConfirmDialog.tsx            # Reusable confirmation dialog
├── hooks/
│   ├── useSkills.ts                 # Skills data management
│   └── useCharacteristics.ts        # Characteristics data management
└── lib/
    ├── levelCalculation.ts          # XP/level utilities
    └── skillsConstants.ts           # Shared constants
```

## Design System

### Colors
- **Primary**: System primary color for interactive elements
- **Muted**: Background for secondary elements
- **Foreground**: Main text color
- **Muted Foreground**: Secondary text color
- **Border**: Subtle borders and dividers

### Typography
- Clean, minimal font hierarchy
- Left-aligned headers
- Neutral gray tones throughout

### Spacing
- Notion-style spacing and padding
- Consistent gap sizes (3, 4, 6, 8)

### Visual Elements
- Flat cards with rounded corners
- No shadows, glows, or gradients
- Monochrome progress bars
- Icon-based actions

## Usage Examples

### Creating a Skill
1. Click "+ New Area – Skill" in Quick Create panel
2. Fill in name (required), description, area, cover image URL, and initial XP
3. Click "Create Skill"
4. Skill appears in grid with auto-calculated level

### Editing a Characteristic
1. Click edit icon on characteristic card
2. Modify icon, name, or XP inline
3. Click save icon
4. Changes persist and level updates automatically

### Filtering Skills
1. Use search bar to filter by name/description
2. Use All/Active/Inactive buttons to filter by status
3. Grid updates in real-time

## Migration

To apply the database schema, run the migration:
```bash
# Using Supabase CLI
supabase db push

# Or manually apply the migration file:
# supabase/migrations/20260127000000_add_skills_system.sql
```

## Testing

All existing tests pass with the Skills system:
- ✅ 84/84 tests pass
- ✅ TypeScript compilation successful
- ✅ Build successful
- ✅ No security vulnerabilities (CodeQL)

## Future Enhancements

Potential improvements for future versions:
1. Link characteristics to skills (many-to-many relationship)
2. XP gain automation from completed habits/workouts
3. Skill trees and dependencies
4. Achievement badges based on skill levels
5. Export/import skill data
6. Skill comparison and analytics
7. Custom XP formulas per skill
8. Skill recommendations based on user goals

## Related Documentation

- [Habit Tracker Implementation](./HABIT_TRACKER_IMPLEMENTATION.md)
- [XP System Documentation](./XP_SYSTEM_DOCUMENTATION.md)
- [Database Schema Refactor](./DATABASE_SCHEMA_REFACTOR.md)
- [Supabase Setup](./SUPABASE_SETUP.md)
