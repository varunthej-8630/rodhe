import React from 'react';
import { ProductCard } from './ProductCard';
import { useShop } from '../context/ShopContext';

export const ProductGrid = () => {
  const { navigateTo, PRODUCTS } = useShop();

  // Published items sorted
  const publishedProducts = (PRODUCTS || []).filter(p => !p.status || p.status === 'published');
  const sorted = [...publishedProducts].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  // 1. Best Sellers: pick 4 bestsellers
  const bestSellers = sorted.filter(p => p.isBestseller).slice(0, 4);
  const bestSellerList = bestSellers.length >= 4 
    ? bestSellers 
    : [...bestSellers, ...sorted.filter(p => !bestSellers.some(b => b.id === p.id))].slice(0, 4);

  // 2. Recently Unveiled: pick 4 new or remaining distinct items
  const bestSellerIds = new Set(bestSellerList.map(p => p.id));
  const newItems = sorted.filter(p => (p.isNew || p.isNewArrival) && !bestSellerIds.has(p.id));
  const recentlyUnveiledList = newItems.length >= 4 
    ? newItems.slice(0, 4) 
    : [...newItems, ...sorted.filter(p => !bestSellerIds.has(p.id) && !newItems.some(n => n.id === p.id))].slice(0, 4);

  return (
    <div id="product-grid" style={{ backgroundColor: '#FFFDF9', padding: 'clamp(2.5rem, 5vw, 4rem) 0' }}>
      <div className="container" style={{ maxWidth: '1240px' }}>
        
        {/* ========================================================= */}
        {/* SECTION 1: BEST SELLERS (Exact Reference Image 1)       */}
        {/* ========================================================= */}
        <section style={{ marginBottom: 'clamp(3rem, 6vw, 4.5rem)' }}>
          <div className="ecommerce-section-header">
            <div>
              <div className="ecommerce-eyebrow">MOST COVETED</div>
              <h2 className="ecommerce-section-title">Best Sellers</h2>
            </div>
            <button
              onClick={() => navigateTo('shop')}
              className="ecommerce-view-all-link"
              aria-label="View All Best Sellers"
            >
              View All Best Sellers
            </button>
          </div>

          <div className="ecommerce-products-row">
            {bestSellerList.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 2: RECENTLY UNVEILED (Exact Reference Image 2)   */}
        {/* ========================================================= */}
        <section>
          <div className="ecommerce-section-header">
            <div>
              <div className="ecommerce-eyebrow">MOST COVETED</div>
              <h2 className="ecommerce-section-title">Recently Unveiled</h2>
            </div>
            <button
              onClick={() => navigateTo('shop')}
              className="ecommerce-view-all-link"
              aria-label="View All Recently Added"
            >
              View All Recently Added
            </button>
          </div>

          <div className="ecommerce-products-row">
            {recentlyUnveiledList.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

      </div>
    </div>
  );
};

export default ProductGrid;
