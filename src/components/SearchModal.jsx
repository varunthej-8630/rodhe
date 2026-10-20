import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ArrowRight, Tag } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const SearchModal = () => {
  const { isSearchOpen, setIsSearchOpen, PRODUCTS, navigateTo } = useShop();
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery('');
    }
  }, [isSearchOpen]);

  // Keyboard escape listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, setIsSearchOpen]);

  if (!isSearchOpen) return null;

  const filtered = query.trim()
    ? PRODUCTS.filter((p) => {
        const q = query.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.craft.toLowerCase().includes(q) ||
          p.color.toLowerCase().includes(q) ||
          p.fabric.toLowerCase().includes(q) ||
          p.tagline.toLowerCase().includes(q)
        );
      })
    : [];

  const quickTags = [
    'Indigo Shibori',
    'Bagru Print',
    'Mulmul Cotton',
    'Chanderi Silk',
    'Raw Ivory',
    'Soft Rose'
  ];

  const handleSelectProduct = (productId) => {
    setIsSearchOpen(false);
    navigateTo('product', productId);
  };

  return (
    <div className="modal-backdrop" onClick={() => setIsSearchOpen(false)}>
      <div
        style={{
          width: 'min(640px, 92vw)',
          backgroundColor: '#FFFDF9',
          border: '1px solid rgba(184, 141, 74, 0.3)',
          boxShadow: '0 25px 60px rgba(42, 26, 19, 0.25)',
          overflow: 'hidden',
          animation: 'slideUp 0.3s ease'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid rgba(75, 48, 36, 0.12)',
            gap: '1rem'
          }}
        >
          <Search size={22} color="#B88D4A" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search by craft, colour, or saree name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flexGrow: 1,
              border: 'none',
              outline: 'none',
              fontSize: '1.1rem',
              fontFamily: 'var(--font-serif)',
              color: '#4B3024',
              backgroundColor: 'transparent'
            }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{ color: '#8F7263', padding: '0.25rem' }}
              aria-label="Clear search input"
            >
              <X size={18} />
            </button>
          )}
          <button
            onClick={() => setIsSearchOpen(false)}
            style={{
              fontSize: '0.75rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#8F7263',
              padding: '0.35rem 0.65rem',
              border: '1px solid rgba(75, 48, 36, 0.15)'
            }}
          >
            ESC
          </button>
        </div>

        {/* Quick Tag Recommendations */}
        <div
          style={{
            padding: '1rem 1.5rem',
            backgroundColor: '#FAF6EE',
            borderBottom: '1px solid rgba(75, 48, 36, 0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            flexWrap: 'wrap'
          }}
        >
          <span style={{ fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#B88D4A', fontWeight: 600 }}>
            Trending Searches:
          </span>
          {quickTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setQuery(tag)}
              style={{
                fontSize: '0.74rem',
                padding: '0.25rem 0.65rem',
                backgroundColor: '#FFFDF9',
                border: '1px solid rgba(75, 48, 36, 0.12)',
                color: '#4B3024',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#B88D4A';
                e.currentTarget.style.color = '#B88D4A';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(75, 48, 36, 0.12)';
                e.currentTarget.style.color = '#4B3024';
              }}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Results Area */}
        <div style={{ maxHeight: '380px', overflowY: 'auto', padding: '1rem 1.5rem' }}>
          {query.trim() === '' ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#8F7263' }}>
              <p style={{ fontSize: '0.88rem' }}>Type to discover handcrafted sarees by craft, colour, or fabric.</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '2.5rem 1rem', textAlign: 'center' }}>
              <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: '#4B3024', marginBottom: '0.5rem' }}>
                No sarees found for "{query}"
              </h4>
              <p style={{ fontSize: '0.84rem', color: '#8F7263' }}>
                Try searching for "Indigo", "Chanderi", "Mulmul", or "Bagru".
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {filtered.map((product) => (
                <div
                  key={product.id}
                  onClick={() => handleSelectProduct(product.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '0.75rem',
                    border: '1px solid rgba(75, 48, 36, 0.08)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#FAF6EE';
                    e.currentTarget.style.borderColor = '#B88D4A';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = 'rgba(75, 48, 36, 0.08)';
                  }}
                >
                  <img
                    src={product.primaryImage}
                    alt={product.name}
                    style={{ width: '50px', height: '65px', objectFit: 'cover' }}
                  />
                  <div style={{ flexGrow: 1 }}>
                    <div style={{ fontSize: '0.7rem', color: '#B88D4A', textTransform: 'uppercase', fontWeight: 600 }}>
                      {product.craft} • {product.color}
                    </div>
                    <h5 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.05rem', color: '#4B3024' }}>
                      {product.name}
                    </h5>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#4B3024' }}>
                      ₹{product.price.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <ArrowRight size={16} color="#B88D4A" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
