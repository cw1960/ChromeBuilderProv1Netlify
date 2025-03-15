// Script to check the exact structure of the extension_files table
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function checkFilesTable() {
  try {
    console.log('=== CHECKING EXTENSION_FILES TABLE ===');
    
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
        name: 'Files Test Project',
        description: 'A test project to check extension_files table',
        version: '0.1.0',
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
    
    console.log('Project created successfully:', projectData.id);
    
    // Try to get the column names from the extension_files table
    console.log('\nTrying to get column names from extension_files table...');
    
    // Try different combinations of required fields
    const fileId = uuidv4();
    const testCases = [
      {
        id: fileId,
        project_id: projectId,
        name: 'test.html',
        path: 'test.html',
        file_type: 'HTML',
        content: '<html><body>Test</body></html>',
        created_at: now,
        updated_at: now
      },
      {
        id: fileId,
        project_id: projectId,
        name: 'test.html',
        file_type: 'HTML',
        content: '<html><body>Test</body></html>'
      },
      {
        id: fileId,
        project_id: projectId,
        name: 'test.html',
        file_type: 'HTML',
        content: '<html><body>Test</body></html>',
        user_id: testUserId
      }
    ];
    
    for (let i = 0; i < testCases.length; i++) {
      console.log(`\nAttempt ${i + 1}:`);
      console.log('Fields:', Object.keys(testCases[i]).join(', '));
      
      const { data: fileData, error: fileError } = await supabaseAdmin
        .from('extension_files')
        .insert(testCases[i])
        .select()
        .single();
      
      if (fileError) {
        console.log('Error:', fileError.message);
        
        // Try to extract information from the error message
        if (fileError.message.includes('null value in column')) {
          const match = fileError.message.match(/null value in column "([^"]+)"/);
          if (match) {
            console.log(`Required column: ${match[1]}`);
          }
        } else if (fileError.message.includes('does not exist')) {
          const match = fileError.message.match(/column "([^"]+)" of relation/);
          if (match) {
            console.log(`Column does not exist: ${match[1]}`);
          }
        }
      } else {
        console.log('Success! File created with structure:');
        console.log(Object.keys(fileData).join(', '));
        
        // Clean up the test file
        await supabaseAdmin
          .from('extension_files')
          .delete()
          .eq('id', fileId);
        
        break;
      }
    }
    
    // Try to get the structure by querying an existing file
    console.log('\nTrying to query an existing file...');
    const { data: existingFiles, error: existingFilesError } = await supabaseAdmin
      .from('extension_files')
      .select('*')
      .limit(1);
    
    if (existingFilesError) {
      console.log('Error querying existing files:', existingFilesError.message);
    } else if (existingFiles && existingFiles.length > 0) {
      console.log('Existing file structure:');
      console.log(Object.keys(existingFiles[0]).join(', '));
    } else {
      console.log('No existing files found');
    }
    
    // Clean up
    console.log('\nCleaning up test data...');
    await supabaseAdmin
      .from('projects')
      .delete()
      .eq('id', projectId);
    
    console.log('Test data cleaned up');
    console.log('\n=== CHECK COMPLETE ===');
    
  } catch (error) {
    console.error('Unexpected error during check:', error);
  }
}

checkFilesTable(); 