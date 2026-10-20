import React from 'react';
import { Package, ShieldCheck, HeartHandshake, Sparkles } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const PackagingSection = () => {
  const { navigateTo } = useShop();

  return (
    <section
      className="section-padding"
      style={{
        backgroundColor: '#F4ECE1',
        borderTop: '1px solid rgba(184, 141, 74, 0.2)',
        borderBottom: '1px solid rgba(184, 141, 74, 0.2)'
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 'clamp(2.5rem, 5vw, 5rem)',
            alignItems: 'center'
          }}
        >
          {/* Packaging Imagery */}
          <div style={{ position: 'relative' }}>
            <div
              style={{
                position: 'relative',
                aspectRatio: '4 / 3',
                overflow: 'hidden',
                boxShadow: '0 20px 45px -10px rgba(75, 48, 36, 0.18)',
                border: '1px solid rgba(184, 141, 74, 0.3)'
              }}
            >
              <img
                src="/assets/Rodhe Saree Packaging Elegance.png"
                alt="Rodhe Saree Packaging Elegance"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: '1rem',
                  left: '1rem',
                  backgroundColor: 'rgba(250, 246, 238, 0.94)',
                  backdropFilter: 'blur(6px)',
                  padding: '0.4rem 0.85rem',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: '#4B3024',
                  border: '1px solid rgba(184, 141, 74, 0.25)'
                }}
              >
                Signature Packaging
              </div>
            </div>

            {/* Inset Secondary Moodboard */}
            <div
              style={{
                position: 'absolute',
                bottom: '-25px',
                right: '-20px',
                width: '45%',
                aspectRatio: '4 / 3',
                overflow: 'hidden',
                border: '3px solid #FAF6EE',
                boxShadow: '0 12px 30px rgba(75, 48, 36, 0.2)'
              }}
              className="d-none d-sm-block"
            >
              <img
                src="/assets/Rodhe Saree Packaging Moodboard.png"
                alt="Rodhe Saree Packaging Moodboard"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          </div>

          {/* Narrative Content */}
          <div>
            <div className="eyebrow" style={{ justifyContent: 'flex-start' }}>
              The Unboxing Ritual
            </div>

            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(2.2rem, 3.8vw, 3.4rem)',
                fontWeight: 400,
                color: '#4B3024',
                lineHeight: 1.15,
                marginBottom: '1.25rem'
              }}
            >
              Packaged with Reverence. <br />
              <span style={{ fontStyle: 'italic', color: '#B88D4A' }}>
                Delivered with Trust.
              </span>
            </h2>

            <p
              style={{
                fontSize: '0.98rem',
                color: '#6F4E3E',
                lineHeight: 1.8,
                marginBottom: '2rem'
              }}
            >
              Opening a RODHE saree is designed to be an emotional moment. Every drape is wrapped in acid-free unbleached tissue paper, accompanied by our handwritten artisan card detailing the specific natural dye bath and master weaver who shaped it.
            </p>

            {/* Feature List */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2.5rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    backgroundColor: 'rgba(184, 141, 74, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <Package size={18} color="#B88D4A" />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 600, color: '#4B3024', marginBottom: '0.2rem' }}>
                    100% Recycled Box
                  </h4>
                  <p style={{ fontSize: '0.78rem', color: '#8F7263', lineHeight: 1.4 }}>
                    Rigid keepsake box reusable for saree preservation.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    backgroundColor: 'rgba(184, 141, 74, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <ShieldCheck size={18} color="#B88D4A" />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 600, color: '#4B3024', marginBottom: '0.2rem' }}>
                    Artisan Provenance
                  </h4>
                  <p style={{ fontSize: '0.78rem', color: '#8F7263', lineHeight: 1.4 }}>
                    Includes certificate of genuine handloom and natural dye.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => navigateTo('story')}
              className="btn btn-primary"
            >
              Learn About Our Craft Ethics
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
