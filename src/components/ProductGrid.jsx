import React, { useState } from 'react';
import { ProductCard } from './ProductCard';
import { PRODUCTS } from '../data/products';
import { ArrowRight } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const ProductGrid = () => {
  const { navigateTo } = useShop();
  const [activeTab, setActiveTab] = useState('all');

  const tabs = [
    { id: 'all', label: 'All Drapes' },
    { id: 'bestseller', label: 'Bestsellers' },
    { id: 'new', label: 'New Arrivals' },
    { id: 'indigo', label: 'Indigo Edit' },
    { id: 'chanderi', label: 'Chanderi & Silk' }
  ];

  const filteredProducts = PRODUCTS.filter((item) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'bestseller') return item.isBestseller;
    if (activeTab === 'new') return item.isNew;
    if (activeTab === 'indigo') return item.colorFamily === 'indigo';
    if (activeTab === 'chanderi') return item.craftCategory === 'chanderi';
    return true;
  });

  return (
    <section className="section-padding" style={{ backgroundColor: '#FAF6EE' }}>
      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <div className="eyebrow">Handcrafted Editions</div>
          <h2 className="section-title">The RODHE Saree Collection</h2>
          <p className="section-subtitle">
            Featherweight drapes handwoven by generational masters, bathed in living plant colors.
          </p>
        </div>

        {/* Category Tabs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'clamp(0.4rem, 1.5vw, 0.85rem)',
            marginBottom: 'clamp(2rem, 4vw, 3rem)',
            flexWrap: 'wrap',
            maxWidth: '100%'
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: 'clamp(0.45rem, 1.5vw, 0.6rem) clamp(0.85rem, 2.5vw, 1.4rem)',
                fontSize: 'clamp(0.72rem, 1.4vw, 0.8rem)',
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                backgroundColor: activeTab === tab.id ? '#4B3024' : 'transparent',
                color: activeTab === tab.id ? '#FAF6EE' : '#6F4E3E',
                border: activeTab === tab.id ? '1px solid #4B3024' : '1px solid rgba(75, 48, 36, 0.15)',
                transition: 'all 0.25s ease',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="products-grid">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* View All CTA */}
        <div style={{ textAlign: 'center', marginTop: 'clamp(2.5rem, 5vw, 4rem)' }}>
          <button
            onClick={() => navigateTo('shop')}
            className="btn btn-outline btn-lg"
            style={{ maxWidth: '100%', boxSizing: 'border-box' }}
          >
            <span>Explore All Sarees with Filters</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
};
