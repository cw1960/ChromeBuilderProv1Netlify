// Script to check database structure and permissions
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('=== DATABASE STRUCTURE CHECK ===');
console.log('Supabase URL:', supabaseUrl);
console.log('Service Key available:', !!supabaseServiceKey);
console.log('Anon Key available:', !!supabaseAnonKey);

// Create clients with both keys
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

async function checkDatabase() {
  try {
    // 1. Check if we can connect to the database
    console.log('\n1. Testing database connection...');
    const { data: healthData, error: healthError } = await supabaseAdmin.rpc('pg_stat_database');
    
    if (healthError) {
      console.error('❌ Database connection error:', healthError);
    } else {
      console.log('✅ Database connection successful');
    }
    
    // 2. Check if tables exist
    console.log('\n2. Checking if required tables exist...');
    const requiredTables = ['projects', 'extension_files', 'project_settings', 'conversations'];
    
    for (const table of requiredTables) {
      try {
        const { data, error } = await supabaseAdmin
          .from(table)
          .select('count(*)', { count: 'exact' })
          .limit(0);
        
        if (error) {
          console.error(`❌ Table ${table} error:`, error.message);
        } else {
          console.log(`✅ Table ${table} exists with ${data.length} rows`);
        }
      } catch (e) {
        console.error(`❌ Error checking table ${table}:`, e);
      }
    }
    
    // 3. Get a valid user ID for testing
    console.log('\n3. Getting a valid user ID...');
    const { data: authUsers, error: authUsersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authUsersError) {
      console.error('❌ Error listing auth users:', authUsersError);
      return;
    }
    
    if (!authUsers || authUsers.users.length === 0) {
      console.error('❌ No users found in auth schema');
      return;
    }
    
    const testUserId = authUsers.users[0].id;
    console.log('✅ Found user ID:', testUserId);
    
    // 4. Test creating a project with anon key (as a regular user would)
    console.log('\n4. Testing project creation with anon key (as user would)...');
    const projectId = uuidv4();
    const now = new Date().toISOString();
    
    const { data: anonProjectData, error: anonProjectError } = await supabaseAnon
      .from('projects')
      .insert({
        id: projectId,
        name: 'Anon Test Project',
        description: 'Testing project creation with anon key',
        version: '0.1.0',
        manifest: {
          manifest_version: 3,
          name: 'Anon Test Project',
          version: '0.1.0'
        },
        user_id: testUserId,
        created_at: now,
        updated_at: now
      })
      .select()
      .single();
    
    if (anonProjectError) {
      console.error('❌ Error creating project with anon key:', anonProjectError);
      console.log('   This may be expected if RLS is properly configured');
      
      // 5. Test with service key instead
      console.log('\n5. Testing project creation with service key...');
      const { data: adminProjectData, error: adminProjectError } = await supabaseAdmin
        .from('projects')
        .insert({
          id: projectId,
          name: 'Admin Test Project',
          description: 'Testing project creation with service key',
          version: '0.1.0',
          manifest: {
            manifest_version: 3,
            name: 'Admin Test Project',
            version: '0.1.0'
          },
          user_id: testUserId,
          created_at: now,
          updated_at: now
        })
        .select()
        .single();
      
      if (adminProjectError) {
        console.error('❌ Error creating project with service key:', adminProjectError);
        console.log('   Error details:', JSON.stringify(adminProjectError, null, 2));
      } else {
        console.log('✅ Project created successfully with service key:', adminProjectData.id);
        
        // 6. Test creating a file
        console.log('\n6. Testing file creation...');
        const fileId = uuidv4();
        
        const { data: fileData, error: fileError } = await supabaseAdmin
          .from('extension_files')
          .insert({
            id: fileId,
            project_id: projectId,
            name: 'test.html',
            path: 'test.html',
            file_type: 'HTML',
            content: '<html><body>Test</body></html>',
            created_at: now,
            updated_at: now
          })
          .select()
          .single();
        
        if (fileError) {
          console.error('❌ Error creating file:', fileError);
          console.log('   Error details:', JSON.stringify(fileError, null, 2));
        } else {
          console.log('✅ File created successfully:', fileData.id);
        }
        
        // 7. Test creating a setting
        console.log('\n7. Testing setting creation...');
        
        const { data: settingData, error: settingError } = await supabaseAdmin
          .from('project_settings')
          .insert({
            project_id: projectId,
            key: 'test_setting',
            value: { test: true }
          })
          .select()
          .single();
        
        if (settingError) {
          console.error('❌ Error creating setting:', settingError);
        } else {
          console.log('✅ Setting created successfully');
        }
        
        // 8. Test creating a conversation
        console.log('\n8. Testing conversation creation...');
        
        const { data: conversationData, error: conversationError } = await supabaseAdmin
          .from('conversations')
          .insert({
            project_id: projectId,
            user_id: testUserId,
            messages: [
              {
                role: 'system',
                content: 'This is a test conversation',
                timestamp: now
              }
            ],
            created_at: now,
            updated_at: now
          })
          .select()
          .single();
        
        if (conversationError) {
          console.error('❌ Error creating conversation:', conversationError);
          console.log('   Error details:', JSON.stringify(conversationError, null, 2));
        } else {
          console.log('✅ Conversation created successfully:', conversationData.id);
        }
        
        // 9. Clean up test data
        console.log('\n9. Cleaning up test data...');
        
        // Delete conversations
        await supabaseAdmin
          .from('conversations')
          .delete()
          .eq('project_id', projectId);
        
        // Delete settings
        await supabaseAdmin
          .from('project_settings')
          .delete()
          .eq('project_id', projectId);
        
        // Delete files
        await supabaseAdmin
          .from('extension_files')
          .delete()
          .eq('project_id', projectId);
        
        // Delete project
        await supabaseAdmin
          .from('projects')
          .delete()
          .eq('id', projectId);
        
        console.log('✅ Test data cleaned up');
      }
    } else {
      console.log('✅ Project created successfully with anon key:', anonProjectData.id);
      
      // Clean up
      await supabaseAnon
        .from('projects')
        .delete()
        .eq('id', projectId);
      
      console.log('✅ Test data cleaned up');
    }
    
    // 10. Check RLS policies
    console.log('\n10. Checking RLS policies...');
    for (const table of requiredTables) {
      try {
        const { data: policies, error: policiesError } = await supabaseAdmin
          .from('pg_policies')
          .select('*')
          .eq('tablename', table);
        
        if (policiesError) {
          console.error(`❌ Error checking RLS policies for ${table}:`, policiesError);
        } else if (policies && policies.length > 0) {
          console.log(`✅ Table ${table} has ${policies.length} RLS policies:`);
          policies.forEach(policy => {
            console.log(`   - ${policy.policyname}: ${policy.cmd}`);
          });
        } else {
          console.log(`⚠️ Table ${table} has no RLS policies`);
        }
      } catch (e) {
        console.error(`❌ Error checking RLS policies for ${table}:`, e);
      }
    }
    
    console.log('\n=== DATABASE CHECK COMPLETE ===');
    
  } catch (error) {
    console.error('Unexpected error during database check:', error);
  }
}

checkDatabase(); 