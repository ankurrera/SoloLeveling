# Skills System UI Flow and Structure

## Page Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│                         HEADER (Sticky)                              │
│  [← Back]  Skills                                        [☰ Menu]    │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                      QUICK CREATE PANEL                              │
│  [+ New Area - Skill]  [+ New Characteristic]                       │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────┬──────────────────────────────────────────────┐
│  CHARACTERISTICS     │  SKILLS - AREAS                              │
│  (Left - 30%)        │  (Right - 70%)                               │
│                      │                                              │
│  Characteristics     │  Skills – Areas  [All][Active][Inactive]    │
│        [+ New]       │                  [🔍 Search...] [+ New]     │
│                      │                                              │
│  ┌────────────────┐  │  ┌─────────────┐ ┌─────────────┐           │
│  │ 💪 Strength    │  │  │ [Cover Img] │ │ [Cover Img] │           │
│  │ Level 3    ⭐  │  │  │ Web Dev     │ │ Guitar      │           │
│  │ 440/500 XP     │  │  │ Programming │ │ Music       │           │
│  │ ████████░░ 88% │  │  │ Level 5  ⭐ │ │ Level 2  ⭐ │           │
│  │ [✏️] [🗑️]      │  │  │ 440/550 XP  │ │ 285/500 XP  │           │
│  └────────────────┘  │  │ ██████████  │ │ ██████░░░░  │           │
│                      │  │ [✏️] [🗑️]   │ │ [✏️] [🗑️]   │           │
│  ┌────────────────┐  │  │ [⚡Active]   │ │ [⚪Inactive] │           │
│  │ 🧠 Intelligence│  │  └─────────────┘ └─────────────┘           │
│  │ Level 2    ⭐  │  │                                              │
│  │ 285/400 XP     │  │  ┌─────────────┐ ┌─────────────┐           │
│  │ ███████░░░ 71% │  │  │ [Cover Img] │ │ [Cover Img] │           │
│  │ [✏️] [🗑️]      │  │  │ Fitness     │ │ Writing     │           │
│  └────────────────┘  │  │ Health      │ │ Content     │           │
│                      │  │ Level 8  ⭐ │ │ Level 3  ⭐ │           │
│  [+ New             │  │ 2100/2500XP │ │ 450/900 XP  │           │
│   Characteristic]   │  │ ██████████  │ │ ████░░░░░░  │           │
│                      │  │ [✏️] [🗑️]   │ │ [✏️] [🗑️]   │           │
│                      │  │ [⚡Active]   │ │ [⚡Active]   │           │
│                      │  └─────────────┘ └─────────────┘           │
└──────────────────────┴──────────────────────────────────────────────┘
```

## Component Hierarchy

```
Skills Page
│
├── Header
│   ├── Back Button (→ /)
│   ├── Title: "Skills"
│   └── Menu Button
│
├── Quick Create Panel
│   ├── New Area-Skill Button
│   └── New Characteristic Button
│
└── Main Content (Two Columns)
    │
    ├── Left Column (30%) - Characteristics Panel
    │   ├── Header ("Characteristics" + New Button)
    │   ├── Characteristic Cards (List)
    │   │   ├── Icon + Name
    │   │   ├── Level + Star
    │   │   ├── XP Display (current/next)
    │   │   ├── Progress Bar
    │   │   └── Actions (Edit, Delete)
    │   └── Create Characteristic Form (inline)
    │
    └── Right Column (70%) - Skills Grid
        ├── Header
        │   ├── Title: "Skills – Areas"
        │   ├── Filter Buttons (All/Active/Inactive)
        │   ├── Search Input
        │   └── New Skill Button
        │
        ├── Skill Cards (Grid)
        │   ├── Cover Image
        │   ├── Name + Description
        │   ├── Area Tag
        │   ├── Level + Star
        │   ├── XP Display
        │   ├── Segmented Progress Bar (10 blocks)
        │   ├── Actions (Edit, Delete)
        │   └── Active/Inactive Toggle
        │
        └── Create Skill Form (inline)
```

## User Interactions

### Creating a Characteristic
```
1. User clicks [+ New] or [+ New Characteristic]
   ↓
2. Inline form appears with:
   - Icon selector (emoji grid)
   - Name input
   - Initial XP input
   ↓
3. User fills form and clicks [Create]
   ↓
4. Mutation sent to Supabase
   ↓
5. Database trigger calculates level
   ↓
6. React Query cache updates
   ↓
7. New card appears in list
   ↓
8. Toast notification: "Characteristic created successfully!"
```

### Editing XP (Inline)
```
1. User clicks [Edit] icon on characteristic
   ↓
2. Card enters edit mode:
   - Icon becomes input
   - Name becomes input
   - XP input appears
   ↓
3. User changes XP value
   ↓
4. User clicks [Save]
   ↓
5. Mutation updates database
   ↓
6. Trigger recalculates level
   ↓
7. Card updates with new level and progress
   ↓
8. Toast: "Characteristic updated successfully!"
```

### Filtering Skills
```
1. User types in search box: "web"
   ↓
2. Grid filters in real-time
   ↓
3. Only "Web Development" shows
   
OR

1. User clicks [Active] filter
   ↓
2. Grid filters to show only is_active = true
   ↓
3. Inactive skills hidden
```

### Creating a Skill
```
1. User clicks [+ New Skill] or [+ New Area-Skill]
   ↓
2. Inline form expands with fields:
   - Name (required)
   - Description
   - Area
   - Cover Image URL
   - Initial XP
   ↓
3. User fills and submits
   ↓
4. New skill card appears in grid
   ↓
5. Toast: "Skill created successfully!"
```

### Deleting with Confirmation
```
1. User clicks [Delete] icon
   ↓
2. Custom confirmation dialog opens:
   "Delete Skill"
   "Are you sure you want to delete 'Web Development'?
    This action cannot be undone."
   [Cancel] [Delete]
   ↓
3. User clicks [Delete]
   ↓
4. Mutation deletes from database
   ↓
5. Card disappears with animation
   ↓
6. Toast: "Skill deleted successfully"
```

## Data Flow

### Read (on page load)
```
Skills Page Mounts
      ↓
useSkills() hook
      ↓
React Query: ['skills', user.id]
      ↓
Supabase Query: SELECT * FROM skills WHERE user_id = ?
      ↓
Apply RLS Policy
      ↓
Return data
      ↓
Update component state
      ↓
Render skill cards
```

### Create
```
User submits form
      ↓
createSkill.mutate()
      ↓
Supabase: INSERT INTO skills
      ↓
Database trigger calculates level
      ↓
Return new skill with level
      ↓
React Query invalidates cache
      ↓
Re-fetch skills
      ↓
UI updates
      ↓
Toast notification
```

### Update
```
User edits XP
      ↓
updateSkill.mutate({ id, xp })
      ↓
Supabase: UPDATE skills SET xp = ? WHERE id = ?
      ↓
Trigger recalculates level
      ↓
Return updated skill
      ↓
Cache invalidation
      ↓
UI re-renders with new level/progress
```

## Progress Bar Visualization

### Characteristic Progress Bar (Standard)
```
Current XP: 440
Next Level XP: 500
Progress: 440 / 500 = 88%

Visual:
████████░░ 88%

CSS: Single div with width: 88%
```

### Skill Progress Bar (Segmented - 10 blocks)
```
Current XP: 440
Next Level XP: 500
Progress: 88%

Block calculation:
Block 1: 88% - 0*10 = 88%  → 100% filled
Block 2: 88% - 1*10 = 78%  → 100% filled
...
Block 8: 88% - 7*10 = 18%  → 100% filled
Block 9: 88% - 8*10 = 8%   → 80% filled (partial)
Block 10: 88% - 9*10 = -2% → 0% filled

Visual:
██ ██ ██ ██ ██ ██ ██ ██ █░ ░░

CSS: 10 divs, each with calculated fill percentage
```

## Responsive Behavior

### Desktop (> 1024px)
- Two columns: 30% / 70%
- Grid: 3 columns for skills
- All features visible

### Tablet (768px - 1024px)
- Two columns: 35% / 65%
- Grid: 2 columns for skills
- Slightly tighter spacing

### Mobile (< 768px)
- Single column layout
- Characteristics on top
- Skills grid below
- 1 column for skills
- Collapsible sections

## State Management

```typescript
// Component State
- isCreating: boolean (show/hide create forms)
- searchQuery: string (filter skills)
- filterActive: "all" | "active" | "inactive"
- isEditing: boolean (edit mode for cards)
- showDeleteDialog: boolean (confirmation dialogs)

// React Query State
- skills: Skill[] (cached data)
- characteristics: Characteristic[] (cached data)
- isLoading: boolean (loading states)
- mutations: createSkill, updateSkill, etc.
```

## Navigation Flow

```
Index (/)
   ↓
Habits (/habits)
   ↓
[Skills Button]
   ↓
Skills (/skills) ←──────┐
   ↓                    │
[Back Button] ──────────┘
   ↓
Index (/)
```

## Summary

The Skills System provides a comprehensive, production-ready solution for managing skills and characteristics with:
- ✅ Intuitive two-column layout
- ✅ Real-time XP tracking and level calculation
- ✅ Full CRUD operations with confirmation
- ✅ Search and filtering
- ✅ Persistent storage
- ✅ Clean, Notion-style design
- ✅ Type-safe implementation
- ✅ Responsive design
