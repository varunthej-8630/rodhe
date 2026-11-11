/**
 * Central SEO metadata helper for per-page titles, descriptions, canonical links,
 * robots directives, Open Graph tags, and Twitter/X card metadata.
 */

export const BASE_ORIGIN = 'https://www.rodhe.in';
export const DEFAULT_OG_IMAGE = `${BASE_ORIGIN}/assets/og-rodhe-share.jpg`;
export const DEFAULT_TITLE = 'RODHE — Woven with Trust | Handcrafted Luxury Sarees';
export const DEFAULT_DESCRIPTION =
  'Discover pure mulmul, handblock Bagru, natural indigo shibori, and sheer Chanderi sarees. Nature-inspired Indian textiles handcrafted by generational artisans.';

const CRAFT_META = {
  'tie-dye': {
    title: 'Natural Indigo & Shibori Tie-Dye Sarees | RODHE',
    description:
      'Explore hand-knotted Shibori tie-dye cotton sarees fermented in true natural indigo dye vats. Breathable drapes loomed in India.'
  },
  handblock: {
    title: 'Bagru Mud-Resist & Handblock Printed Sarees | RODHE',
    description:
      'Shop carved teakwood Bagru and Dabu mud-resist cotton sarees dyed with madder root, charcoal, and earth botanical pigments.'
  },
  chanderi: {
    title: 'Chanderi Sheer Silk & Cotton Zari Sarees | RODHE',
    description:
      'Discover translucent Chanderi cotton-silk weaves finished with delicate zari borders and botanical dyes by generational weavers.'
  },
  mulmul: {
    title: '100% Breathable Mulmul Cotton Sarees | RODHE',
    description:
      'Featherweight organic mulmul cotton sarees crafted for all-day comfort, featuring natural ivory and plant-dyed finishes.'
  }
};

const POLICY_META = {
  shipping: {
    title: 'Shipping & Delivery Policy | RODHE',
    description:
      'Dispatch schedules, pan-India shipping fee thresholds, and parcel tracking guidance for handcrafted RODHE sarees.'
  },
  returns: {
    title: 'Exchange & Return Guidelines | RODHE',
    description:
      'Exchange eligibility conditions, handcraft variation notes, and concierge assistance for RODHE saree enquiries.'
  },
  privacy: {
    title: 'Privacy Policy & Data Protection | RODHE',
    description:
      'How RODHE handles contact details, delivery addresses, local bag storage, WhatsApp enquiries, Supabase storage, and analytics consent.'
  },
  terms: {
    title: 'Terms & Conditions of Service | RODHE',
    description:
      'Terms governing handcrafted saree listings, pricing, WhatsApp order enquiries, availability confirmation, and intellectual property.'
  },
  care: {
    title: 'Botanical Dye Wash & Saree Care Guide | RODHE',
    description:
      'Step-by-step washing, shade drying, and storage instructions for natural indigo, madder, Bagru, and mulmul cotton sarees.'
  }
};

function upsertMeta(selector, attrName, attrVal, content) {
  if (typeof document === 'undefined' || !content) return;
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrVal);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertCanonical(url) {
  if (typeof document === 'undefined' || !url) return;
  let link = document.head.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', url);
}

export function getPageMeta({ currentPage, selectedCraft, policyTab }) {
  if (currentPage === 'admin') {
    return {
      title: 'Store CRM Portal | RODHE',
      description: 'Private store management portal for RODHE.',
      canonical: `${BASE_ORIGIN}/#admin`,
      robots: 'noindex, nofollow',
      ogImage: DEFAULT_OG_IMAGE
    };
  }

  if (currentPage === 'not-found') {
    return {
      title: 'Page Not Found (404) | RODHE',
      description: 'The requested RODHE saree or boutique page could not be found.',
      canonical: `${BASE_ORIGIN}/`,
      robots: 'noindex, nofollow',
      ogImage: DEFAULT_OG_IMAGE
    };
  }

  if (currentPage === 'shop' || currentPage === 'collections') {
    const craftSpecific = selectedCraft && selectedCraft !== 'all' ? CRAFT_META[selectedCraft] : null;
    if (craftSpecific) {
      return {
        title: craftSpecific.title,
        description: craftSpecific.description,
        canonical: `${BASE_ORIGIN}/?page=shop&craft=${encodeURIComponent(selectedCraft)}`,
        robots: 'index, follow',
        ogImage: DEFAULT_OG_IMAGE
      };
    }
    return {
      title: 'Handcrafted Cotton & Botanical Dye Saree Collection | RODHE',
      description:
        'Browse the complete RODHE saree library—natural indigo shibori, Bagru mud-resist block prints, Chanderi cotton-silk, and organic mulmul weaves.',
      canonical: `${BASE_ORIGIN}/?page=shop`,
      robots: 'index, follow',
      ogImage: DEFAULT_OG_IMAGE
    };
  }

  if (currentPage === 'story') {
    return {
      title: 'Craft Heritage & Story — Woven with Trust | RODHE',
      description:
        'Learn how rain-fed Indian cotton meets fermented indigo leaves, carved wooden blocks, and patient handloom weaving in every RODHE saree.',
      canonical: `${BASE_ORIGIN}/?page=story`,
      robots: 'index, follow',
      ogImage: DEFAULT_OG_IMAGE
    };
  }

  if (currentPage === 'contact') {
    return {
      title: 'Customer Care & Personal Saree Concierge | RODHE',
      description:
        'Reach RODHE stylists via email (rodhesaree@gmail.com) or WhatsApp (+91 94906 58858) for saree draping advice, enquiries, and order updates.',
      canonical: `${BASE_ORIGIN}/?page=contact`,
      robots: 'index, follow',
      ogImage: DEFAULT_OG_IMAGE
    };
  }

  if (currentPage === 'policies') {
    const key = policyTab === 'privacy-policy'
      ? 'privacy'
      : policyTab === 'terms-of-service'
      ? 'terms'
      : policyTab === 'shipping-delivery'
      ? 'shipping'
      : policyTab === 'returns-exchanges'
      ? 'returns'
      : policyTab || 'shipping';
    const meta = POLICY_META[key] || POLICY_META.shipping;
    const querySlug =
      key === 'privacy'
        ? 'privacy-policy'
        : key === 'terms'
        ? 'terms-of-service'
        : key === 'returns'
        ? 'returns-exchanges'
        : 'shipping-delivery';
    return {
      title: meta.title,
      description: meta.description,
      canonical: `${BASE_ORIGIN}/?page=${querySlug}`,
      robots: 'index, follow',
      ogImage: DEFAULT_OG_IMAGE
    };
  }

  return {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    canonical: `${BASE_ORIGIN}/`,
    robots: 'index, follow',
    ogImage: DEFAULT_OG_IMAGE
  };
}

export function applyRouteSeoMeta(params) {
  if (typeof document === 'undefined') return;
  const meta = getPageMeta(params);

  document.title = meta.title;
  upsertMeta('meta[name="title"]', 'name', 'title', meta.title);
  upsertMeta('meta[name="description"]', 'name', 'description', meta.description);
  upsertMeta('meta[name="robots"]', 'name', 'robots', meta.robots);
  upsertCanonical(meta.canonical);

  upsertMeta('meta[property="og:url"]', 'property', 'og:url', meta.canonical);
  upsertMeta('meta[property="og:title"]', 'property', 'og:title', meta.title);
  upsertMeta('meta[property="og:description"]', 'property', 'og:description', meta.description);
  upsertMeta('meta[property="og:image"]', 'property', 'og:image', meta.ogImage);

  upsertMeta('meta[name="twitter:url"]', 'name', 'twitter:url', meta.canonical);
  upsertMeta('meta[name="twitter:title"]', 'name', 'twitter:title', meta.title);
  upsertMeta('meta[name="twitter:description"]', 'name', 'twitter:description', meta.description);
  upsertMeta('meta[name="twitter:image"]', 'name', 'twitter:image', meta.ogImage);
}
