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

async function testDatabaseConnection() {
  console.log('Testing database connection...');
  
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
    
    // 2. Create a test project directly
    const projectId = uuidv4();
    const now = new Date().toISOString();
    const projectName = `Test Project ${Date.now()}`;
    const projectDescription = 'A test project for database connection';
    
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
    
    // 3. Create a test file
    const fileId = uuidv4();
    const fileName = 'popup.html';
    
    console.log('Creating test file...');
    const { data: fileData, error: fileError } = await supabase
      .from('extension_files')
      .insert({
        id: fileId,
        project_id: projectId,
        name: fileName,
        path: fileName,
        file_type: 'html',
        content: '<html><body><h1>Test</h1></body></html>',
        created_at: now,
        updated_at: now
      })
      .select()
      .single();
    
    if (fileError) {
      console.error('Error creating file:', fileError);
      process.exit(1);
    }
    
    console.log('File created successfully:', fileData?.id);
    
    // 4. Create a test conversation
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
    
    // 5. Clean up test data
    console.log('\nCleaning up test data...');
    
    // Delete conversation
    await supabase.from('conversations').delete().eq('project_id', projectId);
    
    // Delete files
    await supabase.from('extension_files').delete().eq('project_id', projectId);
    
    // Delete project
    await supabase.from('projects').delete().eq('id', projectId);
    
    console.log('Test data cleaned up successfully');
    console.log('\nDatabase connection test completed successfully!');
    
  } catch (error) {
    console.error('Unexpected error during test:', error);
    process.exit(1);
  }
}

testDatabaseConnection(); 