const fs = require('fs');
const path = require('path');

const productsFile = fs.readFileSync(path.resolve(__dirname, '../src/data/products.js'), 'utf-8');
const jsonMatch = productsFile.match(/export const PRODUCTS = (\[[\s\S]*?\]);\n\nexport const CRAFT_CATEGORIES/);

if (!jsonMatch) {
  console.error('Failed to parse products.js');
  process.exit(1);
}

const products = JSON.parse(jsonMatch[1]);

let sql = `-- ============================================================================
-- RODHE — Seed 50 Handcrafted Cotton Sarees (₹500 – ₹2,000)
-- Run this in your Supabase SQL Editor to populate all 50 sarees!
-- ============================================================================

INSERT INTO public.products (
  slug, sku, name, tagline, description, craft_story,
  craft, craft_category, fabric, fabric_type,
  color, color_family, color_hex,
  selling_price, original_price,
  dimensions, blouse_piece, wash_care,
  stock_count, in_stock, is_featured, is_bestseller, is_most_coveted, is_new_arrival, status
) VALUES\n`;

const escapeSql = (str) => (str ? str.replace(/'/g, "''") : '');

const values = products.map((p, idx) => {
  return `  (
    '${escapeSql(p.id)}',
    '${escapeSql(p.sku || `RDH-${String(idx + 1).padStart(3, '0')}`)}',
    '${escapeSql(p.name)}',
    '${escapeSql(p.tagline || '')}',
    '${escapeSql(p.description || '')}',
    '${escapeSql(p.craftStory || '')}',
    '${escapeSql(p.craft || 'Handloom')}',
    '${escapeSql(p.craftCategory || 'handblock')}',
    '${escapeSql(p.fabric || '100% Breathable Mulmul Cotton')}',
    '${escapeSql(p.fabricType || 'mulmul')}',
    '${escapeSql(p.color || 'Indigo')}',
    '${escapeSql(p.colorFamily || 'indigo')}',
    '${escapeSql(p.colorHex || '#26425A')}',
    ${p.price},
    NULL,
    '${escapeSql(p.dimensions || '')}',
    '${escapeSql(p.blousePiece || '')}',
    '${escapeSql(p.washCare || '')}',
    ${p.stockCount || 10},
    TRUE,
    ${Boolean(p.featured)},
    ${Boolean(p.isBestseller)},
    ${Boolean(p.isMostCoveted)},
    ${Boolean(p.isNew)},
    'published'
  )`;
}).join(',\n');

sql += values + `\nON CONFLICT (slug) DO UPDATE SET
  selling_price = EXCLUDED.selling_price,
  original_price = NULL,
  name = EXCLUDED.name,
  fabric = EXCLUDED.fabric,
  craft = EXCLUDED.craft;\n\n`;

// Insert product images
sql += `-- Insert Product Images\n`;
sql += `INSERT INTO public.product_images (product_id, image_url, alt_text, is_primary, is_secondary)
SELECT p.id, '${products[0].primaryImage}', p.name, TRUE, FALSE
FROM public.products p
ON CONFLICT DO NOTHING;\n`;

const outPath = path.resolve(__dirname, '../supabase/insert_50_products.sql');
fs.writeFileSync(outPath, sql, 'utf-8');
console.log('Successfully created SQL file at', outPath);
