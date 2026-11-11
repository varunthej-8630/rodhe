import React, { useState, useEffect } from 'react';
import {
  Copy,
  Check,
  Download,
  ExternalLink,
  Clock,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  MessageCircle,
  Smartphone,
  QrCode
} from 'lucide-react';
import {
  PAYMENT_STATUS,
  UPI_METHOD_LIST,
  buildUpiIntentUrls,
  getPaymentStatusMeta,
  getUpiMethodConfig,
  normalizeAndValidateUtr,
  normalizePaymentStatus
} from '../config/upiConfig';
import { paymentService } from '../services/paymentService';

function formatCountdown(msLeft) {
  if (msLeft <= 0) return '00:00';
  const totalSec = Math.floor(msLeft / 1000);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export const UpiPaymentSection = ({
  order,
  onOrderChange,
  onOpenWhatsAppSupport,
  showToast,
  onDismissSessionOrder
}) => {
  const activeMethodId = getUpiMethodConfig(order?.paymentMethod || order?.payment_method).id;
  const methodCfg = getUpiMethodConfig(activeMethodId);
  const currentStatus = normalizePaymentStatus(order?.paymentStatus || order?.payment_status);
  const statusMeta = getPaymentStatusMeta(currentStatus);

  const [utrInput, setUtrInput] = useState(order?.utrReference || order?.utr_reference || '');
  const [utrError, setUtrError] = useState('');
  const [isSubmittingUtr, setIsSubmittingUtr] = useState(false);
  const [isSwitchingMethod, setIsSwitchingMethod] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedKey, setCopiedKey] = useState('');
  const [qrLoadError, setQrLoadError] = useState(false);
  const [returnedFromApp, setReturnedFromApp] = useState(false);
  const [appLaunchNote, setAppLaunchNote] = useState('');
  const [actionError, setActionError] = useState('');
  const [nowMs, setNowMs] = useState(() => Date.now());

  const expiresAtMs = order?.paymentExpiresAt || order?.payment_expires_at
    ? new Date(order.paymentExpiresAt || order.payment_expires_at).getTime()
    : 0;
  const msRemaining = expiresAtMs ? Math.max(0, expiresAtMs - nowMs) : 0;
  const isWindowExpired =
    Boolean(expiresAtMs) &&
    msRemaining <= 0 &&
    ![PAYMENT_STATUS.PAID, PAYMENT_STATUS.CANCELLED, PAYMENT_STATUS.REFUNDED, PAYMENT_STATUS.AWAITING_VERIFICATION].includes(currentStatus);

  // Countdown tick for pending UPI window
  useEffect(() => {
    if (!expiresAtMs || [PAYMENT_STATUS.PAID, PAYMENT_STATUS.CANCELLED, PAYMENT_STATUS.REFUNDED].includes(currentStatus)) {
      return;
    }
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, [expiresAtMs, currentStatus]);

  // Detect return from mobile UPI app cleanly WITHOUT assuming payment succeeded
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && appLaunchNote) {
        setReturnedFromApp(true);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [appLaunchNote]);

  if (!order) return null;

  const orderNumber = order.orderNumber || order.order_number;
  const grandTotal = Number(order.grandTotal ?? order.grand_total ?? 0) || 0;
  const contact = order.customerEmail || order.customer_email || order.customerPhone || order.customer_phone || order.contact || '';
  const intent = buildUpiIntentUrls({
    methodId: methodCfg.id,
    amount: grandTotal,
    orderNumber
  });

  const handleCopy = async (key, text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      if (showToast) showToast(`${label} copied!`, 'success');
      setTimeout(() => setCopiedKey(''), 2400);
    } catch {
      if (showToast) showToast(`Copy unavailable — please note ${text}`, 'info');
    }
  };

  const handleSwitchUpiApp = async (targetMethodId) => {
    if (isSwitchingMethod) return;
    if ([PAYMENT_STATUS.PAID, PAYMENT_STATUS.CANCELLED, PAYMENT_STATUS.REFUNDED].includes(currentStatus)) return;
    setActionError('');
    setIsSwitchingMethod(true);
    try {
      const res = await paymentService.retryWithMethod({
        orderNumber,
        contact,
        upiMethod: targetMethodId
      });
      setQrLoadError(false);
      onOrderChange({
        ...order,
        paymentMethod: res.payment_method || targetMethodId,
        payment_method: res.payment_method || targetMethodId,
        paymentStatus: res.payment_status || PAYMENT_STATUS.PENDING,
        payment_status: res.payment_status || PAYMENT_STATUS.PENDING,
        paymentExpiresAt: res.payment_expires_at || order.paymentExpiresAt,
        payment_expires_at: res.payment_expires_at || order.payment_expires_at
      });
    } catch (err) {
      setActionError(err.message || 'Unable to switch payment method right now.');
    } finally {
      setIsSwitchingMethod(false);
    }
  };

  const handleLaunchUpiIntent = (useAppSpecific = false) => {
    const targetUrl = useAppSpecific ? intent.appSpecificUrl : intent.standardUrl;
    setAppLaunchNote(
      `If ${methodCfg.name} did not open automatically on this device, please scan the QR code or pay via the copied UPI ID.`
    );
    try {
      window.location.href = targetUrl;
    } catch {
      setAppLaunchNote(
        `Unable to launch a UPI app from this browser. Scan the ${methodCfg.name} QR code or pay to ${methodCfg.vpa}.`
      );
    }
  };

  const handleSubmitUtr = async (e) => {
    e.preventDefault();
    if (isSubmittingUtr) return;
    setUtrError('');
    setActionError('');

    const check = normalizeAndValidateUtr(utrInput);
    if (!check.valid) {
      setUtrError(check.error);
      return;
    }

    setIsSubmittingUtr(true);
    try {
      const res = await paymentService.submitUtr({
        orderNumber,
        contact,
        utrReference: check.value,
        upiMethod: methodCfg.id
      });
      onOrderChange({
        ...order,
        utrReference: res.utr_reference || check.value,
        utr_reference: res.utr_reference || check.value,
        paymentStatus: PAYMENT_STATUS.AWAITING_VERIFICATION,
        payment_status: PAYMENT_STATUS.AWAITING_VERIFICATION,
        paymentMethod: methodCfg.id,
        payment_method: methodCfg.id
      });
      if (showToast) {
        showToast('UTR reference recorded. Status is now Awaiting Verification.', 'success');
      }
    } catch (err) {
      setUtrError(err.message || 'Unable to submit UTR reference right now.');
    } finally {
      setIsSubmittingUtr(false);
    }
  };

  const handleRefreshVerification = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setActionError('');
    try {
      const latest = await paymentService.refreshOrderStatus({ orderNumber, contact });
      if (latest) {
        onOrderChange({
          ...order,
          ...latest,
          orderNumber: latest.order_number || orderNumber,
          paymentStatus: latest.payment_status || latest.paymentStatus || order.paymentStatus,
          payment_status: latest.payment_status || latest.paymentStatus || order.payment_status,
          paymentMethod: latest.payment_method || latest.paymentMethod || order.paymentMethod,
          utrReference: latest.utr_reference || latest.utrReference || order.utrReference,
          verificationNotes: latest.verification_notes || order.verificationNotes
        });
      }
    } catch (err) {
      setActionError(err.message || 'Unable to refresh order payment status.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const isFinalPaid = currentStatus === PAYMENT_STATUS.PAID;
  const isTerminalClosed = [PAYMENT_STATUS.CANCELLED, PAYMENT_STATUS.REFUNDED].includes(currentStatus);

  return (
    <div style={{ padding: 'clamp(1.1rem, 3.5vw, 2rem)', maxWidth: '780px', margin: '0 auto', width: '100%' }}>
      {/* Top Order & Honest Status Header */}
      <div
        style={{
          backgroundColor: '#FAF6EE',
          border: `1px solid ${statusMeta.border}`,
          padding: '1.1rem 1.25rem',
          borderRadius: '4px',
          marginBottom: '1.25rem'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#B88D4A', fontWeight: 700 }}>
              Order Created • Direct UPI Transfer
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.2rem' }}>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.35rem, 3vw, 1.75rem)', color: '#4B3024', margin: 0 }}>
                #{orderNumber}
              </h2>
              <button
                type="button"
                onClick={() => handleCopy('orderRef', orderNumber, 'Order Reference')}
                style={{
                  fontSize: '0.7rem',
                  padding: '0.2rem 0.5rem',
                  border: '1px solid rgba(75, 48, 36, 0.2)',
                  backgroundColor: '#FFFDF9',
                  color: '#4B3024',
                  borderRadius: '2px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  cursor: 'pointer'
                }}
              >
                {copiedKey === 'orderRef' ? <Check size={12} color="#525B3A" /> : <Copy size={12} />}
                <span>{copiedKey === 'orderRef' ? 'Copied' : 'Copy Ref'}</span>
              </button>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8F7263', fontWeight: 600 }}>
              Exact Payable Amount
            </div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.55rem', fontWeight: 700, color: '#4B3024' }}>
              ₹{grandTotal.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* Status Pill + Timer + Live Refresh */}
        <div
          style={{
            marginTop: '0.85rem',
            paddingTop: '0.8rem',
            borderTop: '1px solid rgba(75, 48, 36, 0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.6rem'
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.32rem 0.7rem',
              borderRadius: '3px',
              backgroundColor: isWindowExpired ? 'rgba(201, 130, 120, 0.15)' : statusMeta.bg,
              color: isWindowExpired ? '#8A2A20' : statusMeta.color,
              border: `1px solid ${isWindowExpired ? '#C98278' : statusMeta.border}`,
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.04em'
            }}
          >
            {isFinalPaid ? <CheckCircle2 size={14} /> : <Clock size={14} />}
            <span>{isWindowExpired ? 'Payment Window Expired — Retry Below' : statusMeta.label}</span>
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            {!isFinalPaid && !isTerminalClosed && expiresAtMs > 0 && !isWindowExpired && (
              <span style={{ fontSize: '0.76rem', color: '#6F4E3E', fontWeight: 600 }}>
                Window: {formatCountdown(msRemaining)}
              </span>
            )}
            <button
              type="button"
              onClick={handleRefreshVerification}
              disabled={isRefreshing}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '0.3rem 0.65rem',
                border: '1px solid rgba(75, 48, 36, 0.22)',
                backgroundColor: '#FFFDF9',
                color: '#4B3024',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={12} />
              <span>{isRefreshing ? 'Checking...' : 'Check Status'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Verified PAID State — Genuine CRM Confirmation ONLY */}
      {isFinalPaid && (
        <div
          style={{
            backgroundColor: 'rgba(82, 91, 58, 0.1)',
            border: '1px solid rgba(82, 91, 58, 0.35)',
            padding: '1.35rem',
            borderRadius: '4px',
            textAlign: 'center',
            marginBottom: '1.25rem'
          }}
        >
          <CheckCircle2 size={36} color="#525B3A" style={{ margin: '0 auto 0.6rem' }} />
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.55rem', color: '#4B3024', margin: '0 0 0.4rem' }}>
            Payment Verified by RODHE Atelier
          </h3>
          <p style={{ fontSize: '0.86rem', color: '#4B3024', lineHeight: 1.6, margin: '0 0 0.9rem' }}>
            Your UPI payment {order.utrReference || order.utr_reference ? `(Ref: ${order.utrReference || order.utr_reference}) ` : ''}
            has been reconciled and confirmed. Your heirloom sarees are queued for inspection & dispatch.
          </p>
          {order.verificationNotes && (
            <div style={{ fontSize: '0.78rem', color: '#525B3A', fontWeight: 600, marginBottom: '0.85rem' }}>
              Atelier Note: {order.verificationNotes}
            </div>
          )}
          <button
            type="button"
            onClick={onDismissSessionOrder}
            className="btn btn-primary"
          >
            Done & Return to Storefront
          </button>
        </div>
      )}

      {/* Window Expired or Failed Notice */}
      {!isFinalPaid && !isTerminalClosed && (isWindowExpired || currentStatus === PAYMENT_STATUS.FAILED) && (
        <div
          style={{
            padding: '0.9rem 1rem',
            backgroundColor: 'rgba(201, 130, 120, 0.14)',
            border: '1px solid #C98278',
            borderRadius: '4px',
            marginBottom: '1.15rem',
            fontSize: '0.82rem',
            color: '#6E2219',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}
        >
          <div>
            <strong>{currentStatus === PAYMENT_STATUS.FAILED ? 'Verification Mismatch:' : 'Payment Window Expired:'}</strong>{' '}
            {currentStatus === PAYMENT_STATUS.FAILED
              ? order.verificationNotes || 'Our team could not verify the incoming credit for this reference yet. You can retry payment or message Concierge.'
              : 'Your 30-minute timer elapsed. You can resume this order with a fresh window without placing a duplicate order.'}
          </div>
          <button
            type="button"
            onClick={() => handleSwitchUpiApp(methodCfg.id)}
            disabled={isSwitchingMethod}
            className="btn btn-primary btn-sm"
          >
            {isSwitchingMethod ? 'Refreshing...' : 'Retry Payment'}
          </button>
        </div>
      )}

      {actionError && (
        <div
          role="alert"
          style={{
            padding: '0.75rem 0.9rem',
            backgroundColor: 'rgba(201, 130, 120, 0.14)',
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
          <AlertCircle size={15} style={{ flexShrink: 0 }} />
          <span>{actionError}</span>
        </div>
      )}

      {!isFinalPaid && !isTerminalClosed && (
        <>
          {/* Method Selector Tabs */}
          <div style={{ marginBottom: '1.15rem' }}>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#8F7263', fontWeight: 700, marginBottom: '0.5rem' }}>
              Select Verified UPI Payment App
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.6rem' }}>
              {UPI_METHOD_LIST.map((m) => {
                const selected = m.id === methodCfg.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    disabled={isSwitchingMethod}
                    onClick={() => {
                      if (!selected) handleSwitchUpiApp(m.id);
                    }}
                    style={{
                      padding: '0.75rem 0.5rem',
                      borderRadius: '4px',
                      border: selected ? '2px solid #4B3024' : '1px solid rgba(75, 48, 36, 0.18)',
                      backgroundColor: selected ? '#EADAB5' : '#FFFDF9',
                      color: '#4B3024',
                      cursor: isSwitchingMethod ? 'wait' : 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.86rem' }}>{m.name}</div>
                    <div style={{ fontSize: '0.68rem', color: '#6F4E3E', marginTop: '0.15rem' }}>
                      {selected ? 'Active QR' : 'Switch App'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scan & Pay + App Intent Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 275px), 1fr))',
              gap: '1.15rem',
              marginBottom: '1.25rem'
            }}
          >
            {/* Left: Crisp Authentic QR Box */}
            <div
              style={{
                backgroundColor: '#FFFDF9',
                border: '1px solid rgba(184, 141, 74, 0.35)',
                borderRadius: '4px',
                padding: '1.15rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#4B3024', marginBottom: '0.75rem' }}>
                <QrCode size={15} color="#B88D4A" />
                <span>{methodCfg.name} Scan & Pay</span>
              </div>

              {!qrLoadError ? (
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    padding: '0.65rem',
                    borderRadius: '4px',
                    border: '1px solid rgba(75, 48, 36, 0.14)',
                    marginBottom: '0.75rem'
                  }}
                >
                  <img
                    src={methodCfg.qrImage}
                    alt={`${methodCfg.name} UPI Payment QR for ${methodCfg.payeeName}`}
                    onError={() => setQrLoadError(true)}
                    style={{
                      width: 'min(220px, 64vw)',
                      height: 'min(220px, 64vw)',
                      objectFit: 'contain',
                      display: 'block'
                    }}
                  />
                </div>
              ) : (
                <div
                  style={{
                    width: '100%',
                    padding: '1.25rem',
                    backgroundColor: '#FAF6EE',
                    border: '1px dashed rgba(75, 48, 36, 0.25)',
                    borderRadius: '4px',
                    marginBottom: '0.75rem',
                    fontSize: '0.8rem',
                    color: '#6F4E3E'
                  }}
                >
                  QR preview failed to load. Please copy the UPI ID on the right or tap Open {methodCfg.name} App.
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '0.75rem' }}>
                <a
                  href={methodCfg.qrImage}
                  download={`RODHE-${methodCfg.slug}-${orderNumber}.jpg`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    padding: '0.4rem 0.8rem',
                    border: '1px solid rgba(75, 48, 36, 0.25)',
                    backgroundColor: '#FAF6EE',
                    color: '#4B3024',
                    textDecoration: 'none',
                    borderRadius: '3px'
                  }}
                >
                  <Download size={13} />
                  <span>Save QR</span>
                </a>
              </div>

              <div
                style={{
                  fontSize: '0.73rem',
                  color: '#6F4E3E',
                  lineHeight: 1.5,
                  backgroundColor: '#F4ECE1',
                  padding: '0.6rem 0.75rem',
                  borderRadius: '3px',
                  width: '100%',
                  textAlign: 'left'
                }}
              >
                <strong>Static QR Notice:</strong> This QR does not prefill your total automatically. Enter exact amount{' '}
                <strong>₹{grandTotal.toLocaleString('en-IN')}</strong> and reference <strong>#{orderNumber}</strong> in the UPI note.
              </div>
            </div>

            {/* Right: Verified Beneficiary Info + UPI App Launch + Instructions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div
                style={{
                  backgroundColor: '#FFFDF9',
                  border: '1px solid rgba(75, 48, 36, 0.14)',
                  borderRadius: '4px',
                  padding: '1rem'
                }}
              >
                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#B88D4A', fontWeight: 700, marginBottom: '0.6rem' }}>
                  Verified Recipient Details ({methodCfg.name})
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', fontSize: '0.82rem' }}>
                  <div>
                    <span style={{ color: '#8F7263', fontSize: '0.74rem', display: 'block' }}>Beneficiary Name Displayed in UPI App:</span>
                    <strong style={{ color: '#4B3024', fontSize: '0.9rem' }}>{methodCfg.payeeName}</strong>
                  </div>

                  <div>
                    <span style={{ color: '#8F7263', fontSize: '0.74rem', display: 'block' }}>{methodCfg.name} UPI ID:</span>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginTop: '0.15rem', backgroundColor: '#FAF6EE', padding: '0.45rem 0.65rem', borderRadius: '3px', border: '1px solid rgba(75, 48, 36, 0.12)' }}>
                      <code style={{ fontSize: '0.82rem', color: '#4B3024', fontWeight: 600, wordBreak: 'break-all' }}>{methodCfg.vpa}</code>
                      <button
                        type="button"
                        onClick={() => handleCopy('vpa', methodCfg.vpa, `${methodCfg.name} UPI ID`)}
                        style={{
                          padding: '0.28rem 0.55rem',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          border: '1px solid rgba(75, 48, 36, 0.2)',
                          backgroundColor: '#FFFDF9',
                          color: '#4B3024',
                          borderRadius: '2px',
                          cursor: 'pointer',
                          flexShrink: 0,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}
                      >
                        {copiedKey === 'vpa' ? <Check size={12} color="#525B3A" /> : <Copy size={12} />}
                        <span>{copiedKey === 'vpa' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Mobile App Deep Link Triggers */}
                <div style={{ marginTop: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => handleLaunchUpiIntent(true)}
                    className="btn btn-gold"
                    style={{ width: '100%', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem' }}
                  >
                    <Smartphone size={16} />
                    <span>Open {methodCfg.name} App (₹{grandTotal.toLocaleString('en-IN')})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLaunchUpiIntent(false)}
                    className="btn btn-outline btn-sm"
                    style={{ width: '100%', minHeight: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                  >
                    <ExternalLink size={13} />
                    <span>Open Any Installed UPI App</span>
                  </button>
                </div>

                {(appLaunchNote || returnedFromApp) && (
                  <div
                    style={{
                      marginTop: '0.7rem',
                      padding: '0.6rem 0.75rem',
                      backgroundColor: '#F4ECE1',
                      borderLeft: '3px solid #B88D4A',
                      fontSize: '0.75rem',
                      color: '#4B3024',
                      lineHeight: 1.45
                    }}
                  >
                    {returnedFromApp
                      ? 'Welcome back. Opening or returning from a UPI app does not confirm payment — enter your 12-digit UTR below so our team can verify your transfer.'
                      : appLaunchNote}
                  </div>
                )}
              </div>

              {/* 7-Step Instructions */}
              <div
                style={{
                  backgroundColor: '#FAF6EE',
                  border: '1px solid rgba(75, 48, 36, 0.12)',
                  borderRadius: '4px',
                  padding: '0.9rem 1rem',
                  fontSize: '0.77rem',
                  color: '#4B3024',
                  lineHeight: 1.5
                }}
              >
                <div style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', fontSize: '0.7rem', color: '#B88D4A', marginBottom: '0.4rem' }}>
                  How to Complete Payment Safely
                </div>
                <ol style={{ margin: '0 0 0.55rem 1.15rem', padding: 0 }}>
                  <li>Open {methodCfg.name} or your preferred UPI app.</li>
                  <li>Scan the displayed {methodCfg.name} QR code or tap Open UPI App.</li>
                  <li>Verify beneficiary name shows <strong>{methodCfg.payeeName}</strong>.</li>
                  <li>Verify the exact amount <strong>₹{grandTotal.toLocaleString('en-IN')}</strong>.</li>
                  <li>Complete the transfer using UPI PIN inside your banking/UPI app only.</li>
                  <li>Return to RODHE and submit your 12-digit UTR reference below.</li>
                  <li>Await verification confirmation from our atelier team in CRM/email.</li>
                </ol>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#525B3A', fontWeight: 600, fontSize: '0.72rem' }}>
                  <ShieldCheck size={14} />
                  <span>RODHE never asks for your UPI PIN, OTP, or banking password.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Submit UTR / Reference Form (Moves to AWAITING_VERIFICATION — NEVER PAID) */}
          <form
            onSubmit={handleSubmitUtr}
            style={{
              backgroundColor: '#FFFDF9',
              border: '1px solid rgba(184, 141, 74, 0.35)',
              borderRadius: '4px',
              padding: '1.1rem',
              marginBottom: '1rem'
            }}
          >
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.09em', color: '#B88D4A', fontWeight: 700, marginBottom: '0.25rem' }}>
              Completed Your Transfer?
            </div>
            <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.22rem', color: '#4B3024', margin: '0 0 0.35rem' }}>
              Submit UPI Transaction / UTR Reference
            </h4>
            <p style={{ fontSize: '0.78rem', color: '#6F4E3E', lineHeight: 1.5, margin: '0 0 0.85rem' }}>
              Your payment status remains <strong>Awaiting Verification</strong> after submitting a UTR until our team matches it against actual bank receipts.
            </p>

            <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'stretch' }}>
              <input
                type="text"
                placeholder="Enter 12-digit UTR / UPI Ref No."
                value={utrInput}
                onChange={(e) => {
                  setUtrInput(e.target.value);
                  if (utrError) setUtrError('');
                }}
                className="form-input"
                style={{ flex: '1 1 220px', minHeight: '44px' }}
                aria-label="UPI Transaction or UTR Reference"
              />
              <button
                type="submit"
                disabled={isSubmittingUtr}
                className="btn btn-primary"
                style={{ minHeight: '44px', whiteSpace: 'nowrap' }}
              >
                {isSubmittingUtr ? 'Recording UTR...' : 'Submit UTR for Verification'}
              </button>
            </div>

            {utrError && (
              <div role="alert" style={{ color: '#8A2A20', fontSize: '0.76rem', marginTop: '0.45rem', fontWeight: 500 }}>
                {utrError}
              </div>
            )}

            {currentStatus === PAYMENT_STATUS.AWAITING_VERIFICATION && (order.utrReference || order.utr_reference) && (
              <div
                style={{
                  marginTop: '0.75rem',
                  padding: '0.6rem 0.75rem',
                  backgroundColor: 'rgba(184, 141, 74, 0.14)',
                  borderRadius: '3px',
                  fontSize: '0.78rem',
                  color: '#4B3024'
                }}
              >
                <strong>Recorded UTR:</strong> <code>{order.utrReference || order.utr_reference}</code> — Pending administrator bank verification.
              </div>
            )}
          </form>
        </>
      )}

      {/* WhatsApp Concierge Support Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.78rem', color: '#6F4E3E' }}>
        <span>Need assistance with this payment?</span>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => onOpenWhatsAppSupport && onOpenWhatsAppSupport(order)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              color: '#525B3A',
              fontWeight: 600,
              textDecoration: 'underline',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0
            }}
          >
            <MessageCircle size={15} />
            <span>Message Concierge on WhatsApp (Ref #{orderNumber})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
