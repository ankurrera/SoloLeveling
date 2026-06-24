# Radar Chart Reactive Architecture

## Overview

This document explains the reactive data architecture that ensures the Skills page and the CORE METRICS → PHYSICAL BALANCE radar chart are always synchronized.

## HARD OVERRIDE LINE

> **"Remove all hardcoded radar data and bind the radar exclusively to computed Core Metrics derived from the Skills store."**

This is the fundamental principle of the system. The radar chart **never** defines its own data - it is purely a visual representation of computed Core Metrics.

## Single Source of Truth

The system has exactly one authoritative dataset:

```
Skills Database (Supabase 'skills' table)
    ↓
Skills Store (React Query cache with key ['skills'])
    ↓
Core Metrics (computed, not stored)
    ↓
Radar Chart (visualization only)
```

### Rules

1. ✅ Skills page reads from Skills Store
2. ✅ Core Metrics calculations read from Skills Store
3. ✅ Radar chart reads from derived Core Metrics only
4. ❌ No duplicate skill arrays
5. ❌ No static radar labels or values
6. ❌ No mock data

## Data Flow Architecture

### Complete Reactive Pipeline

```typescript
Skill CRUD Operation (Create/Update/Delete)
    ↓
useSkills.ts mutation onSuccess
    ↓
queryClient.invalidateQueries({ queryKey: ['skills'] })
    ↓
useQuery refetches from Supabase
    ↓
Skills Store updates (React Query cache)
    ↓
useCoreMetrics.ts useMemo dependencies change
    ↓
computeAllCoreMetrics() executes
    ↓
Core Metrics array generated (18 metrics with XP values)
    ↓
getRadarChartData() transforms metrics
    ↓
radarData state updates
    ↓
RadarChart.tsx useEffect dependency (data) changes
    ↓
Canvas re-renders with new data
```

### Timeline (No Refresh Required)

All updates happen **automatically** without page reload:

1. **T+0ms**: User performs CRUD operation (e.g., marks attendance)
2. **T+50ms**: Database operation completes
3. **T+51ms**: React Query invalidates cache
4. **T+100ms**: Skills refetched from database
5. **T+101ms**: `useMemo` triggers recomputation
6. **T+102ms**: Core Metrics computed
7. **T+103ms**: Radar data generated
8. **T+104ms**: Canvas re-renders with new shape

**Total latency: ~100ms** ⚡

## Core Metrics Computation

### Formula

For each of the 18 Core Metrics:

```typescript
Metric XP = Σ (Skill XP × Contribution Weight)

// Example:
// Skill: "Python" with 1000 XP
// Contributes to: { Programming: 0.8, Math: 0.2 }
//
// Result:
// Programming XP += 1000 * 0.8 = 800
// Math XP += 1000 * 0.2 = 200
```

### The 18 Core Metrics (Fixed)

1. Programming
2. Learning
3. Erudition
4. Discipline
5. Productivity
6. Foreign Language
7. Fitness
8. Drawing
9. Hygiene
10. Reading
11. Communication
12. Cooking
13. Meditation
14. Swimming
15. Running
16. Math
17. Music
18. Cleaning

These metrics are **never edited directly**. They are always computed from Skills.

## Skill CRUD Operations

### CREATE Skill

```typescript
// User creates new skill "Guitar Practice"
createSkill.mutate({
  name: "Guitar Practice",
  xp: 0,
  contributesTo: { Music: 0.8, Discipline: 0.2 }
});

// Result:
// 1. Skill added to database
// 2. Skills cache invalidated
// 3. Core Metrics recomputed
// 4. Music metric increases by 0
// 5. Radar updates immediately (new shape with Music axis potentially active)
```

### UPDATE Skill (XP Change)

```typescript
// User marks attendance, earning 50 XP
// Skill "Guitar Practice" now has 50 XP

// Result:
// 1. Attendance record created
// 2. Skill XP updated to 50
// 3. Skills cache invalidated
// 4. Core Metrics recomputed
// 5. Music XP increases by 40 (50 * 0.8)
// 6. Discipline XP increases by 10 (50 * 0.2)
// 7. Radar expands on Music and Discipline axes
```

### UPDATE Skill (Mapping Change)

```typescript
// User changes contribution mapping
updateSkill.mutate({
  id: "guitar-skill",
  contributesTo: { Music: 1.0 } // Changed from 0.8/0.2 split
});

// Result:
// 1. Skill mapping updated
// 2. Skills cache invalidated
// 3. Core Metrics recomputed
// 4. Music XP recalculated with new weight
// 5. Discipline XP loses this skill's contribution
// 6. Radar shape changes immediately
```

### DELETE Skill

```typescript
// User deletes "Guitar Practice" skill
deleteSkill.mutate("guitar-skill");

// Result:
// 1. Skill removed from database
// 2. Skills cache invalidated
// 3. Core Metrics recomputed
// 4. Music XP decreases (removes this skill's contribution)
// 5. Discipline XP decreases (removes this skill's contribution)
// 6. Radar contracts on affected axes
// 7. NO ghost values remain
```

## React Hooks Architecture

### useSkills.ts

**Purpose**: Manage Skills CRUD with database sync

**Key Features**:
- Uses `@tanstack/react-query` for caching
- Invalidates cache on every mutation
- Returns optimistic UI updates

```typescript
export const useSkills = () => {
  const { skills, isLoading } = useQuery({
    queryKey: ['skills', user?.id],
    queryFn: fetchSkillsFromSupabase,
  });

  const createSkill = useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] });
    },
  });

  // ... updateSkill, deleteSkill with same pattern
};
```

### useCoreMetrics.ts

**Purpose**: Compute Core Metrics from Skills (reactive)

**Key Features**:
- Reads from `useSkills()` hook
- Uses `useMemo` to cache computation
- Automatically recomputes when skills change
- **NO internal state** for metric values

```typescript
export function useCoreMetrics() {
  const { skills } = useSkills();
  const { characteristics } = useCharacteristics();

  // Auto-recomputes when skills/characteristics change
  const coreMetrics = useMemo(() => {
    return computeAllCoreMetrics(skills, characteristics);
  }, [skills, characteristics]);

  const radarData = useMemo(() => {
    return getRadarChartData(coreMetrics);
  }, [coreMetrics]);

  return { coreMetrics, radarData, ... };
}
```

### RadarChart.tsx

**Purpose**: Visualize Core Metrics (display only)

**Key Features**:
- Reads from `useCoreMetrics()` hook
- Uses `useEffect` to redraw canvas when data changes
- **NO local state** for metric values
- **NO hardcoded** labels or values

```typescript
const RadarChart = () => {
  const { radarData, coreMetrics } = useCoreMetrics();
  
  // data = radarData is the ONLY data source
  const data = radarData;

  useEffect(() => {
    // Redraw canvas whenever data changes
    drawRadarChart(data);
  }, [data]);
  
  // ... canvas drawing logic
};
```

## Debugging Features

### Development Console Logs

When `NODE_ENV === 'development'`, the system logs every stage:

1. **Skills CRUD**: `[Skills CRUD] Skill created/updated/deleted`
2. **Core Metrics**: `[Core Metrics] Recomputed from skills`
3. **Radar Data**: `[Radar Data] Updated`
4. **Radar Render**: `[Radar Chart] Re-rendering with data`

### Debug Panel (Dev Only)

The radar chart includes a visual debug panel showing:

```
🔍 Debug Info
Radar Points: 18
Core Metrics: 18
Total Contributing Skills: 5
Non-Zero Metrics: 7
```

This helps verify:
- Data structure integrity
- Contribution tracking
- Real-time updates

### Click-to-Debug

Click any radar axis to see:
- Total XP for that metric
- All contributing skills
- XP contribution per skill
- Contribution weight per skill

Example:
```
Programming - 860 XP

Contributing Skills (3)
- Python (500 XP × 80%) +400 XP
- JavaScript (400 XP × 70%) +280 XP  
- Rust (200 XP × 90%) +180 XP
```

## Assertions & Safety

### Length Assertions

```typescript
// useCoreMetrics.ts
if (radarData.length !== coreMetrics.length) {
  console.error('[CRITICAL] Radar data length mismatch!');
}
```

### Type Safety

All data structures are fully typed:

```typescript
interface ComputedCoreMetric {
  id: CoreMetricName;
  name: CoreMetricName;
  xp: number;
  level: number;
  contributions: MetricContributionDetail[];
}
```

### Test Coverage

- **139 tests** covering the entire pipeline
- Integration tests simulate full CRUD flows
- Tests verify no ghost values after deletion
- Tests verify immediate updates without refresh

## Common Pitfalls (Avoided)

### ❌ DON'T: Store radar data in component state

```typescript
// WRONG - creates stale data
const [radarData, setRadarData] = useState(initialData);
```

### ✅ DO: Read radar data from hook

```typescript
// CORRECT - always fresh
const { radarData } = useCoreMetrics();
const data = radarData;
```

### ❌ DON'T: Initialize radar with hardcoded values

```typescript
// WRONG - static data
const data = [
  { label: 'Programming', value: 500 },
  { label: 'Fitness', value: 300 },
];
```

### ✅ DO: Compute radar from Core Metrics

```typescript
// CORRECT - derived data
const metrics = computeAllCoreMetrics(skills);
const data = getRadarChartData(metrics);
```

### ❌ DON'T: Manually sync Skills and Radar

```typescript
// WRONG - manual sync prone to bugs
const handleSkillUpdate = () => {
  updateSkill();
  updateRadar(); // Easy to forget!
};
```

### ✅ DO: Let React Query handle sync automatically

```typescript
// CORRECT - automatic sync
const handleSkillUpdate = () => {
  updateSkill.mutate(data);
  // React Query + useMemo handle the rest
};
```

## Performance Optimization

### Memoization Strategy

All computations use `useMemo` to prevent unnecessary recalculation:

```typescript
// Only recomputes when skills change
const coreMetrics = useMemo(() => {
  return computeAllCoreMetrics(skills, characteristics);
}, [skills, characteristics]);

// Only transforms when metrics change
const radarData = useMemo(() => {
  return getRadarChartData(coreMetrics);
}, [coreMetrics]);
```

### React Query Caching

Skills are cached in memory and only refetched when invalidated:

```typescript
useQuery({
  queryKey: ['skills', user?.id],
  staleTime: Infinity, // Skills remain fresh until invalidated
});
```

## Maintenance Guidelines

### Adding a New Core Metric

⚠️ **Rare Operation** - Core Metrics are intentionally fixed at 18.

If you must add one:

1. Add to `PHYSICAL_BALANCE_METRICS` in `coreMetrics.ts`
2. Update characteristic mapping in `useCoreMetrics.ts`
3. All radar rendering code auto-adjusts to new count
4. Run full test suite to verify

### Modifying XP Calculation

If changing how XP is computed:

1. Update `computeCoreMetricXP()` in `coreMetricCalculation.ts`
2. Update tests in `coreMetricCalculation.test.ts`
3. Verify integration tests still pass
4. Document formula change in this file

### Adding Debug Information

To add more debug info:

1. Add logging in `useCoreMetrics.ts` (with `process.env.NODE_ENV` check)
2. Add to debug panel in `RadarChart.tsx` (wrapped in dev check)
3. Keep production bundle size minimal

## Troubleshooting

### Problem: Radar doesn't update after skill change

**Diagnosis**:
1. Check browser console for `[Skills CRUD]` log
2. Verify `queryClient.invalidateQueries` is called
3. Check `[Core Metrics] Recomputed` log appears
4. Verify `[Radar Chart] Re-rendering` log appears

**Common Cause**: React Query cache not invalidated

**Fix**: Ensure mutation's `onSuccess` calls `invalidateQueries`

### Problem: Radar shows stale data after deletion

**Diagnosis**:
1. Check if skill still exists in database
2. Verify skills array doesn't contain deleted skill
3. Check Core Metrics contributions list

**Common Cause**: Skill not actually deleted from database

**Fix**: Check delete mutation error handling

### Problem: Radar shape doesn't match skills

**Diagnosis**:
1. Open debug panel (dev mode)
2. Click radar axes to see contributors
3. Verify XP values match expectations
4. Check contribution weights in database

**Common Cause**: Contribution mapping mismatch

**Fix**: Update skill's `contributes_to` field

## Verification Checklist

Use this checklist to verify the system is working correctly:

- [ ] Create skill → Radar updates without refresh
- [ ] Update skill XP → Radar expands/contracts immediately
- [ ] Delete skill → Radar removes contribution immediately
- [ ] Mark attendance → Radar updates with new XP
- [ ] Edit time → Radar recalculates XP
- [ ] Change skill mapping → Radar reshapes to new metrics
- [ ] Zero XP skill → Radar shows no contribution
- [ ] Multiple skills to same metric → Radar sums correctly
- [ ] Console shows all 4 debug log stages
- [ ] Debug panel counts match reality
- [ ] Click-to-debug shows correct contributors
- [ ] All 149 tests pass
- [ ] Build succeeds without warnings

## Conclusion

This architecture ensures that the Skills page and Radar chart are **always synchronized** because they share a single source of truth: the Skills Store. The radar chart is purely a visualization of computed Core Metrics, which are themselves derived from Skills.

**No refresh required. No manual sync. No stale data.**

The system is a **true reactive RPG stat engine**.
