
import { createClient } from '@supabase/supabase-js';

// Supabase configuration
export const SUPABASE_URL = 'https://xfvtqlacvgngyhnwcort.supabase.co';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create and export the Supabase client instance
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// For checking if Supabase is configured properly
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export default supabase;
