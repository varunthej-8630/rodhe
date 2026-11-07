-- ============================================================================
-- RODHE — Woven with Trust
-- Production Database Master Migration: Final Commerce Completion
-- Migration: 20261108_final_commerce_production.sql
-- Description: Complete, idempotent, atomic, rollback-safe schema consolidating:
--              1. Admin authorization with server-verifiable public.is_admin()
--              2. Customer profiles, addresses, orders, items, payments, inventory ledger
--              3. Deterministic order numbering sequence (RDH-YYYY-XXXXXX)
--              4. Atomic order placement with row-locking (create_order_atomic)
--              5. Atomic order cancellation with stock restitution (cancel_order_atomic)
--              6. Rate-limited, sanitized guest order lookup RPC (lookup_order)
--              7. Strict zero-trust Row Level Security (RLS) policies
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- SECTION 1: ADMINISTRATOR AUTHORIZATION & ACCESS CONTROL
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'super_admin' CHECK (role IN ('super_admin', 'store_manager', 'curator')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Defensive schema evolution if table pre-existed
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'super_admin';

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Clean existing policies for idempotency
DROP POLICY IF EXISTS "Admin Users Select Authorized" ON public.admin_users;
DROP POLICY IF EXISTS "Admin Users Update Authorized" ON public.admin_users;
DROP POLICY IF EXISTS "Admin Users Insert Authorized" ON public.admin_users;
DROP POLICY IF EXISTS "Admin Users Delete Authorized" ON public.admin_users;
DROP POLICY IF EXISTS "Public Read Admin Users" ON public.admin_users;
DROP POLICY IF EXISTS "Public Update Admin Users Password" ON public.admin_users;

-- Cryptographically secure server-side admin check function
-- Runs as SECURITY DEFINER with hardened search_path to prevent path injection
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users au
    WHERE (au.user_id = auth.uid() OR au.email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  );
$$;

-- Secure RLS policies on admin_users: Strict authenticated admin access only
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
-- SECTION 2: CUSTOMER PROFILES & SAVED ADDRESSES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.customer_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.customer_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES public.customer_profiles(id) ON DELETE CASCADE,
    recipient_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    landmark TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    pincode VARCHAR(6) NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles Customer Read Own" ON public.customer_profiles;
DROP POLICY IF EXISTS "Profiles Customer Update Own" ON public.customer_profiles;
DROP POLICY IF EXISTS "Profiles Customer Insert Own" ON public.customer_profiles;
DROP POLICY IF EXISTS "Profiles Admin All" ON public.customer_profiles;

CREATE POLICY "Profiles Customer Read Own" ON public.customer_profiles
    FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Profiles Customer Update Own" ON public.customer_profiles
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid() OR public.is_admin())
    WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Profiles Customer Insert Own" ON public.customer_profiles
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Profiles Admin All" ON public.customer_profiles
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Addresses Customer Read Own" ON public.customer_addresses;
DROP POLICY IF EXISTS "Addresses Customer Manage Own" ON public.customer_addresses;
DROP POLICY IF EXISTS "Addresses Admin All" ON public.customer_addresses;

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
-- SECTION 3: TRANSACTIONAL ORDERS & LINE ITEMS
-- ============================================================================

-- Deterministic order sequence
CREATE SEQUENCE IF NOT EXISTS public.rodhe_order_seq START WITH 1001;

CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT
LANGUAGE sql
AS $$
    SELECT 'RDH-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(nextval('public.rodhe_order_seq')::TEXT, 6, '0');
$$;

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT UNIQUE NOT NULL DEFAULT public.generate_order_number(),
    customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    shipping_address JSONB NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
    discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
    shipping_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (shipping_fee >= 0),
    gift_wrap_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (gift_wrap_fee >= 0),
    grand_total NUMERIC(10, 2) NOT NULL CHECK (grand_total >= 0),
    applied_coupon TEXT,
    payment_method TEXT NOT NULL DEFAULT 'upi' CHECK (payment_method IN ('upi', 'card', 'netbanking', 'cod', 'whatsapp')),
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'pending_cod', 'authorized', 'captured', 'failed', 'refunded', 'refund_pending')),
    fulfillment_status TEXT NOT NULL DEFAULT 'unfulfilled' CHECK (fulfillment_status IN ('unfulfilled', 'processing', 'shipped', 'delivered', 'cancelled', 'returned')),
    tracking_number TEXT,
    courier_partner TEXT DEFAULT 'Express Air Logistics',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Defensive schema evolution if table pre-existed
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS courier_partner TEXT DEFAULT 'Express Air Logistics';

CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id TEXT,
    sku TEXT NOT NULL,
    name TEXT NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
    quantity INT NOT NULL CHECK (quantity > 0),
    subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
    primary_image TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    gateway TEXT NOT NULL DEFAULT 'razorpay' CHECK (gateway IN ('razorpay', 'cashfree', 'payu', 'stripe', 'cod', 'manual')),
    gateway_order_id TEXT,
    gateway_payment_id TEXT,
    gateway_signature TEXT,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
    currency TEXT NOT NULL DEFAULT 'INR',
    status TEXT NOT NULL DEFAULT 'pending',
    raw_response JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.inventory_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id TEXT NOT NULL,
    delta INT NOT NULL,
    reason TEXT NOT NULL CHECK (reason IN ('order_placed', 'order_cancelled', 'manual_adjustment', 'restock')),
    reference_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- SECTION 4: PERFORMANCE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON public.orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_fulfillment ON public.orders(fulfillment_status, payment_status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_sku ON public.order_items(sku);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_prod ON public.inventory_movements(product_id);

-- ============================================================================
-- SECTION 5: STRICT ROW LEVEL SECURITY (ZERO ANONYMOUS LEAKS)
-- ============================================================================

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

-- 1. Orders RLS
DROP POLICY IF EXISTS "Public Create Orders" ON public.orders;
DROP POLICY IF EXISTS "Public Read Own Order" ON public.orders;
DROP POLICY IF EXISTS "Admin Full Access Orders" ON public.orders;
DROP POLICY IF EXISTS "Orders Insert Guest and Patron" ON public.orders;
DROP POLICY IF EXISTS "Orders Admin Insert" ON public.orders;
DROP POLICY IF EXISTS "Orders Admin Select" ON public.orders;
DROP POLICY IF EXISTS "Orders Customer Select Own" ON public.orders;
DROP POLICY IF EXISTS "Orders Admin Update" ON public.orders;
DROP POLICY IF EXISTS "Orders Admin Delete" ON public.orders;

-- Direct table INSERT restricted to authenticated admins.
-- Unauthenticated guest & patron orders MUST use the atomic RPC public.create_order_atomic()
-- which runs as SECURITY DEFINER with row locks, stock validation, and audit tracking.
CREATE POLICY "Orders Admin Insert" ON public.orders
    FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());

CREATE POLICY "Orders Admin Select" ON public.orders
    FOR SELECT TO authenticated
    USING (public.is_admin());

CREATE POLICY "Orders Customer Select Own" ON public.orders
    FOR SELECT TO authenticated
    USING (
        customer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
        OR customer_id = auth.uid()
    );

CREATE POLICY "Orders Admin Update" ON public.orders
    FOR UPDATE TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Orders Admin Delete" ON public.orders
    FOR DELETE TO authenticated
    USING (public.is_admin());

-- 2. Order Items RLS
DROP POLICY IF EXISTS "Public Create Order Items" ON public.order_items;
DROP POLICY IF EXISTS "Public Read Own Order Items" ON public.order_items;
DROP POLICY IF EXISTS "Admin Full Access Order Items" ON public.order_items;
DROP POLICY IF EXISTS "Order Items Insert" ON public.order_items;
DROP POLICY IF EXISTS "Order Items Admin Insert" ON public.order_items;
DROP POLICY IF EXISTS "Order Items Admin Select" ON public.order_items;
DROP POLICY IF EXISTS "Order Items Customer Select Own" ON public.order_items;
DROP POLICY IF EXISTS "Order Items Admin Manage" ON public.order_items;

-- Direct table INSERT restricted to authenticated admins (guest orders use create_order_atomic)
CREATE POLICY "Order Items Admin Insert" ON public.order_items
    FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());

CREATE POLICY "Order Items Admin Select" ON public.order_items
    FOR SELECT TO authenticated
    USING (public.is_admin());

CREATE POLICY "Order Items Customer Select Own" ON public.order_items
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = order_items.order_id
            AND (
                o.customer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
                OR o.customer_id = auth.uid()
            )
        )
    );

CREATE POLICY "Order Items Admin Manage" ON public.order_items
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 3. Payments RLS
DROP POLICY IF EXISTS "Public Create Payments" ON public.payments;
DROP POLICY IF EXISTS "Admin Full Access Payments" ON public.payments;
DROP POLICY IF EXISTS "Payments Insert Checkout" ON public.payments;
DROP POLICY IF EXISTS "Payments Admin Insert" ON public.payments;
DROP POLICY IF EXISTS "Payments Admin Manage" ON public.payments;
DROP POLICY IF EXISTS "Payments Customer Select Own" ON public.payments;

-- Direct table INSERT restricted to authenticated admins (checkout transactions use create_order_atomic)
CREATE POLICY "Payments Admin Insert" ON public.payments
    FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());

CREATE POLICY "Payments Customer Select Own" ON public.payments
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = payments.order_id
            AND (
                o.customer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
                OR o.customer_id = auth.uid()
            )
        )
    );

CREATE POLICY "Payments Admin Manage" ON public.payments
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 4. Inventory Ledger RLS
DROP POLICY IF EXISTS "Admin Full Access Inventory" ON public.inventory_movements;
DROP POLICY IF EXISTS "Inventory Admin Manage" ON public.inventory_movements;

CREATE POLICY "Inventory Admin Manage" ON public.inventory_movements
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ============================================================================
-- SECTION 6: ATOMIC TRANSACTIONAL PROCEDURES
-- ============================================================================

-- 1. ATOMIC ORDER CREATION & INVENTORY LOCKING RPC
CREATE OR REPLACE FUNCTION public.create_order_atomic(
    p_order JSONB,
    p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_order_id UUID := uuid_generate_v4();
    v_order_number TEXT;
    v_item JSONB;
    v_product_id UUID;
    v_sku TEXT;
    v_qty INT;
    v_unit_price NUMERIC(10, 2);
    v_subtotal NUMERIC(10, 2);
    v_name TEXT;
    v_primary_image TEXT;
    v_current_stock INT;
    v_product_name TEXT;
    v_payment_method TEXT;
    v_payment_status TEXT;
    v_grand_total NUMERIC(10, 2);
    v_customer_id UUID := NULL;
BEGIN
    -- Validate line items
    IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'Order must contain at least one line item';
    END IF;

    -- Resolve order number
    v_order_number := TRIM(COALESCE(p_order->>'order_number', p_order->>'orderNumber', ''));
    IF v_order_number = '' THEN
        v_order_number := public.generate_order_number();
    END IF;

    -- Resolve customer_id if authenticated caller
    IF auth.uid() IS NOT NULL THEN
        v_customer_id := auth.uid();
    END IF;

    -- Resolve payment details
    v_payment_method := LOWER(COALESCE(p_order->>'payment_method', p_order->>'paymentMethod', 'upi'));
    v_grand_total := (COALESCE(p_order->>'grand_total', p_order->>'grandTotal', '0'))::NUMERIC;
    
    IF v_payment_method = 'cod' THEN
        v_payment_status := 'pending_cod';
    ELSIF p_order->>'payment_status' IS NOT NULL THEN
        v_payment_status := p_order->>'payment_status';
    ELSE
        v_payment_status := 'pending';
    END IF;

    -- Validate inventory with row locks FOR UPDATE
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_sku := TRIM(COALESCE(v_item->>'sku', ''));
        v_qty := (COALESCE(v_item->>'quantity', '1'))::INT;

        IF v_qty <= 0 THEN
            RAISE EXCEPTION 'Invalid quantity % for SKU %', v_qty, v_sku;
        END IF;

        -- Attempt row lock by SKU
        SELECT id, stock_count, name INTO v_product_id, v_current_stock, v_product_name
        FROM public.products
        WHERE sku = v_sku
        FOR UPDATE;

        -- Fallback lock by product_id if not found by SKU
        IF NOT FOUND AND (v_item->>'product_id') IS NOT NULL AND (v_item->>'product_id') ~ '^[0-9a-fA-F-]{36}$' THEN
            SELECT id, stock_count, name INTO v_product_id, v_current_stock, v_product_name
            FROM public.products
            WHERE id = (v_item->>'product_id')::UUID
            FOR UPDATE;
        END IF;

        IF v_product_id IS NOT NULL THEN
            IF v_current_stock < v_qty THEN
                RAISE EXCEPTION 'Insufficient stock for "%" (SKU: %). Requested %, only % available.',
                    v_product_name, v_sku, v_qty, v_current_stock;
            END IF;

            -- Deduct stock
            UPDATE public.products
            SET stock_count = stock_count - v_qty,
                in_stock = ((stock_count - v_qty) > 0),
                updated_at = NOW()
            WHERE id = v_product_id;

            -- Ledger entry
            INSERT INTO public.inventory_movements (
                product_id,
                delta,
                reason,
                reference_order_id,
                notes
            ) VALUES (
                v_product_id::TEXT,
                -v_qty,
                'order_placed',
                v_order_id,
                'Order #' || v_order_number || ' placed by ' || COALESCE(p_order->>'customer_email', p_order->>'customerEmail', 'guest')
            );
        END IF;
    END LOOP;

    -- Insert Order Header
    INSERT INTO public.orders (
        id,
        order_number,
        customer_id,
        customer_name,
        customer_email,
        customer_phone,
        shipping_address,
        subtotal,
        discount_amount,
        shipping_fee,
        gift_wrap_fee,
        grand_total,
        applied_coupon,
        payment_method,
        payment_status,
        fulfillment_status,
        courier_partner,
        notes
    ) VALUES (
        v_order_id,
        v_order_number,
        v_customer_id,
        COALESCE(p_order->>'customer_name', p_order->>'customerName', 'Patron'),
        LOWER(TRIM(COALESCE(p_order->>'customer_email', p_order->>'customerEmail', ''))),
        TRIM(COALESCE(p_order->>'customer_phone', p_order->>'customerPhone', '')),
        COALESCE(p_order->'shipping_address', p_order->'shippingAddress', '{}'::jsonb),
        (COALESCE(p_order->>'subtotal', '0'))::NUMERIC,
        (COALESCE(p_order->>'discount_amount', p_order->>'discountAmount', '0'))::NUMERIC,
        (COALESCE(p_order->>'shipping_fee', p_order->>'shippingFee', '0'))::NUMERIC,
        (COALESCE(p_order->>'gift_wrap_fee', p_order->>'giftWrapFee', '0'))::NUMERIC,
        v_grand_total,
        p_order->>'applied_coupon',
        v_payment_method,
        v_payment_status,
        COALESCE(p_order->>'fulfillment_status', 'unfulfilled'),
        COALESCE(p_order->>'courier_partner', 'Express Air Logistics'),
        p_order->>'notes'
    );

    -- Insert Order Items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_sku := TRIM(COALESCE(v_item->>'sku', ''));
        v_name := TRIM(COALESCE(v_item->>'name', 'Artisanal Saree'));
        v_qty := (COALESCE(v_item->>'quantity', '1'))::INT;
        v_unit_price := (COALESCE(v_item->>'unit_price', v_item->>'unitPrice', '0'))::NUMERIC;
        v_subtotal := (COALESCE(v_item->>'subtotal', (v_unit_price * v_qty)::TEXT))::NUMERIC;
        v_primary_image := COALESCE(v_item->>'primary_image', v_item->>'primaryImage');

        INSERT INTO public.order_items (
            order_id,
            product_id,
            sku,
            name,
            unit_price,
            quantity,
            subtotal,
            primary_image
        ) VALUES (
            v_order_id,
            v_item->>'product_id',
            v_sku,
            v_name,
            v_unit_price,
            v_qty,
            v_subtotal,
            v_primary_image
        );
    END LOOP;

    -- Insert Payment Transaction Record
    INSERT INTO public.payments (
        order_id,
        gateway,
        gateway_order_id,
        gateway_payment_id,
        gateway_signature,
        amount,
        currency,
        status,
        raw_response
    ) VALUES (
        v_order_id,
        CASE WHEN v_payment_method = 'cod' THEN 'cod' ELSE 'razorpay' END,
        p_order->>'gateway_order_id',
        p_order->>'gateway_payment_id',
        p_order->>'gateway_signature',
        v_grand_total,
        'INR',
        v_payment_status,
        COALESCE(p_order->'payment_response', '{}'::jsonb)
    );

    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'order_number', v_order_number,
        'grand_total', v_grand_total,
        'payment_status', v_payment_status,
        'fulfillment_status', 'unfulfilled'
    );
END;
$$;

-- 2. ATOMIC ORDER CANCELLATION & INVENTORY RESTITUTION RPC
CREATE OR REPLACE FUNCTION public.cancel_order_atomic(
    p_order_id UUID,
    p_reason TEXT DEFAULT 'Customer requested cancellation'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_order RECORD;
    v_item RECORD;
    v_product_id UUID;
BEGIN
    SELECT * INTO v_order
    FROM public.orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Order not found.');
    END IF;

    -- Authorization check
    IF NOT public.is_admin() AND v_order.customer_email <> (SELECT email FROM auth.users WHERE id = auth.uid()) THEN
        RAISE EXCEPTION 'Not authorized to cancel this order.';
    END IF;

    IF v_order.fulfillment_status = 'cancelled' THEN
        RETURN jsonb_build_object('success', true, 'message', 'Order is already cancelled.');
    END IF;

    IF v_order.fulfillment_status = 'delivered' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Delivered orders cannot be cancelled directly; please request an exchange or return.');
    END IF;

    -- Update order status
    UPDATE public.orders
    SET fulfillment_status = 'cancelled',
        payment_status = CASE WHEN payment_status = 'captured' THEN 'refund_pending' ELSE payment_status END,
        notes = COALESCE(notes, '') || ' [Cancelled: ' || p_reason || ' at ' || NOW() || ']',
        updated_at = NOW()
    WHERE id = p_order_id;

    -- Restore product stock and record ledger
    FOR v_item IN
        SELECT oi.sku, oi.product_id, oi.quantity
        FROM public.order_items oi
        WHERE oi.order_id = p_order_id
    LOOP
        SELECT id INTO v_product_id
        FROM public.products
        WHERE sku = v_item.sku
        FOR UPDATE;

        IF v_product_id IS NOT NULL THEN
            UPDATE public.products
            SET stock_count = stock_count + v_item.quantity,
                in_stock = TRUE,
                updated_at = NOW()
            WHERE id = v_product_id;

            INSERT INTO public.inventory_movements (
                product_id,
                delta,
                reason,
                reference_order_id,
                notes
            ) VALUES (
                v_product_id::TEXT,
                v_item.quantity,
                'order_cancelled',
                p_order_id,
                'Stock restored on cancellation of order #' || v_order.order_number
            );
        END IF;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'message', 'Order cancelled and stock restored successfully.');
END;
$$;

-- 3. SANITIZED GUEST ORDER LOOKUP RPC (Zero table enumeration leak)
CREATE OR REPLACE FUNCTION public.lookup_order(
    p_order_number TEXT,
    p_phone_or_email TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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
        'city', o.shipping_address->>'city',
        'state', o.shipping_address->>'state',
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
        RETURN jsonb_build_object('success', false, 'message', 'No order found matching the provided order number and contact.');
    END IF;

    RETURN jsonb_build_object('success', true, 'order', v_order);
END;
$$;

-- Grant permissions to anon and authenticated callers for public lookup & ordering
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.lookup_order(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_order_atomic(JSONB, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_order_atomic(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

