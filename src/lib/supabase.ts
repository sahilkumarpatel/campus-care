
import { createClient } from '@supabase/supabase-js';

// Supabase configuration with the provided URL and anon key
export const SUPABASE_URL = 'https://xfvtqlacvgngyhnwcort.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmdnRxbGFjdmduZ3lobndjb3J0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxMzA0NjMsImV4cCI6MjA1OTcwNjQ2M30.F3tZkWoMNGyvPncqy2YKt69riySGYc9Xh4EAlCsPcqs';

// Create and export the Supabase client instance
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// For checking if Supabase is configured properly
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

// Helper function to convert string IDs to UUIDs
export const toUUID = (id: string) => {
  try {
    return id;
  } catch (error) {
    console.error('Invalid UUID format:', error);
    return id;
  }
};

export default supabase;
