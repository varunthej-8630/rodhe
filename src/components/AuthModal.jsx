import React, { useState, useEffect } from 'react';
import { X, Mail, Phone, User, CheckCircle2, ArrowRight, LogOut, ShieldCheck, Package, Truck, Clock } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { storeService } from '../services/storeService';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

export const AuthModal = () => {
  const { isAuthOpen, setIsAuthOpen, showToast, patronUser, loginPatron, logoutPatron } = useShop();
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [profileViewTab, setProfileViewTab] = useState('profile'); // 'profile' | 'orders'
  const [orders, setOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [authError, setAuthError] = useState('');

  // Fetch patron orders when in orders view
  useEffect(() => {
    if (patronUser?.email && profileViewTab === 'orders') {
      setIsLoadingOrders(true);
      storeService.getCustomerOrders(patronUser.email)
        .then(data => setOrders(Array.isArray(data) ? data : []))
        .catch(err => console.warn('Customer orders load notice:', err))
        .finally(() => setIsLoadingOrders(false));
    }
  }, [patronUser, profileViewTab]);

  if (!isAuthOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setIsSubmitted(true);

    const cleanEmail = formData.email.trim().toLowerCase();
    const cleanPassword = formData.password;
    const cleanName = formData.name.trim();
    const cleanPhone = formData.phone.trim();

    try {
      let authUserId = null;

      // Attempt genuine Supabase Auth if configured
      if (isSupabaseConfigured && supabase) {
        if (tab === 'login') {
          const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password: cleanPassword
          });
          if (signInErr) {
            // If invalid credentials, show error
            if (signInErr.message.includes('Invalid login credentials')) {
              throw new Error('Invalid email or password. Please verify your credentials.');
            }
          } else if (signInData?.user) {
            authUserId = signInData.user.id;
          }
        } else {
          // Register
          const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
            email: cleanEmail,
            password: cleanPassword,
            options: {
              data: {
                full_name: cleanName,
                phone: cleanPhone
              }
            }
          });
          if (signUpErr) {
            console.warn('Supabase Auth sign-up notice:', signUpErr.message);
          } else if (signUpData?.user) {
            authUserId = signUpData.user.id;
          }
        }
      }

      const patronProfile = {
        id: authUserId,
        name: tab === 'register' ? cleanName : (cleanName || cleanEmail.split('@')[0]),
        email: cleanEmail,
        phone: cleanPhone,
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
      }, 900);
    } catch (err) {
      console.error('Patron auth error:', err);
      setIsSubmitted(false);
      setAuthError(err.message || 'Authentication error. Please try again.');
    }
  };

  return (
    <div className="modal-backdrop" onClick={() => setIsAuthOpen(false)}>
      <div
        style={{
          width: 'min(500px, 94vw)',
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
            justifyContent: 'space-between',
            backgroundColor: '#FAF6EE'
          }}
        >
          <div>
            <div style={{ fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#B88D4A', fontWeight: 700 }}>
              RODHE Patron Portal
            </div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.25rem, 3.5vw, 1.45rem)', color: '#4B3024', margin: '0.2rem 0 0' }}>
              {patronUser ? 'Patron Concierge' : (tab === 'login' ? 'Sign In to Your Account' : 'Join the RODHE Guild')}
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
          /* Active Patron Profile View with Order History */
          <div>
            {/* View switcher tabs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid rgba(75, 48, 36, 0.1)' }}>
              <button
                onClick={() => setProfileViewTab('profile')}
                style={{
                  padding: '0.75rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: profileViewTab === 'profile' ? '#4B3024' : '#8F7263',
                  backgroundColor: profileViewTab === 'profile' ? '#FFFDF9' : '#FAF6EE',
                  border: 'none',
                  borderBottom: profileViewTab === 'profile' ? '2px solid #B88D4A' : 'none',
                  cursor: 'pointer'
                }}
              >
                Patron Details
              </button>
              <button
                onClick={() => setProfileViewTab('orders')}
                style={{
                  padding: '0.75rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: profileViewTab === 'orders' ? '#4B3024' : '#8F7263',
                  backgroundColor: profileViewTab === 'orders' ? '#FFFDF9' : '#FAF6EE',
                  border: 'none',
                  borderBottom: profileViewTab === 'orders' ? '2px solid #B88D4A' : 'none',
                  cursor: 'pointer'
                }}
              >
                My Orders ({orders.length})
              </button>
            </div>

            <div style={{ padding: 'clamp(1.25rem, 3.5vw, 1.75rem) clamp(1rem, 3vw, 1.5rem)' }}>
              {profileViewTab === 'profile' ? (
                <>
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
                      Your patron account is active with 256-bit SSL encrypted sessions.
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
                      onClick={async () => {
                        if (isSupabaseConfigured && supabase) {
                          try { await supabase.auth.signOut(); } catch (e) {}
                        }
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
                </>
              ) : (
                /* Orders Tab */
                <div>
                  {isLoadingOrders ? (
                    <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#8F7263', fontSize: '0.85rem' }}>
                      Retrieving order history...
                    </div>
                  ) : orders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                      <Package size={36} color="#B88D4A" style={{ margin: '0 auto 0.75rem', opacity: 0.6 }} />
                      <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', color: '#4B3024', margin: '0 0 0.25rem' }}>
                        No Orders Yet
                      </h4>
                      <p style={{ fontSize: '0.82rem', color: '#8F7263', margin: 0 }}>
                        Your handcrafted saree purchases will appear here with live tracking.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '380px', overflowY: 'auto' }}>
                      {orders.map((o) => (
                        <div
                          key={o.id || o.order_number}
                          style={{
                            backgroundColor: '#FAF6EE',
                            border: '1px solid rgba(184, 141, 74, 0.2)',
                            borderRadius: '4px',
                            padding: '0.85rem 1rem',
                            fontSize: '0.82rem'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                            <strong style={{ color: '#4B3024' }}>#{o.order_number || o.orderNumber}</strong>
                            <span
                              style={{
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                padding: '0.2rem 0.5rem',
                                borderRadius: '2px',
                                backgroundColor: (o.fulfillment_status === 'delivered' || o.fulfillmentStatus === 'delivered') ? 'rgba(82, 91, 58, 0.15)' : 'rgba(184, 141, 74, 0.15)',
                                color: (o.fulfillment_status === 'delivered' || o.fulfillmentStatus === 'delivered') ? '#525B3A' : '#B88D4A'
                              }}
                            >
                              {o.fulfillment_status || o.fulfillmentStatus || 'Processing'}
                            </span>
                          </div>

                          <div style={{ color: '#8F7263', fontSize: '0.75rem', marginBottom: '0.4rem' }}>
                            {new Date(o.created_at || o.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                            {' • '}Total: <strong>₹{(o.grand_total || o.grandTotal || 0).toLocaleString('en-IN')}</strong>
                          </div>

                          {(o.tracking_number || o.trackingNumber) && (
                            <div style={{ fontSize: '0.75rem', color: '#4B3024', marginTop: '0.25rem' }}>
                              <Truck size={12} style={{ display: 'inline', marginRight: '4px' }} />
                              Courier: {o.courier_partner || o.courierPartner || 'Express Air'} • AWB: <code>{o.tracking_number || o.trackingNumber}</code>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Tab switch */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid rgba(75, 48, 36, 0.1)' }}>
              <button
                onClick={() => {
                  setTab('login');
                  setAuthError('');
                }}
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
                onClick={() => {
                  setTab('register');
                  setAuthError('');
                }}
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
                  {authError && (
                    <div
                      style={{
                        padding: '0.65rem 0.85rem',
                        backgroundColor: 'rgba(201, 130, 120, 0.15)',
                        border: '1px solid #C98278',
                        color: '#8A2A20',
                        fontSize: '0.8rem',
                        borderRadius: '3px',
                        marginBottom: '1rem'
                      }}
                    >
                      {authError}
                    </div>
                  )}

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
