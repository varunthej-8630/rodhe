import React from 'react';
import { COLOR_PALETTES } from '../data/products';
import { useShop } from '../context/ShopContext';

export const ShopByColourSection = () => {
  const { setSelectedColor, navigateTo } = useShop();

  const handleSelectColor = (colorId) => {
    setSelectedColor(colorId);
    navigateTo('shop');
  };

  const colorData = [
    { id: 'indigo', name: 'Indigo Blue', source: 'Fermented Indigofera Leaves', hex: '#26425A' },
    { id: 'earth', name: 'Earth Clay', source: 'Dabu Mud & Seasoned Rust', hex: '#4B3024' },
    { id: 'rose', name: 'Soft Rose', source: 'Dried Madder & Rose Extract', hex: '#C98278' },
    { id: 'ivory', name: 'Raw Ivory', source: 'Unbleached Organic Cotton', hex: '#EADAB5' },
    { id: 'gold', name: 'Muted Gold', source: 'Wild Tussar & Zari Filaments', hex: '#B88D4A' },
    { id: 'madder', name: 'Madder Red', source: 'Crushed Manjistha Tree Roots', hex: '#9E3C2B' },
    { id: 'olive', name: 'Forest Olive', source: 'Pomegranate Rinds & Iron Tannin', hex: '#525B3A' }
  ];

  return (
    <section className="section-padding" style={{ backgroundColor: '#F4ECE1' }}>
      <div className="container">
        <div className="section-header">
          <div className="eyebrow">Botanical Pigments</div>
          <h2 className="section-title">Shop by Colour</h2>
          <p className="section-subtitle">
            Hues extracted from live roots, leaves, bark, and sunshine.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 135px), 1fr))',
            gap: 'clamp(0.75rem, 2vw, 1.25rem)'
          }}
        >
          {colorData.map((c) => (
            <div
              key={c.id}
              onClick={() => handleSelectColor(c.id)}
              style={{
                backgroundColor: '#FFFDF9',
                padding: '1.5rem 1rem',
                border: '1px solid rgba(75, 48, 36, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(75, 48, 36, 0.08)';
                e.currentTarget.style.borderColor = '#B88D4A';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = 'rgba(75, 48, 36, 0.1)';
              }}
            >
              {/* Swatch Circle */}
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  backgroundColor: c.hex,
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.15), 0 4px 10px rgba(0,0,0,0.06)',
                  marginBottom: '1rem',
                  border: c.id === 'ivory' ? '1px solid rgba(75, 48, 36, 0.2)' : 'none'
                }}
              />

              <h4
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1.15rem',
                  fontWeight: 500,
                  color: '#4B3024',
                  marginBottom: '0.25rem'
                }}
              >
                {c.name}
              </h4>

              <p
                style={{
                  fontSize: '0.72rem',
                  color: '#8F7263',
                  lineHeight: 1.4
                }}
              >
                {c.source}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
