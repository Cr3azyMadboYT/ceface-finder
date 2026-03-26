import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nwhkotffmywccjhwpdbm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53aGtvdGZmbXl3Y2NqaHdwZGJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1NDE2MDIsImV4cCI6MjA5MDExNzYwMn0.9yb2a_wS3x0N0KjIpq0HLGP1F5GsV2EfaI1taxsxRBQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
