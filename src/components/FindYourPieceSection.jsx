import React from 'react';
import { useShop } from '../context/ShopContext';

export const FindYourPieceSection = () => {
  const { navigateTo, setPriceRangeFilter } = useShop();

  const handleSelectBudget = (rangeId) => {
    if (setPriceRangeFilter) {
      setPriceRangeFilter(rangeId);
    }
    navigateTo('shop');
  };

  // 4 clean real value ranges within ₹500 – ₹2,000
  const budgetOptions = [
    { id: 'under-800', label: 'Under ₹800' },
    { id: '800-1200', label: '₹800 – ₹1,200' },
    { id: '1200-1600', label: '₹1,200 – ₹1,600' },
    { id: '1600-2000', label: '₹1,600 – ₹2,000' }
  ];

  return (
    <section
      id="find-your-piece"
      style={{
        padding: 'clamp(3rem, 6vw, 4.5rem) 0',
        backgroundColor: '#FFFFFF',
        borderTop: '1px solid rgba(0, 0, 0, 0.05)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.05)'
      }}
    >
      <div className="container" style={{ maxWidth: '1160px', textAlign: 'center' }}>
        {/* Title matching Reference Image 3 */}
        <h2
          style={{
            fontFamily: 'var(--font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
            fontSize: 'clamp(2.2rem, 4vw, 3rem)',
            fontWeight: 400,
            color: '#1A1A1A',
            letterSpacing: '-0.01em',
            marginBottom: '0.85rem'
          }}
        >
          Find Your Piece
        </h2>

        {/* Subtitle with gold horizontal lines: — Browse By Value — */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            marginBottom: 'clamp(2rem, 4vw, 3rem)'
          }}
        >
          <span style={{ width: '40px', height: '1.5px', backgroundColor: '#B88D4A' }} />
          <span
            style={{
              fontSize: '0.82rem',
              fontWeight: 600,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: '#B88D4A'
            }}
          >
            Browse By Value
          </span>
          <span style={{ width: '40px', height: '1.5px', backgroundColor: '#B88D4A' }} />
        </div>

        {/* 4 Clean Value Option Rectangular Cards (Matching Reference Image 3 without 8 placeholders) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 'clamp(0.85rem, 2vw, 1.4rem)',
            maxWidth: '1080px',
            margin: '0 auto'
          }}
        >
          {budgetOptions.map((opt) => (
            <div
              key={opt.id}
              className="browse-value-box"
              onClick={() => handleSelectBudget(opt.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleSelectBudget(opt.id);
                }
              }}
            >
              <span>{opt.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FindYourPieceSection;
