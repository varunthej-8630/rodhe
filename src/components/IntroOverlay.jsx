import React, { useRef, useState, useEffect } from 'react';
import { Volume2, VolumeX, ArrowRight } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const IntroOverlay = () => {
  const { hasIntroPlayed, setHasIntroPlayed } = useShop();
  const videoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [videoError, setVideoError] = useState(false);

  // If already played in this session, don't show
  if (hasIntroPlayed) {
    return null;
  }

  const handleComplete = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      setHasIntroPlayed(true);
    }, 700);
  };

  const handleVideoEnded = () => {
    // Settle for 0.8s on the resolved logo frame before transitioning
    setTimeout(() => {
      handleComplete();
    }, 800);
  };

  const handleSkip = () => {
    handleComplete();
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: '#EADAB5',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: isFadingOut ? 0 : 1,
        transition: 'opacity 0.7s cubic-bezier(0.19, 1, 0.22, 1)',
        pointerEvents: isFadingOut ? 'none' : 'auto',
        overflow: 'hidden'
      }}
    >
      {/* Brand Subtitle Top Bar */}
      <div
        style={{
          position: 'absolute',
          top: 'calc(1.5rem + env(safe-area-inset-top, 0px))',
          left: 0,
          right: 0,
          textAlign: 'center',
          letterSpacing: '0.24em',
          textTransform: 'uppercase',
          fontSize: '0.74rem',
          fontWeight: 600,
          color: '#4B3024',
          opacity: 0.85,
          padding: '0 1rem'
        }}
      >
        RODHE • Woven with Trust
      </div>

      {/* Video Container */}
      <div
        style={{
          position: 'relative',
          width: 'min(92%, 840px)',
          aspectRatio: '16 / 9',
          borderRadius: '4px',
          overflow: 'hidden',
          boxShadow: '0 24px 60px -15px rgba(75, 48, 36, 0.25)',
          backgroundColor: '#EADAB5'
        }}
      >
        <video
          ref={videoRef}
          src="/assets/Intro-Rodhe.mp4"
          autoPlay
          muted={isMuted}
          playsInline
          onEnded={handleVideoEnded}
          onError={() => {
            setVideoError(true);
            setTimeout(handleComplete, 1200);
          }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            backgroundColor: '#EADAB5'
          }}
        />

        {/* Video Fallback in case playback blocked */}
        {videoError && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#EADAB5',
              padding: '1.5rem',
              textAlign: 'center'
            }}
          >
            <img
              src="/assets/RODHE Woven Luxury Wordmark.png"
              alt="RODHE — Woven with Trust"
              style={{ maxHeight: '70px', maxWidth: '80%', objectFit: 'contain', marginBottom: '1rem' }}
            />
            <p style={{ color: '#4B3024', fontSize: '0.88rem', fontStyle: 'italic', margin: 0 }}>
              Woven with Trust • Entering Experience...
            </p>
          </div>
        )}
      </div>

      {/* Controls Bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 'calc(1.75rem + env(safe-area-inset-bottom, 0px))',
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(0.65rem, 3vw, 1.25rem)',
          zIndex: 10,
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}
      >
        <button
          onClick={toggleMute}
          aria-label={isMuted ? 'Unmute video' : 'Mute video'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.65rem 1rem',
            backgroundColor: 'rgba(255, 253, 249, 0.85)',
            border: '1px solid rgba(75, 48, 36, 0.2)',
            color: '#4B3024',
            fontSize: '0.74rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            minHeight: '40px'
          }}
        >
          {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          <span>{isMuted ? 'Sound Off' : 'Sound On'}</span>
        </button>

        <button
          onClick={handleSkip}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.65rem 1.25rem',
            backgroundColor: '#4B3024',
            border: '1px solid #4B3024',
            color: '#FAF6EE',
            fontSize: '0.74rem',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            minHeight: '40px'
          }}
        >
          <span>Enter Store</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};
