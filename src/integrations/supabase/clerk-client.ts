import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://qdpktyyvqejdpxiegooe.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkcGt0eXl2cWVqZHB4aWVnb29lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxODM1ODcsImV4cCI6MjA2MTc1OTU4N30.JobbkKyPjZN04H2YX4XKAUWcpSmViLNpbFs02u8GrU0";

// Create a Supabase client that uses Clerk session tokens
export const createClerkSupabaseClient = (getToken: () => Promise<string | null>) => {
  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    accessToken: getToken,
    auth: {
      storage: localStorage,
      persistSession: false, // Clerk handles session persistence
      autoRefreshToken: false, // Clerk handles token refresh
    }
  });
};

// Fallback client for when no Clerk session is available
export const supabaseClient = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});