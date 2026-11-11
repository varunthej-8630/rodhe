import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  ArrowRight,
  Sparkles,
  Tag,
  Heart,
  AlertTriangle
} from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const CartDrawer = () => {
  const {
    cart,
    cartCount,
    hasUnavailableCartItems,
    isCartOpen,
    setIsCartOpen,
    setIsWishlistOpen,
    wishlistCount,
    updateQuantity,
    removeFromCart,
    moveCartItemToWishlist,
    subtotal,
    discountAmount,
    appliedCoupon,
    applyCouponCode,
    removeCoupon,
    shippingThreshold,
    isFreeShipping,
    shippingFee,
    remainingForFreeShipping,
    giftWrap,
    setGiftWrap,
    giftWrapFee,
    total,
    storeSettings,
    setIsCheckoutOpen,
    pendingUpiOrder,
    openPendingUpiOrder,
    clearPendingUpiOrder,
    navigateTo
  } = useShop();

  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isCartOpen) {
        setIsCartOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCartOpen, setIsCartOpen]);

  if (!isCartOpen) return null;

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponInput.trim() || isApplyingCoupon) return;
    setIsApplyingCoupon(true);
    setCouponError('');
    try {
      const res = await applyCouponCode(couponInput);
      if (!res?.success) {
        setCouponError(res?.message || 'Invalid or expired promo code.');
      } else {
        setCouponError('');
        setCouponInput('');
      }
    } catch {
      setCouponError('Unable to validate promo code right now.');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleProceedToCheckout = () => {
    if (cart.length === 0 || hasUnavailableCartItems) return;
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const shippingProgressPct = shippingThreshold > 0
    ? Math.min(100, Math.round((subtotal / shippingThreshold) * 100))
    : 100;

  return (
    <div
      className="drawer-backdrop"
      onClick={() => setIsCartOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Shopping Bag"
    >
      <div
        className="drawer-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pinned Drawer Header */}
        <div className="drawer-header">
          <div className="drawer-title">
            <ShoppingBag size={20} color="#B88D4A" />
            <span>Shopping Bag ({cartCount})</span>
          </div>
          <button
            className="drawer-close"
            onClick={() => setIsCartOpen(false)}
            aria-label="Close shopping bag"
          >
            <X size={20} />
          </button>
        </div>

        {/* Pending UPI Order Recovery Banner */}
        {pendingUpiOrder && pendingUpiOrder.paymentStatus !== 'PAID' && (
          <div
            style={{
              backgroundColor: 'rgba(184, 141, 74, 0.14)',
              borderBottom: '1px solid rgba(184, 141, 74, 0.35)',
              padding: '0.8rem 1.35rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              flexWrap: 'wrap',
              flexShrink: 0
            }}
          >
            <div style={{ fontSize: '0.78rem', color: '#4B3024', lineHeight: 1.4 }}>
              <strong>Pending UPI Order #{pendingUpiOrder.orderNumber}</strong>
              <span style={{ display: 'block', color: '#6F4E3E', fontSize: '0.73rem' }}>
                Amount: ₹{Number(pendingUpiOrder.grandTotal || 0).toLocaleString('en-IN')} • Status: {pendingUpiOrder.paymentStatus}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => openPendingUpiOrder(pendingUpiOrder)}
                className="btn btn-primary btn-sm"
                style={{ fontSize: '0.7rem', padding: '0.38rem 0.7rem', minHeight: '34px' }}
              >
                Resume Payment
              </button>
              <button
                type="button"
                onClick={clearPendingUpiOrder}
                aria-label="Dismiss pending order banner"
                style={{ background: 'none', border: 'none', color: '#8F7263', cursor: 'pointer', padding: '0.25rem' }}
              >
                <X size={15} />
              </button>
            </div>
          </div>
        )}

        {/* Free Shipping Banner (when cart has items) */}
        {cart.length > 0 && (
          <div
            style={{
              backgroundColor: '#F4ECE1',
              padding: '0.8rem 1.35rem',
              borderBottom: '1px solid rgba(184, 141, 74, 0.22)',
              fontSize: '0.82rem',
              flexShrink: 0
            }}
          >
            {isFreeShipping ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#4B3024', fontWeight: 600 }}>
                <Sparkles size={15} color="#B88D4A" style={{ flexShrink: 0 }} />
                <span>Complimentary Express Shipping unlocked!</span>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', color: '#4B3024' }}>
                  <span>
                    Add <strong>₹{remainingForFreeShipping.toLocaleString('en-IN')}</strong> more for Free Shipping
                  </span>
                  <span style={{ fontWeight: 600 }}>{shippingProgressPct}%</span>
                </div>
                <div style={{ width: '100%', height: '5px', backgroundColor: 'rgba(75, 48, 36, 0.14)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${shippingProgressPct}%`,
                      height: '100%',
                      backgroundColor: '#B88D4A',
                      transition: 'width 0.35s ease'
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Unavailable Warning Banner */}
        {hasUnavailableCartItems && (
          <div
            style={{
              backgroundColor: 'rgba(201, 130, 120, 0.14)',
              borderBottom: '1px solid rgba(201, 130, 120, 0.4)',
              padding: '0.75rem 1.35rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              fontSize: '0.8rem',
              color: '#8A2A20',
              flexShrink: 0
            }}
          >
            <AlertTriangle size={16} style={{ flexShrink: 0 }} />
            <span>One or more sarees in your bag are currently unavailable. Please remove them to continue checkout.</span>
          </div>
        )}

        {/* Scrollable Cart Items List / Empty State */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            WebkitOverflowScrolling: 'touch',
            padding: 'clamp(1rem, 3vw, 1.4rem)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.15rem'
          }}
        >
          {cart.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                textAlign: 'center',
                padding: '2rem 1rem'
              }}
            >
              <div
                style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '50%',
                  backgroundColor: '#F4ECE1',
                  border: '1px solid rgba(184, 141, 74, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.25rem',
                  color: '#B88D4A'
                }}
              >
                <ShoppingBag size={28} />
              </div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.55rem', color: '#4B3024', marginBottom: '0.5rem' }}>
                Your Bag is Empty
              </h3>
              <p style={{ fontSize: '0.88rem', color: '#8F7263', marginBottom: '1.5rem', maxWidth: '280px', lineHeight: 1.6 }}>
                Every RODHE drape is woven in small artisanal batches. Explore our botanical-dyed cottons and silks.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', width: '100%', maxWidth: '240px' }}>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    navigateTo('shop');
                  }}
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                >
                  Discover Sarees
                </button>
                {wishlistCount > 0 && (
                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      setIsWishlistOpen(true);
                    }}
                    className="btn btn-outline btn-sm"
                    style={{ width: '100%' }}
                  >
                    <Heart size={14} color="#C98278" />
                    <span>View Favourites ({wishlistCount})</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            cart.map((item) => {
              const p = item.product || item;
              const unitPrice = Number(p.price ?? p.sellingPrice ?? p.selling_price ?? 0) || 0;
              const stockLimit = typeof p.stockCount === 'number' ? p.stockCount : Number(p.stock_count ?? 10);
              const isUnavailable = Boolean(item.isUnavailable || item.isOutOfStock || (p.status && p.status !== 'published') || !p.inStock || stockLimit <= 0);
              const atMaxStock = stockLimit > 0 && item.quantity >= stockLimit;

              return (
                <div
                  key={p.id || p.sku}
                  style={{
                    display: 'flex',
                    gap: '0.85rem',
                    paddingBottom: '1.15rem',
                    borderBottom: '1px solid rgba(75, 48, 36, 0.08)',
                    opacity: isUnavailable ? 0.72 : 1
                  }}
                >
                  {/* Item Thumbnail */}
                  <div
                    style={{
                      width: 'clamp(72px, 18vw, 86px)',
                      height: 'clamp(94px, 24vw, 112px)',
                      flexShrink: 0,
                      overflow: 'hidden',
                      backgroundColor: '#F4ECE1',
                      cursor: isUnavailable ? 'default' : 'pointer',
                      borderRadius: '2px'
                    }}
                    onClick={() => {
                      if (!isUnavailable) {
                        setIsCartOpen(false);
                        navigateTo('product', p.id);
                      }
                    }}
                  >
                    <img
                      src={p.primaryImage || p.primary_image || '/assets/products/saree_ivory_mulmul.jpg'}
                      alt={p.name || 'Saree'}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '/assets/products/saree_ivory_mulmul.jpg';
                      }}
                    />
                  </div>

                  {/* Details */}
                  <div style={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.35rem' }}>
                      <h4
                        style={{
                          fontFamily: 'var(--font-serif)',
                          fontSize: '1.02rem',
                          fontWeight: 600,
                          color: '#4B3024',
                          cursor: isUnavailable ? 'default' : 'pointer',
                          lineHeight: 1.25,
                          margin: 0
                        }}
                        onClick={() => {
                          if (!isUnavailable) {
                            setIsCartOpen(false);
                            navigateTo('product', p.id);
                          }
                        }}
                      >
                        {p.name}
                      </h4>
                      <button
                        onClick={() => removeFromCart(p)}
                        aria-label={`Remove ${p.name} from bag`}
                        title="Remove from bag"
                        style={{
                          color: '#8F7263',
                          padding: '0.3rem',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          flexShrink: 0,
                          minWidth: '30px',
                          minHeight: '30px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#C98278')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#8F7263')}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', margin: '0.25rem 0 0.4rem' }}>
                      <span style={{ fontSize: '0.7rem', color: '#B88D4A', fontWeight: 600, textTransform: 'uppercase' }}>
                        {p.craft || 'Handloom'}
                      </span>
                      {p.sku && (
                        <span style={{ fontSize: '0.68rem', color: '#8F7263' }}>• SKU: {p.sku}</span>
                      )}
                    </div>

                    {isUnavailable ? (
                      <div style={{ fontSize: '0.75rem', color: '#8A2A20', fontWeight: 600, marginBottom: '0.4rem' }}>
                        {item.isUnavailable ? 'No longer available in catalog' : 'Currently out of stock'}
                      </div>
                    ) : (
                      stockLimit > 0 && stockLimit <= 5 && (
                        <div style={{ fontSize: '0.72rem', color: '#B88D4A', fontWeight: 600, marginBottom: '0.35rem' }}>
                          Only {stockLimit} piece{stockLimit === 1 ? '' : 's'} remaining
                        </div>
                      )
                    )}

                    <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {/* Quantity Controls (Minimum 1, capped at stock) */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          border: '1px solid rgba(75, 48, 36, 0.22)',
                          backgroundColor: '#FFFDF9'
                        }}
                      >
                        <button
                          onClick={() => updateQuantity(p, item.quantity - 1)}
                          disabled={item.quantity <= 1 || isUnavailable}
                          style={{
                            padding: '0.35rem 0.6rem',
                            color: '#4B3024',
                            background: 'none',
                            border: 'none',
                            cursor: item.quantity <= 1 || isUnavailable ? 'not-allowed' : 'pointer',
                            opacity: item.quantity <= 1 || isUnavailable ? 0.35 : 1,
                            minHeight: '32px'
                          }}
                          aria-label="Decrease quantity"
                        >
                          <Minus size={12} />
                        </button>
                        <span style={{ padding: '0 0.55rem', fontSize: '0.82rem', fontWeight: 600, minWidth: '24px', textAlign: 'center' }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(p, item.quantity + 1)}
                          disabled={atMaxStock || isUnavailable}
                          style={{
                            padding: '0.35rem 0.6rem',
                            color: '#4B3024',
                            background: 'none',
                            border: 'none',
                            cursor: atMaxStock || isUnavailable ? 'not-allowed' : 'pointer',
                            opacity: atMaxStock || isUnavailable ? 0.35 : 1,
                            minHeight: '32px'
                          }}
                          aria-label="Increase quantity"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', fontWeight: 600, color: '#4B3024' }}>
                        ₹{(unitPrice * item.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>

                    {/* Save for Later action */}
                    {!item.isUnavailable && (
                      <button
                        onClick={() => moveCartItemToWishlist(p)}
                        style={{
                          alignSelf: 'flex-start',
                          marginTop: '0.45rem',
                          fontSize: '0.72rem',
                          color: '#8F7263',
                          textDecoration: 'underline',
                          textUnderlineOffset: '2px',
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer'
                        }}
                      >
                        Save for later
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Order Summary & Checkout Action */}
        {cart.length > 0 && (
          <div
            style={{
              padding: 'clamp(0.95rem, 3vw, 1.3rem)',
              paddingBottom: 'calc(clamp(0.95rem, 3vw, 1.3rem) + env(safe-area-inset-bottom, 0px))',
              backgroundColor: '#FFFDF9',
              borderTop: '1px solid rgba(75, 48, 36, 0.12)',
              flexShrink: 0
            }}
          >
            {/* Gift Wrap Checkbox */}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.55rem',
                fontSize: '0.8rem',
                color: '#4B3024',
                marginBottom: '0.75rem',
                cursor: 'pointer'
              }}
            >
              <input
                type="checkbox"
                checked={giftWrap}
                onChange={(e) => setGiftWrap(e.target.checked)}
                style={{ accentColor: '#B88D4A' }}
              />
              <span>Add RODHE Heritage Keepsake Gift Box (+₹{storeSettings.giftWrapFee})</span>
            </label>

            {/* Promo Code Input */}
            <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: '0.5rem', marginBottom: couponError ? '0.35rem' : '0.85rem' }}>
              <input
                type="text"
                placeholder="Promo code (e.g. WOVEN10)"
                value={couponInput}
                onChange={(e) => {
                  setCouponInput(e.target.value);
                  if (couponError) setCouponError('');
                }}
                style={{
                  flex: 1,
                  minWidth: 0,
                  padding: '0.55rem 0.75rem',
                  fontSize: '0.82rem',
                  border: '1px solid rgba(75, 48, 36, 0.2)',
                  backgroundColor: '#FAF6EE',
                  minHeight: '40px'
                }}
              />
              <button
                type="submit"
                disabled={isApplyingCoupon}
                style={{
                  padding: '0.55rem 0.9rem',
                  backgroundColor: '#4B3024',
                  color: '#FAF6EE',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  border: 'none',
                  cursor: isApplyingCoupon ? 'wait' : 'pointer',
                  minHeight: '40px',
                  flexShrink: 0
                }}
              >
                {isApplyingCoupon ? '...' : 'Apply'}
              </button>
            </form>
            {couponError && (
              <p style={{ color: '#8A2A20', fontSize: '0.74rem', margin: '0 0 0.75rem 0' }}>{couponError}</p>
            )}

            {/* Applied Coupon Tag */}
            {appliedCoupon && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.4rem 0.65rem',
                  backgroundColor: 'rgba(184, 141, 74, 0.15)',
                  fontSize: '0.76rem',
                  color: '#4B3024',
                  marginBottom: '0.75rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Tag size={13} color="#B88D4A" />
                  <span>
                    <strong>{appliedCoupon.code}</strong> ({appliedCoupon.type === 'fixed' || appliedCoupon.type === 'flat' ? `₹${appliedCoupon.value} Off` : `${appliedCoupon.percent}% Off`})
                  </span>
                </div>
                <button
                  onClick={removeCoupon}
                  style={{ color: '#8F7263', fontSize: '0.74rem', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Remove
                </button>
              </div>
            )}

            {/* Financial Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.82rem', marginBottom: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6F4E3E' }}>
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>

              {discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#525B3A', fontWeight: 600 }}>
                  <span>Discount ({appliedCoupon?.code})</span>
                  <span>-₹{discountAmount.toLocaleString('en-IN')}</span>
                </div>
              )}

              {giftWrap && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6F4E3E' }}>
                  <span>Heritage Keepsake Box</span>
                  <span>+₹{giftWrapFee}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6F4E3E' }}>
                <span>Shipping</span>
                <span>{isFreeShipping ? 'FREE' : `₹${shippingFee}`}</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '1.18rem',
                  fontWeight: 600,
                  fontFamily: 'var(--font-serif)',
                  color: '#4B3024',
                  borderTop: '1px solid rgba(75, 48, 36, 0.12)',
                  paddingTop: '0.6rem',
                  marginTop: '0.2rem'
                }}
              >
                <span>Estimated Total</span>
                <span>₹{total.toLocaleString('en-IN')}</span>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#8F7263' }}>
                Inclusive of all taxes • Confirmed personally via WhatsApp
              </span>
            </div>

            {/* Primary Checkout Button */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
              <button
                onClick={handleProceedToCheckout}
                disabled={hasUnavailableCartItems}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '0.9rem',
                  minHeight: '48px',
                  opacity: hasUnavailableCartItems ? 0.5 : 1,
                  cursor: hasUnavailableCartItems ? 'not-allowed' : 'pointer'
                }}
              >
                <span>Proceed to Checkout</span>
                <ArrowRight size={16} />
              </button>

              <button
                onClick={() => setIsCartOpen(false)}
                className="btn btn-outline"
                style={{ width: '100%', padding: '0.65rem', minHeight: '40px', fontSize: '0.78rem' }}
              >
                Continue Shopping
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
