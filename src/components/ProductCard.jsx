import React from 'react';
import { Heart } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const ProductCard = ({ product, eager = false }) => {
  const {
    addToCart,
    toggleWishlist,
    isInWishlist,
    navigateTo
  } = useShop();

  const isFavorited = isInWishlist(product);

  const handleCardClick = (e) => {
    if (!e.target.closest('button')) {
      navigateTo('product', product.id);
    }
  };

  const primaryImage = product.primaryImage || product.primary_image || '/assets/products/saree_ivory_mulmul.jpg';
  const secondaryImage = product.secondaryImage || product.secondary_image || primaryImage;
  const sellingPrice = Number(product.price ?? product.sellingPrice ?? product.selling_price ?? 0) || 0;
  const originalPrice = product.originalPrice
    ? (Number(product.originalPrice) || null)
    : product.original_price
    ? (Number(product.original_price) || null)
    : null;
  const stockCount = typeof product.stockCount === 'number' ? product.stockCount : Number(product.stock_count ?? 10);
  const isAvailable = (!product.status || product.status === 'published') && Boolean(product.inStock ?? product.in_stock ?? true) && stockCount > 0;

  return (
    <article
      className="product-card ecommerce-reference-card"
      onClick={handleCardClick}
      style={{ cursor: 'pointer', opacity: isAvailable ? 1 : 0.85 }}
    >
      {/* Product Image Frame with Rounded Corners */}
      <div className="product-image-container ecommerce-rounded-frame">
        <img
          src={primaryImage}
          alt={product.name || 'Handcrafted Saree'}
          className="product-image primary"
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = '/assets/products/saree_ivory_mulmul.jpg';
          }}
        />

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

        {!isAvailable && (
          <span
            className="product-badge"
            style={{ backgroundColor: 'rgba(75, 48, 36, 0.9)', color: '#FAF6EE', borderColor: '#B88D4A' }}
          >
            Out of Stock
          </span>
        )}

        {/* Wishlist Heart Button */}
        <button
          className={`product-wishlist-btn ${isFavorited ? 'active' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product);
          }}
          aria-label={isFavorited ? `Remove ${product.name} from favourites` : `Save ${product.name} to favourites`}
        >
          <Heart
            size={16}
            fill={isFavorited ? '#E51A4B' : 'none'}
            color={isFavorited ? '#E51A4B' : '#4B3024'}
          />
        </button>
      </div>

      {/* Product Info */}
      <div className="product-info ecommerce-center-info">
        <h3 className="product-title ecommerce-title">{product.name}</h3>

        <div className="product-sku-row">
          <span className="sku-label">Sku:</span>
          <span className="sku-val">{product.sku || (product.id ? String(product.id).slice(0, 6).toUpperCase() : 'RDH')}</span>
        </div>

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

        <button
          className="btn-ecommerce-add-to-cart"
          disabled={!isAvailable}
          style={{
            backgroundColor: isAvailable ? '#184323' : '#9B928C',
            cursor: isAvailable ? 'pointer' : 'not-allowed',
            opacity: isAvailable ? 1 : 0.78
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (isAvailable) {
              addToCart(product, 1, true);
            }
          }}
          aria-label={isAvailable ? `Add ${product.name} to shopping bag` : `${product.name} is out of stock`}
        >
          {isAvailable ? 'Add to Cart' : 'Out of Stock'}
        </button>
      </div>
    </article>
  );
};
