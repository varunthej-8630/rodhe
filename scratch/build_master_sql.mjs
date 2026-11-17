import fs from 'fs';
import path from 'path';

const orderAtomicPath = 'supabase/migrations/20261117_fix_create_order_atomic_fk.sql';
const lifecyclePath = 'supabase/migrations/20261117_inventory_lifecycle_management.sql';
const seedPath = 'supabase/migrations/20261117_seed_all_50_sarees.sql';
const masterPath = 'supabase/migrations/20261117_master_production_repair.sql';

const orderAtomicSql = fs.readFileSync(orderAtomicPath, 'utf8');
const lifecycleSql = fs.readFileSync(lifecyclePath, 'utf8');
const seedSql = fs.readFileSync(seedPath, 'utf8');

const combined = `-- ============================================================================
-- RODHE MASTER PRODUCTION REPAIR SCRIPT (ALL-IN-ONE)
-- Migration: 20261117_master_production_repair.sql
--
-- THIS SINGLE SCRIPT RESOLVES ALL OF THE FOLLOWING:
-- 1. ERROR: 42703: column "primary_image" of relation "products" does not exist
-- 2. ERROR: 42601: syntax error at or near "FOR" (run the full create_order_atomic)
-- 3. ERROR: "inventory_movements" violates foreign key constraint "inventory_movements_reference_order_id_fkey"
-- 4. Boutique CRM Saree Deletion / Addition Persistence (Seeds all 50 sarees in Supabase)
-- 5. Safe Archive, Restore, and Permanent Deletion RPCs
--
-- INSTRUCTIONS FOR SUPABASE SQL EDITOR:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard/project/emtmzrjaygcrmzoatvfa/sql
-- 2. Click "+ New query"
-- 3. Select ALL text in this file (Ctrl+A), Copy (Ctrl+C), and Paste (Ctrl+V) into the editor
-- 4. Click the green "Run" button (or press Ctrl+Enter)
-- ============================================================================

-- ============================================================================
-- PART 1: SCHEMA ENHANCEMENTS & SAFE LIFECYCLE CONSTRAINTS
-- ============================================================================

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS primary_image TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_status_check;
ALTER TABLE public.products ADD CONSTRAINT products_status_check
    CHECK (status IN ('draft', 'published', 'archived'));

CREATE INDEX IF NOT EXISTS idx_products_status_updated
    ON public.products(status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_products_archived_at
    ON public.products(archived_at) WHERE archived_at IS NOT NULL;

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_collections ENABLE ROW LEVEL SECURITY;

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

-- ============================================================================
-- PART 2: ATOMIC ORDER CREATION RPC (WITH ORDERS INSERTED BEFORE INVENTORY)
-- ============================================================================

` + orderAtomicSql.slice(orderAtomicSql.indexOf('CREATE OR REPLACE FUNCTION public.create_order_atomic')) + `

-- ============================================================================
-- PART 3: SAFE INVENTORY LIFECYCLE MANAGEMENT RPCS
-- ============================================================================

` + lifecycleSql.slice(lifecycleSql.indexOf('-- 3. ATOMIC PRODUCT LIFECYCLE STORED PROCEDURES')) + `

-- ============================================================================
-- PART 4: SEED ALL 50 RODHE HANDCRAFTED SAREES INTO SUPABASE POSTGRESQL
-- ============================================================================

` + seedSql.slice(seedSql.indexOf('INSERT INTO public.products ('));

fs.writeFileSync(masterPath, combined, 'utf8');
console.log('✅ Generated master migration at:', masterPath);
console.log('Total characters:', combined.length);
