// Script to check the structure of existing tables
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function checkTableStructure() {
  try {
    console.log('=== CHECKING TABLE STRUCTURE ===');
    
    // Get a valid user ID for testing
    console.log('\nGetting a valid user ID...');
    const { data: authUsers, error: authUsersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authUsersError) {
      console.error('Error listing auth users:', authUsersError);
      return;
    }
    
    if (!authUsers || authUsers.users.length === 0) {
      console.error('No users found in auth schema');
      return;
    }
    
    const testUserId = authUsers.users[0].id;
    console.log('Using user ID:', testUserId);
    
    // Create a test project
    console.log('\nCreating a test project to check structure...');
    const projectId = uuidv4();
    const now = new Date().toISOString();
    
    const { data: projectData, error: projectError } = await supabaseAdmin
      .from('projects')
      .insert({
        id: projectId,
        name: 'Structure Test Project',
        description: 'A test project to check table structure',
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
    console.log('Project structure:', Object.keys(projectData).join(', '));
    
    // Check for files table
    console.log('\nChecking for files table...');
    const possibleFilesTables = ['project_files', 'files', 'extension_files'];
    let filesTable = null;
    
    for (const table of possibleFilesTables) {
      try {
        const { error } = await supabaseAdmin
          .from(table)
          .select('*')
          .limit(1);
        
        if (!error) {
          filesTable = table;
          console.log(`Found files table: ${table}`);
          break;
        }
      } catch (e) {
        // Ignore errors
      }
    }
    
    if (!filesTable) {
      console.log('No files table found, checking for custom tables...');
      
      // Try to get all tables
      const { data: allTables, error: allTablesError } = await supabaseAdmin
        .rpc('get_tables');
      
      if (allTablesError) {
        console.error('Error getting all tables:', allTablesError);
      } else if (allTables) {
        console.log('All tables:', allTables);
        
        // Look for tables that might be related to files
        const fileTables = allTables.filter(table => 
          table.toLowerCase().includes('file') || 
          table.toLowerCase().includes('code') ||
          table.toLowerCase().includes('content')
        );
        
        if (fileTables.length > 0) {
          console.log('Potential file tables:', fileTables);
          filesTable = fileTables[0];
        }
      }
    }
    
    // Try to create a file in the files table if found
    if (filesTable) {
      console.log(`\nTrying to create a file in ${filesTable}...`);
      const fileId = uuidv4();
      
      // Try different column combinations
      const fileAttempts = [
        {
          id: fileId,
          project_id: projectId,
          name: 'test.html',
          path: 'test.html',
          type: 'HTML',
          content: '<html><body>Test</body></html>',
          created_at: now,
          updated_at: now
        },
        {
          id: fileId,
          project_id: projectId,
          name: 'test.html',
          content: '<html><body>Test</body></html>'
        },
        {
          id: fileId,
          project_id: projectId,
          filename: 'test.html',
          content: '<html><body>Test</body></html>'
        }
      ];
      
      let fileSuccess = false;
      
      for (const attempt of fileAttempts) {
        const { data: fileData, error: fileError } = await supabaseAdmin
          .from(filesTable)
          .insert(attempt)
          .select()
          .single();
        
        if (!fileError) {
          console.log('File created successfully with structure:', Object.keys(fileData).join(', '));
          fileSuccess = true;
          break;
        } else {
          console.log('File creation attempt failed:', fileError.message);
        }
      }
      
      if (!fileSuccess) {
        console.log('Could not determine the correct file structure');
      }
    } else {
      console.log('No files table found');
    }
    
    // Check conversations table structure
    console.log('\nChecking conversations table structure...');
    const { data: convData, error: convError } = await supabaseAdmin
      .from('conversations')
      .insert({
        project_id: projectId,
        messages: [{ role: 'system', content: 'Test message', timestamp: now }],
        created_at: now,
        updated_at: now
      })
      .select()
      .single();
    
    if (convError) {
      console.log('Error creating conversation:', convError.message);
      
      // Try without title
      const { data: convData2, error: convError2 } = await supabaseAdmin
        .from('conversations')
        .insert({
          project_id: projectId,
          messages: [{ role: 'system', content: 'Test message', timestamp: now }]
        })
        .select()
        .single();
      
      if (convError2) {
        console.log('Second attempt failed:', convError2.message);
      } else {
        console.log('Conversation created successfully with structure:', Object.keys(convData2).join(', '));
      }
    } else {
      console.log('Conversation created successfully with structure:', Object.keys(convData).join(', '));
    }
    
    // Clean up
    console.log('\nCleaning up test data...');
    
    // Delete files if created
    if (filesTable) {
      await supabaseAdmin
        .from(filesTable)
        .delete()
        .eq('project_id', projectId);
    }
    
    // Delete conversations
    await supabaseAdmin
      .from('conversations')
      .delete()
      .eq('project_id', projectId);
    
    // Delete project settings
    await supabaseAdmin
      .from('project_settings')
      .delete()
      .eq('project_id', projectId);
    
    // Delete project
    await supabaseAdmin
      .from('projects')
      .delete()
      .eq('id', projectId);
    
    console.log('Test data cleaned up');
    console.log('\n=== STRUCTURE CHECK COMPLETE ===');
    
  } catch (error) {
    console.error('Unexpected error during structure check:', error);
  }
}

checkTableStructure(); 