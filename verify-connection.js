// Script to verify the connection to the new Supabase database
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('=== VERIFYING SUPABASE CONNECTION ===');
console.log('Supabase URL:', supabaseUrl);
console.log('Anon Key available:', !!supabaseAnonKey);
console.log('Service Key available:', !!supabaseServiceKey);

// Create Supabase clients
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function verifyConnection() {
  try {
    // 1. Check if we can get users with the admin client
    console.log('\n1. Checking if we can get users with the admin client...');
    const { data: authUsers, error: authUsersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authUsersError) {
      console.error('❌ Error listing auth users:', authUsersError);
    } else {
      console.log(`✅ Found ${authUsers.users.length} users with admin client`);
      if (authUsers.users.length > 0) {
        console.log('First user:', {
          id: authUsers.users[0].id,
          email: authUsers.users[0].email,
          created_at: authUsers.users[0].created_at
        });
      }
    }
    
    // 2. Check if tables exist
    console.log('\n2. Checking if tables exist...');
    const tables = ['projects', 'extension_files', 'project_settings', 'conversations', 'deployment_history', 'user_subscriptions'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabaseAdmin
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.error(`❌ Error checking table ${table}:`, error.message);
        } else {
          console.log(`✅ Table ${table} exists`);
        }
      } catch (e) {
        console.error(`❌ Error checking table ${table}:`, e);
      }
    }
    
    // 3. Try to create a test project
    console.log('\n3. Trying to create a test project...');
    
    // Get a valid user ID for testing
    let testUserId = null;
    if (authUsers && authUsers.users.length > 0) {
      testUserId = authUsers.users[0].id;
      console.log('Using user ID:', testUserId);
      
      // Create a test project
      const { data: projectData, error: projectError } = await supabaseAdmin
        .from('projects')
        .insert({
          id: '00000000-0000-0000-0000-000000000001',
          name: 'Test Project',
          description: 'A test project to verify database connection',
          version: '0.1.0',
          manifest: {
            manifest_version: 3,
            name: 'Test Project',
            version: '0.1.0'
          },
          user_id: testUserId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (projectError) {
        console.error('❌ Error creating test project:', projectError);
      } else {
        console.log('✅ Test project created successfully:', projectData.id);
        
        // Clean up the test project
        const { error: deleteError } = await supabaseAdmin
          .from('projects')
          .delete()
          .eq('id', '00000000-0000-0000-0000-000000000001');
        
        if (deleteError) {
          console.error('❌ Error deleting test project:', deleteError);
        } else {
          console.log('✅ Test project deleted successfully');
        }
      }
    } else {
      console.log('⚠️ No users found, skipping project creation test');
    }
    
    console.log('\n=== CONNECTION VERIFICATION COMPLETE ===');
    
  } catch (error) {
    console.error('Unexpected error during verification:', error);
  }
}

verifyConnection(); 