
import { createClient } from '@supabase/supabase-js';

// Supabase configuration with the provided URL and anon key
export const SUPABASE_URL = 'https://xfvtqlacvgngyhnwcort.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmdnRxbGFjdmduZ3lobndjb3J0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxMzA0NjMsImV4cCI6MjA1OTcwNjQ2M30.F3tZkWoMNGyvPncqy2YKt69riySGYc9Xh4EAlCsPcqs';

// Create and export the Supabase client instance
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// For checking if Supabase is configured properly
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

// Helper function to safely convert IDs to UUIDs for Supabase
export const toUUID = (id: string) => {
  // Ensure the ID is a valid UUID format for Supabase operations
  try {
    return id.toString();
  } catch (error) {
    console.error('Error converting ID to UUID:', error);
    return id;
  }
};

// Helper function to fix the user_id in comment submissions
export const prepareCommentForSubmission = (comment: any) => {
  // Create a new object to avoid mutating the original
  const preparedComment = { ...comment };
  
  // If the user_id exists, ensure it's properly formatted for UUID compatibility
  if (preparedComment.user_id) {
    preparedComment.user_id = preparedComment.user_id.toString();
  }
  
  // Ensure report_id is properly formatted
  if (preparedComment.report_id) {
    preparedComment.report_id = preparedComment.report_id.toString();
  }
  
  return preparedComment;
};

export default supabase;
