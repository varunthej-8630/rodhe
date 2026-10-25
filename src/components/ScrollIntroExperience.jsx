import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { Volume2, VolumeX, ArrowRight } from 'lucide-react';

// ============================================================================
// LUXURY WEB AUDIO DESIGN SYSTEM
// Procedural, zero-dependency, ultra-luxury sound design for RODHE
// ============================================================================
class LuxuryAudioSystem {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.masterGain = null;
    this.hasInitialized = false;
  }

  init() {
    if (this.hasInitialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.8, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
      this.hasInitialized = true;
    } catch (e) {
      console.warn('Web Audio initialization bypassed', e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  setMuted(muted) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.8, this.ctx.currentTime, 0.04);
    }
  }

  // 1. Subtle warm opening ambient drone (C-major luxury chord)
  playAtmosphericChord() {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;
    const notes = [130.81, 196.00, 261.63, 392.00]; // C3, G3, C4, G4
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.05 / (i + 1), now + 1.2);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.8);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 5.0);
    });
  }

  // 2. Soft airy silk whoosh as clouds drift across
  playSilkWhoosh() {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 2.2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.4;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(380, now);
    filter.frequency.exponentialRampToValueAtTime(950, now + 1.0);
    filter.frequency.exponentialRampToValueAtTime(320, now + 2.0);
    filter.Q.setValueAtTime(2.5, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.065, now + 0.7);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.1);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(now);
    noise.stop(now + 2.2);
  }

  // 3. Delicate crystal chime during logo transformation
  playLogoChime() {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;
    const notes = [587.33, 880.00, 1174.66, 1760.00]; // D5, A5, D6, A6 harmonics
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);

      gain.gain.setValueAtTime(0.0001, now + idx * 0.06);
      gain.gain.linearRampToValueAtTime(0.038, now + idx * 0.06 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.06 + 1.5);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 1.6);
    });
  }

  // 4. Gentle tonal rise as emblem travels UPWARDS to header
  playTonalRise() {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(440, now + 1.4);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(650, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.04, now + 0.5);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 1.7);
  }

  // 5. Light atmospheric sweep during final boutique reveal
  playRevealSweep() {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(329.63, now); // E4
    osc.frequency.exponentialRampToValueAtTime(523.25, now + 1.1); // C5

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.03, now + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 1.9);
  }
}

// Global audio instance
const luxuryAudio = new LuxuryAudioSystem();

export const ScrollIntroExperience = ({ onComplete }) => {
  const stageRef = useRef(null);
  const primaryLogoRef = useRef(null);
  const secondaryEmblemRef = useRef(null);
  const cloudLeftRef = useRef(null);
  const cloudRightRef = useRef(null);
  const cloudCenterRef = useRef(null);
  const curtainLeftRef = useRef(null);
  const curtainRightRef = useRef(null);
  const scrollPromptRef = useRef(null);
  const auraGlowRef = useRef(null);
  const skipBtnRef = useRef(null);

  const [isIntroFinished, setIsIntroFinished] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const hasTriggeredRef = useRef(false);
  const timelineRef = useRef(null);

  // Measure exact responsive header logo coordinates
  const calculateHeaderTarget = () => {
    const headerLogo = document.getElementById('header-brand-logo');
    if (!headerLogo) {
      return {
        x: window.innerWidth / 2,
        y: 76,
        targetHeight: 46
      };
    }

    const rect = headerLogo.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      // Target is strictly at the top of the viewport (top of page)
      y: Math.max(30, Math.min(rect.top + rect.height / 2, 120)),
      targetHeight: rect.height || 46
    };
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    luxuryAudio.setMuted(nextMuted);
  };

  const completeIntroImmediately = () => {
    if (timelineRef.current) {
      timelineRef.current.kill();
    }
    // Restore normal scrolling
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';

    const headerLogo = document.getElementById('header-brand-logo');
    if (headerLogo) {
      headerLogo.style.opacity = '1';
    }

    setIsIntroFinished(true);
    if (onComplete) onComplete();
  };

  useEffect(() => {
    // Check for reduced-motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      completeIntroImmediately();
      return;
    }

    // 1. ELIMINATE THE WHITE LINE AT SOURCE:
    // Lock document & body overflow during intro to prevent any scrollbar gutter
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    // Ensure page is at scroll 0
    window.scrollTo(0, 0);

    const stageEl = stageRef.current;
    const primaryEl = primaryLogoRef.current;
    const emblemEl = secondaryEmblemRef.current;
    const cloudLeftEl = cloudLeftRef.current;
    const cloudRightEl = cloudRightRef.current;
    const cloudCenterEl = cloudCenterRef.current;
    const curtainLeftEl = curtainLeftRef.current;
    const curtainRightEl = curtainRightRef.current;
    const scrollPromptEl = scrollPromptRef.current;
    const auraGlowEl = auraGlowRef.current;
    const skipBtnEl = skipBtnRef.current;

    if (!stageEl || !primaryEl || !emblemEl) return;

    // Viewport center coordinates
    const initialCenterX = window.innerWidth / 2;
    const initialCenterY = window.innerHeight / 2;

    // Initial setup: Clean solid black background, primary wordmark centered, no clouds
    gsap.set(stageEl, {
      opacity: 1,
      visibility: 'visible',
      backgroundColor: '#000000'
    });

    gsap.set(primaryEl, {
      xPercent: -50,
      yPercent: -50,
      left: initialCenterX,
      top: initialCenterY,
      opacity: 1,
      scale: 1,
      filter: 'drop-shadow(0 15px 35px rgba(0,0,0,0.9))'
    });

    gsap.set(emblemEl, {
      xPercent: -50,
      yPercent: -50,
      left: initialCenterX,
      top: initialCenterY,
      opacity: 0,
      scale: 0.94,
      filter: 'drop-shadow(0 20px 45px rgba(0,0,0,0.95))'
    });

    gsap.set(auraGlowEl, {
      xPercent: -50,
      yPercent: -50,
      left: initialCenterX,
      top: initialCenterY,
      opacity: 0,
      scale: 0.8
    });

    // Cloud layers: initially completely invisible & offscreen (no clouds at Stage 1)
    gsap.set(cloudLeftEl, {
      xPercent: -45,
      yPercent: 0,
      opacity: 0,
      scale: 0.96
    });

    gsap.set(cloudRightEl, {
      xPercent: 45,
      yPercent: 0,
      opacity: 0,
      scale: 0.96
    });

    gsap.set(cloudCenterEl, {
      opacity: 0,
      scale: 0.95
    });

    // Curtains closed initially (full black coverage)
    gsap.set(curtainLeftEl, { xPercent: 0 });
    gsap.set(curtainRightEl, { xPercent: 0 });

    // Permanent header logo hidden during intro sequence
    const headerLogo = document.getElementById('header-brand-logo');
    if (headerLogo) {
      headerLogo.style.opacity = '0';
      headerLogo.style.transition = 'opacity 0.25s ease';
    }

    // 2. COORDINATED MASTER GSAP TIMELINE (4.8 seconds total duration)
    const tl = gsap.timeline({
      paused: true,
      defaults: { ease: 'power2.inOut' },
      onComplete: () => {
        // Restore normal website scrolling
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';

        // Permanent header logo is fully visible
        if (headerLogo) {
          headerLogo.style.opacity = '1';
        }

        setIsIntroFinished(true);
        if (onComplete) onComplete();
      }
    });
    timelineRef.current = tl;

    // -------------------------------------------------------------------------
    // MASTER TIMELINE CHOREOGRAPHY
    // -------------------------------------------------------------------------

    // 0.0s – 0.4s: Prompt fades out on user trigger
    tl.to(scrollPromptEl, {
      opacity: 0,
      y: 16,
      duration: 0.35,
      ease: 'power1.out'
    }, 0.0);

    // 0.4s – 1.6s: Atmospheric ivory & champagne-gold clouds drift in from left and right
    tl.call(() => {
      luxuryAudio.playSilkWhoosh();
    }, null, 0.45);

    tl.to(cloudLeftEl, {
      xPercent: -6,
      yPercent: -2,
      opacity: 0.92,
      scale: 1.02,
      duration: 1.3,
      ease: 'power2.out'
    }, 0.4);

    tl.to(cloudRightEl, {
      xPercent: 6,
      yPercent: 2,
      opacity: 0.92,
      scale: 1.02,
      duration: 1.3,
      ease: 'power2.out'
    }, 0.4);

    tl.to(cloudCenterEl, {
      opacity: 0.70,
      scale: 1.05,
      duration: 1.2,
      ease: 'power1.out'
    }, 0.5);

    // 1.4s – 2.4s: Wordmark transitions into Standalone R Emblem
    // Letters "O D H E" and tagline dissolve into the mist
    tl.call(() => {
      luxuryAudio.playLogoChime();
    }, null, 1.4);

    tl.to(primaryEl, {
      x: '10%',
      opacity: 0,
      scale: 0.98,
      duration: 0.9,
      ease: 'power2.inOut'
    }, 1.35);

    // Secondary standalone R emblem emerges radiantly
    tl.to(emblemEl, {
      opacity: 1,
      scale: 1,
      duration: 0.95,
      ease: 'power2.inOut'
    }, 1.55);

    // Golden silk aura glow behind the emblem
    tl.to(auraGlowEl, {
      opacity: 0.85,
      scale: 1.15,
      duration: 0.85,
      ease: 'power1.out'
    }, 1.6);

    // 2.3s – 3.8s: Secondary Emblem travels UPWARDS to Header
    tl.call(() => {
      luxuryAudio.playTonalRise();
    }, null, 2.3);

    tl.to(emblemEl, {
      left: () => calculateHeaderTarget().x,
      // Target is strictly at the top of the screen
      top: () => calculateHeaderTarget().y,
      // Scale down precisely to the header logo's rendered height
      scale: () => {
        const t = calculateHeaderTarget();
        const initialH = emblemEl.offsetHeight || (window.innerWidth < 768 ? 180 : 220);
        return t.targetHeight / initialH;
      },
      duration: 1.5,
      ease: 'power2.inOut'
    }, 2.3);

    tl.to(auraGlowEl, {
      left: () => calculateHeaderTarget().x,
      top: () => calculateHeaderTarget().y,
      scale: 0.35,
      opacity: 0,
      duration: 1.3,
      ease: 'power2.inOut'
    }, 2.3);

    // 2.8s – 4.3s: Clouds Separate Horizontally & Black Veil Opens
    tl.call(() => {
      luxuryAudio.playRevealSweep();
    }, null, 2.8);

    // Left clouds sweep far left
    tl.to(cloudLeftEl, {
      xPercent: -135,
      opacity: 0,
      duration: 1.5,
      ease: 'power2.inOut'
    }, 2.8);

    // Right clouds sweep far right
    tl.to(cloudRightEl, {
      xPercent: 135,
      opacity: 0,
      duration: 1.5,
      ease: 'power2.inOut'
    }, 2.8);

    // Center mist disperses
    tl.to(cloudCenterEl, {
      scale: 1.35,
      opacity: 0,
      duration: 1.2,
      ease: 'power2.in'
    }, 2.9);

    // Black curtains part horizontally to reveal the real website
    tl.to(curtainLeftEl, {
      xPercent: -105,
      duration: 1.45,
      ease: 'power2.inOut'
    }, 2.85);

    tl.to(curtainRightEl, {
      xPercent: 105,
      duration: 1.45,
      ease: 'power2.inOut'
    }, 2.85);

    // 4.1s – 4.7s: Settle into Header & Seamless Handoff
    // Reveal permanent header logo in navbar
    tl.to(headerLogo, {
      opacity: 1,
      duration: 0.35,
      ease: 'power1.out'
    }, 4.1);

    // Fade out moving emblem
    tl.to(emblemEl, {
      opacity: 0,
      duration: 0.35,
      ease: 'power1.in'
    }, 4.25);

    // Fade out skip and sound buttons
    tl.to([skipBtnEl, '#rodhe-sound-btn'], {
      opacity: 0,
      pointerEvents: 'none',
      duration: 0.3
    }, 4.0);

    // Complete intro stage fadeout
    tl.to(stageEl, {
      opacity: 0,
      duration: 0.45,
      ease: 'none'
    }, 4.35);

    // 3. SINGLE-TRIGGER INTERACTION HANDLERS
    const initiateExperience = () => {
      if (hasTriggeredRef.current) return;
      hasTriggeredRef.current = true;

      // Initialize luxury sound design
      luxuryAudio.init();
      luxuryAudio.playAtmosphericChord();

      // Play master cinematic timeline
      tl.play();
    };

    // Wheel event (single scroll down/up)
    const handleWheel = (e) => {
      if (Math.abs(e.deltaY) > 2 || Math.abs(e.deltaX) > 2) {
        initiateExperience();
      }
    };

    // Touch event for mobile/tablet
    let touchStartY = 0;
    const handleTouchStart = (e) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
      const touchY = e.touches[0].clientY;
      if (Math.abs(touchStartY - touchY) > 6) {
        initiateExperience();
      }
    };

    // Keyboard support (Space, ArrowDown, PageDown)
    const handleKeyDown = (e) => {
      if (['ArrowDown', 'ArrowUp', 'Space', 'PageDown', 'PageUp'].includes(e.code)) {
        initiateExperience();
      }
    };

    // Tap/Click support for mobile & tablet screens
    const handleTapOrClick = (e) => {
      if (e.target && (e.target.closest('#rodhe-skip-btn') || e.target.closest('#rodhe-sound-btn'))) {
        return;
      }
      initiateExperience();
    };

    // Responsive pre-trigger resize handler: maintains exact centering if window resizes before activation
    const handlePreTriggerResize = () => {
      if (hasTriggeredRef.current) return;
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      gsap.set([primaryEl, emblemEl, auraGlowEl], {
        left: cx,
        top: cy
      });
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('click', handleTapOrClick, { passive: true });
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handlePreTriggerResize, { passive: true });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('click', handleTapOrClick);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handlePreTriggerResize);
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      tl.kill();
    };
  }, [onComplete]);

  // Don't render intro once completed
  if (isIntroFinished) {
    return null;
  }

  return (
    <aside
      ref={stageRef}
      id="rodhe-intro-stage"
      aria-label="Brand Introduction Animation"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 9999,
        overflow: 'hidden',
        backgroundColor: '#000000',
        margin: 0,
        padding: 0,
        boxSizing: 'border-box'
      }}
    >
      {/* Left Solid Black Veil Curtain Panel (51% width ensures zero center seam) */}
      <div
        ref={curtainLeftRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '51%',
          height: '100%',
          backgroundColor: '#000000',
          zIndex: 1,
          transformOrigin: 'left center',
          willChange: 'transform'
        }}
      />

      {/* Right Solid Black Veil Curtain Panel (51% width ensures zero center seam) */}
      <div
        ref={curtainRightRef}
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '51%',
          height: '100%',
          backgroundColor: '#000000',
          zIndex: 1,
          transformOrigin: 'right center',
          willChange: 'transform'
        }}
      />

      {/* Center Atmospheric Golden Silk Mist Aura */}
      <div
        ref={auraGlowRef}
        style={{
          position: 'absolute',
          width: 'clamp(320px, 45vw, 600px)',
          height: 'clamp(320px, 45vw, 600px)',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212, 172, 104, 0.40) 0%, rgba(201, 130, 120, 0.20) 40%, rgba(0, 0, 0, 0) 70%)',
          pointerEvents: 'none',
          zIndex: 2,
          willChange: 'transform, opacity'
        }}
      />

      {/* Atmospheric Cumulus Mist (Layer 1: Center) */}
      <img
        ref={cloudCenterRef}
        src="/assets/cloud_layer_center.jpg"
        alt=""
        role="presentation"
        style={{
          position: 'absolute',
          left: '5%',
          top: '10%',
          width: '90%',
          height: '80%',
          objectFit: 'cover',
          mixBlendMode: 'screen',
          pointerEvents: 'none',
          zIndex: 3,
          filter: 'contrast(1.1) brightness(0.95)',
          maskImage: 'radial-gradient(ellipse 65% 55% at 50% 50%, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse 65% 55% at 50% 50%, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 75%)',
          willChange: 'transform, opacity'
        }}
      />

      {/* Left Billowing Silk Cloud Layer with Feathered Contours (Layer 2) */}
      <img
        ref={cloudLeftRef}
        src="/assets/cloud_layer_left.jpg"
        alt=""
        role="presentation"
        style={{
          position: 'absolute',
          left: '-15%',
          top: '-15%',
          width: '95%',
          height: '130%',
          objectFit: 'cover',
          mixBlendMode: 'screen',
          pointerEvents: 'none',
          zIndex: 4,
          filter: 'contrast(1.15) brightness(1.05)',
          maskImage: 'radial-gradient(ellipse 65% 55% at 50% 50%, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 76%)',
          WebkitMaskImage: 'radial-gradient(ellipse 65% 55% at 50% 50%, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 76%)',
          willChange: 'transform, opacity'
        }}
      />

      {/* Right Billowing Silk Cloud Layer with Feathered Contours (Layer 3) */}
      <img
        ref={cloudRightRef}
        src="/assets/cloud_layer_right.jpg"
        alt=""
        role="presentation"
        style={{
          position: 'absolute',
          right: '-15%',
          top: '-15%',
          width: '95%',
          height: '130%',
          objectFit: 'cover',
          mixBlendMode: 'screen',
          pointerEvents: 'none',
          zIndex: 4,
          filter: 'contrast(1.15) brightness(1.05)',
          maskImage: 'radial-gradient(ellipse 65% 55% at 50% 50%, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 76%)',
          WebkitMaskImage: 'radial-gradient(ellipse 65% 55% at 50% 50%, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 76%)',
          willChange: 'transform, opacity'
        }}
      />

      {/* Primary RODHE Horizontal Wordmark (Stage 1) */}
      <div
        ref={primaryLogoRef}
        style={{
          position: 'absolute',
          zIndex: 7,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 'min(86vw, 880px)',
          pointerEvents: 'none',
          willChange: 'transform, opacity'
        }}
      >
        <img
          src="/assets/RODHE_Primary_Horizontal.png"
          alt="RODHE — Woven with Trust"
          style={{
            width: '100%',
            height: 'auto',
            maxHeight: '45vh',
            objectFit: 'contain',
            display: 'block'
          }}
        />
      </div>

      {/* Secondary Standalone R Emblem (Stage 4 & 5) */}
      <div
        ref={secondaryEmblemRef}
        style={{
          position: 'absolute',
          zIndex: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          willChange: 'transform, opacity, left, top',
          transformOrigin: 'center center'
        }}
      >
        <img
          src="/assets/RODHE_Secondary_Emblem.png"
          alt="RODHE Standalone Emblem"
          style={{
            height: 'clamp(180px, 28vh, 260px)',
            width: 'auto',
            objectFit: 'contain',
            display: 'block'
          }}
        />
      </div>

      {/* Refined Initial Scroll Prompt (Fades out immediately on single scroll) */}
      <div
        ref={scrollPromptRef}
        style={{
          position: 'absolute',
          bottom: 'calc(2.5rem + env(safe-area-inset-bottom, 0px))',
          left: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.6rem',
          color: 'rgba(234, 218, 181, 0.75)',
          zIndex: 10,
          pointerEvents: 'none',
          textAlign: 'center',
          textTransform: 'uppercase',
          letterSpacing: '0.22em',
          fontSize: '0.68rem',
          fontWeight: 500
        }}
      >
        <span>Scroll or Tap to Enter the World of RODHE</span>
        <div
          style={{
            width: '1px',
            height: '32px',
            backgroundColor: 'rgba(184, 141, 74, 0.6)',
            animation: 'pulse 2s infinite ease-in-out'
          }}
        />
      </div>

      {/* Controls Container: Sound Toggle & Skip Button */}
      <div
        style={{
          position: 'absolute',
          bottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))',
          right: 'calc(1.5rem + env(safe-area-inset-right, 0px))',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          zIndex: 20
        }}
      >
        {/* Sound Toggle Button */}
        <button
          id="rodhe-sound-btn"
          onClick={toggleMute}
          aria-label={isMuted ? 'Unmute luxury sound' : 'Mute luxury sound'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.55rem 0.8rem',
            backgroundColor: 'rgba(25, 17, 13, 0.65)',
            border: '1px solid rgba(184, 141, 74, 0.35)',
            backdropFilter: 'blur(8px)',
            color: '#EADAB5',
            fontSize: '0.68rem',
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            fontWeight: 600,
            cursor: 'pointer',
            borderRadius: '2px',
            transition: 'all 0.25s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(75, 48, 36, 0.9)';
            e.currentTarget.style.borderColor = '#B88D4A';
            e.currentTarget.style.color = '#FAF6EE';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(25, 17, 13, 0.65)';
            e.currentTarget.style.borderColor = 'rgba(184, 141, 74, 0.35)';
            e.currentTarget.style.color = '#EADAB5';
          }}
        >
          {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
          <span>{isMuted ? 'Muted' : 'Sound'}</span>
        </button>

        {/* Accessible Skip Button */}
        <button
          ref={skipBtnRef}
          id="rodhe-skip-btn"
          onClick={completeIntroImmediately}
          aria-label="Skip introduction and proceed directly to boutique"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.55rem 1rem',
            backgroundColor: 'rgba(25, 17, 13, 0.65)',
            border: '1px solid rgba(184, 141, 74, 0.35)',
            backdropFilter: 'blur(8px)',
            color: '#EADAB5',
            fontSize: '0.68rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            fontWeight: 600,
            cursor: 'pointer',
            borderRadius: '2px',
            transition: 'all 0.25s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(75, 48, 36, 0.9)';
            e.currentTarget.style.borderColor = '#B88D4A';
            e.currentTarget.style.color = '#FAF6EE';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(25, 17, 13, 0.65)';
            e.currentTarget.style.borderColor = 'rgba(184, 141, 74, 0.35)';
            e.currentTarget.style.color = '#EADAB5';
          }}
        >
          <span>Skip to Boutique</span>
          <ArrowRight size={13} />
        </button>
      </div>
    </aside>
  );
};
