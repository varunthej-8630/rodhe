import React, { useState, useEffect } from 'react';
import { Tag, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { storeService } from '../../services/storeService';

export const AdminPromotions = () => {
  const [promotions, setPromotions] = useState([]);
  const [newPromo, setNewPromo] = useState({
    code: '',
    label: '',
    discountType: 'percentage',
    discountValue: 10,
    isActive: true
  });
  const [isAdding, setIsAdding] = useState(false);

  const loadPromos = async () => {
    const list = await storeService.getPromotions();
    setPromotions(list);
  };

  useEffect(() => {
    loadPromos();
  }, []);

  const handleCreatePromo = async (e) => {
    e.preventDefault();
    if (!newPromo.code.trim()) return;

    await storeService.savePromotion({
      ...newPromo,
      code: newPromo.code.trim().toUpperCase()
    });

    setNewPromo({
      code: '',
      label: '',
      discountType: 'percentage',
      discountValue: 10,
      isActive: true
    });
    setIsAdding(false);
    loadPromos();
  };

  const handleToggleActive = async (promo) => {
    await storeService.savePromotion({ ...promo, isActive: !promo.isActive });
    loadPromos();
  };

  const handleDelete = async (code) => {
    await storeService.deletePromotion(code);
    loadPromos();
  };

  return (
    <div style={{ maxWidth: '980px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', color: '#4B3024', margin: '0 0 0.25rem 0' }}>
            Coupons, Discounts & Festive Offers
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#8F7263', margin: 0 }}>
            Manage promotional coupon codes applied during checkout and shopping bag review.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.65rem 1.15rem',
            backgroundColor: '#4B3024',
            border: 'none',
            borderRadius: '3px',
            color: '#FAF6EE',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <Plus size={15} />
          <span>{isAdding ? 'Cancel' : 'Create New Coupon'}</span>
        </button>
      </div>

      {/* Add New Coupon Form */}
      {isAdding && (
        <form
          onSubmit={handleCreatePromo}
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
          <h3 style={{ fontSize: '0.96rem', fontWeight: 600, color: '#4B3024', margin: 0 }}>
            Create Promotional Coupon Code
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, textTransform: 'uppercase', color: '#4B3024', marginBottom: '0.35rem' }}>
                Coupon Code * (e.g. WOVEN20)
              </label>
              <input
                type="text"
                value={newPromo.code}
                onChange={(e) => setNewPromo({ ...newPromo, code: e.target.value })}
                placeholder="e.g. DIWALI15"
                required
                style={{ width: '100%', padding: '0.65rem', border: '1px solid rgba(75, 48, 36, 0.2)', borderRadius: '3px', textTransform: 'uppercase', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, textTransform: 'uppercase', color: '#4B3024', marginBottom: '0.35rem' }}>
                Discount Value (% or Flat ₹)
              </label>
              <input
                type="number"
                value={newPromo.discountValue}
                onChange={(e) => setNewPromo({ ...newPromo, discountValue: parseFloat(e.target.value) || 0 })}
                min="1"
                required
                style={{ width: '100%', padding: '0.65rem', border: '1px solid rgba(75, 48, 36, 0.2)', borderRadius: '3px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, textTransform: 'uppercase', color: '#4B3024', marginBottom: '0.35rem' }}>
                Offer Label
              </label>
              <input
                type="text"
                value={newPromo.label}
                onChange={(e) => setNewPromo({ ...newPromo, label: e.target.value })}
                placeholder="e.g. 15% Festive Saree Offer"
                style={{ width: '100%', padding: '0.65rem', border: '1px solid rgba(75, 48, 36, 0.2)', borderRadius: '3px', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              style={{ padding: '0.55rem 0.95rem', backgroundColor: '#FAF6EE', border: '1px solid rgba(75, 48, 36, 0.2)', borderRadius: '3px', color: '#4B3024', fontSize: '0.78rem', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{ padding: '0.55rem 1.25rem', backgroundColor: '#4B3024', border: 'none', borderRadius: '3px', color: '#FAF6EE', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
            >
              Save Coupon
            </button>
          </div>
        </form>
      )}

      {/* Promotions List */}
      <div style={{ backgroundColor: '#FFFDF9', borderRadius: '4px', border: '1px solid rgba(75, 48, 36, 0.1)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#F4ECE1', borderBottom: '1px solid rgba(75, 48, 36, 0.1)' }}>
              <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.72rem', textTransform: 'uppercase', color: '#6F4E3E' }}>Coupon Code</th>
              <th style={{ padding: '0.85rem 1rem', fontSize: '0.72rem', textTransform: 'uppercase', color: '#6F4E3E' }}>Discount</th>
              <th style={{ padding: '0.85rem 1rem', fontSize: '0.72rem', textTransform: 'uppercase', color: '#6F4E3E' }}>Description</th>
              <th style={{ padding: '0.85rem 1rem', fontSize: '0.72rem', textTransform: 'uppercase', color: '#6F4E3E' }}>Status</th>
              <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.72rem', textTransform: 'uppercase', color: '#6F4E3E', textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {promotions.map((p) => (
              <tr key={p.code || p.id} style={{ borderBottom: '1px solid rgba(75, 48, 36, 0.06)' }}>
                <td style={{ padding: '0.85rem 1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Tag size={15} color="#B88D4A" />
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.92rem', color: '#4B3024' }}>
                      {p.code}
                    </span>
                  </div>
                </td>
                <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#4B3024', fontSize: '0.86rem' }}>
                  {p.discountType === 'percentage' ? `${p.discountValue}% OFF` : `₹${p.discountValue} OFF`}
                </td>
                <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: '#8F7263' }}>
                  {p.label || 'Active promotional discount'}
                </td>
                <td style={{ padding: '0.85rem 1rem' }}>
                  <button
                    type="button"
                    onClick={() => handleToggleActive(p)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.25rem 0.55rem',
                      borderRadius: '2px',
                      border: 'none',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      backgroundColor: p.isActive ? 'rgba(82, 91, 58, 0.15)' : 'rgba(201, 130, 120, 0.15)',
                      color: p.isActive ? '#525B3A' : '#8A2A20'
                    }}
                  >
                    {p.isActive ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                    <span>{p.isActive ? 'Active' : 'Paused'}</span>
                  </button>
                </td>
                <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                  <button
                    onClick={() => handleDelete(p.code)}
                    style={{ padding: '0.35rem', background: 'none', border: 'none', color: '#C98278', cursor: 'pointer' }}
                    title="Delete Coupon"
                  >
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
