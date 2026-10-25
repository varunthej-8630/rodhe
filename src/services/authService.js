import { supabase, isSupabaseConfigured } from './supabaseClient';

const AUTH_SESSION_KEY = 'rodhe_admin_session';
const AUTH_CREDENTIALS_KEY = 'rodhe_crm_admin_credentials';

// Default CRM Credentials requested by user:
// Username: rodhe
// Password: rodhe@admin
const DEFAULT_CREDENTIALS = {
  username: 'rodhe',
  email: 'rodhe@rodhe.in',
  password: 'rodhe@admin',
  role: 'super_admin',
  name: 'RODHE Administrator'
};

const getLocalCredentials = () => {
  try {
    const raw = localStorage.getItem(AUTH_CREDENTIALS_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_CREDENTIALS;
  } catch (e) {
    return DEFAULT_CREDENTIALS;
  }
};

const setLocalCredentials = (creds) => {
  try {
    localStorage.setItem(AUTH_CREDENTIALS_KEY, JSON.stringify(creds));
  } catch (e) {}
};

export const authService = {
  getCurrentSession() {
    try {
      const raw = localStorage.getItem(AUTH_SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  },

  async login(identifier, password) {
    const cleanId = (identifier || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    if (!cleanId || !cleanPass) {
      return { success: false, message: 'Please provide both username and password.' };
    }

    // 1. Try Supabase Database (admin_users table)
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('admin_users')
          .select('*')
          .or(`username.ilike.${cleanId},email.ilike.${cleanId}`)
          .eq('password_hash', cleanPass)
          .maybeSingle();

        if (!error && data) {
          const sessionUser = {
            id: data.id || 'admin-rodhe',
            username: data.username,
            email: data.email,
            role: data.role || 'super_admin',
            name: data.username.toUpperCase(),
            token: `rodhe_token_${Date.now()}`
          };
          localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(sessionUser));
          return { success: true, user: sessionUser };
        }
      } catch (err) {
        console.warn('Supabase admin_users query notice:', err);
      }
    }

    // 2. Local Synchronized Database Verification
    const currentCreds = getLocalCredentials();
    const isUsernameMatch = cleanId === (currentCreds.username || '').toLowerCase();
    const isEmailMatch = cleanId === (currentCreds.email || '').toLowerCase();
    const isPassMatch = cleanPass === currentCreds.password;

    // Also support default rodhe / rodhe@admin and legacy admin@rodhe.in
    const isDefaultFallback = 
      (cleanId === 'rodhe' && cleanPass === 'rodhe@admin') ||
      (cleanId === 'admin@rodhe.in' && (cleanPass === 'WovenWithTrust2026!' || cleanPass === 'rodhe@admin'));

    if ((isUsernameMatch || isEmailMatch) && isPassMatch) {
      const sessionUser = {
        id: 'admin-rodhe',
        username: currentCreds.username,
        email: currentCreds.email,
        role: currentCreds.role || 'super_admin',
        name: currentCreds.username.toUpperCase(),
        loggedInAt: new Date().toISOString()
      };
      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(sessionUser));
      return { success: true, user: sessionUser };
    } else if (isDefaultFallback) {
      const sessionUser = {
        id: 'admin-rodhe',
        username: 'rodhe',
        email: 'rodhe@rodhe.in',
        role: 'super_admin',
        name: 'RODHE',
        loggedInAt: new Date().toISOString()
      };
      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(sessionUser));
      return { success: true, user: sessionUser };
    }

    return {
      success: false,
      message: 'Invalid administrative credentials. Please verify your username and password.'
    };
  },

  async resetPassword(identifier, newPassword) {
    const cleanId = (identifier || '').trim().toLowerCase();
    const cleanPass = (newPassword || '').trim();

    if (!cleanId) {
      return { success: false, message: 'Please enter your username or registered email.' };
    }
    if (!cleanPass || cleanPass.length < 4) {
      return { success: false, message: 'New password must be at least 4 characters.' };
    }

    let isMatched = false;
    const localCreds = getLocalCredentials();

    // Verify identifier matches rodhe or local credentials
    if (
      cleanId === (localCreds.username || '').toLowerCase() ||
      cleanId === (localCreds.email || '').toLowerCase() ||
      cleanId === 'rodhe' ||
      cleanId === 'admin@rodhe.in'
    ) {
      isMatched = true;
    }

    // 1. If Supabase configured, attempt to update password in database
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('admin_users')
          .update({
            password_hash: cleanPass,
            updated_at: new Date().toISOString()
          })
          .or(`username.ilike.${cleanId},email.ilike.${cleanId}`);

        if (!error) {
          isMatched = true;
        }
      } catch (err) {
        console.warn('Supabase password reset notice:', err);
      }
    }

    if (!isMatched) {
      return {
        success: false,
        message: 'No administrative account found matching that username/email.'
      };
    }

    // 2. Update local synchronized credentials
    const updated = {
      ...localCreds,
      password: cleanPass,
      updatedAt: new Date().toISOString()
    };
    setLocalCredentials(updated);

    return {
      success: true,
      message: 'Password updated successfully! You can now log in with your new password.'
    };
  },

  async logout() {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {}
    }
    localStorage.removeItem(AUTH_SESSION_KEY);
    return true;
  },

  isAuthenticated() {
    return Boolean(this.getCurrentSession());
  }
};

export default authService;
