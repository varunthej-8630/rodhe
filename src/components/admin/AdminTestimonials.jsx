import React, { useState, useEffect } from 'react';
import { Star, Plus, Trash2, CheckCircle2, MessageSquareQuote } from 'lucide-react';
import { storeService } from '../../services/storeService';

export const AdminTestimonials = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newReview, setNewReview] = useState({
    name: '',
    location: '',
    role: '',
    review: '',
    saree: '',
    rating: 5,
    date: 'October 2026'
  });

  const loadData = async () => {
    const list = await storeService.getTestimonials();
    setTestimonials(list);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newReview.name || !newReview.review) return;

    await storeService.saveTestimonial(newReview);
    setNewReview({
      name: '',
      location: '',
      role: '',
      review: '',
      saree: '',
      rating: 5,
      date: 'October 2026'
    });
    setIsAdding(false);
    loadData();
  };

  return (
    <div style={{ maxWidth: '980px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', color: '#4B3024', margin: '0 0 0.25rem 0' }}>
            Patron Stories & Testimonials
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#8F7263', margin: 0 }}>
            Curate authorized patron reviews that appear in the interactive shuffling card section.
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
          <span>{isAdding ? 'Cancel' : 'Add Patron Review'}</span>
        </button>
      </div>

      {isAdding && (
        <form
          onSubmit={handleCreate}
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
            Add Patron Testimonial
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, textTransform: 'uppercase', color: '#4B3024', marginBottom: '0.35rem' }}>
                Patron Full Name *
              </label>
              <input
                type="text"
                value={newReview.name}
                onChange={(e) => setNewReview({ ...newReview, name: e.target.value })}
                placeholder="e.g. Radhika Apte"
                required
                style={{ width: '100%', padding: '0.65rem', border: '1px solid rgba(75, 48, 36, 0.2)', borderRadius: '3px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, textTransform: 'uppercase', color: '#4B3024', marginBottom: '0.35rem' }}>
                Location (City / State)
              </label>
              <input
                type="text"
                value={newReview.location}
                onChange={(e) => setNewReview({ ...newReview, location: e.target.value })}
                placeholder="e.g. New Delhi"
                style={{ width: '100%', padding: '0.65rem', border: '1px solid rgba(75, 48, 36, 0.2)', borderRadius: '3px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, textTransform: 'uppercase', color: '#4B3024', marginBottom: '0.35rem' }}>
                Role or Profession
              </label>
              <input
                type="text"
                value={newReview.role}
                onChange={(e) => setNewReview({ ...newReview, role: e.target.value })}
                placeholder="e.g. Textile Curator"
                style={{ width: '100%', padding: '0.65rem', border: '1px solid rgba(75, 48, 36, 0.2)', borderRadius: '3px', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, textTransform: 'uppercase', color: '#4B3024', marginBottom: '0.35rem' }}>
                Saree Draped
              </label>
              <input
                type="text"
                value={newReview.saree}
                onChange={(e) => setNewReview({ ...newReview, saree: e.target.value })}
                placeholder="e.g. Nilambari Shibori Mulmul Saree"
                style={{ width: '100%', padding: '0.65rem', border: '1px solid rgba(75, 48, 36, 0.2)', borderRadius: '3px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, textTransform: 'uppercase', color: '#4B3024', marginBottom: '0.35rem' }}>
                Rating (1 to 5 Stars)
              </label>
              <select
                value={newReview.rating}
                onChange={(e) => setNewReview({ ...newReview, rating: parseInt(e.target.value, 10) })}
                style={{ width: '100%', padding: '0.65rem', border: '1px solid rgba(75, 48, 36, 0.2)', borderRadius: '3px', backgroundColor: '#FFFDF9' }}
              >
                <option value={5}>5 Stars (Exceptional)</option>
                <option value={4}>4 Stars (Very Good)</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, textTransform: 'uppercase', color: '#4B3024', marginBottom: '0.35rem' }}>
              Review Text *
            </label>
            <textarea
              rows={3}
              value={newReview.review}
              onChange={(e) => setNewReview({ ...newReview, review: e.target.value })}
              placeholder="The tactile feel of the botanical indigo..."
              required
              style={{ width: '100%', padding: '0.65rem', border: '1px solid rgba(75, 48, 36, 0.2)', borderRadius: '3px', boxSizing: 'border-box', fontFamily: 'inherit' }}
            />
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
              Save Testimonial
            </button>
          </div>
        </form>
      )}

      {/* Testimonials Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '1.25rem' }}>
        {testimonials.map((t) => (
          <div
            key={t.id}
            style={{
              backgroundColor: '#FFFDF9',
              padding: '1.5rem',
              borderRadius: '4px',
              border: '1px solid rgba(75, 48, 36, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '1rem'
            }}
          >
            <div>
              <div style={{ display: 'flex', gap: '0.2rem', marginBottom: '0.85rem' }}>
                {[...Array(t.rating || 5)].map((_, i) => (
                  <Star key={i} size={14} fill="#B88D4A" color="#B88D4A" />
                ))}
              </div>
              <p style={{ fontStyle: 'italic', fontFamily: 'var(--font-serif)', fontSize: '1.05rem', color: '#4B3024', lineHeight: 1.5, margin: '0 0 1rem 0' }}>
                "{t.review}"
              </p>
              {t.saree && (
                <div style={{ fontSize: '0.74rem', color: '#B88D4A', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Draped: {t.saree}
                </div>
              )}
            </div>

            <div style={{ borderTop: '1px solid rgba(75, 48, 36, 0.08)', paddingTop: '0.85rem' }}>
              <div style={{ fontWeight: 600, fontSize: '0.86rem', color: '#4B3024' }}>{t.name}</div>
              <div style={{ fontSize: '0.74rem', color: '#8F7263' }}>{t.role} • {t.location}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
