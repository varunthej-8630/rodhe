import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Phone, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  MessageSquare,
  ExternalLink,
  Plus,
  Save,
  Tag,
  User,
  Search,
  Filter
} from 'lucide-react';
import { storeService } from '../../services/storeService';

export const AdminEnquiries = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [signups, setSignups] = useState([]);
  const [activeTab, setActiveTab] = useState('enquiries');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [editingNotesId, setEditingNotesId] = useState(null);
  const [notesValue, setNotesValue] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isCreatingManual, setIsCreatingManual] = useState(false);

  const [manualForm, setManualForm] = useState({
    name: '',
    phone: '',
    email: '',
    sareeInterest: '',
    message: '',
    notes: ''
  });

  const loadData = async () => {
    const enq = await storeService.getEnquiries();
    const sig = await storeService.getSignups();
    setEnquiries(enq);
    setSignups(sig);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStatus = async (id, newStatus) => {
    await storeService.updateEnquiryStatus(id, newStatus);
    await loadData();
  };

  const handleSaveNotes = async (id, currentStatus) => {
    setIsSavingNotes(true);
    try {
      await storeService.updateEnquiryStatus(id, currentStatus, notesValue);
      setEditingNotesId(null);
      await loadData();
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleCreateManual = async (e) => {
    e.preventDefault();
    if (!manualForm.name.trim() || (!manualForm.phone.trim() && !manualForm.email.trim())) {
      alert('Please provide the patron name and either a phone number or email.');
      return;
    }

    await storeService.submitEnquiry({
      customer_name: manualForm.name.trim(),
      phone: manualForm.phone.trim(),
      email: manualForm.email.trim(),
      saree_interest: manualForm.sareeInterest.trim(),
      message: manualForm.message.trim() || 'Direct concierge consultation inquiry',
      notes: manualForm.notes.trim()
    });

    setManualForm({ name: '', phone: '', email: '', sareeInterest: '', message: '', notes: '' });
    setIsCreatingManual(false);
    await loadData();
  };

  const filteredEnquiries = enquiries.filter((e) => {
    const matchesStatus = statusFilter === 'all' || (e.status || 'new') === statusFilter;
    const q = search.toLowerCase();
    const matchesSearch = 
      (e.name || e.customer_name || '').toLowerCase().includes(q) ||
      (e.phone || '').includes(q) ||
      (e.email || '').toLowerCase().includes(q) ||
      (e.sareeInterest || e.saree_interest || '').toLowerCase().includes(q) ||
      (e.message || '').toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  return (
    <div style={{ maxWidth: '980px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', color: '#4B3024', margin: '0 0 0.25rem 0' }}>
            Concierge Inquiries & WhatsApp Consultations
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#8F7263', margin: 0 }}>
            Manage patron saree orders, bespoke weave inquiries, and community members.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setIsCreatingManual(!isCreatingManual)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.55rem 0.95rem',
              backgroundColor: '#FAF6EE',
              border: '1px solid rgba(75, 48, 36, 0.2)',
              borderRadius: '3px',
              fontSize: '0.78rem',
              fontWeight: 600,
              color: '#4B3024',
              cursor: 'pointer'
            }}
          >
            <Plus size={14} color="#B88D4A" />
            <span>{isCreatingManual ? 'Cancel' : 'Log New Inquiry'}</span>
          </button>

          <div style={{ display: 'flex', backgroundColor: '#F4ECE1', padding: '0.25rem', borderRadius: '4px' }}>
            <button
              onClick={() => setActiveTab('enquiries')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '3px',
                border: 'none',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: activeTab === 'enquiries' ? '#4B3024' : 'transparent',
                color: activeTab === 'enquiries' ? '#FAF6EE' : '#6F4E3E'
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
              Community ({signups.length})
            </button>
          </div>
        </div>
      </div>

      {/* Manual Inquiry Form */}
      {isCreatingManual && (
        <form
          onSubmit={handleCreateManual}
          style={{
            backgroundColor: '#FFFDF9',
            padding: '1.5rem',
            borderRadius: '4px',
            border: '1px solid rgba(184, 141, 74, 0.35)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}
        >
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#4B3024', margin: 0 }}>
            Log Offline / WhatsApp Patron Inquiry
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: '#4B3024', marginBottom: '0.35rem' }}>
                Patron Name *
              </label>
              <input
                type="text"
                required
                value={manualForm.name}
                onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })}
                placeholder="e.g. Priyadarshini Rao"
                style={{ width: '100%', padding: '0.65rem', border: '1px solid rgba(75, 48, 36, 0.2)', borderRadius: '3px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: '#4B3024', marginBottom: '0.35rem' }}>
                Phone Number (Include Country Code)
              </label>
              <input
                type="text"
                value={manualForm.phone}
                onChange={(e) => setManualForm({ ...manualForm, phone: e.target.value })}
                placeholder="e.g. 919490658858"
                style={{ width: '100%', padding: '0.65rem', border: '1px solid rgba(75, 48, 36, 0.2)', borderRadius: '3px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: '#4B3024', marginBottom: '0.35rem' }}>
                Email Address
              </label>
              <input
                type="email"
                value={manualForm.email}
                onChange={(e) => setManualForm({ ...manualForm, email: e.target.value })}
                placeholder="e.g. patron@example.com"
                style={{ width: '100%', padding: '0.65rem', border: '1px solid rgba(75, 48, 36, 0.2)', borderRadius: '3px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: '#4B3024', marginBottom: '0.35rem' }}>
                Interested Saree / SKU
              </label>
              <input
                type="text"
                value={manualForm.sareeInterest}
                onChange={(e) => setManualForm({ ...manualForm, sareeInterest: e.target.value })}
                placeholder="e.g. Indigo Shibori (RDH-001)"
                style={{ width: '100%', padding: '0.65rem', border: '1px solid rgba(75, 48, 36, 0.2)', borderRadius: '3px', boxSizing: 'border-box' }}
              />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: '#4B3024', marginBottom: '0.35rem' }}>
              Inquiry / Request Details
            </label>
            <textarea
              rows="2"
              value={manualForm.message}
              onChange={(e) => setManualForm({ ...manualForm, message: e.target.value })}
              placeholder="What did the patron ask or request?"
              style={{ width: '100%', padding: '0.65rem', border: '1px solid rgba(75, 48, 36, 0.2)', borderRadius: '3px', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setIsCreatingManual(false)}
              style={{ padding: '0.55rem 1rem', backgroundColor: '#FAF6EE', border: '1px solid rgba(75, 48, 36, 0.2)', borderRadius: '3px', fontSize: '0.8rem', color: '#4B3024', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{ padding: '0.55rem 1.25rem', backgroundColor: '#4B3024', border: 'none', borderRadius: '3px', fontSize: '0.8rem', color: '#FAF6EE', fontWeight: 600, cursor: 'pointer' }}
            >
              Save Inquiry
            </button>
          </div>
        </form>
      )}

      {activeTab === 'enquiries' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Filter Bar */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', minWidth: '220px', flexGrow: 1, maxWidth: '340px' }}>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by patron, phone, email, or saree..."
                style={{
                  width: '100%',
                  padding: '0.6rem 0.85rem 0.6rem 2.2rem',
                  border: '1px solid rgba(75, 48, 36, 0.18)',
                  borderRadius: '3px',
                  fontSize: '0.82rem',
                  color: '#4B3024',
                  backgroundColor: '#FFFDF9'
                }}
              />
              <Search size={14} color="#8F7263" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '0.6rem 0.85rem',
                border: '1px solid rgba(75, 48, 36, 0.18)',
                borderRadius: '3px',
                fontSize: '0.82rem',
                color: '#4B3024',
                backgroundColor: '#FFFDF9'
              }}
            >
              <option value="all">All Statuses</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="followed_up">Followed Up</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          {/* Enquiries List */}
          {filteredEnquiries.length === 0 ? (
            <div style={{ backgroundColor: '#FFFDF9', padding: '3.5rem', textAlign: 'center', borderRadius: '4px', border: '1px solid rgba(75, 48, 36, 0.1)', color: '#8F7263' }}>
              No inquiries match your criteria. When patrons submit inquiries from the storefront or when you log offline inquiries, they appear here.
            </div>
          ) : (
            filteredEnquiries.map((enq) => {
              const cleanPhone = (enq.phone || '').replace(/[^0-9]/g, '');
              const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hello ${enq.name || enq.customer_name || 'there'}, greetings from RODHE. In response to your inquiry regarding ${enq.sareeInterest || enq.saree_interest || 'our sarees'}...`)}` : null;
              const isEditingNotes = editingNotesId === enq.id;

              return (
                <div
                  key={enq.id}
                  style={{
                    backgroundColor: '#FFFDF9',
                    borderRadius: '4px',
                    border: '1px solid rgba(75, 48, 36, 0.1)',
                    padding: '1.35rem 1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#4B3024', margin: 0 }}>
                          {enq.name || enq.customer_name || 'Patron'}
                        </h4>
                        {enq.createdAt && (
                          <span style={{ fontSize: '0.72rem', color: '#8F7263' }}>
                            {new Date(enq.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#6F4E3E', marginTop: '0.2rem', display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
                        {enq.email && <span>{enq.email}</span>}
                        {enq.phone && <span>Phone: {enq.phone}</span>}
                        {(enq.sareeInterest || enq.saree_interest) && (
                          <span style={{ color: '#B88D4A', fontWeight: 600 }}>
                            Interested in: {enq.sareeInterest || enq.saree_interest}
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      {waUrl && (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.45rem 0.85rem',
                            backgroundColor: '#25D366',
                            color: '#FFFFFF',
                            borderRadius: '3px',
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            textDecoration: 'none'
                          }}
                        >
                          <Phone size={13} />
                          <span>Chat on WhatsApp</span>
                        </a>
                      )}

                      <select
                        value={enq.status || 'new'}
                        onChange={(e) => handleUpdateStatus(enq.id, e.target.value)}
                        style={{
                          padding: '0.45rem 0.75rem',
                          borderRadius: '3px',
                          border: '1px solid rgba(75, 48, 36, 0.2)',
                          fontSize: '0.76rem',
                          fontWeight: 600,
                          backgroundColor: '#FAF6EE',
                          color: '#4B3024'
                        }}
                      >
                        <option value="new">Status: New</option>
                        <option value="contacted">Status: Contacted</option>
                        <option value="followed_up">Status: Followed Up</option>
                        <option value="resolved">Status: Resolved</option>
                      </select>
                    </div>
                  </div>

                  {enq.message && (
                    <div style={{ backgroundColor: '#FAF6EE', padding: '0.85rem 1rem', borderRadius: '3px', border: '1px solid rgba(75, 48, 36, 0.08)' }}>
                      <p style={{ fontSize: '0.84rem', color: '#4B3024', margin: 0, lineHeight: 1.5 }}>
                        "{enq.message}"
                      </p>
                    </div>
                  )}

                  {/* Internal Follow-Up Notes */}
                  <div style={{ paddingTop: '0.5rem', borderTop: '1px solid rgba(75, 48, 36, 0.08)' }}>
                    {isEditingNotes ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <textarea
                          rows="2"
                          value={notesValue}
                          onChange={(e) => setNotesValue(e.target.value)}
                          placeholder="Add internal notes about conversation, customer saree preferences, callback times..."
                          style={{ width: '100%', padding: '0.6rem', border: '1px solid rgba(75, 48, 36, 0.2)', borderRadius: '3px', fontSize: '0.82rem', boxSizing: 'border-box' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          <button
                            type="button"
                            onClick={() => setEditingNotesId(null)}
                            style={{ padding: '0.35rem 0.75rem', backgroundColor: '#FAF6EE', border: '1px solid rgba(75, 48, 36, 0.2)', borderRadius: '2px', fontSize: '0.74rem', cursor: 'pointer' }}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={isSavingNotes}
                            onClick={() => handleSaveNotes(enq.id, enq.status || 'new')}
                            style={{ padding: '0.35rem 0.9rem', backgroundColor: '#4B3024', color: '#FAF6EE', border: 'none', borderRadius: '2px', fontSize: '0.74rem', fontWeight: 600, cursor: 'pointer' }}
                          >
                            {isSavingNotes ? 'Saving...' : 'Save Notes'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.76rem', color: enq.notes ? '#4B3024' : '#8F7263', fontStyle: enq.notes ? 'normal' : 'italic' }}>
                          <strong>Internal Notes:</strong> {enq.notes || 'No follow-up notes yet.'}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingNotesId(enq.id);
                            setNotesValue(enq.notes || '');
                          }}
                          style={{ background: 'none', border: 'none', color: '#B88D4A', fontSize: '0.74rem', fontWeight: 600, cursor: 'pointer' }}
                        >
                          {enq.notes ? 'Edit Notes' : '+ Add Note'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Community Signups Tab */
        <div style={{ backgroundColor: '#FFFDF9', borderRadius: '4px', border: '1px solid rgba(75, 48, 36, 0.1)', overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(75, 48, 36, 0.08)' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#4B3024', margin: '0 0 0.25rem 0' }}>
              Circle of Trust Community Signups
            </h3>
            <p style={{ fontSize: '0.78rem', color: '#8F7263', margin: 0 }}>
              Patrons who subscribed to receive private loom releases and early festive reservations.
            </p>
          </div>

          {signups.length === 0 ? (
            <div style={{ padding: '3.5rem', textAlign: 'center', color: '#8F7263' }}>
              No community signups yet. Subscribers from the storefront footer will appear here.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#F4ECE1', borderBottom: '1px solid rgba(75, 48, 36, 0.12)' }}>
                  <th style={{ padding: '0.75rem 1.25rem', fontSize: '0.72rem', textTransform: 'uppercase', color: '#6F4E3E', fontWeight: 600 }}>Email Address</th>
                  <th style={{ padding: '0.75rem 1rem', fontSize: '0.72rem', textTransform: 'uppercase', color: '#6F4E3E', fontWeight: 600 }}>Phone</th>
                  <th style={{ padding: '0.75rem 1.25rem', fontSize: '0.72rem', textTransform: 'uppercase', color: '#6F4E3E', fontWeight: 600, textAlign: 'right' }}>Joined Date</th>
                </tr>
              </thead>
              <tbody>
                {signups.map((s, idx) => (
                  <tr key={s.id || idx} style={{ borderBottom: '1px solid rgba(75, 48, 36, 0.06)' }}>
                    <td style={{ padding: '0.75rem 1.25rem', fontSize: '0.84rem', color: '#4B3024', fontWeight: 500 }}>
                      {s.email}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.80rem', color: '#8F7263' }}>
                      {s.phone || '—'}
                    </td>
                    <td style={{ padding: '0.75rem 1.25rem', fontSize: '0.76rem', color: '#8F7263', textAlign: 'right' }}>
                      {s.createdAt ? new Date(s.createdAt).toLocaleDateString('en-IN') : 'Recent'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};
