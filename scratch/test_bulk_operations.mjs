import assert from 'assert';
import { storeService } from '../src/services/storeService.js';

async function testBulkOperations() {
  console.log('--- Testing RODHE Saree Bulk Operations ---');

  // 1. Check initial product list
  const initial = await storeService.getProducts();
  console.log(`1. Initial product count: ${initial.length}`);
  assert(initial.length > 0, 'Catalog should not be empty');

  // 2. Select 3 products for bulk deletion test
  const testIds = [initial[0].id, initial[1].id, initial[2].id];
  console.log(`2. Selecting 3 products for bulk deletion:`, testIds);

  // 3. Perform bulk deletion
  await storeService.deleteProductsBulk(testIds);
  const afterDelete = await storeService.getProducts();
  console.log(`3. Product count after bulk delete: ${afterDelete.length}`);
  assert.strictEqual(afterDelete.length, initial.length - 3, 'Count should decrease by 3');

  // Verify none of the deleted IDs exist in the active catalog
  for (const id of testIds) {
    const found = afterDelete.find(p => p.id === id);
    assert(!found, `Deleted product ${id} must not be present`);
  }
  console.log('   ✅ PASS: Bulk deletion correctly removed all 3 sarees.');

  // 4. Test bulk archive
  const nextThree = [afterDelete[0].id, afterDelete[1].id];
  console.log(`4. Selecting 2 products for bulk archive:`, nextThree);
  await storeService.archiveProductsBulk(nextThree);
  
  const allProducts = await storeService.getProducts();
  const archivedCount = allProducts.filter(p => p.status === 'archived').length;
  console.log(`   Archived sarees count: ${archivedCount}`);
  assert(archivedCount >= 2, 'Should have at least 2 archived sarees');
  console.log('   ✅ PASS: Bulk archive successfully updated selected sarees.');

  console.log('============================================');
  console.log('🎉 ALL BULK SELECTION & DELETE TESTS PASSED!');
  console.log('============================================');
}

testBulkOperations().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
