import React from 'react';
import { ArrowRight, Home, Compass } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const NotFoundPage = () => {
  const { navigateTo } = useShop();

  return (
    <section
      aria-label="Page not found"
      style={{
        minHeight: '68vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: 'clamp(2.5rem, 6vw, 5rem) 1.5rem',
        backgroundColor: '#FAF6EE'
      }}
    >
      <div
        style={{
          width: '82px',
          height: '82px',
          borderRadius: '50%',
          backgroundColor: '#301B12',
          border: '1.5px solid #B88D4A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.5rem',
          padding: '0.75rem',
          boxShadow: '0 10px 25px rgba(48, 27, 18, 0.14)'
        }}
      >
        <img
          src="/assets/rodhe_emblem_saree_r.png"
          alt="RODHE Monogram"
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
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
        Error 404 — Page Not Found
      </span>

      <h1
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 'clamp(2rem, 4.2vw, 3.1rem)',
          color: '#4B3024',
          marginBottom: '1rem',
          fontWeight: 500
        }}
      >
        A Thread Slightly Astray
      </h1>

      <p
        style={{
          fontSize: '0.96rem',
          color: '#6F4E3E',
          maxWidth: '490px',
          lineHeight: 1.65,
          marginBottom: '2.1rem'
        }}
      >
        The handcrafted saree or page link you visited could not be found. It may have moved, been retired from our loom batch, or contains a typo in the address.
      </p>

      <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          type="button"
          onClick={() => navigateTo('home')}
          className="btn btn-primary"
          style={{ minHeight: '46px', padding: '0.75rem 1.75rem' }}
        >
          <Home size={15} />
          <span>Return to Homepage</span>
        </button>

        <button
          type="button"
          onClick={() => navigateTo('shop')}
          className="btn btn-outline"
          style={{ minHeight: '46px', padding: '0.75rem 1.75rem', borderColor: '#4B3024', color: '#4B3024' }}
        >
          <Compass size={15} />
          <span>Browse Sarees</span>
          <ArrowRight size={15} />
        </button>
      </div>
    </section>
  );
};
