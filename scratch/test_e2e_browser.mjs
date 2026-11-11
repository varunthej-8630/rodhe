import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, '../dist');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
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

  async waitFor(predicateJs, timeoutMs = 8000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      try {
        const ok = await this.eval(`return Boolean(${predicateJs});`);
        if (ok) return true;
      } catch {}
      await delay(120);
    }
    throw new Error(`Timed out waiting for: ${predicateJs}`);
  }

  async reloadAndReady(targetUrl = null) {
    if (targetUrl) {
      await this.send('Page.navigate', { url: targetUrl });
    } else {
      await this.send('Page.reload', { ignoreCache: true });
    }
    await delay(350);
    await this.waitFor("document.readyState !== 'loading' && Boolean(document.querySelector('[aria-label^=\"Shopping bag\"]'))", 15000);
    await this.eval(`document.getElementById('rodhe-skip-btn')?.click();`);
    await delay(350);
  }

  close() {
    try { this.ws.close(); } catch {}
  }
}

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function runBrowserE2E() {
  const browserExe = fs.existsSync(CHROME_PATH) ? CHROME_PATH : EDGE_PATH;
  const userDataDir = fs.mkdtempSync(path.join(process.env.TEMP || '/tmp', 'rodhe-e2e-'));
  const debugPort = 19222 + Math.floor(Math.random() * 500);
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
    '--disable-backgrounding-occluded-windows',
    '--window-size=1440,900',
    'about:blank'
  ], { stdio: 'ignore' });

  let cdp = null;
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

    if (!targets?.length) {
      throw new Error('Could not connect to headless browser CDP endpoint.');
    }

    const pageTarget = targets.find((t) => t.type === 'page') || targets[0];
    cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    await cdp.send('Page.navigate', { url });
    await cdp.waitFor("document.readyState === 'complete' && document.querySelector('[aria-label^=\"Shopping bag\"]')");
    await cdp.eval(`
      localStorage.removeItem('rodhe_cart');
      localStorage.removeItem('rodhe_wishlist');
      sessionStorage.setItem('rodhe_intro_played', 'true');
    `);
    await cdp.reloadAndReady();

    // ------------------------------------------------------------------------
    // TEST 1: Clean First-Visit State
    // ------------------------------------------------------------------------
    console.log('\n--- E2E Suite 1: Clean First Visit State ---');
    const initCheck = await cdp.eval(`
      return {
        cartLabel: document.querySelector('[aria-label^="Shopping bag"]')?.getAttribute('aria-label') || '',
        wishLabel: document.querySelector('[aria-label^="Favourites"]')?.getAttribute('aria-label') || '',
        legacyPii: localStorage.getItem('rodhe_patron_session')
      };
    `);
    assert(initCheck.cartLabel.includes('0 items'), 'Initial bag count is 0 on clean visit (no demo items)', initCheck.cartLabel);
    assert(initCheck.wishLabel.includes('0 items'), 'Initial favourites count is 0 on clean visit (no demo items)', initCheck.wishLabel);
    assert(initCheck.legacyPii === null, 'Insecure localStorage PII key purged cleanly');

    // ------------------------------------------------------------------------
    // TEST 2: Mobile & Responsive Navigation Geometry across 320..1440px
    // ------------------------------------------------------------------------
    console.log('\n--- E2E Suite 2: Mobile & Responsive Navigation Geometry ---');
    const viewports = [
      { w: 320, h: 640 },
      { w: 360, h: 740 },
      { w: 375, h: 812 },
      { w: 390, h: 844 },
      { w: 768, h: 1024 },
      { w: 1440, h: 900 }
    ];

    for (const vp of viewports) {
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: vp.w,
        height: vp.h,
        deviceScaleFactor: 1,
        mobile: vp.w < 768
      });
      await delay(200);

      const layoutReport = await cdp.eval(`
        const overflow = document.documentElement.scrollWidth > window.innerWidth;
        const logo = document.getElementById('header-brand-logo')?.getBoundingClientRect();
        const rightBtns = [...document.querySelectorAll('.header-right-col > button')]
          .filter(el => getComputedStyle(el).display !== 'none')
          .map(el => ({ label: el.getAttribute('aria-label'), r: el.getBoundingClientRect() }));
        const leftBtn = document.querySelector('.mobile-menu-trigger');
        const leftVisible = leftBtn && getComputedStyle(leftBtn).display !== 'none';
        const leftRect = leftVisible ? leftBtn.getBoundingClientRect() : null;

        let logoOverlap = false;
        for (const b of rightBtns) {
          if (logo && b.r.left < logo.right - 1) logoOverlap = true;
        }
        if (leftRect && logo && leftRect.right > logo.left + 1) logoOverlap = true;

        return {
          overflow,
          scrollWidth: document.documentElement.scrollWidth,
          logoOverlap,
          rightOutOfView: rightBtns.some(b => b.r.right > window.innerWidth + 1)
        };
      `);
      assert(!layoutReport.overflow, `Zero horizontal overflow at ${vp.w}x${vp.h}`, `scrollWidth=${layoutReport.scrollWidth}`);
      assert(!layoutReport.logoOverlap, `Header controls do not overlap brand logo at ${vp.w}x${vp.h}`);
      assert(!layoutReport.rightOutOfView, `Header right controls stay inside viewport at ${vp.w}x${vp.h}`);
    }

    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 1, mobile: true });
    await delay(200);

    await cdp.eval(`document.querySelector('[aria-label="Open navigation menu"]')?.click();`);
    await cdp.waitFor("document.querySelector('[aria-label=\"Mobile navigation menu\"]')");

    const mobileDrawerReport = await cdp.eval(`
      const dlg = document.querySelector('[aria-label="Mobile navigation menu"]');
      const closeBtn = document.querySelector('[aria-label="Close navigation menu"]')?.getBoundingClientRect();
      const drawerEl = dlg?.querySelector('.drawer-content')?.getBoundingClientRect();
      return {
        open: Boolean(dlg),
        bodyLocked: getComputedStyle(document.body).overflow === 'hidden',
        htmlLocked: getComputedStyle(document.documentElement).overflow === 'hidden',
        closeVisibleInTop: Boolean(closeBtn && closeBtn.top >= 0 && closeBtn.bottom <= 100),
        drawerWidthOk: Boolean(drawerEl && drawerEl.width <= 375 && drawerEl.height === 812)
      };
    `);
    assert(mobileDrawerReport.open, 'Mobile drawer opens on tap');
    assert(mobileDrawerReport.bodyLocked && mobileDrawerReport.htmlLocked, 'Background scroll locked cleanly when mobile menu is open');
    assert(mobileDrawerReport.closeVisibleInTop, 'Close button pinned cleanly in top drawer header');
    assert(mobileDrawerReport.drawerWidthOk, 'Mobile drawer occupies full height without overflow');

    await cdp.eval(`
      const btn = [...document.querySelectorAll('[aria-label="Mobile navigation menu"] button')]
        .find(b => b.textContent.includes('Our Craft & Story'));
      btn?.click();
    `);
    await delay(400);

    const afterMobileNav = await cdp.eval(`
      return {
        menuStillOpen: Boolean(document.querySelector('[aria-label="Mobile navigation menu"]')),
        unlocked: document.body.style.overflow === ''
      };
    `);
    assert(!afterMobileNav.menuStillOpen && afterMobileNav.unlocked, 'Mobile drawer closes and unlocks scroll on navigation');

    await cdp.eval(`document.getElementById('header-brand-container')?.click();`);
    await cdp.waitFor("document.querySelector('.btn-ecommerce-add-to-cart')");

    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await delay(250);

    // ------------------------------------------------------------------------
    // TEST 3: Cart Add, Quantity +/-, Min=1, Remove + UNDO Toast, Refresh Persist
    // ------------------------------------------------------------------------
    console.log('\n--- E2E Suite 3: Cart Workflow & Immediate Removal + Undo ---');
    await cdp.eval(`document.querySelectorAll('.btn-ecommerce-add-to-cart')[0]?.click();`);
    await cdp.waitFor("document.querySelector('[aria-label=\"Shopping Bag\"]')");

    const afterAddCart = await cdp.eval(`
      const bagDlg = document.querySelector('[aria-label="Shopping Bag"]');
      const decBtn = bagDlg?.querySelector('[aria-label="Decrease quantity"]');
      return {
        drawerOpen: Boolean(bagDlg),
        decDisabledAtOne: Boolean(decBtn?.disabled),
        title: bagDlg?.querySelector('.drawer-title')?.textContent || ''
      };
    `);
    assert(afterAddCart.drawerOpen && afterAddCart.title.includes('(1)'), 'Add to Cart opens bag drawer with count (1)', afterAddCart.title);
    assert(afterAddCart.decDisabledAtOne, 'Decrease button disabled at quantity 1 (cannot become 0 or negative)');

    await cdp.eval(`document.querySelector('[aria-label="Shopping Bag"] [aria-label="Increase quantity"]')?.click();`);
    await delay(200);
    const qtyTwoCheck = await cdp.eval(`
      return document.querySelector('[aria-label="Shopping Bag"] .drawer-title')?.textContent || '';
    `);
    assert(qtyTwoCheck.includes('(2)'), 'Increase quantity updates cart badge & drawer total to (2)', qtyTwoCheck);

    await cdp.eval(`document.querySelector('[aria-label="Shopping Bag"] [aria-label="Decrease quantity"]')?.click();`);
    await delay(200);

    await cdp.eval(`document.querySelector('[aria-label="Shopping Bag"] button[aria-label*="Remove "]')?.click();`);
    await cdp.waitFor("document.querySelector('.toast-container')");

    const removedAndToast = await cdp.eval(`
      const toastText = document.querySelector('.toast-container')?.innerText || '';
      const emptyVisible = document.querySelector('[aria-label="Shopping Bag"]')?.innerText.includes('Your Bag is Empty');
      const undoBtn = [...document.querySelectorAll('.toast-container button')].find(b => b.textContent.includes('Undo'));
      return {
        emptyVisible,
        hasRemovedToast: toastText.toLowerCase().includes('removed from your bag'),
        hasUndoBtn: Boolean(undoBtn)
      };
    `);
    assert(removedAndToast.emptyVisible && removedAndToast.hasRemovedToast && removedAndToast.hasUndoBtn,
      'Remove immediately clears item and presents Undo toast (zero modal confirm)');

    await cdp.eval(`[...document.querySelectorAll('.toast-container button')].find(b => b.textContent.includes('Undo'))?.click();`);
    await delay(250);

    const restoredCheck = await cdp.eval(`
      return {
        title: document.querySelector('[aria-label="Shopping Bag"] .drawer-title')?.textContent || '',
        lsCart: localStorage.getItem('rodhe_cart') || ''
      };
    `);
    assert(restoredCheck.title.includes('(1)') && restoredCheck.lsCart.includes('"quantity":1'), 'Undo restores exact item & quantity back to bag and persists to localStorage', restoredCheck.title);

    await cdp.eval(`document.querySelector('[aria-label="Close shopping bag"]')?.click();`);
    await delay(200);
    await cdp.reloadAndReady();

    const cartAfterReload = await cdp.eval(`
      return {
        label: document.querySelector('[aria-label^="Shopping bag"]')?.getAttribute('aria-label') || '',
        lsCart: (localStorage.getItem('rodhe_cart') || '').length
      };
    `);
    assert(cartAfterReload.label.includes('1 item'), 'Cart persists cleanly across browser refresh', `${cartAfterReload.label}, bytes=${cartAfterReload.lsCart}`);

    // ------------------------------------------------------------------------
    // TEST 4: Wishlist Heart Toggle, Persist After Reload, Move to Bag
    // ------------------------------------------------------------------------
    console.log('\n--- E2E Suite 4: Favourites / Wishlist Lifecycle ---');
    await cdp.waitFor("document.querySelectorAll('.product-wishlist-btn').length >= 2");
    await cdp.eval(`document.querySelectorAll('.product-wishlist-btn')[1]?.click();`);
    await delay(250);

    const wishBeforeReload = await cdp.eval(`
      return {
        label: document.querySelector('[aria-label^="Favourites"]')?.getAttribute('aria-label') || '',
        lsWish: localStorage.getItem('rodhe_wishlist') || ''
      };
    `);
    assert(wishBeforeReload.label.includes('1 item'), 'Wishlist heart increments counter immediately', `${wishBeforeReload.label}, ls=${wishBeforeReload.lsWish}`);

    await cdp.reloadAndReady();

    const wishAfterReload = await cdp.eval(`
      return {
        label: document.querySelector('[aria-label^="Favourites"]')?.getAttribute('aria-label') || '',
        lsWish: localStorage.getItem('rodhe_wishlist') || ''
      };
    `);
    assert(wishAfterReload.label.includes('1 item'), 'Wishlist heart persists cleanly across browser refresh', `${wishAfterReload.label}, ls=${wishAfterReload.lsWish}`);

    await cdp.eval(`document.querySelector('[aria-label^="Favourites"]')?.click();`);
    await cdp.waitFor("document.querySelector('[aria-label=\"Saved Favourites\"]')");

    const moveRes = await cdp.eval(`
      const moveBtn = [...document.querySelectorAll('[aria-label="Saved Favourites"] button')].find(b => b.textContent.includes('Move to Bag'));
      moveBtn?.click();
      return Boolean(moveBtn);
    `);
    await cdp.waitFor("document.querySelector('[aria-label=\"Shopping Bag\"]')");
    const bagAfterMove = await cdp.eval(`
      return {
        cartText: document.querySelector('[aria-label="Shopping Bag"] .drawer-title')?.textContent || '',
        wishLabel: document.querySelector('[aria-label^="Favourites"]')?.getAttribute('aria-label') || ''
      };
    `);
    assert(moveRes && bagAfterMove.cartText.includes('(2)') && bagAfterMove.wishLabel.includes('0 items'),
      'Move to Bag transfers saved favourite to cart and syncs both counters', `${bagAfterMove.cartText}, ${bagAfterMove.wishLabel}`);

    // ------------------------------------------------------------------------
    // TEST 5: Checkout Steps, Invalid PIN Rejection, Edit Address & WhatsApp Handover
    // ------------------------------------------------------------------------
    console.log('\n--- E2E Suite 5: 4-Step Checkout, Validation, Edit & WhatsApp Handover ---');
    await cdp.eval(`
      [...document.querySelectorAll('[aria-label="Shopping Bag"] button')].find(b => b.textContent.includes('Proceed to Checkout'))?.click();
    `);
    await cdp.waitFor("document.querySelector('[aria-label=\"Checkout\"] input[placeholder*=\"Promo\"]')");

    await cdp.eval(`
      const input = document.querySelector('[aria-label="Checkout"] input[placeholder*="Promo"]');
      const nativeSet = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      nativeSet.call(input, 'WOVEN10');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.closest('form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    `);
    await cdp.waitFor("(() => { const t = document.querySelector('[aria-label=\"Checkout\"]')?.innerText || ''; return t.includes('WOVEN10') && t.includes('-₹'); })()", 5000);

    const step1Check = await cdp.eval(`
      const text = document.querySelector('[aria-label="Checkout"]')?.innerText || '';
      return { hasDiscount: text.includes('WOVEN10') && text.includes('-₹') };
    `);
    assert(step1Check.hasDiscount, 'Step 1 (Review Bag) applies promo code WOVEN10 asynchronously and updates total');

    await cdp.eval(`
      [...document.querySelectorAll('[aria-label="Checkout"] button')].find(b => b.textContent.includes('Continue to Customer Details'))?.click();
    `);
    await cdp.waitFor("document.querySelector('[aria-label=\"Checkout\"] input[placeholder*=\"560001\"]')");

    await cdp.eval(`
      const setVal = (sel, val) => {
        const el = document.querySelector(sel);
        if (!el) return;
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(el, val);
        el.dispatchEvent(new Event('input', { bubbles: true }));
      };
      setVal('[aria-label="Checkout"] input[placeholder*="Ananya"]', 'Meenakshi Iyer');
      setVal('[aria-label="Checkout"] input[placeholder*="10-digit"]', '9840011223');
      setVal('[aria-label="Checkout"] input[placeholder*="Flat 402"]', 'No. 14 Boat Club Road');
      setVal('[aria-label="Checkout"] input[placeholder*="560001"]', '0123');
    `);
    await delay(150);
    await cdp.eval(`
      [...document.querySelectorAll('[aria-label="Checkout"] button')].find(b => b.textContent.includes('Continue to Final Review'))?.click();
    `);
    await delay(250);

    const invalidPinCheck = await cdp.eval(`
      return document.querySelector('[aria-label="Checkout"]')?.innerText.includes('valid 6-digit Indian PIN code');
    `);
    assert(invalidPinCheck, 'Checkout blocks invalid PIN code with readable field error');

    await cdp.eval(`
      const el = document.querySelector('[aria-label="Checkout"] input[placeholder*="560001"]');
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(el, '600028');
      el.dispatchEvent(new Event('input', { bubbles: true }));
    `);
    await delay(150);
    await cdp.eval(`
      [...document.querySelectorAll('[aria-label="Checkout"] button')].find(b => b.textContent.includes('Continue to Final Review'))?.click();
    `);
    await delay(300);

    const step3AddressCheck = await cdp.eval(`
      const txt = document.querySelector('[aria-label="Checkout"]')?.innerText || '';
      return {
        hasMeenakshi: txt.includes('Meenakshi Iyer'),
        hasChennai: txt.includes('Chennai') && txt.includes('600028'),
        hasEditBtn: Boolean([...document.querySelectorAll('[aria-label="Checkout"] button')].find(b => b.textContent.trim() === 'Edit Address'))
      };
    `);
    assert(step3AddressCheck.hasMeenakshi && step3AddressCheck.hasChennai && step3AddressCheck.hasEditBtn,
      'Step 3 displays auto-filled Chennai, Tamil Nadu 600028 delivery address with Edit Address button');

    await cdp.eval(`
      [...document.querySelectorAll('[aria-label="Checkout"] button')].find(b => b.textContent.trim() === 'Edit Address')?.click();
    `);
    await cdp.waitFor("document.querySelector('[aria-label=\"Checkout\"] input[placeholder*=\"Flat 402\"]')");
    await cdp.eval(`
      const el = document.querySelector('[aria-label="Checkout"] input[placeholder*="Flat 402"]');
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(el, 'Apt 9B Adyar Enclave');
      el.dispatchEvent(new Event('input', { bubbles: true }));
    `);
    await delay(150);
    await cdp.eval(`
      [...document.querySelectorAll('[aria-label="Checkout"] button')].find(b => b.textContent.includes('Continue to Final Review'))?.click();
    `);
    await delay(250);

    const guestPiiLeak = await cdp.eval(`
      return {
        localStorageHasAddress: Object.keys(localStorage).some(k => (localStorage.getItem(k) || '').includes('Adyar Enclave')),
        sessionStorageHasDraft: Boolean(sessionStorage.getItem('rodhe_guest_checkout_draft'))
      };
    `);
    assert(!guestPiiLeak.localStorageHasAddress && guestPiiLeak.sessionStorageHasDraft,
      'Edited guest delivery address is kept in sessionStorage only (zero insecure localStorage PII leak)');

    await cdp.eval(`
      window.__capturedWaUrl = null;
      window.open = (u) => { window.__capturedWaUrl = u; return null; };
      [...document.querySelectorAll('[aria-label="Checkout"] button')].find(b => b.textContent.includes('Send Order Enquiry on WhatsApp'))?.click();
    `);
    await delay(300);

    const step4Check = await cdp.eval(`
      const url = window.__capturedWaUrl || '';
      const decoded = decodeURIComponent(url.split('?text=')[1] || '');
      const modalText = document.querySelector('[aria-label="Checkout"]')?.innerText || '';
      const cartStillCount = document.querySelector('[aria-label^="Shopping bag"]')?.getAttribute('aria-label') || '';
      return {
        startsWithWa: url.startsWith('https://wa.me/919490658858?text='),
        hasUpdatedAddress: decoded.includes('Apt 9B Adyar Enclave') && decoded.includes('600028'),
        hasPromo: decoded.includes('WOVEN10'),
        hasNoFakeConfirm: modalText.includes('Pending WhatsApp Send (Not Yet Confirmed)'),
        hasPopupBlockedCopyFallback: modalText.toLowerCase().includes('copy enquiry message'),
        cartPreserved: cartStillCount.includes('2 items')
      };
    `);
    assert(step4Check.startsWithWa && step4Check.hasUpdatedAddress && step4Check.hasPromo,
      'Generated WhatsApp URL includes formatted products, promo WOVEN10, customer & edited address');
    assert(step4Check.hasNoFakeConfirm && step4Check.hasPopupBlockedCopyFallback,
      'Step 4 renders honest pending handover state + Copy fallback when WhatsApp popup blocked');
    assert(step4Check.cartPreserved, 'Cart is NOT cleared just because WhatsApp opened');

    await cdp.eval(`document.querySelector('[aria-label="Close checkout"]')?.click();`);
    await delay(200);

    // ------------------------------------------------------------------------
    // TEST 6: Negative Auth Check, Unavailable Bag Guard & Image Fallback
    // ------------------------------------------------------------------------
    console.log('\n--- E2E Suite 6: Auth Rejection & Failure Resilience ---');
    await cdp.eval(`document.querySelector('[aria-label^="Customer account"]')?.click();`);
    await cdp.waitFor("document.querySelector('[aria-label=\"Customer Account\"] input[type=\"email\"]')");
    await cdp.eval(`
      const setVal = (sel, val) => {
        const el = document.querySelector(sel);
        if (!el) return;
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(el, val);
        el.dispatchEvent(new Event('input', { bubbles: true }));
      };
      setVal('[aria-label="Customer Account"] input[type="email"]', 'nonexistent-patron@example.com');
      setVal('[aria-label="Customer Account"] input[type="password"]', 'wrongpassword123');
      document.querySelector('[aria-label="Customer Account"] form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    `);
    await cdp.waitFor("document.querySelector('[aria-label=\"Customer Account\"]')?.textContent.toLowerCase().match(/invalid|error|unavailable/)", 10000);

    const authFailCheck = await cdp.eval(`
      const text = document.querySelector('[aria-label="Customer Account"]')?.innerText || '';
      const stillSignInForm = Boolean(document.querySelector('[aria-label="Customer Account"] input[type="password"]'));
      return { stillSignInForm, hasErrorText: /invalid|error|unavailable/i.test(text) };
    `);
    assert(authFailCheck.stillSignInForm && authFailCheck.hasErrorText,
      'Customer sign-in rejects invalid credentials without fake local bypass');
    await cdp.eval(`document.querySelector('[aria-label="Close account modal"]')?.click();`);
    await delay(200);

    // Inject unpublished/missing item into rodhe_cart, reload, verify Shopping Bag flags unavailable item & blocks checkout
    await cdp.eval(`
      localStorage.setItem('rodhe_cart', JSON.stringify([
        { product: { id: 'nonexistent-unpublished-sku', slug: 'nonexistent-unpublished-sku', sku: 'RDH-GONE', name: 'Archived Test Saree', price: 990 }, quantity: 1 }
      ]));
    `);
    await cdp.reloadAndReady();
    await cdp.eval(`document.querySelector('[aria-label^="Shopping bag"]')?.click();`);
    await cdp.waitFor("document.querySelector('[aria-label=\"Shopping Bag\"]')?.innerText.toLowerCase().includes('unavailable')", 8000);

    const unavailBagCheck = await cdp.eval(`
      const bagText = document.querySelector('[aria-label="Shopping Bag"]')?.innerText || '';
      const proceedBtn = [...document.querySelectorAll('[aria-label="Shopping Bag"] button')].find(b => b.textContent.includes('Proceed to Checkout'));
      return {
        hasWarning: bagText.includes('currently unavailable') || bagText.includes('No longer available'),
        checkoutDisabled: Boolean(proceedBtn?.disabled)
      };
    `);
    assert(unavailBagCheck.hasWarning && unavailBagCheck.checkoutDisabled,
      'Unpublished or removed product in bag shows warning banner and disables checkout until removed');
    await cdp.eval(`document.querySelector('[aria-label="Close shopping bag"]')?.click();`);
    await delay(200);

    // Image onerror graceful fallback check
    const imgFallbackCheck = await cdp.eval(`
      const img = document.querySelector('.product-image.primary');
      if (!img) return false;
      img.dispatchEvent(new Event('error'));
      return img.getAttribute('src') === '/assets/products/saree_ivory_mulmul.jpg';
    `);
    assert(imgFallbackCheck, 'Broken product image triggers fallback asset without UI break');

    // Out-of-stock card + PDP disablement check
    const targetOosInfo = await cdp.eval(`
      const list = JSON.parse(localStorage.getItem('rodhe_db_products') || '[]');
      const cards = [...document.querySelectorAll('.product-card')];
      for (const card of cards) {
        const name = card.querySelector('h3')?.textContent?.trim() || '';
        const sku = card.querySelector('.sku-val')?.textContent?.trim() || '';
        const match = list.find((p) => (sku && p.sku === sku) || (name && p.name === name));
        if (match) {
          const updated = list.map((p) =>
            p === match ? { ...p, inStock: false, in_stock: false, stockCount: 0, stock_count: 0 } : p
          );
          localStorage.setItem('rodhe_db_products', JSON.stringify(updated));
          return { name: match.name, sku: match.sku };
        }
      }
      return null;
    `);
    await cdp.reloadAndReady();
    try {
      await cdp.waitFor("document.querySelector('.product-card button[aria-label$=\"is out of stock\"]')?.disabled", 8000);
    } catch (waitErr) {
      const diag = await cdp.eval(`
        const list = JSON.parse(localStorage.getItem('rodhe_db_products') || '[]');
        const oosLs = list.filter(p => p.inStock === false || p.stockCount === 0).map(p => ({ id: p.id, slug: p.slug, sku: p.sku, name: p.name, inStock: p.inStock, stockCount: p.stockCount }));
        const cards = [...document.querySelectorAll('.product-card')].map(c => ({
          name: c.querySelector('h3')?.textContent?.trim(),
          sku: c.querySelector('.sku-val')?.textContent?.trim(),
          btnAria: c.querySelector('button[aria-label*="stock"], .btn-ecommerce-add-to-cart')?.getAttribute('aria-label'),
          disabled: c.querySelector('.btn-ecommerce-add-to-cart')?.disabled
        }));
        return { listLen: list.length, oosLs, cards };
      `);
      console.error('OOS_DIAG:', JSON.stringify({ targetOosInfo, ...diag }, null, 2));
      throw waitErr;
    }
    const oosCheck = await cdp.eval(`
      const card = [...document.querySelectorAll('.product-card')].find(c => c.innerText.includes(${JSON.stringify(targetOosInfo?.name || '')}));
      const addBtn = card?.querySelector('button[aria-label*="out of stock"]');
      const cardDisabled = Boolean(addBtn?.disabled && card?.innerText.includes('Out of Stock'));
      card?.querySelector('h3')?.click();
      return { cardDisabled };
    `);
    await cdp.waitFor("document.querySelector('main')?.innerText.includes('Out of Stock')", 5000);
    const pdpOosDisabled = await cdp.eval(`
      const pdpBtn = [...document.querySelectorAll('main button')].find(b => b.textContent.includes('Out of Stock'));
      return Boolean(pdpBtn?.disabled);
    `);
    assert(Boolean(targetOosInfo) && oosCheck.cardDisabled && pdpOosDisabled, 'Out-of-stock product disables Add to Cart on both ProductCard and ProductDetailPage');
    await cdp.eval(`
      localStorage.removeItem('rodhe_db_products');
      localStorage.removeItem('rodhe_cart');
    `);
    await cdp.reloadAndReady(url);

    // Failed cart localStorage persistence resilience check
    const storageFailCheck = await cdp.eval(`
      window.__e2eErrors = [];
      window.addEventListener('error', (e) => window.__e2eErrors.push(e.message));
      const origSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function(k, v) {
        if (k === 'rodhe_cart') throw new DOMException('Simulated quota exceeded', 'QuotaExceededError');
        return origSetItem.call(this, k, v);
      };
      const addBtn = document.querySelector('.product-card button[aria-label^="Add "]');
      addBtn?.click();
      Storage.prototype.setItem = origSetItem;
      return true;
    `);
    await cdp.waitFor("document.querySelector('[aria-label=\"Shopping Bag\"]')", 5000);
    const afterStorageFail = await cdp.eval(`
      return {
        errCount: (window.__e2eErrors || []).length,
        bagOpen: Boolean(document.querySelector('[aria-label="Shopping Bag"]')),
        cartCount: document.querySelector('[aria-label^="Shopping bag"]')?.getAttribute('aria-label') || ''
      };
    `);
    assert(storageFailCheck && afterStorageFail.errCount === 0 && afterStorageFail.bagOpen && afterStorageFail.cartCount.includes('1 item'),
      'Cart stays usable without crashing when localStorage quota write fails');
    await cdp.eval(`document.querySelector('[aria-label="Close shopping bag"]')?.click();`);
    await delay(200);

    // ------------------------------------------------------------------------
    // TEST 7: Returning Customer Address Edit, Error Handling & Persistence [MOCKED AUTH TRANSPORT VIA CDP FETCH]
    // ------------------------------------------------------------------------
    console.log('\n--- E2E Suite 7: Returning Customer Address Edit & Reload Persistence (Mocked Auth Transport) ---');
    const b64u = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
    const makeJwt = (sub, email) => `${b64u({ alg: 'HS256', typ: 'JWT' })}.${b64u({
      sub,
      email,
      role: 'authenticated',
      aud: 'authenticated',
      exp: Math.floor(Date.now() / 1000) + 7200
    })}.mock_sig`;

    const mockAuthState = {
      signedIn: false,
      failNextAddressWrite: false,
      user: {
        id: '00000000-0000-4000-8000-000000000101',
        aud: 'authenticated',
        role: 'authenticated',
        email: 'patron.test@example.com',
        created_at: '2026-01-01T00:00:00.000Z',
        last_sign_in_at: '2026-11-10T00:00:00.000Z',
        user_metadata: {
          full_name: 'Kavya Nair',
          phone: '9845012345',
          saved_addresses: [
            {
              id: 'addr-101',
              label: 'Home',
              recipientName: 'Kavya Nair',
              phone: '9845012345',
              addressLine1: '12 Rest House Crescent',
              addressLine2: 'Shanthala Nagar',
              landmark: 'Near Brigade Road',
              city: 'Bengaluru',
              state: 'Karnataka',
              pincode: '560001',
              isDefault: true
            }
          ],
          wishlist_ids: [],
          cart_items: []
        }
      }
    };

    const corsHeaders = [
      { name: 'Content-Type', value: 'application/json' },
      { name: 'Access-Control-Allow-Origin', value: url },
      { name: 'Access-Control-Allow-Credentials', value: 'true' },
      { name: 'Access-Control-Allow-Headers', value: 'authorization, x-client-info, apikey, content-type, prefer, x-supabase-api-version' },
      { name: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, PATCH, DELETE, OPTIONS' }
    ];

    const suite7Trace = [];
    cdp.on('Runtime.consoleAPICalled', (params) => {
      if (params?.type === 'error' || params?.type === 'warning') {
        suite7Trace.push(`[console.${params.type}] ${(params.args || []).map((a) => a.value || a.description || '').join(' ')}`);
      }
    });

    cdp.on('Fetch.requestPaused', async ({ requestId, request }) => {
      const reqUrl = request.url || '';
      const method = (request.method || 'GET').toUpperCase();
      suite7Trace.push(`[fetch] ${method} ${reqUrl.replace(/^https:\/\/[^/]+/, '')}`);
      const onFulfillErr = (err) => {
        if (!String(err?.message || '').includes('Invalid InterceptionId')) {
          suite7Trace.push(`[fulfill-err] ${method} ${reqUrl}: ${err?.message}`);
        }
      };
      const fulfillJson = (status, bodyObj) => cdp.send('Fetch.fulfillRequest', {
        requestId,
        responseCode: status,
        responseHeaders: corsHeaders,
        body: Buffer.from(bodyObj === null ? '' : JSON.stringify(bodyObj)).toString('base64')
      }).catch(onFulfillErr);

      if (method === 'OPTIONS') {
        const hdrs = request.headers || {};
        const reqAllow = hdrs['access-control-request-headers'] || hdrs['Access-Control-Allow-Headers'] || hdrs['Access-Control-Request-Headers'];
        const optHeaders = reqAllow
          ? [
              ...corsHeaders.filter((h) => h.name !== 'Access-Control-Allow-Headers'),
              { name: 'Access-Control-Allow-Headers', value: reqAllow }
            ]
          : corsHeaders;
        return cdp.send('Fetch.fulfillRequest', {
          requestId,
          responseCode: 204,
          responseHeaders: optHeaders
        }).catch(onFulfillErr);
      }

      if (reqUrl.includes('/auth/v1/token')) {
        mockAuthState.signedIn = true;
        return fulfillJson(200, {
          access_token: makeJwt(mockAuthState.user.id, mockAuthState.user.email),
          token_type: 'bearer',
          expires_in: 7200,
          expires_at: Math.floor(Date.now() / 1000) + 7200,
          refresh_token: 'mock-refresh-101',
          user: mockAuthState.user
        });
      }

      if (reqUrl.includes('/auth/v1/user')) {
        if (!mockAuthState.signedIn) {
          return fulfillJson(401, { error: 'invalid_grant', message: 'Not authenticated' });
        }
        if (method === 'GET') {
          return fulfillJson(200, mockAuthState.user);
        }
        if (method === 'PUT') {
          if (mockAuthState.failNextAddressWrite) {
            mockAuthState.failNextAddressWrite = false;
            return fulfillJson(500, { message: 'Simulated database write error' });
          }
          const payload = JSON.parse(request.postData || '{}');
          if (payload.data && typeof payload.data === 'object') {
            mockAuthState.user = {
              ...mockAuthState.user,
              user_metadata: {
                ...mockAuthState.user.user_metadata,
                ...payload.data
              }
            };
          }
          return fulfillJson(200, mockAuthState.user);
        }
      }

      if (reqUrl.includes('/auth/v1/logout')) {
        mockAuthState.signedIn = false;
        return cdp.send('Fetch.fulfillRequest', {
          requestId,
          responseCode: 204,
          responseHeaders: corsHeaders
        }).catch(onFulfillErr);
      }

      if (reqUrl.includes('/rest/v1/customer_')) {
        return fulfillJson(404, { code: 'PGRST205', message: 'Could not find the table in schema cache' });
      }

      return cdp.send('Fetch.continueRequest', { requestId }).catch(() => {});
    });

    await cdp.send('Fetch.enable', {
      patterns: [
        { urlPattern: '*emtmzrjaygcrmzoatvfa.supabase.co/auth/v1/*' },
        { urlPattern: '*emtmzrjaygcrmzoatvfa.supabase.co/rest/v1/customer_*' }
      ]
    });

    try {
      await cdp.eval(`document.querySelector('[aria-label^="Customer account"]')?.click();`);
      await cdp.waitFor("document.querySelector('[aria-label=\"Customer Account\"] input[type=\"email\"]')");
      await cdp.eval(`
        const setVal = (sel, val) => {
          const el = document.querySelector(sel);
          if (!el) return;
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(el, val);
          el.dispatchEvent(new Event('input', { bubbles: true }));
        };
        setVal('[aria-label="Customer Account"] input[type="email"]', 'patron.test@example.com');
        setVal('[aria-label="Customer Account"] input[type="password"]', 'SecretSilk99!');
        document.querySelector('[aria-label="Customer Account"] form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      `);
      try {
        await cdp.waitFor("document.querySelector('[aria-label=\"Customer Account\"]')?.textContent.includes('Addresses (1)')", 8000);
      } catch (authWaitErr) {
        const modalDump = await cdp.eval(`return document.querySelector('[aria-label="Customer Account"]')?.textContent || '';`);
        console.error('AUTH_MODAL_DUMP:', modalDump);
        console.error('SUITE7_TRACE:', suite7Trace.slice(-25));
        throw authWaitErr;
      }

      await cdp.eval(`
        [...document.querySelectorAll('[aria-label="Customer Account"] button')].find(b => b.textContent.includes('Addresses (1)'))?.click();
      `);
      await cdp.waitFor("document.querySelector('[aria-label=\"Customer Account\"]')?.textContent.includes('12 Rest House Crescent')", 4000);

      // Click Edit Address, simulate backend write failure first, verify error & form preservation
      mockAuthState.failNextAddressWrite = true;
      await cdp.eval(`
        [...document.querySelectorAll('[aria-label="Customer Account"] button')].find(b => b.textContent.trim() === 'Edit Address')?.click();
      `);
      await cdp.waitFor("document.querySelector('[aria-label=\"Customer Account\"] input[placeholder*=\"Flat 402\"]')");
      await cdp.eval(`
        const setVal = (sel, val) => {
          const el = document.querySelector(sel);
          if (!el) return;
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(el, val);
          el.dispatchEvent(new Event('input', { bubbles: true }));
        };
        setVal('[aria-label="Customer Account"] input[placeholder*="Flat 402"]', '88 Indiranagar 100ft Rd');
        setVal('[aria-label="Customer Account"] input[placeholder*="560001"]', '560038');
        document.querySelector('[aria-label="Customer Account"] form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      `);
      try {
        await cdp.waitFor("document.querySelector('[aria-label=\"Customer Account\"]')?.textContent.includes('Simulated database write error')", 5000);
      } catch (saveWaitErr) {
        const modalDump = await cdp.eval(`return document.querySelector('[aria-label="Customer Account"]')?.textContent || '';`);
        console.error('SAVE_MODAL_DUMP:', modalDump);
        console.error('SUITE7_SAVE_TRACE:', suite7Trace.slice(-25));
        throw saveWaitErr;
      }

      const failEditCheck = await cdp.eval(`
        const modal = document.querySelector('[aria-label="Customer Account"]');
        const streetVal = modal?.querySelector('input[placeholder*="Flat 402"]')?.value || '';
        return {
          hasErr: Boolean(modal?.textContent.includes('Simulated database write error')),
          preservedInput: streetVal === '88 Indiranagar 100ft Rd'
        };
      `);
      assert(failEditCheck.hasErr && failEditCheck.preservedInput,
        'Failed address save surfaces database error cleanly and preserves edited inputs for retry');

      // Retry save (now succeeds)
      await cdp.eval(`
        document.querySelector('[aria-label="Customer Account"] form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      `);
      await cdp.waitFor("document.querySelector('[aria-label=\"Customer Account\"]')?.textContent.includes('88 Indiranagar 100ft Rd')", 5000);
      await cdp.eval(`document.querySelector('[aria-label="Close account modal"]')?.click();`);
      await delay(200);

      // Full page reload -> verify updated saved address persists
      await cdp.reloadAndReady();
      await cdp.waitFor("Boolean(document.querySelector('[aria-label^=\"Customer Account:\"]'))", 8000);
      await cdp.eval(`document.querySelector('[aria-label^="Customer account" i]')?.click();`);
      await cdp.waitFor("document.querySelector('[aria-label=\"Customer Account\"]')?.textContent.includes('Addresses (1)')", 8000);
      const reloadAddrCheck = await cdp.eval(`
        [...document.querySelectorAll('[aria-label="Customer Account"] button')].find(b => b.textContent.includes('Addresses ('))?.click();
        return true;
      `);
      await cdp.waitFor("document.querySelector('[aria-label=\"Customer Account\"]')?.textContent.includes('560038')", 4000);
      const savedAfterReload = await cdp.eval(`
        const txt = document.querySelector('[aria-label="Customer Account"]')?.textContent || '';
        return txt.includes('88 Indiranagar 100ft Rd') && txt.includes('560038');
      `);
      assert(reloadAddrCheck && savedAfterReload,
        'Edited returning-customer address persists across full page refresh');
      await cdp.eval(`document.querySelector('[aria-label="Close account modal"]')?.click();`);
      await delay(200);

      // Add saree to bag -> Checkout Step 2 -> verify edited saved address appears in selector with Edit Address button
      await cdp.eval(`document.querySelector('.product-card button[aria-label^="Add "]')?.click();`);
      await cdp.waitFor("document.querySelector('[aria-label=\"Shopping Bag\"]')?.textContent.includes('Proceed to Checkout')", 5000);
      await cdp.eval(`
        [...document.querySelectorAll('[aria-label="Shopping Bag"] button')].find(b => b.textContent.includes('Proceed to Checkout'))?.click();
      `);
      await cdp.waitFor("document.querySelector('[aria-label=\"Checkout\"]')");
      await cdp.eval(`
        [...document.querySelectorAll('[aria-label="Checkout"] button')].find(b => b.textContent.includes('Continue to Customer Details'))?.click();
      `);
      await cdp.waitFor("document.querySelector('[aria-label=\"Checkout\"]')?.textContent.includes('88 Indiranagar 100ft Rd')", 5000);
      const checkoutSavedAddrCheck = await cdp.eval(`
        const txt = document.querySelector('[aria-label="Checkout"]')?.textContent || '';
        const hasEditBtn = [...document.querySelectorAll('[aria-label="Checkout"] button')].some(b => b.textContent.includes('Edit Address'));
        return txt.includes('88 Indiranagar 100ft Rd') && txt.includes('560038') && hasEditBtn;
      `);
      assert(checkoutSavedAddrCheck, 'Returning customer sees updated saved delivery address & Edit Address option in Checkout Step 2');
      await cdp.eval(`document.querySelector('[aria-label="Close checkout"]')?.click();`);
      await delay(200);

      // Sign Out -> verify modal switches back to unauthenticated Sign In and clears saved addresses
      await cdp.eval(`document.querySelector('[aria-label^="Customer account" i]')?.click();`);
      await cdp.waitFor("document.querySelector('[aria-label=\"Customer Account\"]')");
      await cdp.eval(`
        [...document.querySelectorAll('[aria-label="Customer Account"] button')].find(b => b.textContent.trim() === 'Details')?.click();
      `);
      await cdp.waitFor("[...document.querySelectorAll('[aria-label=\"Customer Account\"] button')].some(b => b.textContent.includes('Sign Out'))", 4000);
      await cdp.eval(`
        [...document.querySelectorAll('[aria-label="Customer Account"] button')].find(b => b.textContent.includes('Sign Out'))?.click();
      `);
      await cdp.waitFor("Boolean(document.querySelector('[aria-label=\"Customer account sign in\"]')) && !document.querySelector('[aria-label=\"Customer Account\"]')", 5000);
      await cdp.eval(`document.querySelector('[aria-label="Customer account sign in"]')?.click();`);
      await cdp.waitFor("Boolean(document.querySelector('[aria-label=\"Customer Account\"] input[type=\"password\"]'))", 4000);
      const signOutCheck = await cdp.eval(`
        const txt = document.querySelector('[aria-label="Customer Account"]')?.textContent || '';
        return txt.includes('Sign In') && !txt.includes('88 Indiranagar 100ft Rd');
      `);
      assert(signOutCheck, 'Customer Sign Out clears authenticated profile & saved addresses cleanly');
      await cdp.eval(`document.querySelector('[aria-label="Close account modal"]')?.click();`);
      await delay(200);
    } finally {
      await cdp.send('Fetch.disable').catch(() => {});
    }

    console.log('\n================================================================');
    console.log(`E2E BROWSER SUITE: TOTAL ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
    console.log('================================================================');
    if (failed > 0) process.exitCode = 1;
  } finally {
    if (cdp) cdp.close();
    try { browser.kill('SIGKILL'); } catch {}
    try { server.close(); } catch {}
    await delay(300);
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch {}
  }
}

runBrowserE2E().catch((err) => {
  console.error('E2E execution failure:', err);
  process.exit(1);
});
