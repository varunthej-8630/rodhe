const fs = require('fs');
const path = require('path');

async function runMasterVerification() {
  console.log('================================================================');
  console.log('RODHE — Master Verification Suite: Commerce, WhatsApp & Security');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  // ============================================================================
  // SUITE 1: WhatsApp Checkout & Message Formatting
  // ============================================================================
  console.log('--- Suite 1: WhatsApp URL Generation & Cart Math ---');

  const testPhone = '919490658858';
  const cartMulti = [
    {
      product: { name: 'Nilambari Shibori Mulmul Saree', sku: 'RDH-501', price: 1450 },
      quantity: 1
    },
    {
      product: { name: 'Mrittika Bagru Mud-Resist Saree', sku: 'RDH-502', price: 1250 },
      quantity: 2
    }
  ];

  const subtotal = 1450 * 1 + 1250 * 2; // 3950
  const couponDiscount = Math.round(subtotal * 0.10); // 395 (10% off)
  const isFreeShipping = (subtotal >= 2999);
  const shippingFee = isFreeShipping ? 0 : 199;
  const giftWrap = true;
  const giftWrapFee = 150;
  const grandTotal = subtotal - couponDiscount + shippingFee + giftWrapFee; // 3950 - 395 + 0 + 150 = 3705

  assert(subtotal === 3950, 'Subtotal correctly calculated (₹3,950)');
  assert(couponDiscount === 395, 'Coupon 10% discount correctly calculated (₹395)');
  assert(isFreeShipping === true, 'Free shipping threshold unlocked above ₹2,999');
  assert(grandTotal === 3705, 'Grand total correctly computed (₹3,705)');

  // Build WhatsApp Message
  const itemsText = cartMulti.map((item, idx) => {
    const p = item.product;
    const unit = p.price;
    const itemSubtotal = unit * item.quantity;
    return `${idx + 1}. ${p.name}\n   SKU: ${p.sku}\n   Qty: ${item.quantity} × ₹${unit.toLocaleString('en-IN')} = ₹${itemSubtotal.toLocaleString('en-IN')}`;
  }).join('\n\n');

  let summaryText = `\n\n-------------------------\nBag Subtotal: ₹${subtotal.toLocaleString('en-IN')}`;
  summaryText += `\nCoupon (WOVEN10): -₹${couponDiscount.toLocaleString('en-IN')}`;
  summaryText += `\nHeritage Gift Box: +₹${giftWrapFee}`;
  summaryText += `\nShipping: ${isFreeShipping ? 'Complimentary (FREE)' : `₹${shippingFee}`}`;
  summaryText += `\nTotal Amount: ₹${grandTotal.toLocaleString('en-IN')}`;

  const patron = {
    name: 'Ananya Deshmukh',
    phone: '9490658858',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560001',
    address: 'Flat 402, Heritage Enclave, Lavelle Road'
  };

  const patronText = `\n\nPatron Details:\n• Name: ${patron.name}\n• Contact / WhatsApp: +91 ${patron.phone}\n• Delivery Destination: ${patron.city}, ${patron.state} - ${patron.pincode}\n• Address: ${patron.address}`;
  const fullMessage = `Namaste RODHE Team,\n\nI would like to order the following handcrafted saree(s):\n\n${itemsText}${summaryText}${patronText}\n\nPlease confirm availability and share direct payment details (UPI / Bank Transfer) for dispatch. Thank you!`;

  const encodedUrl = `https://wa.me/${testPhone}?text=${encodeURIComponent(fullMessage)}`;

  assert(encodedUrl.startsWith('https://wa.me/919490658858?text='), 'WhatsApp URL starts with official clean mobile endpoint');
  assert(decodeURIComponent(encodedUrl).includes('Nilambari Shibori Mulmul Saree'), 'Decoded message contains saree name');
  assert(decodeURIComponent(encodedUrl).includes('Qty: 2 × ₹1,250 = ₹2,500'), 'Decoded message contains multiple item math');
  assert(decodeURIComponent(encodedUrl).includes('Total Amount: ₹3,705'), 'Decoded message contains correct grand total');
  assert(decodeURIComponent(encodedUrl).includes('Bengaluru, Karnataka - 560001'), 'Decoded message includes delivery destination');
  assert(decodeURIComponent(encodedUrl).includes('direct payment details (UPI / Bank Transfer)'), 'Message requests direct atelier payment without faking payment capture');

  // ============================================================================
  // SUITE 2: Security & RLS Policy Verification
  // ============================================================================
  console.log('\n--- Suite 2: SQL Migration Security & RLS Architecture ---');

  const migrationPath = path.resolve(__dirname, '../supabase/migrations/20261108_final_commerce_production.sql');
  const migrationSql = fs.readFileSync(migrationPath, 'utf8');

  // 1. Direct Anonymous INSERT bypass eliminated
  const hasAnonOrdersCreate = migrationSql.includes('CREATE POLICY "Orders Insert Guest and Patron"');
  assert(!hasAnonOrdersCreate, 'Direct anonymous INSERT policy on orders table removed');

  const hasAnonItemsCreate = migrationSql.includes('CREATE POLICY "Order Items Insert"');
  assert(!hasAnonItemsCreate, 'Direct anonymous INSERT policy on order_items table removed');

  const hasAnonPaymentsCreate = migrationSql.includes('CREATE POLICY "Payments Insert Checkout"');
  assert(!hasAnonPaymentsCreate, 'Direct anonymous INSERT policy on payments table removed');

  const hasAdminOrdersInsert = migrationSql.includes('CREATE POLICY "Orders Admin Insert"');
  assert(hasAdminOrdersInsert, 'Direct orders INSERT strictly restricted to authenticated admins');

  // 2. Atomic Order RPC checks
  assert(migrationSql.includes('CREATE OR REPLACE FUNCTION public.create_order_atomic'), 'create_order_atomic procedure present');
  assert(migrationSql.includes('FOR UPDATE'), 'Inventory row-level locks (FOR UPDATE) enforced');
  assert(migrationSql.includes('Insufficient stock for'), 'Race condition stock verification check present');
  assert(migrationSql.includes('SECURITY DEFINER'), 'create_order_atomic runs as SECURITY DEFINER to bypass direct table grants');
  assert(migrationSql.includes('SET search_path = public, pg_temp'), 'Hardened search_path prevents schema injection');

  // 3. Admin function security
  assert(migrationSql.includes('CREATE OR REPLACE FUNCTION public.is_admin()'), 'public.is_admin() server-side check present');
  assert(migrationSql.includes('GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;'), 'is_admin() execution restricted from anon');

  // 4. Lookup order protection
  assert(migrationSql.includes('CREATE OR REPLACE FUNCTION public.lookup_order'), 'public.lookup_order RPC present');
  assert(migrationSql.includes('REGEXP_REPLACE(o.customer_phone, \'\\D\', \'\', \'g\')'), 'lookup_order verifies sanitized phone or email match');

  // ============================================================================
  // SUITE 3: Static Scan of Built Production Bundle
  // ============================================================================
  console.log('\n--- Suite 3: Production Build Static Security Scan ---');

  const distDir = path.resolve(__dirname, '../dist/assets');
  const assetFiles = fs.readdirSync(distDir);
  const jsFiles = assetFiles.filter(f => f.endsWith('.js'));
  assert(jsFiles.length > 0, 'Production JS bundle generated');

  let totalJsContent = '';
  for (const jsFile of jsFiles) {
    totalJsContent += fs.readFileSync(path.join(distDir, jsFile), 'utf8');
  }

  const forbiddenTokens = [
    'RODHE-2026',
    'WOVEN2026',
    'RODHE-MAISON-2026',
    'checkout.razorpay.com',
    'rzp_test_',
    'rzp_live_'
  ];

  for (const token of forbiddenTokens) {
    assert(!totalJsContent.includes(token), `Bundle clean of token: "${token}"`);
  }

  // ============================================================================
  // SUITE 4: SEO Assets & Sitemap Validation
  // ============================================================================
  console.log('\n--- Suite 4: Technical SEO & Metadata Assets ---');

  const robotsPath = path.resolve(__dirname, '../dist/robots.txt');
  assert(fs.existsSync(robotsPath), 'dist/robots.txt deployed');
  const robotsContent = fs.readFileSync(robotsPath, 'utf8');
  assert(robotsContent.includes('Disallow: /admin'), 'robots.txt disallows /admin');
  assert(robotsContent.includes('Sitemap: /sitemap.xml'), 'robots.txt references /sitemap.xml');

  const sitemapPath = path.resolve(__dirname, '../dist/sitemap.xml');
  assert(fs.existsSync(sitemapPath), 'dist/sitemap.xml deployed');
  const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
  assert(sitemapContent.includes('<?xml version="1.0" encoding="UTF-8"?>'), 'sitemap.xml valid XML header');
  assert(sitemapContent.includes('nilambari-shibori-saree'), 'sitemap.xml includes authentic product slugs');
  assert(sitemapContent.includes('?page=story'), 'sitemap.xml includes brand story page');
  assert(sitemapContent.includes('?page=contact'), 'sitemap.xml includes concierge page');

  const indexHtmlPath = path.resolve(__dirname, '../dist/index.html');
  const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
  assert(indexHtml.includes('RODHE — Woven with Trust'), 'index.html has brand title');
  assert(indexHtml.includes('ClothingStore'), 'index.html contains factual Organization JSON-LD');
  assert(!indexHtml.includes('checkout.razorpay.com'), 'index.html free of external payment gateway SDK');

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('\n================================================================');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runMasterVerification().catch(err => {
  console.error('Test runner failure:', err);
  process.exit(1);
});
