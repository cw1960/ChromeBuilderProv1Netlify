// Test script to verify Supabase connection and project creation
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

// Create a Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Anon Key available:', !!supabaseAnonKey);
console.log('Service Key available:', !!supabaseServiceKey);

// Create clients with both keys
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function testSupabase() {
  try {
    console.log('Testing Supabase connection...');
    
    // Test connection with anon key
    const { data: anonData, error: anonError } = await supabaseAnon
      .from('projects')
      .select('count')
      .limit(1);
    
    if (anonError) {
      console.error('Error with anon key:', anonError);
    } else {
      console.log('Anon key connection successful');
    }
    
    // Test connection with service role key
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('projects')
      .select('count')
      .limit(1);
    
    if (adminError) {
      console.error('Error with service role key:', adminError);
    } else {
      console.log('Service role key connection successful');
    }
    
    // Check for authenticated user
    console.log('Checking for authenticated user...');
    const { data: { user }, error: userError } = await supabaseAnon.auth.getUser();
    
    if (userError) {
      console.error('Error getting user:', userError);
      console.log('No authenticated user found via anon client. Trying to find users with admin client...');
      
      // List users from auth.users table using admin client
      console.log('Listing users from auth schema...');
      const { data: authUsers, error: authUsersError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (authUsersError) {
        console.error('Error listing auth users:', authUsersError);
        return;
      }
      
      if (!authUsers || authUsers.users.length === 0) {
        console.log('No users found in auth schema.');
        return;
      }
      
      console.log('Users found in auth schema:', authUsers.users.length);
      console.log('First user ID:', authUsers.users[0].id);
      
      // Use the first user's ID for the test project
      const testUserId = authUsers.users[0].id;
      
      // Try to create a test project with the first user's ID
      const projectId = uuidv4();
      const now = new Date().toISOString();
      
      console.log('Creating test project with ID:', projectId);
      console.log('Using first user ID:', testUserId);
      
      const { data: projectData, error: projectError } = await supabaseAdmin
        .from('projects')
        .insert({
          id: projectId,
          name: 'Test Project',
          description: 'A test project to verify Supabase connection',
          version: '0.1.0',
          manifest: {
            manifest_version: 3,
            name: 'Test Project',
            version: '0.1.0'
          },
          user_id: testUserId,
          created_at: now,
          updated_at: now
        })
        .select()
        .single();
      
      if (projectError) {
        console.error('Error creating test project:', projectError);
      } else {
        console.log('Test project created successfully:', projectData);
        
        // Clean up - delete the test project
        const { error: deleteError } = await supabaseAdmin
          .from('projects')
          .delete()
          .eq('id', projectId);
        
        if (deleteError) {
          console.error('Error deleting test project:', deleteError);
        } else {
          console.log('Test project deleted successfully');
        }
      }
      
      return;
    }
    
    console.log('Authenticated user found:', user.id);
    
    // Try to create a test project with the authenticated user's ID
    const projectId = uuidv4();
    const now = new Date().toISOString();
    
    console.log('Creating test project with ID:', projectId);
    console.log('Using authenticated user ID:', user.id);
    
    const { data: projectData, error: projectError } = await supabaseAdmin
      .from('projects')
      .insert({
        id: projectId,
        name: 'Test Project',
        description: 'A test project to verify Supabase connection',
        version: '0.1.0',
        manifest: {
          manifest_version: 3,
          name: 'Test Project',
          version: '0.1.0'
        },
        user_id: user.id,
        created_at: now,
        updated_at: now
      })
      .select()
      .single();
    
    if (projectError) {
      console.error('Error creating test project:', projectError);
    } else {
      console.log('Test project created successfully:', projectData);
      
      // Clean up - delete the test project
      const { error: deleteError } = await supabaseAdmin
        .from('projects')
        .delete()
        .eq('id', projectId);
      
      if (deleteError) {
        console.error('Error deleting test project:', deleteError);
      } else {
        console.log('Test project deleted successfully');
      }
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testSupabase(); 