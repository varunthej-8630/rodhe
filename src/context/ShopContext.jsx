import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { PRODUCTS as STATIC_PRODUCTS } from '../data/products';
import { storeService } from '../services/storeService';

const ShopContext = createContext();

export const ShopProvider = ({ children }) => {
  // Navigation / Page State
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedProductId, setSelectedProductId] = useState(null);

  // Dynamic Products loaded from storeService (with STATIC_PRODUCTS as resilient fallback)
  const [products, setProducts] = useState(STATIC_PRODUCTS);
  const [isProductsLoading, setIsProductsLoading] = useState(true);

  const refreshProducts = useCallback(async () => {
    try {
      const data = await storeService.getProducts({ publishedOnly: false });
      if (data && data.length > 0) {
        setProducts(data);
      }
    } catch (err) {
      console.warn('Failed to refresh products from storeService:', err);
    } finally {
      setIsProductsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProducts();
  }, [refreshProducts]);

  // Intro video session state
  const [hasIntroPlayed, setHasIntroPlayedState] = useState(() => {
    try {
      return sessionStorage.getItem('rodhe_intro_played') === 'true';
    } catch (e) {
      return false;
    }
  });

  const setHasIntroPlayed = (played) => {
    setHasIntroPlayedState(played);
    try {
      sessionStorage.setItem('rodhe_intro_played', played ? 'true' : 'false');
    } catch (e) {}
  };

  // Cart State with LocalStorage
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('rodhe_cart');
      return saved ? JSON.parse(saved) : [
        // Seed with 1 item for immediate delight or empty if clean
        { product: STATIC_PRODUCTS[0], quantity: 1 }
      ];
    } catch (e) {
      return [{ product: STATIC_PRODUCTS[0], quantity: 1 }];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('rodhe_cart', JSON.stringify(cart));
    } catch (e) {}
  }, [cart]);

  // Wishlist State with LocalStorage
  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem('rodhe_wishlist');
      return saved ? JSON.parse(saved) : [STATIC_PRODUCTS[1].id, STATIC_PRODUCTS[2].id];
    } catch (e) {
      return [STATIC_PRODUCTS[1].id];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('rodhe_wishlist', JSON.stringify(wishlist));
    } catch (e) {}
  }, [wishlist]);

  // Modals & Drawers
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  // Filters State
  const [selectedCraft, setSelectedCraft] = useState('all');
  const [selectedColor, setSelectedColor] = useState('all');
  const [selectedFabric, setSelectedFabric] = useState('all');
  const [priceMax, setPriceMax] = useState(8000);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState('featured');
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRangeFilter, setPriceRangeFilter] = useState(null); // 'under2k' | '2k-4k' | '4k-6k' | null

  // Discount & Gift Wrap
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [giftWrap, setGiftWrap] = useState(false);

  // Toast notifications
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Cart Operations
  const addToCart = (product, quantity = 1, openDrawer = true) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
    showToast(`Added "${product.name}" to your shopping bag.`);
    if (openDrawer) {
      setIsCartOpen(true);
    }
  };

  const removeFromCart = (productId) => {
    const item = cart.find((i) => i.product.id === productId);
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
    if (item) {
      showToast(`Removed "${item.product.name}" from bag.`, 'info');
    }
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  // Wishlist Operations
  const toggleWishlist = (productId) => {
    const product = products.find((p) => p.id === productId);
    setWishlist((prev) => {
      if (prev.includes(productId)) {
        showToast(`Removed "${product ? product.name : 'Item'}" from wishlist.`, 'info');
        return prev.filter((id) => id !== productId);
      } else {
        showToast(`Saved "${product ? product.name : 'Item'}" to wishlist.`, 'success');
        return [...prev, productId];
      }
    });
  };

  const isInWishlist = (productId) => wishlist.includes(productId);

  // Financial Calculations
  const subtotal = cart.reduce((sum, item) => {
    const price = item.product.sellingPrice || item.product.price || 0;
    return sum + price * item.quantity;
  }, 0);
  
  const discountAmount = appliedCoupon 
    ? (appliedCoupon.type === 'fixed' 
        ? Math.min(subtotal, appliedCoupon.value || 0) 
        : Math.round((subtotal * (appliedCoupon.percent || appliedCoupon.value || 0)) / 100))
    : 0;
  
  // Free shipping above ₹2999
  const shippingThreshold = 2999;
  const isFreeShipping = subtotal >= shippingThreshold || subtotal === 0;
  const shippingFee = isFreeShipping ? 0 : 199;
  const giftWrapFee = giftWrap ? 150 : 0;
  const total = Math.max(0, subtotal - discountAmount + shippingFee + giftWrapFee);
  const remainingForFreeShipping = Math.max(0, shippingThreshold - subtotal);

  const applyCouponCode = async (code) => {
    const clean = code.trim().toUpperCase();
    try {
      const promos = await storeService.getPromotions();
      const match = promos.find((p) => p.code?.toUpperCase() === clean && p.isActive);
      if (match) {
        const percent = match.type === 'percentage' ? match.value : Math.round((match.value / (subtotal || 1)) * 100);
        setAppliedCoupon({
          code: match.code,
          percent: percent,
          value: match.value,
          type: match.type,
          label: match.name || `${match.value}% Off Handcrafted Drapes`
        });
        showToast(`Coupon ${match.code} applied: ${match.name}!`, 'success');
        return { success: true, message: `${match.value}${match.type === 'percentage' ? '%' : '₹'} discount applied!` };
      }
    } catch (e) {
      console.warn('Coupon lookup failed:', e);
    }

    if (clean === 'WOVEN10') {
      setAppliedCoupon({ code: 'WOVEN10', percent: 10, value: 10, type: 'percentage', label: '10% Handcrafted Welcome Discount' });
      showToast('Coupon WOVEN10 applied: 10% Off your order!', 'success');
      return { success: true, message: '10% discount applied!' };
    }
    if (clean === 'RODHE15') {
      setAppliedCoupon({ code: 'RODHE15', percent: 15, value: 15, type: 'percentage', label: '15% Festive Saree Offer' });
      showToast('Coupon RODHE15 applied: 15% Off!', 'success');
      return { success: true, message: '15% discount applied!' };
    }
    showToast('Invalid coupon code. Try WOVEN10', 'error');
    return { success: false, message: 'Invalid or expired promo code.' };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    showToast('Promo code removed.', 'info');
  };

  // Navigation Helper
  const navigateTo = (page, productId = null) => {
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
        } else if (page === 'home') {
          if (window.location.hash) {
            history.replaceState(null, '', window.location.pathname + window.location.search);
          }
        }
      }
    } catch (e) {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetFilters = () => {
    setSelectedCraft('all');
    setSelectedColor('all');
    setSelectedFabric('all');
    setPriceMax(8000);
    setPriceRangeFilter(null);
    setInStockOnly(false);
    setSortBy('featured');
    setSearchQuery('');
  };

  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);
  const wishlistCount = wishlist.length;

  return (
    <ShopContext.Provider
      value={{
        PRODUCTS: products,
        products,
        isProductsLoading,
        refreshProducts,
        currentPage,
        selectedProductId,
        navigateTo,
        hasIntroPlayed,
        setHasIntroPlayed,
        cart,
        cartCount,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
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
        wishlistCount,
        toggleWishlist,
        isInWishlist,
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
        quickViewProduct,
        setQuickViewProduct,
        selectedCraft,
        setSelectedCraft,
        selectedColor,
        setSelectedColor,
        selectedFabric,
        setSelectedFabric,
        priceMax,
        setPriceMax,
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
