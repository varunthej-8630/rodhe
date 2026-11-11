-- ============================================================================
-- RODHE CRM — Money Planner (Saree Batch Cost & Pricing Planner)
-- Migration: 20261112_crm_money_planner.sql
-- IMPORTANT: Review carefully and execute manually in Supabase SQL Editor.
-- Enforces Owner/Admin authorization, server-derived organization isolation,
-- RLS policies, atomic multi-line writes, optimistic locking, and server
-- recomputation of all financial totals.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. ORGANIZATION OWNERSHIP ON ADMIN_USERS (Backward-Compatible)
-- ============================================================================

ALTER TABLE public.admin_users
    ADD COLUMN IF NOT EXISTS organization_id UUID NOT NULL
    DEFAULT '11111111-1111-4111-8111-111111111111'::uuid;

CREATE INDEX IF NOT EXISTS idx_admin_users_org ON public.admin_users(organization_id);

-- Server-derived organization context (NEVER accepted from client request)
CREATE OR REPLACE FUNCTION public.current_admin_org_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT au.organization_id
  FROM public.admin_users au
  WHERE (
    au.user_id = auth.uid()
    OR LOWER(au.email) = LOWER((SELECT email FROM auth.users WHERE id = auth.uid()))
  )
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.current_admin_org_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_admin_org_id() TO authenticated;

-- ============================================================================
-- 2. MONEY PLANNER TABLES: money_batches & money_batch_lines
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.money_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 120),
    quantity INT NOT NULL CHECK (quantity >= 1 AND quantity <= 100000),
    profit_percent NUMERIC(6, 2) CHECK (profit_percent IS NULL OR (profit_percent >= 0 AND profit_percent <= 1000 AND ROUND(profit_percent, 2) = profit_percent)),
    setup_total NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (setup_total >= 0),
    per_saree_total NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (per_saree_total >= 0),
    total_money_needed NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (total_money_needed >= 0),
    cost_per_saree NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (cost_per_saree >= 0),
    estimated_selling_price NUMERIC(14, 2) CHECK (estimated_selling_price IS NULL OR estimated_selling_price >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.money_batch_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID NOT NULL REFERENCES public.money_batches(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL,
    name TEXT NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 80),
    kind TEXT NOT NULL CHECK (kind IN ('setup', 'per_saree')),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0 AND amount <= 10000000.00 AND ROUND(amount, 2) = amount),
    sort_order INT NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for organization isolation, creator lookup, batch search, sort & pagination
CREATE INDEX IF NOT EXISTS idx_money_batches_org_updated
    ON public.money_batches(organization_id, updated_at DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_money_batches_org_name
    ON public.money_batches(organization_id, LOWER(name));
CREATE INDEX IF NOT EXISTS idx_money_batches_created_by
    ON public.money_batches(created_by);
CREATE INDEX IF NOT EXISTS idx_money_batch_lines_batch_order
    ON public.money_batch_lines(batch_id, kind, sort_order);
CREATE INDEX IF NOT EXISTS idx_money_batch_lines_org
    ON public.money_batch_lines(organization_id);

-- ============================================================================
-- 3. STRICT ROW LEVEL SECURITY (Zero Public / Zero Cross-Organization Access)
-- ============================================================================

ALTER TABLE public.money_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.money_batch_lines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Money Batches Admin Select" ON public.money_batches;
DROP POLICY IF EXISTS "Money Batches Admin Insert" ON public.money_batches;
DROP POLICY IF EXISTS "Money Batches Admin Update" ON public.money_batches;
DROP POLICY IF EXISTS "Money Batches Admin Delete" ON public.money_batches;

CREATE POLICY "Money Batches Admin Select" ON public.money_batches
    FOR SELECT TO authenticated
    USING (public.is_admin() AND organization_id = public.current_admin_org_id());

CREATE POLICY "Money Batches Admin Insert" ON public.money_batches
    FOR INSERT TO authenticated
    WITH CHECK (public.is_admin() AND organization_id = public.current_admin_org_id());

CREATE POLICY "Money Batches Admin Update" ON public.money_batches
    FOR UPDATE TO authenticated
    USING (public.is_admin() AND organization_id = public.current_admin_org_id())
    WITH CHECK (public.is_admin() AND organization_id = public.current_admin_org_id());

CREATE POLICY "Money Batches Admin Delete" ON public.money_batches
    FOR DELETE TO authenticated
    USING (public.is_admin() AND organization_id = public.current_admin_org_id());

DROP POLICY IF EXISTS "Money Batch Lines Admin Select" ON public.money_batch_lines;
DROP POLICY IF EXISTS "Money Batch Lines Admin Insert" ON public.money_batch_lines;
DROP POLICY IF EXISTS "Money Batch Lines Admin Update" ON public.money_batch_lines;
DROP POLICY IF EXISTS "Money Batch Lines Admin Delete" ON public.money_batch_lines;

CREATE POLICY "Money Batch Lines Admin Select" ON public.money_batch_lines
    FOR SELECT TO authenticated
    USING (public.is_admin() AND organization_id = public.current_admin_org_id());

CREATE POLICY "Money Batch Lines Admin Insert" ON public.money_batch_lines
    FOR INSERT TO authenticated
    WITH CHECK (public.is_admin() AND organization_id = public.current_admin_org_id());

CREATE POLICY "Money Batch Lines Admin Update" ON public.money_batch_lines
    FOR UPDATE TO authenticated
    USING (public.is_admin() AND organization_id = public.current_admin_org_id())
    WITH CHECK (public.is_admin() AND organization_id = public.current_admin_org_id());

CREATE POLICY "Money Batch Lines Admin Delete" ON public.money_batch_lines
    FOR DELETE TO authenticated
    USING (public.is_admin() AND organization_id = public.current_admin_org_id());

-- Explicit defense-in-depth privilege restriction
REVOKE ALL ON public.money_batches FROM PUBLIC, anon;
REVOKE ALL ON public.money_batch_lines FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.money_batches TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.money_batch_lines TO authenticated;

-- ============================================================================
-- 4. TRANSACTIONAL & SERVER-AUTHORITATIVE RPCS
-- ============================================================================

-- A. List saved batches (search + pagination, organization-scoped)
CREATE OR REPLACE FUNCTION public.list_money_batches(
    p_search TEXT DEFAULT '',
    p_page INT DEFAULT 1,
    p_page_size INT DEFAULT 10
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_org_id UUID;
    v_search TEXT := btrim(COALESCE(p_search, ''));
    v_page INT := GREATEST(COALESCE(p_page, 1), 1);
    v_page_size INT := LEAST(GREATEST(COALESCE(p_page_size, 10), 1), 50);
    v_offset INT := (v_page - 1) * v_page_size;
    v_total_count INT := 0;
    v_items JSONB := '[]'::jsonb;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Admin privileges required.' USING ERRCODE = '42501';
    END IF;

    v_org_id := public.current_admin_org_id();
    IF v_org_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: No organization context assigned.' USING ERRCODE = '42501';
    END IF;

    SELECT COUNT(*)
    INTO v_total_count
    FROM public.money_batches mb
    WHERE mb.organization_id = v_org_id
      AND (v_search = '' OR mb.name ILIKE '%' || replace(replace(replace(v_search, '\', '\\'), '%', '\%'), '_', '\_') || '%' ESCAPE '\');

    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
    INTO v_items
    FROM (
        SELECT
            mb.id,
            mb.name,
            mb.quantity,
            mb.profit_percent,
            mb.setup_total,
            mb.per_saree_total,
            mb.total_money_needed,
            mb.cost_per_saree,
            mb.estimated_selling_price,
            mb.created_at,
            mb.updated_at,
            (SELECT COUNT(*) FROM public.money_batch_lines mbl WHERE mbl.batch_id = mb.id) AS line_count
        FROM public.money_batches mb
        WHERE mb.organization_id = v_org_id
          AND (v_search = '' OR mb.name ILIKE '%' || replace(replace(replace(v_search, '\', '\\'), '%', '\%'), '_', '\_') || '%' ESCAPE '\')
        ORDER BY mb.updated_at DESC, mb.created_at DESC
        LIMIT v_page_size
        OFFSET v_offset
    ) t;

    RETURN jsonb_build_object(
        'items', v_items,
        'total_count', v_total_count,
        'page', v_page,
        'page_size', v_page_size
    );
END;
$$;

-- B. Get one saved batch + sorted lines (organization-scoped)
CREATE OR REPLACE FUNCTION public.get_money_batch(
    p_batch_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_org_id UUID;
    v_batch public.money_batches%ROWTYPE;
    v_lines JSONB;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Admin privileges required.' USING ERRCODE = '42501';
    END IF;

    v_org_id := public.current_admin_org_id();
    IF v_org_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: No organization context assigned.' USING ERRCODE = '42501';
    END IF;

    SELECT *
    INTO v_batch
    FROM public.money_batches
    WHERE id = p_batch_id
      AND organization_id = v_org_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Batch not found or belongs to another organization.' USING ERRCODE = 'P0002';
    END IF;

    SELECT COALESCE(jsonb_agg(row_to_json(l) ORDER BY l.kind, l.sort_order), '[]'::jsonb)
    INTO v_lines
    FROM (
        SELECT id, batch_id, name, kind, amount, sort_order, created_at, updated_at
        FROM public.money_batch_lines
        WHERE batch_id = v_batch.id
          AND organization_id = v_org_id
        ORDER BY kind, sort_order
    ) l;

    RETURN jsonb_build_object(
        'batch', row_to_json(v_batch),
        'lines', v_lines
    );
END;
$$;

-- C. Create or update batch atomically with server-side financial recomputation & optimistic locking
CREATE OR REPLACE FUNCTION public.save_money_batch_atomic(
    p_batch_id UUID DEFAULT NULL,
    p_name TEXT DEFAULT '',
    p_quantity INT DEFAULT 30,
    p_profit_percent NUMERIC DEFAULT NULL,
    p_lines JSONB DEFAULT '[]'::jsonb,
    p_expected_updated_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_org_id UUID;
    v_user_id UUID := auth.uid();
    v_clean_name TEXT := btrim(COALESCE(p_name, ''));
    v_existing public.money_batches%ROWTYPE;
    v_batch_id UUID;
    v_line JSONB;
    v_line_idx INT := 0;
    v_line_name TEXT;
    v_line_kind TEXT;
    v_line_amount NUMERIC;
    v_setup_total NUMERIC(14, 2) := 0;
    v_per_saree_total NUMERIC(14, 2) := 0;
    v_total_money NUMERIC(14, 2) := 0;
    v_cost_per_saree NUMERIC(14, 2) := 0;
    v_selling_price NUMERIC(14, 2) := NULL;
    v_lines_out JSONB;
    v_batch_out public.money_batches%ROWTYPE;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Admin privileges required.' USING ERRCODE = '42501';
    END IF;

    v_org_id := public.current_admin_org_id();
    IF v_org_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: No organization context assigned.' USING ERRCODE = '42501';
    END IF;

    -- Input validation (never trust client calculations or unvalidated payloads)
    IF char_length(v_clean_name) < 1 OR char_length(v_clean_name) > 120 THEN
        RAISE EXCEPTION 'Batch name must be between 1 and 120 characters.' USING ERRCODE = '22023';
    END IF;

    IF p_quantity IS NULL OR p_quantity < 1 OR p_quantity > 100000 THEN
        RAISE EXCEPTION 'Quantity must be a whole number between 1 and 100000.' USING ERRCODE = '22023';
    END IF;

    IF p_profit_percent IS NOT NULL THEN
        IF p_profit_percent < 0 OR p_profit_percent > 1000 OR ROUND(p_profit_percent, 2) <> p_profit_percent THEN
            RAISE EXCEPTION 'Profit percentage must be between 0 and 1000 with at most 2 decimal places.' USING ERRCODE = '22023';
        END IF;
    END IF;

    IF p_lines IS NULL OR jsonb_typeof(p_lines) <> 'array' THEN
        RAISE EXCEPTION 'Cost lines payload must be a JSON array.' USING ERRCODE = '22023';
    END IF;

    IF jsonb_array_length(p_lines) > 80 THEN
        RAISE EXCEPTION 'Maximum 80 cost lines allowed per batch.' USING ERRCODE = '22023';
    END IF;

    -- Validate all lines and compute authoritative totals on the server
    FOR v_line IN SELECT value FROM jsonb_array_elements(p_lines) LOOP
        v_line_name := btrim(COALESCE(v_line->>'name', ''));
        v_line_kind := COALESCE(v_line->>'kind', '');

        IF v_line_kind NOT IN ('setup', 'per_saree') THEN
            RAISE EXCEPTION 'Invalid cost type "%". Must be setup or per_saree.', v_line_kind USING ERRCODE = '22023';
        END IF;

        IF char_length(v_line_name) < 1 OR char_length(v_line_name) > 80 THEN
            RAISE EXCEPTION 'Each cost name must be between 1 and 80 characters.' USING ERRCODE = '22023';
        END IF;

        BEGIN
            v_line_amount := (v_line->>'amount')::NUMERIC;
        EXCEPTION WHEN OTHERS THEN
            RAISE EXCEPTION 'Invalid numeric amount for "%".', v_line_name USING ERRCODE = '22023';
        END;

        IF v_line_amount IS NULL OR v_line_amount < 0 OR v_line_amount > 10000000.00 OR ROUND(v_line_amount, 2) <> v_line_amount THEN
            RAISE EXCEPTION 'Amount for "%" must be between 0 and 10000000.00 with at most 2 decimal places.', v_line_name USING ERRCODE = '22023';
        END IF;

        IF v_line_kind = 'setup' THEN
            v_setup_total := v_setup_total + v_line_amount;
        ELSE
            v_per_saree_total := v_per_saree_total + v_line_amount;
        END IF;
    END LOOP;

    v_total_money := ROUND(v_setup_total + (v_per_saree_total * p_quantity), 2);
    v_cost_per_saree := ROUND(v_total_money / p_quantity, 2);
    IF p_profit_percent IS NOT NULL THEN
        v_selling_price := ROUND(v_cost_per_saree * (1 + (p_profit_percent / 100.0)), 2);
    END IF;

    -- Create vs Update inside transaction with organization verification and optimistic concurrency
    IF p_batch_id IS NULL THEN
        INSERT INTO public.money_batches (
            organization_id, created_by, name, quantity, profit_percent,
            setup_total, per_saree_total, total_money_needed, cost_per_saree, estimated_selling_price
        ) VALUES (
            v_org_id, v_user_id, v_clean_name, p_quantity, p_profit_percent,
            v_setup_total, v_per_saree_total, v_total_money, v_cost_per_saree, v_selling_price
        )
        RETURNING * INTO v_batch_out;
        v_batch_id := v_batch_out.id;
    ELSE
        SELECT *
        INTO v_existing
        FROM public.money_batches
        WHERE id = p_batch_id
        FOR UPDATE;

        IF NOT FOUND OR v_existing.organization_id <> v_org_id THEN
            RAISE EXCEPTION 'Batch not found or belongs to another organization.' USING ERRCODE = 'P0002';
        END IF;

        IF p_expected_updated_at IS NOT NULL
           AND date_trunc('milliseconds', v_existing.updated_at) <> date_trunc('milliseconds', p_expected_updated_at) THEN
            RAISE EXCEPTION 'CONFLICT: This batch has been updated elsewhere. Refresh it before saving your changes.' USING ERRCODE = '40001';
        END IF;

        UPDATE public.money_batches
        SET name = v_clean_name,
            quantity = p_quantity,
            profit_percent = p_profit_percent,
            setup_total = v_setup_total,
            per_saree_total = v_per_saree_total,
            total_money_needed = v_total_money,
            cost_per_saree = v_cost_per_saree,
            estimated_selling_price = v_selling_price,
            updated_at = NOW()
        WHERE id = p_batch_id
          AND organization_id = v_org_id
        RETURNING * INTO v_batch_out;

        v_batch_id := v_batch_out.id;

        DELETE FROM public.money_batch_lines
        WHERE batch_id = v_batch_id
          AND organization_id = v_org_id;
    END IF;

    -- Persist lines in exact order
    FOR v_line IN SELECT value FROM jsonb_array_elements(p_lines) LOOP
        INSERT INTO public.money_batch_lines (
            batch_id, organization_id, name, kind, amount, sort_order
        ) VALUES (
            v_batch_id,
            v_org_id,
            btrim(v_line->>'name'),
            v_line->>'kind',
            ROUND((v_line->>'amount')::NUMERIC, 2),
            v_line_idx
        );
        v_line_idx := v_line_idx + 1;
    END LOOP;

    SELECT COALESCE(jsonb_agg(row_to_json(l) ORDER BY l.kind, l.sort_order), '[]'::jsonb)
    INTO v_lines_out
    FROM (
        SELECT id, batch_id, name, kind, amount, sort_order, created_at, updated_at
        FROM public.money_batch_lines
        WHERE batch_id = v_batch_id
          AND organization_id = v_org_id
        ORDER BY kind, sort_order
    ) l;

    RETURN jsonb_build_object(
        'batch', row_to_json(v_batch_out),
        'lines', v_lines_out
    );
END;
$$;

-- D. Delete saved batch (cascades lines safely, organization-scoped)
CREATE OR REPLACE FUNCTION public.delete_money_batch(
    p_batch_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_org_id UUID;
    v_deleted_id UUID;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Admin privileges required.' USING ERRCODE = '42501';
    END IF;

    v_org_id := public.current_admin_org_id();
    IF v_org_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: No organization context assigned.' USING ERRCODE = '42501';
    END IF;

    DELETE FROM public.money_batches
    WHERE id = p_batch_id
      AND organization_id = v_org_id
    RETURNING id INTO v_deleted_id;

    IF v_deleted_id IS NULL THEN
        RAISE EXCEPTION 'Batch not found or belongs to another organization.' USING ERRCODE = 'P0002';
    END IF;

    RETURN jsonb_build_object('success', true, 'id', v_deleted_id);
END;
$$;

REVOKE ALL ON FUNCTION public.list_money_batches(TEXT, INT, INT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_money_batch(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.save_money_batch_atomic(UUID, TEXT, INT, NUMERIC, JSONB, TIMESTAMPTZ) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.delete_money_batch(UUID) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.list_money_batches(TEXT, INT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_money_batch(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_money_batch_atomic(UUID, TEXT, INT, NUMERIC, JSONB, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_money_batch(UUID) TO authenticated;

