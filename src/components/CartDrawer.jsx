import React, { useState } from 'react';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, Sparkles, Tag, Check } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const CartDrawer = () => {
  const {
    cart,
    cartCount,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    subtotal,
    discountAmount,
    appliedCoupon,
    applyCouponCode,
    removeCoupon,
    isFreeShipping,
    shippingFee,
    remainingForFreeShipping,
    giftWrap,
    setGiftWrap,
    giftWrapFee,
    total,
    setIsCheckoutOpen,
    navigateTo
  } = useShop();

  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');

  if (!isCartOpen) return null;

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    const res = applyCouponCode(couponInput);
    if (!res.success) {
      setCouponError(res.message);
    } else {
      setCouponError('');
      setCouponInput('');
    }
  };

  const handleCheckoutClick = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  return (
    <div className="drawer-backdrop" onClick={() => setIsCartOpen(false)}>
      <div
        className="drawer-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%'
        }}
      >
        {/* Drawer Header */}
        <div className="drawer-header">
          <div className="drawer-title">
            <ShoppingBag size={22} color="#B88D4A" />
            <span>Shopping Bag ({cartCount})</span>
          </div>
          <button
            className="drawer-close"
            onClick={() => setIsCartOpen(false)}
            aria-label="Close cart"
          >
            <X size={20} />
          </button>
        </div>

        {/* Free Shipping Calculation Banner */}
        <div
          style={{
            backgroundColor: '#F4ECE1',
            padding: '0.85rem 1.5rem',
            borderBottom: '1px solid rgba(184, 141, 74, 0.25)',
            fontSize: '0.82rem'
          }}
        >
          {isFreeShipping ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#4B3024', fontWeight: 600 }}>
              <Sparkles size={16} color="#B88D4A" />
              <span>You have unlocked Complimentary Express Shipping!</span>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', color: '#4B3024' }}>
                <span>Add <strong>₹{remainingForFreeShipping.toLocaleString('en-IN')}</strong> more for Free Shipping</span>
                <span style={{ fontWeight: 600 }}>{Math.round((subtotal / 2999) * 100)}%</span>
              </div>
              <div style={{ width: '100%', height: '5px', backgroundColor: 'rgba(75, 48, 36, 0.15)', borderRadius: '3px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${Math.min(100, (subtotal / 2999) * 100)}%`,
                    height: '100%',
                    backgroundColor: '#B88D4A',
                    transition: 'width 0.4s ease'
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Cart Item List / Empty State */}
        <div
          style={{
            flexGrow: 1,
            overflowY: 'auto',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
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
                padding: '2rem'
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: '#F4ECE1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.25rem',
                  color: '#B88D4A'
                }}
              >
                <ShoppingBag size={28} />
              </div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', color: '#4B3024', marginBottom: '0.5rem' }}>
                Your Bag is Empty
              </h3>
              <p style={{ fontSize: '0.88rem', color: '#8F7263', marginBottom: '1.5rem', maxWidth: '280px' }}>
                Every RODHE drape is a limited handcrafted piece. Discover our nature-inspired collections.
              </p>
              <button
                onClick={() => {
                  setIsCartOpen(false);
                  navigateTo('shop');
                }}
                className="btn btn-primary"
              >
                Discover Sarees
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product.id}
                style={{
                  display: 'flex',
                  gap: '1rem',
                  paddingBottom: '1.25rem',
                  borderBottom: '1px solid rgba(75, 48, 36, 0.08)'
                }}
              >
                {/* Item Thumbnail */}
                <div
                  style={{
                    width: '85px',
                    height: '110px',
                    flexShrink: 0,
                    overflow: 'hidden',
                    backgroundColor: '#F4ECE1',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    setIsCartOpen(false);
                    navigateTo('product', item.product.id);
                  }}
                >
                  <img
                    src={item.product.primaryImage}
                    alt={item.product.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>

                {/* Details */}
                <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h4
                      style={{
                        fontFamily: 'var(--font-serif)',
                        fontSize: '1.05rem',
                        fontWeight: 600,
                        color: '#4B3024',
                        cursor: 'pointer'
                      }}
                      onClick={() => {
                        setIsCartOpen(false);
                        navigateTo('product', item.product.id);
                      }}
                    >
                      {item.product.name}
                    </h4>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      aria-label="Remove item"
                      style={{ color: '#8F7263', padding: '0.2rem' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#C98278')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#8F7263')}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <span style={{ fontSize: '0.74rem', color: '#B88D4A', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                    {item.product.craft}
                  </span>

                  <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {/* Quantity Selector */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        border: '1px solid rgba(75, 48, 36, 0.2)',
                        backgroundColor: '#FFFDF9'
                      }}
                    >
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        style={{ padding: '0.3rem 0.6rem', color: '#4B3024' }}
                        aria-label="Decrease quantity"
                      >
                        <Minus size={12} />
                      </button>
                      <span style={{ padding: '0 0.5rem', fontSize: '0.82rem', fontWeight: 600 }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        style={{ padding: '0.3rem 0.6rem', color: '#4B3024' }}
                        aria-label="Increase quantity"
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    {/* Item Price */}
                    <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', fontWeight: 600, color: '#4B3024' }}>
                      ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Order Summary & Checkout */}
        {cart.length > 0 && (
          <div
            style={{
              padding: '1.5rem',
              backgroundColor: '#FFFDF9',
              borderTop: '1px solid rgba(75, 48, 36, 0.12)'
            }}
          >
            {/* Gift Wrap Checkbox */}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                fontSize: '0.82rem',
                color: '#4B3024',
                marginBottom: '1rem',
                cursor: 'pointer'
              }}
            >
              <input
                type="checkbox"
                checked={giftWrap}
                onChange={(e) => setGiftWrap(e.target.checked)}
                style={{ accentColor: '#B88D4A' }}
              />
              <span>Add Rodhe Heritage Keepsake Gift Box (+₹150)</span>
            </label>

            {/* Promo Code Input */}
            <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <div style={{ position: 'relative', flexGrow: 1 }}>
                <input
                  type="text"
                  placeholder="Promo code (e.g. WOVEN10)"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    fontSize: '0.82rem',
                    border: '1px solid rgba(75, 48, 36, 0.2)',
                    backgroundColor: '#FAF6EE'
                  }}
                />
              </div>
              <button
                type="submit"
                style={{
                  padding: '0.65rem 1rem',
                  backgroundColor: '#4B3024',
                  color: '#FAF6EE',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase'
                }}
              >
                Apply
              </button>
            </form>

            {/* Applied Coupon Tag */}
            {appliedCoupon && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.45rem 0.75rem',
                  backgroundColor: 'rgba(184, 141, 74, 0.15)',
                  fontSize: '0.78rem',
                  color: '#4B3024',
                  marginBottom: '1rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Tag size={13} color="#B88D4A" />
                  <span><strong>{appliedCoupon.code}</strong> ({appliedCoupon.percent}% Off)</span>
                </div>
                <button onClick={removeCoupon} style={{ color: '#8F7263', fontSize: '0.75rem' }}>
                  Remove
                </button>
              </div>
            )}

            {/* Financial Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6F4E3E' }}>
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>

              {discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#C98278', fontWeight: 600 }}>
                  <span>Discount ({appliedCoupon?.code})</span>
                  <span>-₹{discountAmount.toLocaleString('en-IN')}</span>
                </div>
              )}

              {giftWrap && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6F4E3E' }}>
                  <span>Heritage Gift Box</span>
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
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  fontFamily: 'var(--font-serif)',
                  color: '#4B3024',
                  borderTop: '1px solid rgba(75, 48, 36, 0.12)',
                  paddingTop: '0.75rem',
                  marginTop: '0.25rem'
                }}
              >
                <span>Total</span>
                <span>₹{total.toLocaleString('en-IN')}</span>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#8F7263' }}>
                Inclusive of all taxes & insurance
              </span>
            </div>

            {/* Checkout Action Button */}
            <button
              onClick={handleCheckoutClick}
              className="btn btn-primary"
              style={{ width: '100%', padding: '1.1rem' }}
            >
              <span>Proceed to Checkout</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
