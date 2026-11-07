import React, { useState } from 'react';
import { 
  X, 
  Search, 
  Truck, 
  CheckCircle2, 
  Clock, 
  Package, 
  AlertCircle, 
  ExternalLink,
  MessageCircle,
  Sparkles
} from 'lucide-react';
import { storeService } from '../services/storeService';

export const TrackOrderModal = ({ isOpen, onClose }) => {
  const [orderNumber, setOrderNumber] = useState('');
  const [contact, setContact] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderData, setOrderData] = useState(null);

  if (!isOpen) return null;

  const handleLookup = async (e) => {
    e.preventDefault();
    setError('');
    setOrderData(null);

    const cleanNum = orderNumber.trim();
    const cleanContact = contact.trim();

    if (!cleanNum || !cleanContact) {
      setError('Please provide both Order Number and Phone or Email.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await storeService.lookupOrder(cleanNum, cleanContact);
      if (result) {
        setOrderData(result);
      } else {
        setError('No order found matching the provided reference and contact. Please verify details.');
      }
    } catch (err) {
      setError(err.message || 'Unable to query order status. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusStep = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'delivered') return 4;
    if (s === 'shipped') return 3;
    if (s === 'processing') return 2;
    return 1;
  };

  const currentStep = getStatusStep(orderData?.fulfillment_status || orderData?.fulfillmentStatus);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        style={{
          width: 'min(640px, 94vw)',
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
            padding: '1.25rem clamp(1rem, 3vw, 1.75rem)',
            borderBottom: '1px solid rgba(75, 48, 36, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#FAF6EE'
          }}
        >
          <div>
            <div style={{ fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#B88D4A', fontWeight: 700 }}>
              RODHE Concierge
            </div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.45rem', color: '#4B3024', margin: '0.2rem 0 0' }}>
              Track Your Saree
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close track order modal"
            style={{ color: '#8F7263', padding: '0.35rem', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: 'clamp(1.25rem, 3.5vw, 2rem)' }}>
          {/* Lookup Form */}
          <form onSubmit={handleLookup} style={{ marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '0.85rem', color: '#6F4E3E', marginBottom: '1rem', lineHeight: 1.5 }}>
              Enter your official Order Number along with the Phone Number or Email provided during checkout to view live atelier dispatch tracking.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8F7263', fontWeight: 600, marginBottom: '0.3rem' }}>
                  Order Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. RDH-2026-1001"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', padding: '0.65rem 0.85rem', fontSize: '0.86rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8F7263', fontWeight: 600, marginBottom: '0.3rem' }}>
                  Mobile or Email
                </label>
                <input
                  type="text"
                  required
                  placeholder="Phone or email on file"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', padding: '0.65rem 0.85rem', fontSize: '0.86rem' }}
                />
              </div>
            </div>

            {error && (
              <div
                style={{
                  padding: '0.75rem 1rem',
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
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.8rem', fontSize: '0.88rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              <Search size={16} />
              <span>{isLoading ? 'Searching Atelier Registry...' : 'Track Saree Drape'}</span>
            </button>
          </form>

          {/* Result Card */}
          {orderData && (
            <div
              style={{
                backgroundColor: '#FAF6EE',
                border: '1px solid rgba(184, 141, 74, 0.25)',
                padding: '1.25rem',
                borderRadius: '4px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(75, 48, 36, 0.1)' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#B88D4A', fontWeight: 600 }}>
                    Order Reference
                  </div>
                  <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', color: '#4B3024', margin: '0.1rem 0' }}>
                    #{orderData.order_number || orderData.orderNumber}
                  </h4>
                  <div style={{ fontSize: '0.78rem', color: '#8F7263' }}>
                    Patron: <strong>{orderData.customer_name || orderData.customerName}</strong>
                    {orderData.city && ` • ${orderData.city}, ${orderData.state}`}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8F7263', fontWeight: 600 }}>
                    Order Total
                  </div>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: '#4B3024', fontWeight: 700 }}>
                    ₹{(orderData.grand_total || orderData.grandTotal || 0).toLocaleString('en-IN')}
                  </div>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '2px',
                      backgroundColor: (orderData.payment_status === 'captured' || orderData.paymentStatus === 'captured') ? 'rgba(82, 91, 58, 0.1)' : 'rgba(184, 141, 74, 0.12)',
                      color: (orderData.payment_status === 'captured' || orderData.paymentStatus === 'captured') ? '#525B3A' : '#B88D4A'
                    }}
                  >
                    {orderData.payment_status || orderData.paymentStatus}
                  </span>
                </div>
              </div>

              {/* Progress Timeline */}
              <div style={{ margin: '1.5rem 0' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', textAlign: 'center', position: 'relative' }}>
                  {[
                    { step: 1, label: 'Placed', icon: CheckCircle2 },
                    { step: 2, label: 'Handcrafted', icon: Package },
                    { step: 3, label: 'Dispatched', icon: Truck },
                    { step: 4, label: 'Delivered', icon: Sparkles }
                  ].map((s) => {
                    const isDone = currentStep >= s.step;
                    const Icon = s.icon;
                    return (
                      <div key={s.step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: isDone ? '#4B3024' : '#EADAB5',
                            color: isDone ? '#FAF6EE' : '#8F7263',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '0.35rem',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          <Icon size={16} />
                        </div>
                        <span style={{ fontSize: '0.72rem', fontWeight: isDone ? 700 : 500, color: isDone ? '#4B3024' : '#8F7263', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          {s.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Courier & AWB Details */}
              <div
                style={{
                  backgroundColor: '#FFFDF9',
                  padding: '0.85rem 1rem',
                  borderRadius: '3px',
                  border: '1px solid rgba(75, 48, 36, 0.1)',
                  marginBottom: '1rem',
                  fontSize: '0.82rem',
                  color: '#4B3024'
                }}
              >
                <div><strong>Courier Partner:</strong> {orderData.courier_partner || orderData.courierPartner || 'Express Air Logistics'}</div>
                {orderData.tracking_number || orderData.trackingNumber ? (
                  <div style={{ marginTop: '0.25rem' }}>
                    <strong>AWB / Tracking Number:</strong> <code>{orderData.tracking_number || orderData.trackingNumber}</code>
                  </div>
                ) : (
                  <div style={{ marginTop: '0.25rem', color: '#8F7263', fontSize: '0.76rem' }}>
                    AWB will be assigned once artisan quality inspection is complete.
                  </div>
                )}
              </div>

              {/* Items List */}
              {Array.isArray(orderData.items) && orderData.items.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8F7263', fontWeight: 600, marginBottom: '0.5rem' }}>
                    Sarees in this Order ({orderData.items.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                    {orderData.items.map((it, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          backgroundColor: '#FFFDF9',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '3px',
                          border: '1px solid rgba(75, 48, 36, 0.08)',
                          fontSize: '0.82rem'
                        }}
                      >
                        <div>
                          <strong>{it.name}</strong> <span style={{ color: '#8F7263', fontSize: '0.75rem' }}>({it.sku})</span>
                          <div style={{ fontSize: '0.74rem', color: '#8F7263' }}>Qty: {it.quantity}</div>
                        </div>
                        <div style={{ fontWeight: 600, color: '#4B3024' }}>
                          ₹{(it.subtotal || it.unit_price * it.quantity || 0).toLocaleString('en-IN')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* WhatsApp Support CTA */}
              <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
                <a
                  href={`https://wa.me/919490658858?text=${encodeURIComponent(
                    `Namaste RODHE Concierge, I am inquiring about Order #${orderData.order_number || orderData.orderNumber}.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    color: '#25D366',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    textDecoration: 'none'
                  }}
                >
                  <MessageCircle size={15} />
                  <span>Connect with Atelier Concierge on WhatsApp</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
