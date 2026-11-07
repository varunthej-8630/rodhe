import { supabase, isSupabaseConfigured } from './supabaseClient';

const AUTH_SESSION_KEY = 'rodhe_admin_session';

export const authService = {
  /**
   * Retrieves the current active administrative session.
   * Prioritizes genuine Supabase Auth sessions.
   */
  async getCurrentSession() {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // Verify with database that the user is an authorized administrator
          const { data: isAdmin } = await supabase.rpc('is_admin');
          if (isAdmin) {
            return {
              id: session.user.id,
              email: session.user.email,
              role: 'super_admin',
              name: (session.user.user_metadata?.name || session.user.email.split('@')[0]).toUpperCase(),
              token: session.access_token
            };
          }
        }
      } catch (err) {
        console.warn('Supabase session inspection notice:', err);
      }
    }

    // Read stored verified session if available
    try {
      const raw = localStorage.getItem(AUTH_SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  /**
   * Authenticates administrator using genuine Supabase Auth.
   * Verifies database authorization via public.is_admin() RPC.
   */
  async login(identifier, password) {
    const cleanId = (identifier || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    if (!cleanId || !cleanPass) {
      return { success: false, message: 'Please provide both username/email and password.' };
    }

    const emailToUse = cleanId.includes('@') ? cleanId : `${cleanId}@rodhe.in`;

    // 1. Genuine Supabase GoTrue Authentication
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
          email: emailToUse,
          password: cleanPass
        });

        if (authErr) {
          return { success: false, message: authErr.message || 'Invalid credentials.' };
        }

        if (authData?.user) {
          // Check database authorization
          const { data: isAdmin, error: rpcErr } = await supabase.rpc('is_admin');
          
          if (rpcErr || !isAdmin) {
            await supabase.auth.signOut();
            return {
              success: false,
              message: 'Access denied: Your account does not have boutique administrator privileges.'
            };
          }

          const sessionUser = {
            id: authData.user.id,
            email: authData.user.email,
            role: 'super_admin',
            name: (authData.user.user_metadata?.name || cleanId).toUpperCase(),
            token: authData.session?.access_token
          };

          localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(sessionUser));
          return { success: true, user: sessionUser };
        }
      } catch (err) {
        console.warn('Supabase GoTrue auth error:', err);
        return { success: false, message: 'Authentication service unreachable.' };
      }
    }

    return {
      success: false,
      message: 'Supabase authentication service is not configured. Please check environment variables.'
    };
  },

  /**
   * Dispatches an official password recovery link via Supabase Auth.
   * Requires verified ownership of the registered administrator email.
   */
  async requestPasswordReset(email) {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, message: 'Please provide your registered administrative email.' };
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: `${window.location.origin}/#admin`
        });

        if (error) {
          return { success: false, message: error.message };
        }

        return {
          success: true,
          message: 'A secure password reset link has been dispatched to your registered email address.'
        };
      } catch (err) {
        return { success: false, message: 'Unable to dispatch recovery link at this time.' };
      }
    }

    return {
      success: false,
      message: 'Password recovery requires an active Supabase authentication configuration.'
    };
  },

  /**
   * Updates administrator password for an authenticated session.
   */
  async updatePassword(newPassword) {
    const cleanPass = (newPassword || '').trim();
    if (!cleanPass || cleanPass.length < 8) {
      return { success: false, message: 'Password must be at least 8 characters long.' };
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.auth.updateUser({ password: cleanPass });
        if (error) {
          return { success: false, message: error.message };
        }
        return { success: true, message: 'Password updated successfully in Supabase Auth.' };
      } catch (err) {
        return { success: false, message: 'Failed to update password.' };
      }
    }

    return { success: false, message: 'Supabase client not configured.' };
  },

  async logout() {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch {}
    }
    localStorage.removeItem(AUTH_SESSION_KEY);
    return true;
  },

  async isAuthenticated() {
    const session = await this.getCurrentSession();
    return Boolean(session);
  }
};

export default authService;
