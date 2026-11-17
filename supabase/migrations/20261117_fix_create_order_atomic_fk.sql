-- ============================================================================
-- RODHE PRODUCTION FIX: create_order_atomic FOREIGN KEY ORDER RECTIFICATION
-- Migration: 20261117_fix_create_order_atomic_fk.sql
-- Resolves: "Insert or update on table 'inventory_movements' violates foreign
--            key constraint 'inventory_movements_reference_order_id_fkey'"
--
-- How to run in Supabase:
-- 1. Open Supabase Dashboard -> SQL Editor (or New Query)
-- 2. Paste this entire script
-- 3. Click "Run" (Ctrl+Enter)
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
    -- 0. Guard against empty cart
    IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'Order must contain at least one line item.';
    END IF;

    -- 1. Idempotency protection: prevent duplicate orders on double-submit
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

    -- 2. Validate customer contact essentials
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
           OR (CASE WHEN COALESCE(v_item->>'product_id', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN id = (v_item->>'product_id')::UUID ELSE FALSE END)
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

    -- 5. Server-side coupon validation
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

    -- 6. Resolve payment method & initial payment status
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

    -- =========================================================================
    -- CRITICAL STEP 7: Insert Order Header FIRST so child foreign keys
    -- (order_items, inventory_movements, payments) ALWAYS SUCCEED!
    -- =========================================================================
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

    -- =========================================================================
    -- STEP 8: Deduct stock & record inventory ledger referencing created order
    -- (Now guaranteed safe because v_order_id exists in public.orders!)
    -- =========================================================================
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

    -- =========================================================================
    -- STEP 9: Insert Order Line Items referencing created order
    -- =========================================================================
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

    -- =========================================================================
    -- STEP 10: Insert Initial Payment Attempt Record referencing created order
    -- =========================================================================
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

    -- =========================================================================
    -- STEP 11: Audit log referencing created order
    -- =========================================================================
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

-- Grant execution to anon (guest checkout) and authenticated users
GRANT EXECUTE ON FUNCTION public.create_order_atomic(JSONB, JSONB) TO anon, authenticated;

