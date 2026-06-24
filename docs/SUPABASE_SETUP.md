# Supabase Setup Guide

This guide will walk you through setting up your own Supabase instance for the Solo Leveling fitness tracker application.

## Prerequisites

- A Supabase account (sign up at [supabase.com](https://supabase.com))
- Access to your Supabase project dashboard

## Step 1: Create a New Supabase Project

1. Log in to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose your organization
4. Enter a project name (e.g., "solo-leveling-fitness")
5. Create a strong database password (save this securely!)
6. Select a region closest to your users
7. Click "Create new project"
8. Wait 1-2 minutes for your project to be fully provisioned

## Step 2: Get Your Project Credentials

1. In your project dashboard, navigate to **Settings** > **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://xyzabc123.supabase.co`)
   - **anon/public key** (a long JWT token starting with `eyJ...`)
3. Also note your **Project ID** from **Settings** > **General**

## Step 3: Configure Your Application

1. In your local project, copy `.env.example` to `.env`:
   ```sh
   cp .env.example .env
   ```

2. Edit `.env` and replace the placeholder values:
   ```
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   VITE_SUPABASE_PROJECT_ID=your-project-id
   ```

3. **Important**: Never commit your `.env` file to version control!

## Step 4: Run Database Migrations

You need to run the SQL migrations to set up your database schema. The migrations are located in `./supabase/migrations/`.

### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New query**
4. Copy the contents of each migration file and run them **in order**:

#### Migration 1: Initial Schema
**File**: `20260119064145_5c3fc727-e03b-4e75-80ca-d27267150d93.sql`

This creates the core tables:
- `profiles` - User profiles with level, XP, rank, etc.
- `workout_sessions` - Individual workout sessions
- `session_exercises` - Exercises within sessions
- `exercise_sets` - Sets/reps/weight data for exercises
- `training_goals` - User fitness goals
- `training_preferences` - Workout preferences

#### Migration 2: Additional Features
**File**: `20260119065541_af69017e-df74-43bb-9634-c0e9b6d3473f.sql`

This adds:
- Additional constraints and indexes
- Enhanced RLS policies

#### Migration 3: Session Logging
**File**: `20260119070601_add_session_logging.sql`

This adds:
- Session logging and tracking features
- Performance optimizations

### Option B: Using Supabase CLI

If you have the [Supabase CLI](https://supabase.com/docs/guides/cli) installed:

1. Link your project:
   ```sh
   supabase link --project-ref your-project-id
   ```

2. Push migrations:
   ```sh
   supabase db push
   ```

## Step 5: Verify Setup

### Check Tables

1. In Supabase dashboard, go to **Table Editor**
2. You should see all these tables:
   - `profiles`
   - `workout_sessions`
   - `session_exercises`
   - `exercise_sets`
   - `training_goals`
   - `training_preferences`

### Check RLS Policies

1. Click on any table in the Table Editor
2. Click the "RLS" (Row Level Security) tab
3. Verify that RLS is **enabled** and policies exist

### Test Authentication

1. In your Supabase dashboard, go to **Authentication** > **Users**
2. Enable Email provider if not already enabled
3. Configure your site URL in **Authentication** > **URL Configuration**:
   - Site URL: `http://localhost:8080` (for development)
   - Add your production URL when deploying

## Step 6: Run the Application

1. Install dependencies (if not already done):
   ```sh
   npm install
   ```

2. Start the development server:
   ```sh
   npm run dev
   ```

3. Open http://localhost:8080 in your browser
4. Try creating an account - this will test your Supabase connection!

## Troubleshooting

### Error: "VITE_SUPABASE_URL is not configured"
- Make sure you've created your `.env` file
- Check that the values are correctly copied from your Supabase dashboard
- Restart your development server after changing `.env`

### Authentication not working
- Verify your Site URL is configured in Supabase Authentication settings
- Check that the Email provider is enabled
- Look at the browser console for specific error messages

### Database queries failing
- Ensure all migrations have been run successfully
- Check that RLS is enabled on all tables
- Verify your anon key is correct
- Check the Supabase logs in **Project Settings** > **Logs**

### Tables not showing up
- Verify you ran all three migration files in order
- Check for SQL errors in the Supabase SQL Editor
- Make sure you're looking in the `public` schema

## Row Level Security (RLS) Explained

All tables in this application use Row Level Security to ensure users can only access their own data:

- **profiles**: Users can only read/update their own profile
- **workout_sessions**: Users can only manage their own workout sessions
- **session_exercises**: Accessible through workout sessions (user ownership verified)
- **exercise_sets**: Accessible through exercises (user ownership verified)
- **training_goals**: Users can only manage their own goals
- **training_preferences**: Users can only manage their own preferences

This security is enforced at the database level, making it impossible for users to access other users' data, even if they try to modify API requests.

## Data Ownership

All data in your Supabase project belongs to you:
- You control the database
- You control the authentication
- You control the RLS policies
- You can export data anytime
- You can modify the schema as needed

There are no third-party managed services or fallback connections. Your application connects **only** to your Supabase instance.

## Next Steps

1. Test all features of the application
2. Configure your production Site URL in Supabase when deploying
3. Set up your production environment variables
4. Consider setting up [Supabase Edge Functions](https://supabase.com/docs/guides/functions) for any backend logic you need
5. Review and customize RLS policies for your specific needs

## Support

- **Supabase Documentation**: https://supabase.com/docs
- **Supabase Discord**: https://discord.supabase.com
- **Application Issues**: Open an issue in this repository
