import React, { useState } from 'react';
import { X, CheckCircle2, ShieldCheck, Truck, CreditCard, Smartphone, Building, Banknote, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useShop } from '../context/ShopContext';

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
    clearCart,
    navigateTo
  } = useShop();

  const [step, setStep] = useState(1); // 1: Contact, 2: Address, 3: Payment, 4: Confirmation
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderId, setOrderId] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    firstName: 'Ananya',
    lastName: 'Deshmukh',
    email: 'ananya.deshmukh@example.com',
    phone: '9845012345',
    pincode: '560001',
    address: 'Flat 402, Heritage Enclave, Lavelle Road',
    landmark: 'Near Bangalore Club',
    city: 'Bengaluru',
    state: 'Karnataka',
    paymentMethod: 'upi', // 'upi' | 'card' | 'netbanking' | 'cod'
    upiId: 'ananya@okhdfcbank'
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

  const handlePlaceOrder = () => {
    setIsProcessing(true);

    setTimeout(() => {
      const generatedId = `RODHE-IND-${Math.floor(100000 + Math.random() * 900000)}`;
      setOrderId(generatedId);
      setIsProcessing(false);
      setStep(4);
      clearCart();

      // Trigger Celebration Confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#B88D4A', '#EADAB5', '#4B3024', '#C98278']
        });
      } catch (e) {}
    }, 1400);
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
              • Secure Concierge
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

        {/* Checkout Steps Progress Indicator */}
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
              { num: 1, label: 'Details', fullLabel: 'Patron Details' },
              { num: 2, label: 'Address', fullLabel: 'Delivery Address' },
              { num: 3, label: 'Payment', fullLabel: 'Payment Gateway' }
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
                <span className="checkout-step-text">{s.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Modal Main Content */}
        <div className="checkout-main-content">
          {/* Step 4: Confirmation Screen */}
          {step === 4 ? (
            <div style={{ padding: 'clamp(2rem, 5vw, 3.5rem) clamp(1rem, 3vw, 2rem)', textAlign: 'center', maxWidth: '640px', margin: '0 auto', width: '100%' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(184, 141, 74, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                  color: '#B88D4A'
                }}
              >
                <CheckCircle2 size={38} />
              </div>

              <div style={{ fontSize: '0.76rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#B88D4A', fontWeight: 700, marginBottom: '0.5rem' }}>
                Order Placed With Trust
              </div>

              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', color: '#4B3024', marginBottom: '0.75rem' }}>
                Thank You, {formData.firstName}!
              </h2>

              <p style={{ fontSize: '0.9rem', color: '#6F4E3E', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                Your handcrafted saree order <strong>#{orderId}</strong> has been received by our artisan guild. A confirmation email has been dispatched to <strong>{formData.email}</strong>.
              </p>

              {/* Order Specs Box */}
              <div
                style={{
                  backgroundColor: '#FAF6EE',
                  border: '1px solid rgba(184, 141, 74, 0.25)',
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
                  <span style={{ color: '#8F7263' }}>Delivery Address:</span>
                  <span style={{ fontWeight: 600, color: '#4B3024' }}>
                    {formData.address}, {formData.city}, {formData.state} - {formData.pincode}
                  </span>
                </div>
                <div className="confirmation-spec-row">
                  <span style={{ color: '#8F7263' }}>Estimated Dispatch:</span>
                  <span style={{ fontWeight: 600, color: '#4B3024' }}>Within 24 Hours (Insured Courier)</span>
                </div>
                <div className="confirmation-spec-row">
                  <span style={{ color: '#8F7263' }}>Payment Method:</span>
                  <span style={{ fontWeight: 600, color: '#4B3024', textTransform: 'uppercase' }}>{formData.paymentMethod}</span>
                </div>
                <div className="confirmation-spec-row" style={{ borderTop: '1px solid rgba(75, 48, 36, 0.1)', paddingTop: '0.65rem' }}>
                  <span style={{ color: '#4B3024', fontWeight: 600 }}>Amount Paid:</span>
                  <span style={{ fontWeight: 700, color: '#4B3024', fontFamily: 'var(--font-serif)', fontSize: '1.15rem' }}>
                    ₹{total.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsCheckoutOpen(false);
                  navigateTo('home');
                }}
                className="btn btn-primary"
                style={{ width: '100%', maxWidth: '320px' }}
              >
                Return to RODHE Home
              </button>
            </div>
          ) : (
            <>
              {/* Left Column: Form Steps */}
              <div style={{ padding: 'clamp(1.25rem, 3.5vw, 2rem)', minWidth: 0 }} className="checkout-form-column">
                {/* Step 1: Contact Details */}
                {step === 1 && (
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.45rem', color: '#4B3024', marginBottom: '1.25rem' }}>
                      Contact Information
                    </h3>

                    <div className="form-two-col">
                      <div className="form-group">
                        <label className="form-label">First Name</label>
                        <input
                          type="text"
                          required
                          autoComplete="given-name"
                          className="form-input"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Last Name</label>
                        <input
                          type="text"
                          required
                          autoComplete="family-name"
                          className="form-input"
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Email Address (for invoice & care guide)</label>
                      <input
                        type="email"
                        required
                        autoComplete="email"
                        className="form-input"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Phone Number (for SMS & updates)</label>
                      <div style={{ display: 'flex' }}>
                        <span style={{ padding: '0.85rem 0.85rem', backgroundColor: '#F4ECE1', border: '1px solid rgba(75, 48, 36, 0.15)', fontSize: '0.88rem', fontWeight: 600 }}>
                          +91
                        </span>
                        <input
                          type="tel"
                          required
                          inputMode="numeric"
                          autoComplete="tel"
                          className="form-input"
                          style={{ borderLeft: 'none' }}
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => setStep(2)}
                      className="btn btn-primary"
                      style={{ width: '100%', marginTop: '1rem', minHeight: '48px' }}
                    >
                      <span>Continue to Delivery Address</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                )}

                {/* Step 2: Shipping Address */}
                {step === 2 && (
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.45rem', color: '#4B3024', marginBottom: '1.25rem' }}>
                      Shipping Address (India)
                    </h3>

                    <div className="form-group">
                      <label className="form-label">PIN Code (6-digit)</label>
                      <input
                        type="text"
                        maxLength={6}
                        required
                        inputMode="numeric"
                        autoComplete="postal-code"
                        className="form-input"
                        value={formData.pincode}
                        onChange={(e) => handlePincodeLookup(e.target.value)}
                        placeholder="e.g. 560001"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Apartment / House / Street Address</label>
                      <input
                        type="text"
                        required
                        autoComplete="street-address"
                        className="form-input"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Landmark</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.landmark}
                        onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                      />
                    </div>

                    <div className="form-two-col">
                      <div className="form-group">
                        <label className="form-label">City</label>
                        <input
                          type="text"
                          required
                          autoComplete="address-level2"
                          className="form-input"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">State</label>
                        <input
                          type="text"
                          required
                          autoComplete="address-level1"
                          className="form-input"
                          value={formData.state}
                          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        />
                      </div>
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
                        <span>Continue to Payment</span>
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: Payment Options & Boundary */}
                {step === 3 && (
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.45rem', color: '#4B3024', marginBottom: '0.4rem' }}>
                      Payment Method
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: '#8F7263', marginBottom: '1.15rem' }}>
                      Transactions are securely encrypted with 256-bit SSL.
                    </p>

                    {/* Payment Gateways List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                      {/* UPI */}
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.85rem',
                          padding: '0.85rem clamp(0.75rem, 2vw, 1rem)',
                          border: formData.paymentMethod === 'upi' ? '2px solid #B88D4A' : '1px solid rgba(75, 48, 36, 0.12)',
                          backgroundColor: formData.paymentMethod === 'upi' ? '#FAF6EE' : '#FFFDF9',
                          cursor: 'pointer'
                        }}
                      >
                        <input
                          type="radio"
                          name="payment"
                          checked={formData.paymentMethod === 'upi'}
                          onChange={() => setFormData({ ...formData, paymentMethod: 'upi' })}
                          style={{ accentColor: '#B88D4A' }}
                        />
                        <Smartphone size={20} color="#B88D4A" style={{ flexShrink: 0 }} />
                        <div style={{ flexGrow: 1 }}>
                          <div style={{ fontSize: '0.86rem', fontWeight: 600, color: '#4B3024' }}>
                            Instant UPI (GPay, PhonePe, Paytm)
                          </div>
                          <span style={{ fontSize: '0.72rem', color: '#8F7263' }}>Zero surcharge</span>
                        </div>
                      </label>

                      {/* Cards */}
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.85rem',
                          padding: '0.85rem clamp(0.75rem, 2vw, 1rem)',
                          border: formData.paymentMethod === 'card' ? '2px solid #B88D4A' : '1px solid rgba(75, 48, 36, 0.12)',
                          backgroundColor: formData.paymentMethod === 'card' ? '#FAF6EE' : '#FFFDF9',
                          cursor: 'pointer'
                        }}
                      >
                        <input
                          type="radio"
                          name="payment"
                          checked={formData.paymentMethod === 'card'}
                          onChange={() => setFormData({ ...formData, paymentMethod: 'card' })}
                          style={{ accentColor: '#B88D4A' }}
                        />
                        <CreditCard size={20} color="#B88D4A" style={{ flexShrink: 0 }} />
                        <div style={{ flexGrow: 1 }}>
                          <div style={{ fontSize: '0.86rem', fontWeight: 600, color: '#4B3024' }}>
                            Card (Visa, Mastercard, RuPay)
                          </div>
                          <span style={{ fontSize: '0.72rem', color: '#8F7263' }}>Domestic & International</span>
                        </div>
                      </label>

                      {/* Net Banking */}
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.85rem',
                          padding: '0.85rem clamp(0.75rem, 2vw, 1rem)',
                          border: formData.paymentMethod === 'netbanking' ? '2px solid #B88D4A' : '1px solid rgba(75, 48, 36, 0.12)',
                          backgroundColor: formData.paymentMethod === 'netbanking' ? '#FAF6EE' : '#FFFDF9',
                          cursor: 'pointer'
                        }}
                      >
                        <input
                          type="radio"
                          name="payment"
                          checked={formData.paymentMethod === 'netbanking'}
                          onChange={() => setFormData({ ...formData, paymentMethod: 'netbanking' })}
                          style={{ accentColor: '#B88D4A' }}
                        />
                        <Building size={20} color="#B88D4A" style={{ flexShrink: 0 }} />
                        <div style={{ flexGrow: 1 }}>
                          <div style={{ fontSize: '0.86rem', fontWeight: 600, color: '#4B3024' }}>
                            Net Banking (All Major Banks)
                          </div>
                          <span style={{ fontSize: '0.72rem', color: '#8F7263' }}>HDFC, ICICI, SBI, Axis</span>
                        </div>
                      </label>

                      {/* Cash on Delivery */}
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.85rem',
                          padding: '0.85rem clamp(0.75rem, 2vw, 1rem)',
                          border: formData.paymentMethod === 'cod' ? '2px solid #B88D4A' : '1px solid rgba(75, 48, 36, 0.12)',
                          backgroundColor: formData.paymentMethod === 'cod' ? '#FAF6EE' : '#FFFDF9',
                          cursor: 'pointer'
                        }}
                      >
                        <input
                          type="radio"
                          name="payment"
                          checked={formData.paymentMethod === 'cod'}
                          onChange={() => setFormData({ ...formData, paymentMethod: 'cod' })}
                          style={{ accentColor: '#B88D4A' }}
                        />
                        <Banknote size={20} color="#B88D4A" style={{ flexShrink: 0 }} />
                        <div style={{ flexGrow: 1 }}>
                          <div style={{ fontSize: '0.86rem', fontWeight: 600, color: '#4B3024' }}>
                            Cash on Delivery
                          </div>
                          <span style={{ fontSize: '0.72rem', color: '#8F7263' }}>Inspect drape on arrival</span>
                        </div>
                      </label>
                    </div>

                    {/* Payment Integration Notice */}
                    <div
                      style={{
                        padding: '0.85rem',
                        backgroundColor: '#FAF6EE',
                        border: '1px dashed #B88D4A',
                        fontSize: '0.74rem',
                        color: '#6F4E3E',
                        lineHeight: 1.5,
                        marginBottom: '1.25rem'
                      }}
                    >
                      <strong style={{ color: '#4B3024' }}>Sandbox Notice:</strong> Verified Concierge Mode active. Production connects to Razorpay via <code>VITE_RAZORPAY_KEY_ID</code>.
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button
                        onClick={() => setStep(2)}
                        className="btn btn-outline"
                        style={{ padding: '0.85rem 1.25rem', minHeight: '48px' }}
                      >
                        <ArrowLeft size={16} />
                      </button>
                      <button
                        onClick={handlePlaceOrder}
                        disabled={isProcessing}
                        className="btn btn-gold"
                        style={{ flexGrow: 1, minHeight: '48px' }}
                      >
                        <span>{isProcessing ? 'Securing...' : `Pay ₹${total.toLocaleString('en-IN')}`}</span>
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Order Summary */}
              <div style={{ padding: 'clamp(1.25rem, 3.5vw, 2rem)', backgroundColor: '#FAF6EE', minWidth: 0 }} className="checkout-summary-column">
                <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', color: '#4B3024', marginBottom: '1rem' }}>
                  Order Summary ({cart.length} items)
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '200px', overflowY: 'auto', marginBottom: '1.25rem' }}>
                  {cart.map((item) => (
                    <div key={item.product.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <img
                        src={item.product.primaryImage}
                        alt=""
                        style={{ width: '42px', height: '54px', objectFit: 'cover', flexShrink: 0 }}
                      />
                      <div style={{ flexGrow: 1, minWidth: 0 }}>
                        <h5 style={{ fontSize: '0.82rem', fontWeight: 600, color: '#4B3024', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.product.name}
                        </h5>
                        <span style={{ fontSize: '0.72rem', color: '#8F7263' }}>Qty: {item.quantity}</span>
                      </div>
                      <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#4B3024', flexShrink: 0 }}>
                        ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
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
                      <span>Heritage Gift Box</span>
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
