import React from 'react';
import { InstagramIcon } from './SocialIcons';
import { useShop } from '../context/ShopContext';

export const EditorialLookbookSection = () => {
  const { navigateTo, setSelectedCraft } = useShop();

  const gallery = [
    {
      src: '/assets/products/saree_indigo_shibori.jpg',
      tag: '#NilambariShibori',
      alt: 'Nilambari Shibori indigo handwoven mulmul cotton saree drape',
      craft: 'tie-dye',
      productId: 'nilambari-shibori-saree'
    },
    {
      src: '/assets/Carved Wooden Block Printing Stamp Collection.png',
      tag: '#HandcarvedStamps',
      alt: 'Hand-carved wooden Bagru block printing stamps on artisan workbench',
      craft: 'handblock'
    },
    {
      src: '/assets/products/saree_earth_bagru.jpg',
      tag: '#MrittikaBagru',
      alt: 'Mrittika earth-toned Bagru mud-resist block printed cotton saree',
      craft: 'handblock',
      productId: 'mrittika-bagru-cotton-saree'
    },
    {
      src: '/assets/Rustic Natural Dye Still Life.png',
      tag: '#BotanicalPigments',
      alt: 'Natural indigo leaves, madder root, and botanical dye pigments for sarees',
      craft: 'all'
    },
    {
      src: '/assets/products/saree_soft_rose.jpg',
      tag: '#GulabiRaag',
      alt: 'Gulabi Raag soft rose handcrafted cotton saree with woven border',
      craft: 'mulmul',
      productId: 'gulabi-raag-mulmul-saree'
    },
    {
      src: '/assets/Rodhe Saree Packaging Elegance.png',
      tag: '#WovenWithTrust',
      alt: 'Handcrafted RODHE saree folded inside signature heritage keepsake box',
      craft: 'chanderi'
    }
  ];

  const handleItemClick = (item) => {
    if (item.productId) {
      navigateTo('product', item.productId);
    } else {
      setSelectedCraft(item.craft || 'all');
      navigateTo('shop');
    }
  };

  return (
    <section className="section-padding" style={{ backgroundColor: '#FAF6EE' }}>
      <div className="container">
        <div className="section-header" style={{ marginBottom: '2.5rem' }}>
          <div className="eyebrow">Editorial Lookbook</div>
          <h2 className="section-title">#WovenWithTrust</h2>
          <p className="section-subtitle">
            Explore craft chapters, botanical dyes, and draped silhouettes across our collection.
          </p>
        </div>

        <div className="lookbook-grid">
          {gallery.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleItemClick(item)}
              aria-label={`Explore ${item.alt}`}
              style={{
                position: 'relative',
                aspectRatio: '1',
                overflow: 'hidden',
                backgroundColor: '#EADAB5',
                cursor: 'pointer',
                padding: 0,
                border: 'none',
                display: 'block',
                width: '100%'
              }}
              className="lookbook-item"
            >
              <img
                src={item.src}
                alt={item.alt}
                loading="lazy"
                decoding="async"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transition: 'transform 0.6s cubic-bezier(0.19, 1, 0.22, 1)'
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'rgba(75, 48, 36, 0.6)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  color: '#FAF6EE',
                  opacity: 0,
                  transition: 'opacity 0.3s ease',
                  padding: '1rem',
                  textAlign: 'center'
                }}
                className="lookbook-overlay"
              >
                <InstagramIcon size={20} color="#D4AC68" />
                <span style={{ fontSize: '0.78rem', letterSpacing: '0.08em', fontWeight: 600 }}>
                  {item.tag}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <style>{`
        .lookbook-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.65rem;
        }
        @media (min-width: 560px) {
          .lookbook-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 0.85rem;
          }
        }
        @media (min-width: 992px) {
          .lookbook-grid {
            grid-template-columns: repeat(6, 1fr);
            gap: 1rem;
          }
        }
        .lookbook-item:hover img {
          transform: scale(1.08);
        }
        .lookbook-item:hover .lookbook-overlay,
        .lookbook-item:active .lookbook-overlay {
          opacity: 1 !important;
        }
      `}</style>
    </section>
  );
};
