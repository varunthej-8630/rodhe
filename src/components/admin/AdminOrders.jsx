import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  ChevronDown,
  Save,
  MessageCircle,
  ShieldCheck,
  XCircle,
  History
} from 'lucide-react';
import { storeService } from '../../services/storeService';
import { paymentService } from '../../services/paymentService';
import { useShop } from '../../context/ShopContext';
import {
  PAYMENT_STATUS,
  formatPaymentMethodLabel,
  getPaymentStatusMeta,
  normalizePaymentStatus
} from '../../config/upiConfig';

const PAYMENT_FILTER_TABS = [
  { id: 'all', label: 'All Payments' },
  { id: PAYMENT_STATUS.PENDING, label: 'Pending' },
  { id: PAYMENT_STATUS.AWAITING_VERIFICATION, label: 'Awaiting Verification' },
  { id: PAYMENT_STATUS.PAID, label: 'Paid' },
  { id: PAYMENT_STATUS.FAILED, label: 'Failed' },
  { id: PAYMENT_STATUS.EXPIRED, label: 'Expired' },
  { id: PAYMENT_STATUS.CANCELLED, label: 'Cancelled' },
  { id: PAYMENT_STATUS.REFUNDED, label: 'Refunded' }
];

export const AdminOrders = ({ adminEmail = 'administrator' }) => {
  const { showToast } = useShop();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [fulfillmentFilter, setFulfillmentFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [reconcilingId, setReconcilingId] = useState(null);
  const [reconcileError, setReconcileError] = useState({});

  const [editStates, setEditStates] = useState({});
  const [reconcileInputs, setReconcileInputs] = useState({});

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const data = await storeService.getOrders();
      const list = Array.isArray(data) ? data : [];
      setOrders(list);

      const initialEdits = {};
      const initialReconcile = {};
      list.forEach((o) => {
        initialEdits[o.id] = {
          fulfillmentStatus: o.fulfillmentStatus || o.fulfillment_status || 'unfulfilled',
          trackingNumber: o.trackingNumber || o.tracking_number || '',
          courierPartner: o.courierPartner || o.courier_partner || 'Express Air Logistics'
        };
        initialReconcile[o.id] = {
          verifiedUtr: o.utrReference || o.utr_reference || '',
          notes: o.verificationNotes || o.verification_notes || ''
        };
      });
      setEditStates(initialEdits);
      setReconcileInputs(initialReconcile);
    } catch (err) {
      console.warn('Error loading orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    storeService.getOrders()
      .then((data) => {
        if (!active) return;
        const list = Array.isArray(data) ? data : [];
        setOrders(list);
        const initialEdits = {};
        const initialReconcile = {};
        list.forEach((o) => {
          initialEdits[o.id] = {
            fulfillmentStatus: o.fulfillmentStatus || o.fulfillment_status || 'unfulfilled',
            trackingNumber: o.trackingNumber || o.tracking_number || '',
            courierPartner: o.courierPartner || o.courier_partner || 'Express Air Logistics'
          };
          initialReconcile[o.id] = {
            verifiedUtr: o.utrReference || o.utr_reference || '',
            notes: o.verificationNotes || o.verification_notes || ''
          };
        });
        setEditStates(initialEdits);
        setReconcileInputs(initialReconcile);
      })
      .catch((err) => {
        console.warn('Error loading orders:', err);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, []);

  const handleEditChange = (orderId, field, value) => {
    setEditStates((prev) => ({
      ...prev,
      [orderId]: {
        ...(prev[orderId] || {}),
        [field]: value
      }
    }));
  };

  const handleReconcileInputChange = (orderId, field, value) => {
    setReconcileInputs((prev) => ({
      ...prev,
      [orderId]: {
        ...(prev[orderId] || {}),
        [field]: value
      }
    }));
    if (reconcileError[orderId]) {
      setReconcileError((prev) => ({ ...prev, [orderId]: '' }));
    }
  };

  const handleSaveOrderStatus = async (order) => {
    const edits = editStates[order.id] || {};
    setUpdatingId(order.id);
    try {
      await storeService.updateOrderStatus(order.id, {
        fulfillmentStatus: edits.fulfillmentStatus,
        trackingNumber: edits.trackingNumber,
        courierPartner: edits.courierPartner
      });
      showToast(`Fulfillment updated for #${order.orderNumber || order.order_number}.`, 'success');
      await loadOrders();
    } catch {
      showToast('Failed to update order fulfillment status.', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handlePaymentReconciliation = async (order, action) => {
    const inputs = reconcileInputs[order.id] || {};
    const notes = String(inputs.notes || '').trim();
    const verifiedUtr = String(inputs.verifiedUtr || '').trim().toUpperCase();

    if ((action === 'REJECT_MISMATCH' || action === 'MARK_REFUNDED') && !notes) {
      setReconcileError((prev) => ({
        ...prev,
        [order.id]: 'Please enter verification notes explaining the mismatch or refund reference.'
      }));
      return;
    }

    if (action === 'VERIFY_PAID' && !verifiedUtr && !(order.utrReference || order.utr_reference)) {
      setReconcileError((prev) => ({
        ...prev,
        [order.id]: 'Enter the bank UTR reference matched in your bank/UPI statement before verifying PAID.'
      }));
      return;
    }

    setReconcilingId(`${order.id}-${action}`);
    setReconcileError((prev) => ({ ...prev, [order.id]: '' }));

    try {
      await paymentService.verifyAdmin({
        orderId: order.id,
        action,
        verifiedUtr,
        notes: notes || `Admin ${action.toLowerCase()} after statement verification`,
        adminEmail
      });
      showToast(`Payment updated (${action}) for #${order.orderNumber || order.order_number}.`, 'success');
      await loadOrders();
    } catch (err) {
      setReconcileError((prev) => ({
        ...prev,
        [order.id]: err.message || 'Unable to execute payment reconciliation action.'
      }));
    } finally {
      setReconcilingId(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const pStatus = normalizePaymentStatus(o.paymentStatus || o.payment_status);
    const fStatus = o.fulfillmentStatus || o.fulfillment_status || 'unfulfilled';

    if (paymentFilter !== 'all' && pStatus !== paymentFilter) return false;
    if (fulfillmentFilter !== 'all' && fStatus !== fulfillmentFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const num = (o.orderNumber || o.order_number || '').toLowerCase();
      const name = (o.customerName || o.customer_name || '').toLowerCase();
      const email = (o.customerEmail || o.customer_email || '').toLowerCase();
      const phone = (o.customerPhone || o.customer_phone || '').toLowerCase();
      const utr = (o.utrReference || o.utr_reference || '').toLowerCase();
      return num.includes(q) || name.includes(q) || email.includes(q) || phone.includes(q) || utr.includes(q);
    }
    return true;
  });

  // Honest KPI metrics: distinguish Paid Verified Revenue from unverified pending orders
  const awaitingCount = orders.filter((o) => normalizePaymentStatus(o.paymentStatus || o.payment_status) === PAYMENT_STATUS.AWAITING_VERIFICATION).length;
  const pendingCount = orders.filter((o) => normalizePaymentStatus(o.paymentStatus || o.payment_status) === PAYMENT_STATUS.PENDING).length;
  const paidOrders = orders.filter((o) => normalizePaymentStatus(o.paymentStatus || o.payment_status) === PAYMENT_STATUS.PAID);
  const verifiedPaidRevenue = paidOrders.reduce((sum, o) => sum + (Number(o.grandTotal ?? o.grand_total) || 0), 0);

  const getFulfillmentBadgeStyle = (status) => {
    switch (status) {
      case 'delivered':
        return { backgroundColor: 'rgba(82, 91, 58, 0.15)', color: '#525B3A', border: '1px solid rgba(82, 91, 58, 0.3)' };
      case 'shipped':
        return { backgroundColor: 'rgba(38, 66, 90, 0.12)', color: '#26425A', border: '1px solid rgba(38, 66, 90, 0.25)' };
      case 'processing':
        return { backgroundColor: 'rgba(184, 141, 74, 0.15)', color: '#B88D4A', border: '1px solid rgba(184, 141, 74, 0.3)' };
      case 'cancelled':
        return { backgroundColor: 'rgba(201, 130, 120, 0.15)', color: '#C98278', border: '1px solid rgba(201, 130, 120, 0.3)' };
      default:
        return { backgroundColor: 'rgba(75, 48, 36, 0.1)', color: '#4B3024', border: '1px solid rgba(75, 48, 36, 0.2)' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Banner */}
      <div
        style={{
          backgroundColor: '#FFFDF9',
          padding: '1.5rem 1.75rem',
          borderRadius: '4px',
          border: '1px solid rgba(75, 48, 36, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.72rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#B88D4A', fontWeight: 700 }}>
              Manual UPI Reconciliation & Fulfillment
            </span>
          </div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.7rem', color: '#4B3024', margin: '0 0 0.35rem' }}>
            Orders & UPI Payment Verification
          </h2>
          <p style={{ fontSize: '0.84rem', color: '#8F7263', margin: 0, maxWidth: '660px' }}>
            Verify incoming PhonePe, Google Pay, and Paytm bank credits before confirming orders. Customer-submitted UTR references stay Awaiting Verification until manually reconciled here.
          </p>
        </div>

        <button
          onClick={loadOrders}
          className="btn btn-outline"
          style={{ padding: '0.55rem 1.1rem', fontSize: '0.8rem' }}
        >
          Refresh Orders
        </button>
      </div>

      {/* KPI Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '0.9rem' }}>
        <div style={{ backgroundColor: '#FFFDF9', padding: '1.15rem', borderRadius: '4px', border: '1px solid rgba(75, 48, 36, 0.1)' }}>
          <span style={{ fontSize: '0.72rem', color: '#8F7263', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>Total Orders</span>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.9rem', color: '#4B3024', fontWeight: 600, marginTop: '0.25rem' }}>
            {orders.length}
          </div>
        </div>

        <div style={{ backgroundColor: '#FFFDF9', padding: '1.15rem', borderRadius: '4px', border: awaitingCount > 0 ? '1px solid #B88D4A' : '1px solid rgba(75, 48, 36, 0.1)' }}>
          <span style={{ fontSize: '0.72rem', color: '#B88D4A', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>Awaiting Verification</span>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.9rem', color: '#B88D4A', fontWeight: 600, marginTop: '0.25rem' }}>
            {awaitingCount}
          </div>
        </div>

        <div style={{ backgroundColor: '#FFFDF9', padding: '1.15rem', borderRadius: '4px', border: '1px solid rgba(75, 48, 36, 0.1)' }}>
          <span style={{ fontSize: '0.72rem', color: '#6F4E3E', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>Pending UPI Transfer</span>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.9rem', color: '#6F4E3E', fontWeight: 600, marginTop: '0.25rem' }}>
            {pendingCount}
          </div>
        </div>

        <div style={{ backgroundColor: '#FFFDF9', padding: '1.15rem', borderRadius: '4px', border: '1px solid rgba(82, 91, 58, 0.25)' }}>
          <span style={{ fontSize: '0.72rem', color: '#525B3A', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>Verified Paid ({paidOrders.length})</span>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.9rem', color: '#525B3A', fontWeight: 600, marginTop: '0.25rem' }}>
            ₹{verifiedPaidRevenue.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div
        style={{
          backgroundColor: '#FFFDF9',
          padding: '1rem 1.25rem',
          borderRadius: '4px',
          border: '1px solid rgba(75, 48, 36, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem'
        }}
      >
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#8F7263', fontWeight: 700, marginRight: '0.25rem' }}>
            Payment:
          </span>
          {PAYMENT_FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setPaymentFilter(tab.id)}
              style={{
                padding: '0.4rem 0.75rem',
                fontSize: '0.76rem',
                fontWeight: paymentFilter === tab.id ? 700 : 500,
                backgroundColor: paymentFilter === tab.id ? '#4B3024' : '#FAF6EE',
                color: paymentFilter === tab.id ? '#FAF6EE' : '#6F4E3E',
                border: '1px solid rgba(75, 48, 36, 0.14)',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#8F7263', fontWeight: 700 }}>
              Fulfillment:
            </span>
            <select
              value={fulfillmentFilter}
              onChange={(e) => setFulfillmentFilter(e.target.value)}
              style={{
                padding: '0.4rem 0.65rem',
                fontSize: '0.78rem',
                borderRadius: '3px',
                border: '1px solid rgba(75, 48, 36, 0.2)',
                backgroundColor: '#FAF6EE',
                color: '#4B3024'
              }}
            >
              <option value="all">All Shipments</option>
              <option value="unfulfilled">Unfulfilled</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div style={{ position: 'relative', minWidth: '240px', flex: '0 1 300px' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#8F7263' }} />
            <input
              type="text"
              placeholder="Search order #, UTR, customer, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: '0.48rem 0.75rem 0.48rem 2.15rem',
                fontSize: '0.8rem',
                border: '1px solid rgba(75, 48, 36, 0.2)',
                borderRadius: '3px',
                backgroundColor: '#FAF6EE',
                color: '#4B3024',
                width: '100%'
              }}
            />
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div
        style={{
          backgroundColor: '#FFFDF9',
          borderRadius: '4px',
          border: '1px solid rgba(75, 48, 36, 0.1)',
          overflow: 'hidden'
        }}
      >
        {isLoading ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: '#8F7263' }}>
            Loading orders & UPI payment records...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: '#8F7263' }}>
            <ShoppingBag size={38} style={{ margin: '0 auto 0.85rem', opacity: 0.4, color: '#B88D4A' }} />
            <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', color: '#4B3024', marginBottom: '0.3rem' }}>
              No Matching Orders Found
            </h4>
            <p style={{ fontSize: '0.84rem', maxWidth: '420px', margin: '0 auto' }}>
              No customer orders currently match the selected payment or fulfillment filter.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filteredOrders.map((order, index) => {
              const isExpanded = expandedOrderId === order.id;
              const edits = editStates[order.id] || {};
              const rInput = reconcileInputs[order.id] || { verifiedUtr: '', notes: '' };
              const items = Array.isArray(order.items) ? order.items : [];
              const fStatus = order.fulfillmentStatus || order.fulfillment_status || 'unfulfilled';
              const pStatus = normalizePaymentStatus(order.paymentStatus || order.payment_status);
              const pMeta = getPaymentStatusMeta(pStatus);
              const addr = order.shippingAddress || order.shipping_address || {};
              const utr = order.utrReference || order.utr_reference || '';
              const logs = Array.isArray(order.verificationLogs) ? order.verificationLogs : [];
              const alreadyPaid = pStatus === PAYMENT_STATUS.PAID;

              return (
                <div key={order.id || index} style={{ borderBottom: '1px solid rgba(75, 48, 36, 0.08)' }}>
                  {/* Summary Row */}
                  <div
                    onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                    style={{
                      padding: '1.15rem 1.5rem',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(165px, 1fr))',
                      gap: '0.85rem',
                      alignItems: 'center',
                      cursor: 'pointer',
                      backgroundColor: isExpanded ? 'rgba(234, 218, 181, 0.16)' : 'transparent'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#4B3024' }}>
                        #{order.orderNumber || order.order_number}
                      </div>
                      <span style={{ fontSize: '0.72rem', color: '#8F7263' }}>
                        {order.createdAt || order.created_at
                          ? new Date(order.createdAt || order.created_at).toLocaleString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : 'Recently'}
                      </span>
                    </div>

                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#4B3024' }}>
                        {order.customerName || order.customer_name || 'Patron'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#8F7263' }}>
                        {order.customerPhone || order.customer_phone || order.customerEmail || ''}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#8F7263', textTransform: 'uppercase' }}>
                        {formatPaymentMethodLabel(order.paymentMethod || order.payment_method)}
                      </div>
                      <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', fontWeight: 700, color: '#4B3024' }}>
                        ₹{Number(order.grandTotal ?? order.grand_total ?? 0).toLocaleString('en-IN')}
                      </div>
                      {utr && (
                        <div style={{ fontSize: '0.7rem', color: '#6F4E3E' }}>
                          UTR: <code>{utr}</code>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          padding: '0.24rem 0.52rem',
                          borderRadius: '3px',
                          backgroundColor: pMeta.bg,
                          color: pMeta.color,
                          border: `1px solid ${pMeta.border}`
                        }}
                      >
                        {pMeta.shortLabel}
                      </span>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          padding: '0.22rem 0.48rem',
                          borderRadius: '3px',
                          ...getFulfillmentBadgeStyle(fStatus)
                        }}
                      >
                        {fStatus}
                      </span>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#B88D4A',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          fontSize: '0.8rem',
                          fontWeight: 600
                        }}
                      >
                        <span>{isExpanded ? 'Hide' : 'Review & Verify'}</span>
                        <ChevronDown size={14} style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Reconciliation & Fulfillment Panel */}
                  {isExpanded && (
                    <div
                      style={{
                        padding: '1.35rem 1.5rem',
                        backgroundColor: '#FAF6EE',
                        borderTop: '1px solid rgba(75, 48, 36, 0.08)',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 290px), 1fr))',
                        gap: '1.35rem'
                      }}
                    >
                      {/* Col 1: Items, Delivery & Payment Summary */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                          <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#4B3024', margin: '0 0 0.55rem', fontWeight: 700 }}>
                            Ordered Sarees ({items.length})
                          </h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {items.map((it, idx) => (
                              <div
                                key={it.id || idx}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.65rem',
                                  backgroundColor: '#FFFDF9',
                                  padding: '0.5rem 0.65rem',
                                  borderRadius: '3px',
                                  border: '1px solid rgba(75, 48, 36, 0.08)'
                                }}
                              >
                                <img
                                  src={it.primaryImage || it.primary_image || '/assets/products/saree_ivory_mulmul.jpg'}
                                  alt={it.name}
                                  style={{ width: '38px', height: '48px', objectFit: 'cover', borderRadius: '2px' }}
                                />
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#4B3024' }}>{it.name}</div>
                                  <div style={{ fontSize: '0.7rem', color: '#8F7263' }}>SKU: {it.sku} • Qty: {it.quantity}</div>
                                </div>
                                <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#4B3024' }}>
                                  ₹{Number(it.subtotal ?? (Number(it.unit_price || 0) * Number(it.quantity || 1))).toLocaleString('en-IN')}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div style={{ backgroundColor: '#FFFDF9', padding: '0.8rem', borderRadius: '4px', border: '1px solid rgba(75, 48, 36, 0.08)', fontSize: '0.8rem', color: '#4B3024', lineHeight: 1.5 }}>
                          <div><strong>Customer:</strong> {order.customerName || order.customer_name}</div>
                          <div><strong>Phone:</strong> {order.customerPhone || order.customer_phone || 'N/A'} • <strong>Email:</strong> {order.customerEmail || order.customer_email || 'N/A'}</div>
                          <div><strong>Address:</strong> {addr.addressLine1 || addr.address || ''}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}{addr.landmark ? ` (${addr.landmark})` : ''}</div>
                          <div><strong>Location:</strong> {addr.city || ''}, {addr.state || ''} - {addr.pincode || ''}</div>
                        </div>

                        {/* Payment Audit Timeline */}
                        <div style={{ backgroundColor: '#FFFDF9', padding: '0.85rem', borderRadius: '4px', border: '1px solid rgba(75, 48, 36, 0.1)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: '#4B3024', fontWeight: 700, marginBottom: '0.55rem' }}>
                            <History size={14} color="#B88D4A" />
                            <span>Payment Audit Trail ({logs.length})</span>
                          </div>
                          {logs.length === 0 ? (
                            <div style={{ fontSize: '0.76rem', color: '#8F7263' }}>
                              Created: {order.createdAt || order.created_at ? new Date(order.createdAt || order.created_at).toLocaleString('en-IN') : 'Recently'}
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', maxHeight: '160px', overflowY: 'auto' }}>
                              {logs.map((log, lIdx) => (
                                <div key={log.id || lIdx} style={{ fontSize: '0.74rem', borderLeft: '2px solid #B88D4A', paddingLeft: '0.55rem', color: '#4B3024' }}>
                                  <div>
                                    <strong>{log.previous_status} → {log.new_status}</strong> ({log.action})
                                    {log.utr_reference && <span> • UTR: <code>{log.utr_reference}</code></span>}
                                  </div>
                                  <div style={{ fontSize: '0.68rem', color: '#8F7263' }}>
                                    {log.actor_email || log.actor_role || 'system'} • {new Date(log.created_at).toLocaleString('en-IN')}
                                    {log.notes ? ` — ${log.notes}` : ''}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Col 2: Manual Bank Reconciliation */}
                      <div style={{ backgroundColor: '#FFFDF9', padding: '1.15rem', borderRadius: '4px', border: '1px solid rgba(184, 141, 74, 0.35)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#4B3024', fontWeight: 700 }}>
                          <ShieldCheck size={16} color="#525B3A" />
                          <span>Manual UPI Bank Verification</span>
                        </div>

                        <div style={{ fontSize: '0.76rem', color: '#6F4E3E', lineHeight: 1.5, backgroundColor: '#FAF6EE', padding: '0.65rem 0.75rem', borderRadius: '3px' }}>
                          <div><strong>Method:</strong> {formatPaymentMethodLabel(order.paymentMethod || order.payment_method)}</div>
                          <div><strong>Customer UTR Claim:</strong> {utr ? <code>{utr}</code> : 'Not yet submitted by customer'}</div>
                          {(order.paymentSubmittedAt || order.payment_submitted_at) && (
                            <div><strong>UTR Submitted:</strong> {new Date(order.paymentSubmittedAt || order.payment_submitted_at).toLocaleString('en-IN')}</div>
                          )}
                          {(order.verifiedByEmail || order.verified_by_email) && (
                            <div><strong>Verified By:</strong> {order.verifiedByEmail || order.verified_by_email} at {new Date(order.verifiedAt || order.verified_at).toLocaleString('en-IN')}</div>
                          )}
                        </div>

                        <div>
                          <label style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#8F7263', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>
                            Confirmed Bank / Statement UTR Reference
                          </label>
                          <input
                            type="text"
                            placeholder="12-digit UPI Ref from bank/app credit"
                            value={rInput.verifiedUtr}
                            onChange={(e) => handleReconcileInputChange(order.id, 'verifiedUtr', e.target.value)}
                            className="form-input"
                            style={{ fontSize: '0.82rem' }}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#8F7263', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>
                            Reconciliation Notes (Required for Reject / Refund)
                          </label>
                          <textarea
                            rows={2}
                            placeholder="e.g. Credited ₹1,649 in SBI account on 12 Nov — UTR matched"
                            value={rInput.notes}
                            onChange={(e) => handleReconcileInputChange(order.id, 'notes', e.target.value)}
                            className="form-input"
                            style={{ fontSize: '0.8rem', resize: 'vertical' }}
                          />
                        </div>

                        {reconcileError[order.id] && (
                          <div role="alert" style={{ padding: '0.6rem 0.75rem', backgroundColor: 'rgba(201, 130, 120, 0.14)', border: '1px solid #C98278', borderRadius: '3px', fontSize: '0.76rem', color: '#8A2A20', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <AlertCircle size={14} style={{ flexShrink: 0 }} />
                            <span>{reconcileError[order.id]}</span>
                          </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <button
                            type="button"
                            disabled={alreadyPaid || Boolean(reconcilingId)}
                            onClick={() => handlePaymentReconciliation(order, 'VERIFY_PAID')}
                            style={{
                              padding: '0.65rem 0.9rem',
                              backgroundColor: alreadyPaid ? 'rgba(82, 91, 58, 0.25)' : '#525B3A',
                              color: alreadyPaid ? '#3F472B' : '#FAF6EE',
                              border: 'none',
                              borderRadius: '3px',
                              fontWeight: 700,
                              fontSize: '0.78rem',
                              cursor: alreadyPaid ? 'not-allowed' : 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.45rem'
                            }}
                          >
                            <CheckCircle2 size={15} />
                            <span>
                              {alreadyPaid
                                ? 'Already Verified as PAID'
                                : reconcilingId === `${order.id}-VERIFY_PAID`
                                ? 'Verifying...'
                                : 'Confirm Credit & Mark PAID'}
                            </span>
                          </button>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem' }}>
                            <button
                              type="button"
                              disabled={alreadyPaid || Boolean(reconcilingId)}
                              onClick={() => handlePaymentReconciliation(order, 'REJECT_MISMATCH')}
                              style={{
                                padding: '0.5rem 0.65rem',
                                backgroundColor: '#FFFDF9',
                                color: '#8A2A20',
                                border: '1px solid rgba(201, 130, 120, 0.6)',
                                borderRadius: '3px',
                                fontWeight: 600,
                                fontSize: '0.73rem',
                                cursor: alreadyPaid ? 'not-allowed' : 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.3rem'
                              }}
                            >
                              <XCircle size={13} />
                              <span>Reject / Mismatch</span>
                            </button>

                            <button
                              type="button"
                              disabled={alreadyPaid || Boolean(reconcilingId)}
                              onClick={() => handlePaymentReconciliation(order, 'MARK_EXPIRED')}
                              style={{
                                padding: '0.5rem 0.65rem',
                                backgroundColor: '#FFFDF9',
                                color: '#6F4E3E',
                                border: '1px solid rgba(75, 48, 36, 0.25)',
                                borderRadius: '3px',
                                fontWeight: 600,
                                fontSize: '0.73rem',
                                cursor: alreadyPaid ? 'not-allowed' : 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.3rem'
                              }}
                            >
                              <Clock size={13} />
                              <span>Mark Expired</span>
                            </button>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem' }}>
                            <button
                              type="button"
                              disabled={Boolean(reconcilingId)}
                              onClick={() => handlePaymentReconciliation(order, 'MARK_CANCELLED')}
                              style={{
                                padding: '0.45rem 0.6rem',
                                backgroundColor: '#FAF6EE',
                                color: '#6F4E3E',
                                border: '1px solid rgba(75, 48, 36, 0.2)',
                                borderRadius: '3px',
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              Cancel & Restock
                            </button>

                            <button
                              type="button"
                              disabled={Boolean(reconcilingId)}
                              onClick={() => handlePaymentReconciliation(order, 'MARK_REFUNDED')}
                              style={{
                                padding: '0.45rem 0.6rem',
                                backgroundColor: '#FAF6EE',
                                color: '#26425A',
                                border: '1px solid rgba(38, 66, 90, 0.28)',
                                borderRadius: '3px',
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              Mark Refunded
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Col 3: Fulfillment & Courier Dispatch */}
                      <div style={{ backgroundColor: '#FFFDF9', padding: '1.15rem', borderRadius: '4px', border: '1px solid rgba(75, 48, 36, 0.1)', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#4B3024', margin: 0, fontWeight: 700 }}>
                          Fulfillment & Courier Tracking
                        </h4>

                        <div>
                          <label style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#8F7263', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>
                            Fulfillment Status
                          </label>
                          <select
                            value={edits.fulfillmentStatus || 'unfulfilled'}
                            onChange={(e) => handleEditChange(order.id, 'fulfillmentStatus', e.target.value)}
                            className="form-input"
                            style={{ fontSize: '0.82rem', fontWeight: 600 }}
                          >
                            <option value="unfulfilled">Unfulfilled (Awaiting Confirmation)</option>
                            <option value="processing">Processing & Artisan Packing</option>
                            <option value="shipped">Shipped (Dispatched)</option>
                            <option value="delivered">Delivered to Patron</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#8F7263', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>
                            Courier Partner
                          </label>
                          <select
                            value={edits.courierPartner || 'Express Air Logistics'}
                            onChange={(e) => handleEditChange(order.id, 'courierPartner', e.target.value)}
                            className="form-input"
                            style={{ fontSize: '0.82rem' }}
                          >
                            <option value="Express Air Logistics">Express Air Logistics</option>
                            <option value="Blue Dart Air Express">Blue Dart Air Express</option>
                            <option value="Delhivery Surface">Delhivery Surface</option>
                            <option value="DTDC Express Air">DTDC Express Air</option>
                            <option value="India Post Speed Post">India Post Speed Post</option>
                            <option value="Artisan Concierge Hand Delivery">Artisan Concierge Hand Delivery</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#8F7263', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>
                            AWB / Tracking Number
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. BLUEDART-8492019"
                            value={edits.trackingNumber || ''}
                            onChange={(e) => handleEditChange(order.id, 'trackingNumber', e.target.value)}
                            className="form-input"
                            style={{ fontSize: '0.82rem' }}
                          />
                        </div>

                        <div style={{ display: 'flex', gap: '0.55rem', marginTop: 'auto' }}>
                          <button
                            type="button"
                            onClick={() => handleSaveOrderStatus(order)}
                            disabled={updatingId === order.id}
                            style={{
                              flex: 1,
                              padding: '0.62rem 0.9rem',
                              backgroundColor: '#B88D4A',
                              color: '#2A1A13',
                              border: 'none',
                              borderRadius: '3px',
                              fontWeight: 700,
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.4rem'
                            }}
                          >
                            <Save size={14} />
                            <span>{updatingId === order.id ? 'Saving...' : 'Save Fulfillment'}</span>
                          </button>

                          {(order.customerPhone || order.customer_phone) && (
                            <a
                              href={`https://wa.me/91${String(order.customerPhone || order.customer_phone).replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(
                                `Namaste ${order.customerName || order.customer_name || 'Patron'},\n\nUpdate on your RODHE Order #${order.orderNumber || order.order_number}:\n` +
                                `• Payment Status: ${pMeta.label}\n` +
                                `• Fulfillment: ${(edits.fulfillmentStatus || fStatus).toUpperCase()}\n` +
                                `• Courier: ${edits.courierPartner || 'Express Air Logistics'}\n` +
                                (edits.trackingNumber ? `• Tracking AWB: ${edits.trackingNumber}\n\n` : '\n') +
                                `Thank you for supporting generational handloom artisans.\n— RODHE Concierge`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                padding: '0.62rem 0.85rem',
                                backgroundColor: '#25D366',
                                color: '#FFFFFF',
                                borderRadius: '3px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textDecoration: 'none'
                              }}
                              title="Send WhatsApp Update to Patron"
                            >
                              <MessageCircle size={16} />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
