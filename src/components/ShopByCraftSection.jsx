import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const ShopByCraftSection = () => {
  const { setSelectedCraft, navigateTo } = useShop();

  const crafts = [
    {
      id: 'tie-dye',
      title: 'Tie & Dye / Shibori',
      desc: 'Hand-knotted resist folds dyed in fermented natural indigo vats.',
      image: '/assets/Indigo Tie-Dye Fabric Knot.png',
      badge: 'Botanical Indigo'
    },
    {
      id: 'handblock',
      title: 'Handblock & Bagru',
      desc: 'Intricate teakwood stamps imprinted with mud resist and vegetable pigments.',
      image: '/assets/Carved Wooden Block Printing Stamp Collection.png',
      badge: 'Heritage Prints'
    },
    {
      id: 'chanderi',
      title: 'Chanderi Silk & Zari',
      desc: 'Gossamer cotton-silk woven with antique gold zari temple butis.',
      image: '/assets/products/saree_soft_rose.jpg',
      badge: 'Lustrous Sheer'
    },
    {
      id: 'mulmul',
      title: 'Pure Mulmul Cotton',
      desc: 'Featherweight breathable drapes spun from 100% organic Indian cotton.',
      image: '/assets/products/saree_ivory_mulmul.jpg',
      badge: 'Woven Wind'
    }
  ];

  const handleSelectCraft = (craftId) => {
    setSelectedCraft(craftId);
    navigateTo('shop');
  };

  return (
    <section className="section-padding" style={{ backgroundColor: '#FAF6EE' }}>
      <div className="container">
        <div className="section-header">
          <div className="eyebrow">Artisanal Guilds</div>
          <h2 className="section-title">Shop by Craft</h2>
          <p className="section-subtitle">
            Explore sarees categorised by the ancient techniques that shaped them.
          </p>
        </div>

        <div
          style={{
            maxWidth: '1160px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
            gap: 'clamp(0.85rem, 2vw, 1.25rem)'
          }}
        >
          {crafts.map((craft) => (
            <div
              key={craft.id}
              onClick={() => handleSelectCraft(craft.id)}
              style={{
                position: 'relative',
                backgroundColor: '#FFFDF9',
                border: '1px solid rgba(75, 48, 36, 0.12)',
                cursor: 'pointer',
                overflow: 'hidden',
                transition: 'all 0.4s cubic-bezier(0.19, 1, 0.22, 1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.borderColor = '#B88D4A';
                e.currentTarget.style.boxShadow = '0 10px 24px rgba(75, 48, 36, 0.09)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'rgba(75, 48, 36, 0.12)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Image Frame */}
              <div style={{ position: 'relative', aspectRatio: '1 / 0.92', overflow: 'hidden' }}>
                <img
                  src={craft.image}
                  alt={craft.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center 25%',
                    transition: 'transform 0.6s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                />
                <span
                  style={{
                    position: 'absolute',
                    top: '0.7rem',
                    left: '0.7rem',
                    backgroundColor: 'rgba(250, 246, 238, 0.94)',
                    backdropFilter: 'blur(6px)',
                    fontSize: '0.64rem',
                    fontWeight: 600,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: '#4B3024',
                    padding: '0.25rem 0.55rem',
                    border: '1px solid rgba(184, 141, 74, 0.25)'
                  }}
                >
                  {craft.badge}
                </span>
              </div>

              {/* Craft Info */}
              <div style={{ padding: '1.1rem 1.05rem 1.25rem' }}>
                <h3
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.18rem',
                    fontWeight: 500,
                    color: '#4B3024',
                    marginBottom: '0.35rem'
                  }}
                >
                  {craft.title}
                </h3>
                <p
                  style={{
                    fontSize: '0.80rem',
                    color: '#8F7263',
                    lineHeight: 1.48,
                    marginBottom: '0.85rem'
                  }}
                >
                  {craft.desc}
                </p>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: '#B88D4A'
                  }}
                >
                  <span>Explore Craft</span>
                  <ArrowRight size={13} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
