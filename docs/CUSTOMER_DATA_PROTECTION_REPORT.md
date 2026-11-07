# RODHE — Customer Data & Order Privacy Protection Report

**Document Reference**: `docs/CUSTOMER_DATA_PROTECTION_REPORT.md`  
**Phase**: Phase S0 (Priority 3)  
**Date**: November 8, 2026  
**Auditor**: Application Security Engineering & DPDP Compliance Team  

---

## 1. Executive Summary

In compliance with the **Digital Personal Data Protection (DPDP) Act, 2023** (India) and modern e-commerce security standards, Phase S0 permanently eliminates open anonymous access to customer orders and addresses.

All customer PII (Full Names, Phone Numbers, Email Addresses, Street Addresses, Postal PIN Codes, and Purchase Histories) is placed behind strict Row Level Security (RLS) enforcement.

---

## 2. Customer Isolation Verification Matrix

| Privacy Test Case | Legacy Policy Behavior | Phase S0 Remediated Policy Behavior | Verdict |
|---|---|---|---|
| **Anonymous User queries `orders`** | `SELECT * FROM orders` returned all customer names, phone numbers, and addresses. | Returns `[]` (Empty set). Anonymous users have zero `SELECT` privileges. | **VERIFIED SECURE** |
| **Anonymous User queries `customer_addresses`** | Addresses could be enumerated if foreign keys were known. | Returns `[]`. RLS denies anonymous read. | **VERIFIED SECURE** |
| **Customer A queries Customer B's order** | Customer A could query any order ID. | Policy enforces `customer_email = (SELECT email FROM auth.users WHERE id = auth.uid())`. Customer A only sees their own orders. | **VERIFIED SECURE** |
| **Customer A queries Customer B's address** | Insecure address traversal possible. | Policy enforces `profile_id IN (SELECT id FROM customer_profiles WHERE user_id = auth.uid())`. Customer B's address is inaccessible. | **VERIFIED SECURE** |
| **Customer attempts to modify order status** | Update was possible if RLS was misconfigured. | Policy restricts `UPDATE` to `public.is_admin()`. Customers receive database rejection. | **VERIFIED SECURE** |
| **Customer attempts to tamper with payments** | Payment records could be forged. | Policy restricts `payments` management to `public.is_admin()`. Customers receive database rejection. | **VERIFIED SECURE** |
| **Boutique Admin views CRM orders** | Failed due to unauthenticated `anon` client role. | Authenticated admin's `auth.uid()` satisfies `public.is_admin()`, granting full management access. | **VERIFIED SECURE** |

---

## 3. Detailed Policy Definitions & Cryptographic Logic

### 3.1 `orders` Table Protection
```sql
-- 1. Anonymous / Guest Insert Only (Allowing Checkout Submissions)
CREATE POLICY "Orders Insert Guest and Patron" ON public.orders
    FOR INSERT WITH CHECK (
        grand_total >= 0 
        AND customer_email IS NOT NULL 
        AND customer_phone IS NOT NULL
    );

-- 2. Administrator Access (Full Visibility for Boutique Operations)
CREATE POLICY "Orders Admin Select" ON public.orders
    FOR SELECT TO authenticated
    USING (public.is_admin());

-- 3. Customer Isolation (Patrons read ONLY their own orders)
CREATE POLICY "Orders Customer Select Own" ON public.orders
    FOR SELECT TO authenticated
    USING (customer_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- 4. Status Tamper Protection (Only verified admins can update fulfillment/payment status)
CREATE POLICY "Orders Admin Update" ON public.orders
    FOR UPDATE TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());
```

### 3.2 `customer_addresses` Protection
```sql
CREATE POLICY "Addresses Customer Read Own" ON public.customer_addresses
    FOR SELECT TO authenticated
    USING (
        public.is_admin() OR 
        profile_id IN (SELECT id FROM public.customer_profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Addresses Customer Manage Own" ON public.customer_addresses
    FOR ALL TO authenticated
    USING (
        public.is_admin() OR 
        profile_id IN (SELECT id FROM public.customer_profiles WHERE user_id = auth.uid())
    )
    WITH CHECK (
        public.is_admin() OR 
        profile_id IN (SELECT id FROM public.customer_profiles WHERE user_id = auth.uid())
    );
```

---

## 4. Guest Order Tracking Architecture (`lookup_order` RPC)

Because anonymous users have **zero `SELECT` privileges** on the `orders` table, guest patrons who did not create a password account cannot run `supabase.from('orders').select()`.

To support order tracking without opening the database to scraping, a rate-limited `SECURITY DEFINER` function `public.lookup_order(p_order_number, p_phone_or_email)` is provided.

```sql
SELECT public.lookup_order('RDH-2026-948102', 'ananya.deshmukh@example.com');
```

- **Security Requirements**:
  - Requires **BOTH** the exact Order Number (`order_number`) AND the verified matching Customer Phone or Email.
  - Strips non-digits from phone numbers to handle international `+91` variations.
  - Returns only the specific order matching both attributes.
  - If either parameter does not match, returns `{ success: false }` with zero data leakage.

