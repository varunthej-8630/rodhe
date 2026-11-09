const fs = require('fs');
const path = require('path');

async function testCrmAuthLifecycle() {
  console.log('================================================================');
  console.log('RODHE — CRM Authentication & Logout Lifecycle Verification Suite');
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
  // SUITE 1: Root Cause & Fix Verification in AdminPortal.jsx
  // ============================================================================
  console.log('--- Suite 1: AdminPortal Gating & State Machine ---');

  const portalPath = path.resolve(__dirname, '../src/components/admin/AdminPortal.jsx');
  const portalCode = fs.readFileSync(portalPath, 'utf8');

  // Verify Promise truthiness bug is eliminated
  assert(!portalCode.includes('useState(() => authService.getCurrentSession())'), 'Eliminated synchronous async function call inside useState');
  assert(portalCode.includes('const [session, setSession] = useState(null)'), 'session state initialized cleanly to null');
  assert(portalCode.includes('const [isCheckingAuth, setIsCheckingAuth] = useState(true)'), 'isCheckingAuth state initialized to true');
  assert(portalCode.includes('await authService.getCurrentSession()'), 'Properly awaits getCurrentSession() during mount');
  assert(portalCode.includes('onAuthStateChange'), 'Subscribed to Supabase GoTrue onAuthStateChange events');
  assert(portalCode.includes('if (isCheckingAuth)'), 'Renders loading screen while verifying credentials');
  assert(/if \(!session\)\s*\{\s*return \(\s*<AdminLogin/.test(portalCode), 'Strictly gates access: renders AdminLogin when session is null');
  assert(portalCode.includes('session={session}'), 'Passes verified session prop to AdminLayout');

  // Verify Logout routing fix
  assert(portalCode.includes('onNavigateToStorefront(\'home\')'), 'handleLogout redirects user to storefront home page');

  // ============================================================================
  // SUITE 2: authService.js Hardened Session Logic
  // ============================================================================
  console.log('\n--- Suite 2: authService Genuine Supabase Auth Enforcement ---');

  const authServicePath = path.resolve(__dirname, '../src/services/authService.js');
  const authCode = fs.readFileSync(authServicePath, 'utf8');

  // Verify genuine Supabase Auth & server-side RPC is_admin check
  assert(authCode.includes('await supabase.auth.getSession()'), 'Inspects genuine Supabase GoTrue session');
  assert(authCode.includes('await supabase.rpc(\'is_admin\')'), 'Verifies server-side is_admin() RPC before returning session');
  assert(authCode.includes('localStorage.removeItem(AUTH_SESSION_KEY)'), 'Purges local cached session if not authenticated or not admin');

  // Ensure no unverified localStorage fallback
  const rawFallbackRegex = /return raw \? JSON\.parse\(raw\) : null;/;
  assert(!rawFallbackRegex.test(authCode), 'Removed unverified fallback to raw localStorage data');

  // Verify Logout functionality
  assert(authCode.includes('await supabase.auth.signOut()'), 'authService.logout calls supabase.auth.signOut()');

  // ============================================================================
  // SUITE 3: AdminLayout Verified Badge & Username Binding
  // ============================================================================
  console.log('\n--- Suite 3: AdminLayout Verification & Dynamic Role Status ---');

  const layoutPath = path.resolve(__dirname, '../src/components/admin/AdminLayout.jsx');
  const layoutCode = fs.readFileSync(layoutPath, 'utf8');

  assert(!layoutCode.includes('const session = authService.getCurrentSession();'), 'AdminLayout does not invoke async getCurrentSession synchronously');
  assert(layoutCode.includes('session?.role === \'super_admin\' ? \'Admin Verified\' : \'Session Active\''), 'Admin Verified indicator dynamically bound to verified super_admin role');
  assert(layoutCode.includes('Sign Out ({session?.name'), 'Sign Out button displays actual authenticated administrator name');

  // ============================================================================
  // SUITE 4: ShopContext Storefront Redirect & Clean URL State
  // ============================================================================
  console.log('\n--- Suite 4: ShopContext URL Sanitization on Storefront Return ---');

  const shopContextPath = path.resolve(__dirname, '../src/context/ShopContext.jsx');
  const shopContextCode = fs.readFileSync(shopContextPath, 'utf8');

  assert(shopContextCode.includes('searchParams.delete(\'page\')'), 'navigateTo(home) purges page query parameter from browser URL');
  assert(shopContextCode.includes('history.replaceState(null, \'\', newUrl)'), 'history.replaceState cleans URL to public storefront root');

  // Ensure customer cart is never touched by authService
  assert(!authCode.includes('rodhe_cart'), 'authService does not touch customer shopping cart');
  assert(!authCode.includes('rodhe_wishlist'), 'authService does not touch customer wishlist');
  assert(!authCode.includes('rodhe_patron_session'), 'authService does not touch customer concierge session');

  // ============================================================================
  // SUITE 5: Production Bundle Static Scan
  // ============================================================================
  console.log('\n--- Suite 5: Production Build Security & Code Split Scan ---');

  const distDir = path.resolve(__dirname, '../dist/assets');
  const assetFiles = fs.readdirSync(distDir);
  const jsFiles = assetFiles.filter(f => f.endsWith('.js'));
  assert(jsFiles.length > 0, 'Production JS bundle generated');

  let totalJsContent = '';
  for (const jsFile of jsFiles) {
    totalJsContent += fs.readFileSync(path.join(distDir, jsFile), 'utf8');
  }

  // Ensure no unverified backdoor tokens
  const forbiddenTokens = ['RODHE-2026', 'WOVEN2026', 'RODHE-MAISON-2026'];
  for (const token of forbiddenTokens) {
    assert(!totalJsContent.includes(token), `Production bundle clean of legacy backdoor token "${token}"`);
  }

  // Verify AdminPortal is split into a separate deferred chunk
  const adminChunk = jsFiles.find(f => f.startsWith('AdminPortal'));
  assert(Boolean(adminChunk), `AdminPortal isolated in deferred chunk: ${adminChunk}`);

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('\n================================================================');
  console.log(`TOTAL CHECKS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

testCrmAuthLifecycle().catch(err => {
  console.error('Lifecycle test error:', err);
  process.exit(1);
});
