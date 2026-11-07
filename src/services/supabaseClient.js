import { createClient } from '@supabase/supabase-js';

const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : (typeof process !== 'undefined' && process.env ? process.env : {});

const supabaseUrl =
  env.VITE_SUPABASE_URL !== undefined
    ? env.VITE_SUPABASE_URL
    : (env.NEXT_PUBLIC_SUPABASE_URL || 'https://emtmzrjaygcrmzoatvfa.supabase.co');

const supabaseAnonKey =
  env.VITE_SUPABASE_ANON_KEY !== undefined
    ? env.VITE_SUPABASE_ANON_KEY
    : (env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_X2b_yYa8Oo7KJl23ZlWYGA_tgsn_Mng');

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-project-id') &&
  env.VITE_SUPABASE_OFFLINE !== 'true'
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

if (isSupabaseConfigured) {
  console.log('✅ Supabase connected:', supabaseUrl);
} else {
  console.log('ℹ️ Supabase running in local fallback mode');
}

export default supabase;
