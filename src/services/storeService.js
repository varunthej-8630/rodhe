import { supabase, isSupabaseConfigured } from './supabaseClient';
import { PRODUCTS as SEED_PRODUCTS } from '../data/products';
import { TESTIMONIALS as SEED_TESTIMONIALS } from '../data/storyData';

// Storage keys for persistent local storage engine
const STORAGE_KEYS = {
  PRODUCTS: 'rodhe_db_products',
  COLLECTIONS: 'rodhe_db_collections',
  PROMOTIONS: 'rodhe_db_promotions',
  HOMEPAGE: 'rodhe_db_homepage',
  TESTIMONIALS: 'rodhe_db_testimonials',
  SETTINGS: 'rodhe_db_settings',
  ENQUIRIES: 'rodhe_db_enquiries',
  SIGNUPS: 'rodhe_db_signups'
};

// Initial Seed Data for Store Settings
const DEFAULT_SETTINGS = {
  storeName: 'RODHE',
  tagline: 'Woven with Trust',
  whatsappNumber: import.meta.env.VITE_STORE_WHATSAPP_NUMBER || '919490658858',
  conciergeEmail: 'concierge@rodhe.in',
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

// Local Storage Helper Utilities
const getLocalData = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
};

const setLocalData = (key, val) => {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {}
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
};

// Initialize immediately on load
if (typeof window !== 'undefined') {
  initLocalStore();
}

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

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Supabase request timeout')), 2500)
        );

        const { data, error } = await Promise.race([queryPromise, timeoutPromise]);
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
    return getLocalData(STORAGE_KEYS.COLLECTIONS, DEFAULT_COLLECTIONS);
  },

  async saveCollection(collection) {
    const cols = getLocalData(STORAGE_KEYS.COLLECTIONS, DEFAULT_COLLECTIONS);
    const idx = cols.findIndex(c => c.id === collection.id);
    let updated;
    if (idx >= 0) {
      updated = [...cols];
      updated[idx] = collection;
    } else {
      updated = [...cols, { ...collection, id: `col-${Date.now()}` }];
    }
    setLocalData(STORAGE_KEYS.COLLECTIONS, updated);
    return collection;
  },

  // --------------------------------------------------------------------------
  // PROMOTIONS
  // --------------------------------------------------------------------------
  async getPromotions() {
    return getLocalData(STORAGE_KEYS.PROMOTIONS, DEFAULT_PROMOTIONS);
  },

  async savePromotion(promotion) {
    const promos = getLocalData(STORAGE_KEYS.PROMOTIONS, DEFAULT_PROMOTIONS);
    const idx = promos.findIndex(p => p.id === promotion.id || p.code === promotion.code);
    let updated;
    if (idx >= 0) {
      updated = [...promos];
      updated[idx] = promotion;
    } else {
      updated = [...promos, { ...promotion, id: `promo-${Date.now()}` }];
    }
    setLocalData(STORAGE_KEYS.PROMOTIONS, updated);
    return promotion;
  },

  async deletePromotion(code) {
    const promos = getLocalData(STORAGE_KEYS.PROMOTIONS, DEFAULT_PROMOTIONS);
    const updated = promos.filter(p => p.code !== code && p.id !== code);
    setLocalData(STORAGE_KEYS.PROMOTIONS, updated);
    return true;
  },

  // --------------------------------------------------------------------------
  // HOMEPAGE CONFIG
  // --------------------------------------------------------------------------
  async getHomepageConfig() {
    return getLocalData(STORAGE_KEYS.HOMEPAGE, DEFAULT_HOMEPAGE_CONFIG);
  },

  async updateHomepageConfig(config) {
    const current = getLocalData(STORAGE_KEYS.HOMEPAGE, DEFAULT_HOMEPAGE_CONFIG);
    const updated = { ...current, ...config, updatedAt: new Date().toISOString() };
    setLocalData(STORAGE_KEYS.HOMEPAGE, updated);
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
    return getLocalData(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  },

  async updateSettings(settings) {
    const current = getLocalData(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    const updated = { ...current, ...settings, updatedAt: new Date().toISOString() };
    setLocalData(STORAGE_KEYS.SETTINGS, updated);
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
      createdAt: new Date().toISOString()
    };
    setLocalData(STORAGE_KEYS.ENQUIRIES, [record, ...enquiries]);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('enquiries').insert([record]);
      } catch (e) {}
    }
    return record;
  },

  async getEnquiries() {
    return getLocalData(STORAGE_KEYS.ENQUIRIES, []);
  },

  async updateEnquiryStatus(id, status) {
    const enquiries = getLocalData(STORAGE_KEYS.ENQUIRIES, []);
    const updated = enquiries.map(e => e.id === id ? { ...e, status } : e);
    setLocalData(STORAGE_KEYS.ENQUIRIES, updated);
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

  async getSignups() {
    return getLocalData(STORAGE_KEYS.SIGNUPS, []);
  }
};
