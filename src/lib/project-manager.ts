import axios from 'axios';

// Project interface
export interface Project {
  id: string;
  name: string;
  description?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  files?: any[];
  settings?: any;
  conversations?: Conversation[];
}

// Conversation interface
export interface Conversation {
  id: string;
  project_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages?: Message[];
}

// Message interface
export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

/**
 * ProjectManager class for handling all project-related operations
 */
export class ProjectManager {
  private static instance: ProjectManager;
  private projectCache: Map<string, Project> = new Map();
  private conversationCache: Map<string, Conversation> = new Map();
  private baseUrl: string;

  private constructor() {
    // Determine base URL based on environment
    this.baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3336';
    
    console.log(`[ProjectManager] Initialized with baseUrl: ${this.baseUrl}`);
  }

  /**
   * Get the singleton instance of ProjectManager
   */
  public static getInstance(): ProjectManager {
    if (!ProjectManager.instance) {
      ProjectManager.instance = new ProjectManager();
    }
    return ProjectManager.instance;
  }

  /**
   * Fetch a project by ID
   */
  public async getProject(projectId: string): Promise<Project | null> {
    try {
      console.log(`[ProjectManager] Fetching project: ${projectId}`);
      
      // Check cache first
      if (this.projectCache.has(projectId)) {
        console.log(`[ProjectManager] Project found in cache: ${projectId}`);
        return this.projectCache.get(projectId) || null;
      }
      
      // Fetch from API
      const response = await axios.get(`${this.baseUrl}/api/projects/direct-get-project`, {
        params: { projectId }
      });
      
      if (response.status === 200 && response.data.project) {
        console.log(`[ProjectManager] Project fetched successfully: ${projectId}`);
        const project = response.data.project;
        
        // Cache the project
        this.projectCache.set(projectId, project);
        
        return project;
      } else {
        console.error(`[ProjectManager] Failed to fetch project: ${projectId}`, response.data);
        return null;
      }
    } catch (error) {
      console.error(`[ProjectManager] Error fetching project: ${projectId}`, error);
      return null;
    }
  }

  /**
   * Fetch all projects for a user
   */
  public async getUserProjects(userId: string): Promise<Project[]> {
    try {
      console.log(`[ProjectManager] Fetching projects for user: ${userId}`);
      
      const response = await axios.get(`${this.baseUrl}/api/projects/list`, {
        params: { userId }
      });
      
      if (response.status === 200 && Array.isArray(response.data.projects)) {
        console.log(`[ProjectManager] Found ${response.data.projects.length} projects for user: ${userId}`);
        
        // Cache all projects
        response.data.projects.forEach((project: Project) => {
          this.projectCache.set(project.id, project);
        });
        
        return response.data.projects;
      } else {
        console.error(`[ProjectManager] Failed to fetch user projects: ${userId}`, response.data);
        return [];
      }
    } catch (error) {
      console.error(`[ProjectManager] Error fetching user projects: ${userId}`, error);
      return [];
    }
  }

  /**
   * Create a new conversation for a project
   */
  public async createConversation(projectId: string, title?: string): Promise<Conversation | null> {
    try {
      console.log(`[ProjectManager] Creating conversation for project: ${projectId}`);
      
      const response = await axios.post(`${this.baseUrl}/api/conversations/robust-create`, {
        projectId,
        title: title || 'New Conversation'
      });
      
      if (response.status === 201 && response.data.conversation) {
        console.log(`[ProjectManager] Conversation created successfully: ${response.data.conversation.id}`);
        const conversation = response.data.conversation;
        
        // Cache the conversation
        this.conversationCache.set(conversation.id, conversation);
        
        return conversation;
      } else {
        console.error(`[ProjectManager] Failed to create conversation for project: ${projectId}`, response.data);
        return null;
      }
    } catch (error) {
      console.error(`[ProjectManager] Error creating conversation for project: ${projectId}`, error);
      return null;
    }
  }

  /**
   * Fetch a conversation by ID
   */
  public async getConversation(conversationId: string): Promise<Conversation | null> {
    try {
      console.log(`[ProjectManager] Fetching conversation: ${conversationId}`);
      
      // Check cache first
      if (this.conversationCache.has(conversationId)) {
        console.log(`[ProjectManager] Conversation found in cache: ${conversationId}`);
        return this.conversationCache.get(conversationId) || null;
      }
      
      // Fetch from API
      const response = await axios.get(`${this.baseUrl}/api/conversations/robust-get`, {
        params: { conversationId }
      });
      
      if (response.status === 200 && response.data.conversation) {
        console.log(`[ProjectManager] Conversation fetched successfully: ${conversationId}`);
        const conversation = response.data.conversation;
        
        // Cache the conversation
        this.conversationCache.set(conversationId, conversation);
        
        return conversation;
      } else {
        console.error(`[ProjectManager] Failed to fetch conversation: ${conversationId}`, response.data);
        return null;
      }
    } catch (error) {
      console.error(`[ProjectManager] Error fetching conversation: ${conversationId}`, error);
      return null;
    }
  }

  /**
   * Update a conversation
   */
  public async updateConversation(conversationId: string, updates: Partial<Conversation>): Promise<Conversation | null> {
    try {
      console.log(`[ProjectManager] Updating conversation: ${conversationId}`);
      
      const response = await axios.put(`${this.baseUrl}/api/conversations/update`, {
        conversationId,
        ...updates
      });
      
      if (response.status === 200 && response.data.conversation) {
        console.log(`[ProjectManager] Conversation updated successfully: ${conversationId}`);
        const conversation = response.data.conversation;
        
        // Update cache
        this.conversationCache.set(conversationId, conversation);
        
        return conversation;
      } else {
        console.error(`[ProjectManager] Failed to update conversation: ${conversationId}`, response.data);
        return null;
      }
    } catch (error) {
      console.error(`[ProjectManager] Error updating conversation: ${conversationId}`, error);
      return null;
    }
  }

  /**
   * Fetch all conversations for a project
   */
  public async getProjectConversations(projectId: string): Promise<Conversation[]> {
    try {
      console.log(`[ProjectManager] Fetching conversations for project: ${projectId}`);
      
      const response = await axios.get(`${this.baseUrl}/api/conversations/robust-list`, {
        params: { projectId }
      });
      
      if (response.status === 200 && Array.isArray(response.data.conversations)) {
        console.log(`[ProjectManager] Found ${response.data.conversations.length} conversations for project: ${projectId}`);
        
        // Cache all conversations
        response.data.conversations.forEach((conversation: Conversation) => {
          this.conversationCache.set(conversation.id, conversation);
        });
        
        return response.data.conversations;
      } else {
        console.error(`[ProjectManager] Failed to fetch project conversations: ${projectId}`, response.data);
        return [];
      }
    } catch (error) {
      console.error(`[ProjectManager] Error fetching project conversations: ${projectId}`, error);
      return [];
    }
  }

  /**
   * Add a message to a conversation
   */
  public async addMessageToConversation(
    conversationId: string, 
    content: string, 
    role: 'user' | 'assistant' | 'system' = 'user'
  ): Promise<Message | null> {
    try {
      console.log(`[ProjectManager] Adding message to conversation: ${conversationId}`);
      
      const response = await axios.post(`${this.baseUrl}/api/conversations/robust-add-message`, {
        conversationId,
        content,
        role
      });
      
      if (response.status === 201 && response.data.message) {
        console.log(`[ProjectManager] Message added successfully to conversation: ${conversationId}`);
        
        // Update conversation cache if it exists
        if (this.conversationCache.has(conversationId)) {
          const conversation = this.conversationCache.get(conversationId);
          if (conversation) {
            conversation.messages = [...(conversation.messages || []), response.data.message];
            this.conversationCache.set(conversationId, conversation);
          }
        }
        
        return response.data.message;
      } else {
        console.error(`[ProjectManager] Failed to add message to conversation: ${conversationId}`, response.data);
        return null;
      }
    } catch (error) {
      console.error(`[ProjectManager] Error adding message to conversation: ${conversationId}`, error);
      return null;
    }
  }

  /**
   * Generate a title for a conversation based on its first message
   */
  public async generateTitle(conversationId: string): Promise<string | null> {
    try {
      console.log(`[ProjectManager] Generating title for conversation: ${conversationId}`);
      
      const response = await axios.post(`${this.baseUrl}/api/conversations/generate-title`, {
        conversationId
      });
      
      if (response.status === 200 && response.data.title) {
        console.log(`[ProjectManager] Title generated successfully for conversation: ${conversationId}`);
        
        // Update conversation cache if it exists
        if (this.conversationCache.has(conversationId)) {
          const conversation = this.conversationCache.get(conversationId);
          if (conversation) {
            conversation.title = response.data.title;
            this.conversationCache.set(conversationId, conversation);
          }
        }
        
        return response.data.title;
      } else {
        console.error(`[ProjectManager] Failed to generate title for conversation: ${conversationId}`, response.data);
        return null;
      }
    } catch (error) {
      console.error(`[ProjectManager] Error generating title for conversation: ${conversationId}`, error);
      return null;
    }
  }

  /**
   * Clear the cache
   */
  public clearCache(): void {
    console.log(`[ProjectManager] Clearing cache`);
    this.projectCache.clear();
    this.conversationCache.clear();
  }
} 