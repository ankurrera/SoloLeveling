# XP Calculation System Documentation

## Overview

The Solo Leveling XP calculation system rewards users based on objective training difficulty, not arbitrary metrics like session count or button presses. XP represents **training stress and adaptation potential** normalized by bodyweight to ensure fair progression across different body sizes.

## Core Principles

1. **XP scales with relative effort** - XP is normalized by bodyweight, making progression fair across different body sizes
2. **No flat XP** - Every workout is calculated based on actual work performed
3. **No cosmetic rewards** - Only genuine training metrics count
4. **Anti-exploitation** - System cannot be gamed by volume spam, button abuse, or fake bodyweight entries

## XP Calculation Formula

### Step 0: Bodyweight Normalization
```
effective_bodyweight = clamp(bodyweight_kg, 50, 120)
default_bodyweight = 70 kg (if not provided)
```
Bodyweight is clamped to prevent exploitation:
- **Minimum**: 50 kg
- **Maximum**: 120 kg
- **Default**: 70 kg (when not recorded)

This ensures a lighter lifter training hard can earn comparable XP to a heavier lifter training hard.

### Step 1: Total Volume
```
total_volume = Σ (weight_kg × reps) across all sets
```
Measures the total mechanical work performed.

### Step 2: Intensity Factor
Based on rep ranges (rewards heavier training):
- **1-5 reps**: 1.3× (heavy strength)
- **6-8 reps**: 1.15× (moderate strength)
- **9-12 reps**: 1.0× (hypertrophy)
- **13-20 reps**: 0.9× (endurance)
- **20+ reps**: 0.9× (very high endurance)

The session's average intensity is calculated across all sets.

### Step 3: Work Density
```
work_density = total_volume / session_duration_minutes
```
Measures how demanding the session was. Dense workouts with little rest score higher.

### Step 4: Base XP (Bodyweight-Normalized)
```
relative_volume = total_volume / effective_bodyweight
base_xp = (√relative_volume × 1.5 + work_density × 0.4 + duration × 0.3) × intensity_factor
```

Properties:
- XP represents relative effort, not absolute load
- Heavy + dense workouts score higher
- Long but lazy sessions score lower
- No single variable dominates
- Square root prevents volume spam
- **Fairness**: A 60kg lifter lifting 3,000kg and a 90kg lifter lifting 4,500kg earn similar XP

### Step 5: Fatigue Modifier (Anti-Overtraining)
Training while fatigued is less effective:
- **Fatigue < 40**: 1.0× (fresh)
- **Fatigue 40-59**: 0.85× (moderate fatigue)
- **Fatigue 60-79**: 0.7× (high fatigue)
- **Fatigue ≥ 80**: 0.55× (exhausted)

```
xp_after_fatigue = base_xp × fatigue_modifier
```

### Step 6: Consistency Bonus
Rewards regular training (caps at 1.25×):
- **1-2 sessions/week**: 1.0×
- **3 sessions/week**: 1.1×
- **4 sessions/week**: 1.2×
- **5+ sessions/week**: 1.25×

```
final_xp = xp_after_fatigue × consistency_multiplier
```

### Step 7: Edit Penalty
If a session is edited after completion:
```
edited_xp = final_xp × 0.8
```

### Step 8: XP Bounds
```
minimum_xp = 20
maximum_xp = 120
final_xp = clamp(final_xp, 20, 120)
```

## Completion Requirements

A workout session can only be completed if:
1. **Duration ≥ 20 minutes**
2. **Total volume > 0** (at least some weight lifted)

## Expected XP Ranges

| Workout Type | XP Range | Description |
|-------------|----------|-------------|
| Light/Recovery | 20-30 | Low volume, light weights |
| Normal Hypertrophy | 45-65 | Moderate volume, typical training |
| Heavy Compound Day | 70-100 | High volume, heavy weights |
| Very Intense Session | 100-120 | Maximum effort, high volume + heavy weights |

## Fatigue System

### Fatigue Accumulation
After each completed workout:
```
fatigue_increase = min(25, total_xp_earned / 5)
new_fatigue = min(100, current_fatigue + fatigue_increase)
```

### Fatigue Recovery
Fatigue decreases over time:
```
recovery_per_day = 5 points
```

This encourages proper rest days and prevents overtraining.

## System Messages

The UI displays subtle system messages based on XP earned:

- **100-120 XP**: "Exceptional training stress detected. Maximum adaptation stimulus achieved."
- **70-99 XP**: "Significant training load registered. Adaptation in progress."
- **45-69 XP**: "Training stress registered. Adaptation in progress."
- **20-44 XP**: "Recovery session logged. Maintaining baseline adaptation."

## Implementation Details

### Client-Side Calculation
XP is calculated in TypeScript (`src/lib/xpCalculation.ts`) for:
- Type safety
- Complex formula support
- Immediate feedback
- Testability (46 unit tests)

### Database Integration
1. Client calculates XP and sends it with completion
2. Database trigger updates profile (level, XP)
3. Database updates fatigue level
4. All updates are atomic

### Testing
The system includes 46 comprehensive unit tests covering:
- Individual calculation steps
- Edge cases
- Boundary conditions
- Integration scenarios
- Expected XP ranges for different workout types

## Usage Example

```typescript
import { calculateSessionXP } from '@/lib/xpCalculation';

const xp = calculateSessionXP(
  {
    sets: [
      { reps: 10, weight_kg: 100 },
      { reps: 8, weight_kg: 110 },
      { reps: 6, weight_kg: 120 }
    ],
    duration_minutes: 60,
    is_edited: false
  },
  { fatigue_level: 30 },
  { sessions_this_week: 3 }
);

// Returns XP between 20-120
```

## Design Philosophy

This system follows the Solo Leveling theme where:
- **Progress is earned, not given**
- **The system recognizes genuine effort**
- **Strategic rest is rewarded (via fatigue system)**
- **Consistency matters, but not at the expense of quality**
- **No shortcuts or exploits**

The formula is sophisticated enough to differentiate between a hard workout and an easy one, while remaining impossible to game through artificial volume or button mashing.
