# RODHE — Phase S0: Emergency Security Remediation Plan

**Document Reference**: `docs/PHASE_S0_SECURITY_REMEDIATION.md`  
**Execution Phase**: Phase S0 (Emergency Security & Customer Data Protection)  
**Git Branch**: `security-phase-s0-remediation`  
**Date**: November 8, 2026  
**Auditor**: Application Security Engineering Team  

---

## 1. Executive Summary & Remediation Objectives

Phase S0 focuses strictly on eliminating critical security vulnerabilities, preventing customer PII data leakage, and migrating to authentic Supabase Auth without altering the luxury visual design tokens, product descriptions, procedural audio synthesis, or brand experience.

### Mandatory Deliverables in Phase S0:
1. **Priority 1**: Complete purge of hardcoded recovery secrets (`RODHE-2026`, etc.), default credentials, and mock session tokens from client code and production build bundles.
2. **Priority 2**: Migration of administrator authentication to genuine Supabase Auth (`supabase.auth.signInWithPassword`), backed by server-verifiable `public.is_admin()` PostgreSQL function.
3. **Priority 3**: Revocation of anonymous open read policies (`USING (true)`) on `orders`, `order_items`, and `admin_users`, enforcing strict authenticated ownership.
4. **Priority 4**: Remediation of unsafe order confirmations: preventing false success receipts upon database failures and blocking unverified `'captured'` payment statuses.
5. **Priority 5**: Authoring idempotent, rollback-safe SQL migration scripts (`supabase/migrations/20261108_phase_s0_security_remediation.sql` and `20261108_phase_s0_rollback.sql`).

---

## 2. File Modification & Component Inventory

| File Path | Security Role | Planned Modifications in Phase S0 |
|---|---|---|
| [`src/services/authService.js`](file:///c:/Users/VARUN%20THEJ/OneDrive/Desktop/Rodhe/src/services/authService.js) | Authentication Engine | • Purge `RODHE-2026`, `RODHE-MAISON-2026`, and `WOVEN2026`<br>• Purge hardcoded plaintext passwords (`rodhe@admin`, `WovenWithTrust2026!`)<br>• Purge `rodhe_token_${Date.now()}` fake tokens<br>• Implement `supabase.auth.signInWithPassword`<br>• Implement database verification via `supabase.rpc('is_admin')`<br>• Implement official `supabase.auth.resetPasswordForEmail` flow |
| [`src/components/admin/AdminLogin.jsx`](file:///c:/Users/VARUN%20THEJ/OneDrive/Desktop/Rodhe/src/components/admin/AdminLogin.jsx) | Admin Login View | • Remove "Atelier Recovery Security Key" input field<br>• Connect Forgot Password to Supabase Auth magic reset email flow<br>• Add clear, authentic error reporting |
| [`src/services/storeService.js`](file:///c:/Users/VARUN%20THEJ/OneDrive/Desktop/Rodhe/src/services/storeService.js) | Commerce & Orders Engine | • Check product stock (`stockCount > 0`) before order creation<br>• Do NOT silently swallow Supabase write failures; throw explicit exception<br>• Mark electronic payments as `pending_payment` instead of fake `captured`<br>• Restore inventory if order is marked `cancelled` |
| [`src/components/CheckoutModal.jsx`](file:///c:/Users/VARUN%20THEJ/OneDrive/Desktop/Rodhe/src/components/CheckoutModal.jsx) | Checkout & Payment Modal | • Block confirmation and keep cart intact if database fails<br>• Display authentic error notification on failure<br>• Update security trust badges from "256-bit Bank Encryption" to "256-bit SSL Secure In-Transit Encryption" |
| [`src/components/AuthModal.jsx`](file:///c:/Users/VARUN%20THEJ/OneDrive/Desktop/Rodhe/src/components/AuthModal.jsx) | Patron Modal | • Update trust badges from misleading bank claims to authentic SSL transit privacy notice |
| [`supabase/migrations/20261108_phase_s0_security_remediation.sql`](file:///c:/Users/VARUN%20THEJ/OneDrive/Desktop/Rodhe/supabase/migrations/20261108_phase_s0_security_remediation.sql) | DDL & RLS Migration | • Author corrected idempotent RLS policies for `orders`, `order_items`, `customer_profiles`, `customer_addresses`, `payments`, `inventory_movements`, and `admin_users`<br>• Implement `public.is_admin()` and `public.lookup_order()` |
| [`supabase/migrations/20261108_phase_s0_rollback.sql`](file:///c:/Users/VARUN%20THEJ/OneDrive/Desktop/Rodhe/supabase/migrations/20261108_phase_s0_rollback.sql) | Rollback DDL | • Safe rollback script to restore staging state if required |

---

## 3. Strict Development Rules Followed

1. **Dedicated Branch**: Working on branch `security-phase-s0-remediation`.
2. **Zero Brand Damage**: Visual luxury aesthetics, typography (Cormorant Garamond, Marcellus), procedural Web Audio, and GSAP cloud intro are completely preserved.
3. **No Payment Integration Yet**: Only architectural payment readiness and removal of fake capture in this phase.
4. **Approval Gate**: Proposed SQL scripts are presented to user; **NO SQL is executed against production databases without explicit user authorization**.

