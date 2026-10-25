import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, Sparkles, Tag, Check, MessageCircle } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { storeService } from '../services/storeService';

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

  const handleWhatsAppOrder = async () => {
    const settings = await storeService.getSettings();
    const phone = (settings?.whatsappNumber || '919490658858').replace(/[^0-9]/g, '');

    const itemsText = cart.map((item, idx) => {
      const p = item.product;
      const unit = Number(p.price ?? p.sellingPrice ?? p.selling_price ?? 990) || 990;
      const itemSubtotal = unit * item.quantity;
      return `${idx + 1}. ${p.name}\n   SKU: ${p.sku || 'RODHE-SAR'}\n   Qty: ${item.quantity} × ₹${unit.toLocaleString('en-IN')} = ₹${itemSubtotal.toLocaleString('en-IN')}`;
    }).join('\n\n');

    let summaryText = `\n\n-------------------------\nBag Subtotal: ₹${subtotal.toLocaleString('en-IN')}`;
    if (discountAmount > 0) {
      summaryText += `\nCoupon (${appliedCoupon?.code}): -₹${discountAmount.toLocaleString('en-IN')}`;
    }
    if (giftWrap) {
      summaryText += `\nHeritage Gift Box: +₹${giftWrapFee}`;
    }
    summaryText += `\nShipping: ${isFreeShipping ? 'FREE' : `₹${shippingFee}`}`;
    summaryText += `\nTotal: ₹${total.toLocaleString('en-IN')}`;

    const fullMessage = `Namaste RODHE Team,\n\nI would like to place an order enquiry for the following handcrafted saree(s):\n\n${itemsText}${summaryText}\n\nPlease confirm stock availability and share payment/delivery details. Thank you!`;

    const encoded = encodeURIComponent(fullMessage);
    window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');
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
            padding: 'clamp(1rem, 3vw, 1.5rem)',
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
                padding: '2rem 1rem'
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
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', color: '#4B3024', marginBottom: '0.5rem' }}>
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
                  gap: '0.85rem',
                  paddingBottom: '1.15rem',
                  borderBottom: '1px solid rgba(75, 48, 36, 0.08)'
                }}
              >
                {/* Item Thumbnail */}
                <div
                  style={{
                    width: 'clamp(70px, 18vw, 85px)',
                    height: 'clamp(92px, 24vw, 110px)',
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
                    src={item.product.primaryImage || item.product.primary_image || '/assets/products/saree_ivory_mulmul.jpg'}
                    alt={item.product.name || 'Saree'}
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
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: '#4B3024',
                        cursor: 'pointer',
                        lineHeight: 1.25,
                        margin: 0
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
                      style={{ color: '#8F7263', padding: '0.35rem', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#C98278')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#8F7263')}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <span style={{ fontSize: '0.72rem', color: '#B88D4A', fontWeight: 600, textTransform: 'uppercase', margin: '0.25rem 0 0.5rem' }}>
                    {item.product.craft || 'Handloom'}
                  </span>

                  <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
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
                        style={{ padding: '0.35rem 0.65rem', color: '#4B3024', background: 'none', border: 'none', cursor: 'pointer' }}
                        aria-label="Decrease quantity"
                      >
                        <Minus size={12} />
                      </button>
                      <span style={{ padding: '0 0.5rem', fontSize: '0.82rem', fontWeight: 600 }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        style={{ padding: '0.35rem 0.65rem', color: '#4B3024', background: 'none', border: 'none', cursor: 'pointer' }}
                        aria-label="Increase quantity"
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    {/* Item Price */}
                    <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', fontWeight: 600, color: '#4B3024' }}>
                      ₹{((Number(item.product.price ?? item.product.sellingPrice ?? item.product.selling_price ?? 990) || 990) * item.quantity).toLocaleString('en-IN')}
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
              padding: 'clamp(1rem, 3vw, 1.35rem)',
              paddingBottom: 'calc(clamp(1rem, 3vw, 1.35rem) + env(safe-area-inset-bottom, 0px))',
              backgroundColor: '#FFFDF9',
              borderTop: '1px solid rgba(75, 48, 36, 0.12)'
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
                marginBottom: '0.85rem',
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
            <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: '0.5rem', marginBottom: couponError ? '0.35rem' : '1rem' }}>
              <div style={{ position: 'relative', flexGrow: 1 }}>
                <input
                  type="text"
                  placeholder="Promo code (e.g. WOVEN10)"
                  value={couponInput}
                  onChange={(e) => {
                    setCouponInput(e.target.value);
                    if (couponError) setCouponError('');
                  }}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    fontSize: '0.82rem',
                    border: '1px solid rgba(75, 48, 36, 0.2)',
                    backgroundColor: '#FAF6EE'
                  }}
                />
              </div>
              <button
                type="submit"
                style={{
                  padding: '0.6rem 0.9rem',
                  backgroundColor: '#4B3024',
                  color: '#FAF6EE',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  border: 'none',
                  cursor: 'pointer',
                  minHeight: '40px'
                }}
              >
                Apply
              </button>
            </form>
            {couponError && (
              <p style={{ color: '#C98278', fontSize: '0.74rem', margin: '0 0 0.85rem 0' }}>{couponError}</p>
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
                  marginBottom: '0.85rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Tag size={13} color="#B88D4A" />
                  <span><strong>{appliedCoupon.code}</strong> ({appliedCoupon.percent}% Off)</span>
                </div>
                <button onClick={removeCoupon} style={{ color: '#8F7263', fontSize: '0.74rem', background: 'none', border: 'none', cursor: 'pointer' }}>
                  Remove
                </button>
              </div>
            )}

            {/* Financial Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.82rem', marginBottom: '1rem' }}>
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
                  fontSize: '1.2rem',
                  fontWeight: 600,
                  fontFamily: 'var(--font-serif)',
                  color: '#4B3024',
                  borderTop: '1px solid rgba(75, 48, 36, 0.12)',
                  paddingTop: '0.65rem',
                  marginTop: '0.2rem'
                }}
              >
                <span>Total</span>
                <span>₹{total.toLocaleString('en-IN')}</span>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#8F7263' }}>
                Inclusive of all taxes & insurance
              </span>
            </div>

            {/* Dual Checkout Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <button
                onClick={handleWhatsAppOrder}
                style={{
                  width: '100%',
                  padding: '0.95rem',
                  minHeight: '48px',
                  backgroundColor: '#525B3A',
                  color: '#FAF6EE',
                  border: 'none',
                  borderRadius: '3px',
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.55rem',
                  cursor: 'pointer',
                  boxShadow: '0 8px 20px rgba(82, 91, 58, 0.25)',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#3E462B')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#525B3A')}
              >
                <MessageCircle size={18} color="#D4AC68" />
                <span>Order via WhatsApp</span>
              </button>

              <button
                onClick={handleCheckoutClick}
                className="btn btn-outline"
                style={{ width: '100%', padding: '0.75rem', minHeight: '42px', fontSize: '0.8rem' }}
              >
                <span>Pay Online (UPI / Card / NetBanking)</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
