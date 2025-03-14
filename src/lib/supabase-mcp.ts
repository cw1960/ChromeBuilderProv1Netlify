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
    // First try to get the project using the authenticated client
    const { data: { user } } = await supabase.auth.getUser();
    let project = null;
    let error = null;
    
    if (user) {
      console.log(`getProject: Authenticated user found, querying database for project ${projectId}`);
      const result = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();
      
      project = result.data;
      error = result.error;
      
      if (error) {
        console.error('getProject: Error with authenticated query:', error);
      }
    } else {
      console.warn('getProject: No authenticated user found, will try admin client');
    }
    
    // If no project found or error occurred, try using the admin client
    if (!project || error) {
      console.log(`getProject: Trying admin client for project ${projectId}`);
      
      // Initialize Supabase admin client with service role key
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (!supabaseUrl || !supabaseServiceKey) {
        console.error('getProject: Missing Supabase configuration for admin client');
        return null;
      }
      
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
      
      // Query the database for the project using admin client
      const adminResult = await supabaseAdmin
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();
      
      if (adminResult.error) {
        console.error('getProject: Admin client database error:', adminResult.error);
        return null;
      }
      
      project = adminResult.data;
      
      if (!project) {
        console.log('getProject: Project not found with admin client');
        return null;
      }
    }
    
    console.log('getProject: Found project in database:', project.name);
    
    // Get project files using the same client that successfully retrieved the project
    const supabaseClient = user ? supabase : createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    
    const { data: files, error: filesError } = await supabaseClient
      .from('extension_files')
      .select('*')
      .eq('project_id', project.id);
    
    if (filesError) {
      console.error('getProject: Error fetching files:', filesError);
    }
    
    // Get project settings
    const { data: settingsData, error: settingsError } = await supabaseClient
      .from('project_settings')
      .select('*')
      .eq('project_id', project.id);
    
    if (settingsError) {
      console.error('getProject: Error fetching settings:', settingsError);
    }
    
    // Process settings into a more usable format
    const settings = project.settings || {};
    if (settingsData && settingsData.length > 0) {
      settingsData.forEach((setting) => {
        settings[setting.key] = setting.value;
      });
    }
    
    // Get deployment history
    const { data: deploymentHistory, error: deploymentError } = await supabaseClient
      .from('deployment_history')
      .select('*')
      .eq('project_id', project.id)
      .order('created_at', { ascending: false });
    
    if (deploymentError) {
      console.error('getProject: Error fetching deployment history:', deploymentError);
    }
    
    // Get conversations
    const { data: conversations, error: conversationsError } = await supabaseClient
      .from('conversations')
      .select('*')
      .eq('project_id', project.id)
      .order('updated_at', { ascending: false });
    
    if (conversationsError) {
      console.error('getProject: Error fetching conversations:', conversationsError);
    }
    
    // Return the project with all related data
    const projectWithData = {
      ...project,
      files: files || [],
      settings: settings,
      deployment_history: deploymentHistory || [],
      conversation_history: conversations || []
    };
    
    console.log('getProject: Successfully fetched project with all related data');
    
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
            cachedProjects[index] = projectWithData;
          } else {
            cachedProjects.push(projectWithData);
          }
          
          localStorage.setItem('mockProjects', JSON.stringify(cachedProjects));
          console.log('getProject: Updated project in localStorage');
        }
      } catch (localStorageError) {
        console.error('getProject: Error updating localStorage:', localStorageError);
      }
    }
    
    return projectWithData;
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
  let localProjects: ProjectContext[] = [];
  if (isDev && typeof window !== 'undefined') {
    try {
      console.log('getUserProjects: Development mode - checking localStorage');
      const cachedProjectsJson = localStorage.getItem('mockProjects');
      
      if (cachedProjectsJson) {
        localProjects = JSON.parse(cachedProjectsJson);
        console.log(`getUserProjects: Found ${localProjects.length} projects in localStorage`);
        
        // If we're in development mode and have local projects, return them immediately
        // We'll still try to fetch from the database in the background
        if (localProjects.length > 0) {
          console.log('getUserProjects: Returning localStorage projects immediately');
          
          // Try to fetch from database in the background to keep localStorage in sync
          setTimeout(() => {
            fetchProjectsFromDatabase().then(dbProjects => {
              if (dbProjects.length > 0) {
                // Merge local and database projects, preferring database versions
                const mergedProjects = mergeProjects(localProjects, dbProjects);
                localStorage.setItem('mockProjects', JSON.stringify(mergedProjects));
                console.log(`getUserProjects: Updated localStorage with ${mergedProjects.length} merged projects`);
              }
            }).catch(error => {
              console.error('getUserProjects: Background fetch error:', error);
            });
          }, 100);
          
          return localProjects;
        }
      } else {
        console.log('getUserProjects: No projects found in localStorage');
      }
    } catch (error) {
      console.error('getUserProjects: Error reading from localStorage:', error);
      // Continue to database query if localStorage fails
    }
  }
  
  try {
    // Fetch projects from database
    const dbProjects = await fetchProjectsFromDatabase();
    
    // If we have database projects, return them
    if (dbProjects.length > 0) {
      console.log(`getUserProjects: Returning ${dbProjects.length} projects from database`);
      
      // Update localStorage in development mode
      if (isDev && typeof window !== 'undefined') {
        try {
          // Merge with any existing localStorage projects to avoid losing local-only projects
          const mergedProjects = mergeProjects(localProjects, dbProjects);
          localStorage.setItem('mockProjects', JSON.stringify(mergedProjects));
          console.log(`getUserProjects: Updated localStorage with ${mergedProjects.length} projects`);
        } catch (localStorageError) {
          console.error('getUserProjects: Error updating localStorage:', localStorageError);
        }
      }
      
      return dbProjects;
    }
    
    // If we're in development mode and have no database projects, return local projects or empty array
    if (isDev) {
      console.log('getUserProjects: No database projects found, returning localStorage projects or empty array');
      return localProjects;
    }
    
    // No projects found
    console.log('getUserProjects: No projects found');
    return [];
  } catch (error) {
    console.error('getUserProjects: Error:', error);
    
    // In development mode, return localStorage projects if available
    if (isDev && localProjects.length > 0) {
      console.log('getUserProjects: Returning localStorage projects due to error');
      return localProjects;
    }
    
    // In development mode with no localStorage projects, return empty array
    if (isDev) {
      console.log('getUserProjects: Development mode - returning empty array due to error');
      return [];
    }
    
    throw error;
  }
}

// Helper function to fetch projects from database
async function fetchProjectsFromDatabase(): Promise<ProjectContext[]> {
  console.log('fetchProjectsFromDatabase: Fetching projects from database');
  
  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('fetchProjectsFromDatabase: Error getting user:', userError);
      throw userError;
    }
    
    if (!user) {
      console.warn('fetchProjectsFromDatabase: No authenticated user found');
      throw new Error('Authentication required to get projects');
    }
    
    // Query the database for the user's projects
    console.log(`fetchProjectsFromDatabase: Querying database for user ${user.id}`);
    const { data: projectsData, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error('fetchProjectsFromDatabase: Database error:', error);
      throw error;
    }
    
    if (!projectsData || projectsData.length === 0) {
      console.log('fetchProjectsFromDatabase: No projects found in database');
      return [];
    }
    
    console.log(`fetchProjectsFromDatabase: Found ${projectsData.length} projects in database`);
    
    // For each project, fetch its related data
    const projectsWithData = await Promise.all(
      projectsData.map(async (project) => {
        try {
          // Get project files
          const { data: filesData, error: filesError } = await supabase
            .from('extension_files')
            .select('*')
            .eq('project_id', project.id);
          
          if (filesError) {
            console.error(`fetchProjectsFromDatabase: Error fetching files for project ${project.id}:`, filesError);
          }
          
          // Get project settings
          const { data: settingsData, error: settingsError } = await supabase
            .from('project_settings')
            .select('*')
            .eq('project_id', project.id);
          
          if (settingsError) {
            console.error(`fetchProjectsFromDatabase: Error fetching settings for project ${project.id}:`, settingsError);
          }
          
          // Process settings into a more usable format
          const settings = project.settings || {};
          if (settingsData && settingsData.length > 0) {
            settingsData.forEach((setting) => {
              settings[setting.key] = setting.value;
            });
          }
          
          // Get deployment history
          const { data: deploymentHistory, error: deploymentError } = await supabase
            .from('deployment_history')
            .select('*')
            .eq('project_id', project.id)
            .order('created_at', { ascending: false });
          
          if (deploymentError) {
            console.error(`fetchProjectsFromDatabase: Error fetching deployment history for project ${project.id}:`, deploymentError);
          }
          
          // Get conversations
          const { data: conversations, error: conversationsError } = await supabase
            .from('conversations')
            .select('*')
            .eq('project_id', project.id)
            .order('updated_at', { ascending: false });
          
          if (conversationsError) {
            console.error(`fetchProjectsFromDatabase: Error fetching conversations for project ${project.id}:`, conversationsError);
          }
          
          // Return the project with all related data
          return {
            ...project,
            files: filesData || [],
            settings: settings,
            deployment_history: deploymentHistory || [],
            conversation_history: conversations || []
          };
        } catch (projectError) {
          console.error(`fetchProjectsFromDatabase: Error processing project ${project.id}:`, projectError);
          return {
            ...project,
            files: [],
            deployment_history: [],
            conversation_history: []
          };
        }
      })
    );
    
    console.log('fetchProjectsFromDatabase: Successfully fetched projects with all related data');
    return projectsWithData;
  } catch (error) {
    console.error('fetchProjectsFromDatabase: Error:', error);
    throw error;
  }
}

// Helper function to merge local and database projects
function mergeProjects(localProjects: ProjectContext[], dbProjects: ProjectContext[]): ProjectContext[] {
  // Create a map of database projects by ID for quick lookup
  const dbProjectMap = new Map(dbProjects.map(p => [p.id, p]));
  
  // Create a new array with merged projects
  const mergedProjects = localProjects.map(localProject => {
    // If the project exists in the database, use the database version
    // but keep any local-only data that might not be in the database
    const dbProject = dbProjectMap.get(localProject.id);
    if (dbProject) {
      // Remove this project from the map so we don't add it twice
      dbProjectMap.delete(localProject.id);
      
      // Merge the projects, preferring database data but keeping local-only fields
      return {
        ...localProject,
        ...dbProject,
        // Ensure we keep the most recent files
        files: mergeFiles(localProject.files, dbProject.files),
        // Ensure we keep the most recent settings
        settings: { ...localProject.settings, ...dbProject.settings },
        // Keep the most recent timestamp
        updated_at: new Date(Math.max(
          new Date(localProject.updated_at).getTime(),
          new Date(dbProject.updated_at).getTime()
        )).toISOString()
      };
    }
    
    // If the project doesn't exist in the database, keep the local version
    return localProject;
  });
  
  // Add any database projects that weren't in localStorage
  dbProjectMap.forEach(dbProject => {
    mergedProjects.push(dbProject);
  });
  
  return mergedProjects;
}

// Helper function to merge files from local and database projects
function mergeFiles(localFiles: ProjectFile[], dbFiles: ProjectFile[]): ProjectFile[] {
  // Create a map of database files by ID for quick lookup
  const dbFileMap = new Map(dbFiles.map(f => [f.id, f]));
  
  // Create a new array with merged files
  const mergedFiles = localFiles.map(localFile => {
    // If the file exists in the database, use the most recent version
    const dbFile = dbFileMap.get(localFile.id);
    if (dbFile) {
      // Remove this file from the map so we don't add it twice
      dbFileMap.delete(localFile.id);
      
      // Use the most recently updated file
      const localUpdatedAt = new Date(localFile.updated_at).getTime();
      const dbUpdatedAt = new Date(dbFile.updated_at).getTime();
      
      return localUpdatedAt > dbUpdatedAt ? localFile : dbFile;
    }
    
    // If the file doesn't exist in the database, keep the local version
    return localFile;
  });
  
  // Add any database files that weren't in the local files
  dbFileMap.forEach(dbFile => {
    mergedFiles.push(dbFile);
  });
  
  return mergedFiles;
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
  
  // Generate a unique project ID using UUID v4 instead of timestamp
  const projectId = uuidv4();
  const now = new Date().toISOString();
  
  // Create a basic manifest
  const manifest: ChromeManifest = {
    name: name,
    description: description,
    version: '1.0.0',
    manifest_version: 3,
    action: {
      default_popup: 'popup.html',
      default_title: name
    },
    permissions: [],
    host_permissions: []
  };
  
  // Create initial project files
  const files: ProjectFile[] = [
    {
      id: uuidv4(),
      name: 'manifest.json',
      path: 'manifest.json',
      content: JSON.stringify(manifest, null, 2),
      type: ProjectFileType.JSON,
      created_at: now,
      updated_at: now
    },
    {
      id: uuidv4(),
      name: 'popup.html',
      path: 'popup.html',
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
      type: ProjectFileType.HTML,
      created_at: now,
      updated_at: now
    },
    {
      id: uuidv4(),
      name: 'popup.css',
      path: 'popup.css',
      content: `body {
  width: 300px;
  padding: 10px;
  font-family: Arial, sans-serif;
}

h1 {
  color: #4285f4;
}`,
      type: ProjectFileType.CSS,
      created_at: now,
      updated_at: now
    },
    {
      id: uuidv4(),
      name: 'popup.js',
      path: 'popup.js',
      content: `document.addEventListener('DOMContentLoaded', function() {
  console.log('${name} extension loaded!');
});`,
      type: ProjectFileType.JAVASCRIPT,
      created_at: now,
      updated_at: now
    },
  ];
  
  try {
    // Create a direct server-side request to create the project
    const response = await fetch('/api/projects/direct-create/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        projectId,
        name,
        description,
        manifest,
        files
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('API error creating project:', errorData);
      throw new Error(errorData.message || 'Failed to create project');
    }
    
    const projectData = await response.json();
    console.log('Project created successfully:', projectData);
    
    // Return the project
    return {
      id: projectId,
      name,
      description,
      version: '1.0.0',
      manifest,
      files,
      settings: {
        theme: 'light',
        auto_save: true
      },
      created_at: now,
      updated_at: now,
      deployment_history: []
    };
  } catch (error) {
    console.error('Error creating project:', error);
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