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
    <footer
      style={{
        backgroundColor: '#4B3024',
        color: '#FAF6EE',
        borderTop: '1px solid #B88D4A',
        position: 'relative'
      }}
    >
      {/* Newsletter Feature Row */}
      <div
        style={{
          borderBottom: '1px solid rgba(234, 218, 181, 0.15)',
          padding: 'clamp(3rem, 5vw, 4.5rem) 0'
        }}
      >
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '2.5rem',
              alignItems: 'center'
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  fontSize: '0.75rem',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: '#D4AC68',
                  marginBottom: '0.5rem',
                  fontWeight: 600
                }}
              >
                <Sparkles size={14} />
                <span>The RODHE Gazette</span>
              </div>
              <h3
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 'clamp(1.8rem, 3vw, 2.4rem)',
                  color: '#FFFFFF',
                  lineHeight: 1.2
                }}
              >
                Join the Textile Society
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'rgba(250, 246, 238, 0.75)', marginTop: '0.4rem' }}>
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
                    padding: '1rem',
                    backgroundColor: 'rgba(184, 141, 74, 0.2)',
                    border: '1px solid #B88D4A',
                    color: '#EADAB5',
                    fontSize: '0.9rem'
                  }}
                >
                  <Check size={18} color="#D4AC68" />
                  <span>Welcome. Check your inbox for your 10% welcome invitation (WOVEN10).</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <input
                    type="email"
                    required
                    placeholder="Enter your email address"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    style={{
                      flexGrow: 1,
                      minWidth: '220px',
                      padding: '0.9rem 1.15rem',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(234, 218, 181, 0.3)',
                      color: '#FFFFFF',
                      fontSize: '0.88rem',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="submit"
                    className="btn btn-gold"
                    style={{ padding: '0.9rem 1.75rem' }}
                  >
                    <span>Subscribe</span>
                    <ArrowRight size={15} />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div style={{ padding: 'clamp(3.5rem, 6vw, 5.5rem) 0 3rem' }}>
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 'clamp(2rem, 4vw, 3.5rem)'
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
                    height: '48px',
                    filter: 'brightness(0) invert(1) drop-shadow(0 2px 8px rgba(0,0,0,0.3))'
                  }}
                />
              </div>

              <p style={{ fontSize: '0.85rem', color: 'rgba(250, 246, 238, 0.75)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
                Handcrafted luxury sarees inspired by nature, woven by generational artisans, and draped in botanical dyes.
              </p>

              <div style={{ fontSize: '0.78rem', color: '#D4AC68', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: '1.25rem' }}>
                WOVEN WITH TRUST
              </div>

              <div style={{ display: 'flex', gap: '1rem', color: 'rgba(250, 246, 238, 0.8)' }}>
                <a href="#instagram" aria-label="Instagram" style={{ transition: 'color 0.2s' }} onMouseEnter={(e) => (e.currentTarget.style.color = '#D4AC68')} onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(250, 246, 238, 0.8)')}>
                  <InstagramIcon size={18} />
                </a>
                <a href="#facebook" aria-label="Facebook" style={{ transition: 'color 0.2s' }} onMouseEnter={(e) => (e.currentTarget.style.color = '#D4AC68')} onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(250, 246, 238, 0.8)')}>
                  <FacebookIcon size={18} />
                </a>
                <a href="#pinterest" aria-label="Pinterest" style={{ transition: 'color 0.2s' }} onMouseEnter={(e) => (e.currentTarget.style.color = '#D4AC68')} onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(250, 246, 238, 0.8)')}>
                  <PinterestIcon size={18} />
                </a>
                <a href="#youtube" aria-label="YouTube" style={{ transition: 'color 0.2s' }} onMouseEnter={(e) => (e.currentTarget.style.color = '#D4AC68')} onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(250, 246, 238, 0.8)')}>
                  <YoutubeIcon size={18} />
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
                  marginBottom: '1.25rem',
                  fontWeight: 500
                }}
              >
                The Saree Atelier
              </h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
                <li>
                  <button onClick={() => navigateTo('shop')} style={{ color: 'rgba(250, 246, 238, 0.8)', transition: 'color 0.2s' }}>
                    All Sarees (8)
                  </button>
                </li>
                <li>
                  <button onClick={() => handleCraftClick('tie-dye')} style={{ color: 'rgba(250, 246, 238, 0.8)', transition: 'color 0.2s' }}>
                    Indigo & Shibori Tie-Dye
                  </button>
                </li>
                <li>
                  <button onClick={() => handleCraftClick('handblock')} style={{ color: 'rgba(250, 246, 238, 0.8)', transition: 'color 0.2s' }}>
                    Bagru Mud-Resist & Dabu
                  </button>
                </li>
                <li>
                  <button onClick={() => handleCraftClick('chanderi')} style={{ color: 'rgba(250, 246, 238, 0.8)', transition: 'color 0.2s' }}>
                    Chanderi Sheer Silk & Zari
                  </button>
                </li>
                <li>
                  <button onClick={() => handleCraftClick('mulmul')} style={{ color: 'rgba(250, 246, 238, 0.8)', transition: 'color 0.2s' }}>
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
                  marginBottom: '1.25rem',
                  fontWeight: 500
                }}
              >
                Our Journey
              </h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
                <li>
                  <button onClick={() => navigateTo('story')} style={{ color: 'rgba(250, 246, 238, 0.8)' }}>
                    The RODHE Manifesto
                  </button>
                </li>
                <li>
                  <button onClick={() => navigateTo('story')} style={{ color: 'rgba(250, 246, 238, 0.8)' }}>
                    Seed to Saree Story
                  </button>
                </li>
                <li>
                  <button onClick={() => navigateTo('story')} style={{ color: 'rgba(250, 246, 238, 0.8)' }}>
                    Botanical Dyes Guide
                  </button>
                </li>
                <li>
                  <button onClick={() => navigateTo('story')} style={{ color: 'rgba(250, 246, 238, 0.8)' }}>
                    Artisan Lineage
                  </button>
                </li>
                <li>
                  <button onClick={() => navigateTo('contact')} style={{ color: 'rgba(250, 246, 238, 0.8)' }}>
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
                  marginBottom: '1.25rem',
                  fontWeight: 500
                }}
              >
                Client Concierge
              </h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
                <li>
                  <button onClick={() => navigateTo('contact')} style={{ color: 'rgba(250, 246, 238, 0.8)' }}>
                    Customer Support
                  </button>
                </li>
                <li>
                  <button onClick={() => navigateTo('contact')} style={{ color: 'rgba(250, 246, 238, 0.8)' }}>
                    Shipping & Insured Delivery
                  </button>
                </li>
                <li>
                  <button onClick={() => navigateTo('contact')} style={{ color: 'rgba(250, 246, 238, 0.8)' }}>
                    7-Day Easy Exchange Policy
                  </button>
                </li>
                <li>
                  <button onClick={() => navigateTo('contact')} style={{ color: 'rgba(250, 246, 238, 0.8)' }}>
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
              marginTop: '4rem',
              paddingTop: '2rem',
              borderTop: '1px solid rgba(234, 218, 181, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1.25rem',
              fontSize: '0.78rem',
              color: 'rgba(250, 246, 238, 0.65)'
            }}
          >
            <div>
              © 2026 RODHE. All rights reserved. “Woven with Trust” is a registered trademark.
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <span>Privacy Policy</span>
              <span>Terms of Service</span>
              <span>Authentication Certificate</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#D4AC68' }}>
              <ShieldCheck size={16} />
              <span>100% Genuine Handloom & Botanical Dye Guarantee</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
