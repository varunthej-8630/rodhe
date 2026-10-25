import React, { useState, useEffect, useRef } from 'react';
import { Star, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { TESTIMONIALS } from '../data/storyData';
import { storeService } from '../services/storeService';

export const CustomerReviewsSection = () => {
  const [reviews, setReviews] = useState(TESTIMONIALS);
  const [startIndex, setStartIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    const loadReviews = async () => {
      const data = await storeService.getTestimonials();
      if (data && data.length > 0) {
        setReviews(data);
      }
    };
    loadReviews();
  }, []);

  const total = reviews.length;

  const nextSlide = () => {
    if (total === 0) return;
    setStartIndex((prev) => (prev + 1) % total);
  };

  const prevSlide = () => {
    if (total === 0) return;
    setStartIndex((prev) => (prev - 1 + total) % total);
  };

  // Optional gentle auto-advance, pauses on hover
  useEffect(() => {
    if (isPaused || total <= 1) return;
    timerRef.current = setInterval(() => {
      nextSlide();
    }, 6500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, startIndex, total]);

  // Compute up to 3 visible cards starting from startIndex (cyclic)
  const visibleCards = [];
  const countToShow = Math.min(3, total);
  for (let i = 0; i < countToShow; i++) {
    const idx = (startIndex + i) % total;
    visibleCards.push({ ...reviews[idx], originalIndex: idx });
  }

  return (
    <section
      id="patron-stories"
      className="section-padding"
      style={{
        backgroundColor: '#FAF6EE',
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        {/* Section Header */}
        <div className="section-header" style={{ marginBottom: 'clamp(2rem, 4vw, 3rem)' }}>
          <div className="eyebrow">Patron Experiences</div>
          <h2 className="section-title">Woven into Everyday Lives</h2>
          <p className="section-subtitle">
            Reflections from art curators, architects, and saree collectors who drape RODHE across the world.
          </p>
        </div>

        {/* Carousel Container with Prominently Visible Left/Right Navigation Arrows */}
        <div
          className="customer-reviews-container"
          style={{
            position: 'relative',
            maxWidth: '1160px',
            margin: '0 auto',
            padding: '0 clamp(1rem, 4vw, 3.5rem)'
          }}
        >
          {/* Prominent Left Arrow Button */}
          <button
            onClick={prevSlide}
            aria-label="Previous review"
            className="review-arrow-btn prev"
            style={{
              position: 'absolute',
              left: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              backgroundColor: '#FFFDF9',
              border: '1.5px solid #B88D4A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#4B3024',
              cursor: 'pointer',
              transition: 'all 0.25s ease',
              boxShadow: '0 6px 18px rgba(75, 48, 36, 0.12)'
            }}
          >
            <ChevronLeft size={22} />
          </button>

          {/* Small Clear Cards Grid */}
          <div className="reviews-small-grid">
            {visibleCards.map((t, index) => (
              <div
                key={`${t.id}-${startIndex}-${index}`}
                className="review-small-card"
              >
                {/* Rating & Verified Badge */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                  <div style={{ display: 'flex', gap: '0.2rem' }}>
                    {[...Array(t.rating || 5)].map((_, i) => (
                      <Star key={i} size={14} fill="#B88D4A" color="#B88D4A" />
                    ))}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      fontSize: '0.68rem',
                      color: '#B88D4A',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em'
                    }}
                  >
                    <CheckCircle2 size={12} color="#525B3A" />
                    <span>Verified</span>
                  </div>
                </div>

                {/* Review Quote Text */}
                <p
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: 'clamp(0.92rem, 1.4vw, 1.02rem)',
                    lineHeight: 1.55,
                    color: '#4B3024',
                    fontStyle: 'italic',
                    marginBottom: '1rem',
                    flexGrow: 1
                  }}
                >
                  “{t.review}”
                </p>

                {/* Draped Saree Name */}
                {t.saree && (
                  <div
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: '#B88D4A',
                      marginBottom: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <span style={{ opacity: 0.85 }}>Draped:</span>
                    <span style={{ color: '#4B3024', fontWeight: 600 }}>{t.saree}</span>
                  </div>
                )}

                {/* Patron Signature */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderTop: '1px solid rgba(75, 48, 36, 0.08)',
                    paddingTop: '0.75rem',
                    marginTop: 'auto'
                  }}
                >
                  <div>
                    <h4 style={{ fontSize: '0.88rem', fontWeight: 600, color: '#4B3024', margin: 0 }}>
                      {t.name}
                    </h4>
                    <span style={{ fontSize: '0.74rem', color: '#8F7263' }}>
                      {t.role} • {t.location}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#8F7263', letterSpacing: '0.04em' }}>
                    {t.date || 'October 2026'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Prominent Right Arrow Button */}
          <button
            onClick={nextSlide}
            aria-label="Next review"
            className="review-arrow-btn next"
            style={{
              position: 'absolute',
              right: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              backgroundColor: '#FFFDF9',
              border: '1.5px solid #B88D4A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#4B3024',
              cursor: 'pointer',
              transition: 'all 0.25s ease',
              boxShadow: '0 6px 18px rgba(75, 48, 36, 0.12)'
            }}
          >
            <ChevronRight size={22} />
          </button>
        </div>

        {/* Clear Bottom Navigation Controls */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1.5rem',
            marginTop: '2.25rem'
          }}
        >
          <button
            onClick={prevSlide}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#4B3024',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.4rem 0.6rem',
              borderRadius: '2px'
            }}
          >
            <ChevronLeft size={16} />
            <span>Prev</span>
          </button>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {reviews.map((_, i) => (
              <button
                key={i}
                onClick={() => setStartIndex(i)}
                aria-label={`Go to review ${i + 1}`}
                style={{
                  width: startIndex === i ? '24px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  backgroundColor: startIndex === i ? '#B88D4A' : 'rgba(75, 48, 36, 0.22)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              />
            ))}
          </div>

          <button
            onClick={nextSlide}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#4B3024',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.4rem 0.6rem',
              borderRadius: '2px'
            }}
          >
            <span>Next</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
};
