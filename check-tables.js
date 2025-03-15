// Script to check tables by trying to select from them
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function checkTables() {
  try {
    console.log('=== CHECKING DATABASE TABLES ===');
    
    // List of potential table names to check
    const tablesToCheck = [
      'projects',
      'project_files',
      'files',
      'project_settings',
      'settings',
      'conversations',
      'conversation_messages',
      'messages',
      'deployment_history',
      'deployments'
    ];
    
    // Try to select from each table
    for (const table of tablesToCheck) {
      console.log(`\nChecking table: ${table}`);
      try {
        const { data, error } = await supabaseAdmin
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.error(`❌ Error selecting from ${table}:`, error.message);
        } else {
          console.log(`✅ Table ${table} exists`);
          
          // If the table exists, try to get its structure
          if (data && data.length > 0) {
            console.log(`   Sample data:`, JSON.stringify(data[0], null, 2));
            console.log(`   Columns:`, Object.keys(data[0]).join(', '));
          } else {
            console.log(`   Table is empty`);
            
            // Try to insert a dummy record to see the structure
            console.log(`   Attempting to insert a dummy record to check structure...`);
            
            // Different insert data based on the table
            let insertData = {};
            let insertResult;
            
            if (table === 'projects') {
              insertData = {
                id: 'dummy-id-to-be-deleted',
                name: 'Dummy Project',
                description: 'A dummy project to check structure',
                user_id: 'dummy-user-id'
              };
              insertResult = await supabaseAdmin.from(table).insert(insertData);
            } else if (table === 'project_files' || table === 'files') {
              insertData = {
                id: 'dummy-id-to-be-deleted',
                project_id: 'dummy-project-id',
                name: 'dummy.txt',
                content: 'Dummy content'
              };
              insertResult = await supabaseAdmin.from(table).insert(insertData);
            } else if (table === 'project_settings' || table === 'settings') {
              insertData = {
                project_id: 'dummy-project-id',
                key: 'dummy_key',
                value: { dummy: true }
              };
              insertResult = await supabaseAdmin.from(table).insert(insertData);
            } else if (table === 'conversations') {
              insertData = {
                project_id: 'dummy-project-id',
                messages: [{ role: 'system', content: 'Dummy message' }]
              };
              insertResult = await supabaseAdmin.from(table).insert(insertData);
            }
            
            if (insertResult && insertResult.error) {
              console.log(`   Insert error:`, insertResult.error.message);
              
              // Try to get the error details to understand the structure
              if (insertResult.error.message.includes('violates foreign key constraint')) {
                console.log(`   Table has foreign key constraints`);
              } else if (insertResult.error.message.includes('null value in column')) {
                console.log(`   Required columns:`, insertResult.error.message);
              } else if (insertResult.error.message.includes('column') && insertResult.error.message.includes('does not exist')) {
                console.log(`   Column mismatch:`, insertResult.error.message);
              }
            } else {
              console.log(`   Insert successful, cleaning up...`);
              
              // Clean up the dummy record
              if (table === 'projects' || table === 'project_files' || table === 'files') {
                await supabaseAdmin.from(table).delete().eq('id', 'dummy-id-to-be-deleted');
              } else if (table === 'project_settings' || table === 'settings') {
                await supabaseAdmin.from(table).delete().eq('project_id', 'dummy-project-id').eq('key', 'dummy_key');
              } else if (table === 'conversations') {
                await supabaseAdmin.from(table).delete().eq('project_id', 'dummy-project-id');
              }
            }
          }
        }
      } catch (tableError) {
        console.error(`❌ Error checking ${table}:`, tableError);
      }
    }
    
    console.log('\n=== TABLE CHECK COMPLETE ===');
    
  } catch (error) {
    console.error('Unexpected error during table check:', error);
  }
}

checkTables(); 