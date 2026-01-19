import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Validate Supabase configuration at startup
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/**
 * Display configuration error page
 * @param field The missing/invalid field name
 */
function showConfigurationError(field: string): void {
  document.body.innerHTML = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; background: #fee; border: 2px solid #c33; border-radius: 8px;">
      <h1 style="color: #c33; margin-top: 0;">⚠️ Configuration Required</h1>
      <p><strong>${field}</strong> is not configured.</p>
      <p>This application requires connection to your own Supabase instance.</p>
      <h3>Setup Steps:</h3>
      <ol>
        <li>Create a Supabase project at <a href="https://supabase.com" target="_blank">supabase.com</a></li>
        <li>Copy <code>.env.example</code> to <code>.env</code></li>
        <li>Add your Supabase URL and anon key to <code>.env</code></li>
        <li>Run the database migrations (see SUPABASE_SETUP.md)</li>
        <li>Restart the development server</li>
      </ol>
      <p>See <strong>README.md</strong> and <strong>SUPABASE_SETUP.md</strong> for detailed instructions.</p>
    </div>
  `;
}

// Prevent app from starting with placeholder or missing credentials
if (!SUPABASE_URL || SUPABASE_URL === 'YOUR_SUPABASE_URL_HERE') {
  showConfigurationError('VITE_SUPABASE_URL');
  throw new Error('Supabase configuration required. See .env.example');
}

if (!SUPABASE_KEY || SUPABASE_KEY === 'YOUR_SUPABASE_ANON_KEY_HERE') {
  showConfigurationError('VITE_SUPABASE_PUBLISHABLE_KEY');
  throw new Error('Supabase configuration required. See .env.example');
}

console.log('✅ Supabase configuration detected');
console.log('📍 Connected to:', SUPABASE_URL);

createRoot(document.getElementById("root")!).render(<App />);
