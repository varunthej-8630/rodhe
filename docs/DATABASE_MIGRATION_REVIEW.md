# RODHE — Database Schema & Migration Verification Review

**Document Reference**: `docs/DATABASE_MIGRATION_REVIEW.md`  
**Evaluation Date**: November 8, 2026  
**Auditor**: Database Architect & Supabase PostgreSQL Specialist  
**Target Migration**: `supabase/migrations/20261108_commerce_core.sql`  
**Baseline Migrations**: `supabase/migrations/20261024_initial_schema.sql`, `supabase/admin_users_setup.sql`

---

## 1. Migration Deployment Verdict

### **VERDICT: NOT SAFE TO DEPLOY WITHOUT REVISION**

While the DDL syntax for table creation and indexes is valid and non-destructive (`CREATE TABLE IF NOT EXISTS`), **the migration cannot be safely applied to a live database in its current state** due to:
1. **Non-Idempotent Policy Declarations**: Re-running the script will abort with PostgreSQL `duplicate_object` errors because policies do not have `DROP POLICY IF EXISTS` guards.
2. **Critical Security Hole**: Policy `"Public Read Own Order"` uses `USING (true)`, which opens the entire `orders` table to public scraping over the anonymous REST API.
3. **Broken CRM Permissions**: No `UPDATE` policy exists for the unauthenticated client role (`anon`), causing administrative order status updates from the CRM to fail silently.
4. **Missing Atomicity**: There are no database triggers or stored procedures (RPC) to atomically deduct inventory or record stock movements during order creation.

---

## 2. Table-by-Table Technical Inspection

### 2.1 Table: `public.customer_profiles`
- **Definition**: Lines 13–21
- **Columns**: `id` (UUID PK), `user_id` (UUID references `auth.users(id)` ON DELETE CASCADE), `email` (TEXT UNIQUE NOT NULL), `full_name` (TEXT), `phone` (TEXT), `created_at`, `updated_at`.
- **Foreign Keys**: Correctly references Supabase Auth `auth.users(id)`.
- **Constraint Defect**: `email TEXT UNIQUE NOT NULL` causes an insert failure if guest checkout submits an existing email address without an explicit `ON CONFLICT (email) DO UPDATE` clause.

### 2.2 Table: `public.customer_addresses`
- **Definition**: Lines 26–39
- **Columns**: `id` (UUID PK), `profile_id` (UUID references `public.customer_profiles(id)` ON DELETE CASCADE), `recipient_name`, `phone`, `address_line1`, `address_line2`, `landmark`, `city`, `state`, `pincode VARCHAR(6)`, `is_default`, `created_at`.
- **Evaluation**: Well-formed schema. Pincode constraint `VARCHAR(6)` correctly models the 6-digit Indian Postal Index Number.

### 2.3 Table: `public.orders`
- **Definition**: Lines 44–65
- **Columns**:
  - `id` (UUID PRIMARY KEY DEFAULT uuid_generate_v4())
  - `order_number` (TEXT UNIQUE NOT NULL)
  - `customer_name`, `customer_email`, `customer_phone` (TEXT NOT NULL)
  - `shipping_address` (JSONB NOT NULL)
  - `subtotal`, `discount_amount`, `shipping_fee`, `gift_wrap_fee`, `grand_total` (NUMERIC(10, 2) NOT NULL CHECK >= 0)
  - `payment_method` (TEXT NOT NULL CHECK IN (`'upi'`, `'card'`, `'netbanking'`, `'cod'`, `'whatsapp'`))
  - `payment_status` (TEXT NOT NULL CHECK IN (`'pending'`, `'pending_cod'`, `'authorized'`, `'captured'`, `'failed'`, `'refunded'`))
  - `fulfillment_status` (TEXT NOT NULL CHECK IN (`'unfulfilled'`, `'processing'`, `'shipped'`, `'delivered'`, `'cancelled'`, `'returned'`))
  - `tracking_number`, `courier_partner`, `notes` (TEXT)
  - `created_at`, `updated_at` (TIMESTAMPTZ)
- **Evaluation**: Comprehensive columns and accurate check constraints for Indian slow-luxury e-commerce.

### 2.4 Table: `public.order_items`
- **Definition**: Lines 70–81
- **Columns**: `id` (UUID PK), `order_id` (UUID NOT NULL REFERENCES `public.orders(id)` ON DELETE CASCADE), `product_id` (TEXT), `sku` (TEXT NOT NULL), `name` (TEXT NOT NULL), `unit_price`, `quantity` (INT CHECK > 0), `subtotal`, `primary_image`, `created_at`.
- **Foreign Key Evaluation**:
  - `product_id` is typed as `TEXT` rather than `UUID REFERENCES public.products(id)`.
  - **Reason**: The initial schema `20261024_initial_schema.sql` defined `products.id` as `UUID`, but static seeds and frontend items often use slugs or string IDs (e.g. `rodhe-saree-1`). Typing as `TEXT` prevents foreign key type mismatch exceptions, but loses relational integrity if a product is deleted.

### 2.5 Table: `public.payments`
- **Definition**: Lines 86–98
- **Columns**: `id` (UUID PK), `order_id` (UUID REFERENCES `public.orders(id)`), `gateway` (CHECK IN (`'razorpay'`, `'cashfree'`, `'payu'`, `'stripe'`, `'cod'`, `'manual'`)), `gateway_order_id`, `gateway_payment_id`, `gateway_signature`, `amount`, `currency` (DEFAULT `'INR'`), `status`, `raw_response` (JSONB).
- **Evaluation**: Schema is structured correctly for payment webhooks and signature reconciliation, but no backend service currently inserts into this table.

### 2.6 Table: `public.inventory_movements`
- **Definition**: Lines 103–111
- **Columns**: `id` (UUID PK), `product_id` (TEXT NOT NULL), `delta` (INT NOT NULL), `reason` (CHECK IN (`'order_placed'`, `'order_cancelled'`, `'manual_adjustment'`, `'restock'`)), `reference_order_id`, `notes`.
- **Evaluation**: Excellent audit ledger design, but currently dead schema: no code in `storeService.js` or database trigger populates it.

---

## 3. Row Level Security (RLS) Policy Analysis

| Table | Policy Name | Command | Role | Expression | Security Assessment |
|---|---|---|---|---|---|
| `orders` | `Public Create Orders` | `INSERT` | `public` | `WITH CHECK (true)` | **Acceptable**: Allows guest checkout order creation. |
| `order_items` | `Public Create Order Items` | `INSERT` | `public` | `WITH CHECK (true)` | **Acceptable**: Allows guest line items creation. |
| `payments` | `Public Create Payments` | `INSERT` | `public` | `WITH CHECK (true)` | **Acceptable**: Allows transaction recording. |
| `orders` | `Public Read Own Order` | `SELECT` | `public` | `USING (true)` | **CRITICAL DEFECT**: Allows anyone with publishable key to read all customer orders and PII. |
| `order_items` | `Public Read Own Order Items` | `SELECT` | `public` | `USING (true)` | **CRITICAL DEFECT**: Allows public scraping of all purchase histories. |
| `orders` | `Admin Full Access Orders` | `ALL` | `authenticated` | `USING (true) WITH CHECK (true)` | **FAILED**: CRM uses `anon` role; cannot update orders! |

---

## 4. Idempotency & Safety Analysis

When applying database migrations in production CI/CD pipelines, scripts must be safe to execute multiple times without erroring or destroying data.

### Failures Identified in `20261108_commerce_core.sql`:
1. **Policy Re-creation Errors**:
   ```sql
   -- Current code:
   CREATE POLICY "Public Create Orders" ON public.orders FOR INSERT WITH CHECK (true);
   ```
   If this script is run on a database where the policy already exists, PostgreSQL throws:
   ```
   ERROR: policy "Public Create Orders" for table "orders" already exists
   ```
2. **Missing Down-Migration / Idempotent Wrapper**:
   Every policy definition must be preceded by `DROP POLICY IF EXISTS ... ON ...`.

---

## 5. Order Numbering & Atomicity Review

### Order Number Generation:
- In `storeService.js:803`:
  ```javascript
  const orderNumber = `RDH-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
  ```
- **Defects**:
  - `Math.random()` pseudo-random numbers offer only $9 \times 10^5$ combinations per year.
  - Client-side generation creates collision risks under concurrent ordering.
  - **PostgreSQL Best Practice**: Use a database sequence:
    ```sql
    CREATE SEQUENCE IF NOT EXISTS rodhe_order_seq START WITH 100001;
    -- In trigger or default:
    'RDH-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || NEXTVAL('rodhe_order_seq')
    ```

### Inventory Deduction Atomicity:
- **Current State**:
  - Storefront updates `localStorage`.
  - Supabase `products.stock_count` is **never decremented**.
  - No database transaction wraps order creation and inventory reduction.
- **Required Database Stored Procedure (RPC)**:
  An atomic function must be added to the migration:
  ```sql
  CREATE OR REPLACE FUNCTION public.create_order_atomic(
      p_order JSONB,
      p_items JSONB
  ) RETURNS JSONB
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $$
  DECLARE
      v_order_id UUID;
      v_item JSONB;
      v_curr_stock INT;
  BEGIN
      -- 1. Check & lock inventory for each item
      FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
          SELECT stock_count INTO v_curr_stock
          FROM public.products
          WHERE id::text = (v_item->>'product_id') OR sku = (v_item->>'sku')
          FOR UPDATE;

          IF v_curr_stock IS NULL OR v_curr_stock < (v_item->>'quantity')::int THEN
              RAISE EXCEPTION 'Insufficient stock for SKU %', (v_item->>'sku');
          END IF;
      END LOOP;

      -- 2. Insert master order
      INSERT INTO public.orders (
          order_number, customer_name, customer_email, customer_phone,
          shipping_address, subtotal, discount_amount, shipping_fee,
          grand_total, payment_method, payment_status
      ) VALUES (
          'RDH-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('rodhe_order_seq')::text, 6, '0'),
          p_order->>'customer_name', p_order->>'customer_email', p_order->>'customer_phone',
          p_order->'shipping_address', (p_order->>'subtotal')::numeric,
          (p_order->>'discount_amount')::numeric, (p_order->>'shipping_fee')::numeric,
          (p_order->>'grand_total')::numeric, p_order->>'payment_method', 'pending'
      ) RETURNING id INTO v_order_id;

      -- 3. Insert items and decrement stock
      FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
          INSERT INTO public.order_items (order_id, product_id, sku, name, unit_price, quantity, subtotal)
          VALUES (
              v_order_id, v_item->>'product_id', v_item->>'sku', v_item->>'name',
              (v_item->>'unit_price')::numeric, (v_item->>'quantity')::int, (v_item->>'subtotal')::numeric
          );

          UPDATE public.products
          SET stock_count = stock_count - (v_item->>'quantity')::int
          WHERE id::text = (v_item->>'product_id') OR sku = (v_item->>'sku');

          INSERT INTO public.inventory_movements (product_id, delta, reason, reference_order_id)
          VALUES (v_item->>'product_id', -((v_item->>'quantity')::int), 'order_placed', v_order_id);
      END LOOP;

      RETURN jsonb_build_object('order_id', v_order_id);
  END;
  $$;
  ```

---

## 6. Required Migration Corrections Checklist

- [ ] Wrap all `CREATE POLICY` statements with `DROP POLICY IF EXISTS`.
- [ ] Replace `CREATE POLICY "Public Read Own Order" ON public.orders FOR SELECT USING (true)` with an order-number/email verification function or authenticated admin access.
- [ ] Add `CREATE SEQUENCE IF NOT EXISTS rodhe_order_seq;` for deterministic sequential order numbering.
- [ ] Add `create_order_atomic()` RPC function for row-locked inventory deduction.
- [ ] Add RLS policy permitting authenticated admins to update order fulfillment statuses.

