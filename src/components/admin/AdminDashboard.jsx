import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Sparkles, 
  Tag, 
  Mail, 
  AlertTriangle, 
  Plus, 
  Upload, 
  Database, 
  ExternalLink,
  FolderTree,
  XCircle
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
    outOfStockCount: 0,
    activePromotions: 0,
    totalEnquiries: 0,
    newEnquiriesCount: 0,
    totalCollections: 0
  });
  const [recentProducts, setRecentProducts] = useState([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [products, promos, enquiries, collections] = await Promise.all([
          storeService.getProducts(),
          storeService.getPromotions(),
          storeService.getEnquiries(),
          storeService.getCollections()
        ]);

        const published = products.filter(p => p.status === 'published');
        const drafts = products.filter(p => p.status === 'draft');
        const outOfStock = products.filter(p => (Number(p.stockCount ?? p.stock_count ?? 0) === 0) || p.inStock === false || p.in_stock === false);
        const lowStock = products.filter(p => {
          const count = Number(p.stockCount ?? p.stock_count ?? 0);
          return count > 0 && count <= 5;
        });
        const activePromos = promos.filter(p => p.isActive);
        const newEnquiries = enquiries.filter(e => e.status === 'new' || !e.status);

        setStats({
          totalProducts: products.length,
          publishedProducts: published.length,
          draftProducts: drafts.length,
          lowStockCount: lowStock.length,
          outOfStockCount: outOfStock.length,
          activePromotions: activePromos.length,
          totalEnquiries: enquiries.length,
          newEnquiriesCount: newEnquiries.length,
          totalCollections: collections.length
        });

        setRecentProducts(products.slice(0, 6));
      } catch (err) {
        console.warn('Dashboard load notice:', err);
      }
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
              Backend State: {isSupabaseConfigured ? 'Connected to Supabase PostgreSQL' : 'Local High-Resilience Mode Active'}
            </h3>
            <p style={{ fontSize: '0.78rem', color: '#8F7263', margin: 0 }}>
              {isSupabaseConfigured 
                ? 'Store catalog, collections, promotions, and settings synchronize with your live Supabase project (emtmzrjaygcrmzoatvfa).' 
                : 'Operating in local persistence mode. All edits are permanently saved locally.'}
            </p>
          </div>
        </div>

        {/* Header Action Shortcuts */}
        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => onNavigateTab('collections')}
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
            <FolderTree size={14} color="#B88D4A" />
            <span>Collections ({stats.totalCollections})</span>
          </button>

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

      {/* Metrics Row - 100% Real Database Values */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '1.25rem'
        }}
      >
        {/* Metric 1: Published Sarees */}
        <div 
          onClick={() => onNavigateTab && onNavigateTab('products')}
          style={{ 
            backgroundColor: '#FFFDF9', 
            padding: '1.5rem', 
            borderRadius: '4px', 
            border: '1px solid rgba(75, 48, 36, 0.1)', 
            display: 'flex', 
            flexDirection: 'column',
            cursor: 'pointer',
            transition: 'border-color 0.2s'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#B88D4A')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(75, 48, 36, 0.1)')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8F7263' }}>
              Published Sarees
            </span>
            <Package size={18} color="#B88D4A" />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 600, fontFamily: 'var(--font-serif)', color: '#4B3024', lineHeight: 1 }}>
            {stats.publishedProducts}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.65rem' }}>
            <span style={{ fontSize: '0.72rem', color: '#8F7263' }}>
              Live in Boutique Atelier
            </span>
            <span style={{ fontSize: '0.72rem', color: '#B88D4A', fontWeight: 600 }}>Manage →</span>
          </div>
        </div>

        {/* Metric 2: Draft Sarees */}
        <div 
          onClick={() => onNavigateTab && onNavigateTab('products')}
          style={{ 
            backgroundColor: '#FFFDF9', 
            padding: '1.5rem', 
            borderRadius: '4px', 
            border: '1px solid rgba(75, 48, 36, 0.1)', 
            display: 'flex', 
            flexDirection: 'column',
            cursor: 'pointer',
            transition: 'border-color 0.2s'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#B88D4A')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(75, 48, 36, 0.1)')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8F7263' }}>
              Draft Sarees
            </span>
            <Sparkles size={18} color="#8F7263" />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 600, fontFamily: 'var(--font-serif)', color: '#4B3024', lineHeight: 1 }}>
            {stats.draftProducts}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.65rem' }}>
            <span style={{ fontSize: '0.72rem', color: '#8F7263' }}>
              Unpublished creations
            </span>
            <span style={{ fontSize: '0.72rem', color: '#B88D4A', fontWeight: 600 }}>Review →</span>
          </div>
        </div>

        {/* Metric 3: Low Stock Warning */}
        <div 
          onClick={() => onNavigateTab && onNavigateTab('products')}
          style={{ 
            backgroundColor: '#FFFDF9', 
            padding: '1.5rem', 
            borderRadius: '4px', 
            border: '1px solid rgba(75, 48, 36, 0.1)', 
            display: 'flex', 
            flexDirection: 'column',
            cursor: 'pointer',
            transition: 'border-color 0.2s'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#C98278')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(75, 48, 36, 0.1)')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8F7263' }}>
              Low Stock (≤ 5)
            </span>
            <AlertTriangle size={18} color={stats.lowStockCount > 0 ? '#C98278' : '#8F7263'} />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 600, fontFamily: 'var(--font-serif)', color: stats.lowStockCount > 0 ? '#C98278' : '#4B3024', lineHeight: 1 }}>
            {stats.lowStockCount}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.65rem' }}>
            <span style={{ fontSize: '0.72rem', color: '#8F7263' }}>
              Nearing replenishment
            </span>
            <span style={{ fontSize: '0.72rem', color: '#C98278', fontWeight: 600 }}>Update →</span>
          </div>
        </div>

        {/* Metric 4: Out of Stock */}
        <div 
          onClick={() => onNavigateTab && onNavigateTab('products')}
          style={{ 
            backgroundColor: '#FFFDF9', 
            padding: '1.5rem', 
            borderRadius: '4px', 
            border: '1px solid rgba(75, 48, 36, 0.1)', 
            display: 'flex', 
            flexDirection: 'column',
            cursor: 'pointer',
            transition: 'border-color 0.2s'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#8F7263')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(75, 48, 36, 0.1)')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8F7263' }}>
              Out of Stock (0)
            </span>
            <XCircle size={18} color={stats.outOfStockCount > 0 ? '#C98278' : '#8F7263'} />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 600, fontFamily: 'var(--font-serif)', color: stats.outOfStockCount > 0 ? '#C98278' : '#4B3024', lineHeight: 1 }}>
            {stats.outOfStockCount}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.65rem' }}>
            <span style={{ fontSize: '0.72rem', color: '#8F7263' }}>
              Currently unavailable
            </span>
            <span style={{ fontSize: '0.72rem', color: '#8F7263', fontWeight: 600 }}>Restock →</span>
          </div>
        </div>

        {/* Metric 5: Active Offers */}
        <div 
          onClick={() => onNavigateTab && onNavigateTab('promotions')}
          style={{ 
            backgroundColor: '#FFFDF9', 
            padding: '1.5rem', 
            borderRadius: '4px', 
            border: '1px solid rgba(75, 48, 36, 0.1)', 
            display: 'flex', 
            flexDirection: 'column',
            cursor: 'pointer',
            transition: 'border-color 0.2s'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#B88D4A')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(75, 48, 36, 0.1)')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8F7263' }}>
              Active Offers
            </span>
            <Tag size={18} color="#B88D4A" />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 600, fontFamily: 'var(--font-serif)', color: '#4B3024', lineHeight: 1 }}>
            {stats.activePromotions}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.65rem' }}>
            <span style={{ fontSize: '0.72rem', color: '#8F7263' }}>
              Active coupons & discounts
            </span>
            <span style={{ fontSize: '0.72rem', color: '#B88D4A', fontWeight: 600 }}>Manage →</span>
          </div>
        </div>

        {/* Metric 6: Customer Enquiries */}
        <div 
          onClick={() => onNavigateTab && onNavigateTab('enquiries')}
          style={{ 
            backgroundColor: '#FFFDF9', 
            padding: '1.5rem', 
            borderRadius: '4px', 
            border: '1px solid rgba(75, 48, 36, 0.1)', 
            display: 'flex', 
            flexDirection: 'column',
            cursor: 'pointer',
            transition: 'border-color 0.2s'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#525B3A')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(75, 48, 36, 0.1)')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8F7263' }}>
              Concierge Inquiries
            </span>
            <Mail size={18} color="#525B3A" />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 600, fontFamily: 'var(--font-serif)', color: '#4B3024', lineHeight: 1 }}>
            {stats.totalEnquiries}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.65rem' }}>
            <span style={{ fontSize: '0.72rem', color: stats.newEnquiriesCount > 0 ? '#525B3A' : '#8F7263', fontWeight: stats.newEnquiriesCount > 0 ? 600 : 400 }}>
              {stats.newEnquiriesCount} new / pending
            </span>
            <span style={{ fontSize: '0.72rem', color: '#525B3A', fontWeight: 600 }}>View →</span>
          </div>
        </div>
      </div>

      {/* Quick Actions Shortcuts Grid */}
      <div style={{ backgroundColor: '#FFFDF9', padding: '1.5rem', borderRadius: '4px', border: '1px solid rgba(75, 48, 36, 0.1)' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#4B3024', margin: '0 0 1rem 0' }}>
          Store Management Quick Actions
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
          <button
            onClick={onNewProduct}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.85rem 1rem',
              backgroundColor: '#4B3024',
              color: '#FAF6EE',
              border: 'none',
              borderRadius: '3px',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <Plus size={16} />
            <span>Add Saree</span>
          </button>

          <button
            onClick={() => onNavigateTab('products')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.85rem 1rem',
              backgroundColor: '#FAF6EE',
              color: '#4B3024',
              border: '1px solid rgba(75, 48, 36, 0.2)',
              borderRadius: '3px',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <Package size={16} color="#B88D4A" />
            <span>Manage Sarees</span>
          </button>

          <button
            onClick={() => onNavigateTab('collections')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.85rem 1rem',
              backgroundColor: '#FAF6EE',
              color: '#4B3024',
              border: '1px solid rgba(75, 48, 36, 0.2)',
              borderRadius: '3px',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <FolderTree size={16} color="#B88D4A" />
            <span>Manage Collections</span>
          </button>

          <button
            onClick={() => onNavigateTab('enquiries')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.85rem 1rem',
              backgroundColor: '#FAF6EE',
              color: '#4B3024',
              border: '1px solid rgba(75, 48, 36, 0.2)',
              borderRadius: '3px',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <Mail size={16} color="#525B3A" />
            <span>View Inquiries</span>
          </button>

          <button
            onClick={() => onNavigateTab('promotions')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.85rem 1rem',
              backgroundColor: '#FAF6EE',
              color: '#4B3024',
              border: '1px solid rgba(75, 48, 36, 0.2)',
              borderRadius: '3px',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <Tag size={16} color="#B88D4A" />
            <span>Manage Offers</span>
          </button>

          <button
            onClick={() => onNavigateTab('settings')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.85rem 1rem',
              backgroundColor: '#FAF6EE',
              color: '#4B3024',
              border: '1px solid rgba(75, 48, 36, 0.2)',
              borderRadius: '3px',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <Sparkles size={16} color="#B88D4A" />
            <span>Store Settings</span>
          </button>
        </div>
      </div>

      {/* Recent Saree Catalog Overview */}
      <div style={{ backgroundColor: '#FFFDF9', borderRadius: '4px', border: '1px solid rgba(75, 48, 36, 0.1)', padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#4B3024', margin: '0 0 0.25rem 0' }}>
              Recent Saree Catalog
            </h3>
            <p style={{ fontSize: '0.78rem', color: '#8F7263', margin: 0 }}>
              Latest sarees added or updated in your boutique collection.
            </p>
          </div>
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
              <span>Live Store</span>
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
              key={p.id || p.slug}
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
                    SKU: {p.sku} • {p.craft || 'Handloom'} • Stock: {p.stockCount ?? p.stock_count ?? 0}
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
                    <span>Store</span>
                    <ExternalLink size={11} color="#B88D4A" />
                  </button>

                  {onEditProduct && (
                    <button
                      onClick={() => onEditProduct(p)}
                      title="Edit Saree Details"
                      style={{
                        padding: '0.35rem 0.6rem',
                        backgroundColor: '#4B3024',
                        border: 'none',
                        borderRadius: '2px',
                        fontSize: '0.72rem',
                        color: '#FAF6EE',
                        fontWeight: 600,
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
    </div>
  );
};
