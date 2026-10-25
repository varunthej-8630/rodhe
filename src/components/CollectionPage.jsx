import React, { useState } from 'react';
import { ProductCard } from './ProductCard';
import { CRAFT_CATEGORIES, COLOR_PALETTES, FABRIC_TYPES } from '../data/products';
import { Filter, SlidersHorizontal, X, RotateCcw, ArrowUpDown } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const CollectionPage = () => {
  const {
    PRODUCTS,
    selectedCraft,
    setSelectedCraft,
    selectedColor,
    setSelectedColor,
    selectedFabric,
    setSelectedFabric,
    priceMax,
    setPriceMax,
    priceRangeFilter,
    setPriceRangeFilter,
    inStockOnly,
    setInStockOnly,
    sortBy,
    setSortBy,
    resetFilters
  } = useShop();

  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Dynamic count calculation based on current live products
  const getCraftCount = (craftId) => {
    if (craftId === 'all') return PRODUCTS.length;
    return PRODUCTS.filter((p) => p.craftCategory === craftId).length;
  };

  // Filter Logic
  const filteredProducts = PRODUCTS.filter((product) => {
    // Craft
    if (selectedCraft !== 'all' && product.craftCategory !== selectedCraft) {
      return false;
    }
    // Color
    if (selectedColor !== 'all' && product.colorFamily !== selectedColor) {
      return false;
    }
    // Fabric
    if (selectedFabric !== 'all' && product.fabricType !== selectedFabric) {
      return false;
    }
    // Price
    const price = product.sellingPrice || product.price || 0;
    if (price > priceMax) {
      return false;
    }
    // Budget Tier Filter (Find Your Piece)
    if ((priceRangeFilter === 'under-800' || priceRangeFilter === 'under800') && price > 800) {
      return false;
    }
    if ((priceRangeFilter === '800-1200') && (price < 800 || price > 1200)) {
      return false;
    }
    if ((priceRangeFilter === '1200-1600') && (price < 1200 || price > 1600)) {
      return false;
    }
    if ((priceRangeFilter === '1600-2000') && (price < 1600 || price > 2000)) {
      return false;
    }
    if ((priceRangeFilter === 'under2k' || priceRangeFilter === 'under-2000') && price > 2000) {
      return false;
    }
    if ((priceRangeFilter === '2k-4k' || priceRangeFilter === '2000-4000') && (price < 2000 || price >= 4000)) {
      return false;
    }
    if ((priceRangeFilter === '4k-6k' || priceRangeFilter === '4000-6000') && (price < 4000 || price > 6000)) {
      return false;
    }
    if ((priceRangeFilter === 'above6k' || priceRangeFilter === 'above-6000') && price <= 6000) {
      return false;
    }
    // Stock
    if (inStockOnly && !product.inStock) {
      return false;
    }
    return true;
  });

  // Sort Logic
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const priceA = a.sellingPrice || a.price || 0;
    const priceB = b.sellingPrice || b.price || 0;
    if (sortBy === 'price-low') return priceA - priceB;
    if (sortBy === 'price-high') return priceB - priceA;
    if (sortBy === 'rating') return (b.rating || 5) - (a.rating || 5);
    if (sortBy === 'newest') return (b.isNew || b.isNewArrival ? 1 : 0) - (a.isNew || a.isNewArrival ? 1 : 0);
    return 0; // Default featured
  });

  const hasActiveFilters =
    selectedCraft !== 'all' ||
    selectedColor !== 'all' ||
    selectedFabric !== 'all' ||
    priceMax < 8000 ||
    !!priceRangeFilter ||
    inStockOnly;

  return (
    <div style={{ backgroundColor: '#FAF6EE', minHeight: '100vh', paddingBottom: '6rem' }}>
      {/* Editorial Collection Banner */}
      <div
        style={{
          backgroundColor: '#F4ECE1',
          padding: 'clamp(3rem, 6vw, 5.5rem) 0 3rem',
          borderBottom: '1px solid rgba(184, 141, 74, 0.2)',
          textAlign: 'center'
        }}
      >
        <div className="container">
          <div className="eyebrow">The Complete Saree Atelier</div>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(2.4rem, 4.5vw, 4.2rem)',
              fontWeight: 400,
              color: '#4B3024',
              marginBottom: '0.85rem'
            }}
          >
            Handcrafted Saree Collection
          </h1>
          <p
            style={{
              fontSize: 'clamp(0.95rem, 1.4vw, 1.15rem)',
              color: '#6F4E3E',
              maxWidth: '650px',
              margin: '0 auto',
              lineHeight: 1.6
            }}
          >
            Six and a half meters of featherweight grace. Explore natural indigo shibori, carved teakwood Bagru prints, and diaphanous Chanderi silk.
          </p>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '2.5rem' }}>
        {/* Top Control Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: '1.5rem',
            borderBottom: '1px solid rgba(75, 48, 36, 0.1)',
            marginBottom: '2rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          {/* Left: Product count & Mobile filter trigger */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setIsMobileFilterOpen(true)}
              className="btn btn-outline btn-sm mobile-filter-btn"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', minHeight: '38px', padding: '0.4rem 0.85rem' }}
            >
              <SlidersHorizontal size={14} />
              <span>Filters {hasActiveFilters && '•'}</span>
            </button>

            <span style={{ fontSize: '0.84rem', color: '#6F4E3E' }}>
              Showing <strong>{sortedProducts.length}</strong> handcrafted {sortedProducts.length === 1 ? 'saree' : 'sarees'}
            </span>
          </div>

          {/* Right: Sorting Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'auto' }}>
            <label style={{ fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8F7263', fontWeight: 600 }}>
              Sort:
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: '0.45rem 0.75rem',
                backgroundColor: '#FFFDF9',
                border: '1px solid rgba(75, 48, 36, 0.2)',
                fontSize: '0.82rem',
                color: '#4B3024',
                outline: 'none',
                cursor: 'pointer',
                borderRadius: 0,
                minHeight: '38px'
              }}
            >
              <option value="featured">Featured Collection</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="newest">New Arrivals</option>
            </select>
          </div>
        </div>

        {/* Active Filters Bar */}
        {hasActiveFilters && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              flexWrap: 'wrap',
              marginBottom: '1.75rem',
              padding: '0.65rem 0.85rem',
              backgroundColor: '#F4ECE1',
              border: '1px solid rgba(184, 141, 74, 0.2)'
            }}
          >
            <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#B88D4A' }}>
              Active:
            </span>

            {selectedCraft !== 'all' && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.25rem 0.55rem',
                  backgroundColor: '#FFFDF9',
                  fontSize: '0.74rem',
                  border: '1px solid rgba(75, 48, 36, 0.15)'
                }}
              >
                Craft: {CRAFT_CATEGORIES.find((c) => c.id === selectedCraft)?.name}
                <X size={12} style={{ cursor: 'pointer' }} onClick={() => setSelectedCraft('all')} />
              </span>
            )}

            {selectedColor !== 'all' && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.25rem 0.55rem',
                  backgroundColor: '#FFFDF9',
                  fontSize: '0.74rem',
                  border: '1px solid rgba(75, 48, 36, 0.15)'
                }}
              >
                Color: {COLOR_PALETTES.find((c) => c.id === selectedColor)?.name}
                <X size={12} style={{ cursor: 'pointer' }} onClick={() => setSelectedColor('all')} />
              </span>
            )}

            {selectedFabric !== 'all' && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.25rem 0.55rem',
                  backgroundColor: '#FFFDF9',
                  fontSize: '0.74rem',
                  border: '1px solid rgba(75, 48, 36, 0.15)'
                }}
              >
                Fabric: {FABRIC_TYPES.find((f) => f.id === selectedFabric)?.name}
                <X size={12} style={{ cursor: 'pointer' }} onClick={() => setSelectedFabric('all')} />
              </span>
            )}

            {priceMax < 8000 && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.25rem 0.55rem',
                  backgroundColor: '#FFFDF9',
                  fontSize: '0.74rem',
                  border: '1px solid rgba(75, 48, 36, 0.15)'
                }}
              >
                Under ₹{priceMax.toLocaleString('en-IN')}
                <X size={12} style={{ cursor: 'pointer' }} onClick={() => setPriceMax(8000)} />
              </span>
            )}

            {priceRangeFilter && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.25rem 0.55rem',
                  backgroundColor: 'rgba(184, 141, 74, 0.12)',
                  fontSize: '0.74rem',
                  color: '#8A6224',
                  fontWeight: 600,
                  border: '1px solid rgba(184, 141, 74, 0.35)'
                }}
              >
                Budget: {priceRangeFilter === 'under2k' ? 'Under ₹2,000' : priceRangeFilter === '2k-4k' ? '₹2,000 – ₹4,000' : priceRangeFilter === '4k-6k' ? '₹4,000 – ₹6,000' : 'Above ₹6,000'}
                <X size={12} style={{ cursor: 'pointer' }} onClick={() => setPriceRangeFilter(null)} />
              </span>
            )}

            <button
              onClick={resetFilters}
              style={{
                marginLeft: 'auto',
                fontSize: '0.74rem',
                color: '#C98278',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontWeight: 600,
                padding: '0.25rem'
              }}
            >
              <RotateCcw size={12} /> Reset All
            </button>
          </div>
        )}

        {/* Layout: Sidebar + Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 'clamp(1.5rem, 3vw, 3rem)', alignItems: 'flex-start' }} className="collection-layout">
          {/* Desktop Filter Sidebar */}
          <aside
            style={{
              backgroundColor: '#FFFDF9',
              border: '1px solid rgba(75, 48, 36, 0.12)',
              padding: '1.75rem 1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '2rem'
            }}
            className="desktop-filter-sidebar"
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(75, 48, 36, 0.08)', paddingBottom: '0.75rem' }}>
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: '#4B3024', fontWeight: 600 }}>
                Filter Atelier
              </span>
              {hasActiveFilters && (
                <button onClick={resetFilters} style={{ fontSize: '0.72rem', color: '#B88D4A', fontWeight: 600, textTransform: 'uppercase' }}>
                  Reset
                </button>
              )}
            </div>

            {/* Filter 1: Craft */}
            <div>
              <h4 style={{ fontSize: '0.78rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#B88D4A', fontWeight: 700, marginBottom: '0.85rem' }}>
                Craft Heritage
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {CRAFT_CATEGORIES.map((c) => (
                  <label
                    key={c.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.84rem',
                      color: selectedCraft === c.id ? '#4B3024' : '#6F4E3E',
                      fontWeight: selectedCraft === c.id ? 600 : 400,
                      cursor: 'pointer'
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="radio"
                        name="craft"
                        checked={selectedCraft === c.id}
                        onChange={() => setSelectedCraft(c.id)}
                        style={{ accentColor: '#B88D4A' }}
                      />
                      {c.name}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#8F7263' }}>({getCraftCount(c.id)})</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Filter 2: Botanical Colours */}
            <div>
              <h4 style={{ fontSize: '0.78rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#B88D4A', fontWeight: 700, marginBottom: '0.85rem' }}>
                Botanical Palette
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.65rem' }}>
                {COLOR_PALETTES.map((col) => (
                  <button
                    key={col.id}
                    onClick={() => setSelectedColor(col.id)}
                    title={col.name}
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      backgroundColor: col.hex,
                      border: selectedColor === col.id ? '2px solid #4B3024' : '1px solid rgba(75, 48, 36, 0.15)',
                      boxShadow: selectedColor === col.id ? '0 0 0 2px #B88D4A' : 'none',
                      cursor: 'pointer',
                      transition: 'transform 0.2s'
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Filter 3: Fabric Type */}
            <div>
              <h4 style={{ fontSize: '0.78rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#B88D4A', fontWeight: 700, marginBottom: '0.85rem' }}>
                Fabric Weave
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {FABRIC_TYPES.map((f) => (
                  <label
                    key={f.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.84rem',
                      color: selectedFabric === f.id ? '#4B3024' : '#6F4E3E',
                      fontWeight: selectedFabric === f.id ? 600 : 400,
                      cursor: 'pointer'
                    }}
                  >
                    <input
                      type="radio"
                      name="fabric"
                      checked={selectedFabric === f.id}
                      onChange={() => setSelectedFabric(f.id)}
                      style={{ accentColor: '#B88D4A' }}
                    />
                    <span>{f.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Filter 4: Price Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                <span style={{ fontSize: '0.78rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#B88D4A', fontWeight: 700 }}>
                  Max Price
                </span>
                <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#4B3024' }}>
                  ₹{priceMax.toLocaleString('en-IN')}
                </span>
              </div>
              <input
                type="range"
                min="500"
                max="8000"
                step="100"
                value={priceMax}
                onChange={(e) => setPriceMax(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#B88D4A' }}
              />
            </div>
          </aside>

          {/* Product Grid Area */}
          <div>
            {sortedProducts.length === 0 ? (
              <div
                style={{
                  padding: '4rem 2rem',
                  textAlign: 'center',
                  backgroundColor: '#FFFDF9',
                  border: '1px solid rgba(75, 48, 36, 0.1)'
                }}
              >
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', color: '#4B3024', marginBottom: '0.5rem' }}>
                  No Sarees Found
                </h3>
                <p style={{ fontSize: '0.9rem', color: '#8F7263', marginBottom: '1.5rem' }}>
                  No drapes currently match your chosen combination of filters.
                </p>
                <button onClick={resetFilters} className="btn btn-primary">
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="products-grid">
                {sortedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {isMobileFilterOpen && (
        <div className="drawer-backdrop" onClick={() => setIsMobileFilterOpen(false)}>
          <div
            className="drawer-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '100dvh',
              overflow: 'hidden'
            }}
          >
            {/* Drawer Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid rgba(75, 48, 36, 0.1)',
                backgroundColor: '#FFFDF9'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <SlidersHorizontal size={18} color="#B88D4A" />
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', color: '#4B3024', margin: 0 }}>
                  Filter Atelier
                </h3>
              </div>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                aria-label="Close filters"
                style={{
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: 'rgba(75, 48, 36, 0.06)',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Mobile Filter Scrollable Body */}
            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Craft Heritage */}
              <div>
                <h4 style={{ fontSize: '0.78rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#B88D4A', fontWeight: 700, marginBottom: '0.75rem' }}>
                  Craft Heritage
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {CRAFT_CATEGORIES.map((c) => (
                    <label key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0', fontSize: '0.88rem', cursor: 'pointer' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                          type="radio"
                          name="m-craft"
                          checked={selectedCraft === c.id}
                          onChange={() => setSelectedCraft(c.id)}
                          style={{ accentColor: '#B88D4A' }}
                        />
                        {c.name}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#8F7263' }}>({getCraftCount(c.id)})</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Botanical Palette */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h4 style={{ fontSize: '0.78rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#B88D4A', fontWeight: 700, margin: 0 }}>
                    Botanical Palette
                  </h4>
                  {selectedColor !== 'all' && (
                    <button
                      onClick={() => setSelectedColor('all')}
                      style={{ fontSize: '0.72rem', color: '#B88D4A', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.65rem' }}>
                  {COLOR_PALETTES.map((col) => (
                    <button
                      key={col.id}
                      onClick={() => setSelectedColor(col.id)}
                      title={col.name}
                      style={{
                        height: '42px',
                        borderRadius: '4px',
                        backgroundColor: col.hex,
                        border: selectedColor === col.id ? '2px solid #4B3024' : '1px solid rgba(75, 48, 36, 0.15)',
                        boxShadow: selectedColor === col.id ? '0 0 0 2px #B88D4A' : 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {selectedColor === col.id && (
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: col.id === 'white' ? '#4B3024' : '#FAF6EE' }} />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fabric Weave */}
              <div>
                <h4 style={{ fontSize: '0.78rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#B88D4A', fontWeight: 700, marginBottom: '0.75rem' }}>
                  Fabric Weave
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {FABRIC_TYPES.map((f) => (
                    <label key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0', fontSize: '0.88rem', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="m-fabric"
                        checked={selectedFabric === f.id}
                        onChange={() => setSelectedFabric(f.id)}
                        style={{ accentColor: '#B88D4A' }}
                      />
                      <span>{f.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Slider */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <h4 style={{ fontSize: '0.78rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#B88D4A', fontWeight: 700, margin: 0 }}>
                    Max Price
                  </h4>
                  <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#4B3024' }}>
                    ₹{priceMax.toLocaleString('en-IN')}
                  </span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="8000"
                  step="100"
                  value={priceMax}
                  onChange={(e) => setPriceMax(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#B88D4A' }}
                />
              </div>
            </div>

            {/* Drawer Sticky Footer Actions */}
            <div
              style={{
                display: 'flex',
                gap: '0.75rem',
                padding: '1rem 1.5rem',
                borderTop: '1px solid rgba(75, 48, 36, 0.1)',
                backgroundColor: '#FAF6EE',
                paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))'
              }}
            >
              <button
                onClick={() => {
                  resetFilters();
                  setIsMobileFilterOpen(false);
                }}
                className="btn btn-outline"
                style={{ flex: 1, minHeight: '44px' }}
              >
                Reset
              </button>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="btn btn-primary"
                style={{ flex: 1.5, minHeight: '44px' }}
              >
                Apply ({sortedProducts.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Responsive Styles */}
      <style>{`
        .mobile-filter-btn {
          display: none !important;
        }
        @media (max-width: 900px) {
          .collection-layout {
            grid-template-columns: 1fr !important;
          }
          .desktop-filter-sidebar {
            display: none !important;
          }
          .mobile-filter-btn {
            display: inline-flex !important;
          }
        }
      `}</style>
    </div>
  );
};
