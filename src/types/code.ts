import { ProjectFileType } from './project';

// CodeFile interface for generated code files
export interface CodeFile {
  id: string;
  name: string;
  path: string;
  content: string;
  type: ProjectFileType;
  language?: string;
  created_at?: string;
  updated_at?: string;
  metadata?: Record<string, any>;
} 