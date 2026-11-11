import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Phone,
  CheckCircle2,
  ArrowRight,
  LogOut,
  ShieldCheck,
  Package,
  Truck,
  MapPin,
  Edit2,
  Plus,
  Trash2,
  Star,
  AlertCircle
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { storeService } from '../services/storeService';
import {
  customerService,
  lookupIndianPincodeInfo,
  isValidIndianPhone,
  isValidIndianPincode
} from '../services/customerService';
import {
  PAYMENT_STATUS,
  formatPaymentMethodLabel,
  getPaymentStatusMeta,
  normalizePaymentStatus
} from '../config/upiConfig';

const EMPTY_ADDRESS_FORM = {
  id: null,
  label: 'Home',
  recipientName: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  landmark: '',
  pincode: '',
  city: '',
  state: '',
  isDefault: false
};

export const AuthModal = () => {
  const {
    isAuthOpen,
    setIsAuthOpen,
    showToast,
    patronUser,
    customerAddresses,
    signInCustomer,
    signUpCustomer,
    logoutPatron,
    updateCustomerProfile,
    saveCustomerAddress,
    setDefaultCustomerAddress,
    deleteCustomerAddress,
    openPendingUpiOrder
  } = useShop();

  const [tab, setTab] = useState('login'); // 'login' | 'register' | 'forgot'
  const [profileViewTab, setProfileViewTab] = useState('profile'); // 'profile' | 'addresses' | 'orders'
  const [orders, setOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  // Auth Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authInfoMessage, setAuthInfoMessage] = useState('');

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileDraft, setProfileDraft] = useState({ name: '', phone: '' });
  const [profileError, setProfileError] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Address Form State
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressDraft, setAddressDraft] = useState(EMPTY_ADDRESS_FORM);
  const [addressError, setAddressError] = useState('');
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [lastAutoFillPin, setLastAutoFillPin] = useState('');

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isAuthOpen) {
        setIsAuthOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthOpen, setIsAuthOpen]);

  // Reset transient edit states when modal opens cleanly
  useEffect(() => {
    if (isAuthOpen && patronUser) {
      setProfileDraft({
        name: patronUser.name || '',
        phone: patronUser.phone || ''
      });
      setIsEditingProfile(false);
      setIsEditingAddress(false);
      setProfileError('');
      setAddressError('');
      setConfirmDeleteId(null);
    }
  }, [isAuthOpen, patronUser]);

  // Fetch customer orders when in orders tab
  useEffect(() => {
    if (isAuthOpen && patronUser?.email && profileViewTab === 'orders') {
      setIsLoadingOrders(true);
      storeService
        .getCustomerOrders(patronUser.email)
        .then((data) => setOrders(Array.isArray(data) ? data : []))
        .catch(() => setOrders([]))
        .finally(() => setIsLoadingOrders(false));
    }
  }, [isAuthOpen, patronUser, profileViewTab]);

  if (!isAuthOpen) return null;

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthInfoMessage('');
    setIsSubmittingAuth(true);

    try {
      if (tab === 'forgot') {
        await customerService.requestPasswordReset(formData.email);
        setAuthInfoMessage('Password reset instructions have been sent to your registered email.');
      } else if (tab === 'login') {
        const result = await signInCustomer(formData.email, formData.password);
        showToast(`Welcome back, ${result?.user?.name || 'Patron'}!`);
        setFormData({ name: '', email: '', phone: '', password: '' });
      } else {
        const res = await signUpCustomer({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password
        });
        if (res.requiresEmailConfirmation) {
          setAuthInfoMessage(
            `Confirmation link sent to ${res.email}. Please verify your email and sign in to manage your saved addresses.`
          );
          setTab('login');
        } else {
          showToast(`Welcome to RODHE, ${res.customer?.user?.name || 'Patron'}!`);
          setFormData({ name: '', email: '', phone: '', password: '' });
        }
      }
    } catch (err) {
      setAuthError(err.message || 'Authentication error. Please check your details and try again.');
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileError('');
    const cleanName = profileDraft.name.trim();
    const cleanPhone = profileDraft.phone.replace(/\D/g, '').slice(0, 10);

    if (cleanName.length < 2) {
      setProfileError('Please enter your full name.');
      return;
    }
    if (cleanPhone && !isValidIndianPhone(cleanPhone)) {
      setProfileError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    setIsSavingProfile(true);
    try {
      await updateCustomerProfile({ name: cleanName, phone: cleanPhone });
      setIsEditingProfile(false);
    } catch (err) {
      setProfileError(err.message || 'Unable to save profile details right now.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const openAddressForm = (existingAddr = null) => {
    setAddressError('');
    setConfirmDeleteId(null);
    if (existingAddr) {
      setAddressDraft({
        id: existingAddr.id,
        label: existingAddr.label || 'Home',
        recipientName: existingAddr.recipientName || patronUser?.name || '',
        phone: existingAddr.phone || patronUser?.phone || '',
        addressLine1: existingAddr.addressLine1 || '',
        addressLine2: existingAddr.addressLine2 || '',
        landmark: existingAddr.landmark || '',
        pincode: existingAddr.pincode || '',
        city: existingAddr.city || '',
        state: existingAddr.state || '',
        isDefault: Boolean(existingAddr.isDefault)
      });
    } else {
      setAddressDraft({
        ...EMPTY_ADDRESS_FORM,
        recipientName: patronUser?.name || '',
        phone: patronUser?.phone || '',
        isDefault: customerAddresses.length === 0
      });
    }
    setIsEditingAddress(true);
  };

  const handleAddressPincodeChange = (rawValue) => {
    const cleanPin = rawValue.replace(/\D/g, '').slice(0, 6);
    const info = lookupIndianPincodeInfo(cleanPin);
    setAddressDraft((prev) => {
      const next = { ...prev, pincode: cleanPin };
      if (info && (!prev.city || prev.pincode === lastAutoFillPin || cleanPin.length >= 3)) {
        if (!prev.city || prev.city === lookupIndianPincodeInfo(lastAutoFillPin)?.city) {
          next.city = info.city;
        }
        if (!prev.state || prev.state === lookupIndianPincodeInfo(lastAutoFillPin)?.state) {
          next.state = info.state;
        }
      }
      return next;
    });
    if (info) setLastAutoFillPin(cleanPin);
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setAddressError('');

    if (!isValidIndianPincode(addressDraft.pincode)) {
      setAddressError('Please enter a valid 6-digit Indian PIN code.');
      return;
    }
    if (!isValidIndianPhone(addressDraft.phone)) {
      setAddressError('Please enter a valid 10-digit recipient mobile number.');
      return;
    }

    setIsSavingAddress(true);
    try {
      await saveCustomerAddress(addressDraft);
      setIsEditingAddress(false);
    } catch (err) {
      setAddressError(err.message || 'Unable to save delivery address. Please verify fields and retry.');
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleConfirmDeleteAddress = async (addressId) => {
    try {
      await deleteCustomerAddress(addressId);
      setConfirmDeleteId(null);
    } catch (err) {
      showToast(err.message || 'Could not remove address.', 'error');
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={() => setIsAuthOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Customer Account"
    >
      <div
        style={{
          width: 'min(560px, 100%)',
          maxWidth: '100%',
          backgroundColor: '#FFFDF9',
          border: '1px solid rgba(184, 141, 74, 0.3)',
          boxShadow: '0 25px 60px rgba(42, 26, 19, 0.25)',
          overflowY: 'auto',
          overflowX: 'hidden',
          maxHeight: '92dvh',
          animation: 'slideUp 0.28s ease'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.15rem clamp(1rem, 3vw, 1.5rem)',
            borderBottom: '1px solid rgba(75, 48, 36, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#FAF6EE',
            position: 'sticky',
            top: 0,
            zIndex: 5
          }}
        >
          <div>
            <div style={{ fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#B88D4A', fontWeight: 700 }}>
              RODHE Customer Account
            </div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.25rem, 3.5vw, 1.45rem)', color: '#4B3024', margin: '0.2rem 0 0' }}>
              {patronUser
                ? 'My Profile & Delivery Book'
                : tab === 'login'
                ? 'Sign In to Your Account'
                : tab === 'register'
                ? 'Create Customer Account'
                : 'Reset Password'}
            </h3>
          </div>
          <button
            onClick={() => setIsAuthOpen(false)}
            aria-label="Close account modal"
            style={{ color: '#8F7263', padding: '0.35rem', background: 'none', border: 'none', cursor: 'pointer', minWidth: '36px', minHeight: '36px' }}
          >
            <X size={20} />
          </button>
        </div>

        {patronUser ? (
          <div>
            {/* Signed-In Navigation Tabs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', borderBottom: '1px solid rgba(75, 48, 36, 0.1)' }}>
              {[
                { id: 'profile', label: 'Details' },
                { id: 'addresses', label: `Addresses (${customerAddresses.length})` },
                { id: 'orders', label: 'My Orders' }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setProfileViewTab(t.id);
                    setIsEditingAddress(false);
                  }}
                  style={{
                    padding: '0.78rem 0.45rem',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: profileViewTab === t.id ? '#4B3024' : '#8F7263',
                    backgroundColor: profileViewTab === t.id ? '#FFFDF9' : '#FAF6EE',
                    border: 'none',
                    borderBottom: profileViewTab === t.id ? '2px solid #B88D4A' : 'none',
                    cursor: 'pointer'
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div style={{ padding: 'clamp(1.15rem, 3.5vw, 1.65rem)' }}>
              {/* TAB 1: PROFILE DETAILS */}
              {profileViewTab === 'profile' && (
                <div>
                  {isEditingProfile ? (
                    <form onSubmit={handleSaveProfile}>
                      {profileError && (
                        <div style={{ padding: '0.65rem 0.85rem', backgroundColor: 'rgba(201, 130, 120, 0.15)', border: '1px solid #C98278', color: '#8A2A20', fontSize: '0.8rem', borderRadius: '3px', marginBottom: '1rem' }}>
                          {profileError}
                        </div>
                      )}
                      <div className="form-group">
                        <label className="form-label">Full Name *</label>
                        <input
                          type="text"
                          required
                          className="form-input"
                          value={profileDraft.name}
                          onChange={(e) => setProfileDraft({ ...profileDraft, name: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Mobile / WhatsApp Number (10 digits)</label>
                        <input
                          type="tel"
                          inputMode="numeric"
                          className="form-input"
                          placeholder="10-digit mobile number"
                          value={profileDraft.phone}
                          onChange={(e) => setProfileDraft({ ...profileDraft, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '0.65rem', marginTop: '0.75rem' }}>
                        <button type="submit" disabled={isSavingProfile} className="btn btn-primary" style={{ flex: 1 }}>
                          {isSavingProfile ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditingProfile(false)}
                          className="btn btn-outline"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.85rem', marginBottom: '1.35rem', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
                              fontFamily: 'var(--font-serif)',
                              flexShrink: 0
                            }}
                          >
                            {patronUser.name ? patronUser.name.charAt(0).toUpperCase() : 'P'}
                          </div>
                          <div>
                            <h4 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: '1.2rem', color: '#4B3024' }}>
                              {patronUser.name || 'Valued Customer'}
                            </h4>
                            <div style={{ fontSize: '0.82rem', color: '#8F7263', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
                              <Mail size={13} />
                              <span>{patronUser.email}</span>
                            </div>
                            {patronUser.phone && (
                              <div style={{ fontSize: '0.82rem', color: '#8F7263', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.15rem' }}>
                                <Phone size={13} />
                                <span>+91 {patronUser.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setProfileDraft({ name: patronUser.name || '', phone: patronUser.phone || '' });
                            setIsEditingProfile(true);
                          }}
                          className="btn btn-outline btn-sm"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                        >
                          <Edit2 size={13} />
                          <span>Edit Details</span>
                        </button>
                      </div>

                      {/* Quick Preview of Preferred Address + Edit Shortcut */}
                      <div
                        style={{
                          backgroundColor: '#FAF6EE',
                          border: '1px solid rgba(184, 141, 74, 0.25)',
                          padding: '1rem',
                          marginBottom: '1.25rem'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                          <span style={{ fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#B88D4A', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                            <MapPin size={13} />
                            Default Delivery Address
                          </span>
                          <button
                            onClick={() => {
                              const def = customerAddresses.find((a) => a.isDefault) || customerAddresses[0];
                              setProfileViewTab('addresses');
                              openAddressForm(def || null);
                            }}
                            style={{ fontSize: '0.74rem', fontWeight: 600, color: '#4B3024', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
                          >
                            {customerAddresses.length > 0 ? 'Edit Address' : 'Add Address'}
                          </button>
                        </div>

                        {customerAddresses.length > 0 ? (
                          (() => {
                            const def = customerAddresses.find((a) => a.isDefault) || customerAddresses[0];
                            return (
                              <div style={{ fontSize: '0.84rem', color: '#4B3024', lineHeight: 1.5 }}>
                                <strong>{def.recipientName}</strong> (+91 {def.phone})<br />
                                {def.addressLine1}
                                {def.addressLine2 ? `, ${def.addressLine2}` : ''}
                                {def.landmark ? ` • Landmark: ${def.landmark}` : ''}<br />
                                {def.city}, {def.state} — {def.pincode}
                              </div>
                            );
                          })()
                        ) : (
                          <div style={{ fontSize: '0.82rem', color: '#8F7263' }}>
                            No saved delivery address yet. Add an address for faster checkout.
                          </div>
                        )}
                      </div>

                      <div
                        style={{
                          backgroundColor: '#F4ECE1',
                          padding: '0.75rem 1rem',
                          marginBottom: '1.35rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.65rem',
                          fontSize: '0.78rem',
                          color: '#4B3024'
                        }}
                      >
                        <ShieldCheck size={17} color="#B88D4A" style={{ flexShrink: 0 }} />
                        <span>Signed in securely. Your addresses are private to your account.</span>
                      </div>

                      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => setIsAuthOpen(false)}
                          className="btn btn-primary"
                          style={{ flex: '1 1 min(100%, 160px)', padding: '0.75rem', minWidth: 0 }}
                        >
                          <span>Continue Shopping</span>
                          <ArrowRight size={15} />
                        </button>
                        <button
                          onClick={async () => {
                            await logoutPatron();
                            setIsAuthOpen(false);
                          }}
                          className="btn btn-outline"
                          style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#8A2A20', borderColor: 'rgba(138, 42, 32, 0.35)' }}
                        >
                          <LogOut size={15} />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* TAB 2: SAVED ADDRESSES (View, Add, Edit Address, Set Default, Delete) */}
              {profileViewTab === 'addresses' && (
                <div>
                  {isEditingAddress ? (
                    <form onSubmit={handleSaveAddress}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <h4 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: '1.2rem', color: '#4B3024' }}>
                          {addressDraft.id ? 'Edit Delivery Address' : 'Add New Delivery Address'}
                        </h4>
                        <button
                          type="button"
                          onClick={() => setIsEditingAddress(false)}
                          style={{ fontSize: '0.78rem', color: '#8F7263', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          Back to list
                        </button>
                      </div>

                      {addressError && (
                        <div style={{ padding: '0.7rem 0.9rem', backgroundColor: 'rgba(201, 130, 120, 0.15)', border: '1px solid #C98278', color: '#8A2A20', fontSize: '0.8rem', borderRadius: '3px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <AlertCircle size={15} style={{ flexShrink: 0 }} />
                          <span>{addressError}</span>
                        </div>
                      )}

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '0.75rem' }}>
                        <div className="form-group">
                          <label className="form-label">Address Label</label>
                          <select
                            className="form-input"
                            value={addressDraft.label}
                            onChange={(e) => setAddressDraft({ ...addressDraft, label: e.target.value })}
                          >
                            <option value="Home">Home</option>
                            <option value="Work">Work</option>
                            <option value="Family">Family</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label className="form-label">Recipient Full Name *</label>
                          <input
                            type="text"
                            required
                            className="form-input"
                            placeholder="Full name"
                            value={addressDraft.recipientName}
                            onChange={(e) => setAddressDraft({ ...addressDraft, recipientName: e.target.value })}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '0.75rem' }}>
                        <div className="form-group">
                          <label className="form-label">Mobile Number *</label>
                          <input
                            type="tel"
                            required
                            inputMode="numeric"
                            className="form-input"
                            placeholder="10-digit mobile number"
                            value={addressDraft.phone}
                            onChange={(e) => setAddressDraft({ ...addressDraft, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label">6-Digit PIN Code *</label>
                          <input
                            type="text"
                            required
                            inputMode="numeric"
                            maxLength={6}
                            className="form-input"
                            placeholder="e.g. 560001"
                            value={addressDraft.pincode}
                            onChange={(e) => handleAddressPincodeChange(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label">House / Flat No., Building *</label>
                        <input
                          type="text"
                          required
                          className="form-input"
                          placeholder="e.g. Flat 402, Heritage Enclave"
                          value={addressDraft.addressLine1}
                          onChange={(e) => setAddressDraft({ ...addressDraft, addressLine1: e.target.value })}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '0.75rem' }}>
                        <div className="form-group">
                          <label className="form-label">Street / Area / Locality</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. Lavelle Road"
                            value={addressDraft.addressLine2}
                            onChange={(e) => setAddressDraft({ ...addressDraft, addressLine2: e.target.value })}
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label">Landmark (Optional)</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. Near Park Gate"
                            value={addressDraft.landmark}
                            onChange={(e) => setAddressDraft({ ...addressDraft, landmark: e.target.value })}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '0.75rem' }}>
                        <div className="form-group">
                          <label className="form-label">City *</label>
                          <input
                            type="text"
                            required
                            className="form-input"
                            placeholder="City / Town"
                            value={addressDraft.city}
                            onChange={(e) => setAddressDraft({ ...addressDraft, city: e.target.value })}
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label">State *</label>
                          <input
                            type="text"
                            required
                            className="form-input"
                            placeholder="State"
                            value={addressDraft.state}
                            onChange={(e) => setAddressDraft({ ...addressDraft, state: e.target.value })}
                          />
                        </div>
                      </div>

                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.84rem', color: '#4B3024', marginBottom: '1rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={addressDraft.isDefault}
                          onChange={(e) => setAddressDraft({ ...addressDraft, isDefault: e.target.checked })}
                          style={{ accentColor: '#B88D4A' }}
                        />
                        <span>Set as my preferred default delivery address</span>
                      </label>

                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button type="submit" disabled={isSavingAddress} className="btn btn-primary" style={{ flex: 1 }}>
                          {isSavingAddress ? 'Saving Address...' : 'Save Delivery Address'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditingAddress(false)}
                          className="btn btn-outline"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.84rem', color: '#6F4E3E' }}>
                          {customerAddresses.length === 0
                            ? 'Add an address to pre-fill future checkouts.'
                            : 'Select a preferred address or edit any saved destination.'}
                        </span>
                        <button
                          onClick={() => openAddressForm(null)}
                          className="btn btn-primary btn-sm"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                        >
                          <Plus size={14} />
                          <span>Add New Address</span>
                        </button>
                      </div>

                      {customerAddresses.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem 1rem', backgroundColor: '#FAF6EE', border: '1px solid rgba(184, 141, 74, 0.2)' }}>
                          <MapPin size={30} color="#B88D4A" style={{ margin: '0 auto 0.75rem', opacity: 0.7 }} />
                          <p style={{ fontSize: '0.85rem', color: '#8F7263', marginBottom: '1rem' }}>
                            No saved delivery addresses on your account yet.
                          </p>
                          <button onClick={() => openAddressForm(null)} className="btn btn-outline btn-sm">
                            Add Delivery Address
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                          {customerAddresses.map((addr) => (
                            <div
                              key={addr.id}
                              style={{
                                padding: '1rem',
                                backgroundColor: addr.isDefault ? '#FAF6EE' : '#FFFFFF',
                                border: addr.isDefault ? '1.5px solid #B88D4A' : '1px solid rgba(75, 48, 36, 0.14)',
                                borderRadius: '3px'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0.15rem 0.45rem', backgroundColor: '#EADAB5', color: '#4B3024' }}>
                                    {addr.label || 'Home'}
                                  </span>
                                  {addr.isDefault && (
                                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#525B3A', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                      <Star size={12} fill="#525B3A" />
                                      Preferred Default
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div style={{ fontSize: '0.86rem', color: '#4B3024', lineHeight: 1.5, marginBottom: '0.75rem' }}>
                                <strong>{addr.recipientName}</strong> • +91 {addr.phone}<br />
                                {addr.addressLine1}
                                {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                                {addr.landmark ? ` (Landmark: ${addr.landmark})` : ''}<br />
                                {addr.city}, {addr.state} — <strong>{addr.pincode}</strong>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap', borderTop: '1px solid rgba(75, 48, 36, 0.08)', paddingTop: '0.65rem' }}>
                                <button
                                  onClick={() => openAddressForm(addr)}
                                  className="btn btn-outline btn-sm"
                                  style={{ minHeight: '34px', padding: '0.3rem 0.75rem' }}
                                >
                                  <Edit2 size={12} />
                                  <span>Edit Address</span>
                                </button>

                                {!addr.isDefault && (
                                  <button
                                    onClick={() => setDefaultCustomerAddress(addr.id)}
                                    style={{ fontSize: '0.75rem', fontWeight: 600, color: '#B88D4A', background: 'none', border: 'none', cursor: 'pointer', padding: '0.3rem' }}
                                  >
                                    Set as Default
                                  </button>
                                )}

                                {confirmDeleteId === addr.id ? (
                                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                    <button
                                      onClick={() => handleConfirmDeleteAddress(addr.id)}
                                      style={{ fontSize: '0.74rem', fontWeight: 700, color: '#8A2A20', background: 'rgba(201, 130, 120, 0.2)', border: '1px solid #C98278', padding: '0.25rem 0.6rem', cursor: 'pointer' }}
                                    >
                                      Confirm Remove
                                    </button>
                                    <button
                                      onClick={() => setConfirmDeleteId(null)}
                                      style={{ fontSize: '0.74rem', color: '#8F7263', background: 'none', border: 'none', cursor: 'pointer' }}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setConfirmDeleteId(addr.id)}
                                    aria-label="Remove saved address"
                                    style={{ marginLeft: 'auto', color: '#8F7263', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: 'none', border: 'none', cursor: 'pointer', padding: '0.3rem' }}
                                  >
                                    <Trash2 size={13} />
                                    <span>Remove</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: MY ORDERS */}
              {profileViewTab === 'orders' && (
                <div>
                  {isLoadingOrders ? (
                    <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#8F7263', fontSize: '0.85rem' }}>
                      Checking order records...
                    </div>
                  ) : orders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                      <Package size={36} color="#B88D4A" style={{ margin: '0 auto 0.75rem', opacity: 0.65 }} />
                      <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.18rem', color: '#4B3024', margin: '0 0 0.35rem' }}>
                        No Recorded Online Orders Yet
                      </h4>
                      <p style={{ fontSize: '0.82rem', color: '#8F7263', lineHeight: 1.55, maxWidth: '340px', margin: '0 auto' }}>
                        Orders initiated on WhatsApp are coordinated directly with our concierge (+91 9490658858). Dispatch updates will appear here once recorded by the atelier.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '380px', overflowY: 'auto' }}>
                      {orders.map((o) => {
                        const pStatus = normalizePaymentStatus(o.payment_status || o.paymentStatus);
                        const pMeta = getPaymentStatusMeta(pStatus);
                        const canResumeUpi = [
                          PAYMENT_STATUS.CREATED,
                          PAYMENT_STATUS.PENDING,
                          PAYMENT_STATUS.FAILED,
                          PAYMENT_STATUS.EXPIRED
                        ].includes(pStatus);
                        const utr = o.utr_reference || o.utrReference || '';
                        return (
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
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.35rem' }}>
                              <strong style={{ color: '#4B3024' }}>#{o.order_number || o.orderNumber}</strong>
                              <span
                                style={{
                                  fontSize: '0.68rem',
                                  fontWeight: 700,
                                  textTransform: 'uppercase',
                                  padding: '0.2rem 0.5rem',
                                  borderRadius: '2px',
                                  backgroundColor: pMeta.bg,
                                  color: pMeta.color,
                                  border: `1px solid ${pMeta.border}`
                                }}
                              >
                                {pMeta.shortLabel}
                              </span>
                            </div>
                            <div style={{ color: '#8F7263', fontSize: '0.75rem', marginBottom: '0.35rem' }}>
                              {new Date(o.created_at || o.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                              {' • '}Total: <strong>₹{(o.grand_total || o.grandTotal || 0).toLocaleString('en-IN')}</strong>
                              {' • '}{formatPaymentMethodLabel(o.payment_method || o.paymentMethod)}
                            </div>
                            {utr && (
                              <div style={{ fontSize: '0.74rem', color: '#4B3024', marginBottom: '0.35rem' }}>
                                UTR Ref: <code>{utr}</code>
                              </div>
                            )}
                            {(o.tracking_number || o.trackingNumber) && (
                              <div style={{ fontSize: '0.75rem', color: '#4B3024', marginTop: '0.25rem' }}>
                                <Truck size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                Courier: {o.courier_partner || o.courierPartner || 'Express Air'} • AWB: <code>{o.tracking_number || o.trackingNumber}</code>
                              </div>
                            )}
                            {canResumeUpi && (
                              <div style={{ marginTop: '0.5rem' }}>
                                <button
                                  type="button"
                                  onClick={() => openPendingUpiOrder({
                                    orderId: o.id,
                                    orderNumber: o.order_number || o.orderNumber,
                                    grandTotal: o.grand_total || o.grandTotal,
                                    paymentMethod: o.payment_method || o.paymentMethod,
                                    paymentStatus: pStatus,
                                    paymentExpiresAt: o.payment_expires_at || o.paymentExpiresAt,
                                    utrReference: utr,
                                    contact: patronUser?.email || patronUser?.phone || ''
                                  })}
                                  className="btn btn-primary btn-sm"
                                  style={{ fontSize: '0.7rem', padding: '0.35rem 0.7rem', minHeight: '32px' }}
                                >
                                  Complete / Resume UPI Payment
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Unauthenticated Sign In / Register / Password Reset */
          <>
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
                  color: tab !== 'register' ? '#4B3024' : '#8F7263',
                  backgroundColor: tab !== 'register' ? '#FAF6EE' : 'transparent',
                  border: 'none',
                  borderBottom: tab !== 'register' ? '2px solid #B88D4A' : 'none',
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
                Create Account
              </button>
            </div>

            <div style={{ padding: 'clamp(1.25rem, 3.5vw, 1.75rem) clamp(1rem, 3vw, 1.5rem)' }}>
              {authInfoMessage && (
                <div
                  style={{
                    padding: '0.8rem 0.95rem',
                    backgroundColor: 'rgba(82, 91, 58, 0.1)',
                    border: '1px solid #525B3A',
                    color: '#3E462B',
                    fontSize: '0.82rem',
                    borderRadius: '3px',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.5rem'
                  }}
                >
                  <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>{authInfoMessage}</span>
                </div>
              )}

              {authError && (
                <div
                  style={{
                    padding: '0.75rem 0.9rem',
                    backgroundColor: 'rgba(201, 130, 120, 0.15)',
                    border: '1px solid #C98278',
                    color: '#8A2A20',
                    fontSize: '0.8rem',
                    borderRadius: '3px',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <AlertCircle size={15} style={{ flexShrink: 0 }} />
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={handleAuthSubmit}>
                {tab === 'register' && (
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
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
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    className="form-input"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                {tab === 'register' && (
                  <div className="form-group">
                    <label className="form-label">WhatsApp Mobile Number *</label>
                    <input
                      type="tel"
                      required
                      inputMode="numeric"
                      autoComplete="tel"
                      className="form-input"
                      placeholder="10-digit mobile number"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    />
                  </div>
                )}

                {tab !== 'forgot' && (
                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <label className="form-label" style={{ marginBottom: 0 }}>Password *</label>
                      {tab === 'login' && (
                        <button
                          type="button"
                          onClick={() => {
                            setTab('forgot');
                            setAuthError('');
                            setAuthInfoMessage('');
                          }}
                          style={{ fontSize: '0.75rem', color: '#B88D4A', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          Forgot Password?
                        </button>
                      )}
                    </div>
                    <input
                      type="password"
                      required
                      autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                      className="form-input"
                      placeholder={tab === 'register' ? 'At least 6 characters' : '••••••••'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmittingAuth}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '0.9rem', marginTop: '0.5rem', minHeight: '48px' }}
                >
                  <span>
                    {isSubmittingAuth
                      ? 'Please wait...'
                      : tab === 'login'
                      ? 'Sign In'
                      : tab === 'register'
                      ? 'Create Account'
                      : 'Send Password Reset Link'}
                  </span>
                  <ArrowRight size={15} />
                </button>

                {tab === 'forgot' && (
                  <button
                    type="button"
                    onClick={() => {
                      setTab('login');
                      setAuthError('');
                    }}
                    style={{ width: '100%', marginTop: '0.75rem', fontSize: '0.8rem', color: '#6F4E3E', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Back to Sign In
                  </button>
                )}

                <div style={{ marginTop: '1.15rem', textAlign: 'center', fontSize: '0.76rem', color: '#8F7263', lineHeight: 1.5 }}>
                  Sign in to save delivery addresses securely across visits and devices. Guest checkout is also available anytime without signing in.
                </div>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
