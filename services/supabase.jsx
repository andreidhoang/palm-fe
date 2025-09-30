import { createClient } from '@supabase/supabase-js'

// Create a single supabase client for interacting with your database
// Handle missing credentials gracefully with valid placeholder values
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzUwMDAwMDAsImV4cCI6MTk5MDM1OTk5OX0.placeholder';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Helper to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
    return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && 
              process.env.NEXT_PUBLIC_SUPABASE_KEY &&
              !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder'));
};