// Message interface for conversation entries
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string | Date;
  metadata?: {
    tokens_used?: number;
    files_modified?: string[];
    [key: string]: any;
  };
} 