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
  const images = product.gallery || [product.primaryImage];

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
        style={{
          width: 'min(900px, 94vw)',
          backgroundColor: '#FFFDF9',
          border: '1px solid rgba(184, 141, 74, 0.3)',
          boxShadow: '0 25px 60px rgba(42, 26, 19, 0.25)',
          overflow: 'hidden',
          animation: 'slideUp 0.3s ease',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          maxHeight: '90vh'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Gallery */}
        <div style={{ backgroundColor: '#F4ECE1', position: 'relative', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flexGrow: 1, position: 'relative', minHeight: '380px' }}>
            <img
              src={images[activeImageIndex] || product.primaryImage}
              alt={product.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
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
                  <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Info */}
        <div
          style={{
            padding: '2rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column'
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
              style={{ color: '#8F7263', padding: '0.2rem' }}
            >
              <X size={20} />
            </button>
          </div>

          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.85rem', color: '#4B3024', lineHeight: 1.2, marginBottom: '0.5rem' }}>
            {product.name}
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', gap: '0.15rem' }}>
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} fill="#B88D4A" color="#B88D4A" />
              ))}
            </div>
            <span style={{ fontSize: '0.8rem', color: '#8F7263' }}>({product.reviewCount} verified patron reviews)</span>
          </div>

          {/* Price */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontWeight: 600, color: '#4B3024' }}>
              ₹{product.price.toLocaleString('en-IN')}
            </span>
            {product.originalPrice && (
              <span style={{ fontSize: '1rem', textDecoration: 'line-through', color: '#8F7263' }}>
                ₹{product.originalPrice.toLocaleString('en-IN')}
              </span>
            )}
            <span style={{ fontSize: '0.72rem', color: '#B88D4A', fontWeight: 600, textTransform: 'uppercase' }}>
              Taxes Included
            </span>
          </div>

          <p style={{ fontSize: '0.9rem', color: '#6F4E3E', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            {product.description}
          </p>

          {/* Quick Specifications */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              padding: '1rem',
              backgroundColor: '#FAF6EE',
              border: '1px solid rgba(75, 48, 36, 0.08)',
              fontSize: '0.8rem',
              marginBottom: '1.5rem'
            }}
          >
            <div><strong>Fabric:</strong> {product.fabric}</div>
            <div><strong>Blouse Piece:</strong> {product.blousePiece}</div>
            <div><strong>Dimensions:</strong> {product.dimensions}</div>
          </div>

          {/* Action Row */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: 'auto', paddingTop: '1rem' }}>
            {/* Quantity */}
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid rgba(75, 48, 36, 0.2)', backgroundColor: '#FFFDF9' }}>
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                style={{ padding: '0.6rem 0.85rem' }}
              >
                -
              </button>
              <span style={{ padding: '0 0.65rem', fontWeight: 600 }}>{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                style={{ padding: '0.6rem 0.85rem' }}
              >
                +
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              className="btn btn-primary"
              style={{ flexGrow: 1 }}
            >
              <ShoppingBag size={16} />
              <span>Add to Bag</span>
            </button>

            <button
              onClick={() => toggleWishlist(product.id)}
              style={{
                width: '48px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(75, 48, 36, 0.2)',
                color: isFavorited ? '#C98278' : '#4B3024'
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
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#B88D4A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem'
            }}
          >
            <span>View Complete Textile Story & Drape Guide</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};
