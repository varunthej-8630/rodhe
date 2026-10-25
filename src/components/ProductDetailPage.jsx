import React, { useState } from 'react';
import { Heart, ShoppingBag, Star, ShieldCheck, Truck, RotateCcw, Sparkles, ChevronRight, Share2, Check, ArrowRight, MessageCircle } from 'lucide-react';
import { ProductCard } from './ProductCard';
import { useShop } from '../context/ShopContext';
import { storeService } from '../services/storeService';

export const ProductDetailPage = ({ productId }) => {
  const {
    PRODUCTS,
    addToCart,
    toggleWishlist,
    isInWishlist,
    setIsCheckoutOpen,
    navigateTo
  } = useShop();

  const product = PRODUCTS.find((p) => p.id === productId || p.slug === productId) || PRODUCTS[0];
  const isFavorited = isInWishlist(product.id);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description'); // 'description' | 'craft' | 'care' | 'shipping'

  const primaryImage = product.primaryImage || product.primary_image || '/assets/products/saree_ivory_mulmul.jpg';
  const images = (Array.isArray(product.gallery) && product.gallery.length > 0)
    ? product.gallery
    : [primaryImage, product.secondaryImage || primaryImage].filter(Boolean);
  const relatedProducts = PRODUCTS.filter((p) => p.id !== product.id && p.craftCategory === product.craftCategory).slice(0, 3);

  const unitPrice = Number(product.price ?? product.sellingPrice ?? product.selling_price ?? 990) || 990;
  const originalPrice = product.originalPrice ? (Number(product.originalPrice) || null) : (product.original_price ? (Number(product.original_price) || null) : null);

  const handleBuyNow = () => {
    addToCart(product, quantity, false);
    setIsCheckoutOpen(true);
  };

  const handleWhatsAppEnquiry = async () => {
    const settings = await storeService.getSettings();
    const phone = (settings?.whatsappNumber || '919490658858').replace(/[^0-9]/g, '');
    const price = unitPrice;
    const itemTotal = price * quantity;
    const msg = encodeURIComponent(
      `Namaste RODHE Concierge,\n\nI am interested in purchasing:\n• Saree: ${product.name}\n• SKU: ${product.sku || 'RODHE-SAR'}\n• Quantity: ${quantity}\n• Unit Price: ₹${price.toLocaleString('en-IN')}${quantity > 1 ? `\n• Total: ₹${itemTotal.toLocaleString('en-IN')}` : ''}\n• Craft: ${product.craft || 'Handloom'}\n\nPlease confirm availability and share details for dispatch.`
    );
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
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
        <div className="pdp-showcase-grid">
          {/* Left Column: Image Gallery */}
          <div style={{ minWidth: 0 }}>
            {/* Primary Featured Image */}
            <div
              style={{
                position: 'relative',
                aspectRatio: '3 / 4',
                overflow: 'hidden',
                backgroundColor: '#F4ECE1',
                boxShadow: '0 12px 35px rgba(75, 48, 36, 0.1)',
                border: '1px solid rgba(184, 141, 74, 0.25)',
                marginBottom: '0.85rem'
              }}
            >
              <img
                src={images[selectedImageIndex] || primaryImage}
                alt={product.name || 'Handcrafted Saree'}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transition: 'transform 0.4s ease'
                }}
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

            {/* Thumbnail Row */}
            <div
              style={{
                display: 'flex',
                gap: '0.65rem',
                overflowX: 'auto',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',
                paddingBottom: '0.5rem'
              }}
            >
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  style={{
                    width: 'clamp(58px, 16vw, 78px)',
                    aspectRatio: '3 / 4',
                    flexShrink: 0,
                    border: selectedImageIndex === idx ? '2px solid #B88D4A' : '1px solid rgba(75, 48, 36, 0.15)',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    opacity: selectedImageIndex === idx ? 1 : 0.75,
                    transition: 'all 0.2s',
                    padding: 0
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
          </div>

          {/* Right Column: Product Narrative & Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.78rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#B88D4A', fontWeight: 700 }}>
                {product.craft} • {product.color}
              </span>
              <button
                onClick={handleShare}
                aria-label="Share saree"
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: '#8F7263', background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}
              >
                <Share2 size={15} />
                <span>Share</span>
              </button>
            </div>

            <h1
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(1.75rem, 3.4vw, 2.8rem)',
                fontWeight: 500,
                color: '#4B3024',
                lineHeight: 1.15,
                marginBottom: '0.65rem'
              }}
            >
              {product.name}
            </h1>

            <p style={{ fontSize: 'clamp(0.9rem, 1.4vw, 1rem)', color: '#6F4E3E', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              {product.tagline}
            </p>

            {/* Rating */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '0.15rem' }}>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={15} fill="#B88D4A" color="#B88D4A" />
                ))}
              </div>
              <span style={{ fontSize: '0.84rem', color: '#6F4E3E', fontWeight: 500 }}>
                {product.rating} ({product.reviewCount} patron reviews)
              </span>
            </div>

            {/* Price Box */}
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '0.85rem',
                flexWrap: 'wrap',
                padding: '1.15rem clamp(1rem, 2.5vw, 1.5rem)',
                backgroundColor: '#FFFDF9',
                border: '1px solid rgba(75, 48, 36, 0.1)',
                marginBottom: '1.5rem'
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 'clamp(1.75rem, 3vw, 2.1rem)',
                  fontWeight: 600,
                  color: '#4B3024'
                }}
              >
                ₹{unitPrice.toLocaleString('en-IN')}
              </span>

              {originalPrice && (
                <span
                  style={{
                    fontSize: '1.1rem',
                    textDecoration: 'line-through',
                    color: '#8F7263'
                  }}
                >
                  ₹{originalPrice.toLocaleString('en-IN')}
                </span>
              )}

              <span
                style={{
                  fontSize: '0.74rem',
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
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))',
                gap: '0.75rem',
                fontSize: '0.82rem',
                color: '#4B3024',
                marginBottom: '1.75rem',
                paddingBottom: '1.25rem',
                borderBottom: '1px solid rgba(75, 48, 36, 0.1)'
              }}
            >
              <div><strong>Fabric:</strong> {product.fabric}</div>
              <div><strong>Dimensions:</strong> {product.dimensions.split('•')[0]}</div>
              <div><strong>Blouse Piece:</strong> {product.blousePiece.split('—')[0]}</div>
              <div><strong>Stock:</strong> <span style={{ color: '#4E7341', fontWeight: 600 }}>In Stock (Handcrafted Batch)</span></div>
            </div>

            {/* Quantity & CTA Block */}
            <div className="pdp-actions-container" style={{ marginBottom: '2rem' }}>
              {/* Row 1 on mobile: Quantity selector + Wishlist button */}
              <div className="pdp-aux-row">
                {/* Quantity */}
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    border: '1px solid rgba(75, 48, 36, 0.25)',
                    backgroundColor: '#FFFDF9',
                    height: '48px'
                  }}
                >
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    aria-label="Decrease quantity"
                    style={{
                      width: '44px',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.1rem',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    -
                  </button>
                  <span style={{ padding: '0 0.75rem', fontWeight: 600, minWidth: '24px', textAlign: 'center' }}>
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    aria-label="Increase quantity"
                    style={{
                      width: '44px',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.1rem',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    +
                  </button>
                </div>

                {/* Wishlist */}
                <button
                  onClick={() => toggleWishlist(product.id)}
                  aria-label="Wishlist"
                  style={{
                    width: '48px',
                    height: '48px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(75, 48, 36, 0.25)',
                    backgroundColor: '#FFFDF9',
                    color: isFavorited ? '#C98278' : '#4B3024',
                    transition: 'all 0.2s',
                    cursor: 'pointer'
                  }}
                >
                  <Heart size={20} fill={isFavorited ? '#C98278' : 'none'} />
                </button>
              </div>

              {/* Action Buttons: Add to Bag, Buy Now, and WhatsApp Enquiry */}
              <div className="pdp-btn-row" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => addToCart(product, quantity, true)}
                  className="btn btn-primary btn-lg"
                  style={{ minHeight: '48px', flex: '1 1 180px' }}
                >
                  <ShoppingBag size={18} />
                  <span>Add to Bag</span>
                </button>

                <button
                  onClick={handleBuyNow}
                  className="btn btn-gold btn-lg"
                  style={{ minHeight: '48px', flex: '1 1 180px' }}
                >
                  <span>Buy Now</span>
                </button>

                <button
                  onClick={handleWhatsAppEnquiry}
                  className="btn btn-outline btn-lg"
                  style={{
                    minHeight: '48px',
                    flex: '1 1 100%',
                    borderColor: '#25D366',
                    color: '#128C7E',
                    background: 'rgba(37, 211, 102, 0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    fontWeight: 500,
                    fontSize: '0.9rem',
                    letterSpacing: '0.04em',
                    cursor: 'pointer'
                  }}
                >
                  <MessageCircle size={18} color="#25D366" />
                  <span>Order via WhatsApp Concierge</span>
                </button>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="pdp-trust-badges">
              <div className="trust-badge-item">
                <Truck size={20} color="#B88D4A" />
                <span>Complimentary Express Shipping Across India</span>
              </div>
              <div className="trust-badge-item">
                <ShieldCheck size={20} color="#B88D4A" />
                <span>100% Authentic Handcrafted Guarantee</span>
              </div>
              <div className="trust-badge-item">
                <RotateCcw size={20} color="#B88D4A" />
                <span>7-Day Hassle-Free Exchange</span>
              </div>
            </div>

            {/* Tabbed In-Depth Specifications */}
            <div style={{ borderTop: '1px solid rgba(75, 48, 36, 0.12)', paddingTop: '1.5rem', minWidth: 0 }}>
              {/* Tab Navigation with horizontal scrolling */}
              <div
                style={{
                  display: 'flex',
                  gap: 'clamp(1rem, 3vw, 1.5rem)',
                  borderBottom: '1px solid rgba(75, 48, 36, 0.1)',
                  paddingBottom: '0.75rem',
                  marginBottom: '1.25rem',
                  overflowX: 'auto',
                  whiteSpace: 'nowrap',
                  WebkitOverflowScrolling: 'touch',
                  scrollbarWidth: 'none'
                }}
              >
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
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: activeTab === t.id ? '#4B3024' : '#8F7263',
                      border: 'none',
                      borderBottom: activeTab === t.id ? '2px solid #B88D4A' : '2px solid transparent',
                      backgroundColor: 'transparent',
                      padding: '0.25rem 0.15rem 0.5rem',
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Tab Contents */}
              <div style={{ fontSize: '0.9rem', color: '#6F4E3E', lineHeight: 1.75 }}>
                {activeTab === 'description' && (
                  <div>
                    <p style={{ marginBottom: '0.85rem' }}>{product.description}</p>
                    <p><strong>Dimensions & Fit:</strong> {product.dimensions}</p>
                    <p><strong>Blouse Piece:</strong> {product.blousePiece}</p>
                  </div>
                )}

                {activeTab === 'craft' && (
                  <div>
                    <p style={{ marginBottom: '0.85rem' }}>{product.craftStory}</p>
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
          <div style={{ marginTop: 'clamp(3.5rem, 6vw, 6rem)', borderTop: '1px solid rgba(75, 48, 36, 0.12)', paddingTop: 'clamp(2.5rem, 5vw, 4rem)' }}>
            <div className="section-header" style={{ marginBottom: '2.5rem' }}>
              <div className="eyebrow">Complementary Drapes</div>
              <h3 className="section-title">
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
        className="d-md-none sticky-mobile-pdp-bar"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#FFFDF9',
          borderTop: '1px solid rgba(184, 141, 74, 0.3)',
          padding: '0.75rem 1.25rem',
          paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 800,
          boxShadow: '0 -4px 20px rgba(0,0,0,0.08)'
        }}
      >
        <div>
          <div style={{ fontSize: '0.72rem', color: '#8F7263', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Price</div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 700, color: '#4B3024' }}>
            ₹{unitPrice.toLocaleString('en-IN')}
          </div>
        </div>

        <button
          onClick={() => addToCart(product, quantity, true)}
          className="btn btn-primary"
          style={{ padding: '0.75rem 1.4rem', minHeight: '44px' }}
        >
          <ShoppingBag size={16} />
          <span>Add to Bag</span>
        </button>
      </div>

      <style>{`
        .pdp-showcase-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: clamp(2rem, 4vw, 4rem);
          align-items: flex-start;
        }
        @media (min-width: 900px) {
          .pdp-showcase-grid {
            grid-template-columns: minmax(0, 1.05fr) minmax(0, 1.2fr);
          }
        }
        .pdp-actions-container {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .pdp-aux-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .pdp-btn-row {
          display: flex;
          gap: 0.75rem;
        }
        @media (min-width: 640px) {
          .pdp-actions-container {
            flex-direction: row;
            flex-wrap: wrap;
            align-items: center;
          }
          .pdp-aux-row {
            display: contents;
          }
          .pdp-btn-row {
            display: contents;
          }
        }
        .pdp-trust-badges {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0.85rem;
          padding: 1.15rem;
          background-color: #F4ECE1;
          font-size: 0.78rem;
          color: #4B3024;
          margin-bottom: 2rem;
        }
        .trust-badge-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          text-align: left;
        }
        @media (min-width: 600px) {
          .pdp-trust-badges {
            grid-template-columns: repeat(3, 1fr);
            text-align: center;
          }
          .trust-badge-item {
            flex-direction: column;
            text-align: center;
            gap: 0.35rem;
          }
        }
        @media (min-width: 768px) {
          .d-md-none {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};
