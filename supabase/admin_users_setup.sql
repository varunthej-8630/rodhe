-- ============================================================================
-- RODHE CRM — Admin Users & Authentication Table Setup
-- Run this in your Supabase SQL Editor to enable database-backed CRM login!
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'super_admin',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Public Read Admin Users" ON public.admin_users;
DROP POLICY IF EXISTS "Public Update Admin Users Password" ON public.admin_users;
DROP POLICY IF EXISTS "Public Insert Admin Users" ON public.admin_users;

-- Allow read for CRM verification
CREATE POLICY "Public Read Admin Users" ON public.admin_users
    FOR SELECT USING (true);

-- Allow password update on reset
CREATE POLICY "Public Update Admin Users Password" ON public.admin_users
    FOR UPDATE USING (true) WITH CHECK (true);

-- Allow insert
CREATE POLICY "Public Insert Admin Users" ON public.admin_users
    FOR INSERT WITH CHECK (true);

-- Seed initial default admin credentials:
-- Username: rodhe
-- Password: rodhe@admin
INSERT INTO public.admin_users (username, email, password_hash, role)
VALUES ('rodhe', 'rodhe@rodhe.in', 'rodhe@admin', 'super_admin')
ON CONFLICT (username) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    updated_at = NOW();
