-- ============================================================================
-- RODHE — Phase S0: Rollback Script
-- Migration Rollback: 20261108_phase_s0_rollback.sql
-- Description: Reverts Phase S0 security policies back to initial staging baseline
--              if emergency recovery is required.
-- ============================================================================

-- Revert orders policies to baseline
DROP POLICY IF EXISTS "Orders Insert Guest and Patron" ON public.orders;
DROP POLICY IF EXISTS "Orders Admin Select" ON public.orders;
DROP POLICY IF EXISTS "Orders Customer Select Own" ON public.orders;
DROP POLICY IF EXISTS "Orders Admin Update" ON public.orders;
DROP POLICY IF EXISTS "Orders Admin Delete" ON public.orders;

CREATE POLICY "Public Create Orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Read Own Order" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Admin Full Access Orders" ON public.orders FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Revert order_items policies to baseline
DROP POLICY IF EXISTS "Order Items Insert" ON public.order_items;
DROP POLICY IF EXISTS "Order Items Admin Select" ON public.order_items;
DROP POLICY IF EXISTS "Order Items Customer Select Own" ON public.order_items;
DROP POLICY IF EXISTS "Order Items Admin Manage" ON public.order_items;

CREATE POLICY "Public Create Order Items" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Read Own Order Items" ON public.order_items FOR SELECT USING (true);
CREATE POLICY "Admin Full Access Order Items" ON public.order_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Revert admin_users policies to baseline
DROP POLICY IF EXISTS "Admin Users Select Authorized" ON public.admin_users;
DROP POLICY IF EXISTS "Admin Users Update Authorized" ON public.admin_users;
DROP POLICY IF EXISTS "Admin Users Insert Authorized" ON public.admin_users;
DROP POLICY IF EXISTS "Admin Users Delete Authorized" ON public.admin_users;

CREATE POLICY "Allow Login Verification" ON public.admin_users FOR SELECT USING (true);
CREATE POLICY "Admin Authenticated Select" ON public.admin_users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin Authenticated Update" ON public.admin_users FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.lookup_order(TEXT, TEXT);

