-- ============================================================================
-- RODHE INVENTORY LIFECYCLE MANAGEMENT MIGRATION
-- Migration: 20261117_inventory_lifecycle_management.sql
-- Purpose: Persistent Saree Lifecycle (Draft, Published, Archived),
--          Zero-Trust RLS Hardening via public.is_admin(),
--          Safe Permanent Deletion Protection (Preserves Order History),
--          and Atomic Lifecycle RPCs with Hardened search_path.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ADDITIVE SCHEMA ENHANCEMENTS ON public.products
-- ----------------------------------------------------------------------------

-- Add primary_image column for direct fast lookup if not already present
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS primary_image TEXT;

-- Add archived_at timestamp for tracking lifecycle archive transitions
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- Ensure status column CHECK constraint strictly enforces valid lifecycle states
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_status_check;
ALTER TABLE public.products ADD CONSTRAINT products_status_check
    CHECK (status IN ('draft', 'published', 'archived'));

-- Indexes for status, archive timestamps, and merchandising queries
CREATE INDEX IF NOT EXISTS idx_products_status_updated
    ON public.products(status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_products_archived_at
    ON public.products(archived_at) WHERE archived_at IS NOT NULL;

-- ----------------------------------------------------------------------------
-- 2. ZERO-TRUST ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_collections ENABLE ROW LEVEL SECURITY;

-- Drop legacy or over-permissive policies
DROP POLICY IF EXISTS "Public Read Published Products" ON public.products;
DROP POLICY IF EXISTS "Admin Full Access Products" ON public.products;
DROP POLICY IF EXISTS "Admin Select All Products" ON public.products;
DROP POLICY IF EXISTS "Admin Insert Products" ON public.products;
DROP POLICY IF EXISTS "Admin Update Products" ON public.products;
DROP POLICY IF EXISTS "Admin Delete Products" ON public.products;

DROP POLICY IF EXISTS "Public Read Product Images" ON public.product_images;
DROP POLICY IF EXISTS "Admin Full Access Product Images" ON public.product_images;
DROP POLICY IF EXISTS "Admin Manage Product Images" ON public.product_images;

DROP POLICY IF EXISTS "Admin Full Access Product Collections" ON public.product_collections;
DROP POLICY IF EXISTS "Admin Manage Product Collections" ON public.product_collections;

-- A. PRODUCTS POLICIES
-- Public & Anonymous can ONLY read active published sarees
CREATE POLICY "Public Read Published Products" ON public.products
    FOR SELECT
    USING (status = 'published');

-- Authenticated Administrators can SELECT all sarees (including drafts and archives)
CREATE POLICY "Admin Select All Products" ON public.products
    FOR SELECT TO authenticated
    USING (public.is_admin());

-- Authenticated Administrators can INSERT new sarees
CREATE POLICY "Admin Insert Products" ON public.products
    FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());

-- Authenticated Administrators can UPDATE saree details, stock, status
CREATE POLICY "Admin Update Products" ON public.products
    FOR UPDATE TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Authenticated Administrators can DELETE sarees (when safe)
CREATE POLICY "Admin Delete Products" ON public.products
    FOR DELETE TO authenticated
    USING (public.is_admin());

-- B. PRODUCT IMAGES POLICIES
-- Public can view gallery images
CREATE POLICY "Public Read Product Images" ON public.product_images
    FOR SELECT
    USING (true);

-- Only Authenticated Administrators can insert, update or delete gallery images
CREATE POLICY "Admin Manage Product Images" ON public.product_images
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- C. PRODUCT COLLECTIONS POLICIES
-- Public can view collection associations
CREATE POLICY "Public Read Product Collections" ON public.product_collections
    FOR SELECT
    USING (true);

-- Only Authenticated Administrators can manage collection mappings
CREATE POLICY "Admin Manage Product Collections" ON public.product_collections
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------------------
-- 3. ATOMIC PRODUCT LIFECYCLE STORED PROCEDURES (SECURITY DEFINER)
-- ----------------------------------------------------------------------------

-- A. ARCHIVE PRODUCT
-- Moves saree to archived status, hides from storefront, preserves order history.
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

-- D. SEED DEFAULT PRODUCTS (ADMIN-ONLY RE-POPULATION IF DATABASE IS EMPTY)
CREATE OR REPLACE FUNCTION public.seed_default_products_if_empty()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_count INT := 0;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Boutique administrator privileges required.'
            USING ERRCODE = '42501';
    END IF;

    SELECT COUNT(*) INTO v_count FROM public.products;
    IF v_count > 0 THEN
        RETURN v_count;
    END IF;

    -- Insert baseline slow-luxury sarees if catalogue is empty
    INSERT INTO public.products (
        slug, sku, name, tagline, description, craft_story,
        craft, craft_category, fabric, fabric_type,
        color, color_family, color_hex,
        selling_price, original_price, dimensions, blouse_piece, wash_care,
        stock_count, in_stock, is_featured, is_bestseller, is_most_coveted, is_new_arrival, status, primary_image
    ) VALUES
    ('nilambari-shibori-saree', 'RDH-501', 'Nilambari Shibori Mulmul Saree', 'Hand-knotted natural indigo tie-dye on featherweight organic cotton', 'Nilambari captures the timeless midnight blues of fermented indigo leaves. Hand-knotted and gently dipped in organic vats for a featherweight, breathable drape.', 'Handcrafted by skilled generational artisans using authentic handloom weaving, carved wooden block stamps, and natural slow-cured dyes.', 'Tie & Dye / Shibori', 'tie-dye', '100% Breathable Mulmul Cotton', 'mulmul', 'Indigo Blue', 'indigo', '#26425A', 1450, 1850, 'Length: 6.5 meters (including 80 cm blouse piece) • Width: 45 inches • Weight: 380 g', 'Included — Matching unstitched pure cotton fabric with running artisan border', 'Gentle hand wash in cold water using mild eco-friendly liquid detergent. Do not soak. Line dry in shade.', 6, TRUE, TRUE, TRUE, FALSE, TRUE, 'published', '/assets/products/saree_indigo_shibori.jpg'),
    ('mrittika-bagru-cotton-saree', 'RDH-502', 'Mrittika Bagru Mud-Resist Saree', 'Carved teakwood block print with terracotta madder root dye', 'Honoring Bagru soil, this drape is hand-stamped with seasoned teakwood blocks using age-old Dabu mud-resist and organic mineral pigments.', 'Handcrafted by skilled generational artisans using authentic handloom weaving, carved wooden block stamps, and natural slow-cured dyes.', 'Bagru Mud-Resist', 'handblock', 'Pure Handloom Mulmul Cotton', 'mulmul', 'Earth Clay Red', 'earth', '#8B4513', 1250, 1600, 'Length: 6.5 meters (including 80 cm blouse piece) • Width: 45 inches • Weight: 390 g', 'Included — Running matching fabric with woven zari border', 'Cold hand wash with natural detergent. Natural colors may release slight excess pigment on initial washes.', 8, TRUE, TRUE, TRUE, TRUE, FALSE, 'published', '/assets/products/saree_terracotta_bagru.jpg'),
    ('chandrika-ivory-mulmul-saree', 'RDH-503', 'Chandrika Raw Ivory Mulmul Saree', 'Unbleached natural cotton weave with delicate woven gold zari edge', 'Chandrika is poetry in restraint. Woven from unbleached Deccan cotton, its raw cream field reflects moonlight and quiet festive grace.', 'Handcrafted by skilled generational artisans using authentic handloom weaving, carved wooden block stamps, and natural slow-cured dyes.', 'Handloom Zari Border', 'mulmul', '100% Organic Raw Mulmul Cotton', 'mulmul', 'Raw Ivory', 'ivory', '#FDFBF7', 1650, 2100, 'Length: 6.5 meters (including 80 cm blouse piece) • Width: 46 inches • Weight: 370 g', 'Included — Contrast handloom blouse piece with pure metallic zari selvedge', 'Dry clean recommended for the first wash to preserve the delicate woven gold zari selvedge.', 5, TRUE, TRUE, FALSE, TRUE, TRUE, 'published', '/assets/products/saree_ivory_mulmul.jpg'),
    ('keshava-madder-red-saree', 'RDH-504', 'Keshava Madder Red Handblock Saree', 'Botanical alizarin root print on diaphanous summer cotton', 'Rich with natural alizarin root extract, Keshava evokes the auspicious red tones of Indian celebrations without harsh chemical synthetics.', 'Handcrafted by skilled generational artisans using authentic handloom weaving, carved wooden block stamps, and natural slow-cured dyes.', 'Handblock Print', 'handblock', 'Fine Count Pure Cotton', 'mulmul', 'Madder Red', 'madder', '#8A2A20', 1390, 1750, 'Length: 6.5 meters (including 80 cm blouse piece) • Width: 45 inches • Weight: 395 g', 'Included — Matching hand-blocked running blouse fabric', 'Gentle hand wash separately in cold water. Iron on reverse side while slightly damp.', 4, TRUE, TRUE, TRUE, FALSE, FALSE, 'published', '/assets/products/saree_crimson_manjistha.jpg'),
    ('vanashri-forest-olive-saree', 'RDH-505', 'Vanashri Forest Olive Block Saree', 'Pomegranate peel and myrobalan dye on handloom drape', 'A tribute to Deccan woodlands. Dyed with harda (myrobalan) and wild pomegranate rinds, Vanashri offers an understated olive hue.', 'Handcrafted by skilled generational artisans using authentic handloom weaving, carved wooden block stamps, and natural slow-cured dyes.', 'Natural Dye Handblock', 'handblock', 'Lightweight Slub Cotton', 'mulmul', 'Forest Olive', 'olive', '#525B3A', 1490, 1900, 'Length: 6.5 meters (including 80 cm blouse piece) • Width: 45 inches • Weight: 410 g', 'Included — Coordinated printed cotton blouse piece', 'Gentle cold hand wash with ph-neutral detergent. Avoid direct sunlight drying.', 7, TRUE, TRUE, FALSE, TRUE, FALSE, 'published', '/assets/products/saree_sage_olive.jpg'),
    ('gulabi-raag-mulmul-saree', 'RDH-506', 'Gulabi Raag Handblock Saree', 'Soft botanical rose blush with traditional floral jaal stamping', 'Draped in romantic pastels, Gulabi Raag combines gentle rose-petal infusions with fine hand-stamped floral jaal motifs for effortless day wear.', 'Handcrafted by skilled generational artisans using authentic handloom weaving, carved wooden block stamps, and natural slow-cured dyes.', 'Handblock Print', 'handblock', 'Airy Deccan Mulmul', 'mulmul', 'Soft Rose Pink', 'rose', '#D48C80', 1190, 1500, 'Length: 6.5 meters (including 80 cm blouse piece) • Width: 45 inches • Weight: 360 g', 'Included — Matching blush mulmul blouse piece', 'Cold hand wash with gentle detergent. Do not wring or tumble dry.', 9, TRUE, TRUE, FALSE, FALSE, TRUE, 'published', '/assets/products/saree_dusty_pink.jpg'),
    ('vasantika-haldi-gold-saree', 'RDH-507', 'Vasantika Haldi Gold Handloom Saree', 'Turmeric and marigold botanical dye with subtle woven temple border', 'Vasantika radiates morning sunlight. Infused with natural turmeric baths and temple-inspired border weaves, this piece celebrates renewal.', 'Handcrafted by skilled generational artisans using authentic handloom weaving, carved wooden block stamps, and natural slow-cured dyes.', 'Handloom Weave', 'mulmul', 'Fine Breathable Cotton', 'mulmul', 'Haldi Gold', 'gold', '#B88D4A', 1350, 1700, 'Length: 6.5 meters (including 80 cm blouse piece) • Width: 45 inches • Weight: 385 g', 'Included — Running cotton fabric with gold selvedge', 'Dry clean first wash. Later gentle cold wash. Turmeric dyes are light-sensitive; store away from bright sun.', 3, TRUE, TRUE, TRUE, FALSE, TRUE, 'published', '/assets/products/saree_golden_wheat.jpg'),
    ('shyamali-deep-indigo-ajrakh-saree', 'RDH-508', 'Shyamali Deep Indigo Ajrakh Saree', 'Traditional 14-stage double-side block print on heritage cotton', 'Shyamali represents master-level Ajrakh block craft. Each yard undergoes up to fourteen washing and printing stages using natural river water.', 'Handcrafted by skilled generational artisans using authentic handloom weaving, carved wooden block stamps, and natural slow-cured dyes.', 'Ajrakh Handblock', 'handblock', 'Dense Weave Pure Cotton', 'mulmul', 'Midnight Indigo', 'indigo', '#1B263B', 1790, 2300, 'Length: 6.5 meters (including 80 cm blouse piece) • Width: 46 inches • Weight: 430 g', 'Included — Contrast geometric patterned Ajrakh blouse fabric', 'Gentle separate hand wash in cold water. Iron on low heat on the reverse side.', 6, TRUE, TRUE, FALSE, TRUE, FALSE, 'published', '/assets/products/saree_cobalt_shibori.jpg');

    SELECT COUNT(*) INTO v_count FROM public.products;
    RETURN v_count;
END;
$$;

-- ----------------------------------------------------------------------------
-- 4. PERMISSIONS & RPC GRANTS
-- ----------------------------------------------------------------------------

GRANT EXECUTE ON FUNCTION public.archive_product(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.restore_product(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_product_safe(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.seed_default_products_if_empty() TO authenticated;

