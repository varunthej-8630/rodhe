import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { PRODUCTS as STATIC_PRODUCTS } from '../data/products';
import { storeService } from '../services/storeService';
import { customerService } from '../services/customerService';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

const ShopContext = createContext();

const DEFAULT_SETTINGS = {
  whatsappNumber: '919490658858',
  freeShippingThreshold: 2999,
  standardShippingFee: 199,
  giftWrapFee: 150
};

function getNormalizedPrice(product) {
  if (!product) return 0;
  const val = Number(product.price ?? product.sellingPrice ?? product.selling_price ?? 0);
  return Number.isFinite(val) && val > 0 ? val : 0;
}

export function isSameProduct(a, b) {
  if (!a || !b) return false;
  if (typeof a === 'string' && typeof b === 'string') return a === b;
  const aId = typeof a === 'string' ? a : a.id;
  const bId = typeof b === 'string' ? b : b.id;
  if (aId && bId && String(aId) === String(bId)) return true;

  const aSlug = typeof a === 'object' ? a.slug : a;
  const bSlug = typeof b === 'object' ? b.slug : b;
  if (aSlug && bSlug && String(aSlug) === String(bSlug)) return true;

  const aSku = typeof a === 'object' ? a.sku : null;
  const bSku = typeof b === 'object' ? b.sku : null;
  if (aSku && bSku && String(aSku).toUpperCase() === String(bSku).toUpperCase()) return true;

  return false;
}

export const ShopProvider = ({ children }) => {
  // Navigation / Page State
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedProductId, setSelectedProductId] = useState(null);

  // Dynamic Products & Store Settings
  const [products, setProducts] = useState(STATIC_PRODUCTS);
  const [isProductsLoading, setIsProductsLoading] = useState(true);
  const [storeSettings, setStoreSettings] = useState(DEFAULT_SETTINGS);

  const catalogMaxPrice = useMemo(() => {
    const maxFound = products.reduce((max, p) => Math.max(max, getNormalizedPrice(p)), 0);
    return Math.max(2000, Math.ceil(maxFound / 500) * 500);
  }, [products]);

  const refreshProducts = useCallback(async () => {
    try {
      const [data, stg] = await Promise.all([
        storeService.getProducts({ publishedOnly: false }),
        storeService.getSettings()
      ]);
      if (data && data.length > 0) {
        setProducts(data);
      }
      if (stg) {
        setStoreSettings({
          whatsappNumber: (stg.whatsappNumber || '919490658858').replace(/[^0-9]/g, '') || '919490658858',
          freeShippingThreshold: Number(stg.freeShippingThreshold ?? 2999),
          standardShippingFee: Number(stg.standardShippingFee ?? 199),
          giftWrapFee: Number(stg.giftWrapFee ?? 150)
        });
      }
    } catch (err) {
      console.warn('Failed to refresh products from storeService:', err);
    } finally {
      setIsProductsLoading(false);
    }
  }, []);

  useEffect(() => {
    customerService.purgeLegacyInsecurePii();
    refreshProducts();
  }, [refreshProducts]);

  // Intro video session state
  const [hasIntroPlayed, setHasIntroPlayedState] = useState(() => {
    try {
      return sessionStorage.getItem('rodhe_intro_played') === 'true';
    } catch {
      return false;
    }
  });

  const setHasIntroPlayed = (played) => {
    setHasIntroPlayedState(played);
    try {
      sessionStorage.setItem('rodhe_intro_played', played ? 'true' : 'false');
    } catch {}
  };

  // Cart State (starts clean empty `[]` for real shoppers — zero fake demo items)
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('rodhe_cart');
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const cartRef = useRef(cart);
  cartRef.current = cart;

  // Wishlist State (starts clean empty `[]` — zero fake demo items)
  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem('rodhe_wishlist');
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
      return [];
    }
  });
  const wishlistRef = useRef(wishlist);
  wishlistRef.current = wishlist;

  const persistCartToStorage = useCallback((nextCart) => {
    try {
      localStorage.setItem('rodhe_cart', JSON.stringify(nextCart));
      return true;
    } catch {
      return false;
    }
  }, []);

  const persistWishlistToStorage = useCallback((nextWishlist) => {
    try {
      localStorage.setItem('rodhe_wishlist', JSON.stringify(nextWishlist));
      return true;
    } catch {
      return false;
    }
  }, []);

  // Reconcile cart & wishlist against live catalog whenever products refresh
  useEffect(() => {
    if (!products || products.length === 0) return;

    const currentCart = cartRef.current;
    if (currentCart && currentCart.length > 0) {
      let changed = false;
      const nextCart = currentCart.map((entry) => {
        const currentProd = entry.product || entry;
        const live = products.find((p) => isSameProduct(p, currentProd));
        if (!live) {
          if (!isProductsLoading && !entry.isUnavailable) {
            changed = true;
            return { ...entry, isUnavailable: true };
          }
          return entry;
        }
        const isPublished = !live.status || live.status === 'published';
        const trackedStock = typeof live.stockCount === 'number' ? live.stockCount : Number(live.stock_count ?? 10);
        const isAvailable = isPublished && Boolean(live.inStock ?? live.in_stock ?? true) && trackedStock > 0;
        const safeQty = isAvailable && trackedStock > 0 ? Math.min(Math.max(1, entry.quantity || 1), trackedStock) : Math.max(1, entry.quantity || 1);

        const priceChanged = getNormalizedPrice(live) !== getNormalizedPrice(currentProd);
        const idChanged = String(live.id) !== String(currentProd.id);
        const flagChanged = Boolean(entry.isUnavailable) !== !isPublished || Boolean(entry.isOutOfStock) !== !isAvailable;
        const qtyChanged = safeQty !== entry.quantity;

        if (priceChanged || idChanged || flagChanged || qtyChanged) {
          changed = true;
        }
        return {
          product: live,
          quantity: safeQty,
          isUnavailable: !isPublished,
          isOutOfStock: isPublished && !isAvailable
        };
      });
      if (changed) {
        cartRef.current = nextCart;
        setCart(nextCart);
        persistCartToStorage(nextCart);
      }
    }

    // Migrate legacy slug IDs cleanly to live canonical product IDs
    const currentWishlist = wishlistRef.current;
    if (currentWishlist && currentWishlist.length > 0) {
      let changed = false;
      const mapped = [];
      for (const savedId of currentWishlist) {
        const live = products.find((p) => isSameProduct(p, savedId));
        if (live) {
          if (String(live.id) !== String(savedId)) changed = true;
          if (!mapped.includes(live.id)) mapped.push(live.id);
        } else if (isProductsLoading) {
          if (!mapped.includes(savedId)) mapped.push(savedId);
        } else {
          changed = true;
        }
      }
      if (changed || mapped.length !== currentWishlist.length) {
        wishlistRef.current = mapped;
        setWishlist(mapped);
        persistWishlistToStorage(mapped);
      }
    }
  }, [products, isProductsLoading, persistCartToStorage, persistWishlistToStorage]);

  // Modals & Drawers
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isTrackOrderOpen, setIsTrackOrderOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  const closeAllOverlays = useCallback(() => {
    setIsMobileMenuOpen(false);
    setIsCartOpen(false);
    setIsWishlistOpen(false);
    setIsSearchOpen(false);
    setIsAuthOpen(false);
    setIsCheckoutOpen(false);
    setIsTrackOrderOpen(false);
    setQuickViewProduct(null);
  }, []);

  // Centralized Scroll Lock when any overlay is open
  const isAnyOverlayOpen = Boolean(
    isMobileMenuOpen ||
    isCartOpen ||
    isWishlistOpen ||
    isSearchOpen ||
    isAuthOpen ||
    isCheckoutOpen ||
    isTrackOrderOpen ||
    quickViewProduct
  );

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (isAnyOverlayOpen) {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    } else {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    }
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, [isAnyOverlayOpen]);

  // Customer Auth, Profile & Addresses State (Verified via Supabase Auth — zero insecure shared localStorage PII)
  const [patronUser, setPatronUser] = useState(null);
  const [customerAddresses, setCustomerAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [isCustomerAuthLoading, setIsCustomerAuthLoading] = useState(true);
  const [guestCheckoutDraft, setGuestCheckoutDraftState] = useState(() => customerService.getGuestCheckoutDraft() || null);

  const applyAuthenticatedCustomerData = useCallback((customerPayload, { mergeBagAndWishlist = false } = {}) => {
    if (!customerPayload?.user) {
      setPatronUser(null);
      setCustomerAddresses([]);
      setSelectedAddressId(null);
      return;
    }

    setPatronUser(customerPayload.user);
    const addrs = Array.isArray(customerPayload.addresses) ? customerPayload.addresses : [];
    setCustomerAddresses(addrs);
    const defaultAddr = addrs.find((a) => a.isDefault) || addrs[0] || null;
    setSelectedAddressId(defaultAddr?.id || null);

    if (mergeBagAndWishlist) {
      if (Array.isArray(customerPayload.wishlistIds) && customerPayload.wishlistIds.length > 0) {
        const merged = [...new Set([...wishlistRef.current, ...customerPayload.wishlistIds])];
        wishlistRef.current = merged;
        setWishlist(merged);
        persistWishlistToStorage(merged);
      }
      if (Array.isArray(customerPayload.cartItems) && customerPayload.cartItems.length > 0) {
        if (cartRef.current.length === 0) {
          const restored = [];
          for (const ci of customerPayload.cartItems) {
            const match = products.find((p) => isSameProduct(p, ci.id || ci.slug || ci.sku));
            if (match && (!match.status || match.status === 'published') && match.inStock && (match.stockCount ?? 1) > 0) {
              restored.push({ product: match, quantity: Math.min(ci.quantity || 1, match.stockCount ?? 10) });
            }
          }
          if (restored.length > 0) {
            cartRef.current = restored;
            setCart(restored);
            persistCartToStorage(restored);
          }
        }
      }
    }
  }, [products, persistCartToStorage, persistWishlistToStorage]);

  useEffect(() => {
    let mounted = true;
    customerService.getAuthenticatedCustomer()
      .then((customerPayload) => {
        if (mounted) {
          applyAuthenticatedCustomerData(customerPayload, { mergeBagAndWishlist: true });
        }
      })
      .finally(() => {
        if (mounted) setIsCustomerAuthLoading(false);
      });

    let subscription = null;
    if (isSupabaseConfigured && supabase) {
      const { data } = supabase.auth.onAuthStateChange(async (event) => {
        if (!mounted) return;
        if (event === 'SIGNED_OUT') {
          setPatronUser(null);
          setCustomerAddresses([]);
          setSelectedAddressId(null);
        } else if (event === 'SIGNED_IN') {
          const payload = await customerService.getAuthenticatedCustomer();
          if (mounted) {
            applyAuthenticatedCustomerData(payload, { mergeBagAndWishlist: true });
          }
        }
      });
      subscription = data?.subscription;
    }

    return () => {
      mounted = false;
      if (subscription?.unsubscribe) subscription.unsubscribe();
    };
  }, [applyAuthenticatedCustomerData]);

  // Toast notifications with Undo support
  const [toasts, setToasts] = useState([]);
  const toastTimersRef = useRef(new Map());

  const removeToast = useCallback((id) => {
    const existingTimer = toastTimersRef.current.get(id);
    if (existingTimer) {
      clearTimeout(existingTimer);
      toastTimersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'success', options = {}) => {
    const id = Date.now() + Math.random();
    const duration = options.duration ?? (options.onAction ? 6000 : 3800);
    setToasts((prev) => [
      ...prev.slice(-3),
      {
        id,
        message,
        type,
        actionLabel: options.actionLabel || null,
        onAction: options.onAction || null
      }
    ]);
    const timer = setTimeout(() => {
      toastTimersRef.current.delete(id);
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
    toastTimersRef.current.set(id, timer);
    return id;
  }, []);

  // Customer Auth & Address Actions
  const signInCustomer = async (email, password) => {
    const payload = await customerService.signIn(email, password);
    applyAuthenticatedCustomerData(payload, { mergeBagAndWishlist: true });
    return payload;
  };

  const signUpCustomer = async (details) => {
    const res = await customerService.signUp(details);
    if (!res.requiresEmailConfirmation && res.customer) {
      applyAuthenticatedCustomerData(res.customer, { mergeBagAndWishlist: true });
    }
    return res;
  };

  const loginPatron = (patronData) => {
    if (patronData?.user) {
      applyAuthenticatedCustomerData(patronData, { mergeBagAndWishlist: true });
    } else {
      setPatronUser(patronData);
    }
  };

  const logoutPatron = async () => {
    await customerService.signOut();
    setPatronUser(null);
    setCustomerAddresses([]);
    setSelectedAddressId(null);
    setGuestCheckoutDraftState(null);
    showToast('Signed out of your account.', 'info');
  };

  const updateCustomerProfile = async ({ name, phone }) => {
    const updated = await customerService.updateProfile({ name, phone });
    if (updated?.user) {
      setPatronUser(updated.user);
      showToast('Profile details saved.', 'success');
    }
    return updated;
  };

  const saveCustomerAddress = async (addressPayload) => {
    const nextAddresses = await customerService.saveAddress(addressPayload, customerAddresses);
    setCustomerAddresses(nextAddresses);
    const saved = nextAddresses.find((a) => a.isDefault) || nextAddresses[nextAddresses.length - 1];
    if (saved) setSelectedAddressId(saved.id);
    showToast('Delivery address saved.', 'success');
    return nextAddresses;
  };

  const setDefaultCustomerAddress = async (addressId) => {
    const nextAddresses = await customerService.setDefaultAddress(addressId, customerAddresses);
    setCustomerAddresses(nextAddresses);
    setSelectedAddressId(addressId);
    showToast('Preferred delivery address updated.', 'success');
    return nextAddresses;
  };

  const deleteCustomerAddress = async (addressId) => {
    const nextAddresses = await customerService.deleteAddress(addressId, customerAddresses);
    setCustomerAddresses(nextAddresses);
    if (selectedAddressId === addressId) {
      const nextDefault = nextAddresses.find((a) => a.isDefault) || nextAddresses[0] || null;
      setSelectedAddressId(nextDefault?.id || null);
    }
    showToast('Saved address removed.', 'info');
    return nextAddresses;
  };

  const saveGuestCheckoutDraft = useCallback((draft) => {
    setGuestCheckoutDraftState(draft);
    customerService.saveGuestCheckoutDraft(draft);
  }, []);

  // Filters State
  const [selectedCraft, setSelectedCraft] = useState('all');
  const [selectedColor, setSelectedColor] = useState('all');
  const [selectedFabric, setSelectedFabric] = useState('all');
  const [priceMax, setPriceMax] = useState(2000);
  const [hasCustomPriceCap, setHasCustomPriceCap] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState('featured');
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRangeFilter, setPriceRangeFilter] = useState(null);

  useEffect(() => {
    if (!hasCustomPriceCap) {
      setPriceMax(catalogMaxPrice);
    }
  }, [catalogMaxPrice, hasCustomPriceCap]);

  const handleSetPriceMax = (val) => {
    setHasCustomPriceCap(val < catalogMaxPrice);
    setPriceMax(val);
  };

  // Discount & Gift Wrap
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [giftWrap, setGiftWrap] = useState(false);

  // Resolve live product helper
  const resolveLiveProduct = useCallback((productOrId) => {
    const found = products.find((p) => isSameProduct(p, productOrId));
    if (found) return found;
    return typeof productOrId === 'object' ? productOrId : null;
  }, [products]);

  const commitCart = useCallback((nextCart) => {
    cartRef.current = nextCart;
    setCart(nextCart);
    const savedLocally = persistCartToStorage(nextCart);
    if (!savedLocally && !patronUser) {
      showToast('Bag updated for this session (browser storage quota or privacy restriction).', 'info');
    }
    if (patronUser) {
      customerService.syncCustomerCart(nextCart);
    }
  }, [patronUser, persistCartToStorage, showToast]);

  const commitWishlist = useCallback((nextWishlist) => {
    wishlistRef.current = nextWishlist;
    setWishlist(nextWishlist);
    persistWishlistToStorage(nextWishlist);
    if (patronUser) {
      customerService.syncCustomerWishlist(nextWishlist);
    }
  }, [patronUser, persistWishlistToStorage]);

  // Cart Operations
  const addToCart = useCallback((product, quantity = 1, openDrawer = true) => {
    const live = resolveLiveProduct(product) || product;
    if (!live) return false;

    const isPublished = !live.status || live.status === 'published';
    const stockLimit = typeof live.stockCount === 'number' ? live.stockCount : Number(live.stock_count ?? 10);
    const isAvailable = isPublished && Boolean(live.inStock ?? live.in_stock ?? true) && stockLimit > 0;

    if (!isAvailable) {
      showToast(`"${live.name}" is currently out of stock.`, 'error');
      return false;
    }

    const reqQty = Math.max(1, Number(quantity) || 1);
    const prev = cartRef.current;
    const existing = prev.find((item) => isSameProduct(item.product, live));
    let capped = false;
    let alreadyAtMax = false;
    let nextCart;

    if (existing) {
      if (stockLimit > 0 && existing.quantity >= stockLimit) {
        alreadyAtMax = true;
        nextCart = prev;
      } else {
        const nextQty = existing.quantity + reqQty;
        if (stockLimit > 0 && nextQty > stockLimit) {
          capped = true;
        }
        const finalQty = stockLimit > 0 ? Math.min(nextQty, stockLimit) : nextQty;
        nextCart = prev.map((item) =>
          isSameProduct(item.product, live)
            ? { product: live, quantity: finalQty, isUnavailable: false, isOutOfStock: false }
            : item
        );
        commitCart(nextCart);
      }
    } else {
      if (stockLimit > 0 && reqQty > stockLimit) {
        capped = true;
      }
      const finalQty = stockLimit > 0 ? Math.min(reqQty, stockLimit) : reqQty;
      nextCart = [...prev, { product: live, quantity: finalQty, isUnavailable: false, isOutOfStock: false }];
      commitCart(nextCart);
    }

    if (alreadyAtMax) {
      showToast(`Only ${stockLimit} piece${stockLimit === 1 ? '' : 's'} of "${live.name}" available in stock.`, 'info');
    } else if (capped) {
      showToast(`Added "${live.name}" (max available stock: ${stockLimit}).`, 'info');
    } else {
      showToast(`Added "${live.name}" to your bag.`);
    }

    if (openDrawer) {
      setIsMobileMenuOpen(false);
      setIsWishlistOpen(false);
      setIsSearchOpen(false);
      setIsCartOpen(true);
    }
    return true;
  }, [resolveLiveProduct, commitCart, showToast]);

  const removeFromCart = useCallback((productOrId) => {
    const prev = cartRef.current;
    const removedIdx = prev.findIndex((i) => isSameProduct(i.product, productOrId));
    if (removedIdx === -1) return;

    const removedEntry = prev[removedIdx];
    const nextCart = prev.filter((_, idx) => idx !== removedIdx);
    commitCart(nextCart);

    const targetProd = removedEntry.product;
    const targetQty = removedEntry.quantity;
    showToast(`"${targetProd?.name || 'Saree'}" removed from your bag.`, 'info', {
      duration: 6000,
      actionLabel: 'Undo',
      onAction: () => {
        const curr = cartRef.current;
        if (curr.some((c) => isSameProduct(c.product, targetProd))) {
          return;
        }
        const restored = [...curr];
        const insertAt = Math.min(Math.max(0, removedIdx), restored.length);
        restored.splice(insertAt, 0, {
          product: targetProd,
          quantity: targetQty,
          isUnavailable: Boolean(removedEntry.isUnavailable),
          isOutOfStock: Boolean(removedEntry.isOutOfStock)
        });
        commitCart(restored);
        showToast(`Restored "${targetProd?.name || 'Saree'}" to your bag.`, 'success');
      }
    });
  }, [commitCart, showToast]);

  const updateQuantity = useCallback((productOrId, newQuantity) => {
    const requested = Number(newQuantity);
    if (!Number.isFinite(requested) || requested < 1) {
      return;
    }

    let maxWarning = null;
    const nextCart = cartRef.current.map((item) => {
      if (!isSameProduct(item.product, productOrId)) return item;
      const live = resolveLiveProduct(item.product) || item.product;
      const stockLimit = typeof live.stockCount === 'number' ? live.stockCount : Number(live.stock_count ?? 10);
      if (stockLimit > 0 && requested > stockLimit) {
        maxWarning = `Maximum ${stockLimit} piece${stockLimit === 1 ? '' : 's'} available for "${live.name}".`;
        return { ...item, product: live, quantity: stockLimit };
      }
      return { ...item, product: live, quantity: requested };
    });

    commitCart(nextCart);
    if (maxWarning) {
      showToast(maxWarning, 'info');
    }
  }, [resolveLiveProduct, commitCart, showToast]);

  const clearCart = useCallback(() => {
    commitCart([]);
  }, [commitCart]);

  // Wishlist Operations
  const isInWishlist = useCallback((productOrId) => {
    if (!productOrId) return false;
    return wishlist.some((wId) => {
      if (String(wId) === String(typeof productOrId === 'string' ? productOrId : productOrId.id)) return true;
      const liveW = products.find((p) => isSameProduct(p, wId));
      return liveW ? isSameProduct(liveW, productOrId) : false;
    });
  }, [wishlist, products]);

  const toggleWishlist = useCallback((productOrId) => {
    const live = resolveLiveProduct(productOrId);
    const canonicalId = live ? live.id : (typeof productOrId === 'string' ? productOrId : productOrId?.id);
    if (!canonicalId) return;

    const prev = wishlistRef.current;
    const exists = prev.some((wId) => isSameProduct(live || canonicalId, wId));
    if (exists) {
      const next = prev.filter((wId) => !isSameProduct(live || canonicalId, wId));
      commitWishlist(next);
      showToast(`Removed "${live ? live.name : 'Saree'}" from favourites.`, 'info');
    } else {
      const next = [...prev, canonicalId];
      commitWishlist(next);
      showToast(`Saved "${live ? live.name : 'Saree'}" to favourites.`, 'success');
    }
  }, [resolveLiveProduct, commitWishlist, showToast]);

  const moveCartItemToWishlist = useCallback((productOrId) => {
    const live = resolveLiveProduct(productOrId);
    const canonicalId = live ? live.id : (typeof productOrId === 'string' ? productOrId : productOrId?.id);
    if (!canonicalId) return;

    const prevWish = wishlistRef.current;
    if (!prevWish.some((wId) => isSameProduct(live || canonicalId, wId))) {
      commitWishlist([...prevWish, canonicalId]);
    }

    const nextCart = cartRef.current.filter((i) => !isSameProduct(i.product, productOrId));
    commitCart(nextCart);

    showToast(`Moved "${live?.name || 'Saree'}" to your saved favourites.`, 'success');
  }, [resolveLiveProduct, commitWishlist, commitCart, showToast]);

  // Derived canonical wishlist products (100% matches header badge count!)
  const wishlistEntries = useMemo(() => {
    return wishlist
      .map((wId) => {
        const product = products.find((p) => isSameProduct(p, wId));
        if (!product) return null;
        const isPublished = !product.status || product.status === 'published';
        return {
          product,
          isUnavailable: !isPublished
        };
      })
      .filter(Boolean);
  }, [wishlist, products]);

  // Financial Calculations (driven by store settings & live prices)
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      if (item.isUnavailable) return sum;
      const price = getNormalizedPrice(item.product);
      return sum + price * item.quantity;
    }, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    if (!appliedCoupon || subtotal <= 0) return 0;
    const minAmount = Number(appliedCoupon.minOrderAmount || 0);
    if (subtotal < minAmount) return 0;
    const dtype = String(appliedCoupon.type || appliedCoupon.discountType || 'percentage').toLowerCase();
    const dval = Number(appliedCoupon.value ?? appliedCoupon.discountValue ?? appliedCoupon.percent ?? 0);
    if (dtype === 'fixed' || dtype === 'flat') {
      return Math.min(subtotal, dval);
    }
    return Math.round((subtotal * dval) / 100);
  }, [appliedCoupon, subtotal]);

  const shippingThreshold = storeSettings.freeShippingThreshold;
  const isFreeShipping = subtotal >= shippingThreshold || subtotal === 0;
  const shippingFee = isFreeShipping ? 0 : storeSettings.standardShippingFee;
  const giftWrapFee = giftWrap && cart.length > 0 ? storeSettings.giftWrapFee : 0;
  const total = Math.max(0, subtotal - discountAmount + shippingFee + giftWrapFee);
  const remainingForFreeShipping = Math.max(0, shippingThreshold - subtotal);

  const hasUnavailableCartItems = useMemo(
    () => cart.some((item) => item.isUnavailable || item.isOutOfStock),
    [cart]
  );

  const applyCouponCode = async (code) => {
    const clean = String(code || '').trim().toUpperCase();
    if (!clean) {
      return { success: false, message: 'Please enter a promo code.' };
    }

    try {
      const promos = await storeService.getPromotions();
      const match = promos.find((p) => p.code?.toUpperCase() === clean && p.isActive);
      if (match) {
        const dtype = String(match.discountType || match.type || 'percentage').toLowerCase();
        const dval = Number(match.discountValue ?? match.value ?? 0);
        const minOrder = Number(match.minOrderAmount || 0);

        if (minOrder > 0 && subtotal < minOrder) {
          const msg = `Promo code ${match.code} requires a minimum bag subtotal of ₹${minOrder.toLocaleString('en-IN')}.`;
          showToast(msg, 'info');
          return { success: false, message: msg };
        }

        const percent = dtype === 'percentage' ? dval : Math.round((dval / (subtotal || 1)) * 100);
        setAppliedCoupon({
          code: match.code,
          percent,
          value: dval,
          type: dtype,
          minOrderAmount: minOrder,
          label: match.label || match.name || `${dval}${dtype === 'percentage' ? '%' : '₹'} Off`
        });
        showToast(`Coupon ${match.code} applied!`, 'success');
        return {
          success: true,
          message: dtype === 'percentage' ? `${dval}% discount applied!` : `₹${dval} discount applied!`
        };
      }
    } catch (e) {
      console.warn('Coupon lookup failed:', e);
    }

    if (clean === 'WOVEN10') {
      setAppliedCoupon({ code: 'WOVEN10', percent: 10, value: 10, type: 'percentage', label: '10% Handcrafted Welcome Discount' });
      showToast('Coupon WOVEN10 applied: 10% Off!', 'success');
      return { success: true, message: '10% discount applied!' };
    }
    if (clean === 'RODHE15') {
      setAppliedCoupon({ code: 'RODHE15', percent: 15, value: 15, type: 'percentage', label: '15% Festive Saree Offer' });
      showToast('Coupon RODHE15 applied: 15% Off!', 'success');
      return { success: true, message: '15% discount applied!' };
    }

    showToast('Invalid or expired promo code.', 'error');
    return { success: false, message: 'Invalid or expired promo code.' };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    showToast('Promo code removed.', 'info');
  };

  // Navigation Helper
  const navigateTo = useCallback((page, productId = null) => {
    setCurrentPage(page);
    if (productId) {
      setSelectedProductId(productId);
    }
    try {
      if (typeof window !== 'undefined') {
        if (page === 'admin') {
          if (!window.location.hash.includes('admin')) {
            window.location.hash = 'admin';
          }
        } else if (page === 'shop' || page === 'collections') {
          if (!window.location.hash.includes('collections') && !window.location.hash.includes('shop')) {
            window.location.hash = 'collections';
          }
        } else if (page === 'product' && productId) {
          window.location.hash = `product/${productId}`;
        } else if (page === 'story') {
          window.location.hash = 'story';
        } else if (page === 'contact') {
          window.location.hash = 'contact';
        } else if (page === 'policies') {
          window.location.hash = productId ? `policies-${productId}` : 'policies';
        } else if (page === 'home') {
          let newUrl = window.location.pathname;
          if (window.location.search) {
            const searchParams = new URLSearchParams(window.location.search);
            searchParams.delete('page');
            searchParams.delete('product');
            searchParams.delete('craft');
            const remaining = searchParams.toString();
            if (remaining) {
              newUrl += `?${remaining}`;
            }
          }
          history.replaceState(null, '', newUrl);
        }
      }
    } catch {}
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const resetFilters = () => {
    setSelectedCraft('all');
    setSelectedColor('all');
    setSelectedFabric('all');
    setHasCustomPriceCap(false);
    setPriceMax(catalogMaxPrice);
    setPriceRangeFilter(null);
    setInStockOnly(false);
    setSortBy('featured');
    setSearchQuery('');
  };

  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);
  const wishlistCount = wishlistEntries.length;

  return (
    <ShopContext.Provider
      value={{
        PRODUCTS: products,
        products,
        isProductsLoading,
        refreshProducts,
        storeSettings,
        catalogMaxPrice,
        currentPage,
        selectedProductId,
        navigateTo,
        hasIntroPlayed,
        setHasIntroPlayed,
        cart,
        cartCount,
        hasUnavailableCartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        moveCartItemToWishlist,
        subtotal,
        discountAmount,
        appliedCoupon,
        applyCouponCode,
        removeCoupon,
        shippingThreshold,
        isFreeShipping,
        shippingFee,
        giftWrap,
        setGiftWrap,
        giftWrapFee,
        total,
        remainingForFreeShipping,
        wishlist,
        wishlistEntries,
        wishlistCount,
        toggleWishlist,
        isInWishlist,
        isMobileMenuOpen,
        setIsMobileMenuOpen,
        isCartOpen,
        setIsCartOpen,
        isWishlistOpen,
        setIsWishlistOpen,
        isSearchOpen,
        setIsSearchOpen,
        isAuthOpen,
        setIsAuthOpen,
        isCheckoutOpen,
        setIsCheckoutOpen,
        isTrackOrderOpen,
        setIsTrackOrderOpen,
        quickViewProduct,
        setQuickViewProduct,
        closeAllOverlays,
        patronUser,
        isCustomerAuthLoading,
        customerAddresses,
        selectedAddressId,
        setSelectedAddressId,
        guestCheckoutDraft,
        saveGuestCheckoutDraft,
        signInCustomer,
        signUpCustomer,
        loginPatron,
        logoutPatron,
        updateCustomerProfile,
        saveCustomerAddress,
        setDefaultCustomerAddress,
        deleteCustomerAddress,
        selectedCraft,
        setSelectedCraft,
        selectedColor,
        setSelectedColor,
        selectedFabric,
        setSelectedFabric,
        priceMax,
        setPriceMax: handleSetPriceMax,
        priceRangeFilter,
        setPriceRangeFilter,
        inStockOnly,
        setInStockOnly,
        sortBy,
        setSortBy,
        searchQuery,
        setSearchQuery,
        resetFilters,
        toasts,
        showToast,
        removeToast
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
};
