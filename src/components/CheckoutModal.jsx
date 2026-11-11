import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  MessageCircle,
  AlertCircle,
  ShoppingBag,
  MapPin,
  Edit2,
  Plus,
  Minus,
  Trash2,
  Copy,
  Check,
  Tag,
  User,
  Star,
  Smartphone,
  QrCode
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { trackBeginCheckout, trackWhatsAppHandover, trackAddPaymentInfo } from '../services/analyticsService';
import { UPI_METHOD_LIST, getUpiMethodConfig } from '../config/upiConfig';
import { paymentService } from '../services/paymentService';
import { UpiPaymentSection } from './UpiPaymentSection';
import {
  isValidIndianPhone,
  isValidIndianPincode,
  isValidEmail,
  lookupIndianPincodeInfo,
  formatPhoneDigits
} from '../services/customerService';

const EMPTY_FORM = {
  addressId: null,
  label: 'Home',
  fullName: '',
  email: '',
  phone: '',
  pincode: '',
  addressLine1: '',
  addressLine2: '',
  landmark: '',
  city: '',
  state: '',
  notes: '',
  saveToAccount: true
};

export const CheckoutModal = () => {
  const {
    isCheckoutOpen,
    setIsCheckoutOpen,
    setIsAuthOpen,
    cart,
    hasUnavailableCartItems,
    updateQuantity,
    removeFromCart,
    clearCart,
    pendingUpiOrder,
    savePendingUpiOrder,
    clearPendingUpiOrder,
    resumePendingUpiFlag,
    setResumePendingUpiFlag,
    subtotal,
    discountAmount,
    appliedCoupon,
    applyCouponCode,
    removeCoupon,
    isFreeShipping,
    shippingFee,
    giftWrap,
    setGiftWrap,
    giftWrapFee,
    total,
    storeSettings,
    navigateTo,
    patronUser,
    customerAddresses,
    selectedAddressId,
    setSelectedAddressId,
    guestCheckoutDraft,
    saveGuestCheckoutDraft,
    saveCustomerAddress,
    showToast
  } = useShop();

  const [step, setStep] = useState(1); // 1: Review Bag, 2: Customer & Delivery Details, 3: Final Review, 4: WhatsApp Handover
  const [addressMode, setAddressMode] = useState('select'); // 'select' | 'form'
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [isSavingStep, setIsSavingStep] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastWhatsAppUrl, setLastWhatsAppUrl] = useState('');
  const [lastWhatsAppText, setLastWhatsAppText] = useState('');
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [popupBlockedNotice, setPopupBlockedNotice] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [lastAutoFillPin, setLastAutoFillPin] = useState('');
  const [checkoutMode, setCheckoutMode] = useState('upi');
  const [selectedUpiMethod, setSelectedUpiMethod] = useState('upi_phonepe');
  const [activeUpiOrder, setActiveUpiOrder] = useState(null);
  const [idempotencyKey, setIdempotencyKey] = useState('');

  // Close on Escape when not mid-submit
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isCheckoutOpen) {
        setIsCheckoutOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCheckoutOpen, setIsCheckoutOpen]);

  // Hydrate checkout steps & form ONLY when the checkout modal opens cleanly
  // (must not reset step when user saves/updates their address during Step 2)
  useEffect(() => {
    if (!isCheckoutOpen) return;

    setOrderError('');
    setFormErrors({});
    setPopupBlockedNotice(false);
    setCopiedMessage(false);

    if (resumePendingUpiFlag && pendingUpiOrder) {
      setCheckoutMode('upi');
      setActiveUpiOrder(pendingUpiOrder);
      setSelectedUpiMethod(getUpiMethodConfig(pendingUpiOrder.paymentMethod).id);
      setStep(4);
      setResumePendingUpiFlag(false);
      return;
    }

    setStep(1);
    setActiveUpiOrder(null);
    setCheckoutMode('upi');
    const fingerprint = (cart || [])
      .map((i) => `${i.product?.sku || i.product?.id || i.sku}:${i.quantity}`)
      .sort()
      .join(',');
    setIdempotencyKey(`rdh-${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${fingerprint.slice(0, 24)}`);

    if (cart.length > 0) {
      trackBeginCheckout(cart, total);
    }

    if (patronUser) {
      const preferred =
        customerAddresses.find((a) => a.id === selectedAddressId) ||
        customerAddresses.find((a) => a.isDefault) ||
        customerAddresses[0] ||
        null;

      if (preferred) {
        setAddressMode('select');
        setFormData({
          addressId: preferred.id,
          label: preferred.label || 'Home',
          fullName: preferred.recipientName || patronUser.name || '',
          email: patronUser.email || '',
          phone: preferred.phone || patronUser.phone || '',
          pincode: preferred.pincode || '',
          addressLine1: preferred.addressLine1 || '',
          addressLine2: preferred.addressLine2 || '',
          landmark: preferred.landmark || '',
          city: preferred.city || '',
          state: preferred.state || '',
          notes: '',
          saveToAccount: true
        });
      } else {
        setAddressMode('form');
        setFormData({
          ...EMPTY_FORM,
          fullName: patronUser.name || '',
          email: patronUser.email || '',
          phone: patronUser.phone || ''
        });
      }
    } else if (guestCheckoutDraft) {
      setAddressMode('form');
      setFormData({
        ...EMPTY_FORM,
        ...guestCheckoutDraft
      });
    } else {
      setAddressMode('form');
      setFormData(EMPTY_FORM);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCheckoutOpen, patronUser?.id]);

  if (!isCheckoutOpen) return null;

  const activeAddressObj =
    patronUser && addressMode === 'select'
      ? customerAddresses.find((a) => a.id === selectedAddressId) ||
        customerAddresses.find((a) => a.isDefault) ||
        customerAddresses[0]
      : null;

  const effectiveDelivery = activeAddressObj
    ? {
        fullName: activeAddressObj.recipientName || patronUser?.name || '',
        phone: activeAddressObj.phone || patronUser?.phone || '',
        email: patronUser?.email || formData.email || '',
        addressLine1: activeAddressObj.addressLine1 || '',
        addressLine2: activeAddressObj.addressLine2 || '',
        landmark: activeAddressObj.landmark || '',
        pincode: activeAddressObj.pincode || '',
        city: activeAddressObj.city || '',
        state: activeAddressObj.state || ''
      }
    : {
        fullName: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        addressLine1: formData.addressLine1,
        addressLine2: formData.addressLine2,
        landmark: formData.landmark,
        pincode: formData.pincode,
        city: formData.city,
        state: formData.state
      };

  const handleSelectSavedAddress = (addr) => {
    setSelectedAddressId(addr.id);
    setFormData((prev) => ({
      ...prev,
      addressId: addr.id,
      label: addr.label || 'Home',
      fullName: addr.recipientName || patronUser?.name || '',
      phone: addr.phone || patronUser?.phone || '',
      addressLine1: addr.addressLine1 || '',
      addressLine2: addr.addressLine2 || '',
      landmark: addr.landmark || '',
      pincode: addr.pincode || '',
      city: addr.city || '',
      state: addr.state || ''
    }));
  };

  const handleStartEditAddress = (addr = null) => {
    setFormErrors({});
    if (addr) {
      setFormData((prev) => ({
        ...prev,
        addressId: addr.id,
        label: addr.label || 'Home',
        fullName: addr.recipientName || patronUser?.name || '',
        phone: addr.phone || patronUser?.phone || '',
        email: patronUser?.email || prev.email || '',
        addressLine1: addr.addressLine1 || '',
        addressLine2: addr.addressLine2 || '',
        landmark: addr.landmark || '',
        pincode: addr.pincode || '',
        city: addr.city || '',
        state: addr.state || '',
        saveToAccount: true
      }));
    } else {
      // New address form
      setFormData((prev) => ({
        ...EMPTY_FORM,
        fullName: patronUser?.name || prev.fullName || '',
        email: patronUser?.email || prev.email || '',
        phone: patronUser?.phone || prev.phone || '',
        notes: prev.notes || '',
        saveToAccount: true
      }));
    }
    setAddressMode('form');
  };

  const handlePincodeChange = (rawVal) => {
    const cleanPin = rawVal.replace(/\D/g, '').slice(0, 6);
    const info = lookupIndianPincodeInfo(cleanPin);
    setFormData((prev) => {
      const next = { ...prev, pincode: cleanPin };
      if (info) {
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
    if (formErrors.pincode) {
      setFormErrors((prev) => ({ ...prev, pincode: '' }));
    }
  };

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setCouponError('');
    const res = await applyCouponCode(couponInput);
    if (!res?.success) {
      setCouponError(res?.message || 'Invalid or expired promo code.');
    } else {
      setCouponInput('');
    }
  };

  const validateAndProceedFromDetails = async () => {
    setFormErrors({});
    setOrderError('');

    // If returning signed-in customer chose an existing saved address card cleanly
    if (patronUser && addressMode === 'select' && activeAddressObj) {
      setStep(3);
      return;
    }

    const errors = {};
    if (!formData.fullName.trim() || formData.fullName.trim().length < 2) {
      errors.fullName = 'Please enter customer full name.';
    }
    if (!isValidIndianPhone(formData.phone)) {
      errors.phone = 'Please enter a valid 10-digit WhatsApp mobile number.';
    }
    if (formData.email && !isValidEmail(formData.email)) {
      errors.email = 'Please enter a valid email address or leave blank.';
    }
    if (!formData.addressLine1.trim() || formData.addressLine1.trim().length < 4) {
      errors.addressLine1 = 'Please enter flat / house number and building details.';
    }
    if (!isValidIndianPincode(formData.pincode)) {
      errors.pincode = 'Please enter a valid 6-digit Indian PIN code.';
    }
    if (!formData.city.trim() || formData.city.trim().length < 2) {
      errors.city = 'Please enter delivery city.';
    }
    if (!formData.state.trim() || formData.state.trim().length < 2) {
      errors.state = 'Please enter delivery state.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSavingStep(true);
    try {
      if (patronUser && formData.saveToAccount) {
        const updatedList = await saveCustomerAddress({
          id: formData.addressId || undefined,
          label: formData.label || 'Home',
          recipientName: formData.fullName.trim(),
          phone: formatPhoneDigits(formData.phone),
          addressLine1: formData.addressLine1.trim(),
          addressLine2: formData.addressLine2.trim(),
          landmark: formData.landmark.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          pincode: formData.pincode.trim(),
          isDefault: customerAddresses.length === 0 || Boolean(formData.addressId && customerAddresses.find((a) => a.id === formData.addressId)?.isDefault)
        });
        if (updatedList.length > 0) {
          setAddressMode('select');
        }
      } else if (!patronUser) {
        // Store session-only draft (zero persistent insecure PII in localStorage)
        saveGuestCheckoutDraft({
          fullName: formData.fullName.trim(),
          email: formData.email.trim(),
          phone: formatPhoneDigits(formData.phone),
          addressLine1: formData.addressLine1.trim(),
          addressLine2: formData.addressLine2.trim(),
          landmark: formData.landmark.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          pincode: formData.pincode.trim(),
          notes: formData.notes
        });
      }
      setStep(3);
    } catch (err) {
      setOrderError(err.message || 'Could not save delivery address. Your form values were preserved—please retry.');
    } finally {
      setIsSavingStep(false);
    }
  };

  const buildWhatsAppPayload = () => {
    const waNumber = (storeSettings?.whatsappNumber || '919490658858').replace(/[^0-9]/g, '') || '919490658858';

    const itemsText = cart
      .map((item, idx) => {
        const p = item.product || item;
        const unit = Number(p.price ?? p.sellingPrice ?? p.selling_price ?? 0) || 0;
        const lineTotal = unit * item.quantity;
        return `${idx + 1}. ${p.name}\n   SKU: ${p.sku || 'RDH-SAR'}\n   Qty: ${item.quantity} × ₹${unit.toLocaleString('en-IN')} = ₹${lineTotal.toLocaleString('en-IN')}`;
      })
      .join('\n\n');

    let summaryText = `\n\n-------------------------\nBag Subtotal: ₹${subtotal.toLocaleString('en-IN')}`;
    if (discountAmount > 0) {
      summaryText += `\nPromo (${appliedCoupon?.code}): -₹${discountAmount.toLocaleString('en-IN')}`;
    }
    if (giftWrap) {
      summaryText += `\nHeritage Keepsake Box: +₹${giftWrapFee}`;
    }
    summaryText += `\nShipping: ${shippingFee === 0 ? 'Complimentary (FREE)' : `₹${shippingFee}`}`;
    summaryText += `\nEstimated Total: ₹${total.toLocaleString('en-IN')}`;

    const fullAddrLine = [effectiveDelivery.addressLine1, effectiveDelivery.addressLine2].filter(Boolean).join(', ');
    let customerBlock = `\n\nCustomer & Delivery Details:\n• Name: ${effectiveDelivery.fullName}\n• WhatsApp: +91 ${effectiveDelivery.phone}`;
    if (effectiveDelivery.email) {
      customerBlock += `\n• Email: ${effectiveDelivery.email}`;
    }
    customerBlock += `\n• Address: ${fullAddrLine}${effectiveDelivery.landmark ? ` (Landmark: ${effectiveDelivery.landmark})` : ''}`;
    customerBlock += `\n• City / State / PIN: ${effectiveDelivery.city}, ${effectiveDelivery.state} - ${effectiveDelivery.pincode}`;
    if (formData.notes?.trim()) {
      customerBlock += `\n• Note to Atelier: ${formData.notes.trim()}`;
    }

    const fullMessage = `Namaste RODHE Team,\n\nI would like to place an order enquiry for the following handcrafted saree(s):\n\n${itemsText}${summaryText}${customerBlock}\n\nPlease confirm weave availability and share direct payment details (UPI / Bank Transfer) to complete this order. Thank you!`;

    return {
      text: fullMessage,
      url: `https://wa.me/${waNumber}?text=${encodeURIComponent(fullMessage)}`,
      phone: waNumber
    };
  };

  const handleCreateUpiOrder = async () => {
    if (isProcessing) return;
    if (cart.length === 0 || hasUnavailableCartItems) {
      setOrderError('Please ensure all sarees in your bag are available before proceeding.');
      return;
    }

    setIsProcessing(true);
    setOrderError('');

    try {
      const result = await paymentService.createPendingUpiOrder({
        items: cart,
        customer: effectiveDelivery,
        shippingAddress: {
          label: formData.label || 'Home',
          recipientName: effectiveDelivery.fullName,
          phone: effectiveDelivery.phone,
          addressLine1: effectiveDelivery.addressLine1,
          addressLine2: effectiveDelivery.addressLine2,
          landmark: effectiveDelivery.landmark,
          city: effectiveDelivery.city,
          state: effectiveDelivery.state,
          pincode: effectiveDelivery.pincode
        },
        appliedCoupon,
        giftWrap,
        shippingFee,
        discountAmount,
        upiMethod: selectedUpiMethod,
        notes: formData.notes?.trim() || '',
        idempotencyKey: idempotencyKey || undefined
      });

      trackAddPaymentInfo(selectedUpiMethod, cart, result.order?.grandTotal ?? total);
      savePendingUpiOrder(result.sessionRecord);
      setActiveUpiOrder({
        ...result.order,
        ...result.sessionRecord
      });
      setCheckoutMode('upi');
      clearCart();
      setStep(4);
      showToast(`Order #${result.order.orderNumber} created. Complete UPI payment below.`, 'success');
    } catch (err) {
      setOrderError(err.message || 'Unable to initiate UPI order right now. Your shopping bag is preserved.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWhatsAppSupportForUpi = (upiOrder) => {
    const waNumber = (storeSettings?.whatsappNumber || '919490658858').replace(/[^0-9]/g, '') || '919490658858';
    const orderNum = upiOrder?.orderNumber || upiOrder?.order_number || '';
    const amount = Number(upiOrder?.grandTotal ?? upiOrder?.grand_total ?? total) || 0;
    const utr = upiOrder?.utrReference || upiOrder?.utr_reference || '';
    const methodLabel = getUpiMethodConfig(upiOrder?.paymentMethod || selectedUpiMethod).name;
    const msg =
      `Namaste RODHE Concierge,\n\n` +
      `I have placed UPI Order #${orderNum} (₹${amount.toLocaleString('en-IN')}) via ${methodLabel}.\n` +
      (utr ? `• Submitted UTR: ${utr}\n` : '') +
      `• Current Status: ${upiOrder?.paymentStatus || 'PENDING'}\n\n` +
      `Could you please assist with payment verification / confirmation? Thank you!`;
    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
  };

  const handleSendToWhatsApp = () => {
    if (cart.length === 0 || hasUnavailableCartItems) {
      setOrderError('Please ensure all sarees in your bag are available before proceeding.');
      return;
    }

    setIsProcessing(true);
    setOrderError('');
    setPopupBlockedNotice(false);
    setCheckoutMode('whatsapp');

    try {
      const payload = buildWhatsAppPayload();
      setLastWhatsAppText(payload.text);
      setLastWhatsAppUrl(payload.url);

      const opened = window.open(payload.url, '_blank', 'noopener,noreferrer');
      if (!opened) {
        setPopupBlockedNotice(true);
      }

      trackWhatsAppHandover(cart, total);

      // Transition to honest handover state WITHOUT clearing the bag or faking an order confirmation
      setStep(4);
    } catch {
      const payload = buildWhatsAppPayload();
      setLastWhatsAppText(payload.text);
      setLastWhatsAppUrl(payload.url);
      setPopupBlockedNotice(true);
      setStep(4);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyEnquiry = async () => {
    try {
      await navigator.clipboard.writeText(lastWhatsAppText);
      setCopiedMessage(true);
      showToast('Order enquiry message copied! Paste it into WhatsApp.', 'success');
      setTimeout(() => setCopiedMessage(false), 3000);
    } catch {
      showToast('Unable to copy automatically. Please open WhatsApp directly below.', 'info');
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={() => (step === 4 ? setIsCheckoutOpen(false) : null)}
      role="dialog"
      aria-modal="true"
      aria-label="Checkout"
    >
      <div
        className="checkout-modal-card"
        style={{
          width: 'min(980px, 100%)',
          maxWidth: '100%',
          backgroundColor: '#FFFDF9',
          border: '1px solid rgba(184, 141, 74, 0.3)',
          boxShadow: '0 25px 60px rgba(42, 26, 19, 0.3)',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideUp 0.28s ease'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Checkout Header */}
        <div
          style={{
            padding: '0.85rem clamp(0.85rem, 3vw, 2rem)',
            borderBottom: '1px solid rgba(75, 48, 36, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem',
            backgroundColor: '#FAF6EE',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
            <img
              src="/assets/RODHE Woven Luxury Wordmark.png"
              alt="RODHE"
              style={{ height: 'clamp(22px, 4.5vw, 30px)', width: 'auto', flexShrink: 0 }}
            />
            <span style={{ fontSize: 'clamp(0.64rem, 2.4vw, 0.72rem)', color: '#B88D4A', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase' }}>
              • Secure Saree Checkout
            </span>
          </div>

          <button
            onClick={() => setIsCheckoutOpen(false)}
            aria-label="Close checkout"
            style={{ color: '#8F7263', padding: '0.4rem', background: 'none', border: 'none', cursor: 'pointer', minWidth: '36px', minHeight: '36px', flexShrink: 0 }}
          >
            <X size={20} />
          </button>
        </div>

        {/* 4-Step Progress Bar */}
        <div className="checkout-steps-bar">
          {[
            { num: 1, label: '1. Review Bag' },
            { num: 2, label: '2. Details & Address' },
            { num: 3, label: '3. Payment & Review' },
            { num: 4, label: checkoutMode === 'upi' ? '4. UPI Payment' : '4. WhatsApp Handover' }
          ].map((s) => (
            <button
              key={s.num}
              type="button"
              disabled={s.num > step}
              className="checkout-step-pill"
              onClick={() => {
                if (s.num < step && step < 4) setStep(s.num);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                color: step === s.num ? '#4B3024' : step > s.num ? '#525B3A' : '#8F7263',
                fontWeight: step === s.num ? 700 : 500,
                fontSize: 'clamp(0.64rem, 2.3vw, 0.74rem)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                background: 'none',
                border: 'none',
                cursor: s.num < step && step < 4 ? 'pointer' : 'default',
                padding: '0.15rem 0',
                minWidth: 0
              }}
            >
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="checkout-main-content">
          {step < 4 && pendingUpiOrder && pendingUpiOrder.paymentStatus !== 'PAID' && (
            <div
              style={{
                backgroundColor: 'rgba(184, 141, 74, 0.14)',
                borderBottom: '1px solid rgba(184, 141, 74, 0.35)',
                padding: '0.75rem clamp(1rem, 3vw, 2rem)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem',
                flexWrap: 'wrap',
                fontSize: '0.8rem'
              }}
            >
              <span style={{ color: '#4B3024' }}>
                <strong>Pending UPI Order #{pendingUpiOrder.orderNumber}</strong> (₹{Number(pendingUpiOrder.grandTotal || 0).toLocaleString('en-IN')}) — {pendingUpiOrder.paymentStatus}
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setCheckoutMode('upi');
                    setActiveUpiOrder(pendingUpiOrder);
                    setSelectedUpiMethod(getUpiMethodConfig(pendingUpiOrder.paymentMethod).id);
                    setStep(4);
                  }}
                  className="btn btn-primary btn-sm"
                  style={{ fontSize: '0.72rem', padding: '0.35rem 0.75rem', minHeight: '32px' }}
                >
                  Resume UPI Payment
                </button>
                <button
                  type="button"
                  onClick={clearPendingUpiOrder}
                  style={{ fontSize: '0.72rem', color: '#6F4E3E', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer' }}
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {step === 4 && checkoutMode === 'upi' && activeUpiOrder ? (
            <UpiPaymentSection
              key={`${activeUpiOrder.orderNumber}-${getUpiMethodConfig(activeUpiOrder.paymentMethod).id}`}
              order={activeUpiOrder}
              onOrderChange={(updated) => {
                setActiveUpiOrder(updated);
                savePendingUpiOrder({
                  ...pendingUpiOrder,
                  orderId: updated.id || pendingUpiOrder?.orderId,
                  orderNumber: updated.orderNumber || updated.order_number,
                  grandTotal: updated.grandTotal ?? updated.grand_total,
                  paymentMethod: updated.paymentMethod || updated.payment_method,
                  paymentStatus: updated.paymentStatus || updated.payment_status,
                  paymentExpiresAt: updated.paymentExpiresAt || updated.payment_expires_at,
                  utrReference: updated.utrReference || updated.utr_reference || '',
                  contact: pendingUpiOrder?.contact || effectiveDelivery.email || effectiveDelivery.phone
                });
              }}
              onOpenWhatsAppSupport={handleWhatsAppSupportForUpi}
              showToast={showToast}
              onDismissSessionOrder={() => {
                clearPendingUpiOrder();
                setIsCheckoutOpen(false);
                navigateTo('home');
              }}
            />
          ) : step === 4 ? (
            /* STEP 4: Honest WhatsApp Handover Screen */
            <div style={{ padding: 'clamp(1.75rem, 4.5vw, 3rem) clamp(1rem, 3vw, 2rem)', textAlign: 'center', maxWidth: '640px', margin: '0 auto', width: '100%' }}>
              <div
                style={{
                  width: '62px',
                  height: '62px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(37, 211, 102, 0.14)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.15rem',
                  color: '#25D366'
                }}
              >
                <MessageCircle size={34} />
              </div>

              <div style={{ fontSize: '0.74rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#525B3A', fontWeight: 700, marginBottom: '0.4rem' }}>
                Redirecting to WhatsApp Concierge
              </div>

              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.7rem, 4vw, 2.25rem)', color: '#4B3024', marginBottom: '0.7rem' }}>
                Send Your Enquiry in WhatsApp
              </h2>

              <p style={{ fontSize: '0.88rem', color: '#6F4E3E', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                {popupBlockedNotice
                  ? 'Your browser blocked the automatic WhatsApp window. Tap "Open WhatsApp Chat" below or copy your summary message to send it manually.'
                  : 'We prepared your order enquiry for WhatsApp (+91 9490658858). Please tap Send in WhatsApp so our boutique team can verify availability and share direct payment details.'}
              </p>

              {/* Honest Handover Notice */}
              <div
                style={{
                  backgroundColor: '#FAF6EE',
                  border: '1px solid rgba(184, 141, 74, 0.3)',
                  padding: '1.15rem',
                  textAlign: 'left',
                  fontSize: '0.83rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.6rem',
                  marginBottom: '1.5rem'
                }}
              >
                <div className="confirmation-spec-row">
                  <span style={{ color: '#8F7263' }}>Enquiry Status:</span>
                  <span style={{ fontWeight: 600, color: '#B88D4A' }}>Pending WhatsApp Send (Not Yet Confirmed)</span>
                </div>
                <div className="confirmation-spec-row">
                  <span style={{ color: '#8F7263' }}>Payment Status:</span>
                  <span style={{ fontWeight: 600, color: '#4B3024' }}>Unpaid — Arranged directly with RODHE in chat</span>
                </div>
                <div className="confirmation-spec-row">
                  <span style={{ color: '#8F7263' }}>Your Shopping Bag:</span>
                  <span style={{ fontWeight: 600, color: '#525B3A' }}>Preserved safely ({cart.length} {cart.length === 1 ? 'item' : 'items'})</span>
                </div>
                <div className="confirmation-spec-row" style={{ borderTop: '1px solid rgba(75, 48, 36, 0.1)', paddingTop: '0.55rem' }}>
                  <span style={{ color: '#4B3024', fontWeight: 600 }}>Estimated Bag Total:</span>
                  <span style={{ fontWeight: 700, color: '#4B3024', fontFamily: 'var(--font-serif)', fontSize: '1.15rem' }}>
                    ₹{total.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', alignItems: 'center' }}>
                {lastWhatsAppUrl && (
                  <a
                    href={lastWhatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn"
                    style={{
                      width: '100%',
                      maxWidth: '360px',
                      backgroundColor: '#25D366',
                      color: '#FFFFFF',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      fontWeight: 600,
                      textDecoration: 'none',
                      padding: '0.88rem 1.25rem',
                      borderRadius: '3px',
                      minHeight: '48px'
                    }}
                  >
                    <MessageCircle size={18} />
                    <span>Open WhatsApp Chat</span>
                  </a>
                )}

                <button
                  onClick={handleCopyEnquiry}
                  className="btn btn-outline"
                  style={{ width: '100%', maxWidth: '360px', minHeight: '44px' }}
                >
                  {copiedMessage ? <Check size={16} color="#525B3A" /> : <Copy size={15} />}
                  <span>{copiedMessage ? 'Enquiry Message Copied' : 'Copy Enquiry Message (Fallback)'}</span>
                </button>

                <div style={{ display: 'flex', gap: '0.65rem', width: '100%', maxWidth: '360px', marginTop: '0.25rem' }}>
                  <button
                    onClick={() => setStep(2)}
                    className="btn btn-outline btn-sm"
                    style={{ flex: 1 }}
                  >
                    Edit Address / Details
                  </button>
                  <button
                    onClick={() => {
                      setIsCheckoutOpen(false);
                      navigateTo('home');
                    }}
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1 }}
                  >
                    Continue Browsing
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="checkout-two-col-grid">
              {/* Left Column: Active Checkout Step */}
              <div className="checkout-left-col">
                {/* STEP 1: REVIEW BAG */}
                {step === 1 && (
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.45rem', color: '#4B3024', marginBottom: '0.35rem' }}>
                      Review Your Bag
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: '#8F7263', marginBottom: '1.15rem' }}>
                      Confirm quantities, gift packaging, or promo codes before entering delivery details.
                    </p>

                    {cart.length === 0 ? (
                      <div style={{ padding: '2rem 1rem', textAlign: 'center', backgroundColor: '#FAF6EE', border: '1px solid rgba(184, 141, 74, 0.2)' }}>
                        <ShoppingBag size={30} color="#B88D4A" style={{ margin: '0 auto 0.65rem' }} />
                        <p style={{ fontSize: '0.88rem', color: '#6F4E3E', marginBottom: '1rem' }}>
                          Your shopping bag is currently empty.
                        </p>
                        <button
                          onClick={() => {
                            setIsCheckoutOpen(false);
                            navigateTo('shop');
                          }}
                          className="btn btn-primary btn-sm"
                        >
                          Browse Sarees
                        </button>
                      </div>
                    ) : (
                      <>
                        {hasUnavailableCartItems && (
                          <div style={{ padding: '0.75rem 0.9rem', backgroundColor: 'rgba(201, 130, 120, 0.15)', border: '1px solid #C98278', color: '#8A2A20', fontSize: '0.8rem', borderRadius: '3px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <AlertCircle size={15} style={{ flexShrink: 0 }} />
                            <span>Remove unavailable or out-of-stock sarees below before continuing checkout.</span>
                          </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', marginBottom: '1.25rem' }}>
                          {cart.map((item) => {
                            const p = item.product || item;
                            const unitPrice = Number(p.price ?? p.sellingPrice ?? p.selling_price ?? 0) || 0;
                            const stockLimit = typeof p.stockCount === 'number' ? p.stockCount : Number(p.stock_count ?? 10);
                            const isUnavail = Boolean(item.isUnavailable || item.isOutOfStock || (p.status && p.status !== 'published') || !p.inStock || stockLimit <= 0);

                            return (
                              <div
                                key={p.id || p.sku}
                                style={{
                                  display: 'flex',
                                  gap: '0.8rem',
                                  padding: '0.75rem',
                                  backgroundColor: '#FAF6EE',
                                  border: '1px solid rgba(75, 48, 36, 0.1)',
                                  alignItems: 'center',
                                  opacity: isUnavail ? 0.72 : 1
                                }}
                              >
                                <img
                                  src={p.primaryImage || p.primary_image || '/assets/products/saree_ivory_mulmul.jpg'}
                                  alt={p.name || 'Saree'}
                                  style={{ width: '52px', height: '68px', objectFit: 'cover', flexShrink: 0 }}
                                  onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = '/assets/products/saree_ivory_mulmul.jpg';
                                  }}
                                />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#4B3024' }}>{p.name}</div>
                                  <div style={{ fontSize: '0.72rem', color: '#8F7263' }}>
                                    SKU: {p.sku || 'RDH'} • ₹{unitPrice.toLocaleString('en-IN')} each
                                  </div>
                                  {isUnavail && (
                                    <div style={{ fontSize: '0.72rem', color: '#8A2A20', fontWeight: 600 }}>
                                      Unavailable — please remove
                                    </div>
                                  )}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginTop: '0.45rem' }}>
                                    <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid rgba(75, 48, 36, 0.2)', backgroundColor: '#FFFDF9' }}>
                                      <button
                                        type="button"
                                        onClick={() => updateQuantity(p, item.quantity - 1)}
                                        disabled={item.quantity <= 1 || isUnavail}
                                        style={{ padding: '0.25rem 0.5rem', cursor: item.quantity <= 1 || isUnavail ? 'not-allowed' : 'pointer', opacity: item.quantity <= 1 ? 0.35 : 1 }}
                                        aria-label="Decrease quantity"
                                      >
                                        <Minus size={11} />
                                      </button>
                                      <span style={{ padding: '0 0.45rem', fontSize: '0.78rem', fontWeight: 600 }}>{item.quantity}</span>
                                      <button
                                        type="button"
                                        onClick={() => updateQuantity(p, item.quantity + 1)}
                                        disabled={(stockLimit > 0 && item.quantity >= stockLimit) || isUnavail}
                                        style={{ padding: '0.25rem 0.5rem', cursor: (stockLimit > 0 && item.quantity >= stockLimit) || isUnavail ? 'not-allowed' : 'pointer', opacity: stockLimit > 0 && item.quantity >= stockLimit ? 0.35 : 1 }}
                                        aria-label="Increase quantity"
                                      >
                                        <Plus size={11} />
                                      </button>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => removeFromCart(p)}
                                      style={{ color: '#8F7263', fontSize: '0.74rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: 'none', border: 'none', cursor: 'pointer' }}
                                      aria-label={`Remove ${p.name}`}
                                    >
                                      <Trash2 size={13} />
                                      <span>Remove</span>
                                    </button>
                                  </div>
                                </div>
                                <div style={{ fontWeight: 700, fontFamily: 'var(--font-serif)', fontSize: '1.05rem', color: '#4B3024', flexShrink: 0 }}>
                                  ₹{(unitPrice * item.quantity).toLocaleString('en-IN')}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Promo & Gift Options */}
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: '#4B3024', marginBottom: '0.85rem', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={giftWrap}
                            onChange={(e) => setGiftWrap(e.target.checked)}
                            style={{ accentColor: '#B88D4A' }}
                          />
                          <span>Add RODHE Heritage Keepsake Box (+₹{storeSettings.giftWrapFee})</span>
                        </label>

                        <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: '0.5rem', marginBottom: couponError ? '0.35rem' : '1rem', width: '100%' }}>
                          <input
                            type="text"
                            placeholder="Promo code (e.g. WOVEN10)"
                            value={couponInput}
                            onChange={(e) => {
                              setCouponInput(e.target.value);
                              if (couponError) setCouponError('');
                            }}
                            className="form-input"
                            style={{ flex: 1, minWidth: 0, minHeight: '40px', padding: '0.5rem 0.75rem', fontSize: '0.82rem' }}
                          />
                          <button type="submit" className="btn btn-primary btn-sm" style={{ minHeight: '40px', flexShrink: 0 }}>
                            Apply
                          </button>
                        </form>
                        {couponError && <p style={{ fontSize: '0.74rem', color: '#8A2A20', marginBottom: '0.75rem' }}>{couponError}</p>}

                        {appliedCoupon && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.45rem 0.75rem', backgroundColor: 'rgba(184, 141, 74, 0.14)', fontSize: '0.78rem', marginBottom: '1rem' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                              <Tag size={13} color="#B88D4A" />
                              <strong>{appliedCoupon.code}</strong> applied
                            </span>
                            <button onClick={removeCoupon} style={{ fontSize: '0.74rem', color: '#8F7263', cursor: 'pointer' }}>
                              Remove
                            </button>
                          </div>
                        )}

                        <button
                          onClick={() => setStep(2)}
                          disabled={hasUnavailableCartItems}
                          className="btn btn-primary"
                          style={{ width: '100%', minHeight: '48px', opacity: hasUnavailableCartItems ? 0.5 : 1 }}
                        >
                          <span>Continue to Customer Details</span>
                          <ArrowRight size={16} />
                        </button>
                      </>
                    )}
                  </div>
                )}

                {/* STEP 2: CUSTOMER & DELIVERY DETAILS (Supports Selecting, Editing, Adding Saved Addresses + Safe Guest Drafts) */}
                {step === 2 && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                      <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.45rem', color: '#4B3024', margin: 0 }}>
                        Customer & Delivery Address
                      </h3>
                      {!patronUser && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsCheckoutOpen(false);
                            setIsAuthOpen(true);
                          }}
                          style={{ fontSize: '0.76rem', color: '#B88D4A', fontWeight: 600, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          <User size={12} style={{ display: 'inline', marginRight: '3px' }} />
                          Sign in for saved addresses
                        </button>
                      )}
                    </div>

                    <p style={{ fontSize: '0.8rem', color: '#8F7263', marginBottom: '1.15rem' }}>
                      {patronUser
                        ? 'Choose a saved delivery destination, edit an existing address, or add a new one.'
                        : 'Guest delivery details stay in your current browser session only for your privacy.'}
                    </p>

                    {orderError && (
                      <div style={{ padding: '0.75rem 0.9rem', backgroundColor: 'rgba(201, 130, 120, 0.15)', border: '1px solid #C98278', color: '#8A2A20', fontSize: '0.8rem', borderRadius: '3px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <AlertCircle size={15} style={{ flexShrink: 0 }} />
                        <span>{orderError}</span>
                      </div>
                    )}

                    {/* Returning Authenticated Customer Saved Address Selector */}
                    {patronUser && customerAddresses.length > 0 && addressMode === 'select' ? (
                      <div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1rem' }}>
                          {customerAddresses.map((addr) => {
                            const isSelected = addr.id === (selectedAddressId || activeAddressObj?.id);
                            return (
                              <div
                                key={addr.id}
                                onClick={() => handleSelectSavedAddress(addr)}
                                style={{
                                  padding: '0.95rem 1rem',
                                  backgroundColor: isSelected ? '#FAF6EE' : '#FFFFFF',
                                  border: isSelected ? '1.5px solid #B88D4A' : '1px solid rgba(75, 48, 36, 0.16)',
                                  borderRadius: '3px',
                                  cursor: 'pointer'
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem', gap: '0.5rem', flexWrap: 'wrap' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input
                                      type="radio"
                                      name="checkout_saved_addr"
                                      checked={isSelected}
                                      onChange={() => handleSelectSavedAddress(addr)}
                                      style={{ accentColor: '#B88D4A' }}
                                    />
                                    <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0.15rem 0.45rem', backgroundColor: '#EADAB5', color: '#4B3024' }}>
                                      {addr.label || 'Home'}
                                    </span>
                                    {addr.isDefault && (
                                      <span style={{ fontSize: '0.7rem', color: '#525B3A', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                                        <Star size={11} fill="#525B3A" /> Default
                                      </span>
                                    )}
                                  </div>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStartEditAddress(addr);
                                    }}
                                    className="btn btn-outline btn-sm"
                                    style={{ minHeight: '32px', padding: '0.25rem 0.65rem' }}
                                  >
                                    <Edit2 size={12} />
                                    <span>Edit Address</span>
                                  </button>
                                </div>

                                <div style={{ fontSize: '0.84rem', color: '#4B3024', lineHeight: 1.5, paddingLeft: '1.45rem' }}>
                                  <strong>{addr.recipientName}</strong> • +91 {addr.phone}<br />
                                  {addr.addressLine1}
                                  {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                                  {addr.landmark ? ` • Landmark: ${addr.landmark}` : ''}<br />
                                  {addr.city}, {addr.state} — <strong>{addr.pincode}</strong>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleStartEditAddress(null)}
                          className="btn btn-outline btn-sm"
                          style={{ marginBottom: '1.25rem', width: '100%' }}
                        >
                          <Plus size={14} />
                          <span>Add / Use a Different Delivery Address</span>
                        </button>
                      </div>
                    ) : (
                      /* Address Entry / Edit Form */
                      <div>
                        {patronUser && customerAddresses.length > 0 && (
                          <div style={{ marginBottom: '0.85rem' }}>
                            <button
                              type="button"
                              onClick={() => setAddressMode('select')}
                              style={{ fontSize: '0.78rem', color: '#B88D4A', fontWeight: 600, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                              ← Back to Saved Addresses
                            </button>
                          </div>
                        )}

                        <div className="form-two-col">
                          <div className="form-group">
                            <label className="form-label">Full Name *</label>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="e.g. Ananya Deshmukh"
                              value={formData.fullName}
                              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            />
                            {formErrors.fullName && <span className="field-err">{formErrors.fullName}</span>}
                          </div>

                          <div className="form-group">
                            <label className="form-label">WhatsApp Number (10 digits) *</label>
                            <div style={{ display: 'flex', minWidth: 0, width: '100%' }}>
                              <span style={{ padding: '0.75rem 0.75rem', backgroundColor: '#F4ECE1', border: '1px solid rgba(75, 48, 36, 0.15)', fontSize: '0.86rem', fontWeight: 600, flexShrink: 0, display: 'inline-flex', alignItems: 'center' }}>
                                +91
                              </span>
                              <input
                                type="tel"
                                inputMode="numeric"
                                className="form-input"
                                style={{ borderLeft: 'none', flex: 1, minWidth: 0 }}
                                placeholder="10-digit mobile"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                              />
                            </div>
                            {formErrors.phone && <span className="field-err">{formErrors.phone}</span>}
                          </div>
                        </div>

                        <div className="form-group">
                          <label className="form-label">Email Address (Optional, for dispatch updates)</label>
                          <input
                            type="email"
                            className="form-input"
                            placeholder="e.g. ananya@example.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          />
                          {formErrors.email && <span className="field-err">{formErrors.email}</span>}
                        </div>

                        <div className="form-group">
                          <label className="form-label">House / Flat No., Building *</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. Flat 402, Heritage Enclave"
                            value={formData.addressLine1}
                            onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                          />
                          {formErrors.addressLine1 && <span className="field-err">{formErrors.addressLine1}</span>}
                        </div>

                        <div className="form-two-col">
                          <div className="form-group">
                            <label className="form-label">Street / Area / Locality</label>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="e.g. Lavelle Road"
                              value={formData.addressLine2}
                              onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                            />
                          </div>

                          <div className="form-group">
                            <label className="form-label">Landmark (Optional)</label>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="e.g. Near Metro Station"
                              value={formData.landmark}
                              onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="form-two-col">
                          <div className="form-group">
                            <label className="form-label">6-Digit PIN Code *</label>
                            <input
                              type="text"
                              inputMode="numeric"
                              maxLength={6}
                              className="form-input"
                              placeholder="e.g. 560001"
                              value={formData.pincode}
                              onChange={(e) => handlePincodeChange(e.target.value)}
                            />
                            {formErrors.pincode && <span className="field-err">{formErrors.pincode}</span>}
                          </div>

                          <div className="form-group">
                            <label className="form-label">City *</label>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="e.g. Bengaluru"
                              value={formData.city}
                              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            />
                            {formErrors.city && <span className="field-err">{formErrors.city}</span>}
                          </div>
                        </div>

                        <div className="form-group">
                          <label className="form-label">State *</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. Karnataka"
                            value={formData.state}
                            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                          />
                          {formErrors.state && <span className="field-err">{formErrors.state}</span>}
                        </div>

                        {patronUser && (
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: '#4B3024', marginBottom: '1rem', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={formData.saveToAccount}
                              onChange={(e) => setFormData({ ...formData, saveToAccount: e.target.checked })}
                              style={{ accentColor: '#B88D4A' }}
                            />
                            <span>{formData.addressId ? 'Update this saved address on my account' : 'Save this address to my account for next visit'}</span>
                          </label>
                        )}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '0.65rem', marginTop: '0.75rem', width: '100%', maxWidth: '100%' }}>
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="btn btn-outline"
                        style={{ padding: '0.85rem 1rem', minHeight: '48px', flexShrink: 0 }}
                        aria-label="Back to bag review"
                      >
                        <ArrowLeft size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={validateAndProceedFromDetails}
                        disabled={isSavingStep}
                        className="btn btn-primary"
                        style={{ flex: 1, minWidth: 0, minHeight: '48px', padding: '0.85rem 1rem' }}
                      >
                        <span>{isSavingStep ? 'Saving Details...' : 'Continue to Final Review'}</span>
                        <ArrowRight size={16} style={{ flexShrink: 0 }} />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: FINAL REVIEW & SEND TO WHATSAPP */}
                {step === 3 && (
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.45rem', color: '#4B3024', marginBottom: '0.35rem' }}>
                      Final Order Review
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: '#8F7263', marginBottom: '1.1rem' }}>
                      Verify your delivery address, contact number, and sarees before opening WhatsApp.
                    </p>

                    {/* Delivery Address Review Box */}
                    <div
                      style={{
                        backgroundColor: '#FAF6EE',
                        border: '1px solid rgba(184, 141, 74, 0.25)',
                        padding: '1rem',
                        marginBottom: '1.15rem',
                        fontSize: '0.84rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#B88D4A', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          <MapPin size={13} /> Delivery Destination
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (activeAddressObj) {
                              handleStartEditAddress(activeAddressObj);
                            }
                            setStep(2);
                          }}
                          style={{ fontSize: '0.76rem', color: '#4B3024', fontWeight: 600, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          Edit Address
                        </button>
                      </div>

                      <div style={{ color: '#4B3024', lineHeight: 1.55, overflowWrap: 'anywhere' }}>
                        <strong>{effectiveDelivery.fullName}</strong> • +91 {effectiveDelivery.phone}
                        {effectiveDelivery.email ? ` • ${effectiveDelivery.email}` : ''}<br />
                        {effectiveDelivery.addressLine1}
                        {effectiveDelivery.addressLine2 ? `, ${effectiveDelivery.addressLine2}` : ''}
                        {effectiveDelivery.landmark ? ` (Landmark: ${effectiveDelivery.landmark})` : ''}<br />
                        {effectiveDelivery.city}, {effectiveDelivery.state} — <strong>{effectiveDelivery.pincode}</strong>
                      </div>
                    </div>

                    {/* Note to Atelier */}
                    <div className="form-group" style={{ marginBottom: '1.15rem' }}>
                      <label className="form-label">Note to Atelier (Optional: blouse query or delivery timing)</label>
                      <textarea
                        rows={2}
                        className="form-input"
                        placeholder="e.g. Please confirm matching blouse border availability."
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        style={{ resize: 'none' }}
                      />
                    </div>

                    {/* STEP 3: UPI PAYMENT SELECTION & WHATSAPP ENQUIRY ALTERNATIVE */}
                    <div
                      style={{
                        backgroundColor: '#FAF6EE',
                        border: '1px solid rgba(184, 141, 74, 0.35)',
                        borderRadius: '4px',
                        padding: '1rem',
                        marginBottom: '1rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: '#4B3024', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                          <QrCode size={15} color="#B88D4A" /> Select Direct UPI Payment (Scan & Pay or App)
                        </span>
                        <span style={{ fontSize: '0.7rem', color: '#525B3A', fontWeight: 600 }}>Zero Gateway Fee</span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.6rem', marginBottom: '0.85rem' }}>
                        {UPI_METHOD_LIST.map((m) => {
                          const isSelected = selectedUpiMethod === m.id;
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => setSelectedUpiMethod(m.id)}
                              aria-pressed={isSelected}
                              style={{
                                padding: '0.75rem 0.45rem',
                                borderRadius: '4px',
                                border: isSelected ? '2px solid #4B3024' : '1px solid rgba(75, 48, 36, 0.18)',
                                backgroundColor: isSelected ? '#EADAB5' : '#FFFDF9',
                                color: '#4B3024',
                                cursor: 'pointer',
                                textAlign: 'center',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{m.name}</div>
                              <div style={{ fontSize: '0.68rem', color: '#6F4E3E', marginTop: '0.15rem' }}>
                                QR & UPI ID
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      <p style={{ margin: '0 0 0.85rem', fontSize: '0.76rem', color: '#6F4E3E', lineHeight: 1.5 }}>
                        Clicking below creates your pending order & reveals the verified <strong>{getUpiMethodConfig(selectedUpiMethod).name}</strong> QR code
                        (Payee: <strong>{getUpiMethodConfig(selectedUpiMethod).payeeName}</strong>). Payment status remains <strong>Pending / Awaiting Verification</strong> until verified by our atelier team.
                      </p>

                      <div style={{ display: 'flex', gap: '0.65rem', width: '100%', maxWidth: '100%' }}>
                        <button
                          type="button"
                          onClick={() => setStep(2)}
                          className="btn btn-outline"
                          style={{ padding: '0.85rem 1rem', minHeight: '48px', flexShrink: 0 }}
                          aria-label="Back to delivery details"
                        >
                          <ArrowLeft size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={handleCreateUpiOrder}
                          disabled={isProcessing}
                          className="btn btn-primary"
                          style={{
                            flex: 1,
                            minWidth: 0,
                            minHeight: '48px',
                            padding: '0.85rem 1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem'
                          }}
                        >
                          <Smartphone size={17} color="#EADAB5" style={{ flexShrink: 0 }} />
                          <span>
                            {isProcessing
                              ? 'Reserving Sarees...'
                              : `Pay ₹${total.toLocaleString('en-IN')} with ${getUpiMethodConfig(selectedUpiMethod).name}`}
                          </span>
                        </button>
                      </div>
                    </div>

                    {orderError && (
                      <div style={{ padding: '0.75rem 0.9rem', backgroundColor: 'rgba(201, 130, 120, 0.15)', border: '1px solid #C98278', color: '#8A2A20', fontSize: '0.8rem', borderRadius: '3px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <AlertCircle size={15} style={{ flexShrink: 0 }} />
                        <span>{orderError}</span>
                      </div>
                    )}

                    {/* Preserved Concierge WhatsApp Enquiry Alternative */}
                    <div
                      style={{
                        padding: '0.85rem 1rem',
                        backgroundColor: '#F4ECE1',
                        borderLeft: '3px solid #525B3A',
                        fontSize: '0.78rem',
                        color: '#4B3024',
                        lineHeight: 1.5
                      }}
                    >
                      <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Prefer Concierge Enquiry First?</strong>
                      <p style={{ margin: '0 0 0.7rem', color: '#6F4E3E' }}>
                        No online payment is taken when using WhatsApp. Send your enquiry so our stylists confirm weave availability first.
                      </p>
                      <button
                        type="button"
                        onClick={handleSendToWhatsApp}
                        disabled={isProcessing}
                        className="btn"
                        style={{
                          width: '100%',
                          minWidth: 0,
                          minHeight: '44px',
                          padding: '0.8rem 1rem',
                          backgroundColor: '#525B3A',
                          color: '#FAF6EE',
                          border: 'none',
                          borderRadius: '3px',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          cursor: 'pointer'
                        }}
                      >
                        <MessageCircle size={17} color="#D4AC68" style={{ flexShrink: 0 }} />
                        <span>{isProcessing ? 'Preparing WhatsApp...' : 'Send Order Enquiry on WhatsApp'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Consistent Live Order Summary */}
              <div className="checkout-summary-col">
                <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', color: '#4B3024', marginBottom: '0.9rem' }}>
                  Order Summary ({cart.length} {cart.length === 1 ? 'saree' : 'sarees'})
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', maxHeight: '220px', overflowY: 'auto', marginBottom: '1.15rem' }}>
                  {cart.map((item) => {
                    const p = item.product || item;
                    const unit = Number(p.price ?? p.sellingPrice ?? p.selling_price ?? 0) || 0;
                    return (
                      <div key={p.id || p.sku} style={{ display: 'flex', gap: '0.7rem', alignItems: 'center' }}>
                        <img
                          src={p.primaryImage || p.primary_image || '/assets/products/saree_ivory_mulmul.jpg'}
                          alt=""
                          style={{ width: '42px', height: '54px', objectFit: 'cover', flexShrink: 0 }}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = '/assets/products/saree_ivory_mulmul.jpg';
                          }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#4B3024', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.name}
                          </div>
                          <span style={{ fontSize: '0.72rem', color: '#8F7263' }}>
                            SKU: {p.sku || 'RDH'} • Qty: {item.quantity}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#4B3024', flexShrink: 0 }}>
                          ₹{(unit * item.quantity).toLocaleString('en-IN')}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Price Breakdown */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.82rem', borderTop: '1px solid rgba(75, 48, 36, 0.1)', paddingTop: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6F4E3E' }}>
                    <span>Subtotal</span>
                    <span>₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>

                  {discountAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#525B3A', fontWeight: 600 }}>
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
                    <span>{isFreeShipping ? 'FREE' : `₹${shippingFee}`}</span>
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
                    <span>Estimated Total</span>
                    <span>₹{total.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div style={{ marginTop: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.76rem', color: '#8F7263' }}>
                  <ShieldCheck size={16} color="#B88D4A" style={{ flexShrink: 0 }} />
                  <span>Insured handloom transit • Personal atelier verification</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <style>{`
          .checkout-modal-card {
            max-height: 94dvh !important;
          }
          .checkout-steps-bar {
            padding: 0.6rem clamp(0.75rem, 3vw, 2rem);
            background-color: #FFFDF9;
            border-bottom: 1px solid rgba(75, 48, 36, 0.08);
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 0.35rem 0.65rem;
            flex-shrink: 0;
          }
          .checkout-step-pill {
            justify-content: flex-start;
            text-align: left;
            white-space: normal;
            line-height: 1.25;
          }
          @media (min-width: 600px) {
            .checkout-steps-bar {
              display: flex;
              align-items: center;
              justify-content: center;
              flex-wrap: wrap;
              gap: 0.35rem clamp(0.85rem, 2.2vw, 1.75rem);
            }
            .checkout-step-pill {
              justify-content: center;
              text-align: center;
              white-space: nowrap;
            }
          }
          .checkout-main-content {
            flex-grow: 1;
            overflow-y: auto;
            overflow-x: hidden;
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
            -webkit-overflow-scrolling: touch;
          }
          .checkout-two-col-grid {
            display: grid;
            grid-template-columns: minmax(0, 1fr);
            width: 100%;
            max-width: 100%;
          }
          .checkout-left-col {
            padding: clamp(0.95rem, 3.2vw, 1.85rem);
            min-width: 0;
            max-width: 100%;
            box-sizing: border-box;
          }
          .checkout-summary-col {
            padding: clamp(0.95rem, 3.2vw, 1.85rem);
            background-color: #FAF6EE;
            border-top: 1px solid rgba(75, 48, 36, 0.1);
            min-width: 0;
            max-width: 100%;
            box-sizing: border-box;
          }
          @media (min-width: 768px) {
            .checkout-two-col-grid {
              grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
            }
            .checkout-summary-col {
              border-top: none;
              border-left: 1px solid rgba(75, 48, 36, 0.08);
            }
          }
          @media (max-width: 540px) {
            .checkout-modal-card .btn {
              white-space: normal;
              text-align: center;
              padding: 0.78rem 0.9rem;
              font-size: 0.76rem;
              letter-spacing: 0.07em;
              line-height: 1.3;
              min-width: 0;
            }
            .checkout-modal-card .btn-sm {
              padding: 0.45rem 0.75rem;
              font-size: 0.7rem;
            }
          }
          .form-two-col {
            display: grid;
            grid-template-columns: minmax(0, 1fr);
            gap: 0.75rem;
          }
          @media (min-width: 520px) {
            .form-two-col {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
          }
          .field-err {
            display: block;
            font-size: 0.72rem;
            color: #8A2A20;
            margin-top: 0.25rem;
            font-weight: 500;
          }
          .confirmation-spec-row {
            display: flex;
            flex-direction: column;
            gap: 0.2rem;
          }
          @media (min-width: 520px) {
            .confirmation-spec-row {
              flex-direction: row;
              justify-content: space-between;
              align-items: center;
            }
          }
        `}</style>
      </div>
    </div>
  );
};
