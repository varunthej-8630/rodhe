import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, '../dist');
const SCREENSHOT_DIR = path.resolve(
  'C:/Users/VARUN THEJ/.gemini/antigravity/brain/19b27903-4db7-4641-b286-e3f5c8aadb5a/screenshots'
);
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

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
  '.xml': 'application/xml; charset=utf-8',
  '.woff2': 'font/woff2'
};

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

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
          try { fn(msg.params); } catch (err) { console.error('CDP listener error:', err); }
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
    await this.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile
    });
    await delay(220);
  }

  async screenshot(filename, { fullPage = false } = {}) {
    const params = { format: 'png' };
    if (fullPage) {
      const metrics = await this.send('Page.getLayoutMetrics');
      const contentSize = metrics.cssContentSize || metrics.contentSize;
      params.clip = {
        x: 0,
        y: 0,
        width: contentSize.width,
        height: Math.min(contentSize.height, 9000),
        scale: 1
      };
      params.captureBeyondViewport = true;
    }
    const { data } = await this.send('Page.captureScreenshot', params);
    const outPath = path.join(SCREENSHOT_DIR, filename);
    fs.writeFileSync(outPath, Buffer.from(data, 'base64'));
    return outPath;
  }

  async goto(targetUrl, readySelector = 'footer') {
    await this.send('Page.navigate', { url: targetUrl });
    await delay(250);
    await this.waitFor(
      `document.readyState !== 'loading' && Boolean(document.querySelector('${readySelector}')) && !document.body.innerText.includes('Loading RODHE') && !document.body.innerText.includes('Loading RODHE Admin Portal')`,
      15000
    );
    await this.eval(`document.getElementById('rodhe-skip-btn')?.click();`);
    await delay(350);
  }

  close() {
    try { this.ws.close(); } catch {}
  }
}

const VIEWPORTS = [
  // Mobile
  { name: 'mobile-320', width: 320, height: 568, mobile: true, capture: true },
  { name: 'mobile-360', width: 360, height: 800, mobile: true, capture: false },
  { name: 'mobile-375', width: 375, height: 812, mobile: true, capture: true },
  { name: 'mobile-390', width: 390, height: 844, mobile: true, capture: false },
  { name: 'mobile-414', width: 414, height: 896, mobile: true, capture: false },
  { name: 'mobile-430', width: 430, height: 932, mobile: true, capture: true },
  // Tablet
  { name: 'tablet-600', width: 600, height: 960, mobile: true, capture: false },
  { name: 'tablet-768', width: 768, height: 1024, mobile: true, capture: true },
  { name: 'tablet-820', width: 820, height: 1180, mobile: true, capture: false },
  { name: 'tablet-1024', width: 1024, height: 1366, mobile: false, capture: true },
  // Desktop
  { name: 'desktop-1280', width: 1280, height: 720, mobile: false, capture: false },
  { name: 'desktop-1366', width: 1366, height: 768, mobile: false, capture: false },
  { name: 'desktop-1440', width: 1440, height: 900, mobile: false, capture: true },
  { name: 'desktop-1600', width: 1600, height: 900, mobile: false, capture: false },
  { name: 'desktop-1920', width: 1920, height: 1080, mobile: false, capture: true }
];

async function runAuditQA() {
  const browserExe = fs.existsSync(CHROME_PATH) ? CHROME_PATH : EDGE_PATH;
  const userDataDir = fs.mkdtempSync(path.join(process.env.TEMP || '/tmp', 'rodhe-qa-'));
  const debugPort = 19422 + Math.floor(Math.random() * 400);
  const { server, url } = await startStaticServer();

  const browser = spawn(browserExe, [
    '--headless=new',
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${userDataDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding',
    '--window-size=1440,900',
    'about:blank'
  ], { stdio: 'ignore' });

  let cdp = null;
  let passed = 0;
  let failed = 0;
  const consoleErrors = [];
  const pageExceptions = [];
  const assetErrors = [];

  function assert(cond, label, detail = '') {
    if (cond) {
      console.log(`✅ PASS: ${label}${detail ? ` (${detail})` : ''}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${label}${detail ? ` — ${detail}` : ''}`);
      failed++;
    }
  }

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
    await cdp.send('Network.enable');

    cdp.on('Runtime.consoleAPICalled', (params) => {
      if (params.type === 'error') {
        const txt = (params.args || []).map((a) => a.value || a.description || '').join(' ');
        consoleErrors.push(txt);
      }
    });
    cdp.on('Runtime.exceptionThrown', (params) => {
      pageExceptions.push(params.exceptionDetails?.exception?.description || params.exceptionDetails?.text || 'Exception');
    });
    cdp.on('Network.responseReceived', (params) => {
      if (params.response.status >= 400 && params.response.url.startsWith(url)) {
        assetErrors.push(`${params.response.status} ${params.response.url}`);
      }
    });

    // Clear initial state and bypass intro
    await cdp.send('Page.navigate', { url });
    await cdp.waitFor("document.readyState === 'complete'");
    await cdp.eval(`
      localStorage.clear();
      sessionStorage.clear();
      sessionStorage.setItem('rodhe_intro_played', 'true');
    `);

    // ------------------------------------------------------------------------
    // QA 1: Cookie Consent Banner & Privacy-first Analytics
    // ------------------------------------------------------------------------
    console.log('\n--- QA 1: Cookie Consent Banner & Privacy-first Analytics ---');
    await cdp.goto(url);
    await cdp.setViewport(1440, 900, false);

    const initialConsent = await cdp.eval(`
      const banner = document.querySelector('[role="region"][aria-label="Cookie and storage preferences"]');
      const gaScript = document.getElementById('rodhe-ga4-script');
      return {
        hasBanner: Boolean(banner),
        text: banner ? banner.innerText : '',
        gaLoaded: Boolean(gaScript),
        stored: localStorage.getItem('rodhe_cookie_consent')
      };
    `);
    assert(initialConsent.hasBanner, 'Cookie Consent Banner shows on clean first visit');
    assert(!initialConsent.gaLoaded, 'GA4 script NOT loaded before consent or Measurement ID');
    assert(initialConsent.stored === null, 'No premature cookie consent stored before user choice');
    await cdp.screenshot('qa-desktop-1440-cookie-banner.png');

    // Open Manage Preferences, toggle Analytics on, Save Preferences
    await cdp.eval(`
      const btns = Array.from(document.querySelectorAll('[role="region"][aria-label="Cookie and storage preferences"] button'));
      btns.find((b) => (b.textContent || '').toLowerCase().includes('manage preferences'))?.click();
    `);
    await delay(250);
    await cdp.eval(`
      const toggle = document.querySelector('[role="dialog"][aria-label="Cookie and Privacy Preferences"] input[aria-label="Toggle optional analytics cookies"]');
      toggle?.click();
    `);
    await delay(150);
    await cdp.eval(`
      const btns = Array.from(document.querySelectorAll('[role="dialog"][aria-label="Cookie and Privacy Preferences"] button'));
      btns.find((b) => (b.textContent || '').toLowerCase().includes('save preferences'))?.click();
    `);
    await delay(250);

    const afterSave = await cdp.eval(`
      return {
        bannerVisible: Boolean(
          document.querySelector('[role="region"][aria-label="Cookie and storage preferences"]') ||
          document.querySelector('[role="dialog"][aria-label="Cookie and Privacy Preferences"]')
        ),
        stored: JSON.parse(localStorage.getItem('rodhe_cookie_consent') || 'null'),
        gaScriptLoaded: Boolean(document.getElementById('rodhe-ga4-script'))
      };
    `);
    assert(!afterSave.bannerVisible, 'Cookie banner hides cleanly after saving preferences');
    assert(afterSave.stored?.analytics === true && afterSave.stored?.essential === true, 'Cookie preference persisted to localStorage');
    assert(!afterSave.gaScriptLoaded, 'GA4 script does not load without configured Measurement ID even after opt-in');

    // Reload to confirm persistence, then reopen from Footer -> Reject Optional
    await cdp.goto(url);
    const afterReloadVisible = await cdp.eval(`return Boolean(document.querySelector('[role="region"][aria-label="Cookie and storage preferences"]'));`);
    assert(!afterReloadVisible, 'Cookie banner stays dismissed across page reload');

    await cdp.eval(`
      const btns = Array.from(document.querySelectorAll('footer button'));
      btns.find((b) => (b.textContent || '').toLowerCase().includes('cookie preferences'))?.click();
    `);
    await delay(250);
    const reopenedAndRejected = await cdp.eval(`
      const btns = Array.from(document.querySelectorAll('[role="dialog"][aria-label="Cookie and Privacy Preferences"] button'));
      const rejectBtn = btns.find((b) => (b.textContent || '').toLowerCase().includes('reject optional'));
      if (!rejectBtn) return { reopened: false };
      rejectBtn.click();
      return {
        reopened: true,
        stored: JSON.parse(localStorage.getItem('rodhe_cookie_consent') || 'null')
      };
    `);
    assert(reopenedAndRejected.reopened && reopenedAndRejected.stored?.analytics === false, 'Footer "Cookie Preferences" reopens preferences & saves Reject Optional');

    // ------------------------------------------------------------------------
    // QA 2: Favicon, Webmanifest, OG Share Image Asset Delivery
    // ------------------------------------------------------------------------
    console.log('\n--- QA 2: Favicon, Webmanifest & Open Graph Asset Checks ---');
    const assetPaths = [
      '/favicon.ico',
      '/favicon.svg',
      '/favicon-16x16.png',
      '/favicon-32x32.png',
      '/apple-touch-icon.png',
      '/android-chrome-192x192.png',
      '/android-chrome-512x512.png',
      '/site.webmanifest',
      '/assets/og-rodhe-share.jpg',
      '/robots.txt',
      '/sitemap.xml'
    ];
    for (const ap of assetPaths) {
      const resp = await fetch(`${url}${ap}`);
      assert(resp.status === 200, `Asset ${ap} returns HTTP 200`);
    }

    const headMeta = await cdp.eval(`
      const ogImg = document.querySelector('meta[property="og:image"]')?.getAttribute('content') || '';
      const ogType = document.querySelector('meta[property="og:type"]')?.getAttribute('content') || '';
      const twCard = document.querySelector('meta[name="twitter:card"]')?.getAttribute('content') || '';
      const hasIco = Boolean(document.querySelector('link[rel="icon"][href="/favicon.ico"]'));
      const hasApple = Boolean(document.querySelector('link[rel="apple-touch-icon"][href="/apple-touch-icon.png"]'));
      const hasManifest = Boolean(document.querySelector('link[rel="manifest"][href="/site.webmanifest"]'));
      return { ogImg, ogType, twCard, hasIco, hasApple, hasManifest };
    `);
    assert(headMeta.hasIco && headMeta.hasApple && headMeta.hasManifest, 'Head links favicon.ico, apple-touch-icon.png & site.webmanifest');
    assert(headMeta.ogImg.includes('og-rodhe-share.jpg'), 'og:image uses og-rodhe-share.jpg', headMeta.ogImg);
    assert(headMeta.ogType === 'website' && headMeta.twCard === 'summary_large_image', 'OG & Twitter card metadata valid');

    // ------------------------------------------------------------------------
    // QA 3: 15-Viewport Responsive Sweep + Screenshots + Hero CTA Fold Check
    // ------------------------------------------------------------------------
    console.log('\n--- QA 3: 15-Viewport Responsive Sweep (Mobile, Tablet, Desktop) ---');
    await cdp.goto(url);
    for (const vp of VIEWPORTS) {
      await cdp.setViewport(vp.width, vp.height, vp.mobile);
      const metrics = await cdp.eval(`
        const doc = document.documentElement;
        const hero = document.getElementById('rodhe-hero-section');
        const ctas = Array.from(hero ? hero.querySelectorAll('button') : []).filter((b) => {
          const r = b.getBoundingClientRect();
          const txt = (b.textContent || '').toLowerCase();
          return r.width > 0 && r.height > 0 && (txt.includes('explore') || txt.includes('concierge') || txt.includes('collection'));
        });
        const primaryCta = ctas.find((b) => {
          const txt = (b.textContent || '').toLowerCase();
          return txt.includes('explore collection') || txt.includes('explore');
        }) || ctas[0];
        const ctaRect = primaryCta ? primaryCta.getBoundingClientRect() : null;
        const imgs = Array.from(document.querySelectorAll('img')).filter((img) => {
          const st = getComputedStyle(img);
          return st.display !== 'none' && img.getAttribute('loading') !== 'lazy';
        });
        const brokenImgs = imgs.filter((img) => !img.complete || img.naturalWidth === 0).map((img) => img.src);
        const scrollCue = hero ? hero.querySelector('span[style*="writing-mode"], .hero-scroll-cue') : null;
        return {
          width: window.innerWidth,
          scrollWidth: doc.scrollWidth,
          clientWidth: doc.clientWidth,
          hasOverflow: doc.scrollWidth > doc.clientWidth + 1,
          ctaVisible: Boolean(ctaRect && ctaRect.top >= 0 && ctaRect.bottom <= window.innerHeight + 10),
          ctaBottom: ctaRect ? Math.round(ctaRect.bottom) : null,
          brokenImgs
        };
      `);
      assert(!metrics.hasOverflow, `Zero horizontal overflow at ${vp.width}x${vp.height}`, `scrollWidth=${metrics.scrollWidth}`);
      assert(metrics.ctaVisible, `Above-the-fold Hero CTA visible at ${vp.width}x${vp.height}`, `ctaBottom=${metrics.ctaBottom}`);
      assert(metrics.brokenImgs.length === 0, `Zero broken eager images at ${vp.width}x${vp.height}`, metrics.brokenImgs.join(','));
      if (vp.capture) {
        await cdp.screenshot(`qa-home-${vp.name}.png`);
      }
    }

    // ------------------------------------------------------------------------
    // QA 4: SEO Meta Uniqueness & Navigation Routes + 404 Page
    // ------------------------------------------------------------------------
    console.log('\n--- QA 4: SEO Meta Uniqueness, Subpages, Legal Tabs & Custom 404 ---');
    const routeChecks = [
      { key: 'home', path: `${url}/`, screenshot: null },
      { key: 'shop', path: `${url}/?page=shop`, screenshot: 'qa-desktop-1440-shop.png' },
      { key: 'craft-indigo', path: `${url}/?page=shop&craft=indigo`, screenshot: null },
      { key: 'product', path: `${url}/?page=product&id=nilambari-shibori-saree`, screenshot: 'qa-desktop-1440-pdp.png' },
      { key: 'story', path: `${url}/?page=story`, screenshot: null },
      { key: 'contact', path: `${url}/?page=contact`, screenshot: 'qa-desktop-1440-contact.png' },
      { key: 'privacy', path: `${url}/?page=policies&tab=privacy`, screenshot: null },
      { key: 'terms', path: `${url}/?page=policies&tab=terms`, screenshot: null },
      { key: 'not-found-path', path: `${url}/nonexistent-saree-page`, screenshot: 'qa-desktop-1440-404.png' },
      { key: 'not-found-query', path: `${url}/?page=does-not-exist`, screenshot: null }
    ];

    await cdp.setViewport(1440, 900, false);
    const seoCollected = {};
    for (const rc of routeChecks) {
      await cdp.goto(rc.path);
      const seo = await cdp.eval(`
        const title = document.title;
        const desc = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
        const robots = document.querySelector('meta[name="robots"]')?.getAttribute('content') || '';
        const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href') || '';
        const h1 = document.querySelector('h1')?.innerText?.trim() || '';
        const brokenImgs = Array.from(document.querySelectorAll('img'))
          .filter((img) => getComputedStyle(img).display !== 'none' && img.complete && img.naturalWidth === 0)
          .map((img) => img.src);
        return { title, desc, robots, canonical, h1, brokenImgs, overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1 };
      `);
      seoCollected[rc.key] = seo;
      assert(Boolean(seo.title) && Boolean(seo.desc), `Meta title & description populated on ${rc.key}`, seo.title);
      assert(Boolean(seo.canonical), `Canonical link set on ${rc.key}`, seo.canonical);
      assert(seo.brokenImgs.length === 0, `Zero broken images on ${rc.key}`);
      assert(!seo.overflow, `Zero horizontal overflow (1440px) on ${rc.key}`);
      if (rc.screenshot) {
        await cdp.screenshot(rc.screenshot);
      }
    }

    const indexableKeys = ['home', 'shop', 'craft-indigo', 'product', 'story', 'contact', 'privacy', 'terms'];
    const titles = indexableKeys.map((k) => seoCollected[k].title);
    const descs = indexableKeys.map((k) => seoCollected[k].desc);
    assert(new Set(titles).size === indexableKeys.length, 'All 8 indexable routes have unique <title> values');
    assert(new Set(descs).size === indexableKeys.length, 'All 8 indexable routes have unique <meta name="description"> values');

    // Verify 404 details & actions
    assert(
      seoCollected['not-found-path'].title.includes('404') &&
        seoCollected['not-found-path'].robots === 'noindex, nofollow',
      'Invalid URL pathname renders 404 title & noindex, nofollow robots directive'
    );
    assert(
      seoCollected['not-found-query'].title.includes('404') &&
        seoCollected['not-found-query'].robots === 'noindex, nofollow',
      'Invalid ?page= query renders 404 title & noindex, nofollow robots directive'
    );

    // Click "Browse Sarees" from 404 page
    await cdp.goto(`${url}/nonexistent-saree-page`);
    await cdp.eval(`
      const btn = Array.from(document.querySelectorAll('main button')).find((b) => (b.textContent || '').toLowerCase().includes('browse sarees'));
      btn?.click();
    `);
    await delay(400);
    const after404Browse = await cdp.eval(`return window.location.pathname + window.location.search + window.location.hash;`);
    assert(after404Browse.includes('collections') && after404Browse.startsWith('/'), '404 "Browse Sarees" button navigates cleanly to Atelier shop', after404Browse);

    // ------------------------------------------------------------------------
    // QA 5: Footer Policy Tab Sync & Privacy Policy Honesty Check
    // ------------------------------------------------------------------------
    console.log('\n--- QA 5: Footer Policy Links & Legal Content Accuracy ---');
    await cdp.goto(url);
    await cdp.eval(`
      const btn = Array.from(document.querySelectorAll('footer button')).find((b) => (b.textContent || '').trim() === 'Privacy Policy');
      btn?.click();
    `);
    await cdp.waitFor(`!document.body.innerText.includes('Loading RODHE') && (document.querySelector('main')?.textContent || '').includes('Privacy Policy & Browser Data Notice')`);
    await delay(150);
    const privacyCheck = await cdp.eval(`
      const mainText = document.querySelector('main')?.textContent || '';
      return {
        hasPrivacyHeading: mainText.includes('Privacy Policy & Browser Data Notice'),
        noPaymentGatewayFalsehood: !mainText.includes('RBI-authorized payment aggregators'),
        mentionsSupabaseAndWhatsApp: mainText.includes('Supabase') && mainText.includes('WhatsApp')
      };
    `);
    assert(privacyCheck.hasPrivacyHeading, 'Footer Privacy Policy link opens Privacy Policy tab directly');
    assert(privacyCheck.noPaymentGatewayFalsehood && privacyCheck.mentionsSupabaseAndWhatsApp, 'Privacy Policy accurately describes WhatsApp/Supabase without false gateway claim');

    await cdp.eval(`
      const btn = Array.from(document.querySelectorAll('footer button')).find((b) => (b.textContent || '').trim() === 'Terms of Service');
      btn?.click();
    `);
    await cdp.waitFor(`(document.querySelector('main')?.textContent || '').includes('Terms of Service')`);
    const termsHeading = await cdp.eval(`return Boolean((document.querySelector('main')?.textContent || '').includes('Terms of Service'));`);
    assert(termsHeading, 'Footer Terms of Service link opens Terms of Service tab directly');

    // ------------------------------------------------------------------------
    // QA 6: Contact Page Validation, Honest Location & Mobile Layout
    // ------------------------------------------------------------------------
    console.log('\n--- QA 6: Contact Concierge Validation & Mobile Subpages (375x812) ---');
    await cdp.goto(`${url}/?page=contact`);
    await cdp.eval(`
      const btn = document.querySelector('main form button[type="submit"]');
      btn?.click();
    `);
    await delay(250);
    const contactValidation = await cdp.eval(`return document.querySelector('main')?.innerText || '';`);
    assert(
      contactValidation.includes('Please enter your full name.') &&
        contactValidation.includes('Please enter a valid email address.') &&
        !contactValidation.includes('Jubilee Hills'),
      'Contact form validates empty fields & uses honest Digital Atelier location'
    );

    // Check key subpages at Mobile 375x812 and Tablet 768x1024 + Screenshots
    await cdp.setViewport(375, 812, true);
    await cdp.goto(`${url}/nonexistent-saree-page`);
    await cdp.screenshot('qa-mobile-375-404.png');
    await cdp.goto(`${url}/?page=shop`);
    await cdp.waitFor("Array.from(document.querySelectorAll('.product-image.primary')).slice(0, 2).every((img) => img.complete && img.naturalWidth > 0)");
    const shopMobileOverflow = await cdp.eval(`return document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;`);
    assert(!shopMobileOverflow, 'Zero overflow on Shop page at 375x812');
    await cdp.screenshot('qa-mobile-375-shop.png');

    await cdp.goto(`${url}/?page=product&id=nilambari-shibori-saree`);
    await delay(250);
    const pdpMobileCheck = await cdp.eval(`
      const bar = document.querySelector('.sticky-mobile-pdp-bar');
      const mainText = document.querySelector('main')?.innerText || '';
      return {
        stickyBarVisible: Boolean(bar && getComputedStyle(bar).display !== 'none'),
        noFakeReviewCount: !mainText.includes('patron reviews'),
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
      };
    `);
    assert(pdpMobileCheck.stickyBarVisible, 'Sticky mobile PDP bar visible when cookie consent saved');
    assert(pdpMobileCheck.noFakeReviewCount, 'PDP does not display unverified patron review count');
    assert(!pdpMobileCheck.overflow, 'Zero overflow on PDP at 375x812');
    await cdp.screenshot('qa-mobile-375-pdp.png');

    await cdp.goto(`${url}/?page=contact`);
    const contactMobileOverflow = await cdp.eval(`return document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;`);
    assert(!contactMobileOverflow, 'Zero overflow on Contact page at 375x812');
    await cdp.screenshot('qa-mobile-375-contact.png');

    // CRM Login page desktop + mobile check
    await cdp.setViewport(1440, 900, false);
    await cdp.send('Page.navigate', { url: `${url}/#admin` });
    await cdp.waitFor("document.querySelector('input[placeholder*=\"rodhesaree\" i], input[type=\"password\"]')", 15000);
    await delay(300);
    const crmDesktopCheck = await cdp.eval(`
      const robots = document.querySelector('meta[name="robots"]')?.getAttribute('content') || '';
      const overflow = document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
      return { robots, overflow };
    `);
    assert(crmDesktopCheck.robots === 'noindex, nofollow' && !crmDesktopCheck.overflow, 'CRM /#admin sets noindex, nofollow & fits desktop cleanly');
    await cdp.screenshot('qa-desktop-1440-crm-login.png');

    await cdp.setViewport(375, 812, true);
    await delay(250);
    const crmMobileOverflow = await cdp.eval(`return document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;`);
    assert(!crmMobileOverflow, 'CRM /#admin fits 375x812 mobile without overflow');
    await cdp.screenshot('qa-mobile-375-crm-login.png');

    // Tablet Shop capture at 768x1024
    await cdp.setViewport(768, 1024, true);
    await cdp.goto(`${url}/?page=shop`);
    const tabletShopOverflow = await cdp.eval(`return document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;`);
    assert(!tabletShopOverflow, 'Shop page fits 768x1024 tablet without overflow');
    await cdp.screenshot('qa-tablet-768-shop.png');

    // Mobile Modals/Drawers 360x740 & 320x568 check (CartDrawer, AuthModal, TrackOrderModal)
    await cdp.goto(url);
    for (const mvp of [{ width: 320, height: 568 }, { width: 360, height: 740 }]) {
      await cdp.setViewport(mvp.width, mvp.height, true);
      await delay(180);
      const docOver = await cdp.eval(`return document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;`);
      assert(!docOver, `Home has zero overflow at ${mvp.width}x${mvp.height}`);
    }

    // Open mobile hamburger menu -> Sign In -> AuthModal -> CartDrawer -> TrackOrderModal at 360x740
    await cdp.setViewport(360, 740, true);
    await cdp.eval(`document.querySelector('[aria-label="Open navigation menu"]')?.click();`);
    await cdp.waitFor("document.querySelector('.drawer-content.drawer-left')", 6000);
    await delay(150);
    const mobileMenuCheck = await cdp.eval(`
      const drawer = document.querySelector('.drawer-content.drawer-left');
      return { opened: Boolean(drawer), scrollW: drawer?.scrollWidth || 0, clientW: drawer?.clientWidth || 0 };
    `);
    assert(
      mobileMenuCheck.opened && mobileMenuCheck.scrollW <= mobileMenuCheck.clientW + 1,
      'Mobile nav drawer fits 360x740 without inner overflow',
      `scroll=${mobileMenuCheck.scrollW}/${mobileMenuCheck.clientW}`
    );

    await cdp.eval(`
      const btn = Array.from(document.querySelectorAll('.drawer-content.drawer-left button')).find((b) => (b.textContent || '').includes('Sign In'));
      btn?.click();
    `);
    await cdp.waitFor("document.querySelector('[role=\"dialog\"][aria-label=\"Customer Account\"]')", 6000);
    await delay(150);
    const authOpenCheck = await cdp.eval(`
      const dlg = document.querySelector('[role="dialog"][aria-label="Customer Account"]');
      const card = dlg?.firstElementChild;
      return { opened: Boolean(dlg), scrollW: card?.scrollWidth || 0, clientW: card?.clientWidth || 0 };
    `);
    assert(
      authOpenCheck.opened && authOpenCheck.scrollW <= authOpenCheck.clientW + 1,
      'AuthModal has zero inner horizontal overflow at 360x740',
      `scroll=${authOpenCheck.scrollW}/${authOpenCheck.clientW}`
    );
    await cdp.eval(`document.querySelector('[aria-label="Close account modal"]')?.click();`);
    await delay(180);

    // Add an item & inspect CartDrawer at 360x740
    await cdp.eval(`document.querySelector('.product-card .btn-ecommerce-add-to-cart')?.click();`);
    await cdp.waitFor("document.querySelector('[aria-label=\"Shopping Bag\"] .drawer-content')", 6000);
    await delay(420);
    const cartOpenCheck = await cdp.eval(`
      const backdrop = document.querySelector('[aria-label="Shopping Bag"]');
      const drawer = backdrop?.querySelector('.drawer-content');
      return {
        opened: Boolean(drawer),
        scrollW: Math.max(backdrop?.scrollWidth || 0, drawer?.scrollWidth || 0),
        clientW: drawer?.clientWidth || 0
      };
    `);
    assert(
      cartOpenCheck.opened && cartOpenCheck.scrollW <= cartOpenCheck.clientW + 1,
      'CartDrawer has zero inner horizontal overflow at 360x740',
      `scroll=${cartOpenCheck.scrollW}/${cartOpenCheck.clientW}`
    );
    await cdp.screenshot('qa-mobile-360-cartdrawer.png');
    await cdp.eval(`document.querySelector('[aria-label="Close shopping bag"]')?.click();`);
    await delay(180);

    // Open Track Order modal via Footer button at 360x740 & verify inner scrollWidth
    await cdp.eval(`
      const btn = Array.from(document.querySelectorAll('footer button')).find((b) => (b.textContent || '').trim().toLowerCase().includes('track'));
      btn?.click();
    `);
    await cdp.waitFor("document.querySelector('[aria-label=\"Close track order modal\"]')", 6000);
    await delay(150);
    const trackOpenCheck = await cdp.eval(`
      const closeBtn = document.querySelector('[aria-label="Close track order modal"]');
      const card = closeBtn?.closest('div[style*="maxHeight"]') || closeBtn?.parentElement?.parentElement;
      return { opened: Boolean(closeBtn), scrollW: card?.scrollWidth || 0, clientW: card?.clientWidth || 0 };
    `);
    assert(
      trackOpenCheck.opened && trackOpenCheck.scrollW <= trackOpenCheck.clientW + 1,
      'TrackOrderModal has zero inner horizontal overflow at 360x740',
      `scroll=${trackOpenCheck.scrollW}/${trackOpenCheck.clientW}`
    );
    await cdp.eval(`document.querySelector('[aria-label="Close track order modal"]')?.click();`);
    await delay(150);

    // Runtime Console & Exception & Asset Error assertions
    console.log('\n--- QA 7: Runtime Console Errors, Page Exceptions & Static Assets ---');
    assert(pageExceptions.length === 0, 'Zero unhandled JS exceptions during full audit', pageExceptions.join('; '));
    assert(assetErrors.length === 0, 'Zero local asset HTTP >=400 errors during full audit', assetErrors.join('; '));
    // Note: Supabase network errors inside sandboxed/local mode shouldn't fail unless unexpected runtime error
    const fatalConsoleErrors = consoleErrors.filter((m) => !m.includes('Failed to fetch') && !m.includes('ERR_NAME_NOT_RESOLVED'));
    assert(fatalConsoleErrors.length === 0, 'Zero unexpected console errors during full audit', fatalConsoleErrors.join(' | '));
  } finally {
    cdp?.close();
    try { browser.kill(); } catch {}
    server.close();
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch {}
  }

  console.log(`\n================================================================`);
  console.log(`AUDIT QA SUMMARY -> TOTAL: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log(`================================================================`);
  process.exit(failed > 0 ? 1 : 0);
}

runAuditQA().catch((err) => {
  console.error('QA Audit script crashed:', err);
  process.exit(1);
});
