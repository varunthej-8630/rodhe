// Mock browser localStorage for Node.js test environment
const storage = new Map();
global.localStorage = {
  getItem: (key) => storage.get(key) || null,
  setItem: (key, val) => storage.set(key, String(val)),
  removeItem: (key) => storage.delete(key),
  clear: () => storage.clear()
};
global.window = {};

import { storeService } from '../src/services/storeService.js';

async function runTest() {
  console.log('--- Testing RODHE Inventory Persistence ---');

  // Step 1: Initial load
  const initial = await storeService.getProducts();
  console.log('1. Initial products count:', initial.length);
  if (initial.length !== 50) {
    throw new Error(`Expected 50 initial products, got ${initial.length}`);
  }

  // Step 2: Delete a product
  const targetId = 'nilambari-shibori-saree';
  console.log(`2. Deleting product: ${targetId}...`);
  await storeService.deleteProduct(targetId);

  const afterDelete = await storeService.getProducts();
  console.log('   Count after delete:', afterDelete.length);
  const foundAfterDelete = afterDelete.find(p => p.id === targetId || p.slug === targetId);
  if (foundAfterDelete) {
    throw new Error(`Product ${targetId} was not removed from list!`);
  }
  if (afterDelete.length !== 49) {
    throw new Error(`Expected 49 products after delete, got ${afterDelete.length}`);
  }
  console.log('   ✅ PASS: Product removed from list (50 -> 49)');

  // Step 3: Simulate Page Refresh (re-calling getProducts and re-initializing)
  console.log('3. Simulating page refresh (reload)...');
  // Re-read with empty cache/fresh call
  const afterRefresh = await storeService.getProducts();
  console.log('   Count after refresh:', afterRefresh.length);
  const resurrected = afterRefresh.find(p => p.id === targetId || p.slug === targetId);
  if (resurrected) {
    throw new Error(`❌ FAIL: Product ${targetId} resurrected on refresh!`);
  }
  if (afterRefresh.length !== 49) {
    throw new Error(`❌ FAIL: Expected count to remain 49 on refresh, but got ${afterRefresh.length}`);
  }
  console.log('   ✅ PASS: Deleted product did NOT come back on refresh! (Persisted at 49)');

  // Step 4: Add a new Saree
  console.log('4. Adding a new saree...');
  const newProduct = {
    name: 'Padmavati Pure Zari Kanchipuram Saree',
    slug: 'padmavati-pure-zari-saree',
    sku: 'RDH-999',
    price: 3200,
    originalPrice: 4500,
    craftCategory: 'handblock',
    fabricType: 'mulmul',
    colorFamily: 'gold',
    status: 'published',
    stockCount: 5,
    inStock: true,
    primaryImage: '/assets/products/saree_ivory_mulmul.jpg'
  };
  await storeService.saveProduct(newProduct);

  const afterAdd = await storeService.getProducts();
  console.log('   Count after add:', afterAdd.length);
  const foundNew = afterAdd.find(p => p.slug === 'padmavati-pure-zari-saree');
  if (!foundNew) {
    throw new Error('New product was not added!');
  }
  if (afterAdd.length !== 50) {
    throw new Error(`Expected 50 products after adding new one, got ${afterAdd.length}`);
  }
  console.log('   ✅ PASS: New saree added successfully (49 -> 50)');

  // Step 5: Simulate Page Refresh again
  console.log('5. Simulating page refresh after add...');
  const afterRefresh2 = await storeService.getProducts();
  console.log('   Count after second refresh:', afterRefresh2.length);
  const foundNewAfterRefresh = afterRefresh2.find(p => p.slug === 'padmavati-pure-zari-saree');
  if (!foundNewAfterRefresh) {
    throw new Error('❌ FAIL: Newly added product disappeared on refresh!');
  }
  if (afterRefresh2.length !== 50) {
    throw new Error(`❌ FAIL: Expected count to remain 50 on refresh, got ${afterRefresh2.length}`);
  }
  console.log('   ✅ PASS: Newly added saree stayed permanently after refresh!');

  // Step 6: Test Archive and Restore
  console.log('6. Testing Archive...');
  await storeService.archiveProduct('padmavati-pure-zari-saree');
  const allProducts = await storeService.getProducts();
  const archived = allProducts.find(p => p.slug === 'padmavati-pure-zari-saree');
  if (archived.status !== 'archived') {
    throw new Error(`Expected status 'archived', got ${archived.status}`);
  }
  console.log('   ✅ PASS: Saree successfully archived.');

  console.log('7. Testing Restore...');
  await storeService.restoreProduct('padmavati-pure-zari-saree', 'published');
  const allProductsRestored = await storeService.getProducts();
  const restored = allProductsRestored.find(p => p.slug === 'padmavati-pure-zari-saree');
  if (restored.status !== 'published') {
    throw new Error(`Expected status 'published', got ${restored.status}`);
  }
  console.log('   ✅ PASS: Saree successfully restored.');

  console.log('\n========================================');
  console.log('🎉 ALL INVENTORY LIFECYCLE TESTS PASSED!');
  console.log('========================================');
}

runTest().catch(err => {
  console.error('\n❌ TEST FAILED:', err.message);
  process.exit(1);
});

