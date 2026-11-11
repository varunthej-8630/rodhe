import React, { useState } from 'react';
import { Mail, Phone, Clock, Send, CheckCircle2, ChevronDown, AlertCircle, MessageCircle, Copy, MapPin } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { storeService } from '../services/storeService';
import { isValidEmail, isValidIndianPhone, formatPhoneDigits } from '../services/customerService';

export const ContactConciergePage = () => {
  const { showToast, storeSettings } = useShop();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'Styling & Saree Selection',
    message: ''
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [lastWaUrl, setLastWaUrl] = useState('');
  const [lastWaText, setLastWaText] = useState('');
  const [openFaq, setOpenFaq] = useState(0);

  const waNumber = (storeSettings?.whatsappNumber || '919490658858').replace(/[^0-9]/g, '') || '919490658858';
  const contactEmail = storeSettings?.conciergeEmail || 'rodhesaree@gmail.com';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const errs = {};
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      errs.name = 'Please enter your full name.';
    }
    if (!formData.email.trim() || !isValidEmail(formData.email)) {
      errs.email = 'Please enter a valid email address.';
    }
    if (formData.phone.trim() && !isValidIndianPhone(formData.phone)) {
      errs.phone = 'Enter a valid 10-digit Indian mobile number.';
    }
    if (!formData.message.trim() || formData.message.trim().length < 10) {
      errs.message = 'Please share a brief note (at least 10 characters).';
    }

    setFieldErrors(errs);
    setSubmitError('');
    if (Object.keys(errs).length > 0) return;

    setIsSubmitting(true);
    try {
      await storeService.submitEnquiry({
        name: formData.name.trim(),
        customer_name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formatPhoneDigits(formData.phone) || '',
        subject: formData.subject,
        saree_interest: formData.subject,
        message: formData.message.trim(),
        source: 'contact_page'
      });

      const plainMsg =
        `Namaste RODHE Concierge,\n\nI am sending an inquiry from your website:\n` +
        `• Name: ${formData.name.trim()}\n` +
        `• Email: ${formData.email.trim()}\n` +
        (formData.phone.trim() ? `• Phone: +91 ${formatPhoneDigits(formData.phone)}\n` : '') +
        `• Subject: ${formData.subject}\n\n` +
        `Message:\n${formData.message.trim()}`;

      const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(plainMsg)}`;
      setLastWaText(plainMsg);
      setLastWaUrl(waUrl);
      setIsSent(true);
      showToast('Your enquiry has been saved. You may also open WhatsApp to chat directly.', 'success');
    } catch (err) {
      setSubmitError(err?.message || 'Unable to submit your enquiry right now. Your message has been kept—please retry or contact us via WhatsApp.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const faqs = [
    {
      q: 'Do all RODHE sarees come with an included blouse piece?',
      a: 'Yes, every RODHE saree includes an unstitched 80cm to 85cm matching or curated contrast fabric piece featuring woven borders or block print accents.'
    },
    {
      q: 'How should I wash and care for natural botanical dyes?',
      a: 'We recommend professional dry cleaning for the very first wash to set the organic botanical pigments and fine zari. Thereafter, gentle hand wash in cold water with mild pH-neutral detergent is ideal.'
    },
    {
      q: 'What is your shipping timeline across India?',
      a: 'Orders are dispatched within 24 to 48 hours via premium express insured air courier. Transit takes 2 to 4 business days for major Indian metros and 3 to 6 days for other regions.'
    },
    {
      q: 'What is your exchange and return policy?',
      a: 'We offer a 7-day hassle-free return or exchange policy from the date of delivery. If the drape is unworn and retains its tags and original keepsake packaging, we arrange a doorstep pickup.'
    }
  ];

  return (
    <div style={{ backgroundColor: '#FAF6EE', minHeight: '100vh', paddingBottom: '6rem' }}>
      {/* Header Banner */}
      <div
        style={{
          backgroundColor: '#F4ECE1',
          padding: 'clamp(3rem, 6vw, 5rem) 0 3rem',
          borderBottom: '1px solid rgba(184, 141, 74, 0.2)',
          textAlign: 'center'
        }}
      >
        <div className="container">
          <div className="eyebrow">Customer Care & Concierge</div>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(2.4rem, 4.5vw, 4rem)',
              color: '#4B3024',
              marginBottom: '0.85rem'
            }}
          >
            At Your Service
          </h1>
          <p style={{ fontSize: '1rem', color: '#6F4E3E', maxWidth: '600px', margin: '0 auto' }}>
            Whether you need saree styling assistance, custom bridal orders, or order tracking, our concierge team is here for you.
          </p>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 'clamp(2rem, 4vw, 3.5rem)' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
            gap: 'clamp(2rem, 4vw, 4.5rem)',
            marginBottom: 'clamp(3.5rem, 5vw, 5rem)'
          }}
        >
          {/* Left: Contact Info & Touchpoints */}
          <div style={{ minWidth: 0 }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.75rem, 3.5vw, 2rem)', color: '#4B3024', marginBottom: '1.25rem' }}>
              Connect with Our Stylists
            </h2>
            <p style={{ fontSize: '0.94rem', color: '#6F4E3E', lineHeight: 1.7, marginBottom: '2rem' }}>
              Have questions about saree drape weight, blouse tailoring pairing, or wedding trousseau curation? Our personal stylists are available via phone, email, or WhatsApp.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '42px', height: '42px', backgroundColor: '#F4ECE1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B88D4A', flexShrink: 0 }}>
                  <Mail size={20} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.74rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8F7263', fontWeight: 600 }}>Email</div>
                  <a href={`mailto:${contactEmail}`} style={{ fontSize: '0.95rem', fontWeight: 600, color: '#4B3024', wordBreak: 'break-word' }}>
                    {contactEmail}
                  </a>
                </div>
              </div>

              <a
                href={`https://wa.me/${waNumber}?text=${encodeURIComponent('Namaste RODHE Concierge, I would love personal styling assistance for a handcrafted cotton saree.')}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none' }}
              >
                <div style={{ width: '42px', height: '42px', backgroundColor: '#F4ECE1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B88D4A', flexShrink: 0 }}>
                  <Phone size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.74rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8F7263', fontWeight: 600 }}>WhatsApp Concierge</div>
                  <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#4B3024' }}>
                    +91 {waNumber.replace(/^91/, '')}
                  </span>
                </div>
              </a>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '42px', height: '42px', backgroundColor: '#F4ECE1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B88D4A', flexShrink: 0 }}>
                  <Clock size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.74rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8F7263', fontWeight: 600 }}>Concierge Hours</div>
                  <span style={{ fontSize: '0.92rem', color: '#4B3024' }}>
                    Monday – Saturday, 10:00 AM – 7:00 PM IST
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '42px', height: '42px', backgroundColor: '#F4ECE1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B88D4A', flexShrink: 0 }}>
                  <MapPin size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.74rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8F7263', fontWeight: 600 }}>Atelier & Correspondence</div>
                  <span style={{ fontSize: '0.88rem', color: '#6F4E3E' }}>
                    Direct Online Boutique &amp; Concierge (India) • Dispatch studio address shared on order confirmation
                  </span>
                </div>
              </div>
            </div>

            {/* Packaging Hallmark */}
            <div style={{ padding: '1.25rem', backgroundColor: '#FFFDF9', border: '1px solid rgba(184, 141, 74, 0.2)' }}>
              <div style={{ fontSize: '0.74rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#B88D4A', fontWeight: 700, marginBottom: '0.4rem' }}>
                RODHE Quality Promise
              </div>
              <p style={{ fontSize: '0.84rem', color: '#6F4E3E', lineHeight: 1.5, margin: 0 }}>
                Every inquiry is addressed personally by our textile curators in India. No automated chat bots.
              </p>
            </div>
          </div>

          {/* Right: Message Form */}
          <div
            style={{
              backgroundColor: '#FFFDF9',
              padding: 'clamp(1.5rem, 4vw, 2.5rem) clamp(1rem, 3vw, 2rem)',
              border: '1px solid rgba(75, 48, 36, 0.12)',
              boxShadow: '0 12px 35px rgba(75, 48, 36, 0.05)',
              minWidth: 0
            }}
          >
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', color: '#4B3024', marginBottom: '1.25rem' }}>
              Send an Inquiry
            </h3>

            {isSent ? (
              <div style={{ textAlign: 'center', padding: '2.25rem 1rem' }}>
                <CheckCircle2 size={44} color="#525B3A" style={{ margin: '0 auto 1rem' }} />
                <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', color: '#4B3024', marginBottom: '0.5rem' }}>
                  Enquiry Saved
                </h4>
                <p style={{ fontSize: '0.88rem', color: '#6F4E3E', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                  Thank you, <strong>{formData.name}</strong>. Your message has been logged for our team. For a faster reply, open WhatsApp directly below with your prepared message.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxWidth: '320px', margin: '0 auto' }}>
                  <a
                    href={lastWaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                    style={{ width: '100%', minHeight: '46px' }}
                  >
                    <MessageCircle size={16} />
                    <span>Open WhatsApp Concierge</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(lastWaText).then(() => showToast('Enquiry message copied!', 'success')).catch(() => {});
                    }}
                    className="btn btn-outline btn-sm"
                    style={{ width: '100%', minHeight: '40px' }}
                  >
                    <Copy size={14} />
                    <span>Copy Message Text</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSent(false);
                      setFormData({ name: '', email: '', phone: '', subject: 'Styling & Saree Selection', message: '' });
                    }}
                    style={{ fontSize: '0.78rem', color: '#8F7263', textDecoration: 'underline', marginTop: '0.35rem', padding: '0.25rem' }}
                  >
                    Send Another Inquiry
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                {submitError && (
                  <div
                    role="alert"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 0.9rem',
                      backgroundColor: 'rgba(201, 130, 120, 0.14)',
                      border: '1px solid #C98278',
                      color: '#8A2A20',
                      fontSize: '0.82rem',
                      marginBottom: '1rem'
                    }}
                  >
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                    <span>{submitError}</span>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label" htmlFor="contact-name">Full Name *</label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    autoComplete="name"
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: '' });
                    }}
                    placeholder="e.g. Parvathi Sharma"
                  />
                  {fieldErrors.name && <span style={{ display: 'block', fontSize: '0.75rem', color: '#8A2A20', marginTop: '0.3rem' }}>{fieldErrors.name}</span>}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '0.85rem' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="contact-email">Email *</label>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      autoComplete="email"
                      className="form-input"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' });
                      }}
                      placeholder="patron@example.com"
                    />
                    {fieldErrors.email && <span style={{ display: 'block', fontSize: '0.75rem', color: '#8A2A20', marginTop: '0.3rem' }}>{fieldErrors.email}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="contact-phone">WhatsApp Mobile (Optional)</label>
                    <input
                      id="contact-phone"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      className="form-input"
                      value={formData.phone}
                      onChange={(e) => {
                        setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) });
                        if (fieldErrors.phone) setFieldErrors({ ...fieldErrors, phone: '' });
                      }}
                      placeholder="10-digit mobile number"
                    />
                    {fieldErrors.phone && <span style={{ display: 'block', fontSize: '0.75rem', color: '#8A2A20', marginTop: '0.3rem' }}>{fieldErrors.phone}</span>}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="contact-subject">Inquiry Subject</label>
                  <select
                    id="contact-subject"
                    className="form-input"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    style={{ backgroundColor: '#FFFFFF' }}
                  >
                    <option value="Styling & Saree Selection">Styling & Saree Selection</option>
                    <option value="Bridal & Bulk Trousseau">Bridal & Bulk Trousseau</option>
                    <option value="Order Tracking & Dispatch">Order Tracking & Dispatch</option>
                    <option value="Blouse Tailoring Guidance">Blouse Tailoring Guidance</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="contact-message">Message *</label>
                  <textarea
                    id="contact-message"
                    required
                    rows={4}
                    className="form-input"
                    value={formData.message}
                    onChange={(e) => {
                      setFormData({ ...formData, message: e.target.value });
                      if (fieldErrors.message) setFieldErrors({ ...fieldErrors, message: '' });
                    }}
                    placeholder="Tell us what you are looking for..."
                  />
                  {fieldErrors.message && <span style={{ display: 'block', fontSize: '0.75rem', color: '#8A2A20', marginTop: '0.3rem' }}>{fieldErrors.message}</span>}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '0.95rem', minHeight: '48px', opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? 'wait' : 'pointer' }}
                >
                  <span>{isSubmitting ? 'Saving Enquiry...' : 'Save & Prepare WhatsApp Message'}</span>
                  <Send size={15} />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* FAQs Accordion */}
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div className="section-header" style={{ marginBottom: '2.5rem' }}>
            <div className="eyebrow">Assistance & Answers</div>
            <h2 className="section-title" style={{ fontSize: '2.4rem' }}>
              Frequently Asked Questions
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {faqs.map((faq, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: '#FFFDF9',
                  border: '1px solid rgba(75, 48, 36, 0.1)',
                  overflow: 'hidden'
                }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? -1 : index)}
                  style={{
                    width: '100%',
                    padding: '1.25rem 1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    textAlign: 'left',
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: '#4B3024',
                    fontFamily: 'var(--font-serif)'
                  }}
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    size={16}
                    color="#B88D4A"
                    style={{
                      transform: openFaq === index ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.25s ease'
                    }}
                  />
                </button>
                {openFaq === index && (
                  <div
                    style={{
                      padding: '0 1.5rem 1.25rem',
                      fontSize: '0.9rem',
                      color: '#6F4E3E',
                      lineHeight: 1.6
                    }}
                  >
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
