import React, { useState, useEffect } from 'react';
import { Mail, Phone, Calendar, CheckCircle2, Clock, MessageSquare } from 'lucide-react';
import { storeService } from '../../services/storeService';

export const AdminEnquiries = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [signups, setSignups] = useState([]);
  const [activeTab, setActiveTab] = useState('orders');

  const loadData = async () => {
    const enq = await storeService.getEnquiries();
    const sig = await storeService.getSignups();
    setEnquiries(enq);
    setSignups(sig);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    await storeService.updateEnquiryStatus(id, status);
    loadData();
  };

  return (
    <div style={{ maxWidth: '980px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', color: '#4B3024', margin: '0 0 0.25rem 0' }}>
            Concierge Inquiries & Circle Signups
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#8F7263', margin: 0 }}>
            Patrons who requested bespoke saree consultations, WhatsApp assistance, or joined the Circle of Trust.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: '#F4ECE1', padding: '0.25rem', borderRadius: '4px' }}>
          <button
            onClick={() => setActiveTab('orders')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '3px',
              border: 'none',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: activeTab === 'orders' ? '#4B3024' : 'transparent',
              color: activeTab === 'orders' ? '#FAF6EE' : '#6F4E3E'
            }}
          >
            Inquiries ({enquiries.length})
          </button>
          <button
            onClick={() => setActiveTab('circle')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '3px',
              border: 'none',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: activeTab === 'circle' ? '#4B3024' : 'transparent',
              color: activeTab === 'circle' ? '#FAF6EE' : '#6F4E3E'
            }}
          >
            Community Circle ({signups.length})
          </button>
        </div>
      </div>

      {activeTab === 'orders' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {enquiries.length === 0 ? (
            <div style={{ backgroundColor: '#FFFDF9', padding: '3rem', textAlign: 'center', borderRadius: '4px', border: '1px solid rgba(75, 48, 36, 0.1)', color: '#8F7263' }}>
              No inquiries logged yet. Inquiries made via the contact form or WhatsApp modal will appear here.
            </div>
          ) : (
            enquiries.map((enq) => (
              <div
                key={enq.id}
                style={{
                  backgroundColor: '#FFFDF9',
                  borderRadius: '4px',
                  border: '1px solid rgba(75, 48, 36, 0.1)',
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ fontSize: '0.98rem', fontWeight: 600, color: '#4B3024', margin: 0 }}>
                      {enq.customer_name || enq.name || 'Patron Inquiry'}
                    </h4>
                    <span style={{ fontSize: '0.76rem', color: '#8F7263' }}>
                      {enq.email} • {enq.phone || 'No phone provided'}
                    </span>
                  </div>

                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '2px',
                      backgroundColor: enq.status === 'responded' ? 'rgba(82, 91, 58, 0.15)' : 'rgba(184, 141, 74, 0.15)',
                      color: enq.status === 'responded' ? '#525B3A' : '#B88D4A'
                    }}
                  >
                    {enq.status}
                  </span>
                </div>

                <p style={{ fontSize: '0.84rem', color: '#4B3024', margin: 0, backgroundColor: '#FAF6EE', padding: '0.75rem', borderRadius: '3px' }}>
                  "{enq.message}"
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: '#8F7263' }}>
                  <span>Logged: {new Date(enq.createdAt || Date.now()).toLocaleDateString('en-IN')}</span>
                  {enq.status !== 'responded' && (
                    <button
                      onClick={() => handleUpdateStatus(enq.id, 'responded')}
                      style={{ background: 'none', border: 'none', color: '#B88D4A', fontWeight: 600, cursor: 'pointer', fontSize: '0.74rem' }}
                    >
                      Mark as Responded ✓
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div style={{ backgroundColor: '#FFFDF9', borderRadius: '4px', border: '1px solid rgba(75, 48, 36, 0.1)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#F4ECE1', borderBottom: '1px solid rgba(75, 48, 36, 0.1)' }}>
                <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.72rem', textTransform: 'uppercase', color: '#6F4E3E' }}>Email Address</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.72rem', textTransform: 'uppercase', color: '#6F4E3E' }}>Phone</th>
                <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.72rem', textTransform: 'uppercase', color: '#6F4E3E', textAlign: 'right' }}>Date Joined</th>
              </tr>
            </thead>
            <tbody>
              {signups.length === 0 ? (
                <tr>
                  <td colSpan="3" style={{ padding: '2.5rem', textAlign: 'center', color: '#8F7263', fontSize: '0.84rem' }}>
                    No community signups yet.
                  </td>
                </tr>
              ) : (
                signups.map((s, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(75, 48, 36, 0.06)' }}>
                    <td style={{ padding: '0.85rem 1.25rem', fontWeight: 600, color: '#4B3024', fontSize: '0.86rem' }}>
                      {s.email}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: '#8F7263' }}>
                      {s.phone || '—'}
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right', fontSize: '0.78rem', color: '#8F7263' }}>
                      {new Date(s.createdAt || Date.now()).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
