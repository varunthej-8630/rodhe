import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Sparkles, 
  Tag, 
  Mail, 
  AlertTriangle, 
  Plus, 
  Upload, 
  LayoutTemplate, 
  Database, 
  ExternalLink,
  CheckCircle2,
  TrendingUp,
  Clock
} from 'lucide-react';
import { storeService } from '../../services/storeService';
import { isSupabaseConfigured } from '../../services/supabaseClient';
import { useShop } from '../../context/ShopContext';

export const AdminDashboard = ({ onNavigateTab, onNewProduct, onEditProduct }) => {
  const { navigateTo } = useShop();
  const [stats, setStats] = useState({
    totalProducts: 0,
    publishedProducts: 0,
    draftProducts: 0,
    lowStockCount: 0,
    activePromotions: 0,
    totalEnquiries: 0,
    totalSignups: 0
  });
  const [recentProducts, setRecentProducts] = useState([]);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      const products = await storeService.getProducts();
      const promos = await storeService.getPromotions();
      const enquiries = await storeService.getEnquiries();
      const signups = await storeService.getSignups();
      const storeSettings = await storeService.getSettings();

      const published = products.filter(p => p.status === 'published');
      const drafts = products.filter(p => p.status === 'draft');
      const lowStock = products.filter(p => (p.stockCount || 0) <= 5);
      const activePromos = promos.filter(p => p.isActive);

      setStats({
        totalProducts: products.length,
        publishedProducts: published.length,
        draftProducts: drafts.length,
        lowStockCount: lowStock.length,
        activePromotions: activePromos.length,
        totalEnquiries: enquiries.length,
        totalSignups: signups.length
      });

      setRecentProducts(products.slice(0, 5));
      setSettings(storeSettings);
    };

    loadDashboardData();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Banner: Infrastructure & Backend Connection Status */}
      <div
        style={{
          backgroundColor: '#FFFDF9',
          border: '1px solid rgba(184, 141, 74, 0.3)',
          borderRadius: '4px',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              backgroundColor: isSupabaseConfigured ? 'rgba(82, 91, 58, 0.15)' : 'rgba(184, 141, 74, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Database size={20} color={isSupabaseConfigured ? '#525B3A' : '#B88D4A'} />
          </div>
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#4B3024', marginBottom: '0.2rem' }}>
              Backend State: {isSupabaseConfigured ? 'Connected to Supabase PostgreSQL' : 'Local High-Resilience Store Engine Active'}
            </h3>
            <p style={{ fontSize: '0.78rem', color: '#8F7263', margin: 0 }}>
              {isSupabaseConfigured 
                ? 'All catalog mutations sync directly with your production Supabase database & storage buckets.' 
                : 'Operating in local persistence mode. Ready to plug into live Supabase via .env.example credentials.'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem' }}>
          <button
            onClick={() => onNavigateTab('bulk-import')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.55rem 0.95rem',
              backgroundColor: '#FAF6EE',
              border: '1px solid rgba(75, 48, 36, 0.2)',
              borderRadius: '3px',
              fontSize: '0.78rem',
              fontWeight: 600,
              color: '#4B3024',
              cursor: 'pointer'
            }}
          >
            <Upload size={14} color="#B88D4A" />
            <span>Bulk CSV Import</span>
          </button>

          <button
            onClick={onNewProduct}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.55rem 1rem',
              backgroundColor: '#4B3024',
              border: 'none',
              borderRadius: '3px',
              fontSize: '0.78rem',
              fontWeight: 600,
              color: '#FAF6EE',
              cursor: 'pointer'
            }}
          >
            <Plus size={14} />
            <span>Add Saree</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem'
        }}
      >
        {/* Metric 1: Published Sarees */}
        <div style={{ backgroundColor: '#FFFDF9', padding: '1.5rem', borderRadius: '4px', border: '1px solid rgba(75, 48, 36, 0.1)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8F7263' }}>Published Sarees</span>
            <Package size={18} color="#B88D4A" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 600, fontFamily: 'var(--font-serif)', color: '#4B3024', lineHeight: 1 }}>
            {stats.publishedProducts}
          </div>
          <span style={{ fontSize: '0.72rem', color: '#8F7263', marginTop: '0.5rem' }}>
            {stats.draftProducts} drafts in preparation
          </span>
        </div>

        {/* Metric 2: Low Stock Warning */}
        <div style={{ backgroundColor: '#FFFDF9', padding: '1.5rem', borderRadius: '4px', border: '1px solid rgba(75, 48, 36, 0.1)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8F7263' }}>Low Stock Alert</span>
            <AlertTriangle size={18} color="#C98278" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 600, fontFamily: 'var(--font-serif)', color: stats.lowStockCount > 0 ? '#C98278' : '#4B3024', lineHeight: 1 }}>
            {stats.lowStockCount}
          </div>
          <span style={{ fontSize: '0.72rem', color: '#8F7263', marginTop: '0.5rem' }}>
            Sarees with ≤ 5 pieces remaining
          </span>
        </div>

        {/* Metric 3: Active Promotions */}
        <div style={{ backgroundColor: '#FFFDF9', padding: '1.5rem', borderRadius: '4px', border: '1px solid rgba(75, 48, 36, 0.1)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8F7263' }}>Active Offers</span>
            <Tag size={18} color="#B88D4A" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 600, fontFamily: 'var(--font-serif)', color: '#4B3024', lineHeight: 1 }}>
            {stats.activePromotions}
          </div>
          <span style={{ fontSize: '0.72rem', color: '#8F7263', marginTop: '0.5rem' }}>
            Coupons running on storefront
          </span>
        </div>

        {/* Metric 4: Inquiries & Concierge */}
        <div style={{ backgroundColor: '#FFFDF9', padding: '1.5rem', borderRadius: '4px', border: '1px solid rgba(75, 48, 36, 0.1)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8F7263' }}>Inquiries & WhatsApp</span>
            <Mail size={18} color="#525B3A" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 600, fontFamily: 'var(--font-serif)', color: '#4B3024', lineHeight: 1 }}>
            {stats.totalEnquiries}
          </div>
          <span style={{ fontSize: '0.72rem', color: '#8F7263', marginTop: '0.5rem' }}>
            Customer orders & concierge leads
          </span>
        </div>
      </div>

      {/* Two Column Layout: Recent Saree Inventory & Quick Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem' }}>
        {/* Left Column: Recent Products */}
        <div style={{ backgroundColor: '#FFFDF9', borderRadius: '4px', border: '1px solid rgba(75, 48, 36, 0.1)', padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#4B3024', margin: 0 }}>
              Recent Saree Catalog
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <button
                onClick={() => navigateTo('shop')}
                title="View all sarees on the public boutique collection"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#B88D4A',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.2rem 0.4rem'
                }}
              >
                <span>Live Collection</span>
                <ExternalLink size={12} />
              </button>
              <span style={{ color: 'rgba(75, 48, 36, 0.25)' }}>|</span>
              <button
                onClick={() => onNavigateTab('products')}
                style={{ background: 'none', border: 'none', color: '#6F4E3E', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
              >
                View All ({stats.totalProducts}) →
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {recentProducts.map((p) => (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 0.85rem',
                  backgroundColor: '#FAF6EE',
                  borderRadius: '3px',
                  border: '1px solid rgba(75, 48, 36, 0.08)',
                  flexWrap: 'wrap',
                  gap: '0.5rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <img
                    src={p.primaryImage || p.primary_image || '/assets/products/saree_ivory_mulmul.jpg'}
                    alt={p.name || 'Saree'}
                    style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '2px', border: '1px solid rgba(75, 48, 36, 0.12)' }}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/assets/products/saree_ivory_mulmul.jpg';
                    }}
                  />
                  <div>
                    <h4 style={{ fontSize: '0.88rem', fontWeight: 600, color: '#4B3024', margin: 0 }}>
                      {p.name}
                    </h4>
                    <span style={{ fontSize: '0.72rem', color: '#8F7263' }}>
                      SKU: {p.sku} • {p.craft || 'Handloom'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginLeft: 'auto' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#4B3024' }}>
                      ₹{(Number(p.price ?? p.sellingPrice ?? p.selling_price ?? 990) || 990).toLocaleString('en-IN')}
                    </div>
                    <span
                      style={{
                        fontSize: '0.66rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        padding: '0.15rem 0.4rem',
                        borderRadius: '2px',
                        backgroundColor: p.status === 'published' ? 'rgba(82, 91, 58, 0.15)' : 'rgba(184, 141, 74, 0.15)',
                        color: p.status === 'published' ? '#525B3A' : '#B88D4A'
                      }}
                    >
                      {p.status}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <button
                      onClick={() => navigateTo('shop')}
                      title={`View ${p.name} on the Live Boutique Collection`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.35rem 0.6rem',
                        backgroundColor: '#FFFDF9',
                        border: '1px solid rgba(184, 141, 74, 0.4)',
                        borderRadius: '2px',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        color: '#4B3024',
                        cursor: 'pointer'
                      }}
                    >
                      <span>Live Store</span>
                      <ExternalLink size={11} color="#B88D4A" />
                    </button>

                    {onEditProduct && (
                      <button
                        onClick={() => onEditProduct(p)}
                        title="Edit Saree Details"
                        style={{
                          padding: '0.35rem 0.5rem',
                          backgroundColor: 'transparent',
                          border: '1px solid rgba(75, 48, 36, 0.18)',
                          borderRadius: '2px',
                          fontSize: '0.72rem',
                          color: '#4B3024',
                          cursor: 'pointer'
                        }}
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Store Merchandising Shortcuts */}
        <div style={{ backgroundColor: '#FFFDF9', borderRadius: '4px', border: '1px solid rgba(75, 48, 36, 0.1)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#4B3024', margin: 0 }}>
            Operational Shortcuts
          </h3>

          <div
            onClick={() => onNavigateTab('homepage')}
            style={{
              padding: '1rem',
              backgroundColor: '#FAF6EE',
              borderRadius: '3px',
              border: '1px solid rgba(184, 141, 74, 0.25)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#B88D4A')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(184, 141, 74, 0.25)')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
              <LayoutTemplate size={18} color="#B88D4A" />
              <h4 style={{ fontSize: '0.88rem', fontWeight: 600, color: '#4B3024', margin: 0 }}>
                Homepage Merchandiser
              </h4>
            </div>
            <p style={{ fontSize: '0.76rem', color: '#8F7263', margin: 0 }}>
              Adjust hero headline, trust counts, Bestsellers promotional banner, and Most Coveted selections.
            </p>
          </div>

          <div
            onClick={() => onNavigateTab('bulk-import')}
            style={{
              padding: '1rem',
              backgroundColor: '#FAF6EE',
              borderRadius: '3px',
              border: '1px solid rgba(184, 141, 74, 0.25)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#B88D4A')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(184, 141, 74, 0.25)')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
              <Upload size={18} color="#B88D4A" />
              <h4 style={{ fontSize: '0.88rem', fontWeight: 600, color: '#4B3024', margin: 0 }}>
                Bulk Catalog Importer
              </h4>
            </div>
            <p style={{ fontSize: '0.76rem', color: '#8F7263', margin: 0 }}>
              Upload up to 200+ sarees at once via CSV with automated image matching and price validation.
            </p>
          </div>

          <div
            onClick={() => onNavigateTab('settings')}
            style={{
              padding: '1rem',
              backgroundColor: '#FAF6EE',
              borderRadius: '3px',
              border: '1px solid rgba(184, 141, 74, 0.25)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#B88D4A')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(184, 141, 74, 0.25)')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
              <Sparkles size={18} color="#B88D4A" />
              <h4 style={{ fontSize: '0.88rem', fontWeight: 600, color: '#4B3024', margin: 0 }}>
                WhatsApp Ordering & Settings
              </h4>
            </div>
            <p style={{ fontSize: '0.76rem', color: '#8F7263', margin: 0 }}>
              Configure your verified WhatsApp phone number, free shipping threshold (₹{settings?.freeShippingThreshold || 2999}), and concierge contacts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
