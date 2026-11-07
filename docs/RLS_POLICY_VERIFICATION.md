# RODHE — Row Level Security (RLS) Policy Verification

**Document Reference**: `docs/RLS_POLICY_VERIFICATION.md`  
**Phase**: Phase S0 (Priority 3 & Priority 5)  
**Date**: November 8, 2026  
**Auditor**: Database Architect & Security Specialist  

---

## 1. Complete Database Tables & RLS Status Inventory

Every table in the RODHE PostgreSQL database has been verified for Row Level Security (RLS) activation and policy correctness.

| Table Name | RLS Enabled | Anon Privileges | Authenticated Customer Privileges | Authenticated Admin Privileges | Security Verdict |
|---|---|---|---|---|---|
| `public.admin_users` | **ENABLED** | **NONE (0 access)** | None | Full Access (`public.is_admin()`) | **SECURED** |
| `public.orders` | **ENABLED** | `INSERT` (Checkout only) | `SELECT` (Own orders only via email match) | `SELECT`, `UPDATE`, `DELETE` (`is_admin()`) | **SECURED** |
| `public.order_items` | **ENABLED** | `INSERT` (Checkout only) | `SELECT` (Own items only via order link) | Full Access (`is_admin()`) | **SECURED** |
| `public.customer_profiles` | **ENABLED** | **NONE** | `SELECT`, `UPDATE` (Own `user_id = auth.uid()`) | Full Access (`is_admin()`) | **SECURED** |
| `public.customer_addresses` | **ENABLED** | **NONE** | `SELECT`, `INSERT`, `UPDATE`, `DELETE` (Own profile) | Full Access (`is_admin()`) | **SECURED** |
| `public.payments` | **ENABLED** | `INSERT` (Checkout only) | **NONE** | Full Access (`is_admin()`) | **SECURED** |
| `public.inventory_movements` | **ENABLED** | **NONE** | **NONE** | Full Access (`is_admin()`) | **SECURED** |
| `public.products` | **ENABLED** | `SELECT` (Published only) | `SELECT` (Published only) | Full Access (`is_admin()`) | **SECURED** |
| `public.product_images` | **ENABLED** | `SELECT` (Public catalog) | `SELECT` (Public catalog) | Full Access (`is_admin()`) | **SECURED** |
| `public.collections` | **ENABLED** | `SELECT` (Published only) | `SELECT` (Published only) | Full Access (`is_admin()`) | **SECURED** |
| `public.product_collections` | **ENABLED** | `SELECT` (Published only) | `SELECT` (Published only) | Full Access (`is_admin()`) | **SECURED** |
| `public.store_settings` | **ENABLED** | `SELECT` (Store info) | `SELECT` (Store info) | `UPDATE` (`is_admin()`) | **SECURED** |
| `public.promotions` | **ENABLED** | `SELECT` (Active only) | `SELECT` (Active only) | Full Access (`is_admin()`) | **SECURED** |
| `public.testimonials` | **ENABLED** | `SELECT` (Published only) | `SELECT` (Published only) | Full Access (`is_admin()`) | **SECURED** |
| `public.enquiries` | **ENABLED** | `INSERT` (Contact form) | `INSERT` (Contact form) | Full Access (`is_admin()`) | **SECURED** |
| `public.community_signups` | **ENABLED** | `INSERT` (Footer circle) | `INSERT` (Footer circle) | Full Access (`is_admin()`) | **SECURED** |

---

## 2. Idempotency & Safe Policy Replacement

To eliminate previous PostgreSQL `duplicate_object` runtime migration crashes, every policy in `supabase/migrations/20261108_phase_s0_security_remediation.sql` follows the idempotent drop-and-create pattern:

```sql
DROP POLICY IF EXISTS "Policy Name" ON public.target_table;
CREATE POLICY "Policy Name" ON public.target_table ...;
```

This ensures that running migrations across local development, staging environments, and production is deterministic and repeatable with zero downtime.

---

## 3. Rollback Safety Plan

In the event of unforeseen edge cases during migration execution, an immediate rollback script has been created in [`supabase/migrations/20261108_phase_s0_rollback.sql`](file:///c:/Users/VARUN%20THEJ/OneDrive/Desktop/Rodhe/supabase/migrations/20261108_phase_s0_rollback.sql).

The rollback script safely re-establishes baseline staging permissions without dropping tables or altering stored customer records.

