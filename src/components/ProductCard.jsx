import React from 'react';
import { Heart, Eye, ShoppingBag, Star } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const ProductCard = ({ product }) => {
  const {
    addToCart,
    toggleWishlist,
    isInWishlist,
    setQuickViewProduct,
    navigateTo
  } = useShop();

  const isFavorited = isInWishlist(product.id);

  const handleCardClick = (e) => {
    // If not clicking button, open product detail
    if (!e.target.closest('button')) {
      navigateTo('product', product.id);
    }
  };

  return (
    <article
      className="product-card"
      onClick={handleCardClick}
      style={{ cursor: 'pointer' }}
    >
      {/* Product Image Frame */}
      <div className="product-image-container">
        {/* Main Image */}
        <img
          src={product.primaryImage}
          alt={product.name}
          className="product-image primary"
          loading="lazy"
        />

        {/* Secondary Detail Image on Hover */}
        {product.secondaryImage && (
          <img
            src={product.secondaryImage}
            alt={`${product.name} detail`}
            className="product-image secondary"
            loading="lazy"
          />
        )}

        {/* Badge */}
        {product.badge && (
          <span className="product-badge">
            {product.badge}
          </span>
        )}

        {/* Wishlist Button */}
        <button
          className={`product-wishlist-btn ${isFavorited ? 'active' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          aria-label={isFavorited ? 'Remove from wishlist' : 'Save to wishlist'}
        >
          <Heart
            size={18}
            fill={isFavorited ? '#C98278' : 'none'}
            color={isFavorited ? '#C98278' : '#4B3024'}
          />
        </button>

        {/* Quick View Button */}
        <button
          className="product-quickview-btn"
          onClick={(e) => {
            e.stopPropagation();
            setQuickViewProduct(product);
          }}
          aria-label="Quick view product details"
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Eye size={14} /> Quick View
          </span>
        </button>
      </div>

      {/* Product Information */}
      <div className="product-info">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
          <span className="product-craft-tag">{product.craft}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.74rem', color: '#B88D4A' }}>
            <Star size={12} fill="#B88D4A" />
            <span>{product.rating}</span>
          </div>
        </div>

        <h3 className="product-title">{product.name}</h3>
        <p className="product-tagline">{product.tagline}</p>

        {/* Price & Add to Bag Row */}
        <div className="product-price-row">
          <div>
            <span className="product-price">₹{product.price.toLocaleString('en-IN')}</span>
            {product.originalPrice && (
              <span className="product-original-price">
                ₹{product.originalPrice.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          <button
            className="product-add-btn"
            onClick={(e) => {
              e.stopPropagation();
              addToCart(product, 1, true);
            }}
            aria-label={`Add ${product.name} to shopping bag`}
          >
            <ShoppingBag size={14} />
            <span>Add</span>
          </button>
        </div>
      </div>
    </article>
  );
};
