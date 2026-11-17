-- ============================================================================
-- RODHE PRODUCTION DATABASE REPAIR (SINGLE CONSOLIDATED SCRIPT)
-- Migration: 20261117_production_repair.sql
--
-- SAFE & IDEMPOTENT: This script does NOT delete any tables or orders.
-- It only adds missing columns, corrects the order checkout function,
-- and synchronizes all 50 handcrafted sarees into your Supabase database.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ADD MISSING COLUMNS & LIFECYCLE ENHANCEMENTS ON public.products
-- ----------------------------------------------------------------------------

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS primary_image TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_status_check;
ALTER TABLE public.products ADD CONSTRAINT products_status_check
    CHECK (status IN ('draft', 'published', 'archived'));

CREATE INDEX IF NOT EXISTS idx_products_status_updated
    ON public.products(status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_products_archived_at
    ON public.products(archived_at) WHERE archived_at IS NOT NULL;

-- ----------------------------------------------------------------------------
-- 2. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Published Products" ON public.products;
CREATE POLICY "Public Read Published Products" ON public.products
    FOR SELECT
    USING (status = 'published');

DROP POLICY IF EXISTS "Admin Full Access Products" ON public.products;
CREATE POLICY "Admin Full Access Products" ON public.products
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Public Read Product Images" ON public.product_images;
CREATE POLICY "Public Read Product Images" ON public.product_images
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Admin Full Access Product Images" ON public.product_images;
CREATE POLICY "Admin Full Access Product Images" ON public.product_images
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------------------
-- 3. CHECKOUT FUNCTION: create_order_atomic (FOREIGN KEY FIX)
-- Inserts orders header in Step 7 BEFORE inventory_movements in Step 8
-- ----------------------------------------------------------------------------

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

-- ----------------------------------------------------------------------------
-- 4. INVENTORY LIFECYCLE RPCS: archive_product, restore_product, delete_product_safe
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.archive_product(p_identifier TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_product RECORD;
    v_clean_id TEXT := TRIM(COALESCE(p_identifier, ''));
    v_is_uuid BOOLEAN := FALSE;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Boutique administrator privileges required to archive inventory.'
            USING ERRCODE = '42501';
    END IF;

    IF v_clean_id = '' THEN
        RAISE EXCEPTION 'Product identifier is required.' USING ERRCODE = '22023';
    END IF;

    v_is_uuid := (v_clean_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$');

    SELECT * INTO v_product
    FROM public.products
    WHERE (v_is_uuid AND id = v_clean_id::UUID)
       OR slug = v_clean_id
       OR sku = v_clean_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Product "%" not found in boutique inventory.', v_clean_id
            USING ERRCODE = 'P0002';
    END IF;

    UPDATE public.products
    SET status = 'archived',
        archived_at = NOW(),
        updated_at = NOW()
    WHERE id = v_product.id;

    RETURN jsonb_build_object(
        'success', true,
        'id', v_product.id,
        'slug', v_product.slug,
        'sku', v_product.sku,
        'name', v_product.name,
        'status', 'archived',
        'archived_at', NOW()
    );
END;
$$;

-- B. RESTORE PRODUCT
-- Restores an archived saree back to published or draft status.
CREATE OR REPLACE FUNCTION public.restore_product(
    p_identifier TEXT,
    p_target_status TEXT DEFAULT 'published'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_product RECORD;
    v_clean_id TEXT := TRIM(COALESCE(p_identifier, ''));
    v_status TEXT := LOWER(TRIM(COALESCE(p_target_status, 'published')));
    v_is_uuid BOOLEAN := FALSE;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Boutique administrator privileges required to restore inventory.'
            USING ERRCODE = '42501';
    END IF;

    IF v_clean_id = '' THEN
        RAISE EXCEPTION 'Product identifier is required.' USING ERRCODE = '22023';
    END IF;

    IF v_status NOT IN ('published', 'draft') THEN
        v_status := 'published';
    END IF;

    v_is_uuid := (v_clean_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$');

    SELECT * INTO v_product
    FROM public.products
    WHERE (v_is_uuid AND id = v_clean_id::UUID)
       OR slug = v_clean_id
       OR sku = v_clean_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Product "%" not found in boutique inventory.', v_clean_id
            USING ERRCODE = 'P0002';
    END IF;

    UPDATE public.products
    SET status = v_status,
        archived_at = NULL,
        updated_at = NOW()
    WHERE id = v_product.id;

    RETURN jsonb_build_object(
        'success', true,
        'id', v_product.id,
        'slug', v_product.slug,
        'sku', v_product.sku,
        'name', v_product.name,
        'status', v_status
    );
END;
$$;

-- C. SAFE PERMANENT DELETE PRODUCT
-- Protects historical customer orders, financial ledger & inventory audit.
-- Only allows deletion if the product has ZERO historical order lines.
CREATE OR REPLACE FUNCTION public.delete_product_safe(p_identifier TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_product RECORD;
    v_clean_id TEXT := TRIM(COALESCE(p_identifier, ''));
    v_order_count INT := 0;
    v_is_uuid BOOLEAN := FALSE;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Boutique administrator privileges required to delete inventory.'
            USING ERRCODE = '42501';
    END IF;

    IF v_clean_id = '' THEN
        RAISE EXCEPTION 'Product identifier is required.' USING ERRCODE = '22023';
    END IF;

    v_is_uuid := (v_clean_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$');

    SELECT * INTO v_product
    FROM public.products
    WHERE (v_is_uuid AND id = v_clean_id::UUID)
       OR slug = v_clean_id
       OR sku = v_clean_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Product "%" not found in boutique inventory.', v_clean_id
            USING ERRCODE = 'P0002';
    END IF;

    -- Financial & historical integrity check: Inspect order_items
    SELECT COUNT(*) INTO v_order_count
    FROM public.order_items
    WHERE product_id = v_product.slug
       OR product_id = v_product.id::TEXT
       OR sku = v_product.sku;

    IF v_order_count > 0 THEN
        RAISE EXCEPTION 'Cannot permanently delete "%": it is referenced in % historical order line(s). Please archive this saree instead to preserve customer transaction history.'
            , v_product.name, v_order_count
            USING ERRCODE = '23503';
    END IF;

    -- Clean up cart/wishlist entries if not automatically cascaded
    DELETE FROM public.customer_carts WHERE product_id = v_product.id;
    DELETE FROM public.customer_wishlists WHERE product_id = v_product.id;

    -- Clean up unreferenced inventory movements associated with this product
    DELETE FROM public.inventory_movements
    WHERE product_id = v_product.id::TEXT OR product_id = v_product.slug;

    -- Cascaded deletion of product_images & product_collections happens via foreign keys
    DELETE FROM public.products WHERE id = v_product.id;

    RETURN jsonb_build_object(
        'success', true,
        'id', v_product.id,
        'slug', v_product.slug,
        'sku', v_product.sku,
        'name', v_product.name,
        'deleted', true
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.archive_product(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.restore_product(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_product_safe(TEXT) TO authenticated;

-- ----------------------------------------------------------------------------
-- 5. SEED ALL 50 RODHE HANDCRAFTED SAREES INTO public.products
-- ----------------------------------------------------------------------------

INSERT INTO public.products (
    slug, sku, name, tagline, description, craft_story,
    craft, craft_category, fabric, fabric_type,
    color, color_family, color_hex,
    selling_price, original_price, dimensions, blouse_piece, wash_care,
    stock_count, in_stock, is_featured, is_bestseller, is_most_coveted, is_new_arrival, status, primary_image
) VALUES
  ('nilambari-shibori-saree', 'RDH-501', 'Nilambari Shibori Mulmul Saree', 'Hand-knotted natural indigo tie-dye on featherweight organic cotton', 'Nilambari captures the timeless midnight blues of fermented indigo leaves. Hand-knotted and gently dipped in organic vats for a featherweight, breathable drape.', 'Handcrafted by skilled generational artisans using authentic handloom weaving, carved wooden block stamps, and natural slow-cured dyes.', 'Tie & Dye / Shibori', 'tie-dye', '100% Breathable Mulmul Cotton', 'mulmul', 'Indigo Blue', 'indigo', '#26425A', 1450, NULL, 'Length: 6.5 meters (including 80 cm blouse piece) • Width: 45 inches • Weight: 380 g', 'Included — Matching unstitched pure cotton fabric with running artisan border', 'Gentle hand wash in cold water using mild eco-friendly liquid detergent. Do not soak. Line dry in shade.', 16, TRUE, TRUE, TRUE, TRUE, TRUE, 'published', '/assets/products/saree_indigo_shibori.jpg'),
  ('mrittika-bagru-cotton-saree', 'RDH-502', 'Mrittika Bagru Mud-Resist Saree', 'Carved teakwood block print with terracotta madder root dye', 'Honoring Bagru soil, this drape is hand-stamped with seasoned teakwood blocks using age-old Dabu mud-resist and organic mineral pigments.', 'Handcrafted by skilled generational artisans using authentic handloom weaving, carved wooden block stamps, and natural slow-cured dyes.', 'Bagru Mud-Resist', 'handblock', 'Pure Handloom Mulmul Cotton', 'mulmul', 'Earth Brown', 'earth', '#4B3024', 1250, NULL, 'Length: 6.5 meters (including 80 cm blouse piece) • Width: 45 inches • Weight: 380 g', 'Included — Matching unstitched pure cotton fabric with running artisan border', 'Gentle hand wash in cold water using mild eco-friendly liquid detergent. Do not soak. Line dry in shade.', 6, TRUE, TRUE, FALSE, FALSE, FALSE, 'published', '/assets/products/saree_earth_bagru.jpg'),
  ('chandrika-raw-ivory-saree', 'RDH-503', 'Chandrika Raw Ivory Mulmul Saree', 'Pure unbleached organic cotton with delicate hand-woven gold temple border', 'Epitomizing understated grace, Chandrika is woven from pure rain-fed organic cotton with handcrafted pallu tassels and an airy, cloud-soft touch.', 'Handcrafted by skilled generational artisans using authentic handloom weaving, carved wooden block stamps, and natural slow-cured dyes.', 'Pure Mulmul Weave', 'mulmul', '100% Organic Unbleached Mulmul', 'mulmul', 'Raw Ivory', 'ivory', '#FAF6EE', 890, NULL, 'Length: 6.5 meters (including 80 cm blouse piece) • Width: 45 inches • Weight: 380 g', 'Included — Matching unstitched pure cotton fabric with running artisan border', 'Gentle hand wash in cold water using mild eco-friendly liquid detergent. Do not soak. Line dry in shade.', 12, TRUE, TRUE, FALSE, FALSE, FALSE, 'published', '/assets/products/saree_ivory_mulmul.jpg'),
  ('keshava-madder-red-saree', 'RDH-504', 'Keshava Madder Red Handblock Saree', 'Natural Manjistha tree root dye with intricate paisley woodblock motifs', 'Dyed in crushed Manjistha roots and harda, Keshava features rhythmically stamped paisley butis pressed by master Bagru craftsmen.', 'Handcrafted by skilled generational artisans using authentic handloom weaving, carved wooden block stamps, and natural slow-cured dyes.', 'Handblock Print', 'handblock', 'Pure Handloom Mulmul Cotton', 'mulmul', 'Madder Red', 'madder', '#9E3C2B', 1350, NULL, 'Length: 6.5 meters (including 80 cm blouse piece) • Width: 45 inches • Weight: 380 g', 'Included — Matching unstitched pure cotton fabric with running artisan border', 'Gentle hand wash in cold water using mild eco-friendly liquid detergent. Do not soak. Line dry in shade.', 6, TRUE, TRUE, FALSE, FALSE, TRUE, 'published', '/assets/products/saree_madder_red.jpg'),
  ('vanashri-forest-olive-saree', 'RDH-505', 'Vanashri Forest Olive Block Saree', 'Botanical dye from pomegranate rinds and iron tannin with floral vines', 'Infused with the peaceful energy of forest groves, dyed with wild pomegranate rinds and fermented iron rust for rich olive tones.', 'Handcrafted by skilled generational artisans using authentic handloom weaving, carved wooden block stamps, and natural slow-cured dyes.', 'Botanical Block Print', 'handblock', 'Featherweight Mulmul Cotton', 'mulmul', 'Forest Olive', 'olive', '#525B3A', 1150, NULL, 'Length: 6.5 meters (including 80 cm blouse piece) • Width: 45 inches • Weight: 380 g', 'Included — Matching unstitched pure cotton fabric with running artisan border', 'Gentle hand wash in cold water using mild eco-friendly liquid detergent. Do not soak. Line dry in shade.', 17, TRUE, TRUE, TRUE, TRUE, FALSE, 'published', '/assets/products/saree_forest_olive.jpg'),
  ('gulabi-raag-mulmul-saree', 'RDH-506', 'Gulabi Raag Handblock Saree', 'Soft rose madder wash with delicate carved wooden floral motifs', 'Evoking the quiet blush of dawn skies, Gulabi Raag features hand-pressed floral patterns on cloud-soft organic cotton.', 'Handcrafted by skilled generational artisans using authentic handloom weaving, carved wooden block stamps, and natural slow-cured dyes.', 'Handblock Print', 'handblock', '100% Breathable Mulmul Cotton', 'mulmul', 'Soft Rose', 'rose', '#C98278', 1550, NULL, 'Length: 6.5 meters (including 80 cm blouse piece) • Width: 45 inches • Weight: 380 g', 'Included — Matching unstitched pure cotton fabric with running artisan border', 'Gentle hand wash in cold water using mild eco-friendly liquid detergent. Do not soak. Line dry in shade.', 8, TRUE, TRUE, FALSE, FALSE, FALSE, 'published', '/assets/products/saree_soft_rose.jpg'),
  ('vasantika-haldi-gold-saree', 'RDH-507', 'Vasantika Haldi Gold Handloom Saree', 'Sun-drenched turmeric and marigold botanical dye with subtle woven border', 'Dyed using farm-fresh turmeric and temple marigold petals, radiating quiet warmth and effortless everyday comfort.', 'Handcrafted by skilled generational artisans using authentic handloom weaving, carved wooden block stamps, and natural slow-cured dyes.', 'Handloom Cotton', 'mulmul', 'Pure Handspun Cotton', 'mulmul', 'Muted Gold', 'gold', '#B88D4A', 990, NULL, 'Length: 6.5 meters (including 80 cm blouse piece) • Width: 45 inches • Weight: 380 g', 'Included — Matching unstitched pure cotton fabric with running artisan border', 'Gentle hand wash in cold water using mild eco-friendly liquid detergent. Do not soak. Line dry in shade.', 10, TRUE, TRUE, FALSE, FALSE, TRUE, 'published', '/assets/products/saree_muted_gold.jpg'),
  ('shyamali-deep-indigo-saree', 'RDH-508', 'Shyamali Deep Indigo Ajrakh Saree', 'Intricate Ajrakh geometric block print with midnight indigo depth', 'Celebrates the sacred symmetry of Ajrakh printing. Immersed in multiple layers of natural indigo and harda resist pastes.', 'Handcrafted by skilled generational artisans using authentic handloom weaving, carved wooden block stamps, and natural slow-cured dyes.', 'Ajrakh Block Print', 'handblock', 'Pure Handloom Mulmul Cotton', 'mulmul', 'Midnight Blue', 'indigo', '#1C2942', 1650, NULL, 'Length: 6.5 meters (including 80 cm blouse piece) • Width: 45 inches • Weight: 380 g', 'Included — Matching unstitched pure cotton fabric with running artisan border', 'Gentle hand wash in cold water using mild eco-friendly liquid detergent. Do not soak. Line dry in shade.', 12, TRUE, TRUE, FALSE, FALSE, FALSE, 'published', '/assets/products/saree_deep_indigo_zari.jpg'),
  ('mayura-dabu-peacock-saree', 'RDH-509', 'Mayura Dabu Indigo Cotton Saree', 'Mud-resist artisan peacock feather motifs on natural indigo cotton', 'Each peacock motif is stamped by hand with Dabu mud before dipping into live indigo vats, creating distinctive crackled contours.', 'Handcrafted by skilled generational artisans using authentic handloom weaving, carved wooden block stamps, and natural slow-cured dyes.', 'Dabu Mud-Resist', 'handblock', '100% Breathable Mulmul Cotton', 'mulmul', 'Indigo Blue', 'indigo', '#26425A', 1290, NULL, 'Length: 6.5 meters (including 80 cm blouse piece) • Width: 45 inches • Weight: 380 g', 'Included — Matching unstitched pure cotton fabric with running artisan border', 'Gentle hand wash in cold water using mild eco-friendly liquid detergent. Do not soak. Line dry in shade.', 7, TRUE, FALSE, TRUE, TRUE, FALSE, 'published', '/assets/products/saree_indigo_shibori_detail.jpg'),
  ('malati-rose-bagru-saree', 'RDH-510', 'Malati Rose Bagru Mulmul Saree', 'Tender rose madder ground with classic Bagru black and terracotta butis', 'Crafted using fine floral woodblocks, Malati combines soft rose herbal dye with traditional mineral-derived Bagru borders.', 'Handcrafted by skilled generational artisans using authentic handloom weaving, carved wooden block stamps, and natural slow-cured dyes.', 'Bagru Mud-Resist', 'handblock', 'Pure Handloom Mulmul Cotton', 'mulmul', 'Soft Rose', 'rose', '#C98278', 1050, NULL, 'Length: 6.5 meters (including 80 cm blouse piece) • Width: 45 inches • Weight: 380 g', 'Included — Matching unstitched pure cotton fabric with running artisan border', 'Gentle hand wash in cold water using mild eco-friendly liquid detergent. Do not soak. Line dry in shade.', 15, TRUE, FALSE, FALSE, FALSE, TRUE, 'published', '/assets/products/saree_earth_bagru_detail.jpg'),
  ('tarini-indigo-wave-saree', 'RDH-511', 'Tarini Indigo Wave Shibori Saree', 'Cascading river wave tie-dye pattern on airy sheer cotton', 'Crafted through intricate accordion hand-binding before dipping in slow fermented indigo, creating rhythmic river currents.', 'Handcrafted by skilled generational artisans using authentic handloom weaving, carved wooden block stamps, and natural slow-cured dyes.', 'Tie & Dye / Shibori', 'tie-dye', 'Featherweight Mulmul Cotton', 'mulmul', 'Indigo Blue', 'indigo', '#26425A', 1490, NULL, 'Length: 6.5 meters (including 80 cm blouse piece) • Width: 45 inches • Weight: 380 g', 'Included — Matching unstitched pure cotton fabric with running artisan border', 'Gentle hand wash in cold water using mild eco-friendly liquid detergent. Do not soak. Line dry in shade.', 17, TRUE, FALSE, FALSE, FALSE, FALSE, 'published', '/assets/products/saree_indigo_shibori.jpg'),
  ('avani-terracotta-dabu-saree', 'RDH-512', 'Avani Terracotta Mud-Resist Saree', 'Deep clay terracotta earth dye with traditional floral jali print', 'Grounding and authentic, Avani uses natural clay from riverbeds to resist dye, producing an organic warm earth palette.', 'Handcrafted by skilled generational artisans using authentic handloom weaving, carved wooden block stamps, and natural slow-cured dyes.', 'Dabu Mud-Resist', 'handblock', 'Pure Handloom Mulmul Cotton', 'mulmul', 'Earth Brown', 'earth', '#4B3024', 1190, NULL, 'Length: 6.5 meters (including 80 cm blouse piece) • Width: 45 inches • Weight: 380 g', 'Included — Matching unstitched pure cotton fabric with running artisan border', 'Gentle hand wash in cold water using mild eco-friendly liquid detergent. Do not soak. Line dry in shade.', 8, TRUE, FALSE, FALSE, FALSE, FALSE, 'published', '/assets/products/saree_earth_bagru.jpg'),
  ('rohini-ivory-zari-saree', 'RDH-513', 'Rohini Ivory Woven Border Saree', 'Unbleached natural ecru cotton with delicate woven temple edge', 'Soft as a summer cloud, Rohini is hand-spun and woven on traditional pit looms without chemical bleaches or harsh treatments.', 'Handcrafted by skilled generational artisans using authentic handloom weaving, carved wooden block stamps, and natural slow-cured dyes.', 'Pure Mulmul Weave', 'mulmul', '100% Organic Unbleached Cotton', 'mulmul', 'Raw Ivory', 'ivory', '#FAF6EE', 850, NULL, 'Length: 6.5 meters (including 80 cm blouse piece) • Width: 45 inches • Weight: 380 g', 'Included — Matching unstitched pure cotton fabric with running artisan border', 'Gentle hand wash in cold water using mild eco-friendly liquid detergent. Do not soak. Line dry in shade.', 16, TRUE, FALSE, TRUE, TRUE, TRUE, 'published', '/assets/products/saree_ivory_mulmul.jpg'),
  ('rohana-madder-geometric-saree', 'RDH-514', 'Rohana Madder Geometric Block Saree', 'Bold geometric tribal block impressions in natural crimson root dyes', 'Features interlocking diamond and chevron motifs hand-stamped onto raw cotton, capturing the rustic grandeur of heritage drapes.', 'Handcrafted by skilled generational artisans using authentic handloom weaving, carved wooden block stamps, and natural slow-cured dyes.', 'Handblock Print', 'handblock', 'Pure Handloom Mulmul Cotton', 'mulmul', 'Madder Red', 'madder', '#9E3C2B', 1390, NULL, 'Length: 6.5 meters (including 80 cm blouse piece) • Width: 45 inches • Weight: 380 g', 'Included — Matching unstitched pure cotton fabric with running artisan border', 'Gentle hand wash in cold water using mild eco-friendly liquid detergent. Do not soak. Line dry in shade.', 14, TRUE, FALSE, FALSE, FALSE, FALSE, 'published', '/assets/products/saree_madder_red.jpg'),
  ('vrinda-olive-leaf-saree', 'RDH-515', 'Vrinda Olive Leaf Handblock Saree', 'Delicate foliage and vine impressions in pomegranate and iron dye', 'Echoing tranquil bamboo groves, Vrinda is decorated with finely detailed leaf motifs pressed rhythmically across unbleached cotton.', 'Handcrafted by skilled generational artisans using authentic handloom weaving, carved wooden block stamps, and natural slow-cured dyes.', 'Botanical Block Print', 'handblock', '100% Breathable Mulmul Cotton', 'mulmul', 'Forest Olive', 'olive', '#525B3A', 1090, NULL, 'Length: 6.5 meters (including 80 cm blouse piece) • Width: 45 inches • Weight: 380 g', 'Included — Matching unstitched pure cotton fabric with running artisan border', 'Gentle hand wash in cold water using mild eco-friendly liquid detergent. Do not soak. Line dry in shade.', 12, TRUE, FALSE, FALSE, FALSE, FALSE, 'published', '/assets/products/saree_forest_olive.jpg'),
  ('neel-kamal-lotus-saree', 'RDH-516', 'Neel Kamal Indigo Lotus Saree', 'Hand-carved sacred lotus motifs stamped with botanical indigo paste', 'Sacred lotus blossoms float along the borders and pallu, hand-stamped using generational teakwood blocks in deep indigo.', 'Handcrafted by skilled generational artisans using authentic handloom weaving, carved wooden block stamps, and natural slow-cured dyes.', 'Handblock Print', 'handblock', 'Pure Handloom Mulmul Cotton', 'mulmul', 'Indigo Blue', 'indigo', '#26425A', 1590, NULL, 'Length: 6.5 meters (including 80 cm blouse piece) • Width: 45 inches • Weight: 380 g', 'Included — Matching unstitched pure cotton fabric with running artisan border', 'Gentle hand wash in cold water using mild eco-friendly liquid detergent. Do not soak. Line dry in shade.', 13, TRUE, FALSE, FALSE, FALSE, TRUE, 'published', '/assets/products/saree_indigo_shibori.jpg'),
  ('kanaka-sandalwood-kota-saree', 'RDH-517', 'Kanaka Sandalwood Kota Cotton Saree', 'Crisp airy Kota Doria weave with delicate geometric khat check pattern', 'The iconic micro-square khat weave of Kota Doria offers unparalleled ventilation, ideal for warm tropical days and celebrations.', 'Handcrafted by skilled generational artisans using authentic handloom weaving, carved wooden block stamps, and natural slow-cured dyes.', 'Kota Doria Cotton', 'chanderi', 'Authentic Kota Doria Cotton', 'chanderi', 'Muted Gold', 'gold', '#B88D4A', 950, NULL, 'Length: 6.5 meters (including 80 cm blouse piece) • Width: 45 inches • Weight: 380 g', 'Included — Matching unstitched pure cotton fabric with running artisan border', 'Gentle hand wash in cold water using mild eco-friendly liquid detergent. Do not soak. Line dry in shade.', 10, TRUE, FALSE, TRUE, TRUE, FALSE, 'published', '/assets/products/saree_muted_gold.jpg'),
  ('padmashri-blush-rose-saree', 'RDH-518', 'Padmashri Blush Floral Block Saree', 'Gentle madder pink ground with all-over botanical jaal print', 'An ethereal creation with intricately intertwined rose blossoms hand-imprinted using fine seasoned sheesham stamps.', 'Handcrafted by skilled generational artisans using authentic handloom weaving, carved wooden block stamps, and natural slow-cured dyes.', 'Handblock Print', 'handblock', '100% Breathable Mulmul Cotton', 'mulmul', 'Soft Rose', 'rose', '#C98278', 1220, NULL, 'Length: 6.5 meters (including 80 cm blouse piece) • Width: 45 inches • Weight: 380 g', 'Included — Matching unstitched pure cotton fabric with running artisan border', 'Gentle hand wash in cold water using mild eco-friendly liquid detergent. Do not soak. Line dry in shade.', 16, TRUE, FALSE, FALSE, FALSE, FALSE, 'published', '/assets/products/saree_soft_rose.jpg'),
  ('dhara-charcoal-dabu-saree', 'RDH-519', 'Dhara Charcoal Mud-Resist Saree', 'Fermented iron charcoal dye with mud-resist geometric block art', 'Deep mineral tones derived from organic iron rust and jaggery, creating rich earthy charcoal and rust hues.', 'Handcrafted by skilled generational artisans using authentic handloom weaving, carved wooden block stamps, and natural slow-cured dyes.', 'Dabu Mud-Resist', 'handblock', 'Pure Handloom Mulmul Cotton', 'mulmul', 'Earth Brown', 'earth', '#4B3024', 1320, NULL, 'Length: 6.5 meters (including 80 cm blouse piece) • Width: 45 inches • Weight: 380 g', 'Included — Matching unstitched pure cotton fabric with running artisan border', 'Gentle hand wash in cold water using mild eco-friendly liquid detergent. Do not soak. Line dry in shade.', 15, TRUE, FALSE, FALSE, FALSE, TRUE, 'published', '/assets/products/saree_earth_bagru.jpg'),
  ('alaknanda-river-shibori-saree', 'RDH-520', 'Alaknanda River Blue Shibori Saree', 'Artisanal pole-wrap shibori creating diagonal indigo river currents', 'Dyed with natural fermented indigo using the arashi pole-wrap method, replicating the sparkling currents of mountain rivers.', 'Handcrafted by skilled generational artisans using authentic handloom weaving, carved wooden block stamps, and natural slow-cured dyes.', 'Tie & Dye / Shibori', 'tie-dye', 'Featherweight Mulmul Cotton', 'mulmul', 'Midnight Blue', 'indigo', '#1C2942', 1420, NULL, 'Length: 6.5 meters (including 80 cm blouse piece) • Width: 45 inches • Weight: 380 g', 'Included — Matching unstitched pure cotton fabric with running artisan border', 'Gentle hand wash in cold water using mild eco-friendly liquid detergent. Do not soak. Line dry in shade.', 10, TRUE, FALSE, FALSE, FALSE, FALSE, 'published', '/assets/products/saree_deep_indigo_zari.jpg'),
  ('hansini-cloud-mulmul-saree', 'RDH-521', 'Hansini Cloud White Mulmul Saree', 'Featherweight pure white cotton drape with delicate woven border', 'As weightless as a feather, Hansini is woven from hand-spun long-staple cotton for sheer, breezy all-day drapes.', 'Handcrafted by skilled generational artisans using authentic handloom weaving, carved wooden block stamps, and natural slow-cured dyes.', 'Pure Mulmul Weave', 'mulmul', '100% Breathable Mulmul Cotton', 'mulmul', 'Raw Ivory', 'ivory', '#FAF6EE', 790, NULL, 'Length: 6.5 meters (including 80 cm blouse piece) • Width: 45 inches • Weight: 380 g', 'Included — Matching unstitched pure cotton fabric with running artisan border', 'Gentle hand wash in cold water using mild eco-friendly liquid detergent. Do not soak. Line dry in shade.', 9, TRUE, FALSE, TRUE, TRUE, FALSE, 'published', '/assets/products/saree_ivory_mulmul.jpg'),
  ('rudrani-crimson-block-saree', 'RDH-522', 'Rudrani Crimson Manjistha Saree', 'Rich crimson root dye with bold traditional temple block pallu', 'Immersed in boiled Manjistha root extract and printed with historic temple motifs, Rudrani radiates timeless festive warmth.', 'Handcrafted by skilled generational artisans using authentic handloom weaving, carved wooden block stamps, and natural slow-cured dyes.', 'Handblock Print', 'handblock', 'Pure Handloom Mulmul Cotton', 'mulmul', 'Madder Red', 'madder', '#9E3C2B', 1690, NULL, 'Length: 6.5 meters (including 80 cm blouse piece) • Width: 45 inches • Weight: 380 g', 'Included — Matching unstitched pure cotton fabric with running artisan border', 'Gentle hand wash in cold water using mild eco-friendly liquid detergent. Do not soak. Line dry in shade.', 17, TRUE, FALSE, FALSE, FALSE, TRUE, 'published', '/assets/products/saree_madder_red.jpg'),
  ('kanan-moss-botanical-saree', 'RDH-523', 'Kanan Moss Green Botanical Saree', 'Organic moss green with delicate hand-stamped wild flora butis', 'Features gentle floral butis hand-stamped across a soft sage ground dyed with myrobalan and wild pomegranate.', 'Handcrafted by skilled generational artisans using authentic handloom weaving, carved wooden block stamps, and natural slow-cured dyes.', 'Botanical Block Print', 'handblock', '100% Breathable Mulmul Cotton', 'mulmul', 'Forest Olive', 'olive', '#525B3A', 1180, NULL, 'Length: 6.5 meters (including 80 cm blouse piece) • Width: 45 inches • Weight: 380 g', 'Included — Matching unstitched pure cotton fabric with running artisan border', 'Gentle hand wash in cold water using mild eco-friendly liquid detergent. Do not soak. Line dry in shade.', 17, TRUE, FALSE, FALSE, FALSE, FALSE, 'published', '/assets/products/saree_forest_olive.jpg'),
  ('sagarika-diamond-buti-saree', 'RDH-524', 'Sagarika Diamond Buti Indigo Saree', 'Hand-stamped geometric diamond motifs across midnight indigo mulmul', 'Geometric diamond stamps meet deep botanical indigo dye for a versatile drape that transitions seamlessly from day to dusk.', 'Handcrafted by skilled generational artisans using authentic handloom weaving, carved wooden block stamps, and natural slow-cured dyes.', 'Handblock Print', 'handblock', 'Pure Handloom Mulmul Cotton', 'mulmul', 'Indigo Blue', 'indigo', '#26425A', 1520, NULL, 'Length: 6.5 meters (including 80 cm blouse piece) • Width: 45 inches • Weight: 380 g', 'Included — Matching unstitched pure cotton fabric with running artisan border', 'Gentle hand wash in cold water using mild eco-friendly liquid detergent. Do not soak. Line dry in shade.', 8, TRUE, FALSE, FALSE, FALSE, FALSE, 'published', '/assets/products/saree_indigo_shibori_detail.jpg'),
  ('swarna-mustard-handloom-saree', 'RDH-525', 'Swarna Mustard Handloom Saree', 'Warm mustard yellow dyed with organic turmeric and marigold petals', 'Brimming with joyous energy, Swarna is dyed using fresh haldi and temple blossoms on slow-spun organic handloom cotton.', 'Handcrafted by skilled generational artisans using authentic handloom weaving, carved wooden block stamps, and natural slow-cured dyes.', 'Handloom Cotton', 'mulmul', 'Pure Handloom Mulmul Cotton', 'mulmul', 'Muted Gold', 'gold', '#B88D4A', 880, NULL, 'Length: 6.5 meters (including 80 cm blouse piece) • Width: 45 inches • Weight: 380 g', 'Included — Matching unstitched pure cotton fabric with running artisan border', 'Gentle hand wash in cold water using mild eco-friendly liquid detergent. Do not soak. Line dry in shade.', 13, TRUE, FALSE, TRUE, TRUE, TRUE, 'published', '/assets/products/saree_muted_gold.jpg'),
  ('kasturi-coral-dabu-saree', 'RDH-526', 'Kasturi Coral Mud-Resist Saree', 'Warm coral rose mud-resist print with antique floral borders', 'Combining natural Dabu resist printing with gentle madder pink hues, Kasturi is soft, romantic, and thoroughly handcrafted.', 'Handcrafted by skilled generational artisans using authentic handloom weaving, carved wooden block stamps, and natural slow-cured dyes.', 'Dabu Mud-Resist', 'handblock', '100% Breathable Mulmul Cotton', 'mulmul', 'Soft Rose', 'rose', '#C98278', 1280, NULL, 'Length: 6.5 meters (including 80 cm blouse piece) • Width: 45 inches • Weight: 380 g', 'Included — Matching unstitched pure cotton fabric with running artisan border', 'Gentle hand wash in cold water using mild eco-friendly liquid detergent. Do not soak. Line dry in shade.', 14, TRUE, FALSE, FALSE, FALSE, FALSE, 'published', '/assets/products/saree_soft_rose.jpg'),
  ('godavari-slate-block-saree', 'RDH-527', 'Godavari Slate Indigo Block Saree', 'Slate blue and indigo river motifs hand-stamped with teakwood blocks', 'Inspired by the sacred Godavari riverbanks, featuring undulating wave patterns stamped onto lightweight cotton.', 'Handcrafted by skilled generational artisans using authentic handloom weaving, carved wooden block stamps, and natural slow-cured dyes.', 'Handblock Print', 'handblock', 'Pure Handloom Mulmul Cotton', 'mulmul', 'Indigo Blue', 'indigo', '#26425A', 1380, NULL, 'Length: 6.5 meters (including 80 cm blouse piece) • Width: 45 inches • Weight: 380 g', 'Included — Matching unstitched pure cotton fabric with running artisan border', 'Gentle hand wash in cold water using mild eco-friendly liquid detergent. Do not soak. Line dry in shade.', 6, TRUE, FALSE, FALSE, FALSE, FALSE, 'published', '/assets/products/saree_deep_indigo_zari.jpg'),
  ('maitreyi-earth-jaal-saree', 'RDH-528', 'Maitreyi Earth Clay Jaal Saree', 'All-over floral vine lattice printed in rich terracotta mud dye', 'An intricate floral jaal stamped across soft mulmul using natural earth minerals and clay for a deeply grounding feel.', 'Handcrafted by skilled generational artisans using authentic handloom weaving, carved wooden block stamps, and natural slow-cured dyes.', 'Bagru Mud-Resist', 'handblock', '100% Breathable Mulmul Cotton', 'mulmul', 'Earth Brown', 'earth', '#4B3024', 1080, NULL, 'Length: 6.5 meters (including 80 cm blouse piece) • Width: 45 inches • Weight: 380 g', 'Included — Matching unstitched pure cotton fabric with running artisan border', 'Gentle hand wash in cold water using mild eco-friendly liquid detergent. Do not soak. Line dry in shade.', 13, TRUE, FALSE, FALSE, FALSE, TRUE, 'published', '/assets/products/saree_earth_bagru_detail.jpg'),
  ('shweta-pearl-kota-saree', 'RDH-529', 'Shweta Pearl Kota Doria Saree', 'Gossamer check weave in natural unbleached ivory with clean selvedge', 'An airy everyday classic. The signature square khat texture of Kota Doria creates a light, floating silhouette.', 'Handcrafted by skilled generational artisans using authentic handloom weaving, carved wooden block stamps, and natural slow-cured dyes.', 'Kota Doria Cotton', 'chanderi', 'Authentic Kota Doria Cotton', 'chanderi', 'Raw Ivory', 'ivory', '#FAF6EE', 690, NULL, 'Length: 6.5 meters (including 80 cm blouse piece) • Width: 45 inches • Weight: 380 g', 'Included — Matching unstitched pure cotton fabric with running artisan border', 'Gentle hand wash in cold water using mild eco-friendly liquid detergent. Do not soak. Line dry in shade.', 11, TRUE, FALSE, TRUE, TRUE, FALSE, 'published', '/assets/products/saree_ivory_mulmul.jpg'),
  ('raktika-crimson-bagru-saree', 'RDH-530', 'Raktika Crimson Bagru Paisley Saree', 'Regal Bagru paisley butis in deep fermented crimson root dye', 'Generational Bagru artisans hand-print each paisley motif with wooden stamps, followed by river washing and sun drying.', 'Handcrafted by skilled generational artisans using authentic handloom weaving, carved wooden block stamps, and natural slow-cured dyes.', 'Bagru Mud-Resist', 'handblock', 'Pure Handloom Mulmul Cotton', 'mulmul', 'Madder Red', 'madder', '#9E3C2B', 1750, NULL, 'Length: 6.5 meters (including 80 cm blouse piece) • Width: 45 inches • Weight: 380 g', 'Included — Matching unstitched pure cotton fabric with running artisan border', 'Gentle hand wash in cold water using mild eco-friendly liquid detergent. Do not soak. Line dry in shade.', 17, TRUE, FALSE, FALSE, FALSE, FALSE, 'published', '/assets/products/saree_madder_red.jpg'),
  ('aranya-forest-fern-saree', 'RDH-531', 'Aranya Forest Fern Block Saree', 'Deep woodland green with wild fern stamps and thin gold running border', 'Evoking cool monsoon forests, dyed in pomegranate and harda extracts, imprinted with hand-carved botanical fern motifs.', 'Handcrafted by skilled generational artisans using authentic handloom weaving, carved wooden block stamps, and natural slow-cured dyes.', 'Botanical Block Print', 'handblock', '100% Breathable Mulmul Cotton', 'mulmul', 'Forest Olive', 'olive', '#525B3A', 1120, NULL, 'Length: 6.5 meters (including 80 cm blouse piece) • Width: 45 inches • Weight: 380 g', 'Included — Matching unstitched pure cotton fabric with running artisan border', 'Gentle hand wash in cold water using mild eco-friendly liquid detergent. Do not soak. Line dry in shade.', 16, TRUE, FALSE, FALSE, FALSE, TRUE, 'published', '/assets/products/saree_forest_olive.jpg'),
  ('jalaja-ripple-shibori-saree', 'RDH-532', 'Jalaja Ripple Shibori Cotton Saree', 'Concentric water ripple tie-dye rings in vibrant natural indigo', 'Individual fabric nodes are bound with thread by hand before vat immersion, producing beautiful organic sunburst ripples.', 'Handcrafted by skilled generational artisans using authentic handloom weaving, carved wooden block stamps, and natural slow-cured dyes.', 'Tie & Dye / Shibori', 'tie-dye', 'Featherweight Mulmul Cotton', 'mulmul', 'Indigo Blue', 'indigo', '#26425A', 1480, NULL, 'Length: 6.5 meters (including 80 cm blouse piece) • Width: 45 inches • Weight: 380 g', 'Included — Matching unstitched pure cotton fabric with running artisan border', 'Gentle hand wash in cold water using mild eco-friendly liquid detergent. Do not soak. Line dry in shade.', 10, TRUE, FALSE, FALSE, FALSE, FALSE, 'published', '/assets/products/saree_indigo_shibori.jpg'),
  ('vasudha-golden-wheat-saree', 'RDH-533', 'Vasudha Golden Wheat Handloom Saree', 'Warm golden grain shade with hand-woven micro motifs and pallu fringe', 'Named after Mother Earth, Vasudha is handwoven from rain-fed cotton and naturally colored in warm amber tones.', 'Handcrafted by skilled generational artisans using authentic handloom weaving, carved wooden block stamps, and natural slow-cured dyes.', 'Handloom Cotton', 'mulmul', 'Pure Handspun Cotton', 'mulmul', 'Muted Gold', 'gold', '#B88D4A', 920, NULL, 'Length: 6.5 meters (including 80 cm blouse piece) • Width: 45 inches • Weight: 380 g', 'Included — Matching unstitched pure cotton fabric with running artisan border', 'Gentle hand wash in cold water using mild eco-friendly liquid detergent. Do not soak. Line dry in shade.', 8, TRUE, FALSE, TRUE, TRUE, FALSE, 'published', '/assets/products/saree_muted_gold.jpg'),
  ('ananya-rose-petal-saree', 'RDH-534', 'Ananya Rose Petal Dabu Saree', 'Delicate floral petal scatter stamped in organic madder and clay', 'Petal motifs are hand-stamped onto soft mulmul using ancient mud-resist techniques for a romantic, organic drape.', 'Handcrafted by skilled generational artisans using authentic handloom weaving, carved wooden block stamps, and natural slow-cured dyes.', 'Dabu Mud-Resist', 'handblock', '100% Breathable Mulmul Cotton', 'mulmul', 'Soft Rose', 'rose', '#C98278', 1260, NULL, 'Length: 6.5 meters (including 80 cm blouse piece) • Width: 45 inches • Weight: 380 g', 'Included — Matching unstitched pure cotton fabric with running artisan border', 'Gentle hand wash in cold water using mild eco-friendly liquid detergent. Do not soak. Line dry in shade.', 14, TRUE, FALSE, FALSE, FALSE, TRUE, 'published', '/assets/products/saree_soft_rose.jpg'),
  ('yamuna-deep-teal-saree', 'RDH-535', 'Yamuna Deep Teal Block Print Saree', 'Rich teal and indigo geometric patterns inspired by sacred waterways', 'Features deep teal and ocean indigo shades achieved through successive vat immersions and intricate block printing.', 'Handcrafted by skilled generational artisans using authentic handloom weaving, carved wooden block stamps, and natural slow-cured dyes.', 'Handblock Print', 'handblock', 'Pure Handloom Mulmul Cotton', 'mulmul', 'Midnight Blue', 'indigo', '#1C2942', 1580, NULL, 'Length: 6.5 meters (including 80 cm blouse piece) • Width: 45 inches • Weight: 380 g', 'Included — Matching unstitched pure cotton fabric with running artisan border', 'Gentle hand wash in cold water using mild eco-friendly liquid detergent. Do not soak. Line dry in shade.', 8, TRUE, FALSE, FALSE, FALSE, FALSE, 'published', '/assets/products/saree_deep_indigo_zari.jpg'),
  ('bhumika-rustic-rust-saree', 'RDH-536', 'Bhumika Rustic Rust Mud-Resist Saree', 'Earthy rust and black mud-resist print with geometric border work', 'Warm, tactile, and rooted in tradition, Bhumika showcases the rich mineral earth of Rajasthan on breathable cotton.', 'Handcrafted by skilled generational artisans using authentic handloom weaving, carved wooden block stamps, and natural slow-cured dyes.', 'Dabu Mud-Resist', 'handblock', 'Pure Handloom Mulmul Cotton', 'mulmul', 'Earth Brown', 'earth', '#4B3024', 1160, NULL, 'Length: 6.5 meters (including 80 cm blouse piece) • Width: 45 inches • Weight: 380 g', 'Included — Matching unstitched pure cotton fabric with running artisan border', 'Gentle hand wash in cold water using mild eco-friendly liquid detergent. Do not soak. Line dry in shade.', 12, TRUE, FALSE, FALSE, FALSE, FALSE, 'published', '/assets/products/saree_earth_bagru.jpg'),
  ('chandrahas-cotton-buti-saree', 'RDH-537', 'Chandrahas Ecru Cotton Buti Saree', 'Pure raw cotton ground with subtle micro buti handblock print', 'Clean, breathable, and minimalist. Perfect for daily elegance, worship, meditation, or warm summer afternoons.', 'Handcrafted by skilled generational artisans using authentic handloom weaving, carved wooden block stamps, and natural slow-cured dyes.', 'Pure Mulmul Weave', 'mulmul', '100% Organic Unbleached Cotton', 'mulmul', 'Raw Ivory', 'ivory', '#FAF6EE', 750, NULL, 'Length: 6.5 meters (including 80 cm blouse piece) • Width: 45 inches • Weight: 380 g', 'Included — Matching unstitched pure cotton fabric with running artisan border', 'Gentle hand wash in cold water using mild eco-friendly liquid detergent. Do not soak. Line dry in shade.', 16, TRUE, FALSE, TRUE, TRUE, TRUE, 'published', '/assets/products/saree_ivory_mulmul.jpg'),
  ('sindhur-scarlet-block-saree', 'RDH-538', 'Sindhur Scarlet Root Handblock Saree', 'Vibrant scarlet madder dye with traditional floral butis and zari hem', 'Celebrates Indian festivities with auspicious red hues extracted from natural madder roots, adorned with rhythmic wooden butis.', 'Handcrafted by skilled generational artisans using authentic handloom weaving, carved wooden block stamps, and natural slow-cured dyes.', 'Handblock Print', 'handblock', 'Pure Handloom Mulmul Cotton', 'mulmul', 'Madder Red', 'madder', '#9E3C2B', 1620, NULL, 'Length: 6.5 meters (including 80 cm blouse piece) • Width: 45 inches • Weight: 380 g', 'Included — Matching unstitched pure cotton fabric with running artisan border', 'Gentle hand wash in cold water using mild eco-friendly liquid detergent. Do not soak. Line dry in shade.', 11, TRUE, FALSE, FALSE, FALSE, FALSE, 'published', '/assets/products/saree_madder_red.jpg'),
  ('kadambari-sage-mulmul-saree', 'RDH-539', 'Kadambari Sage Olive Mulmul Saree', 'Calming sage green with delicate jasmine vine block printing', 'Gentle, soothing, and refined. Hand-printed with blooming floral vines onto gossamer mulmul cotton.', 'Handcrafted by skilled generational artisans using authentic handloom weaving, carved wooden block stamps, and natural slow-cured dyes.', 'Botanical Block Print', 'handblock', '100% Breathable Mulmul Cotton', 'mulmul', 'Forest Olive', 'olive', '#525B3A', 1060, NULL, 'Length: 6.5 meters (including 80 cm blouse piece) • Width: 45 inches • Weight: 380 g', 'Included — Matching unstitched pure cotton fabric with running artisan border', 'Gentle hand wash in cold water using mild eco-friendly liquid detergent. Do not soak. Line dry in shade.', 11, TRUE, FALSE, FALSE, FALSE, FALSE, 'published', '/assets/products/saree_forest_olive.jpg'),
  ('meenakshi-indigo-peacock-saree', 'RDH-540', 'Meenakshi Peacock Tail Indigo Saree', 'Opulent peacock tail woodblock pattern in authentic indigo dye', 'A celebration of royal blue depth and intricate Indian woodblock carvings, with graceful peacock motifs across the pallu.', 'Handcrafted by skilled generational artisans using authentic handloom weaving, carved wooden block stamps, and natural slow-cured dyes.', 'Handblock Print', 'handblock', 'Pure Handloom Mulmul Cotton', 'mulmul', 'Indigo Blue', 'indigo', '#26425A', 1540, NULL, 'Length: 6.5 meters (including 80 cm blouse piece) • Width: 45 inches • Weight: 380 g', 'Included — Matching unstitched pure cotton fabric with running artisan border', 'Gentle hand wash in cold water using mild eco-friendly liquid detergent. Do not soak. Line dry in shade.', 11, TRUE, FALSE, FALSE, FALSE, TRUE, 'published', '/assets/products/saree_indigo_shibori_detail.jpg'),
  ('hiranmayi-amber-gold-saree', 'RDH-541', 'Hiranmayi Amber Gold Cotton Saree', 'Warm amber glow with fine horizontal zari patti and tassel pallu', 'Woven with airy open checks, Hiranmayi glows with warm honey and turmeric notes, complemented by delicate gold accents.', 'Handcrafted by skilled generational artisans using authentic handloom weaving, carved wooden block stamps, and natural slow-cured dyes.', 'Kota Doria Cotton', 'chanderi', 'Kota Doria Cotton', 'chanderi', 'Muted Gold', 'gold', '#B88D4A', 980, NULL, 'Length: 6.5 meters (including 80 cm blouse piece) • Width: 45 inches • Weight: 380 g', 'Included — Matching unstitched pure cotton fabric with running artisan border', 'Gentle hand wash in cold water using mild eco-friendly liquid detergent. Do not soak. Line dry in shade.', 16, TRUE, FALSE, TRUE, TRUE, FALSE, 'published', '/assets/products/saree_muted_gold.jpg'),
  ('manjula-dusty-pink-saree', 'RDH-542', 'Manjula Dusty Pink Floral Saree', 'Dusty rose madder ground with contrasting Bagru terracotta motifs', 'Blends quiet pink grounds with earthy Bagru stamps, offering a gentle drape that flatters all complexions.', 'Handcrafted by skilled generational artisans using authentic handloom weaving, carved wooden block stamps, and natural slow-cured dyes.', 'Bagru Mud-Resist', 'handblock', '100% Breathable Mulmul Cotton', 'mulmul', 'Soft Rose', 'rose', '#C98278', 1240, NULL, 'Length: 6.5 meters (including 80 cm blouse piece) • Width: 45 inches • Weight: 380 g', 'Included — Matching unstitched pure cotton fabric with running artisan border', 'Gentle hand wash in cold water using mild eco-friendly liquid detergent. Do not soak. Line dry in shade.', 15, TRUE, FALSE, FALSE, FALSE, FALSE, 'published', '/assets/products/saree_soft_rose.jpg'),
  ('kaveri-cobalt-shibori-saree', 'RDH-543', 'Kaveri Cobalt Shibori Saree', 'Concentric hand-bound diamond shibori in vibrant cobalt indigo', 'Skilled artisans tie hundreds of fine knots across the cotton fabric before dipping into indigo vats, creating organic geometric harmony.', 'Handcrafted by skilled generational artisans using authentic handloom weaving, carved wooden block stamps, and natural slow-cured dyes.', 'Tie & Dye / Shibori', 'tie-dye', 'Featherweight Mulmul Cotton', 'mulmul', 'Indigo Blue', 'indigo', '#26425A', 1440, NULL, 'Length: 6.5 meters (including 80 cm blouse piece) • Width: 45 inches • Weight: 380 g', 'Included — Matching unstitched pure cotton fabric with running artisan border', 'Gentle hand wash in cold water using mild eco-friendly liquid detergent. Do not soak. Line dry in shade.', 8, TRUE, FALSE, FALSE, FALSE, TRUE, 'published', '/assets/products/saree_indigo_shibori.jpg'),
  ('mridula-warm-umber-saree', 'RDH-544', 'Mridula Warm Umber Bagru Saree', 'Natural iron rust and umber block print with floral boota borders', 'Rich earthy umber tones achieved through traditional rust-water fermentation and sun curing on river banks.', 'Handcrafted by skilled generational artisans using authentic handloom weaving, carved wooden block stamps, and natural slow-cured dyes.', 'Bagru Mud-Resist', 'handblock', 'Pure Handloom Mulmul Cotton', 'mulmul', 'Earth Brown', 'earth', '#4B3024', 1140, NULL, 'Length: 6.5 meters (including 80 cm blouse piece) • Width: 45 inches • Weight: 380 g', 'Included — Matching unstitched pure cotton fabric with running artisan border', 'Gentle hand wash in cold water using mild eco-friendly liquid detergent. Do not soak. Line dry in shade.', 15, TRUE, FALSE, FALSE, FALSE, FALSE, 'published', '/assets/products/saree_earth_bagru_detail.jpg'),
  ('mallika-offwhite-thread-saree', 'RDH-545', 'Mallika Pure White Mulmul Saree', 'Ultra-soft featherweight everyday pure cotton with clean finished edges', 'The purest expression of handcrafted slow living. Weightless, cooling, and infinitely comfortable for summer days.', 'Handcrafted by skilled generational artisans using authentic handloom weaving, carved wooden block stamps, and natural slow-cured dyes.', 'Pure Mulmul Weave', 'mulmul', '100% Breathable Mulmul Cotton', 'mulmul', 'Raw Ivory', 'ivory', '#FAF6EE', 590, NULL, 'Length: 6.5 meters (including 80 cm blouse piece) • Width: 45 inches • Weight: 380 g', 'Included — Matching unstitched pure cotton fabric with running artisan border', 'Gentle hand wash in cold water using mild eco-friendly liquid detergent. Do not soak. Line dry in shade.', 7, TRUE, FALSE, TRUE, TRUE, FALSE, 'published', '/assets/products/saree_ivory_mulmul.jpg'),
  ('tamra-copper-terracotta-saree', 'RDH-546', 'Tamra Copper Terracotta Saree', 'Warm copper red and terracotta block print on unbleached cotton', 'Warm copper tones derived from iron scrap and molasses fermentation, paired with hand-carved floral stamps.', 'Handcrafted by skilled generational artisans using authentic handloom weaving, carved wooden block stamps, and natural slow-cured dyes.', 'Bagru Mud-Resist', 'handblock', 'Pure Handloom Mulmul Cotton', 'mulmul', 'Earth Brown', 'earth', '#4B3024', 1360, NULL, 'Length: 6.5 meters (including 80 cm blouse piece) • Width: 45 inches • Weight: 380 g', 'Included — Matching unstitched pure cotton fabric with running artisan border', 'Gentle hand wash in cold water using mild eco-friendly liquid detergent. Do not soak. Line dry in shade.', 14, TRUE, FALSE, FALSE, FALSE, TRUE, 'published', '/assets/products/saree_earth_bagru.jpg'),
  ('harini-mint-botanical-saree', 'RDH-547', 'Harini Mint Botanical Block Saree', 'Refreshing pale mint green ground with subtle leaf spray block print', 'A cooling breath of fresh air. Botanical olive-mint pigments bring quiet serenity to everyday cotton drapes.', 'Handcrafted by skilled generational artisans using authentic handloom weaving, carved wooden block stamps, and natural slow-cured dyes.', 'Botanical Block Print', 'handblock', '100% Breathable Mulmul Cotton', 'mulmul', 'Forest Olive', 'olive', '#525B3A', 1040, NULL, 'Length: 6.5 meters (including 80 cm blouse piece) • Width: 45 inches • Weight: 380 g', 'Included — Matching unstitched pure cotton fabric with running artisan border', 'Gentle hand wash in cold water using mild eco-friendly liquid detergent. Do not soak. Line dry in shade.', 13, TRUE, FALSE, FALSE, FALSE, FALSE, 'published', '/assets/products/saree_forest_olive.jpg'),
  ('indulekha-indigo-crescent-saree', 'RDH-548', 'Indulekha Indigo Crescent Saree', 'Crescent moon motif shibori tie-dye in deep organic indigo', 'Features celestial crescent patterns hand-folded and tied with surgical precision before multiple indigo vat immersions.', 'Handcrafted by skilled generational artisans using authentic handloom weaving, carved wooden block stamps, and natural slow-cured dyes.', 'Tie & Dye / Shibori', 'tie-dye', 'Featherweight Mulmul Cotton', 'mulmul', 'Midnight Blue', 'indigo', '#1C2942', 1460, NULL, 'Length: 6.5 meters (including 80 cm blouse piece) • Width: 45 inches • Weight: 380 g', 'Included — Matching unstitched pure cotton fabric with running artisan border', 'Gentle hand wash in cold water using mild eco-friendly liquid detergent. Do not soak. Line dry in shade.', 12, TRUE, FALSE, FALSE, FALSE, FALSE, 'published', '/assets/products/saree_deep_indigo_zari.jpg'),
  ('revati-ochre-handloom-saree', 'RDH-549', 'Revati Ochre Handloom Cotton Saree', 'Rustic golden ochre weave with uncarded cotton texture and soft drape', 'Celebrates raw handspun textures, woven with care by generational weavers in soothing golden ochre.', 'Handcrafted by skilled generational artisans using authentic handloom weaving, carved wooden block stamps, and natural slow-cured dyes.', 'Handloom Cotton', 'mulmul', 'Pure Handspun Cotton', 'mulmul', 'Muted Gold', 'gold', '#B88D4A', 890, NULL, 'Length: 6.5 meters (including 80 cm blouse piece) • Width: 45 inches • Weight: 380 g', 'Included — Matching unstitched pure cotton fabric with running artisan border', 'Gentle hand wash in cold water using mild eco-friendly liquid detergent. Do not soak. Line dry in shade.', 16, TRUE, FALSE, TRUE, TRUE, TRUE, 'published', '/assets/products/saree_muted_gold.jpg'),
  ('sharanya-magenta-madder-saree', 'RDH-550', 'Sharanya Magenta Madder Block Saree', 'Deep magenta root dye with intricate paisley and floral wooden stamps', 'Combining rich madder reds with floral wooden blocks and a delicate woven border, Sharanya is a crowning artisanal drape.', 'Handcrafted by skilled generational artisans using authentic handloom weaving, carved wooden block stamps, and natural slow-cured dyes.', 'Handblock Print', 'handblock', 'Pure Handloom Mulmul Cotton', 'mulmul', 'Madder Red', 'madder', '#9E3C2B', 1680, NULL, 'Length: 6.5 meters (including 80 cm blouse piece) • Width: 45 inches • Weight: 380 g', 'Included — Matching unstitched pure cotton fabric with running artisan border', 'Gentle hand wash in cold water using mild eco-friendly liquid detergent. Do not soak. Line dry in shade.', 17, TRUE, FALSE, FALSE, FALSE, FALSE, 'published', '/assets/products/saree_madder_red.jpg')
ON CONFLICT (slug) DO UPDATE SET
    selling_price = EXCLUDED.selling_price,
    original_price = EXCLUDED.original_price,
    stock_count = EXCLUDED.stock_count,
    in_stock = EXCLUDED.in_stock,
    status = EXCLUDED.status,
    primary_image = EXCLUDED.primary_image,
    updated_at = NOW();

-- ----------------------------------------------------------------------------
-- 6. POPULATE public.product_images GALLERY
-- ----------------------------------------------------------------------------

INSERT INTO public.product_images (product_id, image_url, is_primary, alt_text, display_order)
SELECT p.id, p.primary_image, TRUE, p.name, 0
FROM public.products p
WHERE p.primary_image IS NOT NULL AND p.primary_image <> ''
ON CONFLICT DO NOTHING;
