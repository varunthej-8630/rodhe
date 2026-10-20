import React, { useState, useEffect } from 'react';
import { Search, User, Heart, ShoppingBag, Menu, X, ChevronDown, Sparkles } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const Navbar = () => {
  const {
    currentPage,
    navigateTo,
    cartCount,
    wishlistCount,
    setIsCartOpen,
    setIsWishlistOpen,
    setIsSearchOpen,
    setIsAuthOpen,
    setSelectedCraft
  } = useShop();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSareesDropdownOpen, setIsSareesDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleCraftClick = (craftCategory) => {
    setSelectedCraft(craftCategory);
    navigateTo('shop');
    setIsSareesDropdownOpen(false);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Top Announcement Bar */}
      <div
        style={{
          backgroundColor: '#4B3024',
          color: '#FAF6EE',
          padding: '0.45rem 1rem',
          fontSize: '0.74rem',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          textAlign: 'center',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          zIndex: 100
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
          <Sparkles size={12} color="#D4AC68" />
          Complimentary Express Shipping Across India on Orders Above ₹2,999
        </span>
        <span style={{ opacity: 0.5, display: 'none' }} className="d-sm-inline">•</span>
        <span style={{ opacity: 0.9, display: 'none' }} className="d-sm-inline">
          Handcrafted with Natural Botanical Dyes
        </span>
      </div>

      {/* Main Navigation Header */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 900,
          transition: 'all 0.4s cubic-bezier(0.19, 1, 0.22, 1)',
          backgroundColor: isScrolled
            ? 'rgba(250, 246, 238, 0.96)'
            : 'rgba(250, 246, 238, 0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: isScrolled
            ? '1px solid rgba(184, 141, 74, 0.25)'
            : '1px solid rgba(75, 48, 36, 0.08)',
          boxShadow: isScrolled ? '0 4px 20px rgba(75, 48, 36, 0.06)' : 'none'
        }}
      >
        <div
          className="container"
          style={{
            height: 'var(--header-height)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Open mobile navigation menu"
            style={{
              display: 'none',
              padding: '0.5rem',
              color: '#4B3024'
            }}
            className="mobile-menu-trigger"
          >
            <Menu size={24} />
          </button>

          {/* Desktop Left Nav Links */}
          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '2.2rem'
            }}
            className="desktop-nav"
          >
            {/* Sarees with Dropdown */}
            <div
              style={{ position: 'relative' }}
              onMouseEnter={() => setIsSareesDropdownOpen(true)}
              onMouseLeave={() => setIsSareesDropdownOpen(false)}
            >
              <button
                onClick={() => navigateTo('shop')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: currentPage === 'shop' ? '#B88D4A' : '#4B3024',
                  transition: 'color 0.2s',
                  padding: '0.5rem 0'
                }}
              >
                <span>Sarees</span>
                <ChevronDown size={14} style={{ transform: isSareesDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>

              {/* Mega Dropdown */}
              {isSareesDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    width: '320px',
                    backgroundColor: '#FFFDF9',
                    border: '1px solid rgba(184, 141, 74, 0.28)',
                    boxShadow: '0 15px 35px -5px rgba(42, 26, 19, 0.12)',
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.85rem',
                    animation: 'fadeIn 0.25s ease'
                  }}
                >
                  <div style={{ fontSize: '0.72rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#B88D4A', fontWeight: 700, paddingBottom: '0.5rem', borderBottom: '1px solid rgba(75, 48, 36, 0.08)' }}>
                    Explore by Craft
                  </div>
                  <button
                    onClick={() => handleCraftClick('tie-dye')}
                    style={{ textAlign: 'left', fontSize: '0.86rem', color: '#4B3024', transition: 'color 0.2s' }}
                    onMouseEnter={(e) => (e.target.style.color = '#B88D4A')}
                    onMouseLeave={(e) => (e.target.style.color = '#4B3024')}
                  >
                    Natural Indigo & Shibori Tie-Dye
                  </button>
                  <button
                    onClick={() => handleCraftClick('handblock')}
                    style={{ textAlign: 'left', fontSize: '0.86rem', color: '#4B3024', transition: 'color 0.2s' }}
                    onMouseEnter={(e) => (e.target.style.color = '#B88D4A')}
                    onMouseLeave={(e) => (e.target.style.color = '#4B3024')}
                  >
                    Bagru Mud-Resist & Handblock Prints
                  </button>
                  <button
                    onClick={() => handleCraftClick('chanderi')}
                    style={{ textAlign: 'left', fontSize: '0.86rem', color: '#4B3024', transition: 'color 0.2s' }}
                    onMouseEnter={(e) => (e.target.style.color = '#B88D4A')}
                    onMouseLeave={(e) => (e.target.style.color = '#4B3024')}
                  >
                    Chanderi Sheer Silk & Zari Weaves
                  </button>
                  <button
                    onClick={() => handleCraftClick('mulmul')}
                    style={{ textAlign: 'left', fontSize: '0.86rem', color: '#4B3024', transition: 'color 0.2s' }}
                    onMouseEnter={(e) => (e.target.style.color = '#B88D4A')}
                    onMouseLeave={(e) => (e.target.style.color = '#4B3024')}
                  >
                    100% Breathable Mulmul Cottons
                  </button>
                  <div style={{ paddingTop: '0.5rem', borderTop: '1px solid rgba(75, 48, 36, 0.08)' }}>
                    <button
                      onClick={() => {
                        setSelectedCraft('all');
                        navigateTo('shop');
                        setIsSareesDropdownOpen(false);
                      }}
                      style={{ fontSize: '0.78rem', color: '#B88D4A', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}
                    >
                      View All 8 Handcrafted Sarees →
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => navigateTo('shop')}
              style={{
                fontSize: '0.84rem',
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: currentPage === 'collections' ? '#B88D4A' : '#4B3024',
                transition: 'color 0.2s'
              }}
            >
              Collections
            </button>

            <button
              onClick={() => navigateTo('story')}
              style={{
                fontSize: '0.84rem',
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: currentPage === 'story' ? '#B88D4A' : '#4B3024',
                transition: 'color 0.2s'
              }}
            >
              Craft & Story
            </button>

            <button
              onClick={() => navigateTo('contact')}
              style={{
                fontSize: '0.84rem',
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: currentPage === 'contact' ? '#B88D4A' : '#4B3024',
                transition: 'color 0.2s'
              }}
            >
              Contact
            </button>
          </nav>

          {/* Center Brand Identity (Original supplied logo asset) */}
          <div
            onClick={() => navigateTo('home')}
            style={{
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              userSelect: 'none'
            }}
          >
            <img
              src="/assets/RODHE Woven Luxury Wordmark.png"
              alt="RODHE — Woven with Trust"
              style={{
                height: '48px',
                width: 'auto',
                objectFit: 'contain',
                transition: 'transform 0.3s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.03)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            />
          </div>

          {/* Right Action Icons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1.35rem'
            }}
          >
            {/* Search */}
            <button
              onClick={() => setIsSearchOpen(true)}
              aria-label="Search sarees"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                color: '#4B3024',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#B88D4A')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#4B3024')}
            >
              <Search size={20} strokeWidth={1.7} />
              <span style={{ fontSize: '0.78rem', letterSpacing: '0.08em', display: 'none' }} className="d-md-inline">
                Search
              </span>
            </button>

            {/* Account */}
            <button
              onClick={() => setIsAuthOpen(true)}
              aria-label="Customer account"
              style={{
                color: '#4B3024',
                transition: 'color 0.2s',
                display: 'flex',
                alignItems: 'center'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#B88D4A')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#4B3024')}
            >
              <User size={20} strokeWidth={1.7} />
            </button>

            {/* Wishlist */}
            <button
              onClick={() => setIsWishlistOpen(true)}
              aria-label={`Wishlist with ${wishlistCount} items`}
              style={{
                position: 'relative',
                color: '#4B3024',
                transition: 'color 0.2s',
                display: 'flex',
                alignItems: 'center'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#C98278')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#4B3024')}
            >
              <Heart size={20} strokeWidth={1.7} fill={wishlistCount > 0 ? '#C98278' : 'none'} color={wishlistCount > 0 ? '#C98278' : '#4B3024'} />
              {wishlistCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-7px',
                    right: '-9px',
                    backgroundColor: '#C98278',
                    color: '#FFFFFF',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Cart */}
            <button
              onClick={() => setIsCartOpen(true)}
              aria-label={`Shopping bag with ${cartCount} items`}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                color: '#4B3024',
                padding: '0.4rem 0.6rem',
                border: '1px solid rgba(75, 48, 36, 0.15)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#B88D4A';
                e.currentTarget.style.color = '#B88D4A';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(75, 48, 36, 0.15)';
                e.currentTarget.style.color = '#4B3024';
              }}
            >
              <ShoppingBag size={18} strokeWidth={1.8} />
              <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>{cartCount}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      {isMobileMenuOpen && (
        <div className="drawer-backdrop" onClick={() => setIsMobileMenuOpen(false)}>
          <div
            className="drawer-content"
            style={{
              left: 0,
              right: 'auto',
              width: 'min(360px, 85vw)',
              animation: 'slideInLeft 0.35s var(--ease-cinematic)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="drawer-header">
              <img
                src="/assets/RODHE Woven Luxury Wordmark.png"
                alt="RODHE"
                style={{ height: '36px' }}
              />
              <button
                className="drawer-close"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <button
                onClick={() => {
                  navigateTo('home');
                  setIsMobileMenuOpen(false);
                }}
                style={{ textAlign: 'left', fontSize: '1.1rem', fontWeight: 500, fontFamily: 'var(--font-serif)', color: '#4B3024' }}
              >
                Home
              </button>

              <div style={{ borderTop: '1px solid rgba(75, 48, 36, 0.08)', paddingTop: '1rem' }}>
                <div style={{ fontSize: '0.74rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#B88D4A', fontWeight: 700, marginBottom: '0.75rem' }}>
                  Sarees by Craft
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', paddingLeft: '0.5rem' }}>
                  <button onClick={() => handleCraftClick('all')} style={{ textAlign: 'left', fontSize: '0.92rem' }}>
                    All Sarees (8)
                  </button>
                  <button onClick={() => handleCraftClick('tie-dye')} style={{ textAlign: 'left', fontSize: '0.92rem' }}>
                    Indigo & Shibori
                  </button>
                  <button onClick={() => handleCraftClick('handblock')} style={{ textAlign: 'left', fontSize: '0.92rem' }}>
                    Bagru Handblock
                  </button>
                  <button onClick={() => handleCraftClick('chanderi')} style={{ textAlign: 'left', fontSize: '0.92rem' }}>
                    Chanderi Cotton Silk
                  </button>
                  <button onClick={() => handleCraftClick('mulmul')} style={{ textAlign: 'left', fontSize: '0.92rem' }}>
                    Pure Mulmul Cotton
                  </button>
                </div>
              </div>

              <div style={{ borderTop: '1px solid rgba(75, 48, 36, 0.08)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <button
                  onClick={() => {
                    navigateTo('story');
                    setIsMobileMenuOpen(false);
                  }}
                  style={{ textAlign: 'left', fontSize: '1.1rem', fontWeight: 500, fontFamily: 'var(--font-serif)', color: '#4B3024' }}
                >
                  Our Craft & Story
                </button>
                <button
                  onClick={() => {
                    navigateTo('contact');
                    setIsMobileMenuOpen(false);
                  }}
                  style={{ textAlign: 'left', fontSize: '1.1rem', fontWeight: 500, fontFamily: 'var(--font-serif)', color: '#4B3024' }}
                >
                  Customer Concierge & Contact
                </button>
              </div>

              <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(75, 48, 36, 0.08)', paddingTop: '1.5rem', textAlign: 'center' }}>
                <p style={{ fontSize: '0.78rem', color: '#8F7263', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  Woven with Trust
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Responsive Inline CSS overrides for header */}
      <style>{`
        @media (max-width: 900px) {
          .desktop-nav {
            display: none !important;
          }
          .mobile-menu-trigger {
            display: flex !important;
          }
        }
        @media (min-width: 768px) {
          .d-md-inline {
            display: inline !important;
          }
        }
        @media (min-width: 576px) {
          .d-sm-inline {
            display: inline !important;
          }
        }
      `}</style>
    </>
  );
};
