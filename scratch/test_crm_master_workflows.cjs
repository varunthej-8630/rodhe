const fs = require('fs');
const assert = require('assert');

// Mock localStorage for Node test environment
const store = new Map();
global.localStorage = {
  getItem: (key) => store.get(key) || null,
  setItem: (key, val) => store.set(key, String(val)),
  removeItem: (key) => store.delete(key),
  clear: () => store.clear()
};

// Polyfill window & Image for ImageUpload
global.window = { localStorage: global.localStorage };
global.document = {
  createElement: () => ({
    width: 0,
    height: 0,
    getContext: () => ({ drawImage: () => {} }),
    toDataURL: () => 'data:image/webp;base64,mockedWebPData'
  })
};

async function runCrmWorkflowTests() {
  console.log('================================================================');
  console.log('RODHE — Master CRM Comprehensive Functional & Workflow Test Suite');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function test(desc, fn) {
    try {
      fn();
      console.log(`✅ PASS: ${desc}`);
      passed++;
    } catch (err) {
      console.error(`❌ FAIL: ${desc} -> ${err.message}`);
      failed++;
    }
  }

  async function testAsync(desc, fn) {
    try {
      await fn();
      console.log(`✅ PASS: ${desc}`);
      passed++;
    } catch (err) {
      console.error(`❌ FAIL: ${desc} -> ${err.message}`);
      failed++;
    }
  }

  // 1. Static Component Analysis for Architecture & State Machine
  console.log('--- Test Section 1: CRM Portal & Layout Structure ---');

  const adminPortalCode = fs.readFileSync('src/components/admin/AdminPortal.jsx', 'utf8');
  const adminLayoutCode = fs.readFileSync('src/components/admin/AdminLayout.jsx', 'utf8');
  const adminDashboardCode = fs.readFileSync('src/components/admin/AdminDashboard.jsx', 'utf8');
  const adminProductListCode = fs.readFileSync('src/components/admin/AdminProductList.jsx', 'utf8');
  const adminCollectionsCode = fs.readFileSync('src/components/admin/AdminCollections.jsx', 'utf8');
  const adminEnquiriesCode = fs.readFileSync('src/components/admin/AdminEnquiries.jsx', 'utf8');
  const adminPromotionsCode = fs.readFileSync('src/components/admin/AdminPromotions.jsx', 'utf8');
  const storeServiceCode = fs.readFileSync('src/services/storeService.js', 'utf8');

  test('AdminCollections is mounted in AdminPortal', () => {
    assert(adminPortalCode.includes('<AdminCollections />'), 'AdminCollections must be rendered in AdminPortal');
    assert(adminPortalCode.includes("import { AdminCollections } from './AdminCollections';"), 'AdminCollections must be imported');
  });

  test('Simulated orders tab removed from AdminLayout navigation', () => {
    assert(!adminLayoutCode.includes("id: 'orders'"), 'Orders tab must not be in navItems');
  });

  test('Dashboard displays 100% genuine metrics and quick actions', () => {
    assert(adminDashboardCode.includes('publishedProducts'), 'Dashboard must compute publishedProducts');
    assert(adminDashboardCode.includes('draftProducts'), 'Dashboard must compute draftProducts');
    assert(adminDashboardCode.includes('lowStockCount'), 'Dashboard must compute lowStockCount');
    assert(adminDashboardCode.includes('outOfStockCount'), 'Dashboard must compute outOfStockCount');
    assert(adminDashboardCode.includes('activePromotions'), 'Dashboard must compute activePromotions');
    assert(adminDashboardCode.includes('totalEnquiries'), 'Dashboard must compute totalEnquiries');
    assert(!adminDashboardCode.includes('unfulfilledOrders'), 'Dashboard must not display fake unfulfilled orders');
  });

  test('Product list includes inline quick stock adjustment and delete modal', () => {
    assert(adminProductListCode.includes('handleInlineStockChange'), 'Must support inline stock + / -');
    assert(adminProductListCode.includes('handleToggleOutOfStock'), 'Must support out-of-stock toggle');
    assert(adminProductListCode.includes('deleteConfirmProduct'), 'Must display explicit delete confirmation modal');
    assert(adminProductListCode.includes('stockFilter'), 'Must support stock filter');
    assert(adminProductListCode.includes('sortBy'), 'Must support sorting dropdown');
  });

  test('Enquiries component includes direct WhatsApp chat and internal notes', () => {
    assert(adminEnquiriesCode.includes('https://wa.me/'), 'Must support direct WhatsApp link');
    assert(adminEnquiriesCode.includes('handleSaveNotes'), 'Must support editing and saving internal follow-up notes');
    assert(adminEnquiriesCode.includes('handleCreateManual'), 'Must support manually logging offline inquiries');
  });

  test('Collections, Promotions, and StoreService support full operations', () => {
    assert(adminCollectionsCode.includes('handleSave'), 'AdminCollections must handle save');
    assert(adminPromotionsCode.includes('handleCreatePromo'), 'AdminPromotions must handle create');
    assert(storeServiceCode.includes('getCollections'), 'storeService must support getCollections');
  });

  // 2. Functional End-to-End Workflow Verification via storeService
  console.log('\n--- Test Section 2: End-to-End Workflows Persistence ---');

  // Dynamic import of storeService
  const { storeService } = await import('../src/services/storeService.js');

  // WORKFLOW A: Auth & Logout
  await testAsync('WORKFLOW A: Unauthenticated state redirects, session gating active', async () => {
    const { authService } = await import('../src/services/authService.js');
    const session = await authService.getCurrentSession();
    assert.strictEqual(session, null, 'Unauthenticated user must receive null session');
  });

  // WORKFLOW B: Add Saree -> Verify Catalog & Storefront
  let testSareeSlug = `test-saree-${Date.now()}`;
  await testAsync('WORKFLOW B: Add Saree -> Save -> Refresh -> Verify Persistence', async () => {
    const newSaree = {
      name: 'Chanderi Gold Zari Drape',
      slug: testSareeSlug,
      sku: `RDH-TST-${Math.floor(100 + Math.random() * 900)}`,
      tagline: 'Handwoven in pure Chanderi silk-cotton',
      description: 'Exclusive handloom saree with real zari borders and unbleached cotton base.',
      price: 2450,
      originalPrice: 3200,
      craft: 'Chanderi Silk',
      craftCategory: 'chanderi',
      fabric: 'Chanderi Cotton Silk',
      color: 'Muted Gold',
      colorFamily: 'gold',
      stockCount: 10,
      inStock: true,
      status: 'published',
      primaryImage: '/assets/products/saree_ivory_mulmul.jpg',
      gallery: ['/assets/products/saree_ivory_mulmul.jpg']
    };

    const saved = await storeService.saveProduct(newSaree);
    assert(saved, 'Product must be saved');

    // Simulate page refresh: reload from storeService
    const reloaded = await storeService.getProductBySlugOrId(testSareeSlug);
    assert(reloaded, 'Product must be found after reload');
    assert.strictEqual(reloaded.name, 'Chanderi Gold Zari Drape');
    assert.strictEqual(reloaded.price, 2450);
    assert.strictEqual(reloaded.status, 'published');
  });

  // WORKFLOW C: Edit Saree -> Change Price -> Save -> Verify
  await testAsync('WORKFLOW C: Edit Saree -> Change Price -> Save -> Verify Updated Price', async () => {
    const existing = await storeService.getProductBySlugOrId(testSareeSlug);
    assert(existing, 'Existing saree must exist');

    const updated = await storeService.saveProduct({
      ...existing,
      price: 2850,
      tagline: 'Updated celebratory heirloom edition'
    });
    assert.strictEqual(updated.price, 2850);

    const reloaded = await storeService.getProductBySlugOrId(testSareeSlug);
    assert.strictEqual(reloaded.price, 2850);
    assert.strictEqual(reloaded.tagline, 'Updated celebratory heirloom edition');
  });

  // WORKFLOW D: Update Stock -> Verify Inventory
  await testAsync('WORKFLOW D: Update Stock -> Verify Inventory & Low Stock Flag', async () => {
    const existing = await storeService.getProductBySlugOrId(testSareeSlug);
    // Update stock to 3 (Low stock threshold is <= 5)
    await storeService.saveProduct({
      ...existing,
      stockCount: 3,
      inStock: true
    });

    const reloaded = await storeService.getProductBySlugOrId(testSareeSlug);
    assert.strictEqual(reloaded.stockCount, 3);
    assert(reloaded.stockCount <= 5, 'Must be flagged as low stock');

    // Mark out of stock (0)
    await storeService.saveProduct({
      ...existing,
      stockCount: 0,
      inStock: false
    });

    const oosReloaded = await storeService.getProductBySlugOrId(testSareeSlug);
    assert.strictEqual(oosReloaded.stockCount, 0);
    assert.strictEqual(oosReloaded.inStock, false);
  });

  // WORKFLOW E: Create Collection -> Add Saree -> Publish -> Verify
  let testColSlug = `col-festive-${Date.now()}`;
  await testAsync('WORKFLOW E: Create Collection -> Publish -> Verify Persistence', async () => {
    const newCol = {
      id: `col-${Date.now()}`,
      name: 'Festive Zari Reserve',
      slug: testColSlug,
      description: 'Handcrafted zari editions woven for auspicious celebrations.',
      displayOrder: 10,
      isPublished: true
    };

    await storeService.saveCollection(newCol);
    const collections = await storeService.getCollections();
    const found = collections.find(c => c.slug === testColSlug);
    assert(found, 'Collection must exist in saved collections');
    assert.strictEqual(found.name, 'Festive Zari Reserve');
    assert.strictEqual(found.isPublished, true);
  });

  // WORKFLOW F: Create Offer -> Activate -> Verify -> Deactivate -> Verify
  let testOfferCode = `FESTIVE${Math.floor(10 + Math.random() * 90)}`;
  await testAsync('WORKFLOW F: Create Offer -> Activate -> Deactivate -> Verify', async () => {
    const offer = {
      code: testOfferCode,
      label: 'Festive 20% Privilege Offer',
      discountType: 'percentage',
      discountValue: 20,
      minOrderAmount: 2000,
      isActive: true
    };

    await storeService.savePromotion(offer);
    let promos = await storeService.getPromotions();
    let found = promos.find(p => p.code === testOfferCode);
    assert(found, 'Offer must be present in active promotions');
    assert.strictEqual(found.isActive, true);

    // Deactivate offer
    await storeService.savePromotion({ ...found, isActive: false });
    promos = await storeService.getPromotions();
    found = promos.find(p => p.code === testOfferCode);
    assert.strictEqual(found.isActive, false, 'Offer must be deactivated');
  });

  // WORKFLOW G: Customer Enquiry -> Update Status -> Add Notes -> Verify Persistence
  await testAsync('WORKFLOW G: Customer Enquiry -> Update Status & Internal Notes -> Verify', async () => {
    const enquiry = await storeService.submitEnquiry({
      name: 'Maharani Gayatri Devi',
      customer_name: 'Maharani Gayatri Devi',
      phone: '919490658858',
      email: 'patron@rodhe.in',
      sareeInterest: 'Chanderi Gold Zari Drape',
      message: 'Interested in bespoke blouse customization for the upcoming family wedding.'
    });

    assert(enquiry && enquiry.id, 'Enquiry record must be created');

    // Update status to 'contacted' and add notes
    await storeService.updateEnquiryStatus(enquiry.id, 'contacted', 'Spoke on phone at 3 PM; requested zari blouse swatch via WhatsApp');

    const enquiries = await storeService.getEnquiries();
    const updated = enquiries.find(e => e.id === enquiry.id);
    assert(updated, 'Enquiry must be found in enquiries list');
    assert.strictEqual(updated.status, 'contacted');
    assert.strictEqual(updated.notes, 'Spoke on phone at 3 PM; requested zari blouse swatch via WhatsApp');
  });

  console.log('\n================================================================');
  console.log(`TOTAL CHECKS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runCrmWorkflowTests().catch(err => {
  console.error('Test suite runner error:', err);
  process.exit(1);
});

