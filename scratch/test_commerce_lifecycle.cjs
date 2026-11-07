// Set environment to local simulation for automated hermetic test run
process.env.VITE_SUPABASE_URL = '';
process.env.NEXT_PUBLIC_SUPABASE_URL = '';

async function runCommerceLifecycleTests() {
  const { storeService } = await import('../src/services/storeService.js');

  console.log('================================================================');
  console.log('RODHE Commerce Lifecycle & Order State Verification (Hermetic Mode)');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // 1. Test Seed Product Stock Availability
  console.log('--- Test Suite 1: Product Inventory Baseline ---');
  const products = await storeService.getProducts();
  assert(Array.isArray(products) && products.length >= 8, 'Products loaded and contains at least 8 slow-luxury sarees');
  const testProduct = products[0];
  console.log(`Target Saree: "${testProduct.name}" (SKU: ${testProduct.sku}), Initial Stock: ${testProduct.stockCount ?? testProduct.stock_count}`);

  // 2. Test COD Order Creation
  console.log('\n--- Test Suite 2: Cash on Delivery (COD) Lifecycle ---');
  const codOrderPayload = {
    customerName: 'Aarohi Patel',
    customerEmail: 'aarohi.patel@example.com',
    customerPhone: '9820011223',
    shippingAddress: {
      addressLine1: 'B-12, Green Acres, Juhu',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400049'
    },
    items: [
      {
        product: testProduct,
        quantity: 1
      }
    ],
    paymentMethod: 'cod'
  };

  const initialStock = testProduct.stockCount ?? testProduct.stock_count ?? 10;
  const createdCodOrder = await storeService.createOrder(codOrderPayload);
  assert(createdCodOrder.orderNumber && createdCodOrder.orderNumber.startsWith('RDH-'), 'COD order received deterministic order number');
  assert(createdCodOrder.paymentStatus === 'pending_cod', 'COD order marked with verifiable pending_cod status (not fake captured)');
  assert(createdCodOrder.fulfillmentStatus === 'unfulfilled', 'COD order marked unfulfilled ready for atelier inspection');

  // Verify stock was decremented
  const productsAfterCod = await storeService.getProducts();
  const prodAfterCod = productsAfterCod.find(p => p.sku === testProduct.sku);
  const stockAfterCod = prodAfterCod.stockCount ?? prodAfterCod.stock_count;
  assert(stockAfterCod === initialStock - 1, `Inventory decremented atomically from ${initialStock} to ${stockAfterCod}`);

  // 3. Test Electronic Payment with Pending Status
  console.log('\n--- Test Suite 3: Electronic Payment Simulation Lifecycle ---');
  const onlineOrderPayload = {
    customerName: 'Devika Sharma',
    customerEmail: 'devika.sharma@example.com',
    customerPhone: '9810055443',
    shippingAddress: {
      addressLine1: 'Villa 14, Magnolia Garden, DLF Phase 5',
      city: 'Gurugram',
      state: 'Haryana',
      pincode: '122002'
    },
    items: [
      {
        product: testProduct,
        quantity: 1
      }
    ],
    paymentMethod: 'upi',
    gatewayPaymentId: 'pay_sim_948201',
    gatewayOrderId: 'order_sim_881920'
  };

  const createdOnlineOrder = await storeService.createOrder(onlineOrderPayload);
  assert(createdOnlineOrder.paymentStatus === 'pending_payment', 'Electronic order initialized as pending_payment until gateway webhook/handler');

  // 4. Test Out-of-Stock Protection
  console.log('\n--- Test Suite 4: Out of Stock Rejection Guard ---');
  let rejected = false;
  try {
    await storeService.createOrder({
      customerName: 'Oversell Tester',
      customerEmail: 'tester@example.com',
      customerPhone: '9999999999',
      shippingAddress: { addressLine1: 'Test', city: 'Test', state: 'Test', pincode: '560001' },
      items: [
        {
          product: testProduct,
          quantity: 99999 // Excess quantity
        }
      ],
      paymentMethod: 'cod'
    });
  } catch (err) {
    rejected = true;
    assert(err.message.includes('Insufficient inventory'), `Oversell blocked with safety exception: "${err.message}"`);
  }
  assert(rejected, 'Out-of-stock excess quantity was strictly rejected');

  // 5. Test Guest Order Tracking & Lookup
  console.log('\n--- Test Suite 5: Guest Order Lookup RPC / Logic ---');
  const lookupByPhone = await storeService.lookupOrder(createdCodOrder.orderNumber, '9820011223');
  assert(lookupByPhone !== null, 'Order successfully located via Order Number + Phone match');
  assert((lookupByPhone.customerEmail || lookupByPhone.customer_email) === 'aarohi.patel@example.com', 'Located order matches patron profile');

  const lookupByEmail = await storeService.lookupOrder(createdCodOrder.orderNumber, 'Aarohi.Patel@example.com');
  assert(lookupByEmail !== null, 'Order successfully located via Order Number + Case-insensitive Email match');

  const invalidLookup = await storeService.lookupOrder(createdCodOrder.orderNumber, '9999999999');
  assert(invalidLookup === null, 'Lookup with mismatched contact credentials securely returns null (prevents order enumeration)');

  // 6. Test Cancellation & Inventory Restitution
  console.log('\n--- Test Suite 6: Order Cancellation & Inventory Restitution ---');
  const stockBeforeCancel = (await storeService.getProducts()).find(p => p.sku === testProduct.sku).stockCount;
  await storeService.cancelOrder(createdCodOrder.orderNumber, 'Customer changed drape preference');
  
  const updatedOrders = await storeService.getOrders();
  const cancelledOrder = updatedOrders.find(o => (o.orderNumber || o.order_number) === createdCodOrder.orderNumber);
  assert((cancelledOrder.fulfillmentStatus || cancelledOrder.fulfillment_status) === 'cancelled', 'Order status updated to cancelled');

  const stockAfterCancel = (await storeService.getProducts()).find(p => p.sku === testProduct.sku).stockCount;
  assert(stockAfterCancel === stockBeforeCancel + 1, `Cancelled saree successfully restored to inventory: ${stockBeforeCancel} -> ${stockAfterCancel}`);

  // Summary
  console.log('\n================================================================');
  console.log(`TOTAL COMMERCE TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runCommerceLifecycleTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
