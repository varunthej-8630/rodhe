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
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'clamp(0.5rem, 2vw, 2.5rem)',
            marginBottom: 'clamp(2.5rem, 4vw, 4rem)',
            flexWrap: 'wrap',
            borderBottom: '1px solid rgba(75, 48, 36, 0.12)',
            paddingBottom: '1.25rem'
          }}
        >
          {STORY_CHAPTERS.map((chap, idx) => (
            <button
              key={chap.number}
              onClick={() => setActiveChapterIndex(idx)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                padding: '0.6rem 1.25rem',
                fontSize: '0.82rem',
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: activeChapterIndex === idx ? '#4B3024' : '#8F7263',
                backgroundColor: activeChapterIndex === idx ? 'rgba(234, 218, 181, 0.5)' : 'transparent',
                borderBottom: activeChapterIndex === idx ? '2px solid #B88D4A' : '2px solid transparent',
                transition: 'all 0.3s ease'
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1rem',
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
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 'clamp(2rem, 5vw, 4.5rem)',
            alignItems: 'center'
          }}
        >
          {/* Visual Showcase (Authentic assets) */}
          <div style={{ position: 'relative' }}>
            <div
              style={{
                position: 'relative',
                aspectRatio: '4 / 3',
                overflow: 'hidden',
                boxShadow: '0 16px 40px -10px rgba(75, 48, 36, 0.15)',
                border: '1px solid rgba(184, 141, 74, 0.3)'
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
                  bottom: '1rem',
                  left: '1rem',
                  padding: '0.4rem 0.85rem',
                  backgroundColor: 'rgba(250, 246, 238, 0.92)',
                  backdropFilter: 'blur(6px)',
                  fontSize: '0.7rem',
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
                  bottom: '-20px',
                  right: '-15px',
                  width: '38%',
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
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: '#B88D4A',
                marginBottom: '0.65rem'
              }}
            >
              {chapter.chapter}
            </div>

            <h3
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(2rem, 3.2vw, 2.9rem)',
                fontWeight: 400,
                color: '#4B3024',
                lineHeight: 1.2,
                marginBottom: '0.85rem'
              }}
            >
              “{chapter.headline}”
            </h3>

            <p
              style={{
                fontSize: '1rem',
                color: '#7A5B4C',
                lineHeight: 1.6,
                marginBottom: '1.25rem',
                fontWeight: 500
              }}
            >
              {chapter.subtitle}
            </p>

            <p
              style={{
                fontSize: '0.94rem',
                color: '#8F7263',
                lineHeight: 1.8,
                marginBottom: '1.8rem'
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
                padding: '1.25rem',
                backgroundColor: '#FFFDF9',
                border: '1px solid rgba(75, 48, 36, 0.1)',
                marginBottom: '2rem'
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
                    gap: '1rem',
                    borderBottom: i < chapter.details.length - 1 ? '1px dashed rgba(75, 48, 36, 0.08)' : 'none',
                    paddingBottom: i < chapter.details.length - 1 ? '0.5rem' : '0'
                  }}
                >
                  <span style={{ fontWeight: 600, color: '#4B3024', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.08em' }}>
                    {item.label}
                  </span>
                  <span style={{ color: '#6F4E3E', textAlign: 'right' }}>{item.value}</span>
                </div>
              ))}
            </div>

            {/* Chapter Action */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <button
                onClick={() => navigateTo('shop')}
                className="btn btn-primary"
              >
                <span>Shop This Craft</span>
                <ArrowRight size={14} />
              </button>

              <button
                onClick={() => navigateTo('story')}
                className="btn btn-outline"
              >
                Read Full Manifesto
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
