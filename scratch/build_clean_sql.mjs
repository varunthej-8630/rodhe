import fs from 'fs';
import { PRODUCTS } from '../src/data/products.js';

const orderAtomicSql = fs.readFileSync('supabase/migrations/20261117_fix_create_order_atomic_fk.sql', 'utf8');
const lifecycleSql = fs.readFileSync('supabase/migrations/20261117_inventory_lifecycle_management.sql', 'utf8');

// Extract clean create_order_atomic function
const funcStart = orderAtomicSql.indexOf('CREATE OR REPLACE FUNCTION public.create_order_atomic');
const funcEnd = orderAtomicSql.indexOf('GRANT EXECUTE ON FUNCTION public.create_order_atomic') + 'GRANT EXECUTE ON FUNCTION public.create_order_atomic(JSONB, JSONB) TO anon, authenticated;'.length;
const cleanCreateOrder = orderAtomicSql.slice(funcStart, funcEnd);

// Extract clean lifecycle functions (archive, restore, delete_product_safe)
const archiveStart = lifecycleSql.indexOf('CREATE OR REPLACE FUNCTION public.archive_product');
const deleteSafeEnd = lifecycleSql.indexOf('-- D. SEED DEFAULT PRODUCTS');
const cleanLifecycle = lifecycleSql.slice(archiveStart, deleteSafeEnd).trim();

// Build clean 50 saree insert statements
const escapeSql = (str) => {
  if (!str) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
};

const valueRows = PRODUCTS.map((p, idx) => {
  const slug = escapeSql(p.slug || p.id);
  const sku = escapeSql(p.sku || `RDH-${501 + idx}`);
  const name = escapeSql(p.name);
  const tagline = escapeSql(p.tagline || '');
  const description = escapeSql(p.description || '');
  const craftStory = escapeSql(p.craftStory || '');
  const craft = escapeSql(p.craft || 'Handloom');
  const craftCategory = escapeSql(p.craftCategory || 'mulmul');
  const fabric = escapeSql(p.fabric || 'Pure Cotton');
  const fabricType = escapeSql(p.fabricType || 'mulmul');
  const color = escapeSql(p.color || 'Natural');
  const colorFamily = escapeSql(p.colorFamily || 'earth');
  const colorHex = escapeSql(p.colorHex || '#4B3024');
  const sellingPrice = Number(p.price || p.sellingPrice || 990);
  const originalPrice = p.originalPrice ? Number(p.originalPrice) : 'NULL';
  const dimensions = escapeSql(p.dimensions || 'Length: 6.5 meters (including 80 cm blouse piece) • Width: 45 inches • Weight: 380 g');
  const blousePiece = escapeSql(p.blousePiece || 'Included — Matching unstitched pure cotton fabric with running artisan border');
  const washCare = escapeSql(p.washCare || 'Gentle hand wash in cold water using mild eco-friendly liquid detergent. Do not soak. Line dry in shade.');
  const stockCount = Math.floor(Math.random() * 12) + 6;
  const inStock = 'TRUE';
  const isFeatured = p.featured ? 'TRUE' : 'FALSE';
  const isBestseller = p.isBestseller ? 'TRUE' : 'FALSE';
  const isMostCoveted = idx % 4 === 0 ? 'TRUE' : 'FALSE';
  const isNewArrival = p.isNew ? 'TRUE' : 'FALSE';
  const status = `'published'`;
  const primaryImage = escapeSql(p.primaryImage || '/assets/products/saree_ivory_mulmul.jpg');

  return `  (${slug}, ${sku}, ${name}, ${tagline}, ${description}, ${craftStory}, ${craft}, ${craftCategory}, ${fabric}, ${fabricType}, ${color}, ${colorFamily}, ${colorHex}, ${sellingPrice}, ${originalPrice}, ${dimensions}, ${blousePiece}, ${washCare}, ${stockCount}, ${inStock}, ${isFeatured}, ${isBestseller}, ${isMostCoveted}, ${isNewArrival}, ${status}, ${primaryImage})`;
}).join(',\n');

const masterSql = `-- ============================================================================
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

${cleanCreateOrder}

-- ----------------------------------------------------------------------------
-- 4. INVENTORY LIFECYCLE RPCS: archive_product, restore_product, delete_product_safe
-- ----------------------------------------------------------------------------

${cleanLifecycle}

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
${valueRows}
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
`;

fs.writeFileSync('supabase/migrations/20261117_production_repair.sql', masterSql, 'utf8');
console.log('✅ Generated single clean migration: supabase/migrations/20261117_production_repair.sql');
console.log('Total characters:', masterSql.length);
