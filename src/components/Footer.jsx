import React, { useState } from 'react';
import { ArrowRight, ShieldCheck, Check, Sparkles } from 'lucide-react';
import { InstagramIcon, FacebookIcon, PinterestIcon, YoutubeIcon } from './SocialIcons';
import { useShop } from '../context/ShopContext';
import { storeService } from '../services/storeService';
import { isValidEmail } from '../services/customerService';

export const Footer = () => {
  const { navigateTo, setSelectedCraft, showToast, setIsTrackOrderOpen, setIsCookiePrefsOpen, PRODUCTS, storeSettings } = useShop();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterError, setNewsletterError] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const publishedCount = (PRODUCTS || []).filter((p) => !p.status || p.status === 'published').length;
  const conciergeEmail = storeSettings?.conciergeEmail || 'rodhesaree@gmail.com';

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (isSubscribing) return;
    const cleanEmail = newsletterEmail.trim();
    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      setNewsletterError('Please enter a valid email address.');
      return;
    }

    setNewsletterError('');
    setIsSubscribing(true);
    try {
      await storeService.joinCircle(cleanEmail);
      setIsSubscribed(true);
      showToast('Thank you for joining the RODHE textile society.', 'success');
    } catch (err) {
      setNewsletterError(err?.message || 'Unable to save subscription right now. Please try again.');
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleCraftClick = (craft) => {
    setSelectedCraft(craft);
    navigateTo('shop');
  };

  return (
    <>
      {/* Distinct Pre-Footer Newsletter Section (Separated from Footer) */}
      <section
        id="newsletter-section"
        style={{
          backgroundColor: '#FAF6EE',
          borderTop: '1px solid rgba(184, 141, 74, 0.22)',
          borderBottom: '1px solid rgba(184, 141, 74, 0.22)',
          padding: 'clamp(2.75rem, 5vw, 4rem) 0',
          position: 'relative'
        }}
      >
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
              gap: 'clamp(1.5rem, 3.5vw, 3rem)',
              alignItems: 'center'
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  fontSize: '0.74rem',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: '#B88D4A',
                  marginBottom: '0.45rem',
                  fontWeight: 700
                }}
              >
                <Sparkles size={14} color="#B88D4A" />
                <span>The RODHE Gazette</span>
              </div>
              <h3
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 'clamp(1.75rem, 3.2vw, 2.4rem)',
                  color: '#4B3024',
                  lineHeight: 1.2,
                  fontWeight: 500
                }}
              >
                Join the Textile Society
              </h3>
              <p
                style={{
                  fontSize: '0.88rem',
                  color: '#6F4E3E',
                  marginTop: '0.45rem',
                  lineHeight: 1.6,
                  maxWidth: '520px'
                }}
              >
                Receive rare invitations to limited artisanal harvests, botanical dye journals, and preview access.
              </p>
            </div>

            <div>
              {isSubscribed ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    padding: '1rem 1.25rem',
                    backgroundColor: 'rgba(184, 141, 74, 0.12)',
                    border: '1px solid #B88D4A',
                    color: '#4B3024',
                    fontSize: '0.88rem',
                    borderRadius: '2px'
                  }}
                >
                  <Check size={18} color="#525B3A" style={{ flexShrink: 0 }} />
                  <span style={{ fontWeight: 500 }}>
                    Welcome. Check your inbox for your 10% welcome invitation (<strong>WOVEN10</strong>).
                  </span>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} noValidate>
                  <div className="footer-newsletter-form">
                    <input
                      type="email"
                      required
                      aria-label="Newsletter email address"
                      placeholder="Enter your email address"
                      value={newsletterEmail}
                      onChange={(e) => {
                        setNewsletterEmail(e.target.value);
                        if (newsletterError) setNewsletterError('');
                      }}
                      style={{
                        flexGrow: 1,
                        minWidth: 0,
                        padding: '0.85rem 1.15rem',
                        backgroundColor: '#FFFFFF',
                        border: newsletterError ? '1px solid #C98278' : '1px solid rgba(184, 141, 74, 0.38)',
                        borderRadius: '2px',
                        color: '#4B3024',
                        fontSize: '0.88rem',
                        outline: 'none',
                        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)'
                      }}
                    />
                    <button
                      type="submit"
                      disabled={isSubscribing}
                      className="btn btn-gold"
                      style={{
                        padding: '0.85rem 1.6rem',
                        minHeight: '44px',
                        flexShrink: 0,
                        backgroundColor: '#B88D4A',
                        color: '#FAF6EE',
                        borderRadius: '2px',
                        opacity: isSubscribing ? 0.7 : 1,
                        cursor: isSubscribing ? 'wait' : 'pointer'
                      }}
                    >
                      <span>{isSubscribing ? 'Subscribing...' : 'Subscribe'}</span>
                      <ArrowRight size={15} />
                    </button>
                  </div>
                  {newsletterError && (
                    <div role="alert" style={{ fontSize: '0.78rem', color: '#8A2A20', marginTop: '0.4rem' }}>
                      {newsletterError}
                    </div>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Luxury Dark Footer */}
      <footer
        style={{
          backgroundColor: '#301B12',
          color: '#FAF6EE',
          borderTop: '1px solid rgba(184, 141, 74, 0.3)',
          position: 'relative'
        }}
      >
        {/* Main Footer Links */}
        <div style={{ padding: 'clamp(2.5rem, 5vw, 4.5rem) 0 2.5rem' }}>
          <div className="container">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))',
                gap: 'clamp(1.75rem, 3.5vw, 3rem)'
              }}
            >
              {/* Col 1: Brand & Tagline */}
              <div style={{ maxWidth: '300px' }}>
                <div
                  onClick={() => navigateTo('home')}
                  style={{ cursor: 'pointer', marginBottom: '1.25rem', display: 'inline-block' }}
                >
                  <img
                    src="/assets/rodhe_emblem_saree_r.png"
                    alt="RODHE — Woven Luxury"
                    style={{
                      height: 'clamp(54px, 7.5vw, 70px)',
                      width: 'auto',
                      objectFit: 'contain',
                      display: 'block',
                      filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.35))'
                    }}
                  />
                </div>

                <p style={{ fontSize: '0.85rem', color: 'rgba(250, 246, 238, 0.75)', lineHeight: 1.7, marginBottom: '1.25rem' }}>
                  Handcrafted luxury sarees inspired by nature, woven by generational artisans, and draped in botanical dyes.
                </p>

                <div style={{ fontSize: '0.78rem', color: '#D4AC68', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: '1.25rem' }}>
                  WOVEN WITH TRUST
                </div>

                <div style={{ display: 'flex', gap: '1rem', color: 'rgba(250, 246, 238, 0.8)' }}>
                  <button
                    type="button"
                    onClick={() => showToast(`Official Instagram link pending client confirmation. Reach us at ${conciergeEmail} or WhatsApp.`, 'info')}
                    aria-label="Instagram (link pending client confirmation)"
                    title="Instagram link pending client confirmation"
                    style={{ transition: 'color 0.2s', padding: '0.25rem', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#D4AC68')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(250, 246, 238, 0.8)')}
                  >
                    <InstagramIcon size={20} />
                  </button>
                  <button
                    type="button"
                    onClick={() => showToast(`Official Facebook link pending client confirmation. Reach us at ${conciergeEmail} or WhatsApp.`, 'info')}
                    aria-label="Facebook (link pending client confirmation)"
                    title="Facebook link pending client confirmation"
                    style={{ transition: 'color 0.2s', padding: '0.25rem', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#D4AC68')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(250, 246, 238, 0.8)')}
                  >
                    <FacebookIcon size={20} />
                  </button>
                  <button
                    type="button"
                    onClick={() => showToast(`Official Pinterest link pending client confirmation. Reach us at ${conciergeEmail} or WhatsApp.`, 'info')}
                    aria-label="Pinterest (link pending client confirmation)"
                    title="Pinterest link pending client confirmation"
                    style={{ transition: 'color 0.2s', padding: '0.25rem', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#D4AC68')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(250, 246, 238, 0.8)')}
                  >
                    <PinterestIcon size={20} />
                  </button>
                  <button
                    type="button"
                    onClick={() => showToast(`Official YouTube link pending client confirmation. Reach us at ${conciergeEmail} or WhatsApp.`, 'info')}
                    aria-label="YouTube (link pending client confirmation)"
                    title="YouTube link pending client confirmation"
                    style={{ transition: 'color 0.2s', padding: '0.25rem', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#D4AC68')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(250, 246, 238, 0.8)')}
                  >
                    <YoutubeIcon size={20} />
                  </button>
                </div>
              </div>

              {/* Col 2: The Saree Atelier */}
              <div>
                <h4
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.25rem',
                    color: '#EADAB5',
                    marginBottom: '1rem',
                    fontWeight: 500
                  }}
                >
                  The Saree Atelier
                </h4>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.85rem' }}>
                  <li>
                    <button onClick={() => handleCraftClick('all')} style={{ color: 'rgba(250, 246, 238, 0.8)', transition: 'color 0.2s', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}>
                      All Sarees ({publishedCount})
                    </button>
                  </li>
                  <li>
                    <button onClick={() => handleCraftClick('tie-dye')} style={{ color: 'rgba(250, 246, 238, 0.8)', transition: 'color 0.2s', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}>
                      Indigo & Shibori Tie-Dye
                    </button>
                  </li>
                  <li>
                    <button onClick={() => handleCraftClick('handblock')} style={{ color: 'rgba(250, 246, 238, 0.8)', transition: 'color 0.2s', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}>
                      Bagru Mud-Resist & Dabu
                    </button>
                  </li>
                  <li>
                    <button onClick={() => handleCraftClick('chanderi')} style={{ color: 'rgba(250, 246, 238, 0.8)', transition: 'color 0.2s', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}>
                      Chanderi Sheer Silk & Zari
                    </button>
                  </li>
                  <li>
                    <button onClick={() => handleCraftClick('mulmul')} style={{ color: 'rgba(250, 246, 238, 0.8)', transition: 'color 0.2s', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}>
                      Pure Mulmul Cotton Drapes
                    </button>
                  </li>
                </ul>
              </div>

              {/* Col 3: Craft & Brand Story */}
              <div>
                <h4
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.25rem',
                    color: '#EADAB5',
                    marginBottom: '1rem',
                    fontWeight: 500
                  }}
                >
                  Our Journey
                </h4>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.85rem' }}>
                  <li>
                    <button onClick={() => navigateTo('story')} style={{ color: 'rgba(250, 246, 238, 0.8)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}>
                      The RODHE Manifesto
                    </button>
                  </li>
                  <li>
                    <button onClick={() => navigateTo('story')} style={{ color: 'rgba(250, 246, 238, 0.8)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}>
                      Seed to Saree Story
                    </button>
                  </li>
                  <li>
                    <button onClick={() => navigateTo('story')} style={{ color: 'rgba(250, 246, 238, 0.8)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}>
                      Botanical Dyes Guide
                    </button>
                  </li>
                  <li>
                    <button onClick={() => navigateTo('story')} style={{ color: 'rgba(250, 246, 238, 0.8)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}>
                      Artisan Lineage
                    </button>
                  </li>
                  <li>
                    <button onClick={() => navigateTo('contact')} style={{ color: 'rgba(250, 246, 238, 0.8)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}>
                      Sustainable Packaging
                    </button>
                  </li>
                </ul>
              </div>

              {/* Col 4: Concierge & Policies */}
              <div>
                <h4
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.25rem',
                    color: '#EADAB5',
                    marginBottom: '1rem',
                    fontWeight: 500
                  }}
                >
                  Client Concierge
                </h4>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.85rem' }}>
                  <li>
                    <button type="button" onClick={() => setIsTrackOrderOpen(true)} style={{ color: '#D4AC68', fontWeight: 600, background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}>
                      Track Your Order
                    </button>
                  </li>
                  <li>
                    <button type="button" onClick={() => navigateTo('contact')} style={{ color: 'rgba(250, 246, 238, 0.85)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}>
                      Customer Support
                    </button>
                  </li>
                  <li>
                    <button type="button" onClick={() => navigateTo('policies', 'shipping')} style={{ color: 'rgba(250, 246, 238, 0.85)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}>
                      Shipping &amp; Delivery
                    </button>
                  </li>
                  <li>
                    <button type="button" onClick={() => navigateTo('policies', 'returns')} style={{ color: 'rgba(250, 246, 238, 0.85)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}>
                      Exchange Guidelines
                    </button>
                  </li>
                  <li>
                    <button type="button" onClick={() => navigateTo('policies', 'care')} style={{ color: 'rgba(250, 246, 238, 0.85)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}>
                      Saree Care &amp; Wash Guide
                    </button>
                  </li>
                  <li>
                    <a href={`mailto:${conciergeEmail}`} style={{ color: '#D4AC68', fontSize: '0.82rem', wordBreak: 'break-word' }}>
                      Email: {conciergeEmail}
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            {/* Bottom Copyright & Security Row */}
            <div
              style={{
                marginTop: 'clamp(2.5rem, 5vw, 4rem)',
                paddingTop: '1.5rem',
                borderTop: '1px solid rgba(234, 218, 181, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
                fontSize: '0.78rem',
                color: 'rgba(250, 246, 238, 0.72)'
              }}
            >
              <div>
                © 2026 RODHE. “Woven with Trust” • Handcrafted in India. All rights reserved.
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <button type="button" style={{ cursor: 'pointer', color: 'inherit', fontSize: 'inherit' }} onClick={() => navigateTo('policies', 'privacy')}>Privacy Policy</button>
                <button type="button" style={{ cursor: 'pointer', color: 'inherit', fontSize: 'inherit' }} onClick={() => navigateTo('policies', 'terms')}>Terms of Service</button>
                <button type="button" style={{ cursor: 'pointer', color: 'inherit', fontSize: 'inherit' }} onClick={() => setIsCookiePrefsOpen(true)}>Cookie Preferences</button>
                <button type="button" style={{ cursor: 'pointer', color: 'inherit', fontSize: 'inherit' }} onClick={() => navigateTo('story')}>Craft Manifesto</button>
                <button
                  type="button"
                  onClick={() => navigateTo('admin')}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: '#D4AC68',
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                    fontWeight: 500,
                    letterSpacing: '0.04em',
                    textDecoration: 'underline'
                  }}
                >
                  CRM Portal
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#D4AC68' }}>
                <ShieldCheck size={16} style={{ flexShrink: 0 }} />
                <span>Handcrafted Cotton &amp; Natural Botanical Dyes</span>
              </div>
            </div>
          </div>
        </div>

        <style>{`
        .footer-newsletter-form {
          display: flex;
          gap: 0.5rem;
          flex-direction: column;
        }
        @media (min-width: 480px) {
          .footer-newsletter-form {
            flex-direction: row;
          }
        }
      `}</style>
      </footer>
    </>
  );
};

