import React, { useState, useEffect } from 'react';
import { ShieldCheck, SlidersHorizontal, X } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { isAnalyticsConfigured } from '../services/analyticsService';

/**
 * Branded Cookie & Storage Consent Banner + Preference Modal.
 * Essential browser storage (shopping bag, favourites, session draft, consent choice) stays active;
 * optional Google Analytics only initializes when both Measurement ID is configured and consented.
 */
export const CookieConsentBanner = () => {
  const {
    currentPage,
    cookieConsent,
    isCookiePrefsOpen,
    setIsCookiePrefsOpen,
    saveCookiePreferences,
    navigateTo
  } = useShop();

  const [analyticsEnabled, setAnalyticsEnabled] = useState(Boolean(cookieConsent?.analytics));

  useEffect(() => {
    setAnalyticsEnabled(Boolean(cookieConsent?.analytics));
  }, [cookieConsent, isCookiePrefsOpen]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isCookiePrefsOpen) {
        setIsCookiePrefsOpen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isCookiePrefsOpen, setIsCookiePrefsOpen]);

  // Never show storefront cookie banner inside private CRM
  if (currentPage === 'admin') return null;

  const showInitialBanner = !cookieConsent && !isCookiePrefsOpen;

  return (
    <>
      {showInitialBanner && (
        <aside
          role="region"
          aria-label="Cookie and storage preferences"
          style={{
            position: 'fixed',
            bottom: 'calc(0.65rem + env(safe-area-inset-bottom, 0px))',
            left: 'clamp(0.6rem, 2.5vw, 1.5rem)',
            right: 'clamp(0.6rem, 2.5vw, 1.5rem)',
            maxWidth: '920px',
            margin: '0 auto',
            backgroundColor: '#FFFDF9',
            border: '1px solid rgba(184, 141, 74, 0.45)',
            boxShadow: '0 16px 40px rgba(42, 26, 19, 0.2)',
            padding: 'clamp(0.7rem, 1.8vw, 1.1rem) clamp(0.85rem, 2.2vw, 1.35rem)',
            zIndex: 950,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.65rem',
            borderRadius: '3px'
          }}
        >
          <div style={{ flex: '1 1 280px', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
              <ShieldCheck size={14} color="#B88D4A" />
              <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: '#4B3024' }}>
                Privacy & Browser Storage
              </span>
            </div>
            <p style={{ fontSize: '0.76rem', color: '#6F4E3E', lineHeight: 1.45, margin: 0 }}>
              RODHE uses essential browser storage for your bag, favourites, and account session. Optional analytics runs only with your consent.{' '}
              <button
                type="button"
                onClick={() => navigateTo('policies', 'privacy')}
                style={{ color: '#4B3024', textDecoration: 'underline', fontWeight: 600, fontSize: '0.76rem' }}
              >
                Privacy Policy
              </button>
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setIsCookiePrefsOpen(true)}
              className="btn btn-outline btn-sm"
              style={{ padding: '0.35rem 0.65rem', fontSize: '0.68rem', minHeight: '34px', letterSpacing: '0.04em' }}
            >
              <SlidersHorizontal size={12} />
              <span>Manage Preferences</span>
            </button>
            <button
              type="button"
              onClick={() => saveCookiePreferences(false)}
              className="btn btn-outline btn-sm"
              style={{ padding: '0.35rem 0.7rem', fontSize: '0.68rem', minHeight: '34px', letterSpacing: '0.04em' }}
            >
              Reject Optional
            </button>
            <button
              type="button"
              onClick={() => saveCookiePreferences(true)}
              className="btn btn-primary btn-sm"
              style={{ padding: '0.35rem 0.85rem', fontSize: '0.68rem', minHeight: '34px', letterSpacing: '0.04em' }}
            >
              Accept All
            </button>
          </div>
        </aside>
      )}

      {isCookiePrefsOpen && (
        <div
          className="modal-backdrop"
          onClick={() => setIsCookiePrefsOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Cookie and Privacy Preferences"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(520px, 94vw)',
              backgroundColor: '#FFFDF9',
              border: '1px solid rgba(184, 141, 74, 0.35)',
              boxShadow: '0 24px 60px rgba(42, 26, 19, 0.25)',
              padding: 'clamp(1.25rem, 3vw, 1.75rem)',
              color: '#4B3024'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(75, 48, 36, 0.1)', paddingBottom: '0.85rem', marginBottom: '1.15rem' }}>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', margin: 0, color: '#4B3024' }}>
                Privacy & Cookie Preferences
              </h2>
              <button
                type="button"
                onClick={() => setIsCookiePrefsOpen(false)}
                aria-label="Close cookie preferences"
                style={{ padding: '0.35rem', minWidth: '36px', minHeight: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6F4E3E' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.35rem' }}>
              <div style={{ padding: '0.9rem 1rem', backgroundColor: '#FAF6EE', border: '1px solid rgba(75, 48, 36, 0.12)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                  <strong style={{ fontSize: '0.88rem', color: '#4B3024' }}>Essential Storefront Storage</strong>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#525B3A' }}>
                    Always Active
                  </span>
                </div>
                <p style={{ fontSize: '0.78rem', color: '#6F4E3E', margin: 0, lineHeight: 1.5 }}>
                  Preserves your shopping bag, saved favourites, signed-in Supabase Auth session, temporary tab checkout draft, and consent choice.
                </p>
              </div>

              <label
                style={{
                  display: 'block',
                  padding: '0.9rem 1rem',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid rgba(75, 48, 36, 0.14)',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', marginBottom: '0.3rem' }}>
                  <strong style={{ fontSize: '0.88rem', color: '#4B3024' }}>Optional Storefront Analytics (GA4)</strong>
                  <input
                    type="checkbox"
                    aria-label="Toggle optional analytics cookies"
                    checked={analyticsEnabled}
                    onChange={(e) => setAnalyticsEnabled(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: '#4B3024', cursor: 'pointer' }}
                  />
                </div>
                <p style={{ fontSize: '0.78rem', color: '#6F4E3E', margin: 0, lineHeight: 1.5 }}>
                  Helps us understand which saree crafts and pages visitors explore most.{' '}
                  {isAnalyticsConfigured
                    ? 'Google Analytics 4 loads only when enabled here.'
                    : 'Analytics tracking is currently inactive on this build until configured with a GA4 Measurement ID.'}
                </p>
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => saveCookiePreferences(false)}
                className="btn btn-outline btn-sm"
                style={{ minHeight: '42px' }}
              >
                Reject Optional
              </button>
              <button
                type="button"
                onClick={() => saveCookiePreferences(analyticsEnabled)}
                className="btn btn-primary btn-sm"
                style={{ minHeight: '42px' }}
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

