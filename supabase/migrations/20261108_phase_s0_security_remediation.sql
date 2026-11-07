-- ============================================================================
-- RODHE — Phase S0: Emergency Security & Customer Data Protection
-- Migration: 20261108_phase_s0_security_remediation.sql
-- Description: Hardens RLS policies, revokes anonymous public access to customer PII,
--              implements server-verifiable is_admin() function, and establishes
--              authenticated ownership for orders, customer profiles, and addresses.
-- ============================================================================

-- Ensure UUID extension exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- SECTION 1: VERIFIABLE ADMINISTRATOR AUTHORIZATION
-- ============================================================================

-- Ensure admin_users has a foreign key to auth.users if available
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'super_admin' CHECK (role IN ('super_admin', 'store_manager', 'curator')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on admin_users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Drop all legacy insecure policies on admin_users
DROP POLICY IF EXISTS "Public Read Admin Users" ON public.admin_users;
DROP POLICY IF EXISTS "Public Update Admin Users Password" ON public.admin_users;
DROP POLICY IF EXISTS "Public Insert Admin Users" ON public.admin_users;
DROP POLICY IF EXISTS "Allow Login Verification" ON public.admin_users;
DROP POLICY IF EXISTS "Admin Authenticated Select" ON public.admin_users;
DROP POLICY IF EXISTS "Admin Authenticated Update" ON public.admin_users;
DROP POLICY IF EXISTS "Admin Users Self Select" ON public.admin_users;
DROP POLICY IF EXISTS "Admin Users Self Update" ON public.admin_users;

-- Cryptographically secure server-side admin check function
-- Runs as SECURITY DEFINER to check admin membership without exposing table dump
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users au
    WHERE (au.user_id = auth.uid() OR au.email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  );
$$;

-- Secure RLS policies on admin_users: Zero anonymous access
CREATE POLICY "Admin Users Select Authorized" ON public.admin_users
    FOR SELECT TO authenticated
    USING (public.is_admin() OR user_id = auth.uid());

CREATE POLICY "Admin Users Update Authorized" ON public.admin_users
    FOR UPDATE TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Admin Users Insert Authorized" ON public.admin_users
    FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());

CREATE POLICY "Admin Users Delete Authorized" ON public.admin_users
    FOR DELETE TO authenticated
    USING (public.is_admin());


-- ============================================================================
-- SECTION 2: CUSTOMER ORDER PRIVACY & PII PROTECTION
-- ============================================================================

-- Ensure orders table exists with RLS enabled
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Drop insecure open-access policies
DROP POLICY IF EXISTS "Public Read Own Order" ON public.orders;
DROP POLICY IF EXISTS "Public Create Orders" ON public.orders;
DROP POLICY IF EXISTS "Admin Full Access Orders" ON public.orders;
DROP POLICY IF EXISTS "Orders Insert Guest and Patron" ON public.orders;
DROP POLICY IF EXISTS "Orders Admin Select" ON public.orders;
DROP POLICY IF EXISTS "Orders Customer Select Own" ON public.orders;
DROP POLICY IF EXISTS "Orders Admin Update" ON public.orders;
DROP POLICY IF EXISTS "Orders Admin Delete" ON public.orders;

-- 1. Guest & Patron Order Creation:
-- Allows checkout submissions while validating data structure
CREATE POLICY "Orders Insert Guest and Patron" ON public.orders
    FOR INSERT
    WITH CHECK (
        grand_total >= 0 
        AND customer_email IS NOT NULL 
        AND customer_phone IS NOT NULL
    );

-- 2. Administrator Order Access:
-- Full read privileges for authenticated boutique administrators
CREATE POLICY "Orders Admin Select" ON public.orders
    FOR SELECT TO authenticated
    USING (public.is_admin());

-- 3. Authenticated Customer Access:
-- Customers can ONLY view orders where the customer_email matches their auth.users email
CREATE POLICY "Orders Customer Select Own" ON public.orders
    FOR SELECT TO authenticated
    USING (
        customer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

-- 4. Administrator Order Status Updates:
-- Prevents customers or anonymous users from tampering with fulfillment or payment status
CREATE POLICY "Orders Admin Update" ON public.orders
    FOR UPDATE TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 5. Administrator Order Deletion:
CREATE POLICY "Orders Admin Delete" ON public.orders
    FOR DELETE TO authenticated
    USING (public.is_admin());


-- ============================================================================
-- SECTION 3: ORDER LINE ITEMS PRIVACY
-- ============================================================================

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Own Order Items" ON public.order_items;
DROP POLICY IF EXISTS "Public Create Order Items" ON public.order_items;
DROP POLICY IF EXISTS "Admin Full Access Order Items" ON public.order_items;
DROP POLICY IF EXISTS "Order Items Insert" ON public.order_items;
DROP POLICY IF EXISTS "Order Items Admin Select" ON public.order_items;
DROP POLICY IF EXISTS "Order Items Customer Select Own" ON public.order_items;
DROP POLICY IF EXISTS "Order Items Admin Manage" ON public.order_items;

-- 1. Insert permission during checkout
CREATE POLICY "Order Items Insert" ON public.order_items
    FOR INSERT
    WITH CHECK (unit_price >= 0 AND quantity > 0);

-- 2. Administrator read access
CREATE POLICY "Order Items Admin Select" ON public.order_items
    FOR SELECT TO authenticated
    USING (public.is_admin());

-- 3. Customer read access (restricted to items belonging to their own orders)
CREATE POLICY "Order Items Customer Select Own" ON public.order_items
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = order_items.order_id
            AND o.customer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
        )
    );

-- 4. Administrator management (Update / Delete)
CREATE POLICY "Order Items Admin Manage" ON public.order_items
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());


-- ============================================================================
-- SECTION 4: CUSTOMER PROFILES & ADDRESS PRIVACY
-- ============================================================================

ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles Customer Read Own" ON public.customer_profiles;
DROP POLICY IF EXISTS "Profiles Customer Update Own" ON public.customer_profiles;
DROP POLICY IF EXISTS "Profiles Admin All" ON public.customer_profiles;
DROP POLICY IF EXISTS "Addresses Customer Read Own" ON public.customer_addresses;
DROP POLICY IF EXISTS "Addresses Customer Manage Own" ON public.customer_addresses;
DROP POLICY IF EXISTS "Addresses Admin All" ON public.customer_addresses;

-- Profiles: Customers read/update their own profile; admins manage all
CREATE POLICY "Profiles Customer Read Own" ON public.customer_profiles
    FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Profiles Customer Update Own" ON public.customer_profiles
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid() OR public.is_admin())
    WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Profiles Admin All" ON public.customer_profiles
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Addresses: Customers manage their own addresses; admins view all
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


-- ============================================================================
-- SECTION 5: PAYMENTS & INVENTORY AUDIT AUDITING
-- ============================================================================

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Create Payments" ON public.payments;
DROP POLICY IF EXISTS "Admin Full Access Payments" ON public.payments;
DROP POLICY IF EXISTS "Admin Full Access Inventory" ON public.inventory_movements;
DROP POLICY IF EXISTS "Payments Insert Checkout" ON public.payments;
DROP POLICY IF EXISTS "Payments Admin Manage" ON public.payments;
DROP POLICY IF EXISTS "Inventory Admin Manage" ON public.inventory_movements;

CREATE POLICY "Payments Insert Checkout" ON public.payments
    FOR INSERT
    WITH CHECK (amount >= 0);

CREATE POLICY "Payments Admin Manage" ON public.payments
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Inventory Admin Manage" ON public.inventory_movements
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ============================================================================
-- SECTION 6: GUEST ORDER LOOKUP SECURE RPC (Zero broad SELECT access)
-- ============================================================================

-- Secure function allowing a customer to look up their specific order receipt
-- without granting table-wide SELECT permissions to anonymous users
CREATE OR REPLACE FUNCTION public.lookup_order(
    p_order_number TEXT,
    p_phone_or_email TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order JSONB;
    v_clean_contact TEXT;
BEGIN
    v_clean_contact := LOWER(TRIM(p_phone_or_email));

    SELECT jsonb_build_object(
        'order_number', o.order_number,
        'customer_name', o.customer_name,
        'created_at', o.created_at,
        'fulfillment_status', o.fulfillment_status,
        'payment_status', o.payment_status,
        'payment_method', o.payment_method,
        'subtotal', o.subtotal,
        'discount_amount', o.discount_amount,
        'shipping_fee', o.shipping_fee,
        'grand_total', o.grand_total,
        'courier_partner', o.courier_partner,
        'tracking_number', o.tracking_number,
        'items', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'sku', it.sku,
                'name', it.name,
                'unit_price', it.unit_price,
                'quantity', it.quantity,
                'subtotal', it.subtotal,
                'primary_image', it.primary_image
            ))
            FROM public.order_items it
            WHERE it.order_id = o.id
        ), '[]'::jsonb)
    ) INTO v_order
    FROM public.orders o
    WHERE o.order_number = TRIM(p_order_number)
      AND (
          LOWER(o.customer_email) = v_clean_contact 
          OR REGEXP_REPLACE(o.customer_phone, '\D', '', 'g') = REGEXP_REPLACE(v_clean_contact, '\D', '', 'g')
      )
    LIMIT 1;

    IF v_order IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'No order found matching the provided reference and contact.');
    END IF;

    RETURN jsonb_build_object('success', true, 'order', v_order);
END;
$$;

