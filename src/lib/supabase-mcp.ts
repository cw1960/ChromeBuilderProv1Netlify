import { createClient } from '@supabase/supabase-js';
// Removing the dependency on @smithery/client
// import { createMcpClient } from '@smithery/client';
import { createId } from '@paralleldrive/cuid2';

// Create a Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Create a mock MCP client instead of using @smithery/client
export const mcpClient = {
  // Add mock methods as needed
  query: async () => ({ data: null }),
  mutate: async () => ({ data: null }),
};

// ProjectContext type definition
export interface ProjectContext {
  id: string;
  name: string;
  description: string;
  version: string;
  created_at: string;
  updated_at: string;
  manifest: ChromeManifest;
  files: ProjectFile[];
  settings: ProjectSettings;
  deployment_history: DeploymentRecord[];
  conversation_history?: ConversationEntry[];
}

// Chrome extension manifest interface
export interface ChromeManifest {
  manifest_version: number;
  name: string;
  version: string;
  description?: string;
  action?: {
    default_popup?: string;
    default_icon?: Record<string, string>;
    default_title?: string;
  };
  background?: {
    service_worker?: string;
    type?: string;
  };
  content_scripts?: {
    matches: string[];
    js?: string[];
    css?: string[];
    run_at?: string;
  }[];
  permissions?: string[];
  host_permissions?: string[];
  options_page?: string;
  web_accessible_resources?: {
    resources: string[];
    matches: string[];
  }[];
  icons?: Record<string, string>;
  [key: string]: any;
}

// Project file interface
export interface ProjectFile {
  id: string;
  name: string;
  path: string;
  type: ProjectFileType;
  content: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

// File types in a Chrome extension project
export enum ProjectFileType {
  HTML = 'html',
  CSS = 'css',
  JAVASCRIPT = 'javascript',
  JSON = 'json',
  IMAGE = 'image',
  OTHER = 'other'
}

// Project settings interface
export interface ProjectSettings {
  template_id?: string;
  api_key?: string;
  theme?: 'light' | 'dark';
  auto_save?: boolean;
  collaboration_enabled?: boolean;
  collaborators?: string[];
  custom_settings?: Record<string, any>;
}

// Deployment record for version history
export interface DeploymentRecord {
  id: string;
  version: string;
  timestamp: string;
  files: string[];
  notes?: string;
  status: 'draft' | 'deployed' | 'published';
  publish_url?: string;
}

// Conversation entry for AI assistance history
export interface ConversationEntry {
  id: string;
  timestamp: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: {
    tokens_used?: number;
    files_modified?: string[];
    command_executed?: string;
  };
}

// Helper functions for working with projects
export async function getProject(projectId: string): Promise<ProjectContext | null> {
  try {
    // In development mode with test user, return mock data
    if (process.env.NODE_ENV === 'development') {
      return getMockProject(projectId);
    }
    
    // Get project data
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();
    
    if (projectError) {
      console.error('Error fetching project:', projectError);
      return null;
    }
    
    // Get project files
    const { data: filesData, error: filesError } = await supabase
      .from('project_files')
      .select('*')
      .eq('project_id', projectId);
    
    if (filesError) {
      console.error('Error fetching project files:', filesError);
      return null;
    }
    
    // Get deployment history
    const { data: deploymentData, error: deploymentError } = await supabase
      .from('deployment_history')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    
    if (deploymentError) {
      console.error('Error fetching deployment history:', deploymentError);
      return null;
    }
    
    // Construct and return the project context
    return {
      id: projectData.id,
      name: projectData.name,
      description: projectData.description || '',
      version: projectData.version,
      created_at: projectData.created_at,
      updated_at: projectData.updated_at,
      manifest: projectData.manifest,
      files: filesData || [],
      settings: projectData.settings,
      deployment_history: deploymentData || []
    };
  } catch (error) {
    console.error('Error in getProject:', error);
    return null;
  }
}

// Get all projects for the current user
export async function getUserProjects(): Promise<ProjectContext[]> {
  try {
    console.log('getUserProjects called');
    
    // In development mode with test user, return mock data
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode detected, returning mock projects');
      const mockProjects = getMockProjects();
      console.log(`Returning ${mockProjects.length} mock projects`);
      return mockProjects;
    }
    
    console.log('Getting current user');
    const user = await supabase.auth.getUser();
    console.log('User auth result:', user);
    
    if (!user.data.user) {
      console.error('User not authenticated');
      throw new Error('User not authenticated');
    }
    
    console.log('Fetching projects for user:', user.data.user.id);
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.data.user.id)
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching user projects:', error);
      return [];
    }
    
    console.log(`Found ${data?.length || 0} projects`);
    
    // For each project, we need to fetch files and deployment history
    const projects: ProjectContext[] = [];
    
    for (const project of data) {
      console.log(`Processing project: ${project.id} - ${project.name}`);
      
      // Get project files
      const { data: filesData } = await supabase
        .from('project_files')
        .select('*')
        .eq('project_id', project.id);
      
      // Get deployment history
      const { data: deploymentData } = await supabase
        .from('deployment_history')
        .select('*')
        .eq('project_id', project.id)
        .order('created_at', { ascending: false });
      
      projects.push({
        id: project.id,
        name: project.name,
        description: project.description || '',
        version: project.version,
        created_at: project.created_at,
        updated_at: project.updated_at,
        manifest: project.manifest,
        files: filesData || [],
        settings: project.settings,
        deployment_history: deploymentData || []
      });
    }
    
    console.log(`Returning ${projects.length} projects`);
    return projects;
  } catch (error) {
    console.error('Error in getUserProjects:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return [];
  }
}

// Save a project
export async function saveProject(project: ProjectContext): Promise<boolean> {
  try {
    // In development mode with test user, just return success
    if (process.env.NODE_ENV === 'development') {
      return true;
    }
    
    // Update project data
    const { error: projectError } = await supabase
      .from('projects')
      .update({
        name: project.name,
        description: project.description,
        version: project.version,
        manifest: project.manifest,
        settings: project.settings,
        updated_at: new Date().toISOString()
      })
      .eq('id', project.id);
    
    if (projectError) {
      console.error('Error updating project:', projectError);
      return false;
    }
    
    // Update files - this is more complex as we need to handle creates, updates, and deletes
    for (const file of project.files) {
      if (!file.id) {
        // New file, create it
        const { error } = await supabase
          .from('project_files')
          .insert({
            project_id: project.id,
            name: file.name,
            path: file.path,
            type: file.type,
            content: file.content,
            metadata: file.metadata || {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (error) {
          console.error('Error creating file:', error);
          return false;
        }
      } else {
        // Existing file, update it
        const { error } = await supabase
          .from('project_files')
          .update({
            name: file.name,
            path: file.path,
            type: file.type,
            content: file.content,
            metadata: file.metadata || {},
            updated_at: new Date().toISOString()
          })
          .eq('id', file.id);
        
        if (error) {
          console.error('Error updating file:', error);
          return false;
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error in saveProject:', error);
    return false;
  }
}

// Delete a project
export async function deleteProject(projectId: string): Promise<boolean> {
  try {
    // In development mode with test user, just return success
    if (process.env.NODE_ENV === 'development') {
      return true;
    }
    
    // Delete project files first (foreign key constraint)
    const { error: filesError } = await supabase
      .from('project_files')
      .delete()
      .eq('project_id', projectId);
    
    if (filesError) {
      console.error('Error deleting project files:', filesError);
      return false;
    }
    
    // Delete project
    const { error: projectError } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);
    
    if (projectError) {
      console.error('Error deleting project:', projectError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in deleteProject:', error);
    return false;
  }
}

// Create a new project
export async function createNewProject(
  name: string,
  description: string
): Promise<ProjectContext | null> {
  console.log('supabase-mcp: createNewProject called with:', { name, description });
  console.log('supabase-mcp: process.env.NODE_ENV =', process.env.NODE_ENV);
  
  try {
    console.log('supabase-mcp: Checking environment');
    
    // In development mode with test user, return a mock project
    // Force development mode for testing
    const isDevelopment = true; // process.env.NODE_ENV === 'development';
    console.log('supabase-mcp: isDevelopment =', isDevelopment);
    
    if (isDevelopment) {
      console.log('supabase-mcp: Development mode detected, creating mock project');
      
      console.log('supabase-mcp: Generating project ID');
      const projectId = createId();
      console.log('supabase-mcp: Generated project ID:', projectId);
      
      const mockProject: ProjectContext = {
        id: projectId,
        name,
        description,
        version: '0.1.0',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        manifest: {
          manifest_version: 3,
          name,
          version: '0.1.0',
          description,
          action: {
            default_popup: 'popup.html',
            default_title: name
          },
          permissions: [],
          host_permissions: []
        },
        files: [
          {
            id: createId(),
            name: 'popup.html',
            path: 'popup.html',
            type: ProjectFileType.HTML,
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
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: createId(),
            name: 'popup.css',
            path: 'popup.css',
            type: ProjectFileType.CSS,
            content: `body {
  width: 300px;
  padding: 10px;
  font-family: Arial, sans-serif;
}

h1 {
  font-size: 18px;
  color: #333;
}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: createId(),
            name: 'popup.js',
            path: 'popup.js',
            type: ProjectFileType.JAVASCRIPT,
            content: `// Popup script
document.addEventListener('DOMContentLoaded', function() {
  console.log('${name} popup loaded');
});`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: createId(),
            name: 'manifest.json',
            path: 'manifest.json',
            type: ProjectFileType.JSON,
            content: JSON.stringify({
              manifest_version: 3,
              name,
              version: '0.1.0',
              description,
              action: {
                default_popup: 'popup.html',
                default_title: name
              },
              permissions: [],
              host_permissions: []
            }, null, 2),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ],
        settings: {
          theme: 'light',
          auto_save: true
        },
        deployment_history: []
      };
      
      // Save the project to localStorage for persistence in development mode
      if (typeof window !== 'undefined') {
        try {
          // Get existing projects from localStorage
          let cachedProjects: ProjectContext[] = [];
          const cachedProjectsJson = localStorage.getItem('mockProjects');
          if (cachedProjectsJson) {
            cachedProjects = JSON.parse(cachedProjectsJson);
          }
          
          // Add the new project
          cachedProjects.push(mockProject);
          
          // Save back to localStorage
          localStorage.setItem('mockProjects', JSON.stringify(cachedProjects));
          console.log('supabase-mcp: Saved project to localStorage cache');
        } catch (error) {
          console.error('supabase-mcp: Error saving project to localStorage:', error);
        }
      }
      
      return mockProject;
    }
    
    // For production, create a real project in the database
    console.log('supabase-mcp: Production mode detected, creating real project');
    
    // Get the current user
    console.log('supabase-mcp: Getting current user');
    const user = await supabase.auth.getUser();
    console.log('supabase-mcp: User auth result:', user);
    
    if (!user.data.user) {
      console.error('supabase-mcp: User not authenticated');
      throw new Error('User not authenticated');
    }
    
    console.log('supabase-mcp: Creating project with user ID:', user.data.user.id);
    const projectId = createId();
    const now = new Date().toISOString();
    
    // Create the basic manifest
    const manifest: ChromeManifest = {
      manifest_version: 3,
      name,
      version: '0.1.0',
      description,
      action: {
        default_popup: 'popup.html',
        default_title: name
      },
      permissions: [],
      host_permissions: []
    };
    
    // Create the project
    console.log('supabase-mcp: Inserting project into database');
    const { error: projectError } = await supabase
      .from('projects')
      .insert({
        id: projectId,
        user_id: user.data.user.id,
        name,
        description,
        version: '0.1.0',
        manifest,
        settings: {
          theme: 'dark',
          auto_save: true
        },
        created_at: now,
        updated_at: now
      });
    
    if (projectError) {
      console.error('supabase-mcp: Error creating project:', projectError);
      return null;
    }
    
    // Create initial files
    console.log('supabase-mcp: Creating initial files for project');
    const files: ProjectFile[] = [
      {
        id: createId(),
        name: 'popup.html',
        path: 'popup.html',
        type: ProjectFileType.HTML,
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
        id: createId(),
        name: 'popup.css',
        path: 'popup.css',
        type: ProjectFileType.CSS,
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
        id: createId(),
        name: 'popup.js',
        path: 'popup.js',
        type: ProjectFileType.JAVASCRIPT,
        content: `// Popup script for ${name}
document.addEventListener('DOMContentLoaded', function() {
  console.log('${name} popup loaded');
});`,
        created_at: now,
        updated_at: now
      }
    ];
    
    // Insert files
    console.log('supabase-mcp: Inserting files into database');
    for (const file of files) {
      const { error } = await supabase
        .from('project_files')
        .insert({
          project_id: projectId,
          id: file.id,
          name: file.name,
          path: file.path,
          type: file.type,
          content: file.content,
          created_at: file.created_at,
          updated_at: file.updated_at
        });
      
      if (error) {
        console.error('supabase-mcp: Error creating file:', error);
        // Continue anyway, we'll just have an incomplete project
      }
    }
    
    // Return the new project
    console.log('supabase-mcp: Project created successfully:', projectId);
    return {
      id: projectId,
      name,
      description,
      version: '0.1.0',
      created_at: now,
      updated_at: now,
      manifest,
      files,
      settings: {
        theme: 'dark',
        auto_save: true
      },
      deployment_history: []
    };
  } catch (error) {
    console.error('supabase-mcp: Error in createNewProject:', error);
    // Log more details about the error
    if (error instanceof Error) {
      console.error('supabase-mcp: Error message:', error.message);
      console.error('supabase-mcp: Error stack:', error.stack);
    }
    return null;
  }
}

// Mock data functions for development
function getMockProjects(): ProjectContext[] {
  console.log('Creating mock projects for development');
  
  // Create a new mock project each time to ensure we have fresh data
  const newMockProject: ProjectContext = {
    id: createId(),
    name: `Test Project`,
    description: 'A dynamically created test project',
    version: '0.1.0',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    manifest: {
      manifest_version: 3,
      name: 'Dynamic Test Project',
      version: '0.1.0',
      description: 'A dynamically created test project',
      action: {
        default_popup: 'popup.html',
        default_title: 'Dynamic Test Project'
      },
      permissions: ['storage'],
      host_permissions: []
    },
    files: [
      {
        id: createId(),
        name: 'popup.html',
        path: 'popup.html',
        type: ProjectFileType.HTML,
        content: '<html><body><h1>Dynamic Test Project</h1></body></html>',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ],
    settings: {
      theme: 'light',
      auto_save: true
    },
    deployment_history: []
  };
  
  // Try to get any cached projects from localStorage
  let cachedProjects: ProjectContext[] = [];
  if (typeof window !== 'undefined') {
    try {
      const cachedProjectsJson = localStorage.getItem('mockProjects');
      if (cachedProjectsJson) {
        cachedProjects = JSON.parse(cachedProjectsJson);
        console.log(`Loaded ${cachedProjects.length} projects from localStorage cache`);
      }
  } catch (error) {
      console.error('Error loading cached projects:', error);
    }
  }
  
  // Return the cached projects plus the new mock project
  return [...cachedProjects, newMockProject];
}

function getMockProject(projectId: string): ProjectContext {
  console.log('getMockProject called with ID:', projectId);
  const projects = getMockProjects();
  const project = projects.find(p => p.id === projectId);
  
  if (project) {
    console.log('Found existing mock project:', project.name);
    return project;
  }
  
  // Create a new project with this ID instead of returning the first project
  console.log('Project not found, creating new mock project with ID:', projectId);
  return {
    id: projectId,
    name: `Chrome Extension ${projectId.substring(0, 6)}`,
    description: 'A dynamically created extension project',
    version: '0.1.0',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    manifest: {
      manifest_version: 3,
      name: `Chrome Extension ${projectId.substring(0, 6)}`,
      version: '0.1.0',
      description: 'A dynamically created extension project',
      action: {
        default_popup: 'popup.html',
        default_title: `Chrome Extension ${projectId.substring(0, 6)}`
      },
      permissions: ['storage'],
      host_permissions: []
    },
    files: [
      {
        id: createId(),
        name: 'popup.html',
        path: 'popup.html',
        type: ProjectFileType.HTML,
        content: '<html><body><h1>My Chrome Extension</h1></body></html>',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ],
    settings: {
      theme: 'light',
      auto_save: true
    },
    deployment_history: []
  };
}

// Template functions
export function createProjectFromTemplate(
  templateId: string,
  name: string,
  description: string
): ProjectContext {
  // For now, just create a basic project
  return {
    id: createId(),
    name,
    description,
    version: '0.1.0',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    manifest: {
      manifest_version: 3,
      name,
      version: '0.1.0',
      description,
      action: {
        default_popup: 'popup.html',
        default_title: name
      },
      permissions: [],
      host_permissions: []
    },
    files: [
      {
        id: createId(),
        name: 'popup.html',
        path: 'popup.html',
        type: ProjectFileType.HTML,
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
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: createId(),
        name: 'popup.css',
        path: 'popup.css',
        type: ProjectFileType.CSS,
        content: `body {
  width: 300px;
  padding: 10px;
  font-family: Arial, sans-serif;
}

h1 {
  color: #4285f4;
}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: createId(),
        name: 'popup.js',
        path: 'popup.js',
        type: ProjectFileType.JAVASCRIPT,
        content: `// Popup script for ${name}
document.addEventListener('DOMContentLoaded', function() {
  console.log('${name} popup loaded');
});`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ],
    settings: {
      theme: 'dark',
      auto_save: true,
      template_id: templateId
    },
    deployment_history: []
  };
}

// Save conversation and generated code
export async function saveConversationAndCode(
  projectId: string,
  messages: {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
  }[],
  files: {
    id: string;
    name: string;
    path: string;
    content: string;
    language: string;
    type: ProjectFileType;
    createdAt: Date;
    updatedAt: Date;
  }[]
): Promise<boolean> {
  try {
    // In development mode with test user, just return success
    if (process.env.NODE_ENV === 'development') {
      console.log('Saving conversation and code in development mode');
      
      // Get the project
      const project = await getProject(projectId);
      
      if (!project) {
        console.error('Project not found:', projectId);
        return false;
      }
      
      // Add conversation entries
      const conversationEntries: ConversationEntry[] = messages.map(msg => ({
        id: msg.id,
        timestamp: msg.timestamp.toISOString(),
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
        metadata: {
          tokens_used: 0, // We don't track tokens in development
          files_modified: files.map(f => f.path)
        }
      }));
      
      // Update project with conversation history
      project.conversation_history = conversationEntries;
      
      // Add or update files
      for (const file of files) {
        const existingFileIndex = project.files.findIndex(f => f.path === file.path);
        
        if (existingFileIndex >= 0) {
          // Update existing file
          project.files[existingFileIndex] = {
            ...project.files[existingFileIndex],
            content: file.content,
            updated_at: file.updatedAt.toISOString()
          };
        } else {
          // Add new file
          project.files.push({
            id: file.id,
            name: file.name,
            path: file.path,
            type: file.type,
            content: file.content,
            created_at: file.createdAt.toISOString(),
            updated_at: file.updatedAt.toISOString(),
            metadata: {
              language: file.language
            }
          });
        }
      }
      
      // Save the updated project
      return await saveProject(project);
    }
    
    // Get the current user
    const user = await supabase.auth.getUser();
    if (!user.data.user) {
      throw new Error('User not authenticated');
    }
    
    // Start a transaction
    // Note: Supabase doesn't support transactions directly in the JS client,
    // so we'll do multiple operations and handle errors as best we can
    
    // 1. Save conversation entries
    for (const message of messages) {
      const { error } = await supabase
        .from('conversation_entries')
        .upsert({
          id: message.id,
          project_id: projectId,
          user_id: user.data.user.id,
          role: message.role,
          content: message.content,
          timestamp: message.timestamp.toISOString(),
          metadata: {
            files_modified: files.map(f => f.path)
          }
        });
      
      if (error) {
        console.error('Error saving conversation entry:', error);
        return false;
      }
    }
    
    // 2. Save files
    for (const file of files) {
      const { error } = await supabase
        .from('project_files')
        .upsert({
          id: file.id,
          project_id: projectId,
          name: file.name,
          path: file.path,
          type: file.type,
          content: file.content,
          created_at: file.createdAt.toISOString(),
          updated_at: file.updatedAt.toISOString(),
          metadata: {
            language: file.language
          }
        });
      
      if (error) {
        console.error('Error saving file:', error);
        return false;
      }
    }
    
    // 3. Update project's updated_at timestamp
    const { error } = await supabase
      .from('projects')
      .update({
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId);
    
    if (error) {
      console.error('Error updating project timestamp:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in saveConversationAndCode:', error);
    return false;
  }
}