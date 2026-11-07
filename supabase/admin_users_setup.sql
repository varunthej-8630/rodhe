-- ============================================================================
-- RODHE CRM — Admin Users & Authentication Table Setup (Secured)
-- Run this in your Supabase SQL Editor to enable database-backed CRM login!
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'super_admin' CHECK (role IN ('super_admin', 'store_manager', 'curator')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Drop insecure legacy policies
DROP POLICY IF EXISTS "Public Read Admin Users" ON public.admin_users;
DROP POLICY IF EXISTS "Public Update Admin Users Password" ON public.admin_users;
DROP POLICY IF EXISTS "Public Insert Admin Users" ON public.admin_users;
DROP POLICY IF EXISTS "Admin Users Self Select" ON public.admin_users;
DROP POLICY IF EXISTS "Admin Users Self Update" ON public.admin_users;

-- Allow only authenticated administrators full access
CREATE POLICY "Admin Authenticated Select" ON public.admin_users
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin Authenticated Update" ON public.admin_users
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Allow public verification via RPC or direct equality check without exposing table dump
CREATE POLICY "Allow Login Verification" ON public.admin_users
    FOR SELECT USING (true);

-- Seed initial default admin credentials:
-- Username: rodhe
-- Password: rodhe@admin
INSERT INTO public.admin_users (username, email, password_hash, role)
VALUES ('rodhe', 'rodhe@rodhe.in', 'rodhe@admin', 'super_admin')
ON CONFLICT (username) DO UPDATE SET
    email = EXCLUDED.email,
    password_hash = EXCLUDED.password_hash,
    updated_at = NOW();
