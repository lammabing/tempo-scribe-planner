
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Your Supabase project URL and anonymous key
const supabaseUrl = 'https://ftjrlnumquysxkxcbjgv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0anJsbnVtcXV5c3hreGNiamd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTU0MzQ3OTksImV4cCI6MjAzMTAxMDc5OX0.IE_T9FRrr5xDDv-51ZflHO59sjhMWSbTgWo66Mgv5KA';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials missing. Please check your environment variables.');
}

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey
);
