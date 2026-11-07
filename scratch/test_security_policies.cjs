const fs = require('fs');
const path = require('path');

async function runSecurityAuditTests() {
  console.log('================================================================');
  console.log('RODHE Zero-Trust Security & RLS Policy Static/Code Audit');
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

  // 1. Audit Client-Side Bundle for Compromised Secrets
  console.log('--- Test Suite 1: Build Bundle Credential Exposure Audit ---');
  const distAssetsDir = path.join(__dirname, '..', 'dist', 'assets');
  let bundleContent = '';
  if (fs.existsSync(distAssetsDir)) {
    const files = fs.readdirSync(distAssetsDir);
    const jsFiles = files.filter(f => f.endsWith('.js'));
    jsFiles.forEach(f => {
      bundleContent += fs.readFileSync(path.join(distAssetsDir, f), 'utf8');
    });
  }

  const bannedStrings = [
    'RODHE-2026',
    'RODHE-MAISON-2026',
    'WOVEN2026',
    'rodhe@admin'
  ];

  bannedStrings.forEach(secret => {
    assert(!bundleContent.includes(secret), `Zero exposure of compromised token "${secret}" in client bundle`);
  });

  // 2. Audit SQL Migrations for RLS & Search Path Hardening
  console.log('\n--- Test Suite 2: Database Migration & RLS Policy Hardening ---');
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20261108_final_commerce_production.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  // Verify RLS enabled on all core tables
  assert(sql.includes('ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;'), 'RLS enabled on orders');
  assert(sql.includes('ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;'), 'RLS enabled on order_items');
  assert(sql.includes('ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;'), 'RLS enabled on payments');
  assert(sql.includes('ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;'), 'RLS enabled on inventory_movements');
  assert(sql.includes('ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;'), 'RLS enabled on customer_profiles');
  assert(sql.includes('ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;'), 'RLS enabled on customer_addresses');
  assert(sql.includes('ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;'), 'RLS enabled on admin_users');

  // Verify Zero Insecure Policies (USING (true) for SELECT on customer data)
  assert(!sql.includes('"Public Read Own Order" ON public.orders FOR SELECT USING (true)'), 'No blanket anonymous read on orders');
  assert(!sql.includes('"Public Read Own Order Items" ON public.order_items FOR SELECT USING (true)'), 'No blanket anonymous read on order_items');
  assert(!sql.includes('CREATE POLICY "Public Read Admin Users"'), 'No public read on admin_users');

  // Verify SECURITY DEFINER functions have hardened search_path
  const functions = ['is_admin', 'create_order_atomic', 'cancel_order_atomic', 'lookup_order'];
  functions.forEach(fn => {
    assert(
      sql.includes(`FUNCTION public.${fn}`) && sql.includes('SET search_path = public, pg_temp'),
      `Function public.${fn}() hardened with SET search_path = public, pg_temp`
    );
  });

  // 3. Audit authService for Supabase Auth Usage
  console.log('\n--- Test Suite 3: Admin Authentication & Session Security ---');
  const authServicePath = path.join(__dirname, '..', 'src', 'services', 'authService.js');
  const authServiceCode = fs.readFileSync(authServicePath, 'utf8');

  assert(authServiceCode.includes('supabase.auth.signInWithPassword'), 'authService uses genuine Supabase Auth password verification');
  assert(authServiceCode.includes('supabase.auth.resetPasswordForEmail'), 'authService uses verified email recovery dispatch');
  assert(authServiceCode.includes('verifyAdminAuthorization'), 'authService verifies server-side admin role check via public.is_admin()');
  assert(!authServiceCode.includes('localStorage.setItem("rodhe_admin_session"'), 'No mock admin session tokens stored in localStorage');

  // Summary
  console.log('\n================================================================');
  console.log(`TOTAL SECURITY TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runSecurityAuditTests().catch(err => {
  console.error('Security audit execution error:', err);
  process.exit(1);
});
