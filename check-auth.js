// Script to check authentication flow
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Create Supabase clients
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('=== CHECKING AUTHENTICATION FLOW ===');
console.log('Supabase URL:', supabaseUrl);
console.log('Anon Key available:', !!supabaseAnonKey);
console.log('Service Key available:', !!supabaseServiceKey);

// Create clients with both keys
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function checkAuth() {
  try {
    // 1. Check if we can get users with the admin client
    console.log('\n1. Checking if we can get users with the admin client...');
    const { data: authUsers, error: authUsersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authUsersError) {
      console.error('❌ Error listing auth users:', authUsersError);
    } else {
      console.log(`✅ Found ${authUsers.users.length} users with admin client`);
      console.log('First user:', {
        id: authUsers.users[0].id,
        email: authUsers.users[0].email,
        created_at: authUsers.users[0].created_at
      });
    }
    
    // 2. Check if we can get the current session with the anon client
    console.log('\n2. Checking if we can get the current session with the anon client...');
    const { data: sessionData, error: sessionError } = await supabaseAnon.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Error getting session:', sessionError);
    } else if (!sessionData.session) {
      console.log('⚠️ No active session found with anon client');
    } else {
      console.log('✅ Active session found with anon client:', {
        user_id: sessionData.session.user.id,
        email: sessionData.session.user.email
      });
    }
    
    // 3. Check if we can get the current user with the anon client
    console.log('\n3. Checking if we can get the current user with the anon client...');
    const { data: userData, error: userError } = await supabaseAnon.auth.getUser();
    
    if (userError) {
      console.error('❌ Error getting user:', userError);
    } else if (!userData.user) {
      console.log('⚠️ No user found with anon client');
    } else {
      console.log('✅ User found with anon client:', {
        id: userData.user.id,
        email: userData.user.email
      });
    }
    
    // 4. Check if we can get projects with the anon client
    console.log('\n4. Checking if we can get projects with the anon client...');
    const { data: anonProjects, error: anonProjectsError } = await supabaseAnon
      .from('projects')
      .select('*')
      .limit(5);
    
    if (anonProjectsError) {
      console.error('❌ Error getting projects with anon client:', anonProjectsError);
    } else {
      console.log(`✅ Found ${anonProjects.length} projects with anon client`);
      if (anonProjects.length > 0) {
        console.log('First project:', {
          id: anonProjects[0].id,
          name: anonProjects[0].name,
          user_id: anonProjects[0].user_id
        });
      }
    }
    
    // 5. Check if we can get projects with the admin client
    console.log('\n5. Checking if we can get projects with the admin client...');
    const { data: adminProjects, error: adminProjectsError } = await supabaseAdmin
      .from('projects')
      .select('*')
      .limit(5);
    
    if (adminProjectsError) {
      console.error('❌ Error getting projects with admin client:', adminProjectsError);
    } else {
      console.log(`✅ Found ${adminProjects.length} projects with admin client`);
      if (adminProjects.length > 0) {
        console.log('First project:', {
          id: adminProjects[0].id,
          name: adminProjects[0].name,
          user_id: adminProjects[0].user_id
        });
      }
    }
    
    console.log('\n=== AUTH CHECK COMPLETE ===');
    
  } catch (error) {
    console.error('Unexpected error during auth check:', error);
  }
}

checkAuth(); 