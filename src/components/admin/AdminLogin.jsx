import React, { useState } from 'react';
import { Lock, User, ArrowRight, Eye, EyeOff, ShieldCheck, KeyRound, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { authService } from '../../services/authService';

export const AdminLogin = ({ onLoginSuccess, onBackToStore }) => {
  // Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Forgot / Reset Password Mode
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  // Handle Sign In
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      const res = await authService.login(username, password);
      if (res.success) {
        onLoginSuccess(res.user);
      } else {
        setError(res.message || 'Authentication failed. Please verify credentials.');
      }
    } catch {
      setError('An error occurred during authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Forgot Password
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      const res = await authService.requestPasswordReset(resetEmail);
      if (res.success) {
        setResetSuccess(true);
        setSuccessMessage(res.message || 'Password reset link sent to registered email.');
      } else {
        setError(res.message || 'Unable to dispatch recovery link.');
      }
    } catch {
      setError('An error occurred during password recovery.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#2A1A13',
        backgroundImage: 'radial-gradient(circle at 50% 30%, rgba(75, 48, 36, 0.7) 0%, rgba(42, 26, 19, 0.98) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        fontFamily: 'var(--font-sans)'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: '#FFFDF9',
          borderRadius: '4px',
          border: '1px solid rgba(184, 141, 74, 0.35)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden'
        }}
      >
        {/* Top Hallmark Header */}
        <div
          style={{
            backgroundColor: '#4B3024',
            padding: '2rem 1.75rem',
            textAlign: 'center',
            color: '#FAF6EE',
            borderBottom: '1px solid rgba(184, 141, 74, 0.25)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem', marginBottom: '0.35rem' }}>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.9rem', letterSpacing: '0.12em', color: '#EADAB5', fontWeight: 600 }}>RODHE</span>
          </div>
          <span style={{ fontSize: '0.72rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(234, 218, 181, 0.85)' }}>
            Client CRM & Management Portal
          </span>
        </div>

        {/* Form Body */}
        <div style={{ padding: '2rem 1.75rem' }}>
          {error && (
            <div
              style={{
                backgroundColor: 'rgba(201, 130, 120, 0.15)',
                border: '1px solid #C98278',
                color: '#8A2A20',
                padding: '0.75rem 1rem',
                borderRadius: '3px',
                fontSize: '0.8rem',
                marginBottom: '1.25rem'
              }}
            >
              {error}
            </div>
          )}

          {successMessage && (
            <div
              style={{
                backgroundColor: 'rgba(82, 91, 58, 0.15)',
                border: '1px solid #525B3A',
                color: '#34401E',
                padding: '0.75rem 1rem',
                borderRadius: '3px',
                fontSize: '0.8rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <CheckCircle2 size={16} color="#525B3A" style={{ flexShrink: 0 }} />
              <span>{successMessage}</span>
            </div>
          )}

          {!isForgotMode ? (
            /* ========================================================= */
            /* 1. STANDARD ADMIN LOGIN FORM                              */
            /* ========================================================= */
            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#4B3024', marginBottom: '0.4rem' }}>
                  Admin Email / Username
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. rodhesaree@gmail.com"
                    required
                    style={{
                      width: '100%',
                      padding: '0.7rem 0.9rem 0.7rem 2.4rem',
                      border: '1px solid rgba(75, 48, 36, 0.22)',
                      borderRadius: '3px',
                      fontSize: '0.86rem',
                      color: '#4B3024',
                      outline: 'none',
                      backgroundColor: '#FFFDF9',
                      boxSizing: 'border-box'
                    }}
                  />
                  <User size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#8F7263' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label style={{ fontSize: '0.74rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#4B3024' }}>
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotMode(true);
                      setError('');
                      setSuccessMessage('');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#B88D4A',
                      fontSize: '0.74rem',
                      cursor: 'pointer',
                      padding: 0,
                      fontWeight: 600
                    }}
                  >
                    Forgot Password?
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    style={{
                      width: '100%',
                      padding: '0.7rem 2.4rem',
                      border: '1px solid rgba(75, 48, 36, 0.22)',
                      borderRadius: '3px',
                      fontSize: '0.86rem',
                      color: '#4B3024',
                      outline: 'none',
                      backgroundColor: '#FFFDF9',
                      boxSizing: 'border-box'
                    }}
                  />
                  <Lock size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#8F7263' }} />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#8F7263',
                      cursor: 'pointer'
                    }}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  width: '100%',
                  padding: '0.85rem',
                  backgroundColor: '#4B3024',
                  color: '#FAF6EE',
                  border: 'none',
                  borderRadius: '3px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.7 : 1,
                  transition: 'background 0.2s',
                  marginTop: '0.35rem'
                }}
                onMouseEnter={(e) => !isLoading && (e.currentTarget.style.backgroundColor = '#6F4E3E')}
                onMouseLeave={(e) => !isLoading && (e.currentTarget.style.backgroundColor = '#4B3024')}
              >
                <span>{isLoading ? 'Verifying with Supabase Auth...' : 'Sign In to CRM'}</span>
                <ArrowRight size={15} />
              </button>
            </form>
          ) : (
            /* ========================================================= */
            /* 2. FORGOT PASSWORD (SUPABASE AUTH MAGIC LINK)             */
            /* ========================================================= */
            <form onSubmit={handleResetSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                <div style={{ display: 'inline-flex', padding: '0.65rem', backgroundColor: '#F4ECE1', borderRadius: '50%', color: '#B88D4A', marginBottom: '0.45rem' }}>
                  <KeyRound size={22} />
                </div>
                <h3 style={{ fontSize: '1rem', color: '#4B3024', fontWeight: 600, margin: 0 }}>Reset CRM Password</h3>
                <p style={{ fontSize: '0.76rem', color: '#8F7263', marginTop: '0.25rem', marginBottom: 0 }}>
                  Enter your registered administrative email address. A secure recovery link will be dispatched via Supabase Auth.
                </p>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#4B3024', marginBottom: '0.4rem' }}>
                  Administrator Email
                </label>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="e.g. rodhesaree@gmail.com"
                  required
                  style={{
                    width: '100%',
                    padding: '0.7rem 0.9rem',
                    border: '1px solid rgba(75, 48, 36, 0.22)',
                    borderRadius: '3px',
                    fontSize: '0.86rem',
                    color: '#4B3024',
                    outline: 'none',
                    backgroundColor: '#FFFDF9',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || resetSuccess}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  width: '100%',
                  padding: '0.85rem',
                  backgroundColor: '#B88D4A',
                  color: '#2A1A13',
                  border: 'none',
                  borderRadius: '3px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  cursor: (isLoading || resetSuccess) ? 'not-allowed' : 'pointer',
                  opacity: (isLoading || resetSuccess) ? 0.7 : 1,
                  marginTop: '0.35rem',
                  transition: 'background 0.2s'
                }}
              >
                <span>{isLoading ? 'Dispatching Link...' : 'Send Recovery Link'}</span>
                <ArrowRight size={15} />
              </button>

              <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotMode(false);
                    setError('');
                    setSuccessMessage('');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#8F7263',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <ArrowLeft size={13} />
                  <span>Return to Sign In</span>
                </button>
              </div>
            </form>
          )}

          {/* Bottom Security Hallmark */}
          <div
            style={{
              marginTop: '2rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid rgba(75, 48, 36, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem',
              color: '#8F7263',
              fontSize: '0.72rem'
            }}
          >
            <ShieldCheck size={14} color="#B88D4A" />
            <span>256-bit SSL In-Transit Encryption • Supabase Auth</span>
          </div>

          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <button
              onClick={onBackToStore}
              style={{
                background: 'none',
                border: 'none',
                color: '#6F4E3E',
                fontSize: '0.76rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                textDecoration: 'underline'
              }}
            >
              <ArrowLeft size={13} />
              <span>Return to Public Boutique</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
