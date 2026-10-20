import React from 'react';
import { X, Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const WishlistDrawer = () => {
  const {
    wishlist,
    wishlistCount,
    isWishlistOpen,
    setIsWishlistOpen,
    toggleWishlist,
    addToCart,
    PRODUCTS,
    navigateTo
  } = useShop();

  if (!isWishlistOpen) return null;

  const wishlistProducts = PRODUCTS.filter((p) => wishlist.includes(p.id));

  return (
    <div className="drawer-backdrop" onClick={() => setIsWishlistOpen(false)}>
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
            <Heart size={22} color="#C98278" fill="#C98278" />
            <span>Saved Drapes ({wishlistCount})</span>
          </div>
          <button
            className="drawer-close"
            onClick={() => setIsWishlistOpen(false)}
            aria-label="Close wishlist"
          >
            <X size={20} />
          </button>
        </div>

        {/* Wishlist Items List */}
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
          {wishlistProducts.length === 0 ? (
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
                  color: '#C98278'
                }}
              >
                <Heart size={28} />
              </div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', color: '#4B3024', marginBottom: '0.5rem' }}>
                Your Wishlist is Empty
              </h3>
              <p style={{ fontSize: '0.88rem', color: '#8F7263', marginBottom: '1.5rem', maxWidth: '280px' }}>
                Save your favourite sarees here while exploring our handcrafted collections.
              </p>
              <button
                onClick={() => {
                  setIsWishlistOpen(false);
                  navigateTo('shop');
                }}
                className="btn btn-primary"
              >
                Explore Sarees
              </button>
            </div>
          ) : (
            wishlistProducts.map((product) => (
              <div
                key={product.id}
                style={{
                  display: 'flex',
                  gap: '1rem',
                  paddingBottom: '1.25rem',
                  borderBottom: '1px solid rgba(75, 48, 36, 0.08)'
                }}
              >
                {/* Product Thumbnail */}
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
                    setIsWishlistOpen(false);
                    navigateTo('product', product.id);
                  }}
                >
                  <img
                    src={product.primaryImage}
                    alt={product.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>

                {/* Info & Actions */}
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
                        setIsWishlistOpen(false);
                        navigateTo('product', product.id);
                      }}
                    >
                      {product.name}
                    </h4>
                    <button
                      onClick={() => toggleWishlist(product.id)}
                      aria-label="Remove from wishlist"
                      style={{ color: '#8F7263', padding: '0.2rem' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#C98278')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#8F7263')}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <span style={{ fontSize: '0.74rem', color: '#B88D4A', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                    {product.craft}
                  </span>

                  <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', fontWeight: 600, color: '#4B3024' }}>
                      ₹{product.price.toLocaleString('en-IN')}
                    </span>

                    <button
                      onClick={() => {
                        addToCart(product, 1, true);
                        toggleWishlist(product.id);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.45rem 0.85rem',
                        backgroundColor: '#4B3024',
                        color: '#FAF6EE',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase'
                      }}
                    >
                      <ShoppingBag size={13} />
                      <span>Move to Bag</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
