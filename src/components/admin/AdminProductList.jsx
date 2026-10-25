import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Star, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Filter,
  AlertCircle
} from 'lucide-react';
import { storeService } from '../../services/storeService';

export const AdminProductList = ({ onEditProduct, onNewProduct }) => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [craftFilter, setCraftFilter] = useState('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const loadProducts = async () => {
    const list = await storeService.getProducts();
    setProducts(list);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleToggleStatus = async (product) => {
    const nextStatus = product.status === 'published' ? 'draft' : 'published';
    await storeService.saveProduct({ ...product, status: nextStatus });
    loadProducts();
  };

  const handleToggleBestseller = async (product) => {
    await storeService.saveProduct({ ...product, isBestseller: !product.isBestseller });
    loadProducts();
  };

  const handleToggleMostCoveted = async (product) => {
    await storeService.saveProduct({ ...product, isMostCoveted: !product.isMostCoveted });
    loadProducts();
  };

  const handleToggleNewArrival = async (product) => {
    await storeService.saveProduct({ ...product, isNewArrival: !product.isNewArrival });
    loadProducts();
  };

  const handleDelete = async (id) => {
    await storeService.deleteProduct(id);
    setDeleteConfirmId(null);
    loadProducts();
  };

  const filtered = products.filter((p) => {
    const matchesSearch = 
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase()) ||
      p.craft?.toLowerCase().includes(search.toLowerCase()) ||
      p.color?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesCraft = craftFilter === 'all' || p.craftCategory === craftFilter;

    return matchesSearch && matchesStatus && matchesCraft;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header & Search Controls */}
      <div
        style={{
          backgroundColor: '#FFFDF9',
          padding: '1.25rem 1.5rem',
          borderRadius: '4px',
          border: '1px solid rgba(75, 48, 36, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap', flexGrow: 1 }}>
          {/* Search Box */}
          <div style={{ position: 'relative', minWidth: '240px', flexGrow: 1, maxWidth: '380px' }}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by saree name, SKU, or craft..."
              style={{
                width: '100%',
                padding: '0.65rem 1rem 0.65rem 2.4rem',
                border: '1px solid rgba(75, 48, 36, 0.18)',
                borderRadius: '3px',
                fontSize: '0.84rem',
                color: '#4B3024',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            <Search size={15} color="#8F7263" style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '0.65rem 0.9rem',
              border: '1px solid rgba(75, 48, 36, 0.18)',
              borderRadius: '3px',
              fontSize: '0.82rem',
              color: '#4B3024',
              backgroundColor: '#FFFDF9',
              outline: 'none'
            }}
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>

          {/* Craft Filter */}
          <select
            value={craftFilter}
            onChange={(e) => setCraftFilter(e.target.value)}
            style={{
              padding: '0.65rem 0.9rem',
              border: '1px solid rgba(75, 48, 36, 0.18)',
              borderRadius: '3px',
              fontSize: '0.82rem',
              color: '#4B3024',
              backgroundColor: '#FFFDF9',
              outline: 'none'
            }}
          >
            <option value="all">All Crafts</option>
            <option value="tie-dye">Tie & Dye</option>
            <option value="handblock">Handblock Bagru</option>
            <option value="chanderi">Chanderi Silk</option>
            <option value="mulmul">Mulmul Cotton</option>
          </select>
        </div>

        {/* Add Saree Action */}
        <button
          onClick={onNewProduct}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.65rem 1.15rem',
            backgroundColor: '#4B3024',
            color: '#FAF6EE',
            border: 'none',
            borderRadius: '3px',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <Plus size={15} />
          <span>Add New Saree</span>
        </button>
      </div>

      {/* Saree Catalog Table */}
      <div
        style={{
          backgroundColor: '#FFFDF9',
          borderRadius: '4px',
          border: '1px solid rgba(75, 48, 36, 0.1)',
          overflow: 'hidden',
          boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
            <thead>
              <tr style={{ backgroundColor: '#F4ECE1', borderBottom: '1px solid rgba(75, 48, 36, 0.12)' }}>
                <th style={{ padding: '0.9rem 1.25rem', fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6F4E3E', fontWeight: 600 }}>Saree</th>
                <th style={{ padding: '0.9rem 1rem', fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6F4E3E', fontWeight: 600 }}>SKU & Craft</th>
                <th style={{ padding: '0.9rem 1rem', fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6F4E3E', fontWeight: 600 }}>Pricing (INR)</th>
                <th style={{ padding: '0.9rem 1rem', fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6F4E3E', fontWeight: 600 }}>Stock</th>
                <th style={{ padding: '0.9rem 1rem', fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6F4E3E', fontWeight: 600, textAlign: 'center' }}>Featured Flags</th>
                <th style={{ padding: '0.9rem 1rem', fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6F4E3E', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '0.9rem 1.25rem', fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6F4E3E', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: '#8F7263', fontSize: '0.88rem' }}>
                    No sarees match your filter criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const selling = Number(p.price ?? p.sellingPrice ?? p.selling_price ?? 990) || 990;
                  const original = p.originalPrice ? (Number(p.originalPrice) || null) : (p.original_price ? (Number(p.original_price) || null) : null);
                  const discountPct = original && original > selling 
                    ? Math.round(((original - selling) / original) * 100) 
                    : 0;
                  const isDeleting = deleteConfirmId === p.id;

                  return (
                    <tr
                      key={p.id}
                      style={{
                        borderBottom: '1px solid rgba(75, 48, 36, 0.06)',
                        transition: 'background-color 0.15s'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FAF6EE')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      {/* Saree Info & Thumbnail */}
                      <td style={{ padding: '0.9rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                          <img
                            src={p.primaryImage || p.primary_image || '/assets/products/saree_ivory_mulmul.jpg'}
                            alt={p.name || 'Saree'}
                            style={{
                              width: '46px',
                              height: '46px',
                              objectFit: 'cover',
                              borderRadius: '2px',
                              border: '1px solid rgba(75, 48, 36, 0.15)'
                            }}
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = '/assets/products/saree_ivory_mulmul.jpg';
                            }}
                          />
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#4B3024' }}>
                              {p.name || 'Untitled Saree'}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#8F7263', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {p.tagline || p.craft || ''}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* SKU & Craft */}
                      <td style={{ padding: '0.9rem 1rem' }}>
                        <div style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#4B3024', fontWeight: 600 }}>
                          {p.sku || p.id?.slice?.(0, 8)?.toUpperCase?.() || 'RODHE-SAR'}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#8F7263' }}>
                          {p.craft || p.craftCategory || 'Handloom'}
                        </div>
                      </td>

                      {/* Pricing */}
                      <td style={{ padding: '0.9rem 1rem' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#4B3024' }}>
                          ₹{selling.toLocaleString('en-IN')}
                        </div>
                        {discountPct > 0 && original > 0 && (
                          <div style={{ fontSize: '0.72rem', color: '#C98278' }}>
                            <span style={{ textDecoration: 'line-through', marginRight: '0.35rem', color: '#8F7263' }}>₹{original.toLocaleString('en-IN')}</span>
                            <span>({discountPct}% off)</span>
                          </div>
                        )}
                      </td>

                      {/* Stock Level */}
                      <td style={{ padding: '0.9rem 1rem' }}>
                        <span
                          style={{
                            fontSize: '0.76rem',
                            fontWeight: 600,
                            padding: '0.2rem 0.55rem',
                            borderRadius: '2px',
                            backgroundColor: (p.stockCount || 0) <= 0 
                              ? 'rgba(201, 130, 120, 0.2)' 
                              : (p.stockCount || 0) <= 5 
                              ? 'rgba(184, 141, 74, 0.2)' 
                              : 'rgba(82, 91, 58, 0.15)',
                            color: (p.stockCount || 0) <= 0 
                              ? '#8A2A20' 
                              : (p.stockCount || 0) <= 5 
                              ? '#B88D4A' 
                              : '#525B3A'
                          }}
                        >
                          {(p.stockCount || 0)} in stock
                        </span>
                      </td>

                      {/* Featured Flags (Bestseller, Most Coveted, New Arrival) */}
                      <td style={{ padding: '0.9rem 1rem', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '0.45rem' }}>
                          <button
                            type="button"
                            onClick={() => handleToggleBestseller(p)}
                            title="Toggle Bestseller status"
                            style={{
                              padding: '0.3rem 0.55rem',
                              borderRadius: '2px',
                              border: p.isBestseller ? '1px solid #B88D4A' : '1px solid rgba(75, 48, 36, 0.15)',
                              backgroundColor: p.isBestseller ? 'rgba(184, 141, 74, 0.15)' : 'transparent',
                              color: p.isBestseller ? '#B88D4A' : '#8F7263',
                              fontSize: '0.68rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            Best
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleMostCoveted(p)}
                            title="Toggle Most Coveted status"
                            style={{
                              padding: '0.3rem 0.55rem',
                              borderRadius: '2px',
                              border: p.isMostCoveted ? '1px solid #B88D4A' : '1px solid rgba(75, 48, 36, 0.15)',
                              backgroundColor: p.isMostCoveted ? 'rgba(184, 141, 74, 0.15)' : 'transparent',
                              color: p.isMostCoveted ? '#B88D4A' : '#8F7263',
                              fontSize: '0.68rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            Coveted
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleNewArrival(p)}
                            title="Toggle New Arrival status"
                            style={{
                              padding: '0.3rem 0.55rem',
                              borderRadius: '2px',
                              border: p.isNewArrival ? '1px solid #525B3A' : '1px solid rgba(75, 48, 36, 0.15)',
                              backgroundColor: p.isNewArrival ? 'rgba(82, 91, 58, 0.15)' : 'transparent',
                              color: p.isNewArrival ? '#525B3A' : '#8F7263',
                              fontSize: '0.68rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            New
                          </button>
                        </div>
                      </td>

                      {/* Status Toggle */}
                      <td style={{ padding: '0.9rem 1rem' }}>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(p)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            padding: '0.3rem 0.65rem',
                            borderRadius: '2px',
                            border: 'none',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            cursor: 'pointer',
                            backgroundColor: p.status === 'published' ? 'rgba(82, 91, 58, 0.15)' : 'rgba(184, 141, 74, 0.15)',
                            color: p.status === 'published' ? '#525B3A' : '#B88D4A'
                          }}
                        >
                          {p.status === 'published' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                          <span>{p.status}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '0.9rem 1.25rem', textAlign: 'right' }}>
                        {isDeleting ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ fontSize: '0.72rem', color: '#C98278' }}>Confirm?</span>
                            <button
                              onClick={() => handleDelete(p.id)}
                              style={{ padding: '0.25rem 0.5rem', backgroundColor: '#C98278', color: '#FAF6EE', border: 'none', borderRadius: '2px', fontSize: '0.72rem', cursor: 'pointer' }}
                            >
                              Yes, Delete
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              style={{ padding: '0.25rem 0.5rem', backgroundColor: '#EADAB5', color: '#4B3024', border: 'none', borderRadius: '2px', fontSize: '0.72rem', cursor: 'pointer' }}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.65rem' }}>
                            <button
                              onClick={() => onEditProduct(p)}
                              title="Edit Saree Details"
                              style={{
                                padding: '0.4rem',
                                backgroundColor: 'transparent',
                                border: '1px solid rgba(75, 48, 36, 0.15)',
                                borderRadius: '2px',
                                color: '#4B3024',
                                cursor: 'pointer'
                              }}
                            >
                              <Edit size={14} />
                            </button>

                            <button
                              onClick={() => setDeleteConfirmId(p.id)}
                              title="Delete Saree"
                              style={{
                                padding: '0.4rem',
                                backgroundColor: 'transparent',
                                border: '1px solid rgba(201, 130, 120, 0.3)',
                                borderRadius: '2px',
                                color: '#C98278',
                                cursor: 'pointer'
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
