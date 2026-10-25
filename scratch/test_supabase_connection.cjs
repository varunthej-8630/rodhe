const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://emtmzrjaygcrmzoatvfa.supabase.co';
const supabaseKey = 'sb_publishable_X2b_yYa8Oo7KJl23ZlWYGA_tgsn_Mng';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('Testing connection to Supabase:', supabaseUrl);
  try {
    // Try querying products or public schema
    const { data, error } = await supabase.from('products').select('*').limit(5);
    if (error) {
      console.log('Query result: Table "products" returned error/notice:', error.message);
    } else {
      console.log('Query success! Products found:', data ? data.length : 0);
    }

    // Try checking settings
    const { data: stg, error: stgErr } = await supabase.from('store_settings').select('*').limit(1);
    if (stgErr) {
      console.log('Query result: Table "store_settings" error:', stgErr.message);
    } else {
      console.log('Query success! store_settings found:', stg ? stg.length : 0);
    }
  } catch (err) {
    console.error('Connection test error:', err);
  }
}

testConnection();
