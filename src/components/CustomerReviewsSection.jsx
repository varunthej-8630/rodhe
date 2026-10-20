import React from 'react';
import { Star, Quote, CheckCircle2 } from 'lucide-react';
import { TESTIMONIALS } from '../data/storyData';

export const CustomerReviewsSection = () => {
  return (
    <section className="section-padding" style={{ backgroundColor: '#FAF6EE' }}>
      <div className="container">
        <div className="section-header">
          <div className="eyebrow">Patron Stories</div>
          <h2 className="section-title">Woven into Everyday Lives</h2>
          <p className="section-subtitle">
            Words from collectors, artists, and patrons who drape RODHE across the world.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem'
          }}
        >
          {TESTIMONIALS.map((t) => (
            <div
              key={t.id}
              style={{
                backgroundColor: '#FFFDF9',
                padding: '2.25rem 2rem',
                border: '1px solid rgba(75, 48, 36, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(75, 48, 36, 0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Star Rating */}
              <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.25rem' }}>
                {[...Array(t.rating)].map((_, i) => (
                  <Star key={i} size={15} fill="#B88D4A" color="#B88D4A" />
                ))}
              </div>

              {/* Review Text */}
              <p
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1.15rem',
                  lineHeight: 1.6,
                  color: '#4B3024',
                  fontStyle: 'italic',
                  marginBottom: '1.5rem',
                  flexGrow: 1
                }}
              >
                “{t.review}”
              </p>

              {/* Saree Mention */}
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: '#B88D4A',
                  marginBottom: '0.85rem'
                }}
              >
                Draped: {t.saree}
              </div>

              {/* Patron Info */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid rgba(75, 48, 36, 0.08)',
                  paddingTop: '1rem'
                }}
              >
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#4B3024' }}>
                    {t.name}
                  </h4>
                  <span style={{ fontSize: '0.78rem', color: '#8F7263' }}>
                    {t.role} • {t.location}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.72rem', color: '#B88D4A' }}>
                  <CheckCircle2 size={13} />
                  <span>Verified Patron</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
