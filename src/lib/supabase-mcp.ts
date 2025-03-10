import { createClient } from '@supabase/supabase-js';
import { createMcpClient } from '@smithery/client';

// Create a Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Create a Model Context Protocol client
export const mcpClient = createMcpClient({
  baseUrl: '/api/mcp',
  fetch: globalThis.fetch,
});

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
    const result = await mcpClient.get<ProjectContext>(`project:${projectId}`);
    return result;
  } catch (error) {
    console.error('Error getting project:', error);
    return null;
  }
}

export async function saveProject(project: ProjectContext): Promise<boolean> {
  try {
    await mcpClient.set(`project:${project.id}`, project);
    return true;
  } catch (error) {
    console.error('Error saving project:', error);
    return false;
  }
}

export async function deleteProject(projectId: string): Promise<boolean> {
  try {
    await mcpClient.delete(`project:${projectId}`);
    return true;
  } catch (error) {
    console.error('Error deleting project:', error);
    return false;
  }
}

// Helper functions for working with user settings
export interface UserContext {
  id: string;
  username: string;
  email: string;
  created_at: string;
  last_login: string;
  preferences: {
    theme: 'light' | 'dark';
    api_keys?: Record<string, string>;
    editor_settings?: Record<string, any>;
    notifications?: Record<string, boolean>;
  };
  projects: string[];
}

export async function getUserSettings(userId: string): Promise<UserContext | null> {
  try {
    const result = await mcpClient.get<UserContext>(`user:${userId}`);
    return result;
  } catch (error) {
    console.error('Error getting user settings:', error);
    return null;
  }
}

export async function saveUserSettings(user: UserContext): Promise<boolean> {
  try {
    await mcpClient.set(`user:${user.id}`, user);
    return true;
  } catch (error) {
    console.error('Error saving user settings:', error);
    return false;
  }
}

// Helper functions for conversation history
export async function saveConversation(projectId: string, entry: ConversationEntry): Promise<boolean> {
  try {
    const project = await getProject(projectId);
    if (!project) return false;
    
    if (!project.conversation_history) {
      project.conversation_history = [];
    }
    
    project.conversation_history.push(entry);
    return await saveProject(project);
  } catch (error) {
    console.error('Error saving conversation entry:', error);
    return false;
  }
}

// Helper function for creating a new project
export function createNewProject(name: string, description: string): ProjectContext {
  const id = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  
  return {
    id,
    name,
    description,
    version: '0.1.0',
    created_at: timestamp,
    updated_at: timestamp,
    manifest: {
      manifest_version: 3,
      name,
      version: '0.1.0',
      description,
    },
    files: [],
    settings: {
      theme: 'dark',
      auto_save: true,
    },
    deployment_history: [],
  };
}