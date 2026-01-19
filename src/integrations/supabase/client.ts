/**
 * Supabase Client Configuration
 * 
 * This application requires connection to YOUR OWN external Supabase instance.
 * It does NOT use Lovable's managed Supabase cloud.
 * 
 * SETUP REQUIRED:
 * 1. Create a Supabase project at https://supabase.com
 * 2. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in your .env file
 * 3. Run the migrations from ./supabase/migrations/ in your Supabase SQL editor
 * 
 * @see .env.example for required environment variables
 */
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Validate that environment variables are properly set
if (!SUPABASE_URL || SUPABASE_URL === 'YOUR_SUPABASE_URL_HERE' || !SUPABASE_URL.includes('supabase.co')) {
  throw new Error(
    'VITE_SUPABASE_URL is not configured. Please set it in your .env file to your own Supabase project URL. See .env.example for instructions.'
  );
}

if (!SUPABASE_PUBLISHABLE_KEY || SUPABASE_PUBLISHABLE_KEY === 'YOUR_SUPABASE_ANON_KEY_HERE' || SUPABASE_PUBLISHABLE_KEY.length < 20) {
  throw new Error(
    'VITE_SUPABASE_PUBLISHABLE_KEY is not configured. Please set it in your .env file to your own Supabase anon key. See .env.example for instructions.'
  );
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});