const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in environment variables');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function initializeDatabase() {
  try {
    // Read and execute the initialization SQL
    const initSql = fs.readFileSync(
      path.join(__dirname, '..', 'supabase', 'migrations', '20240319000000_init_functions.sql'),
      'utf8'
    );

    const { data, error } = await supabase
      .from('_sqlexec')
      .insert({ query: initSql })
      .select();

    if (error) {
      if (error.message.includes('relation "_sqlexec" does not exist')) {
        // Create the _sqlexec table if it doesn't exist
        await supabase.rpc('exec_sql', {
          sql: `
            CREATE TABLE IF NOT EXISTS _sqlexec (
              id SERIAL PRIMARY KEY,
              query TEXT NOT NULL,
              executed_at TIMESTAMPTZ DEFAULT NOW()
            );
          `
        });
        // Try the insert again
        const retryResult = await supabase
          .from('_sqlexec')
          .insert({ query: initSql })
          .select();
        
        if (retryResult.error) {
          throw retryResult.error;
        }
      } else {
        throw error;
      }
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

async function runMigrations() {
  try {
    // Initialize the database first
    await initializeDatabase();

    // Get all migration files except the init file
    const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql') && !file.includes('init_functions'))
      .sort();

    console.log('Found migration files:', files);

    // Run each migration
    for (const file of files) {
      console.log(`Running migration: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      
      // Execute the SQL directly through the _sqlexec table
      const { error } = await supabase
        .from('_sqlexec')
        .insert({ query: sql })
        .select();
      
      if (error) {
        console.error(`Error running migration ${file}:`, error);
        process.exit(1);
      }
      
      console.log(`Successfully ran migration: ${file}`);
    }

    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  }
}

runMigrations(); 