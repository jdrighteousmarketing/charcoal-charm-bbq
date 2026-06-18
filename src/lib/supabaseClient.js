import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ujzlllcioeywuyrdhqim.supabase.co';

const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqemxsbGNpb2V5d3V5cmRocWltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MjIzNDgsImV4cCI6MjA5NzI5ODM0OH0.QxrgDgJn2CqsNNz39HjtDT37zlr4ZVlwQgC0_G9C0H8';

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);