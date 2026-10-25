import React, { useState } from 'react';
import { ArrowRight, ShieldCheck, Check, Sparkles } from 'lucide-react';
import { InstagramIcon, FacebookIcon, PinterestIcon, YoutubeIcon } from './SocialIcons';
import { useShop } from '../context/ShopContext';

export const Footer = () => {
  const { navigateTo, setSelectedCraft, showToast } = useShop();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setIsSubscribed(true);
    showToast('Thank you for joining the RODHE textile society.');
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
                <form onSubmit={handleSubscribe} className="footer-newsletter-form">
                  <input
                    type="email"
                    required
                    placeholder="Enter your email address"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    style={{
                      flexGrow: 1,
                      minWidth: 0,
                      padding: '0.85rem 1.15rem',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid rgba(184, 141, 74, 0.38)',
                      borderRadius: '2px',
                      color: '#4B3024',
                      fontSize: '0.88rem',
                      outline: 'none',
                      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)'
                    }}
                  />
                  <button
                    type="submit"
                    className="btn btn-gold"
                    style={{
                      padding: '0.85rem 1.6rem',
                      minHeight: '44px',
                      flexShrink: 0,
                      backgroundColor: '#B88D4A',
                      color: '#FAF6EE',
                      borderRadius: '2px'
                    }}
                  >
                    <span>Subscribe</span>
                    <ArrowRight size={15} />
                  </button>
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
                  src="/assets/RODHE Woven Luxury Wordmark.png"
                  alt="RODHE — Woven with Trust"
                  style={{
                    height: 'clamp(38px, 6vw, 48px)',
                    filter: 'brightness(0) invert(1) drop-shadow(0 2px 8px rgba(0,0,0,0.3))'
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
                <a href="#instagram" aria-label="Instagram" style={{ transition: 'color 0.2s', padding: '0.25rem' }} onMouseEnter={(e) => (e.currentTarget.style.color = '#D4AC68')} onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(250, 246, 238, 0.8)')}>
                  <InstagramIcon size={20} />
                </a>
                <a href="#facebook" aria-label="Facebook" style={{ transition: 'color 0.2s', padding: '0.25rem' }} onMouseEnter={(e) => (e.currentTarget.style.color = '#D4AC68')} onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(250, 246, 238, 0.8)')}>
                  <FacebookIcon size={20} />
                </a>
                <a href="#pinterest" aria-label="Pinterest" style={{ transition: 'color 0.2s', padding: '0.25rem' }} onMouseEnter={(e) => (e.currentTarget.style.color = '#D4AC68')} onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(250, 246, 238, 0.8)')}>
                  <PinterestIcon size={20} />
                </a>
                <a href="#youtube" aria-label="YouTube" style={{ transition: 'color 0.2s', padding: '0.25rem' }} onMouseEnter={(e) => (e.currentTarget.style.color = '#D4AC68')} onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(250, 246, 238, 0.8)')}>
                  <YoutubeIcon size={20} />
                </a>
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
                  <button onClick={() => navigateTo('shop')} style={{ color: 'rgba(250, 246, 238, 0.8)', transition: 'color 0.2s', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}>
                    All Sarees (8)
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
                  <button onClick={() => navigateTo('contact')} style={{ color: 'rgba(250, 246, 238, 0.8)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}>
                    Customer Support
                  </button>
                </li>
                <li>
                  <button onClick={() => navigateTo('contact')} style={{ color: 'rgba(250, 246, 238, 0.8)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}>
                    Shipping & Insured Delivery
                  </button>
                </li>
                <li>
                  <button onClick={() => navigateTo('contact')} style={{ color: 'rgba(250, 246, 238, 0.8)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}>
                    7-Day Easy Exchange Policy
                  </button>
                </li>
                <li>
                  <button onClick={() => navigateTo('contact')} style={{ color: 'rgba(250, 246, 238, 0.8)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}>
                    Saree Care & Wash Guide
                  </button>
                </li>
                <li>
                  <span style={{ color: '#D4AC68', fontSize: '0.82rem' }}>
                    Email: concierge@rodhe.in
                  </span>
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
              color: 'rgba(250, 246, 238, 0.65)'
            }}
          >
            <div>
              © 2026 RODHE. All rights reserved. “Woven with Trust” is a registered trademark.
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <span style={{ cursor: 'pointer' }} onClick={() => navigateTo('contact')}>Privacy Policy</span>
              <span style={{ cursor: 'pointer' }} onClick={() => navigateTo('contact')}>Terms of Service</span>
              <span style={{ cursor: 'pointer' }} onClick={() => navigateTo('story')}>Authentication Certificate</span>
              <button
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
                Client CRM Portal
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#D4AC68' }}>
              <ShieldCheck size={16} style={{ flexShrink: 0 }} />
              <span>100% Genuine Handloom & Botanical Dye Guarantee</span>
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

