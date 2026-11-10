import { supabase, isSupabaseConfigured } from './supabaseClient.js';

const LEGACY_INSECURE_PATRON_KEY = 'rodhe_patron_session';
const GUEST_CHECKOUT_DRAFT_KEY = 'rodhe_guest_checkout_draft';

const PINCODE_PREFIX_CITY_MAP = {
  '110': { city: 'New Delhi', state: 'Delhi' },
  '122': { city: 'Gurugram', state: 'Haryana' },
  '160': { city: 'Chandigarh', state: 'Chandigarh' },
  '201': { city: 'Noida', state: 'Uttar Pradesh' },
  '226': { city: 'Lucknow', state: 'Uttar Pradesh' },
  '302': { city: 'Jaipur', state: 'Rajasthan' },
  '380': { city: 'Ahmedabad', state: 'Gujarat' },
  '395': { city: 'Surat', state: 'Gujarat' },
  '400': { city: 'Mumbai', state: 'Maharashtra' },
  '411': { city: 'Pune', state: 'Maharashtra' },
  '440': { city: 'Nagpur', state: 'Maharashtra' },
  '452': { city: 'Indore', state: 'Madhya Pradesh' },
  '462': { city: 'Bhopal', state: 'Madhya Pradesh' },
  '500': { city: 'Hyderabad', state: 'Telangana' },
  '520': { city: 'Vijayawada', state: 'Andhra Pradesh' },
  '530': { city: 'Visakhapatnam', state: 'Andhra Pradesh' },
  '560': { city: 'Bengaluru', state: 'Karnataka' },
  '570': { city: 'Mysuru', state: 'Karnataka' },
  '600': { city: 'Chennai', state: 'Tamil Nadu' },
  '641': { city: 'Coimbatore', state: 'Tamil Nadu' },
  '682': { city: 'Kochi', state: 'Kerala' },
  '695': { city: 'Thiruvananthapuram', state: 'Kerala' },
  '700': { city: 'Kolkata', state: 'West Bengal' },
  '751': { city: 'Bhubaneswar', state: 'Odisha' },
  '781': { city: 'Guwahati', state: 'Assam' },
  '800': { city: 'Patna', state: 'Bihar' },
  '834': { city: 'Ranchi', state: 'Jharkhand' }
};

export function isValidIndianPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  return /^[6-9][0-9]{9}$/.test(digits);
}

export function isValidIndianPincode(pincode) {
  const clean = String(pincode || '').trim();
  return /^[1-9][0-9]{5}$/.test(clean);
}

export function isValidEmail(email) {
  if (!email || !String(email).trim()) return true; // Optional in some flows
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
}

export function lookupIndianPincodeInfo(pincode) {
  const clean = String(pincode || '').replace(/\D/g, '');
  if (clean.length < 3) return null;
  const prefix3 = clean.slice(0, 3);
  return PINCODE_PREFIX_CITY_MAP[prefix3] || null;
}

export function formatPhoneDigits(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  return digits.slice(0, 10);
}

export function normalizeAddress(addr = {}) {
  return {
    id: addr.id || `addr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    label: (addr.label || '').trim() || 'Home',
    recipientName: (addr.recipientName ?? addr.recipient_name ?? '').trim(),
    phone: formatPhoneDigits(addr.phone || ''),
    addressLine1: (addr.addressLine1 ?? addr.address_line1 ?? addr.address ?? '').trim(),
    addressLine2: (addr.addressLine2 ?? addr.address_line2 ?? addr.street ?? '').trim(),
    landmark: (addr.landmark ?? '').trim(),
    city: (addr.city ?? '').trim(),
    state: (addr.state ?? '').trim(),
    pincode: String(addr.pincode ?? '').replace(/\D/g, '').slice(0, 6),
    isDefault: Boolean(addr.isDefault ?? addr.is_default ?? false),
    createdAt: addr.createdAt ?? addr.created_at ?? new Date().toISOString(),
    updatedAt: addr.updatedAt ?? addr.updated_at ?? new Date().toISOString()
  };
}

export function validateAddressPayload(addr) {
  const normalized = normalizeAddress(addr);
  const errors = {};
  if (!normalized.recipientName || normalized.recipientName.length < 2) {
    errors.recipientName = 'Please enter the recipient full name.';
  }
  if (!isValidIndianPhone(normalized.phone)) {
    errors.phone = 'Please enter a valid 10-digit Indian mobile number.';
  }
  if (!normalized.addressLine1 || normalized.addressLine1.length < 4) {
    errors.addressLine1 = 'Please enter house/flat number and building name.';
  }
  if (!isValidIndianPincode(normalized.pincode)) {
    errors.pincode = 'Please enter a valid 6-digit Indian PIN code.';
  }
  if (!normalized.city || normalized.city.length < 2) {
    errors.city = 'Please enter delivery city.';
  }
  if (!normalized.state || normalized.state.length < 2) {
    errors.state = 'Please enter delivery state.';
  }
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    normalized
  };
}

function isMissingRelationError(err) {
  if (!err) return false;
  const code = err.code || '';
  const msg = String(err.message || '');
  return code === 'PGRST205' || code === '42P01' || msg.includes('Could not find the table') || msg.includes('does not exist');
}

function isDuplicateDefaultViolation(addresses, targetId) {
  return addresses.map((a) => ({
    ...a,
    isDefault: a.id === targetId
  }));
}

/**
 * Customer identity, profile, address book, and guest session draft management.
 * Keeps customer accounts strictly isolated from admin CRM sessions and avoids storing
 * sensitive customer PII in unauthenticated shared localStorage.
 */
async function runAuthWithTimeout(promise, fallbackMsg, timeoutMs = 8000) {
  let timerId;
  const timeoutPromise = new Promise((_, reject) => {
    timerId = setTimeout(
      () => reject(new Error('Authentication service temporarily unavailable—please check your connection and try again.')),
      timeoutMs
    );
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } catch (err) {
    const msg = String(err?.message || '');
    if (/failed to fetch|fetch failed|networkerror|timeout|unavailable|abort/i.test(msg)) {
      throw new Error('Authentication service temporarily unavailable—please check your connection and try again.');
    }
    throw new Error(msg || fallbackMsg);
  } finally {
    clearTimeout(timerId);
  }
}

export const customerService = {
  /**
   * Removes legacy insecure PII blob from shared localStorage if left behind by earlier versions.
   */
  purgeLegacyInsecurePii() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(LEGACY_INSECURE_PATRON_KEY);
      }
    } catch {}
  },

  /**
   * Session-only draft for guest visitors (cleared when browser tab closes).
   */
  getGuestCheckoutDraft() {
    try {
      if (typeof sessionStorage !== 'undefined') {
        const raw = sessionStorage.getItem(GUEST_CHECKOUT_DRAFT_KEY);
        return raw ? JSON.parse(raw) : null;
      }
    } catch {}
    return null;
  },

  saveGuestCheckoutDraft(draft) {
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(GUEST_CHECKOUT_DRAFT_KEY, JSON.stringify(draft));
      }
    } catch {}
  },

  clearGuestCheckoutDraft() {
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem(GUEST_CHECKOUT_DRAFT_KEY);
      }
    } catch {}
  },

  /**
   * Resolves the currently verified Supabase Auth user for storefront patronage.
   * Never fabricates a logged-in customer from localStorage when unauthenticated.
   */
  async getAuthenticatedCustomer() {
    if (!isSupabaseConfigured || !supabase) {
      return null;
    }

    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session?.user) {
        return null;
      }

      const user = session.user;
      const meta = user.user_metadata || {};

      let profile = {
        id: user.id,
        email: user.email || '',
        name: meta.full_name || meta.name || (user.email ? user.email.split('@')[0] : 'Patron'),
        phone: formatPhoneDigits(meta.phone || ''),
        authenticatedAt: user.last_sign_in_at || user.created_at
      };

      let addresses = Array.isArray(meta.saved_addresses)
        ? meta.saved_addresses.map(normalizeAddress)
        : [];

      // Attempt relational load if customer_profiles / customer_addresses tables exist
      try {
        const { data: dbProfile, error: profErr } = await supabase
          .from('customer_profiles')
          .select('id, full_name, phone, email')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!profErr && dbProfile) {
          profile = {
            ...profile,
            profileRowId: dbProfile.id,
            name: dbProfile.full_name || profile.name,
            phone: formatPhoneDigits(dbProfile.phone || profile.phone),
            email: dbProfile.email || profile.email
          };

          const { data: dbAddrs, error: addrErr } = await supabase
            .from('customer_addresses')
            .select('*')
            .eq('profile_id', dbProfile.id)
            .order('is_default', { ascending: false })
            .order('created_at', { ascending: true });

          if (!addrErr && Array.isArray(dbAddrs) && dbAddrs.length > 0) {
            addresses = dbAddrs.map(normalizeAddress);
          }
        }
      } catch {}

      // Ensure at least one address is default if any exist
      if (addresses.length > 0 && !addresses.some((a) => a.isDefault)) {
        addresses[0].isDefault = true;
      }

      return {
        user: profile,
        addresses,
        wishlistIds: Array.isArray(meta.wishlist_ids) ? meta.wishlist_ids : null,
        cartItems: Array.isArray(meta.cart_items) ? meta.cart_items : null
      };
    } catch (err) {
      console.warn('Customer auth verification notice:', err);
      return null;
    }
  },

  async signIn(email, password) {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Customer sign-in service is currently unavailable.');
    }

    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!cleanEmail || !password) {
      throw new Error('Please enter both your email address and password.');
    }

    const { data, error } = await runAuthWithTimeout(
      supabase.auth.signInWithPassword({
        email: cleanEmail,
        password
      }),
      'Unable to sign in right now.'
    );

    if (error) {
      if (error.message?.toLowerCase().includes('email not confirmed')) {
        throw new Error('Please verify your email address using the confirmation link sent to your inbox before signing in.');
      }
      if (error.message?.toLowerCase().includes('invalid login credentials')) {
        throw new Error('Invalid email or password. Please verify your credentials.');
      }
      throw new Error(error.message || 'Unable to sign in right now.');
    }

    if (!data?.session?.user) {
      throw new Error('Sign-in did not establish an active session. Please try again.');
    }

    this.purgeLegacyInsecurePii();
    return await this.getAuthenticatedCustomer();
  },

  async signUp({ name, email, phone, password }) {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Account registration service is currently unavailable.');
    }

    const cleanName = String(name || '').trim();
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanPhone = formatPhoneDigits(phone || '');

    if (!cleanName || cleanName.length < 2) {
      throw new Error('Please enter your full name.');
    }
    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      throw new Error('Please enter a valid email address.');
    }
    if (!isValidIndianPhone(cleanPhone)) {
      throw new Error('Please enter a valid 10-digit Indian WhatsApp mobile number.');
    }
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    const { data, error } = await runAuthWithTimeout(
      supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: cleanName,
            phone: cleanPhone,
            saved_addresses: []
          }
        }
      }),
      'Unable to create your account right now.'
    );

    if (error) {
      throw new Error(error.message || 'Unable to create your account right now.');
    }

    // Check if email verification is required (no active session returned yet)
    if (data?.user && !data?.session) {
      return {
        requiresEmailConfirmation: true,
        email: cleanEmail
      };
    }

    // Attempt relational customer_profiles seed if tables exist
    if (data?.user?.id) {
      try {
        await supabase.from('customer_profiles').upsert(
          {
            user_id: data.user.id,
            email: cleanEmail,
            full_name: cleanName,
            phone: cleanPhone
          },
          { onConflict: 'email' }
        );
      } catch {}
    }

    this.purgeLegacyInsecurePii();
    const customer = await this.getAuthenticatedCustomer();
    return {
      requiresEmailConfirmation: false,
      customer
    };
  },

  async requestPasswordReset(email) {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Password recovery is unavailable while offline.');
    }
    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      throw new Error('Please enter a valid email address.');
    }
    const { error } = await runAuthWithTimeout(
      supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined
      }),
      'Unable to send password reset email.'
    );
    if (error) {
      throw new Error(error.message || 'Unable to send password reset email.');
    }
    return true;
  },

  async signOut() {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Customer sign-out notice:', err);
      }
    }
    this.purgeLegacyInsecurePii();
    this.clearGuestCheckoutDraft();
    return true;
  },

  async ensureDbProfileRow(user, name, phone) {
    try {
      const { data: existing, error: selErr } = await supabase
        .from('customer_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (selErr) {
        if (isMissingRelationError(selErr)) return null;
        return null;
      }
      if (existing?.id) return existing.id;

      const { data: inserted, error: insErr } = await supabase
        .from('customer_profiles')
        .insert([
          {
            user_id: user.id,
            email: user.email,
            full_name: name || user.email?.split('@')[0] || 'Patron',
            phone: phone || ''
          }
        ])
        .select('id')
        .maybeSingle();

      if (insErr) return null;
      return inserted?.id || null;
    } catch {
      return null;
    }
  },

  /**
   * Updates authenticated customer's profile details (name, phone) on Supabase.
   */
  async updateProfile({ name, phone }) {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Profile changes require an active account connection.');
    }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new Error('Please sign in to save profile updates.');
    }

    const cleanName = String(name || '').trim();
    const cleanPhone = formatPhoneDigits(phone || '');

    if (!cleanName || cleanName.length < 2) {
      throw new Error('Please enter a valid full name.');
    }
    if (cleanPhone && !isValidIndianPhone(cleanPhone)) {
      throw new Error('Please enter a valid 10-digit Indian mobile number.');
    }

    const { error: authErr } = await supabase.auth.updateUser({
      data: {
        full_name: cleanName,
        phone: cleanPhone
      }
    });

    if (authErr) {
      throw new Error(authErr.message || 'Could not update your profile. Please try again.');
    }

    // Best-effort relational table sync if migrated
    try {
      const profileId = await this.ensureDbProfileRow(session.user, cleanName, cleanPhone);
      if (profileId) {
        await supabase
          .from('customer_profiles')
          .update({
            full_name: cleanName,
            phone: cleanPhone,
            updated_at: new Date().toISOString()
          })
          .eq('id', profileId);
      }
    } catch {}

    return await this.getAuthenticatedCustomer();
  },

  /**
   * Saves a new or edited address for an authenticated customer.
   */
  async saveAddress(addressPayload, currentAddresses = []) {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Saving addresses requires an active connection.');
    }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new Error('Please sign in to save your delivery address to your account.');
    }

    const { isValid, errors, normalized } = validateAddressPayload(addressPayload);
    if (!isValid) {
      const firstError = Object.values(errors)[0];
      throw new Error(firstError || 'Please complete all required address fields.');
    }

    const existingIdx = currentAddresses.findIndex((a) => a.id === normalized.id);
    const shouldBeDefault = normalized.isDefault || currentAddresses.length === 0 || existingIdx === -1 && currentAddresses.length === 0;

    let nextAddresses;
    if (existingIdx >= 0) {
      nextAddresses = currentAddresses.map((a, idx) =>
        idx === existingIdx ? { ...normalized, isDefault: shouldBeDefault || a.isDefault, updatedAt: new Date().toISOString() } : a
      );
    } else {
      nextAddresses = [...currentAddresses, { ...normalized, isDefault: shouldBeDefault }];
    }

    if (shouldBeDefault) {
      nextAddresses = isDuplicateDefaultViolation(nextAddresses, normalized.id);
    } else if (!nextAddresses.some((a) => a.isDefault) && nextAddresses.length > 0) {
      nextAddresses[0].isDefault = true;
    }

    // Persist in Supabase Auth user metadata (strictly scoped by auth.uid() JWT)
    const { error: metaErr } = await supabase.auth.updateUser({
      data: {
        saved_addresses: nextAddresses
      }
    });

    if (metaErr) {
      throw new Error(metaErr.message || 'Unable to save delivery address. Your changes were kept—please retry.');
    }

    // Best-effort sync to relational customer_addresses if tables exist
    try {
      const profileId = await this.ensureDbProfileRow(
        session.user,
        session.user.user_metadata?.full_name || normalized.recipientName,
        session.user.user_metadata?.phone || normalized.phone
      );

      if (profileId) {
        if (shouldBeDefault) {
          await supabase
            .from('customer_addresses')
            .update({ is_default: false })
            .eq('profile_id', profileId);
        }

        const dbRow = {
          profile_id: profileId,
          recipient_name: normalized.recipientName,
          phone: normalized.phone,
          address_line1: normalized.addressLine1,
          address_line2: normalized.addressLine2,
          landmark: normalized.landmark,
          city: normalized.city,
          state: normalized.state,
          pincode: normalized.pincode,
          is_default: Boolean(nextAddresses.find((a) => a.id === normalized.id)?.isDefault)
        };

        const isUuid = /^[0-9a-f-]{36}$/i.test(normalized.id);
        if (existingIdx >= 0 && isUuid) {
          await supabase.from('customer_addresses').update(dbRow).eq('id', normalized.id);
        } else if (existingIdx === -1) {
          await supabase.from('customer_addresses').insert([dbRow]);
        }
      }
    } catch {}

    return nextAddresses;
  },

  async setDefaultAddress(addressId, currentAddresses = []) {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Cannot update default address while offline.');
    }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new Error('Please sign in to change your default address.');
    }

    const nextAddresses = isDuplicateDefaultViolation(currentAddresses, addressId);
    const { error: metaErr } = await supabase.auth.updateUser({
      data: { saved_addresses: nextAddresses }
    });
    if (metaErr) {
      throw new Error(metaErr.message || 'Failed to update default address.');
    }

    try {
      const profileId = await this.ensureDbProfileRow(session.user);
      if (profileId && /^[0-9a-f-]{36}$/i.test(addressId)) {
        await supabase.from('customer_addresses').update({ is_default: false }).eq('profile_id', profileId);
        await supabase.from('customer_addresses').update({ is_default: true }).eq('id', addressId);
      }
    } catch {}

    return nextAddresses;
  },

  async deleteAddress(addressId, currentAddresses = []) {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Cannot remove address while offline.');
    }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new Error('Please sign in to manage your saved addresses.');
    }

    const nextAddresses = currentAddresses.filter((a) => a.id !== addressId);
    if (nextAddresses.length > 0 && !nextAddresses.some((a) => a.isDefault)) {
      nextAddresses[0] = { ...nextAddresses[0], isDefault: true };
    }

    const { error: metaErr } = await supabase.auth.updateUser({
      data: { saved_addresses: nextAddresses }
    });
    if (metaErr) {
      throw new Error(metaErr.message || 'Unable to delete address.');
    }

    try {
      if (/^[0-9a-f-]{36}$/i.test(addressId)) {
        await supabase.from('customer_addresses').delete().eq('id', addressId);
      }
    } catch {}

    return nextAddresses;
  },

  /**
   * Synchronizes wishlist product IDs for authenticated user securely.
   */
  async syncCustomerWishlist(wishlistIds) {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      await supabase.auth.updateUser({
        data: { wishlist_ids: Array.isArray(wishlistIds) ? wishlistIds : [] }
      });
    } catch {}
  },

  /**
   * Synchronizes compact bag references for authenticated user securely.
   */
  async syncCustomerCart(cartItems) {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const compactCart = (cartItems || []).map((item) => ({
        id: item.product?.id || item.id,
        slug: item.product?.slug || '',
        sku: item.product?.sku || '',
        quantity: item.quantity
      }));
      await supabase.auth.updateUser({
        data: { cart_items: compactCart }
      });
    } catch {}
  }
};

export default customerService;

