const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkUsers() {
  try {
    console.log('Checking all users in custom table...');
    const { data, error } = await supabase.from('users').select('*');
    
    if (error) {
      console.error('❌ Error:', error);
      return;
    }
    
    console.log('✅ Users found:', data.length);
    console.log('Users data:', JSON.stringify(data, null, 2));
    
    // Also check Supabase Auth users
    console.log('\nChecking Supabase Auth users...');
    // Note: This requires service role key, which we don't have access to from client
    console.log('(Cannot check auth users with anon key - check dashboard manually)');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

checkUsers();