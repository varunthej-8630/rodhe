const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://emtmzrjaygcrmzoatvfa.supabase.co';
const supabaseKey = 'sb_publishable_X2b_yYa8Oo7KJl23ZlWYGA_tgsn_Mng';

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncProducts() {
  console.log('--- Checking Supabase tables ---');
  const { data: testData, error: testErr } = await supabase.from('products').select('count').limit(1);

  if (testErr) {
    console.error('❌ Table "products" does not exist yet in Supabase:', testErr.message);
    console.log('\n👉 ACTION NEEDED:');
    console.log('1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/emtmzrjaygcrmzoatvfa/sql/new');
    console.log('2. Paste the contents of "supabase/migrations/20261024_initial_schema.sql"');
    console.log('3. Click the green "Run" button to create the tables!');
    console.log('4. Then re-run: node scratch/sync_products_to_supabase.cjs\n');
    return;
  }

  console.log('✅ Table "products" exists! Syncing products from src/data/products.js...');
  
  // Read products from products.js
  const productsFile = fs.readFileSync(path.resolve(__dirname, '../src/data/products.js'), 'utf-8');
  const jsonMatch = productsFile.match(/export const PRODUCTS = (\[[\s\S]*?\]);\n\nexport const CRAFT_CATEGORIES/);
  
  if (!jsonMatch) {
    console.error('Could not parse products.js');
    return;
  }

  const products = JSON.parse(jsonMatch[1]);
  console.log(`Found ${products.length} products to sync.`);

  let insertedCount = 0;
  for (const p of products) {
    const row = {
      slug: p.id,
      sku: p.sku || `RDH-${p.id.slice(0, 4).toUpperCase()}`,
      name: p.name,
      tagline: p.tagline || '',
      description: p.description || '',
      craft_story: p.craftStory || '',
      craft: p.craft || 'Handloom',
      craft_category: p.craftCategory || 'handblock',
      fabric: p.fabric || '100% Cotton',
      fabric_type: p.fabricType || 'mulmul',
      color: p.color || 'Indigo',
      color_family: p.colorFamily || 'indigo',
      color_hex: p.colorHex || '#26425A',
      selling_price: p.price,
      original_price: p.originalPrice || null,
      dimensions: p.dimensions || '',
      blouse_piece: p.blousePiece || '',
      wash_care: p.washCare || '',
      badge: p.badge || null,
      stock_count: p.stockCount || 10,
      in_stock: p.inStock !== false,
      is_featured: Boolean(p.featured),
      is_bestseller: Boolean(p.isBestseller),
      is_most_coveted: Boolean(p.isMostCoveted),
      is_new_arrival: Boolean(p.isNew),
      status: 'published'
    };

    const { error: insErr } = await supabase.from('products').upsert(row, { onConflict: 'slug' });
    if (insErr) {
      console.warn(`Error inserting ${p.name}:`, insErr.message);
    } else {
      insertedCount++;
    }
  }

  console.log(`\n🎉 Successfully synced ${insertedCount}/${products.length} sarees into your Supabase database!`);
}

syncProducts();
