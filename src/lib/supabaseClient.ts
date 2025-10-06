import { createClient } from "@supabase/supabase-js";

// These environment variables are embedded at build time for a static website.
// Ensure they are prefixed with VITE_ in your .env file.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and Anon Key are required. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file.");
}

/**
 * Supabase client configured for a static website.
 *
 * - `persistSession`: Set to `false` because there's no user session to maintain on the client.
 * - `autoRefreshToken`: Disabled as it's not relevant for a static context.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export default supabase;
