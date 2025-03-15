import { ChromeManifest, ProjectFile } from '../modelcontextprotocol/types';

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
export interface ProjectContext {
  id: string;
  name: string;
  description: string;
  version: string;
  manifest: ChromeManifest;
  files: ProjectFile[];
  settings: {
    theme: string;
    auto_save: boolean;
    template_id?: string;
  };
  created_at: string;
  updated_at: string;
  deployment_history: any[];
  conversation_history?: any[];
  user_id?: string;
} 