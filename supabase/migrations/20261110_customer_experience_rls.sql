-- ============================================================================
-- RODHE — Woven with Trust
-- Migration: 20261110_customer_experience_rls.sql
-- Purpose: Prepared schema enhancements for Customer Profiles, Multiple Saved
--          Delivery Addresses, Persistent Wishlists, and Shopping Carts with
--          strict per-user Row Level Security (RLS).
-- NOTE: Do NOT apply without owner approval. Review alongside
--       20261108_final_commerce_production.sql in the Supabase SQL Editor.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Customer Profiles (linked strictly to auth.users.id)
CREATE TABLE IF NOT EXISTS public.customer_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Customer Saved Delivery Addresses
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

-- 3. Authenticated Customer Wishlists
CREATE TABLE IF NOT EXISTS public.customer_wishlists (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, product_id)
);

-- 4. Authenticated Customer Shopping Bags
CREATE TABLE IF NOT EXISTS public.customer_carts (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, product_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_customer_profiles_user_id ON public.customer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_profile_id ON public.customer_addresses(profile_id);

-- Strict Row Level Security (Zero cross-customer PII access)
ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_carts ENABLE ROW LEVEL SECURITY;

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

DROP POLICY IF EXISTS "Wishlists Customer Manage Own" ON public.customer_wishlists;
CREATE POLICY "Wishlists Customer Manage Own" ON public.customer_wishlists
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Carts Customer Manage Own" ON public.customer_carts;
CREATE POLICY "Carts Customer Manage Own" ON public.customer_carts
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

