const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://emtmzrjaygcrmzoatvfa.supabase.co';
const supabaseKey = 'sb_publishable_X2b_yYa8Oo7KJl23ZlWYGA_tgsn_Mng';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log('--- 1. Testing Auth endpoint ---');
  const { data: authData, error: authErr } = await supabase.auth.getSession();
  console.log('Auth getSession:', { authData, authErr });

  console.log('--- 2. Testing Rest endpoint (products) ---');
  const res = await fetch(`${supabaseUrl}/rest/v1/`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    }
  });
  console.log('REST root status:', res.status, res.statusText);
  const text = await res.text();
  console.log('REST root response (first 200 chars):', text.slice(0, 200));

  console.log('--- 3. Testing products table query ---');
  const { data, error } = await supabase.from('products').select('*');
  console.log('Products query error:', error);
  console.log('Products query data:', data);
}

check();
