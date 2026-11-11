import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  RefreshCw, 
  FileText, 
  Sparkles, 
  Lock
} from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const LegalPolicyPage = ({ initialTab = 'shipping' }) => {
  const { navigateTo, storeSettings } = useShop();

  const normalizeTab = (val) => {
    const raw = String(val || '').toLowerCase();
    if (raw.includes('privacy')) return 'privacy';
    if (raw.includes('terms')) return 'terms';
    if (raw.includes('returns') || raw.includes('exchange')) return 'returns';
    if (raw.includes('care')) return 'care';
    if (raw.includes('shipping')) return 'shipping';
    return 'shipping';
  };

  const [activeTab, setActiveTab] = useState(() => normalizeTab(initialTab));

  // Sync tab with route prop or hash updates
  useEffect(() => {
    setActiveTab(normalizeTab(initialTab));
  }, [initialTab]);

  useEffect(() => {
    try {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes('privacy')) setActiveTab('privacy');
      else if (hash.includes('terms')) setActiveTab('terms');
      else if (hash.includes('returns') || hash.includes('exchange')) setActiveTab('returns');
      else if (hash.includes('care')) setActiveTab('care');
      else if (hash.includes('shipping')) setActiveTab('shipping');
    } catch {}
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
                  Order Handling & Courier Partners
                </h3>
                <p>
                  Shipping rates follow active storefront thresholds (currently complimentary in India for bags of ₹{(storeSettings?.freeShippingThreshold ?? 2999).toLocaleString('en-IN')} and above, or ₹{storeSettings?.standardShippingFee ?? 199} below threshold). Final courier dispatch method and Airway Bill (AWB) tracking details are shared directly by our atelier team on WhatsApp (+91 94906 58858) or email (rodhesaree@gmail.com) once your order is confirmed.
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
                  To initiate an exchange or return, simply message our Concierge team on WhatsApp at <strong>+91 94906 58858</strong> or email <strong>rodhesaree@gmail.com</strong> with your Order Number. We will arrange a reverse pickup courier from your delivery address at no extra cost.
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
                  Privacy Policy & Browser Data Notice
                </h2>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem', fontSize: '0.92rem' }}>
                <p>
                  RODHE (“we”, “us”) respects your privacy. This policy explains truthfully what personal details our storefront collects, where they are stored, and how WhatsApp and optional analytics work on <strong>www.rodhe.in</strong>.
                </p>

                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', marginTop: '0.5rem', color: '#4B3024' }}>
                  1. Information You Provide & Why We Collect It
                </h3>
                <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <li><strong>Order Enquiries & Contact Forms:</strong> Full name, 10-digit WhatsApp mobile number, optional email address, and delivery address details (house/flat number, street, city, state, PIN code, landmark) entered so our concierge team can confirm stock, answer questions, and quote delivery.</li>
                  <li><strong>Customer Accounts (Optional Sign-In):</strong> If you register or sign in, your account email, contact details, and saved delivery addresses are authenticated and stored per user via Supabase Auth & database services.</li>
                  <li><strong>Payment Details Disclaimer:</strong> RODHE does <em>not</em> run an automated online payment gateway or collect card numbers, CVVs, or UPI PINs inside this website. Payment arrangements (such as direct UPI or bank transfer) happen strictly during WhatsApp confirmation.</li>
                </ul>

                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', marginTop: '0.5rem', color: '#4B3024' }}>
                  2. Local Browser Persistence & Cookies
                </h3>
                <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <li><strong>Essential Storage:</strong> Shopping bag items (<code>rodhe_cart</code>), favourites (<code>rodhe_wishlist</code>), consent preference (<code>rodhe_cookie_consent</code>), and signed-in auth tokens are kept in browser storage so your bag survives page reloads.</li>
                  <li><strong>Guest Privacy Isolation:</strong> Unauthenticated guest delivery details during checkout are held only in temporary tab storage (<code>sessionStorage</code>) and are never shared across accounts or stored as a persistent guest profile.</li>
                  <li><strong>Optional Analytics:</strong> Google Analytics 4 is loaded only when configured with a Measurement ID and explicitly enabled by you in Cookie Preferences. You may change or withdraw analytics consent anytime from the Footer link.</li>
                </ul>

                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', marginTop: '0.5rem', color: '#4B3024' }}>
                  3. Third-Party Services & WhatsApp Handover
                </h3>
                <p>
                  Product catalog, account authentication, and enquiry records are hosted via <strong>Supabase</strong>. When you choose to proceed to WhatsApp, the summary you review is prefilled into a WhatsApp message directed to <strong>+91 94906 58858</strong>, governed by WhatsApp’s terms once you send the chat. We never sell or rent your details to third-party advertisers.
                </p>

                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', marginTop: '0.5rem', color: '#4B3024' }}>
                  4. Retention, Access & Deletion Requests
                </h3>
                <p>
                  We retain customer enquiry and saved account data only for as long as needed to support concierge service or until you request removal. To request access, correction, or deletion of your personal data, email{' '}
                  <a href="mailto:rodhesaree@gmail.com" style={{ color: '#4B3024', textDecoration: 'underline', fontWeight: 600 }}>rodhesaree@gmail.com</a>{' '}
                  or message WhatsApp <strong>+91 94906 58858</strong>. Legal entity registration & physical studio correspondence address details will be published upon final business registration update.
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem', fontSize: '0.92rem' }}>
                <p>
                  By browsing <strong>www.rodhe.in</strong> or submitting an order enquiry through our storefront, you agree to these terms governing handcrafted saree availability, pricing, and concierge ordering.
                </p>

                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', marginTop: '0.5rem', color: '#4B3024' }}>
                  1. WhatsApp Enquiry & Order Confirmation
                </h3>
                <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <li>Submitting your bag opens a prepared order enquiry to our official WhatsApp concierge (<strong>+91 94906 58858</strong>). Simply opening or generating a WhatsApp message does <em>not</em> represent a paid or confirmed order.</li>
                  <li>Our team verifies live weave inventory and delivery serviceability for your PIN code first, then shares direct payment instructions (UPI / Bank Transfer). Orders are confirmed only after concierge confirmation and verified payment receipt.</li>
                  <li>Your shopping bag remains intact when WhatsApp opens so you can review or edit your selection without losing items.</li>
                </ul>

                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', marginTop: '0.5rem', color: '#4B3024' }}>
                  2. Handcrafted Sarees, Pricing & Availability
                </h3>
                <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <li>All displayed prices are in Indian Rupees (INR). Shipping thresholds configured on the storefront apply based on bag subtotal before checkout confirmation.</li>
                  <li>Handblock prints, natural mud-resist Dabu textures, and fermented indigo or madder hues carry slight organic variations across dye lots and screen displays; these reflect human craft rather than manufacturing defects.</li>
                  <li>Availability is subject to real-time batch stock. If an edition sells out between browsing and WhatsApp confirmation, our team will offer comparable weaves or issue an immediate refund if any direct transfer had already occurred.</li>
                </ul>

                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', marginTop: '0.5rem', color: '#4B3024' }}>
                  3. Cancellations, Exchanges & Contact
                </h3>
                <p>
                  Exchanges, returns, and cancellations are coordinated directly via <strong>rodhesaree@gmail.com</strong> or WhatsApp <strong>+91 94906 58858</strong> prior to dispatch or under our published exchange guidelines above.
                </p>

                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', marginTop: '0.5rem', color: '#4B3024' }}>
                  4. Intellectual Property
                </h3>
                <p>
                  The RODHE name, monogram emblems, product descriptions, photography, and craft narratives on this website belong exclusively to RODHE and may not be copied or redistributed for commercial use without written consent.
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

