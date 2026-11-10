import React, { useEffect } from 'react';
import { X, Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const WishlistDrawer = () => {
  const {
    wishlistEntries,
    wishlistCount,
    isWishlistOpen,
    setIsWishlistOpen,
    toggleWishlist,
    addToCart,
    navigateTo
  } = useShop();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isWishlistOpen) {
        setIsWishlistOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isWishlistOpen, setIsWishlistOpen]);

  if (!isWishlistOpen) return null;

  const handleMoveToBag = (product) => {
    const added = addToCart(product, 1, true);
    if (added) {
      toggleWishlist(product.id);
    }
  };

  return (
    <div
      className="drawer-backdrop"
      onClick={() => setIsWishlistOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Saved Favourites"
    >
      <div
        className="drawer-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pinned Drawer Header */}
        <div className="drawer-header">
          <div className="drawer-title">
            <Heart size={20} color="#C98278" fill="#C98278" />
            <span>Saved Favourites ({wishlistCount})</span>
          </div>
          <button
            className="drawer-close"
            onClick={() => setIsWishlistOpen(false)}
            aria-label="Close favourites"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Wishlist Items List */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            padding: 'clamp(1rem, 3vw, 1.5rem)',
            paddingBottom: 'calc(clamp(1rem, 3vw, 1.5rem) + env(safe-area-inset-bottom, 0px))',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.15rem'
          }}
        >
          {wishlistEntries.length === 0 ? (
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
                  border: '1px solid rgba(201, 130, 120, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.25rem',
                  color: '#C98278'
                }}
              >
                <Heart size={28} />
              </div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', color: '#4B3024', marginBottom: '0.5rem' }}>
                Your Wishlist is Empty
              </h3>
              <p style={{ fontSize: '0.88rem', color: '#8F7263', marginBottom: '1.5rem', maxWidth: '280px', lineHeight: 1.6 }}>
                Tap the heart icon on any saree while browsing to keep your favourite weaves close at hand.
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
            wishlistEntries.map(({ product, isUnavailable }) => {
              const stockLimit = typeof product.stockCount === 'number' ? product.stockCount : Number(product.stock_count ?? 10);
              const isOutOfStock = !isUnavailable && (!Boolean(product.inStock ?? product.in_stock ?? true) || stockLimit <= 0);
              const unitPrice = Number(product.price ?? product.sellingPrice ?? product.selling_price ?? 0) || 0;

              return (
                <div
                  key={product.id}
                  style={{
                    display: 'flex',
                    gap: '0.85rem',
                    paddingBottom: '1.15rem',
                    borderBottom: '1px solid rgba(75, 48, 36, 0.08)',
                    opacity: isUnavailable || isOutOfStock ? 0.72 : 1
                  }}
                >
                  {/* Product Thumbnail */}
                  <div
                    style={{
                      width: 'clamp(70px, 18vw, 85px)',
                      height: 'clamp(92px, 24vw, 110px)',
                      flexShrink: 0,
                      overflow: 'hidden',
                      backgroundColor: '#F4ECE1',
                      cursor: isUnavailable ? 'default' : 'pointer',
                      borderRadius: '2px'
                    }}
                    onClick={() => {
                      if (!isUnavailable) {
                        setIsWishlistOpen(false);
                        navigateTo('product', product.id);
                      }
                    }}
                  >
                    <img
                      src={product.primaryImage || product.primary_image || '/assets/products/saree_ivory_mulmul.jpg'}
                      alt={product.name || 'Saree'}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '/assets/products/saree_ivory_mulmul.jpg';
                      }}
                    />
                  </div>

                  {/* Info & Actions */}
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
                            setIsWishlistOpen(false);
                            navigateTo('product', product.id);
                          }
                        }}
                      >
                        {product.name}
                      </h4>
                      <button
                        onClick={() => toggleWishlist(product.id)}
                        aria-label={`Remove ${product.name} from favourites`}
                        title="Remove from favourites"
                        style={{ color: '#8F7263', padding: '0.35rem', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#C98278')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#8F7263')}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <span style={{ fontSize: '0.72rem', color: '#B88D4A', fontWeight: 600, textTransform: 'uppercase', margin: '0.25rem 0 0.45rem' }}>
                      {product.craft || 'Handloom'}
                    </span>

                    {isUnavailable && (
                      <div style={{ fontSize: '0.74rem', color: '#8A2A20', fontWeight: 600, marginBottom: '0.35rem' }}>
                        Currently unavailable in catalog
                      </div>
                    )}

                    <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', fontWeight: 600, color: '#4B3024' }}>
                        ₹{unitPrice.toLocaleString('en-IN')}
                      </span>

                      {!isUnavailable && (
                        <button
                          onClick={() => handleMoveToBag(product)}
                          disabled={isOutOfStock}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.45rem 0.85rem',
                            backgroundColor: isOutOfStock ? '#C2B8B0' : '#4B3024',
                            color: '#FAF6EE',
                            fontSize: '0.74rem',
                            fontWeight: 600,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            border: 'none',
                            cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                            minHeight: '38px'
                          }}
                        >
                          <ShoppingBag size={13} />
                          <span>{isOutOfStock ? 'Out of Stock' : 'Move to Bag'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
