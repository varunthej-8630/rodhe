import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Upload, 
  FolderTree, 
  LayoutTemplate, 
  Tag, 
  MessageSquareQuote, 
  Mail, 
  Settings, 
  LogOut, 
  ExternalLink,
  Menu,
  X,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { authService } from '../../services/authService';

export const AdminLayout = ({ children, activeTab, setActiveTab, onNavigateToStorefront, onLogout }) => {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const session = authService.getCurrentSession();

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'products', label: 'Saree Inventory', icon: Package },
    { id: 'bulk-import', label: 'Bulk Import & CSV', icon: Upload },
    { id: 'collections', label: 'Collections', icon: FolderTree },
    { id: 'homepage', label: 'Homepage Merchandiser', icon: LayoutTemplate },
    { id: 'promotions', label: 'Coupons & Offers', icon: Tag },
    { id: 'testimonials', label: 'Patron Stories', icon: MessageSquareQuote },
    { id: 'enquiries', label: 'Concierge Inquiries', icon: Mail },
    { id: 'settings', label: 'Store Settings', icon: Settings },
  ];

  const handleNavClick = (tabId) => {
    setActiveTab(tabId);
    setIsMobileNavOpen(false);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F7F4EE', color: '#4B3024', fontFamily: 'var(--font-sans)' }}>
      {/* Sidebar for Desktop */}
      <aside
        style={{
          width: '280px',
          backgroundColor: '#2A1A13',
          color: '#FAF6EE',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 50,
          boxShadow: '4px 0 25px rgba(0,0,0,0.15)',
          transition: 'transform 0.3s ease'
        }}
        className={isMobileNavOpen ? 'admin-sidebar-mobile-open' : 'admin-sidebar-desktop'}
      >
        {/* Brand Header */}
        <div style={{ padding: '1.75rem 1.5rem', borderBottom: '1px solid rgba(234, 218, 181, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.2rem' }}>
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.45rem', letterSpacing: '0.12em', color: '#EADAB5', fontWeight: 600 }}>RODHE</span>
              <span style={{ fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', backgroundColor: '#B88D4A', color: '#2A1A13', padding: '0.15rem 0.45rem', borderRadius: '2px', fontWeight: 700 }}>CRM</span>
            </div>
            <span style={{ fontSize: '0.70rem', color: 'rgba(234, 218, 181, 0.6)', letterSpacing: '0.08em' }}>Client Management Suite</span>
          </div>
          <button
            onClick={() => setIsMobileNavOpen(false)}
            style={{ display: 'none', background: 'none', border: 'none', color: '#EADAB5', cursor: 'pointer' }}
            className="admin-mobile-close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav style={{ flexGrow: 1, padding: '1.25rem 0.75rem', overflowY: 'auto' }}>
          <div style={{ fontSize: '0.66rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(234, 218, 181, 0.45)', padding: '0 0.75rem 0.65rem', fontWeight: 600 }}>
            Store Management
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 0.9rem',
                    borderRadius: '4px',
                    fontSize: '0.84rem',
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? '#2A1A13' : 'rgba(250, 246, 238, 0.85)',
                    backgroundColor: isActive ? '#EADAB5' : 'transparent',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(234, 218, 181, 0.08)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <Icon size={17} color={isActive ? '#2A1A13' : '#D4AC68'} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Footer Actions */}
        <div style={{ padding: '1rem 0.75rem', borderTop: '1px solid rgba(234, 218, 181, 0.12)', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
          <button
            onClick={() => window.open('/#collections', '_blank')}
            title="Open the complete Saree Collection atelier in a new tab"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '0.65rem 0.85rem',
              backgroundColor: '#B88D4A',
              border: 'none',
              borderRadius: '4px',
              color: '#2A1A13',
              fontWeight: 700,
              fontSize: '0.78rem',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(184, 141, 74, 0.25)'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Package size={14} color="#2A1A13" />
              <span>View Saree Collection</span>
            </span>
            <ExternalLink size={12} color="#2A1A13" />
          </button>

          <button
            onClick={() => window.open('/', '_blank')}
            title="Open live boutique homepage in a new tab"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '0.55rem 0.85rem',
              backgroundColor: 'rgba(234, 218, 181, 0.08)',
              border: '1px solid rgba(184, 141, 74, 0.25)',
              borderRadius: '4px',
              color: '#EADAB5',
              fontSize: '0.76rem',
              cursor: 'pointer'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <ExternalLink size={13} color="#D4AC68" />
              <span>View Boutique Home</span>
            </span>
            <span style={{ fontSize: '0.68rem', opacity: 0.7 }}>↗</span>
          </button>

          <button
            onClick={() => onNavigateToStorefront && onNavigateToStorefront('shop')}
            title="View complete saree collection in this window"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '0.5rem 0.85rem',
              backgroundColor: 'transparent',
              border: '1px solid rgba(234, 218, 181, 0.15)',
              borderRadius: '4px',
              color: 'rgba(234, 218, 181, 0.75)',
              fontSize: '0.74rem',
              cursor: 'pointer',
              marginBottom: '0.25rem'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Package size={13} color="#D4AC68" />
              <span>Browse All Sarees</span>
            </span>
            <span>→</span>
          </button>

          <button
            onClick={onLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              width: '100%',
              padding: '0.65rem 0.85rem',
              backgroundColor: 'transparent',
              border: 'none',
              color: 'rgba(234, 218, 181, 0.65)',
              fontSize: '0.78rem',
              cursor: 'pointer',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#E8B5AE')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(234, 218, 181, 0.65)')}
          >
            <LogOut size={14} />
            <span>Sign Out ({session?.name || 'Administrator'})</span>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isMobileNavOpen && (
        <div
          className="admin-backdrop"
          onClick={() => setIsMobileNavOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(42, 26, 19, 0.65)',
            backdropFilter: 'blur(3px)',
            zIndex: 45
          }}
        />
      )}

      {/* Main Content Area */}
      <div className="admin-main-wrapper" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', minWidth: 0 }}>
        {/* Top Navbar */}
        <header
          style={{
            minHeight: '65px',
            backgroundColor: '#FFFDF9',
            borderBottom: '1px solid rgba(75, 48, 36, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem clamp(1rem, 3vw, 2rem)',
            position: 'sticky',
            top: 0,
            zIndex: 40,
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <button
              onClick={() => setIsMobileNavOpen(true)}
              style={{ background: 'none', border: 'none', color: '#4B3024', cursor: 'pointer', padding: '0.35rem', display: 'none' }}
              className="admin-mobile-toggle"
              aria-label="Open CRM Navigation Menu"
            >
              <Menu size={22} />
            </button>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.15rem, 2.5vw, 1.35rem)', fontWeight: 600, color: '#4B3024', margin: 0 }}>
              {navItems.find(i => i.id === activeTab)?.label || 'Store Management'}
            </h1>
          </div>

          <div className="admin-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <div className="admin-badge-verified" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.74rem', color: '#6F4E3E', backgroundColor: '#F4ECE1', padding: '0.35rem 0.65rem', borderRadius: '4px', border: '1px solid rgba(184, 141, 74, 0.2)' }}>
              <ShieldCheck size={14} color="#B88D4A" />
              <span>Admin Verified</span>
            </div>

            <button
              onClick={() => onNavigateToStorefront && onNavigateToStorefront('shop')}
              title="View all sarees on the public boutique collection"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.76rem',
                fontWeight: 700,
                color: '#2A1A13',
                backgroundColor: '#EADAB5',
                border: '1px solid #B88D4A',
                padding: '0.42rem 0.85rem',
                borderRadius: '3px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 2px 6px rgba(184, 141, 74, 0.2)'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#D4AC68')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#EADAB5')}
            >
              <Package size={14} color="#2A1A13" />
              <span className="btn-label-text">View Sarees</span>
            </button>

            <button
              onClick={() => onNavigateToStorefront && onNavigateToStorefront('home')}
              title="Return to boutique homepage"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.76rem',
                fontWeight: 600,
                color: '#FAF6EE',
                backgroundColor: '#4B3024',
                padding: '0.42rem 0.85rem',
                borderRadius: '3px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <span className="btn-label-text">Storefront</span>
              <ExternalLink size={12} />
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main style={{ padding: 'clamp(1rem, 2.5vw, 2rem)', flexGrow: 1, minWidth: 0, overflowX: 'auto' }}>
          {children}
        </main>
      </div>

      {/* Responsive Styles for Admin CRM */}
      <style>{`
        .admin-main-wrapper {
          margin-left: 280px;
          transition: margin-left 0.3s ease;
        }

        @media (min-width: 1025px) {
          .admin-sidebar-desktop {
            transform: translateX(0) !important;
          }
          .admin-mobile-toggle,
          .admin-mobile-close {
            display: none !important;
          }
        }

        @media (max-width: 1024px) {
          .admin-sidebar-desktop {
            transform: translateX(-100%);
          }
          .admin-sidebar-mobile-open {
            transform: translateX(0);
          }
          .admin-main-wrapper {
            margin-left: 0 !important;
            width: 100% !important;
          }
          .admin-mobile-toggle {
            display: inline-flex !important;
          }
          .admin-mobile-close {
            display: inline-flex !important;
          }
        }

        @media (max-width: 520px) {
          .admin-badge-verified {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};
