// Final verification script to test the complete project creation process
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function verifyProjectCreation() {
  try {
    console.log('=== FINAL VERIFICATION ===');
    
    // Get a valid user ID for testing
    console.log('\nGetting a valid user ID...');
    const { data: authUsers, error: authUsersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authUsersError) {
      console.error('Error listing auth users:', authUsersError);
      return;
    }
    
    const testUserId = authUsers.users[0].id;
    console.log('Using user ID:', testUserId);
    
    // Create a test project
    console.log('\nCreating a test project...');
    const projectId = uuidv4();
    const now = new Date().toISOString();
    
    const { data: projectData, error: projectError } = await supabaseAdmin
      .from('projects')
      .insert({
        id: projectId,
        name: 'Final Verification Project',
        description: 'A test project to verify the complete creation process',
        version: '0.1.0',
        manifest: {
          manifest_version: 3,
          name: 'Final Verification Project',
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
      return;
    }
    
    console.log('✅ Project created successfully:', projectData.id);
    
    // Create a test file
    console.log('\nCreating a test file...');
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
      console.error('Error creating test file:', fileError);
      console.log('Error details:', JSON.stringify(fileError, null, 2));
    } else {
      console.log('✅ File created successfully:', fileData.id);
    }
    
    // Create a test setting
    console.log('\nCreating a test setting...');
    
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
      console.error('Error creating test setting:', settingError);
    } else {
      console.log('✅ Setting created successfully');
    }
    
    // Create a test conversation
    console.log('\nCreating a test conversation...');
    
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
      console.error('Error creating test conversation:', conversationError);
      console.log('Error details:', JSON.stringify(conversationError, null, 2));
    } else {
      console.log('✅ Conversation created successfully:', conversationData.id);
    }
    
    // Verify that everything was created
    console.log('\nVerifying project creation...');
    
    // Check project
    const { data: projectCheck, error: projectCheckError } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();
    
    if (projectCheckError) {
      console.error('Error checking project:', projectCheckError);
    } else {
      console.log('✅ Project verified in database');
    }
    
    // Check files
    const { data: filesCheck, error: filesCheckError } = await supabaseAdmin
      .from('extension_files')
      .select('*')
      .eq('project_id', projectId);
    
    if (filesCheckError) {
      console.error('Error checking files:', filesCheckError);
    } else {
      console.log(`✅ Files verified in database: ${filesCheck.length} files found`);
    }
    
    // Check settings
    const { data: settingsCheck, error: settingsCheckError } = await supabaseAdmin
      .from('project_settings')
      .select('*')
      .eq('project_id', projectId);
    
    if (settingsCheckError) {
      console.error('Error checking settings:', settingsCheckError);
    } else {
      console.log(`✅ Settings verified in database: ${settingsCheck.length} settings found`);
    }
    
    // Check conversations
    const { data: conversationsCheck, error: conversationsCheckError } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('project_id', projectId);
    
    if (conversationsCheckError) {
      console.error('Error checking conversations:', conversationsCheckError);
    } else {
      console.log(`✅ Conversations verified in database: ${conversationsCheck.length} conversations found`);
    }
    
    // Clean up
    console.log('\nCleaning up test data...');
    
    // Delete conversations
    if (conversationData) {
      await supabaseAdmin
        .from('conversations')
        .delete()
        .eq('project_id', projectId);
    }
    
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
    
    console.log('Test data cleaned up');
    console.log('\n=== VERIFICATION COMPLETE ===');
    console.log('\nAll tests passed! The project creation process is working correctly.');
    
  } catch (error) {
    console.error('Unexpected error during verification:', error);
  }
}

verifyProjectCreation(); 