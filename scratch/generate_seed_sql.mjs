import { PRODUCTS } from '../src/data/products.js';
import fs from 'fs';

const lines = [
  '-- ============================================================================',
  '-- SEED ALL 50 RODHE HANDCRAFTED SAREES INTO SUPABASE POSTGRESQL',
  '-- Migration: 20261117_seed_all_50_sarees.sql',
  '-- Run this in Supabase SQL Editor to make Supabase the authoritative database',
  '-- ============================================================================',
  '',
  '-- 1. Ensure required columns exist on public.products',
  'ALTER TABLE public.products ADD COLUMN IF NOT EXISTS primary_image TEXT;',
  'ALTER TABLE public.products ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;',
  '',
  '-- 2. Ensure status constraint supports all lifecycle states',
  'ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_status_check;',
  'ALTER TABLE public.products ADD CONSTRAINT products_status_check',
  "    CHECK (status IN ('draft', 'published', 'archived'));",
  '',
  '-- 3. Ensure Row Level Security allows public read of published products',
  'ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;',
  'DROP POLICY IF EXISTS "Public Read Published Products" ON public.products;',
  'CREATE POLICY "Public Read Published Products" ON public.products',
  '    FOR SELECT',
  "    USING (status = 'published');",
  '',
  'DROP POLICY IF EXISTS "Admin Full Access Products" ON public.products;',
  'CREATE POLICY "Admin Full Access Products" ON public.products',
  '    FOR ALL TO authenticated',
  '    USING (public.is_admin())',
  '    WITH CHECK (public.is_admin());',
  '',
  '-- 4. Insert or update all 50 sarees',
  'INSERT INTO public.products (',
  '    slug, sku, name, tagline, description, craft_story,',
  '    craft, craft_category, fabric, fabric_type,',
  '    color, color_family, color_hex,',
  '    selling_price, original_price, dimensions, blouse_piece, wash_care,',
  '    stock_count, in_stock, is_featured, is_bestseller, is_most_coveted, is_new_arrival, status, primary_image',
  ') VALUES'
];

const valueRows = PRODUCTS.map((p, idx) => {
  const esc = (s) => (s ? "'" + String(s).replace(/'/g, "''") + "'" : "''");
  const slug = esc(p.id);
  const sku = esc(p.sku || 'RDH-' + String(idx + 1).padStart(3, '0'));
  const name = esc(p.name);
  const tagline = esc(p.tagline || '');
  const description = esc(p.description || '');
  const craft_story = esc(p.craftStory || '');
  const craft = esc(p.craft || 'Handloom');
  const craft_category = esc(p.craftCategory || 'mulmul');
  const fabric = esc(p.fabric || '100% Cotton');
  const fabric_type = esc(p.fabricType || 'mulmul');
  const color = esc(p.color || 'Indigo');
  const color_family = esc(p.colorFamily || 'indigo');
  const color_hex = esc(p.colorHex || '#26425A');
  const selling_price = Number(p.price || 1200);
  const original_price = p.originalPrice ? Number(p.originalPrice) : 'NULL';
  const dimensions = esc(p.dimensions || 'Length: 6.5 meters (including 80 cm blouse piece) • Width: 45 inches');
  const blouse_piece = esc(p.blousePiece || 'Included — Running matching fabric with woven border');
  const wash_care = esc(p.washCare || 'Gentle cold hand wash with mild eco-friendly liquid detergent.');
  const stock_count = Number(p.stockCount ?? 8);
  const in_stock = p.inStock !== false ? 'TRUE' : 'FALSE';
  const is_featured = Boolean(p.featured) ? 'TRUE' : 'FALSE';
  const is_bestseller = Boolean(p.isBestseller) ? 'TRUE' : 'FALSE';
  const is_most_coveted = (idx % 4 === 0) ? 'TRUE' : 'FALSE';
  const is_new_arrival = Boolean(p.isNew) ? 'TRUE' : 'FALSE';
  const status = "'published'";
  const primary_image = esc(p.primaryImage || '/assets/products/saree_indigo_shibori.jpg');

  return `  (${slug}, ${sku}, ${name}, ${tagline}, ${description}, ${craft_story}, ${craft}, ${craft_category}, ${fabric}, ${fabric_type}, ${color}, ${color_family}, ${color_hex}, ${selling_price}, ${original_price}, ${dimensions}, ${blouse_piece}, ${wash_care}, ${stock_count}, ${in_stock}, ${is_featured}, ${is_bestseller}, ${is_most_coveted}, ${is_new_arrival}, ${status}, ${primary_image})`;
});

lines.push(valueRows.join(',\n') + '\nON CONFLICT (slug) DO UPDATE SET\n  selling_price = EXCLUDED.selling_price,\n  original_price = EXCLUDED.original_price,\n  stock_count = EXCLUDED.stock_count,\n  in_stock = EXCLUDED.in_stock,\n  status = EXCLUDED.status,\n  primary_image = EXCLUDED.primary_image,\n  updated_at = NOW();');

lines.push('');
lines.push('-- 5. Also populate product_images gallery records for fast joins');
lines.push('INSERT INTO public.product_images (product_id, image_url, is_primary, alt_text, display_order)');
lines.push('SELECT p.id, p.primary_image, TRUE, p.name, 0');
lines.push('FROM public.products p');
lines.push("WHERE p.primary_image IS NOT NULL AND p.primary_image <> ''");
lines.push('ON CONFLICT DO NOTHING;');

fs.writeFileSync('supabase/migrations/20261117_seed_all_50_sarees.sql', lines.join('\n'), 'utf8');
console.log('Successfully generated supabase/migrations/20261117_seed_all_50_sarees.sql with 50 sarees!');
