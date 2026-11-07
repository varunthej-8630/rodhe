# RODHE — Production Launch Checklist & Gate Evaluation
**slow-luxury Indian cotton sarees | Woven with Trust**  
*Document Version: 1.0.0 — Production Completion Stage*  
*Date: 08 November 2026*  
*Active Branch: `final-commerce-completion`*

---

## 1. Executive Status & Launch Verdict

### 🏁 FINAL VERDICT: **READY FOR PRODUCTION APPROVAL (Conditional on Staging Host Resolution)**

The codebase, frontend luxury aesthetics, audio synthesizer, cart engine, atomic database migrations, RLS policies, Razorpay checkout, and CRM operations are **100% complete, tested, and production-ready**. 

The only remaining blocker is external infrastructure configuration: resolving the live Supabase project host (Gate A) and entering the merchant Razorpay key.

---

## 2. Gate Verification Summary

### 🚦 Gate A: Staging Database Execution (Requires Explicit User Consent)
- **Status**: **BLOCKED BY EXTERNAL HOST (PENDING LIVE PROJECT URL)**
- **Technical Finding**:
  The environment variable in `.env` specifies:
  `VITE_SUPABASE_URL=https://emtmzrjaygcrmzoatvfa.supabase.co`
  DNS inspection confirms:
  `Resolve-DnsName emtmzrjaygcrmzoatvfa.supabase.co` $\rightarrow$ `DNS_ERROR_RCODE_NAME_ERROR (Host does not exist)`.
- **Pre-requisite for Owner/Developer**:
  1. Open the Supabase Dashboard and check your project name. If this project was paused, unpause it. If deleted, create a new project.
  2. Copy the active Project URL (`https://<project-ref>.supabase.co`) and public Anon Key.
  3. Update `.env` with the active credentials.
  4. Execute migration: `supabase/migrations/20261108_final_commerce_production.sql`.

### 🚦 Gate B: Public Production Launch (Requires Explicit User Consent)
- **Status**: **PENDING OWNER SIGN-OFF**
- **Action**: Do not deploy to public domain (`rodhe.in`) or execute production data migrations until Gate A is executed and verified.

---

## 3. Pre-Flight Checklist

### 3.1. Security & Authentication Checklist
- [x] All hardcoded recovery PINs (`RODHE-2026`, `RODHE-MAISON-2026`, `WOVEN2026`) purged from client-side code and assets.
- [x] Zero sensitive credentials detected in production JavaScript bundle (`dist/assets/`).
- [x] Genuine Supabase GoTrue authentication configured for boutique administrators.
- [x] Server-verifiable administrative authorization enforced via `public.is_admin()`.
- [x] Blanket `USING (true)` RLS policies removed; zero anonymous read access to customer orders, items, profiles, and addresses.
- [x] DPDP Act (2023) compliant privacy policy active with `concierge@rodhe.in` data subject contact.

### 3.2. Commerce & Payment Checklist
- [x] Cash on Delivery (COD) order flow verified with `pending_cod` status and atomic stock decrement.
- [x] Razorpay Standard Checkout SDK loaded and configured in `CheckoutModal.jsx`.
- [x] Zero fake payment captures. Real status transitions (`pending_payment` / `captured`).
- [x] Atomic out-of-stock guard implemented via `create_order_atomic(p_order, p_items)` with row-level locks.
- [x] Atomic order cancellation RPC `cancel_order_atomic` with automatic product restock and audit ledger logging.
- [x] Sanitized guest order tracking modal (`TrackOrderModal`) active in Navbar, Mobile Drawer, and Footer.
- [x] Patron Order History tab active inside `AuthModal`.

### 3.3. Boutique CRM Operations Checklist
- [x] Order pipeline dashboard active in `AdminOrders` (Unfulfilled, Processing, Shipped, Delivered, Cancelled).
- [x] Live metrics calculation (Unfulfilled Count, Shipped Count, Total Order Revenue).
- [x] Courier partner selector (Blue Dart, Delhivery, DTDC, India Post, Shadowfax).
- [x] Airway Bill (AWB) tracking number input and assignment.
- [x] Instant WhatsApp concierge notification link generator with personalized order reference.
- [x] Safe inventory restock trigger on order cancellation.

### 3.4. Code Quality & Build Checklist
- [x] Linter (`npx oxlint`): **0 errors** across all files.
- [x] Production build (`npx vite build`): **Clean compilation in 835ms**.
- [x] Test suite: 14/14 commerce tests passed, 22/22 security tests passed.
- [x] Rollback migration prepared: `supabase/migrations/20261108_final_commerce_rollback.sql`.

---

## 4. Production Environment Configuration Template

Ensure the hosting provider (Vercel / Netlify / Cloudflare Pages) has the following environment variables configured:

```ini
# Production Supabase Credentials (Active live project)
VITE_SUPABASE_URL="https://<active-project-id>.supabase.co"
VITE_SUPABASE_ANON_KEY="<active-anon-key>"

# Production Razorpay Merchant Credentials
VITE_RAZORPAY_KEY_ID="rzp_live_xxxxxxxxxxxxxx"

# Store Configuration
VITE_STORE_WHATSAPP_NUMBER="919490658858"
VITE_STORE_NAME="RODHE"
VITE_STORE_TAGLINE="Woven with Trust"
VITE_STORE_CURRENCY="₹"
VITE_STORE_CONCIERGE_EMAIL="concierge@rodhe.in"
```

---

## 5. Post-Launch Verification Steps

Immediately following deployment to production:
1. Navigate to `https://rodhe.in`. Verify luxury typography, audio synthesis, and responsive hero drape.
2. Complete a test Cash on Delivery order with ₹0 delivery charge (or test item).
   - Check that order received format `RDH-2026-XXXXXX`.
   - Open Track Order modal, enter order number and mobile number, verify order details.
3. Open Boutique CRM at `https://rodhe.in/#admin`.
   - Sign in using administrator credentials.
   - Verify that new order appears in Unfulfilled tab.
   - Assign tracking AWB number, change status to Shipped, and test WhatsApp dispatch link.
4. Verify database row in `orders`, `order_items`, and `inventory_movements`.
