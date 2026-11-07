import React, { useState } from 'react';
import { X, Mail, Phone, User, CheckCircle2, ArrowRight, LogOut, ShieldCheck } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const AuthModal = () => {
  const { isAuthOpen, setIsAuthOpen, showToast, patronUser, loginPatron, logoutPatron } = useShop();
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

    const patronProfile = {
      name: tab === 'register' ? formData.name.trim() : (formData.name.trim() || formData.email.split('@')[0]),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.trim(),
      authenticatedAt: new Date().toISOString()
    };

    loginPatron(patronProfile);

    showToast(
      tab === 'login'
        ? `Welcome back, ${patronProfile.name}! Signed in successfully.`
        : `Namaste ${patronProfile.name}! Your RODHE patron account has been created.`
    );

    setTimeout(() => {
      setIsAuthOpen(false);
      setIsSubmitted(false);
    }, 1000);
  };

  return (
    <div className="modal-backdrop" onClick={() => setIsAuthOpen(false)}>
      <div
        style={{
          width: 'min(440px, 94vw)',
          backgroundColor: '#FFFDF9',
          border: '1px solid rgba(184, 141, 74, 0.3)',
          boxShadow: '0 25px 60px rgba(42, 26, 19, 0.25)',
          overflowY: 'auto',
          maxHeight: '92vh',
          animation: 'slideUp 0.3s ease'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem clamp(1rem, 3vw, 1.5rem)',
            borderBottom: '1px solid rgba(75, 48, 36, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#B88D4A', fontWeight: 700 }}>
              RODHE Patron Portal
            </div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.25rem, 3.5vw, 1.45rem)', color: '#4B3024', margin: '0.2rem 0 0' }}>
              {patronUser ? 'Patron Profile' : (tab === 'login' ? 'Sign In to Your Account' : 'Join the RODHE Guild')}
            </h3>
          </div>
          <button
            onClick={() => setIsAuthOpen(false)}
            aria-label="Close modal"
            style={{ color: '#8F7263', padding: '0.3rem', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {patronUser ? (
          /* Active Patron Profile View */
          <div style={{ padding: 'clamp(1.25rem, 3.5vw, 1.75rem) clamp(1rem, 3vw, 1.5rem)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  backgroundColor: '#FAF6EE',
                  border: '1.5px solid #B88D4A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#B88D4A',
                  fontWeight: 700,
                  fontSize: '1.2rem',
                  fontFamily: 'var(--font-serif)'
                }}
              >
                {patronUser.name ? patronUser.name.charAt(0).toUpperCase() : 'P'}
              </div>
              <div>
                <h4 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: '1.15rem', color: '#4B3024' }}>
                  {patronUser.name || 'Valued Patron'}
                </h4>
                <div style={{ fontSize: '0.82rem', color: '#8F7263', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.15rem' }}>
                  <Mail size={13} />
                  <span>{patronUser.email}</span>
                </div>
                {patronUser.phone && (
                  <div style={{ fontSize: '0.82rem', color: '#8F7263', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.15rem' }}>
                    <Phone size={13} />
                    <span>{patronUser.phone}</span>
                  </div>
                )}
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#FAF6EE',
                border: '1px solid rgba(184, 141, 74, 0.25)',
                padding: '0.85rem 1rem',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                fontSize: '0.8rem',
                color: '#4B3024'
              }}
            >
              <ShieldCheck size={18} color="#B88D4A" style={{ flexShrink: 0 }} />
              <div>
                Your profile is active. Fast checkout is enabled with saved shipping details.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setIsAuthOpen(false)}
                className="btn btn-primary"
                style={{ flex: 1, padding: '0.75rem' }}
              >
                <span>Continue Shopping</span>
                <ArrowRight size={15} />
              </button>
              <button
                onClick={() => {
                  logoutPatron();
                  setIsAuthOpen(false);
                }}
                className="btn btn-outline"
                style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#A03020', borderColor: 'rgba(160, 48, 32, 0.3)' }}
              >
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        ) : (
          <>
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
                  border: 'none',
                  borderBottom: tab === 'login' ? '2px solid #B88D4A' : 'none',
                  cursor: 'pointer'
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
                  border: 'none',
                  borderBottom: tab === 'register' ? '2px solid #B88D4A' : 'none',
                  cursor: 'pointer'
                }}
              >
                Register
              </button>
            </div>

            {/* Form Body */}
            <div style={{ padding: 'clamp(1.25rem, 3.5vw, 1.75rem) clamp(1rem, 3vw, 1.5rem)' }}>
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
                        autoComplete="name"
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
                      autoComplete="email"
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
                        inputMode="numeric"
                        autoComplete="tel"
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
                      autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                      className="form-input"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '0.95rem', marginTop: '0.5rem', minHeight: '48px' }}
                  >
                    <span>{tab === 'login' ? 'Sign In to RODHE' : 'Create Patron Account'}</span>
                    <ArrowRight size={15} />
                  </button>

                  <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.78rem', color: '#8F7263' }}>
                    Woven with Trust • 256-bit SSL In-Transit Encryption
                  </div>
                </form>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
