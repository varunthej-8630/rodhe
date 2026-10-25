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
  const [resetUsername, setResetUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
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
    } catch (err) {
      setError('An error occurred during authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Forgot / Change Password
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    if (newPassword.length < 4) {
      setError('Password must be at least 4 characters long.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.resetPassword(resetUsername, newPassword);
      if (res.success) {
        setResetSuccess(true);
        setSuccessMessage(res.message || 'Password successfully updated!');
        setPassword(newPassword);
        setUsername(resetUsername);
        setTimeout(() => {
          setIsForgotMode(false);
          setResetSuccess(false);
        }, 1800);
      } else {
        setError(res.message || 'Unable to reset password.');
      }
    } catch (err) {
      setError('Error while updating password in database.');
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
                backgroundColor: 'rgba(78, 115, 65, 0.15)',
                border: '1px solid #7A9E6E',
                color: '#284E1F',
                padding: '0.75rem 1rem',
                borderRadius: '3px',
                fontSize: '0.8rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <CheckCircle2 size={16} />
              <span>{successMessage}</span>
            </div>
          )}

          {!isForgotMode ? (
            /* ========================================================= */
            /* 1. STANDARD CRM LOGIN FORM (rodhe / rodhe@admin)          */
            /* ========================================================= */
            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#4B3024', marginBottom: '0.45rem' }}>
                  Administrator Username
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                    required
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem 0.75rem 2.4rem',
                      border: '1px solid rgba(75, 48, 36, 0.22)',
                      borderRadius: '3px',
                      fontSize: '0.88rem',
                      color: '#4B3024',
                      outline: 'none',
                      backgroundColor: '#FFFDF9',
                      boxSizing: 'border-box'
                    }}
                  />
                  <User size={16} color="#8F7263" style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
                  <label style={{ fontSize: '0.76rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#4B3024' }}>
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotMode(true);
                      setError('');
                      setSuccessMessage('');
                      setResetUsername(username || '');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '0.74rem',
                      color: '#B88D4A',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0
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
                    placeholder="••••••••••••"
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem 2.6rem 0.75rem 2.4rem',
                      border: '1px solid rgba(75, 48, 36, 0.22)',
                      borderRadius: '3px',
                      fontSize: '0.88rem',
                      color: '#4B3024',
                      outline: 'none',
                      backgroundColor: '#FFFDF9',
                      boxSizing: 'border-box'
                    }}
                  />
                  <Lock size={16} color="#8F7263" style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '0.8rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#8F7263',
                      cursor: 'pointer'
                    }}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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
                <span>{isLoading ? 'Connecting to Database...' : 'Sign In to CRM'}</span>
                <ArrowRight size={15} />
              </button>
            </form>
          ) : (
            /* ========================================================= */
            /* 2. FORGOT / CHANGE PASSWORD FORM                          */
            /* ========================================================= */
            <form onSubmit={handleResetSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                <div style={{ display: 'inline-flex', padding: '0.65rem', backgroundColor: '#F4ECE1', borderRadius: '50%', color: '#B88D4A', marginBottom: '0.45rem' }}>
                  <KeyRound size={22} />
                </div>
                <h3 style={{ fontSize: '1rem', color: '#4B3024', fontWeight: 600, margin: 0 }}>Reset CRM Password</h3>
                <p style={{ fontSize: '0.76rem', color: '#8F7263', marginTop: '0.25rem', marginBottom: 0 }}>
                  Enter your username and choose your new password.
                </p>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#4B3024', marginBottom: '0.4rem' }}>
                  Username
                </label>
                <input
                  type="text"
                  value={resetUsername}
                  onChange={(e) => setResetUsername(e.target.value)}
                  placeholder="Enter username"
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

              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#4B3024', marginBottom: '0.4rem' }}>
                  New Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                    style={{
                      width: '100%',
                      padding: '0.7rem 2.4rem 0.7rem 0.9rem',
                      border: '1px solid rgba(75, 48, 36, 0.22)',
                      borderRadius: '3px',
                      fontSize: '0.86rem',
                      color: '#4B3024',
                      outline: 'none',
                      backgroundColor: '#FFFDF9',
                      boxSizing: 'border-box'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
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
                    {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#4B3024', marginBottom: '0.4rem' }}>
                  Confirm New Password
                </label>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
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
                disabled={isLoading}
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
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.7 : 1,
                  marginTop: '0.35rem',
                  transition: 'background 0.2s'
                }}
              >
                <span>{isLoading ? 'Updating in Database...' : 'Save New Password'}</span>
              </button>

              <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotMode(false);
                    setError('');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '0.76rem',
                    color: '#8F7263',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Return to Login
                </button>
              </div>
            </form>
          )}

          {/* Return to Storefront */}
          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <button
              onClick={onBackToStore}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: 'none',
                border: 'none',
                color: '#8F7263',
                fontSize: '0.78rem',
                cursor: 'pointer'
              }}
            >
              <ArrowLeft size={13} />
              <span>Back to Public Storefront</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
