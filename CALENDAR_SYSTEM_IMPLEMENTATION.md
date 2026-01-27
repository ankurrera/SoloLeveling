# Calendar-Based Development + Progressive XP System Implementation

## Overview

This implementation enhances the Skills and Characteristics system with a comprehensive time-tracking, calendar-based attendance system and a progressive XP engine that rewards consistency and discipline.

## System Architecture

### Database Schema

#### New Tables

**skill_attendance**
```sql
- id: UUID (PK)
- skill_id: UUID (FK -> skills)
- user_id: UUID (FK -> auth.users)
- attendance_date: DATE
- time_spent_minutes: INTEGER
- xp_earned: INTEGER (auto-calculated)
- created_at, updated_at: TIMESTAMPTZ
```

**characteristic_attendance**
```sql
- id: UUID (PK)
- characteristic_id: UUID (FK -> characteristics)
- user_id: UUID (FK -> auth.users)
- attendance_date: DATE
- time_spent_minutes: INTEGER
- xp_earned: INTEGER (auto-calculated)
- created_at, updated_at: TIMESTAMPTZ
```

#### Extended Fields

Both `skills` and `characteristics` tables now include:
- `goal_type`: 'daily' | 'weekly' - Type of time goal
- `goal_minutes`: INTEGER - Time goal in minutes
- `base_xp`: INTEGER - Base XP awarded per successful day
- `current_streak`: INTEGER - Current consecutive streak
- `best_streak`: INTEGER - Best streak ever achieved
- `consistency_state`: 'consistent' | 'partial' | 'broken' | 'neutral'

### Database Functions & Triggers

#### XP Calculation Functions

**calculate_consistency_multiplier()**
- Calculates XP multiplier based on streak and consistency state
- Consistent: 1.0 + (streak × 0.05), capped at 2.0
- Partial: 0.8x
- Broken: 0.5x
- Neutral: 1.0x

**calculate_daily_xp()**
- Calculates XP for a single attendance entry
- Formula: `base_xp × time_completion_ratio × consistency_multiplier`
- Returns integer XP value

#### Automatic Triggers

- `trigger_update_skill_attendance_xp`: Auto-calculates XP when skill attendance is added/updated
- `trigger_update_characteristic_attendance_xp`: Auto-calculates XP when characteristic attendance is added/updated

## Consistency Engine

### Consistency States

1. **Consistent** (✓)
   - All recent goals met consecutively
   - High XP multiplier (1.0 to 2.0x)
   - Status messages: "On Fire!", "Crushing It!", "Building Momentum"

2. **Partial** (~)
   - Goals met inconsistently (≥50% in last 7 days)
   - Reduced XP (0.8x)
   - Status: "Recovering"

3. **Broken** (⚠)
   - Multiple consecutive missed goals (<50% in last 7 days)
   - Penalty XP (0.5x)
   - Status: "Inconsistent"

4. **Neutral** (○)
   - No recent activity
   - Base XP (1.0x)
   - Status: "Not Started"

### Streak System

#### Current Streak
- Counts consecutive days where goals were met
- Resets to 0 when a goal is missed
- Used for XP multiplier calculation

#### Best Streak
- Tracks the longest streak ever achieved
- Never decreases
- Motivational metric

### XP Progression

#### Base XP Calculation
```typescript
Daily XP = base_xp × (time_spent / goal_minutes) × consistency_multiplier
```

- Partial completion earns partial XP
- Meeting goal earns full XP
- Exceeding goal doesn't give extra XP (capped at 100%)
- Consistency multiplier progressively increases with streaks

#### Total XP
- Sum of all attendance entries' `xp_earned` values
- Auto-recalculated when attendance changes
- Automatically triggers level updates via existing DB triggers

## API & Hooks

### useSkillAttendance(skillId)

**Returns:**
- `attendanceRecords`: Array of attendance entries
- `isLoading`: Loading state
- `markAttendance`: Mutation to create/update attendance
- `deleteAttendance`: Mutation to delete attendance
- `updateSkillConsistency`: Function to recalculate consistency

**Usage:**
```typescript
const { attendanceRecords, markAttendance } = useSkillAttendance(skill.id);

markAttendance.mutate({
  attendance_date: '2026-01-27',
  time_spent_minutes: 45
});
```

### useCharacteristicAttendance(characteristicId)

Same interface as `useSkillAttendance` but for characteristics.

## UI Components

### Creation Forms

#### CreateSkillForm & CreateCharacteristicForm

**New Required Fields:**
- Goal Type: Daily or Weekly (dropdown)
- Time Goal: Minutes (number input)
- Base XP: XP per successful day (number input)

**Validation:**
- All three fields are mandatory
- Cannot create without time goal
- Default values: 30 minutes, 50 base XP

### Calendar Components

#### SkillCalendar & CharacteristicCalendar

**Features:**
- Monthly grid view (current month)
- Day indicators: S M T W T F S
- Visual states:
  - Empty cell: No attendance
  - Muted cell with dot: Attended but goal not fully met
  - Primary cell with dot: Attended and goal met
  - Disabled (30% opacity): Future dates
- Click to mark: Opens dialog for time input
- Displays:
  - Current streak
  - Best streak
  - Consistency status message
  - Goal information

**Interaction Flow:**
1. User clicks a past date on calendar
2. Dialog opens with date pre-filled
3. User enters time spent in minutes
4. System automatically:
   - Calculates XP based on consistency
   - Updates total XP
   - Recalculates streaks
   - Updates consistency state
   - Updates level if XP threshold crossed

### Updated Card Components

#### SkillCard Enhancements
- Streak display: "Streak: X days"
- Consistency indicator with emoji status
- Collapsible calendar section
- "Track Progress" button to toggle calendar

#### CharacteristicCard Enhancements
- Same streak and consistency display
- Compact calendar view
- Integrated into existing card layout

## User Flow Examples

### Creating a New Skill

1. Click "+ New Area – Skill"
2. Fill required fields:
   - Name: "Web Development"
   - Description: "Building modern web applications"
   - Area: "Programming"
   - Goal Type: Daily
   - Time Goal: 60 minutes
   - Base XP: 100
3. Click "Create Skill"
4. Skill appears with Level 1, 0 XP, 0 streak

### Marking Daily Attendance

1. Open skill card
2. Click "Track Progress" to expand calendar
3. Click on today's date (or any past date)
4. Dialog appears
5. Enter time spent: 65 minutes
6. Click "Save"
7. System:
   - Calculates: Goal met (65 ≥ 60)
   - Awards: 100 XP (base, first day)
   - Updates: Streak = 1, State = "consistent"
   - Displays: Dot on calendar cell, highlighted

### Building a Streak

Day 1: 60 min → 100 XP (1.0x), Streak: 1
Day 2: 70 min → 105 XP (1.05x), Streak: 2
Day 3: 65 min → 110 XP (1.10x), Streak: 3
Day 7: 80 min → 135 XP (1.35x), Streak: 7
Day 30: 60 min → 250 XP (2.0x max), Streak: 30

Status: "On Fire! 🔥"

### Missing a Day

Day 31: No attendance
- Streak: 0 (reset)
- Best Streak: 30 (preserved)
- State: "broken"
- Next attendance: 50 XP (0.5x penalty)

### Recovering Consistency

Day 32: 60 min → 50 XP (0.5x), Streak: 1
Day 33: 65 min → 53 XP (0.53x), Streak: 2
Day 34: 70 min → 55 XP (0.55x), Streak: 3
...gradually recovers to consistent state

## Design Principles

### Visual Design
- **Notion-inspired**: Clean, minimal, flat design
- **Grayscale palette**: No bright colors or gradients
- **Subtle indicators**: Small dots for attended days
- **Clear hierarchy**: Text-based status messages
- **Responsive**: Works on all screen sizes

### UX Principles
- **Explicit actions**: No automatic assumptions
- **Progressive disclosure**: Calendar hidden by default, expandable
- **Immediate feedback**: Toast notifications for all actions
- **Forgiving**: Can edit past attendance, partial XP for partial time
- **Motivating**: Streak tracking, status messages, progressive rewards

### Gamification Balance
- **Not punishing**: 50% XP is minimum, never 0
- **Rewarding consistency**: 2x multiplier at 20-day streak
- **Recovery possible**: Consistency gradually improves
- **Clear goals**: Explicit time targets, no ambiguity
- **Progress visible**: Calendar shows visual history

## Technical Details

### Type Safety
- Full TypeScript coverage
- Interfaces for all data models
- Type-safe database queries

### Performance
- React Query for efficient data fetching
- Optimistic UI updates
- Indexed database queries
- Debounced recalculations

### Security
- Row Level Security (RLS) on all tables
- User-scoped data access
- No direct XP manipulation
- Database-calculated XP values

### Data Integrity
- Unique constraint on (skill_id, user_id, date)
- Foreign key constraints
- Database triggers for auto-calculation
- Atomic operations

## Testing Recommendations

### Unit Tests
- `consistencyCalculations.ts`: All utility functions
- XP calculation with various time values
- Streak calculation with different patterns
- Consistency state transitions

### Integration Tests
- Create skill with time goal
- Mark attendance
- Verify XP calculation
- Verify streak updates
- Test recovery from inconsistency

### E2E Tests
- Full user flow: Create → Track → Build streak → Miss day → Recover
- Calendar interaction
- Multiple skills with different goals

## Migration Instructions

### For Existing Users

1. **Run Migration**
   ```bash
   supabase migration up
   # or apply: supabase/migrations/20260127100000_add_skills_calendar_system.sql
   ```

2. **Existing Skills**
   - Default values applied:
     - goal_type: 'daily'
     - goal_minutes: 30
     - base_xp: 50
     - current_streak: 0
     - best_streak: 0
     - consistency_state: 'neutral'
   - Users should edit existing skills to set proper time goals

3. **Existing XP**
   - Preserved as-is
   - Future XP comes from attendance system
   - Can still manually adjust XP if needed

### For New Installations

- Fresh users must set time goals when creating skills/characteristics
- No default/bypass option
- Clean slate for attendance tracking

## Future Enhancements

### Possible Additions
1. Weekly goal aggregation (currently daily-focused)
2. Skill-specific XP formulas
3. Achievement badges for streaks
4. Comparison charts (planned vs actual)
5. Export attendance data
6. Calendar notifications/reminders
7. Batch attendance marking
8. Historical data visualization
9. Goal adjustment recommendations
10. Integration with external calendars

## Troubleshooting

### Common Issues

**Issue:** "XP not calculating correctly"
- Check: attendance.xp_earned field populated
- Check: triggers are active
- Verify: base_xp and goal_minutes set correctly

**Issue:** "Streak not updating"
- Check: consistency state calculation
- Verify: dates are consecutive
- Check: goal was actually met (time ≥ goal)

**Issue:** "Calendar not showing attendance"
- Check: attendance_date matches calendar date
- Verify: user_id matches
- Check: RLS policies allow access

## Summary

This implementation provides a comprehensive, production-ready system for tracking skill development with:
- ✅ Time-based goals (mandatory)
- ✅ Calendar attendance tracking
- ✅ Progressive XP rewards
- ✅ Consistency-based multipliers
- ✅ Streak tracking with recovery
- ✅ Clean, minimal UI
- ✅ Type-safe implementation
- ✅ Secure database design
- ✅ No security vulnerabilities (CodeQL verified)

The system successfully transforms the Skills/Characteristics feature from a static XP tracker into a dynamic Life OS training system that rewards discipline, consistency, and long-term commitment.
