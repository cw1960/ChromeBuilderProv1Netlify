// Script to verify that the test user exists in the database and create it if it doesn't
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Check for required environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase admin client
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test user details
const testUserEmail = 'test-user@example.com';
const testUserPassword = 'Password123!';

async function verifyTestUser() {
  console.log('Verifying test user exists in the database...');
  
  try {
    // Try to get user by email using the auth API
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    
    if (error) {
      console.error('Error listing users:', error);
      await createTestUser();
      return;
    }
    
    const existingUser = data.users.find(user => user.email === testUserEmail);
    
    if (existingUser) {
      console.log('Test user already exists:');
      console.log(`- User ID: ${existingUser.id}`);
      console.log(`- Email: ${existingUser.email}`);
    } else {
      console.log('Test user not found, creating...');
      await createTestUser();
    }
  } catch (error) {
    console.error('Error checking for test user:', error);
    await createTestUser();
  }
  
  console.log('\nYou can sign in with these credentials:');
  console.log(`- Email: ${testUserEmail}`);
  console.log(`- Password: ${testUserPassword}`);
}

async function createTestUser() {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: testUserEmail,
      password: testUserPassword,
      email_confirm: true
    });
    
    if (error) {
      if (error.code === 'email_exists') {
        console.log('User with this email already exists, but we could not retrieve it.');
        console.log('You can still use the test credentials to sign in.');
      } else {
        console.error('Error creating test user:', error);
      }
      return;
    }
    
    if (data && data.user) {
      console.log('Successfully created test user:');
      console.log(`- User ID: ${data.user.id}`);
      console.log(`- Email: ${data.user.email}`);
    } else {
      console.log('User created but no data returned');
    }
  } catch (error) {
    console.error('Error creating test user:', error);
  }
}

// Run the verification
verifyTestUser()
  .catch(console.error)
  .finally(() => {
    // Ensure the process exits
    setTimeout(() => process.exit(0), 1000);
  }); 