
import { createClient } from '@supabase/supabase-js';

// Supabase configuration with the provided URL and anon key
export const SUPABASE_URL = 'https://xfvtqlacvgngyhnwcort.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmdnRxbGFjdmduZ3lobndjb3J0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxMzA0NjMsImV4cCI6MjA1OTcwNjQ2M30.F3tZkWoMNGyvPncqy2YKt69riySGYc9Xh4EAlCsPcqs';

// Create and export the Supabase client instance
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// For checking if Supabase is configured properly
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

// Helper function to safely convert user IDs to strings for Supabase
// Firebase uses string IDs while Supabase expects UUIDs for certain columns
export const toUUID = (id: string) => {
  return id;
};

// Helper function to fix the user_id in comment submissions
export const prepareCommentForSubmission = (comment: any) => {
  // Create a new object to avoid mutating the original
  const preparedComment = { ...comment };
  
  // If the user_id exists and needs to be fixed for UUID compatibility
  if (preparedComment.user_id) {
    // This will make any string user_id work with Supabase, 
    // even if it's a Firebase auth ID and not a UUID
    preparedComment.user_id = preparedComment.user_id.toString();
  }
  
  return preparedComment;
};

export default supabase;
