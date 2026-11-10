async function runCustomerServiceTests() {
  // Hermetic / simulated browser storage
  const localMap = new Map();
  const sessionMap = new Map();
  global.localStorage = {
    getItem: (k) => (localMap.has(k) ? localMap.get(k) : null),
    setItem: (k, v) => localMap.set(k, String(v)),
    removeItem: (k) => localMap.delete(k)
  };
  global.sessionStorage = {
    getItem: (k) => (sessionMap.has(k) ? sessionMap.get(k) : null),
    setItem: (k, v) => sessionMap.set(k, String(v)),
    removeItem: (k) => sessionMap.delete(k)
  };

  const mod = await import('../src/services/customerService.js');
  const {
    customerService,
    isValidIndianPhone,
    isValidIndianPincode,
    isValidEmail,
    lookupIndianPincodeInfo,
    validateAddressPayload
  } = mod;

  let passed = 0;
  let failed = 0;
  function assert(cond, label) {
    if (cond) {
      console.log(`✅ PASS: ${label}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${label}`);
      failed++;
    }
  }

  console.log('================================================================');
  console.log('RODHE Customer Service & Privacy Security Unit Suite');
  console.log('================================================================\n');

  // 1. Legacy insecure PII cleanup
  localStorage.setItem('rodhe_patron_session', JSON.stringify({ name: 'Leak Risk', address: '123 Secret St' }));
  customerService.purgeLegacyInsecurePii();
  assert(localStorage.getItem('rodhe_patron_session') === null, 'Purged legacy insecure PII from shared localStorage');

  // 2. Guest session isolation (uses sessionStorage only, NOT localStorage)
  customerService.saveGuestCheckoutDraft({ fullName: 'Kavya Nair', pincode: '560001' });
  assert(localStorage.getItem('rodhe_guest_checkout_draft') === null, 'Guest checkout draft never written to persistent shared localStorage');
  assert(customerService.getGuestCheckoutDraft()?.fullName === 'Kavya Nair', 'Guest checkout draft preserved within current tab sessionStorage');
  customerService.clearGuestCheckoutDraft();
  assert(customerService.getGuestCheckoutDraft() === null, 'Guest checkout draft cleared on sign out / clear');

  // 3. Phone, Email, and PIN validation
  assert(isValidIndianPhone('9490658858') === true, 'Validates 10-digit Indian phone');
  assert(isValidIndianPhone('12345') === false, 'Rejects short phone number');
  assert(isValidIndianPhone('5123456789') === false, 'Rejects invalid starting digit phone');
  assert(isValidIndianPincode('560001') === true, 'Validates 6-digit PIN code');
  assert(isValidIndianPincode('060001') === false, 'Rejects PIN code starting with 0');
  assert(isValidIndianPincode('56001') === false, 'Rejects 5-digit PIN code');
  assert(isValidEmail('patron@example.com') === true, 'Validates clean email');
  assert(isValidEmail('bad-email') === false, 'Rejects malformed email');

  // 4. Pincode metro auto-detection
  assert(lookupIndianPincodeInfo('560001')?.city === 'Bengaluru', 'Detects Bengaluru for 560xxx');
  assert(lookupIndianPincodeInfo('400001')?.state === 'Maharashtra', 'Detects Maharashtra for 400xxx');
  assert(lookupIndianPincodeInfo('500033')?.city === 'Hyderabad', 'Detects Hyderabad for 500xxx');

  // 5. Structured Address Validation
  const badAddr = validateAddressPayload({ recipientName: 'A', phone: '99', addressLine1: '12', pincode: '123', city: '', state: '' });
  assert(badAddr.isValid === false && Object.keys(badAddr.errors).length >= 5, 'Rejects incomplete/invalid address payload with granular errors');

  const goodAddr = validateAddressPayload({
    recipientName: 'Meenakshi Iyer',
    phone: '+91 98400 11223',
    addressLine1: 'No. 14, Boat Club Road',
    addressLine2: 'RA Puram',
    landmark: 'Near Adyar Club',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600028',
    isDefault: true
  });
  assert(goodAddr.isValid === true && goodAddr.normalized.phone === '9840011223', 'Validates and normalizes complete structured address');

  // 6. Auth safety when unauthenticated
  const unauthCustomer = await customerService.getAuthenticatedCustomer();
  assert(unauthCustomer === null, 'Unauthenticated browser returns null customer (zero false session assumption)');

  console.log(`\nTOTAL: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  if (failed > 0) process.exit(1);
}

runCustomerServiceTests().catch((err) => {
  console.error(err);
  process.exit(1);
});

