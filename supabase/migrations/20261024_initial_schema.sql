-- ============================================================================
-- RODHE — Woven with Trust
-- Production PostgreSQL Relational Database Schema (Supabase)
-- Migration: 20261024_initial_schema.sql
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. STORE SETTINGS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.store_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_name TEXT NOT NULL DEFAULT 'RODHE',
    tagline TEXT NOT NULL DEFAULT 'Woven with Trust',
    whatsapp_number TEXT NOT NULL DEFAULT '+919490658858',
    contact_email TEXT NOT NULL DEFAULT 'concierge@rodhe.in',
    currency_code TEXT NOT NULL DEFAULT 'INR',
    currency_symbol TEXT NOT NULL DEFAULT '₹',
    free_shipping_threshold NUMERIC(10, 2) NOT NULL DEFAULT 2999.00,
    standard_shipping_fee NUMERIC(10, 2) NOT NULL DEFAULT 199.00,
    gift_wrap_fee NUMERIC(10, 2) NOT NULL DEFAULT 150.00,
    sarees_sold_count INT NOT NULL DEFAULT 1240,
    customer_rating NUMERIC(3, 2) NOT NULL DEFAULT 4.90,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 2. COLLECTIONS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    banner_image TEXT,
    display_order INT NOT NULL DEFAULT 0,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 3. PRODUCTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    sku TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    tagline TEXT,
    description TEXT NOT NULL,
    craft_story TEXT,
    craft TEXT NOT NULL,
    craft_category TEXT NOT NULL,
    fabric TEXT NOT NULL,
    fabric_type TEXT NOT NULL,
    color TEXT NOT NULL,
    color_family TEXT NOT NULL,
    color_hex TEXT NOT NULL,
    selling_price NUMERIC(10, 2) NOT NULL CHECK (selling_price >= 0),
    original_price NUMERIC(10, 2) CHECK (original_price IS NULL OR original_price >= selling_price),
    dimensions TEXT,
    blouse_piece TEXT,
    wash_care TEXT,
    badge TEXT,
    stock_count INT NOT NULL DEFAULT 1 CHECK (stock_count >= 0),
    in_stock BOOLEAN NOT NULL DEFAULT TRUE,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    is_bestseller BOOLEAN NOT NULL DEFAULT FALSE,
    is_most_coveted BOOLEAN NOT NULL DEFAULT FALSE,
    is_new_arrival BOOLEAN NOT NULL DEFAULT FALSE,
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 4. PRODUCT IMAGES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text TEXT,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    is_secondary BOOLEAN NOT NULL DEFAULT FALSE,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 5. PRODUCT TO COLLECTION RELATIONSHIPS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_collections (
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, collection_id)
);

-- ----------------------------------------------------------------------------
-- 6. PROMOTIONS & COUPONS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.promotions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    label TEXT NOT NULL,
    discount_type TEXT NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'flat')),
    discount_value NUMERIC(10, 2) NOT NULL CHECK (discount_value > 0),
    min_order_amount NUMERIC(10, 2) DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 7. HOMEPAGE CONFIGURATION
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.homepage_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hero_eyebrow TEXT NOT NULL DEFAULT 'WOVEN WITH TRUST',
    hero_headline TEXT NOT NULL DEFAULT 'Born from Nature. Made to Be Worn.',
    hero_subtext TEXT NOT NULL DEFAULT 'Discover gossamer sarees shaped by rain-fed cotton, botanical pigments, and the timeless touch of Indian generational artisans.',
    bestsellers_title TEXT NOT NULL DEFAULT 'Patron Bestsellers',
    bestsellers_promo TEXT NOT NULL DEFAULT 'Complimentary Handcrafted Zari Blouse Fabric on select heirloom editions.',
    most_coveted_title TEXT NOT NULL DEFAULT 'Most Coveted Masterpieces',
    most_coveted_subtext TEXT NOT NULL DEFAULT 'Rare artisanal weave runs and slow botanical indigo reserves.',
    new_arrivals_title TEXT NOT NULL DEFAULT 'Fresh from the Loom',
    is_nature_chapter_visible BOOLEAN NOT NULL DEFAULT TRUE,
    is_colour_chapter_visible BOOLEAN NOT NULL DEFAULT TRUE,
    is_craft_chapter_visible BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 8. TESTIMONIALS & TRUST REVIEWS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.testimonials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    role TEXT NOT NULL,
    review TEXT NOT NULL,
    saree_name TEXT NOT NULL,
    rating INT NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
    date_label TEXT NOT NULL DEFAULT 'October 2026',
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 9. COMMUNITY SIGNUPS (Circle of Trust)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.community_signups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    source TEXT DEFAULT 'storefront_footer',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 10. CUSTOMER ENQUIRIES & CONCIERGE REQUESTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.enquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    saree_interest TEXT,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'responded', 'completed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 11. INDEXES FOR HIGH-PERFORMANCE DISCOVERY
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_selling_price ON public.products(selling_price);
CREATE INDEX IF NOT EXISTS idx_products_color_family ON public.products(color_family);
CREATE INDEX IF NOT EXISTS idx_products_craft_category ON public.products(craft_category);
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);

-- ----------------------------------------------------------------------------
-- 12. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_signups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;

-- Public READ access for published storefront content
CREATE POLICY "Public Read Store Settings" ON public.store_settings FOR SELECT USING (true);
CREATE POLICY "Public Read Collections" ON public.collections FOR SELECT USING (is_published = true);
CREATE POLICY "Public Read Published Products" ON public.products FOR SELECT USING (status = 'published');
CREATE POLICY "Public Read Product Images" ON public.product_images FOR SELECT USING (true);
CREATE POLICY "Public Read Active Promotions" ON public.promotions FOR SELECT USING (is_active = true);
CREATE POLICY "Public Read Homepage Config" ON public.homepage_config FOR SELECT USING (true);
CREATE POLICY "Public Read Published Testimonials" ON public.testimonials FOR SELECT USING (is_published = true);

-- Public INSERT for community signups and inquiries
CREATE POLICY "Public Create Signups" ON public.community_signups FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Create Enquiries" ON public.enquiries FOR INSERT WITH CHECK (true);

-- Authenticated Admin full access
CREATE POLICY "Admin Full Access Settings" ON public.store_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Access Collections" ON public.collections FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Access Products" ON public.products FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Access Product Images" ON public.product_images FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Access Promotions" ON public.promotions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Access Homepage Config" ON public.homepage_config FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Access Testimonials" ON public.testimonials FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Access Community Signups" ON public.community_signups FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Access Enquiries" ON public.enquiries FOR ALL TO authenticated USING (true) WITH CHECK (true);
