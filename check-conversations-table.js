// Script to check the exact structure of the conversations table
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function checkConversationsTable() {
  try {
    console.log('=== CHECKING CONVERSATIONS TABLE ===');
    
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
        name: 'Conversations Test Project',
        description: 'A test project to check conversations table',
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
    
    // Try to get the column names from the conversations table
    console.log('\nTrying to get column names from conversations table...');
    
    // Try different combinations of required fields
    const conversationId = uuidv4();
    const testCases = [
      {
        id: conversationId,
        project_id: projectId,
        user_id: testUserId,
        messages: [{ role: 'system', content: 'Test message', timestamp: now }],
        created_at: now,
        updated_at: now
      },
      {
        id: conversationId,
        project_id: projectId,
        user_id: testUserId,
        messages: [{ role: 'system', content: 'Test message', timestamp: now }]
      },
      {
        id: conversationId,
        project_id: projectId,
        user_id: testUserId,
        title: 'Test Conversation',
        messages: [{ role: 'system', content: 'Test message', timestamp: now }]
      }
    ];
    
    for (let i = 0; i < testCases.length; i++) {
      console.log(`\nAttempt ${i + 1}:`);
      console.log('Fields:', Object.keys(testCases[i]).join(', '));
      
      const { data: convData, error: convError } = await supabaseAdmin
        .from('conversations')
        .insert(testCases[i])
        .select()
        .single();
      
      if (convError) {
        console.log('Error:', convError.message);
        
        // Try to extract information from the error message
        if (convError.message.includes('null value in column')) {
          const match = convError.message.match(/null value in column "([^"]+)"/);
          if (match) {
            console.log(`Required column: ${match[1]}`);
          }
        } else if (convError.message.includes('does not exist')) {
          const match = convError.message.match(/column "([^"]+)" of relation/);
          if (match) {
            console.log(`Column does not exist: ${match[1]}`);
          }
        }
      } else {
        console.log('Success! Conversation created with structure:');
        console.log(Object.keys(convData).join(', '));
        
        // Clean up the test conversation
        await supabaseAdmin
          .from('conversations')
          .delete()
          .eq('id', conversationId);
        
        break;
      }
    }
    
    // Try to get the structure by querying an existing conversation
    console.log('\nTrying to query an existing conversation...');
    const { data: existingConvs, error: existingConvsError } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .limit(1);
    
    if (existingConvsError) {
      console.log('Error querying existing conversations:', existingConvsError.message);
    } else if (existingConvs && existingConvs.length > 0) {
      console.log('Existing conversation structure:');
      console.log(Object.keys(existingConvs[0]).join(', '));
    } else {
      console.log('No existing conversations found');
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

checkConversationsTable(); 