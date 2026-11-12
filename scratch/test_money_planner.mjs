import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import {
  calculateMoneyBatch,
  validateQuantityInput,
  parseRupeesToPaise,
  validateProfitPercentInput,
  formatPaiseCurrency,
  validateBatchForSave
} from '../src/utils/moneyPlannerCalc.js';
import {
  buildMoneyPlannerCsv,
  buildMoneyPlannerPdfBytes,
  sanitizeCsvTextCell
} from '../src/utils/moneyPlannerExports.js';
import {
  moneyPlannerService,
  createMemoryBatchRepository
} from '../src/services/moneyPlannerService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT, 'dist');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ARTIFACT_DIR = 'C:\\Users\\VARUN THEJ\\.gemini\\antigravity\\brain\\19b27903-4db7-4641-b286-e3f5c8aadb5a\\screenshots';

let passed = 0;
let failed = 0;

function assert(cond, label, detail = '') {
  if (cond) {
    passed++;
    console.log(`✅ PASS: ${label}${detail ? ` (${detail})` : ''}`);
  } else {
    failed++;
    console.error(`❌ FAIL: ${label}${detail ? ` (${detail})` : ''}`);
  }
}

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp'
};

function startStaticServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const reqUrl = (req.url || '/').split('?')[0];
      const safePath = reqUrl === '/' ? '/index.html' : reqUrl;
      let filePath = path.join(DIST_DIR, safePath);
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
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

function makeMockJwt(userId, email) {
  const b64u = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  return `${b64u({ alg: 'HS256', typ: 'JWT' })}.${b64u({
    sub: userId,
    email,
    role: 'authenticated',
    exp: Math.floor(Date.now() / 1000) + 7200
  })}.mock_sig`;
}

class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Map();
    this.ws.addEventListener('message', (event) => {
      const msg = JSON.parse(String(event.data));
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message || 'CDP error'));
        else resolve(msg.result);
      } else if (msg.method && this.listeners.has(msg.method)) {
        this.listeners.get(msg.method).forEach((cb) => cb(msg.params));
      }
    });
  }
  connect() {
    return new Promise((resolve, reject) => {
      this.ws.addEventListener('open', resolve, { once: true });
      this.ws.addEventListener('error', reject, { once: true });
    });
  }
  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.nextId++;
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  on(method, cb) {
    if (!this.listeners.has(method)) this.listeners.set(method, new Set());
    this.listeners.get(method).add(cb);
  }
  async eval(fnBody) {
    const res = await this.send('Runtime.evaluate', {
      expression: `(async () => { ${fnBody} })()`,
      awaitPromise: true,
      returnByValue: true
    });
    if (res.exceptionDetails) {
      throw new Error(res.exceptionDetails.exception?.description || 'Runtime eval exception');
    }
    return res.result?.value;
  }
  async waitFor(predicateExpr, timeoutMs = 10000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const ok = await this.eval(`return Boolean(${predicateExpr});`).catch(() => false);
      if (ok) return true;
      await delay(100);
    }
    throw new Error(`Timeout waiting for: ${predicateExpr}`);
  }
  async setViewport(width, height, mobile = false) {
    await this.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: mobile ? 2 : 1,
      mobile
    });
  }
  async screenshot(filename) {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
    const { data } = await this.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, filename), Buffer.from(data, 'base64'));
  }
  close() {
    try { this.ws.close(); } catch {}
  }
}

async function runTests() {
  // ==========================================================================
  // SUITE 1: Independent Calculation Engine & Mandatory Edge Cases
  // ==========================================================================
  console.log('\n--- Suite 1: Money Planner Calculation Engine ---');

  const worked = calculateMoneyBatch({
    quantity: 30,
    setupLines: [{ id: 's1', name: 'Initial investment', amount: '3000' }],
    perSareeLines: [
      { id: 'p1', name: 'Material', amount: '500' },
      { id: 'p2', name: 'Rolling', amount: '50' }
    ],
    profitPercent: '30'
  });

  assert(worked.setupTotalPaise === 300000, 'Mandatory worked example setup total = Rs 3,000.00');
  assert(worked.perSareeUnitTotalPaise === 55000, 'Mandatory worked example per-saree total = Rs 550.00');
  assert(worked.perSareeBatchTotalPaise === 1650000, 'Mandatory worked example per-saree batch = Rs 16,500.00');
  assert(worked.totalMoneyPaise === 1950000, 'Mandatory worked example total money = Rs 19,500.00');
  assert(worked.costOfOneSareePaise === 65000, 'Mandatory worked example cost per saree = Rs 650.00');
  assert(Math.abs(worked.breakdown[0].sharePercent - 76.9230769) < 0.001 && worked.breakdown[0].name === 'Material',
    'Sorted breakdown #1 is Material at 76.9230...%', worked.breakdown[0].sharePercent.toFixed(4));
  assert(worked.breakdown[0].isBiggestExpense === true && worked.breakdown[1].name === 'Initial investment',
    'Biggest expense highlights Material cleanly');
  assert(Math.abs(worked.breakdown[1].sharePercent - 15.3846153) < 0.001,
    'Initial investment share = 15.3846...%', worked.breakdown[1].sharePercent.toFixed(4));
  assert(Math.abs(worked.breakdown[2].sharePercent - 7.6923076) < 0.001 && worked.breakdown[2].name === 'Rolling',
    'Rolling share = 7.6923...%', worked.breakdown[2].sharePercent.toFixed(4));
  assert(worked.sellingPricePaise === 84500 && worked.profitPerSareePaise === 19500,
    '30% markup on cost Rs 650 -> selling price Rs 845.00, profit Rs 195.00');
  assert(
    worked.setupSharePerSareePaise === 10000 &&
    worked.markupBatchRevenuePaise === 2535000 &&
    worked.markupBatchProfitPaise === 585000,
    'Setup share per saree = Rs 100, Markup batch revenue = Rs 25,350, batch profit = Rs 5,850'
  );
  assert(
    worked.marginSupported &&
    worked.marginSellingPricePaise === 92857 &&
    worked.marginProfitPerSareePaise === 27857 &&
    worked.marginBatchRevenuePaise === 2785710 &&
    worked.marginBatchProfitPaise === 835710,
    '30% margin on selling price -> Rs 928.57 selling price, Rs 278.57 profit/saree, Rs 8,357.10 batch profit'
  );

  // Currency prefix normalization & invalid input guard (no bogus partial totals)
  assert(
    parseRupeesToPaise('₹ 1,500.50').paise === 150050 &&
    parseRupeesToPaise('Rs. 500').paise === 50000 &&
    parseRupeesToPaise('.50').paise === 50,
    'Parses ₹, Rs, commas, and leading decimals safely without silent zeroing'
  );
  const invalidQtyBatch = calculateMoneyBatch({
    quantity: '0',
    setupLines: [{ name: 'Setup', amount: '3000' }],
    perSareeLines: [{ name: 'Material', amount: '500' }]
  });
  assert(
    invalidQtyBatch.hasCalculationIssue &&
    invalidQtyBatch.totalMoneyPaise === 0 &&
    invalidQtyBatch.setupSharePercent === 0,
    'Invalid/zero quantity blocks misleading partial setup-only total'
  );
  const invalidLineBatch = calculateMoneyBatch({
    quantity: 30,
    setupLines: [{ name: 'Setup', amount: '3000' }],
    perSareeLines: [{ name: 'Material', amount: 'abc' }]
  });
  assert(
    invalidLineBatch.hasCalculationIssue && invalidLineBatch.totalMoneyPaise === 0,
    'Invalid expense line pauses total rather than silently undercounting'
  );
  const highMarkup = calculateMoneyBatch({
    quantity: 10,
    setupLines: [],
    perSareeLines: [{ name: 'Material', amount: '500' }],
    profitPercent: '100'
  });
  assert(
    highMarkup.sellingPricePaise === 100000 && !highMarkup.marginSupported,
    '100% markup doubles cost cleanly while guarding impossible 100% margin on price'
  );

  // Quantity = 1
  const q1 = calculateMoneyBatch({
    quantity: 1,
    setupLines: [{ name: 'Block setup', amount: '1200' }],
    perSareeLines: [{ name: 'Cotton', amount: '450' }]
  });
  assert(q1.totalMoneyPaise === 165000 && q1.costOfOneSareePaise === 165000, 'Quantity = 1 equals full setup + per-saree total');

  // No setup lines
  const noSetup = calculateMoneyBatch({
    quantity: 10,
    setupLines: [],
    perSareeLines: [{ name: 'Cotton', amount: '400' }]
  });
  assert(noSetup.setupTotalPaise === 0 && noSetup.totalMoneyPaise === 400000 && noSetup.costOfOneSareePaise === 40000,
    'No setup lines yields setup=0 and exact per-saree batch total');

  // No per-saree lines
  const noPerSaree = calculateMoneyBatch({
    quantity: 10,
    setupLines: [{ name: 'Dye vat', amount: '2500' }],
    perSareeLines: []
  });
  assert(noPerSaree.perSareeUnitTotalPaise === 0 && noPerSaree.totalMoneyPaise === 250000 && noPerSaree.costOfOneSareePaise === 25000,
    'No per-saree lines distributes setup across batch cleanly');

  // Zero total & all lines removed
  const zeroBatch = calculateMoneyBatch({ quantity: 30, setupLines: [], perSareeLines: [] });
  assert(zeroBatch.totalMoneyPaise === 0 && zeroBatch.costOfOneSareePaise === 0 && zeroBatch.setupSharePercent === 0 && zeroBatch.perSareeSharePercent === 0,
    'All lines removed -> zero total & zero percentage without division by zero');
  assert(zeroBatch.plainEnglishSummary === 'Add your first cost to see how much money you need.',
    'Zero total displays helpful plain-English prompt');

  // Decimal exactness & float drift prevention (0.10 + 0.20 = 0.30, not 0.30000000000000004)
  const dec = calculateMoneyBatch({
    quantity: 3,
    setupLines: [{ name: 'Sample', amount: '100.01' }],
    perSareeLines: [
      { name: 'Thread A', amount: '0.10' },
      { name: 'Thread B', amount: '0.20' }
    ]
  });
  assert(dec.perSareeUnitTotalPaise === 30 && dec.totalMoneyPaise === 10091 && dec.costOfOneSareePaise === 3364,
    'Decimal integer-paise arithmetic avoids 0.1+0.2 float drift and applies consistent half-up rounding');

  // Tie for biggest expense
  const tie = calculateMoneyBatch({
    quantity: 10,
    setupLines: [{ name: 'Wooden blocks', amount: '5000' }],
    perSareeLines: [{ name: 'Material', amount: '500' }]
  });
  assert(tie.biggestExpenseTieCount === 2 && tie.biggestExpenses.every((b) => b.isBiggestTie),
    'Tied highest expenses mark both items clearly as tie');

  // Duplicate custom cost names allowed independently
  const dups = calculateMoneyBatch({
    quantity: 5,
    setupLines: [],
    perSareeLines: [
      { name: 'Dyeing', amount: '100' },
      { name: 'Dyeing', amount: '150' }
    ]
  });
  assert(dups.perSareeLines.length === 2 && dups.perSareeUnitTotalPaise === 25000,
    'Duplicate cost names preserved independently in calculations');

  // Input validation edge cases
  assert(!validateQuantityInput('').valid && validateQuantityInput('').error === 'Please enter a number.', 'Empty quantity rejected cleanly');
  assert(!validateQuantityInput('0').valid && validateQuantityInput('0').error === 'Quantity must be at least 1.', 'Zero quantity rejected');
  assert(!validateQuantityInput('-4').valid, 'Negative quantity rejected');
  assert(!validateQuantityInput('30.5').valid, 'Decimal quantity rejected');
  assert(!parseRupeesToPaise('-10').valid, 'Negative amount rejected');
  assert(!parseRupeesToPaise('12.345').valid, 'More than 2 decimal places rejected');
  assert(!parseRupeesToPaise('abc').valid, 'Non-numeric amount rejected');
  assert(parseRupeesToPaise('').paise === 0, 'Empty amount safely normalized to 0 paise');
  assert(validateProfitPercentInput('0').basisPoints === 0 && validateProfitPercentInput('0').valid, 'Zero profit % allowed');
  assert(!validateProfitPercentInput('-10').valid, 'Negative profit % rejected');

  // Large valid value & Indian grouping formatting
  const large = calculateMoneyBatch({
    quantity: 1000,
    setupLines: [{ name: 'Setup', amount: '123456.50' }],
    perSareeLines: [{ name: 'Cloth', amount: '1000' }]
  });
  assert(formatPaiseCurrency(12345650, { symbol: 'Rs ' }) === 'Rs 1,23,456.50' && large.totalMoneyPaise === 112345650,
    'Large values calculate safely & format in Indian grouping (Rs 1,23,456.50)');
  assert(!formatPaiseCurrency(-100).includes('-'), 'Currency formatter never outputs negative zero or negative display');

  // ==========================================================================
  // SUITE 2: CSV Formula Injection Protection & Vector PDF Generation
  // ==========================================================================
  console.log('\n--- Suite 2: CSV & Multi-Page PDF Exports ---');

  assert(sanitizeCsvTextCell('=CMD(1)').startsWith("'="), 'Formula injection leading = neutralized cleanly', sanitizeCsvTextCell('=CMD(1)'));
  assert(sanitizeCsvTextCell('  +SUM(A1:A2)').startsWith("'  +"), 'Leading-space + formula neutralized safely');
  assert(sanitizeCsvTextCell('@import').startsWith("'@"), 'Leading @ formula neutralized safely');

  const csvOut = buildMoneyPlannerCsv({
    batchName: '=TestBatch',
    quantity: 30,
    setupLines: [{ name: 'Initial investment', amount: '3000' }],
    perSareeLines: [
      { name: 'Material', amount: '500' },
      { name: 'Rolling', amount: '50' }
    ],
    profitPercent: '30'
  });
  assert(
    csvOut.includes("'=TestBatch") &&
    csvOut.includes(',15000.00,76.92') &&
    csvOut.includes('19500.00') &&
    csvOut.includes('5850.00') &&
    csvOut.includes('928.57') &&
    csvOut.includes('8357.10'),
    'CSV neutralizes batch formula injection, preserves numeric amounts, markup, margin & batch profits'
  );

  const pdfSingle = buildMoneyPlannerPdfBytes({
    batchName: 'December Mulmul Collection',
    quantity: 30,
    setupLines: [{ name: 'Initial investment', amount: '3000' }],
    perSareeLines: [
      { name: 'Material', amount: '500' },
      { name: 'Rolling', amount: '50' }
    ],
    profitPercent: '30'
  });
  const pdfTextSingle = Buffer.from(pdfSingle).toString('latin1');
  assert(pdfTextSingle.startsWith('%PDF-1.4') && pdfTextSingle.endsWith('%%EOF'), 'PDF starts with %PDF-1.4 and ends with valid %%EOF');
  assert(
    pdfTextSingle.includes('December Mulmul Collection') &&
    pdfTextSingle.includes('Rs 19,500.00') &&
    pdfTextSingle.includes('Rs 650.00') &&
    pdfTextSingle.includes('[BIGGEST EXPENSE]') &&
    pdfTextSingle.includes('Rs 845.00') &&
    pdfTextSingle.includes('Rs 928.57') &&
    pdfTextSingle.includes('Rs 8,357.10'),
    'PDF embeds RODHE summary, Rs totals, Biggest Expense highlight, markup & margin selling prices'
  );
  assert(!pdfTextSingle.includes('rodhesaree@gmail.com') && !pdfTextSingle.includes('11111111-1111'),
    'PDF excludes internal admin email and UUIDs');

  // Long batch multi-page PDF check (45 expense lines)
  const manyLines = Array.from({ length: 45 }, (_, i) => ({ name: `Block Dye Stage ${i + 1}`, amount: '12.50' }));
  const pdfMulti = buildMoneyPlannerPdfBytes({
    batchName: 'Ultra Long Heritage Collection Batch Name Spanning Multiple Lines For Wrapping Test',
    quantity: 25,
    setupLines: manyLines.slice(0, 20),
    perSareeLines: manyLines.slice(20)
  });
  const pdfTextMulti = Buffer.from(pdfMulti).toString('latin1');
  assert(
    pdfTextMulti.includes('Page 1 of ') &&
    pdfTextMulti.includes('Page 2 of ') &&
    !pdfTextMulti.includes('Page 1 of 1') &&
    pdfTextMulti.includes('Block Dye Stage 45'),
    'Long batch gracefully paginates across multiple pages without truncation'
  );

  // ==========================================================================
  // SUITE 3: Migration Security Audit + Organization Isolation & Concurrency
  // ==========================================================================
  console.log('\n--- Suite 3: Migration Security & Service Integration ---');

  const sql = fs.readFileSync(path.join(ROOT, 'supabase', 'migrations', '20261112_crm_money_planner.sql'), 'utf8');
  assert(sql.includes('current_admin_org_id()') && sql.includes('SET search_path = public, pg_temp'),
    'SQL derives organization server-side and hardens search_path');
  assert(sql.includes('ENABLE ROW LEVEL SECURITY') && sql.includes('REVOKE ALL ON public.money_batches FROM PUBLIC, anon'),
    'SQL enables RLS and revokes anonymous grants on Money Planner tables');
  assert(sql.includes('ON DELETE CASCADE') && sql.includes('p_expected_updated_at'),
    'SQL configures cascading deletes and optimistic concurrency check');

  const repo = createMemoryBatchRepository();
  const orgASession = { id: 'admin-a', email: 'rodhesaree@gmail.com', role: 'super_admin', organizationId: 'org-rodhe-a' };
  const orgBSession = { id: 'admin-b', email: 'other@boutique.in', role: 'super_admin', organizationId: 'org-other-b' };

  // Unauthenticated access rejected
  let unauthRejected = false;
  try {
    await moneyPlannerService.listBatches({ _testRepo: repo, _testSession: null });
  } catch {
    unauthRejected = true;
  }
  assert(unauthRejected, 'Unauthenticated listBatches rejected');

  // Create batch -> Server recomputes totals even if draft had tampered props
  const created = await moneyPlannerService.saveBatch({
    name: 'December Mulmul Collection',
    quantity: '30',
    profitPercent: '30',
    totalMoneyNeeded: 999999,
    setupLines: [{ name: 'Initial investment', amount: '3000' }],
    perSareeLines: [{ name: 'Material', amount: '500' }, { name: 'Rolling', amount: '50' }]
  }, { _testRepo: repo, _testSession: orgASession });

  assert(created.totalMoneyNeeded === 19500 && created.costPerSaree === 650 && created.estimatedSellingPrice === 845,
    'Service/repository ignores tampered client totals and recomputes authoritative totals');

  // Cross-organization isolation check
  const orgBList = await moneyPlannerService.listBatches({ _testRepo: repo, _testSession: orgBSession });
  let crossOrgGetBlocked = false;
  try {
    await moneyPlannerService.getBatch(created.id, { _testRepo: repo, _testSession: orgBSession });
  } catch {
    crossOrgGetBlocked = true;
  }
  let crossOrgDeleteBlocked = false;
  try {
    await moneyPlannerService.deleteBatch(created.id, { _testRepo: repo, _testSession: orgBSession });
  } catch {
    crossOrgDeleteBlocked = true;
  }
  assert(orgBList.totalCount === 0 && crossOrgGetBlocked && crossOrgDeleteBlocked,
    'Organization isolation prevents Org B from listing, opening, or deleting Org A batches');

  // Optimistic concurrency detection
  const tab1Copy = await moneyPlannerService.getBatch(created.id, { _testRepo: repo, _testSession: orgASession });
  const tab2Copy = await moneyPlannerService.getBatch(created.id, { _testRepo: repo, _testSession: orgASession });
  await moneyPlannerService.saveBatch({ ...tab1Copy, name: 'December Mulmul Rev 2' }, { _testRepo: repo, _testSession: orgASession });

  let conflictDetected = false;
  try {
    await moneyPlannerService.saveBatch({ ...tab2Copy, name: 'Stale Tab Edit' }, { _testRepo: repo, _testSession: orgASession });
  } catch (err) {
    conflictDetected = err.message.includes('updated elsewhere');
  }
  assert(conflictDetected, 'Stale concurrent update rejected with user-friendly refresh message');

  // Invalid save payload rejected cleanly
  const badSave = validateBatchForSave({ name: '', quantity: '0', setupLines: [], perSareeLines: [{ name: 'Bad', amount: '-5' }] });
  assert(!badSave.valid && badSave.errors.length >= 3, 'Save validator rejects blank name, zero qty, and negative line amount');

  // ==========================================================================
  // SUITE 4: Headless Chrome CDP E2E Tests (Desktop, Tablet & Mobile)
  // ==========================================================================
  console.log('\n--- Suite 4: Chrome Browser E2E Tests (Desktop, Tablet, Mobile) ---');

  const browserExe = fs.existsSync(CHROME_PATH) ? CHROME_PATH : EDGE_PATH;
  const userDataDir = fs.mkdtempSync(path.join(process.env.TEMP || '/tmp', 'rodhe-mp-e2e-'));
  const debugPort = 19722 + Math.floor(Math.random() * 400);
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
  const serverRepo = createMemoryBatchRepository();
  const browserAdminSession = { id: 'admin-uid-1', email: 'rodhesaree@gmail.com', role: 'super_admin', organizationId: '11111111-1111-4111-8111-111111111111' };
  let adminSignedIn = false;
  const consoleErrors = [];
  const pageExceptions = [];

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

    cdp.on('Runtime.consoleAPICalled', (params) => {
      if (params.type === 'error') {
        consoleErrors.push(params.args?.map((a) => a.value || a.description).join(' ') || 'console.error');
      }
    });
    cdp.on('Runtime.exceptionThrown', (params) => {
      pageExceptions.push(params.exceptionDetails?.exception?.description || 'exception');
    });

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

      if (reqUrl.includes('/auth/v1/token')) {
        adminSignedIn = true;
        return fulfillJson(200, {
          access_token: makeMockJwt('admin-uid-1', 'rodhesaree@gmail.com'),
          token_type: 'bearer',
          expires_in: 7200,
          refresh_token: 'mock-admin-refresh',
          user: { id: 'admin-uid-1', email: 'rodhesaree@gmail.com' }
        });
      }
      if (reqUrl.includes('/auth/v1/user')) {
        if (!adminSignedIn) return fulfillJson(401, { message: 'Not signed in' });
        return fulfillJson(200, { id: 'admin-uid-1', email: 'rodhesaree@gmail.com' });
      }
      if (reqUrl.includes('/rest/v1/rpc/is_admin')) {
        return fulfillJson(200, Boolean(adminSignedIn));
      }

      // Mock CRM read-only tables so AdminDashboard loads instantaneously
      if (reqUrl.includes('/rest/v1/products')) return fulfillJson(200, []);
      if (reqUrl.includes('/rest/v1/collections')) return fulfillJson(200, []);
      if (reqUrl.includes('/rest/v1/promotions')) return fulfillJson(200, []);
      if (reqUrl.includes('/rest/v1/enquiries')) return fulfillJson(200, []);
      if (reqUrl.includes('/rest/v1/store_settings')) return fulfillJson(200, []);
      if (reqUrl.includes('/rest/v1/homepage_config')) return fulfillJson(200, []);
      if (reqUrl.includes('/rest/v1/testimonials')) return fulfillJson(200, []);
      if (reqUrl.includes('/rest/v1/orders')) return fulfillJson(200, []);

      // Money Planner RPC endpoints backed by serverRepo with auth verification
      if (reqUrl.includes('/rest/v1/rpc/list_money_batches')) {
        if (!adminSignedIn) return fulfillJson(401, { code: '42501', message: 'Unauthorized' });
        const body = JSON.parse(request.postData || '{}');
        const data = await serverRepo.list({ search: body.p_search, page: body.p_page, pageSize: body.p_page_size, session: browserAdminSession });
        return fulfillJson(200, data);
      }
      if (reqUrl.includes('/rest/v1/rpc/get_money_batch')) {
        if (!adminSignedIn) return fulfillJson(401, { code: '42501', message: 'Unauthorized' });
        const body = JSON.parse(request.postData || '{}');
        try {
          const data = await serverRepo.get({ batchId: body.p_batch_id, session: browserAdminSession });
          return fulfillJson(200, data);
        } catch (err) {
          return fulfillJson(404, { code: err.code || 'P0002', message: err.message });
        }
      }
      if (reqUrl.includes('/rest/v1/rpc/save_money_batch_atomic')) {
        if (!adminSignedIn) return fulfillJson(401, { code: '42501', message: 'Unauthorized' });
        const body = JSON.parse(request.postData || '{}');
        const validation = validateBatchForSave({
          name: body.p_name,
          quantity: body.p_quantity,
          profitPercent: body.p_profit_percent,
          setupLines: (body.p_lines || []).filter((l) => l.kind === 'setup'),
          perSareeLines: (body.p_lines || []).filter((l) => l.kind === 'per_saree')
        });
        try {
          const data = await serverRepo.save({
            batchId: body.p_batch_id || null,
            payload: validation.payload,
            expectedUpdatedAt: body.p_expected_updated_at || null,
            session: browserAdminSession
          });
          return fulfillJson(200, data);
        } catch (err) {
          return fulfillJson(err.code === '40001' ? 409 : 400, { code: err.code, message: err.message });
        }
      }
      if (reqUrl.includes('/rest/v1/rpc/delete_money_batch')) {
        if (!adminSignedIn) return fulfillJson(401, { code: '42501', message: 'Unauthorized' });
        const body = JSON.parse(request.postData || '{}');
        try {
          const data = await serverRepo.remove({ batchId: body.p_batch_id, session: browserAdminSession });
          return fulfillJson(200, data);
        } catch (err) {
          return fulfillJson(404, { code: err.code, message: err.message });
        }
      }

      return cdp.send('Fetch.continueRequest', { requestId }).catch(() => {});
    });

    const setField = async (selector, value) => {
      await cdp.eval(`
        const el = document.querySelector(${JSON.stringify(selector)});
        if (el) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(el, ${JSON.stringify(value)});
          el.dispatchEvent(new Event('input', { bubbles: true }));
        }
      `);
      await delay(30);
    };

    // 1. Navigate to #admin logged out -> Verify Money Planner is inaccessible
    await cdp.setViewport(1440, 900, false);
    await cdp.send('Page.navigate', { url: `${url}/#admin` });
    await cdp.waitFor("document.querySelector('input[type=\"password\"]')");
    const loggedOutCheck = await cdp.eval(`return !document.body.innerText.includes('How many sarees are you making?');`);
    assert(loggedOutCheck, 'Unauthenticated visitor on /#admin cannot access Money Planner');

    // 2. Sign in to Admin CRM -> Click Money Planner sidebar item
    await setField('input[placeholder*="rodhesaree" i]', 'rodhesaree@gmail.com');
    await setField('input[type="password"]', 'ValidAdminPass99!');
    await cdp.eval(`
      document.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    `);
    await cdp.waitFor("document.body.innerText.includes('Money Planner')");
    await cdp.eval(`
      [...document.querySelectorAll('nav button')].find(b => b.textContent.includes('Money Planner'))?.click();
    `);
    await cdp.waitFor("document.querySelector('#mp-batch-name')");

    // 3. Enter mandatory batch example live in UI (no Calculate button)
    await setField('#mp-batch-name', 'December Mulmul Collection');
    await setField('input[aria-label="Setup cost amount 1"]', '3000');
    await setField('input[aria-label="Per-saree cost amount 1"]', '500');
    await setField('input[aria-label="Per-saree cost amount 2"]', '50');
    await delay(100);

    const liveExample = await cdp.eval(`
      const total = document.querySelector('[data-testid="total-money-needed"]')?.textContent || '';
      const perSaree = document.querySelector('[data-testid="cost-of-one-saree"]')?.textContent || '';
      const sentence = document.querySelector('[data-testid="plain-english-summary"]')?.textContent || '';
      const hasChart = Boolean(document.querySelector('svg[aria-label="Expense breakdown chart"]'));
      const text = document.body.innerText;
      return { total, perSaree, sentence, hasChart, hasBiggest: text.includes('Biggest expense'), hasSplit: text.includes('Setup money:') && text.includes('Per-saree money:') };
    `);
    assert(
      liveExample.total.includes('19,500.00') &&
      liveExample.perSaree.includes('650.00') &&
      liveExample.sentence.includes('To make 30 sarees') &&
      liveExample.hasChart &&
      liveExample.hasBiggest &&
      liveExample.hasSplit,
      'Live Money Planner updates results, SVG chart, Biggest expense & split immediately without Calculate button'
    );

    // 4. Expand collapsed selling price calculator & test 30%
    const collapsedByDefault = await cdp.eval(`return !document.querySelector('#mp-profit-percent');`);
    assert(collapsedByDefault, '"Want to see a selling price?" section starts collapsed by default');

    await cdp.eval(`
      [...document.querySelectorAll('button')].find(b => b.textContent.includes('Want to see a selling price?'))?.click();
    `);
    await cdp.waitFor("document.querySelector('#mp-profit-percent')");
    await setField('#mp-profit-percent', '30');
    const sellingResult = await cdp.eval(`return document.querySelector('[data-testid="selling-price-result"]')?.textContent || '';`);
    const marginResult = await cdp.eval(`return document.querySelector('[data-testid="margin-selling-price-result"]')?.textContent || '';`);
    assert(
      sellingResult.includes('845.00') &&
      sellingResult.includes('195.00') &&
      sellingResult.includes('5,850.00') &&
      marginResult.includes('928.57') &&
      marginResult.includes('278.57') &&
      marginResult.includes('8,357.10'),
      'Selling price calculator renders BOTH Markup (₹845.00) and Margin (₹928.57) with batch profits'
    );

    // Check invalid qty pauses totals with "—" instead of showing setup-only ₹3,000, then restore 30
    await setField('#mp-batch-quantity', '');
    await delay(80);
    const blankQtyPaused = await cdp.eval(`
      return {
        total: document.querySelector('[data-testid="total-money-needed"]')?.textContent?.trim(),
        perSaree: document.querySelector('[data-testid="cost-of-one-saree"]')?.textContent?.trim()
      };
    `);
    assert(blankQtyPaused.total === '—' && blankQtyPaused.perSaree === '—', 'Cleared quantity pauses results with "—" instead of partial Rs 3,000');
    await setField('#mp-batch-quantity', '30');
    await delay(80);

    await cdp.screenshot('qa-money-planner-desktop-1440.png');

    // 5. Save Batch -> verify persisted & unsaved badge cleared
    await cdp.eval(`
      [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Save batch')?.click();
    `);
    await cdp.waitFor("document.body.innerText.includes('Saved batches (1)')");
    const savedState = await cdp.eval(`return document.body.innerText.includes('December Mulmul Collection') && !document.body.innerText.includes('Unsaved changes');`);
    assert(savedState, 'Save batch persists to server & shows in Saved batches list cleanly');

    // 6. Test Quick-Add chip cooldown & add custom line -> verify Unsaved Changes guard on CRM tab navigation
    await cdp.eval(`
      const chip = [...document.querySelectorAll('button')].find(b => b.textContent.includes('+ Labour'));
      chip?.click();
      chip?.click();
    `);
    await delay(100);
    const chipCountAfterRapid = await cdp.eval(`return [...document.querySelectorAll('input[aria-label^="Per-saree cost name"]')].filter(i => i.value === 'Labour').length;`);
    assert(chipCountAfterRapid === 1, 'Rapid repeated chip taps prevented accidental duplicate insertion (count=1)');

    // Try navigating to Overview while unsaved changes exist -> verify prompt & Stay on this page
    await cdp.eval(`
      [...document.querySelectorAll('nav button')].find(b => b.textContent.includes('Overview'))?.click();
    `);
    await cdp.waitFor("document.querySelector('[aria-label=\"Unsaved batch changes confirmation\"]')");
    const stayedOnPlanner = await cdp.eval(`
      [...document.querySelectorAll('[aria-label="Unsaved batch changes confirmation"] button')].find(b => b.textContent.includes('Stay on this page'))?.click();
      return Boolean(document.querySelector('#mp-batch-name'));
    `);
    assert(stayedOnPlanner, 'Unsaved changes prompt intercepts CRM navigation and lets owner stay cleanly');

    // Discard edits via "Open" saved batch -> Confirm Open replaces lines cleanly
    await cdp.eval(`
      [...document.querySelectorAll('article button')].find(b => b.textContent.trim() === 'Open')?.click();
    `);
    await cdp.waitFor("document.querySelector('[aria-label=\"Unsaved batch changes confirmation\"]')");
    await cdp.eval(`
      [...document.querySelectorAll('[aria-label="Unsaved batch changes confirmation"] button')].find(b => b.textContent.includes('Discard changes'))?.click();
    `);
    await delay(150);

    // 7. Test Use as template creates NEW unsaved copy without altering original
    await cdp.eval(`
      [...document.querySelectorAll('article button')].find(b => b.textContent.includes('Use as template'))?.click();
    `);
    await delay(150);
    const templateState = await cdp.eval(`
      return {
        nameVal: document.querySelector('#mp-batch-name')?.value,
        hasBadge: document.body.innerText.includes('New batch from template'),
        totalBatches: document.body.innerText.includes('Saved batches (1)')
      };
    `);
    assert(templateState.nameVal === 'December Mulmul Collection (Copy)' && templateState.hasBadge && templateState.totalBatches,
      'Use as template opens new editable batch copy without modifying saved original');

    // Save template batch too -> now 2 batches exist -> test Search batches...
    await cdp.eval(`
      [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Save batch')?.click();
    `);
    await cdp.waitFor("document.body.innerText.includes('Saved batches (2)')");
    await setField('input[aria-label="Search batches"]', 'Copy');
    await cdp.waitFor("document.body.innerText.includes('Saved batches (1)')");
    assert(true, 'Search batches filters saved batches cleanly');
    await setField('input[aria-label="Search batches"]', '');
    await cdp.waitFor("document.body.innerText.includes('Saved batches (2)')");

    // 8. Test Delete cancellation & confirmation
    await cdp.eval(`
      [...document.querySelectorAll('article button')].find(b => b.textContent.includes('Delete'))?.click();
    `);
    await cdp.waitFor("document.querySelector('[aria-label=\"Confirm delete batch\"]')");
    await cdp.eval(`
      [...document.querySelectorAll('[aria-label="Confirm delete batch"] button')].find(b => b.textContent.includes('Cancel'))?.click();
    `);
    await delay(100);
    assert(await cdp.eval(`return document.body.innerText.includes('Saved batches (2)');`), 'Canceling Delete keeps batch intact');

    await cdp.eval(`
      [...document.querySelectorAll('article button')].find(b => b.textContent.includes('Delete'))?.click();
    `);
    await cdp.waitFor("document.querySelector('[aria-label=\"Confirm delete batch\"]')");
    await cdp.eval(`
      [...document.querySelectorAll('[aria-label="Confirm delete batch"] button')].find(b => b.textContent.includes('Confirm delete'))?.click();
    `);
    await cdp.waitFor("document.body.innerText.includes('Saved batches (1)')");
    assert(true, 'Confirming Delete permanently removes selected batch');

    // 9. Test PDF & CSV export triggers cleanly inside browser
    const exportsTriggered = await cdp.eval(`
      const downloaded = [];
      const origCreate = URL.createObjectURL;
      const origClick = HTMLAnchorElement.prototype.click;
      URL.createObjectURL = (blob) => {
        downloaded.push({ type: blob.type, size: blob.size });
        return origCreate.call(URL, blob);
      };
      HTMLAnchorElement.prototype.click = function() {
        downloaded.push({ filename: this.getAttribute('download') });
      };
      [...document.querySelectorAll('button')].find(b => b.textContent.includes('Download PDF'))?.click();
      [...document.querySelectorAll('button')].find(b => b.textContent.includes('Download Excel/CSV'))?.click();
      URL.createObjectURL = origCreate;
      HTMLAnchorElement.prototype.click = origClick;
      return downloaded;
    `);
    assert(
      exportsTriggered.some((d) => d.type === 'application/pdf' && d.size > 500) &&
      exportsTriggered.some((d) => String(d.filename || '').endsWith('.pdf')) &&
      exportsTriggered.some((d) => String(d.type || '').includes('text/csv') && d.size > 100) &&
      exportsTriggered.some((d) => String(d.filename || '').endsWith('.csv')),
      'Download PDF and Download Excel/CSV both generate valid non-empty downloads'
    );

    // 10. Responsive tablet (768x1024) & mobile (375x812) geometry + top results check
    await cdp.setViewport(768, 1024, true);
    await delay(200);
    const tabletOverflow = await cdp.eval(`return document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;`);
    assert(!tabletOverflow, 'Money Planner has zero horizontal overflow at 768x1024 tablet');
    await cdp.screenshot('qa-money-planner-tablet-768.png');

    await cdp.setViewport(375, 812, true);
    await delay(200);
    const mobileGeo = await cdp.eval(`
      const overflow = document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
      const resultsTop = document.querySelector('.money-planner-results-col')?.getBoundingClientRect().top ?? 9999;
      const inputsTop = document.querySelector('.money-planner-inputs-col')?.getBoundingClientRect().top ?? 0;
      return { overflow, resultsAboveInputs: resultsTop < inputsTop };
    `);
    assert(!mobileGeo.overflow && mobileGeo.resultsAboveInputs,
      'Money Planner at 375x812 mobile places Results Summary ABOVE inputs with zero horizontal overflow');
    await cdp.screenshot('qa-money-planner-mobile-375.png');

    assert(consoleErrors.length === 0, 'Zero console errors during Money Planner browser workflow', consoleErrors.join(' | '));
    assert(pageExceptions.length === 0, 'Zero uncaught exceptions during Money Planner browser workflow', pageExceptions.join(' | '));
  } finally {
    cdp?.close();
    try { browser.kill(); } catch {}
    server.close();
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch {}
  }

  console.log('\n================================================================');
  console.log(`MONEY PLANNER TEST SUITE -> TOTAL: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('================================================================');
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error('Money Planner Suite Error:', err);
  process.exit(1);
});
