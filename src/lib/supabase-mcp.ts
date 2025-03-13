import { createClient } from '@supabase/supabase-js';
// Removing the dependency on @smithery/client
// import { createMcpClient } from '@smithery/client';
import { createId } from '@paralleldrive/cuid2';
import { v4 as uuidv4 } from 'uuid';
// Remove the import from @/types

// Create a Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    fetch: (...args) => {
      console.log('Supabase fetch:', args[0]);
      return fetch(...args);
    }
  }
});

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
  console.log('getProject: Fetching project:', projectId);
  
  // Check if we're in development mode
  const isDev = process.env.NODE_ENV === 'development';
  console.log('getProject: Environment:', isDev ? 'development' : 'production');
  
  // In development mode, try to get the project from localStorage first
  if (isDev && typeof window !== 'undefined') {
    try {
      console.log('getProject: Development mode - checking localStorage');
      const cachedProjectsJson = localStorage.getItem('mockProjects');
      
      if (cachedProjectsJson) {
        const cachedProjects = JSON.parse(cachedProjectsJson);
        const project = cachedProjects.find((p: { id: string }) => p.id === projectId);
        
        if (project) {
          console.log('getProject: Found project in localStorage:', project.name);
          return project;
        } else {
          console.log('getProject: Project not found in localStorage');
        }
      } else {
        console.log('getProject: No projects found in localStorage');
      }
    } catch (error) {
      console.error('getProject: Error reading from localStorage:', error);
      // Continue to database query if localStorage fails
    }
  }
  
  try {
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn('getProject: No authenticated user found');
      
      if (isDev) {
        console.log('getProject: Development mode - returning null');
        return null;
      }
      
      throw new Error('Authentication required to get project');
    }
    
    // Query the database for the project
    console.log(`getProject: Querying database for project ${projectId}`);
    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();
    
    if (error) {
      console.error('getProject: Database error:', error);
      
      if (isDev) {
        console.log('getProject: Development mode - returning null despite error');
        return null;
      }
      
      throw error;
    }
    
    if (!project) {
      console.log('getProject: Project not found in database');
      return null;
    }
    
    console.log('getProject: Found project in database:', project.name);
    
    // Get project files
    const { data: files, error: filesError } = await supabase
      .from('project_files')
      .select('*')
      .eq('project_id', projectId);
    
    if (filesError) {
      console.error('getProject: Error fetching files:', filesError);
      
      if (isDev) {
        console.log('getProject: Development mode - returning project without files');
        return {
          ...project,
          files: []
        };
      }
      
      throw filesError;
    }
    
    // Return the project with files
    const projectWithFiles = {
      ...project,
      files: files || []
    };
    
    console.log('getProject: Successfully fetched project with files');
    
    // In development mode, update localStorage for future use
    if (isDev && typeof window !== 'undefined') {
      try {
        const cachedProjectsJson = localStorage.getItem('mockProjects');
        let cachedProjects = [];
        
        if (cachedProjectsJson) {
          cachedProjects = JSON.parse(cachedProjectsJson);
          // Update the project if it exists, otherwise add it
          const index = cachedProjects.findIndex((p: { id: string }) => p.id === projectId);
          
          if (index >= 0) {
            cachedProjects[index] = projectWithFiles;
          } else {
            cachedProjects.push(projectWithFiles);
          }
        } else {
          cachedProjects = [projectWithFiles];
        }
        
        localStorage.setItem('mockProjects', JSON.stringify(cachedProjects));
        console.log('getProject: Updated localStorage with project');
      } catch (localStorageError) {
        console.error('getProject: Error updating localStorage:', localStorageError);
      }
    }
    
    return projectWithFiles;
  } catch (error) {
    console.error('getProject: Error:', error);
    
    if (isDev) {
      console.log('getProject: Development mode - returning null due to error');
      return null;
    }
    
    throw error;
  }
}

// Get all projects for the current user
export async function getUserProjects(): Promise<ProjectContext[]> {
  console.log('getUserProjects: Fetching user projects');
  
  // Check if we're in development mode
  const isDev = process.env.NODE_ENV === 'development';
  console.log('getUserProjects: Environment:', isDev ? 'development' : 'production');
  
  // In development mode, try to get projects from localStorage first
  if (isDev && typeof window !== 'undefined') {
    try {
      console.log('getUserProjects: Development mode - checking localStorage');
      const cachedProjectsJson = localStorage.getItem('mockProjects');
      
      if (cachedProjectsJson) {
        const cachedProjects = JSON.parse(cachedProjectsJson);
        console.log(`getUserProjects: Found ${cachedProjects.length} projects in localStorage`);
        return cachedProjects;
      } else {
        console.log('getUserProjects: No projects found in localStorage');
      }
    } catch (error) {
      console.error('getUserProjects: Error reading from localStorage:', error);
      // Continue to database query if localStorage fails
    }
  }
  
  try {
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn('getUserProjects: No authenticated user found');
      
      if (isDev) {
        console.log('getUserProjects: Development mode - returning empty array');
        return [];
      }
      
      throw new Error('Authentication required to get projects');
    }
    
    // Query the database for the user's projects
    console.log(`getUserProjects: Querying database for user ${user.id}`);
    const { data: projectsData, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error('getUserProjects: Database error:', error);
      
      if (isDev) {
        console.log('getUserProjects: Development mode - returning empty array despite error');
        return [];
      }
      
      throw error;
    }
    
    if (!projectsData || projectsData.length === 0) {
      console.log('getUserProjects: No projects found in database');
      return [];
    }
    
    console.log(`getUserProjects: Found ${projectsData.length} projects in database`);
    
    // For each project, fetch its files
    const projectsWithFiles = await Promise.all(
      projectsData.map(async (project) => {
        try {
          const { data: filesData, error: filesError } = await supabase
            .from('project_files')
            .select('*')
            .eq('project_id', project.id);
          
          if (filesError) {
            console.error(`getUserProjects: Error fetching files for project ${project.id}:`, filesError);
            return {
              ...project,
              files: []
            };
          }
          
          return {
            ...project,
            files: filesData || []
          };
        } catch (fileError) {
          console.error(`getUserProjects: Error processing files for project ${project.id}:`, fileError);
          return {
            ...project,
            files: []
          };
        }
      })
    );
    
    console.log('getUserProjects: Successfully fetched projects with files');
    return projectsWithFiles;
  } catch (error) {
    console.error('getUserProjects: Error:', error);
    
    if (isDev) {
      console.log('getUserProjects: Development mode - returning empty array due to error');
      return [];
    }
    
    throw error;
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
    console.log('deleteProject: Deleting project:', projectId);
    
    // Delete project files first (foreign key constraint)
    const { error: filesError } = await supabase
      .from('project_files')
      .delete()
      .eq('project_id', projectId);
    
    if (filesError) {
      console.error('deleteProject: Error deleting project files:', filesError);
      return false;
    }
    
    // Delete conversation entries
    const { error: conversationsError } = await supabase
      .from('conversation_entries')
      .delete()
      .eq('project_id', projectId);
    
    if (conversationsError) {
      console.error('deleteProject: Error deleting conversation entries:', conversationsError);
      // Continue anyway, this is not critical
    }
    
    // Delete project settings
    const { error: settingsError } = await supabase
      .from('project_settings')
      .delete()
      .eq('project_id', projectId);
    
    if (settingsError) {
      console.error('deleteProject: Error deleting project settings:', settingsError);
      // Continue anyway, this is not critical
    }
    
    // Delete deployment history
    const { error: deploymentError } = await supabase
      .from('deployment_history')
      .delete()
      .eq('project_id', projectId);
    
    if (deploymentError) {
      console.error('deleteProject: Error deleting deployment history:', deploymentError);
      // Continue anyway, this is not critical
    }
    
    // Delete project
    const { error: projectError } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);
    
    if (projectError) {
      console.error('deleteProject: Error deleting project:', projectError);
      return false;
    }
    
    // In development mode, also clean up localStorage
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      try {
        console.log('deleteProject: Cleaning up localStorage cache');
        const cachedProjectsJson = localStorage.getItem('mockProjects');
        if (cachedProjectsJson) {
          const cachedProjects = JSON.parse(cachedProjectsJson);
          const updatedProjects = cachedProjects.filter((p: ProjectContext) => p.id !== projectId);
          localStorage.setItem('mockProjects', JSON.stringify(updatedProjects));
          console.log('deleteProject: Updated localStorage cache');
        }
      } catch (localStorageError) {
        console.error('deleteProject: Error updating localStorage:', localStorageError);
        // Continue anyway, this is not critical
      }
    }
    
    console.log('deleteProject: Project deleted successfully');
    return true;
  } catch (error) {
    console.error('deleteProject: Error in deleteProject:', error);
    return false;
  }
}

// Create a new project
export async function createNewProject(name: string, description: string): Promise<ProjectContext> {
  console.log('Creating new project:', name, description);
  
  // Generate a unique ID for the project
  const projectId = uuidv4();
  const now = new Date().toISOString();
  
  // Create a basic manifest
  const manifest: ChromeManifest = {
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
  
  // Create initial files
  const initialFiles: ProjectFile[] = [
    {
      id: uuidv4(),
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
      id: uuidv4(),
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
      id: uuidv4(),
      name: 'popup.js',
      path: 'popup.js',
      type: ProjectFileType.JAVASCRIPT,
      content: `// Popup script for ${name}
document.addEventListener('DOMContentLoaded', function() {
  console.log('${name} popup loaded');
});`,
      created_at: now,
      updated_at: now
    },
    {
      id: uuidv4(),
      name: 'manifest.json',
      path: 'manifest.json',
      type: ProjectFileType.JSON,
      content: JSON.stringify(manifest, null, 2),
      created_at: now,
      updated_at: now
    }
  ];
  
  // Create the new project object
  const newProject: ProjectContext = {
    id: projectId,
    name,
    description,
    version: '0.1.0',
    manifest,
    files: initialFiles,
    settings: {
      theme: 'dark',
      auto_save: true
    },
    created_at: now,
    updated_at: now,
    deployment_history: []
  };
  
  try {
    // Check if we're in development mode
    const isDev = process.env.NODE_ENV === 'development';
    console.log('Environment:', isDev ? 'development' : 'production');
    
    // Always save to localStorage first for quick access
    try {
      const existingProjects = JSON.parse(localStorage.getItem('mockProjects') || '[]');
      localStorage.setItem('mockProjects', JSON.stringify([...existingProjects, newProject]));
      console.log('Project saved to localStorage:', projectId);
    } catch (localStorageError) {
      console.error('Failed to save project to localStorage:', localStorageError);
    }
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn('No authenticated user found. Project saved to localStorage only.');
      if (isDev) {
        return newProject; // Return the project in dev mode even without auth
      } else {
        throw new Error('Authentication required to create a project');
      }
    }
    
    // Save the project to the database
    console.log('Saving project to database:', newProject);
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .insert({
        id: projectId,
        name,
        description,
        version: '0.1.0',
        manifest,
        settings: {
          theme: 'dark',
          auto_save: true
        },
        user_id: user.id
      })
      .select()
      .single();
    
    if (projectError) {
      console.error('Error saving project to database:', projectError);
      if (isDev) {
        console.warn('Continuing with localStorage project in development mode');
        return newProject;
      }
      throw projectError;
    }
    
    console.log('Project saved to database:', projectData);
    
    // Save the files to the database
    const filePromises = initialFiles.map(async (file) => {
      const { data: fileData, error: fileError } = await supabase
        .from('project_files')
        .insert({
          id: file.id,
          project_id: projectId,
          name: file.name,
          path: file.path,
          type: file.type,
          content: file.content
        });
      
      if (fileError) {
        console.error(`Error saving file ${file.name} to database:`, fileError);
        return { success: false, error: fileError };
      }
      
      return { success: true, data: fileData };
    });
    
    // Wait for all file saves to complete
    const fileResults = await Promise.all(filePromises);
    const failedFiles = fileResults.filter((result: { success: boolean }) => !result.success);
    
    if (failedFiles.length > 0) {
      console.warn(`${failedFiles.length} files failed to save to database`);
    }
    
    console.log('All files saved to database');
    
    // Return the created project with files
    return {
      ...newProject,
      ...projectData
    };
  } catch (error) {
    console.error('Error in createNewProject:', error);
    
    // In development mode, return the project even if database save fails
    if (process.env.NODE_ENV === 'development') {
      console.warn('Returning localStorage project due to error in development mode');
      return newProject;
    }
    
    throw error;
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
    console.log('saveConversationAndCode: Saving conversation and code for project:', projectId);
    
    // Get the current user
    const user = await supabase.auth.getUser();
    if (!user.data.user) {
      console.error('saveConversationAndCode: User not authenticated');
      throw new Error('User not authenticated');
    }
    
    // Get the project to update
    const project = await getProject(projectId);
    if (!project) {
      console.error('saveConversationAndCode: Project not found:', projectId);
      return false;
    }
    
    // 1. Save conversation entries
    console.log('saveConversationAndCode: Saving conversation entries');
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
        console.error('saveConversationAndCode: Error saving conversation entry:', error);
        // Continue anyway, we'll just have incomplete data
      }
    }
    
    // 2. Save files
    console.log('saveConversationAndCode: Saving files');
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
        console.error('saveConversationAndCode: Error saving file:', error);
        // Continue anyway, we'll just have incomplete data
      }
    }
    
    // 3. Update project's updated_at timestamp
    console.log('saveConversationAndCode: Updating project timestamp');
    const { error } = await supabase
      .from('projects')
      .update({
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId);
    
    if (error) {
      console.error('saveConversationAndCode: Error updating project timestamp:', error);
      // Continue anyway, this is not critical
    }
    
    // 4. If in development mode, also update localStorage for backup
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      try {
        console.log('saveConversationAndCode: Updating localStorage cache');
        // Get existing projects from localStorage
        let cachedProjects: ProjectContext[] = [];
        const cachedProjectsJson = localStorage.getItem('mockProjects');
        if (cachedProjectsJson) {
          cachedProjects = JSON.parse(cachedProjectsJson);
        }
        
        // Find and update the project
        const projectIndex = cachedProjects.findIndex(p => p.id === projectId);
        if (projectIndex >= 0) {
          // Update conversation history
          cachedProjects[projectIndex].conversation_history = messages.map(msg => ({
            id: msg.id,
            timestamp: msg.timestamp.toISOString(),
            role: msg.role as 'user' | 'assistant' | 'system',
            content: msg.content,
            metadata: {
              tokens_used: 0,
              files_modified: files.map(f => f.path)
            }
          }));
          
          // Update files
          for (const file of files) {
            const existingFileIndex = cachedProjects[projectIndex].files.findIndex(f => f.path === file.path);
            
            if (existingFileIndex >= 0) {
              // Update existing file
              cachedProjects[projectIndex].files[existingFileIndex] = {
                ...cachedProjects[projectIndex].files[existingFileIndex],
                content: file.content,
                updated_at: file.updatedAt.toISOString()
              };
            } else {
              // Add new file
              cachedProjects[projectIndex].files.push({
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
          
          // Update timestamp
          cachedProjects[projectIndex].updated_at = new Date().toISOString();
          
          // Save back to localStorage
          localStorage.setItem('mockProjects', JSON.stringify(cachedProjects));
          console.log('saveConversationAndCode: Updated localStorage cache');
        }
      } catch (error) {
        console.error('saveConversationAndCode: Error updating localStorage:', error);
      }
    }
    
    console.log('saveConversationAndCode: Successfully saved conversation and code');
    return true;
  } catch (error) {
    console.error('saveConversationAndCode: Error in saveConversationAndCode:', error);
    return false;
  }
}

// Update project details (name and description)
export async function updateProjectDetails(
  projectId: string,
  name: string,
  description: string
): Promise<boolean> {
  try {
    console.log('updateProjectDetails: Updating project:', projectId);
    
    // Update project data
    const { error: projectError } = await supabase
      .from('projects')
      .update({
        name,
        description,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId);
    
    if (projectError) {
      console.error('updateProjectDetails: Error updating project:', projectError);
      return false;
    }
    
    // In development mode, also update localStorage
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      try {
        console.log('updateProjectDetails: Updating localStorage cache');
        const cachedProjectsJson = localStorage.getItem('mockProjects');
        if (cachedProjectsJson) {
          const cachedProjects = JSON.parse(cachedProjectsJson);
          const updatedProjects = cachedProjects.map((p: ProjectContext) => {
            if (p.id === projectId) {
              return {
                ...p,
                name,
                description,
                updated_at: new Date().toISOString()
              };
            }
            return p;
          });
          localStorage.setItem('mockProjects', JSON.stringify(updatedProjects));
          console.log('updateProjectDetails: Updated localStorage cache');
        }
      } catch (localStorageError) {
        console.error('updateProjectDetails: Error updating localStorage:', localStorageError);
        // Continue anyway, this is not critical
      }
    }
    
    console.log('updateProjectDetails: Project updated successfully');
    return true;
  } catch (error) {
    console.error('updateProjectDetails: Error in updateProjectDetails:', error);
    return false;
  }
}