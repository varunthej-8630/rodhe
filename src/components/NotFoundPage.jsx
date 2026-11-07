import React from 'react';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const NotFoundPage = () => {
  const { navigateTo } = useShop();

  return (
    <div
      style={{
        minHeight: '65vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: 'clamp(2rem, 5vw, 4rem) 1.5rem',
        backgroundColor: '#FAF6EE'
      }}
    >
      <div
        style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          backgroundColor: '#F4ECE1',
          border: '1px solid rgba(184, 141, 74, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.5rem',
          color: '#B88D4A'
        }}
      >
        <ShoppingBag size={32} />
      </div>

      <span
        style={{
          fontSize: '0.78rem',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: '#B88D4A',
          fontWeight: 700,
          marginBottom: '0.65rem'
        }}
      >
        404 — Drape Not Found
      </span>

      <h1
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 'clamp(2rem, 4vw, 3rem)',
          color: '#4B3024',
          marginBottom: '1rem',
          fontWeight: 500
        }}
      >
        A Thread Slightly Astray
      </h1>

      <p
        style={{
          fontSize: '0.94rem',
          color: '#6F4E3E',
          maxWidth: '480px',
          lineHeight: 1.6,
          marginBottom: '2rem'
        }}
      >
        The artisanal page or saree edition you are searching for might have moved, been archived into our heirloom vault, or does not exist.
      </p>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={() => navigateTo('home')}
          className="btn btn-primary"
          style={{ minHeight: '46px', padding: '0.75rem 1.75rem' }}
        >
          Return to RODHE Home
        </button>

        <button
          onClick={() => navigateTo('shop')}
          className="btn btn-outline"
          style={{ minHeight: '46px', padding: '0.75rem 1.75rem', borderColor: '#4B3024', color: '#4B3024' }}
        >
          <span>Discover Sarees</span>
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
};

