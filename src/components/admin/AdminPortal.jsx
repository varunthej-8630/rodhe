import React, { useState, useEffect, useRef, useCallback } from 'react';
import { authService } from '../../services/authService';
import { supabase, isSupabaseConfigured } from '../../services/supabaseClient';
import { AdminLogin } from './AdminLogin';
import { AdminLayout } from './AdminLayout';
import { AdminDashboard } from './AdminDashboard';
import { AdminOrders } from './AdminOrders';
import { MoneyPlanner } from './MoneyPlanner';
import { AdminProductList } from './AdminProductList';
import { AdminProductForm } from './AdminProductForm';
import { AdminBulkImport } from './AdminBulkImport';
import { AdminHomepageManager } from './AdminHomepageManager';
import { AdminPromotions } from './AdminPromotions';
import { AdminTestimonials } from './AdminTestimonials';
import { AdminEnquiries } from './AdminEnquiries';
import { AdminSettings } from './AdminSettings';
import { AdminCollections } from './AdminCollections';

export const AdminPortal = ({ onNavigateToStorefront }) => {
  const [session, setSession] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [editingProduct, setEditingProduct] = useState(null);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const navGuardRef = useRef(null);

  const registerNavigationGuard = useCallback((guardFn) => {
    navGuardRef.current = guardFn;
  }, []);

  const attemptNavigation = useCallback((proceed) => {
    if (activeTab === 'money-planner' && typeof navGuardRef.current === 'function') {
      const allowed = navGuardRef.current(proceed);
      if (!allowed) return;
    }
    proceed();
  }, [activeTab]);

  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      setIsCheckingAuth(true);
      try {
        const verified = await authService.getCurrentSession();
        if (isMounted) {
          setSession(verified);
        }
      } catch (err) {
        if (isMounted) {
          setSession(null);
        }
      } finally {
        if (isMounted) {
          setIsCheckingAuth(false);
        }
      }
    };

    verifySession();

    // Listen for Supabase GoTrue auth changes
    let subscription = null;
    if (isSupabaseConfigured && supabase) {
      const { data } = supabase.auth.onAuthStateChange(async (event, newSession) => {
        if (!isMounted) return;
        if (event === 'SIGNED_OUT' || !newSession) {
          setSession(null);
          setIsCheckingAuth(false);
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          const verified = await authService.getCurrentSession();
          if (isMounted) {
            setSession(verified);
            setIsCheckingAuth(false);
          }
        }
      });
      subscription = data?.subscription;
    }

    return () => {
      isMounted = false;
      if (subscription?.unsubscribe) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const handleLoginSuccess = (userSession) => {
    setSession(userSession);
    setIsCheckingAuth(false);
  };

  const handleLogout = async () => {
    attemptNavigation(async () => {
      await authService.logout();
      setSession(null);
      setIsCheckingAuth(false);
      if (onNavigateToStorefront) {
        onNavigateToStorefront('home');
      }
    });
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

  // 1. While checking authentication status, show luxury loading state
  if (isCheckingAuth) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#2A1A13',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1.25rem',
          color: '#FAF6EE',
          fontFamily: 'var(--font-serif)',
          padding: '2rem'
        }}
      >
        <div
          style={{
            width: '42px',
            height: '42px',
            border: '2px solid rgba(184, 141, 74, 0.25)',
            borderTopColor: '#B88D4A',
            borderRadius: '50%',
            animation: 'rodhe-spin 1s linear infinite'
          }}
        />
        <style>{`@keyframes rodhe-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '1.1rem', letterSpacing: '0.12em', color: '#EADAB5', margin: '0 0 0.35rem 0' }}>
            RODHE ATELIER
          </p>
          <p style={{ fontSize: '0.72rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(234, 218, 181, 0.7)', margin: 0, fontFamily: 'var(--font-sans)' }}>
            Verifying Administrator Credentials...
          </p>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated: Render login page only
  if (!session) {
    return (
      <AdminLogin
        onLoginSuccess={handleLoginSuccess}
        onBackToStore={() => onNavigateToStorefront && onNavigateToStorefront('home')}
      />
    );
  }

  // 3. Authenticated: Render protected AdminLayout
  return (
    <AdminLayout
      session={session}
      activeTab={activeTab}
      setActiveTab={(tab) => {
        if (tab === activeTab) return;
        attemptNavigation(() => {
          setIsCreatingProduct(false);
          setEditingProduct(null);
          setActiveTab(tab);
        });
      }}
      onNavigateToStorefront={(target = 'home') => {
        attemptNavigation(() => {
          if (onNavigateToStorefront) onNavigateToStorefront(target);
        });
      }}
      onLogout={handleLogout}
    >
      {activeTab === 'dashboard' && (
        <AdminDashboard
          onNavigateTab={setActiveTab}
          onNewProduct={handleStartNewProduct}
          onEditProduct={handleEditProduct}
        />
      )}

      {activeTab === 'orders' && (
        <AdminOrders
          adminEmail={session?.email || session?.user?.email || 'administrator'}
        />
      )}

      {activeTab === 'money-planner' && (
        <MoneyPlanner registerNavigationGuard={registerNavigationGuard} />
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

      {activeTab === 'collections' && <AdminCollections />}
    </AdminLayout>
  );
};
