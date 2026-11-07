# 11. TESTING STRATEGY & QUALITY ASSURANCE — RODHE
## Verification Framework, Critical Scenarios & Release Gates

---

## 1. Existing Test Reality

- **Current Automated Test Coverage**: **0%**.
- No test runner (`vitest`, `jest`) or test utility (`@testing-library/react`) is installed in `package.json`.
- All quality verification historically relied on manual browser testing and `oxlint` static linting.

---

## 2. Recommended Test Tooling Stack

To establish confidence without bloating the build:
1. **Runner**: `vitest` (fast, native Vite integration, zero config required).
2. **Component Testing**: `@testing-library/react` and `@testing-library/user-event`.
3. **E2E Automation**: `playwright` (cross-browser mobile and desktop testing).

---

## 3. The 12 Critical E-Commerce Test Scenarios

Every critical workflow must adhere to verified expected behaviors:

| # | Critical Test Scenario | Failure Mode if Unhandled | Verified Expected Result |
|---|---|---|---|
| **1** | **Customer purchases available saree** | Cart clears with no order saved | Atomic order insertion in `orders` & `order_items`; real order ID generated; stock decrements by 1; receipt sent. |
| **2** | **Two customers buy last item simultaneously** | Overselling (-1 stock count) | First transaction captures item; second transaction receives graceful: *"This handcrafted edition was just reserved by another patron"* alert with cart refund. |
| **3** | **Payment gateway rejects transaction** | Fake order confirmation | Order marked `payment_status: 'failed'`; customer returned to checkout with explanatory prompt; stock is NOT decremented. |
| **4** | **Payment succeeds but browser closes before redirect** | Paid order lost in ether | Gateway webhook fires asynchronously to backend; order status transitions to `captured`; confirmation email dispatched. |
| **5** | **Duplicate webhook arrives from gateway** | Double stock decrement | Idempotency key on `gateway_payment_id` prevents duplicate processing; second webhook returns HTTP 200 without re-decrementing. |
| **6** | **Supabase cloud temporarily unreachable** | Application crashes with unhandled exception | Graceful fallback banner displayed; cart remains safely preserved in `localStorage`; checkout requests retry with exponential backoff. |
| **7** | **Admin loses network while editing in CRM** | Edits lost permanently | Changes stored with `pending_sync: true` flag in local storage; sync automatically retried upon `window.addEventListener('online')`. |
| **8** | **Unauthorized user accesses `/#admin`** | Admin dashboard opens; credentials leaked | Middleware redirects to `/login`; Supabase RLS rejects any unauthorized data read; zero admin passwords readable. |
| **9** | **Malicious patron alters unit price in DOM** | Items bought for ₹1 | Server-side checkout calculation recalculates line items against database `selling_price`; client price payload is ignored. |
| **10** | **Invalid or expired promo code submitted** | Free/unintended discounts | Subtotal discount calculation rejects code; toast displays: *"Invalid or expired coupon"*; zero discount deducted. |
| **11** | **Product goes out of stock during checkout** | Order placed for unavailable item | Pre-payment verification catches `stock_count === 0`; customer notified before payment gateway launch. |
| **12** | **Product image URL fails or 404s** | Ugly broken image icon | `onError` event handler seamlessly falls back to craft-matched canonical photograph without layout reflow. |

---

## 4. Production Release Gates (Go/No-Go Checklist)

Before promoting any release to production:
- [ ] `npm run lint` passes with 0 errors.
- [ ] `npm run build` generates production bundle without syntax or type errors.
- [ ] No plaintext passwords exist in database or client code.
- [ ] All RLS policies prevent unauthenticated administrative reads.
- [ ] Checkout commits real records to `public.orders`.
- [ ] Order emails and inquiries record accurately in the database.
- [ ] Image fallback functions across all 50 saree cards and galleries.
- [ ] Mobile responsive layout verified on <360px, 414px (iOS), and 768px (iPad).

