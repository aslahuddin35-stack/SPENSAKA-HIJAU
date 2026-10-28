import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://phqkeaqsfmnlfpxwepfo.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBocWtlYXFzZm1ubGZweHdlcGZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMwNTc5NDcsImV4cCI6MjEwODYzMzk0N30.Xj47MZNkbgBH2MItGXHZDx76HtLft5kylyr1cUYXg2Q';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export const SUPABASE_CONFIG = {
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
};
