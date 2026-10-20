import React, { useRef, useState } from 'react';
import { ArrowRight, Volume2, VolumeX, Play, Pause, ChevronDown } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const HeroSection = () => {
  const { navigateTo } = useShop();
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const scrollToStory = () => {
    const el = document.getElementById('nature-story');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      style={{
        position: 'relative',
        width: '100%',
        minHeight: 'calc(100svh - var(--header-height, 80px) - 30px)',
        height: 'clamp(540px, 88svh, 920px)',
        maxHeight: '940px',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4B3024'
      }}
    >
      {/* Background Video using supplied Herosection-RODHE.mp4 */}
      <video
        ref={videoRef}
        src="/assets/Herosection-RODHE.mp4"
        poster="/assets/Rustic Natural Dye Still Life.png"
        autoPlay
        muted={isMuted}
        loop
        playsInline
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center 28%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1
        }}
      />

      {/* Editorial Scrim Overlay for high-contrast legible luxury text */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(42, 26, 19, 0.48) 0%, rgba(75, 48, 36, 0.28) 45%, rgba(42, 26, 19, 0.78) 100%)',
          zIndex: 2
        }}
      />

      {/* Radial soft spotlight behind headline */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at center, rgba(0,0,0,0) 35%, rgba(42, 26, 19, 0.55) 100%)',
          zIndex: 2
        }}
      />

      {/* Hero Editorial Content */}
      <div
        className="container"
        style={{
          position: 'relative',
          zIndex: 3,
          textAlign: 'center',
          maxWidth: '920px',
          color: '#FAF6EE',
          paddingTop: 'clamp(1.5rem, 4vw, 2.5rem)',
          paddingBottom: 'clamp(2.5rem, 5vw, 3.5rem)'
        }}
      >
        {/* Subtle Brand Hallmark */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontSize: 'clamp(0.68rem, 1.4vw, 0.74rem)',
            fontWeight: 600,
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            color: '#EADAB5',
            marginBottom: '1rem',
            opacity: 0.95
          }}
        >
          <span style={{ display: 'inline-block', width: '20px', height: '1px', backgroundColor: '#B88D4A' }}></span>
          WOVEN WITH TRUST
          <span style={{ display: 'inline-block', width: '20px', height: '1px', backgroundColor: '#B88D4A' }}></span>
        </div>

        {/* Cinematic Headline */}
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(2.1rem, 5.2vw, 5.2rem)',
            fontWeight: 300,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            color: '#FFFFFF',
            textShadow: '0 4px 24px rgba(0, 0, 0, 0.45)',
            marginBottom: '1rem'
          }}
        >
          Born from Nature. <br />
          <span style={{ fontStyle: 'italic', fontWeight: 400, color: '#EADAB5' }}>
            Made to Be Worn.
          </span>
        </h1>

        {/* Supporting Line */}
        <p
          style={{
            fontSize: 'clamp(0.92rem, 1.4vw, 1.2rem)',
            fontWeight: 300,
            lineHeight: 1.6,
            color: 'rgba(250, 246, 238, 0.94)',
            maxWidth: '620px',
            margin: '0 auto clamp(1.5rem, 3.5vw, 2.4rem)',
            textShadow: '0 2px 12px rgba(0, 0, 0, 0.55)'
          }}
        >
          Discover gossamer sarees shaped by rain-fed cotton, botanical pigments, and the timeless touch of Indian generational artisans.
        </p>

        {/* Call to Actions */}
        <div
          className="hero-cta-group"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'clamp(0.75rem, 2vw, 1.25rem)',
            flexWrap: 'wrap'
          }}
        >
          <button
            onClick={() => navigateTo('shop')}
            className="btn btn-gold btn-lg hero-cta-btn"
            style={{
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.3)'
            }}
          >
            <span>Explore Collection</span>
            <ArrowRight size={16} />
          </button>

          <button
            onClick={() => navigateTo('story')}
            className="hero-cta-btn"
            style={{
              padding: 'clamp(0.85rem, 2.5vw, 1.15rem) clamp(1.4rem, 4vw, 2.4rem)',
              fontSize: 'clamp(0.8rem, 1.6vw, 0.88rem)',
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#FFFFFF',
              border: '1px solid rgba(250, 246, 238, 0.45)',
              backgroundColor: 'rgba(42, 26, 19, 0.35)',
              backdropFilter: 'blur(8px)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(250, 246, 238, 0.95)';
              e.currentTarget.style.color = '#4B3024';
              e.currentTarget.style.borderColor = '#FFFFFF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(42, 26, 19, 0.35)';
              e.currentTarget.style.color = '#FFFFFF';
              e.currentTarget.style.borderColor = 'rgba(250, 246, 238, 0.45)';
            }}
          >
            Our Story & Craft
          </button>
        </div>
      </div>

      {/* Floating Media Controls */}
      <div
        className="hero-media-controls"
        style={{
          position: 'absolute',
          bottom: 'clamp(1.2rem, 3vw, 2rem)',
          right: 'clamp(1rem, 3.5vw, 3rem)',
          zIndex: 4,
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem'
        }}
      >
        <button
          onClick={togglePlay}
          aria-label={isPlaying ? 'Pause hero video' : 'Play hero video'}
          style={{
            width: '38px',
            height: '38px',
            minWidth: '38px',
            minHeight: '38px',
            borderRadius: '50%',
            backgroundColor: 'rgba(42, 26, 19, 0.65)',
            border: '1px solid rgba(250, 246, 238, 0.25)',
            color: '#FAF6EE',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(6px)',
            transition: 'background 0.2s',
            touchAction: 'manipulation'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(184, 141, 74, 0.85)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(42, 26, 19, 0.65)')}
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
        </button>

        <button
          onClick={toggleMute}
          aria-label={isMuted ? 'Unmute hero video' : 'Mute hero video'}
          style={{
            width: '38px',
            height: '38px',
            minWidth: '38px',
            minHeight: '38px',
            borderRadius: '50%',
            backgroundColor: 'rgba(42, 26, 19, 0.65)',
            border: '1px solid rgba(250, 246, 238, 0.25)',
            color: '#FAF6EE',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(6px)',
            transition: 'background 0.2s',
            touchAction: 'manipulation'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(184, 141, 74, 0.85)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(42, 26, 19, 0.65)')}
        >
          {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </button>
      </div>

      {/* Discreet Scroll Cue */}
      <button
        onClick={scrollToStory}
        aria-label="Scroll down to nature story"
        className="hero-scroll-cue"
        style={{
          position: 'absolute',
          bottom: 'clamp(1.2rem, 3vw, 2rem)',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.35rem',
          color: 'rgba(250, 246, 238, 0.75)',
          fontSize: '0.68rem',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          transition: 'color 0.2s',
          padding: '0.3rem',
          touchAction: 'manipulation'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#EADAB5')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(250, 246, 238, 0.75)')}
      >
        <span>Discover</span>
        <ChevronDown size={16} className="scroll-bounce" />
      </button>

      {/* Responsive overrides & keyframes */}
      <style>{`
        @keyframes scrollBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(6px); }
        }
        .scroll-bounce {
          animation: scrollBounce 2s infinite ease-in-out;
        }
        @media (max-width: 480px) {
          .hero-cta-btn {
            width: 100% !important;
            max-width: 290px !important;
          }
          .hero-media-controls {
            top: 1rem !important;
            bottom: auto !important;
            right: 1rem !important;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .scroll-bounce {
            animation: none !important;
          }
        }
      `}</style>
    </section>
  );
};
