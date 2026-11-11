-- ============================================================================
-- RODHE — Woven with Trust
-- Production SQL Migration: Direct UPI Checkout & Manual CRM Reconciliation
-- Migration: 20261112_upi_manual_reconciliation.sql
-- IMPORTANT: Review carefully and execute manually in Supabase SQL Editor.
-- Do NOT allow automatic 'PAID' transitions from client browsers.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. PREREQUISITE TABLES & ADMIN HELPER (Idempotent if not yet applied)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'super_admin' CHECK (role IN ('super_admin', 'store_manager', 'curator')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'super_admin';
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users au
    WHERE (
      au.user_id = auth.uid()
      OR LOWER(au.email) = LOWER((SELECT email FROM auth.users WHERE id = auth.uid()))
    )
  );
$$;

DROP POLICY IF EXISTS "Admin Users Select Authorized" ON public.admin_users;
DROP POLICY IF EXISTS "Admin Users Update Authorized" ON public.admin_users;
DROP POLICY IF EXISTS "Admin Users Insert Authorized" ON public.admin_users;
DROP POLICY IF EXISTS "Admin Users Delete Authorized" ON public.admin_users;
DROP POLICY IF EXISTS "Public Read Admin Users" ON public.admin_users;
DROP POLICY IF EXISTS "Allow Login Verification" ON public.admin_users;

CREATE POLICY "Admin Users Select Authorized" ON public.admin_users
    FOR SELECT TO authenticated
    USING (public.is_admin() OR user_id = auth.uid());

CREATE POLICY "Admin Users Insert Authorized" ON public.admin_users
    FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());

CREATE POLICY "Admin Users Update Authorized" ON public.admin_users
    FOR UPDATE TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Admin Users Delete Authorized" ON public.admin_users
    FOR DELETE TO authenticated
    USING (public.is_admin());

-- Customer profiles & addresses (strictly user-scoped)
CREATE TABLE IF NOT EXISTS public.customer_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.customer_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.customer_profiles(id) ON DELETE CASCADE,
    label TEXT NOT NULL DEFAULT 'Home',
    recipient_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    landmark TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    pincode VARCHAR(6) NOT NULL CHECK (pincode ~ '^[1-9][0-9]{5}$'),
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.customer_addresses ADD COLUMN IF NOT EXISTS label TEXT DEFAULT 'Home';
ALTER TABLE public.customer_addresses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles Customer Read Own" ON public.customer_profiles;
DROP POLICY IF EXISTS "Profiles Customer Insert Own" ON public.customer_profiles;
DROP POLICY IF EXISTS "Profiles Customer Update Own" ON public.customer_profiles;
DROP POLICY IF EXISTS "Profiles Admin All" ON public.customer_profiles;

CREATE POLICY "Profiles Customer Read Own" ON public.customer_profiles
    FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Profiles Customer Insert Own" ON public.customer_profiles
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Profiles Customer Update Own" ON public.customer_profiles
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Profiles Admin All" ON public.customer_profiles
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Addresses Customer Read Own" ON public.customer_addresses;
DROP POLICY IF EXISTS "Addresses Customer Manage Own" ON public.customer_addresses;

CREATE POLICY "Addresses Customer Read Own" ON public.customer_addresses
    FOR SELECT TO authenticated
    USING (
        public.is_admin()
        OR profile_id IN (SELECT id FROM public.customer_profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Addresses Customer Manage Own" ON public.customer_addresses
    FOR ALL TO authenticated
    USING (
        public.is_admin()
        OR profile_id IN (SELECT id FROM public.customer_profiles WHERE user_id = auth.uid())
    )
    WITH CHECK (
        public.is_admin()
        OR profile_id IN (SELECT id FROM public.customer_profiles WHERE user_id = auth.uid())
    );

-- ============================================================================
-- 2. ORDERS, ORDER ITEMS, PAYMENTS, INVENTORY & VERIFICATION AUDIT LOG
-- ============================================================================

CREATE SEQUENCE IF NOT EXISTS public.rodhe_order_seq START WITH 1001;

CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT
LANGUAGE sql
SET search_path = public, pg_temp
AS $$
    SELECT 'RDH-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(nextval('public.rodhe_order_seq')::TEXT, 6, '0');
$$;

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT UNIQUE NOT NULL DEFAULT public.generate_order_number(),
    idempotency_key TEXT UNIQUE,
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
    payment_method TEXT NOT NULL DEFAULT 'upi_phonepe',
    payment_status TEXT NOT NULL DEFAULT 'PENDING',
    utr_reference TEXT,
    payment_submitted_at TIMESTAMPTZ,
    payment_expires_at TIMESTAMPTZ,
    verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    verified_by_email TEXT,
    verified_at TIMESTAMPTZ,
    verification_notes TEXT,
    fulfillment_status TEXT NOT NULL DEFAULT 'unfulfilled',
    tracking_number TEXT,
    courier_partner TEXT DEFAULT 'Express Air Logistics',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Defensive column evolution if orders existed earlier
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS idempotency_key TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS utr_reference TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_submitted_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_expires_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS verified_by_email TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS verification_notes TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS courier_partner TEXT DEFAULT 'Express Air Logistics';

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_idempotency_key
    ON public.orders(idempotency_key) WHERE idempotency_key IS NOT NULL;

-- Expand check constraints cleanly
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_payment_method_check
    CHECK (payment_method IN ('upi', 'upi_phonepe', 'upi_gpay', 'upi_paytm', 'card', 'netbanking', 'cod', 'whatsapp'));

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_payment_status_check
    CHECK (payment_status IN (
        'CREATED', 'PENDING', 'AWAITING_VERIFICATION', 'PAID', 'FAILED', 'CANCELLED', 'EXPIRED', 'REFUNDED',
        'pending', 'pending_cod', 'pending_payment', 'authorized', 'captured', 'failed', 'refunded', 'refund_pending'
    ));

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_fulfillment_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_fulfillment_status_check
    CHECK (fulfillment_status IN ('unfulfilled', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'));

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
    gateway TEXT NOT NULL DEFAULT 'upi_manual',
    upi_app TEXT,
    merchant_vpa TEXT,
    payee_name TEXT,
    utr_reference TEXT,
    attempt_number INT NOT NULL DEFAULT 1,
    gateway_order_id TEXT,
    gateway_payment_id TEXT,
    gateway_signature TEXT,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
    currency TEXT NOT NULL DEFAULT 'INR',
    status TEXT NOT NULL DEFAULT 'PENDING',
    expires_at TIMESTAMPTZ,
    verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    verified_by_email TEXT,
    verified_at TIMESTAMPTZ,
    verification_notes TEXT,
    rejection_reason TEXT,
    raw_response JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS upi_app TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS merchant_vpa TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payee_name TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS utr_reference TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS attempt_number INT NOT NULL DEFAULT 1;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS verified_by_email TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS verification_notes TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_gateway_check;
ALTER TABLE public.payments ADD CONSTRAINT payments_gateway_check
    CHECK (gateway IN ('upi_phonepe', 'upi_gpay', 'upi_paytm', 'upi_manual', 'razorpay', 'cashfree', 'payu', 'stripe', 'cod', 'manual'));

CREATE TABLE IF NOT EXISTS public.inventory_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id TEXT NOT NULL,
    delta INT NOT NULL,
    reason TEXT NOT NULL CHECK (reason IN ('order_placed', 'order_cancelled', 'manual_adjustment', 'restock')),
    reference_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payment_verification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
    action TEXT NOT NULL CHECK (action IN (
        'payment_created', 'utr_submitted', 'retry_initiated',
        'verified_paid', 'rejected_mismatch', 'marked_expired', 'marked_cancelled', 'marked_refunded'
    )),
    previous_status TEXT,
    new_status TEXT NOT NULL,
    utr_reference TEXT,
    actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    actor_email TEXT,
    actor_role TEXT DEFAULT 'system',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON public.orders(LOWER(customer_email));
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_order_id ON public.payment_verification_logs(order_id, created_at DESC);

-- ============================================================================
-- 3. STRICT ZERO-TRUST ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_verification_logs ENABLE ROW LEVEL SECURITY;

-- Orders: NO direct anon insert/update/select; customers read OWN orders only; admins full access
DROP POLICY IF EXISTS "Public Create Orders" ON public.orders;
DROP POLICY IF EXISTS "Public Read Own Order" ON public.orders;
DROP POLICY IF EXISTS "Admin Full Access Orders" ON public.orders;
DROP POLICY IF EXISTS "Orders Admin Insert" ON public.orders;
DROP POLICY IF EXISTS "Orders Admin Select" ON public.orders;
DROP POLICY IF EXISTS "Orders Customer Select Own" ON public.orders;
DROP POLICY IF EXISTS "Orders Admin Update" ON public.orders;
DROP POLICY IF EXISTS "Orders Admin Delete" ON public.orders;

CREATE POLICY "Orders Admin Insert" ON public.orders
    FOR INSERT TO authenticated WITH CHECK (public.is_admin());

CREATE POLICY "Orders Admin Select" ON public.orders
    FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY "Orders Customer Select Own" ON public.orders
    FOR SELECT TO authenticated
    USING (
        customer_id = auth.uid()
        OR LOWER(customer_email) = LOWER(COALESCE(auth.jwt() ->> 'email', ''))
    );

CREATE POLICY "Orders Admin Update" ON public.orders
    FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Orders Admin Delete" ON public.orders
    FOR DELETE TO authenticated USING (public.is_admin());

-- Order items
DROP POLICY IF EXISTS "Public Create Order Items" ON public.order_items;
DROP POLICY IF EXISTS "Public Read Own Order Items" ON public.order_items;
DROP POLICY IF EXISTS "Admin Full Access Order Items" ON public.order_items;
DROP POLICY IF EXISTS "Order Items Admin Insert" ON public.order_items;
DROP POLICY IF EXISTS "Order Items Admin Select" ON public.order_items;
DROP POLICY IF EXISTS "Order Items Customer Select Own" ON public.order_items;
DROP POLICY IF EXISTS "Order Items Admin Manage" ON public.order_items;

CREATE POLICY "Order Items Admin Select" ON public.order_items
    FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY "Order Items Customer Select Own" ON public.order_items
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = order_items.order_id
              AND (o.customer_id = auth.uid() OR LOWER(o.customer_email) = LOWER(COALESCE(auth.jwt() ->> 'email', '')))
        )
    );

CREATE POLICY "Order Items Admin Manage" ON public.order_items
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Payments (no customer write access ever)
DROP POLICY IF EXISTS "Public Create Payments" ON public.payments;
DROP POLICY IF EXISTS "Admin Full Access Payments" ON public.payments;
DROP POLICY IF EXISTS "Payments Admin Insert" ON public.payments;
DROP POLICY IF EXISTS "Payments Admin Manage" ON public.payments;
DROP POLICY IF EXISTS "Payments Customer Select Own" ON public.payments;

CREATE POLICY "Payments Customer Select Own" ON public.payments
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = payments.order_id
              AND (o.customer_id = auth.uid() OR LOWER(o.customer_email) = LOWER(COALESCE(auth.jwt() ->> 'email', '')))
        )
    );

CREATE POLICY "Payments Admin Manage" ON public.payments
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Inventory & Verification Logs: Admin read/manage ONLY
DROP POLICY IF EXISTS "Inventory Admin Manage" ON public.inventory_movements;
CREATE POLICY "Inventory Admin Manage" ON public.inventory_movements
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Payment Logs Admin Select" ON public.payment_verification_logs;
CREATE POLICY "Payment Logs Admin Select" ON public.payment_verification_logs
    FOR SELECT TO authenticated USING (public.is_admin());

-- ============================================================================
-- 4. SERVER-AUTHORITATIVE ATOMIC ORDER & UPI LIFECYCLE RPCS
-- ============================================================================

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
    v_order_id UUID := gen_random_uuid();
    v_payment_id UUID := gen_random_uuid();
    v_idempotency_key TEXT;
    v_existing RECORD;
    v_order_number TEXT;
    v_item JSONB;
    v_product RECORD;
    v_qty INT;
    v_unit_price NUMERIC(10, 2);
    v_line_subtotal NUMERIC(10, 2);
    v_subtotal NUMERIC(10, 2) := 0;
    v_discount_amount NUMERIC(10, 2) := 0;
    v_shipping_fee NUMERIC(10, 2) := 0;
    v_gift_wrap_fee NUMERIC(10, 2) := 0;
    v_grand_total NUMERIC(10, 2) := 0;
    v_free_threshold NUMERIC(10, 2) := 2999.00;
    v_std_shipping NUMERIC(10, 2) := 199.00;
    v_cfg_gift_fee NUMERIC(10, 2) := 150.00;
    v_coupon_code TEXT;
    v_promo RECORD;
    v_payment_method TEXT;
    v_payment_status TEXT;
    v_customer_id UUID := auth.uid();
    v_expires_at TIMESTAMPTZ := NOW() + INTERVAL '30 minutes';
    v_merchant_vpa TEXT;
    v_payee_name TEXT;
    v_resolved_items JSONB := '[]'::jsonb;
BEGIN
    IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'Order must contain at least one line item.';
    END IF;

    -- 1. Idempotency protection: prevent duplicate orders on refresh/double submit
    v_idempotency_key := NULLIF(TRIM(COALESCE(p_order->>'idempotency_key', p_order->>'idempotencyKey', '')), '');
    IF v_idempotency_key IS NOT NULL THEN
        SELECT id, order_number, grand_total, payment_status, payment_method, payment_expires_at
        INTO v_existing
        FROM public.orders
        WHERE idempotency_key = v_idempotency_key
        LIMIT 1;

        IF FOUND THEN
            RETURN jsonb_build_object(
                'success', true,
                'idempotent_replay', true,
                'order_id', v_existing.id,
                'order_number', v_existing.order_number,
                'grand_total', v_existing.grand_total,
                'payment_status', v_existing.payment_status,
                'payment_method', v_existing.payment_method,
                'payment_expires_at', v_existing.payment_expires_at,
                'fulfillment_status', 'unfulfilled'
            );
        END IF;
    END IF;

    -- 2. Validate customer essentials
    IF TRIM(COALESCE(p_order->>'customer_name', p_order->>'customerName', '')) = ''
       OR TRIM(COALESCE(p_order->>'customer_phone', p_order->>'customerPhone', '')) = '' THEN
        RAISE EXCEPTION 'Customer name and mobile number are required.';
    END IF;

    -- 3. Lock inventory rows & compute authoritative product unit prices from DB
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_qty := COALESCE((v_item->>'quantity')::INT, 1);
        IF v_qty <= 0 OR v_qty > 25 THEN
            RAISE EXCEPTION 'Invalid item quantity: %', v_qty;
        END IF;

        SELECT id, slug, sku, name, selling_price, stock_count, in_stock, status
        INTO v_product
        FROM public.products
        WHERE (sku = TRIM(COALESCE(v_item->>'sku', '')) AND TRIM(COALESCE(v_item->>'sku', '')) <> '')
           OR slug = TRIM(COALESCE(v_item->>'product_id', v_item->>'id', ''))
           OR (CASE WHEN COALESCE(v_item->>'product_id', '') ~ '^[0-9a-fA-F-]{36}$' THEN id = (v_item->>'product_id')::UUID ELSE FALSE END)
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Product % could not be verified in boutique catalog.', COALESCE(v_item->>'name', v_item->>'sku', 'item');
        END IF;

        IF v_product.status <> 'published' OR NOT v_product.in_stock THEN
            RAISE EXCEPTION 'Saree "%" is currently unavailable.', v_product.name;
        END IF;

        IF v_product.stock_count < v_qty THEN
            RAISE EXCEPTION 'Insufficient inventory for "%". Only % available in atelier.', v_product.name, v_product.stock_count;
        END IF;

        v_unit_price := v_product.selling_price;
        v_line_subtotal := ROUND(v_unit_price * v_qty, 2);
        v_subtotal := v_subtotal + v_line_subtotal;

        v_resolved_items := v_resolved_items || jsonb_build_object(
            'product_uuid', v_product.id,
            'product_ref', COALESCE(v_product.slug, v_product.id::TEXT),
            'sku', v_product.sku,
            'name', v_product.name,
            'unit_price', v_unit_price,
            'quantity', v_qty,
            'subtotal', v_line_subtotal,
            'primary_image', COALESCE(v_item->>'primary_image', v_item->>'primaryImage', '/assets/products/saree_ivory_mulmul.jpg')
        );
    END LOOP;

    -- 4. Server-side store settings & shipping / gift-wrap computation
    SELECT free_shipping_threshold, standard_shipping_fee, gift_wrap_fee
    INTO v_free_threshold, v_std_shipping, v_cfg_gift_fee
    FROM public.store_settings
    LIMIT 1;

    v_free_threshold := COALESCE(v_free_threshold, 2999.00);
    v_std_shipping := COALESCE(v_std_shipping, 199.00);
    v_cfg_gift_fee := COALESCE(v_cfg_gift_fee, 150.00);

    -- 5. Server-side coupon validation (never trust client discount_amount)
    v_coupon_code := UPPER(TRIM(COALESCE(p_order->>'applied_coupon', p_order->>'appliedCoupon', '')));
    IF v_coupon_code <> '' THEN
        SELECT * INTO v_promo
        FROM public.promotions
        WHERE UPPER(code) = v_coupon_code
          AND is_active = TRUE
          AND (start_date IS NULL OR start_date <= NOW())
          AND (end_date IS NULL OR end_date >= NOW())
        LIMIT 1;

        IF FOUND AND v_subtotal >= COALESCE(v_promo.min_order_amount, 0) THEN
            IF v_promo.discount_type = 'percentage' THEN
                v_discount_amount := ROUND((v_subtotal * LEAST(v_promo.discount_value, 80)) / 100.0, 0);
            ELSE
                v_discount_amount := LEAST(v_promo.discount_value, v_subtotal);
            END IF;
        ELSE
            v_coupon_code := NULL;
            v_discount_amount := 0;
        END IF;
    ELSE
        v_coupon_code := NULL;
    END IF;

    v_shipping_fee := CASE WHEN GREATEST(0, v_subtotal - v_discount_amount) >= v_free_threshold THEN 0 ELSE v_std_shipping END;
    v_gift_wrap_fee := CASE WHEN COALESCE((p_order->>'gift_wrap')::BOOLEAN, (p_order->>'giftWrap')::BOOLEAN, FALSE) THEN v_cfg_gift_fee ELSE 0 END;
    v_grand_total := GREATEST(0, ROUND(v_subtotal - v_discount_amount + v_shipping_fee + v_gift_wrap_fee, 2));

    -- 6. Resolve payment method & strict non-paid initial status
    v_payment_method := LOWER(TRIM(COALESCE(p_order->>'payment_method', p_order->>'paymentMethod', 'upi_phonepe')));
    IF v_payment_method NOT IN ('upi', 'upi_phonepe', 'upi_gpay', 'upi_paytm', 'whatsapp', 'cod') THEN
        v_payment_method := 'upi_phonepe';
    END IF;

    v_payment_status := CASE
        WHEN v_payment_method = 'cod' THEN 'pending_cod'
        ELSE 'PENDING'
    END;

    IF v_payment_method = 'upi_gpay' THEN
        v_merchant_vpa := 'rayapatikrupakar-3@oksbi';
        v_payee_name := 'Rayapati Krupakar';
    ELSIF v_payment_method = 'upi_paytm' THEN
        v_merchant_vpa := '9177900684@ptsbi';
        v_payee_name := 'KRUPAKAR RAYAPATI';
    ELSE
        v_merchant_vpa := 'rayapati.krupakar@ibl';
        v_payee_name := 'KRUPAKAR RAYAPATI';
    END IF;

    v_order_number := NULLIF(TRIM(COALESCE(p_order->>'order_number', p_order->>'orderNumber', '')), '');
    IF v_order_number IS NULL THEN
        v_order_number := public.generate_order_number();
    END IF;

    -- 7. Insert Order Header first so child foreign keys (order_items, inventory_movements, payments) succeed
    INSERT INTO public.orders (
        id, order_number, idempotency_key, customer_id,
        customer_name, customer_email, customer_phone, shipping_address,
        subtotal, discount_amount, shipping_fee, gift_wrap_fee, grand_total, applied_coupon,
        payment_method, payment_status, payment_expires_at,
        fulfillment_status, courier_partner, notes
    ) VALUES (
        v_order_id,
        v_order_number,
        v_idempotency_key,
        v_customer_id,
        TRIM(COALESCE(p_order->>'customer_name', p_order->>'customerName', 'Patron')),
        LOWER(TRIM(COALESCE(p_order->>'customer_email', p_order->>'customerEmail', ''))),
        TRIM(COALESCE(p_order->>'customer_phone', p_order->>'customerPhone', '')),
        COALESCE(p_order->'shipping_address', p_order->'shippingAddress', '{}'::jsonb),
        v_subtotal,
        v_discount_amount,
        v_shipping_fee,
        v_gift_wrap_fee,
        v_grand_total,
        v_coupon_code,
        v_payment_method,
        v_payment_status,
        v_expires_at,
        'unfulfilled',
        'Express Air Logistics',
        NULLIF(TRIM(COALESCE(p_order->>'notes', '')), '')
    );

    -- 8. Deduct stock & record inventory ledger referencing the created order
    FOR v_item IN SELECT * FROM jsonb_array_elements(v_resolved_items)
    LOOP
        UPDATE public.products
        SET stock_count = stock_count - (v_item->>'quantity')::INT,
            in_stock = ((stock_count - (v_item->>'quantity')::INT) > 0),
            updated_at = NOW()
        WHERE id = (v_item->>'product_uuid')::UUID;

        INSERT INTO public.inventory_movements (product_id, delta, reason, reference_order_id, notes)
        VALUES (
            (v_item->>'product_uuid'),
            -((v_item->>'quantity')::INT),
            'order_placed',
            v_order_id,
            'Order #' || v_order_number || ' reserved via ' || v_payment_method
        );
    END LOOP;

    -- 9. Insert Order Items
    INSERT INTO public.order_items (order_id, product_id, sku, name, unit_price, quantity, subtotal, primary_image)
    SELECT
        v_order_id,
        it->>'product_ref',
        it->>'sku',
        it->>'name',
        (it->>'unit_price')::NUMERIC,
        (it->>'quantity')::INT,
        (it->>'subtotal')::NUMERIC,
        it->>'primary_image'
    FROM jsonb_array_elements(v_resolved_items) it;

    -- 10. Insert Initial Payment Attempt Record
    INSERT INTO public.payments (
        id, order_id, gateway, upi_app, merchant_vpa, payee_name,
        attempt_number, amount, currency, status, expires_at
    ) VALUES (
        v_payment_id,
        v_order_id,
        CASE
            WHEN v_payment_method = 'cod' THEN 'cod'
            WHEN v_payment_method IN ('upi_phonepe', 'upi_gpay', 'upi_paytm') THEN v_payment_method
            ELSE 'upi_manual'
        END,
        v_payment_method,
        v_merchant_vpa,
        v_payee_name,
        1,
        v_grand_total,
        'INR',
        v_payment_status,
        v_expires_at
    );

    -- 11. Audit log
    INSERT INTO public.payment_verification_logs (
        order_id, payment_id, action, previous_status, new_status, actor_user_id, actor_role, notes
    ) VALUES (
        v_order_id, v_payment_id, 'payment_created', 'CREATED', v_payment_status,
        v_customer_id, CASE WHEN v_customer_id IS NOT NULL THEN 'customer' ELSE 'guest' END,
        'Order created via ' || v_payment_method || ' (Total ₹' || v_grand_total || ')'
    );

    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'payment_id', v_payment_id,
        'order_number', v_order_number,
        'subtotal', v_subtotal,
        'discount_amount', v_discount_amount,
        'shipping_fee', v_shipping_fee,
        'gift_wrap_fee', v_gift_wrap_fee,
        'grand_total', v_grand_total,
        'payment_status', v_payment_status,
        'payment_method', v_payment_method,
        'payment_expires_at', v_expires_at,
        'fulfillment_status', 'unfulfilled'
    );
END;
$$;

-- Customer-safe UTR submission RPC: ONLY allows transitioning to 'AWAITING_VERIFICATION' (NEVER 'PAID')
CREATE OR REPLACE FUNCTION public.submit_upi_reference(
    p_order_number TEXT,
    p_contact TEXT,
    p_utr TEXT,
    p_upi_app TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_order RECORD;
    v_clean_utr TEXT := UPPER(TRIM(COALESCE(p_utr, '')));
    v_clean_contact TEXT := LOWER(TRIM(COALESCE(p_contact, '')));
    v_contact_digits TEXT := REGEXP_REPLACE(v_clean_contact, '\D', '', 'g');
    v_order_digits TEXT;
    v_prev_status TEXT;
    v_late_note TEXT := '';
    v_payment_id UUID;
BEGIN
    IF v_clean_utr !~ '^[A-Z0-9_-]{8,35}$' THEN
        RAISE EXCEPTION 'Please enter a valid 8–35 character UPI / UTR reference.';
    END IF;

    SELECT * INTO v_order
    FROM public.orders
    WHERE order_number = TRIM(COALESCE(p_order_number, ''))
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order reference not found.';
    END IF;

    v_order_digits := REGEXP_REPLACE(COALESCE(v_order.customer_phone, ''), '\D', '', 'g');
    IF NOT (
        (auth.uid() IS NOT NULL AND v_order.customer_id = auth.uid())
        OR (v_clean_contact <> '' AND LOWER(v_order.customer_email) = v_clean_contact)
        OR (LENGTH(v_contact_digits) >= 10 AND RIGHT(v_order_digits, 10) = RIGHT(v_contact_digits, 10))
    ) THEN
        RAISE EXCEPTION 'Verification check failed for this order.';
    END IF;

    v_prev_status := v_order.payment_status;
    IF v_prev_status IN ('PAID', 'captured', 'CANCELLED', 'REFUNDED', 'refunded') THEN
        RETURN jsonb_build_object(
            'success', false,
            'payment_status', v_prev_status,
            'message', 'Order payment state (' || v_prev_status || ') can no longer be updated by customer.'
        );
    END IF;

    IF v_order.payment_expires_at IS NOT NULL AND NOW() > v_order.payment_expires_at THEN
        v_late_note := ' (Submitted after 30-minute window; manual verification required)';
    END IF;

    UPDATE public.orders
    SET utr_reference = v_clean_utr,
        payment_method = COALESCE(NULLIF(LOWER(TRIM(p_upi_app)), ''), payment_method),
        payment_status = 'AWAITING_VERIFICATION',
        payment_submitted_at = NOW(),
        updated_at = NOW()
    WHERE id = v_order.id;

    SELECT id INTO v_payment_id
    FROM public.payments
    WHERE order_id = v_order.id
    ORDER BY attempt_number DESC, created_at DESC
    LIMIT 1;

    IF v_payment_id IS NOT NULL THEN
        UPDATE public.payments
        SET utr_reference = v_clean_utr,
            upi_app = COALESCE(NULLIF(LOWER(TRIM(p_upi_app)), ''), upi_app),
            status = 'AWAITING_VERIFICATION',
            updated_at = NOW()
        WHERE id = v_payment_id;
    END IF;

    INSERT INTO public.payment_verification_logs (
        order_id, payment_id, action, previous_status, new_status, utr_reference,
        actor_user_id, actor_role, notes
    ) VALUES (
        v_order.id, v_payment_id, 'utr_submitted', v_prev_status, 'AWAITING_VERIFICATION', v_clean_utr,
        auth.uid(), 'customer', 'Customer submitted UTR reference for manual review' || v_late_note
    );

    RETURN jsonb_build_object(
        'success', true,
        'order_number', v_order.order_number,
        'payment_status', 'AWAITING_VERIFICATION',
        'utr_reference', v_clean_utr
    );
END;
$$;

-- Customer-safe retry / switch UPI app on an unpaid order without creating duplicate order
CREATE OR REPLACE FUNCTION public.initiate_upi_retry(
    p_order_number TEXT,
    p_contact TEXT,
    p_upi_app TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_order RECORD;
    v_clean_contact TEXT := LOWER(TRIM(COALESCE(p_contact, '')));
    v_contact_digits TEXT := REGEXP_REPLACE(v_clean_contact, '\D', '', 'g');
    v_order_digits TEXT;
    v_next_attempt INT;
    v_new_payment_id UUID := gen_random_uuid();
    v_app TEXT := LOWER(TRIM(COALESCE(p_upi_app, 'upi_phonepe')));
    v_merchant_vpa TEXT;
    v_payee_name TEXT;
    v_expires TIMESTAMPTZ := NOW() + INTERVAL '30 minutes';
BEGIN
    IF v_app NOT IN ('upi_phonepe', 'upi_gpay', 'upi_paytm') THEN
        v_app := 'upi_phonepe';
    END IF;

    IF v_app = 'upi_gpay' THEN
        v_merchant_vpa := 'rayapatikrupakar-3@oksbi';
        v_payee_name := 'Rayapati Krupakar';
    ELSIF v_app = 'upi_paytm' THEN
        v_merchant_vpa := '9177900684@ptsbi';
        v_payee_name := 'KRUPAKAR RAYAPATI';
    ELSE
        v_merchant_vpa := 'rayapati.krupakar@ibl';
        v_payee_name := 'KRUPAKAR RAYAPATI';
    END IF;

    SELECT * INTO v_order
    FROM public.orders
    WHERE order_number = TRIM(COALESCE(p_order_number, ''))
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order reference not found.';
    END IF;

    v_order_digits := REGEXP_REPLACE(COALESCE(v_order.customer_phone, ''), '\D', '', 'g');
    IF NOT (
        (auth.uid() IS NOT NULL AND v_order.customer_id = auth.uid())
        OR (v_clean_contact <> '' AND LOWER(v_order.customer_email) = v_clean_contact)
        OR (LENGTH(v_contact_digits) >= 10 AND RIGHT(v_order_digits, 10) = RIGHT(v_contact_digits, 10))
    ) THEN
        RAISE EXCEPTION 'Verification check failed for this order.';
    END IF;

    IF v_order.payment_status IN ('PAID', 'captured', 'CANCELLED', 'REFUNDED', 'refunded') THEN
        RAISE EXCEPTION 'Cannot retry payment for order in status %.', v_order.payment_status;
    END IF;

    SELECT COALESCE(MAX(attempt_number), 0) + 1 INTO v_next_attempt
    FROM public.payments WHERE order_id = v_order.id;

    UPDATE public.orders
    SET payment_method = v_app,
        payment_status = 'PENDING',
        payment_expires_at = v_expires,
        updated_at = NOW()
    WHERE id = v_order.id;

    INSERT INTO public.payments (
        id, order_id, gateway, upi_app, merchant_vpa, payee_name, attempt_number, amount, currency, status, expires_at
    ) VALUES (
        v_new_payment_id, v_order.id, v_app, v_app, v_merchant_vpa, v_payee_name, v_next_attempt, v_order.grand_total, 'INR', 'PENDING', v_expires
    );

    INSERT INTO public.payment_verification_logs (
        order_id, payment_id, action, previous_status, new_status, actor_user_id, actor_role, notes
    ) VALUES (
        v_order.id, v_new_payment_id, 'retry_initiated', v_order.payment_status, 'PENDING',
        auth.uid(), 'customer', 'Customer initiated attempt #' || v_next_attempt || ' via ' || v_app
    );

    RETURN jsonb_build_object(
        'success', true,
        'order_number', v_order.order_number,
        'payment_id', v_new_payment_id,
        'payment_method', v_app,
        'payment_status', 'PENDING',
        'payment_expires_at', v_expires
    );
END;
$$;

-- Strict Admin-Only Reconciliation RPC
CREATE OR REPLACE FUNCTION public.verify_upi_payment_admin(
    p_order_id UUID,
    p_action TEXT,
    p_verified_utr TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_order RECORD;
    v_admin_email TEXT;
    v_clean_action TEXT := UPPER(TRIM(COALESCE(p_action, '')));
    v_clean_utr TEXT := NULLIF(UPPER(TRIM(COALESCE(p_verified_utr, ''))), '');
    v_clean_notes TEXT := TRIM(COALESCE(p_notes, ''));
    v_new_payment_status TEXT;
    v_new_fulfillment TEXT;
    v_log_action TEXT;
    v_payment_id UUID;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Boutique administrator privileges required for payment reconciliation.';
    END IF;

    SELECT email INTO v_admin_email FROM auth.users WHERE id = auth.uid();

    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found.';
    END IF;

    IF v_clean_action = 'VERIFY_PAID' THEN
        IF v_order.payment_status IN ('PAID', 'captured') THEN
            RAISE EXCEPTION 'This order payment is already verified as PAID (prevents duplicate verification).';
        END IF;
        v_new_payment_status := 'PAID';
        v_new_fulfillment := CASE WHEN v_order.fulfillment_status = 'unfulfilled' THEN 'processing' ELSE v_order.fulfillment_status END;
        v_log_action := 'verified_paid';
    ELSIF v_clean_action = 'REJECT_MISMATCH' THEN
        IF v_clean_notes = '' THEN
            RAISE EXCEPTION 'Verification notes explaining the mismatch/rejection are required.';
        END IF;
        v_new_payment_status := 'FAILED';
        v_new_fulfillment := v_order.fulfillment_status;
        v_log_action := 'rejected_mismatch';
    ELSIF v_clean_action = 'MARK_EXPIRED' THEN
        v_new_payment_status := 'EXPIRED';
        v_new_fulfillment := v_order.fulfillment_status;
        v_log_action := 'marked_expired';
    ELSIF v_clean_action = 'MARK_CANCELLED' THEN
        PERFORM public.cancel_order_atomic(p_order_id, COALESCE(NULLIF(v_clean_notes, ''), 'Cancelled by CRM administrator'));
        UPDATE public.orders
        SET payment_status = 'CANCELLED',
            verified_by = auth.uid(),
            verified_by_email = v_admin_email,
            verified_at = NOW(),
            verification_notes = NULLIF(v_clean_notes, '')
        WHERE id = p_order_id;
        SELECT id INTO v_payment_id
        FROM public.payments WHERE order_id = p_order_id
        ORDER BY attempt_number DESC, created_at DESC LIMIT 1;
        IF v_payment_id IS NOT NULL THEN
            UPDATE public.payments
            SET status = 'CANCELLED',
                verified_by = auth.uid(),
                verified_by_email = v_admin_email,
                verified_at = NOW(),
                verification_notes = NULLIF(v_clean_notes, ''),
                updated_at = NOW()
            WHERE id = v_payment_id;
        END IF;
        INSERT INTO public.payment_verification_logs (
            order_id, payment_id, action, previous_status, new_status, actor_user_id, actor_email, actor_role, notes
        ) VALUES (
            p_order_id, v_payment_id, 'marked_cancelled', v_order.payment_status, 'CANCELLED',
            auth.uid(), v_admin_email, 'admin', COALESCE(NULLIF(v_clean_notes, ''), 'Order cancelled by administrator')
        );
        RETURN jsonb_build_object('success', true, 'payment_status', 'CANCELLED');
    ELSIF v_clean_action = 'MARK_REFUNDED' THEN
        IF v_clean_notes = '' THEN
            RAISE EXCEPTION 'Refund reference / notes are required.';
        END IF;
        v_new_payment_status := 'REFUNDED';
        v_new_fulfillment := 'cancelled';
        v_log_action := 'marked_refunded';
    ELSE
        RAISE EXCEPTION 'Unsupported verification action: %', v_clean_action;
    END IF;

    UPDATE public.orders
    SET payment_status = v_new_payment_status,
        fulfillment_status = v_new_fulfillment,
        utr_reference = COALESCE(v_clean_utr, utr_reference),
        verified_by = auth.uid(),
        verified_by_email = v_admin_email,
        verified_at = NOW(),
        verification_notes = NULLIF(v_clean_notes, ''),
        updated_at = NOW()
    WHERE id = v_order.id;

    SELECT id INTO v_payment_id
    FROM public.payments WHERE order_id = v_order.id
    ORDER BY attempt_number DESC, created_at DESC LIMIT 1;

    IF v_payment_id IS NOT NULL THEN
        UPDATE public.payments
        SET status = v_new_payment_status,
            utr_reference = COALESCE(v_clean_utr, utr_reference),
            verified_by = auth.uid(),
            verified_by_email = v_admin_email,
            verified_at = NOW(),
            verification_notes = CASE WHEN v_clean_action <> 'REJECT_MISMATCH' THEN NULLIF(v_clean_notes, '') ELSE verification_notes END,
            rejection_reason = CASE WHEN v_clean_action = 'REJECT_MISMATCH' THEN NULLIF(v_clean_notes, '') ELSE rejection_reason END,
            updated_at = NOW()
        WHERE id = v_payment_id;
    END IF;

    INSERT INTO public.payment_verification_logs (
        order_id, payment_id, action, previous_status, new_status, utr_reference,
        actor_user_id, actor_email, actor_role, notes
    ) VALUES (
        v_order.id, v_payment_id, v_log_action, v_order.payment_status, v_new_payment_status,
        COALESCE(v_clean_utr, v_order.utr_reference),
        auth.uid(), v_admin_email, 'admin', v_clean_notes
    );

    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order.id,
        'payment_status', v_new_payment_status,
        'fulfillment_status', v_new_fulfillment,
        'verified_by_email', v_admin_email
    );
END;
$$;

-- Sanitized Guest/Customer Lookup RPC with honest UPI payment status
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
    v_clean_contact TEXT := LOWER(TRIM(COALESCE(p_phone_or_email, '')));
    v_contact_digits TEXT := REGEXP_REPLACE(v_clean_contact, '\D', '', 'g');
BEGIN
    SELECT jsonb_build_object(
        'order_number', o.order_number,
        'customer_name', o.customer_name,
        'created_at', o.created_at,
        'fulfillment_status', o.fulfillment_status,
        'payment_status', o.payment_status,
        'payment_method', o.payment_method,
        'utr_reference', o.utr_reference,
        'payment_submitted_at', o.payment_submitted_at,
        'payment_expires_at', o.payment_expires_at,
        'verified_at', o.verified_at,
        'verification_notes', o.verification_notes,
        'subtotal', o.subtotal,
        'discount_amount', o.discount_amount,
        'shipping_fee', o.shipping_fee,
        'gift_wrap_fee', o.gift_wrap_fee,
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
            FROM public.order_items it WHERE it.order_id = o.id
        ), '[]'::jsonb)
    ) INTO v_order
    FROM public.orders o
    WHERE UPPER(o.order_number) = UPPER(TRIM(COALESCE(p_order_number, '')))
      AND (
          (v_clean_contact <> '' AND LOWER(o.customer_email) = v_clean_contact)
          OR (LENGTH(v_contact_digits) >= 10 AND RIGHT(REGEXP_REPLACE(o.customer_phone, '\D', '', 'g'), 10) = RIGHT(v_contact_digits, 10))
      )
    LIMIT 1;

    IF v_order IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'No order found matching the provided order number and contact.');
    END IF;

    RETURN jsonb_build_object('success', true, 'order', v_order);
END;
$$;

-- Order cancellation with inventory restoration
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
    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Order not found.');
    END IF;

    IF NOT public.is_admin() AND LOWER(v_order.customer_email) <> LOWER((SELECT email FROM auth.users WHERE id = auth.uid())) THEN
        RAISE EXCEPTION 'Not authorized to cancel this order.';
    END IF;

    IF v_order.fulfillment_status = 'cancelled' THEN
        RETURN jsonb_build_object('success', true, 'message', 'Order is already cancelled.');
    END IF;

    IF v_order.fulfillment_status = 'delivered' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Delivered orders cannot be cancelled directly.');
    END IF;

    UPDATE public.orders
    SET fulfillment_status = 'cancelled',
        payment_status = CASE WHEN payment_status IN ('PAID', 'captured') THEN 'REFUNDED' ELSE 'CANCELLED' END,
        notes = COALESCE(notes, '') || ' [Cancelled: ' || p_reason || ' at ' || NOW() || ']',
        updated_at = NOW()
    WHERE id = p_order_id;

    FOR v_item IN SELECT oi.sku, oi.quantity FROM public.order_items oi WHERE oi.order_id = p_order_id
    LOOP
        SELECT id INTO v_product_id FROM public.products WHERE sku = v_item.sku FOR UPDATE;
        IF v_product_id IS NOT NULL THEN
            UPDATE public.products
            SET stock_count = stock_count + v_item.quantity, in_stock = TRUE, updated_at = NOW()
            WHERE id = v_product_id;

            INSERT INTO public.inventory_movements (product_id, delta, reason, reference_order_id, notes)
            VALUES (v_product_id::TEXT, v_item.quantity, 'order_cancelled', p_order_id, 'Stock restored on cancellation of #' || v_order.order_number);
        END IF;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'message', 'Order cancelled and stock restored.');
END;
$$;

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_order_atomic(JSONB, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_upi_reference(TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.initiate_upi_retry(TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.lookup_order(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_order_atomic(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_upi_payment_admin(UUID, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

