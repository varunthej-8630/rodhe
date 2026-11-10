import { supabase, isSupabaseConfigured } from './supabaseClient.js';
import { PRODUCTS as SEED_PRODUCTS } from '../data/products.js';
import { TESTIMONIALS as SEED_TESTIMONIALS } from '../data/storyData.js';

// Storage keys for persistent local storage engine
const STORAGE_KEYS = {
  PRODUCTS: 'rodhe_db_products',
  COLLECTIONS: 'rodhe_db_collections',
  PROMOTIONS: 'rodhe_db_promotions',
  HOMEPAGE: 'rodhe_db_homepage',
  TESTIMONIALS: 'rodhe_db_testimonials',
  SETTINGS: 'rodhe_db_settings',
  ENQUIRIES: 'rodhe_db_enquiries',
  SIGNUPS: 'rodhe_db_signups',
  ORDERS: 'rodhe_db_orders'
};

// Initial Seed Data for Store Settings
const DEFAULT_SETTINGS = {
  storeName: 'RODHE',
  tagline: 'Woven with Trust',
  whatsappNumber: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_STORE_WHATSAPP_NUMBER) || '919490658858',
  conciergeEmail: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_STORE_CONCIERGE_EMAIL) || 'rodhesaree@gmail.com',
  currencySymbol: '₹',
  currencyCode: 'INR',
  freeShippingThreshold: 2999,
  standardShippingFee: 199,
  giftWrapFee: 150,
  sareesSoldCount: 1240,
  customerRating: 4.9,
  announcementText: 'Complimentary Express Shipping in India on Orders Above ₹2,999'
};

// Initial Seed Data for Homepage Configuration
const DEFAULT_HOMEPAGE_CONFIG = {
  heroEyebrow: 'WOVEN WITH TRUST',
  heroHeadline: 'Born from Nature. Made to Be Worn.',
  heroSubtext: 'Discover gossamer sarees shaped by rain-fed cotton, botanical pigments, and the timeless touch of Indian generational artisans.',
  bestsellersTitle: 'Patron Bestsellers',
  bestsellersPromo: 'Complimentary Handcrafted Zari Blouse Fabric on select heirloom editions.',
  mostCovetedTitle: 'Most Coveted Masterpieces',
  mostCovetedSubtext: 'Rare artisanal weave runs and slow botanical indigo reserves.',
  newArrivalsTitle: 'Fresh from the Loom',
  isNatureChapterVisible: true,
  isColourChapterVisible: true,
  isCraftChapterVisible: true
};

// Initial Seed Collections
const DEFAULT_COLLECTIONS = [
  { id: 'col-all', slug: 'all', name: 'All Sarees', description: 'The complete library of handcrafted cotton, silk, and botanical sarees.', isPublished: true },
  { id: 'col-bestsellers', slug: 'bestsellers', name: 'Bestsellers', description: 'Most beloved editions draped by our global patrons.', isPublished: true },
  { id: 'col-new-arrivals', slug: 'new-arrivals', name: 'New Arrivals', description: 'Freshly loomed editions in unbleached organic cotton and live dyes.', isPublished: true },
  { id: 'col-most-coveted', slug: 'most-coveted', name: 'Most Coveted', description: 'Limited-edition master weaves, intricate butis, and rare indigo vats.', isPublished: true },
  { id: 'col-tie-dye', slug: 'tie-dye', name: 'Natural Shibori & Tie-Dye', description: 'Hand-knotted resist folds immersed in natural indigo.', isPublished: true },
  { id: 'col-handblock', slug: 'handblock', name: 'Bagru Mud-Resist Block Prints', description: 'Carved teakwood impressions in natural madder and charcoal.', isPublished: true },
  { id: 'col-chanderi', slug: 'chanderi', name: 'Chanderi Silk & Zari Weaves', description: 'Gossamer cotton-silk translucent drapes with pure zari borders.', isPublished: true },
  { id: 'col-mulmul', slug: 'mulmul', name: '100% Breathable Mulmuls', description: 'Ultra-soft featherweight everyday luxury cottons.', isPublished: true }
];

// Initial Seed Promotions
const DEFAULT_PROMOTIONS = [
  { id: 'promo-1', code: 'WOVEN10', label: '10% Handcrafted Welcome Discount', discountType: 'percentage', discountValue: 10, isActive: true },
  { id: 'promo-2', code: 'RODHE15', label: '15% Festive Saree Offer', discountType: 'percentage', discountValue: 15, isActive: true }
];

// Memory fallback for Node environments and SSR
const memoryStore = new Map();

// Local Storage Helper Utilities
const getLocalData = (key, fallback) => {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    }
  } catch (e) {}
  return memoryStore.has(key) ? memoryStore.get(key) : fallback;
};

const setLocalData = (key, val) => {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(val));
    }
  } catch (e) {}
  memoryStore.set(key, val);
};

// Helper: resolve guaranteed high-resolution saree image based on craft & color family
export const getCraftDefaultImage = (craftCategory, colorFamily) => {
  const craft = (craftCategory || '').toLowerCase();
  const color = (colorFamily || '').toLowerCase();

  if (craft.includes('tie') || craft.includes('shibori') || color.includes('indigo')) {
    return {
      primary: '/assets/products/saree_indigo_shibori.jpg',
      secondary: '/assets/products/saree_indigo_shibori_detail.jpg'
    };
  }
  if (craft.includes('handblock') || craft.includes('bagru') || craft.includes('dabu') || color.includes('earth')) {
    return {
      primary: '/assets/products/saree_earth_bagru.jpg',
      secondary: '/assets/products/saree_earth_bagru_detail.jpg'
    };
  }
  if (color.includes('rose') || color.includes('pink') || color.includes('madder')) {
    return {
      primary: '/assets/products/saree_soft_rose.jpg',
      secondary: '/assets/products/saree_madder_red.jpg'
    };
  }
  if (color.includes('olive') || color.includes('green')) {
    return {
      primary: '/assets/products/saree_forest_olive.jpg',
      secondary: '/assets/products/saree_earth_bagru.jpg'
    };
  }
  if (craft.includes('chanderi') || color.includes('gold') || color.includes('zari')) {
    return {
      primary: '/assets/products/saree_muted_gold.jpg',
      secondary: '/assets/products/saree_deep_indigo_zari.jpg'
    };
  }
  return {
    primary: '/assets/products/saree_ivory_mulmul.jpg',
    secondary: '/assets/products/saree_ivory_mulmul.jpg'
  };
};

// Master product normalizer: bridges camelCase & Supabase snake_case with 100% safety
export const normalizeProduct = (p) => {
  if (!p) return null;

  // Match against canonical seed products to recover authentic images or metadata if missing
  const seedMatch = SEED_PRODUCTS.find(
    s => (p.sku && s.sku === p.sku) ||
         (p.slug && s.slug === p.slug) ||
         (p.id && s.id === p.id) ||
         (p.name && s.name.toLowerCase() === p.name.toLowerCase())
  );

  const craftCat = p.craftCategory || p.craft_category || seedMatch?.craftCategory || 'mulmul';
  const colorFam = p.colorFamily || p.color_family || seedMatch?.colorFamily || 'ivory';
  const defaults = getCraftDefaultImage(craftCat, colorFam);

  // Price resolution: check all possible price fields with fallback to seed or ₹990 (strictly within ₹500 - ₹2,000)
  let resolvedSellingPrice = Number(
    p.price ?? p.sellingPrice ?? p.selling_price ?? seedMatch?.price ?? 990
  );
  if (isNaN(resolvedSellingPrice) || resolvedSellingPrice <= 0) {
    resolvedSellingPrice = seedMatch?.price || 990;
  }

  const rawOrig = p.originalPrice ?? p.original_price ?? seedMatch?.originalPrice ?? null;
  const resolvedOriginalPrice = rawOrig && Number(rawOrig) > resolvedSellingPrice ? Number(rawOrig) : null;

  // Images resolution: check primaryImage, primary_image, product_images table, seedMatch, or craft defaults
  let primaryImg = p.primaryImage || p.primary_image;
  if (!primaryImg && Array.isArray(p.product_images) && p.product_images.length > 0) {
    const primaryEntry = p.product_images.find(img => img.is_primary) || p.product_images[0];
    primaryImg = primaryEntry?.image_url || primaryEntry?.url;
  }
  if (!primaryImg && seedMatch?.primaryImage) {
    primaryImg = seedMatch.primaryImage;
  }
  if (!primaryImg) {
    primaryImg = defaults.primary;
  }

  let secondaryImg = p.secondaryImage || p.secondary_image;
  if (!secondaryImg && Array.isArray(p.product_images) && p.product_images.length > 1) {
    const secEntry = p.product_images.find(img => img.is_secondary) || p.product_images[1];
    secondaryImg = secEntry?.image_url || secEntry?.url;
  }
  if (!secondaryImg && seedMatch?.secondaryImage) {
    secondaryImg = seedMatch.secondaryImage;
  }
  if (!secondaryImg) {
    secondaryImg = defaults.secondary;
  }

  let gallery = Array.isArray(p.gallery) && p.gallery.length > 0
    ? p.gallery
    : Array.isArray(p.product_images) && p.product_images.length > 0
    ? p.product_images.map(img => img.image_url || img.url).filter(Boolean)
    : seedMatch?.gallery || [
        primaryImg,
        secondaryImg,
        '/assets/Handcrafted Indigo Block Printing.png',
        '/assets/Carved Wooden Block Printing Stamp Collection.png'
      ];

  const assignedId = String(p.id || p.slug || seedMatch?.id || `rodhe-${p.sku || Date.now()}`);
  const assignedSlug = String(p.slug || seedMatch?.slug || p.id || 'saree');

  return {
    id: assignedId,
    slug: assignedSlug,
    name: p.name || seedMatch?.name || 'Handcrafted Cotton Saree',
    sku: p.sku || seedMatch?.sku || `RDH-${String(Math.floor(Math.random() * 900) + 100)}`,
    tagline: p.tagline || seedMatch?.tagline || p.description?.slice(0, 80) || 'Pure handloom cotton saree',
    description: p.description || seedMatch?.description || 'Authentic pure cotton handloom saree handcrafted with botanical dyes.',
    craftStory: p.craftStory || p.craft_story || seedMatch?.craftStory || 'Handcrafted by skilled generational artisans using authentic handloom weaving.',
    craft: p.craft || seedMatch?.craft || 'Handloom Cotton',
    craftCategory: craftCat,
    craft_category: craftCat,
    fabric: p.fabric || seedMatch?.fabric || '100% Breathable Mulmul Cotton',
    fabricType: p.fabricType || p.fabric_type || seedMatch?.fabricType || 'mulmul',
    fabric_type: p.fabricType || p.fabric_type || seedMatch?.fabricType || 'mulmul',
    color: p.color || seedMatch?.color || 'Natural',
    colorFamily: colorFam,
    color_family: colorFam,
    colorHex: p.colorHex || p.color_hex || seedMatch?.colorHex || '#4B3024',
    color_hex: p.colorHex || p.color_hex || seedMatch?.colorHex || '#4B3024',
    price: resolvedSellingPrice,
    sellingPrice: resolvedSellingPrice,
    selling_price: resolvedSellingPrice,
    originalPrice: resolvedOriginalPrice,
    original_price: resolvedOriginalPrice,
    dimensions: p.dimensions || seedMatch?.dimensions || 'Length: 6.5 meters (including 80 cm blouse piece) • Width: 45 inches',
    blousePiece: p.blousePiece || p.blouse_piece || seedMatch?.blousePiece || 'Included — Matching unstitched pure cotton fabric',
    blouse_piece: p.blousePiece || p.blouse_piece || seedMatch?.blousePiece || 'Included — Matching unstitched pure cotton fabric',
    washCare: p.washCare || p.wash_care || seedMatch?.washCare || 'Gentle hand wash in cold water using mild eco-friendly liquid detergent.',
    wash_care: p.washCare || p.wash_care || seedMatch?.washCare || 'Gentle hand wash in cold water using mild eco-friendly liquid detergent.',
    badge: p.badge || null,
    stockCount: Number(p.stockCount ?? p.stock_count ?? seedMatch?.stockCount ?? 12),
    stock_count: Number(p.stockCount ?? p.stock_count ?? seedMatch?.stockCount ?? 12),
    inStock: Boolean(p.inStock ?? p.in_stock ?? true),
    in_stock: Boolean(p.inStock ?? p.in_stock ?? true),
    status: p.status || 'published',
    isBestseller: Boolean(p.isBestseller ?? p.is_bestseller ?? seedMatch?.isBestseller),
    is_bestseller: Boolean(p.isBestseller ?? p.is_bestseller ?? seedMatch?.isBestseller),
    isMostCoveted: Boolean(p.isMostCoveted ?? p.is_most_coveted ?? seedMatch?.isMostCoveted),
    is_most_coveted: Boolean(p.isMostCoveted ?? p.is_most_coveted ?? seedMatch?.isMostCoveted),
    isNewArrival: Boolean(p.isNewArrival ?? p.is_new_arrival ?? p.isNew ?? seedMatch?.isNew),
    is_new_arrival: Boolean(p.isNewArrival ?? p.is_new_arrival ?? p.isNew ?? seedMatch?.isNew),
    isFeatured: Boolean(p.isFeatured ?? p.is_featured ?? p.featured ?? seedMatch?.featured ?? true),
    rating: Number(p.rating || seedMatch?.rating || 4.8),
    reviewCount: Number(p.reviewCount || p.review_count || seedMatch?.reviewCount || 18),
    primaryImage: primaryImg,
    primary_image: primaryImg,
    secondaryImage: secondaryImg,
    secondary_image: secondaryImg,
    gallery: gallery,
    createdAt: p.createdAt || p.created_at || new Date().toISOString()
  };
};

// Self-initializing local database
const initLocalStore = () => {
  const existing = getLocalData(STORAGE_KEYS.PRODUCTS, null);
  const needsReseed = !existing || 
    !Array.isArray(existing) || 
    existing.length < SEED_PRODUCTS.length ||
    !existing[0]?.price ||
    !existing[0]?.primaryImage;

  if (needsReseed) {
    const formatted = SEED_PRODUCTS.map((p, idx) => normalizeProduct({
      ...p,
      sku: p.sku || `RDH-${String(idx + 1).padStart(3, '0')}`,
      slug: p.slug || p.id,
      status: 'published',
      isMostCoveted: idx % 4 === 0,
      isNewArrival: Boolean(p.isNew),
      isBestseller: Boolean(p.isBestseller),
      displayOrder: idx,
      createdAt: new Date(Date.now() - (idx * 86400000)).toISOString()
    }));
    setLocalData(STORAGE_KEYS.PRODUCTS, formatted);
  }
  if (!localStorage.getItem(STORAGE_KEYS.COLLECTIONS)) {
    setLocalData(STORAGE_KEYS.COLLECTIONS, DEFAULT_COLLECTIONS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.PROMOTIONS)) {
    setLocalData(STORAGE_KEYS.PROMOTIONS, DEFAULT_PROMOTIONS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.HOMEPAGE)) {
    setLocalData(STORAGE_KEYS.HOMEPAGE, DEFAULT_HOMEPAGE_CONFIG);
  }
  if (!localStorage.getItem(STORAGE_KEYS.TESTIMONIALS)) {
    setLocalData(STORAGE_KEYS.TESTIMONIALS, SEED_TESTIMONIALS);
  }
  const currentSettings = getLocalData(STORAGE_KEYS.SETTINGS, null);
  if (!currentSettings || currentSettings.whatsappNumber !== '919490658858') {
    setLocalData(STORAGE_KEYS.SETTINGS, { ...DEFAULT_SETTINGS, ...currentSettings, whatsappNumber: '919490658858' });
  }
  if (!localStorage.getItem(STORAGE_KEYS.ENQUIRIES)) {
    setLocalData(STORAGE_KEYS.ENQUIRIES, []);
  }
  if (!localStorage.getItem(STORAGE_KEYS.SIGNUPS)) {
    setLocalData(STORAGE_KEYS.SIGNUPS, []);
  }
  if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
    setLocalData(STORAGE_KEYS.ORDERS, []);
  }
};

// Initialize immediately on load
if (typeof window !== 'undefined') {
  initLocalStore();
}

const withSupabaseTimeout = (promise, ms = 2500, label = 'Supabase request') => {
  let timerId;
  const timeoutPromise = new Promise((_, reject) => {
    timerId = setTimeout(() => reject(new Error(`${label} timeout`)), ms);
  });
  return Promise.race([Promise.resolve(promise), timeoutPromise]).finally(() => {
    clearTimeout(timerId);
  });
};

export const storeService = {
  // --------------------------------------------------------------------------
  // PRODUCTS
  // --------------------------------------------------------------------------
  async getProducts(filters = {}) {
    // 1. Get the local products baseline (authoritative for CRM additions & modifications)
    const localRaw = getLocalData(STORAGE_KEYS.PRODUCTS, SEED_PRODUCTS);
    let items = (Array.isArray(localRaw) && localRaw.length > 0)
      ? localRaw.map(normalizeProduct).filter(Boolean)
      : SEED_PRODUCTS.map(normalizeProduct);

    // 2. Try Supabase with a 2.5-second timeout to avoid page hang and merge with local items
    if (isSupabaseConfigured && supabase) {
      try {
        const queryPromise = (async () => {
          let query = supabase.from('products').select('*, product_images(*)');
          if (filters.status) query = query.eq('status', filters.status);
          if (filters.isBestseller) query = query.eq('is_bestseller', true);
          if (filters.isMostCoveted) query = query.eq('is_most_coveted', true);
          if (filters.isNewArrival) query = query.eq('is_new_arrival', true);
          return await query;
        })();

        const { data, error } = await withSupabaseTimeout(queryPromise, 2500, 'Supabase products');
        if (!error && Array.isArray(data) && data.length > 0) {
          const remoteNormalized = data.map(normalizeProduct).filter(Boolean);

          // Intelligent merge: local modifications (CRM edits) override, new remote products added
          const mergedMap = new Map();

          // Load remote first
          remoteNormalized.forEach(p => {
            mergedMap.set(p.slug || p.sku || p.id, p);
          });

          // Overlay local items (preserves user edits made in CRM)
          items.forEach(localP => {
            const key = localP.slug || localP.sku || localP.id;
            mergedMap.set(key, { ...mergedMap.get(key), ...localP });
          });

          items = Array.from(mergedMap.values());
        }
      } catch (e) {
        console.warn('Supabase product query notice:', e);
      }
    }

    // Apply in-memory client filters
    if (filters.status) {
      items = items.filter(p => p.status === filters.status);
    }
    if (filters.isBestseller) {
      items = items.filter(p => p.isBestseller);
    }
    if (filters.isMostCoveted) {
      items = items.filter(p => p.isMostCoveted);
    }
    if (filters.isNewArrival) {
      items = items.filter(p => p.isNewArrival);
    }
    if (filters.craftCategory && filters.craftCategory !== 'all') {
      items = items.filter(p => p.craftCategory === filters.craftCategory);
    }
    if (filters.colorFamily && filters.colorFamily !== 'all') {
      items = items.filter(p => p.colorFamily === filters.colorFamily);
    }
    if (filters.priceMax) {
      items = items.filter(p => p.price <= filters.priceMax);
    }
    if (filters.priceRange) {
      if (filters.priceRange === 'under-800' || filters.priceRange === 'under800') {
        items = items.filter(p => p.price <= 800);
      } else if (filters.priceRange === '800-1200') {
        items = items.filter(p => p.price > 800 && p.price <= 1200);
      } else if (filters.priceRange === '1200-1600') {
        items = items.filter(p => p.price > 1200 && p.price <= 1600);
      } else if (filters.priceRange === '1600-2000') {
        items = items.filter(p => p.price > 1600 && p.price <= 2000);
      } else if (filters.priceRange === 'under-2000' || filters.priceRange === 'under2k') {
        items = items.filter(p => p.price <= 2000);
      } else if (filters.priceRange === '2000-4000') {
        items = items.filter(p => p.price >= 2000 && p.price < 4000);
      } else if (filters.priceRange === '4000-6000') {
        items = items.filter(p => p.price >= 4000 && p.price <= 6000);
      }
    }

    return items;
  },

  async getProductBySlugOrId(identifier) {
    const products = await this.getProducts();
    const match = products.find(p => p.id === identifier || p.slug === identifier || p.sku === identifier) || null;
    return match ? normalizeProduct(match) : null;
  },

  async saveProduct(product) {
    const normalized = normalizeProduct(product);
    const products = getLocalData(STORAGE_KEYS.PRODUCTS, []).map(normalizeProduct);
    const existingIndex = products.findIndex(p => p.id === normalized.id || p.slug === normalized.slug || (p.sku && p.sku === normalized.sku));
    let updated;

    if (existingIndex >= 0) {
      updated = [...products];
      updated[existingIndex] = { ...updated[existingIndex], ...normalized, updatedAt: new Date().toISOString() };
    } else {
      updated = [normalized, ...products];
    }

    setLocalData(STORAGE_KEYS.PRODUCTS, updated);

    // Sync to Supabase if configured with clean snake_case payload
    if (isSupabaseConfigured && supabase) {
      try {
        const dbPayload = {
          slug: normalized.slug,
          sku: normalized.sku,
          name: normalized.name,
          tagline: normalized.tagline,
          description: normalized.description,
          craft_story: normalized.craftStory,
          craft: normalized.craft,
          craft_category: normalized.craftCategory,
          fabric: normalized.fabric,
          fabric_type: normalized.fabricType,
          color: normalized.color,
          color_family: normalized.colorFamily,
          color_hex: normalized.colorHex,
          selling_price: normalized.price,
          original_price: normalized.originalPrice,
          dimensions: normalized.dimensions,
          blouse_piece: normalized.blousePiece,
          wash_care: normalized.washCare,
          stock_count: normalized.stockCount,
          in_stock: normalized.inStock,
          status: normalized.status || 'published',
          is_bestseller: normalized.isBestseller,
          is_most_coveted: normalized.isMostCoveted,
          is_new_arrival: normalized.isNewArrival
        };
        const { error: upsertErr } = await supabase.from('products').upsert(dbPayload, { onConflict: 'slug' });
        if (upsertErr) {
          console.warn('Supabase product upsert notice (saved locally):', upsertErr.message);
        }
      } catch (e) {
        console.warn('Supabase upsert notice:', e);
      }
    }

    return normalized;
  },

  async deleteProduct(productId) {
    const products = getLocalData(STORAGE_KEYS.PRODUCTS, []).map(normalizeProduct);
    const filtered = products.filter(p => p.id !== productId && p.slug !== productId);
    setLocalData(STORAGE_KEYS.PRODUCTS, filtered);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('products').delete().or(`id.eq.${productId},slug.eq.${productId}`);
      } catch (e) {}
    }
    return true;
  },

  // --------------------------------------------------------------------------
  // MEDIA / IMAGE UPLOADS
  // --------------------------------------------------------------------------
  async uploadImage(file, folder = 'sarees') {
    if (!file) {
      throw new Error('No image file selected.');
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type?.toLowerCase())) {
      throw new Error(`Unsupported image format (${file.type || 'unknown'}). Please upload JPG, PNG, or WebP.`);
    }

    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      throw new Error(`Image size (${sizeMB}MB) exceeds the 10MB limit. Please upload a smaller image.`);
    }

    // 1. Supabase Storage upload when configured
    if (isSupabaseConfigured && supabase) {
      try {
        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
        const filePath = `${folder}/${cleanName}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from('products')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (!error && data) {
          const { data: urlData } = supabase.storage
            .from('products')
            .getPublicUrl(filePath);

          if (urlData?.publicUrl) {
            return {
              success: true,
              url: urlData.publicUrl,
              fileName: file.name,
              storageType: 'supabase',
              size: file.size
            };
          }
        }
        console.warn('Supabase storage upload error, falling back to persistent client storage:', error);
      } catch (err) {
        console.warn('Supabase upload exception:', err);
      }
    }

    // 2. High-Resolution Optimized Persistent Client-Side Storage
    // Converts image to high-quality compressed Base64 Data URL (up to 1600px width/height)
    // Persists permanently across browser sessions, reloads, and local storage.
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          const maxDim = 1600;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          let dataUrl;
          try {
            dataUrl = canvas.toDataURL('image/webp', 0.88);
          } catch (err) {
            dataUrl = canvas.toDataURL('image/jpeg', 0.88);
          }

          resolve({
            success: true,
            url: dataUrl,
            fileName: file.name,
            storageType: 'persistent-data-url',
            size: file.size
          });
        };
        img.onerror = () => reject(new Error('Failed to decode image data. Please choose another image.'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('Failed to read image file from local disk.'));
      reader.readAsDataURL(file);
    });
  },

  // --------------------------------------------------------------------------
  // BULK IMPORT
  // --------------------------------------------------------------------------
  async bulkImportProducts(rows) {
    const existing = getLocalData(STORAGE_KEYS.PRODUCTS, []);
    const processed = [];
    const errors = [];

    rows.forEach((row, idx) => {
      if (!row.name || !row.price) {
        errors.push({ row: idx + 1, message: 'Missing product name or price' });
        return;
      }

      const originalPrice = parseFloat(row.originalPrice || row.price);
      const sellingPrice = parseFloat(row.sellingPrice || row.price);

      if (sellingPrice > originalPrice) {
        errors.push({ row: idx + 1, message: `Selling price (₹${sellingPrice}) cannot exceed original price (₹${originalPrice})` });
        return;
      }

      const slug = (row.slug || row.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const sku = row.sku || `RODHE-IMP-${String(idx + 1).padStart(3, '0')}`;

      const newSaree = {
        id: `rodhe-${slug}`,
        name: row.name,
        slug,
        sku,
        tagline: row.tagline || 'Handcrafted luxury saree',
        description: row.description || row.tagline || 'Woven with Trust by generational artisans.',
        craft: row.craft || 'Handcrafted Weave',
        craftCategory: row.craftCategory || 'mulmul',
        fabric: row.fabric || 'Pure Handloom Cotton',
        fabricType: row.fabricType || 'mulmul',
        color: row.color || 'Natural Ivory',
        colorFamily: row.colorFamily || 'ivory',
        colorHex: row.colorHex || '#EADAB5',
        originalPrice,
        price: sellingPrice,
        primaryImage: row.primaryImage || '/assets/products/saree_ivory_mulmul.jpg',
        secondaryImage: row.secondaryImage || '/assets/products/saree_ivory_mulmul.jpg',
        gallery: [row.primaryImage || '/assets/products/saree_ivory_mulmul.jpg'],
        stockCount: parseInt(row.stockCount || '5', 10),
        inStock: true,
        isBestseller: Boolean(row.isBestseller),
        isMostCoveted: Boolean(row.isMostCoveted),
        isNewArrival: Boolean(row.isNewArrival || true),
        status: row.status || 'published',
        createdAt: new Date().toISOString()
      };

      processed.push(newSaree);
    });

    const combined = [...processed, ...existing];
    setLocalData(STORAGE_KEYS.PRODUCTS, combined);

    return {
      success: true,
      importedCount: processed.length,
      errors
    };
  },

  // --------------------------------------------------------------------------
  // COLLECTIONS
  // --------------------------------------------------------------------------
  async getCollections() {
    const local = getLocalData(STORAGE_KEYS.COLLECTIONS, DEFAULT_COLLECTIONS);
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await withSupabaseTimeout(
          supabase.from('collections').select('*').order('display_order', { ascending: true }),
          2500,
          'Supabase collections'
        );
        if (!error && Array.isArray(data) && data.length > 0) {
          return data.map(c => ({
            id: c.id,
            slug: c.slug,
            name: c.name,
            description: c.description || '',
            bannerImage: c.banner_image || '',
            displayOrder: c.display_order ?? 0,
            isPublished: c.is_published ?? true
          }));
        }
      } catch (e) {
        console.warn('Supabase getCollections notice:', e);
      }
    }
    return local;
  },

  async saveCollection(collection) {
    const cols = getLocalData(STORAGE_KEYS.COLLECTIONS, DEFAULT_COLLECTIONS);
    const colId = collection.id || `col-${Date.now()}`;
    const normalized = {
      ...collection,
      id: colId,
      displayOrder: Number(collection.displayOrder ?? collection.display_order ?? 0),
      isPublished: Boolean(collection.isPublished ?? collection.is_published ?? true)
    };
    const idx = cols.findIndex(c => c.id === colId || c.slug === collection.slug);
    let updated;
    if (idx >= 0) {
      updated = [...cols];
      updated[idx] = normalized;
    } else {
      updated = [...cols, normalized];
    }
    setLocalData(STORAGE_KEYS.COLLECTIONS, updated);

    if (isSupabaseConfigured && supabase) {
      try {
        const dbPayload = {
          slug: normalized.slug,
          name: normalized.name,
          description: normalized.description || '',
          banner_image: normalized.bannerImage || normalized.banner_image || '',
          display_order: normalized.displayOrder,
          is_published: normalized.isPublished,
          updated_at: new Date().toISOString()
        };
        await supabase.from('collections').upsert(dbPayload, { onConflict: 'slug' });
      } catch (e) {
        console.warn('Supabase saveCollection notice:', e);
      }
    }
    return normalized;
  },

  async deleteCollection(idOrSlug) {
    const cols = getLocalData(STORAGE_KEYS.COLLECTIONS, DEFAULT_COLLECTIONS);
    const filtered = cols.filter(c => c.id !== idOrSlug && c.slug !== idOrSlug);
    setLocalData(STORAGE_KEYS.COLLECTIONS, filtered);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('collections').delete().or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`);
      } catch (e) {
        console.warn('Supabase deleteCollection notice:', e);
      }
    }
    return true;
  },

  // --------------------------------------------------------------------------
  // PROMOTIONS
  // --------------------------------------------------------------------------
  async getPromotions() {
    const local = getLocalData(STORAGE_KEYS.PROMOTIONS, DEFAULT_PROMOTIONS);
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await withSupabaseTimeout(
          supabase.from('promotions').select('*').order('created_at', { ascending: false }),
          2500,
          'Supabase promotions'
        );
        if (!error && Array.isArray(data) && data.length > 0) {
          return data.map(p => ({
            id: p.id,
            code: p.code,
            label: p.label,
            discountType: p.discount_type || 'percentage',
            discountValue: Number(p.discount_value) || 10,
            minOrderAmount: Number(p.min_order_amount || 0),
            isActive: Boolean(p.is_active),
            startDate: p.start_date,
            endDate: p.end_date
          }));
        }
      } catch (e) {
        console.warn('Supabase getPromotions notice:', e);
      }
    }
    return local;
  },

  async savePromotion(promotion) {
    const promos = getLocalData(STORAGE_KEYS.PROMOTIONS, DEFAULT_PROMOTIONS);
    const promoId = promotion.id || `promo-${Date.now()}`;
    const code = (promotion.code || '').trim().toUpperCase();
    const normalized = {
      ...promotion,
      id: promoId,
      code,
      discountType: promotion.discountType || 'percentage',
      discountValue: Number(promotion.discountValue) || 10,
      isActive: Boolean(promotion.isActive ?? true)
    };
    const idx = promos.findIndex(p => p.id === promoId || p.code === code);
    let updated;
    if (idx >= 0) {
      updated = [...promos];
      updated[idx] = normalized;
    } else {
      updated = [...promos, normalized];
    }
    setLocalData(STORAGE_KEYS.PROMOTIONS, updated);

    if (isSupabaseConfigured && supabase) {
      try {
        const dbPayload = {
          code: normalized.code,
          label: normalized.label || `${normalized.code} Offer`,
          discount_type: normalized.discountType,
          discount_value: normalized.discountValue,
          min_order_amount: Number(normalized.minOrderAmount || 0),
          is_active: normalized.isActive,
          updated_at: new Date().toISOString()
        };
        await supabase.from('promotions').upsert(dbPayload, { onConflict: 'code' });
      } catch (e) {
        console.warn('Supabase savePromotion notice:', e);
      }
    }
    return normalized;
  },

  async deletePromotion(codeOrId) {
    const promos = getLocalData(STORAGE_KEYS.PROMOTIONS, DEFAULT_PROMOTIONS);
    const filtered = promos.filter(p => p.code !== codeOrId && p.id !== codeOrId);
    setLocalData(STORAGE_KEYS.PROMOTIONS, filtered);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('promotions').delete().or(`code.eq.${codeOrId},id.eq.${codeOrId}`);
      } catch (e) {
        console.warn('Supabase deletePromotion notice:', e);
      }
    }
    return true;
  },

  // --------------------------------------------------------------------------
  // HOMEPAGE CONFIG
  // --------------------------------------------------------------------------
  async getHomepageConfig() {
    const local = getLocalData(STORAGE_KEYS.HOMEPAGE, DEFAULT_HOMEPAGE_CONFIG);
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await withSupabaseTimeout(
          supabase.from('homepage_config').select('*').limit(1).maybeSingle(),
          2500,
          'Supabase homepage_config'
        );
        if (!error && data) {
          return {
            heroEyebrow: data.hero_eyebrow || local.heroEyebrow,
            heroHeadline: data.hero_headline || local.heroHeadline,
            heroSubtext: data.hero_subtext || local.heroSubtext,
            bestsellersTitle: data.bestsellers_title || local.bestsellersTitle,
            bestsellersPromo: data.bestsellers_promo || local.bestsellersPromo,
            mostCovetedTitle: data.most_coveted_title || local.mostCovetedTitle,
            mostCovetedSubtext: data.most_coveted_subtext || local.mostCovetedSubtext,
            newArrivalsTitle: data.new_arrivals_title || local.newArrivalsTitle,
            isNatureChapterVisible: data.is_nature_chapter_visible ?? local.isNatureChapterVisible,
            isColourChapterVisible: data.is_colour_chapter_visible ?? local.isColourChapterVisible,
            isCraftChapterVisible: data.is_craft_chapter_visible ?? local.isCraftChapterVisible
          };
        }
      } catch (e) {
        console.warn('Supabase getHomepageConfig notice:', e);
      }
    }
    return local;
  },

  async updateHomepageConfig(config) {
    const current = getLocalData(STORAGE_KEYS.HOMEPAGE, DEFAULT_HOMEPAGE_CONFIG);
    const updated = { ...current, ...config, updatedAt: new Date().toISOString() };
    setLocalData(STORAGE_KEYS.HOMEPAGE, updated);

    if (isSupabaseConfigured && supabase) {
      try {
        const dbPayload = {
          hero_eyebrow: updated.heroEyebrow,
          hero_headline: updated.heroHeadline,
          hero_subtext: updated.heroSubtext,
          bestsellers_title: updated.bestsellersTitle,
          bestsellers_promo: updated.bestsellersPromo,
          most_coveted_title: updated.mostCovetedTitle,
          most_coveted_subtext: updated.mostCovetedSubtext,
          new_arrivals_title: updated.newArrivalsTitle,
          is_nature_chapter_visible: updated.isNatureChapterVisible,
          is_colour_chapter_visible: updated.isColourChapterVisible,
          is_craft_chapter_visible: updated.isCraftChapterVisible,
          updated_at: new Date().toISOString()
        };
        const { data: existing } = await supabase.from('homepage_config').select('id').limit(1).maybeSingle();
        if (existing?.id) {
          await supabase.from('homepage_config').update(dbPayload).eq('id', existing.id);
        } else {
          await supabase.from('homepage_config').insert([dbPayload]);
        }
      } catch (e) {
        console.warn('Supabase updateHomepageConfig notice:', e);
      }
    }
    return updated;
  },

  // --------------------------------------------------------------------------
  // TESTIMONIALS
  // --------------------------------------------------------------------------
  async getTestimonials() {
    return getLocalData(STORAGE_KEYS.TESTIMONIALS, SEED_TESTIMONIALS);
  },

  async saveTestimonial(testimonial) {
    const current = getLocalData(STORAGE_KEYS.TESTIMONIALS, SEED_TESTIMONIALS);
    const idx = current.findIndex(t => t.id === testimonial.id);
    let updated;
    if (idx >= 0) {
      updated = [...current];
      updated[idx] = testimonial;
    } else {
      updated = [{ ...testimonial, id: Date.now() }, ...current];
    }
    setLocalData(STORAGE_KEYS.TESTIMONIALS, updated);
    return testimonial;
  },

  // --------------------------------------------------------------------------
  // SETTINGS
  // --------------------------------------------------------------------------
  async getSettings() {
    const local = getLocalData(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await withSupabaseTimeout(
          supabase.from('store_settings').select('*').limit(1).maybeSingle(),
          2500,
          'Supabase store_settings'
        );
        if (!error && data) {
          return {
            ...local,
            storeName: data.store_name || local.storeName,
            tagline: data.tagline || local.tagline,
            whatsappNumber: (data.whatsapp_number || '').replace(/[^0-9]/g, '') || local.whatsappNumber,
            conciergeEmail: data.contact_email || local.conciergeEmail,
            currencyCode: data.currency_code || local.currencyCode,
            currencySymbol: data.currency_symbol || local.currencySymbol,
            freeShippingThreshold: Number(data.free_shipping_threshold ?? local.freeShippingThreshold),
            standardShippingFee: Number(data.standard_shipping_fee ?? local.standardShippingFee),
            giftWrapFee: Number(data.gift_wrap_fee ?? local.giftWrapFee),
            sareesSoldCount: data.sarees_sold_count ?? local.sareesSoldCount,
            customerRating: Number(data.customer_rating ?? local.customerRating)
          };
        }
      } catch (e) {
        console.warn('Supabase getSettings notice:', e);
      }
    }
    return local;
  },

  async updateSettings(settings) {
    const current = getLocalData(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    const updated = { ...current, ...settings, updatedAt: new Date().toISOString() };
    setLocalData(STORAGE_KEYS.SETTINGS, updated);

    if (isSupabaseConfigured && supabase) {
      try {
        const dbPayload = {
          store_name: updated.storeName,
          tagline: updated.tagline,
          whatsapp_number: updated.whatsappNumber.startsWith('+') ? updated.whatsappNumber : `+${updated.whatsappNumber}`,
          contact_email: updated.conciergeEmail || 'rodhesaree@gmail.com',
          currency_code: updated.currencyCode || 'INR',
          currency_symbol: updated.currencySymbol || '₹',
          free_shipping_threshold: Number(updated.freeShippingThreshold) || 2999,
          standard_shipping_fee: Number(updated.standardShippingFee) || 199,
          gift_wrap_fee: Number(updated.giftWrapFee) || 150,
          sarees_sold_count: Number(updated.sareesSoldCount) || 1240,
          customer_rating: Number(updated.customerRating) || 4.9,
          updated_at: new Date().toISOString()
        };
        const { data: existing } = await supabase.from('store_settings').select('id').limit(1).maybeSingle();
        if (existing?.id) {
          await supabase.from('store_settings').update(dbPayload).eq('id', existing.id);
        } else {
          await supabase.from('store_settings').insert([dbPayload]);
        }
      } catch (e) {
        console.warn('Supabase updateSettings notice:', e);
      }
    }
    return updated;
  },

  // --------------------------------------------------------------------------
  // ENQUIRIES & COMMUNITY
  // --------------------------------------------------------------------------
  async submitEnquiry(enquiry) {
    const enquiries = getLocalData(STORAGE_KEYS.ENQUIRIES, []);
    const record = {
      ...enquiry,
      id: `enq-${Date.now()}`,
      status: 'new',
      notes: '',
      createdAt: new Date().toISOString()
    };
    setLocalData(STORAGE_KEYS.ENQUIRIES, [record, ...enquiries]);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('enquiries').insert([{
          customer_name: record.customer_name || record.name || 'Patron',
          email: record.email || '',
          phone: record.phone || '',
          saree_interest: record.saree_interest || record.sareeInterest || '',
          message: record.message || '',
          status: 'new'
        }]);
      } catch (e) {
        console.warn('Supabase submitEnquiry notice:', e);
      }
    }
    return record;
  },

  async getEnquiries() {
    const local = getLocalData(STORAGE_KEYS.ENQUIRIES, []);
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('enquiries').select('*').order('created_at', { ascending: false });
        if (!error && Array.isArray(data) && data.length > 0) {
          return data.map(e => ({
            id: e.id,
            name: e.customer_name,
            customer_name: e.customer_name,
            email: e.email,
            phone: e.phone,
            sareeInterest: e.saree_interest,
            saree_interest: e.saree_interest,
            message: e.message,
            status: e.status || 'new',
            notes: e.notes || '',
            createdAt: e.created_at
          }));
        }
      } catch (e) {
        console.warn('Supabase getEnquiries notice:', e);
      }
    }
    return local;
  },

  async updateEnquiryStatus(id, status, notes = null) {
    const enquiries = getLocalData(STORAGE_KEYS.ENQUIRIES, []);
    const updated = enquiries.map(e => e.id === id ? { ...e, status, ...(notes !== null ? { notes } : {}) } : e);
    setLocalData(STORAGE_KEYS.ENQUIRIES, updated);

    if (isSupabaseConfigured && supabase) {
      try {
        const patch = { status };
        await supabase.from('enquiries').update(patch).eq('id', id);
      } catch (e) {
        console.warn('Supabase updateEnquiryStatus notice:', e);
      }
    }
    return true;
  },

  async joinCircle(email, phone = '') {
    const signups = getLocalData(STORAGE_KEYS.SIGNUPS, []);
    if (signups.some(s => s.email === email)) {
      return { success: true, message: 'You are already part of the RODHE Circle.' };
    }
    const record = {
      id: `signup-${Date.now()}`,
      email,
      phone,
      createdAt: new Date().toISOString()
    };
    setLocalData(STORAGE_KEYS.SIGNUPS, [record, ...signups]);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('community_signups').insert([record]);
      } catch (e) {}
    }
    return { success: true, message: 'Welcome to the RODHE Circle of Trust.' };
  },

  // Alias for backward and forward compatibility
  async createEnquiry(enquiry) {
    return this.submitEnquiry(enquiry);
  },

  async getSignups() {
    return getLocalData(STORAGE_KEYS.SIGNUPS, []);
  },

  // --------------------------------------------------------------------------
  // ORDERS & TRANSACTIONAL COMMERCE
  // --------------------------------------------------------------------------
  // ORDER FULFILLMENT & PERSISTENCE (Secured)
  // --------------------------------------------------------------------------
  async createOrder(orderPayload) {
    const rawItems = Array.isArray(orderPayload.items) ? orderPayload.items : [];
    if (rawItems.length === 0) {
      throw new Error('Cannot place an order with an empty shopping bag.');
    }

    const currentProducts = getLocalData(STORAGE_KEYS.PRODUCTS, SEED_PRODUCTS);

    // 1. Pre-flight Inventory Validation: Ensure items are in stock
    for (const item of rawItems) {
      const prod = item.product || item;
      const targetId = String(prod.id || prod.slug || '');
      const targetSku = prod.sku || '';
      const matching = currentProducts.find(p => p.id === targetId || p.sku === targetSku || p.slug === targetId);
      const available = Number(matching?.stockCount ?? matching?.stock_count ?? 10);
      const requested = Number(item.quantity) || 1;

      if (available < requested) {
        throw new Error(`Insufficient inventory for "${prod.name || 'saree'}". Only ${available} available in atelier.`);
      }
    }

    const orderNumber = `RDH-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const orderId = `order-${Date.now()}`;

    // Normalize items
    const formattedItems = rawItems.map((item, idx) => {
      const prod = item.product || item;
      const unitPrice = Number(prod.price ?? prod.sellingPrice ?? prod.selling_price ?? 990) || 990;
      const qty = Number(item.quantity) || 1;
      return {
        id: `item-${Date.now()}-${idx}`,
        productId: String(prod.id || prod.slug || `saree-${idx}`),
        sku: prod.sku || `RDH-${String(idx + 1).padStart(3, '0')}`,
        name: prod.name || 'Handcrafted Cotton Saree',
        unitPrice: unitPrice,
        unit_price: unitPrice,
        quantity: qty,
        subtotal: unitPrice * qty,
        primaryImage: prod.primaryImage || prod.primary_image || '/assets/products/saree_ivory_mulmul.jpg'
      };
    });

    const subtotal = formattedItems.reduce((acc, it) => acc + it.subtotal, 0);
    const discountAmount = Number(orderPayload.discountAmount || 0);
    const shippingFee = Number(orderPayload.shippingFee || 0);
    const giftWrapFee = Number(orderPayload.giftWrapFee || (orderPayload.giftWrap ? 150 : 0));
    const grandTotal = Math.max(0, subtotal - discountAmount + shippingFee + giftWrapFee);

    // Initial payment status: NEVER fake 'captured' without gateway confirmation
    const paymentStatus = orderPayload.paymentMethod === 'cod' ? 'pending_cod' : 'pending_payment';

    const orderRecord = {
      id: orderId,
      orderNumber,
      order_number: orderNumber,
      customerName: orderPayload.customerName || orderPayload.name || 'Patron',
      customer_name: orderPayload.customerName || orderPayload.name || 'Patron',
      customerEmail: orderPayload.customerEmail || orderPayload.email || '',
      customer_email: orderPayload.customerEmail || orderPayload.email || '',
      customerPhone: orderPayload.customerPhone || orderPayload.phone || '',
      customer_phone: orderPayload.customerPhone || orderPayload.phone || '',
      shippingAddress: orderPayload.shippingAddress || {
        addressLine1: orderPayload.address || '',
        city: orderPayload.city || '',
        state: orderPayload.state || '',
        pincode: orderPayload.pincode || ''
      },
      shipping_address: orderPayload.shippingAddress || {
        addressLine1: orderPayload.address || '',
        city: orderPayload.city || '',
        state: orderPayload.state || '',
        pincode: orderPayload.pincode || ''
      },
      items: formattedItems,
      subtotal,
      discountAmount,
      discount_amount: discountAmount,
      shippingFee,
      shipping_fee: shippingFee,
      giftWrap: Boolean(orderPayload.giftWrap),
      giftWrapFee,
      gift_wrap_fee: giftWrapFee,
      grandTotal,
      grand_total: grandTotal,
      appliedCoupon: orderPayload.appliedCoupon || null,
      applied_coupon: orderPayload.appliedCoupon || null,
      paymentMethod: orderPayload.paymentMethod || 'upi',
      payment_method: orderPayload.paymentMethod || 'upi',
      paymentStatus: paymentStatus,
      payment_status: paymentStatus,
      fulfillmentStatus: 'unfulfilled',
      fulfillment_status: 'unfulfilled',
      trackingNumber: '',
      tracking_number: '',
      courierPartner: 'Express Air Logistics',
      courier_partner: 'Express Air Logistics',
      createdAt: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    // 2. Synchronous Cloud Persistence (Fail-Safe Verification with Atomic RPC)
    if (isSupabaseConfigured && supabase) {
      const dbOrderPayload = {
        order_number: orderRecord.order_number,
        customer_name: orderRecord.customer_name,
        customer_email: orderRecord.customer_email,
        customer_phone: orderRecord.customer_phone,
        shipping_address: orderRecord.shipping_address,
        subtotal: orderRecord.subtotal,
        discount_amount: orderRecord.discount_amount,
        shipping_fee: orderRecord.shipping_fee,
        gift_wrap_fee: orderRecord.gift_wrap_fee,
        grand_total: orderRecord.grand_total,
        applied_coupon: orderRecord.applied_coupon,
        payment_method: orderRecord.payment_method,
        payment_status: orderRecord.payment_status,
        fulfillment_status: orderRecord.fulfillment_status,
        courier_partner: orderRecord.courier_partner,
        gateway_payment_id: orderPayload.gatewayPaymentId || null,
        gateway_order_id: orderPayload.gatewayOrderId || null,
        gateway_signature: orderPayload.gatewaySignature || null
      };

      const dbItems = formattedItems.map(it => ({
        product_id: it.productId,
        sku: it.sku,
        name: it.name,
        unit_price: it.unitPrice,
        quantity: it.quantity,
        subtotal: it.subtotal,
        primary_image: it.primaryImage
      }));

      let rpcSucceeded = false;
      try {
        const { data: rpcResult, error: rpcErr } = await supabase.rpc('create_order_atomic', {
          p_order: dbOrderPayload,
          p_items: dbItems
        });

        if (rpcErr) {
          if (rpcErr.message && (rpcErr.message.includes('Insufficient') || rpcErr.message.includes('stock'))) {
            throw new Error(rpcErr.message);
          }
          console.warn('create_order_atomic RPC notice, falling back to direct insert:', rpcErr.message);
        } else if (rpcResult?.success) {
          rpcSucceeded = true;
          if (rpcResult.order_number) {
            orderRecord.orderNumber = rpcResult.order_number;
            orderRecord.order_number = rpcResult.order_number;
          }
          if (rpcResult.order_id) {
            orderRecord.id = rpcResult.order_id;
          }
        }
      } catch (err) {
        if (err.message && err.message.includes('Insufficient')) {
          throw err;
        }
        console.warn('RPC execution attempt notice:', err);
      }

      if (!rpcSucceeded) {
        const { data: dbOrder, error: orderErr } = await supabase
          .from('orders')
          .insert([dbOrderPayload])
          .select('id')
          .maybeSingle();

        if (orderErr) {
          console.error('Supabase order creation rejected:', orderErr);
          throw new Error(orderErr.message || 'Unable to secure order in cloud database. Bag preserved.');
        }

        if (dbOrder?.id) {
          const itemsToInsert = dbItems.map(it => ({ ...it, order_id: dbOrder.id }));
          const { error: itemsErr } = await supabase.from('order_items').insert(itemsToInsert);
          if (itemsErr) {
            console.error('Failed to persist order items:', itemsErr);
            throw new Error('Failed to record order items in cloud registry.');
          }

          // Deduct inventory in Supabase products table
          for (const it of formattedItems) {
            try {
              await supabase.rpc('decrement_product_stock', {
                p_sku: it.sku,
                p_qty: it.quantity
              });
            } catch {}
          }
        }
      }
    }

    // 3. Decrement stock in local store & persist verified order
    try {
      const updatedProducts = currentProducts.map(p => {
        const matchingItem = formattedItems.find(it => it.productId === p.id || it.sku === p.sku);
        if (matchingItem) {
          const newStock = Math.max(0, (p.stockCount ?? p.stock_count ?? 10) - matchingItem.quantity);
          return {
            ...p,
            stockCount: newStock,
            stock_count: newStock,
            inStock: newStock > 0,
            in_stock: newStock > 0
          };
        }
        return p;
      });
      setLocalData(STORAGE_KEYS.PRODUCTS, updatedProducts);
    } catch (e) {
      console.warn('Local stock decrement notice:', e);
    }

    const orders = getLocalData(STORAGE_KEYS.ORDERS, []);
    setLocalData(STORAGE_KEYS.ORDERS, [orderRecord, ...orders]);

    return orderRecord;
  },

  async getOrders(filters = {}) {
    // Try reading cloud database when Supabase is configured (never fabricate fake customer orders)
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
        if (filters.status && filters.status !== 'all') {
          query = query.eq('fulfillment_status', filters.status);
        }
        const { data, error } = await query;
        if (!error && Array.isArray(data)) {
          return data;
        }
        if (error) {
          console.warn('Orders query restricted or unavailable:', error.message);
          return [];
        }
      } catch (err) {
        return [];
      }
    }

    const localOrders = getLocalData(STORAGE_KEYS.ORDERS, []);
    if (filters.status && filters.status !== 'all') {
      return localOrders.filter(o => o.fulfillmentStatus === filters.status || o.fulfillment_status === filters.status);
    }
    return localOrders;
  },

  async getOrderById(orderId) {
    const orders = await this.getOrders();
    return orders.find(o => o.id === orderId || o.orderNumber === orderId || o.order_number === orderId) || null;
  },

  async updateOrderStatus(orderId, statusData) {
    const orders = getLocalData(STORAGE_KEYS.ORDERS, []);
    const targetOrder = orders.find(o => o.id === orderId || o.orderNumber === orderId || o.order_number === orderId);
    const newStatus = statusData.fulfillmentStatus || statusData.fulfillment_status;
    const oldStatus = targetOrder?.fulfillmentStatus || targetOrder?.fulfillment_status;

    // Transactionally restore inventory if order is cancelled
    if (newStatus === 'cancelled' && oldStatus !== 'cancelled' && Array.isArray(targetOrder?.items)) {
      try {
        const currentProducts = getLocalData(STORAGE_KEYS.PRODUCTS, SEED_PRODUCTS);
        const restored = currentProducts.map(p => {
          const matched = targetOrder.items.find(it => it.productId === p.id || it.sku === p.sku);
          if (matched) {
            const count = (p.stockCount ?? p.stock_count ?? 10) + matched.quantity;
            return { ...p, stockCount: count, stock_count: count, inStock: true, in_stock: true };
          }
          return p;
        });
        setLocalData(STORAGE_KEYS.PRODUCTS, restored);
      } catch (e) {
        console.warn('Inventory restoration notice:', e);
      }
    }

    const updated = orders.map(o => {
      if (o.id === orderId || o.orderNumber === orderId || o.order_number === orderId) {
        return {
          ...o,
          ...statusData,
          fulfillmentStatus: newStatus || o.fulfillmentStatus,
          fulfillment_status: newStatus || o.fulfillment_status,
          paymentStatus: statusData.paymentStatus || statusData.payment_status || o.paymentStatus,
          payment_status: statusData.paymentStatus || statusData.payment_status || o.payment_status,
          trackingNumber: statusData.trackingNumber || statusData.tracking_number || o.trackingNumber,
          tracking_number: statusData.trackingNumber || statusData.tracking_number || o.tracking_number,
          courierPartner: statusData.courierPartner || statusData.courier_partner || o.courierPartner,
          courier_partner: statusData.courierPartner || statusData.courier_partner || o.courier_partner,
          updatedAt: new Date().toISOString()
        };
      }
      return o;
    });

    setLocalData(STORAGE_KEYS.ORDERS, updated);

    // Sync to Supabase if connected
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('orders')
          .update({
            fulfillment_status: newStatus,
            payment_status: statusData.paymentStatus || statusData.payment_status,
            tracking_number: statusData.trackingNumber || statusData.tracking_number,
            courier_partner: statusData.courierPartner || statusData.courier_partner,
            updated_at: new Date().toISOString()
          })
          .or(`id.eq.${orderId},order_number.eq.${orderId}`);
      } catch (err) {}
    }

    return true;
  },

  async lookupOrder(orderNumber, contact) {
    if (!orderNumber || !contact) {
      throw new Error('Please provide both Order Number and Phone or Email.');
    }
    const cleanNum = orderNumber.trim();
    const cleanContact = contact.trim().toLowerCase();
    const cleanDigits = cleanContact.replace(/\D/g, '');

    // 1. Try Supabase RPC lookup_order
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.rpc('lookup_order', {
        p_order_number: cleanNum,
        p_phone_or_email: cleanContact
      });

      if (error) {
        if (error.code === 'PGRST202' || String(error.message || '').includes('Could not find the function')) {
          throw new Error('Online order tracking registry is not yet enabled on the database. Please message our WhatsApp concierge (+91 9490658858) for live dispatch updates.');
        }
        throw new Error('Unable to reach the order tracking registry right now. Please try again or connect on WhatsApp.');
      }

      if (data?.success && data?.order) {
        return data.order;
      }
      return null;
    }

    // 2. Local fallback (Hermetic / Offline tests only)
    const orders = getLocalData(STORAGE_KEYS.ORDERS, []);
    const found = orders.find(o => {
      const num = (o.orderNumber || o.order_number || '').trim().toLowerCase();
      if (num !== cleanNum.toLowerCase()) return false;
      const email = (o.customerEmail || o.customer_email || '').toLowerCase();
      const phoneDigits = (o.customerPhone || o.customer_phone || '').replace(/\D/g, '');
      return email === cleanContact || (cleanDigits.length >= 8 && phoneDigits.endsWith(cleanDigits.slice(-10)));
    });

    return found || null;
  },

  async getCustomerOrders(email) {
    if (!email) return [];
    const cleanEmail = email.trim().toLowerCase();

    // 1. Try Supabase query (strictly RLS-protected to own account)
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            id, order_number, customer_name, customer_email,
            grand_total, subtotal, shipping_fee, payment_method,
            payment_status, fulfillment_status, courier_partner,
            tracking_number, created_at,
            order_items (
              id, sku, name, unit_price, quantity, subtotal, primary_image
            )
          `)
          .eq('customer_email', cleanEmail)
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          return data;
        }
        return [];
      } catch (err) {
        console.warn('Supabase customer orders query notice:', err);
        return [];
      }
    }

    // 2. Local fallback (Offline mode only)
    const orders = getLocalData(STORAGE_KEYS.ORDERS, []);
    return orders.filter(o => (o.customerEmail || o.customer_email || '').toLowerCase() === cleanEmail);
  },

  async cancelOrder(orderId, reason = 'Customer requested cancellation') {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.rpc('cancel_order_atomic', {
          p_order_id: orderId,
          p_reason: reason
        });
        if (!error && data?.success) {
          await this.updateOrderStatus(orderId, { fulfillmentStatus: 'cancelled' });
          return data;
        }
      } catch (err) {
        console.warn('cancel_order_atomic RPC attempt notice:', err);
      }
    }
    return this.updateOrderStatus(orderId, { fulfillmentStatus: 'cancelled' });
  }
};
