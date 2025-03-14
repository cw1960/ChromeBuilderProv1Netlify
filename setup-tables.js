// Script to set up the database tables using the Supabase REST API
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create Supabase admin client with service role key
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function setupTables() {
  try {
    console.log('=== SETTING UP DATABASE TABLES ===');
    
    // Get the user ID for testing
    console.log('\nGetting user ID for testing...');
    const { data: authUsers, error: authUsersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authUsersError) {
      console.error('Error listing auth users:', authUsersError);
      return;
    }
    
    if (authUsers.users.length === 0) {
      console.error('No users found in the auth system. Please create a user first.');
      return;
    }
    
    const testUserId = authUsers.users[0].id;
    console.log('Using user ID:', testUserId);
    
    // 1. Create a test project
    console.log('\n1. Creating a test project...');
    const projectId = uuidv4();
    const { data: projectData, error: projectError } = await supabaseAdmin
      .from('projects')
      .insert({
        id: projectId,
        name: 'Test Project',
        description: 'A test project to verify database setup',
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
      if (projectError.code === '42P01') {
        console.log('Projects table does not exist. Creating it...');
        
        // Try to create the projects table using the REST API
        const { error: createProjectsTableError } = await supabaseAdmin.rpc('create_table', {
          table_name: 'projects',
          columns: [
            { name: 'id', type: 'uuid', primary_key: true },
            { name: 'name', type: 'text', nullable: false },
            { name: 'description', type: 'text' },
            { name: 'version', type: 'text', nullable: false },
            { name: 'manifest', type: 'jsonb', nullable: false },
            { name: 'user_id', type: 'uuid', nullable: false, references: 'auth.users(id)', on_delete: 'CASCADE' },
            { name: 'created_at', type: 'timestamptz', nullable: false, default: 'NOW()' },
            { name: 'updated_at', type: 'timestamptz', nullable: false, default: 'NOW()' }
          ]
        });
        
        if (createProjectsTableError) {
          console.error('Error creating projects table:', createProjectsTableError);
          console.log('Please run the SQL script in the Supabase SQL Editor to create the tables.');
          return;
        } else {
          console.log('✅ Projects table created successfully');
          
          // Try to insert the project again
          const { data: retryProjectData, error: retryProjectError } = await supabaseAdmin
            .from('projects')
            .insert({
              id: projectId,
              name: 'Test Project',
              description: 'A test project to verify database setup',
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
          
          if (retryProjectError) {
            console.error('Error creating test project after table creation:', retryProjectError);
            return;
          } else {
            console.log('✅ Test project created successfully:', retryProjectData.id);
          }
        }
      } else {
        console.error('Error creating test project:', projectError);
        return;
      }
    } else {
      console.log('✅ Test project created successfully:', projectData.id);
    }
    
    // 2. Create a test file
    console.log('\n2. Creating a test file...');
    const fileId = uuidv4();
    const { data: fileData, error: fileError } = await supabaseAdmin
      .from('extension_files')
      .insert({
        id: fileId,
        project_id: projectId,
        name: 'manifest.json',
        path: '/manifest.json',
        file_type: 'json',
        content: JSON.stringify({
          manifest_version: 3,
          name: 'Test Project',
          version: '0.1.0'
        }, null, 2),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (fileError) {
      if (fileError.code === '42P01') {
        console.log('Extension_files table does not exist. Creating it...');
        
        // Try to create the extension_files table using the REST API
        const { error: createFilesTableError } = await supabaseAdmin.rpc('create_table', {
          table_name: 'extension_files',
          columns: [
            { name: 'id', type: 'uuid', primary_key: true },
            { name: 'project_id', type: 'uuid', nullable: false, references: 'projects(id)', on_delete: 'CASCADE' },
            { name: 'name', type: 'text', nullable: false },
            { name: 'path', type: 'text', nullable: false },
            { name: 'file_type', type: 'text', nullable: false },
            { name: 'content', type: 'text', nullable: false },
            { name: 'created_at', type: 'timestamptz', nullable: false, default: 'NOW()' },
            { name: 'updated_at', type: 'timestamptz', nullable: false, default: 'NOW()' }
          ]
        });
        
        if (createFilesTableError) {
          console.error('Error creating extension_files table:', createFilesTableError);
          console.log('Please run the SQL script in the Supabase SQL Editor to create the tables.');
        } else {
          console.log('✅ Extension_files table created successfully');
          
          // Try to insert the file again
          const { data: retryFileData, error: retryFileError } = await supabaseAdmin
            .from('extension_files')
            .insert({
              id: fileId,
              project_id: projectId,
              name: 'manifest.json',
              path: '/manifest.json',
              file_type: 'json',
              content: JSON.stringify({
                manifest_version: 3,
                name: 'Test Project',
                version: '0.1.0'
              }, null, 2),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single();
          
          if (retryFileError) {
            console.error('Error creating test file after table creation:', retryFileError);
          } else {
            console.log('✅ Test file created successfully:', retryFileData.id);
          }
        }
      } else {
        console.error('Error creating test file:', fileError);
      }
    } else {
      console.log('✅ Test file created successfully:', fileData.id);
    }
    
    // 3. Create a test setting
    console.log('\n3. Creating a test setting...');
    const { data: settingData, error: settingError } = await supabaseAdmin
      .from('project_settings')
      .insert({
        project_id: projectId,
        key: 'theme',
        value: { mode: 'dark' },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (settingError) {
      if (settingError.code === '42P01') {
        console.log('Project_settings table does not exist. Creating it...');
        
        // Try to create the project_settings table using the REST API
        const { error: createSettingsTableError } = await supabaseAdmin.rpc('create_table', {
          table_name: 'project_settings',
          columns: [
            { name: 'id', type: 'serial', primary_key: true },
            { name: 'project_id', type: 'uuid', nullable: false, references: 'projects(id)', on_delete: 'CASCADE' },
            { name: 'key', type: 'text', nullable: false },
            { name: 'value', type: 'jsonb', nullable: false },
            { name: 'created_at', type: 'timestamptz', nullable: false, default: 'NOW()' },
            { name: 'updated_at', type: 'timestamptz', nullable: false, default: 'NOW()' }
          ],
          constraints: [
            { type: 'unique', columns: ['project_id', 'key'] }
          ]
        });
        
        if (createSettingsTableError) {
          console.error('Error creating project_settings table:', createSettingsTableError);
          console.log('Please run the SQL script in the Supabase SQL Editor to create the tables.');
        } else {
          console.log('✅ Project_settings table created successfully');
          
          // Try to insert the setting again
          const { data: retrySettingData, error: retrySettingError } = await supabaseAdmin
            .from('project_settings')
            .insert({
              project_id: projectId,
              key: 'theme',
              value: { mode: 'dark' },
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single();
          
          if (retrySettingError) {
            console.error('Error creating test setting after table creation:', retrySettingError);
          } else {
            console.log('✅ Test setting created successfully:', retrySettingData.id);
          }
        }
      } else {
        console.error('Error creating test setting:', settingError);
      }
    } else {
      console.log('✅ Test setting created successfully:', settingData.id);
    }
    
    // 4. Create a test conversation
    console.log('\n4. Creating a test conversation...');
    const conversationId = uuidv4();
    const { data: conversationData, error: conversationError } = await supabaseAdmin
      .from('conversations')
      .insert({
        id: conversationId,
        project_id: projectId,
        user_id: testUserId,
        messages: [
          {
            role: 'user',
            content: 'Hello, this is a test message.'
          }
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (conversationError) {
      if (conversationError.code === '42P01') {
        console.log('Conversations table does not exist. Creating it...');
        
        // Try to create the conversations table using the REST API
        const { error: createConversationsTableError } = await supabaseAdmin.rpc('create_table', {
          table_name: 'conversations',
          columns: [
            { name: 'id', type: 'uuid', primary_key: true },
            { name: 'project_id', type: 'uuid', nullable: false, references: 'projects(id)', on_delete: 'CASCADE' },
            { name: 'user_id', type: 'uuid', nullable: false, references: 'auth.users(id)', on_delete: 'CASCADE' },
            { name: 'messages', type: 'jsonb', nullable: false },
            { name: 'created_at', type: 'timestamptz', nullable: false, default: 'NOW()' },
            { name: 'updated_at', type: 'timestamptz', nullable: false, default: 'NOW()' }
          ]
        });
        
        if (createConversationsTableError) {
          console.error('Error creating conversations table:', createConversationsTableError);
          console.log('Please run the SQL script in the Supabase SQL Editor to create the tables.');
        } else {
          console.log('✅ Conversations table created successfully');
          
          // Try to insert the conversation again
          const { data: retryConversationData, error: retryConversationError } = await supabaseAdmin
            .from('conversations')
            .insert({
              id: conversationId,
              project_id: projectId,
              user_id: testUserId,
              messages: [
                {
                  role: 'user',
                  content: 'Hello, this is a test message.'
                }
              ],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single();
          
          if (retryConversationError) {
            console.error('Error creating test conversation after table creation:', retryConversationError);
          } else {
            console.log('✅ Test conversation created successfully:', retryConversationData.id);
          }
        }
      } else {
        console.error('Error creating test conversation:', conversationError);
      }
    } else {
      console.log('✅ Test conversation created successfully:', conversationData.id);
    }
    
    // Clean up test data
    console.log('\nCleaning up test data...');
    
    // Delete the test project (this should cascade to delete the file, setting, and conversation)
    const { error: deleteProjectError } = await supabaseAdmin
      .from('projects')
      .delete()
      .eq('id', projectId);
    
    if (deleteProjectError) {
      console.error('Error deleting test project:', deleteProjectError);
    } else {
      console.log('✅ Test project deleted successfully');
    }
    
    console.log('\n=== DATABASE SETUP COMPLETE ===');
    console.log('\nYou can now use the application with the new Supabase database.');
    
  } catch (error) {
    console.error('Unexpected error during database setup:', error);
  }
}

setupTables(); 