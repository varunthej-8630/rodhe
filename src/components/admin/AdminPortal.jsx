import React, { useState, useEffect } from 'react';
import { authService } from '../../services/authService';
import { AdminLogin } from './AdminLogin';
import { AdminLayout } from './AdminLayout';
import { AdminDashboard } from './AdminDashboard';
import { AdminProductList } from './AdminProductList';
import { AdminProductForm } from './AdminProductForm';
import { AdminBulkImport } from './AdminBulkImport';
import { AdminHomepageManager } from './AdminHomepageManager';
import { AdminPromotions } from './AdminPromotions';
import { AdminTestimonials } from './AdminTestimonials';
import { AdminEnquiries } from './AdminEnquiries';
import { AdminSettings } from './AdminSettings';

export const AdminPortal = ({ onNavigateToStorefront }) => {
  const [session, setSession] = useState(() => authService.getCurrentSession());
  const [activeTab, setActiveTab] = useState('dashboard');
  const [editingProduct, setEditingProduct] = useState(null);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);

  useEffect(() => {
    // Check authentication status
    const current = authService.getCurrentSession();
    setSession(current);
  }, []);

  const handleLoginSuccess = (userSession) => {
    setSession(userSession);
  };

  const handleLogout = async () => {
    await authService.logout();
    setSession(null);
  };

  const handleStartNewProduct = () => {
    setEditingProduct(null);
    setIsCreatingProduct(true);
    setActiveTab('products');
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setIsCreatingProduct(false);
    setActiveTab('products');
  };

  const handleProductSaved = () => {
    setEditingProduct(null);
    setIsCreatingProduct(false);
  };

  if (!session) {
    return (
      <AdminLogin
        onLoginSuccess={handleLoginSuccess}
        onBackToStore={onNavigateToStorefront}
      />
    );
  }

  return (
    <AdminLayout
      activeTab={activeTab}
      setActiveTab={(tab) => {
        setIsCreatingProduct(false);
        setEditingProduct(null);
        setActiveTab(tab);
      }}
      onNavigateToStorefront={onNavigateToStorefront}
      onLogout={handleLogout}
    >
      {activeTab === 'dashboard' && (
        <AdminDashboard
          onNavigateTab={setActiveTab}
          onNewProduct={handleStartNewProduct}
          onEditProduct={handleEditProduct}
        />
      )}

      {activeTab === 'products' && (
        isCreatingProduct || editingProduct ? (
          <AdminProductForm
            product={editingProduct}
            onSaveComplete={handleProductSaved}
            onCancel={() => {
              setIsCreatingProduct(false);
              setEditingProduct(null);
            }}
          />
        ) : (
          <AdminProductList
            onEditProduct={handleEditProduct}
            onNewProduct={handleStartNewProduct}
          />
        )
      )}

      {activeTab === 'bulk-import' && (
        <AdminBulkImport
          onImportComplete={() => {
            setActiveTab('products');
          }}
        />
      )}

      {activeTab === 'homepage' && <AdminHomepageManager />}

      {activeTab === 'promotions' && <AdminPromotions />}

      {activeTab === 'testimonials' && <AdminTestimonials />}

      {activeTab === 'enquiries' && <AdminEnquiries />}

      {activeTab === 'settings' && <AdminSettings />}

      {activeTab === 'collections' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Header Banner with Live Store Launch */}
          <div
            style={{
              backgroundColor: '#FFFDF9',
              padding: '1.75rem 2rem',
              borderRadius: '4px',
              border: '1px solid rgba(75, 48, 36, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1.25rem'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.72rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#B88D4A', fontWeight: 700 }}>
                  Storefront Merchandising
                </span>
                <span style={{ fontSize: '0.72rem', backgroundColor: 'rgba(82, 91, 58, 0.15)', color: '#525B3A', padding: '0.1rem 0.45rem', borderRadius: '2px', fontWeight: 600 }}>
                  Live & Synced
                </span>
              </div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', color: '#4B3024', margin: '0 0 0.5rem' }}>
                RODHE Saree Collections
              </h3>
              <p style={{ fontSize: '0.86rem', color: '#8F7263', margin: 0, maxWidth: '640px' }}>
                All published sarees (including your newly created and updated editions) are organized into botanical and craft collections and immediately accessible on the storefront.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => onNavigateToStorefront && onNavigateToStorefront('shop')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.65rem 1.25rem',
                  backgroundColor: '#B88D4A',
                  color: '#2A1A13',
                  border: 'none',
                  borderRadius: '3px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(184, 141, 74, 0.25)'
                }}
              >
                <span>Open Saree Atelier (Current Tab) →</span>
              </button>

              <button
                onClick={() => window.open('/#collections', '_blank')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.65rem 1.15rem',
                  backgroundColor: '#FFFDF9',
                  color: '#4B3024',
                  border: '1px solid rgba(184, 141, 74, 0.4)',
                  borderRadius: '3px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <span>Open in New Tab ↗</span>
              </button>
            </div>
          </div>

          {/* Craft Collections Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {[
              {
                id: 'handblock',
                name: 'Handblock & Bagru Mud-Resist',
                tagline: 'Teakwood blocks & natural botanical river mud',
                badge: 'Updated with new editions',
                description: 'Features newly added sarees like ASDFG and heritage Bagru mud-resist pieces.'
              },
              {
                id: 'tie-dye',
                name: 'Indigo & Shibori Tie-Dye',
                tagline: 'Living indigo fermented vats and clamped mulmul',
                badge: 'Signature Craft',
                description: 'Nilambari Shibori and natural plant-dyed dip and fold designs.'
              },
              {
                id: 'chanderi',
                name: 'Chanderi Silk & Zari Weaves',
                tagline: 'Featherweight silk warps with hand-spun cotton wefts',
                badge: 'Royal Heirloom',
                description: 'Translucent evening drapes accented with antique spun golden borders.'
              },
              {
                id: 'mulmul',
                name: '100% Breathable Mulmul Cottons',
                tagline: 'Ultra-soft gossamer weave for daily poetic elegance',
                badge: 'All-Day Luxury',
                description: 'Pre-washed featherweight cottons that drape with effortless grace.'
              }
            ].map((col) => (
              <div
                key={col.id}
                style={{
                  backgroundColor: '#FFFDF9',
                  border: '1px solid rgba(75, 48, 36, 0.1)',
                  borderRadius: '4px',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1rem'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.70rem', fontWeight: 600, color: '#B88D4A', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {col.badge}
                    </span>
                  </div>
                  <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', color: '#4B3024', margin: '0 0 0.35rem' }}>
                    {col.name}
                  </h4>
                  <div style={{ fontSize: '0.76rem', color: '#6F4E3E', fontStyle: 'italic', marginBottom: '0.65rem' }}>
                    {col.tagline}
                  </div>
                  <p style={{ fontSize: '0.82rem', color: '#8F7263', margin: 0, lineHeight: 1.45 }}>
                    {col.description}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.65rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(75, 48, 36, 0.08)' }}>
                  <button
                    onClick={() => onNavigateToStorefront && onNavigateToStorefront('shop')}
                    style={{
                      flex: 1,
                      padding: '0.45rem 0.75rem',
                      backgroundColor: '#FAF6EE',
                      border: '1px solid rgba(184, 141, 74, 0.35)',
                      borderRadius: '3px',
                      fontSize: '0.76rem',
                      fontWeight: 600,
                      color: '#4B3024',
                      cursor: 'pointer'
                    }}
                  >
                    View on Storefront →
                  </button>

                  <button
                    onClick={() => setActiveTab('products')}
                    style={{
                      padding: '0.45rem 0.75rem',
                      backgroundColor: 'transparent',
                      border: '1px solid rgba(75, 48, 36, 0.15)',
                      borderRadius: '3px',
                      fontSize: '0.76rem',
                      color: '#6F4E3E',
                      cursor: 'pointer'
                    }}
                  >
                    Manage Sarees
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
