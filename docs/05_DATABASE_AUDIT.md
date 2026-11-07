# 05. DATABASE AUDIT & SCHEMA EVOLUTION — RODHE
## PostgreSQL Relational Schema, Foreign Keys & Migration Architecture

---

## 1. Schema Inventory: Documented vs Actual State

The documentation refers interchangeably to "10 relational tables" and "11 named tables". Inspection of [`supabase/migrations/20261024_initial_schema.sql`](file:///c:/Users/VARUN%20THEJ/OneDrive/Desktop/Rodhe/supabase/migrations/20261024_initial_schema.sql) and [`supabase/admin_users_setup.sql`](file:///c:/Users/VARUN%20THEJ/OneDrive/Desktop/Rodhe/supabase/admin_users_setup.sql) confirms exactly **11 tables** across the two SQL files:

| # | Table Name | Declared Migration File | Primary Key | Foreign Key Dependencies | RLS Enabled |
|---|---|---|---|---|---|
| 1 | `store_settings` | `20261024_initial_schema.sql` | `id` (UUID) | None | Yes |
| 2 | `collections` | `20261024_initial_schema.sql` | `id` (UUID) | None | Yes |
| 3 | `products` | `20261024_initial_schema.sql` | `id` (UUID) | None | Yes |
| 4 | `product_images` | `20261024_initial_schema.sql` | `id` (UUID) | `product_id` $\rightarrow$ `products(id)` ON DELETE CASCADE | Yes |
| 5 | `product_collections` | `20261024_initial_schema.sql` | Composite (`product_id`, `collection_id`) | `products(id)` & `collections(id)` | Yes |
| 6 | `promotions` | `20261024_initial_schema.sql` | `id` (UUID) | None | Yes |
| 7 | `homepage_config` | `20261024_initial_schema.sql` | `id` (UUID) | None | Yes |
| 8 | `testimonials` | `20261024_initial_schema.sql` | `id` (UUID) | None | Yes |
| 9 | `community_signups` | `20261024_initial_schema.sql` | `id` (UUID) | None | Yes |
| 10 | `enquiries` | `20261024_initial_schema.sql` | `id` (UUID) | None | Yes |
| 11 | `admin_users` | `admin_users_setup.sql` | `id` (UUID) | None | Yes |

---

## 2. Critical Database Omission: The Transactional Commerce Void

Despite the presence of rich catalog tables, **all fundamental e-commerce transactional tables are completely missing from the PostgreSQL schema:**

```
MISSING ESSENTIAL TABLES:
├── public.orders               [CRITICAL - NO ORDER RECORDS EXIST]
├── public.order_items           [CRITICAL - NO LINE ITEMS SAVED]
├── public.customer_profiles     [CRITICAL - NO CUSTOMER ACCOUNTS]
├── public.customer_addresses    [CRITICAL - NO SAVED ADDRESSES]
├── public.payments              [CRITICAL - NO PAYMENT AUDIT TRAIL]
├── public.shipments             [HIGH - NO TRACKING NUMBERS/AWB]
└── public.inventory_movements   [HIGH - NO STOCK AUDIT LOG]
```

---

## 3. Recommended Schema Migration DDL

To elevate RODHE into a legitimate commerce platform, the following minimal relational schema must be added to Supabase:

```sql
-- ============================================================================
-- MIGRATION: 20261108_commerce_core.sql
-- Adds Order, Payment, Shipment, and Customer Address Infrastructure
-- ============================================================================

-- 1. Customer Profiles (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.customer_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Customer Delivery Addresses
CREATE TABLE IF NOT EXISTS public.customer_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    landmark TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    pincode VARCHAR(6) NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Core Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT UNIQUE NOT NULL, -- e.g., 'RDH-2026-10023'
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    shipping_address JSONB NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
    discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    shipping_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    gift_wrap_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    grand_total NUMERIC(10, 2) NOT NULL CHECK (grand_total >= 0),
    applied_coupon TEXT,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('upi', 'card', 'netbanking', 'cod', 'whatsapp')),
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'authorized', 'captured', 'failed', 'refunded')),
    fulfillment_status TEXT NOT NULL DEFAULT 'unfulfilled' CHECK (fulfillment_status IN ('unfulfilled', 'processing', 'shipped', 'delivered', 'cancelled', 'returned')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Order Line Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    sku TEXT NOT NULL,
    name TEXT NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
    quantity INT NOT NULL CHECK (quantity > 0),
    subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
    primary_image TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Payment Transaction Records
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    gateway TEXT NOT NULL DEFAULT 'razorpay', -- 'razorpay', 'cod', 'manual'
    gateway_order_id TEXT,
    gateway_payment_id TEXT,
    gateway_signature TEXT,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
    currency TEXT NOT NULL DEFAULT 'INR',
    status TEXT NOT NULL DEFAULT 'pending',
    raw_response JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Atomic Inventory Movement Ledger
CREATE TABLE IF NOT EXISTS public.inventory_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    delta INT NOT NULL, -- negative for sales, positive for restocks
    reason TEXT NOT NULL, -- 'order_placed', 'order_cancelled', 'manual_adjustment'
    reference_id UUID, -- order_id if applicable
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON public.orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(fulfillment_status, payment_status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
```

