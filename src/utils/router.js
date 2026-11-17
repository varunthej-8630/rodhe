/**
 * Pure URL <-> Route parser & builder for RODHE SPA navigation.
 * Keeps browser History API (pushState / popstate / hashchange) in complete sync
 * across Home, Collections, Product Detail, Story, Contact, Policies, Admin, and 404 routes.
 */

const POLICY_TAB_MAP = {
  'shipping-delivery': 'shipping',
  'returns-exchanges': 'returns',
  'privacy-policy': 'privacy',
  'terms-of-service': 'terms',
  shipping: 'shipping',
  returns: 'returns',
  exchange: 'returns',
  privacy: 'privacy',
  terms: 'terms',
  care: 'care'
};

const ROUTE_QUERY_PARAMS = ['page', 'product', 'craft', 'id', 'tab'];

function normalizeCraftParam(rawCraft) {
  if (!rawCraft) return null;
  const lowered = String(rawCraft).trim().toLowerCase();
  return lowered === 'indigo' ? 'tie-dye' : lowered;
}

function isSupabaseAuthHash(rawHash) {
  if (!rawHash) return false;
  const lowered = rawHash.toLowerCase();
  return (
    lowered.includes('access_token=') ||
    lowered.includes('refresh_token=') ||
    lowered.includes('type=recovery') ||
    lowered.includes('type=signup') ||
    lowered.includes('type=magiclink') ||
    lowered.includes('error_description=')
  );
}

/**
 * Parses a browser Location-like object ({ pathname, search, hash }) into
 * { page, productId, craft }.
 */
export function parseRouteFromLocation(loc) {
  if (!loc) {
    return { page: 'home', productId: null, craft: null };
  }

  try {
    const rawPath = loc.pathname || '/';
    const path = rawPath.length > 1 ? rawPath.replace(/\/+$/, '').toLowerCase() : '/';
    const rawHash = loc.hash || '';
    const hash = rawHash.toLowerCase();
    const searchParams = new URLSearchParams(loc.search || '');

    const productQuery = searchParams.get('product');
    const idQuery = searchParams.get('id');
    const pageQuery = searchParams.get('page');
    const craftQuery = searchParams.get('craft');
    const tabQuery = searchParams.get('tab');

    // 1. Explicit query parameter routes (?product=..., ?page=...)
    if (productQuery) {
      return { page: 'product', productId: productQuery, craft: null };
    }

    if (pageQuery) {
      const normalizedPage = pageQuery.toLowerCase();
      if (normalizedPage === 'product' && (idQuery || productQuery)) {
        return { page: 'product', productId: idQuery || productQuery, craft: null };
      }
      if (
        ['policies', 'shipping-delivery', 'returns-exchanges', 'privacy-policy', 'terms-of-service'].includes(normalizedPage)
      ) {
        const resolvedTab =
          normalizedPage === 'policies'
            ? POLICY_TAB_MAP[(tabQuery || 'shipping').toLowerCase()] || 'shipping'
            : POLICY_TAB_MAP[normalizedPage] || 'shipping';
        return { page: 'policies', productId: resolvedTab, craft: null };
      }
      if (normalizedPage === 'shop' || normalizedPage === 'collections') {
        return { page: 'shop', productId: null, craft: normalizeCraftParam(craftQuery) };
      }
      if (['story', 'contact', 'home', 'admin'].includes(normalizedPage)) {
        return { page: normalizedPage, productId: null, craft: null };
      }
      return { page: 'not-found', productId: null, craft: null };
    }

    // 2. Supabase GoTrue auth callback hashes — preserve home/admin without 404
    if (isSupabaseAuthHash(rawHash)) {
      return { page: path === '/admin' ? 'admin' : 'home', productId: null, craft: null };
    }

    // 3. Clean path & hash routes
    if (path === '/admin' || /^#\/?admin(\/|$|\?)/i.test(rawHash) || hash === '#admin') {
      return { page: 'admin', productId: null, craft: null };
    }

    // Product detail: /product/:id or #product/:id
    const pathProductMatch = rawPath.match(/^\/product\/([^/?#]+)/i);
    if (pathProductMatch && pathProductMatch[1]) {
      return { page: 'product', productId: decodeURIComponent(pathProductMatch[1]), craft: null };
    }
    const hashProductMatch = rawHash.match(/^#\/?product\/([^/?#]+)/i);
    if (hashProductMatch && hashProductMatch[1]) {
      return { page: 'product', productId: decodeURIComponent(hashProductMatch[1]), craft: null };
    }
    if (hash === '#product' || hash === '#/product' || path === '/product') {
      return { page: 'shop', productId: null, craft: null };
    }

    // Collections / Shop
    if (
      path === '/shop' ||
      path === '/collections' ||
      /^#\/?(shop|collections?)(\/|$|\?)/i.test(rawHash)
    ) {
      return { page: 'shop', productId: null, craft: normalizeCraftParam(craftQuery) };
    }

    // Story / Craft
    if (path === '/story' || path === '/craft' || /^#\/?(story|craft)(\/|$|\?)/i.test(rawHash)) {
      return { page: 'story', productId: null, craft: null };
    }

    // Contact / Concierge
    if (path === '/contact' || path === '/concierge' || /^#\/?(contact|concierge)(\/|$|\?)/i.test(rawHash)) {
      return { page: 'contact', productId: null, craft: null };
    }

    // Policies (/policies, /policies/:tab, #policies, #policies-:tab, #privacy, #terms, #shipping, #returns, #care)
    const pathPolicyMatch = rawPath.match(/^\/policies(?:\/([^/?#]+))?$/i);
    if (pathPolicyMatch) {
      const tabKey = (pathPolicyMatch[1] || 'shipping').toLowerCase();
      return { page: 'policies', productId: POLICY_TAB_MAP[tabKey] || 'shipping', craft: null };
    }
    if (
      hash.includes('policies') ||
      hash.includes('policy') ||
      hash.includes('privacy') ||
      hash.includes('terms') ||
      hash.includes('shipping') ||
      hash.includes('returns') ||
      hash.includes('exchange') ||
      hash.includes('care')
    ) {
      let resolvedTab = 'shipping';
      if (hash.includes('privacy')) resolvedTab = 'privacy';
      else if (hash.includes('terms')) resolvedTab = 'terms';
      else if (hash.includes('returns') || hash.includes('exchange')) resolvedTab = 'returns';
      else if (hash.includes('care')) resolvedTab = 'care';
      else if (hash.includes('shipping')) resolvedTab = 'shipping';
      return { page: 'policies', productId: resolvedTab, craft: null };
    }

    // Home: / or /index.html with empty, #, #/, or #home hash
    if (
      (path === '/' || path === '/index.html') &&
      (!hash || hash === '#' || hash === '#/' || hash === '#home' || hash === '#/home')
    ) {
      return { page: 'home', productId: null, craft: null };
    }

    return { page: 'not-found', productId: null, craft: null };
  } catch {
    return { page: 'home', productId: null, craft: null };
  }
}

/**
 * Builds the canonical URL (pathname + non-routing search + hash) for a given route.
 * Returns null for 'not-found' so the browser keeps the requested URL intact.
 */
export function buildUrlForRoute(page, productId = null, currentSearch = '') {
  if (page === 'not-found') return null;

  let searchSuffix = '';
  if (currentSearch) {
    try {
      const params = new URLSearchParams(currentSearch);
      ROUTE_QUERY_PARAMS.forEach((key) => params.delete(key));
      const remaining = params.toString();
      if (remaining) {
        searchSuffix = `?${remaining}`;
      }
    } catch {}
  }

  if (page === 'home') {
    return `/${searchSuffix}`;
  }
  if (page === 'admin') {
    return `/${searchSuffix}#admin`;
  }
  if (page === 'shop' || page === 'collections') {
    return `/${searchSuffix}#collections`;
  }
  if (page === 'product' && productId) {
    return `/${searchSuffix}#product/${encodeURIComponent(String(productId))}`;
  }
  if (page === 'story') {
    return `/${searchSuffix}#story`;
  }
  if (page === 'contact') {
    return `/${searchSuffix}#contact`;
  }
  if (page === 'policies') {
    const tab = productId ? String(productId).toLowerCase() : 'shipping';
    return `/${searchSuffix}#policies-${encodeURIComponent(tab)}`;
  }

  return `/${searchSuffix}`;
}

