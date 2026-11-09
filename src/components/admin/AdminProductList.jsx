import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  ArrowUpDown,
  Archive,
  Minus,
  RefreshCw,
  XCircle,
  Package
} from 'lucide-react';
import { storeService } from '../../services/storeService';
import { useShop } from '../../context/ShopContext';

export const AdminProductList = ({ onEditProduct, onNewProduct }) => {
  const { navigateTo, refreshProducts } = useShop();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [craftFilter, setCraftFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState(null);
  const [updatingStockId, setUpdatingStockId] = useState(null);

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
    if (refreshProducts) await refreshProducts();
    loadProducts();
  };

  const handleToggleBestseller = async (product) => {
    await storeService.saveProduct({ ...product, isBestseller: !product.isBestseller });
    if (refreshProducts) await refreshProducts();
    loadProducts();
  };

  const handleToggleMostCoveted = async (product) => {
    await storeService.saveProduct({ ...product, isMostCoveted: !product.isMostCoveted });
    if (refreshProducts) await refreshProducts();
    loadProducts();
  };

  const handleToggleNewArrival = async (product) => {
    await storeService.saveProduct({ ...product, isNewArrival: !product.isNewArrival });
    if (refreshProducts) await refreshProducts();
    loadProducts();
  };

  const handleInlineStockChange = async (product, delta) => {
    const current = Number(product.stockCount ?? product.stock_count ?? 0);
    const updatedStock = Math.max(0, current + delta);
    setUpdatingStockId(product.id);
    try {
      await storeService.saveProduct({
        ...product,
        stockCount: updatedStock,
        stock_count: updatedStock,
        inStock: updatedStock > 0,
        in_stock: updatedStock > 0
      });
      if (refreshProducts) await refreshProducts();
      await loadProducts();
    } finally {
      setUpdatingStockId(null);
    }
  };

  const handleToggleOutOfStock = async (product) => {
    const currentInStock = Boolean(product.inStock ?? product.in_stock ?? (product.stockCount > 0));
    setUpdatingStockId(product.id);
    try {
      await storeService.saveProduct({
        ...product,
        inStock: !currentInStock,
        in_stock: !currentInStock,
        stockCount: !currentInStock ? (product.stockCount > 0 ? product.stockCount : 5) : 0,
        stock_count: !currentInStock ? (product.stockCount > 0 ? product.stockCount : 5) : 0
      });
      if (refreshProducts) await refreshProducts();
      await loadProducts();
    } finally {
      setUpdatingStockId(null);
    }
  };

  const handleDelete = async (id) => {
    await storeService.deleteProduct(id);
    setDeleteConfirmProduct(null);
    if (refreshProducts) await refreshProducts();
    loadProducts();
  };

  // Filter & Search
  let filtered = products.filter((p) => {
    const matchesSearch = 
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase()) ||
      p.craft?.toLowerCase().includes(search.toLowerCase()) ||
      p.color?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesCraft = craftFilter === 'all' || p.craftCategory === craftFilter;

    let matchesStock = true;
    const stockCount = Number(p.stockCount ?? p.stock_count ?? 0);
    const isInStock = Boolean(p.inStock ?? p.in_stock ?? (stockCount > 0));

    if (stockFilter === 'in_stock') {
      matchesStock = isInStock && stockCount > 0;
    } else if (stockFilter === 'low_stock') {
      matchesStock = stockCount > 0 && stockCount <= 5;
    } else if (stockFilter === 'out_of_stock') {
      matchesStock = !isInStock || stockCount === 0;
    }

    return matchesSearch && matchesStatus && matchesCraft && matchesStock;
  });

  // Sorting
  filtered.sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    } else if (sortBy === 'oldest') {
      return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
    } else if (sortBy === 'price_asc') {
      const priceA = Number(a.price ?? a.sellingPrice ?? a.selling_price ?? 0);
      const priceB = Number(b.price ?? b.sellingPrice ?? b.selling_price ?? 0);
      return priceA - priceB;
    } else if (sortBy === 'price_desc') {
      const priceA = Number(a.price ?? a.sellingPrice ?? a.selling_price ?? 0);
      const priceB = Number(b.price ?? b.sellingPrice ?? b.selling_price ?? 0);
      return priceB - priceA;
    } else if (sortBy === 'name_asc') {
      return (a.name || '').localeCompare(b.name || '');
    }
    return 0;
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', flexGrow: 1 }}>
          {/* Search Box */}
          <div style={{ position: 'relative', minWidth: '220px', flexGrow: 1, maxWidth: '340px' }}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by saree name, SKU, craft..."
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
              padding: '0.65rem 0.85rem',
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

          {/* Stock Filter */}
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            style={{
              padding: '0.65rem 0.85rem',
              border: '1px solid rgba(75, 48, 36, 0.18)',
              borderRadius: '3px',
              fontSize: '0.82rem',
              color: '#4B3024',
              backgroundColor: '#FFFDF9',
              outline: 'none'
            }}
          >
            <option value="all">All Inventory</option>
            <option value="in_stock">In Stock (&gt;0)</option>
            <option value="low_stock">Low Stock (≤ 5)</option>
            <option value="out_of_stock">Out of Stock (0)</option>
          </select>

          {/* Craft Filter */}
          <select
            value={craftFilter}
            onChange={(e) => setCraftFilter(e.target.value)}
            style={{
              padding: '0.65rem 0.85rem',
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

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: '0.65rem 0.85rem',
              border: '1px solid rgba(75, 48, 36, 0.18)',
              borderRadius: '3px',
              fontSize: '0.82rem',
              color: '#4B3024',
              backgroundColor: '#FFFDF9',
              outline: 'none'
            }}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="name_asc">Name: A to Z</option>
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
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '950px' }}>
            <thead>
              <tr style={{ backgroundColor: '#F4ECE1', borderBottom: '1px solid rgba(75, 48, 36, 0.12)' }}>
                <th style={{ padding: '0.9rem 1.25rem', fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6F4E3E', fontWeight: 600 }}>Saree</th>
                <th style={{ padding: '0.9rem 1rem', fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6F4E3E', fontWeight: 600 }}>SKU & Craft</th>
                <th style={{ padding: '0.9rem 1rem', fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6F4E3E', fontWeight: 600 }}>Price (INR)</th>
                <th style={{ padding: '0.9rem 1rem', fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6F4E3E', fontWeight: 600 }}>Stock (Quick Edit)</th>
                <th style={{ padding: '0.9rem 1rem', fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6F4E3E', fontWeight: 600, textAlign: 'center' }}>Featured</th>
                <th style={{ padding: '0.9rem 1rem', fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6F4E3E', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '0.9rem 1.25rem', fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6F4E3E', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '3.5rem', textAlign: 'center', color: '#8F7263', fontSize: '0.88rem' }}>
                    No sarees match your current filter criteria. Try clearing search or selecting "All".
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const selling = Number(p.price ?? p.sellingPrice ?? p.selling_price ?? 990) || 990;
                  const original = p.originalPrice ? (Number(p.originalPrice) || null) : (p.original_price ? (Number(p.original_price) || null) : null);
                  const discountPct = original && original > selling 
                    ? Math.round(((original - selling) / original) * 100) 
                    : 0;
                  const stock = Number(p.stockCount ?? p.stock_count ?? 0);
                  const isUpdatingThisStock = updatingStockId === p.id;

                  return (
                    <tr
                      key={p.id || p.slug}
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

                      {/* Stock Level with Inline Quick Adjust */}
                      <td style={{ padding: '0.9rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <button
                            type="button"
                            onClick={() => handleInlineStockChange(p, -1)}
                            disabled={stock <= 0 || isUpdatingThisStock}
                            title="Decrease stock by 1"
                            style={{
                              width: '24px',
                              height: '24px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: '#FFFDF9',
                              border: '1px solid rgba(75, 48, 36, 0.2)',
                              borderRadius: '2px',
                              cursor: stock <= 0 ? 'not-allowed' : 'pointer',
                              color: '#4B3024'
                            }}
                          >
                            <Minus size={11} />
                          </button>

                          <span
                            style={{
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              minWidth: '28px',
                              textAlign: 'center',
                              padding: '0.15rem 0.4rem',
                              borderRadius: '2px',
                              backgroundColor: stock <= 0 
                                ? 'rgba(201, 130, 120, 0.2)' 
                                : stock <= 5 
                                ? 'rgba(184, 141, 74, 0.2)' 
                                : 'rgba(82, 91, 58, 0.15)',
                              color: stock <= 0 
                                ? '#8A2A20' 
                                : stock <= 5 
                                ? '#B88D4A' 
                                : '#525B3A'
                            }}
                          >
                            {stock}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleInlineStockChange(p, 1)}
                            disabled={isUpdatingThisStock}
                            title="Increase stock by 1"
                            style={{
                              width: '24px',
                              height: '24px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: '#FFFDF9',
                              border: '1px solid rgba(75, 48, 36, 0.2)',
                              borderRadius: '2px',
                              cursor: 'pointer',
                              color: '#4B3024'
                            }}
                          >
                            <Plus size={11} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleOutOfStock(p)}
                            title={stock > 0 ? "Mark Out of Stock" : "Restore to In Stock"}
                            style={{
                              fontSize: '0.65rem',
                              padding: '0.2rem 0.4rem',
                              backgroundColor: stock > 0 ? 'transparent' : 'rgba(201, 130, 120, 0.15)',
                              border: '1px solid rgba(75, 48, 36, 0.15)',
                              borderRadius: '2px',
                              cursor: 'pointer',
                              color: stock > 0 ? '#8F7263' : '#8A2A20'
                            }}
                          >
                            {stock > 0 ? 'OOS' : 'Restock'}
                          </button>
                        </div>
                      </td>

                      {/* Featured Flags */}
                      <td style={{ padding: '0.9rem 1rem', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                          <button
                            type="button"
                            onClick={() => handleToggleBestseller(p)}
                            title="Toggle Bestseller status"
                            style={{
                              padding: '0.25rem 0.5rem',
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
                              padding: '0.25rem 0.5rem',
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
                              padding: '0.25rem 0.5rem',
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
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                          <button
                            onClick={() => navigateTo('shop')}
                            title={`Preview ${p.name} on the Live Store`}
                            style={{
                              padding: '0.4rem',
                              backgroundColor: 'transparent',
                              border: '1px solid rgba(75, 48, 36, 0.15)',
                              borderRadius: '2px',
                              color: '#B88D4A',
                              cursor: 'pointer'
                            }}
                          >
                            <ExternalLink size={13} />
                          </button>

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
                            <Edit size={13} />
                          </button>

                          <button
                            onClick={() => setDeleteConfirmProduct(p)}
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
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Explicit Delete Confirmation Modal */}
      {deleteConfirmProduct && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(42, 26, 19, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1rem'
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFDF9',
              borderRadius: '4px',
              maxWidth: '480px',
              width: '100%',
              padding: '2rem',
              border: '1px solid rgba(75, 48, 36, 0.2)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(201, 130, 120, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Trash2 size={18} color="#C98278" />
              </div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', color: '#4B3024', margin: 0 }}>
                Confirm Saree Deletion
              </h3>
            </div>

            <p style={{ fontSize: '0.86rem', color: '#6F4E3E', margin: 0, lineHeight: 1.5 }}>
              Are you sure you want to permanently delete <strong>{deleteConfirmProduct.name}</strong> (SKU: <code>{deleteConfirmProduct.sku}</code>)? This action removes the product from the catalog and the live storefront.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setDeleteConfirmProduct(null)}
                style={{
                  padding: '0.6rem 1.15rem',
                  backgroundColor: '#FAF6EE',
                  border: '1px solid rgba(75, 48, 36, 0.2)',
                  borderRadius: '3px',
                  fontSize: '0.82rem',
                  color: '#4B3024',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmProduct.id)}
                style={{
                  padding: '0.6rem 1.25rem',
                  backgroundColor: '#C98278',
                  border: 'none',
                  borderRadius: '3px',
                  fontSize: '0.82rem',
                  color: '#FAF6EE',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Yes, Delete Saree
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
