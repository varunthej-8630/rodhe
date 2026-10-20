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
          top: '2.5rem',
          left: 0,
          right: 0,
          textAlign: 'center',
          letterSpacing: '0.28em',
          textTransform: 'uppercase',
          fontSize: '0.78rem',
          fontWeight: 600,
          color: '#4B3024',
          opacity: 0.85
        }}
      >
        RODHE • Woven with Trust
      </div>

      {/* Video Container */}
      <div
        style={{
          position: 'relative',
          width: '90%',
          maxWidth: '840px',
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
              padding: '2rem',
              textAlign: 'center'
            }}
          >
            <img
              src="/assets/RODHE Woven Luxury Wordmark.png"
              alt="RODHE — Woven with Trust"
              style={{ maxHeight: '90px', marginBottom: '1rem' }}
            />
            <p style={{ color: '#4B3024', fontSize: '0.9rem', fontStyle: 'italic' }}>
              Woven with Trust • Entering Experience...
            </p>
          </div>
        )}
      </div>

      {/* Controls Bar */}
      <div
        style={{
          position: 'absolute',
          bottom: '3rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1.5rem',
          zIndex: 10
        }}
      >
        <button
          onClick={toggleMute}
          aria-label={isMuted ? 'Unmute video' : 'Mute video'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.6rem 1.1rem',
            backgroundColor: 'rgba(255, 253, 249, 0.8)',
            border: '1px solid rgba(75, 48, 36, 0.2)',
            color: '#4B3024',
            fontSize: '0.75rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
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
            gap: '0.5rem',
            padding: '0.6rem 1.35rem',
            backgroundColor: '#4B3024',
            border: '1px solid #4B3024',
            color: '#FAF6EE',
            fontSize: '0.75rem',
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <span>Enter Store</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};
