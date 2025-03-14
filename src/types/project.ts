// File types in a Chrome extension project
export enum ProjectFileType {
  HTML = 'html',
  CSS = 'css',
  JAVASCRIPT = 'javascript',
  JSON = 'json',
  IMAGE = 'image',
  OTHER = 'other'
}

// Project interface
export interface Project {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  settings?: Record<string, any>;
  metadata?: Record<string, any>;
}

// Project context with additional data
export interface ProjectContext extends Project {
  files: {
    id: string;
    name: string;
    path: string;
    type: ProjectFileType;
    content: string;
    created_at: string;
    updated_at: string;
    metadata?: Record<string, any>;
  }[];
  conversation_history: {
    id: string;
    timestamp: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    tokens_used?: number;
    files_modified?: string[];
  }[];
  version?: string;
  manifest?: Record<string, any>;
  deployment_history?: {
    id: string;
    timestamp: string;
    version: string;
    status: string;
    url?: string;
    metadata?: Record<string, any>;
  }[];
} 