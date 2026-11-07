# 12. RISK REGISTER — RODHE
## Enterprise Risk Assessment, Severity Matrix & Mitigation Protocols

---

## 1. Risk Matrix Overview

```
                   IMPACT ───────►
             Low       Medium      High      Critical
          ┌─────────┬──────────┬──────────┬──────────┐
    High  │         │  R-08    │  R-04    │  R-01    │
L         │         │ (Bundle) │ (CRM-RLS)│ (Sec-RLS)│
I         ├─────────┼──────────┼──────────┼──────────┤
K Medium  │  R-09   │  R-06    │  R-07    │  R-02    │
E         │ (Slider)│ (Photos) │(Enquiry) │(No-Order)│
L         ├─────────┼──────────┼──────────┼──────────┤
I Low     │         │  R-05    │  R-03    │          │
H         │         │ (TM-Law) │(Bypass)  │          │
          └─────────┴──────────┴──────────┴──────────┘
```

---

## 2. Detailed Risk Register

| Risk ID | Category | Risk Description | Severity | Likelihood | Impact | Immediate Mitigation Protocol |
|---|---|---|---|---|---|---|
| **R-01** | **Security** | `public.admin_users` table allows unauthenticated read, update, and insert. Plaintext passwords exposed. Anyone can steal or alter admin credentials. | **CRITICAL** | High | Critical | Revoke public RLS policies immediately. Migrate to native Supabase Auth with bcrypt encryption. Rotate exposed credentials. |
| **R-02** | **Commercial** | Checkout modal simulates orders via `setTimeout`. No records saved to `orders` or `order_items`. Customers believe they bought an item, but store owner receives zero order details. | **CRITICAL** | Medium | Critical | Deploy commerce schema migration (`orders`, `order_items`). Wire real database insert into checkout flow. |
| **R-03** | **Security** | Fallback credentials (`rodhe` / `rodhe@admin` / `WovenWithTrust2026!`) hardcoded in client JavaScript bundle. | **HIGH** | Low | High | Remove hardcoded strings from `authService.js`. Enforce server-side authentication check. |
| **R-04** | **Data Integrity** | Boutique CRM makes writes using unauthenticated Supabase `anon` key. Supabase RLS rejects writes, trapping inventory changes in the store owner's personal browser local storage. | **HIGH** | High | High | Authenticate CRM requests via Supabase Auth so PostgreSQL accepts authorized administrative writes. |
| **R-05** | **Legal** | Claiming "registered trademark" without an official Trade Marks Registry registration number violates Section 107 of the Indian Trade Marks Act, 1999. | **MEDIUM-HIGH** | Low | High | Remove the word "registered" and the ® symbol. Update wording to "RODHE — Woven with Trust. All rights reserved." until registration is complete. |
| **R-06** | **Reputational** | 40 out of 50 sarees share identical photographs with other sarees (e.g., `saree_ivory_mulmul.jpg` reused across 6 sarees). Discerning luxury patrons may accuse the brand of deceptive imagery. | **MEDIUM** | Medium | Medium | Source or generate unique studio photography for every SKU. Clearly label fabric swatches. |
| **R-07** | **Operational** | Contact concierge form calls nonexistent `storeService.createEnquiry()`, throwing a silent TypeError. Patron inquiries fail to save to database or local storage. | **HIGH** | Medium | High | Fix method name in `ContactConciergePage.jsx` to `submitEnquiry()`. |
| **R-08** | **Performance** | Monolithic initial bundle (928 kB raw) forces mobile customers to download the entire CRM suite before the storefront paints. | **MEDIUM** | High | Medium | Implement `React.lazy()` code-splitting for `AdminPortal` and secondary pages. |
| **R-09** | **UX / Logic** | Collection price slider extends to ₹8,000 while all catalog items are priced between ₹590 and ₹1,750, leaving 75% of the slider empty. | **LOW-MEDIUM** | Medium | Low | Recalibrate slider ceiling in `ShopContext.jsx` to ₹2,000. |
| **R-10** | **Operational** | Newsletter form in `Footer.jsx` sets local state `isSubscribed` without calling `storeService.joinCircle()`. Email leads are discarded. | **MEDIUM** | Medium | Medium | Wire `handleSubscribe` to call `storeService.joinCircle(newsletterEmail)`. |

