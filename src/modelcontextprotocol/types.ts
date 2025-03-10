// Common interfaces and types for the Model Context Protocol

// Basic store interface implemented by storage providers
export interface ModelContextStore {
  get(key: string): Promise<any>;
  set(key: string, value: any): Promise<void>;
  delete(key: string): Promise<void>;
}

// Project context interface - represents a Chrome extension project
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

// User settings interface
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