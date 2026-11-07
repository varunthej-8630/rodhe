import React, { useState } from 'react';
import { X, ShieldCheck, Truck, ArrowRight, ArrowLeft, MessageCircle, AlertCircle, ShoppingBag, Sparkles } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { storeService } from '../services/storeService';

export const CheckoutModal = () => {
  const {
    isCheckoutOpen,
    setIsCheckoutOpen,
    cart,
    subtotal,
    discountAmount,
    appliedCoupon,
    shippingFee,
    giftWrap,
    giftWrapFee,
    total,
    navigateTo,
    patronUser
  } = useShop();

  const [step, setStep] = useState(1); // 1: Contact, 2: Address, 3: Review & Send to WhatsApp, 4: Status Sent
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastWhatsAppUrl, setLastWhatsAppUrl] = useState('');
  const [orderError, setOrderError] = useState('');

  // Form State - dynamically populated from patron session if present
  const [formData, setFormData] = useState(() => {
    const patronNameParts = patronUser?.name ? patronUser.name.split(' ') : [];
    return {
      firstName: patronNameParts[0] || '',
      lastName: patronNameParts.slice(1).join(' ') || '',
      email: patronUser?.email || '',
      phone: patronUser?.phone || '',
      pincode: patronUser?.pincode || '',
      address: patronUser?.address || '',
      landmark: patronUser?.landmark || '',
      city: patronUser?.city || '',
      state: patronUser?.state || '',
      notes: ''
    };
  });

  if (!isCheckoutOpen) return null;

  const handlePincodeLookup = (pin) => {
    setFormData((prev) => ({ ...prev, pincode: pin }));
    // Intelligent auto-detection for common Indian metros
    if (pin.startsWith('560')) {
      setFormData((prev) => ({ ...prev, city: 'Bengaluru', state: 'Karnataka' }));
    } else if (pin.startsWith('110') || pin.startsWith('120')) {
      setFormData((prev) => ({ ...prev, city: 'New Delhi', state: 'Delhi' }));
    } else if (pin.startsWith('400')) {
      setFormData((prev) => ({ ...prev, city: 'Mumbai', state: 'Maharashtra' }));
    } else if (pin.startsWith('700')) {
      setFormData((prev) => ({ ...prev, city: 'Kolkata', state: 'West Bengal' }));
    } else if (pin.startsWith('600')) {
      setFormData((prev) => ({ ...prev, city: 'Chennai', state: 'Tamil Nadu' }));
    } else if (pin.startsWith('500')) {
      setFormData((prev) => ({ ...prev, city: 'Hyderabad', state: 'Telangana' }));
    }
  };

  const buildWhatsAppUrl = async () => {
    const settings = await storeService.getSettings();
    const phone = (settings?.whatsappNumber || '919490658858').replace(/[^0-9]/g, '');

    const itemsText = cart.map((item, idx) => {
      const p = item.product || item;
      const unit = Number(p.price ?? p.sellingPrice ?? p.selling_price ?? 990) || 990;
      const itemSubtotal = unit * item.quantity;
      return `${idx + 1}. ${p.name}\n   SKU: ${p.sku || 'RDH-SAR'}\n   Qty: ${item.quantity} × ₹${unit.toLocaleString('en-IN')} = ₹${itemSubtotal.toLocaleString('en-IN')}`;
    }).join('\n\n');

    let summaryText = `\n\n-------------------------\nBag Subtotal: ₹${subtotal.toLocaleString('en-IN')}`;
    if (discountAmount > 0) {
      summaryText += `\nCoupon (${appliedCoupon?.code}): -₹${discountAmount.toLocaleString('en-IN')}`;
    }
    if (giftWrap) {
      summaryText += `\nHeritage Gift Box: +₹${giftWrapFee}`;
    }
    summaryText += `\nShipping: ${shippingFee === 0 ? 'Complimentary (FREE)' : `₹${shippingFee}`}`;
    summaryText += `\nTotal Amount: ₹${total.toLocaleString('en-IN')}`;

    let patronText = '';
    const fullName = `${formData.firstName} ${formData.lastName}`.trim();
    if (fullName || formData.phone || formData.city) {
      patronText = `\n\nPatron Details:\n• Name: ${fullName || 'Patron'}\n• Contact / WhatsApp: ${formData.phone ? `+91 ${formData.phone}` : 'Provided in chat'}`;
      if (formData.city || formData.pincode) {
        patronText += `\n• Delivery Destination: ${formData.city || ''}, ${formData.state || ''}${formData.pincode ? ` - ${formData.pincode}` : ''}`;
      }
      if (formData.address) {
        patronText += `\n• Address: ${formData.address}${formData.landmark ? ` (Landmark: ${formData.landmark})` : ''}`;
      }
      if (formData.email) {
        patronText += `\n• Email for invoice: ${formData.email}`;
      }
      if (formData.notes) {
        patronText += `\n• Note to Atelier: ${formData.notes}`;
      }
    }

    const fullMessage = `Namaste RODHE Team,\n\nI would like to order the following handcrafted saree(s):\n\n${itemsText}${summaryText}${patronText}\n\nPlease confirm availability and share direct payment details (UPI / Bank Transfer) for dispatch. Thank you!`;

    const encoded = encodeURIComponent(fullMessage);
    return `https://wa.me/${phone}?text=${encoded}`;
  };

  const handleSendToWhatsApp = async () => {
    if (cart.length === 0) {
      setOrderError('Your shopping bag is empty. Please add a saree to proceed.');
      return;
    }

    setIsProcessing(true);
    setOrderError('');

    try {
      const url = await buildWhatsAppUrl();
      setLastWhatsAppUrl(url);

      // Save patron contact details locally for future visits
      try {
        const existingPatron = JSON.parse(localStorage.getItem('rodhe_patron_session') || '{}');
        const updatedPatron = {
          ...existingPatron,
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          landmark: formData.landmark,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode
        };
        localStorage.setItem('rodhe_patron_session', JSON.stringify(updatedPatron));
      } catch (e) {}

      // Open WhatsApp window (works across iOS, Android, and Desktop)
      const opened = window.open(url, '_blank');
      if (!opened) {
        // In case popups are blocked by browser, provide direct navigation fallback
        window.location.href = url;
      }

      // Transition to honest status screen (does NOT clear cart!)
      setStep(4);
    } catch (err) {
      console.error('Error generating WhatsApp concierge link:', err);
      setOrderError('Unable to open WhatsApp automatically. Please contact our concierge directly at +91 9490658858.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={() => (step === 4 ? setIsCheckoutOpen(false) : null)}>
      <div
        style={{
          width: 'min(980px, 95vw)',
          backgroundColor: '#FFFDF9',
          border: '1px solid rgba(184, 141, 74, 0.3)',
          boxShadow: '0 25px 60px rgba(42, 26, 19, 0.3)',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideUp 0.3s ease'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Checkout Header */}
        <div
          style={{
            padding: '1rem clamp(1rem, 3vw, 2rem)',
            borderBottom: '1px solid rgba(75, 48, 36, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#FAF6EE'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <img
              src="/assets/RODHE Woven Luxury Wordmark.png"
              alt="RODHE"
              style={{ height: 'clamp(24px, 5vw, 32px)' }}
            />
            <span style={{ fontSize: '0.74rem', color: '#B88D4A', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              • WhatsApp Concierge Checkout
            </span>
          </div>

          <button
            onClick={() => setIsCheckoutOpen(false)}
            aria-label="Close checkout"
            style={{ color: '#8F7263', padding: '0.4rem', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Steps Progress Indicator */}
        {step < 4 && (
          <div
            style={{
              padding: '0.75rem clamp(0.75rem, 3vw, 2rem)',
              backgroundColor: '#FFFDF9',
              borderBottom: '1px solid rgba(75, 48, 36, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'clamp(0.5rem, 3vw, 2.5rem)',
              overflowX: 'auto',
              scrollbarWidth: 'none'
            }}
          >
            {[
              { num: 1, label: 'Patron Details' },
              { num: 2, label: 'Delivery Address' },
              { num: 3, label: 'Review & WhatsApp' }
            ].map((s) => (
              <div
                key={s.num}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  color: step >= s.num ? '#4B3024' : '#8F7263',
                  fontWeight: step === s.num ? 700 : 500,
                  fontSize: '0.78rem',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap'
                }}
              >
                <div
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    backgroundColor: step >= s.num ? '#4B3024' : '#F4ECE1',
                    color: step >= s.num ? '#FAF6EE' : '#8F7263',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    flexShrink: 0
                  }}
                >
                  {s.num}
                </div>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Modal Main Content */}
        <div className="checkout-main-content">
          {/* Step 4: Honest WhatsApp Status Screen (NO fake confirmation) */}
          {step === 4 ? (
            <div style={{ padding: 'clamp(2rem, 5vw, 3.5rem) clamp(1rem, 3vw, 2rem)', textAlign: 'center', maxWidth: '640px', margin: '0 auto', width: '100%' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(37, 211, 102, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                  color: '#25D366'
                }}
              >
                <MessageCircle size={38} />
              </div>

              <div style={{ fontSize: '0.76rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#525B3A', fontWeight: 700, marginBottom: '0.5rem' }}>
                WhatsApp Concierge Opened
              </div>

              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', color: '#4B3024', marginBottom: '0.75rem' }}>
                Tap "Send" in WhatsApp
              </h2>

              <p style={{ fontSize: '0.9rem', color: '#6F4E3E', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                We have generated your order message and opened WhatsApp with our boutique atelier (+91 9490658858).
                Please tap <strong>Send</strong> in your chat window to deliver your inquiry.
              </p>

              {/* Honest Status Notice Box */}
              <div
                style={{
                  backgroundColor: '#FAF6EE',
                  border: '1px solid rgba(184, 141, 74, 0.3)',
                  padding: '1.25rem',
                  textAlign: 'left',
                  fontSize: '0.84rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  marginBottom: '1.75rem'
                }}
              >
                <div className="confirmation-spec-row">
                  <span style={{ color: '#8F7263' }}>Order Status:</span>
                  <span style={{ fontWeight: 600, color: '#B88D4A' }}>Awaiting Atelier Confirmation</span>
                </div>
                <div className="confirmation-spec-row">
                  <span style={{ color: '#8F7263' }}>Payment Mode:</span>
                  <span style={{ fontWeight: 600, color: '#4B3024' }}>Direct with Atelier (UPI / Bank Transfer)</span>
                </div>
                <div className="confirmation-spec-row">
                  <span style={{ color: '#8F7263' }}>Shopping Bag:</span>
                  <span style={{ fontWeight: 600, color: '#525B3A' }}>Preserved in your browser ({cart.length} items)</span>
                </div>
                <div className="confirmation-spec-row" style={{ borderTop: '1px solid rgba(75, 48, 36, 0.1)', paddingTop: '0.65rem' }}>
                  <span style={{ color: '#4B3024', fontWeight: 600 }}>Estimated Bag Total:</span>
                  <span style={{ fontWeight: 700, color: '#4B3024', fontFamily: 'var(--font-serif)', fontSize: '1.15rem' }}>
                    ₹{total.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center' }}>
                {lastWhatsAppUrl && (
                  <a
                    href={lastWhatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn"
                    style={{
                      width: '100%',
                      maxWidth: '340px',
                      backgroundColor: '#25D366',
                      color: '#FFFFFF',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      fontWeight: 600,
                      textDecoration: 'none',
                      padding: '0.85rem 1.25rem',
                      borderRadius: '4px'
                    }}
                  >
                    <MessageCircle size={18} />
                    Reopen WhatsApp Chat
                  </a>
                )}

                <button
                  onClick={() => {
                    setIsCheckoutOpen(false);
                    navigateTo('home');
                  }}
                  className="btn btn-primary"
                  style={{ width: '100%', maxWidth: '340px' }}
                >
                  Return to RODHE Home
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Left Column: Form Steps */}
              <div style={{ padding: 'clamp(1.25rem, 3.5vw, 2rem)', minWidth: 0 }} className="checkout-form-column">
                {/* Step 1: Contact Details */}
                {step === 1 && (
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.45rem', color: '#4B3024', marginBottom: '0.35rem' }}>
                      Patron Contact Details
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: '#8F7263', marginBottom: '1.25rem' }}>
                      Our atelier connects directly with you to verify your drape requirements.
                    </p>

                    <div className="form-two-col">
                      <div className="form-group">
                        <label className="form-label">First Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Ananya"
                          className="form-input"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Last Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Deshmukh"
                          className="form-input"
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">WhatsApp Contact Number *</label>
                      <div style={{ display: 'flex' }}>
                        <span style={{ padding: '0.85rem 0.85rem', backgroundColor: '#F4ECE1', border: '1px solid rgba(75, 48, 36, 0.15)', fontSize: '0.88rem', fontWeight: 600 }}>
                          +91
                        </span>
                        <input
                          type="tel"
                          required
                          inputMode="numeric"
                          placeholder="10-digit mobile number"
                          className="form-input"
                          style={{ borderLeft: 'none' }}
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/[^0-9]/g, '').slice(0, 10) })}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Email Address (Optional, for dispatch invoice & care guide)</label>
                      <input
                        type="email"
                        placeholder="e.g. ananya@example.com"
                        className="form-input"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '1.25rem' }}>
                      <button
                        onClick={() => setStep(2)}
                        className="btn btn-primary"
                        style={{ width: '100%', minHeight: '48px' }}
                      >
                        <span>Continue to Delivery Address</span>
                        <ArrowRight size={16} />
                      </button>

                      <button
                        onClick={handleSendToWhatsApp}
                        disabled={isProcessing}
                        className="btn btn-outline"
                        style={{ width: '100%', minHeight: '42px', fontSize: '0.8rem', color: '#525B3A', borderColor: '#525B3A' }}
                      >
                        <MessageCircle size={15} />
                        <span>Skip Address & Connect Directly on WhatsApp</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2: Shipping Address */}
                {step === 2 && (
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.45rem', color: '#4B3024', marginBottom: '0.35rem' }}>
                      Delivery Destination (India)
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: '#8F7263', marginBottom: '1.25rem' }}>
                      Insured express courier delivery across all serviceable Indian pincodes.
                    </p>

                    <div className="form-group">
                      <label className="form-label">PIN Code (6-digit) *</label>
                      <input
                        type="text"
                        maxLength={6}
                        required
                        inputMode="numeric"
                        className="form-input"
                        value={formData.pincode}
                        onChange={(e) => handlePincodeLookup(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="e.g. 560001"
                      />
                    </div>

                    <div className="form-two-col">
                      <div className="form-group">
                        <label className="form-label">City *</label>
                        <input
                          type="text"
                          required
                          className="form-input"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          placeholder="e.g. Bengaluru"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">State *</label>
                        <input
                          type="text"
                          required
                          className="form-input"
                          value={formData.state}
                          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                          placeholder="e.g. Karnataka"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Apartment / House / Street Address</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="e.g. Flat 402, Heritage Enclave, Lavelle Road"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Landmark (Optional)</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.landmark}
                        onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                        placeholder="e.g. Near Bangalore Club"
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                      <button
                        onClick={() => setStep(1)}
                        className="btn btn-outline"
                        style={{ padding: '0.85rem 1.25rem', minHeight: '48px' }}
                      >
                        <ArrowLeft size={16} />
                      </button>
                      <button
                        onClick={() => setStep(3)}
                        className="btn btn-primary"
                        style={{ flexGrow: 1, minHeight: '48px' }}
                      >
                        <span>Review & Proceed to WhatsApp</span>
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: Review & Dispatch to WhatsApp */}
                {step === 3 && (
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.45rem', color: '#4B3024', marginBottom: '0.35rem' }}>
                      Review & Connect with Atelier
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: '#8F7263', marginBottom: '1.15rem' }}>
                      RODHE slow-luxury sarees are confirmed individually by our master craftspeople.
                    </p>

                    {/* Order Review Box */}
                    <div
                      style={{
                        backgroundColor: '#FAF6EE',
                        border: '1px solid rgba(184, 141, 74, 0.25)',
                        padding: '1rem',
                        marginBottom: '1.25rem',
                        fontSize: '0.82rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#8F7263' }}>Patron:</span>
                        <strong style={{ color: '#4B3024' }}>
                          {`${formData.firstName} ${formData.lastName}`.trim() || 'Patron'}
                        </strong>
                      </div>
                      {formData.phone && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#8F7263' }}>WhatsApp:</span>
                          <span style={{ color: '#4B3024' }}>+91 {formData.phone}</span>
                        </div>
                      )}
                      {(formData.city || formData.pincode) && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#8F7263' }}>Destination:</span>
                          <span style={{ color: '#4B3024' }}>
                            {formData.city}, {formData.state} {formData.pincode ? `(${formData.pincode})` : ''}
                          </span>
                        </div>
                      )}
                      {formData.address && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#8F7263' }}>Address:</span>
                          <span style={{ color: '#4B3024', textAlign: 'right', maxWidth: '240px' }}>
                            {formData.address}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Note to Atelier */}
                    <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                      <label className="form-label">Note for Atelier (Optional: blouse stitching, drape query)</label>
                      <textarea
                        rows={2}
                        className="form-input"
                        placeholder="e.g. Please confirm if zari border is tested or unstitched blouse piece is included."
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        style={{ resize: 'none' }}
                      />
                    </div>

                    {/* Honest Commerce Notice */}
                    <div
                      style={{
                        padding: '0.85rem 1rem',
                        backgroundColor: '#F4ECE1',
                        borderLeft: '3px solid #525B3A',
                        fontSize: '0.78rem',
                        color: '#4B3024',
                        lineHeight: 1.5,
                        marginBottom: '1.25rem'
                      }}
                    >
                      <strong>How RODHE Orders Work:</strong>
                      <p style={{ margin: '0.35rem 0 0', color: '#6F4E3E' }}>
                        Clicking below opens WhatsApp (+91 9490658858) with your selected sarees. Our concierge will verify artisan reserve, share drape videos if requested, and provide direct payment details (UPI / Bank Transfer) before shipping.
                      </p>
                    </div>

                    {orderError && (
                      <div
                        style={{
                          padding: '0.85rem 1rem',
                          backgroundColor: 'rgba(201, 130, 120, 0.15)',
                          border: '1px solid #C98278',
                          color: '#8A2A20',
                          fontSize: '0.82rem',
                          borderRadius: '3px',
                          marginBottom: '1rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <AlertCircle size={16} color="#8A2A20" style={{ flexShrink: 0 }} />
                        <span>{orderError}</span>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button
                        onClick={() => setStep(2)}
                        className="btn btn-outline"
                        style={{ padding: '0.85rem 1.25rem', minHeight: '48px' }}
                      >
                        <ArrowLeft size={16} />
                      </button>
                      <button
                        onClick={handleSendToWhatsApp}
                        disabled={isProcessing}
                        className="btn"
                        style={{
                          flexGrow: 1,
                          minHeight: '48px',
                          backgroundColor: '#525B3A',
                          color: '#FAF6EE',
                          border: 'none',
                          borderRadius: '3px',
                          fontSize: '0.88rem',
                          fontWeight: 600,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.65rem',
                          cursor: 'pointer',
                          boxShadow: '0 8px 20px rgba(82, 91, 58, 0.25)'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#3E462B')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#525B3A')}
                      >
                        <MessageCircle size={18} color="#D4AC68" />
                        <span>{isProcessing ? 'Opening WhatsApp...' : 'Continue on WhatsApp'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Order Summary */}
              <div style={{ padding: 'clamp(1.25rem, 3.5vw, 2rem)', backgroundColor: '#FAF6EE', minWidth: 0 }} className="checkout-summary-column">
                <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', color: '#4B3024', marginBottom: '1rem' }}>
                  Shopping Bag ({cart.length} {cart.length === 1 ? 'drape' : 'drapes'})
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '200px', overflowY: 'auto', marginBottom: '1.25rem' }}>
                  {cart.map((item) => (
                    <div key={item.product?.id || item.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <img
                        src={item.product?.primaryImage || item.product?.primary_image || item.primaryImage || '/assets/products/saree_ivory_mulmul.jpg'}
                        alt=""
                        style={{ width: '42px', height: '54px', objectFit: 'cover', flexShrink: 0 }}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/assets/products/saree_ivory_mulmul.jpg';
                        }}
                      />
                      <div style={{ flexGrow: 1, minWidth: 0 }}>
                        <h5 style={{ fontSize: '0.82rem', fontWeight: 600, color: '#4B3024', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.product?.name || item.name}
                        </h5>
                        <span style={{ fontSize: '0.72rem', color: '#8F7263' }}>Qty: {item.quantity}</span>
                      </div>
                      <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#4B3024', flexShrink: 0 }}>
                        ₹{((Number(item.product?.price ?? item.product?.sellingPrice ?? item.product?.selling_price ?? item.unitPrice ?? 990) || 990) * item.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Calculation */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.82rem', borderTop: '1px solid rgba(75, 48, 36, 0.1)', paddingTop: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6F4E3E' }}>
                    <span>Subtotal</span>
                    <span>₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>

                  {discountAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#C98278', fontWeight: 600 }}>
                      <span>Discount ({appliedCoupon?.code})</span>
                      <span>-₹{discountAmount.toLocaleString('en-IN')}</span>
                    </div>
                  )}

                  {giftWrap && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6F4E3E' }}>
                      <span>Heritage Keepsake Box</span>
                      <span>+₹{giftWrapFee}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6F4E3E' }}>
                    <span>Shipping</span>
                    <span>{shippingFee === 0 ? 'FREE' : `₹${shippingFee}`}</span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '1.2rem',
                      fontWeight: 700,
                      fontFamily: 'var(--font-serif)',
                      color: '#4B3024',
                      borderTop: '1px solid rgba(75, 48, 36, 0.12)',
                      paddingTop: '0.65rem',
                      marginTop: '0.35rem'
                    }}
                  >
                    <span>Total Amount</span>
                    <span>₹{total.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '0.76rem', color: '#8F7263' }}>
                  <ShieldCheck size={16} color="#B88D4A" style={{ flexShrink: 0 }} />
                  <span>Insured transit with tamper-evident seal</span>
                </div>
              </div>
            </>
          )}
        </div>

        <style>{`
          .checkout-main-content {
            display: grid;
            grid-template-columns: 1fr;
            flex-grow: 1;
            overflow-y: auto;
          }
          .form-two-col {
            display: grid;
            grid-template-columns: 1fr;
            gap: 0.85rem;
          }
          .confirmation-spec-row {
            display: flex;
            flex-direction: column;
            gap: 0.2rem;
          }
          @media (min-width: 520px) {
            .form-two-col {
              grid-template-columns: 1fr 1fr;
            }
            .confirmation-spec-row {
              flex-direction: row;
              justify-content: space-between;
            }
          }
          @media (min-width: 768px) {
            .checkout-main-content {
              grid-template-columns: minmax(0, 1.25fr) minmax(0, 0.95fr);
            }
            .checkout-form-column {
              border-right: 1px solid rgba(75, 48, 36, 0.1);
            }
          }
        `}</style>
      </div>
    </div>
  );
};
