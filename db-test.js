// Comprehensive database test script
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

// Create Supabase clients with different keys
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('=== SUPABASE CONNECTION TEST ===');
console.log('Supabase URL:', supabaseUrl);
console.log('Anon Key available:', !!supabaseAnonKey);
console.log('Service Key available:', !!supabaseServiceKey);

// Create clients with both keys
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function testDatabase() {
  try {
    console.log('\n=== TESTING DATABASE CONNECTION ===');
    
    // 1. Test basic connection
    console.log('\n1. Testing basic connection...');
    const { data: healthData, error: healthError } = await supabaseAdmin.rpc('pg_stat_database');
    
    if (healthError) {
      console.error('❌ Database connection error:', healthError);
    } else {
      console.log('✅ Database connection successful');
    }
    
    // 2. List all tables in the public schema
    console.log('\n2. Listing tables in public schema...');
    const { data: tables, error: tablesError } = await supabaseAdmin
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public');
    
    if (tablesError) {
      console.error('❌ Error listing tables:', tablesError);
    } else {
      console.log('✅ Tables found:', tables.map(t => t.tablename).join(', '));
    }
    
    // 3. Check projects table structure
    console.log('\n3. Checking projects table structure...');
    const { data: projectsColumns, error: projectsColumnsError } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'projects')
      .eq('table_schema', 'public');
    
    if (projectsColumnsError) {
      console.error('❌ Error getting projects table structure:', projectsColumnsError);
    } else if (!projectsColumns || projectsColumns.length === 0) {
      console.error('❌ Projects table not found or has no columns');
    } else {
      console.log('✅ Projects table structure:');
      projectsColumns.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type}, ${col.is_nullable === 'YES' ? 'nullable' : 'not nullable'})`);
      });
    }
    
    // 4. Check RLS policies on projects table
    console.log('\n4. Checking RLS policies on projects table...');
    const { data: policies, error: policiesError } = await supabaseAdmin
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'projects');
    
    if (policiesError) {
      console.error('❌ Error checking RLS policies:', policiesError);
    } else {
      console.log('✅ RLS policies on projects table:');
      if (policies && policies.length > 0) {
        policies.forEach(policy => {
          console.log(`   - ${policy.policyname}: ${policy.cmd} (${policy.qual})`);
        });
      } else {
        console.log('   No RLS policies found');
      }
    }
    
    // 5. Check if RLS is enabled on projects table
    console.log('\n5. Checking if RLS is enabled on projects table...');
    const { data: rlsEnabled, error: rlsError } = await supabaseAdmin
      .from('pg_tables')
      .select('rowsecurity')
      .eq('tablename', 'projects')
      .eq('schemaname', 'public')
      .single();
    
    if (rlsError) {
      console.error('❌ Error checking RLS status:', rlsError);
    } else {
      console.log(`✅ RLS on projects table is ${rlsEnabled.rowsecurity ? 'enabled' : 'disabled'}`);
    }
    
    // 6. List users from auth schema
    console.log('\n6. Listing users from auth schema...');
    const { data: authUsers, error: authUsersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authUsersError) {
      console.error('❌ Error listing auth users:', authUsersError);
    } else if (!authUsers || authUsers.users.length === 0) {
      console.log('❌ No users found in auth schema');
    } else {
      console.log(`✅ Found ${authUsers.users.length} users in auth schema`);
      console.log(`   First user ID: ${authUsers.users[0].id}`);
      
      // Use the first user's ID for testing
      const testUserId = authUsers.users[0].id;
      
      // 7. Test creating a project with the first user's ID
      console.log('\n7. Testing project creation with user ID:', testUserId);
      const projectId = uuidv4();
      const now = new Date().toISOString();
      
      const { data: projectData, error: projectError } = await supabaseAdmin
        .from('projects')
        .insert({
          id: projectId,
          name: 'Test Project',
          description: 'A test project to verify database write permissions',
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
        console.error('❌ Error creating test project:', projectError);
        console.log('   Error details:', JSON.stringify(projectError, null, 2));
      } else {
        console.log('✅ Test project created successfully:', projectData.id);
        
        // 8. Test creating a project file
        console.log('\n8. Testing project file creation...');
        const fileId = uuidv4();
        
        const { data: fileData, error: fileError } = await supabaseAdmin
          .from('project_files')
          .insert({
            id: fileId,
            project_id: projectId,
            name: 'test.html',
            path: 'test.html',
            type: 'HTML',
            content: '<html><body>Test</body></html>',
            metadata: {}
          })
          .select()
          .single();
        
        if (fileError) {
          console.error('❌ Error creating test file:', fileError);
          console.log('   Error details:', JSON.stringify(fileError, null, 2));
        } else {
          console.log('✅ Test file created successfully:', fileData.id);
        }
        
        // 9. Test creating a project setting
        console.log('\n9. Testing project setting creation...');
        
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
          console.error('❌ Error creating test setting:', settingError);
          console.log('   Error details:', JSON.stringify(settingError, null, 2));
        } else {
          console.log('✅ Test setting created successfully');
        }
        
        // 10. Test creating a conversation
        console.log('\n10. Testing conversation creation...');
        
        const { data: conversationData, error: conversationError } = await supabaseAdmin
          .from('conversations')
          .insert({
            project_id: projectId,
            title: 'Test Conversation',
            messages: [
              {
                role: 'system',
                content: 'This is a test conversation',
                timestamp: now
              }
            ],
            metadata: { test: true }
          })
          .select()
          .single();
        
        if (conversationError) {
          console.error('❌ Error creating test conversation:', conversationError);
          console.log('   Error details:', JSON.stringify(conversationError, null, 2));
        } else {
          console.log('✅ Test conversation created successfully:', conversationData.id);
        }
        
        // 11. Clean up - delete the test project and related data
        console.log('\n11. Cleaning up test data...');
        
        // Delete conversation
        if (conversationData) {
          const { error: deleteConversationError } = await supabaseAdmin
            .from('conversations')
            .delete()
            .eq('id', conversationData.id);
          
          if (deleteConversationError) {
            console.error('❌ Error deleting test conversation:', deleteConversationError);
          } else {
            console.log('✅ Test conversation deleted successfully');
          }
        }
        
        // Delete setting
        const { error: deleteSettingError } = await supabaseAdmin
          .from('project_settings')
          .delete()
          .eq('project_id', projectId)
          .eq('key', 'test_setting');
        
        if (deleteSettingError) {
          console.error('❌ Error deleting test setting:', deleteSettingError);
        } else {
          console.log('✅ Test setting deleted successfully');
        }
        
        // Delete file
        if (fileData) {
          const { error: deleteFileError } = await supabaseAdmin
            .from('project_files')
            .delete()
            .eq('id', fileId);
          
          if (deleteFileError) {
            console.error('❌ Error deleting test file:', deleteFileError);
          } else {
            console.log('✅ Test file deleted successfully');
          }
        }
        
        // Delete project
        const { error: deleteProjectError } = await supabaseAdmin
          .from('projects')
          .delete()
          .eq('id', projectId);
        
        if (deleteProjectError) {
          console.error('❌ Error deleting test project:', deleteProjectError);
        } else {
          console.log('✅ Test project deleted successfully');
        }
      }
    }
    
    // 12. Test browser client permissions
    console.log('\n12. Testing browser client permissions (with anon key)...');
    
    // Try to list projects with anon key
    const { data: anonProjects, error: anonProjectsError } = await supabaseAnon
      .from('projects')
      .select('*')
      .limit(5);
    
    if (anonProjectsError) {
      console.error('❌ Error listing projects with anon key:', anonProjectsError);
      console.log('   This may be expected if RLS is properly configured');
    } else {
      console.log(`✅ Successfully listed ${anonProjects.length} projects with anon key`);
    }
    
    console.log('\n=== DATABASE TEST COMPLETE ===');
    
  } catch (error) {
    console.error('Unexpected error during database test:', error);
  }
}

testDatabase(); 