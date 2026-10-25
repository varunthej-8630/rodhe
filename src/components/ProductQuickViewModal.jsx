import React, { useState } from 'react';
import { X, Heart, ShoppingBag, Star, Check, ArrowRight } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const ProductQuickViewModal = () => {
  const {
    quickViewProduct,
    setQuickViewProduct,
    addToCart,
    toggleWishlist,
    isInWishlist,
    navigateTo
  } = useShop();

  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  if (!quickViewProduct) return null;

  const product = quickViewProduct;
  const isFavorited = isInWishlist(product.id);
  const primaryImage = product.primaryImage || product.primary_image || '/assets/products/saree_ivory_mulmul.jpg';
  const images = (Array.isArray(product.gallery) && product.gallery.length > 0)
    ? product.gallery
    : [primaryImage, product.secondaryImage || primaryImage].filter(Boolean);
  const unitPrice = Number(product.price ?? product.sellingPrice ?? product.selling_price ?? 990) || 990;
  const originalPrice = product.originalPrice ? (Number(product.originalPrice) || null) : (product.original_price ? (Number(product.original_price) || null) : null);

  const handleAddToCart = () => {
    addToCart(product, quantity, true);
    setQuickViewProduct(null);
  };

  const handleViewFullPage = () => {
    setQuickViewProduct(null);
    navigateTo('product', product.id);
  };

  return (
    <div className="modal-backdrop" onClick={() => setQuickViewProduct(null)}>
      <div
        className="quickview-modal-content"
        style={{
          width: 'min(900px, 94vw)',
          backgroundColor: '#FFFDF9',
          border: '1px solid rgba(184, 141, 74, 0.3)',
          boxShadow: '0 25px 60px rgba(42, 26, 19, 0.25)',
          overflowY: 'auto',
          animation: 'slideUp 0.3s ease',
          maxHeight: '90vh'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Gallery */}
        <div style={{ backgroundColor: '#F4ECE1', position: 'relative', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ flexGrow: 1, position: 'relative', minHeight: 'clamp(240px, 40vh, 420px)' }}>
            <img
              src={images[activeImageIndex] || primaryImage}
              alt={product.name || 'Handcrafted Saree'}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/assets/products/saree_ivory_mulmul.jpg';
              }}
            />
            {product.badge && (
              <span className="product-badge">
                {product.badge}
              </span>
            )}
          </div>

          {/* Thumbnail row */}
          {images.length > 1 && (
            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                padding: '0.75rem',
                backgroundColor: 'rgba(250, 246, 238, 0.9)',
                overflowX: 'auto'
              }}
            >
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  style={{
                    width: '54px',
                    height: '68px',
                    flexShrink: 0,
                    border: activeImageIndex === idx ? '2px solid #B88D4A' : '1px solid rgba(75, 48, 36, 0.15)',
                    overflow: 'hidden'
                  }}
                >
                  <img
                    src={img}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/assets/products/saree_ivory_mulmul.jpg';
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Info */}
        <div
          style={{
            padding: 'clamp(1.25rem, 3.5vw, 2rem)',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0
          }}
        >
          {/* Close button top right */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.74rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#B88D4A', fontWeight: 700 }}>
              {product.craft} • {product.color}
            </span>
            <button
              onClick={() => setQuickViewProduct(null)}
              aria-label="Close modal"
              style={{ color: '#8F7263', padding: '0.35rem', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
          </div>

          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.5rem, 3vw, 1.85rem)', color: '#4B3024', lineHeight: 1.2, marginBottom: '0.5rem' }}>
            {product.name}
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '0.15rem' }}>
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} fill="#B88D4A" color="#B88D4A" />
              ))}
            </div>
            <span style={{ fontSize: '0.8rem', color: '#8F7263' }}>({product.reviewCount} verified patron reviews)</span>
          </div>

          {/* Price */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.65rem', fontWeight: 600, color: '#4B3024' }}>
              ₹{unitPrice.toLocaleString('en-IN')}
            </span>
            {originalPrice && (
              <span style={{ fontSize: '1rem', textDecoration: 'line-through', color: '#8F7263' }}>
                ₹{originalPrice.toLocaleString('en-IN')}
              </span>
            )}
            <span style={{ fontSize: '0.72rem', color: '#B88D4A', fontWeight: 600, textTransform: 'uppercase' }}>
              Taxes Included
            </span>
          </div>

          <p style={{ fontSize: '0.88rem', color: '#6F4E3E', lineHeight: 1.6, marginBottom: '1.25rem' }}>
            {product.description}
          </p>

          {/* Quick Specifications */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.45rem',
              padding: '0.85rem',
              backgroundColor: '#FAF6EE',
              border: '1px solid rgba(75, 48, 36, 0.08)',
              fontSize: '0.8rem',
              marginBottom: '1.25rem'
            }}
          >
            <div><strong>Fabric:</strong> {product.fabric}</div>
            <div><strong>Blouse Piece:</strong> {product.blousePiece}</div>
            <div><strong>Dimensions:</strong> {product.dimensions}</div>
          </div>

          {/* Action Row */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: 'auto', paddingTop: '0.85rem', flexWrap: 'wrap' }}>
            {/* Quantity */}
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid rgba(75, 48, 36, 0.2)', backgroundColor: '#FFFDF9', height: '44px' }}>
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                style={{ padding: '0 0.75rem', height: '100%', background: 'none', border: 'none', cursor: 'pointer' }}
                aria-label="Decrease quantity"
              >
                -
              </button>
              <span style={{ padding: '0 0.5rem', fontWeight: 600, minWidth: '20px', textAlign: 'center' }}>{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                style={{ padding: '0 0.75rem', height: '100%', background: 'none', border: 'none', cursor: 'pointer' }}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              className="btn btn-primary"
              style={{ flexGrow: 1, minHeight: '44px' }}
            >
              <ShoppingBag size={16} />
              <span>Add to Bag</span>
            </button>

            <button
              onClick={() => toggleWishlist(product.id)}
              style={{
                width: '44px',
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(75, 48, 36, 0.2)',
                backgroundColor: '#FFFDF9',
                color: isFavorited ? '#C98278' : '#4B3024',
                cursor: 'pointer'
              }}
              aria-label="Wishlist"
            >
              <Heart size={18} fill={isFavorited ? '#C98278' : 'none'} />
            </button>
          </div>

          <button
            onClick={handleViewFullPage}
            style={{
              marginTop: '1rem',
              textAlign: 'center',
              fontSize: '0.78rem',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#B88D4A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.35rem 0'
            }}
          >
            <span>View Complete Textile Story</span>
            <ArrowRight size={13} />
          </button>
        </div>

        <style>{`
          .quickview-modal-content {
            display: grid;
            grid-template-columns: 1fr;
          }
          @media (min-width: 768px) {
            .quickview-modal-content {
              grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
            }
          }
        `}</style>
      </div>
    </div>
  );
};
