console.log("supabase.js loaded");

const SUPABASE_URL = "https://jzxdkemcoyjepjtiryje.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6eGRrZW1jb3lqZXBqdGlyeWplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MTQyMjgsImV4cCI6MjA3NjE5MDIyOH0.Ihu7go09wfNIlGRkueQP9hb-hRIVDP4W4j1B2bR_eBg"; 

// initialize supabase client
const { createClient } = window.supabase;

// create and expose the global client
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.supabaseClient = supabaseClient;

console.log("Supabase initialized:", supabaseClient);
