//console.log("supabase.js loaded");

const SUPABASE_URL = "https://jzxdkemcoyjepjtiryje.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6eGRrZW1jb3lqZXBqdGlyeWplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MTQyMjgsImV4cCI6MjA3NjE5MDIyOH0.Ihu7go09wfNIlGRkueQP9hb-hRIVDP4W4j1B2bR_eBg";

// get Supabase from the global window object loaded by CDN script
//const { createClient } = window.supabase;

if (window.supabase && window.supabase.createClient) {
  window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  console.log("✅ Supabase client initialized:", window.supabaseClient);
} else {
  console.error("❌ Supabase library not loaded. Check CDN script order!");
}