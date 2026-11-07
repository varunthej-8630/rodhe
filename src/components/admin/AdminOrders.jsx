import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Truck, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Search, 
  Filter, 
  MapPin, 
  Phone, 
  Mail, 
  ExternalLink,
  ChevronDown,
  Save,
  MessageCircle
} from 'lucide-react';
import { storeService } from '../../services/storeService';
import { useShop } from '../../context/ShopContext';

export const AdminOrders = () => {
  const { showToast } = useShop();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  // Form states for status/tracking editing per order
  const [editStates, setEditStates] = useState({});

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const data = await storeService.getOrders();
      setOrders(Array.isArray(data) ? data : []);
      
      // Initialize edit states
      const initialEdits = {};
      (data || []).forEach(o => {
        initialEdits[o.id] = {
          fulfillmentStatus: o.fulfillmentStatus || o.fulfillment_status || 'unfulfilled',
          paymentStatus: o.paymentStatus || o.payment_status || 'pending',
          trackingNumber: o.trackingNumber || o.tracking_number || '',
          courierPartner: o.courierPartner || o.courier_partner || 'Blue Dart Express'
        };
      });
      setEditStates(initialEdits);
    } catch (err) {
      console.warn('Error loading orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleEditChange = (orderId, field, value) => {
    setEditStates(prev => ({
      ...prev,
      [orderId]: {
        ...(prev[orderId] || {}),
        [field]: value
      }
    }));
  };

  const handleSaveOrderStatus = async (order) => {
    const edits = editStates[order.id] || {};
    setUpdatingId(order.id);

    try {
      await storeService.updateOrderStatus(order.id, {
        fulfillmentStatus: edits.fulfillmentStatus,
        paymentStatus: edits.paymentStatus,
        trackingNumber: edits.trackingNumber,
        courierPartner: edits.courierPartner
      });

      showToast(`Order #${order.orderNumber || order.order_number} updated successfully!`);
      await loadOrders();
    } catch (err) {
      showToast('Failed to update order status.', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  // Filtered orders
  const filteredOrders = orders.filter(o => {
    const status = o.fulfillmentStatus || o.fulfillment_status || 'unfulfilled';
    if (filterStatus !== 'all' && status !== filterStatus) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const num = (o.orderNumber || o.order_number || '').toLowerCase();
      const name = (o.customerName || o.customer_name || '').toLowerCase();
      const email = (o.customerEmail || o.customer_email || '').toLowerCase();
      const phone = (o.customerPhone || o.customer_phone || '').toLowerCase();
      return num.includes(q) || name.includes(q) || email.includes(q) || phone.includes(q);
    }
    return true;
  });

  // KPI calculations
  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.grandTotal || o.grand_total) || 0), 0);
  const unfulfilledCount = orders.filter(o => (o.fulfillmentStatus || o.fulfillment_status) === 'unfulfilled').length;
  const processingCount = orders.filter(o => (o.fulfillmentStatus || o.fulfillment_status) === 'processing').length;
  const shippedCount = orders.filter(o => (o.fulfillmentStatus || o.fulfillment_status) === 'shipped').length;

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'delivered':
        return { backgroundColor: 'rgba(82, 91, 58, 0.15)', color: '#525B3A', border: '1px solid rgba(82, 91, 58, 0.3)' };
      case 'shipped':
        return { backgroundColor: 'rgba(38, 66, 90, 0.12)', color: '#26425A', border: '1px solid rgba(38, 66, 90, 0.25)' };
      case 'processing':
        return { backgroundColor: 'rgba(184, 141, 74, 0.15)', color: '#B88D4A', border: '1px solid rgba(184, 141, 74, 0.3)' };
      case 'cancelled':
        return { backgroundColor: 'rgba(201, 130, 120, 0.15)', color: '#C98278', border: '1px solid rgba(201, 130, 120, 0.3)' };
      default: // unfulfilled
        return { backgroundColor: 'rgba(75, 48, 36, 0.1)', color: '#4B3024', border: '1px solid rgba(75, 48, 36, 0.2)' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header Banner */}
      <div
        style={{
          backgroundColor: '#FFFDF9',
          padding: '1.75rem 2rem',
          borderRadius: '4px',
          border: '1px solid rgba(75, 48, 36, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.25rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.72rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#B88D4A', fontWeight: 700 }}>
              Order Fulfillment & Commerce
            </span>
            <span style={{ fontSize: '0.72rem', backgroundColor: 'rgba(82, 91, 58, 0.15)', color: '#525B3A', padding: '0.1rem 0.45rem', borderRadius: '2px', fontWeight: 600 }}>
              Authoritative Sync
            </span>
          </div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', color: '#4B3024', margin: '0 0 0.45rem' }}>
            Customer Orders & Shipments
          </h2>
          <p style={{ fontSize: '0.86rem', color: '#8F7263', margin: 0, maxWidth: '640px' }}>
            Track orders placed by patrons across India, manage delivery addresses, update insured courier tracking numbers, and fulfill shipments.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={loadOrders}
            className="btn btn-outline"
            style={{ padding: '0.6rem 1.15rem', fontSize: '0.82rem' }}
          >
            Refresh Orders
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem'
        }}
      >
        <div style={{ backgroundColor: '#FFFDF9', padding: '1.25rem', borderRadius: '4px', border: '1px solid rgba(75, 48, 36, 0.1)' }}>
          <span style={{ fontSize: '0.74rem', color: '#8F7263', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Total Orders</span>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: '#4B3024', fontWeight: 600, marginTop: '0.35rem' }}>
            {orders.length}
          </div>
        </div>

        <div style={{ backgroundColor: '#FFFDF9', padding: '1.25rem', borderRadius: '4px', border: '1px solid rgba(75, 48, 36, 0.1)' }}>
          <span style={{ fontSize: '0.74rem', color: '#C98278', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Action Needed (Unfulfilled)</span>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: '#C98278', fontWeight: 600, marginTop: '0.35rem' }}>
            {unfulfilledCount}
          </div>
        </div>

        <div style={{ backgroundColor: '#FFFDF9', padding: '1.25rem', borderRadius: '4px', border: '1px solid rgba(75, 48, 36, 0.1)' }}>
          <span style={{ fontSize: '0.74rem', color: '#B88D4A', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>In Processing</span>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: '#B88D4A', fontWeight: 600, marginTop: '0.35rem' }}>
            {processingCount}
          </div>
        </div>

        <div style={{ backgroundColor: '#FFFDF9', padding: '1.25rem', borderRadius: '4px', border: '1px solid rgba(75, 48, 36, 0.1)' }}>
          <span style={{ fontSize: '0.74rem', color: '#525B3A', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Shipped & En Route</span>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: '#525B3A', fontWeight: 600, marginTop: '0.35rem' }}>
            {shippedCount}
          </div>
        </div>

        <div style={{ backgroundColor: '#FFFDF9', padding: '1.25rem', borderRadius: '4px', border: '1px solid rgba(75, 48, 36, 0.1)' }}>
          <span style={{ fontSize: '0.74rem', color: '#8F7263', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Total Order Value</span>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: '#4B3024', fontWeight: 600, marginTop: '0.35rem' }}>
            ₹{totalRevenue.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div
        style={{
          backgroundColor: '#FFFDF9',
          padding: '1rem 1.5rem',
          borderRadius: '4px',
          border: '1px solid rgba(75, 48, 36, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All Orders' },
            { id: 'unfulfilled', label: `Unfulfilled (${unfulfilledCount})` },
            { id: 'processing', label: 'Processing' },
            { id: 'shipped', label: 'Shipped' },
            { id: 'delivered', label: 'Delivered' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              style={{
                padding: '0.45rem 0.9rem',
                fontSize: '0.8rem',
                fontWeight: filterStatus === tab.id ? 700 : 500,
                backgroundColor: filterStatus === tab.id ? '#4B3024' : '#FAF6EE',
                color: filterStatus === tab.id ? '#FAF6EE' : '#6F4E3E',
                border: '1px solid rgba(75, 48, 36, 0.12)',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', minWidth: '240px' }}>
          <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#8F7263' }} />
          <input
            type="text"
            placeholder="Search by order #, name, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '0.5rem 0.75rem 0.5rem 2.2rem',
              fontSize: '0.82rem',
              border: '1px solid rgba(75, 48, 36, 0.2)',
              borderRadius: '3px',
              backgroundColor: '#FAF6EE',
              color: '#4B3024',
              width: '100%'
            }}
          />
        </div>
      </div>

      {/* Orders List Table */}
      <div
        style={{
          backgroundColor: '#FFFDF9',
          borderRadius: '4px',
          border: '1px solid rgba(75, 48, 36, 0.1)',
          overflow: 'hidden'
        }}
      >
        {isLoading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#8F7263' }}>
            Loading customer orders...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div style={{ padding: '3.5rem 2rem', textAlign: 'center', color: '#8F7263' }}>
            <ShoppingBag size={42} style={{ margin: '0 auto 1rem', opacity: 0.4, color: '#B88D4A' }} />
            <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', color: '#4B3024', marginBottom: '0.35rem' }}>
              No Orders Found
            </h4>
            <p style={{ fontSize: '0.86rem', maxWidth: '420px', margin: '0 auto' }}>
              {filterStatus !== 'all' ? `There are currently no orders with status "${filterStatus}".` : 'No orders have been placed yet.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filteredOrders.map((order, index) => {
              const isExpanded = expandedOrderId === order.id;
              const edits = editStates[order.id] || {};
              const items = Array.isArray(order.items) ? order.items : [];
              const status = order.fulfillmentStatus || order.fulfillment_status || 'unfulfilled';
              const paymentStatus = order.paymentStatus || order.payment_status || 'pending';
              const addr = order.shippingAddress || order.shipping_address || {};

              return (
                <div
                  key={order.id || index}
                  style={{
                    borderBottom: '1px solid rgba(75, 48, 36, 0.08)',
                    transition: 'background-color 0.2s ease'
                  }}
                >
                  {/* Summary Row */}
                  <div
                    style={{
                      padding: '1.25rem 1.75rem',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: '1rem',
                      alignItems: 'center',
                      cursor: 'pointer',
                      backgroundColor: isExpanded ? 'rgba(234, 218, 181, 0.15)' : 'transparent'
                    }}
                    onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#4B3024', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <span>#{order.orderNumber || order.order_number}</span>
                      </div>
                      <span style={{ fontSize: '0.74rem', color: '#8F7263' }}>
                        {new Date(order.createdAt || order.created_at || Date.now()).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>

                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.86rem', color: '#4B3024' }}>
                        {order.customerName || order.customer_name || 'Patron'}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: '#8F7263' }}>
                        {order.customerPhone || order.customer_phone || order.customerEmail || 'Contact details'}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.74rem', color: '#8F7263', textTransform: 'uppercase' }}>Items</div>
                      <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#4B3024' }}>
                        {items.length} {items.length === 1 ? 'Saree' : 'Sarees'}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.74rem', color: '#8F7263', textTransform: 'uppercase' }}>Grand Total</div>
                      <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', fontWeight: 700, color: '#4B3024' }}>
                        ₹{Number(order.grandTotal || order.grand_total || 0).toLocaleString('en-IN')}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          padding: '0.25rem 0.6rem',
                          borderRadius: '3px',
                          ...getStatusBadgeStyle(status)
                        }}
                      >
                        {status}
                      </span>

                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          padding: '0.2rem 0.45rem',
                          borderRadius: '2px',
                          backgroundColor: paymentStatus === 'captured' ? 'rgba(82, 91, 58, 0.1)' : 'rgba(184, 141, 74, 0.1)',
                          color: paymentStatus === 'captured' ? '#525B3A' : '#B88D4A'
                        }}
                      >
                        {order.paymentMethod || order.payment_method || 'UPI'} • {paymentStatus}
                      </span>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <button
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
                        {isExpanded ? 'Hide Details' : 'Manage'}
                        <ChevronDown size={14} style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Detail Panel */}
                  {isExpanded && (
                    <div
                      style={{
                        padding: '1.5rem 2rem',
                        backgroundColor: '#FAF6EE',
                        borderTop: '1px solid rgba(75, 48, 36, 0.08)',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: '1.75rem'
                      }}
                    >
                      {/* Left: Ordered Items & Shipping Details */}
                      <div>
                        <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#4B3024', marginBottom: '0.75rem', fontWeight: 700 }}>
                          Ordered Sarees
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.25rem' }}>
                          {items.map((it, idx) => (
                            <div
                              key={it.id || idx}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                backgroundColor: '#FFFDF9',
                                padding: '0.6rem 0.75rem',
                                borderRadius: '4px',
                                border: '1px solid rgba(75, 48, 36, 0.08)'
                              }}
                            >
                              <img
                                src={it.primaryImage || '/assets/products/saree_ivory_mulmul.jpg'}
                                alt={it.name}
                                style={{ width: '42px', height: '52px', objectFit: 'cover', borderRadius: '2px' }}
                              />
                              <div style={{ flexGrow: 1 }}>
                                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#4B3024' }}>
                                  {it.name}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: '#8F7263' }}>
                                  SKU: {it.sku} • Qty: {it.quantity}
                                </div>
                              </div>
                              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#4B3024' }}>
                                ₹{Number(it.subtotal || it.unitPrice || 0).toLocaleString('en-IN')}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Delivery Address Box */}
                        <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#4B3024', marginBottom: '0.45rem', fontWeight: 700 }}>
                          Delivery Address
                        </h4>
                        <div style={{ backgroundColor: '#FFFDF9', padding: '0.75rem', borderRadius: '4px', border: '1px solid rgba(75, 48, 36, 0.08)', fontSize: '0.82rem', color: '#4B3024', lineHeight: 1.5 }}>
                          <div><strong>Recipient:</strong> {order.customerName || order.customer_name}</div>
                          <div><strong>Address:</strong> {addr.addressLine1 || addr.address || 'Standard Address'}</div>
                          {addr.landmark && <div><strong>Landmark:</strong> {addr.landmark}</div>}
                          <div><strong>City & State:</strong> {addr.city || 'Bengaluru'}, {addr.state || 'Karnataka'} - {addr.pincode || '560001'}</div>
                          <div><strong>Phone:</strong> {order.customerPhone || order.customer_phone || 'N/A'}</div>
                          <div><strong>Email:</strong> {order.customerEmail || order.customer_email || 'N/A'}</div>
                        </div>
                      </div>

                      {/* Right: Fulfillment & Tracking Controls */}
                      <div>
                        <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#4B3024', marginBottom: '0.75rem', fontWeight: 700 }}>
                          Fulfillment & Tracking Controls
                        </h4>

                        <div
                          style={{
                            backgroundColor: '#FFFDF9',
                            padding: '1.25rem',
                            borderRadius: '4px',
                            border: '1px solid rgba(75, 48, 36, 0.1)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.85rem'
                          }}
                        >
                          <div>
                            <label style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#8F7263', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>
                              Fulfillment Status
                            </label>
                            <select
                              value={edits.fulfillmentStatus || 'unfulfilled'}
                              onChange={(e) => handleEditChange(order.id, 'fulfillmentStatus', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '0.55rem',
                                fontSize: '0.82rem',
                                borderRadius: '3px',
                                border: '1px solid rgba(75, 48, 36, 0.2)',
                                backgroundColor: '#FAF6EE',
                                color: '#4B3024',
                                fontWeight: 600
                              }}
                            >
                              <option value="unfulfilled">Unfulfilled (New Order)</option>
                              <option value="processing">Processing & Artisan Packing</option>
                              <option value="shipped">Shipped (Dispatched to Courier)</option>
                              <option value="delivered">Delivered to Patron</option>
                              <option value="cancelled">Cancelled & Refunded</option>
                            </select>
                          </div>

                          <div>
                            <label style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#8F7263', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>
                              Courier Partner
                            </label>
                            <select
                              value={edits.courierPartner || 'Blue Dart Air Express'}
                              onChange={(e) => handleEditChange(order.id, 'courierPartner', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '0.55rem',
                                fontSize: '0.82rem',
                                borderRadius: '3px',
                                border: '1px solid rgba(75, 48, 36, 0.2)',
                                backgroundColor: '#FAF6EE',
                                color: '#4B3024'
                              }}
                            >
                              <option value="Blue Dart Air Express">Blue Dart Air Express</option>
                              <option value="Delhivery Surface">Delhivery Surface</option>
                              <option value="DTDC Express Air">DTDC Express Air</option>
                              <option value="India Post Speed Post">India Post Speed Post</option>
                              <option value="Shadowfax">Shadowfax</option>
                              <option value="Artisan Concierge Hand Delivery">Artisan Concierge Hand Delivery</option>
                            </select>
                          </div>

                          <div>
                            <label style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#8F7263', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>
                              Airway Bill (AWB) / Tracking Number
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. BLUEDART-8492019"
                              value={edits.trackingNumber || ''}
                              onChange={(e) => handleEditChange(order.id, 'trackingNumber', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '0.55rem',
                                fontSize: '0.82rem',
                                borderRadius: '3px',
                                border: '1px solid rgba(75, 48, 36, 0.2)',
                                backgroundColor: '#FAF6EE',
                                color: '#4B3024'
                              }}
                            />
                          </div>

                          <div style={{ display: 'flex', gap: '0.65rem', marginTop: '0.5rem' }}>
                            <button
                              onClick={() => handleSaveOrderStatus(order)}
                              disabled={updatingId === order.id}
                              style={{
                                flexGrow: 1,
                                padding: '0.65rem 1rem',
                                backgroundColor: '#B88D4A',
                                color: '#2A1A13',
                                border: 'none',
                                borderRadius: '3px',
                                fontWeight: 700,
                                fontSize: '0.82rem',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.45rem'
                              }}
                            >
                              <Save size={15} />
                              {updatingId === order.id ? 'Updating...' : 'Save & Update Order'}
                            </button>

                            {order.customerPhone && (
                              <a
                                href={`https://wa.me/91${order.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                                  `Namaste ${order.customerName || 'Patron'},\n\nUpdate on your RODHE Order #${order.orderNumber || order.order_number}:\n` +
                                  `• Status: ${(edits.fulfillmentStatus || 'Processing').toUpperCase()}\n` +
                                  `• Courier: ${edits.courierPartner || 'Express Air'}\n` +
                                  (edits.trackingNumber ? `• Tracking AWB: ${edits.trackingNumber}\n\n` : `\n`) +
                                  `Thank you for honoring Indian generational handloom craft.\n— RODHE Concierge`
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  padding: '0.65rem 0.85rem',
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

