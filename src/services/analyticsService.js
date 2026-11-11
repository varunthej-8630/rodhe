/**
 * Consent-aware analytics module for RODHE.
 *
 * - Reads GA4 Measurement ID strictly from Vite environment (`VITE_GA_MEASUREMENT_ID`).
 * - Never injects gtag.js unless BOTH a valid `G-XXXXXXXXXX` ID is configured
 *   AND the visitor explicitly opted into optional analytics consent.
 * - Never reports a WhatsApp handover enquiry as a confirmed payment/purchase.
 */

const CONSENT_STORAGE_KEY = 'rodhe_cookie_consent';
const CONSENT_VERSION = 1;

const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};
const rawMeasurementId = String(env.VITE_GA_MEASUREMENT_ID || '').trim();
export const GA_MEASUREMENT_ID = /^G-[A-Z0-9]+$/i.test(rawMeasurementId) ? rawMeasurementId : '';
export const isAnalyticsConfigured = Boolean(GA_MEASUREMENT_ID);

let scriptLoaded = false;

export function getCookieConsent() {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.analytics !== 'boolean') return null;
    return {
      essential: true,
      analytics: Boolean(parsed.analytics),
      version: parsed.version || CONSENT_VERSION,
      updatedAt: parsed.updatedAt || null
    };
  } catch {
    return null;
  }
}

export function saveCookieConsent({ analytics = false }) {
  const payload = {
    essential: true,
    analytics: Boolean(analytics),
    version: CONSENT_VERSION,
    updatedAt: new Date().toISOString()
  };

  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(payload));
    }
  } catch {}

  if (typeof window !== 'undefined' && GA_MEASUREMENT_ID) {
    window[`ga-disable-${GA_MEASUREMENT_ID}`] = !payload.analytics;
    if (typeof window.gtag === 'function') {
      window.gtag('consent', 'update', {
        analytics_storage: payload.analytics ? 'granted' : 'denied',
        ad_storage: 'denied'
      });
    }
    if (payload.analytics) {
      ensureGtagLoaded();
    }
  }

  return payload;
}

export function ensureGtagLoaded() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;
  if (!GA_MEASUREMENT_ID) return false;

  const consent = getCookieConsent();
  if (!consent?.analytics) return false;

  window[`ga-disable-${GA_MEASUREMENT_ID}`] = false;

  if (!window.dataLayer) {
    window.dataLayer = [];
  }
  if (typeof window.gtag !== 'function') {
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };
    window.gtag('consent', 'default', {
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
    window.gtag('js', new Date());
    window.gtag('config', GA_MEASUREMENT_ID, {
      send_page_view: false,
      anonymize_ip: true
    });
  }

  if (!scriptLoaded && !document.getElementById('rodhe-ga4-script')) {
    const script = document.createElement('script');
    script.id = 'rodhe-ga4-script';
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_MEASUREMENT_ID)}`;
    document.head.appendChild(script);
    scriptLoaded = true;
  }

  return true;
}

export function trackEvent(eventName, params = {}) {
  if (typeof window === 'undefined') return false;
  if (!GA_MEASUREMENT_ID) return false;

  const consent = getCookieConsent();
  if (!consent?.analytics) return false;

  ensureGtagLoaded();
  if (typeof window.gtag !== 'function') return false;

  window.gtag('event', eventName, params);
  return true;
}

export function trackPageView(pageTitle, pageLocation) {
  return trackEvent('page_view', {
    page_title: pageTitle,
    page_location: pageLocation || (typeof window !== 'undefined' ? window.location.href : '')
  });
}

export function trackViewItem(product) {
  if (!product) return false;
  return trackEvent('view_item', {
    currency: 'INR',
    value: Number(product.price ?? product.sellingPrice ?? 0) || 0,
    items: [
      {
        item_id: product.sku || product.id,
        item_name: product.name,
        item_category: product.craft || 'Saree',
        price: Number(product.price ?? product.sellingPrice ?? 0) || 0
      }
    ]
  });
}

export function trackViewItemList(listName, products = []) {
  return trackEvent('view_item_list', {
    item_list_name: listName || 'Collection',
    items: (products || []).slice(0, 10).map((p, index) => ({
      item_id: p.sku || p.id,
      item_name: p.name,
      index
    }))
  });
}

export function trackSearch(searchTerm) {
  const clean = String(searchTerm || '').trim();
  if (!clean) return false;
  return trackEvent('search', { search_term: clean });
}

export function trackAddToCart(product, quantity = 1) {
  if (!product) return false;
  const price = Number(product.price ?? product.sellingPrice ?? 0) || 0;
  return trackEvent('add_to_cart', {
    currency: 'INR',
    value: price * quantity,
    items: [
      {
        item_id: product.sku || product.id,
        item_name: product.name,
        quantity,
        price
      }
    ]
  });
}

export function trackRemoveFromCart(product, quantity = 1) {
  if (!product) return false;
  const price = Number(product.price ?? product.sellingPrice ?? 0) || 0;
  return trackEvent('remove_from_cart', {
    currency: 'INR',
    value: price * quantity,
    items: [
      {
        item_id: product.sku || product.id,
        item_name: product.name,
        quantity,
        price
      }
    ]
  });
}

export function trackAddToWishlist(product) {
  if (!product) return false;
  return trackEvent('add_to_wishlist', {
    currency: 'INR',
    value: Number(product.price ?? product.sellingPrice ?? 0) || 0,
    items: [
      {
        item_id: product.sku || product.id,
        item_name: product.name
      }
    ]
  });
}

export function trackBeginCheckout(cart = [], total = 0) {
  return trackEvent('begin_checkout', {
    currency: 'INR',
    value: Number(total) || 0,
    items: (cart || []).map((item) => {
      const p = item.product || item;
      return {
        item_id: p.sku || p.id,
        item_name: p.name,
        quantity: item.quantity || 1,
        price: Number(p.price ?? p.sellingPrice ?? 0) || 0
      };
    })
  });
}

/**
 * Tracks selecting a UPI / payment method WITHOUT firing a purchase event.
 */
export function trackAddPaymentInfo(paymentMethod, cart = [], total = 0) {
  return trackEvent('add_payment_info', {
    currency: 'INR',
    value: Number(total) || 0,
    payment_type: paymentMethod || 'upi',
    items: (cart || []).map((item) => {
      const p = item.product || item;
      return {
        item_id: p.sku || p.id,
        item_name: p.name,
        quantity: item.quantity || 1
      };
    })
  });
}

/**
 * Tracks opening the WhatsApp enquiry message WITHOUT reporting it as a paid purchase.
 */
export function trackWhatsAppHandover(cart = [], total = 0) {
  return trackEvent('whatsapp_enquiry_handover', {
    currency: 'INR',
    estimated_value: Number(total) || 0,
    item_count: (cart || []).reduce((acc, item) => acc + (item.quantity || 1), 0),
    handover_channel: 'whatsapp'
  });
}
