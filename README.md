# Solo Leveling - Fitness Tracker

A fitness tracking application that gamifies your workout journey. Track workouts, set goals, and level up your fitness!

## Important: External Supabase Configuration Required

**This application does NOT use any managed cloud services or auto-provisioned databases.**

You MUST provide your own Supabase instance to run this application. There is no fallback or default database.

### Prerequisites

- Node.js & npm (install with [nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- A Supabase account and project (create at [supabase.com](https://supabase.com))

## Setup Instructions

### 1. Clone the Repository

```sh
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
```

### 2. Install Dependencies

```sh
npm install
```

### 3. Create Your Own Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Wait for your project to be fully provisioned (this takes 1-2 minutes)
4. Note your project URL and anon key from Project Settings > API

### 4. Configure Environment Variables

**Important:** The `.env` file is not included in this repository for security reasons. You must create it yourself.

1. Copy the example environment file:
   ```sh
   cp .env.example .env
   ```

2. Edit `.env` and replace the placeholder values with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
   VITE_SUPABASE_PROJECT_ID=your-project-id-here
   ```

3. **NEVER commit your `.env` file to version control** - it is already in `.gitignore`

### 5. Set Up Database Schema

1. Open your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run each migration file from `./supabase/migrations/` in order:
   - `20260119064145_5c3fc727-e03b-4e75-80ca-d27267150d93.sql`
   - `20260119065541_af69017e-df74-43bb-9634-c0e9b6d3473f.sql`
   - `20260119070601_add_session_logging.sql`
   - `20260119094000_rename_weight_to_weight_kg.sql`

This creates all necessary tables, views, and Row Level Security (RLS) policies.

### 6. Start the Development Server

```sh
npm run dev
```

The application will be available at `http://localhost:8080`

## Authentication

This application uses **your Supabase project's authentication system**:
- Email/password authentication
- Sessions stored in your Supabase instance
- Users table = `auth.users` from your project
- All auth logic runs through your Supabase instance

There is no proxy authentication or shadow users.

## Database Structure

The application uses the following main tables in your Supabase project:
- `profiles` - User profiles and fitness stats
- `workout_sessions` - Individual workout sessions
- `session_exercises` - Exercises within sessions
- `exercise_sets` - Sets/reps/weight data for exercises
- `training_goals` - User fitness goals
- `training_preferences` - User workout preferences

All tables have Row Level Security (RLS) enabled and are secured to the authenticated user.

## Technologies

- **Frontend**: Vite + React + TypeScript
- **UI**: shadcn-ui + Tailwind CSS
- **Backend**: Supabase (your own instance)
- **Auth**: Supabase Auth (from your instance)
- **Database**: PostgreSQL (via your Supabase project)

## Features

### System Status - RPG-Style Training Dashboard
The app presents your real gym progress as an RPG character sheet with:
- **Level & XP System** - Earn XP based on workout volume and duration
- **Core Stats** - Strength, Endurance, Recovery, Consistency, Mobility (all calculated from real data)
- **Radar Chart** - Visual balance of your physical metrics
- **Training Calendar** - Track completed sessions and rest days
- **Goals** - Set and track long-term fitness objectives
- **Behavior Patterns** - Earn "potions" through good training habits

**All stats are derived from logged workouts. No fake numbers. No manual editing.**

📖 [System Status User Guide](SYSTEM_STATUS_USER_GUIDE.md)  
🔧 [System Status Technical Documentation](SYSTEM_STATUS_TECHNICAL_DOCS.md)

### Workout Logging
- Log exercises with sets, reps, and weight
- Inline editing of all workout data
- Autosave functionality
- Session history with XP tracking

## Development Commands

```sh
npm run dev          # Start development server
npm run build        # Build for production
npm run build:dev    # Build in development mode
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

## Deployment

When deploying to production:

1. Ensure your environment variables are set in your hosting platform
2. Build the application: `npm run build`
3. Deploy the `dist` folder to your hosting service
4. Your Supabase instance remains the backend - no additional backend deployment needed

## Security Notes

- ✅ All data belongs to YOUR Supabase project
- ✅ You have full control over auth, database, RLS, and policies
- ✅ No third-party managed services are used
- ✅ No automatic provisioning or fallback connections
- ⚠️ Keep your `.env` file secure and never commit it
- ⚠️ Regularly update your Supabase RLS policies as needed

## Troubleshooting

**Error: "VITE_SUPABASE_URL is not configured"**
- You need to set up your `.env` file with your own Supabase credentials. See Setup Instructions above.

**Authentication not working**
- Verify your Supabase URL and anon key are correct
- Check that you've run all database migrations
- Ensure RLS policies are enabled on your tables

**Database queries failing**
- Confirm all migrations have been run in your Supabase SQL editor
- Check your Supabase project logs for detailed error messages
- Verify RLS policies allow the authenticated user to access the data

## Support

For issues related to:
- **Supabase setup**: Check [Supabase documentation](https://supabase.com/docs)
- **Application bugs**: Open an issue in this repository
