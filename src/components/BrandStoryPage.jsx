import React from 'react';
import { ArrowRight, Sparkles, Feather, ShieldCheck, HeartHandshake } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const BrandStoryPage = () => {
  const { navigateTo } = useShop();

  return (
    <div style={{ backgroundColor: '#FAF6EE', minHeight: '100vh', paddingBottom: '6rem' }}>
      {/* Editorial Story Hero */}
      <div
        style={{
          position: 'relative',
          padding: 'clamp(4rem, 8vw, 7rem) 0 4.5rem',
          backgroundColor: '#F4ECE1',
          borderBottom: '1px solid rgba(184, 141, 74, 0.25)',
          textAlign: 'center'
        }}
      >
        <div className="container" style={{ maxWidth: '860px' }}>
          <div className="eyebrow">The RODHE Manifesto</div>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(2.6rem, 5.2vw, 4.8rem)',
              fontWeight: 400,
              color: '#4B3024',
              lineHeight: 1.1,
              marginBottom: '1.25rem'
            }}
          >
            Woven with Trust. <br />
            <span style={{ fontStyle: 'italic', color: '#B88D4A' }}>
              Rooted in Nature.
            </span>
          </h1>
          <p
            style={{
              fontSize: 'clamp(1rem, 1.5vw, 1.25rem)',
              color: '#6F4E3E',
              lineHeight: 1.8,
              fontWeight: 300,
              margin: '0 auto 2.5rem'
            }}
          >
            RODHE was founded with a single pure intention: to return Indian textile craft to its organic essence, honouring the living relationship between soil, artisan, and drape.
          </p>

          <img
            src="/assets/01_Primary_logo_transparent.png"
            alt="RODHE Emblem"
            style={{ width: '90px', margin: '0 auto', opacity: 0.9 }}
          />
        </div>
      </div>

      {/* The Creative Concept Chain */}
      <div className="container" style={{ paddingTop: '5rem', paddingBottom: '3rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'clamp(0.5rem, 1.5vw, 1.5rem)',
            flexWrap: 'wrap',
            padding: '2rem 1rem',
            backgroundColor: '#FFFDF9',
            border: '1px solid rgba(184, 141, 74, 0.25)',
            boxShadow: '0 10px 30px rgba(75, 48, 36, 0.05)',
            marginBottom: '5rem'
          }}
        >
          {['Nature', 'Cotton', 'Thread', 'Natural Colour', 'Handcrafted Patterns', 'Saree', 'RODHE'].map((step, idx, arr) => (
            <React.Fragment key={step}>
              <span
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 'clamp(1rem, 1.8vw, 1.4rem)',
                  fontWeight: step === 'RODHE' ? 700 : 500,
                  color: step === 'RODHE' ? '#B88D4A' : '#4B3024',
                  letterSpacing: step === 'RODHE' ? '0.1em' : 'normal'
                }}
              >
                {step}
              </span>
              {idx < arr.length - 1 && (
                <span style={{ color: '#C98278', fontSize: '1.2rem', opacity: 0.6 }}>→</span>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Section 1: The Philosophy of Honest Cotton */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 'clamp(2.5rem, 5vw, 5rem)',
            alignItems: 'center',
            marginBottom: '6rem'
          }}
        >
          <div>
            <div className="eyebrow" style={{ justifyContent: 'flex-start' }}>Purity of Fiber</div>
            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(2rem, 3.5vw, 3rem)',
                color: '#4B3024',
                lineHeight: 1.2,
                marginBottom: '1.25rem'
              }}
            >
              Every Thread Begins in the Soil
            </h2>
            <p style={{ fontSize: '0.96rem', color: '#6F4E3E', lineHeight: 1.8, marginBottom: '1.25rem' }}>
              We believe a garment touches your body closer than almost anything else you invite into your day. That is why our mulmul and cotton-silk yarns originate in pesticide-free, rain-fed soils nurtured through organic crop rotation.
            </p>
            <p style={{ fontSize: '0.96rem', color: '#6F4E3E', lineHeight: 1.8 }}>
              No chemical defoliants, no synthetic bleach. The pale ivory of a RODHE saree is the unadulterated tone of natural Indian sunshine.
            </p>
          </div>

          <div
            style={{
              aspectRatio: '4 / 3',
              overflow: 'hidden',
              border: '1px solid rgba(184, 141, 74, 0.3)',
              boxShadow: '0 16px 40px rgba(75, 48, 36, 0.12)'
            }}
          >
            <img
              src="/assets/Rustic Natural Dye Still Life.png"
              alt="Natural Dye & Textile Ingredients"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        </div>

        {/* Section 2: Botanical Pigments & The Alchemy of Living Color */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 'clamp(2.5rem, 5vw, 5rem)',
            alignItems: 'center',
            marginBottom: '6rem'
          }}
        >
          <div
            style={{
              aspectRatio: '4 / 3',
              overflow: 'hidden',
              border: '1px solid rgba(184, 141, 74, 0.3)',
              boxShadow: '0 16px 40px rgba(75, 48, 36, 0.12)',
              order: 2
            }}
            className="order-md-1"
          >
            <img
              src="/assets/Handcrafted Indigo Block Printing.png"
              alt="Handcrafted Indigo Block Printing"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          <div style={{ order: 1 }} className="order-md-2">
            <div className="eyebrow" style={{ justifyContent: 'flex-start' }}>Living Pigments</div>
            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(2rem, 3.5vw, 3rem)',
                color: '#4B3024',
                lineHeight: 1.2,
                marginBottom: '1.25rem'
              }}
            >
              The Living Fermentation of Indigo & Madder
            </h2>
            <p style={{ fontSize: '0.96rem', color: '#6F4E3E', lineHeight: 1.8, marginBottom: '1.25rem' }}>
              Unlike industrial synthetic dyes that coat thread in plastic polymers, natural botanical pigments bond into the fiber core through natural fermentation.
            </p>
            <p style={{ fontSize: '0.96rem', color: '#6F4E3E', lineHeight: 1.8 }}>
              Our blue is genuine <em>Indigofera tinctoria</em>; our terracotta reds are coaxed from crushed madder root; our earthy greens emerge from wild pomegranate rinds. When you wear a natural dye saree, the colors age gracefully like fine parchment.
            </p>
          </div>
        </div>

        {/* Section 3: The Generational Artisan Hands */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 'clamp(2.5rem, 5vw, 5rem)',
            alignItems: 'center',
            marginBottom: '6rem'
          }}
        >
          <div>
            <div className="eyebrow" style={{ justifyContent: 'flex-start' }}>Human Touch</div>
            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(2rem, 3.5vw, 3rem)',
                color: '#4B3024',
                lineHeight: 1.2,
                marginBottom: '1.25rem'
              }}
            >
              The Meaning of “Woven with Trust”
            </h2>
            <p style={{ fontSize: '0.96rem', color: '#6F4E3E', lineHeight: 1.8, marginBottom: '1.25rem' }}>
              Trust is a covenant. It means the artisan receives dignified remuneration and respect for their generational heritage. It means our customers receive 100% genuine craftsmanship, without fabricated polyester blends or deceptive labeling.
            </p>
            <p style={{ fontSize: '0.96rem', color: '#6F4E3E', lineHeight: 1.8 }}>
              When a saree takes three days of meticulous block printing or sixty hours on a pit loom, every drape carries the dignity of its creators.
            </p>
          </div>

          <div
            style={{
              aspectRatio: '4 / 3',
              overflow: 'hidden',
              border: '1px solid rgba(184, 141, 74, 0.3)',
              boxShadow: '0 16px 40px rgba(75, 48, 36, 0.12)'
            }}
          >
            <img
              src="/assets/Carved Wooden Block Printing Stamp Collection.png"
              alt="Carved Wooden Block Printing Stamps"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        </div>

        {/* Official Atelier Presentation (Visiting Cards & Identity) */}
        <div
          style={{
            backgroundColor: '#F4ECE1',
            padding: '3.5rem 2rem',
            border: '1px solid rgba(184, 141, 74, 0.25)',
            textAlign: 'center',
            marginBottom: '5rem'
          }}
        >
          <div className="eyebrow">Brand Heritage</div>
          <h3
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '2.4rem',
              color: '#4B3024',
              marginBottom: '1rem'
            }}
          >
            The Official RODHE Atelier
          </h3>
          <p style={{ fontSize: '0.94rem', color: '#6F4E3E', maxWidth: '600px', margin: '0 auto 2.5rem' }}>
            Rooted in India, recognized by textile connoisseurs worldwide.
          </p>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2rem',
              flexWrap: 'wrap'
            }}
          >
            <img
              src="/assets/VC-F.png"
              alt="RODHE Official Identity"
              style={{ maxHeight: '200px', boxShadow: '0 12px 30px rgba(0,0,0,0.15)', border: '1px solid rgba(75, 48, 36, 0.15)' }}
            />
            <img
              src="/assets/VC-B.png"
              alt="RODHE Woven with Trust Card"
              style={{ maxHeight: '200px', boxShadow: '0 12px 30px rgba(0,0,0,0.15)', border: '1px solid rgba(75, 48, 36, 0.15)' }}
            />
          </div>
        </div>

        {/* Explore Collection CTA */}
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', color: '#4B3024', marginBottom: '1rem' }}>
            Experience the Drape for Yourself
          </h3>
          <button
            onClick={() => navigateTo('shop')}
            className="btn btn-gold btn-lg"
          >
            <span>Explore the Saree Atelier</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
