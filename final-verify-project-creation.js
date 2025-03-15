require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local file');
  process.exit(1);
}

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Service Key available:', !!supabaseServiceKey);

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function finalVerifyProjectCreation() {
  console.log('Starting final verification of project creation...');
  
  try {
    // 1. Get a valid user ID for testing
    console.log('Fetching a valid user ID...');
    const { data: authUsers, error: authUsersError } = await supabase.auth.admin.listUsers();
    
    if (authUsersError) {
      console.error('Error listing auth users:', authUsersError);
      process.exit(1);
    }
    
    if (!authUsers || authUsers.users.length === 0) {
      console.error('No users found in auth schema');
      process.exit(1);
    }
    
    const userId = authUsers.users[0].id;
    console.log('Using user ID:', userId);
    
    // 2. Create a test project
    const projectId = uuidv4();
    const now = new Date().toISOString();
    const projectName = `Final Test Project ${Date.now()}`;
    const projectDescription = 'A final test project for verification';
    
    console.log('Creating test project with ID:', projectId);
    
    // Basic manifest
    const manifest = {
      manifest_version: 3,
      name: projectName,
      description: projectDescription,
      version: '0.1.0',
      action: {
        default_popup: 'popup.html',
        default_title: projectName
      },
      permissions: [],
      host_permissions: []
    };
    
    // Insert project into database
    console.log('Inserting project into database...');
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .insert({
        id: projectId,
        name: projectName,
        description: projectDescription,
        version: '0.1.0',
        manifest,
        user_id: userId,
        created_at: now,
        updated_at: now
      })
      .select()
      .single();
    
    if (projectError) {
      console.error('Error creating project:', projectError);
      process.exit(1);
    }
    
    console.log('Project created successfully:', projectData?.id);
    
    // 3. Create test files
    console.log('Creating test files...');
    const files = [
      {
        id: uuidv4(),
        project_id: projectId,
        name: 'popup.html',
        path: 'popup.html',
        file_type: 'html',
        content: '<html><body><h1>Test</h1></body></html>',
        created_at: now,
        updated_at: now
      },
      {
        id: uuidv4(),
        project_id: projectId,
        name: 'popup.css',
        path: 'popup.css',
        file_type: 'css',
        content: 'body { color: blue; }',
        created_at: now,
        updated_at: now
      },
      {
        id: uuidv4(),
        project_id: projectId,
        name: 'popup.js',
        path: 'popup.js',
        file_type: 'javascript',
        content: 'console.log("Hello");',
        created_at: now,
        updated_at: now
      }
    ];
    
    for (const file of files) {
      const { data: fileData, error: fileError } = await supabase
        .from('extension_files')
        .insert(file)
        .select()
        .single();
      
      if (fileError) {
        console.error(`Error creating file ${file.name}:`, fileError);
        process.exit(1);
      }
      
      console.log(`File ${file.name} created successfully:`, fileData?.id);
    }
    
    // 4. Create test settings
    console.log('Creating test settings...');
    const settings = [
      {
        project_id: projectId,
        key: 'theme',
        value: { mode: 'dark' }
      },
      {
        project_id: projectId,
        key: 'editor',
        value: { fontSize: 14 }
      }
    ];
    
    for (const setting of settings) {
      const { data: settingData, error: settingError } = await supabase
        .from('project_settings')
        .insert(setting)
        .select()
        .single();
      
      if (settingError) {
        console.error(`Error creating setting ${setting.key}:`, settingError);
        process.exit(1);
      }
      
      console.log(`Setting ${setting.key} created successfully`);
    }
    
    // 5. Create a test conversation
    const conversationId = uuidv4();
    console.log('Creating test conversation with ID:', conversationId);
    const { data: conversationData, error: conversationError } = await supabase
      .from('conversations')
      .insert({
        id: conversationId,
        project_id: projectId,
        user_id: userId,
        messages: [
          {
            role: 'system',
            content: 'Test conversation',
            timestamp: now
          }
        ],
        created_at: now,
        updated_at: now
      })
      .select()
      .single();
    
    if (conversationError) {
      console.error('Error creating conversation:', conversationError);
      process.exit(1);
    }
    
    console.log('Conversation created successfully:', conversationData?.id);
    
    // 6. Verify everything was created
    console.log('\nVerifying project creation...');
    
    // Check project
    const { data: verifyProject, error: verifyProjectError } = await supabase
      .from('projects')
      .select()
      .eq('id', projectId)
      .single();
    
    if (verifyProjectError || !verifyProject) {
      console.error('Project verification failed:', verifyProjectError);
      process.exit(1);
    }
    
    console.log('Project verified successfully');
    
    // Check files
    const { data: verifyFiles, error: verifyFilesError } = await supabase
      .from('extension_files')
      .select()
      .eq('project_id', projectId);
    
    if (verifyFilesError || !verifyFiles || verifyFiles.length === 0) {
      console.error('Files verification failed:', verifyFilesError);
      process.exit(1);
    }
    
    console.log(`Files verified successfully: ${verifyFiles.length} files found`);
    
    // Check settings
    const { data: verifySettings, error: verifySettingsError } = await supabase
      .from('project_settings')
      .select()
      .eq('project_id', projectId);
    
    if (verifySettingsError || !verifySettings || verifySettings.length === 0) {
      console.error('Settings verification failed:', verifySettingsError);
      process.exit(1);
    }
    
    console.log(`Settings verified successfully: ${verifySettings.length} settings found`);
    
    // Check conversation
    const { data: verifyConversation, error: verifyConversationError } = await supabase
      .from('conversations')
      .select()
      .eq('project_id', projectId);
    
    if (verifyConversationError || !verifyConversation || verifyConversation.length === 0) {
      console.error('Conversation verification failed:', verifyConversationError);
      process.exit(1);
    }
    
    console.log(`Conversation verified successfully: ${verifyConversation.length} conversations found`);
    
    // 7. Clean up test data
    console.log('\nCleaning up test data...');
    
    // Delete conversation
    await supabase.from('conversations').delete().eq('project_id', projectId);
    
    // Delete settings
    await supabase.from('project_settings').delete().eq('project_id', projectId);
    
    // Delete files
    await supabase.from('extension_files').delete().eq('project_id', projectId);
    
    // Delete project
    await supabase.from('projects').delete().eq('id', projectId);
    
    console.log('Test data cleaned up successfully');
    console.log('\nFinal verification completed successfully!');
    
  } catch (error) {
    console.error('Unexpected error during verification:', error);
    process.exit(1);
  }
}

finalVerifyProjectCreation(); 