// Script to test project creation with the new Supabase database
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create Supabase admin client with service role key
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function testProjectCreation() {
  try {
    console.log('=== TESTING PROJECT CREATION ===');
    
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
    const projectName = `Test Project ${Date.now()}`;
    const { data: projectData, error: projectError } = await supabaseAdmin
      .from('projects')
      .insert({
        id: projectId,
        name: projectName,
        description: 'A test project to verify project creation',
        version: '0.1.0',
        manifest: {
          manifest_version: 3,
          name: projectName,
          version: '0.1.0'
        },
        user_id: testUserId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (projectError) {
      console.error('Error creating test project:', projectError);
      return;
    }
    
    console.log('✅ Test project created successfully:', projectData.id);
    
    // 2. Create test files for the project
    console.log('\n2. Creating test files for the project...');
    
    const files = [
      {
        id: uuidv4(),
        project_id: projectId,
        name: 'manifest.json',
        path: '/manifest.json',
        file_type: 'json',
        content: JSON.stringify({
          manifest_version: 3,
          name: projectName,
          version: '0.1.0'
        }, null, 2),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        project_id: projectId,
        name: 'popup.html',
        path: '/popup.html',
        file_type: 'html',
        content: `<!DOCTYPE html>
<html>
<head>
  <title>${projectName}</title>
  <link rel="stylesheet" href="popup.css">
</head>
<body>
  <h1>${projectName}</h1>
  <p>This is a test popup page.</p>
  <script src="popup.js"></script>
</body>
</html>`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        project_id: projectId,
        name: 'popup.css',
        path: '/popup.css',
        file_type: 'css',
        content: `body {
  width: 300px;
  height: 200px;
  padding: 10px;
  font-family: Arial, sans-serif;
}

h1 {
  color: #4285f4;
}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        project_id: projectId,
        name: 'popup.js',
        path: '/popup.js',
        file_type: 'javascript',
        content: `// Popup script
document.addEventListener('DOMContentLoaded', function() {
  console.log('Popup loaded');
});`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    
    const { data: filesData, error: filesError } = await supabaseAdmin
      .from('extension_files')
      .insert(files)
      .select();
    
    if (filesError) {
      console.error('Error creating test files:', filesError);
    } else {
      console.log(`✅ Created ${filesData.length} test files successfully`);
    }
    
    // 3. Create test settings for the project
    console.log('\n3. Creating test settings for the project...');
    
    const settings = [
      {
        project_id: projectId,
        key: 'theme',
        value: { mode: 'dark' },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        project_id: projectId,
        key: 'editor',
        value: { fontSize: 14, tabSize: 2 },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    
    const { data: settingsData, error: settingsError } = await supabaseAdmin
      .from('project_settings')
      .insert(settings)
      .select();
    
    if (settingsError) {
      console.error('Error creating test settings:', settingsError);
    } else {
      console.log(`✅ Created ${settingsData.length} test settings successfully`);
    }
    
    // 4. Create a test conversation for the project
    console.log('\n4. Creating a test conversation for the project...');
    
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
            content: `Help me build a Chrome extension called "${projectName}".`
          },
          {
            role: 'assistant',
            content: `I'll help you build your Chrome extension "${projectName}". Let's start by creating the basic files you'll need.`
          }
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (conversationError) {
      console.error('Error creating test conversation:', conversationError);
    } else {
      console.log('✅ Test conversation created successfully:', conversationData.id);
    }
    
    // 5. Verify the project was created correctly
    console.log('\n5. Verifying project creation...');
    
    // Get the project
    const { data: retrievedProject, error: retrieveProjectError } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();
    
    if (retrieveProjectError) {
      console.error('Error retrieving project:', retrieveProjectError);
    } else {
      console.log('✅ Project retrieved successfully:', retrievedProject.name);
    }
    
    // Get the project files
    const { data: retrievedFiles, error: retrieveFilesError } = await supabaseAdmin
      .from('extension_files')
      .select('*')
      .eq('project_id', projectId);
    
    if (retrieveFilesError) {
      console.error('Error retrieving files:', retrieveFilesError);
    } else {
      console.log(`✅ Retrieved ${retrievedFiles.length} files successfully`);
    }
    
    // Get the project settings
    const { data: retrievedSettings, error: retrieveSettingsError } = await supabaseAdmin
      .from('project_settings')
      .select('*')
      .eq('project_id', projectId);
    
    if (retrieveSettingsError) {
      console.error('Error retrieving settings:', retrieveSettingsError);
    } else {
      console.log(`✅ Retrieved ${retrievedSettings.length} settings successfully`);
    }
    
    // Get the project conversations
    const { data: retrievedConversations, error: retrieveConversationsError } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('project_id', projectId);
    
    if (retrieveConversationsError) {
      console.error('Error retrieving conversations:', retrieveConversationsError);
    } else {
      console.log(`✅ Retrieved ${retrievedConversations.length} conversations successfully`);
    }
    
    // Clean up test data
    console.log('\nCleaning up test data...');
    
    // Delete the test project (this should cascade to delete the files, settings, and conversations)
    const { error: deleteProjectError } = await supabaseAdmin
      .from('projects')
      .delete()
      .eq('id', projectId);
    
    if (deleteProjectError) {
      console.error('Error deleting test project:', deleteProjectError);
    } else {
      console.log('✅ Test project deleted successfully');
    }
    
    console.log('\n=== PROJECT CREATION TEST COMPLETE ===');
    console.log('\nThe application is now ready to use with the new Supabase database.');
    
  } catch (error) {
    console.error('Unexpected error during project creation test:', error);
  }
}

testProjectCreation(); 