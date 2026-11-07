-- ============================================================================
-- RODHE — Woven with Trust
-- Rollback Migration for: 20261108_final_commerce_production.sql
-- Description: Safely drops functions, RPCs, and restores previous security baseline.
-- ============================================================================

-- 1. Drop Stored Procedures & RPCs
DROP FUNCTION IF EXISTS public.lookup_order(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.cancel_order_atomic(UUID, TEXT);
DROP FUNCTION IF EXISTS public.create_order_atomic(JSONB, JSONB);
DROP FUNCTION IF EXISTS public.generate_order_number();

-- 2. Drop Sequence
DROP SEQUENCE IF EXISTS public.rodhe_order_seq;

-- 3. Drop RLS Policies
DROP POLICY IF EXISTS "Orders Insert Guest and Patron" ON public.orders;
DROP POLICY IF EXISTS "Orders Admin Insert" ON public.orders;
DROP POLICY IF EXISTS "Orders Admin Select" ON public.orders;
DROP POLICY IF EXISTS "Orders Customer Select Own" ON public.orders;
DROP POLICY IF EXISTS "Orders Admin Update" ON public.orders;
DROP POLICY IF EXISTS "Orders Admin Delete" ON public.orders;

DROP POLICY IF EXISTS "Order Items Insert" ON public.order_items;
DROP POLICY IF EXISTS "Order Items Admin Insert" ON public.order_items;
DROP POLICY IF EXISTS "Order Items Admin Select" ON public.order_items;
DROP POLICY IF EXISTS "Order Items Customer Select Own" ON public.order_items;
DROP POLICY IF EXISTS "Order Items Admin Manage" ON public.order_items;

DROP POLICY IF EXISTS "Payments Insert Checkout" ON public.payments;
DROP POLICY IF EXISTS "Payments Admin Insert" ON public.payments;
DROP POLICY IF EXISTS "Payments Customer Select Own" ON public.payments;
DROP POLICY IF EXISTS "Payments Admin Manage" ON public.payments;

DROP POLICY IF EXISTS "Inventory Admin Manage" ON public.inventory_movements;

DROP POLICY IF EXISTS "Addresses Customer Read Own" ON public.customer_addresses;
DROP POLICY IF EXISTS "Addresses Customer Manage Own" ON public.customer_addresses;
DROP POLICY IF EXISTS "Addresses Admin All" ON public.customer_addresses;

DROP POLICY IF EXISTS "Profiles Customer Read Own" ON public.customer_profiles;
DROP POLICY IF EXISTS "Profiles Customer Update Own" ON public.customer_profiles;
DROP POLICY IF EXISTS "Profiles Customer Insert Own" ON public.customer_profiles;
DROP POLICY IF EXISTS "Profiles Admin All" ON public.customer_profiles;

DROP POLICY IF EXISTS "Admin Users Select Authorized" ON public.admin_users;
DROP POLICY IF EXISTS "Admin Users Update Authorized" ON public.admin_users;
DROP POLICY IF EXISTS "Admin Users Insert Authorized" ON public.admin_users;
DROP POLICY IF EXISTS "Admin Users Delete Authorized" ON public.admin_users;

-- 4. Note: Master tables (orders, order_items, payments, customer_profiles, customer_addresses, admin_users)
-- are NOT dropped by default during rollback to protect existing business data.

