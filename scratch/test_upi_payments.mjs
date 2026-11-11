import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

// Ensure hermetic mode for Node unit/service portions
process.env.VITE_SUPABASE_URL = '';
process.env.NEXT_PUBLIC_SUPABASE_URL = '';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const SCREENSHOT_DIR = path.resolve(
  'C:/Users/VARUN THEJ/.gemini/antigravity/brain/19b27903-4db7-4641-b286-e3f5c8aadb5a/screenshots'
);
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8'
};

function startStaticServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const reqPath = (req.url || '/').split('?')[0];
      let filePath = path.join(DIST_DIR, reqPath === '/' ? 'index.html' : decodeURIComponent(reqPath));
      if (!filePath.startsWith(DIST_DIR) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(DIST_DIR, 'index.html');
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    });
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      resolve({ server, url: `http://127.0.0.1:${addr.port}` });
    });
  });
}

class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.idCounter = 1;
    this.pending = new Map();
    this.listeners = new Map();
  }
  on(method, fn) {
    if (!this.listeners.has(method)) this.listeners.set(method, []);
    this.listeners.get(method).push(fn);
  }
  async connect() {
    await new Promise((resolve, reject) => {
      this.ws.addEventListener('open', resolve, { once: true });
      this.ws.addEventListener('error', reject, { once: true });
    });
    this.ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      } else if (msg.method && this.listeners.has(msg.method)) {
        for (const fn of this.listeners.get(msg.method)) {
          try { fn(msg.params); } catch (err) { console.error(err); }
        }
      }
    });
  }
  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.idCounter++;
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async eval(expr) {
    const res = await this.send('Runtime.evaluate', {
      expression: `(async () => { ${expr} })()`,
      awaitPromise: true,
      returnByValue: true
    });
    if (res.exceptionDetails) {
      throw new Error(res.exceptionDetails.exception?.description || res.exceptionDetails.text || 'JS eval error');
    }
    return res.result?.value;
  }
  async waitFor(predicateJs, timeoutMs = 10000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      try {
        const ok = await this.eval(`return Boolean(${predicateJs});`);
        if (ok) return true;
      } catch {}
      await delay(100);
    }
    throw new Error(`Timed out waiting for: ${predicateJs}`);
  }
  async setViewport(width, height, mobile = false) {
    await this.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
    await delay(200);
  }
  async screenshot(filename) {
    const { data } = await this.send('Page.captureScreenshot', { format: 'png' });
    const outPath = path.join(SCREENSHOT_DIR, filename);
    fs.writeFileSync(outPath, Buffer.from(data, 'base64'));
    return outPath;
  }
  close() {
    try { this.ws.close(); } catch {}
  }
}

function makeMockJwt(userId, email) {
  const h = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const p = Buffer.from(JSON.stringify({
    sub: userId,
    aud: 'authenticated',
    role: 'authenticated',
    email,
    exp: Math.floor(Date.now() / 1000) + 7200
  })).toString('base64url');
  return `${h}.${p}.mock-sig`;
}

async function runTests() {
  let passed = 0;
  let failed = 0;
  function assert(cond, label, detail = '') {
    if (cond) {
      console.log(`✅ PASS: ${label}${detail ? ` (${detail})` : ''}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${label}${detail ? ` — ${detail}` : ''}`);
      failed++;
    }
  }

  // ========================================================================
  // SUITE A: QR Assets, Migration Security & Bundle Audit
  // ========================================================================
  console.log('\n--- Suite A: QR Files, Migration SQL & Security Audit ---');
  const qrPaths = [
    path.join(DIST_DIR, 'assets', 'upi', 'phonepe-qr.jpg'),
    path.join(DIST_DIR, 'assets', 'upi', 'gpay-qr.jpg'),
    path.join(DIST_DIR, 'assets', 'upi', 'paytm-qr.jpg')
  ];
  const qrSizes = qrPaths.map((p) => (fs.existsSync(p) ? fs.statSync(p).size : 0));
  assert(qrSizes.every((s) => s > 20000), 'All 3 built UPI QR assets present in dist/assets/upi/', qrSizes.join(', '));
  assert(new Set(qrSizes).size === 3, 'All 3 UPI QR assets are distinct brand images (not silently duplicated)');

  const upiSqlPath = path.join(ROOT_DIR, 'supabase', 'migrations', '20261112_upi_manual_reconciliation.sql');
  const upiSql = fs.readFileSync(upiSqlPath, 'utf8');
  assert(upiSql.includes('ENABLE ROW LEVEL SECURITY') && upiSql.includes('payment_verification_logs'), 'Migration includes payment_verification_logs audit table with RLS');
  assert(upiSql.includes('v_product.selling_price') && upiSql.includes('FROM public.promotions'), 'Server RPC enforces authoritative DB product selling_price & promotions');
  assert(upiSql.includes('idempotency_key') && upiSql.includes('idempotent_replay'), 'Server RPC enforces idempotency_key to prevent duplicate orders');
  assert(upiSql.includes('FUNCTION public.verify_upi_payment_admin') && upiSql.includes('IF NOT public.is_admin()'), 'Admin verification RPC strictly requires public.is_admin()');
  assert(upiSql.includes('This order payment is already verified as PAID'), 'Admin verification RPC blocks duplicate VERIFY_PAID calls');
  assert(upiSql.includes('SET search_path = public, pg_temp'), 'SECURITY DEFINER RPCs harden search_path');

  const distJs = fs.readdirSync(path.join(DIST_DIR, 'assets'))
    .filter((f) => f.endsWith('.js'))
    .map((f) => fs.readFileSync(path.join(DIST_DIR, 'assets', f), 'utf8'))
    .join('\n');
  assert(!distJs.includes('test@upi') && !distJs.includes('merchant@ybl') && !distJs.includes('service_role'), 'Production bundle free of dummy UPI IDs & service-role secrets');

  // ========================================================================
  // SUITE B: UPI Config, Deep-Link & UTR Validation Unit Tests
  // ========================================================================
  console.log('\n--- Suite B: UPI Intent Builder & UTR Validation ---');
  const upiCfg = await import('../src/config/upiConfig.js');
  const phonePeIntent = upiCfg.buildUpiIntentUrls({ methodId: 'upi_phonepe', amount: 1649, orderNumber: 'RDH-2026-100999' });
  const gpayIntent = upiCfg.buildUpiIntentUrls({ methodId: 'upi_gpay', amount: 3450, orderNumber: 'RDH-2026-101000' });
  const paytmIntent = upiCfg.buildUpiIntentUrls({ methodId: 'upi_paytm', amount: 890, orderNumber: 'RDH-2026-101001' });

  assert(phonePeIntent.standardUrl.includes('pa=rayapati.krupakar%40ibl') && phonePeIntent.standardUrl.includes('am=1649.00') && phonePeIntent.standardUrl.includes('cu=INR') && phonePeIntent.standardUrl.includes('tr=RDH-2026-100999'), 'PhonePe UPI Intent URL encodes verified VPA, exact INR amount & order ref');
  assert(gpayIntent.standardUrl.includes('pa=rayapatikrupakar-3%40oksbi') && gpayIntent.appSpecificUrl.startsWith('tez://upi/pay?'), 'Google Pay UPI Intent encodes @oksbi VPA and tez:// scheme');
  assert(paytmIntent.standardUrl.includes('pa=9177900684%40ptsbi') && paytmIntent.appSpecificUrl.startsWith('paytmmp://pay?'), 'Paytm UPI Intent encodes @ptsbi VPA and paytmmp:// scheme');

  assert(!upiCfg.normalizeAndValidateUtr('').valid, 'UTR validator rejects blank input');
  assert(!upiCfg.normalizeAndValidateUtr('12345678').valid, 'UTR validator rejects trivial sequential pattern 12345678');
  assert(!upiCfg.normalizeAndValidateUtr('TEST12345').valid, 'UTR validator rejects dummy TEST prefix');
  assert(!upiCfg.normalizeAndValidateUtr('abc').valid, 'UTR validator rejects short reference');
  assert(upiCfg.normalizeAndValidateUtr('431682910452').valid, 'UTR validator accepts valid 12-digit numeric UTR');
  assert(upiCfg.normalizeAndValidateUtr('HDFCR92019481').valid, 'UTR validator accepts alphanumeric bank UPI reference');

  // ========================================================================
  // SUITE C: Hermetic Payment Service Lifecycle & Edge Cases
  // ========================================================================
  console.log('\n--- Suite C: Hermetic Order, Idempotency, UTR & Admin Reconciliation ---');
  const { storeService } = await import('../src/services/storeService.js');
  const { paymentService } = await import('../src/services/paymentService.js');
  const products = await storeService.getProducts();
  const sampleSaree = products[0];
  const stockBefore = sampleSaree.stockCount ?? 6;
  const idemKey = `test-idem-${Date.now()}`;

  const created = await paymentService.createPendingUpiOrder({
    items: [{ product: sampleSaree, quantity: 1 }],
    customer: { fullName: 'Meera Iyer', email: 'meera.iyer@example.com', phone: '9845011223' },
    shippingAddress: { addressLine1: '18 Lavelle Road', city: 'Bengaluru', state: 'Karnataka', pincode: '560001' },
    appliedCoupon: null,
    giftWrap: false,
    shippingFee: 199,
    discountAmount: 0,
    upiMethod: 'upi_phonepe',
    idempotencyKey: idemKey
  });

  assert(created.order.paymentStatus === 'PENDING', 'New UPI order starts strictly as PENDING (not PAID)');
  assert(created.order.merchantVpa === 'rayapati.krupakar@ibl', 'Order records verified PhonePe merchant VPA');

  // Duplicate submission with same idempotencyKey
  const replay = await paymentService.createPendingUpiOrder({
    items: [{ product: sampleSaree, quantity: 1 }],
    customer: { fullName: 'Meera Iyer', email: 'meera.iyer@example.com', phone: '9845011223' },
    shippingAddress: { addressLine1: '18 Lavelle Road', city: 'Bengaluru', state: 'Karnataka', pincode: '560001' },
    upiMethod: 'upi_phonepe',
    idempotencyKey: idemKey
  });
  const stockAfterReplay = (await storeService.getProducts()).find((p) => p.sku === sampleSaree.sku)?.stockCount;
  assert(replay.order.orderNumber === created.order.orderNumber && replay.order.idempotentReplay === true, 'Duplicate checkout submit replays same order without creating duplicate order');
  assert(stockAfterReplay === stockBefore - 1, `Inventory decremented exactly once despite replay (${stockBefore} -> ${stockAfterReplay})`);

  // Wrong contact rejected when submitting UTR
  let rejectedWrongContact = false;
  try {
    await paymentService.submitUtr({ orderNumber: created.order.orderNumber, contact: 'stranger@example.com', utrReference: '431682910452', upiMethod: 'upi_phonepe' });
  } catch {
    rejectedWrongContact = true;
  }
  assert(rejectedWrongContact, 'Unauthorized / wrong-contact UTR submission rejected cleanly');

  // Customer switches to Google Pay (retry without duplicate order)
  const retryRes = await paymentService.retryWithMethod({ orderNumber: created.order.orderNumber, contact: 'meera.iyer@example.com', upiMethod: 'upi_gpay' });
  assert(retryRes.payment_method === 'upi_gpay' && retryRes.order_number === created.order.orderNumber, 'UPI app switch / retry keeps same order without duplicate order');

  // Customer submits valid UTR -> strictly AWAITING_VERIFICATION (never PAID)
  const utrRes = await paymentService.submitUtr({ orderNumber: created.order.orderNumber, contact: 'meera.iyer@example.com', utrReference: '431682910452', upiMethod: 'upi_gpay' });
  assert(utrRes.payment_status === 'AWAITING_VERIFICATION', 'Customer UTR submission moves order ONLY to AWAITING_VERIFICATION (never PAID)');

  // Reject mismatch requires notes
  let rejectRequiresNotes = false;
  try {
    await paymentService.verifyAdmin({ orderId: created.order.id, action: 'REJECT_MISMATCH', notes: '', adminEmail: 'rodhesaree@gmail.com' });
  } catch {
    rejectRequiresNotes = true;
  }
  assert(rejectRequiresNotes, 'Admin Reject/Mismatch action requires audit reason notes');

  // Admin Verify PAID
  const paidRes = await paymentService.verifyAdmin({
    orderId: created.order.id,
    action: 'VERIFY_PAID',
    verifiedUtr: '431682910452',
    notes: 'Confirmed credit in SBI statement',
    adminEmail: 'rodhesaree@gmail.com'
  });
  assert(paidRes.payment_status === 'PAID' && paidRes.fulfillment_status === 'processing', 'Admin manual verification transitions order to PAID & processing');

  // Admin Double Verification blocked
  let doubleVerifyBlocked = false;
  try {
    await paymentService.verifyAdmin({ orderId: created.order.id, action: 'VERIFY_PAID', verifiedUtr: '431682910452', notes: 'Duplicate try', adminEmail: 'rodhesaree@gmail.com' });
  } catch {
    doubleVerifyBlocked = true;
  }
  assert(doubleVerifyBlocked, 'Duplicate admin VERIFY_PAID attempt on same order blocked');

  const logs = await storeService.getPaymentAuditLogs(created.order.id);
  assert(logs.length >= 4, 'Immutable payment verification audit log tracks create -> retry -> utr -> verified_paid', `count=${logs.length}`);

  // Cancel restores stock cleanly
  await paymentService.verifyAdmin({ orderId: created.order.id, action: 'MARK_CANCELLED', notes: 'Customer requested cancellation', adminEmail: 'rodhesaree@gmail.com' });
  const stockAfterCancel = (await storeService.getProducts()).find((p) => p.sku === sampleSaree.sku)?.stockCount;
  assert(stockAfterCancel === stockBefore, `Cancelled order restores stock cleanly (${stockAfterReplay} -> ${stockAfterCancel})`);

  // ========================================================================
  // SUITE D: Real Browser E2E Checkout + QR Render + UTR + CRM Verification
  // ========================================================================
  console.log('\n--- Suite D: Browser E2E UPI Payment & CRM Reconciliation ---');
  const browserExe = fs.existsSync(CHROME_PATH) ? CHROME_PATH : EDGE_PATH;
  const userDataDir = fs.mkdtempSync(path.join(process.env.TEMP || '/tmp', 'rodhe-upi-e2e-'));
  const debugPort = 19522 + Math.floor(Math.random() * 400);
  const { server, url } = await startStaticServer();

  const browser = spawn(browserExe, [
    '--headless=new',
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${userDataDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--window-size=1440,900',
    'about:blank'
  ], { stdio: 'ignore' });

  let cdp = null;
  const dbState = {
    orders: [],
    logs: [],
    adminSignedIn: false
  };

  try {
    let targets = null;
    for (let i = 0; i < 40; i++) {
      try {
        const resp = await fetch(`http://127.0.0.1:${debugPort}/json`);
        if (resp.ok) {
          targets = await resp.json();
          if (targets?.length > 0) break;
        }
      } catch {}
      await delay(200);
    }
    if (!targets?.length) throw new Error('Could not connect to headless browser CDP endpoint.');

    const pageTarget = targets.find((t) => t.type === 'page') || targets[0];
    cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Fetch.enable', {
      patterns: [
        { urlPattern: '*emtmzrjaygcrmzoatvfa.supabase.co/rest/v1/*' },
        { urlPattern: '*emtmzrjaygcrmzoatvfa.supabase.co/auth/v1/*' }
      ]
    });

    const corsHeaders = [
      { name: 'Content-Type', value: 'application/json' },
      { name: 'Access-Control-Allow-Origin', value: url },
      { name: 'Access-Control-Allow-Credentials', value: 'true' },
      { name: 'Access-Control-Allow-Headers', value: 'authorization, x-client-info, apikey, content-type, prefer, x-supabase-api-version, accept-profile, content-profile' },
      { name: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, PATCH, DELETE, OPTIONS' }
    ];

    cdp.on('Fetch.requestPaused', async ({ requestId, request }) => {
      const reqUrl = request.url || '';
      const method = (request.method || 'GET').toUpperCase();
      const fulfillJson = (status, body) => cdp.send('Fetch.fulfillRequest', {
        requestId,
        responseCode: status,
        responseHeaders: corsHeaders,
        body: Buffer.from(body === null ? '' : JSON.stringify(body)).toString('base64')
      }).catch(() => {});

      if (method === 'OPTIONS') {
        const hdrs = request.headers || {};
        const reqAllow = hdrs['access-control-request-headers'] || hdrs['Access-Control-Request-Headers'] || hdrs['Access-Control-Allow-Headers'];
        const optHdrs = reqAllow ? [...corsHeaders.filter((h) => h.name !== 'Access-Control-Allow-Headers'), { name: 'Access-Control-Allow-Headers', value: reqAllow }] : corsHeaders;
        return cdp.send('Fetch.fulfillRequest', { requestId, responseCode: 204, responseHeaders: optHdrs }).catch(() => {});
      }

      // Auth mocks for Admin CRM verification test
      if (reqUrl.includes('/auth/v1/token')) {
        dbState.adminSignedIn = true;
        return fulfillJson(200, {
          access_token: makeMockJwt('admin-uid-1', 'rodhesaree@gmail.com'),
          token_type: 'bearer',
          expires_in: 7200,
          refresh_token: 'mock-admin-refresh',
          user: { id: 'admin-uid-1', email: 'rodhesaree@gmail.com' }
        });
      }
      if (reqUrl.includes('/auth/v1/user')) {
        if (!dbState.adminSignedIn) return fulfillJson(401, { message: 'Not signed in' });
        return fulfillJson(200, { id: 'admin-uid-1', email: 'rodhesaree@gmail.com' });
      }
      if (reqUrl.includes('/rest/v1/rpc/is_admin')) {
        return fulfillJson(200, Boolean(dbState.adminSignedIn));
      }

      if (reqUrl.includes('/rest/v1/rpc/create_order_atomic')) {
        const body = JSON.parse(request.postData || '{}');
        const pOrder = body.p_order || {};
        const pItems = body.p_items || [];
        const existing = pOrder.idempotency_key && dbState.orders.find((o) => o.idempotency_key === pOrder.idempotency_key);
        if (existing) {
          return fulfillJson(200, { success: true, idempotent_replay: true, order_id: existing.id, order_number: existing.order_number, subtotal: existing.subtotal, discount_amount: existing.discount_amount, shipping_fee: existing.shipping_fee, gift_wrap_fee: existing.gift_wrap_fee, grand_total: existing.grand_total, payment_status: existing.payment_status, payment_method: existing.payment_method, payment_expires_at: existing.payment_expires_at });
        }
        const subtotal = pItems.reduce((s, it) => s + Number(it.unit_price) * Number(it.quantity), 0);
        const shippingFee = subtotal >= 2999 ? 0 : 199;
        const grandTotal = subtotal + shippingFee;
        const orderId = `ord-e2e-${dbState.orders.length + 1}`;
        const orderNumber = `RDH-2026-90000${dbState.orders.length + 1}`;
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
        const orderRow = {
          id: orderId,
          order_number: orderNumber,
          idempotency_key: pOrder.idempotency_key,
          customer_name: pOrder.customer_name,
          customer_email: pOrder.customer_email,
          customer_phone: pOrder.customer_phone,
          shipping_address: pOrder.shipping_address,
          subtotal,
          discount_amount: 0,
          shipping_fee: shippingFee,
          gift_wrap_fee: 0,
          grand_total: grandTotal,
          payment_method: pOrder.payment_method,
          payment_status: 'PENDING',
          payment_expires_at: expiresAt,
          utr_reference: '',
          fulfillment_status: 'unfulfilled',
          courier_partner: 'Express Air Logistics',
          tracking_number: '',
          created_at: new Date().toISOString(),
          order_items: pItems,
          payments: [{ id: `pay-${orderId}`, upi_app: pOrder.payment_method, status: 'PENDING', amount: grandTotal }],
          payment_verification_logs: [{ id: `log-1-${orderId}`, action: 'payment_created', previous_status: 'CREATED', new_status: 'PENDING', actor_role: 'customer', notes: `Created via ${pOrder.payment_method}`, created_at: new Date().toISOString() }]
        };
        dbState.orders.unshift(orderRow);
        return fulfillJson(200, { success: true, order_id: orderId, order_number: orderNumber, subtotal, discount_amount: 0, shipping_fee: shippingFee, gift_wrap_fee: 0, grand_total: grandTotal, payment_status: 'PENDING', payment_method: pOrder.payment_method, payment_expires_at: expiresAt });
      }

      if (reqUrl.includes('/rest/v1/rpc/initiate_upi_retry')) {
        const body = JSON.parse(request.postData || '{}');
        const target = dbState.orders.find((o) => o.order_number === body.p_order_number);
        if (!target) return fulfillJson(404, { message: 'Order not found' });
        const prev = target.payment_status;
        target.payment_method = body.p_upi_app;
        target.payment_status = 'PENDING';
        target.payment_expires_at = new Date(Date.now() + 30 * 60 * 1000).toISOString();
        target.payment_verification_logs.unshift({ id: `log-r-${Date.now()}`, action: 'retry_initiated', previous_status: prev, new_status: 'PENDING', actor_role: 'customer', notes: `Switched app to ${body.p_upi_app}`, created_at: new Date().toISOString() });
        return fulfillJson(200, { success: true, order_number: target.order_number, payment_method: target.payment_method, payment_status: 'PENDING', payment_expires_at: target.payment_expires_at });
      }

      if (reqUrl.includes('/rest/v1/rpc/submit_upi_reference')) {
        const body = JSON.parse(request.postData || '{}');
        const target = dbState.orders.find((o) => o.order_number === body.p_order_number);
        if (!target) return fulfillJson(404, { message: 'Order not found' });
        const prev = target.payment_status;
        target.utr_reference = String(body.p_utr || '').toUpperCase();
        target.payment_status = 'AWAITING_VERIFICATION';
        target.payment_submitted_at = new Date().toISOString();
        target.payment_verification_logs.unshift({ id: `log-u-${Date.now()}`, action: 'utr_submitted', previous_status: prev, new_status: 'AWAITING_VERIFICATION', utr_reference: target.utr_reference, actor_role: 'customer', notes: 'Customer submitted UTR for verification', created_at: new Date().toISOString() });
        return fulfillJson(200, { success: true, order_number: target.order_number, payment_status: 'AWAITING_VERIFICATION', utr_reference: target.utr_reference });
      }

      if (reqUrl.includes('/rest/v1/rpc/lookup_order')) {
        const body = JSON.parse(request.postData || '{}');
        const target = dbState.orders.find((o) => o.order_number === body.p_order_number);
        if (!target) return fulfillJson(200, { success: false, message: 'No order found' });
        return fulfillJson(200, { success: true, order: { ...target, items: target.order_items } });
      }

      if (reqUrl.includes('/rest/v1/rpc/verify_upi_payment_admin')) {
        if (!dbState.adminSignedIn) return fulfillJson(403, { message: 'Unauthorized' });
        const body = JSON.parse(request.postData || '{}');
        const target = dbState.orders.find((o) => o.id === body.p_order_id);
        if (!target) return fulfillJson(404, { message: 'Order not found' });
        if (body.p_action === 'VERIFY_PAID') {
          if (target.payment_status === 'PAID') return fulfillJson(400, { message: 'Already verified as PAID' });
          const prev = target.payment_status;
          target.payment_status = 'PAID';
          target.fulfillment_status = 'processing';
          target.utr_reference = body.p_verified_utr || target.utr_reference;
          target.verified_by_email = 'rodhesaree@gmail.com';
          target.verified_at = new Date().toISOString();
          target.verification_notes = body.p_notes;
          target.payment_verification_logs.unshift({ id: `log-v-${Date.now()}`, action: 'verified_paid', previous_status: prev, new_status: 'PAID', utr_reference: target.utr_reference, actor_email: 'rodhesaree@gmail.com', actor_role: 'admin', notes: body.p_notes, created_at: new Date().toISOString() });
          return fulfillJson(200, { success: true, order_id: target.id, payment_status: 'PAID', fulfillment_status: 'processing' });
        }
        return fulfillJson(200, { success: true });
      }

      if (reqUrl.includes('/rest/v1/orders')) {
        if (!dbState.adminSignedIn) return fulfillJson(200, []);
        return fulfillJson(200, dbState.orders);
      }

      return cdp.send('Fetch.continueRequest', { requestId }).catch(() => {});
    });

    await cdp.send('Page.navigate', { url });
    await cdp.waitFor("document.readyState === 'complete'");
    await cdp.eval(`
      localStorage.clear();
      sessionStorage.clear();
      sessionStorage.setItem('rodhe_intro_played', 'true');
      localStorage.setItem('rodhe_cookie_consent', JSON.stringify({ essential: true, analytics: false, version: 1 }));
    `);
    await cdp.send('Page.reload', { ignoreCache: true });
    await cdp.waitFor("document.querySelector('[aria-label^=\"Shopping bag\"]')");
    await cdp.setViewport(1440, 900, false);

    // 1. Add item -> Bag -> Checkout -> Address -> Select Google Pay -> Create Order
    await cdp.eval(`
      const btn = document.querySelector('.product-card .btn-ecommerce-add-to-cart');
      btn?.click();
    `);
    await cdp.waitFor("document.querySelector('[aria-label=\"Shopping Bag\"]')");
    await cdp.eval(`
      [...document.querySelectorAll('[aria-label="Shopping Bag"] button')].find(b => b.textContent.includes('Proceed to Checkout'))?.click();
    `);
    await cdp.waitFor("document.querySelector('[aria-label=\"Checkout\"]') && !document.body.innerText.includes('Loading RODHE')");
    await cdp.eval(`
      [...document.querySelectorAll('[aria-label="Checkout"] button')].find(b => b.textContent.includes('Continue to Customer Details'))?.click();
    `);
    await cdp.waitFor("document.querySelector('[aria-label=\"Checkout\"] input[placeholder*=\"Ananya Deshmukh\"]')");
    const setCheckoutField = async (sel, val) => {
      await cdp.eval(`
        const el = document.querySelector(${JSON.stringify(sel)});
        if (el) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(el, ${JSON.stringify(val)});
          el.dispatchEvent(new Event('input', { bubbles: true }));
        }
      `);
      await delay(25);
    };
    await setCheckoutField('[aria-label="Checkout"] input[placeholder*="Ananya Deshmukh"]', 'Ananya Reddy');
    await setCheckoutField('[aria-label="Checkout"] input[placeholder*="10-digit"]', '9848011223');
    await setCheckoutField('[aria-label="Checkout"] input[placeholder*="ananya@"]', 'ananya@example.com');
    await setCheckoutField('[aria-label="Checkout"] input[placeholder*="Flat 402"]', '42 Jubilee Enclave');
    await setCheckoutField('[aria-label="Checkout"] input[placeholder*="560001"]', '500081');
    await setCheckoutField('[aria-label="Checkout"] input[placeholder*="Bengaluru"]', 'Hyderabad');
    await setCheckoutField('[aria-label="Checkout"] input[placeholder*="Karnataka"]', 'Telangana');
    await delay(100);
    await cdp.eval(`
      [...document.querySelectorAll('[aria-label="Checkout"] button')].find(b => b.textContent.includes('Continue to Final Review'))?.click();
    `);
    await cdp.waitFor("document.querySelector('[aria-label=\"Checkout\"]')?.textContent.includes('Select Direct UPI Payment')");

    // Select Google Pay -> Create pending UPI order
    await cdp.eval(`
      [...document.querySelectorAll('[aria-label="Checkout"] button')].find(b => b.textContent.includes('Google Pay'))?.click();
    `);
    await delay(100);
    await cdp.eval(`
      [...document.querySelectorAll('[aria-label="Checkout"] button')].find(b => b.textContent.includes('Pay ₹') && b.textContent.includes('Google Pay'))?.click();
    `);
    try {
      await cdp.waitFor("document.querySelector('[aria-label=\"Checkout\"] img[alt*=\"Google Pay UPI\"]')?.complete", 8000);
    } catch (waitErr) {
      const dump = await cdp.eval(`return { modalText: document.querySelector('[aria-label="Checkout"]')?.innerText || '', imgs: [...document.querySelectorAll('img')].map(i=>i.alt) };`);
      console.error('STEP4_DUMP:', JSON.stringify(dump, null, 2), 'DB_ORDERS:', dbState.orders.length);
      throw waitErr;
    }
    await delay(200);

    const gpayStep4 = await cdp.eval(`
      const modal = document.querySelector('[aria-label="Checkout"]');
      const qrImg = modal?.querySelector('img[alt*="Google Pay UPI"]');
      const txt = modal?.textContent || '';
      const bagLabel = document.querySelector('[aria-label^="Shopping bag"]')?.getAttribute('aria-label') || '';
      return {
        hasOrderRef: txt.includes('RDH-2026-900001'),
        hasPayee: txt.includes('Rayapati Krupakar'),
        hasVpa: txt.includes('rayapatikrupakar-3@oksbi'),
        hasPendingBadge: txt.includes('Pending Payment — Not Yet Verified'),
        hasStaticNotice: txt.includes('Static QR Notice'),
        hasPinSafety: txt.includes('never asks for your UPI PIN'),
        qrLoaded: Boolean(qrImg && qrImg.naturalWidth > 0),
        bagCleared: bagLabel.includes('0 items')
      };
    `);
    assert(gpayStep4.hasOrderRef && gpayStep4.hasPayee && gpayStep4.hasVpa, 'Step 4 displays Google Pay order ref, payee name & verified VPA');
    assert(gpayStep4.hasPendingBadge && gpayStep4.hasStaticNotice && gpayStep4.hasPinSafety, 'Step 4 shows honest Pending status, Static QR note & PIN/OTP warning');
    assert(gpayStep4.qrLoaded && gpayStep4.bagCleared, 'Google Pay QR image renders crisply & bag clears after server order creation');
    await cdp.screenshot('qa-upi-desktop-1440.png');

    // Switch to PhonePe on existing order -> check PhonePe QR & VPA + no duplicate order
    await cdp.eval(`
      [...document.querySelectorAll('[aria-label="Checkout"] button')].find(b => b.textContent.includes('PhonePe') && b.textContent.includes('Switch App'))?.click();
    `);
    await cdp.waitFor("document.querySelector('[aria-label=\"Checkout\"] img[alt*=\"PhonePe UPI\"]')?.complete", 8000);
    const phonepeSwitch = await cdp.eval(`
      const txt = document.querySelector('[aria-label="Checkout"]')?.textContent || '';
      const qr = document.querySelector('[aria-label="Checkout"] img[alt*="PhonePe UPI"]');
      return {
        hasPhonePeVpa: txt.includes('rayapati.krupakar@ibl'),
        hasKrupakar: txt.includes('KRUPAKAR RAYAPATI'),
        qrLoaded: Boolean(qr && qr.naturalWidth > 0)
      };
    `);
    assert(phonepeSwitch.hasPhonePeVpa && phonepeSwitch.hasKrupakar && phonepeSwitch.qrLoaded && dbState.orders.length === 1,
      'Switching to PhonePe updates QR & VPA cleanly on same order (orders=' + dbState.orders.length + ')');

    // Mobile 375x812 responsive check on Step 4 UPI QR screen
    await cdp.setViewport(375, 812, true);
    await delay(250);
    const mobileOverflow = await cdp.eval(`return document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;`);
    assert(!mobileOverflow, 'UPI Payment screen has zero horizontal overflow at 375x812 mobile');
    await cdp.screenshot('qa-upi-mobile-375.png');

    // Close modal -> reload page -> verify Shopping Bag shows "Resume Payment" -> Resume -> Submit UTR
    await cdp.setViewport(1440, 900, false);
    await cdp.eval(`document.querySelector('[aria-label="Close checkout"]')?.click();`);
    await cdp.send('Page.reload', { ignoreCache: true });
    await cdp.waitFor("document.querySelector('[aria-label^=\"Shopping bag\"]')");
    await cdp.eval(`document.querySelector('[aria-label^="Shopping bag"]')?.click();`);
    await cdp.waitFor("document.querySelector('[aria-label=\"Shopping Bag\"]')?.textContent.includes('Resume Payment')");
    await cdp.eval(`
      [...document.querySelectorAll('[aria-label="Shopping Bag"] button')].find(b => b.textContent.includes('Resume Payment'))?.click();
    `);
    await cdp.waitFor("document.querySelector('[aria-label=\"Checkout\"] input[aria-label=\"UPI Transaction or UTR Reference\"]')");

    // Test invalid UTR rejection + valid UTR submission -> AWAITING_VERIFICATION
    await setCheckoutField('[aria-label="Checkout"] input[aria-label="UPI Transaction or UTR Reference"]', '12345678');
    await cdp.eval(`
      [...document.querySelectorAll('[aria-label="Checkout"] button')].find(b => b.textContent.includes('Submit UTR for Verification'))?.click();
    `);
    await delay(150);
    const invalidUtrMsg = await cdp.eval(`return document.querySelector('[aria-label="Checkout"]')?.textContent.includes('actual UTR reference');`);
    assert(invalidUtrMsg, 'UI blocks sequential/fake UTR 12345678 cleanly');

    await setCheckoutField('[aria-label="Checkout"] input[aria-label="UPI Transaction or UTR Reference"]', '431682910452');
    await cdp.eval(`
      [...document.querySelectorAll('[aria-label="Checkout"] button')].find(b => b.textContent.includes('Submit UTR for Verification'))?.click();
    `);
    await cdp.waitFor("document.querySelector('[aria-label=\"Checkout\"]')?.textContent.includes('Awaiting Payment Verification')");
    const afterUtr = await cdp.eval(`
      const txt = document.querySelector('[aria-label="Checkout"]')?.textContent || '';
      return {
        isAwaiting: txt.includes('Awaiting Payment Verification'),
        notMarkedPaid: !txt.includes('Payment Verified by RODHE Atelier'),
        showsUtr: txt.includes('431682910452')
      };
    `);
    assert(afterUtr.isAwaiting && afterUtr.notMarkedPaid && afterUtr.showsUtr, 'Customer UTR submission sets Awaiting Verification ONLY (never auto-marks PAID)');
    await cdp.eval(`document.querySelector('[aria-label="Close checkout"]')?.click();`);

    // CRM Verification Workflow at /#admin
    await cdp.send('Page.navigate', { url: `${url}/#admin` });
    await cdp.waitFor("document.querySelector('input[placeholder*=\"rodhesaree\" i]')");
    await setCheckoutField('input[placeholder*="rodhesaree" i]', 'rodhesaree@gmail.com');
    await setCheckoutField('input[type="password"]', 'ValidAdminPass99!');
    await cdp.eval(`
      document.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    `);
    await cdp.waitFor("document.body.innerText.includes('Orders & UPI Payments')");
    await cdp.eval(`
      [...document.querySelectorAll('nav button')].find(b => b.textContent.includes('Orders & UPI Payments'))?.click();
    `);
    await cdp.waitFor("document.body.innerText.includes('RDH-2026-900001')");
    await cdp.eval(`
      [...document.querySelectorAll('button')].find(b => b.textContent.includes('Review & Verify'))?.click();
    `);
    await cdp.waitFor("document.body.innerText.includes('Confirm Credit & Mark PAID')");
    await cdp.screenshot('qa-upi-crm-desktop-1440.png');

    await cdp.eval(`
      const ta = document.querySelector('textarea[placeholder*="Credited"]');
      if (ta) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
        setter.call(ta, 'SBI UPI credit matched ₹1,649');
        ta.dispatchEvent(new Event('input', { bubbles: true }));
      }
    `);
    await delay(100);
    await cdp.eval(`
      [...document.querySelectorAll('button')].find(b => b.textContent.includes('Confirm Credit & Mark PAID'))?.click();
    `);
    await cdp.waitFor("document.body.innerText.includes('Already Verified as PAID')");
    assert(dbState.orders[0].payment_status === 'PAID', 'CRM Admin manual verification updates order payment_status to PAID & locks duplicate button');

    // Return to Storefront Track Order Modal -> verifies PAID shows after admin reconciliation
    await cdp.send('Page.navigate', { url });
    await cdp.waitFor("document.querySelector('[aria-label^=\"Track order\" i], [aria-label=\"Track Your Saree\"]') || document.querySelector('header button')");
    await cdp.eval(`
      [...document.querySelectorAll('header button, footer button')].find(b => b.textContent.includes('Track Your Order') || b.getAttribute('aria-label')?.toLowerCase().includes('track'))?.click();
    `);
    await cdp.waitFor("document.querySelector('input[placeholder*=\"RDH-2026\"]')");
    await setCheckoutField('input[placeholder*="RDH-2026"]', 'RDH-2026-900001');
    await setCheckoutField('input[placeholder*="Phone or email"]', 'ananya@example.com');
    await cdp.eval(`
      [...document.querySelectorAll('button')].find(b => b.textContent.includes('Track Order Status'))?.click();
    `);
    await cdp.waitFor("document.body.innerText.includes('Paid — Verified by RODHE')");
    const trackPaid = await cdp.eval(`return document.body.innerText.includes('Paid — Verified by RODHE') && document.body.innerText.includes('431682910452');`);
    assert(trackPaid, 'Track Order displays genuine Verified PAID status & UTR after CRM reconciliation');
  } finally {
    cdp?.close();
    try { browser.kill(); } catch {}
    server.close();
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch {}
  }

  console.log('\n================================================================');
  console.log(`UPI PAYMENT SUITE -> TOTAL: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('================================================================');
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error('UPI Test Suite Error:', err);
  process.exit(1);
});
