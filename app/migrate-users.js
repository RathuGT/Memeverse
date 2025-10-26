const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://iiikiukseaoqyymogsxk.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpaWtpdWtzZWFvcXl5bW9nc3hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxNTUyNjksImV4cCI6MjA2OTczMTI2OX0.IPj_5uI3q9FxVM6yUD0DgZxygaczOGQ-atvT_YrIfRc'; // Use service role key, not anon key

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function migrateUsers() {
  try {
    // Fetch all users from your custom users table
    const { data: customUsers, error: fetchError } = await supabase
      .from('users')
      .select('*');

    if (fetchError) {
      console.error('Error fetching users:', fetchError);
      return;
    }

    console.log(`Found ${customUsers.length} users to migrate`);

    // Create each user in Supabase Auth
    for (const user of customUsers) {
      try {
        const { data, error } = await supabase.auth.admin.createUser({
          email: user.email,
          password: user.password_hash, // Use the plain text password here
          email_confirm: true, // Auto-confirm email
          user_metadata: {
            username: user.username,
            role: user.role
          }
        });

        if (error) {
          console.error(`Error creating user ${user.email}:`, error.message);
        } else {
          console.log(`Successfully migrated user: ${user.email}`);
        }
      } catch (userError) {
        console.error(`Error with user ${user.email}:`, userError.message);
      }
    }

    console.log('Migration complete!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

migrateUsers();