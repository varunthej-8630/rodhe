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

const fetchWithTimeout = (input, init = {}) => {
  if (typeof AbortController === 'undefined' || typeof fetch === 'undefined') {
    return fetch(input, init);
  }
  const controller = new AbortController();
  const timeoutMs = String(input).includes('/auth/') ? 8000 : 10000;
  const externalSignal = init.signal;
  const onExternalAbort = () => controller.abort(externalSignal?.reason);
  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort(externalSignal.reason);
    } else {
      externalSignal.addEventListener('abort', onExternalAbort, { once: true });
    }
  }
  const timerId = setTimeout(() => controller.abort(new Error('Supabase fetch timeout')), timeoutMs);
  return fetch(input, { ...init, signal: controller.signal }).finally(() => {
    clearTimeout(timerId);
    if (externalSignal) {
      externalSignal.removeEventListener('abort', onExternalAbort);
    }
  });
};

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      global: { fetch: fetchWithTimeout }
    })
  : null;

if (isSupabaseConfigured) {
  console.log('✅ Supabase connected:', supabaseUrl);
} else {
  console.log('ℹ️ Supabase running in local fallback mode');
}

export default supabase;
