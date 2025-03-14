// Script to create a new user in the Supabase auth system
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create Supabase admin client with service role key
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function createUser() {
  try {
    console.log('=== CREATING NEW USER ===');
    
    // Create a new user
    const email = `test-user-${Date.now()}@example.com`;
    const password = 'Password123!';
    
    console.log(`Creating user with email: ${email}`);
    
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true // Auto-confirm the email
    });
    
    if (userError) {
      console.error('Error creating user:', userError);
      return;
    }
    
    console.log('✅ User created successfully:', {
      id: userData.user.id,
      email: userData.user.email,
      created_at: userData.user.created_at
    });
    
    // Verify the user was created
    console.log('\nVerifying user creation...');
    const { data: authUsers, error: authUsersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authUsersError) {
      console.error('Error listing auth users:', authUsersError);
      return;
    }
    
    console.log(`Found ${authUsers.users.length} users in the auth system`);
    
    // Find our newly created user
    const newUser = authUsers.users.find(user => user.email === email);
    if (newUser) {
      console.log('✅ Verified new user exists in the auth system');
    } else {
      console.error('❌ Could not find the newly created user in the auth system');
    }
    
    console.log('\n=== USER CREATION COMPLETE ===');
    console.log('\nYou can now use these credentials to log in:');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    
  } catch (error) {
    console.error('Unexpected error during user creation:', error);
  }
}

createUser(); 