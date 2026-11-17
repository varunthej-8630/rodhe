-- ============================================================================
-- RODHE INVENTORY LIFECYCLE MANAGEMENT ROLLBACK SCRIPT
-- Migration Rollback: 20261117_inventory_lifecycle_rollback.sql
-- Purpose: Safely rolls back 20261117_inventory_lifecycle_management.sql
-- ============================================================================

-- Drop RPC functions
DROP FUNCTION IF EXISTS public.seed_default_products_if_empty();
DROP FUNCTION IF EXISTS public.delete_product_safe(TEXT);
DROP FUNCTION IF EXISTS public.restore_product(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.archive_product(TEXT);

-- Restore prior RLS policies
DROP POLICY IF EXISTS "Public Read Published Products" ON public.products;
DROP POLICY IF EXISTS "Admin Select All Products" ON public.products;
DROP POLICY IF EXISTS "Admin Insert Products" ON public.products;
DROP POLICY IF EXISTS "Admin Update Products" ON public.products;
DROP POLICY IF EXISTS "Admin Delete Products" ON public.products;
DROP POLICY IF EXISTS "Admin Manage Product Images" ON public.product_images;
DROP POLICY IF EXISTS "Admin Manage Product Collections" ON public.product_collections;

CREATE POLICY "Public Read Published Products" ON public.products
    FOR SELECT USING (status = 'published');

CREATE POLICY "Admin Full Access Products" ON public.products
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Public Read Product Images" ON public.product_images
    FOR SELECT USING (true);

CREATE POLICY "Admin Full Access Product Images" ON public.product_images
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admin Full Access Product Collections" ON public.product_collections
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Drop indexes
DROP INDEX IF EXISTS public.idx_products_archived_at;
DROP INDEX IF EXISTS public.idx_products_status_updated;

-- Drop additive columns if needed
ALTER TABLE public.products DROP COLUMN IF EXISTS archived_at;
ALTER TABLE public.products DROP COLUMN IF EXISTS primary_image;

