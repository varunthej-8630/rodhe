import React from 'react';
import { Heart } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const ProductCard = ({ product }) => {
  const {
    addToCart,
    toggleWishlist,
    isInWishlist,
    navigateTo
  } = useShop();

  const isFavorited = isInWishlist(product.id);

  const handleCardClick = (e) => {
    // If not clicking button, open product detail
    if (!e.target.closest('button')) {
      navigateTo('product', product.id);
    }
  };

  const primaryImage = product.primaryImage || product.primary_image || '/assets/products/saree_ivory_mulmul.jpg';
  const secondaryImage = product.secondaryImage || product.secondary_image || primaryImage;
  const sellingPrice = Number(product.price ?? product.sellingPrice ?? product.selling_price ?? 990) || 990;
  const originalPrice = product.originalPrice ? (Number(product.originalPrice) || null) : (product.original_price ? (Number(product.original_price) || null) : null);

  return (
    <article
      className="product-card ecommerce-reference-card"
      onClick={handleCardClick}
      style={{ cursor: 'pointer' }}
    >
      {/* Product Image Frame with Rounded Corners */}
      <div className="product-image-container ecommerce-rounded-frame">
        {/* Main Image */}
        <img
          src={primaryImage}
          alt={product.name || 'Handcrafted Saree'}
          className="product-image primary"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = '/assets/products/saree_ivory_mulmul.jpg';
          }}
        />

        {/* Secondary Detail Image on Hover */}
        {secondaryImage && (
          <img
            src={secondaryImage}
            alt={`${product.name || 'Saree'} detail`}
            className="product-image secondary"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = primaryImage;
            }}
          />
        )}

        {/* Discount badge removed per user request */}

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
            size={16}
            fill={isFavorited ? '#E51A4B' : 'none'}
            color={isFavorited ? '#E51A4B' : '#4B3024'}
          />
        </button>
      </div>

      {/* Product Information - Centered per Reference Images */}
      <div className="product-info ecommerce-center-info">
        <h3 className="product-title ecommerce-title">{product.name}</h3>

        {/* SKU Display */}
        <div className="product-sku-row">
          <span className="sku-label">Sku:</span>
          <span className="sku-val">{product.sku || (product.id ? product.id.slice(0, 6).toUpperCase() : 'RDH')}</span>
        </div>

        {/* Price Row: Crossed-out Original Price + Bold Red Sale Price */}
        <div className="product-price-row ecommerce-price-row">
          {originalPrice && originalPrice > sellingPrice && (
            <span className="product-original-price ecommerce-strikethrough">
              ₹{originalPrice.toLocaleString('en-IN')}.00
            </span>
          )}
          <span className="product-price ecommerce-red-price">
            ₹{sellingPrice.toLocaleString('en-IN')}.00
          </span>
        </div>

        {/* Dark Green Rounded Pill Add to Cart Button */}
        <button
          className="btn-ecommerce-add-to-cart"
          onClick={(e) => {
            e.stopPropagation();
            addToCart(product, 1, true);
          }}
          aria-label={`Add ${product.name} to shopping bag`}
        >
          Add to Cart
        </button>
      </div>
    </article>
  );
};
