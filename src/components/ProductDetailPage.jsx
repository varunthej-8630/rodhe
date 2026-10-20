import React, { useState } from 'react';
import { Heart, ShoppingBag, Star, ShieldCheck, Truck, RotateCcw, Sparkles, ChevronRight, Share2, Check, ArrowRight } from 'lucide-react';
import { ProductCard } from './ProductCard';
import { useShop } from '../context/ShopContext';

export const ProductDetailPage = ({ productId }) => {
  const {
    PRODUCTS,
    addToCart,
    toggleWishlist,
    isInWishlist,
    setIsCheckoutOpen,
    navigateTo
  } = useShop();

  const product = PRODUCTS.find((p) => p.id === productId) || PRODUCTS[0];
  const isFavorited = isInWishlist(product.id);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description'); // 'description' | 'craft' | 'care' | 'shipping'

  const images = product.gallery || [product.primaryImage];
  const relatedProducts = PRODUCTS.filter((p) => p.id !== product.id && p.craftCategory === product.craftCategory).slice(0, 3);

  const handleBuyNow = () => {
    addToCart(product, quantity, false);
    setIsCheckoutOpen(true);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `RODHE — ${product.name}`,
        text: product.tagline,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div style={{ backgroundColor: '#FAF6EE', minHeight: '100vh', paddingBottom: '6rem' }}>
      {/* Breadcrumb Navigation */}
      <div
        style={{
          borderBottom: '1px solid rgba(75, 48, 36, 0.08)',
          backgroundColor: '#F4ECE1',
          padding: '0.85rem 0'
        }}
      >
        <div className="container" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: '#8F7263' }}>
          <button onClick={() => navigateTo('home')} style={{ color: '#4B3024' }}>Home</button>
          <ChevronRight size={12} />
          <button onClick={() => navigateTo('shop')} style={{ color: '#4B3024' }}>Sarees</button>
          <ChevronRight size={12} />
          <span style={{ color: '#B88D4A', fontWeight: 600 }}>{product.name}</span>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '3rem' }}>
        {/* Main Product Showcase Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: 'clamp(2rem, 5vw, 4.5rem)',
            alignItems: 'flex-start'
          }}
        >
          {/* Left Column: Image Gallery */}
          <div>
            {/* Primary Featured Image */}
            <div
              style={{
                position: 'relative',
                aspectRatio: '3 / 4',
                overflow: 'hidden',
                backgroundColor: '#F4ECE1',
                boxShadow: '0 12px 35px rgba(75, 48, 36, 0.1)',
                border: '1px solid rgba(184, 141, 74, 0.25)',
                marginBottom: '1rem'
              }}
            >
              <img
                src={images[selectedImageIndex] || product.primaryImage}
                alt={product.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transition: 'transform 0.4s ease'
                }}
              />
              {product.badge && (
                <span className="product-badge">
                  {product.badge}
                </span>
              )}
            </div>

            {/* Thumbnail Row */}
            <div style={{ display: 'flex', gap: '0.85rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  style={{
                    width: '74px',
                    height: '96px',
                    flexShrink: 0,
                    border: selectedImageIndex === idx ? '2px solid #B88D4A' : '1px solid rgba(75, 48, 36, 0.15)',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    opacity: selectedImageIndex === idx ? 1 : 0.75,
                    transition: 'all 0.2s'
                  }}
                >
                  <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Product Narrative & Actions */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.78rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#B88D4A', fontWeight: 700 }}>
                {product.craft} • {product.color}
              </span>
              <button
                onClick={handleShare}
                aria-label="Share saree"
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: '#8F7263' }}
              >
                <Share2 size={15} />
                <span>Share</span>
              </button>
            </div>

            <h1
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(2rem, 3.4vw, 2.8rem)',
                fontWeight: 500,
                color: '#4B3024',
                lineHeight: 1.15,
                marginBottom: '0.65rem'
              }}
            >
              {product.name}
            </h1>

            <p style={{ fontSize: '1rem', color: '#6F4E3E', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              {product.tagline}
            </p>

            {/* Rating */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '0.15rem' }}>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={15} fill="#B88D4A" color="#B88D4A" />
                ))}
              </div>
              <span style={{ fontSize: '0.85rem', color: '#6F4E3E', fontWeight: 500 }}>
                {product.rating} ({product.reviewCount} patron reviews)
              </span>
            </div>

            {/* Price Box */}
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '1rem',
                padding: '1.25rem',
                backgroundColor: '#FFFDF9',
                border: '1px solid rgba(75, 48, 36, 0.1)',
                marginBottom: '1.75rem'
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '2rem',
                  fontWeight: 600,
                  color: '#4B3024'
                }}
              >
                ₹{product.price.toLocaleString('en-IN')}
              </span>

              {product.originalPrice && (
                <span
                  style={{
                    fontSize: '1.15rem',
                    textDecoration: 'line-through',
                    color: '#8F7263'
                  }}
                >
                  ₹{product.originalPrice.toLocaleString('en-IN')}
                </span>
              )}

              <span
                style={{
                  fontSize: '0.75rem',
                  color: '#B88D4A',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  marginLeft: 'auto'
                }}
              >
                Inclusive of all taxes
              </span>
            </div>

            {/* Quick Specs Overview */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '0.85rem',
                fontSize: '0.82rem',
                color: '#4B3024',
                marginBottom: '2rem',
                paddingBottom: '1.5rem',
                borderBottom: '1px solid rgba(75, 48, 36, 0.1)'
              }}
            >
              <div><strong>Fabric:</strong> {product.fabric}</div>
              <div><strong>Dimensions:</strong> {product.dimensions.split('•')[0]}</div>
              <div><strong>Blouse Piece:</strong> {product.blousePiece.split('—')[0]}</div>
              <div><strong>Stock Status:</strong> <span style={{ color: '#4E7341', fontWeight: 600 }}>In Stock (Handcrafted Batch)</span></div>
            </div>

            {/* Quantity & CTA Row */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              {/* Quantity */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  border: '1px solid rgba(75, 48, 36, 0.25)',
                  backgroundColor: '#FFFDF9'
                }}
              >
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  style={{ padding: '0.85rem 1.1rem', fontSize: '1rem' }}
                >
                  -
                </button>
                <span style={{ padding: '0 0.85rem', fontWeight: 600 }}>{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  style={{ padding: '0.85rem 1.1rem', fontSize: '1rem' }}
                >
                  +
                </button>
              </div>

              {/* Add to Bag */}
              <button
                onClick={() => addToCart(product, quantity, true)}
                className="btn btn-primary btn-lg"
                style={{ flexGrow: 1 }}
              >
                <ShoppingBag size={18} />
                <span>Add to Bag</span>
              </button>

              {/* Buy Now */}
              <button
                onClick={handleBuyNow}
                className="btn btn-gold btn-lg"
              >
                <span>Buy Now</span>
              </button>

              {/* Wishlist */}
              <button
                onClick={() => toggleWishlist(product.id)}
                aria-label="Wishlist"
                style={{
                  width: '56px',
                  height: '56px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(75, 48, 36, 0.25)',
                  backgroundColor: '#FFFDF9',
                  color: isFavorited ? '#C98278' : '#4B3024',
                  transition: 'all 0.2s'
                }}
              >
                <Heart size={20} fill={isFavorited ? '#C98278' : 'none'} />
              </button>
            </div>

            {/* Trust Badges */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.85rem',
                padding: '1.25rem',
                backgroundColor: '#F4ECE1',
                fontSize: '0.78rem',
                textAlign: 'center',
                color: '#4B3024',
                marginBottom: '2.5rem'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
                <Truck size={18} color="#B88D4A" />
                <span>Complimentary Express Shipping Across India</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
                <ShieldCheck size={18} color="#B88D4A" />
                <span>100% Authentic Handcrafted Guarantee</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
                <RotateCcw size={18} color="#B88D4A" />
                <span>7-Day Hassle-Free Exchange</span>
              </div>
            </div>

            {/* Tabbed In-Depth Specifications */}
            <div style={{ borderTop: '1px solid rgba(75, 48, 36, 0.12)', paddingTop: '1.5rem' }}>
              {/* Tab Navigation */}
              <div style={{ display: 'flex', gap: '1.5rem', borderBottom: '1px solid rgba(75, 48, 36, 0.1)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
                {[
                  { id: 'description', label: 'Description' },
                  { id: 'craft', label: 'Craft & Weave' },
                  { id: 'care', label: 'Wash & Care' },
                  { id: 'shipping', label: 'Delivery' }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: activeTab === t.id ? '#4B3024' : '#8F7263',
                      borderBottom: activeTab === t.id ? '2px solid #B88D4A' : 'none',
                      paddingBottom: '0.5rem'
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Tab Contents */}
              <div style={{ fontSize: '0.92rem', color: '#6F4E3E', lineHeight: 1.8 }}>
                {activeTab === 'description' && (
                  <div>
                    <p style={{ marginBottom: '1rem' }}>{product.description}</p>
                    <p><strong>Dimensions & Fit:</strong> {product.dimensions}</p>
                    <p><strong>Blouse Piece:</strong> {product.blousePiece}</p>
                  </div>
                )}

                {activeTab === 'craft' && (
                  <div>
                    <p style={{ marginBottom: '1rem' }}>{product.craftStory}</p>
                    <p><strong>Dye Process:</strong> Non-chemical, plant-derived botanical pigments.</p>
                  </div>
                )}

                {activeTab === 'care' && (
                  <div>
                    <p>{product.washCare}</p>
                    <p style={{ marginTop: '0.85rem' }}>
                      <em>Tip: To keep the natural zari gleaming, store draped in pure unbleached cotton muslin cloth away from direct artificial lighting.</em>
                    </p>
                  </div>
                )}

                {activeTab === 'shipping' && (
                  <div>
                    <p>• Orders dispatched within 24–48 hours from our central textile studio.</p>
                    <p>• Express air delivery across India in 3–5 business days.</p>
                    <p>• Packaged securely in the signature RODHE recyclable keepsake box.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Related Handcrafted Sarees */}
        {relatedProducts.length > 0 && (
          <div style={{ marginTop: '6rem', borderTop: '1px solid rgba(75, 48, 36, 0.12)', paddingTop: '4rem' }}>
            <div className="section-header" style={{ marginBottom: '2.5rem' }}>
              <div className="eyebrow">Complementary Drapes</div>
              <h3 className="section-title" style={{ fontSize: '2.4rem' }}>
                You May Also Love
              </h3>
            </div>

            <div className="products-grid">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky Mobile Add to Cart Bar */}
      <div
        className="d-md-none"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#FFFDF9',
          borderTop: '1px solid rgba(184, 141, 74, 0.3)',
          padding: '0.85rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 800,
          boxShadow: '0 -4px 20px rgba(0,0,0,0.08)'
        }}
      >
        <div>
          <div style={{ fontSize: '0.74rem', color: '#8F7263', textTransform: 'uppercase' }}>Price</div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 700, color: '#4B3024' }}>
            ₹{product.price.toLocaleString('en-IN')}
          </div>
        </div>

        <button
          onClick={() => addToCart(product, quantity, true)}
          className="btn btn-primary"
          style={{ padding: '0.8rem 1.6rem' }}
        >
          <ShoppingBag size={16} />
          <span>Add to Bag</span>
        </button>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .d-md-none {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};
