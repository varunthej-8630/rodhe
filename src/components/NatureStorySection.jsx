import React, { useState } from 'react';
import { ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { STORY_CHAPTERS } from '../data/storyData';
import { useShop } from '../context/ShopContext';

export const NatureStorySection = () => {
  const { navigateTo } = useShop();
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const chapter = STORY_CHAPTERS[activeChapterIndex];

  return (
    <section
      id="nature-story"
      className="section-padding"
      style={{
        backgroundColor: '#FAF6EE',
        borderTop: '1px solid rgba(184, 141, 74, 0.2)',
        borderBottom: '1px solid rgba(184, 141, 74, 0.2)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Subtle organic watermark in background */}
      <div
        style={{
          position: 'absolute',
          top: '5%',
          right: '-5%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(234, 218, 181, 0.35) 0%, rgba(250, 246, 238, 0) 70%)',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        {/* Section Header */}
        <div className="section-header">
          <div className="eyebrow">The Rodhe Journey</div>
          <h2 className="section-title">From Nature to Saree</h2>
          <p className="section-subtitle">
            Nature → Cotton → Thread → Natural Colour → Handcrafted Patterns → Saree → RODHE
          </p>
        </div>

        {/* Chapter Navigation Tabs */}
        <div
          className="nature-tabs-container"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'clamp(0.4rem, 1.5vw, 1.5rem)',
            marginBottom: 'clamp(2rem, 4vw, 3.5rem)',
            borderBottom: '1px solid rgba(75, 48, 36, 0.12)',
            paddingBottom: '1rem',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            maxWidth: '100%'
          }}
        >
          {STORY_CHAPTERS.map((chap, idx) => (
            <button
              key={chap.number}
              onClick={() => setActiveChapterIndex(idx)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.55rem clamp(0.75rem, 2vw, 1.25rem)',
                fontSize: 'clamp(0.74rem, 1.4vw, 0.82rem)',
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: activeChapterIndex === idx ? '#4B3024' : '#8F7263',
                backgroundColor: activeChapterIndex === idx ? 'rgba(234, 218, 181, 0.55)' : 'transparent',
                borderBottom: activeChapterIndex === idx ? '2px solid #B88D4A' : '2px solid transparent',
                transition: 'all 0.3s ease',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '0.95rem',
                  color: activeChapterIndex === idx ? '#B88D4A' : '#8F7263'
                }}
              >
                {chap.number}
              </span>
              <span>{chap.title}</span>
            </button>
          ))}
        </div>

        {/* Active Chapter Editorial Display */}
        <div
          className="nature-story-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
            gap: 'clamp(2rem, 5vw, 4.5rem)',
            alignItems: 'center'
          }}
        >
          {/* Visual Showcase (Authentic assets) */}
          <div style={{ position: 'relative', width: '100%', minWidth: 0 }}>
            <div
              style={{
                position: 'relative',
                aspectRatio: '4 / 3',
                overflow: 'hidden',
                boxShadow: '0 16px 40px -10px rgba(75, 48, 36, 0.15)',
                border: '1px solid rgba(184, 141, 74, 0.3)',
                width: '100%'
              }}
            >
              <img
                src={chapter.image}
                alt={chapter.title}
                key={chapter.image}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  animation: 'fadeIn 0.6s ease'
                }}
              />

              <div
                style={{
                  position: 'absolute',
                  bottom: '0.85rem',
                  left: '0.85rem',
                  padding: '0.35rem 0.75rem',
                  backgroundColor: 'rgba(250, 246, 238, 0.92)',
                  backdropFilter: 'blur(6px)',
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: '#4B3024',
                  border: '1px solid rgba(184, 141, 74, 0.25)'
                }}
              >
                Authentic Craft Archive
              </div>
            </div>

            {/* Overlapping Secondary Vignette */}
            {chapter.secondaryImage && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '-15px',
                  right: '0',
                  width: '36%',
                  aspectRatio: '1',
                  overflow: 'hidden',
                  border: '3px solid #FAF6EE',
                  boxShadow: '0 10px 25px rgba(75, 48, 36, 0.2)'
                }}
                className="d-none d-sm-block"
              >
                <img
                  src={chapter.secondaryImage}
                  alt={`${chapter.title} detail`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            )}
          </div>

          {/* Narrative Content */}
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <div
              style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: '#B88D4A',
                marginBottom: '0.5rem'
              }}
            >
              {chapter.chapter}
            </div>

            <h3
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(1.75rem, 3.2vw, 2.9rem)',
                fontWeight: 400,
                color: '#4B3024',
                lineHeight: 1.2,
                marginBottom: '0.75rem'
              }}
            >
              “{chapter.headline}”
            </h3>

            <p
              style={{
                fontSize: 'clamp(0.92rem, 1.4vw, 1rem)',
                color: '#7A5B4C',
                lineHeight: 1.6,
                marginBottom: '1rem',
                fontWeight: 500
              }}
            >
              {chapter.subtitle}
            </p>

            <p
              style={{
                fontSize: '0.92rem',
                color: '#8F7263',
                lineHeight: 1.75,
                marginBottom: '1.5rem'
              }}
            >
              {chapter.body}
            </p>

            {/* Artisan Highlights Table */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                padding: '1.15rem',
                backgroundColor: '#FFFDF9',
                border: '1px solid rgba(75, 48, 36, 0.1)',
                marginBottom: '1.75rem',
                width: '100%'
              }}
            >
              {chapter.details.map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    justifyContent: 'space-between',
                    fontSize: '0.84rem',
                    gap: '0.75rem',
                    flexWrap: 'wrap',
                    borderBottom: i < chapter.details.length - 1 ? '1px dashed rgba(75, 48, 36, 0.08)' : 'none',
                    paddingBottom: i < chapter.details.length - 1 ? '0.5rem' : '0'
                  }}
                >
                  <span style={{ fontWeight: 600, color: '#4B3024', textTransform: 'uppercase', fontSize: '0.74rem', letterSpacing: '0.08em' }}>
                    {item.label}
                  </span>
                  <span style={{ color: '#6F4E3E', textAlign: 'right' }}>{item.value}</span>
                </div>
              ))}
            </div>

            {/* Chapter Action */}
            <div
              className="nature-action-group"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                flexWrap: 'wrap'
              }}
            >
              <button
                onClick={() => navigateTo('shop')}
                className="btn btn-primary nature-action-btn"
              >
                <span>Shop This Craft</span>
                <ArrowRight size={14} />
              </button>

              <button
                onClick={() => navigateTo('story')}
                className="btn btn-outline nature-action-btn"
              >
                Read Full Manifesto
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 480px) {
          .nature-action-btn {
            width: 100% !important;
          }
        }
      `}</style>
    </section>
  );
};
