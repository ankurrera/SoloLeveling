# System Status Implementation - Technical Documentation

## Overview
This document describes how the System Status page works with real gym data, not fake RPG stats. All calculations are server-side and based on actual workout logs.

## Core Principles
1. **No fake numbers** - All stats derived from logged workouts
2. **No manual editing** - Stats are read-only, calculated automatically
3. **Server-side calculations** - All logic in Supabase database functions
4. **XP on completion only** - Editing a workout does NOT grant XP
5. **No pay-to-progress** - All progression earned through effort

## Stat Calculations

### Level & XP System

#### XP Formula
```
XP = (total_volume / 100) + (session_duration × 0.5)
```

Where:
- `total_volume` = sum of (weight_kg × reps) across all sets in the session
- `session_duration` = duration_minutes from the session
- Minimum XP per session: 10

**Example:**
- Session: Bench Press 3x12 @ 50kg, duration 60 minutes
- Volume = 50kg × 12 × 3 = 1800kg
- XP = (1800 / 100) + (60 × 0.5) = 18 + 30 = 48 XP

#### Level Up Rules
```
XP Required = 100 × current_level
```

- Level 1→2: 100 XP
- Level 2→3: 200 XP
- Level 3→4: 300 XP
- etc.

After leveling up, remaining XP carries over to next level.

### Core Stats (0-100 scale)

#### Strength (STR)
**Purpose:** Tracks progressive overload and total volume lifted

**Formula:**
```sql
strength = BASE_STRENGTH + SESSIONS_CONTRIBUTION + VOLUME_CONTRIBUTION
```

- `BASE_STRENGTH` = 30
- `SESSIONS_CONTRIBUTION` = min(40, total_sessions × 2)
- `VOLUME_CONTRIBUTION` = min(30, floor(total_volume / 1000))

**What increases it:**
- Completing more training sessions
- Increasing weight for same exercises
- Higher total volume over time

**Max:** 100

#### Endurance (END)
**Purpose:** Measures training capacity and volume tolerance

**Formula:**
```sql
endurance = BASE_ENDURANCE + TIME_CONTRIBUTION + REPS_CONTRIBUTION
```

- `BASE_ENDURANCE` = 25
- `TIME_CONTRIBUTION` = min(45, floor(total_hours × 3))
- `REPS_CONTRIBUTION` = min(30, floor(total_reps / 100))

**What increases it:**
- Longer training sessions
- Higher total reps per week
- Consistent training duration

**Max:** 100

#### Recovery (REC)
**Purpose:** Prevents overtraining, rewards rest

**Formula:**
```sql
recovery = BASE_RECOVERY + BONUS - PENALTY
```

- `BASE_RECOVERY` = 50
- `BONUS` = +20 for 3-4 sessions/week, +10 for 2-5 sessions/week
- `PENALTY` = -10 per session over 5/week
- `PENALTY` = -5 per day inactive over 7 days

**What increases it:**
- Taking rest days (not training 7 days/week)
- Balanced training frequency (3-4 sessions ideal)
- Regular training without long gaps

**What decreases it:**
- Training more than 5 days per week
- Not training for more than 7 days

**Range:** 0-100

#### Consistency (CON)
**Purpose:** Adherence to training schedule

**Formula:**
```sql
consistency = (sessions_last_30_days / 12) × 100
```

Where ideal = 12 sessions per month (3 per week)

**What increases it:**
- Completing planned sessions
- Regular training frequency
- No missed weeks

**Max:** 100 (equals 100% adherence to ideal frequency)

#### Mobility (MOB)
**Purpose:** Exercise variety and movement patterns

**Formula:**
```sql
mobility = BASE_MOBILITY + VARIETY_CONTRIBUTION + SESSIONS_CONTRIBUTION
```

- `BASE_MOBILITY` = 30
- `VARIETY_CONTRIBUTION` = min(40, unique_exercises × 2)
- `SESSIONS_CONTRIBUTION` = min(30, total_sessions)

**What increases it:**
- Trying different exercises
- Varied movement patterns
- Regular training

**Max:** 100

### Health Bar
**Purpose:** System balance indicator to prevent overtraining

**Formula:**
```sql
health = (recovery + endurance + consistency) / 3
```

This is the average of the three most important balance metrics.

**Interpretation:**
- 80-100: Excellent balance
- 60-79: Good balance
- 40-59: Needs attention
- 0-39: Risk of overtraining or inconsistency

## UI Components

### Left Panel - Player Status
**Data Source:** 
- Profile table (level, xp, rank, class)
- Calculated stats from `calculate_user_stats()` function

**Displays:**
- Level & XP progress bar
- Four core stats: STR, END, REC, CON
- Total workouts completed
- Total XP earned
- Training hours

**Update Trigger:** When a session is completed (INSERT on workout_sessions)

### Center Panel - Radar Chart
**Data Source:** `calculate_user_stats()` function

**Displays:** 
- 5-axis radar: STR, END, MOB, REC, CON
- Health percentage at bottom

**Visual:** Each axis represents a stat (0-100), creating a visual balance overview

### Right Panel - Skill Points
**Data Source:**
- Profile table (xp, level)
- Recent sessions (last 30 days)
- Health calculation

**Displays:**
- Skill Points = total_XP / 10 (not spendable)
- Bar chart of completed days (last 30 days)
- Health bar (system balance)

**Note:** Skill Points are informational only, showing accumulated progress

### Bottom Left - Calendar
**Data Source:** `get_training_calendar()` function

**Displays:**
- Monthly calendar with training days highlighted
- Month navigation
- Session count for current month
- Total XP and sessions

**Interaction:** Can navigate between months

### Bottom Right - Goals
**Data Source:** training_goals table

**Displays:**
- User-defined goals with automatic progress tracking
- Week activity overview
- Calendar mini-view of last 35 days

**Progress Calculation:** Based on current_value vs target_value in goals table

### Potions Panel
**Data Source:** `calculate_behavior_patterns()` function

**Represents behavioral patterns (NOT consumables):**

1. **Rest Days** - Total rest days in last 30 days
2. **Consistency Streaks** - Weeks with 3+ sessions
3. **Deload Weeks** - Weeks with 1-2 sessions (recovery periods)
4. **Recovery Patterns** - Balanced rest between sessions

**Purpose:** Visual feedback for good training habits

## Database Functions

All calculations are performed by PostgreSQL functions:

1. `calculate_user_stats(user_id)` - Returns all 6 stats
2. `calculate_session_xp(session_id)` - Calculates XP for a session
3. `update_profile_after_session()` - Trigger on session INSERT
4. `get_training_calendar(user_id, year, month)` - Returns training days
5. `calculate_behavior_patterns(user_id)` - Returns potion counts

## Update Rules

### When Stats Update
✅ **Stats update when:**
- A workout session is completed (INSERT on workout_sessions table)
- Profile is manually refreshed

❌ **Stats DO NOT update when:**
- Editing an existing workout (UPDATE operations)
- Adding/removing sets from a session
- Navigating between pages

### XP Grant Rules
✅ **XP is granted:**
- When a new session is created (via trigger)
- Based on volume and duration at creation time

❌ **XP is NOT granted:**
- When editing exercise details
- When updating set information
- When changing session notes

## Row Level Security (RLS)

All tables have RLS enabled:
- Users can only see/modify their own data
- Calculations run with SECURITY DEFINER (elevated privileges)
- All queries go through Supabase auth system

## Client-Side Behavior

The UI is **read-only** for stats:
- Components fetch and display data
- No manual stat editing UI
- No "boost" or "enhancement" buttons
- Stats refresh on page load or manual query invalidation

## Performance Considerations

1. **Caching:** Stats queries cached for 60 seconds (staleTime)
2. **Lazy Loading:** Stats calculated on-demand, not on every request
3. **Indexing:** Database indexes on user_id, session_date for fast queries
4. **Memoization:** React components use useMemo to prevent recalculation

## Future Enhancements

Possible additions (not yet implemented):
- Exercise-specific progression tracking
- Personal records (PRs) tracking
- Weekly/monthly trends
- Comparison with previous periods
- Achievement system based on milestones
