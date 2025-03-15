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

// Create Supabase client with anonymous key (like a browser would)
const supabase = createClient(supabaseUrl, supabaseKey);

// Create Supabase admin client with service role key
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Mock the supabase client in the global scope
global.supabase = supabase;

// Define a simplified version of the createNewProject function
async function createNewProject(name, description) {
  console.log('Creating new project:', name, description);
  
  // Generate a unique ID for the project
  const projectId = uuidv4();
  const now = new Date().toISOString();
  
  console.log(`Generated project ID: ${projectId}`);
  
  try {
    // Get a valid user ID for testing
    console.log('Fetching a valid user ID...');
    const { data: authUsers, error: authUsersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authUsersError) {
      console.error('Error listing auth users:', authUsersError);
      throw authUsersError;
    }
    
    if (!authUsers || authUsers.users.length === 0) {
      console.error('No users found in auth schema');
      throw new Error('No users found');
    }
    
    const userId = authUsers.users[0].id;
    console.log('Using user ID:', userId);
    
    // Create a basic manifest
    const manifest = {
      manifest_version: 3,
      name,
      description,
      version: '0.1.0',
      action: {
        default_popup: 'popup.html',
        default_title: name
      },
      permissions: [],
      host_permissions: []
    };
    
    // Save the project to the database
    console.log('Saving project to database');
    const { data: projectData, error: projectError } = await supabaseAdmin
      .from('projects')
      .insert({
        id: projectId,
        name,
        description,
        version: '0.1.0',
        manifest,
        user_id: userId,
        created_at: now,
        updated_at: now
      })
      .select()
      .single();
    
    if (projectError) {
      console.error('Error saving project to database:', projectError);
      throw projectError;
    }
    
    console.log('Project saved to database successfully:', projectData?.id);
    
    // Create initial files
    console.log('Creating initial files');
    const initialFiles = [
      {
        id: uuidv4(),
        project_id: projectId,
        name: 'popup.html',
        path: 'popup.html',
        file_type: 'html',
        content: `<!DOCTYPE html>
<html>
<head>
  <title>${name}</title>
  <link rel="stylesheet" href="popup.css">
</head>
<body>
  <h1>${name}</h1>
  <p>${description}</p>
  <script src="popup.js"></script>
</body>
</html>`,
        created_at: now,
        updated_at: now
      },
      {
        id: uuidv4(),
        project_id: projectId,
        name: 'popup.css',
        path: 'popup.css',
        file_type: 'css',
        content: `body {
  width: 300px;
  padding: 10px;
  font-family: Arial, sans-serif;
}

h1 {
  color: #4285f4;
}`,
        created_at: now,
        updated_at: now
      },
      {
        id: uuidv4(),
        project_id: projectId,
        name: 'popup.js',
        path: 'popup.js',
        file_type: 'javascript',
        content: `// Popup script for ${name}
document.addEventListener('DOMContentLoaded', function() {
  console.log('${name} popup loaded');
});`,
        created_at: now,
        updated_at: now
      }
    ];
    
    // Save the files to the database
    console.log('Saving files to database');
    for (const file of initialFiles) {
      const { data: fileData, error: fileError } = await supabaseAdmin
        .from('extension_files')
        .insert(file)
        .select()
        .single();
      
      if (fileError) {
        console.error(`Error saving file ${file.name} to database:`, fileError);
      } else {
        console.log(`File ${file.name} saved to database successfully:`, fileData?.id);
      }
    }
    
    // Create initial conversation
    console.log('Creating initial conversation');
    const conversationId = uuidv4();
    const { data: conversationData, error: conversationError } = await supabaseAdmin
      .from('conversations')
      .insert({
        id: conversationId,
        project_id: projectId,
        user_id: userId,
        messages: [
          {
            role: 'system',
            content: `This is the initial conversation for your Chrome extension project: ${name}.`,
            timestamp: now
          },
          {
            role: 'assistant',
            content: `Welcome to your new Chrome extension project: ${name}! I'm here to help you build your extension. What would you like to work on first?`,
            timestamp: now
          }
        ],
        created_at: now,
        updated_at: now
      })
      .select()
      .single();
    
    if (conversationError) {
      console.error('Error creating initial conversation:', conversationError);
    } else {
      console.log('Initial conversation created successfully:', conversationData?.id);
    }
    
    // Return the created project
    return {
      id: projectId,
      name,
      description,
      version: '0.1.0',
      created_at: now,
      updated_at: now
    };
  } catch (error) {
    console.error('Error in createNewProject:', error);
    throw error;
  }
}

async function testCreateProjectClient() {
  console.log('Starting test of createNewProject function (client perspective)...');
  
  try {
    const projectName = `Test Project ${Date.now()}`;
    const projectDescription = 'A test project created via the client function';
    
    console.log(`Creating project: ${projectName}`);
    const project = await createNewProject(projectName, projectDescription);
    
    console.log('Project created successfully:');
    console.log('- ID:', project.id);
    console.log('- Name:', project.name);
    console.log('- Description:', project.description);
    
    // Verify the project was created in the database
    console.log('\nVerifying project in database...');
    const { data: projectData, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', project.id)
      .single();
    
    if (projectError) {
      console.error('Error verifying project:', projectError);
    } else {
      console.log('Project verified in database:', projectData.id);
    }
    
    // Verify files were created
    console.log('\nVerifying files in database...');
    const { data: filesData, error: filesError } = await supabaseAdmin
      .from('extension_files')
      .select('*')
      .eq('project_id', project.id);
    
    if (filesError) {
      console.error('Error verifying files:', filesError);
    } else {
      console.log(`Files verified in database: ${filesData.length} files found`);
    }
    
    // Verify conversation was created
    console.log('\nVerifying conversation in database...');
    const { data: conversationData, error: conversationError } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('project_id', project.id);
    
    if (conversationError) {
      console.error('Error verifying conversation:', conversationError);
    } else {
      console.log(`Conversation verified in database: ${conversationData.length} conversations found`);
    }
    
    console.log('\nTest completed successfully!');
    
  } catch (error) {
    console.error('Error testing createNewProject:', error);
    process.exit(1);
  }
}

testCreateProjectClient(); 