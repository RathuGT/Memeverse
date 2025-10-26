// Create add-test-user.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function addTestUser() {
  try {
    // First, create the user in Supabase Auth
    console.log('Creating user in Supabase Auth...');
    
    // Note: You'll need the service role key for this
    // For now, let's just add to your custom table
    
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          username: 'testuser',
          password_hash: 'testpass123', // We'll use plain text for now
          email: 'test@example.com',
          role: 'user'
        }
      ])
      .select();

    if (error) {
      console.error('❌ Error adding user:', error);
      return;
    }

    console.log('✅ Test user added to users table:', data);
  } catch (err) {
    console.error('❌ Failed to add test user:', err.message);
  }
}

addTestUser();