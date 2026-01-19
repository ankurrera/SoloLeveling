# Workout Logging UI Flow

## Main Page - Log Workout Button
```
┌────────────────────────────────────────────────┐
│                                                │
│  [+ Log Workout]  <-- Button on main page     │
│                                                │
└────────────────────────────────────────────────┘
```

## Expanded Workout Logger View
```
┌────────────────────────────────────────────────────────────┐
│  Daily Quest: Log Workout Session                    [X]   │
│  Track your exercises and sets to earn XP                  │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  Bench Press                               [Trash]  │  │
│  │  ─────────────────────────────────────────────────  │  │
│  │  Set 1    [17.5] kg  ×  [12] reps         [Trash]  │  │
│  │  Set 2    [20.0] kg  ×  [10] reps         [Trash]  │  │
│  │                                                      │  │
│  │  [+ Add Set]                                        │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  Incline Dumbbell Press                    [Trash]  │  │
│  │  ─────────────────────────────────────────────────  │  │
│  │  Set 1    [12.5] kg  ×  [12] reps         [Trash]  │  │
│  │  Set 2    [15.0] kg  ×  [10] reps         [Trash]  │  │
│  │                                                      │  │
│  │  [+ Add Set]                                        │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                            │
│  [+ Add Exercise]                                         │
│                                                            │
│  ────────────────────────────────────────────────────────  │
│                                                            │
│  [Complete Workout]                                       │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

## Adding New Exercise Flow
```
Step 1: Click "+ Add Exercise"
┌────────────────────────────────────────────────┐
│  [Exercise Name (e.g., Bench Press)_____]     │
│                                                │
│  [Add Exercise]  [Cancel]                     │
└────────────────────────────────────────────────┘

Step 2: After adding, exercise appears with 1 set
┌────────────────────────────────────────────────┐
│  Bench Press                          [Trash]  │
│  ──────────────────────────────────────────    │
│  Set 1    [0] kg  ×  [1] reps        [Trash]  │
│                                                │
│  [+ Add Set]                                   │
└────────────────────────────────────────────────┘

Step 3: Edit weight and reps inline
- Click on [0] to change weight
- Click on [1] to change reps
- Changes auto-save immediately
```

## Session History - Editing Past Workouts
```
┌────────────────────────────────────────────────────────┐
│  Session History                                       │
├────────────────────────────────────────────────────────┤
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │  📅 Jan 19, 2026                    +100 XP      │ │
│  │  🕐 60 min                          [Edit]  [v]  │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │  📅 Jan 18, 2026                    +85 XP       │ │
│  │  🕐 45 min                          [Edit]  [v]  │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
└────────────────────────────────────────────────────────┘

Click [Edit] to open inline editor for past workout
```

## Key UI Features

### 1. Inline Editing
- All text fields are directly editable (no modals)
- Weight and reps are input fields
- Exercise names are editable text inputs
- Click to edit, autosave on change

### 2. Visual Feedback
- "Saving..." indicator appears during autosave
- Toast notifications for major actions
- Smooth transitions and hover effects
- RPG-themed card panels

### 3. Deletion
- Trash icons on each set and exercise
- Click to delete immediately
- Changes autosave

### 4. Adding Elements
- "+ Add Exercise" button at bottom
- "+ Add Set" button under each exercise
- Inline input fields appear when adding

### 5. Completion
- "Complete Workout" button at bottom
- Shows total XP earned: "+[XP] from [exercises] exercises and [sets] sets!"
- Closes logger and returns to main view

## Autosave Behavior
```
User Action          →  Autosave Trigger
────────────────────────────────────────
Type exercise name   →  On blur/enter
Change weight        →  On change
Change reps          →  On change
Add set              →  Immediately
Delete set           →  Immediately
Add exercise         →  On button click
Delete exercise      →  Immediately

All saves show: "Saving..." indicator
```

## Validation
```
Field           Validation           Visual Feedback
─────────────────────────────────────────────────
Weight (kg)     ≥ 0                 Toast error if < 0
Reps            ≥ 1                 Toast error if < 1
Exercise name   Not empty           Toast error if empty
```

## Data Flow
```
1. User clicks "Log Workout"
   └→ Creates new workout_session in database

2. User adds exercise
   └→ Creates session_exercise record
   └→ Auto-creates first set (Set 1)
   └→ Creates exercise_set record

3. User edits weight/reps
   └→ Updates exercise_set record
   └→ Shows "Saving..." indicator

4. User adds more sets
   └→ Creates exercise_set records
   └→ Auto-increments set_number

5. User completes workout
   └→ Calculates total XP
   └→ Updates profile XP and level
   └→ Closes logger
```

## XP Calculation
```
Formula: (Exercises × 10) + (Sets × 5)

Example:
- 3 exercises
- 12 total sets
= (3 × 10) + (12 × 5)
= 30 + 60
= 90 XP earned
```

## RPG Integration
The entire interface maintains the RPG theme:
- Card-based panels with borders
- "Daily Quest" terminology
- XP rewards prominently displayed
- Gradient backgrounds
- Hover glow effects
- Corner decorations
- System panel styling
