import React, { useRef, useEffect, useState } from 'react';
import { ArrowRight, ChevronDown, Leaf, MessageCircle } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { storeService } from '../services/storeService';

export const HeroSection = () => {
  const { navigateTo } = useShop();
  const videoRef = useRef(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  const [config, setConfig] = useState({
    heroEyebrow: 'WOVEN WITH TRUST',
    heroHeadline: 'Born from Nature. Made to Be Worn.',
    heroSubtext: 'Discover gossamer sarees shaped by rain-fed cotton, botanical pigments, and the timeless touch of Indian generational artisans.',
  });
  const [settings, setSettings] = useState({
    whatsappNumber: '919490658858'
  });

  // Load backend store configuration and verified metrics
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const cfg = await storeService.getHomepageConfig();
        const stg = await storeService.getSettings();
        if (cfg) setConfig(cfg);
        if (stg) setSettings(stg);
      } catch (err) {
        console.warn('Hero config load error:', err);
      }
    };
    loadConfig();
  }, []);

  // Handle prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mediaQuery.matches);

    const handleMotionChange = (e) => {
      setIsReducedMotion(e.matches);
      if (e.matches && videoRef.current) {
        videoRef.current.pause();
      } else if (videoRef.current) {
        videoRef.current.play().catch(() => { });
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMotionChange);
      return () => mediaQuery.removeEventListener('change', handleMotionChange);
    } else {
      mediaQuery.addListener(handleMotionChange);
      return () => mediaQuery.removeListener(handleMotionChange);
    }
  }, []);

  // Autoplay and muted guarantee across all desktop & mobile browsers
  useEffect(() => {
    const video = videoRef.current;
    if (!video || isReducedMotion) return;

    video.muted = true;
    video.defaultMuted = true;

    const playVideo = () => {
      const promise = video.play();
      if (promise !== undefined) {
        promise.catch((err) => {
          // Handled gracefully (e.g. low-power mode or browser policy)
          console.log('Video autoplay handled gracefully:', err);
        });
      }
    };

    playVideo();
  }, [isReducedMotion]);

  const handleWhatsAppConcierge = () => {
    const rawPhone = settings.whatsappNumber.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(
      `Namaste RODHE Concierge. I am exploring your handcrafted saree collection and would love personal assistance in choosing an heirloom drape.`
    );
    window.open(`https://wa.me/${rawPhone}?text=${message}`, '_blank');
  };

  const scrollToContent = () => {
    const el = document.getElementById('craft-marquee-ribbon') || document.getElementById('shop-by-colour') || document.getElementById('product-grid');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      id="rodhe-hero-section"
      style={{
        position: 'relative',
        width: '100%',
        height: 'clamp(480px, 70vh, 660px)',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1E120D',
        color: '#FAF6EE'
      }}
    >
      {/* Editorial Saree Poster Background (Instant display, zero black screen) */}
      <div
        className="rodhe-hero-poster"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url(/assets/products/saree_muted_gold.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center 30%',
          filter: 'brightness(0.75)',
          zIndex: 0
        }}
      />

      {/* Full-Width Seamless Hero Video (Edge-to-Edge Fit, No Side Pillarboxes/Cropping) */}
      {!isReducedMotion && (
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          poster="/assets/products/saree_muted_gold.jpg"
          className="rodhe-hero-video"
          onLoadedData={() => setIsVideoLoaded(true)}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center 35%',
            zIndex: 1,
            pointerEvents: 'none',
            opacity: isVideoLoaded ? 1 : 0,
            transition: 'opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
          aria-hidden="true"
        >
          <source src="/gemini_generated_video_0e273349.mp4" type="video/mp4" />
          <source src="/assets/gemini_generated_video_0e273349.mp4" type="video/mp4" />
        </video>
      )}

      {/* Subtle, Elegant Multi-Stop Gradient Overlay (High text legibility while honoring saree texture) */}
      <div
        className="rodhe-hero-overlay"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 2,
          pointerEvents: 'none',
          background: `
            linear-gradient(90deg, rgba(30, 18, 13, 0.52) 0%, rgba(30, 18, 13, 0.24) 55%, rgba(30, 18, 13, 0.08) 100%),
            linear-gradient(180deg, rgba(30, 18, 13, 0.44) 0%, rgba(30, 18, 13, 0.16) 24%, transparent 45%),
            linear-gradient(0deg, rgba(30, 18, 13, 0.92) 0%, rgba(30, 18, 13, 0.68) 38%, rgba(30, 18, 13, 0.26) 66%, transparent 85%),
            radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(30, 18, 13, 0.34) 100%)
          `
        }}
      />

      {/* Top-Right Craft Provenance Chips */}
      <div
        className="hero-trust-indicators"
        style={{
          position: 'absolute',
          top: 'clamp(0.85rem, 2.5vw, 1.75rem)',
          right: 'clamp(0.85rem, 3.5vw, 3.5rem)',
          left: 'clamp(0.85rem, 3.5vw, 3.5rem)',
          zIndex: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          flexWrap: 'wrap',
          gap: '0.5rem',
          pointerEvents: 'none'
        }}
      >
        <div
          style={{
            backgroundColor: 'rgba(30, 18, 13, 0.72)',
            border: '1px solid rgba(184, 141, 74, 0.45)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            padding: '0.4rem 0.78rem',
            borderRadius: '2px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: 'clamp(0.68rem, 1.3vw, 0.78rem)',
            color: '#EADAB5'
          }}
        >
          <Leaf size={13} color="#D4AC68" />
          <span>Botanical Dyes &amp; Pure Cotton</span>
        </div>

        <div
          className="hero-secondary-chip"
          style={{
            backgroundColor: 'rgba(30, 18, 13, 0.72)',
            border: '1px solid rgba(184, 141, 74, 0.45)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            padding: '0.4rem 0.78rem',
            borderRadius: '2px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: 'clamp(0.68rem, 1.3vw, 0.78rem)',
            color: '#EADAB5'
          }}
        >
          <MessageCircle size={13} color="#D4AC68" />
          <span>Personal WhatsApp Concierge</span>
        </div>
      </div>

      {/* Main Hero Editorial Typography & CTAs */}
      <div
        className="container hero-main-content"
        style={{
          position: 'relative',
          zIndex: 3,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          paddingTop: 'clamp(4.25rem, 8vw, 5.5rem)',
          paddingBottom: 'clamp(2.5rem, 6.5vw, 5.25rem)',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 'clamp(1.25rem, 3vw, 2rem)' }}>
          {/* Bottom-Left Brand Heading */}
          <div style={{ maxWidth: '640px' }}>
            {/* Hallmark Eyebrow */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.65rem',
                fontSize: 'clamp(0.68rem, 1.4vw, 0.76rem)',
                fontWeight: 600,
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
                color: '#EADAB5',
                marginBottom: '0.85rem'
              }}
            >
              <span style={{ display: 'inline-block', width: '24px', height: '1px', backgroundColor: '#B88D4A' }} />
              {config.heroEyebrow}
              <span style={{ display: 'inline-block', width: '24px', height: '1px', backgroundColor: '#B88D4A' }} />
            </div>

            {/* Headline */}
            <h1
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(2.15rem, 5.4vw, 5rem)',
                fontWeight: 300,
                lineHeight: 1.08,
                letterSpacing: '-0.02em',
                color: '#FFFFFF',
                textShadow: '0 4px 25px rgba(0, 0, 0, 0.7)',
                marginBottom: '1rem'
              }}
            >
              {config.heroHeadline && config.heroHeadline !== 'Born from Nature. Made to Be Worn.' ? (
                config.heroHeadline
              ) : (
                <>
                  Born from Nature. <br />
                  <span style={{ fontStyle: 'italic', fontWeight: 400, color: '#EADAB5' }}>
                    Made to Be Worn.
                  </span>
                </>
              )}
            </h1>

            {/* Supporting Text */}
            <p
              style={{
                fontSize: 'clamp(0.92rem, 1.4vw, 1.15rem)',
                fontWeight: 300,
                lineHeight: 1.6,
                color: 'rgba(250, 246, 238, 0.94)',
                textShadow: '0 2px 14px rgba(0, 0, 0, 0.75)',
                margin: 0
              }}
            >
              {config.heroSubtext}
            </p>
          </div>

          {/* Bottom-Right Primary Calls to Action */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(0.75rem, 1.5vw, 1.25rem)',
              flexWrap: 'wrap'
            }}
          >
            <button
              onClick={() => navigateTo('shop')}
              className="btn btn-gold btn-lg"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.65rem',
                boxShadow: '0 12px 35px rgba(0, 0, 0, 0.5)',
                padding: 'clamp(0.85rem, 2vw, 1.15rem) clamp(1.4rem, 3.5vw, 2.2rem)'
              }}
            >
              <span>Explore Collection</span>
              <ArrowRight size={16} />
            </button>

            <button
              onClick={handleWhatsAppConcierge}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.55rem',
                padding: 'clamp(0.85rem, 2vw, 1.15rem) clamp(1.3rem, 3vw, 1.8rem)',
                fontSize: 'clamp(0.8rem, 1.6vw, 0.88rem)',
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#FAF6EE',
                border: '1px solid rgba(250, 246, 238, 0.4)',
                backgroundColor: 'rgba(30, 18, 13, 0.65)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                cursor: 'pointer',
                borderRadius: '2px',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#525B3A';
                e.currentTarget.style.borderColor = '#7A8856';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(30, 18, 13, 0.65)';
                e.currentTarget.style.borderColor = 'rgba(250, 246, 238, 0.4)';
              }}
            >
              <MessageCircle size={16} color="#D4AC68" />
              <span>WhatsApp Concierge</span>
            </button>
          </div>
        </div>
      </div>

      {/* Discreet Scroll Cue to Store Content */}
      <button
        type="button"
        onClick={scrollToContent}
        className="hero-scroll-cue"
        aria-label="Scroll down to explore handcrafted sarees"
        style={{
          position: 'absolute',
          bottom: '1.1rem',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.25rem',
          color: 'rgba(234, 218, 181, 0.85)',
          fontSize: '0.66rem',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          background: 'none',
          border: 'none',
          cursor: 'pointer'
        }}
      >
        <span>Explore Drapes</span>
        <ChevronDown size={14} className="hero-scroll-bounce" />
      </button>

      {/* Responsive adjustments for video positioning and mobile viewports */}
      <style>{`
        @media (max-width: 768px) {
          .rodhe-hero-video {
            object-fit: cover !important;
            object-position: center 30% !important;
          }
          #rodhe-hero-section {
            height: auto !important;
            min-height: 460px !important;
          }
          .hero-trust-indicators {
            justify-content: flex-start !important;
          }
          .hero-secondary-chip {
            display: none !important;
          }
          .hero-scroll-cue {
            display: none !important;
          }
        }
        @media (min-width: 769px) and (max-width: 1024px) {
          .rodhe-hero-video {
            object-fit: cover !important;
            object-position: center 35% !important;
          }
        }
      `}</style>
    </section>
  );
};

export default HeroSection;
