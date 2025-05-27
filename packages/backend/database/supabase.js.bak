const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://jvrkatolwkolahrtytlm.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2cmthdG9sd2tvbGFocnR5dGxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3Njk5MzMsImV4cCI6MjA2MzM0NTkzM30.DwdMav0DHzjzUMyqr4gtidlTUJZV7RLasPQnAAYafLM';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2cmthdG9sd2tvbGFocnR5dGxtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Nzc2OTkzMywiZXhwIjoyMDYzMzQ1OTMzfQ.G02T8LucCcAd7k79bxVRAml4AMkD46Clsj-spf-3C_c';

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Create Supabase client with anon key for public operations
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

module.exports = {
  supabase,
  supabaseAnon
};
