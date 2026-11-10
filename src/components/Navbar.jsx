import React, { useState, useEffect } from 'react';
import {
  Search,
  User,
  Heart,
  ShoppingBag,
  Menu,
  X,
  ChevronDown,
  Sparkles,
  Shield,
  Truck,
  ChevronRight
} from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const Navbar = () => {
  const {
    currentPage,
    navigateTo,
    cartCount,
    wishlistCount,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    closeAllOverlays,
    setIsCartOpen,
    setIsWishlistOpen,
    setIsSearchOpen,
    setIsAuthOpen,
    setIsTrackOrderOpen,
    patronUser,
    setSelectedCraft,
    PRODUCTS
  } = useShop();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isSareesDropdownOpen, setIsSareesDropdownOpen] = useState(false);

  const publishedCount = (PRODUCTS || []).filter((p) => !p.status || p.status === 'published').length;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on Escape key or when resizing into desktop view
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    const handleResize = () => {
      if (window.innerWidth > 900 && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, [isMobileMenuOpen, setIsMobileMenuOpen]);

  const handleCraftClick = (craftCategory) => {
    setSelectedCraft(craftCategory);
    setIsSareesDropdownOpen(false);
    setIsMobileMenuOpen(false);
    navigateTo('shop');
  };

  const openModalFromMobile = (openFn) => {
    closeAllOverlays();
    openFn(true);
  };

  return (
    <>
      {/* Top Announcement Bar */}
      <div
        style={{
          backgroundColor: '#4B3024',
          color: '#FAF6EE',
          padding: '0.4rem clamp(0.6rem, 2vw, 1rem)',
          fontSize: 'clamp(0.66rem, 1.8vw, 0.74rem)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          textAlign: 'center',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'clamp(0.45rem, 1.5vw, 1rem)',
          position: 'relative',
          zIndex: 100,
          lineHeight: 1.35
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
          <Sparkles size={12} color="#D4AC68" style={{ flexShrink: 0 }} />
          <span>Complimentary Express Shipping in India Above ₹2,999</span>
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
          transition: 'background-color 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease',
          backgroundColor: isScrolled
            ? 'rgba(250, 246, 238, 0.97)'
            : 'rgba(250, 246, 238, 0.9)',
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
            <button
              onClick={() => {
                closeAllOverlays();
                setIsMobileMenuOpen(true);
              }}
              aria-label="Open navigation menu"
              aria-expanded={isMobileMenuOpen}
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

            {/* Desktop Navigation Links */}
            <nav
              aria-label="Main storefront navigation"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'clamp(1rem, 1.8vw, 2rem)',
                flexShrink: 0
              }}
              className="desktop-nav"
            >
              <div
                style={{ position: 'relative' }}
                onMouseEnter={() => setIsSareesDropdownOpen(true)}
                onMouseLeave={() => setIsSareesDropdownOpen(false)}
              >
                <button
                  onClick={() => handleCraftClick('all')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: currentPage === 'shop' ? '#B88D4A' : '#4B3024',
                    transition: 'color 0.2s',
                    padding: '0.5rem 0',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <span>Sarees</span>
                  <ChevronDown size={14} style={{ transform: isSareesDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>

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
                      animation: 'fadeIn 0.2s ease',
                      zIndex: 920
                    }}
                  >
                    <div style={{ fontSize: '0.72rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#B88D4A', fontWeight: 700, paddingBottom: '0.5rem', borderBottom: '1px solid rgba(75, 48, 36, 0.08)' }}>
                      Explore by Craft
                    </div>
                    <button
                      onClick={() => handleCraftClick('tie-dye')}
                      style={{ textAlign: 'left', fontSize: '0.86rem', color: '#4B3024', transition: 'color 0.2s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#B88D4A')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#4B3024')}
                    >
                      Natural Indigo & Shibori Tie-Dye
                    </button>
                    <button
                      onClick={() => handleCraftClick('handblock')}
                      style={{ textAlign: 'left', fontSize: '0.86rem', color: '#4B3024', transition: 'color 0.2s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#B88D4A')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#4B3024')}
                    >
                      Bagru Mud-Resist & Handblock Prints
                    </button>
                    <button
                      onClick={() => handleCraftClick('chanderi')}
                      style={{ textAlign: 'left', fontSize: '0.86rem', color: '#4B3024', transition: 'color 0.2s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#B88D4A')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#4B3024')}
                    >
                      Chanderi Sheer Silk & Zari Weaves
                    </button>
                    <button
                      onClick={() => handleCraftClick('mulmul')}
                      style={{ textAlign: 'left', fontSize: '0.86rem', color: '#4B3024', transition: 'color 0.2s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#B88D4A')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#4B3024')}
                    >
                      100% Breathable Mulmul Cottons
                    </button>
                    <div style={{ paddingTop: '0.5rem', borderTop: '1px solid rgba(75, 48, 36, 0.08)' }}>
                      <button
                        onClick={() => handleCraftClick('all')}
                        style={{ fontSize: '0.78rem', color: '#B88D4A', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}
                      >
                        View All {publishedCount} Handcrafted Sarees →
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => handleCraftClick('all')}
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: currentPage === 'collections' || currentPage === 'shop' ? '#B88D4A' : '#4B3024',
                  transition: 'color 0.2s',
                  whiteSpace: 'nowrap'
                }}
              >
                Collections
              </button>

              <button
                onClick={() => navigateTo('story')}
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: currentPage === 'story' ? '#B88D4A' : '#4B3024',
                  transition: 'color 0.2s',
                  whiteSpace: 'nowrap'
                }}
              >
                Craft & Story
              </button>

              <button
                onClick={() => navigateTo('contact')}
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: currentPage === 'contact' ? '#B88D4A' : '#4B3024',
                  transition: 'color 0.2s',
                  whiteSpace: 'nowrap'
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
            role="button"
            tabIndex={0}
            aria-label="RODHE Home"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') navigateTo('home');
            }}
          >
            <img
              id="header-brand-logo"
              src="/assets/RODHE_Secondary_Emblem.png"
              alt="RODHE — Woven with Trust"
              style={{
                height: 'clamp(34px, 5vw, 48px)',
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
              onClick={() => openModalFromMobile(setIsSearchOpen)}
              aria-label="Search sarees"
              title="Search sarees"
              className="header-nav-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem',
                color: '#4B3024',
                transition: 'color 0.2s',
                minWidth: '36px',
                height: '38px',
                padding: '0 0.35rem',
                borderRadius: '4px',
                background: 'none',
                border: 'none',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#B88D4A')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#4B3024')}
            >
              <Search size={19} strokeWidth={1.8} />
              <span style={{ fontSize: '0.76rem', letterSpacing: '0.06em', display: 'none' }} className="d-xl-inline">
                Search
              </span>
            </button>

            {/* Customer Account (Desktop & Tablet; mobile uses Drawer) */}
            <button
              onClick={() => openModalFromMobile(setIsAuthOpen)}
              aria-label={patronUser ? `Customer Account: ${patronUser.name}` : 'Customer account sign in'}
              title={patronUser ? `Account: ${patronUser.name}` : 'Sign In / My Addresses'}
              className="d-md-flex header-nav-btn"
              style={{
                color: patronUser ? '#B88D4A' : '#4B3024',
                transition: 'color 0.2s',
                alignItems: 'center',
                justifyContent: 'center',
                width: '38px',
                height: '38px',
                minWidth: '38px',
                borderRadius: '50%',
                background: patronUser ? 'rgba(184, 141, 74, 0.08)' : 'none',
                border: patronUser ? '1px solid rgba(184, 141, 74, 0.4)' : 'none',
                cursor: 'pointer',
                position: 'relative'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#B88D4A')}
              onMouseLeave={(e) => (e.currentTarget.style.color = patronUser ? '#B88D4A' : '#4B3024')}
            >
              <User size={19} strokeWidth={1.8} />
              {patronUser && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: '3px',
                    right: '3px',
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: '#B88D4A',
                    border: '1.5px solid #FFFDF9'
                  }}
                />
              )}
            </button>

            {/* Track Order */}
            <button
              onClick={() => openModalFromMobile(setIsTrackOrderOpen)}
              aria-label="Track your order"
              title="Track Your Order"
              className="d-md-flex header-nav-btn"
              style={{
                color: '#4B3024',
                transition: 'color 0.2s',
                alignItems: 'center',
                justifyContent: 'center',
                width: '38px',
                height: '38px',
                minWidth: '38px',
                borderRadius: '50%',
                background: 'none',
                border: 'none',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#B88D4A')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#4B3024')}
            >
              <Truck size={19} strokeWidth={1.8} />
            </button>

            {/* Wishlist / Favourites */}
            <button
              onClick={() => openModalFromMobile(setIsWishlistOpen)}
              aria-label={`Favourites with ${wishlistCount} items`}
              title="Saved Favourites"
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
                minWidth: '36px',
                borderRadius: '50%',
                background: 'none',
                border: 'none',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#C98278')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#4B3024')}
            >
              <Heart
                size={19}
                strokeWidth={1.8}
                fill={wishlistCount > 0 ? '#C98278' : 'none'}
                color={wishlistCount > 0 ? '#C98278' : '#4B3024'}
              />
              {wishlistCount > 0 && (
                <span
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    top: '2px',
                    right: '1px',
                    backgroundColor: '#C98278',
                    color: '#FFFFFF',
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    minWidth: '16px',
                    height: '16px',
                    padding: '0 3px',
                    borderRadius: '999px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: 1
                  }}
                >
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Shopping Bag / Cart */}
            <button
              onClick={() => openModalFromMobile(setIsCartOpen)}
              aria-label={`Shopping bag with ${cartCount} items`}
              title="Shopping Bag"
              className="header-cart-btn"
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.3rem',
                color: '#4B3024',
                padding: '0.35rem 0.5rem',
                minHeight: '36px',
                border: '1px solid rgba(75, 48, 36, 0.2)',
                borderRadius: '3px',
                transition: 'all 0.2s ease',
                backgroundColor: 'rgba(255, 253, 249, 0.8)',
                cursor: 'pointer',
                flexShrink: 0
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#B88D4A';
                e.currentTarget.style.color = '#B88D4A';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(75, 48, 36, 0.2)';
                e.currentTarget.style.color = '#4B3024';
              }}
            >
              <ShoppingBag size={16} strokeWidth={1.8} />
              <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>{cartCount}</span>
            </button>

            {/* Store CRM Portal (Strictly isolated desktop owner shortcut — separate from customer navigation & auth) */}
            <button
              onClick={() => {
                closeAllOverlays();
                navigateTo('admin');
              }}
              title="Store Management Portal"
              aria-label="Store Management Portal"
              className="d-md-flex"
              style={{
                color: '#4B3024',
                transition: 'all 0.2s ease',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.35rem 0.55rem',
                minHeight: '36px',
                borderRadius: '3px',
                backgroundColor: 'rgba(184, 141, 74, 0.08)',
                border: '1px solid rgba(184, 141, 74, 0.35)',
                cursor: 'pointer',
                flexShrink: 0
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
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  display: 'none',
                  whiteSpace: 'nowrap'
                }}
                className="d-xl-inline"
              >
                CRM Portal
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation (Customer-only links, clean sticky header, lock scroll, proper layering) */}
      {isMobileMenuOpen && (
        <div
          className="drawer-backdrop"
          onClick={() => setIsMobileMenuOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation menu"
        >
          <div
            className="drawer-content drawer-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Fixed Non-Scrolling Drawer Header */}
            <div className="drawer-header">
              <img
                src="/assets/RODHE Woven Luxury Wordmark.png"
                alt="RODHE"
                style={{ height: '30px', width: 'auto', objectFit: 'contain' }}
              />
              <button
                className="drawer-close"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Close navigation menu"
              >
                <X size={22} />
              </button>
            </div>

            {/* Scrollable Navigation Body */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch',
                padding: '1.25rem',
                paddingBottom: 'calc(1.75rem + env(safe-area-inset-bottom, 0px))',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.15rem'
              }}
            >
              {/* Customer Quick Account & Favourites Actions */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                <button
                  onClick={() => openModalFromMobile(setIsAuthOpen)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.7rem 0.75rem',
                    backgroundColor: '#F4ECE1',
                    border: '1px solid rgba(184, 141, 74, 0.25)',
                    borderRadius: '3px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: '#4B3024',
                    textAlign: 'left',
                    minHeight: '44px'
                  }}
                >
                  <User size={15} color="#B88D4A" style={{ flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {patronUser ? (patronUser.name ? patronUser.name.split(' ')[0] : 'Account') : 'Sign In'}
                  </span>
                </button>

                <button
                  onClick={() => openModalFromMobile(setIsWishlistOpen)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.7rem 0.75rem',
                    backgroundColor: '#F4ECE1',
                    border: '1px solid rgba(184, 141, 74, 0.25)',
                    borderRadius: '3px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: '#4B3024',
                    textAlign: 'left',
                    minHeight: '44px'
                  }}
                >
                  <Heart size={15} color="#C98278" fill={wishlistCount > 0 ? '#C98278' : 'none'} style={{ flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    Saved ({wishlistCount})
                  </span>
                </button>
              </div>

              {/* Shopping Bag & Track Order Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                <button
                  onClick={() => openModalFromMobile(setIsCartOpen)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.65rem 0.75rem',
                    backgroundColor: '#FAF6EE',
                    border: '1px solid rgba(75, 48, 36, 0.16)',
                    borderRadius: '3px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: '#4B3024',
                    minHeight: '44px'
                  }}
                >
                  <ShoppingBag size={15} color="#4B3024" style={{ flexShrink: 0 }} />
                  <span>Bag ({cartCount})</span>
                </button>

                <button
                  onClick={() => openModalFromMobile(setIsTrackOrderOpen)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.65rem 0.75rem',
                    backgroundColor: '#FAF6EE',
                    border: '1px solid rgba(75, 48, 36, 0.16)',
                    borderRadius: '3px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: '#4B3024',
                    minHeight: '44px'
                  }}
                >
                  <Truck size={15} color="#B88D4A" style={{ flexShrink: 0 }} />
                  <span>Track Order</span>
                </button>
              </div>

              {/* Primary Customer Routes */}
              <div style={{ borderTop: '1px solid rgba(75, 48, 36, 0.08)', paddingTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <button
                  onClick={() => {
                    navigateTo('home');
                    setIsMobileMenuOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    textAlign: 'left',
                    fontSize: '1.12rem',
                    fontWeight: 500,
                    fontFamily: 'var(--font-serif)',
                    color: currentPage === 'home' ? '#B88D4A' : '#4B3024',
                    padding: '0.55rem 0.25rem',
                    minHeight: '44px'
                  }}
                >
                  <span>Home</span>
                  <ChevronRight size={15} color="#B88D4A" />
                </button>

                <button
                  onClick={() => {
                    navigateTo('story');
                    setIsMobileMenuOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    textAlign: 'left',
                    fontSize: '1.12rem',
                    fontWeight: 500,
                    fontFamily: 'var(--font-serif)',
                    color: currentPage === 'story' ? '#B88D4A' : '#4B3024',
                    padding: '0.55rem 0.25rem',
                    minHeight: '44px'
                  }}
                >
                  <span>Our Craft & Story</span>
                  <ChevronRight size={15} color="#B88D4A" />
                </button>

                <button
                  onClick={() => {
                    navigateTo('contact');
                    setIsMobileMenuOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    textAlign: 'left',
                    fontSize: '1.12rem',
                    fontWeight: 500,
                    fontFamily: 'var(--font-serif)',
                    color: currentPage === 'contact' ? '#B88D4A' : '#4B3024',
                    padding: '0.55rem 0.25rem',
                    minHeight: '44px'
                  }}
                >
                  <span>Customer Concierge & Care</span>
                  <ChevronRight size={15} color="#B88D4A" />
                </button>
              </div>

              {/* Sarees by Craft Category */}
              <div style={{ borderTop: '1px solid rgba(75, 48, 36, 0.08)', paddingTop: '0.95rem' }}>
                <div style={{ fontSize: '0.72rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#B88D4A', fontWeight: 700, marginBottom: '0.5rem' }}>
                  Sarees by Craft
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', paddingLeft: '0.25rem' }}>
                  <button
                    onClick={() => handleCraftClick('all')}
                    style={{ textAlign: 'left', fontSize: '0.92rem', padding: '0.55rem 0', color: '#4B3024', fontWeight: 600, minHeight: '42px' }}
                  >
                    All Sarees ({publishedCount})
                  </button>
                  <button
                    onClick={() => handleCraftClick('tie-dye')}
                    style={{ textAlign: 'left', fontSize: '0.92rem', padding: '0.55rem 0', color: '#4B3024', minHeight: '42px' }}
                  >
                    Natural Indigo & Shibori
                  </button>
                  <button
                    onClick={() => handleCraftClick('handblock')}
                    style={{ textAlign: 'left', fontSize: '0.92rem', padding: '0.55rem 0', color: '#4B3024', minHeight: '42px' }}
                  >
                    Bagru Mud-Resist Handblock
                  </button>
                  <button
                    onClick={() => handleCraftClick('chanderi')}
                    style={{ textAlign: 'left', fontSize: '0.92rem', padding: '0.55rem 0', color: '#4B3024', minHeight: '42px' }}
                  >
                    Chanderi Sheer Silk & Zari
                  </button>
                  <button
                    onClick={() => handleCraftClick('mulmul')}
                    style={{ textAlign: 'left', fontSize: '0.92rem', padding: '0.55rem 0', color: '#4B3024', minHeight: '42px' }}
                  >
                    Pure Breathable Mulmul Cotton
                  </button>
                </div>
              </div>

              <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(75, 48, 36, 0.08)', paddingTop: '1rem', textAlign: 'center' }}>
                <p style={{ fontSize: '0.72rem', color: '#8F7263', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 600 }}>
                  Woven with Trust
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Responsive Header Layout Styles */}
      <style>{`
        .header-nav-grid {
          display: grid;
          grid-template-columns: auto 1fr auto;
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
          padding: 0 0.35rem;
          min-width: 0;
        }
        .header-right-col {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          justify-self: end;
          gap: clamp(0.15rem, 1.2vw, 0.65rem);
          min-width: 0;
        }
        .d-md-flex {
          display: none !important;
        }
        .d-xl-inline {
          display: none !important;
        }
        @media (min-width: 901px) {
          .header-nav-grid {
            grid-template-columns: 1fr auto 1fr;
          }
          .d-md-flex {
            display: flex !important;
          }
        }
        @media (min-width: 768px) and (max-width: 900px) {
          .d-md-flex {
            display: flex !important;
          }
        }
        @media (min-width: 1120px) {
          .d-xl-inline {
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
            width: 34px !important;
            height: 34px !important;
            min-width: 34px !important;
            min-height: 34px !important;
            padding: 0 !important;
          }
          .header-cart-btn {
            padding: 0.3rem 0.45rem !important;
            min-height: 34px !important;
          }
        }
      `}</style>
    </>
  );
};
