import { createClient } from '@supabase/supabase-js';

// Environment variables for Supabase connection
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Initialize Supabase client with anonymous key for client-side access
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Initialize Supabase admin client with service role key for server-side operations
// Only create if service key is available
export const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null; // Return null if service key is not available

// Create a Supabase client with a custom auth token
export const createSupabaseClient = (accessToken: string) => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
};

// Helper function to determine if we're in development mode
export const isDevelopment = () => process.env.NODE_ENV === 'development';

// Helper function to check if admin client is available
export const isAdminClientAvailable = () => !!supabaseAdmin;

// Helper function to log errors consistently
export const logSupabaseError = (context: string, error: any) => {
  console.error(`Supabase Error (${context}):`, error);
}; 