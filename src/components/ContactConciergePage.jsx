import React, { useState } from 'react';
import { Mail, Phone, MapPin, Clock, MessageSquare, Send, CheckCircle2, ChevronDown } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { storeService } from '../services/storeService';

export const ContactConciergePage = () => {
  const { showToast } = useShop();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'Styling & Saree Selection',
    message: ''
  });
  const [isSent, setIsSent] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSent(true);

    // Save inquiry to backend store
    try {
      await storeService.createEnquiry({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        subject: formData.subject,
        message: formData.message,
        source: 'contact_page'
      });
    } catch (err) {
      console.warn('Inquiry record error:', err);
    }

    // Prefill WhatsApp inquiry message to 9490658858
    const waText = encodeURIComponent(
      `Namaste RODHE Concierge,\n\nI am sending an inquiry from your website:\n` +
      `• Name: ${formData.name || 'Patron'}\n` +
      `• Email: ${formData.email || 'N/A'}\n` +
      `• Phone: ${formData.phone || 'N/A'}\n` +
      `• Subject: ${formData.subject}\n\n` +
      `Message:\n${formData.message || 'I would like styling guidance and details about your handcrafted cotton sarees.'}`
    );

    showToast('Directing your inquiry to WhatsApp (+91 94906 58858)...');
    window.open(`https://wa.me/919490658858?text=${waText}`, '_blank');
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
                  <a href="mailto:concierge@rodhe.in" style={{ fontSize: '0.95rem', fontWeight: 600, color: '#4B3024', wordBreak: 'break-word' }}>
                    concierge@rodhe.in
                  </a>
                </div>
              </div>

              <a
                href="https://wa.me/919490658858?text=Namaste%20RODHE%20Concierge%2C%20I%20would%20love%20personal%20styling%20assistance%20for%20a%20handcrafted%20cotton%20saree."
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
                    +91 94906 58858
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
              <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <CheckCircle2 size={44} color="#B88D4A" style={{ margin: '0 auto 1rem' }} />
                <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: '#4B3024', marginBottom: '0.5rem' }}>
                  Inquiry Dispatched
                </h4>
                <p style={{ fontSize: '0.88rem', color: '#8F7263', marginBottom: '1.5rem' }}>
                  Thank you for reaching out. A dedicated RODHE textile curator will contact you shortly.
                </p>
                <button onClick={() => setIsSent(false)} className="btn btn-outline btn-sm">
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    required
                    autoComplete="name"
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Parvathi Sharma"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '0.85rem' }}>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      className="form-input"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="patron@example.com"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      className="form-input"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91..."
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Inquiry Subject</label>
                  <select
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
                  <label className="form-label">Message</label>
                  <textarea
                    required
                    rows={4}
                    className="form-input"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Tell us what you are looking for..."
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '0.95rem', minHeight: '48px' }}
                >
                  <span>Dispatch Message</span>
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
