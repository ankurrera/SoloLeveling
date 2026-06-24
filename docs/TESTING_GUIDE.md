# Testing Guide - System Status Implementation

## Prerequisites
Before testing, ensure:
1. You have a Supabase project set up
2. All migrations have been run in order:
   - `20260119064145_5c3fc727-e03b-4e75-80ca-d27267150d93.sql`
   - `20260119065541_af69017e-df74-43bb-9634-c0e9b6d3473f.sql`
   - `20260119070601_add_session_logging.sql`
   - `20260119094000_rename_weight_to_weight_kg.sql`
   - `20260119110000_add_stat_calculations.sql`
   - `20260119110100_update_xp_calculation.sql`
3. Environment variables are configured in `.env`

## Migration Order
Run the following SQL files in your Supabase SQL Editor in this exact order:

```bash
# 1. Core tables (profiles, goals, preferences)
supabase/migrations/20260119064145_5c3fc727-e03b-4e75-80ca-d27267150d93.sql

# 2. Additional profile function
supabase/migrations/20260119065541_af69017e-df74-43bb-9634-c0e9b6d3473f.sql

# 3. Workout logging tables and XP system
supabase/migrations/20260119070601_add_session_logging.sql

# 4. Weight column rename
supabase/migrations/20260119094000_rename_weight_to_weight_kg.sql

# 5. Stat calculation functions
supabase/migrations/20260119110000_add_stat_calculations.sql

# 6. Updated XP formula
supabase/migrations/20260119110100_update_xp_calculation.sql
```

## Test Scenarios

### Test 1: New User Registration
**Objective:** Verify default stats for new user

**Steps:**
1. Register a new account
2. Navigate to System Status page
3. Verify default values:
   - Level: 1
   - XP: 0
   - Strength: 30
   - Endurance: 25
   - Recovery: 50
   - Consistency: 0
   - Mobility: 30
   - Health: 25 (avg of END, REC, CON)

**Expected Result:** All stats show default values, no errors

### Test 2: First Workout Session
**Objective:** Verify XP calculation and stat updates

**Steps:**
1. Click "Log Workout"
2. Add exercise: "Bench Press"
3. Add set: 50kg × 12 reps
4. Add set: 50kg × 10 reps
5. Add set: 50kg × 8 reps
6. Set session duration: 60 minutes
7. Complete workout

**Expected Calculations:**
- Volume = 50 × (12 + 10 + 8) = 1,500kg
- XP = (1500 / 100) + (60 × 0.5) = 15 + 30 = 45 XP
- Strength: Should increase from 30 (base) to ~32
- Endurance: Should increase from 25 (1 hour training)
- Consistency: Should show ~8% (1 of 12 ideal sessions)

**Expected Result:** 
- Profile shows Level 1, 45 XP
- Stats increased appropriately
- Session appears in history

### Test 3: Multiple Sessions Over Time
**Objective:** Verify progressive stat increases

**Steps:**
1. Log 3 more workout sessions over different days
2. Each with similar volume (1,500-2,000kg)
3. Duration: 45-60 minutes each

**Expected Result:**
- XP increases after each session
- Level may increase if XP crosses 100
- Strength increases (more sessions)
- Endurance increases (more hours)
- Consistency increases (4 sessions = ~33%)
- Calendar shows all training days

### Test 4: Editing Does NOT Grant XP
**Objective:** Verify XP only granted on completion, not editing

**Steps:**
1. Open an existing session
2. Click "Edit"
3. Add a new exercise
4. Add sets
5. Save changes

**Expected Result:**
- Session updated successfully
- XP does NOT change
- Profile level does NOT change
- Stats remain the same

### Test 5: Overtraining Penalty
**Objective:** Verify Recovery stat decreases with overtraining

**Steps:**
1. Log 6 sessions in one week (6 consecutive days)
2. Check Recovery stat

**Expected Result:**
- Recovery stat should DECREASE from baseline
- Penalty applied for training >5 days/week
- Health bar may drop

### Test 6: Consistency Calculation
**Objective:** Verify consistency percentage

**Steps:**
1. Log exactly 12 sessions over 30 days
2. Check Consistency stat

**Expected Result:**
- Consistency should be 100% (12 sessions = ideal)

**Alternative:**
- 6 sessions = 50% consistency
- 18 sessions = 100% (capped at 100%)

### Test 7: Rest Day Benefits
**Objective:** Verify rest days improve Recovery

**Steps:**
1. After overtraining test, take 2-3 rest days
2. Log a new session
3. Check Recovery stat

**Expected Result:**
- Recovery should increase
- Health bar should improve

### Test 8: Calendar Navigation
**Objective:** Verify calendar shows correct training days

**Steps:**
1. Navigate to different months
2. Verify highlighted days match actual sessions
3. Check session counts for each month

**Expected Result:**
- Training days correctly highlighted
- Session counts accurate
- Month navigation works

### Test 9: Goals Progress
**Objective:** Verify goal progress tracking

**Steps:**
1. Set a goal in profile: "Bench 100kg", target: 100, current: 0
2. Log sessions with progressive bench press increases
3. Manually update current_value in profile

**Expected Result:**
- Goal progress bar updates
- Percentage calculated correctly

### Test 10: Potions/Behavior Patterns
**Objective:** Verify behavior pattern calculations

**Steps:**
1. After logging 12+ sessions over 30 days
2. Check Potions panel
3. Verify counts

**Expected Result:**
- Rest Days: 18-20 (30 days - training days)
- Consistency Streaks: 3-4 (weeks with 3+ sessions)
- Deload Weeks: 0-1 (weeks with 1-2 sessions)
- Recovery Patterns: Based on rest day count

### Test 11: Skill Points Display
**Objective:** Verify skill points calculation

**Steps:**
1. Check Skill Points after earning XP
2. Verify calculation: Skill Points = Total XP / 10

**Expected Result:**
- If total XP = 250, Skill Points = 25
- Circular progress shows correct value
- Bar chart shows recent activity

### Test 12: Level Up
**Objective:** Verify level up mechanics

**Steps:**
1. Earn enough XP to reach 100
2. Check if level increases to 2
3. Verify remaining XP carries over

**Expected Result:**
- Level increases from 1 to 2
- Remaining XP shown (e.g., if 120 XP earned, shows level 2 with 20 XP)
- Next level requires 200 XP

## Database Verification

You can verify calculations directly in Supabase SQL editor:

```sql
-- Check user stats
SELECT * FROM calculate_user_stats('your-user-id');

-- Check behavior patterns
SELECT * FROM calculate_behavior_patterns('your-user-id');

-- Check training calendar for current month
SELECT * FROM get_training_calendar('your-user-id', 2026, 1);

-- Check session XP
SELECT 
  id, 
  session_date, 
  total_xp_earned,
  duration_minutes 
FROM workout_sessions 
WHERE user_id = 'your-user-id'
ORDER BY session_date DESC;

-- Check profile
SELECT level, xp FROM profiles WHERE user_id = 'your-user-id';
```

## Common Issues and Solutions

### Issue: Stats not updating
**Solution:** 
- Ensure migrations ran successfully
- Check if functions were created (check Supabase functions list)
- Verify RLS policies are enabled

### Issue: XP granted when editing
**Solution:** 
- Check if trigger is only on INSERT, not UPDATE
- Verify the `update_profile_after_session` trigger

### Issue: Zero stats for new user
**Solution:** 
- This is expected! Users need to log workouts to see stats increase
- Base values are: STR=30, END=25, REC=50, CON=0, MOB=30

### Issue: Calendar shows wrong days
**Solution:**
- Check session_date timestamps
- Verify timezone settings in Supabase
- Check `get_training_calendar` function

### Issue: Health bar not calculating
**Solution:**
- Verify stats are being calculated
- Check formula: (REC + END + CON) / 3
- Ensure all three stats are returning values

## Performance Testing

1. **Load Testing:** Add 50+ sessions, verify performance
2. **Cache Testing:** Refresh page multiple times, verify stats load quickly
3. **Concurrent Users:** Test with multiple users simultaneously

## Security Testing

1. **RLS Verification:** Try accessing another user's data
2. **SQL Injection:** Try malicious inputs (should be prevented by parameterized queries)
3. **Auth Testing:** Try accessing stats without authentication

## Regression Testing

After any code changes:
1. Run all migration files in fresh database
2. Execute all test scenarios
3. Verify no broken functionality
4. Check for console errors

## Success Criteria

All tests pass if:
- ✅ Stats calculate correctly from real data
- ✅ XP only granted on session completion
- ✅ No XP on editing existing sessions
- ✅ Level up mechanics work correctly
- ✅ Calendar shows accurate training days
- ✅ Recovery penalizes overtraining
- ✅ Consistency rewards regular training
- ✅ All UI components render without errors
- ✅ RLS prevents unauthorized data access
- ✅ Build succeeds without errors
