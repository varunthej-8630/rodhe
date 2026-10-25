import React from 'react';
import { useShop } from '../context/ShopContext';
import { Sparkles, MessageCircle, ArrowRight } from 'lucide-react';

/**
 * CraftMarquee — Broad, High-Clarity Horizontal Scrolling Ribbon
 * 
 * Features:
 * - Broad vertical presence to fill transitional space
 * - Large, prominent, high-legibility typography
 * - Smooth seamless infinite linear loop (pause on hover)
 * - Highlights Pure Cotton Sarees, Natural Dyeing & Bespoke Block Printing
 */
export const CraftMarquee = () => {
  const { navigateTo } = useShop();

  const marqueeItems = [
    {
      badge: '100% PURE COTTON',
      title: 'Pure Cotton Handloom Sarees',
      subtitle: 'Featherlight Mulmul, Kota Doria & Chanderi',
      action: () => navigateTo('shop')
    },
    {
      badge: 'HERITAGE CRAFT',
      title: 'Authentic Hand Block Printing',
      subtitle: 'Traditional Bagru, Dabu Mud-Resist & Ajrakh',
      action: () => navigateTo('shop')
    },
    {
      badge: 'BESPOKE SERVICE',
      title: 'Customized Block Printing & Dyeing',
      subtitle: 'Made-To-Order Motifs & Custom Color Palettes',
      isHighlight: true,
      action: () => {
        window.open(
          'https://wa.me/919490658858?text=Hello%20Rodhe%2C%20I%20am%20interested%20in%20customized%20block%20printing%20and%20dyeing%20for%20a%20cotton%20saree.',
          '_blank'
        );
      }
    },
    {
      badge: 'BOTANICAL PIGMENTS',
      title: 'Natural & Organic Dyeing',
      subtitle: 'Fermented Indigo, Madder Roots & Earth Clay',
      action: () => {
        const el = document.getElementById('shop-by-colour');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
        else navigateTo('shop');
      }
    },
    {
      badge: 'ARTISAN DIRECT',
      title: 'Diverse Saree Collections',
      subtitle: 'Hand-Carved Wooden Blocks & Generational Drapes',
      action: () => navigateTo('shop')
    },
    {
      badge: 'CUSTOM ORDERS',
      title: 'Tailored Block Prints on Demand',
      subtitle: 'Choose Your Fabric, Dye Shade & Block Pattern',
      isHighlight: true,
      action: () => {
        window.open(
          'https://wa.me/919490658858?text=Hello%20Rodhe%2C%20I%20want%20to%20order%20a%20custom%20block%20printed%20and%20dyed%20cotton%20saree.',
          '_blank'
        );
      }
    }
  ];

  const renderTrack = (trackKey) => (
    <div key={trackKey} className="rodhe-marquee-track">
      {marqueeItems.map((item, idx) => (
        <div
          key={`${trackKey}-${idx}`}
          className={`rodhe-marquee-item ${item.isHighlight ? 'highlight-item' : ''}`}
          onClick={item.action}
          role="button"
          tabIndex={0}
          title={`Click to explore: ${item.title}`}
        >
          <span className="marquee-separator">✦</span>

          {item.badge && (
            <span className={`marquee-pill ${item.isHighlight ? 'pill-gold' : 'pill-subtle'}`}>
              {item.isHighlight && <Sparkles size={13} className="mr-1" />}
              {item.badge}
            </span>
          )}

          <span className="marquee-title">{item.title}</span>

          <span className="marquee-dot">•</span>

          <span className="marquee-subtitle">{item.subtitle}</span>

          {item.isHighlight ? (
            <span className="marquee-cta-link">
              <MessageCircle size={14} style={{ display: 'inline', marginRight: 5 }} />
              Custom Order
            </span>
          ) : (
            <ArrowRight size={14} className="marquee-arrow" />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div id="craft-marquee-ribbon" className="rodhe-marquee-container" aria-label="Artisanal Handloom Highlights">
      <div className="rodhe-marquee-wrapper">
        {/* Track 1 and Track 2 for seamless infinite looping */}
        {renderTrack('track-primary')}
        {renderTrack('track-secondary')}
      </div>

      <style>{`
        .rodhe-marquee-container {
          position: relative;
          width: 100%;
          background: linear-gradient(90deg, #1F130E 0%, #2D1A13 35%, #352017 50%, #2D1A13 65%, #1F130E 100%);
          border-top: 1.5px solid rgba(212, 172, 104, 0.45);
          border-bottom: 1.5px solid rgba(212, 172, 104, 0.35);
          color: #FAF6EE;
          overflow: hidden;
          /* Broad vertical footprint to comfortably fill the transition gap */
          padding: clamp(1.35rem, 2.2vw, 1.85rem) 0;
          box-shadow: 0 6px 24px rgba(22, 13, 9, 0.45), inset 0 1px 0 rgba(255, 235, 195, 0.12);
          z-index: 10;
        }

        .rodhe-marquee-wrapper {
          display: flex;
          width: max-content;
          will-change: transform;
        }

        .rodhe-marquee-track {
          display: flex;
          align-items: center;
          flex-shrink: 0;
          white-space: nowrap;
          animation: rodheScrollAnimation 42s linear infinite;
        }

        /* Pause marquee on hover for easy reading and interaction */
        .rodhe-marquee-container:hover .rodhe-marquee-track {
          animation-play-state: paused;
        }

        @keyframes rodheScrollAnimation {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-100%);
          }
        }

        .rodhe-marquee-item {
          display: inline-flex;
          align-items: center;
          gap: clamp(0.75rem, 1.4vw, 1.15rem);
          padding: 0 clamp(1.6rem, 2.8vw, 2.5rem);
          cursor: pointer;
          transition: all 0.25s ease;
          user-select: none;
        }

        .rodhe-marquee-item:hover {
          opacity: 0.95;
          transform: translateY(-1px);
        }

        .marquee-separator {
          color: #E2BA6F;
          font-size: clamp(1rem, 1.5vw, 1.3rem);
          opacity: 0.85;
          margin-right: 0.35rem;
          text-shadow: 0 0 10px rgba(226, 186, 111, 0.4);
        }

        /* Large, prominent pill badge */
        .marquee-pill {
          display: inline-flex;
          align-items: center;
          padding: clamp(0.3rem, 0.5vw, 0.42rem) clamp(0.75rem, 1.2vw, 1rem);
          font-size: clamp(0.72rem, 0.95vw, 0.82rem);
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          border-radius: 9999px;
          line-height: 1;
        }

        .pill-subtle {
          background: rgba(250, 246, 238, 0.12);
          color: #F4E7CE;
          border: 1px solid rgba(226, 186, 111, 0.35);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        .pill-gold {
          background: linear-gradient(135deg, #B88D4A 0%, #E2BA6F 100%);
          color: #231610;
          font-weight: 850;
          border: 1px solid rgba(255, 235, 195, 0.6);
          box-shadow: 0 2px 14px rgba(226, 186, 111, 0.5);
        }

        /* Broad, bold and clear title */
        .marquee-title {
          font-family: var(--font-serif, 'Cormorant Garamond', Georgia, serif);
          font-size: clamp(1.22rem, 1.85vw, 1.55rem);
          font-weight: 700;
          letter-spacing: 0.04em;
          color: #FFFDF9;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.45);
        }

        .highlight-item .marquee-title {
          color: #FFF5E0;
          font-weight: 750;
        }

        .marquee-dot {
          color: rgba(226, 186, 111, 0.5);
          font-size: 1rem;
        }

        /* High-clarity subtitle */
        .marquee-subtitle {
          font-family: var(--font-sans, sans-serif);
          font-size: clamp(0.88rem, 1.2vw, 1.05rem);
          letter-spacing: 0.04em;
          color: #F7EAD0;
          font-weight: 500;
        }

        .marquee-arrow {
          color: #E2BA6F;
          opacity: 0.7;
          transition: transform 0.25s ease, opacity 0.25s ease;
        }

        .rodhe-marquee-item:hover .marquee-arrow {
          opacity: 1;
          transform: translateX(4px);
        }

        .marquee-cta-link {
          display: inline-flex;
          align-items: center;
          font-size: clamp(0.78rem, 1vw, 0.88rem);
          font-weight: 700;
          letter-spacing: 0.08em;
          color: #FFF5E0;
          background: rgba(226, 186, 111, 0.2);
          border: 1px solid rgba(226, 186, 111, 0.5);
          border-radius: 9999px;
          padding: 0.3rem 0.8rem;
          transition: all 0.2s ease;
        }

        .rodhe-marquee-item:hover .marquee-cta-link {
          background: rgba(226, 186, 111, 0.35);
          border-color: #E2BA6F;
          transform: scale(1.04);
        }

        /* Edge vignettes for smooth fade-in and fade-out */
        .rodhe-marquee-container::before,
        .rodhe-marquee-container::after {
          content: '';
          position: absolute;
          top: 0;
          bottom: 0;
          width: 80px;
          z-index: 2;
          pointer-events: none;
        }

        .rodhe-marquee-container::before {
          left: 0;
          background: linear-gradient(90deg, #1F130E 0%, transparent 100%);
        }

        .rodhe-marquee-container::after {
          right: 0;
          background: linear-gradient(270deg, #1F130E 0%, transparent 100%);
        }

        @media (max-width: 768px) {
          .rodhe-marquee-container {
            padding: 1.15rem 0;
          }
          .rodhe-marquee-track {
            animation-duration: 30s;
          }
          .rodhe-marquee-item {
            padding: 0 1.25rem;
            gap: 0.65rem;
          }
          .marquee-title {
            font-size: 1.1rem;
          }
          .marquee-subtitle {
            font-size: 0.82rem;
          }
          .marquee-pill {
            font-size: 0.68rem;
            padding: 0.25rem 0.65rem;
          }
        }
      `}</style>
    </div>
  );
};

export default CraftMarquee;
