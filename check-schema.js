// Script to check the actual database schema
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchema() {
  try {
    console.log('=== CHECKING DATABASE SCHEMA ===');
    
    // List all tables in the database
    console.log('\nListing all tables:');
    const { data: tables, error: tablesError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (tablesError) {
      console.error('Error listing tables:', tablesError);
    } else {
      console.log('Tables found:');
      tables.forEach(table => {
        console.log(`- ${table.table_name}`);
      });
    }
    
    // Check for tables that might be related to files
    console.log('\nChecking for file-related tables:');
    const { data: fileTables, error: fileTablesError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .like('table_name', '%file%');
    
    if (fileTablesError) {
      console.error('Error checking file tables:', fileTablesError);
    } else {
      console.log('File-related tables found:');
      fileTables.forEach(table => {
        console.log(`- ${table.table_name}`);
      });
    }
    
    // Check for tables that might be related to conversations
    console.log('\nChecking for conversation-related tables:');
    const { data: convTables, error: convTablesError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .like('table_name', '%conv%');
    
    if (convTablesError) {
      console.error('Error checking conversation tables:', convTablesError);
    } else {
      console.log('Conversation-related tables found:');
      convTables.forEach(table => {
        console.log(`- ${table.table_name}`);
      });
    }
    
    // Check columns in the conversations table
    console.log('\nChecking columns in the conversations table:');
    const { data: convColumns, error: convColumnsError } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_schema', 'public')
      .eq('table_name', 'conversations');
    
    if (convColumnsError) {
      console.error('Error checking conversation columns:', convColumnsError);
    } else {
      console.log('Columns in conversations table:');
      convColumns.forEach(column => {
        console.log(`- ${column.column_name} (${column.data_type})`);
      });
    }
    
    // Check columns in the projects table
    console.log('\nChecking columns in the projects table:');
    const { data: projColumns, error: projColumnsError } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_schema', 'public')
      .eq('table_name', 'projects');
    
    if (projColumnsError) {
      console.error('Error checking project columns:', projColumnsError);
    } else {
      console.log('Columns in projects table:');
      projColumns.forEach(column => {
        console.log(`- ${column.column_name} (${column.data_type})`);
      });
    }
    
    console.log('\n=== SCHEMA CHECK COMPLETE ===');
    
  } catch (error) {
    console.error('Unexpected error during schema check:', error);
  }
}

checkSchema(); 