// Script to test the createNewProject function directly
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

// Set up global variables needed by the function
global.window = {
  localStorage: {
    getItem: () => '[]',
    setItem: () => {}
  }
};

// Mock Next.js environment variables
process.env.NODE_ENV = 'development';

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local file');
  process.exit(1);
}

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Keys available:', !!supabaseKey && !!supabaseServiceKey);

// Import the createNewProject function
const { createNewProject } = require('./dist/lib/supabase-mcp');

async function testCreateProject() {
  console.log('Starting test of createNewProject function...');
  
  try {
    const projectName = `Test Project ${Date.now()}`;
    const projectDescription = 'A test project created via the application function';
    
    console.log(`Creating project: ${projectName}`);
    const project = await createNewProject(projectName, projectDescription);
    
    console.log('Project created successfully:');
    console.log('- ID:', project.id);
    console.log('- Name:', project.name);
    console.log('- Description:', project.description);
    console.log('- Files:', project.files.length);
    
    // Clean up (optional)
    console.log('\nNote: This test does not clean up the created project.');
    console.log('You may want to manually delete it from the database.');
    
  } catch (error) {
    console.error('Error testing createNewProject:', error);
    process.exit(1);
  }
}

testCreateProject(); 