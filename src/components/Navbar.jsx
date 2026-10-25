import React, { useState, useEffect } from 'react';
import { Search, User, Heart, ShoppingBag, Menu, X, ChevronDown, Sparkles, Shield } from 'lucide-react';
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
    setSelectedCraft,
    PRODUCTS
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

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      {/* Top Announcement Bar */}
      <div
        style={{
          backgroundColor: '#4B3024',
          color: '#FAF6EE',
          padding: '0.4rem clamp(0.6rem, 2vw, 1rem)',
          fontSize: 'clamp(0.66rem, 1.8vw, 0.74rem)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          textAlign: 'center',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'clamp(0.5rem, 1.5vw, 1rem)',
          zIndex: 100,
          lineHeight: 1.35
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
          <Sparkles size={12} color="#D4AC68" style={{ flexShrink: 0 }} />
          <span>Complimentary Express Shipping in India on Orders Above ₹2,999</span>
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
        <div className="container header-nav-grid">
          {/* Left Column: Mobile Menu Trigger & Desktop Navigation */}
          <div className="header-left-col">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open mobile navigation menu"
              style={{
                display: 'none',
                padding: '0.4rem',
                color: '#4B3024',
                width: '40px',
                height: '40px',
                minWidth: '40px',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                border: 'none',
                background: 'none',
                cursor: 'pointer'
              }}
              className="mobile-menu-trigger"
            >
              <Menu size={22} />
            </button>

          {/* Desktop Left Nav Links */}
          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(1.2rem, 2vw, 2.2rem)',
              flexShrink: 0
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
                      View All {PRODUCTS?.length || 9} Handcrafted Sarees →
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
          </div>

          {/* Center Column: Brand Identity */}
          <div
            id="header-brand-container"
            className="header-brand-col"
            onClick={() => navigateTo('home')}
          >
            <img
              id="header-brand-logo"
              src="/assets/RODHE_Secondary_Emblem.png"
              alt="RODHE — Woven with Trust"
              style={{
                height: 'clamp(38px, 5.5vw, 52px)',
                width: 'auto',
                maxWidth: '100%',
                objectFit: 'contain',
                transition: 'transform 0.3s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.03)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            />
          </div>

          {/* Right Column: Action Icons */}
          <div className="header-right-col">
            {/* Search */}
            <button
              onClick={() => setIsSearchOpen(true)}
              aria-label="Search sarees"
              className="header-nav-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                color: '#4B3024',
                transition: 'color 0.2s',
                width: '38px',
                height: '38px',
                minWidth: '38px',
                minHeight: '38px',
                borderRadius: '50%',
                background: 'none',
                border: 'none',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#B88D4A')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#4B3024')}
            >
              <Search size={19} strokeWidth={1.8} />
              <span style={{ fontSize: '0.78rem', letterSpacing: '0.08em', display: 'none' }} className="d-md-inline">
                Search
              </span>
            </button>

            {/* Account (Desktop & Tablet only; mobile has it in drawer) */}
            <button
              onClick={() => setIsAuthOpen(true)}
              aria-label="Customer account"
              className="d-md-flex header-nav-btn"
              style={{
                color: '#4B3024',
                transition: 'color 0.2s',
                alignItems: 'center',
                justifyContent: 'center',
                width: '38px',
                height: '38px',
                minWidth: '38px',
                minHeight: '38px',
                borderRadius: '50%',
                background: 'none',
                border: 'none',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#B88D4A')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#4B3024')}
            >
              <User size={19} strokeWidth={1.8} />
            </button>

            {/* Wishlist */}
            <button
              onClick={() => setIsWishlistOpen(true)}
              aria-label={`Wishlist with ${wishlistCount} items`}
              className="header-nav-btn"
              style={{
                position: 'relative',
                color: '#4B3024',
                transition: 'color 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '38px',
                height: '38px',
                minWidth: '38px',
                minHeight: '38px',
                borderRadius: '50%',
                background: 'none',
                border: 'none',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#C98278')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#4B3024')}
            >
              <Heart size={19} strokeWidth={1.8} fill={wishlistCount > 0 ? '#C98278' : 'none'} color={wishlistCount > 0 ? '#C98278' : '#4B3024'} />
              {wishlistCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-3px',
                    right: '-4px',
                    backgroundColor: '#C98278',
                    color: '#FFFFFF',
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    width: '17px',
                    height: '17px',
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
                gap: '0.35rem',
                color: '#4B3024',
                padding: '0.38rem 0.55rem',
                minHeight: '38px',
                border: '1px solid rgba(75, 48, 36, 0.18)',
                transition: 'all 0.2s ease',
                backgroundColor: 'rgba(255, 253, 249, 0.7)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#B88D4A';
                e.currentTarget.style.color = '#B88D4A';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(75, 48, 36, 0.18)';
                e.currentTarget.style.color = '#4B3024';
              }}
            >
              <ShoppingBag size={17} strokeWidth={1.8} />
              <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>{cartCount}</span>
            </button>

            {/* Client CRM Admin Portal (Visible on desktop & tablet; mobile has it in drawer) */}
            <button
              onClick={() => navigateTo('admin')}
              title="Boutique Client CRM Portal"
              aria-label="Boutique Client CRM Portal"
              className="d-md-flex"
              style={{
                color: '#4B3024',
                transition: 'all 0.2s ease',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.38rem 0.65rem',
                minHeight: '38px',
                borderRadius: '3px',
                backgroundColor: 'rgba(184, 141, 74, 0.08)',
                border: '1px solid rgba(184, 141, 74, 0.35)',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#B88D4A';
                e.currentTarget.style.borderColor = '#B88D4A';
                e.currentTarget.style.backgroundColor = 'rgba(184, 141, 74, 0.16)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#4B3024';
                e.currentTarget.style.borderColor = 'rgba(184, 141, 74, 0.35)';
                e.currentTarget.style.backgroundColor = 'rgba(184, 141, 74, 0.08)';
              }}
            >
              <Shield size={15} strokeWidth={2} color="#B88D4A" />
              <span
                style={{
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  display: 'none'
                }}
                className="d-md-inline"
              >
                CRM Portal
              </span>
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
              width: 'min(360px, 88vw)',
              maxHeight: '100dvh',
              animation: 'slideInLeft 0.35s var(--ease-cinematic)',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="drawer-header">
              <img
                src="/assets/RODHE Woven Luxury Wordmark.png"
                alt="RODHE"
                style={{ height: '34px', width: 'auto', objectFit: 'contain' }}
              />
              <button
                className="drawer-close"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.5rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', flexGrow: 1 }}>
              {/* Quick Actions in Menu */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', paddingBottom: '0.85rem', borderBottom: '1px solid rgba(75, 48, 36, 0.08)' }}>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsAuthOpen(true);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.65rem 0.75rem',
                    backgroundColor: '#F4ECE1',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: '#4B3024'
                  }}
                >
                  <User size={15} color="#B88D4A" />
                  <span>Sign In / Account</span>
                </button>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsWishlistOpen(true);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.65rem 0.75rem',
                    backgroundColor: '#F4ECE1',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: '#4B3024'
                  }}
                >
                  <Heart size={15} color="#C98278" />
                  <span>Wishlist ({wishlistCount})</span>
                </button>
              </div>

              {/* Primary Routes */}
              <button
                onClick={() => {
                  navigateTo('home');
                  setIsMobileMenuOpen(false);
                }}
                style={{ textAlign: 'left', fontSize: '1.15rem', fontWeight: 500, fontFamily: 'var(--font-serif)', color: '#4B3024', padding: '0.35rem 0' }}
              >
                Home
              </button>

              <div style={{ borderTop: '1px solid rgba(75, 48, 36, 0.08)', paddingTop: '1rem' }}>
                <div style={{ fontSize: '0.74rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#B88D4A', fontWeight: 700, marginBottom: '0.75rem' }}>
                  Sarees by Craft
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', paddingLeft: '0.5rem' }}>
                  <button onClick={() => handleCraftClick('all')} style={{ textAlign: 'left', fontSize: '0.94rem', padding: '0.4rem 0', color: '#4B3024' }}>
                    All Sarees (8)
                  </button>
                  <button onClick={() => handleCraftClick('tie-dye')} style={{ textAlign: 'left', fontSize: '0.94rem', padding: '0.4rem 0', color: '#4B3024' }}>
                    Natural Indigo & Shibori
                  </button>
                  <button onClick={() => handleCraftClick('handblock')} style={{ textAlign: 'left', fontSize: '0.94rem', padding: '0.4rem 0', color: '#4B3024' }}>
                    Bagru Mud-Resist Handblock
                  </button>
                  <button onClick={() => handleCraftClick('chanderi')} style={{ textAlign: 'left', fontSize: '0.94rem', padding: '0.4rem 0', color: '#4B3024' }}>
                    Chanderi Sheer Silk & Zari
                  </button>
                  <button onClick={() => handleCraftClick('mulmul')} style={{ textAlign: 'left', fontSize: '0.94rem', padding: '0.4rem 0', color: '#4B3024' }}>
                    Pure Breathable Mulmul Cotton
                  </button>
                </div>
              </div>

              <div style={{ borderTop: '1px solid rgba(75, 48, 36, 0.08)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <button
                  onClick={() => {
                    navigateTo('story');
                    setIsMobileMenuOpen(false);
                  }}
                  style={{ textAlign: 'left', fontSize: '1.15rem', fontWeight: 500, fontFamily: 'var(--font-serif)', color: '#4B3024', padding: '0.35rem 0' }}
                >
                  Our Craft & Story
                </button>
                <button
                  onClick={() => {
                    navigateTo('contact');
                    setIsMobileMenuOpen(false);
                  }}
                  style={{ textAlign: 'left', fontSize: '1.15rem', fontWeight: 500, fontFamily: 'var(--font-serif)', color: '#4B3024', padding: '0.35rem 0' }}
                >
                  Customer Concierge & Care
                </button>

                <button
                  onClick={() => {
                    navigateTo('admin');
                    setIsMobileMenuOpen(false);
                  }}
                  style={{
                    textAlign: 'left',
                    fontSize: '0.92rem',
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    color: '#B88D4A',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.45rem 0',
                    cursor: 'pointer'
                  }}
                >
                  <Shield size={16} />
                  <span>Boutique Owner CRM</span>
                </button>
              </div>

              <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(75, 48, 36, 0.08)', paddingTop: '1.25rem', textAlign: 'center' }}>
                <p style={{ fontSize: '0.74rem', color: '#8F7263', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 600 }}>
                  Woven with Trust
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Responsive Inline CSS overrides for header */}
      <style>{`
        .header-nav-grid {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          height: var(--header-height);
          position: relative;
          gap: 0.5rem;
        }
        .header-left-col {
          display: flex;
          align-items: center;
          justify-self: start;
          min-width: 0;
        }
        .header-brand-col {
          display: flex;
          align-items: center;
          justify-content: center;
          justify-self: center;
          cursor: pointer;
          user-select: none;
          z-index: 10;
          padding: 0 0.5rem;
        }
        .header-right-col {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          justify-self: end;
          gap: clamp(0.25rem, 1.5vw, 0.75rem);
          min-width: 0;
        }
        .d-md-flex {
          display: none !important;
        }
        @media (min-width: 768px) {
          .d-md-flex {
            display: flex !important;
          }
          .d-md-inline {
            display: inline !important;
          }
        }
        @media (max-width: 900px) {
          .desktop-nav {
            display: none !important;
          }
          .mobile-menu-trigger {
            display: flex !important;
          }
        }
        @media (min-width: 576px) {
          .d-sm-inline {
            display: inline !important;
          }
        }
        @media (max-width: 480px) {
          .header-nav-btn {
            width: 35px !important;
            height: 35px !important;
            min-width: 35px !important;
            min-height: 35px !important;
          }
        }
      `}</style>
    </>
  );
};
