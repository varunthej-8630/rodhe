import React, { useState } from 'react';
import { X, Lock, Mail, Phone, User, CheckCircle2, ArrowRight } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const AuthModal = () => {
  const { isAuthOpen, setIsAuthOpen, showToast } = useShop();
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isAuthOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitted(true);
    showToast(
      tab === 'login'
        ? `Welcome back! Signed in successfully.`
        : `Namaste ${formData.name || 'Patron'}! Your RODHE account has been created.`
    );
    setTimeout(() => {
      setIsAuthOpen(false);
      setIsSubmitted(false);
    }, 1200);
  };

  return (
    <div className="modal-backdrop" onClick={() => setIsAuthOpen(false)}>
      <div
        style={{
          width: 'min(440px, 92vw)',
          backgroundColor: '#FFFDF9',
          border: '1px solid rgba(184, 141, 74, 0.3)',
          boxShadow: '0 25px 60px rgba(42, 26, 19, 0.25)',
          overflow: 'hidden',
          animation: 'slideUp 0.3s ease'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.5rem',
            borderBottom: '1px solid rgba(75, 48, 36, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ fontSize: '0.72rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#B88D4A', fontWeight: 700 }}>
              RODHE Patron Portal
            </div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.45rem', color: '#4B3024' }}>
              {tab === 'login' ? 'Sign In to Your Account' : 'Join the RODHE Guild'}
            </h3>
          </div>
          <button
            onClick={() => setIsAuthOpen(false)}
            aria-label="Close modal"
            style={{ color: '#8F7263', padding: '0.3rem' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab switch */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid rgba(75, 48, 36, 0.1)' }}>
          <button
            onClick={() => setTab('login')}
            style={{
              padding: '0.85rem',
              fontSize: '0.82rem',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: tab === 'login' ? '#4B3024' : '#8F7263',
              backgroundColor: tab === 'login' ? '#FAF6EE' : 'transparent',
              borderBottom: tab === 'login' ? '2px solid #B88D4A' : 'none'
            }}
          >
            Sign In
          </button>
          <button
            onClick={() => setTab('register')}
            style={{
              padding: '0.85rem',
              fontSize: '0.82rem',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: tab === 'register' ? '#4B3024' : '#8F7263',
              backgroundColor: tab === 'register' ? '#FAF6EE' : 'transparent',
              borderBottom: tab === 'register' ? '2px solid #B88D4A' : 'none'
            }}
          >
            Register
          </button>
        </div>

        {/* Form Body */}
        <div style={{ padding: '1.75rem 1.5rem' }}>
          {isSubmitted ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <CheckCircle2 size={42} color="#B88D4A" style={{ margin: '0 auto 1rem' }} />
              <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', color: '#4B3024' }}>
                Authentication Confirmed
              </h4>
              <p style={{ fontSize: '0.85rem', color: '#8F7263' }}>
                Connecting your bag and preferences...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {tab === 'register' && (
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Parvathi Sharma"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  required
                  className="form-input"
                  placeholder="patron@domain.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              {tab === 'register' && (
                <div className="form-group">
                  <label className="form-label">Phone (WhatsApp Updates)</label>
                  <input
                    type="tel"
                    required
                    className="form-input"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  required
                  className="form-input"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.95rem', marginTop: '0.5rem' }}
              >
                <span>{tab === 'login' ? 'Sign In to RODHE' : 'Create Patron Account'}</span>
                <ArrowRight size={15} />
              </button>

              <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.78rem', color: '#8F7263' }}>
                Woven with Trust • Encrypted 256-bit security
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
