import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Truck, 
  RefreshCw, 
  FileText, 
  Sparkles, 
  Lock, 
  HeartHandshake, 
  HelpCircle,
  ArrowRight
} from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const LegalPolicyPage = ({ initialTab = 'shipping' }) => {
  const { navigateTo } = useShop();
  const [activeTab, setActiveTab] = useState(initialTab);

  // Sync tab from hash if present, e.g. #policies-privacy
  useEffect(() => {
    try {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes('privacy')) setActiveTab('privacy');
      else if (hash.includes('terms')) setActiveTab('terms');
      else if (hash.includes('shipping')) setActiveTab('shipping');
      else if (hash.includes('returns') || hash.includes('exchange')) setActiveTab('returns');
      else if (hash.includes('care')) setActiveTab('care');
    } catch (e) {}
  }, []);

  const tabs = [
    { id: 'shipping', label: 'Shipping & Delivery', icon: Truck },
    { id: 'returns', label: '7-Day Exchange & Returns', icon: RefreshCw },
    { id: 'privacy', label: 'Privacy Policy (DPDP)', icon: Lock },
    { id: 'terms', label: 'Terms of Service', icon: FileText },
    { id: 'care', label: 'Botanical Wash & Care', icon: Sparkles }
  ];

  return (
    <div style={{ backgroundColor: '#FAF6EE', minHeight: '100vh', paddingBottom: '6rem' }}>
      {/* Editorial Header */}
      <div
        style={{
          padding: 'clamp(3.5rem, 6vw, 5.5rem) 0 3.5rem',
          backgroundColor: '#F4ECE1',
          borderBottom: '1px solid rgba(184, 141, 74, 0.25)',
          textAlign: 'center'
        }}
      >
        <div className="container" style={{ maxWidth: '860px' }}>
          <div className="eyebrow" style={{ color: '#B88D4A' }}>Patron Trust & Policies</div>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(2.4rem, 4.5vw, 4rem)',
              color: '#4B3024',
              lineHeight: 1.15,
              marginBottom: '1rem',
              fontWeight: 400
            }}
          >
            Honest Commerce. <br />
            <span style={{ fontStyle: 'italic', color: '#B88D4A' }}>
              Woven with Integrity.
            </span>
          </h1>
          <p
            style={{
              fontSize: '1rem',
              color: '#6F4E3E',
              lineHeight: 1.7,
              margin: '0 auto',
              maxWidth: '620px'
            }}
          >
            Clear, transparent policies crafted to protect our patrons and honor the generational hands behind every handloom drape.
          </p>
        </div>
      </div>

      {/* Main Container */}
      <div className="container" style={{ paddingTop: '3rem', maxWidth: '1080px' }}>
        {/* Policy Tab Navigation Pills */}
        <div
          style={{
            display: 'flex',
            gap: '0.65rem',
            overflowX: 'auto',
            paddingBottom: '0.75rem',
            marginBottom: '2.5rem',
            scrollbarWidth: 'none'
          }}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.25rem',
                  backgroundColor: isActive ? '#4B3024' : '#FFFDF9',
                  color: isActive ? '#FAF6EE' : '#6F4E3E',
                  border: isActive ? '1px solid #4B3024' : '1px solid rgba(75, 48, 36, 0.15)',
                  borderRadius: '30px',
                  fontSize: '0.86rem',
                  fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease',
                  boxShadow: isActive ? '0 4px 15px rgba(75, 48, 36, 0.15)' : 'none'
                }}
              >
                <Icon size={16} color={isActive ? '#EADAB5' : '#B88D4A'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Card */}
        <div
          style={{
            backgroundColor: '#FFFDF9',
            border: '1px solid rgba(75, 48, 36, 0.12)',
            borderRadius: '4px',
            padding: 'clamp(2rem, 5vw, 3.5rem)',
            boxShadow: '0 8px 30px rgba(75, 48, 36, 0.04)',
            color: '#4B3024',
            lineHeight: 1.8
          }}
        >
          {/* TAB 1: SHIPPING & DELIVERY */}
          {activeTab === 'shipping' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
                <Truck size={24} color="#B88D4A" />
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', margin: 0, color: '#4B3024' }}>
                  Shipping & Insured Delivery Policy
                </h2>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', fontSize: '0.92rem' }}>
                <p>
                  Every RODHE saree is individually inspected, gently scented with botanical vetiver paper, and hand-wrapped within our signature rigid keepsake packaging. We partner with premier Indian courier networks to guarantee secure, insured transit to your doorstep.
                </p>

                <div style={{ backgroundColor: '#FAF6EE', padding: '1.25rem', borderRadius: '4px', borderLeft: '4px solid #B88D4A' }}>
                  <h4 style={{ margin: '0 0 0.5rem', fontSize: '1rem', color: '#4B3024', fontWeight: 700 }}>
                    Complimentary Express Shipping Across India
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.88rem', color: '#6F4E3E' }}>
                    Orders of ₹2,999 and above qualify for 100% complimentary insured express air shipping anywhere in India. For orders under ₹2,999, a nominal flat courier fee of ₹199 is applied at checkout.
                  </p>
                </div>

                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', marginTop: '1rem', color: '#4B3024' }}>
                  Dispatch & Delivery Timelines
                </h3>
                <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <li><strong>Order Processing:</strong> Orders are dispatched from our central textile atelier within 24 to 48 hours of confirmation (excluding Sundays and national holidays).</li>
                  <li><strong>Metro Cities (Bengaluru, Mumbai, Delhi-NCR, Kolkata, Chennai, Hyderabad):</strong> 2 to 4 business days post-dispatch.</li>
                  <li><strong>Tier-2 & Tier-3 Cities:</strong> 4 to 6 business days post-dispatch.</li>
                  <li><strong>Remote / Northeast / Island Regions:</strong> 6 to 9 business days via India Post Speed Post or Air Logistics.</li>
                </ul>

                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', marginTop: '1rem', color: '#4B3024' }}>
                  Live Tracking & Insured Transit
                </h3>
                <p>
                  Upon handover to our logistics partner (Blue Dart, Delhivery, DTDC, or India Post), you will receive a confirmation message and Airway Bill (AWB) tracking link on both your registered WhatsApp number and email address. All shipments are fully insured against loss or transit damage.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: 7-DAY EXCHANGE & RETURNS */}
          {activeTab === 'returns' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
                <RefreshCw size={24} color="#B88D4A" />
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', margin: 0, color: '#4B3024' }}>
                  7-Day Easy Exchange & Return Policy
                </h2>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', fontSize: '0.92rem' }}>
                <p>
                  We want you to feel complete reverence and delight when draping RODHE. If a saree does not match your expectations or skin tone, you may request an exchange or return within <strong>7 calendar days</strong> from the recorded delivery date.
                </p>

                <div style={{ backgroundColor: '#FAF6EE', padding: '1.25rem', borderRadius: '4px', borderLeft: '4px solid #525B3A' }}>
                  <h4 style={{ margin: '0 0 0.5rem', fontSize: '1rem', color: '#4B3024', fontWeight: 700 }}>
                    Our Handloom Promise
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.88rem', color: '#6F4E3E' }}>
                    Authentic handblock printing and natural mud-resist dyes exhibit gentle variations in alignment and organic brushstrokes. These are not flaws — they are the authentic hallmarks of human handcraft. However, if a textile is materially defective, we offer immediate replacement or a 100% full refund.
                  </p>
                </div>

                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', marginTop: '1rem', color: '#4B3024' }}>
                  Eligibility Conditions
                </h3>
                <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <li>The saree must be unworn, unwashed, unaltered, and without pleat creases or fragrance from wear.</li>
                  <li>Original brand hallmark tags, fabric labels, and unstitched blouse fabric must remain intact and uncut.</li>
                  <li>Must be returned in the original RODHE heritage box with protective butter paper.</li>
                </ul>

                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', marginTop: '1rem', color: '#4B3024' }}>
                  Hassle-Free Doorstep Pickup
                </h3>
                <p>
                  To initiate an exchange or return, simply message our Concierge team on WhatsApp at <strong>+91 94906 58858</strong> or email <strong>concierge@rodhe.in</strong> with your Order Number. We will arrange a reverse pickup courier from your delivery address at no extra cost.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: PRIVACY POLICY */}
          {activeTab === 'privacy' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
                <Lock size={24} color="#B88D4A" />
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', margin: 0, color: '#4B3024' }}>
                  Privacy Policy & Data Protection (DPDP Act, 2023)
                </h2>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', fontSize: '0.92rem' }}>
                <p>
                  RODHE respects your personal privacy. This policy outlines how your information is handled in accordance with the Information Technology Act, 2000 and the Digital Personal Data Protection (DPDP) Act, 2023.
                </p>

                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', marginTop: '1rem', color: '#4B3024' }}>
                  Information We Collect
                </h3>
                <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <li><strong>Order Information:</strong> Full name, shipping address, 10-digit Indian mobile number, and email address used strictly to deliver your sarees and provide dispatch notifications.</li>
                  <li><strong>Payment Security:</strong> RODHE does not store credit card numbers, debit card PINs, or UPI MPINs. All transactions are tokenized through RBI-authorized payment aggregators.</li>
                  <li><strong>Zero Data Selling:</strong> We never sell, rent, or trade your personal details with third-party telemarketers or external advertising networks.</li>
                </ul>

                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', marginTop: '1rem', color: '#4B3024' }}>
                  Your Rights Under Indian Law
                </h3>
                <p>
                  You may request a copy of your personal data or request deletion of your subscriber profile at any time by contacting <strong>concierge@rodhe.in</strong>.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: TERMS OF SERVICE */}
          {activeTab === 'terms' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
                <FileText size={24} color="#B88D4A" />
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', margin: 0, color: '#4B3024' }}>
                  Terms & Conditions of Service
                </h2>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', fontSize: '0.92rem' }}>
                <p>
                  By accessing the RODHE boutique storefront or placing an order, you agree to be bound by these Terms of Service.
                </p>

                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', marginTop: '1rem', color: '#4B3024' }}>
                  Handcrafted Products & Pricing
                </h3>
                <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <li>All prices displayed on the storefront are in Indian Rupees (INR) and are inclusive of applicable GST unless explicitly stated otherwise.</li>
                  <li>Because each saree is dyed with natural botanical extracts, subtle variations in hue between screens and the natural drape are natural and celebrated.</li>
                  <li>We reserve the right to cancel orders or adjust stock in the rare event of inventory overselling due to simultaneous artisan reservations. In such cases, full refunds are issued immediately.</li>
                </ul>

                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', marginTop: '1rem', color: '#4B3024' }}>
                  Intellectual Property
                </h3>
                <p>
                  The brand name RODHE, wordmark, logo emblems, botanical photography, and craft narratives are the exclusive intellectual property of RODHE. Unauthorized commercial reproduction is prohibited under Indian copyright law.
                </p>
              </div>
            </div>
          )}

          {/* TAB 5: BOTANICAL CARE GUIDE */}
          {activeTab === 'care' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
                <Sparkles size={24} color="#B88D4A" />
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', margin: 0, color: '#4B3024' }}>
                  Botanical Dye Wash & Heirloom Care Guide
                </h2>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', fontSize: '0.92rem' }}>
                <p>
                  Natural plant dyes (fermented indigo, madder root, pomegranate rinds, and harda) breathe and age gracefully. Proper care ensures your cotton saree retains its silky handfeel and rich earthy character for generations.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginTop: '0.75rem' }}>
                  <div style={{ backgroundColor: '#FAF6EE', padding: '1.25rem', borderRadius: '4px', border: '1px solid rgba(75, 48, 36, 0.1)' }}>
                    <h4 style={{ color: '#B88D4A', margin: '0 0 0.5rem', fontSize: '1rem' }}>First Wash Care</h4>
                    <p style={{ margin: 0, fontSize: '0.86rem', color: '#6F4E3E' }}>
                      Professional dry cleaning is recommended for the very first wash to set the natural plant mordants and fine zari borders permanently.
                    </p>
                  </div>

                  <div style={{ backgroundColor: '#FAF6EE', padding: '1.25rem', borderRadius: '4px', border: '1px solid rgba(75, 48, 36, 0.1)' }}>
                    <h4 style={{ color: '#B88D4A', margin: '0 0 0.5rem', fontSize: '1rem' }}>Subsequent Hand Washing</h4>
                    <p style={{ margin: 0, fontSize: '0.86rem', color: '#6F4E3E' }}>
                      Wash separately in cold water using a mild pH-neutral eco liquid detergent or soapnuts (Reetha). Never soak or bleach.
                    </p>
                  </div>

                  <div style={{ backgroundColor: '#FAF6EE', padding: '1.25rem', borderRadius: '4px', border: '1px solid rgba(75, 48, 36, 0.1)' }}>
                    <h4 style={{ color: '#B88D4A', margin: '0 0 0.5rem', fontSize: '1rem' }}>Drying in Shade</h4>
                    <p style={{ margin: 0, fontSize: '0.86rem', color: '#6F4E3E' }}>
                      Line dry strictly inside out in the shade. Direct tropical midday sun can fade live botanical indigo leaves over time.
                    </p>
                  </div>

                  <div style={{ backgroundColor: '#FAF6EE', padding: '1.25rem', borderRadius: '4px', border: '1px solid rgba(75, 48, 36, 0.1)' }}>
                    <h4 style={{ color: '#B88D4A', margin: '0 0 0.5rem', fontSize: '1rem' }}>Ironing & Storing</h4>
                    <p style={{ margin: 0, fontSize: '0.86rem', color: '#6F4E3E' }}>
                      Iron on warm cotton setting while the fabric is slightly damp. Store in breathable cotton muslin covers with dried neem leaves.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Concierge Contact Prompt */}
          <div
            style={{
              marginTop: '3rem',
              paddingTop: '2rem',
              borderTop: '1px solid rgba(75, 48, 36, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem'
            }}
          >
            <div>
              <div style={{ fontWeight: 600, color: '#4B3024', fontSize: '0.92rem' }}>
                Have questions about your order or specific drape care?
              </div>
              <div style={{ fontSize: '0.82rem', color: '#8F7263' }}>
                Our artisan concierge is available Monday to Saturday, 10 AM to 7 PM IST.
              </div>
            </div>

            <button
              onClick={() => navigateTo('contact')}
              className="btn btn-primary"
              style={{ padding: '0.65rem 1.25rem', fontSize: '0.84rem' }}
            >
              Contact Concierge
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

